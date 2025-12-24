// ============================================
// 🌌🔥 SANCTUM REPORT VIOLATION — EDGE FUNCTION NÍVEL NASA 🔥🌌
// ANO 2300 — RECEPÇÃO SEGURA DE VIOLAÇÕES
// ESTE É O PROJETO DA VIDA DO MESTRE MOISÉS MEDEIROS
// ============================================
//
// 📍 MAPA DE URLs DEFINITIVO:
//   🌐 NÃO PAGANTE: pro.moisesmedeiros.com.br/ + /comunidade
//   👨‍🎓 ALUNO BETA: pro.moisesmedeiros.com.br/alunos (PAGANTE)
//   👔 FUNCIONÁRIO: gestao.moisesmedeiros.com.br/gestao
//   👑 OWNER: TODAS (moisesblank@gmail.com = MASTER - IMUNE)
//
// ============================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ============================================
// CONSTANTES
// ============================================
const OWNER_EMAIL = "moisesblank@gmail.com";

// ============================================
// CORS — ALLOWLIST (LEI VI COMPLIANCE)
// ============================================
const ALLOWED_ORIGINS = [
  'https://gestao.moisesmedeiros.com.br',
  'https://pro.moisesmedeiros.com.br',
  'https://moisesmedeiros.com.br',
  'https://www.moisesmedeiros.com.br',
  'http://localhost:3000',
  'http://localhost:5173',
];

const ALLOWED_ORIGIN_PATTERNS = [
  /^https:\/\/[a-z0-9-]+\.lovable\.app$/,
  /^https:\/\/[a-z0-9-]+\.lovable\.dev$/,
  /^https:\/\/[a-z0-9-]+--[a-z0-9-]+\.lovable\.app$/,
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
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Credentials": allowed ? "true" : "false",
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
    "Vary": "Origin",
  };
}

// ============================================
// RATE LIMITING + DEDUPE (ANTI-SPAM/DoS)
// ============================================
const rateLimitCache = new Map<string, { count: number; resetAt: number; lastHash: string }>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minuto
const RATE_LIMIT_MAX = 30; // 30 violações por minuto por IP

function checkRateLimitAndDedupe(ipHash: string, violationHash: string): { allowed: boolean; reason?: string } {
  const now = Date.now();
  const key = ipHash;
  
  const entry = rateLimitCache.get(key);
  
  if (!entry || now > entry.resetAt) {
    // Nova janela
    rateLimitCache.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS, lastHash: violationHash });
    return { allowed: true };
  }
  
  // Dedupe: mesma violação em sequência
  if (entry.lastHash === violationHash) {
    return { allowed: false, reason: 'DUPLICATE' };
  }
  
  // Rate limit
  if (entry.count >= RATE_LIMIT_MAX) {
    return { allowed: false, reason: 'RATE_LIMIT' };
  }
  
  entry.count++;
  entry.lastHash = violationHash;
  return { allowed: true };
}

// Limpar cache periodicamente
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitCache.entries()) {
    if (now > entry.resetAt) {
      rateLimitCache.delete(key);
    }
  }
}, 60000);

// ============================================
// TIPOS
// ============================================
interface ViolationPayload {
  violationType: string;
  severity: number;
  assetId?: string;
  metadata?: Record<string, unknown>;
}

interface ViolationResponse {
  success: boolean;
  locked: boolean;
  immune?: boolean;
  violationType?: string;
  severity?: number;
  error?: string;
  rateLimited?: boolean;
}

// ============================================
// UTILITÁRIOS
// ============================================
async function hashString(str: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("").slice(0, 32);
}

// ============================================
// FUNÇÃO PRINCIPAL
// ============================================
serve(async (req: Request) => {
  const corsHeaders = getCorsHeaders(req);
  
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    const origin = req.headers.get('Origin');
    if (!isOriginAllowed(origin)) {
      console.warn(`[CORS BLOCKED] Origin: ${origin}`);
      return new Response("Forbidden", { status: 403 });
    }
    return new Response("ok", { headers: corsHeaders });
  }

  // Bloquear Origin: null (potencial ataque)
  const origin = req.headers.get('Origin');
  if (origin === 'null') {
    console.warn('[SECURITY] Blocked null origin request');
    return new Response(
      JSON.stringify({ success: false, error: "Invalid origin" }),
      { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Apenas POST
  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ success: false, error: "Método não permitido" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    // ============================================
    // 0) RATE LIMIT CHECK (antes de processar)
    // ============================================
    const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() 
                   || req.headers.get("cf-connecting-ip") 
                   || "unknown";
    const ipHash = await hashString(clientIp + "sanctum-salt-2300");
    
    // ============================================
    // 1) PARSE DO BODY
    // ============================================
    let payload: ViolationPayload;
    try {
      payload = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ success: false, error: "JSON inválido" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Hash único para dedupe
    const violationHash = await hashString(`${payload.violationType}|${payload.assetId || ''}|${ipHash}`);
    
    // Verificar rate limit e dedupe
    const rateLimitResult = checkRateLimitAndDedupe(ipHash, violationHash);
    if (!rateLimitResult.allowed) {
      console.warn(`[RATE LIMIT] ${rateLimitResult.reason} for IP hash: ${ipHash.slice(0,8)}...`);
      return new Response(
        JSON.stringify({ 
          success: true, // Retornamos success para não quebrar UX
          locked: false, 
          rateLimited: true,
          reason: rateLimitResult.reason 
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { violationType, severity = 10, assetId, metadata = {} } = payload;

    if (!violationType) {
      return new Response(
        JSON.stringify({ success: false, error: "violationType obrigatório" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ============================================
    // 2) AUTENTICAÇÃO (opcional - pode ser anônimo)
    // ============================================
    const authHeader = req.headers.get("Authorization");
    let userId: string | null = null;
    let userEmail: string | null = null;

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.replace("Bearer ", "");
      const { data: { user } } = await supabase.auth.getUser(token);
      
      if (user) {
        userId = user.id;
        userEmail = user.email || null;
      }
    }

    // ============================================
    // 3) OWNER BYPASS (IMUNIDADE TOTAL)
    // ============================================
    if (userEmail?.toLowerCase() === OWNER_EMAIL) {
      const response: ViolationResponse = {
        success: true,
        locked: false,
        immune: true,
      };
      
      return new Response(
        JSON.stringify(response),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ============================================
    // 4) USER-AGENT HASH (PRIVACIDADE) - IP já calculado acima
    // ============================================
    const userAgent = req.headers.get("user-agent") || "unknown";
    const uaHash = await hashString(userAgent + "sanctum-salt-2300");

    // ============================================
    // 5) EXTRAIR CONTEXTO
    // ============================================
    const domain = req.headers.get("host") || req.headers.get("origin") || "";
    const route = req.headers.get("referer") || "";

    // ============================================
    // 6) CHAMAR FUNÇÃO DE REGISTRO
    // ============================================
    const { data: result, error: rpcError } = await supabase.rpc(
      "fn_register_sanctum_violation",
      {
        p_user_id: userId,
        p_user_email: userEmail,
        p_violation_type: violationType,
        p_severity: severity,
        p_asset_id: assetId || null,
        p_domain: domain,
        p_route: route,
        p_ip_hash: ipHash,
        p_ua_hash: uaHash,
        p_metadata: {
          ...metadata,
          timestamp: new Date().toISOString(),
          clientIpPartial: clientIp.split(".").slice(0, 2).join(".") + ".*.*",
        },
      }
    );

    if (rpcError) {
      console.error("[Sanctum Violation] Erro RPC:", rpcError);
      
      // Mesmo com erro, não bloquear o usuário - log para investigação
      return new Response(
        JSON.stringify({ success: false, locked: false, error: "Erro interno" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ============================================
    // 7) RESPOSTA
    // ============================================
    const response: ViolationResponse = {
      success: true,
      locked: result?.locked || false,
      violationType,
      severity,
    };

    // Status code baseado no lock
    const statusCode = result?.locked ? 423 : 200;

    return new Response(
      JSON.stringify(response),
      {
        status: statusCode,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
          "X-Sanctum-Version": "3.0-omega",
        },
      }
    );

  } catch (err) {
    console.error("[Sanctum Violation] Erro fatal:", err);
    
    return new Response(
      JSON.stringify({ success: false, locked: false, error: "Erro interno do servidor" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
