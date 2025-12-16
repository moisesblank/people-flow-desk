// ============================================
// MOISÉS MEDEIROS v7.0 - 2FA Email Code
// Envia código de verificação por email
// ============================================

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Send2FARequest {
  email: string;
  userId: string;
  userName?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, userId, userName }: Send2FARequest = await req.json();
    
    console.log(`[2FA] Gerando código para: ${email}`);

    if (!email || !userId) {
      return new Response(
        JSON.stringify({ error: "Email e userId são obrigatórios" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Criar cliente Supabase admin
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Gerar código de 6 dígitos
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Expiração: 10 minutos
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    // Invalidar códigos anteriores não usados
    await supabaseAdmin
      .from("two_factor_codes")
      .update({ verified: true })
      .eq("user_id", userId)
      .eq("verified", false);

    // Inserir novo código
    const { error: insertError } = await supabaseAdmin
      .from("two_factor_codes")
      .insert({
        user_id: userId,
        code: code,
        expires_at: expiresAt.toISOString(),
        ip_address: req.headers.get("x-forwarded-for") || "unknown",
        user_agent: req.headers.get("user-agent") || "unknown"
      });

    if (insertError) {
      console.error("[2FA] Erro ao salvar código:", insertError);
      throw new Error("Erro ao gerar código de verificação");
    }

    // Template do email
    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Código de Verificação</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0a0a0f; font-family: Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0a0a0f; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background: linear-gradient(180deg, #1a1a2e 0%, #0f0f1a 100%); border-radius: 16px; border: 1px solid #7D1128;">
          
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center; border-bottom: 1px solid rgba(125, 17, 40, 0.3);">
              <div style="display: inline-block; background: linear-gradient(135deg, #7D1128 0%, #DC2626 100%); padding: 12px 24px; border-radius: 50px;">
                <span style="color: white; font-size: 14px; font-weight: bold; letter-spacing: 2px;">🔐 VERIFICAÇÃO 2FA</span>
              </div>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <h1 style="color: #ffffff; font-size: 28px; margin: 0 0 20px; text-align: center;">
                Olá${userName ? `, ${userName}` : ''}! 👋
              </h1>
              
              <p style="color: #a0a0a0; font-size: 16px; line-height: 1.6; margin: 0 0 30px; text-align: center;">
                Recebemos uma solicitação de acesso à sua conta. Use o código abaixo para verificar sua identidade:
              </p>

              <!-- Código -->
              <div style="background: linear-gradient(135deg, #7D1128 0%, #DC2626 100%); border-radius: 12px; padding: 30px; text-align: center; margin: 0 0 30px;">
                <p style="color: rgba(255,255,255,0.7); font-size: 12px; margin: 0 0 10px; text-transform: uppercase; letter-spacing: 2px;">
                  Seu código de verificação
                </p>
                <div style="font-size: 42px; font-weight: bold; color: #ffffff; letter-spacing: 12px; font-family: 'Courier New', monospace;">
                  ${code}
                </div>
              </div>

              <div style="background: rgba(251, 191, 36, 0.1); border: 1px solid rgba(251, 191, 36, 0.3); border-radius: 8px; padding: 16px; margin: 0 0 30px;">
                <p style="color: #fbbf24; font-size: 14px; margin: 0; text-align: center;">
                  ⏱️ Este código expira em <strong>10 minutos</strong>
                </p>
              </div>

              <p style="color: #666666; font-size: 14px; line-height: 1.6; margin: 0; text-align: center;">
                Se você não solicitou este código, ignore este email. Sua conta permanece segura.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; background: rgba(0,0,0,0.3); border-top: 1px solid rgba(125, 17, 40, 0.3); border-radius: 0 0 16px 16px;">
              <p style="color: #666666; font-size: 12px; margin: 0; text-align: center;">
                Prof. Moisés Medeiros Melo<br>
                MM CURSO DE QUÍMICA LTDA | O curso que mais aprova e comprova!<br>
                <a href="https://www.moisesmedeiros.com.br" style="color: #7D1128;">www.moisesmedeiros.com.br</a>
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

    // Enviar email
    const emailResponse = await resend.emails.send({
      from: "Moisés Medeiros <onboarding@resend.dev>",
      to: [email],
      subject: `🔐 Código de Verificação: ${code}`,
      html: emailHtml,
    });

    console.log(`[2FA] Email enviado para ${email}:`, emailResponse);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Código enviado com sucesso",
        expiresAt: expiresAt.toISOString()
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("[2FA] Erro:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Erro interno" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
