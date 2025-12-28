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

    // ============================================
    // TEMPLATE PADRÃO DA PLATAFORMA (PADRONIZADO v10.x)
    // ============================================
    const detalhamentoHtml = vencidos.slice(0, 10).map(item => `
      <div style="background:#1a1a1f;border-radius:8px;padding:12px;margin:8px 0;display:flex;justify-content:space-between;align-items:center;">
        <div>
          <p style="margin:0;color:#ffffff;font-weight:bold;">${item.nome}</p>
          <p style="margin:4px 0 0;color:#9aa0a6;font-size:12px;">
            ${item.tipo === 'fixo' ? '🏢 Gasto Fixo' : '📝 Gasto Extra'} • Venc: ${new Date(item.data_vencimento).toLocaleDateString('pt-BR')}
            ${item.dias_ate_vencimento < 0 ? `<span style="background:rgba(239,68,68,0.3);color:#ef4444;padding:2px 8px;border-radius:10px;font-size:10px;margin-left:8px;">${Math.abs(item.dias_ate_vencimento)} dias atrasado</span>` : ''}
            ${item.dias_ate_vencimento === 0 ? `<span style="background:rgba(234,179,8,0.3);color:#eab308;padding:2px 8px;border-radius:10px;font-size:10px;margin-left:8px;">VENCE HOJE</span>` : ''}
          </p>
        </div>
        <span style="color:#E62B4A;font-weight:bold;font-size:16px;">${formatCurrency(item.valor)}</span>
      </div>
    `).join('');

    const emailHtml = `
<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /></head>
<body style="margin:0;padding:0;background:#0a0a0f;color:#ffffff;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#0a0a0f;">
    <tr>
      <td align="center" style="padding:24px;">
        <table role="presentation" width="100%" style="max-width:640px;" cellspacing="0" cellpadding="0">
          <tr>
            <td style="background:linear-gradient(180deg,#131318 0%,#0a0a0f 100%);border-radius:16px;padding:28px;border:1px solid #7D1128;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr><td align="center" style="padding-bottom:20px;">
                  <h1 style="margin:0;color:#E62B4A;font-size:24px;font-weight:700;">Curso Moisés Medeiros</h1>
                  <p style="margin:8px 0 0;color:#9aa0a6;font-size:13px;">⚠️ Alerta de Vencimentos</p>
                </td></tr>
              </table>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr><td style="color:#e6e6e6;line-height:1.7;font-size:14px;">
                  <h2 style="margin:0 0 16px;font-size:18px;color:#ffffff;">🔔 Atenção! Gastos pendentes de pagamento</h2>
                  
                  <div style="background:#1a1a1f;border-radius:8px;padding:16px;margin:16px 0;">
                    <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #2a2a2f;">
                      <span style="color:#9aa0a6;">Novos gastos pendentes:</span>
                      <span style="color:#ffffff;font-weight:bold;">${vencidos.length}</span>
                    </div>
                    <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #2a2a2f;">
                      <span style="color:#9aa0a6;">Valor total:</span>
                      <span style="color:#E62B4A;font-weight:bold;font-size:18px;">${formatCurrency(totalVencido)}</span>
                    </div>
                    ${atrasados.length > 0 ? `
                    <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #2a2a2f;">
                      <span style="color:#9aa0a6;">🚨 Atrasados:</span>
                      <span style="color:#ef4444;font-weight:bold;">${atrasados.length} itens</span>
                    </div>
                    ` : ''}
                    ${vencidosHoje.length > 0 ? `
                    <div style="display:flex;justify-content:space-between;padding:8px 0;">
                      <span style="color:#9aa0a6;">📅 Vencem hoje:</span>
                      <span style="color:#eab308;font-weight:bold;">${vencidosHoje.length} itens</span>
                    </div>
                    ` : ''}
                  </div>
                  
                  <h3 style="margin:20px 0 12px;font-size:14px;color:#ffffff;">📋 Detalhamento:</h3>
                  ${detalhamentoHtml}
                  ${vencidos.length > 10 ? `<p style="text-align:center;color:#9aa0a6;font-size:12px;">+ ${vencidos.length - 10} outros itens...</p>` : ''}
                </td></tr>
              </table>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr><td align="center" style="padding-top:24px;">
                  <a href="https://pro.moisesmedeiros.com.br/gestaofc/financas-empresa" style="display:inline-block;background:linear-gradient(135deg,#E62B4A,#7D1128);color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:10px;font-weight:700;font-size:14px;">💰 Acessar Central Financeira</a>
                </td></tr>
              </table>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr><td style="padding:24px 0 18px;"><hr style="border:none;border-top:1px solid #2a2a2f;margin:0;" /></td></tr>
              </table>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr><td style="color:#9aa0a6;font-size:12px;line-height:1.6;">
                  <p style="margin:0 0 8px;"><strong style="color:#e6e6e6;">Prof. Moisés Medeiros Melo</strong></p>
                  <p style="margin:0 0 8px;">MM CURSO DE QUÍMICA LTDA | O curso que mais aprova e comprova!</p>
                  <p style="margin:0;">WhatsApp: <a href="https://wa.me/558396169222" style="color:#E62B4A;">+55 83 9616-9222</a></p>
                </td></tr>
              </table>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr><td align="center" style="padding-top:18px;">
                  <p style="margin:0;color:#666;font-size:11px;">Email automático • ${new Date().toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                  <p style="margin:4px 0 0;color:#666;font-size:11px;">© ${new Date().getFullYear()} MM Curso de Química Ltda.</p>
                </td></tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
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

