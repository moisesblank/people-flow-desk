// ============================================
// MOISÉS MEDEIROS v10.0 - 2FA Email Code
// Sistema de verificação em duas etapas via RESEND
// MIGRADO: 100% Resend
// ============================================

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "https://esm.sh/resend@2.0.0";

import { getCorsHeaders, handleCorsOptions } from "../_shared/corsConfig.ts";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const FROM_EMAIL = Deno.env.get("RESEND_FROM") || "Prof. Moisés Medeiros <noreply@moisesmedeiros.com.br>";

interface Send2FARequest {
  email: string;
  userId: string;
  userName?: string;
  phone?: string;
}

const RATE_LIMIT_WINDOW = 15 * 60 * 1000;
const RATE_LIMIT_MAX = 3;
const CODE_EXPIRATION_MINUTES = 5;

// Template do email 2FA
const get2FAEmailHtml = (code: string, userName: string, expirationMinutes: number) => `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body style="margin:0;padding:0;background:#0a0a0f;color:#ffffff;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#0a0a0f;">
    <tr>
      <td align="center" style="padding:24px;">
        <table role="presentation" width="100%" style="max-width:640px;" cellspacing="0" cellpadding="0">
          <tr>
            <td style="background:linear-gradient(180deg,#131318 0%,#0a0a0f 100%);border-radius:16px;padding:28px;border:1px solid #7D1128;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center" style="padding-bottom:20px;">
                    <h1 style="margin:0;color:#E62B4A;font-size:24px;font-weight:700;">Curso Moisés Medeiros</h1>
                    <p style="margin:8px 0 0;color:#9aa0a6;font-size:13px;">Verificação em Duas Etapas</p>
                  </td>
                </tr>
              </table>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="color:#e6e6e6;line-height:1.7;font-size:14px;">
                    <h2 style="margin:0 0 16px;font-size:18px;color:#ffffff;">Olá, ${userName}!</h2>
                    <p style="margin:0 0 16px;">Seu código de verificação é:</p>
                    <div style="background:#1a1a1f;border-radius:12px;padding:24px;margin:20px 0;text-align:center;">
                      <p style="margin:0;color:#E62B4A;font-size:36px;font-weight:700;letter-spacing:8px;font-family:monospace;">${code}</p>
                    </div>
                    <p style="margin:0 0 12px;color:#ff9500;">⏱️ Este código expira em <strong>${expirationMinutes} minutos</strong>.</p>
                    <p style="margin:0;color:#9aa0a6;font-size:13px;">⚠️ Nunca compartilhe este código com ninguém. Nossa equipe jamais solicitará seu código.</p>
                  </td>
                </tr>
              </table>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr><td style="padding:24px 0 18px;"><hr style="border:none;border-top:1px solid #2a2a2f;margin:0;" /></td></tr>
              </table>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="color:#9aa0a6;font-size:12px;line-height:1.6;">
                    <p style="margin:0 0 8px;"><strong style="color:#e6e6e6;">Prof. Moisés Medeiros Melo</strong></p>
                    <p style="margin:0 0 8px;">MM CURSO DE QUÍMICA LTDA | O curso que mais aprova e comprova!</p>
                    <p style="margin:0;">WhatsApp: <a href="https://wa.me/558396169222" style="color:#E62B4A;text-decoration:none;">+55 83 9616-9222</a></p>
                  </td>
                </tr>
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

const handler = async (req: Request): Promise<Response> => {
  const corsHeaders = getCorsHeaders(req);
  
  if (req.method === "OPTIONS") {
    return handleCorsOptions(req);
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const { email, userId, userName }: Send2FARequest = await req.json();
    
    if (!email || !userId) {
      return new Response(
        JSON.stringify({ error: "Email e userId são obrigatórios" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validar usuário
    const { data: userCheck, error: userCheckError } = await supabaseAdmin.auth.admin.getUserById(userId);
    
    if (userCheckError || !userCheck?.user) {
      console.log("[2FA] ❌ userId inválido:", userId);
      return new Response(
        JSON.stringify({ error: "Usuário não encontrado" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (userCheck.user.email?.toLowerCase() !== email.toLowerCase()) {
      console.log("[2FA] ❌ email não corresponde ao userId");
      return new Response(
        JSON.stringify({ error: "Email inválido" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Rate limiting
    const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW).toISOString();
    const { count } = await supabaseAdmin
      .from("two_factor_codes")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("created_at", windowStart);

    if (count && count >= RATE_LIMIT_MAX) {
      return new Response(
        JSON.stringify({ error: "Muitas tentativas. Aguarde 15 minutos.", retryAfter: 15 * 60 }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Gerar código
    const randomBytes = new Uint8Array(4);
    crypto.getRandomValues(randomBytes);
    const code = (randomBytes[0] * 256 * 256 * 256 + randomBytes[1] * 256 * 256 + randomBytes[2] * 256 + randomBytes[3]) % 900000 + 100000;
    const codeStr = code.toString();
    const expiresAt = new Date(Date.now() + CODE_EXPIRATION_MINUTES * 60 * 1000);

    // Invalidar códigos anteriores
    await supabaseAdmin
      .from("two_factor_codes")
      .update({ verified: true })
      .eq("user_id", userId)
      .eq("verified", false);

    // Inserir novo código
    await supabaseAdmin.from("two_factor_codes").insert({
      user_id: userId,
      code: codeStr,
      expires_at: expiresAt.toISOString(),
      ip_address: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown",
      user_agent: req.headers.get("user-agent")?.substring(0, 255) || "unknown"
    });

    // Enviar via Resend
    const displayName = userName || userCheck.user.user_metadata?.name || "Usuário";
    
    console.log(`[2FA-RESEND] Enviando código para ${email}`);
    
    const response = await resend.emails.send({
      from: FROM_EMAIL,
      to: [email],
      subject: `🔐 [${codeStr}] Código de Verificação - Prof. Moisés Medeiros`,
      html: get2FAEmailHtml(codeStr, displayName, CODE_EXPIRATION_MINUTES),
    });

    if (response.error) {
      console.error("[2FA-RESEND] Erro:", response.error);
      throw new Error(response.error.message);
    }

    console.log(`[2FA-RESEND] ✅ Email enviado! ID: ${response.data?.id}`);

    // Log de atividade
    await supabaseAdmin.from("activity_log").insert({
      user_id: userId,
      action: "2FA_CODE_SENT",
      new_value: { 
        method: "resend",
        email_sent: true,
        sent_at: new Date().toISOString(),
        expires_at: expiresAt.toISOString(),
        expiration_minutes: CODE_EXPIRATION_MINUTES
      }
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Código enviado por email",
        expiresAt: expiresAt.toISOString(),
        expiresIn: CODE_EXPIRATION_MINUTES * 60,
        channels: { email: true, sms: false }
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("[2FA] Erro:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Erro interno do servidor" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
