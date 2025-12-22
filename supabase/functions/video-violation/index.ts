// ============================================
// 🛡️ VIDEO VIOLATION - EDGE FUNCTION (SANCTUM 2.0)
// REGRA DE OURO: DETECÇÃO ≠ PUNIÇÃO
// Backend calcula score e retorna ação gradual
// Autor: MESTRE (Claude Opus 4.5 PHD)
// ============================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-session-token",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// 🛡️ SANCTUM: Roles imunes que NUNCA são punidas
const IMMUNE_ROLES = ['owner', 'admin', 'funcionario', 'suporte', 'coordenacao'];

// 🛡️ SANCTUM: Severidade REDUZIDA (mais tolerante)
const VIOLATION_SEVERITY: Record<string, number> = {
  // Muito baixa (1) - Apenas log
  "context_menu": 1,
  "drag_attempt": 1,
  "copy_attempt": 1,
  "visibility_abuse": 1,
  
  // Baixa (2-3) - Log + score
  "keyboard_shortcut": 2,
  "expired_token": 2,
  
  // Média (4-5) - Log + score + possível aviso
  "devtools_open": 3, // Reduzido de 5 para 3
  "screenshot_attempt": 3,
  "iframe_manipulation": 4,
  
  // Alta (6-8) - Ações mais sérias, mas ainda graduais
  "multiple_sessions": 5,
  "screen_recording": 6,
  
  // Crítica (9-10) - Somente fraude confirmada
  "invalid_domain": 8,
  "network_tampering": 9,
  
  "unknown": 1, // Desconhecido = assume baixo
};

// 🛡️ SANCTUM: Thresholds para ações graduais
const ACTION_THRESHOLDS = {
  warn: 10,      // Score >= 10: apenas aviso no log
  degrade: 30,   // Score >= 30: degradação leve (blur)
  pause: 50,     // Score >= 50: pausar vídeo
  reauth: 100,   // Score >= 100: pedir re-autenticação
  revoke: 200,   // Score >= 200: revogar sessão (raro)
};

// Determina ação baseada no score acumulado
function determineAction(totalScore: number): string {
  if (totalScore >= ACTION_THRESHOLDS.revoke) return 'revoke';
  if (totalScore >= ACTION_THRESHOLDS.reauth) return 'reauth';
  if (totalScore >= ACTION_THRESHOLDS.pause) return 'pause';
  if (totalScore >= ACTION_THRESHOLDS.degrade) return 'degrade';
  if (totalScore >= ACTION_THRESHOLDS.warn) return 'warn';
  return 'none'; // Score baixo = nenhuma ação
}

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

    // 🛡️ SANCTUM: Verificar se usuário é imune
    const userRole = body.details?.user_role || null;
    const isImmune = body.details?.is_immune === true || 
                     (userRole && IMMUNE_ROLES.includes(userRole));
    
    // 🛡️ SANCTUM: Se imune, apenas log, nenhuma ação
    if (isImmune) {
      console.log("🛡️ SANCTUM: Violação de usuário imune, apenas log", {
        type: body.violation_type,
        role: userRole,
      });
      
      return new Response(
        JSON.stringify({
          success: true,
          logged: true,
          action: 'none',
          sessionRevoked: false,
          riskScore: 0,
          instructions: { action: 'none' },
          sanctum_bypass: true,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 🛡️ SANCTUM: Respeitar action_requested do frontend
    const actionRequested = body.details?.action_requested || 'auto';
    
    // Determinar severidade
    const severity = VIOLATION_SEVERITY[body.violation_type] || 1;

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
      // 🛡️ SANCTUM: Falha no registro NÃO deve afetar o usuário
      return new Response(
        JSON.stringify({ 
          success: true, // Retorna sucesso para não impactar UX
          logged: false,
          action: 'none',
          instructions: { action: 'none' },
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 🛡️ SANCTUM: Se frontend pediu apenas log, respeitar
    if (actionRequested === 'log_only' || actionRequested === 'score_only') {
      return new Response(
        JSON.stringify({
          success: true,
          logged: true,
          action: 'none',
          sessionRevoked: false,
          riskScore: result?.new_risk_score || 0,
          instructions: { action: 'none' },
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 🛡️ SANCTUM: Determinar ação baseada no score ACUMULADO
    const totalScore = result?.new_risk_score || 0;
    const action = determineAction(totalScore);
    const shouldRevoke = action === 'revoke' && result?.session_revoked === true;

    // Resposta com ação gradual
    return new Response(
      JSON.stringify({
        success: true,
        logged: true,
        action_taken: action,
        sessionRevoked: shouldRevoke,
        riskScore: totalScore,
        // 🛡️ SANCTUM: Instruções graduais para o frontend
        instructions: {
          action: action,
          pauseVideo: action === 'pause',
          showWarning: action === 'warn' || action === 'degrade',
          requireReauthorization: action === 'reauth',
          message: action === 'revoke' 
            ? "Sessão encerrada. Recarregue a página."
            : action === 'reauth'
            ? "Por favor, confirme sua identidade."
            : action === 'pause'
            ? "Atividade incomum detectada."
            : action === 'degrade'
            ? "Qualidade pode ser afetada."
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
