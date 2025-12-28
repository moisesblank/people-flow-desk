import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

// MIGRADO: Agora usa RD Station ao invés de Resend
const RD_STATION_API_KEY = Deno.env.get("RD_STATION_API_KEY");
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY"); // Fallback

import { getCorsHeaders, handleCorsOptions } from "../_shared/corsConfig.ts";

interface EmailRequest {
  to: string;
  subject?: string;
  html?: string;
  type?: "welcome" | "sale" | "reminder" | "custom";
  data?: Record<string, any>;
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
  const templates: Record<string, { subject: string; html: string }> = {
    // EMAIL DE BOAS-VINDAS À EQUIPE (quando cria acesso)
    welcome: {
      subject: "Seja bem-vindo(a) à equipe — Curso Moisés Medeiros 👊",
      html: getBaseTemplate(
        "Bem-vindo(a) à equipe!",
        `
        <h2 style="margin:0 0 16px 0;font-size:18px;color:#ffffff;">Olá, ${data.nome || 'Colaborador(a)'}!</h2>
        
        <p style="margin:0 0 12px 0;">Seja muito bem-vindo(a) à equipe do Curso Moisés Medeiros 👊📚</p>

        <p style="margin:0 0 12px 0;">É uma satisfação enorme ter você conosco em um projeto que nasceu com um propósito muito claro: transformar estudo em aprovação e levar nossos alunos ao mais alto nível de desempenho acadêmico, especialmente em Medicina 🎯🩺</p>

        <p style="margin:0 0 12px 0;">Aqui a gente trabalha com padrão elevado, foco em resultado, responsabilidade e compromisso real com aquilo que entrega. Nosso crescimento não é acaso — é fruto de método, consistência e pessoas que entendem que excelência não é discurso, é prática diária ⚙️🔥</p>

        <p style="margin:0 0 12px 0;">Você passa a fazer parte de um time que valoriza organização, profissionalismo, ética e, acima de tudo, respeito aos alunos e à missão educacional que carregamos. Cada função aqui é estratégica e impacta diretamente milhares de estudantes espalhados pelo país 🌍📈</p>

        <p style="margin:0 0 12px 0;"><strong>📌 Ponto importante desde já:</strong><br/>Cada membro da equipe será responsável por manter a planilha atualizada, conforme alinhamentos internos. Isso é essencial para a organização e o bom funcionamento do time.</p>

        <p style="margin:0 0 12px 0;"><strong>🔐 Sobre acessos e login:</strong><br/>Os dados de acesso e orientações iniciais já foram encaminhados via WhatsApp pela Bruna, minha esposa, que cuida diretamente dessa parte operacional com vocês.</p>

        <p style="margin:0 0 12px 0;">Fique à vontade para contribuir, sugerir, aprender e crescer junto com a gente 🤝🚀<br/>As próximas orientações e alinhamentos continuarão sendo passados pelos nossos canais oficiais.</p>

        <p style="margin:0;">Mais uma vez, seja bem-vindo(a).<br/>Vamos juntos manter — e elevar — o padrão. 💪🔥</p>
        `,
        "Acessar Sistema",
        "https://pro.moisesmedeiros.com.br/gestaofc"
      ),
    },

    // EMAIL PARA AFILIADOS
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

    // EMAIL DE PAGAMENTO DE COMISSÃO
    affiliate_payment: {
      subject: "Pagamento de Comissão Realizado! 💰 — Curso Moisés Medeiros",
      html: getBaseTemplate(
        "Pagamento de Comissão",
        `
        <h2 style="margin:0 0 16px 0;font-size:18px;color:#ffffff;">Olá, ${data.nome || 'Parceiro(a)'}!</h2>
        
        <p style="margin:0 0 12px 0;">Temos ótimas notícias! 🎉</p>

        <p style="margin:0 0 12px 0;">Acabamos de realizar o pagamento da sua comissão referente às vendas do período.</p>

        <div style="background:#1a1a1f;border-radius:8px;padding:16px;margin:16px 0;">
          <p style="margin:0 0 8px 0;"><strong>💵 Valor:</strong> R$ ${data.valor || '0,00'}</p>
          <p style="margin:0 0 8px 0;"><strong>📅 Data:</strong> ${data.data || new Date().toLocaleDateString('pt-BR')}</p>
          <p style="margin:0;"><strong>🏦 Método:</strong> ${data.metodo || 'PIX'}</p>
        </div>

        <p style="margin:0 0 12px 0;">O valor já deve estar disponível na sua conta.</p>

        <p style="margin:0;">Continue com o excelente trabalho! Juntos vamos longe. 🚀</p>
        `,
        "Ver Histórico",
        "https://pro.moisesmedeiros.com.br/gestaofc/afiliados"
      ),
    },

    // EMAIL DE RECUPERAÇÃO DE SENHA
    password_reset: {
      subject: "Recuperação de Senha — Curso Moisés Medeiros 🔐",
      html: getBaseTemplate(
        "Recuperação de Senha",
        `
        <h2 style="margin:0 0 16px 0;font-size:18px;color:#ffffff;">Olá, ${data.nome || 'Usuário'}!</h2>
        
        <p style="margin:0 0 12px 0;">Recebemos uma solicitação para redefinir a senha da sua conta no sistema de gestão do Curso Moisés Medeiros.</p>

        <p style="margin:0 0 12px 0;">Se você fez essa solicitação, clique no botão abaixo para criar uma nova senha:</p>

        ${data.reset_link ? `
        <div style="text-align:center;margin:20px 0;">
          <a href="${data.reset_link}" style="display:inline-block;background:linear-gradient(135deg,#E62B4A,#7D1128);color:#fff;text-decoration:none;padding:14px 28px;border-radius:10px;font-weight:700;font-size:14px;">Redefinir Minha Senha</a>
        </div>
        ` : ''}

        <p style="margin:0 0 12px 0;color:#9aa0a6;font-size:13px;">⚠️ Este link expira em 1 hora por motivos de segurança.</p>

        <p style="margin:0 0 12px 0;">Se você <strong>não solicitou</strong> a redefinição de senha, ignore este email. Sua senha permanecerá a mesma.</p>

        <p style="margin:0;">Qualquer dúvida, entre em contato conosco pelo WhatsApp.</p>
        `,
        undefined,
        undefined
      ),
    },

    // EMAIL DE CONFIRMAÇÃO DE ALTERAÇÃO DE SENHA
    password_changed: {
      subject: "Sua senha foi alterada — Curso Moisés Medeiros ✅",
      html: getBaseTemplate(
        "Senha Alterada com Sucesso",
        `
        <h2 style="margin:0 0 16px 0;font-size:18px;color:#ffffff;">Olá, ${data.nome || 'Usuário'}!</h2>
        
        <p style="margin:0 0 12px 0;">Sua senha foi alterada com sucesso! ✅</p>

        <p style="margin:0 0 12px 0;">Se você realizou essa alteração, pode ignorar este email.</p>

        <p style="margin:0 0 12px 0;color:#ff6b6b;"><strong>⚠️ Se você NÃO alterou sua senha</strong>, entre em contato imediatamente com nossa equipe pelo WhatsApp para proteger sua conta.</p>

        <p style="margin:0;">Mantenha sua senha segura e não a compartilhe com ninguém.</p>
        `,
        "Acessar Sistema",
        "https://pro.moisesmedeiros.com.br/gestaofc"
      ),
    },

    // EMAIL DE NOVA VENDA
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

        <p style="margin:0;">Acesse o dashboard para mais detalhes.</p>
        `,
        "Ver Dashboard",
        "https://pro.moisesmedeiros.com.br/gestaofc/dashboard"
      ),
    },

    // EMAIL DE LEMBRETE
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

        <p style="margin:0;">Não deixe para depois!</p>
        `,
        "Ver Calendário",
        "https://pro.moisesmedeiros.com.br/gestaofc/calendario"
      ),
    },

    // EMAIL CUSTOMIZADO (fallback)
    custom: {
      subject: data.subject || "Notificação — Curso Moisés Medeiros",
      html: data.html || getBaseTemplate(
        data.titulo || "Notificação",
        `<p style="margin:0;">${data.mensagem || 'Você tem uma nova notificação.'}</p>`,
        undefined,
        undefined
      ),
    },
  };

  return templates[type] || templates.custom;
};

const handler = async (req: Request): Promise<Response> => {
  // LEI VI: CORS dinâmico via allowlist
  const corsHeaders = getCorsHeaders(req);
  
  if (req.method === "OPTIONS") {
    return handleCorsOptions(req);
  }

  try {
    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY not configured");
    }

    const { to, subject, html, type, data }: EmailRequest = await req.json();

    const effectiveType: "welcome" | "sale" | "reminder" | "custom" =
      (type as any) ?? (html ? "custom" : "custom");

    console.log(`[RD-STATION] Sending ${effectiveType} email to: ${to}`);

    const template =
      effectiveType === "custom"
        ? { subject: subject || data?.subject || "Notificação do Sistema", html: html || data?.html || getEmailTemplate("custom", data).html }
        : getEmailTemplate(effectiveType, data);

    // MIGRADO: Usar RD Station ao invés de Resend
    if (RD_STATION_API_KEY) {
      const conversionMap: Record<string, string> = {
        welcome: "email_boas_vindas",
        sale: "email_venda_realizada",
        reminder: "email_lembrete",
        custom: "email_notificacao_geral",
      };

      const rdPayload = {
        event_type: "CONVERSION",
        event_family: "CDP",
        payload: {
          conversion_identifier: conversionMap[effectiveType] || "email_notificacao_geral",
          email: to,
          name: data?.nome || data?.name || "Lead",
          cf_assunto: template.subject,
          cf_tipo_email: effectiveType,
          cf_origem: "send_notification_email",
          cf_data_envio: new Date().toISOString(),
          ...data,
        }
      };

      console.log("[RD-STATION] Payload:", JSON.stringify(rdPayload, null, 2));

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
      console.log("[RD-STATION] Response:", response.status, rdResponse);

      if (response.ok) {
        return new Response(JSON.stringify({ 
          success: true, 
          provider: "rd_station",
          message: "Email enviado via RD Station" 
        }), {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      } else {
        console.error("[RD-STATION] Erro:", rdResponse);
        // Não falha - apenas loga erro, pois a automação do RD vai enviar
      }
    }

    // Fallback para Resend se RD Station não estiver configurado
    if (RESEND_API_KEY) {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: Deno.env.get("RESEND_FROM") || "Prof. Moisés Medeiros <falecom@moisesmedeiros.com.br>",
          to: [to],
          subject: template.subject,
          html: template.html,
        }),
      });

      const emailResponse = await response.json();

      if (!response.ok) {
        console.error("Resend API error:", emailResponse);
        throw new Error(emailResponse.message || "Failed to send email");
      }

      console.log("Email sent via Resend (fallback):", emailResponse);

      return new Response(JSON.stringify({ success: true, provider: "resend", data: emailResponse }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    return new Response(JSON.stringify({ success: true, message: "Email processado via RD Station" }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending email:", error);
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
