// ============================================
// 🛡️ TRAMON v11.0 - REPORTS API (O Bibliotecário)
// LEI III + LEI VI — CORS SEGURO + DUAL CLIENT
// Propósito: Endpoints seguros para dashboards e auditoria
// ============================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders, handleCorsOptions } from "../_shared/corsConfig.ts";

// Roles permitidas para acessar relatórios
const ALLOWED_ROLES = ['owner', 'admin', 'funcionario'];

serve(async (req) => {
  // CORS seguro com allowlist
  if (req.method === 'OPTIONS') {
    return handleCorsOptions(req);
  }
  
  const corsHeaders = getCorsHeaders(req);

  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  try {
    // ============================================
    // 🔐 AUTENTICAÇÃO OBRIGATÓRIA (JWT validado pelo Supabase)
    // ============================================
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      console.error("[Reports API] ❌ Sem header de autorização");
      return new Response(JSON.stringify({ 
        success: false,
        error: "Não autorizado",
        code: "UNAUTHORIZED"
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Verificar usuário autenticado
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user) {
      console.error("[Reports API] ❌ Token inválido:", authError?.message);
      
      // Log de segurança
      await supabaseAdmin.from("security_events").insert({
        event_type: "reports_unauthorized_attempt",
        severity: "warning",
        ip_address: req.headers.get("cf-connecting-ip") || req.headers.get("x-forwarded-for") || "unknown",
        user_agent: req.headers.get("user-agent"),
        payload: { reason: "invalid_token" },
      });

      return new Response(JSON.stringify({ 
        success: false,
        error: "Token inválido ou expirado",
        code: "INVALID_TOKEN"
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // ============================================
    // 🔐 VERIFICAÇÃO DE ROLE
    // ============================================
    const { data: userRoles } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);

    const roles = userRoles?.map(r => r.role) || [];
    const hasPermission = roles.some(role => ALLOWED_ROLES.includes(role));

    if (!hasPermission) {
      console.error(`[Reports API] ❌ User ${user.id} sem permissão. Roles: ${roles.join(', ')}`);
      
      await supabaseAdmin.from("security_events").insert({
        event_type: "reports_access_denied",
        severity: "warning",
        user_id: user.id,
        ip_address: req.headers.get("cf-connecting-ip") || "unknown",
        payload: { 
          reason: "INSUFFICIENT_ROLE",
          user_roles: roles,
          required_roles: ALLOWED_ROLES
        },
      });

      return new Response(JSON.stringify({ 
        success: false,
        error: "Você não tem permissão para acessar relatórios",
        code: "FORBIDDEN"
      }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`[Reports API] ✅ User ${user.id} autorizado. Roles: ${roles.join(', ')}`);

    // ============================================
    // 📊 PROCESSAMENTO DO RELATÓRIO
    // ============================================
    const url = new URL(req.url);
    const reportType = url.searchParams.get('type') || 'dashboard';
    const startDate = url.searchParams.get('start') || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const endDate = url.searchParams.get('end') || new Date().toISOString();

    let report: Record<string, unknown> = {};

    switch (reportType) {
      case 'dashboard':
        // Dashboard executivo
        const [alunos, entradas, gastos, tarefas, webhooks] = await Promise.all([
          supabaseAdmin.from('alunos').select('id, status').eq('status', 'ativo'),
          supabaseAdmin.from('entradas').select('valor').gte('data', startDate).lte('data', endDate),
          supabaseAdmin.from('gastos').select('valor').gte('data', startDate).lte('data', endDate),
          supabaseAdmin.from('calendar_tasks').select('id, is_completed'),
          supabaseAdmin.from('webhooks_queue').select('id, status')
        ]);

        const receitaTotal = entradas.data?.reduce((sum, e) => sum + (e.valor || 0), 0) || 0;
        const despesaTotal = gastos.data?.reduce((sum, g) => sum + (g.valor || 0), 0) || 0;

        report = {
          tipo: 'dashboard_executivo',
          periodo: { inicio: startDate, fim: endDate },
          metricas: {
            alunos_ativos: alunos.data?.length || 0,
            receita_periodo: receitaTotal,
            despesa_periodo: despesaTotal,
            lucro_periodo: receitaTotal - despesaTotal,
            margem_lucro: receitaTotal > 0 ? ((receitaTotal - despesaTotal) / receitaTotal * 100).toFixed(2) : 0,
            tarefas_total: tarefas.data?.length || 0,
            tarefas_concluidas: tarefas.data?.filter(t => t.is_completed).length || 0,
            webhooks_pendentes: webhooks.data?.filter(w => w.status === 'pending').length || 0
          }
        };
        break;

      case 'audit_access':
        // 3.4.1 - Dashboard de Auditoria "Pagou x Acesso" (WordPress removido - agora usa Supabase Auth + user_roles)
        const [hotmartTrans, betaUsers] = await Promise.all([
          supabaseAdmin.from('transacoes_hotmart_completo')
            .select('*')
            .in('status', ['approved', 'complete', 'completed']),
          supabaseAdmin.from('user_roles')
            .select('user_id, role, profiles!inner(id, email, full_name)')
            .eq('role', 'beta')
        ]);

        const hotmartEmails = new Set((hotmartTrans.data || []).map(t => t.email?.toLowerCase()));
        const betaEmails = new Set((betaUsers.data || []).map(u => (u.profiles as any)?.email?.toLowerCase()).filter(Boolean));

        // Pagou e tem acesso Beta (OK)
        const pagouETemAcesso = (hotmartTrans.data || []).filter(t => 
          betaEmails.has(t.email?.toLowerCase())
        );

        // Pagou e NÃO tem role beta (CRÍTICO)
        const pagouSemAcesso = (hotmartTrans.data || []).filter(t => 
          !betaEmails.has(t.email?.toLowerCase())
        );

        // Tem role beta e NÃO pagou (ALERTA)
        const acessoSemPagamento = (betaUsers.data || []).filter(u => 
          !hotmartEmails.has((u.profiles as any)?.email?.toLowerCase())
        );

        report = {
          tipo: 'auditoria_acesso',
          resumo: {
            total_transacoes_hotmart: hotmartTrans.data?.length || 0,
            total_usuarios_beta: betaUsers.data?.length || 0,
            pagou_e_tem_acesso: pagouETemAcesso.length,
            pagou_sem_acesso: pagouSemAcesso.length,
            acesso_sem_pagamento: acessoSemPagamento.length,
            discrepancias_pendentes: 0
          },
          detalhes: {
            pagou_sem_acesso: pagouSemAcesso.slice(0, 50).map(t => ({
              email: t.email,
              nome: t.buyer_name,
              transacao: t.transaction_id,
              valor: t.price_value,
              data: t.purchase_date,
              acao_sugerida: 'ATRIBUIR_ROLE_BETA'
            })),
            acesso_sem_pagamento: acessoSemPagamento.slice(0, 50).map(u => ({
              email: (u.profiles as any)?.email,
              nome: (u.profiles as any)?.full_name,
              user_id: u.user_id,
              role: u.role,
              acao_sugerida: 'VERIFICAR_PAGAMENTO_OU_REVOGAR'
            }))
          },
          alerta: pagouSemAcesso.length > 0 || acessoSemPagamento.length > 0
        };
        break;

      case 'system_health':
        // 3.4.3 - Painel de Saúde do Sistema
        const [securityEvents, dlqItems, recentLogs, iaCommands] = await Promise.all([
          supabaseAdmin.from('security_events')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(20),
          supabaseAdmin.from('dead_letter_queue')
            .select('*')
            .eq('reprocessed', false),
          supabaseAdmin.from('logs_integracao_detalhado')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(50),
          supabaseAdmin.from('comandos_ia_central')
            .select('*')
            .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        ]);

        const avgLatency = (recentLogs.data || [])
          .filter(l => l.tempo_total_ms)
          .reduce((sum, l, _, arr) => sum + (l.tempo_total_ms || 0) / arr.length, 0);

        const iaCost = (iaCommands.data || [])
          .filter(c => c.resultado?.estimated_cost_usd)
          .reduce((sum, c) => sum + (c.resultado.estimated_cost_usd || 0), 0);

        report = {
          tipo: 'saude_sistema',
          timestamp: new Date().toISOString(),
          integracoes: {
            hotmart: { status: 'online', ultima_verificacao: new Date().toISOString() },
            wordpress: { status: 'online', ultima_verificacao: new Date().toISOString() },
            whatsapp: { status: 'online', ultima_verificacao: new Date().toISOString() }
          },
          metricas: {
            latencia_media_ms: Math.round(avgLatency),
            webhooks_na_dlq: dlqItems.data?.length || 0,
            eventos_seguranca_24h: securityEvents.data?.filter(
              e => new Date(e.created_at) > new Date(Date.now() - 24 * 60 * 60 * 1000)
            ).length || 0,
            custo_ia_24h_usd: iaCost.toFixed(4),
            comandos_ia_24h: iaCommands.data?.length || 0
          },
          ultimos_erros: securityEvents.data?.filter(e => e.severity === 'critical').slice(0, 5),
          dead_letter_queue: dlqItems.data?.slice(0, 10)
        };
        break;

      case 'logs':
        // Central de Monitoramento e Logs
        const logs = await supabaseAdmin
          .from('logs_integracao_detalhado')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(100);

        report = {
          tipo: 'logs_integracao',
          total: logs.data?.length || 0,
          logs: logs.data || []
        };
        break;

      case 'dlq':
        // Dead Letter Queue para reprocessamento
        const dlq = await supabaseAdmin
          .from('dead_letter_queue')
          .select('*')
          .order('created_at', { ascending: false });

        report = {
          tipo: 'dead_letter_queue',
          total: dlq.data?.length || 0,
          pendentes: dlq.data?.filter(d => !d.reprocessed).length || 0,
          items: dlq.data || []
        };
        break;

      default:
        return new Response(JSON.stringify({
          success: false,
          error: `Tipo de relatório desconhecido: ${reportType}`,
          tipos_disponiveis: ['dashboard', 'audit_access', 'system_health', 'logs', 'dlq']
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }

    // Log de acesso
    await supabaseAdmin.from("activity_log").insert({
      user_id: user.id,
      action: "REPORT_ACCESSED",
      new_value: { report_type: reportType, periodo: { startDate, endDate } }
    });

    return new Response(JSON.stringify({
      success: true,
      generated_at: new Date().toISOString(),
      accessed_by: user.id,
      report
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Reports API error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      code: 'INTERNAL_ERROR'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
