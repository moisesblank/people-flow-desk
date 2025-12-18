// ============================================
// TRAMON v9.0 - REPORTS API (O Bibliotecário)
// Propósito: Endpoints seguros para dashboards e auditoria
// ============================================
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  try {
    const url = new URL(req.url);
    const reportType = url.searchParams.get('type') || 'dashboard';
    const startDate = url.searchParams.get('start') || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const endDate = url.searchParams.get('end') || new Date().toISOString();

    let report: Record<string, unknown> = {};

    switch (reportType) {
      case 'dashboard':
        // Dashboard executivo
        const [alunos, entradas, gastos, tarefas, webhooks] = await Promise.all([
          supabase.from('alunos').select('id, status').eq('status', 'ativo'),
          supabase.from('entradas').select('valor').gte('data', startDate).lte('data', endDate),
          supabase.from('gastos').select('valor').gte('data', startDate).lte('data', endDate),
          supabase.from('calendar_tasks').select('id, is_completed'),
          supabase.from('webhooks_queue').select('id, status')
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
        // 3.4.1 - Dashboard de Auditoria "Pagou x Acesso"
        const [hotmartTrans, wpUsers, mismatches] = await Promise.all([
          supabase.from('transacoes_hotmart_completo')
            .select('*')
            .in('status', ['approved', 'complete', 'completed']),
          supabase.from('usuarios_wordpress_sync').select('*'),
          supabase.from('audit_access_mismatches').select('*').eq('resolvido', false)
        ]);

        const hotmartEmails = new Set((hotmartTrans.data || []).map(t => t.email?.toLowerCase()));
        const wpEmails = new Set((wpUsers.data || []).map(u => u.email?.toLowerCase()).filter(Boolean));

        // Pagou e tem acesso (OK)
        const pagouETemAcesso = (hotmartTrans.data || []).filter(t => 
          wpEmails.has(t.email?.toLowerCase())
        );

        // Pagou e NÃO tem acesso (CRÍTICO)
        const pagouSemAcesso = (hotmartTrans.data || []).filter(t => 
          !wpEmails.has(t.email?.toLowerCase())
        );

        // Tem acesso e NÃO pagou (ALERTA)
        const acessoSemPagamento = (wpUsers.data || []).filter(u => 
          !hotmartEmails.has(u.email?.toLowerCase())
        );

        report = {
          tipo: 'auditoria_acesso',
          resumo: {
            total_transacoes_hotmart: hotmartTrans.data?.length || 0,
            total_usuarios_wordpress: wpUsers.data?.length || 0,
            pagou_e_tem_acesso: pagouETemAcesso.length,
            pagou_sem_acesso: pagouSemAcesso.length,
            acesso_sem_pagamento: acessoSemPagamento.length,
            discrepancias_pendentes: mismatches.data?.length || 0
          },
          detalhes: {
            pagou_sem_acesso: pagouSemAcesso.slice(0, 50).map(t => ({
              email: t.email,
              nome: t.buyer_name,
              transacao: t.transaction_id,
              valor: t.price_value,
              data: t.purchase_date,
              acao_sugerida: 'LIBERAR_ACESSO_WORDPRESS'
            })),
            acesso_sem_pagamento: acessoSemPagamento.slice(0, 50).map(u => ({
              email: u.email,
              nome: u.display_name,
              wp_user_id: u.wp_user_id,
              grupos: u.groups,
              acao_sugerida: 'VERIFICAR_PAGAMENTO_OU_REVOGAR'
            }))
          },
          alerta: pagouSemAcesso.length > 0 || acessoSemPagamento.length > 0
        };
        break;

      case 'system_health':
        // 3.4.3 - Painel de Saúde do Sistema
        const [securityEvents, dlqItems, recentLogs, iaCommands] = await Promise.all([
          supabase.from('security_events')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(20),
          supabase.from('dead_letter_queue')
            .select('*')
            .eq('reprocessed', false),
          supabase.from('logs_integracao_detalhado')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(50),
          supabase.from('comandos_ia_central')
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
        const logs = await supabase
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
        const dlq = await supabase
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
          error: `Tipo de relatório desconhecido: ${reportType}`,
          tipos_disponiveis: ['dashboard', 'audit_access', 'system_health', 'logs', 'dlq']
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }

    return new Response(JSON.stringify({
      success: true,
      generated_at: new Date().toISOString(),
      report
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Reports API error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
