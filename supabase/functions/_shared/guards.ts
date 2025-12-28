// ============================================
// 🛡️ LEI III + LEI VI — GUARDS CENTRALIZADOS
// Validações de segurança reutilizáveis
// ============================================

// Supabase client type (any para compatibilidade edge functions)

// ============================================
// TIPOS
// ============================================

export interface GuardResult {
  valid: boolean;
  error?: string;
  code?: string;
  statusCode?: number;
}

export interface JwtPayload {
  sub: string;
  email?: string;
  role?: string;
  aud?: string;
  exp?: number;
  iat?: number;
}

// ============================================
// 🔐 VALIDAÇÃO HOTTOK (HOTMART)
// ============================================

export async function validateHottok(
  req: Request,
  supabase: any
): Promise<GuardResult> {
  const HOTMART_HOTTOK = Deno.env.get("HOTMART_HOTTOK");
  const receivedHottok = req.headers.get("x-hotmart-hottok");

  if (!HOTMART_HOTTOK) {
    console.error("[GUARD] ❌ HOTTOK não configurado no servidor");
    return {
      valid: false,
      error: "Configuração de segurança ausente",
      code: "SECURITY_CONFIG_MISSING",
      statusCode: 500,
    };
  }

  if (!receivedHottok) {
    console.error("[GUARD] ❌ HOTTOK ausente na requisição");
    
    // Log de segurança
    await logSecurityEvent(supabase, req, {
      event_type: "webhook_missing_signature",
      severity: "critical",
      payload: { source: "hotmart", reason: "HOTTOK_MISSING" },
    });

    return {
      valid: false,
      error: "Assinatura de webhook ausente",
      code: "SIGNATURE_MISSING",
      statusCode: 403,
    };
  }

  // Comparação segura
  const isValid = receivedHottok.trim() === HOTMART_HOTTOK.trim();

  if (!isValid) {
    console.error("[GUARD] ❌ HOTTOK inválido - possível fraude");
    
    await logSecurityEvent(supabase, req, {
      event_type: "webhook_invalid_signature",
      severity: "critical",
      payload: { source: "hotmart", reason: "HOTTOK_INVALID" },
    });

    return {
      valid: false,
      error: "Assinatura de webhook inválida",
      code: "SIGNATURE_INVALID",
      statusCode: 403,
    };
  }

  return { valid: true };
}

// ============================================
// 🔐 VALIDAÇÃO INTERNAL_SECRET (Server-to-Server)
// ============================================

export function validateInternalSecret(req: Request): GuardResult {
  const INTERNAL_SECRET = Deno.env.get("INTERNAL_SECRET");
  const receivedSecret = req.headers.get("x-internal-secret");

  if (!INTERNAL_SECRET) {
    console.error("[GUARD] ❌ INTERNAL_SECRET não configurado");
    return {
      valid: false,
      error: "Configuração interna ausente",
      code: "INTERNAL_CONFIG_MISSING",
      statusCode: 500,
    };
  }

  if (!receivedSecret || receivedSecret !== INTERNAL_SECRET) {
    console.warn("[GUARD] ⚠️ Internal secret inválido ou ausente");
    return {
      valid: false,
      error: "Acesso não autorizado",
      code: "UNAUTHORIZED",
      statusCode: 403,
    };
  }

  return { valid: true };
}

// ============================================
// 🔐 VALIDAÇÃO JWT (Supabase Auth)
// ============================================

export async function validateJwt(
  req: Request,
  supabase: any
): Promise<GuardResult & { user?: JwtPayload }> {
  const authHeader = req.headers.get("authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return {
      valid: false,
      error: "Token de autenticação ausente",
      code: "AUTH_MISSING",
      statusCode: 401,
    };
  }

  const token = authHeader.replace("Bearer ", "");

  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return {
        valid: false,
        error: "Token inválido ou expirado",
        code: "AUTH_INVALID",
        statusCode: 401,
      };
    }

    return {
      valid: true,
      user: {
        sub: user.id,
        email: user.email,
        role: user.role,
      },
    };
  } catch (err) {
    console.error("[GUARD] Erro ao validar JWT:", err);
    return {
      valid: false,
      error: "Erro de autenticação",
      code: "AUTH_ERROR",
      statusCode: 500,
    };
  }
}

// ============================================
// 🔐 VALIDAÇÃO HMAC (WhatsApp, Stripe, etc.)
// ============================================

export async function validateHmac(
  payload: string,
  signature: string,
  secret: string,
  algorithm: "SHA-256" | "SHA-1" = "SHA-256"
): Promise<boolean> {
  try {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(secret),
      { name: "HMAC", hash: algorithm },
      false,
      ["sign"]
    );

    const signatureBytes = await crypto.subtle.sign(
      "HMAC",
      key,
      encoder.encode(payload)
    );

    const expectedSignature = Array.from(new Uint8Array(signatureBytes))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    // Comparação timing-safe simulada
    const receivedHex = signature.replace(/^sha256=/, "").toLowerCase();
    return expectedSignature === receivedHex;
  } catch (err) {
    console.error("[GUARD] Erro ao validar HMAC:", err);
    return false;
  }
}

// ============================================
// 📝 LOG DE EVENTOS DE SEGURANÇA
// ============================================

interface SecurityEventPayload {
  event_type: string;
  severity: "info" | "warning" | "critical";
  payload?: Record<string, unknown>;
}

export async function logSecurityEvent(
  supabase: any,
  req: Request,
  event: SecurityEventPayload
): Promise<void> {
  try {
    await supabase.from("security_events").insert({
      event_type: event.event_type,
      severity: event.severity,
      user_id: null,
      ip_address:
        req.headers.get("cf-connecting-ip") ||
        req.headers.get("x-forwarded-for")?.split(",")[0] ||
        "unknown",
      user_agent: req.headers.get("user-agent"),
      payload: {
        ...event.payload,
        headers: sanitizeHeaders(req.headers),
      },
    });
  } catch (err) {
    console.error("[GUARD] Erro ao logar evento de segurança:", err);
  }
}

// ============================================
// 🧹 HELPERS
// ============================================

function sanitizeHeaders(headers: Headers): Record<string, string> {
  const sanitized: Record<string, string> = {};
  const sensitiveKeys = ["authorization", "cookie", "x-hotmart-hottok", "x-internal-secret"];

  headers.forEach((value, key) => {
    if (!sensitiveKeys.includes(key.toLowerCase())) {
      sanitized[key] = value;
    }
  });

  return sanitized;
}

export function getClientIp(req: Request): string {
  return (
    req.headers.get("cf-connecting-ip") ||
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

// ============================================
// 🚫 P1-2 FIX: isOwner(email) REMOVIDO
// Validação por email é proibida pela Constituição v10
// Usar APENAS isOwnerByRole(supabase, userId)
// ============================================

/**
 * ✅ Verificação segura de owner via role (inline)
 * Fonte da verdade: user_roles.role = 'owner'
 */
export async function isOwnerByRole(
  supabase: any,
  userId: string
): Promise<boolean> {
  const { data } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "owner")
    .single();
  return !!data;
}

// ============================================
// 🛡️ GUARD COMBINADO (Múltiplas validações)
// ============================================

export interface CombinedGuardOptions {
  requireJwt?: boolean;
  requireInternalSecret?: boolean;
  requireHottok?: boolean;
  allowOwnerBypass?: boolean;
}

export async function combinedGuard(
  req: Request,
  supabase: any,
  options: CombinedGuardOptions = {}
): Promise<GuardResult & { user?: JwtPayload }> {
  // HOTTOK (Hotmart webhooks)
  if (options.requireHottok) {
    const hottokResult = await validateHottok(req, supabase);
    if (!hottokResult.valid) return hottokResult;
  }

  // Internal Secret (server-to-server)
  if (options.requireInternalSecret) {
    const secretResult = validateInternalSecret(req);
    if (!secretResult.valid) return secretResult;
  }

  // JWT (user auth)
  if (options.requireJwt) {
    const jwtResult = await validateJwt(req, supabase);
    
    // Owner bypass (apenas UX, não segurança)
    if (!jwtResult.valid && options.allowOwnerBypass) {
      // Ainda precisa de JWT válido, apenas relaxa certas restrições
      return jwtResult;
    }
    
    if (!jwtResult.valid) return jwtResult;
    return { valid: true, user: jwtResult.user };
  }

  return { valid: true };
}
