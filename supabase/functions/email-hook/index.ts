// ============================================
// 🎯 EMAIL HOOK v1.0 - Custom Auth Emails
// Intercepta emails do Supabase Auth e usa template bonito
// CONSTITUIÇÃO SYNAPSE Ω v10.x
// ============================================

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const FROM_EMAIL = Deno.env.get("RESEND_FROM") || "Curso Moisés Medeiros <falecom@moisesmedeiros.com.br>";

// Template base bonito (padrão do sistema)
const getBaseTemplate = (titulo: string, conteudo: string, botaoTexto?: string, botaoUrl?: string) => `
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
                  <p style="margin:8px 0 0;color:#9aa0a6;font-size:13px;">${titulo}</p>
                </td></tr>
              </table>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr><td style="color:#e6e6e6;line-height:1.7;font-size:14px;">${conteudo}</td></tr>
              </table>
              ${botaoTexto && botaoUrl ? `
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr><td align="center" style="padding-top:24px;">
                  <a href="${botaoUrl}" style="display:inline-block;background:linear-gradient(135deg,#E62B4A,#7D1128);color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:10px;font-weight:700;font-size:14px;">${botaoTexto}</a>
                </td></tr>
              </table>
              ` : ''}
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

// Mapeamento de tipos de email do Supabase para templates
const getEmailByType = (type: string, confirmationUrl: string) => {
  const templates: Record<string, { subject: string; html: string }> = {
    // Recuperação de senha
    recovery: {
      subject: "Recuperação de Senha — Curso Moisés Medeiros 🔐",
      html: getBaseTemplate("Recuperação de Senha",
        `<h2 style="margin:0 0 16px;font-size:18px;color:#ffffff;">Olá!</h2>
        <p style="margin:0 0 12px;">Recebemos uma solicitação para redefinir sua senha de acesso ao sistema.</p>
        <p style="margin:0 0 16px;">Clique no botão abaixo para criar uma nova senha:</p>
        <p style="margin:16px 0 12px;color:#9aa0a6;font-size:13px;">⚠️ Este link expira em 1 hora. Se você não solicitou esta recuperação, ignore este email.</p>`,
        "Redefinir Minha Senha", confirmationUrl),
    },
    // Confirmação de email (signup)
    signup: {
      subject: "Confirme seu Email — Curso Moisés Medeiros 📧",
      html: getBaseTemplate("Confirmação de Email",
        `<h2 style="margin:0 0 16px;font-size:18px;color:#ffffff;">Bem-vindo(a)!</h2>
        <p style="margin:0 0 12px;">Para completar seu cadastro, confirme seu endereço de email clicando no botão abaixo:</p>`,
        "Confirmar Meu Email", confirmationUrl),
    },
    // Magic link
    magiclink: {
      subject: "Seu link de acesso — Curso Moisés Medeiros 🔗",
      html: getBaseTemplate("Link de Acesso",
        `<h2 style="margin:0 0 16px;font-size:18px;color:#ffffff;">Olá!</h2>
        <p style="margin:0 0 12px;">Clique no botão abaixo para acessar sua conta:</p>
        <p style="margin:16px 0 12px;color:#9aa0a6;font-size:13px;">⚠️ Este link expira em 1 hora e só pode ser usado uma vez.</p>`,
        "Acessar Minha Conta", confirmationUrl),
    },
    // Convite
    invite: {
      subject: "Você foi convidado — Curso Moisés Medeiros 👊",
      html: getBaseTemplate("Convite para a Equipe",
        `<h2 style="margin:0 0 16px;font-size:18px;color:#ffffff;">Você foi convidado!</h2>
        <p style="margin:0 0 12px;">Alguém da equipe do Curso Moisés Medeiros te convidou para fazer parte do time.</p>
        <p style="margin:0 0 16px;">Clique no botão abaixo para aceitar o convite e criar sua conta:</p>`,
        "Aceitar Convite", confirmationUrl),
    },
    // Email change
    email_change: {
      subject: "Confirme seu novo email — Curso Moisés Medeiros 📧",
      html: getBaseTemplate("Alteração de Email",
        `<h2 style="margin:0 0 16px;font-size:18px;color:#ffffff;">Alteração de Email</h2>
        <p style="margin:0 0 12px;">Você solicitou a alteração do seu email de acesso.</p>
        <p style="margin:0 0 16px;">Clique no botão abaixo para confirmar seu novo endereço de email:</p>`,
        "Confirmar Novo Email", confirmationUrl),
    },
  };

  return templates[type] || templates.recovery;
};

serve(async (req) => {
  // Este hook recebe requests do Supabase Auth
  // Payload: { user, email_data: { token, token_hash, redirect_to, email_action_type } }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), { 
      status: 405,
      headers: { "Content-Type": "application/json" }
    });
  }

  try {
    const payload = await req.json();
    
    console.log("[EMAIL-HOOK] Payload recebido:", JSON.stringify(payload, null, 2));

    // Extrair dados do payload do Supabase Auth Hook
    const user = payload.user || {};
    const emailData = payload.email_data || {};
    
    const email = user.email;
    const type = emailData.email_action_type || "recovery";
    const token = emailData.token;
    const tokenHash = emailData.token_hash;
    const redirectTo = emailData.redirect_to || "https://pro.moisesmedeiros.com.br/auth";
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";

    if (!email) {
      console.error("[EMAIL-HOOK] Email não encontrado no payload");
      return new Response(JSON.stringify({ error: "Email required" }), { 
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    // Construir URL de confirmação (formato Supabase)
    // Formato: {supabase_url}/auth/v1/verify?token={token_hash}&type={type}&redirect_to={redirect_to}
    const confirmationUrl = tokenHash 
      ? `${supabaseUrl}/auth/v1/verify?token=${tokenHash}&type=${type}&redirect_to=${encodeURIComponent(redirectTo)}`
      : redirectTo;

    console.log("[EMAIL-HOOK] Enviando email:", { email, type, confirmationUrl });

    // Obter template baseado no tipo
    const template = getEmailByType(type, confirmationUrl);

    // Enviar via Resend
    const response = await resend.emails.send({
      from: FROM_EMAIL,
      to: [email],
      subject: template.subject,
      html: template.html,
    });

    if (response.error) {
      console.error("[EMAIL-HOOK] Erro Resend:", response.error);
      throw new Error(response.error.message);
    }

    console.log(`[EMAIL-HOOK] ✅ Email enviado! ID: ${response.data?.id}`);

    return new Response(JSON.stringify({ 
      success: true, 
      messageId: response.data?.id 
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

  } catch (error: any) {
    console.error("[EMAIL-HOOK] Erro:", error);
    return new Response(JSON.stringify({ 
      error: error.message || "Internal error" 
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
