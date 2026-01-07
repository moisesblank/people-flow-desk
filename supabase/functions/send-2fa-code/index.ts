// ============================================
// MOISÉS MEDEIROS v10.0 - 2FA Email + SMS + WhatsApp
// Sistema de verificação em duas etapas multicanal
// RESEND (Email) + Twilio (SMS) + WhatsApp Business API
// ============================================

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

import { getCorsHeaders, handleCorsOptions } from "../_shared/corsConfig.ts";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const FROM_EMAIL = Deno.env.get("RESEND_FROM") || "Prof. Moisés Medeiros <noreply@moisesmedeiros.com.br>";

// WhatsApp Business API
const WHATSAPP_ACCESS_TOKEN = Deno.env.get("WHATSAPP_ACCESS_TOKEN");
const WHATSAPP_PHONE_NUMBER_ID = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID");

// Twilio SMS
const TWILIO_ACCOUNT_SID = Deno.env.get("TWILIO_ACCOUNT_SID");
const TWILIO_AUTH_TOKEN = Deno.env.get("TWILIO_AUTH_TOKEN");
const TWILIO_PHONE_NUMBER = Deno.env.get("TWILIO_PHONE_NUMBER");

interface Send2FARequest {
  email: string;
  userId: string;
  userName?: string;
  phone?: string;
  channel: "email" | "sms" | "whatsapp"; // Canal escolhido pelo usuário
}

const RATE_LIMIT_WINDOW = 15 * 60 * 1000;
const RATE_LIMIT_MAX = 5;
const CODE_EXPIRATION_MINUTES = 5;

// ============================================
// TEMPLATE EMAIL 2FA
// ============================================
const get2FAEmailHtml = (code: string, userName: string, expirationMinutes: number) => `
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
                  <p style="margin:8px 0 0;color:#9aa0a6;font-size:13px;">Verificação em Duas Etapas</p>
                </td></tr>
              </table>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr><td style="color:#e6e6e6;line-height:1.7;font-size:14px;">
                  <h2 style="margin:0 0 16px;font-size:18px;color:#ffffff;">Olá, ${userName}!</h2>
                  <p style="margin:0 0 16px;">Seu código de verificação é:</p>
                  <div style="background:#1a1a1f;border-radius:12px;padding:24px;margin:20px 0;text-align:center;">
                    <p style="margin:0;color:#E62B4A;font-size:36px;font-weight:700;letter-spacing:8px;font-family:monospace;">${code}</p>
                  </div>
                  <p style="margin:0 0 12px;color:#ff9500;">⏱️ Este código expira em <strong>${expirationMinutes} minutos</strong>.</p>
                  <p style="margin:0;color:#9aa0a6;font-size:13px;">⚠️ Nunca compartilhe este código. Nossa equipe jamais solicitará seu código.</p>
                </td></tr>
              </table>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr><td style="padding:24px 0 18px;"><hr style="border:none;border-top:1px solid #2a2a2f;margin:0;" /></td></tr>
              </table>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr><td style="color:#9aa0a6;font-size:12px;line-height:1.6;">
                  <p style="margin:0 0 8px;"><strong style="color:#e6e6e6;">Prof. Moisés Medeiros Melo</strong></p>
                  <p style="margin:0;">MM CURSO DE QUÍMICA LTDA</p>
                </td></tr>
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

// ============================================
// ENVIAR VIA WHATSAPP BUSINESS API
// ============================================
async function sendViaWhatsApp(
  phone: string,
  code: string,
  userName: string
): Promise<{ success: boolean; error?: string }> {
  if (!WHATSAPP_ACCESS_TOKEN || !WHATSAPP_PHONE_NUMBER_ID) {
    console.error("[2FA-WHATSAPP] Credenciais não configuradas");
    return { success: false, error: "WhatsApp não configurado" };
  }

  // Formatar telefone (remover caracteres especiais)
  let formattedPhone = phone.replace(/\D/g, '');
  
  // Se não começa com código do país, adicionar Brasil (55)
  if (!formattedPhone.startsWith('55') && formattedPhone.length >= 10) {
    formattedPhone = `55${formattedPhone}`;
  }

  // 🔒 VALIDAÇÃO: Telefone brasileiro deve ter 12-13 dígitos (55 + DDD 2 + número 8-9)
  const phoneDigits = formattedPhone.length;
  if (phoneDigits < 12 || phoneDigits > 13) {
    console.error(`[2FA-WHATSAPP] ❌ Telefone inválido: ${formattedPhone} (${phoneDigits} dígitos, esperado 12-13)`);
    return { 
      success: false, 
      error: `Telefone incompleto ou inválido (${phoneDigits} dígitos). Verifique se o número está completo no cadastro.` 
    };
  }

  console.log(`[2FA-WHATSAPP] Enviando para: ${formattedPhone} (${phoneDigits} dígitos)`);

  try {
    // Usar template de mensagem (recomendado pela Meta para 2FA)
    // Se não tiver template aprovado, usar mensagem de texto simples
    const messagePayload = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: formattedPhone,
      type: "text",
      text: {
        preview_url: false,
        body: `🔐 *Curso Moisés Medeiros*\n\nOlá, ${userName}!\n\nSeu código de verificação é:\n\n*${code}*\n\n⏱️ Expira em ${CODE_EXPIRATION_MINUTES} minutos.\n\n⚠️ Nunca compartilhe este código.`
      }
    };

    const response = await fetch(
      `https://graph.facebook.com/v18.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(messagePayload),
      }
    );

    const result = await response.json();

    if (!response.ok) {
      console.error("[2FA-WHATSAPP] Erro da API:", result);
      return { 
        success: false, 
        error: result.error?.message || "Erro ao enviar WhatsApp" 
      };
    }

    console.log(`[2FA-WHATSAPP] ✅ Mensagem enviada! ID: ${result.messages?.[0]?.id}`);
    return { success: true };

  } catch (error: any) {
    console.error("[2FA-WHATSAPP] Erro:", error);
    return { success: false, error: error.message };
  }
}

// ============================================
// ENVIAR VIA TWILIO (SMS)
// ============================================
async function sendViaSMS(
  phone: string,
  code: string,
  userName: string
): Promise<{ success: boolean; error?: string }> {
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE_NUMBER) {
    console.error("[2FA-SMS] Credenciais Twilio não configuradas");
    return { success: false, error: "SMS não configurado" };
  }

  // Formatar telefone (remover caracteres especiais)
  let formattedPhone = phone.replace(/\D/g, '');
  
  // Se não começa com código do país, adicionar Brasil (55)
  if (!formattedPhone.startsWith('55') && formattedPhone.length >= 10) {
    formattedPhone = `55${formattedPhone}`;
  }
  
  // 🔒 VALIDAÇÃO: Telefone brasileiro deve ter 12-13 dígitos (55 + DDD 2 + número 8-9)
  // Formato: 55 + 83 + 99635409 (8 dígitos) OU 55 + 83 + 996354099 (9 dígitos com nono dígito)
  const phoneDigits = formattedPhone.length;
  if (phoneDigits < 12 || phoneDigits > 13) {
    console.error(`[2FA-SMS] ❌ Telefone inválido: ${formattedPhone} (${phoneDigits} dígitos, esperado 12-13)`);
    return { 
      success: false, 
      error: `Telefone incompleto ou inválido (${phoneDigits} dígitos). Verifique se o número está completo no cadastro.` 
    };
  }
  
  // Adicionar + no início
  formattedPhone = `+${formattedPhone}`;

  console.log(`[2FA-SMS] Enviando para: ${formattedPhone} (${phoneDigits} dígitos)`);

  try {
    const credentials = btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`);
    
    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`,
      {
        method: "POST",
        headers: {
          "Authorization": `Basic ${credentials}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          To: formattedPhone,
          From: TWILIO_PHONE_NUMBER,
          Body: `🔐 Curso Moisés Medeiros\n\nOlá, ${userName}!\n\nSeu código de verificação é: ${code}\n\n⏱️ Expira em ${CODE_EXPIRATION_MINUTES} min.\n\n⚠️ Nunca compartilhe.`
        }),
      }
    );

    const result = await response.json();

    if (!response.ok || result.error_code) {
      console.error("[2FA-SMS] Erro da API Twilio:", result);
      return { 
        success: false, 
        error: result.message || "Erro ao enviar SMS" 
      };
    }

    console.log(`[2FA-SMS] ✅ SMS enviado! SID: ${result.sid}`);
    return { success: true };

  } catch (error: any) {
    console.error("[2FA-SMS] Erro:", error);
    return { success: false, error: error.message };
  }
}

// ============================================
// ENVIAR VIA RESEND (EMAIL)
// ============================================
async function sendViaEmail(
  email: string,
  code: string,
  userName: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await resend.emails.send({
      from: FROM_EMAIL,
      to: [email],
      subject: `🔐 [${code}] Código de Verificação - Prof. Moisés Medeiros`,
      html: get2FAEmailHtml(code, userName, CODE_EXPIRATION_MINUTES),
    });

    if (response.error) {
      console.error("[2FA-EMAIL] Erro:", response.error);
      return { success: false, error: response.error.message };
    }

    console.log(`[2FA-EMAIL] ✅ Email enviado! ID: ${response.data?.id}`);
    return { success: true };

  } catch (error: any) {
    console.error("[2FA-EMAIL] Erro:", error);
    return { success: false, error: error.message };
  }
}

// ============================================
// HANDLER PRINCIPAL
// ============================================
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

    const { email, userId, userName, phone, channel = "email" }: Send2FARequest = await req.json();
    
    if (!email || !userId) {
      return new Response(
        JSON.stringify({ error: "Email e userId são obrigatórios" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validar canal
    if (channel === "whatsapp" && !phone) {
      return new Response(
        JSON.stringify({ error: "Telefone é obrigatório para WhatsApp" }),
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

    // Log forense: pedido de envio (independente do resultado)
    // Ajuda a provar se o client realmente chamou a função.
    await supabaseAdmin.from("activity_log").insert({
      user_id: userId,
      action: "2FA_SEND_REQUESTED",
      new_value: {
        channel_requested: channel,
        has_phone_in_payload: Boolean(phone),
        has_whatsapp_creds: Boolean(WHATSAPP_ACCESS_TOKEN && WHATSAPP_PHONE_NUMBER_ID),
        has_twilio_creds: Boolean(TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN && TWILIO_PHONE_NUMBER),
        has_resend_creds: Boolean(Deno.env.get("RESEND_API_KEY") && FROM_EMAIL),
      },
    });

    // Buscar telefone do perfil se não foi fornecido
    let userPhone = phone;
    if (!userPhone && (channel === "whatsapp" || channel === "sms")) {
      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("phone")
        .eq("id", userId)
        .single();

      userPhone = profile?.phone;
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

    // Enviar pelo canal escolhido
    const displayName = userName || userCheck.user.user_metadata?.name || "Usuário";
    let result: { success: boolean; error?: string };
    let channelUsed = channel;

    console.log(`[2FA] Enviando via ${channel} para ${channel === "email" ? email : userPhone}`);

    // ============================================
    // LÓGICA DE ENVIO COM FALLBACK
    // Prioridade: Canal escolhido → SMS → Email
    // ============================================
    if (channel === "whatsapp" && userPhone) {
      result = await sendViaWhatsApp(userPhone, codeStr, displayName);
      
      // Fallback para SMS se WhatsApp falhar
      if (!result.success) {
        console.log("[2FA] WhatsApp falhou, tentando SMS...");
        result = await sendViaSMS(userPhone, codeStr, displayName);
        channelUsed = "sms";
        
        // Fallback final para email se SMS também falhar
        if (!result.success) {
          console.log("[2FA] SMS falhou, tentando email...");
          result = await sendViaEmail(email, codeStr, displayName);
          channelUsed = "email";
        }
      }
    } else if (channel === "sms" && userPhone) {
      result = await sendViaSMS(userPhone, codeStr, displayName);
      
      // Fallback para email se SMS falhar
      if (!result.success) {
        console.log("[2FA] SMS falhou, tentando email...");
        result = await sendViaEmail(email, codeStr, displayName);
        channelUsed = "email";
      }
    } else {
      result = await sendViaEmail(email, codeStr, displayName);
    }

    if (!result.success) {
      console.error("[2FA] ❌ Falha ao enviar código:", result.error);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Erro ao enviar código de verificação. Tente novamente.",
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Log de atividade
    await supabaseAdmin.from("activity_log").insert({
      user_id: userId,
      action: "2FA_CODE_SENT",
      new_value: { 
        channel: channelUsed,
        sent_at: new Date().toISOString(),
        expires_at: expiresAt.toISOString(),
        expiration_minutes: CODE_EXPIRATION_MINUTES
      }
    });

    const channelLabels: Record<string, string> = {
      email: "Código enviado por email",
      sms: "Código enviado por SMS",
      whatsapp: "Código enviado por WhatsApp"
    };

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: channelLabels[channelUsed] || "Código enviado",
        expiresAt: expiresAt.toISOString(),
        expiresIn: CODE_EXPIRATION_MINUTES * 60,
        channel: channelUsed,
        channels: { 
          email: channelUsed === "email", 
          sms: channelUsed === "sms",
          whatsapp: channelUsed === "whatsapp" 
        }
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
