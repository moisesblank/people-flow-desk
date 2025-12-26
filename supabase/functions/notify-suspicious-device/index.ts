// ============================================
// 🏛️ LEI VI: ALERTA DE DISPOSITIVO SUSPEITO
// Notifica admin quando risk_score > 70
// ============================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

import { getCorsHeaders, handleCorsOptions } from "../_shared/corsConfig.ts";

const OWNER_EMAIL = 'moisesblank@gmail.com';

interface AlertPayload {
  userId: string;
  userEmail?: string;
  userName?: string;
  riskScore: number;
  factors: Array<{ name: string; description: string }>;
  deviceHash: string;
  ip: string;
  country: string;
  city?: string;
  action: 'monitor' | 'challenge' | 'block';
  timestamp: string;
}

Deno.serve(async (req) => {
  // LEI VI: CORS dinâmico via allowlist centralizado
  const corsHeaders = getCorsHeaders(req);
  
  if (req.method === 'OPTIONS') {
    return handleCorsOptions(req);
  }

  try {
    // ============================================
    // 🛡️ P0.4 - VALIDAÇÃO INTERNAL_SECRET OBRIGATÓRIA
    // LEI VI: Função interna, não pode ser chamada externamente
    // ============================================
    const internalSecret = req.headers.get('x-internal-secret');
    const expectedSecret = Deno.env.get('INTERNAL_SECRET');
    
    if (!expectedSecret || !internalSecret || internalSecret !== expectedSecret) {
      console.error('[notify-suspicious-device] ❌ Chamada externa bloqueada');
      return new Response(
        JSON.stringify({ error: 'Acesso restrito a chamadas internas' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log('[notify-suspicious-device] ✅ Chamada interna autorizada');
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const payload: AlertPayload = await req.json();
    
    console.log('[notify-suspicious-device] Recebido alerta:', {
      userId: payload.userId,
      riskScore: payload.riskScore,
      action: payload.action,
    });

    // ============================================
    // 1. REGISTRAR ALERTA NO SISTEMA
    // ============================================

    await supabase.from('alertas_sistema').insert({
      tipo: 'seguranca',
      titulo: `🚨 Dispositivo Suspeito Detectado (Risk: ${payload.riskScore})`,
      mensagem: `Usuário: ${payload.userEmail || payload.userId}
IP: ${payload.ip} (${payload.country}${payload.city ? ', ' + payload.city : ''})
Ação: ${payload.action.toUpperCase()}
Fatores: ${payload.factors.map(f => f.description).join(', ')}`,
      origem: 'validate-device',
      destinatarios: ['owner', 'admin'],
      dados: payload,
      acao_sugerida: payload.action === 'block' 
        ? 'Verificar e confirmar bloqueio do dispositivo'
        : payload.action === 'challenge'
        ? 'Monitorar resultado do desafio de segurança'
        : 'Manter monitoramento ativo',
      link: `/gestao/gestao-dispositivos?userId=${payload.userId}`,
    });

    // ============================================
    // 2. ENVIAR EMAIL PARA OWNER (se crítico)
    // ============================================

    if (payload.riskScore >= 80 && resendApiKey) {
      try {
        const emailResponse = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'Moisés Medeiros <seguranca@moisesmedeiros.com.br>',
            to: [OWNER_EMAIL],
            subject: `🚨 ALERTA CRÍTICO: Dispositivo Suspeito (Risk: ${payload.riskScore})`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: #dc2626; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
                  <h1 style="margin: 0;">🚨 Alerta de Segurança</h1>
                  <p style="margin: 10px 0 0;">Risk Score: <strong>${payload.riskScore}/100</strong></p>
                </div>
                
                <div style="background: #fef2f2; padding: 20px; border: 1px solid #fecaca;">
                  <h2 style="color: #991b1b; margin-top: 0;">Dispositivo Suspeito Detectado</h2>
                  
                  <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                      <td style="padding: 8px; border-bottom: 1px solid #fecaca;"><strong>Usuário:</strong></td>
                      <td style="padding: 8px; border-bottom: 1px solid #fecaca;">${payload.userEmail || payload.userId}</td>
                    </tr>
                    <tr>
                      <td style="padding: 8px; border-bottom: 1px solid #fecaca;"><strong>IP:</strong></td>
                      <td style="padding: 8px; border-bottom: 1px solid #fecaca;">${payload.ip}</td>
                    </tr>
                    <tr>
                      <td style="padding: 8px; border-bottom: 1px solid #fecaca;"><strong>País/Cidade:</strong></td>
                      <td style="padding: 8px; border-bottom: 1px solid #fecaca;">${payload.country}${payload.city ? ', ' + payload.city : ''}</td>
                    </tr>
                    <tr>
                      <td style="padding: 8px; border-bottom: 1px solid #fecaca;"><strong>Ação:</strong></td>
                      <td style="padding: 8px; border-bottom: 1px solid #fecaca;"><span style="color: ${payload.action === 'block' ? '#dc2626' : '#f59e0b'}; font-weight: bold;">${payload.action.toUpperCase()}</span></td>
                    </tr>
                    <tr>
                      <td style="padding: 8px; border-bottom: 1px solid #fecaca;"><strong>Data/Hora:</strong></td>
                      <td style="padding: 8px; border-bottom: 1px solid #fecaca;">${new Date(payload.timestamp).toLocaleString('pt-BR')}</td>
                    </tr>
                  </table>
                  
                  <h3 style="color: #991b1b;">Fatores de Risco:</h3>
                  <ul style="margin: 0; padding-left: 20px;">
                    ${payload.factors.map(f => `<li>${f.description}</li>`).join('')}
                  </ul>
                </div>
                
                <div style="background: #1f2937; color: white; padding: 15px; border-radius: 0 0 8px 8px; text-align: center;">
                  <a href="https://gestao.moisesmedeiros.com.br/gestao/gestao-dispositivos" style="color: #60a5fa; text-decoration: none;">
                    Acessar Painel de Segurança →
                  </a>
                </div>
              </div>
            `,
          }),
        });

        if (!emailResponse.ok) {
          console.error('[notify-suspicious-device] Erro ao enviar email:', await emailResponse.text());
        } else {
          console.log('[notify-suspicious-device] ✅ Email de alerta enviado para owner');
        }
      } catch (emailError) {
        console.error('[notify-suspicious-device] Erro ao enviar email:', emailError);
      }
    }

    // ============================================
    // 3. NOTIFICAR VIA REALTIME (para dashboard admin)
    // ============================================

    // Inserir em tabela que o frontend escuta via realtime
    await supabase.from('security_events').insert({
      event_type: 'suspicious_device_alert',
      severity: payload.riskScore >= 80 ? 'critical' : payload.riskScore >= 50 ? 'high' : 'medium',
      user_id: payload.userId,
      ip_address: payload.ip,
      payload: {
        ...payload,
        notified_at: new Date().toISOString(),
      },
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Alerta processado com sucesso',
        emailSent: payload.riskScore >= 80 && !!resendApiKey,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[notify-suspicious-device] Error:', error);
    return new Response(
      JSON.stringify({ error: 'Erro ao processar alerta' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
