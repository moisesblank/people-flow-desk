import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

// 100% RD STATION - Não usa mais Resend
const RD_STATION_API_KEY = Deno.env.get("RD_STATION_API_KEY");

import { getCorsHeaders, handleCorsOptions } from "../_shared/corsConfig.ts";

interface EmailRequest {
  to: string;
  phone?: string; // Para SMS (opcional)
  subject?: string;
  html?: string;
  type?: "welcome" | "sale" | "reminder" | "custom" | "affiliate" | "password_reset" | "password_changed" | "affiliate_payment";
  data?: Record<string, any>;
  sendSMS?: boolean; // Enviar também por SMS
}

// ============================================
// MAPEAMENTO PARA RD STATION
// ============================================
const CONVERSION_MAP: Record<string, string> = {
  welcome: "email_boas_vindas_funcionario",
  sale: "email_venda_realizada",
  reminder: "email_lembrete",
  custom: "email_notificacao_geral",
  affiliate: "email_afiliado",
  affiliate_payment: "email_pagamento_comissao",
  password_reset: "email_reset_senha",
  password_changed: "email_senha_alterada",
};

// Formatar telefone para SMS
function formatPhoneForSMS(phone: string): string | null {
  if (!phone) return null;
  const numbersOnly = phone.replace(/\D/g, '');
  if (numbersOnly.length < 10) return null;
  if (numbersOnly.startsWith('55') && numbersOnly.length >= 12) {
    return numbersOnly;
  }
  const withoutZero = numbersOnly.startsWith('0') ? numbersOnly.substring(1) : numbersOnly;
  if (withoutZero.length >= 10 && withoutZero.length <= 11) {
    return `55${withoutZero}`;
  }
  return numbersOnly;
}

// ============================================
// TEMPLATE PADRÃO - CURSO MOISÉS MEDEIROS
// Aprovado em 16/12/2024
// ============================================

const getBaseTemplate = (titulo: string, conteudo: string, botaoTexto?: string, botaoUrl?: string) => `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${titulo} — Curso Moisés Medeiros</title>
</head>
<body style="margin:0;padding:0;background:#0a0a0f;color:#ffffff;font-family:Segoe UI, Tahoma, Geneva, Verdana, sans-serif;">
  <div style="max-width:680px;margin:0 auto;padding:24px;">
    <div style="background:linear-gradient(180deg,#131318 0%,#0a0a0f 100%);border-radius:16px;padding:28px;border:1px solid #7D1128;">
      <div style="text-align:center;margin-bottom:18px;">
        <h1 style="margin:0;color:#E62B4A;font-size:22px;">Curso Moisés Medeiros</h1>
        <p style="margin:6px 0 0 0;color:#9aa0a6;font-size:13px;">${titulo}</p>
      </div>

      <div style="color:#e6e6e6;line-height:1.7;font-size:14px;">
        ${conteudo}
      </div>

      ${botaoTexto && botaoUrl ? `
      <div style="text-align:center;margin-top:24px;">
        <a href="${botaoUrl}" style="display:inline-block;background:linear-gradient(135deg,#E62B4A,#7D1128);color:#fff;text-decoration:none;padding:14px 28px;border-radius:10px;font-weight:700;font-size:14px;">${botaoTexto}</a>
      </div>
      ` : ''}

      <hr style="border:none;border-top:1px solid #2a2a2f;margin:24px 0 18px 0;" />

      <div style="color:#9aa0a6;font-size:12px;line-height:1.6;">
        <p style="margin:0 0 8px 0;"><strong>Prof. Moisés Medeiros Melo</strong></p>
        <p style="margin:0 0 8px 0;">MM CURSO DE QUÍMICA LTDA | O curso que mais aprova e comprova!</p>
        <p style="margin:0 0 8px 0;">
          WhatsApp: <a href="https://wa.me/558396169222" style="color:#E62B4A;text-decoration:none;">+55 83 9616-9222</a>
        </p>
        <p style="margin:0 0 8px 0;">
          <a href="https://www.moisesmedeiros.com.br" style="color:#E62B4A;text-decoration:none;">www.moisesmedeiros.com.br</a> | 
          falemcom@moisesmedeiros.com.br
        </p>
        <p style="margin:12px 0 0 0;">Siga nas redes:</p>
        <p style="margin:4px 0 0 0;">
          Instagram: <a href="https://instagram.com/moises.profquimica" style="color:#E62B4A;text-decoration:none;">@moises.profquimica</a> |
          <a href="https://t.me/+KIur74un8Gg2ZWJh" style="color:#E62B4A;text-decoration:none;">Telegram</a> |
          <a href="https://www.youtube.com/@moises.profquimica" style="color:#E62B4A;text-decoration:none;">YouTube</a>
        </p>
      </div>

      <p style="margin:18px 0 0 0;color:#666;font-size:11px;text-align:center;">© ${new Date().getFullYear()} MM Curso de Química Ltda.</p>
    </div>
  </div>
</body>
</html>
`;

const getEmailTemplate = (type: string, data: Record<string, any> = {}) => {
  const templates: Record<string, { subject: string; html: string; smsMessage?: string }> = {
    welcome: {
      subject: "Seja bem-vindo(a) à equipe — Curso Moisés Medeiros 👊",
      html: getBaseTemplate(
        "Bem-vindo(a) à equipe!",
        `
        <h2 style="margin:0 0 16px 0;font-size:18px;color:#ffffff;">Olá, ${data.nome || 'Colaborador(a)'}!</h2>
        <p style="margin:0 0 12px 0;">Seja muito bem-vindo(a) à equipe do Curso Moisés Medeiros 👊📚</p>
        <p style="margin:0 0 12px 0;">Os dados de acesso e orientações iniciais já foram encaminhados via WhatsApp.</p>
        <p style="margin:0;">Vamos juntos manter — e elevar — o padrão. 💪🔥</p>
        `,
        "Acessar Sistema",
        "https://pro.moisesmedeiros.com.br/gestaofc"
      ),
      smsMessage: `[Prof. Moises] Ola ${data.nome || 'Colaborador'}! Bem-vindo(a) a equipe! Acesse: pro.moisesmedeiros.com.br`,
    },

    affiliate: {
      subject: data.titulo || "Mensagem para Afiliados — Curso Moisés Medeiros 🤝",
      html: getBaseTemplate(
        data.titulo || "Mensagem para Afiliados",
        `
        <h2 style="margin:0 0 16px 0;font-size:18px;color:#ffffff;">Olá, ${data.nome || 'Parceiro(a)'}!</h2>
        ${data.mensagem ? `<div style="white-space: pre-wrap; margin:0 0 16px 0;">${data.mensagem}</div>` : ''}
        ${data.cupom ? `
        <div style="background:#1a1a1f;border-radius:8px;padding:16px;margin:16px 0;text-align:center;">
          <p style="margin:0 0 8px 0;color:#9aa0a6;font-size:12px;">SEU CUPOM EXCLUSIVO</p>
          <p style="margin:0;color:#E62B4A;font-size:24px;font-weight:bold;letter-spacing:2px;">${data.cupom}</p>
        </div>
        ` : ''}
        <p style="margin:16px 0 0 0;color:#9aa0a6;">Conte sempre conosco para qualquer dúvida ou suporte!</p>
        `,
        "Acessar Painel",
        "https://pro.moisesmedeiros.com.br/gestaofc/afiliados"
      ),
    },

    affiliate_payment: {
      subject: "Pagamento de Comissão Realizado! 💰 — Curso Moisés Medeiros",
      html: getBaseTemplate(
        "Pagamento de Comissão",
        `
        <h2 style="margin:0 0 16px 0;font-size:18px;color:#ffffff;">Olá, ${data.nome || 'Parceiro(a)'}!</h2>
        <p style="margin:0 0 12px 0;">Temos ótimas notícias! 🎉</p>
        <p style="margin:0 0 12px 0;">Acabamos de realizar o pagamento da sua comissão.</p>
        <div style="background:#1a1a1f;border-radius:8px;padding:16px;margin:16px 0;">
          <p style="margin:0 0 8px 0;"><strong>💵 Valor:</strong> R$ ${data.valor || '0,00'}</p>
          <p style="margin:0 0 8px 0;"><strong>📅 Data:</strong> ${data.data || new Date().toLocaleDateString('pt-BR')}</p>
          <p style="margin:0;"><strong>🏦 Método:</strong> ${data.metodo || 'PIX'}</p>
        </div>
        <p style="margin:0;">Continue com o excelente trabalho! 🚀</p>
        `,
        "Ver Histórico",
        "https://pro.moisesmedeiros.com.br/gestaofc/afiliados"
      ),
      smsMessage: `[Prof. Moises] Pagamento de R$ ${data.valor || '0,00'} realizado! Verifique sua conta.`,
    },

    password_reset: {
      subject: "Recuperação de Senha — Curso Moisés Medeiros 🔐",
      html: getBaseTemplate(
        "Recuperação de Senha",
        `
        <h2 style="margin:0 0 16px 0;font-size:18px;color:#ffffff;">Olá, ${data.nome || 'Usuário'}!</h2>
        <p style="margin:0 0 12px 0;">Recebemos uma solicitação para redefinir sua senha.</p>
        ${data.reset_link ? `
        <div style="text-align:center;margin:20px 0;">
          <a href="${data.reset_link}" style="display:inline-block;background:linear-gradient(135deg,#E62B4A,#7D1128);color:#fff;text-decoration:none;padding:14px 28px;border-radius:10px;font-weight:700;font-size:14px;">Redefinir Minha Senha</a>
        </div>
        ` : ''}
        <p style="margin:0 0 12px 0;color:#9aa0a6;font-size:13px;">⚠️ Este link expira em 1 hora.</p>
        <p style="margin:0;">Se você não solicitou, ignore este email.</p>
        `,
        undefined,
        undefined
      ),
    },

    password_changed: {
      subject: "Sua senha foi alterada — Curso Moisés Medeiros ✅",
      html: getBaseTemplate(
        "Senha Alterada com Sucesso",
        `
        <h2 style="margin:0 0 16px 0;font-size:18px;color:#ffffff;">Olá, ${data.nome || 'Usuário'}!</h2>
        <p style="margin:0 0 12px 0;">Sua senha foi alterada com sucesso! ✅</p>
        <p style="margin:0 0 12px 0;color:#ff6b6b;"><strong>⚠️ Se você NÃO alterou sua senha</strong>, entre em contato imediatamente.</p>
        `,
        "Acessar Sistema",
        "https://pro.moisesmedeiros.com.br/gestaofc"
      ),
      smsMessage: `[Prof. Moises] Sua senha foi alterada. Se nao foi voce, contate-nos imediatamente!`,
    },

    sale: {
      subject: "Nova Venda Realizada! 💰🎯",
      html: getBaseTemplate(
        "Nova Venda Confirmada!",
        `
        <h2 style="margin:0 0 16px 0;font-size:18px;color:#ffffff;">Parabéns! Nova venda realizada 🎉</h2>
        <div style="background:#1a1a1f;border-radius:8px;padding:16px;margin:16px 0;">
          <p style="margin:0 0 8px 0;"><strong>Produto:</strong> ${data.produto || 'Curso'}</p>
          <p style="margin:0 0 8px 0;"><strong>Valor:</strong> R$ ${data.valor || '0,00'}</p>
          <p style="margin:0 0 8px 0;"><strong>Comprador:</strong> ${data.comprador || 'N/A'}</p>
          <p style="margin:0;"><strong>Email:</strong> ${data.email || 'N/A'}</p>
        </div>
        `,
        "Ver Dashboard",
        "https://pro.moisesmedeiros.com.br/gestaofc/dashboard"
      ),
      smsMessage: `[Prof. Moises] Nova venda: R$ ${data.valor || '0,00'} - ${data.comprador || 'Cliente'}`,
    },

    reminder: {
      subject: `Lembrete: ${data.titulo || 'Tarefa Pendente'} ⏰`,
      html: getBaseTemplate(
        "Lembrete Importante",
        `
        <h2 style="margin:0 0 16px 0;font-size:18px;color:#ffffff;">${data.titulo || 'Tarefa Pendente'}</h2>
        ${data.descricao ? `<p style="margin:0 0 12px 0;">${data.descricao}</p>` : ''}
        <div style="background:#1a1a1f;border-radius:8px;padding:16px;margin:16px 0;text-align:center;">
          <p style="margin:0;color:#E62B4A;font-size:18px;font-weight:bold;">
            📅 ${data.data || 'Hoje'} ${data.hora ? `às ${data.hora}` : ''}
          </p>
        </div>
        `,
        "Ver Calendário",
        "https://pro.moisesmedeiros.com.br/gestaofc/calendario"
      ),
      smsMessage: `[Prof. Moises] Lembrete: ${data.titulo || 'Tarefa'} - ${data.data || 'Hoje'}`,
    },

    custom: {
      subject: data.subject || "Notificação — Curso Moisés Medeiros",
      html: data.html || getBaseTemplate(
        data.titulo || "Notificação",
        `<p style="margin:0;">${data.mensagem || 'Você tem uma nova notificação.'}</p>`,
        undefined,
        undefined
      ),
      smsMessage: data.smsMessage || data.mensagem?.substring(0, 140),
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
    if (!RD_STATION_API_KEY) {
      throw new Error("RD_STATION_API_KEY not configured");
    }

    const { to, phone, subject, html, type, data, sendSMS }: EmailRequest = await req.json();

    const effectiveType = type ?? (html ? "custom" : "custom");

    console.log(`[RD-NOTIFICATION] Enviando ${effectiveType} para: ${to}${phone ? ` / SMS: ${phone}` : ''}`);

    const template = effectiveType === "custom"
      ? { subject: subject || data?.subject || "Notificação do Sistema", html: html || data?.html || getEmailTemplate("custom", data).html, smsMessage: data?.smsMessage }
      : getEmailTemplate(effectiveType, data);

    const conversionIdentifier = CONVERSION_MAP[effectiveType] || "email_notificacao_geral";
    const formattedPhone = phone ? formatPhoneForSMS(phone) : null;

    const rdPayload = {
      event_type: "CONVERSION",
      event_family: "CDP",
      payload: {
        conversion_identifier: conversionIdentifier,
        email: to,
        name: data?.nome || data?.name || "Lead",
        mobile_phone: sendSMS && formattedPhone ? formattedPhone : undefined,
        cf_assunto: template.subject,
        cf_tipo_email: effectiveType,
        cf_origem: "send_notification_email",
        cf_data_envio: new Date().toISOString(),
        cf_plataforma: "pro.moisesmedeiros.com.br",
        cf_canal_envio: sendSMS && formattedPhone ? "email_sms" : "email",
        cf_mensagem_sms: sendSMS && template.smsMessage ? template.smsMessage : undefined,
        ...data,
      }
    };

    // Remover undefined
    const payload = rdPayload.payload as Record<string, unknown>;
    Object.keys(payload).forEach(key => {
      if (payload[key] === undefined) {
        delete payload[key];
      }
    });

    console.log("[RD-NOTIFICATION] Payload:", JSON.stringify(rdPayload, null, 2));

    const response = await fetch(
      `https://api.rd.services/platform/conversions?api_key=${RD_STATION_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify(rdPayload),
      }
    );

    const rdResponse = await response.text();
    console.log("[RD-NOTIFICATION] Response:", response.status, rdResponse);

    if (response.ok) {
      return new Response(JSON.stringify({ 
        success: true, 
        provider: "rd_station",
        message: "Mensagem enviada via RD Station",
        channels: {
          email: true,
          sms: sendSMS && !!formattedPhone
        }
      }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    } else {
      console.error("[RD-NOTIFICATION] Erro:", rdResponse);
      throw new Error(`RD Station retornou ${response.status}: ${rdResponse}`);
    }
  } catch (error: any) {
    console.error("[RD-NOTIFICATION] Error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
