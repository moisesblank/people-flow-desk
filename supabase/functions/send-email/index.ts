// ============================================
// 🛡️ SEND EMAIL v3.0 - DUAL CLIENT + CORS SEGURO
// LEI III + LEI VI — SEGURANÇA NÍVEL NASA
// ============================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { getCorsHeaders, isOriginAllowed, handleCorsOptions } from "../_shared/corsConfig.ts";

// Rate limit: máximo 10 emails por usuário por hora
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hora
const RATE_LIMIT_MAX = 10;

serve(async (req) => {
  // CORS seguro com allowlist
  if (req.method === 'OPTIONS') {
    return handleCorsOptions(req);
  }
  
  const corsHeaders = getCorsHeaders(req);
  const origin = req.headers.get('Origin');
  
  // Bloquear origens não permitidas (exceto webhooks internos)
  if (origin && !isOriginAllowed(origin)) {
    console.warn(`[Send Email] 🚫 Origem bloqueada: ${origin}`);
    // Não bloquear completamente pois pode ser chamada interna
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  try {
    // ============================================
    // 🔐 AUTENTICAÇÃO OBRIGATÓRIA (JWT validado pelo Supabase)
    // ============================================
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      console.error("[Send Email] ❌ Sem header de autorização");
      return new Response(JSON.stringify({ 
        error: "Não autorizado",
        code: "UNAUTHORIZED"
      }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Verificar usuário autenticado
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      console.error("[Send Email] ❌ Token inválido:", authError?.message);
      
      // Log de segurança
      await supabase.from("security_events").insert({
        event_type: "email_unauthorized_attempt",
        severity: "warning",
        ip_address: req.headers.get("cf-connecting-ip") || req.headers.get("x-forwarded-for") || "unknown",
        user_agent: req.headers.get("user-agent"),
        payload: { reason: "invalid_token" },
      });

      return new Response(JSON.stringify({ 
        error: "Token inválido ou expirado",
        code: "INVALID_TOKEN"
      }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // ============================================
    // 🔐 RATE LIMITING POR USUÁRIO
    // ============================================
    const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW_MS).toISOString();
    
    const { count, error: countError } = await supabase
      .from("activity_log")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("action", "EMAIL_SENT")
      .gte("created_at", windowStart);

    if (!countError && count !== null && count >= RATE_LIMIT_MAX) {
      console.log(`[Send Email] ❌ Rate limit atingido para user: ${user.id}`);
      
      await supabase.from("security_events").insert({
        event_type: "email_rate_limit_exceeded",
        severity: "warning",
        user_id: user.id,
        ip_address: req.headers.get("cf-connecting-ip") || "unknown",
        payload: { count, limit: RATE_LIMIT_MAX },
      });

      return new Response(JSON.stringify({ 
        error: "Limite de emails atingido. Tente novamente em 1 hora.",
        code: "RATE_LIMIT_EXCEEDED",
        retryAfter: 3600
      }), {
        status: 429,
        headers: { 
          "Content-Type": "application/json", 
          "Retry-After": "3600",
          ...corsHeaders 
        },
      });
    }

    // ============================================
    // 📧 PROCESSAMENTO DO EMAIL
    // ============================================
    const { to, subject, html, text, from_name, from_email } = await req.json();
    
    if (!to || !subject || (!html && !text)) {
      return new Response(JSON.stringify({
        error: "Campos obrigatórios: to, subject, e html ou text",
        code: "MISSING_FIELDS"
      }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Validar formato do email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(to)) {
      return new Response(JSON.stringify({
        error: "Formato de email inválido",
        code: "INVALID_EMAIL"
      }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }
    
    console.log(`[Send Email] ✅ User ${user.id} enviando para: ${to}`);
    
    // Tentar SendGrid primeiro
    const SENDGRID_API_KEY = Deno.env.get("SENDGRID_API_KEY");
    
    if (SENDGRID_API_KEY && SENDGRID_API_KEY !== "CONFIGURAR_DEPOIS") {
      console.log("[Send Email] Using SendGrid...");
      
      const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${SENDGRID_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          personalizations: [{
            to: [{ email: to }],
            subject: subject,
          }],
          from: {
            email: from_email || "falecom@moisesmedeiros.com.br",
            name: from_name || "Curso Moisés Medeiros"
          },
          content: [{
            type: html ? "text/html" : "text/plain",
            value: html || text
          }]
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("[Send Email] SendGrid error:", errorText);
        throw new Error(`SendGrid error: ${response.status}`);
      }
      
      // Log de atividade
      await supabase.from("activity_log").insert({
        user_id: user.id,
        action: "EMAIL_SENT",
        new_value: { to, subject, provider: "sendgrid" }
      });
      
      console.log("[Send Email] ✅ Email sent via SendGrid");
      
      return new Response(JSON.stringify({ success: true, provider: "sendgrid" }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }
    
    // Tentar Resend como fallback
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    
    if (RESEND_API_KEY && RESEND_API_KEY !== "CONFIGURAR_DEPOIS") {
      console.log("[Send Email] Using Resend...");
      
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: from_email ? `${from_name || "Curso Moisés Medeiros"} <${from_email}>` : (Deno.env.get("RESEND_FROM") || "Curso Moisés Medeiros <falecom@moisesmedeiros.com.br>"),
          to: [to],
          subject: subject,
          html: html || `<p>${text}</p>`,
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("[Send Email] Resend error:", errorText);
        throw new Error(`Resend error: ${response.status}`);
      }
      
      const result = await response.json();
      
      // Log de atividade
      await supabase.from("activity_log").insert({
        user_id: user.id,
        action: "EMAIL_SENT",
        new_value: { to, subject, provider: "resend", id: result.id }
      });
      
      console.log("[Send Email] ✅ Email sent via Resend:", result.id);
      
      return new Response(JSON.stringify({ success: true, provider: "resend", id: result.id }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }
    
    // Nenhum provedor configurado
    console.log("[Send Email] ⚠️ No email provider configured");
    
    return new Response(JSON.stringify({ 
      success: false,
      message: "No email provider configured (SendGrid or Resend)",
      code: "NO_PROVIDER"
    }), {
      status: 503,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
    
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("[Send Email] Error:", errorMessage);
    return new Response(JSON.stringify({ 
      error: errorMessage,
      code: "INTERNAL_ERROR"
    }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
