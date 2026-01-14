// ============================================
// 📧 resend-first-access-token
// Reenvia o e-mail de primeiro acesso com novo token
// Token NUNCA expira até ser usado (CONSTITUIÇÃO v10.x)
// ============================================

import { createClient } from "npm:@supabase/supabase-js@2";
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Template de e-mail
const getEmailTemplate = (nome: string, roleLabel: string, accessUrl: string) => `
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
                  <p style="margin:8px 0 0;color:#9aa0a6;font-size:13px;">Reenvio de Acesso à Plataforma</p>
                </td></tr>
              </table>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr><td style="color:#e6e6e6;line-height:1.7;font-size:14px;">
                  <h2 style="margin:0 0 16px;font-size:18px;color:#ffffff;">👋 Olá, ${nome}!</h2>
                  <p style="margin:0 0 12px;">Reenviamos seu link de acesso à plataforma.</p>
                  
                  <div style="background:#1a1a1f;border-radius:8px;padding:16px;margin:16px 0;text-align:center;">
                    <p style="margin:0;color:#E62B4A;font-size:16px;font-weight:bold;">✅ ${roleLabel}</p>
                  </div>
                  
                  <div style="background:#2a2a2f;border-radius:8px;padding:20px;margin:16px 0;border-left:4px solid #22c55e;">
                    <p style="margin:0 0 12px;color:#ffffff;font-weight:bold;font-size:15px;">🚀 Acesse a Plataforma</p>
                    <p style="margin:0;color:#9aa0a6;font-size:13px;">Este é seu novo link de acesso. Clique no botão abaixo para configurar sua conta.</p>
                    <p style="margin:12px 0 0;color:#22c55e;font-size:12px;font-weight:bold;">✅ Este link é válido ETERNAMENTE até você utilizá-lo pela primeira vez.</p>
                  </div>
                </td></tr>
              </table>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr><td align="center" style="padding-top:24px;">
                  <a href="${accessUrl}" style="display:inline-block;background:linear-gradient(135deg,#E62B4A,#7D1128);color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:10px;font-weight:700;font-size:14px;">Acessar Plataforma</a>
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
                <tr><td align="center" style="padding-top:18px;"><p style="margin:0;color:#666;font-size:11px;">© ${new Date().getFullYear()} MM Curso de Química Ltda.</p></td></tr>
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

const ROLE_LABELS: Record<string, string> = {
  beta: 'Aluno Beta (Premium)',
  aluno_gratuito: 'Aluno Gratuito',
  aluno_presencial: 'Aluno Presencial',
  beta_expira: 'Beta com Expiração',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.log('[resend-first-access-token] ========== REQUEST ==========');

  try {
    const { email } = await req.json();

    if (!email || typeof email !== 'string') {
      return new Response(
        JSON.stringify({ success: false, error: 'Email é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    const resendFrom = Deno.env.get('RESEND_FROM');
    
    if (!resendApiKey || !resendFrom) {
      return new Response(
        JSON.stringify({ success: false, error: 'Configuração de email ausente' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const resend = new Resend(resendApiKey);
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Verificar autenticação do caller
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: 'Não autorizado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUser = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user: caller }, error: authError } = await supabaseUser.auth.getUser();
    if (authError || !caller) {
      return new Response(
        JSON.stringify({ success: false, error: 'Token inválido' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verificar se caller tem permissão
    const { data: callerRole } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', caller.id)
      .maybeSingle();

    if (!callerRole || !['owner', 'admin', 'suporte'].includes(callerRole.role)) {
      return new Response(
        JSON.stringify({ success: false, error: 'Sem permissão para reenviar acesso' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Buscar usuário pelo email
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('id, nome, email')
      .ilike('email', email.toLowerCase().trim())
      .maybeSingle();

    if (!profile) {
      return new Response(
        JSON.stringify({ success: false, error: 'Usuário não encontrado' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Buscar role do usuário
    const { data: userRole } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', profile.id)
      .maybeSingle();

    const role = userRole?.role || 'beta';
    const roleLabel = ROLE_LABELS[role] || role;

    // Invalidar tokens anteriores
    await supabaseAdmin
      .from('first_access_tokens')
      .update({ is_used: true, used_at: new Date().toISOString() })
      .eq('user_id', profile.id)
      .eq('is_used', false);

    // Gerar novo token persistente
    const tokenBytes = new Uint8Array(32);
    crypto.getRandomValues(tokenBytes);
    const newToken = Array.from(tokenBytes).map(b => b.toString(16).padStart(2, '0')).join('');

    // Salvar token
    const { error: tokenError } = await supabaseAdmin
      .from('first_access_tokens')
      .insert({
        user_id: profile.id,
        email: profile.email,
        token: newToken,
        created_by: caller.id,
        metadata: {
          role,
          nome: profile.nome,
          resent_by: caller.email,
          resent_at: new Date().toISOString(),
        },
      });

    if (tokenError) {
      console.error('[resend-first-access-token] Token error:', tokenError);
      return new Response(
        JSON.stringify({ success: false, error: 'Erro ao gerar token' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Enviar e-mail
    // 🎯 P0 FIX: URL dinâmica via env (fallback para produção)
    const siteUrl = Deno.env.get('SITE_URL') || 'https://pro.moisesmedeiros.com.br';
    const accessUrl = `${siteUrl}/auth?first_access_token=${newToken}`;
    console.log('[resend-first-access-token] 📍 Using SITE_URL:', siteUrl);
    const htmlContent = getEmailTemplate(profile.nome || 'Aluno', roleLabel, accessUrl);

    const { error: emailError } = await resend.emails.send({
      from: resendFrom,
      to: [profile.email],
      subject: `🔄 Novo link de acesso — Curso Moisés Medeiros`,
      html: htmlContent,
    });

    if (emailError) {
      console.error('[resend-first-access-token] Email error:', emailError);
      return new Response(
        JSON.stringify({ success: false, error: 'Erro ao enviar e-mail' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[resend-first-access-token] ✅ Email reenviado para:', profile.email);

    // Log de auditoria
    await supabaseAdmin.from('audit_logs').insert({
      user_id: caller.id,
      action: 'RESEND_FIRST_ACCESS_TOKEN',
      record_id: profile.id,
      new_data: {
        target_email: profile.email,
        resent_by: caller.email,
      },
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `E-mail reenviado para ${profile.email}`,
        email: profile.email,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[resend-first-access-token] ❌ Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Erro interno' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
