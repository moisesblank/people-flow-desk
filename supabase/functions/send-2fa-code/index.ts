// ============================================
// MOISÉS MEDEIROS v10.0 - 2FA Email + SMS Code
// Sistema de verificação em duas etapas via RD STATION
// MIGRADO: 100% RD Station (Email + SMS)
// ATUALIZADO: Expiração 5 minutos
// ============================================

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

import { getCorsHeaders, handleCorsOptions } from "../_shared/corsConfig.ts";

interface Send2FARequest {
  email: string;
  userId: string;
  userName?: string;
  phone?: string; // Telefone para SMS
}

// Rate limiting: máximo 3 códigos por usuário em 15 minutos
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutos
const RATE_LIMIT_MAX = 3;

// Nova expiração: 5 minutos
const CODE_EXPIRATION_MINUTES = 5;

// Função para enviar via RD Station (Email + SMS)
async function sendViaRDStation(
  email: string,
  phone: string | undefined,
  code: string,
  userName: string
): Promise<{ success: boolean; emailSent: boolean; smsSent: boolean; error?: string }> {
  const rdApiKey = Deno.env.get("RD_STATION_API_KEY");
  
  if (!rdApiKey) {
    console.error("[2FA-RD] RD_STATION_API_KEY não configurada");
    return { success: false, emailSent: false, smsSent: false, error: "RD Station API key não configurada" };
  }

  let emailSent = false;
  let smsSent = false;

  // Formatar telefone para SMS (remover caracteres especiais e adicionar DDI se necessário)
  const formattedPhone = phone ? formatPhoneForSMS(phone) : null;

  // Payload comum para ambos (email e SMS)
  const basePayload = {
    event_type: "CONVERSION",
    event_family: "CDP",
    payload: {
      conversion_identifier: "codigo_2fa_autenticacao",
      email: email,
      name: userName || "Usuário",
      mobile_phone: formattedPhone,
      cf_codigo_2fa: code,
      cf_expiracao_minutos: CODE_EXPIRATION_MINUTES.toString(),
      cf_data_solicitacao: new Date().toISOString(),
      cf_origem: "sistema_2fa_plataforma",
      cf_tipo_envio: formattedPhone ? "email_sms" : "email_only",
      cf_plataforma: "pro.moisesmedeiros.com.br",
      cf_assunto_email: `🔐 [${code}] Código de Verificação - Prof. Moisés Medeiros`,
      cf_mensagem_sms: `[Prof. Moises] Seu codigo de verificacao: ${code} - Expira em ${CODE_EXPIRATION_MINUTES} min. NAO compartilhe!`,
    }
  };

  try {
    console.log(`[2FA-RD] Enviando código ${code} para ${email}${formattedPhone ? ` e SMS para ${formattedPhone}` : ''}`);
    console.log(`[2FA-RD] Payload:`, JSON.stringify(basePayload, null, 2));

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    const response = await fetch(
      `https://api.rd.services/platform/conversions?api_key=${rdApiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify(basePayload),
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);

    let responseBody = "";
    try {
      responseBody = await response.text();
    } catch (e) {
      responseBody = "Não foi possível ler resposta";
    }

    console.log(`[2FA-RD] Response status: ${response.status}`);
    console.log(`[2FA-RD] Response body: ${responseBody}`);

    if (response.ok || response.status === 200) {
      emailSent = true;
      smsSent = !!formattedPhone; // SMS só é considerado enviado se tinha telefone
      
      console.log(`[2FA-RD] ✅ Conversão criada com sucesso - Email: ${emailSent}, SMS: ${smsSent}`);
      
      return { 
        success: true, 
        emailSent, 
        smsSent,
      };
    } else {
      console.error(`[2FA-RD] ❌ Erro ao criar conversão: ${response.status} - ${responseBody}`);
      return { 
        success: false, 
        emailSent: false, 
        smsSent: false, 
        error: `RD Station retornou ${response.status}: ${responseBody}` 
      };
    }
  } catch (error) {
    console.error("[2FA-RD] Erro ao enviar:", error);
    return { 
      success: false, 
      emailSent: false, 
      smsSent: false, 
      error: error instanceof Error ? error.message : "Erro desconhecido" 
    };
  }
}

// Função para formatar telefone para SMS
function formatPhoneForSMS(phone: string): string | null {
  if (!phone) return null;
  
  // Remover todos os caracteres não numéricos
  const numbersOnly = phone.replace(/\D/g, '');
  
  // Validar que tem pelo menos 10 dígitos (DDD + número)
  if (numbersOnly.length < 10) return null;
  
  // Se já começa com 55 (Brasil), retornar como está
  if (numbersOnly.startsWith('55') && numbersOnly.length >= 12) {
    return numbersOnly;
  }
  
  // Se começa com 0, remover
  const withoutZero = numbersOnly.startsWith('0') ? numbersOnly.substring(1) : numbersOnly;
  
  // Adicionar DDI do Brasil se não tiver
  if (withoutZero.length >= 10 && withoutZero.length <= 11) {
    return `55${withoutZero}`;
  }
  
  return numbersOnly;
}

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
    // 🛡️ LEI VI - VALIDAÇÃO INTERNA (2FA pré-login)
    // O JWT pode não estar disponível durante 2FA
    // Validamos via userId + email + rate limiting
    // ========================================
    const { email, userId, userName, phone }: Send2FARequest = await req.json();
    
    if (!email || !userId) {
      return new Response(
        JSON.stringify({ error: "Email e userId são obrigatórios" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validar que o userId corresponde a um usuário real
    const { data: userCheck, error: userCheckError } = await supabaseAdmin.auth.admin.getUserById(userId);
    
    if (userCheckError || !userCheck?.user) {
      console.log("[2FA] ❌ BLOQUEADO: userId inválido:", userId);
      
      await supabaseAdmin.from("security_events").insert({
        event_type: "2FA_INVALID_USER",
        severity: "warning",
        description: "Tentativa de 2FA com userId inválido",
        payload: {
          userId,
          ip: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown"
        }
      });
      
      return new Response(
        JSON.stringify({ error: "Usuário não encontrado" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validar que o email corresponde ao usuário
    if (userCheck.user.email?.toLowerCase() !== email.toLowerCase()) {
      console.log("[2FA] ❌ BLOQUEADO: email não corresponde ao userId");
      
      await supabaseAdmin.from("security_events").insert({
        event_type: "2FA_EMAIL_MISMATCH",
        severity: "critical",
        user_id: userId,
        description: "Email não corresponde ao userId",
        payload: { provided_email: email, user_email: userCheck.user.email }
      });
      
      return new Response(
        JSON.stringify({ error: "Email inválido" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    console.log(`[2FA] ✅ Usuário validado: ${email} - Iniciando geração de código`);

    // Buscar telefone do usuário se não foi fornecido
    let userPhone = phone;
    if (!userPhone) {
      // Tentar buscar do perfil
      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("phone")
        .eq("id", userId)
        .single();
      
      if (profile?.phone) {
        userPhone = profile.phone;
        console.log(`[2FA] Telefone encontrado no perfil: ${userPhone}`);
      }
      
      // Tentar buscar das configurações MFA
      if (!userPhone) {
        const { data: mfaSettings } = await supabaseAdmin
          .from("user_mfa_settings")
          .select("phone_number")
          .eq("user_id", userId)
          .single();
        
        if (mfaSettings?.phone_number) {
          userPhone = mfaSettings.phone_number;
          console.log(`[2FA] Telefone encontrado nas configurações MFA: ${userPhone}`);
        }
      }
    }

    // Validar formato do email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({ error: "Formato de email inválido" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

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
    
    // Expiração: 5 minutos (ATUALIZADO)
    const expiresAt = new Date(Date.now() + CODE_EXPIRATION_MINUTES * 60 * 1000);

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
    // ENVIAR VIA RD STATION (EMAIL + SMS)
    // ========================================
    const rdResult = await sendViaRDStation(
      email,
      userPhone,
      codeStr,
      userName || userCheck.user.user_metadata?.name || "Usuário"
    );

    console.log(`[2FA] RD Station result:`, rdResult);

    // Log de atividade
    await supabaseAdmin
      .from("activity_log")
      .insert({
        user_id: userId,
        action: "2FA_CODE_SENT",
        new_value: { 
          method: "rd_station",
          email_sent: rdResult.emailSent,
          sms_sent: rdResult.smsSent,
          phone_used: userPhone ? formatPhoneForSMS(userPhone) : null,
          sent_at: new Date().toISOString(),
          expires_at: expiresAt.toISOString(),
          expiration_minutes: CODE_EXPIRATION_MINUTES,
          success: rdResult.success
        }
      });

    // Determinar mensagem de retorno
    let message = "Código enviado";
    if (rdResult.emailSent && rdResult.smsSent) {
      message = "Código enviado por email e SMS";
    } else if (rdResult.emailSent) {
      message = "Código enviado por email";
    } else if (rdResult.smsSent) {
      message = "Código enviado por SMS";
    }

    if (!rdResult.success) {
      console.error("[2FA] ❌ Falha ao enviar código via RD Station:", rdResult.error);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Erro ao enviar código de verificação. Tente novamente.",
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message,
        expiresAt: expiresAt.toISOString(),
        expiresIn: CODE_EXPIRATION_MINUTES * 60, // Em segundos
        channels: {
          email: rdResult.emailSent,
          sms: rdResult.smsSent
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
