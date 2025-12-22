// ============================================
// 🔥 VIDEO VIOLATION - EDGE FUNCTION
// Registra violações de segurança e toma ações
// Autor: MESTRE (Claude Opus 4.5 PHD)
// ============================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-session-token",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Mapeamento de tipos de violação para severidade
const VIOLATION_SEVERITY: Record<string, number> = {
  // Baixa severidade (1-3)
  "context_menu": 1,
  "keyboard_shortcut": 2,
  "drag_attempt": 1,
  "copy_attempt": 2,
  "visibility_abuse": 2,
  
  // Média severidade (4-6)
  "devtools_open": 5,
  "screenshot_attempt": 4,
  "iframe_manipulation": 5,
  
  // Alta severidade (7-10)
  "screen_recording": 8,
  "multiple_sessions": 6,
  "invalid_domain": 9,
  "expired_token": 3,
  "network_tampering": 9,
  
  // Desconhecido
  "unknown": 3,
};

interface ViolationRequest {
  session_token: string;
  violation_type: string;
  details?: Record<string, unknown>;
  key_pressed?: string;
  element_targeted?: string;
  timestamp?: string;
}

serve(async (req) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({ error: "METHOD_NOT_ALLOWED" }),
        { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Criar cliente Supabase
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Parse request
    const body: ViolationRequest = await req.json();
    
    const sessionToken = body.session_token || req.headers.get("x-session-token");
    
    if (!sessionToken) {
      return new Response(
        JSON.stringify({ error: "MISSING_SESSION_TOKEN" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!body.violation_type) {
      return new Response(
        JSON.stringify({ error: "MISSING_VIOLATION_TYPE" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Determinar severidade
    const severity = VIOLATION_SEVERITY[body.violation_type] || 3;

    // Extrair informações da requisição
    const ipAddress = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
                     req.headers.get("x-real-ip") ||
                     null;
    const userAgent = req.headers.get("user-agent") || null;

    // Registrar violação via RPC
    const { data: result, error } = await supabase.rpc("register_video_violation", {
      p_session_token: sessionToken,
      p_violation_type: body.violation_type,
      p_severity: severity,
      p_details: body.details ? JSON.stringify(body.details) : null,
      p_key_pressed: body.key_pressed || null,
      p_ip_address: ipAddress,
      p_user_agent: userAgent,
    });

    if (error) {
      console.error("Violation registration error:", error);
      // Não falhar silenciosamente - log importante
      return new Response(
        JSON.stringify({ 
          error: "VIOLATION_REGISTRATION_FAILED",
          logged: false,
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!result.success) {
      return new Response(
        JSON.stringify({ 
          error: result.error,
          logged: false,
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Resposta com ação a ser tomada pelo frontend
    return new Response(
      JSON.stringify({
        success: true,
        logged: true,
        action: result.action_taken, // 'warned', 'paused', 'revoked'
        sessionRevoked: result.session_revoked,
        riskScore: result.new_risk_score,
        // Instruções para o frontend
        instructions: {
          pauseVideo: result.action_taken === 'paused' || result.action_taken === 'revoked',
          showWarning: result.action_taken === 'warned',
          requireReauthorization: result.session_revoked,
          message: result.session_revoked 
            ? "Sessão encerrada por violação de segurança. Recarregue a página."
            : result.action_taken === 'paused'
            ? "Atividade suspeita detectada. O vídeo foi pausado."
            : null,
        },
      }),
      { 
        status: 200, 
        headers: { 
          ...corsHeaders, 
          "Content-Type": "application/json",
        } 
      }
    );

  } catch (error) {
    console.error("Violation handler error:", error);
    return new Response(
      JSON.stringify({ error: "INTERNAL_ERROR", logged: false }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
