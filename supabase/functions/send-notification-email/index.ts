import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  to: string;
  subject: string;
  html?: string;
  type: "welcome" | "sale" | "reminder" | "custom";
  data?: Record<string, any>;
}

const getEmailTemplate = (type: string, data: Record<string, any> = {}) => {
  const templates: Record<string, { subject: string; html: string }> = {
    welcome: {
      subject: "Bem-vindo ao Curso de Química! 🧪",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #8B5CF6, #06B6D4); padding: 30px; border-radius: 10px; text-align: center;">
            <h1 style="color: white; margin: 0;">Bem-vindo, ${data.nome || 'Aluno'}! 🎉</h1>
          </div>
          <div style="padding: 20px; background: #f9fafb; border-radius: 0 0 10px 10px;">
            <p style="font-size: 16px; color: #374151;">
              Parabéns por se juntar à família de estudantes do Professor Moisés Medeiros!
            </p>
            <p style="font-size: 16px; color: #374151;">
              Sua jornada rumo à aprovação começa agora. Acesse a plataforma e comece seus estudos.
            </p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="https://moisesmedeiros.com.br" style="background: #8B5CF6; color: white; padding: 15px 30px; border-radius: 8px; text-decoration: none; font-weight: bold;">
                Acessar Plataforma
              </a>
            </div>
            <p style="font-size: 14px; color: #6b7280; text-align: center;">
              Dúvidas? Responda este email ou acesse nosso suporte.
            </p>
          </div>
        </div>
      `,
    },
    sale: {
      subject: "Nova Venda Realizada! 💰",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #10B981, #3B82F6); padding: 30px; border-radius: 10px; text-align: center;">
            <h1 style="color: white; margin: 0;">Nova Venda! 🎯</h1>
          </div>
          <div style="padding: 20px; background: #f9fafb; border-radius: 0 0 10px 10px;">
            <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              <h3 style="margin: 0 0 10px 0; color: #374151;">Detalhes da Venda:</h3>
              <p style="margin: 5px 0; color: #6b7280;"><strong>Produto:</strong> ${data.produto || 'Curso'}</p>
              <p style="margin: 5px 0; color: #6b7280;"><strong>Valor:</strong> R$ ${data.valor || '0,00'}</p>
              <p style="margin: 5px 0; color: #6b7280;"><strong>Comprador:</strong> ${data.comprador || 'N/A'}</p>
              <p style="margin: 5px 0; color: #6b7280;"><strong>Email:</strong> ${data.email || 'N/A'}</p>
            </div>
            <p style="font-size: 14px; color: #6b7280; text-align: center;">
              Acesse o dashboard para mais detalhes.
            </p>
          </div>
        </div>
      `,
    },
    reminder: {
      subject: "Lembrete: Você tem uma tarefa pendente! ⏰",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #F59E0B, #EF4444); padding: 30px; border-radius: 10px; text-align: center;">
            <h1 style="color: white; margin: 0;">Lembrete! ⏰</h1>
          </div>
          <div style="padding: 20px; background: #f9fafb; border-radius: 0 0 10px 10px;">
            <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              <h3 style="margin: 0 0 10px 0; color: #374151;">${data.titulo || 'Tarefa Pendente'}</h3>
              <p style="margin: 5px 0; color: #6b7280;">${data.descricao || ''}</p>
              <p style="margin: 15px 0 0 0; color: #EF4444; font-weight: bold;">
                📅 Data: ${data.data || 'Hoje'} ${data.hora ? `às ${data.hora}` : ''}
              </p>
            </div>
            <div style="text-align: center; margin: 20px 0;">
              <a href="https://moisesmedeiros.com.br/calendario" style="background: #F59E0B; color: white; padding: 12px 25px; border-radius: 8px; text-decoration: none; font-weight: bold;">
                Ver Calendário
              </a>
            </div>
          </div>
        </div>
      `,
    },
    custom: {
      subject: data.subject || "Notificação do Sistema",
      html: data.html || `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #8B5CF6, #06B6D4); padding: 30px; border-radius: 10px; text-align: center;">
            <h1 style="color: white; margin: 0;">${data.titulo || 'Notificação'}</h1>
          </div>
          <div style="padding: 20px; background: #f9fafb; border-radius: 0 0 10px 10px;">
            <p style="font-size: 16px; color: #374151;">${data.mensagem || ''}</p>
          </div>
        </div>
      `,
    },
  };

  return templates[type] || templates.custom;
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY not configured");
    }

    const { to, subject, html, type, data }: EmailRequest = await req.json();

    console.log(`Sending ${type} email to: ${to}`);

    const template = type !== "custom" ? getEmailTemplate(type, data) : { subject, html };

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Prof. Moisés Medeiros <noreply@moisesmedeiros.com.br>",
        to: [to],
        subject: template.subject || subject,
        html: template.html || html,
      }),
    });

    const emailResponse = await response.json();

    if (!response.ok) {
      console.error("Resend API error:", emailResponse);
      throw new Error(emailResponse.message || "Failed to send email");
    }

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, data: emailResponse }), {
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
