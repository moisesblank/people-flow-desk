import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  to: string;
  studentName: string;
  subject: string;
  body: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verificar autenticação
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ success: false, error: "Não autorizado" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Criar cliente Supabase para verificar usuário
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verificar se o usuário é admin/owner
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(JSON.stringify({ success: false, error: "Token inválido" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Verificar role
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .in("role", ["owner", "admin"])
      .maybeSingle();

    if (!roleData) {
      return new Response(JSON.stringify({ success: false, error: "Permissão negada" }), {
        status: 403,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const { to, studentName, subject, body }: EmailRequest = await req.json();

    if (!to || !subject || !body) {
      return new Response(JSON.stringify({ success: false, error: "Dados incompletos" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Obter configuração
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const fromEmail = Deno.env.get("RESEND_FROM") || "noreply@pro.moisesmedeiros.com.br";

    if (!resendApiKey) {
      return new Response(JSON.stringify({ success: false, error: "RESEND_API_KEY não configurada" }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    console.log(`[send-student-email] Enviando para: ${to}, Assunto: ${subject}`);

    // Gerar HTML do email com layout profissional
    const emailHtml = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0a0a0f; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0a0a0f; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 16px; overflow: hidden; border: 1px solid rgba(59, 130, 246, 0.2);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(90deg, #3b82f6 0%, #2563eb 100%); padding: 30px 40px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700;">
                ⚡ Prof. Moisés Medeiros
              </h1>
              <p style="margin: 8px 0 0 0; color: rgba(255,255,255,0.8); font-size: 14px;">
                Plataforma de Ensino de Química
              </p>
            </td>
          </tr>
          
          <!-- Greeting -->
          <tr>
            <td style="padding: 40px 40px 20px 40px;">
              <p style="margin: 0; color: #e2e8f0; font-size: 16px;">
                Olá, <strong style="color: #3b82f6;">${studentName || 'Aluno(a)'}</strong>!
              </p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 0 40px 40px 40px;">
              <div style="background: rgba(59, 130, 246, 0.1); border-left: 4px solid #3b82f6; padding: 20px; border-radius: 8px;">
                <p style="margin: 0; color: #e2e8f0; font-size: 15px; line-height: 1.7; white-space: pre-wrap;">${body}</p>
              </div>
            </td>
          </tr>
          
          <!-- CTA -->
          <tr>
            <td style="padding: 0 40px 40px 40px; text-align: center;">
              <a href="https://pro.moisesmedeiros.com.br/auth" style="display: inline-block; background: linear-gradient(90deg, #3b82f6 0%, #2563eb 100%); color: #ffffff; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px;">
                Acessar Plataforma →
              </a>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background: rgba(0,0,0,0.3); padding: 24px 40px; border-top: 1px solid rgba(59, 130, 246, 0.2);">
              <p style="margin: 0 0 8px 0; color: #94a3b8; font-size: 13px; text-align: center;">
                Este email foi enviado pela equipe do Prof. Moisés Medeiros.
              </p>
              <p style="margin: 0; color: #64748b; font-size: 12px; text-align: center;">
                © ${new Date().getFullYear()} Prof. Moisés Medeiros - Todos os direitos reservados
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    // Enviar via Resend API diretamente
    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: `Prof. Moisés Medeiros <${fromEmail}>`,
        to: [to],
        subject: subject,
        html: emailHtml,
      }),
    });

    const emailData = await resendResponse.json();

    if (!resendResponse.ok) {
      console.error("[send-student-email] ❌ Erro Resend:", emailData);
      throw new Error(emailData.message || "Erro ao enviar email");
    }

    console.log("[send-student-email] ✅ Email enviado:", emailData);

    // Registrar no activity log
    await supabase.from("activity_log").insert({
      action: "email_sent_to_student",
      user_id: user.id,
      user_email: user.email,
      new_value: { to, subject, sentAt: new Date().toISOString() },
    });

    return new Response(JSON.stringify({ success: true, data: emailData }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("[send-student-email] ❌ Erro:", error);
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
