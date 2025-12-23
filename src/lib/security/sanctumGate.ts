// ============================================
// 🛡️🔥 SANCTUM GATE — O PORTEIRO BANCÁRIO NÍVEL NASA 🔥🛡️
// ANO 2300 — SEGURANÇA TÃO FORTE QUANTO BRADESCO
// ESTE É O PROJETO DA VIDA DO MESTRE MOISÉS MEDEIROS
// ============================================
//
// 📍 MAPA DE URLs DEFINITIVO:
//   🌐 NÃO PAGANTE: pro.moisesmedeiros.com.br/ + /comunidade
//   👨‍🎓 ALUNO BETA: pro.moisesmedeiros.com.br/alunos (role='beta')
//   👔 FUNCIONÁRIO: gestao.moisesmedeiros.com.br/gestao (role='funcionario')
//   👑 OWNER: TODAS (moisesblank@gmail.com = MASTER)
//
// ============================================

import { supabase } from "@/integrations/supabase/client";

// ============================================
// CONSTANTES CRÍTICAS
// ============================================
export const OWNER_EMAIL = "moisesblank@gmail.com";

export const ROLES = {
  OWNER: "owner",
  ADMIN: "admin",
  FUNCIONARIO: "funcionario",
  BETA: "beta",
  USER: "user",
} as const;

export type AppRole = (typeof ROLES)[keyof typeof ROLES];

// ============================================
// HIERARQUIA DE ROLES
// ============================================
export const ROLE_HIERARCHY: Record<AppRole, AppRole[]> = {
  owner: ["owner", "admin", "funcionario", "beta", "user"],
  admin: ["admin", "funcionario", "beta", "user"],
  funcionario: ["funcionario", "beta", "user"],
  beta: ["beta", "user"],
  user: ["user"],
};

// ============================================
// RATE LIMIT STORAGE
// ============================================
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

// ============================================
// LOCKOUT STORAGE (PROGRESSIVE BAN)
// ============================================
const lockoutStore = new Map<string, { attempts: number; lockedUntil: number }>();

// ============================================
// LOCKDOWN FLAGS (KILL SWITCHES)
// ============================================
export const LOCKDOWN_FLAGS = {
  disable_all_access: false,
  disable_content_tokens: false,
  disable_webhooks: false,
  disable_ai: false,
  force_step_up_auth: false,
  read_only_mode: false,
  maintenance_mode: false,
};

// ============================================
// TIPOS
// ============================================
export interface SanctumPrincipal {
  userId: string;
  email: string;
  role: AppRole;
  isOwner: boolean;
  isAdmin: boolean;
  isFuncionario: boolean;
  isBeta: boolean;
  sessionId: string;
  deviceId?: string;
  ipHash?: string;
  correlationId: string;
}

export interface SanctumGuardOptions {
  // Roles permitidas (owner sempre permitido)
  requiredRoles?: AppRole[];
  
  // Permissão específica
  requiredPermission?: string;
  
  // Rate limit
  rateLimit?: {
    requests: number;
    windowMs: number;
    keyPrefix?: string;
  };
  
  // Verificar lockdown
  checkLockdown?: boolean;
  
  // Verificar lockout (progressive ban)
  checkLockout?: boolean;
  
  // Ação para audit log
  action?: string;
  
  // Recurso sendo acessado
  resourceType?: string;
  resourceId?: string;
}

export interface SanctumGuardResult {
  allowed: boolean;
  principal: SanctumPrincipal | null;
  reason?: string;
  correlationId: string;
}

// ============================================
// FUNÇÕES UTILITÁRIAS
// ============================================

/**
 * Gera um ID de correlação único para rastreamento
 */
export function generateCorrelationId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 10);
  return `SG-${timestamp}-${random}`.toUpperCase();
}

/**
 * Hash de IP (não armazena IP puro por privacidade)
 */
export async function hashValue(value: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(value + OWNER_EMAIL); // Salt fixo
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("").substring(0, 16);
}

/**
 * Verifica se um role tem acesso a outro role na hierarquia
 */
export function hasRoleAccess(userRole: AppRole, requiredRole: AppRole): boolean {
  const allowedRoles = ROLE_HIERARCHY[userRole] || [];
  return allowedRoles.includes(requiredRole);
}

/**
 * Verifica se é o owner
 */
export function isOwnerEmail(email: string): boolean {
  return email.toLowerCase() === OWNER_EMAIL.toLowerCase();
}

// ============================================
// RATE LIMITER
// ============================================
export function checkRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number
): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const record = rateLimitStore.get(key);

  if (!record || now > record.resetAt) {
    // Nova janela
    rateLimitStore.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: maxRequests - 1, resetAt: now + windowMs };
  }

  if (record.count >= maxRequests) {
    return { allowed: false, remaining: 0, resetAt: record.resetAt };
  }

  record.count++;
  return { allowed: true, remaining: maxRequests - record.count, resetAt: record.resetAt };
}

// ============================================
// PROGRESSIVE LOCKOUT
// ============================================
export const LOCKOUT_POLICY = {
  5: 15 * 60 * 1000,        // 5 falhas = 15 min
  10: 60 * 60 * 1000,       // 10 falhas = 1 hora
  20: 24 * 60 * 60 * 1000,  // 20 falhas = 24 horas
  50: Infinity,              // 50 falhas = permanente
};

export function checkLockout(key: string): { locked: boolean; until?: number; attempts: number } {
  const now = Date.now();
  const record = lockoutStore.get(key);

  if (!record) {
    return { locked: false, attempts: 0 };
  }

  if (record.lockedUntil > now) {
    return { locked: true, until: record.lockedUntil, attempts: record.attempts };
  }

  return { locked: false, attempts: record.attempts };
}

export function recordFailedAttempt(key: string): { locked: boolean; lockDuration?: number } {
  const now = Date.now();
  const record = lockoutStore.get(key) || { attempts: 0, lockedUntil: 0 };
  
  record.attempts++;

  // Encontrar duração de lockout baseada no número de tentativas
  let lockDuration = 0;
  for (const [threshold, duration] of Object.entries(LOCKOUT_POLICY)) {
    if (record.attempts >= parseInt(threshold)) {
      lockDuration = duration;
    }
  }

  if (lockDuration > 0) {
    record.lockedUntil = lockDuration === Infinity ? Infinity : now + lockDuration;
    lockoutStore.set(key, record);
    return { locked: true, lockDuration };
  }

  lockoutStore.set(key, record);
  return { locked: false };
}

export function clearLockout(key: string): void {
  lockoutStore.delete(key);
}

// ============================================
// AUDIT LOG
// ============================================
export async function writeAuditLog(params: {
  correlationId: string;
  userId?: string;
  action: string;
  resourceType?: string;
  resourceId?: string;
  result: "permit" | "deny";
  reason?: string;
  ipHash?: string;
  uaHash?: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  try {
    // Inserir no audit log via RPC ou insert direto
    await supabase.from("audit_log").insert({
      correlation_id: params.correlationId,
      user_id: params.userId,
      action: params.action,
      resource_type: params.resourceType,
      resource_id: params.resourceId,
      result: params.result,
      reason: params.reason,
      ip_hash: params.ipHash,
      ua_hash: params.uaHash,
      metadata: params.metadata,
      created_at: new Date().toISOString(),
    });
  } catch (error) {
    // Nunca falhar por causa de audit log
    console.error("[SANCTUM] Audit log error:", error);
  }
}

// ============================================
// SANCTUM GUARD — FUNÇÃO PRINCIPAL
// ============================================
export async function sanctumGuard(
  options: SanctumGuardOptions = {}
): Promise<SanctumGuardResult> {
  const correlationId = generateCorrelationId();
  
  const {
    requiredRoles = [],
    rateLimit,
    checkLockdown = true,
    checkLockout: checkLockoutFlag = false,
    action = "access",
    resourceType,
    resourceId,
  } = options;

  // ============================================
  // 1. VERIFICAR LOCKDOWN GLOBAL
  // ============================================
  if (checkLockdown && LOCKDOWN_FLAGS.disable_all_access) {
    await writeAuditLog({
      correlationId,
      action,
      resourceType,
      resourceId,
      result: "deny",
      reason: "LOCKDOWN_ACTIVE",
    });
    
    return {
      allowed: false,
      principal: null,
      reason: "Sistema em manutenção",
      correlationId,
    };
  }

  // ============================================
  // 2. OBTER SESSÃO DO USUÁRIO
  // ============================================
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  
  if (sessionError || !session?.user) {
    await writeAuditLog({
      correlationId,
      action,
      resourceType,
      resourceId,
      result: "deny",
      reason: "NO_SESSION",
    });
    
    return {
      allowed: false,
      principal: null,
      reason: "Não autenticado",
      correlationId,
    };
  }

  const user = session.user;
  const email = user.email || "";

  // ============================================
  // 3. VERIFICAR SE É OWNER (BYPASS TOTAL)
  // ============================================
  const isOwner = isOwnerEmail(email);

  // ============================================
  // 4. OBTER ROLE DO PERFIL
  // ============================================
  let role: AppRole = "user";
  
  try {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    
    if (profile?.role) {
      role = profile.role as AppRole;
    }
  } catch {
    // Se não conseguir obter role, usar default
  }

  // Owner sempre tem role 'owner'
  if (isOwner) {
    role = "owner";
  }

  // ============================================
  // 5. CONSTRUIR PRINCIPAL
  // ============================================
  const principal: SanctumPrincipal = {
    userId: user.id,
    email,
    role,
    isOwner,
    isAdmin: role === "admin" || isOwner,
    isFuncionario: ["funcionario", "admin", "owner"].includes(role),
    isBeta: ["beta", "funcionario", "admin", "owner"].includes(role),
    sessionId: session.access_token.substring(0, 16),
    correlationId,
  };

  // ============================================
  // 6. OWNER BYPASS — ACESSO TOTAL
  // ============================================
  if (isOwner) {
    await writeAuditLog({
      correlationId,
      userId: user.id,
      action,
      resourceType,
      resourceId,
      result: "permit",
      reason: "OWNER_BYPASS",
      metadata: { role, email },
    });
    
    return {
      allowed: true,
      principal,
      correlationId,
    };
  }

  // ============================================
  // 7. VERIFICAR LOCKOUT (PROGRESSIVE BAN)
  // ============================================
  if (checkLockoutFlag) {
    const lockoutKey = `lockout:${user.id}`;
    const lockoutStatus = checkLockout(lockoutKey);
    
    if (lockoutStatus.locked) {
      await writeAuditLog({
        correlationId,
        userId: user.id,
        action,
        resourceType,
        resourceId,
        result: "deny",
        reason: "LOCKED_OUT",
        metadata: { attempts: lockoutStatus.attempts, until: lockoutStatus.until },
      });
      
      return {
        allowed: false,
        principal,
        reason: "Conta temporariamente bloqueada",
        correlationId,
      };
    }
  }

  // ============================================
  // 8. VERIFICAR RATE LIMIT
  // ============================================
  if (rateLimit) {
    const rateLimitKey = `${rateLimit.keyPrefix || action}:${user.id}`;
    const rateLimitResult = checkRateLimit(
      rateLimitKey,
      rateLimit.requests,
      rateLimit.windowMs
    );
    
    if (!rateLimitResult.allowed) {
      await writeAuditLog({
        correlationId,
        userId: user.id,
        action,
        resourceType,
        resourceId,
        result: "deny",
        reason: "RATE_LIMITED",
        metadata: { resetAt: rateLimitResult.resetAt },
      });
      
      return {
        allowed: false,
        principal,
        reason: "Muitas requisições. Tente novamente em breve.",
        correlationId,
      };
    }
  }

  // ============================================
  // 9. VERIFICAR ROLES PERMITIDAS
  // ============================================
  if (requiredRoles.length > 0) {
    const hasAccess = requiredRoles.some((requiredRole) =>
      hasRoleAccess(role, requiredRole)
    );
    
    if (!hasAccess) {
      await writeAuditLog({
        correlationId,
        userId: user.id,
        action,
        resourceType,
        resourceId,
        result: "deny",
        reason: "ROLE_DENIED",
        metadata: { userRole: role, requiredRoles },
      });
      
      return {
        allowed: false,
        principal,
        reason: "Acesso não autorizado para seu nível",
        correlationId,
      };
    }
  }

  // ============================================
  // 10. ACESSO PERMITIDO
  // ============================================
  await writeAuditLog({
    correlationId,
    userId: user.id,
    action,
    resourceType,
    resourceId,
    result: "permit",
    reason: "ACCESS_GRANTED",
    metadata: { role },
  });

  return {
    allowed: true,
    principal,
    correlationId,
  };
}

// ============================================
// HOOK PARA USO EM COMPONENTES REACT
// ============================================
export function useSanctumGuard() {
  return {
    sanctumGuard,
    checkRateLimit,
    checkLockout,
    recordFailedAttempt,
    clearLockout,
    writeAuditLog,
    isOwnerEmail,
    hasRoleAccess,
    ROLES,
    LOCKDOWN_FLAGS,
  };
}

export default sanctumGuard;
