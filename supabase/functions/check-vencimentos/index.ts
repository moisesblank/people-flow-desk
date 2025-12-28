// ============================================
// EDGE FUNCTION: Verificar Vencimentos e Notificar Owner
// Verifica gastos vencidos/vencendo e envia email ao owner
// ============================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

import { getCorsHeaders, handleCorsOptions } from "../_shared/corsConfig.ts";

const OWNER_EMAIL = 'moisesblank@gmail.com';

interface VencimentoItem {
  id: number;
  nome: string;
  valor: number;
  data_vencimento: string;
  tipo: 'fixo' | 'extra';
  status: string;
  dias_ate_vencimento: number;
}

serve(async (req) => {
  // LEI VI: CORS dinâmico via allowlist
  const corsHeaders = getCorsHeaders(req);
  
  if (req.method === 'OPTIONS') {
    return handleCorsOptions(req);
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    // ============================================
    // 🔒 IDEMPOTÊNCIA (INCIDENTE: EMAIL LOOP)
    // Regra-mãe: ONE_VENCIMENTO_EQUALS_ONE_EMAIL_FOREVER
    // Implementação: cada item gera uma chave estável (tipo:id)
    // e só é notificado uma única vez para o destinatário.
    // Fonte: tabela public.vencimentos_notificacoes (itens_ids TEXT[])
    // ============================================

    const makeItemKey = (tipo: 'fixo' | 'extra', id: number) => `${tipo}:${id}`;

    // Buscar histórico de itens já notificados (sucesso=true)
    const { data: notifRows, error: notifError } = await supabase
      .from('vencimentos_notificacoes')
      .select('itens_ids')
      .eq('enviado_para', OWNER_EMAIL)
      .eq('tipo_notificacao', 'email')
      .eq('sucesso', true)
      .limit(1000);

    if (notifError) {
      console.error('[Check Vencimentos] ⚠️ Falha ao ler idempotência (vencimentos_notificacoes):', notifError);
      // Fail-safe: se não conseguimos checar idempotência, BLOQUEAR envio para evitar loop.
      return new Response(JSON.stringify({
        success: false,
        blocked: true,
        reason: 'IDEMPOTENCY_READ_FAILED',
      }), {
        status: 503,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    const alreadyNotified = new Set<string>();
    for (const row of (notifRows || [])) {
      const ids = Array.isArray(row.itens_ids) ? row.itens_ids : [];
      for (const k of ids) {
        if (typeof k === 'string' && k.length > 0) alreadyNotified.add(k);
      }
    }

    // Buscar gastos fixos com vencimento hoje ou atrasados e pendentes
    const { data: gastosFixosVencidos, error: errorFixos } = await supabase
      .from('company_fixed_expenses')
      .select('*')
      .lte('data_vencimento', todayStr)
      .neq('status_pagamento', 'pago')
      .order('data_vencimento', { ascending: true });

    // Buscar gastos extras com vencimento hoje ou atrasados e pendentes
    const { data: gastosExtrasVencidos, error: errorExtras } = await supabase
      .from('company_extra_expenses')
      .select('*')
      .lte('data_vencimento', todayStr)
      .neq('status_pagamento', 'pago')
      .order('data_vencimento', { ascending: true });

    if (errorFixos || errorExtras) {
      throw new Error(`Erro ao buscar gastos: ${errorFixos?.message || errorExtras?.message}`);
    }

    // Combinar e formatar (somente itens AINDA NÃO NOTIFICADOS)
    const vencidos: VencimentoItem[] = [];

    for (const gasto of (gastosFixosVencidos || [])) {
      const itemKey = makeItemKey('fixo', gasto.id);
      if (alreadyNotified.has(itemKey)) continue;

      const dataVenc = new Date(gasto.data_vencimento);
      const diasAte = Math.floor((dataVenc.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      vencidos.push({
        id: gasto.id,
        nome: gasto.nome,
        valor: gasto.valor,
        data_vencimento: gasto.data_vencimento,
        tipo: 'fixo',
        status: gasto.status_pagamento || 'pendente',
        dias_ate_vencimento: diasAte,
      });
    }

    for (const gasto of (gastosExtrasVencidos || [])) {
      const itemKey = makeItemKey('extra', gasto.id);
      if (alreadyNotified.has(itemKey)) continue;

      const dataVenc = new Date(gasto.data_vencimento);
      const diasAte = Math.floor((dataVenc.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      vencidos.push({
        id: gasto.id,
        nome: gasto.nome,
        valor: gasto.valor,
        data_vencimento: gasto.data_vencimento,
        tipo: 'extra',
        status: gasto.status_pagamento || 'pendente',
        dias_ate_vencimento: diasAte,
      });
    }

    // Ordenar por mais atrasado primeiro
    vencidos.sort((a, b) => a.dias_ate_vencimento - b.dias_ate_vencimento);

    console.log(`[Check Vencimentos] Encontrados ${vencidos.length} NOVOS itens vencidos/vencendo (idempotência ativa)`);

    // Se NÃO há novos gastos vencidos, não envia e-mail.
    if (vencidos.length === 0) {
      return new Response(JSON.stringify({
        success: true,
        skipped: true,
        reason: 'NO_NEW_ITEMS_TO_NOTIFY',
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // Se há gastos vencidos, enviar email ao owner
    const totalVencido = vencidos.reduce((sum, v) => sum + v.valor, 0);
    const vencidosHoje = vencidos.filter(v => v.dias_ate_vencimento === 0);
    const atrasados = vencidos.filter(v => v.dias_ate_vencimento < 0);

    // Formatar valor
    const formatCurrency = (cents: number) => {
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      }).format(cents / 100);
    };

    // Construir HTML do email
    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #0a0a0f; color: #fff; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 16px; padding: 30px; }
    .header { text-align: center; margin-bottom: 30px; }
    .header h1 { color: #EC4899; margin: 0; font-size: 28px; }
    .header p { color: #8B5CF6; margin: 5px 0 0 0; }
    .alert-box { background: rgba(239, 68, 68, 0.2); border: 1px solid rgba(239, 68, 68, 0.5); border-radius: 12px; padding: 20px; margin: 20px 0; }
    .alert-box h2 { color: #ef4444; margin: 0 0 10px 0; font-size: 20px; }
    .stat-row { display: flex; justify-content: space-between; padding: 15px 0; border-bottom: 1px solid rgba(255,255,255,0.1); }
    .stat-label { color: #94a3b8; }
    .stat-value { color: #fff; font-weight: bold; font-size: 18px; }
    .total-value { color: #EC4899; }
    .item-list { margin: 20px 0; }
    .item { background: rgba(255,255,255,0.05); border-radius: 8px; padding: 15px; margin: 10px 0; display: flex; justify-content: space-between; align-items: center; }
    .item-info h3 { margin: 0; color: #fff; font-size: 16px; }
    .item-info p { margin: 5px 0 0 0; color: #94a3b8; font-size: 12px; }
    .item-value { color: #EC4899; font-weight: bold; font-size: 18px; }
    .badge { display: inline-block; padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: bold; }
    .badge-atrasado { background: rgba(239, 68, 68, 0.3); color: #ef4444; }
    .badge-hoje { background: rgba(234, 179, 8, 0.3); color: #eab308; }
    .footer { text-align: center; margin-top: 30px; color: #64748b; font-size: 12px; }
    .cta-button { display: inline-block; background: linear-gradient(135deg, #EC4899 0%, #8B5CF6 100%); color: #fff; padding: 15px 30px; border-radius: 10px; text-decoration: none; font-weight: bold; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>⚠️ ALERTA DE VENCIMENTOS</h1>
      <p>Sistema de Gestão Moisés Medeiros</p>
    </div>

    <div class="alert-box">
      <h2>🔔 Atenção! Você tem gastos que precisam de pagamento:</h2>

      <div class="stat-row">
        <span class="stat-label">Novos gastos pendentes:</span>
        <span class="stat-value">${vencidos.length}</span>
      </div>

      <div class="stat-row">
        <span class="stat-label">Valor total (novos):</span>
        <span class="stat-value total-value">${formatCurrency(totalVencido)}</span>
      </div>

      ${atrasados.length > 0 ? `
      <div class="stat-row">
        <span class="stat-label">🚨 Atrasados:</span>
        <span class="stat-value" style="color: #ef4444;">${atrasados.length} itens</span>
      </div>
      ` : ''}

      ${vencidosHoje.length > 0 ? `
      <div class="stat-row">
        <span class="stat-label">📅 Vencem hoje:</span>
        <span class="stat-value" style="color: #eab308;">${vencidosHoje.length} itens</span>
      </div>
      ` : ''}
    </div>

    <div class="item-list">
      <h3 style="color: #fff; margin-bottom: 15px;">📋 Detalhamento (novos):</h3>
      ${vencidos.slice(0, 10).map(item => `
      <div class="item">
        <div class="item-info">
          <h3>${item.nome}</h3>
          <p>
            ${item.tipo === 'fixo' ? '🏢 Gasto Fixo' : '📝 Gasto Extra'} •
            Vencimento: ${new Date(item.data_vencimento).toLocaleDateString('pt-BR')}
            ${item.dias_ate_vencimento < 0 ? `<span class="badge badge-atrasado">${Math.abs(item.dias_ate_vencimento)} dias atrasado</span>` : ''}
            ${item.dias_ate_vencimento === 0 ? `<span class="badge badge-hoje">VENCE HOJE</span>` : ''}
          </p>
        </div>
        <span class="item-value">${formatCurrency(item.valor)}</span>
      </div>
      `).join('')}
      ${vencidos.length > 10 ? `<p style="text-align: center; color: #94a3b8;">+ ${vencidos.length - 10} outros itens...</p>` : ''}
    </div>

    <div style="text-align: center;">
      <a href="https://pro.moisesmedeiros.com.br/gestaofc/financas-empresa" class="cta-button">
        💰 Acessar Central Financeira
      </a>
    </div>

    <div class="footer">
      <p>Este é um email automático do sistema de gestão.</p>
      <p>Moisés Medeiros • SYNAPSE v15.0</p>
      <p>${new Date().toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
    </div>
  </div>
</body>
</html>
    `;

    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');

    // Preparar registro idempotente ANTES do envio (trava pós-disparo)
    const itensKeys = vencidos.map(v => makeItemKey(v.tipo, v.id));

    if (RESEND_API_KEY) {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: Deno.env.get("RESEND_FROM") || 'Sistema Moisés Medeiros <falecom@moisesmedeiros.com.br>',
          to: [OWNER_EMAIL],
          subject: `⚠️ ALERTA: ${vencidos.length} novos gastos pendentes - ${formatCurrency(totalVencido)} total`,
          html: emailHtml,
        }),
      });

      if (response.ok) {
        console.log('[Check Vencimentos] ✅ Email de alerta enviado ao owner (idempotente)');

        // Registrar idempotência + auditoria (sucesso=true)
        await supabase.from('vencimentos_notificacoes').insert({
          data_notificacao: todayStr,
          tipo_notificacao: 'email',
          total_itens: vencidos.length,
          valor_total: totalVencido,
          itens_ids: itensKeys,
          enviado_para: OWNER_EMAIL,
          sucesso: true,
        });

        // Registrar log (legado)
        await supabase.from('activity_log').insert({
          action: 'vencimento_email_enviado',
          table_name: 'vencimentos',
          user_email: OWNER_EMAIL,
          new_value: {
            total_vencidos: vencidos.length,
            valor_total: totalVencido,
            atrasados: atrasados.length,
            vencendo_hoje: vencidosHoje.length,
            itens_ids: itensKeys,
          },
        });
      } else {
        const errorText = await response.text();
        console.error('[Check Vencimentos] ❌ Erro ao enviar email:', errorText);

        // Registrar tentativa falha (sucesso=false)
        await supabase.from('vencimentos_notificacoes').insert({
          data_notificacao: todayStr,
          tipo_notificacao: 'email',
          total_itens: vencidos.length,
          valor_total: totalVencido,
          itens_ids: itensKeys,
          enviado_para: OWNER_EMAIL,
          sucesso: false,
          erro: errorText?.slice(0, 5000),
        });
      }
    } else {
      console.error('[Check Vencimentos] ❌ RESEND_API_KEY não configurada');

      // Sem provedor: registrar falha (para bloquear loop cego)
      await supabase.from('vencimentos_notificacoes').insert({
        data_notificacao: todayStr,
        tipo_notificacao: 'email',
        total_itens: vencidos.length,
        valor_total: totalVencido,
        itens_ids: itensKeys,
        enviado_para: OWNER_EMAIL,
        sucesso: false,
        erro: 'RESEND_API_KEY_NOT_CONFIGURED',
      });
    }

    // Atualizar status dos atrasados
    for (const item of atrasados) {
      if (item.tipo === 'fixo') {
        await supabase
          .from('company_fixed_expenses')
          .update({ status_pagamento: 'atrasado' })
          .eq('id', item.id);
      } else {
        await supabase
          .from('company_extra_expenses')
          .update({ status_pagamento: 'atrasado' })
          .eq('id', item.id);
      }
    }

    return new Response(JSON.stringify({
      success: true,
      vencidos: vencidos.length,
      total: vencidos.reduce((sum, v) => sum + v.valor, 0),
      detalhes: vencidos,
      idempotency: {
        notified_keys_count: itensKeys.length,
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Check Vencimentos] Error:', errorMessage);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
});

