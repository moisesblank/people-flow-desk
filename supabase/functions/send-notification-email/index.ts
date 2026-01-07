// ============================================
// MOISÉS MEDEIROS v10.0 - Notification Email
// Wrapper para o resend-email-gateway
// 100% RESEND
// ============================================

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

import { getCorsHeaders, handleCorsOptions } from "../_shared/corsConfig.ts";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const FROM_EMAIL = Deno.env.get("RESEND_FROM") || "Prof. Moisés Medeiros <noreply@moisesmedeiros.com.br>";

interface EmailRequest {
  to: string;
  phone?: string;
  subject?: string;
  html?: string;
  type?: string;
  data?: Record<string, any>;
  sendSMS?: boolean;
}

// Template base
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

const getEmailTemplate = (type: string, data: Record<string, any> = {}) => {
  const templates: Record<string, { subject: string; html: string }> = {
    // Template ORIGINAL sem senha (retrocompatibilidade)
    welcome: {
      subject: "Seja bem-vindo(a) à equipe — Curso Moisés Medeiros 👊",
      html: getBaseTemplate("Bem-vindo(a) à equipe!",
        `<h2 style="margin:0 0 16px;font-size:18px;color:#ffffff;">Olá, ${data.nome || 'Colaborador(a)'}!</h2>
        <p style="margin:0 0 12px;">Seja muito bem-vindo(a) à equipe do Curso Moisés Medeiros 👊📚</p>
        <p style="margin:0;">Vamos juntos manter — e elevar — o padrão. 💪🔥</p>`,
        "Acessar Sistema", "https://pro.moisesmedeiros.com.br/gestaofc"),
    },
    // 🎯 P0 FIX: Template COM CREDENCIAIS para funcionários
    welcome_staff: {
      subject: "Suas credenciais de acesso — Curso Moisés Medeiros 👊",
      html: getBaseTemplate("Bem-vindo(a) à equipe!",
        `<h2 style="margin:0 0 16px;font-size:18px;color:#ffffff;">Olá, ${data.nome || 'Colaborador(a)'}!</h2>
        <p style="margin:0 0 12px;">Seja muito bem-vindo(a) à equipe do Curso Moisés Medeiros 👊📚</p>
        <p style="margin:0 0 16px;">Aqui estão suas credenciais de acesso ao sistema:</p>
        <div style="background:#1a1a1f;border-radius:8px;padding:16px;margin:16px 0;">
          <p style="margin:0 0 8px;"><strong style="color:#E62B4A;">📧 Email:</strong> ${data.email || 'N/A'}</p>
          <p style="margin:0;"><strong style="color:#E62B4A;">🔑 Senha:</strong> <code style="background:#2a2a2f;padding:4px 8px;border-radius:4px;font-family:monospace;color:#fff;">${data.senha || 'N/A'}</code></p>
        </div>
        <p style="margin:0 0 12px;color:#9aa0a6;font-size:13px;">⚠️ Por segurança, recomendamos que altere sua senha no primeiro acesso.</p>
        <p style="margin:0;">Vamos juntos manter — e elevar — o padrão. 💪🔥</p>`,
        "Acessar Sistema", "https://pro.moisesmedeiros.com.br/gestaofc"),
    },
    // 🎯 P0 FIX v2: Template para funcionários COM MAGIC LINK (sem senha em texto)
    welcome_staff_magic: {
      subject: "Bem-vindo(a) à equipe! — Curso Moisés Medeiros 👊",
      html: getBaseTemplate("Bem-vindo(a) à equipe!",
        `<h2 style="margin:0 0 16px;font-size:18px;color:#ffffff;">Olá, ${data.nome || 'Colaborador(a)'}!</h2>
        <p style="margin:0 0 12px;">Seja muito bem-vindo(a) à equipe do Curso Moisés Medeiros 👊📚</p>
        <p style="margin:0 0 16px;">Seu acesso foi criado com sucesso. Clique no botão abaixo para iniciar sua configuração:</p>
        <div style="background:#1a1a1f;border-radius:8px;padding:16px;margin:16px 0;">
          <p style="margin:0 0 8px;"><strong style="color:#E62B4A;">📧 Email:</strong> ${data.email || 'N/A'}</p>
          <p style="margin:0;"><strong style="color:#E62B4A;">💼 Função:</strong> ${data.funcao || 'Funcionário'}</p>
        </div>
        <p style="margin:0 0 12px;color:#9aa0a6;font-size:13px;">⚠️ Este link é válido por 24 horas. Você vai definir sua senha no primeiro acesso.</p>
        <p style="margin:0;">Vamos juntos manter — e elevar — o padrão. 💪🔥</p>`,
        "Acessar Plataforma", data.access_link || "https://pro.moisesmedeiros.com.br/auth"),
    },
    // 🎯 P0 FIX: Template de RECUPERAÇÃO DE SENHA (padrão bonito)
    password_recovery: {
      subject: "Recuperação de Senha — Curso Moisés Medeiros 🔐",
      html: getBaseTemplate("Recuperação de Senha",
        `<h2 style="margin:0 0 16px;font-size:18px;color:#ffffff;">Olá!</h2>
        <p style="margin:0 0 12px;">Recebemos uma solicitação para redefinir sua senha de acesso ao sistema.</p>
        <p style="margin:0 0 16px;">Clique no botão abaixo para criar uma nova senha:</p>
        <p style="margin:16px 0 12px;color:#9aa0a6;font-size:13px;">⚠️ Este link expira em 1 hora. Se você não solicitou esta recuperação, ignore este email.</p>`,
        "Redefinir Senha", data.confirmation_url || "https://pro.moisesmedeiros.com.br/auth"),
    },
    // 🎯 P0 FIX: Template de EMAIL CONFIRMAÇÃO (signup)
    email_confirmation: {
      subject: "Confirme seu Email — Curso Moisés Medeiros 📧",
      html: getBaseTemplate("Confirmação de Email",
        `<h2 style="margin:0 0 16px;font-size:18px;color:#ffffff;">Bem-vindo(a)!</h2>
        <p style="margin:0 0 12px;">Para completar seu cadastro, confirme seu endereço de email clicando no botão abaixo:</p>`,
        "Confirmar Email", data.confirmation_url || "https://pro.moisesmedeiros.com.br/auth"),
    },
    // 🎯 P0 FIX: Template de MAGIC LINK (login sem senha)
    magic_link: {
      subject: "Seu link de acesso — Curso Moisés Medeiros 🔗",
      html: getBaseTemplate("Link de Acesso",
        `<h2 style="margin:0 0 16px;font-size:18px;color:#ffffff;">Olá!</h2>
        <p style="margin:0 0 12px;">Clique no botão abaixo para acessar sua conta:</p>
        <p style="margin:16px 0 12px;color:#9aa0a6;font-size:13px;">⚠️ Este link expira em 1 hora e só pode ser usado uma vez.</p>`,
        "Acessar Conta", data.confirmation_url || "https://pro.moisesmedeiros.com.br/auth"),
    },
    sale: {
      subject: "Nova Venda Realizada! 💰🎯",
      html: getBaseTemplate("Nova Venda Confirmada!",
        `<h2 style="margin:0 0 16px;font-size:18px;color:#ffffff;">Parabéns! Nova venda realizada 🎉</h2>
        <div style="background:#1a1a1f;border-radius:8px;padding:16px;margin:16px 0;">
          <p style="margin:0 0 8px;"><strong>Produto:</strong> ${data.produto || 'Curso'}</p>
          <p style="margin:0 0 8px;"><strong>Valor:</strong> R$ ${data.valor || '0,00'}</p>
          <p style="margin:0 0 8px;"><strong>Comprador:</strong> ${data.comprador || 'N/A'}</p>
          <p style="margin:0;"><strong>Email:</strong> ${data.email || 'N/A'}</p>
        </div>`,
        "Ver Dashboard", "https://pro.moisesmedeiros.com.br/gestaofc/dashboard"),
    },
    reminder: {
      subject: `Lembrete: ${data.titulo || 'Tarefa Pendente'} ⏰`,
      html: getBaseTemplate("Lembrete Importante",
        `<h2 style="margin:0 0 16px;font-size:18px;color:#ffffff;">${data.titulo || 'Tarefa Pendente'}</h2>
        ${data.descricao ? `<p style="margin:0 0 12px;">${data.descricao}</p>` : ''}
        <div style="background:#1a1a1f;border-radius:8px;padding:16px;margin:16px 0;text-align:center;">
          <p style="margin:0;color:#E62B4A;font-size:18px;font-weight:bold;">📅 ${data.data || 'Hoje'} ${data.hora ? `às ${data.hora}` : ''}</p>
        </div>`,
        "Ver Calendário", "https://pro.moisesmedeiros.com.br/gestaofc/calendario"),
    },
    affiliate_payment: {
      subject: "Pagamento de Comissão Realizado! 💰 — Curso Moisés Medeiros",
      html: getBaseTemplate("Pagamento de Comissão",
        `<h2 style="margin:0 0 16px;font-size:18px;color:#ffffff;">Olá, ${data.nome || 'Parceiro(a)'}!</h2>
        <p style="margin:0 0 12px;">Temos ótimas notícias! 🎉</p>
        <p style="margin:0 0 12px;">Acabamos de realizar o pagamento da sua comissão.</p>
        <div style="background:#1a1a1f;border-radius:8px;padding:16px;margin:16px 0;">
          <p style="margin:0 0 8px;"><strong>💵 Valor:</strong> R$ ${data.valor || '0,00'}</p>
          <p style="margin:0 0 8px;"><strong>📅 Data:</strong> ${data.data || new Date().toLocaleDateString('pt-BR')}</p>
          <p style="margin:0;"><strong>🏦 Método:</strong> ${data.metodo || 'PIX'}</p>
        </div>`,
        "Ver Histórico", "https://pro.moisesmedeiros.com.br/gestaofc/afiliados"),
    },
    custom: {
      subject: data.subject || "Notificação — Curso Moisés Medeiros",
      html: data.html || getBaseTemplate(data.titulo || "Notificação",
        `<p style="margin:0;">${data.mensagem || 'Você tem uma nova notificação.'}</p>`),
    },
  };
  return templates[type] || templates.custom;
};

const handler = async (req: Request): Promise<Response> => {
  const corsHeaders = getCorsHeaders(req);
  
  if (req.method === "OPTIONS") {
    return handleCorsOptions(req);
  }

  try {
    const { to, subject, html, type, data }: EmailRequest = await req.json();

    const effectiveType = type ?? "custom";
    const template = effectiveType === "custom" && html
      ? { subject: subject || data?.subject || "Notificação", html }
      : getEmailTemplate(effectiveType, data || {});

    console.log(`[RESEND-NOTIFICATION] Enviando ${effectiveType} para: ${to}`);

    const response = await resend.emails.send({
      from: FROM_EMAIL,
      to: [to],
      subject: subject || template.subject,
      html: html || template.html,
    });

    if (response.error) {
      console.error("[RESEND-NOTIFICATION] Erro:", response.error);
      throw new Error(response.error.message);
    }

    console.log(`[RESEND-NOTIFICATION] ✅ Email enviado! ID: ${response.data?.id}`);

    return new Response(JSON.stringify({ 
      success: true, 
      provider: "resend",
      messageId: response.data?.id,
      channels: { email: true, sms: false }
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });

  } catch (error: any) {
    console.error("[RESEND-NOTIFICATION] Error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
