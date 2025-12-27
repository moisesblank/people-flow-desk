// ============================================
// 🔥🛡️ VIDEO VIOLATION OMEGA v5.0 🛡️🔥
// EDGE FUNCTION DEFINITIVA — SANCTUM 2.0
// ============================================
// ✅ Resposta GRADUAL (não punitiva)
// ✅ Bypass para roles imunes
// ✅ Cálculo inteligente de risk score
// ✅ Backend decide ações
// ✅ Logging completo sem bloqueio
// ============================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ============================================
// CONFIGURAÇÃO SANCTUM
// ============================================
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const SANCTUM_VERSION = "2.0-OMEGA";

// ============================================
// CORS — ALLOWLIST (LEI VI COMPLIANCE)
// MONO-DOMÍNIO v2.0: gestao.* descontinuado
// ============================================
const ALLOWED_ORIGINS = [
  'https://pro.moisesmedeiros.com.br',
  'https://moisesmedeiros.com.br',
  'https://www.moisesmedeiros.com.br',
  'http://localhost:3000',
  'http://localhost:5173',
];

const ALLOWED_ORIGIN_PATTERNS = [
  /^https:\/\/[a-z0-9-]+\.lovable\.app$/,
  /^https:\/\/[a-z0-9-]+\.lovable\.dev$/,
];

function isOriginAllowed(origin: string | null): boolean {
  if (!origin) return false;
  if (ALLOWED_ORIGINS.includes(origin)) return true;
  return ALLOWED_ORIGIN_PATTERNS.some(p => p.test(origin));
}

function getCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get('Origin');
  const allowed = isOriginAllowed(origin);
  return {
    "Access-Control-Allow-Origin": allowed && origin ? origin : "null",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-session-token",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Credentials": allowed ? "true" : "false",
    "Content-Type": "application/json",
    "Vary": "Origin",
  };
}

// ============================================
// RATE LIMITING + DEDUPE (ANTI-SPAM/DoS)
// ============================================
const rateLimitCache = new Map<string, { count: number; resetAt: number; lastHash: string }>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX = 50; // Video violations mais permissivo

async function hashForRateLimit(str: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("").slice(0, 16);
}

function checkRateLimitAndDedupe(key: string, hash: string): { allowed: boolean; reason?: string } {
  const now = Date.now();
  const entry = rateLimitCache.get(key);
  
  if (!entry || now > entry.resetAt) {
    rateLimitCache.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS, lastHash: hash });
    return { allowed: true };
  }
  
  if (entry.lastHash === hash) return { allowed: false, reason: 'DUPLICATE' };
  if (entry.count >= RATE_LIMIT_MAX) return { allowed: false, reason: 'RATE_LIMIT' };
  
  entry.count++;
  entry.lastHash = hash;
  return { allowed: true };
}

// Roles completamente imunes — NUNCA sofrem ação punitiva
const IMMUNE_ROLES = [
  'owner', 'admin', 'funcionario', 'suporte', 
  'coordenacao', 'employee', 'monitoria',
];

// Severidade por tipo (SANCTUM 2.0 — valores BAIXOS)
const VIOLATION_SEVERITY: Record<string, number> = {
  context_menu: 1,
  drag_attempt: 1,
  copy_attempt: 1,
  visibility_abuse: 1,
  keyboard_shortcut: 2,
  devtools_open: 3,
  screenshot_attempt: 3,
  iframe_manipulation: 4,
  multiple_sessions: 5,
  screen_recording: 6,
  invalid_domain: 8,
  network_tampering: 9,
  unknown: 1,
};

// Thresholds para ações (SANCTUM 2.0 — valores ALTOS = mais tolerância)
const ACTION_THRESHOLDS = {
  none: 0,
  warn: 50,
  degrade: 100,
  pause: 200,
  reauth: 400,
  revoke: 800,
};

const SCORE_MULTIPLIER = 3;

// ============================================
// TIPOS
// ============================================
interface ViolationRequest {
  session_token: string;
  violation_type: string;
  details?: Record<string, unknown>;
}

// ============================================
// FUNÇÕES AUXILIARES
// ============================================

function determineAction(riskScore: number, severity: number): string {
  // Lógica mais tolerante do SANCTUM 2.0
  if (riskScore >= ACTION_THRESHOLDS.revoke && severity >= 8) {
    return "revoke";
  }
  if (riskScore >= ACTION_THRESHOLDS.reauth) {
    return "reauth";
  }
  if (riskScore >= ACTION_THRESHOLDS.pause) {
    return "pause";
  }
  if (riskScore >= ACTION_THRESHOLDS.degrade) {
    return "degrade";
  }
  if (riskScore >= ACTION_THRESHOLDS.warn) {
    return "warn";
  }
  return "none";
}

// ============================================
// HANDLER PRINCIPAL
// ============================================
serve(async (req: Request) => {
  const CORS_HEADERS = getCorsHeaders(req);
  
  // CORS preflight
  if (req.method === "OPTIONS") {
    const origin = req.headers.get('Origin');
    if (!isOriginAllowed(origin)) {
      console.warn(`[CORS BLOCKED] Origin: ${origin}`);
      return new Response("Forbidden", { status: 403 });
    }
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  // Bloquear Origin: null
  const origin = req.headers.get('Origin');
  if (origin === 'null') {
    return new Response(
      JSON.stringify({ success: false, error: "Invalid origin" }),
      { status: 403, headers: CORS_HEADERS }
    );
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ success: false, error: "Método não permitido" }),
      { status: 405, headers: CORS_HEADERS }
    );
  }

  const startTime = Date.now();

  try {
    // ============================================
    // 1. PARSE DO BODY
    // ============================================
    const body: ViolationRequest = await req.json();
    const { session_token, violation_type, details = {} } = body;

    if (!session_token) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "session_token é obrigatório",
          code: "MISSING_TOKEN",
        }),
        { status: 400, headers: CORS_HEADERS }
      );
    }

    // ============================================
    // 1.5 RATE LIMIT + DEDUPE
    // ============================================
    const violationHash = await hashForRateLimit(`${session_token}|${violation_type}`);
    const rateLimitResult = checkRateLimitAndDedupe(session_token.slice(0, 16), violationHash);
    
    if (!rateLimitResult.allowed) {
      console.warn(`[RATE LIMIT] ${rateLimitResult.reason} for session: ${session_token.slice(0,8)}...`);
      return new Response(
        JSON.stringify({
          success: true,
          riskScore: 0,
          instructions: { action: "none", rateLimited: true, reason: rateLimitResult.reason },
        }),
        { status: 200, headers: CORS_HEADERS }
      );
    }

    // Cliente admin
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
      auth: { persistSession: false },
    });

    // ============================================
    // 2. BUSCAR SESSÃO
    // ============================================
    const { data: session, error: sessionError } = await supabase
      .from("video_play_sessions")
      .select(`
        id,
        user_id,
        session_code,
        revoked_at,
        sanctum_immune
      `)
      .eq("session_token", session_token)
      .is("ended_at", null)
      .maybeSingle();

    if (sessionError || !session) {
      // Sessão não encontrada — NÃO é erro crítico, apenas ignora
      console.warn("⚠️ Sessão não encontrada (ignorando violação)");
      return new Response(
        JSON.stringify({
          success: true,
          action: "none",
          riskScore: 0,
          message: "Sessão não encontrada",
        }),
        { status: 200, headers: CORS_HEADERS }
      );
    }

    // ============================================
    // 3. VERIFICAR IMUNIDADE
    // ============================================
    // Checar se sessão foi marcada como imune
    const isSessionImmune = session.sanctum_immune === true;
    
    // Checar role do usuário
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", session.user_id)
      .maybeSingle();

    const userRole = profile?.role || details.user_role as string || null;
    const isRoleImmune = IMMUNE_ROLES.includes(userRole as string);
    const isImmune = isSessionImmune || isRoleImmune || details.is_immune === true;
    const isRelaxed = details.is_relaxed === true;

    console.log(`🛡️ SANCTUM ${SANCTUM_VERSION} | Violação:`, {
      type: violation_type,
      sessionCode: session.session_code,
      isImmune,
      isRelaxed,
      userRole,
    });

    // ============================================
    // 4. BUSCAR OU CRIAR RISK SCORE (usando nomes corretos das colunas)
    // ============================================
    const { data: riskData } = await supabase
      .from("video_user_risk_scores")
      .select("total_risk_score, total_violations")
      .eq("user_id", session.user_id)
      .maybeSingle();

    let currentScore = riskData?.total_risk_score || 0;
    let violationCount = riskData?.total_violations || 0;

    // ============================================
    // 5. PROCESSAR VIOLAÇÃO
    // ============================================
    const severity = VIOLATION_SEVERITY[violation_type] || 1;
    let action = "none";
    let newScore = currentScore;
    let scoreIncrement = 0;

    if (isImmune) {
      // ✅ SANCTUM: Imunes NÃO acumulam score, NÃO sofrem ação
      action = "none";
      scoreIncrement = 0;
      newScore = currentScore; // Mantém score anterior

      console.log(`✅ SANCTUM: Usuário IMUNE — apenas log`, { userRole });

    } else if (isRelaxed) {
      // 🟡 SANCTUM: Relaxados acumulam score menor, ações leves
      scoreIncrement = Math.floor(severity * SCORE_MULTIPLIER * 0.3);
      newScore = currentScore + scoreIncrement;
      
      // Relaxados no máximo recebem "warn"
      if (newScore >= ACTION_THRESHOLDS.warn) {
        action = "warn";
      }

      console.log(`🟡 SANCTUM: Usuário RELAXADO — score reduzido`, { scoreIncrement });

    } else {
      // 🔴 NORMAL: Calcula score e ação normalmente
      scoreIncrement = severity * SCORE_MULTIPLIER;
      newScore = currentScore + scoreIncrement;
      action = determineAction(newScore, severity);

      console.log(`🔴 SANCTUM: Processando normalmente`, { 
        scoreIncrement, 
        newScore, 
        action 
      });
    }

    // ============================================
    // 6. ATUALIZAR SCORE (SE NÃO IMUNE) - usando nomes corretos
    // ============================================
    if (!isImmune && scoreIncrement > 0) {
      try {
        await supabase
          .from("video_user_risk_scores")
          .upsert({
            user_id: session.user_id,
            total_risk_score: newScore,
            total_violations: violationCount + 1,
            last_violation_at: new Date().toISOString(),
            current_risk_level: newScore >= 200 ? 'critical' : newScore >= 100 ? 'high' : newScore >= 50 ? 'medium' : 'low',
          }, { 
            onConflict: "user_id" 
          });
      } catch (e) { console.error("Score update error:", e); }
    }

    // ============================================
    // 7. LOG DA VIOLAÇÃO (SEMPRE, MESMO IMUNES)
    // ============================================
    try {
      await supabase
        .from("video_violations")
        .insert({
          session_id: session.id,
          user_id: session.user_id,
          violation_type,
          severity,
          details: {
            ...details,
            sanctum_version: SANCTUM_VERSION,
            is_immune: isImmune,
            is_relaxed: isRelaxed,
            user_role: userRole,
            score_before: currentScore,
            score_after: newScore,
            score_increment: scoreIncrement,
            action_taken: action,
            bypassed: isImmune,
          },
          action_taken: isImmune ? "bypassed" : action,
          risk_score_at_time: newScore,
        });
    } catch (e) { console.error("Violation log error:", e); }

    // ============================================
    // 8. EXECUTAR AÇÃO SEVERA (SE NECESSÁRIO)
    // ============================================
    if (action === "revoke" && !isImmune) {
      try {
        await supabase
          .from("video_play_sessions")
          .update({
            revoked_at: new Date().toISOString(),
            revoke_reason: `VIOLATION:${violation_type}`,
          })
          .eq("id", session.id);

        console.log(`🚨 SANCTUM: Sessão REVOGADA`, { 
          sessionCode: session.session_code,
          riskScore: newScore,
        });
      } catch (e) { console.error("Session revoke error:", e); }
    }

    // ============================================
    // 9. RESPOSTA
    // ============================================
    return new Response(
      JSON.stringify({
        success: true,
        riskScore: newScore,
        violationCount: violationCount + (isImmune ? 0 : 1),
        instructions: {
          action,
          thresholds: ACTION_THRESHOLDS,
          currentLevel: action,
          isImmune,
          isRelaxed,
          message: isImmune 
            ? "Violation logged (immune user)" 
            : `Action: ${action}`,
        },
        sanctum: {
          version: SANCTUM_VERSION,
          processed: !isImmune,
          bypassed: isImmune,
        },
        latencyMs: Date.now() - startTime,
      }),
      { status: 200, headers: CORS_HEADERS }
    );

  } catch (error) {
    console.error("❌ Erro não tratado:", error);

    // SANCTUM: Mesmo em erro, retornamos sucesso para não bloquear UX
    return new Response(
      JSON.stringify({
        success: true,
        riskScore: 0,
        instructions: {
          action: "none",
          message: "Error processing, no action taken",
        },
        error: error instanceof Error ? error.message : "Unknown",
      }),
      { status: 200, headers: CORS_HEADERS }
    );
  }
});
