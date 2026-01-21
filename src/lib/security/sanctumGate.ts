// ============================================
// 🛡️🔥 SANCTUM GATE — O PORTEIRO BANCÁRIO NÍVEL NASA 🔥🛡️
// ANO 2300 — SEGURANÇA TÃO FORTE QUANTO BRADESCO
// ESTE É O PROJETO DA VIDA DO MESTRE MOISÉS MEDEIROS
// ============================================
//
// 📍 MAPA DE URLs DEFINITIVO (MONO-DOMÍNIO v2.0 - 27/12/2025):
//   🌐 NÃO PAGANTE: pro.moisesmedeiros.com.br/ + /comunidade
//   👨‍🎓 ALUNO BETA: pro.moisesmedeiros.com.br/alunos (role='beta')
//   👔 FUNCIONÁRIO: pro.moisesmedeiros.com.br/gestaofc (role='staff')
//   👑 OWNER: TODAS (role='owner' do banco)
//
// ============================================

import { supabase } from "@/integrations/supabase/client";

// ============================================
// 🛡️ P0 SECURITY FIX: Email removido do bundle
// Owner verificado via RPC check_is_owner()
// ============================================

// 🎯 CONSTITUIÇÃO ROLES v1.0.0 - Nomenclatura Definitiva
// "employee" e "funcionario" são CATEGORIAS, não roles individuais
export const ROLES = {
  OWNER: "owner",
  ADMIN: "admin",
  COORDENACAO: "coordenacao",
  CONTABILIDADE: "contabilidade",
  SUPORTE: "suporte",
  MONITORIA: "monitoria",
  MARKETING: "marketing",
  AFILIADO: "afiliado",
  BETA: "beta",
  USER: "user",
} as const;

export type AppRole = (typeof ROLES)[keyof typeof ROLES];

// ============================================
// HIERARQUIA DE ROLES
// ============================================
export const ROLE_HIERARCHY: Record<AppRole, AppRole[]> = {
  owner: ["owner", "admin", "coordenacao", "contabilidade", "suporte", "monitoria", "marketing", "afiliado", "beta", "user"],
  admin: ["admin", "coordenacao", "contabilidade", "suporte", "monitoria", "marketing", "afiliado", "beta", "user"],
  coordenacao: ["coordenacao", "suporte", "monitoria", "beta", "user"],
  contabilidade: ["contabilidade", "user"],
  suporte: ["suporte", "user"],
  monitoria: ["monitoria", "user"],
  marketing: ["marketing", "user"],
  afiliado: ["afiliado", "user"],
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
  requiredRoles?: AppRole[];
  requiredPermission?: string;
  rateLimit?: {
    requests: number;
    windowMs: number;
    keyPrefix?: string;
  };
  checkLockdown?: boolean;
  checkLockout?: boolean;
  action?: string;
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

export function generateCorrelationId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 10);
  return `SG-${timestamp}-${random}`.toUpperCase();
}

export async function hashValue(value: string): Promise<string> {
  const encoder = new TextEncoder();
  // 🛡️ P0 FIX: Salt genérico (não expõe email)
  const data = encoder.encode(value + "sanctum-salt-v2");
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("").substring(0, 16);
}

export function hasRoleAccess(userRole: AppRole, requiredRole: AppRole): boolean {
  const allowedRoles = ROLE_HIERARCHY[userRole] || [];
  return allowedRoles.includes(requiredRole);
}

/**
 * @deprecated P0 SECURITY FIX: Esta função foi removida
 * Use isOwnerByRole(role) ou check_is_owner RPC
 */
export function isOwnerEmail(_email: string): boolean {
  // 🛡️ P0 FIX: Retorna false - usar verificação por role
  return false;
}

/**
 * ✅ Verificação segura de owner via role (preferir esta)
 */
export function isOwnerByRole(role?: string | null): boolean {
  return role === 'owner';
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
export const LOCKOUT_POLICY: Record<number, number> = {
  5: 15 * 60 * 1000,
  10: 60 * 60 * 1000,
  20: 24 * 60 * 60 * 1000,
  50: Infinity,
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
    await supabase.from("audit_logs").insert({
      action: `${params.action}:${params.result}`,
      user_id: params.userId,
      record_id: params.resourceId,
      table_name: params.resourceType,
      metadata: {
        correlation_id: params.correlationId,
        reason: params.reason,
        ip_hash: params.ipHash,
        ua_hash: params.uaHash,
        ...params.metadata,
      },
    });
  } catch (error) {
    console.error("[SANCTUM] Audit log error:", error);
  }
}

// ============================================
// BUSCAR ROLE DO USUÁRIO (VIA user_roles TABLE)
// ✅ SEGURO: Role vem do banco, não de email hardcoded
// ============================================
async function getUserRole(userId: string, _email: string): Promise<AppRole> {
  try {
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .single();

    if (data?.role) {
      return data.role as AppRole;
    }
  } catch {
    // Fallback silencioso
  }

  return ROLES.USER;
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

  // 1. VERIFICAR LOCKDOWN GLOBAL
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

  // 2. OBTER SESSÃO DO USUÁRIO
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

  // 3. VERIFICAR LOCKOUT DO USUÁRIO
  if (checkLockoutFlag) {
    const lockoutStatus = checkLockout(`user:${user.id}`);
    if (lockoutStatus.locked) {
      await writeAuditLog({
        correlationId,
        userId: user.id,
        action,
        resourceType,
        resourceId,
        result: "deny",
        reason: "USER_LOCKED_OUT",
        metadata: { attempts: lockoutStatus.attempts, until: lockoutStatus.until },
      });
      
      return {
        allowed: false,
        principal: null,
        reason: "Conta temporariamente bloqueada",
        correlationId,
      };
    }
  }

  // 4. RATE LIMIT
  if (rateLimit) {
    const rateLimitKey = `${rateLimit.keyPrefix || action}:${user.id}`;
    const rateLimitResult = checkRateLimit(rateLimitKey, rateLimit.requests, rateLimit.windowMs);
    
    if (!rateLimitResult.allowed) {
      await writeAuditLog({
        correlationId,
        userId: user.id,
        action,
        resourceType,
        resourceId,
        result: "deny",
        reason: "RATE_LIMIT_EXCEEDED",
        metadata: { resetAt: rateLimitResult.resetAt },
      });
      
      return {
        allowed: false,
        principal: null,
        reason: "Muitas requisições. Tente novamente em breve.",
        correlationId,
      };
    }
  }

  // 5. BUSCAR ROLE DO USUÁRIO
  const userRole = await getUserRole(user.id, email);
  // P1-2 SECURITY FIX: Owner verificado via role, não email
  const isOwner = userRole === ROLES.OWNER;

  // 6. CONSTRUIR PRINCIPAL
  // 🎯 isGestaoStaff = qualquer role de staff (não mais "funcionario")
  const isGestaoStaff = [
    ROLES.ADMIN, ROLES.COORDENACAO, ROLES.CONTABILIDADE, 
    ROLES.SUPORTE, ROLES.MONITORIA, ROLES.MARKETING, ROLES.AFILIADO
  ].includes(userRole as any) || isOwner;
  
  // CONSTITUIÇÃO v10.x - Roles premium incluem beta, aluno_presencial, beta_expira
  const premiumRoles = ['beta', 'aluno_presencial', 'beta_expira'];
  const isBetaRole = premiumRoles.includes(userRole || '');
  
  const principal: SanctumPrincipal = {
    userId: user.id,
    email,
    role: userRole,
    isOwner,
    isAdmin: userRole === ROLES.ADMIN || isOwner,
    isFuncionario: isGestaoStaff, // Agora verifica TODAS as roles de staff
    isBeta: isBetaRole || isGestaoStaff,
    sessionId: session.access_token.substring(0, 16),
    correlationId,
  };

  // 7. VERIFICAR ROLES (owner sempre passa)
  if (requiredRoles.length > 0 && !isOwner) {
    const hasAccess = requiredRoles.some((requiredRole) => 
      hasRoleAccess(userRole, requiredRole) || userRole === requiredRole
    );

    if (!hasAccess) {
      await writeAuditLog({
        correlationId,
        userId: user.id,
        action,
        resourceType,
        resourceId,
        result: "deny",
        reason: "INSUFFICIENT_ROLE",
        metadata: { userRole, requiredRoles },
      });
      
      return {
        allowed: false,
        principal,
        reason: "Acesso negado",
        correlationId,
      };
    }
  }

  // 8. SUCESSO
  await writeAuditLog({
    correlationId,
    userId: user.id,
    action,
    resourceType,
    resourceId,
    result: "permit",
  });

  return {
    allowed: true,
    principal,
    correlationId,
  };
}

// ============================================
// HOOK PARA USO EM COMPONENTES
// ============================================
export function useSanctumGuard() {
  return {
    guard: sanctumGuard,
    checkRateLimit,
    checkLockout,
    recordFailedAttempt,
    clearLockout,
    isOwnerEmail,
    hasRoleAccess,
    ROLES,
    LOCKDOWN_FLAGS,
  };
}
