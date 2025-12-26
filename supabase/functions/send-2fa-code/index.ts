// ============================================
// MOISÉS MEDEIROS v10.0 - 2FA Email Code
// Sistema de verificação em duas etapas seguro
// Com rate limiting e proteção anti-brute-force
// ============================================

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

import { getCorsHeaders, handleCorsOptions } from "../_shared/corsConfig.ts";

interface Send2FARequest {
  email: string;
  userId: string;
  userName?: string;
}

// Rate limiting: máximo 3 códigos por usuário em 15 minutos
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutos
const RATE_LIMIT_MAX = 3;

const handler = async (req: Request): Promise<Response> => {
  // LEI VI: CORS dinâmico via allowlist centralizado
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

    // ========================================
    // 🛡️ LEI VI - AUTENTICAÇÃO JWT OBRIGATÓRIA
    // ========================================
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      console.log("[2FA] ❌ BLOQUEADO: Sem token JWT");
      
      await supabaseAdmin.from("security_events").insert({
        event_type: "2FA_UNAUTHORIZED_ACCESS",
        severity: "critical",
        description: "Tentativa de envio 2FA sem autenticação",
        payload: {
          ip: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown",
          user_agent: req.headers.get("user-agent")?.substring(0, 255)
        }
      });
      
      return new Response(
        JSON.stringify({ error: "Não autorizado" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user) {
      console.log("[2FA] ❌ BLOQUEADO: Token JWT inválido");
      return new Response(
        JSON.stringify({ error: "Token inválido" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { email, userId, userName }: Send2FARequest = await req.json();
    
    // O userId deve corresponder ao usuário autenticado
    if (userId !== user.id) {
      console.log("[2FA] ❌ BLOQUEADO: userId não corresponde ao token");
      
      await supabaseAdmin.from("security_events").insert({
        event_type: "2FA_USER_MISMATCH",
        severity: "critical",
        user_id: user.id,
        description: "Tentativa de enviar 2FA para outro usuário",
        payload: { requested_user_id: userId }
      });
      
      return new Response(
        JSON.stringify({ error: "Não autorizado" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    console.log(`[2FA] ✅ Autenticado: ${user.email} - Iniciando geração de código`);

    if (!email || !userId) {
      return new Response(
        JSON.stringify({ error: "Email e userId são obrigatórios" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validar formato do email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({ error: "Formato de email inválido" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // supabaseAdmin já inicializado acima

    // ========================================
    // RATE LIMITING - Proteção anti-spam
    // ========================================
    const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW).toISOString();
    
    const { count, error: countError } = await supabaseAdmin
      .from("two_factor_codes")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("created_at", windowStart);

    if (countError) {
      console.error("[2FA] Erro ao verificar rate limit:", countError);
    }

    if (count && count >= RATE_LIMIT_MAX) {
      console.log(`[2FA] Rate limit atingido para user: ${userId}`);
      return new Response(
        JSON.stringify({ 
          error: "Muitas tentativas. Aguarde 15 minutos.",
          retryAfter: 15 * 60
        }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ========================================
    // GERAÇÃO DE CÓDIGO CRIPTOGRAFICAMENTE SEGURO
    // ========================================
    const randomBytes = new Uint8Array(4);
    crypto.getRandomValues(randomBytes);
    const code = (randomBytes[0] * 256 * 256 * 256 + randomBytes[1] * 256 * 256 + randomBytes[2] * 256 + randomBytes[3]) % 900000 + 100000;
    const codeStr = code.toString();
    
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
        code: codeStr,
        expires_at: expiresAt.toISOString(),
        ip_address: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("cf-connecting-ip") || "unknown",
        user_agent: req.headers.get("user-agent")?.substring(0, 255) || "unknown"
      });

    if (insertError) {
      console.error("[2FA] Erro ao salvar código:", insertError);
      throw new Error("Erro ao gerar código de verificação");
    }

    // ========================================
    // TEMPLATE DE EMAIL PROFISSIONAL
    // ========================================
    const emailHtml = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Código de Verificação - Prof. Moisés Medeiros</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0a0a0f; font-family: 'Segoe UI', Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0a0a0f; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background: linear-gradient(180deg, #1a1a2e 0%, #0f0f1a 100%); border-radius: 24px; border: 2px solid #7D1128; overflow: hidden;">
          
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, rgba(125, 17, 40, 0.3) 0%, transparent 100%);">
              <div style="margin-bottom: 20px;">
                <span style="font-size: 48px;">🔐</span>
              </div>
              <h1 style="color: #ffffff; font-size: 28px; margin: 0; font-weight: 700;">
                Verificação de Segurança
              </h1>
              <p style="color: rgba(255,255,255,0.6); font-size: 14px; margin: 10px 0 0;">
                Proteção em duas etapas ativada
              </p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <p style="color: #ffffff; font-size: 18px; margin: 0 0 10px;">
                Olá${userName ? `, <strong>${userName}</strong>` : ''}! 👋
              </p>
              
              <p style="color: #a0a0a0; font-size: 16px; line-height: 1.6; margin: 0 0 30px;">
                Detectamos uma tentativa de acesso à sua conta. Para confirmar sua identidade, 
                use o código abaixo:
              </p>

              <!-- Código Principal -->
              <div style="background: linear-gradient(135deg, #7D1128 0%, #B91C3C 50%, #7D1128 100%); border-radius: 16px; padding: 35px; text-align: center; margin: 0 0 25px; box-shadow: 0 10px 40px rgba(125, 17, 40, 0.4);">
                <p style="color: rgba(255,255,255,0.8); font-size: 11px; margin: 0 0 15px; text-transform: uppercase; letter-spacing: 3px; font-weight: 600;">
                  Seu código de verificação
                </p>
                <div style="font-size: 48px; font-weight: 800; color: #ffffff; letter-spacing: 16px; font-family: 'Courier New', monospace; text-shadow: 0 2px 10px rgba(0,0,0,0.3);">
                  ${codeStr}
                </div>
              </div>

              <!-- Timer -->
              <div style="background: linear-gradient(90deg, rgba(251, 191, 36, 0.15) 0%, rgba(251, 191, 36, 0.05) 100%); border: 1px solid rgba(251, 191, 36, 0.4); border-radius: 12px; padding: 16px 20px; margin: 0 0 30px;">
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td width="40" valign="middle">
                      <span style="font-size: 24px;">⏱️</span>
                    </td>
                    <td valign="middle">
                      <p style="color: #fbbf24; font-size: 15px; margin: 0; font-weight: 600;">
                        Este código expira em <strong>10 minutos</strong>
                      </p>
                    </td>
                  </tr>
                </table>
              </div>

              <!-- Segurança Info -->
              <div style="background: rgba(255,255,255,0.05); border-radius: 12px; padding: 20px; margin: 0 0 20px;">
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td width="40" valign="top">
                      <span style="font-size: 20px;">🛡️</span>
                    </td>
                    <td valign="top">
                      <p style="color: #ffffff; font-size: 14px; margin: 0 0 8px; font-weight: 600;">
                        Dica de Segurança
                      </p>
                      <p style="color: #888888; font-size: 13px; margin: 0; line-height: 1.5;">
                        Nunca compartilhe este código com ninguém. Nossa equipe <strong>jamais</strong> 
                        solicitará esse código por telefone, WhatsApp ou qualquer outro meio.
                      </p>
                    </td>
                  </tr>
                </table>
              </div>

              <p style="color: #666666; font-size: 13px; line-height: 1.6; margin: 0; text-align: center;">
                Se você não solicitou este código, ignore este email.<br>
                Sua conta permanece segura.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; background: rgba(0,0,0,0.4); border-top: 1px solid rgba(125, 17, 40, 0.3);">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <p style="color: #888888; font-size: 13px; margin: 0 0 8px; font-weight: 600;">
                      Prof. Moisés Medeiros Melo
                    </p>
                    <p style="color: #666666; font-size: 12px; margin: 0 0 12px;">
                      MM CURSO DE QUÍMICA LTDA<br>
                      <em>O curso que mais aprova e comprova!</em>
                    </p>
                    <a href="https://www.moisesmedeiros.com.br" style="color: #7D1128; font-size: 12px; text-decoration: none;">
                      www.moisesmedeiros.com.br
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>

        <!-- Sub-footer -->
        <table width="600" cellpadding="0" cellspacing="0" style="margin-top: 20px;">
          <tr>
            <td align="center">
              <p style="color: #444444; font-size: 11px; margin: 0;">
                Este é um email automático. Por favor, não responda.
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
      subject: `🔐 [${codeStr}] Código de Verificação - Prof. Moisés Medeiros`,
      html: emailHtml,
    });

    console.log(`[2FA] Email enviado para ${email}:`, emailResponse);

    // Log de atividade
    await supabaseAdmin
      .from("activity_log")
      .insert({
        user_id: userId,
        action: "2FA_CODE_SENT",
        new_value: { 
          method: "email", 
          sent_at: new Date().toISOString(),
          expires_at: expiresAt.toISOString()
        }
      });

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Código enviado com sucesso",
        expiresAt: expiresAt.toISOString(),
        expiresIn: 600 // 10 minutos em segundos
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
