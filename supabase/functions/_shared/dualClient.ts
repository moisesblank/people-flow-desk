// ============================================
// 🛡️ DUAL CLIENT PATTERN — LEI III + LEI VI
// CRÍTICO-2: Separação de clientes User vs Admin
// ============================================
// Regra: endpoints do browser DEVEM usar 2 clientes:
// 1) supabaseUser (anon + JWT) → validações via RLS
// 2) supabaseAdmin (service_role) → tarefas privilegiadas (Storage, etc)
// ============================================

import { createClient, SupabaseClient } from "npm:@supabase/supabase-js@2";

/**
 * Resultado da criação de dual clients
 */
export interface DualClients {
  /** Cliente escopado ao usuário - usa RLS */
  supabaseUser: SupabaseClient;
  /** Cliente admin - bypass RLS, usar com cautela */
  supabaseAdmin: SupabaseClient;
  /** Usuário autenticado */
  user: {
    id: string;
    email: string;
    role?: string;
  };
  /** Profile do usuário (se existir) */
  profile: {
    full_name?: string;
    cpf?: string;
    role?: string;
    plano?: string;
  } | null;
}

/**
 * Erro de autenticação
 */
export class AuthError extends Error {
  constructor(
    message: string,
    public code: string,
    public status: number = 401
  ) {
    super(message);
    this.name = "AuthError";
  }
}

/**
 * Cria dual clients com validação de JWT
 * 
 * @param authHeader - Header Authorization (Bearer token)
 * @param options - Opções adicionais
 * @returns DualClients com user autenticado
 * @throws AuthError se token inválido
 */
export async function createDualClients(
  authHeader: string | null,
  options: {
    requireProfile?: boolean;
    allowedRoles?: string[];
    logContext?: string;
  } = {}
): Promise<DualClients> {
  const { requireProfile = false, allowedRoles, logContext = "DualClient" } = options;
  
  // Validar header
  if (!authHeader?.startsWith("Bearer ")) {
    console.error(`[${logContext}] ❌ Sem header de autorização`);
    throw new AuthError("Não autorizado", "UNAUTHORIZED", 401);
  }

  const token = authHeader.replace("Bearer ", "");
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  // ═══════════════════════════════════════════════════════
  // CLIENTE 1: User-scoped (usa RLS)
  // ═══════════════════════════════════════════════════════
  const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  });

  // ═══════════════════════════════════════════════════════
  // CLIENTE 2: Admin (bypass RLS) - usar com cautela!
  // ═══════════════════════════════════════════════════════
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

  // Validar token usando o cliente admin (mais confiável)
  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
  
  if (authError || !user) {
    console.error(`[${logContext}] ❌ Token inválido:`, authError?.message);
    throw new AuthError("Token inválido ou expirado", "INVALID_TOKEN", 401);
  }

  // Buscar profile se necessário
  let profile = null;
  if (requireProfile || allowedRoles) {
    const { data: profileData } = await supabaseAdmin
      .from("profiles")
      .select("full_name, cpf, role, plano, plano_expira_em")
      .eq("id", user.id)
      .single();
    
    profile = profileData;
  }

  // ✅ SEGURO: Verificar role APENAS do banco, nunca por email
  // Email hardcoded é proibido para autorização backend
  if (allowedRoles && allowedRoles.length > 0) {
    const userRole = profile?.role || "user";
    
    // ✅ Owner identificado pela role do banco, não por email
    if (userRole !== "owner" && !allowedRoles.includes(userRole)) {
      console.error(`[${logContext}] ❌ Role não permitida: ${userRole}`);
      throw new AuthError(
        `Acesso negado. Role necessária: ${allowedRoles.join(" ou ")}`,
        "FORBIDDEN",
        403
      );
    }
  }

  console.log(`[${logContext}] ✅ Dual clients criados para: ${user.email}`);

  return {
    supabaseUser,
    supabaseAdmin,
    user: {
      id: user.id,
      email: user.email || "",
      role: profile?.role,
    },
    profile,
  };
}

// ============================================
// 🚫 P1-2 FIX: isOwner(email) REMOVIDO
// Validação por email é PROIBIDA pela Constituição v10
// Usar APENAS verificação via role do banco:
//   await supabase.from("user_roles").select("role").eq("user_id", userId).eq("role", "owner")
// ============================================

/**
 * Verifica se usuário tem role imune (gestão)
 * NOTA: 'employee' e 'funcionario' são categorias deprecated
 */
export function isImmuneRole(role?: string | null): boolean {
  const IMMUNE_ROLES = [
    'owner', 'admin', 'suporte',
    'coordenacao', 'monitoria', 'contabilidade', 'marketing', 'afiliado',
  ];
  return role ? IMMUNE_ROLES.includes(role) : false;
}

/**
 * Verifica se usuário é beta (aluno pagante)
 */
export function isBetaUser(role?: string | null, plano?: string | null): boolean {
  return role === 'beta' || plano === 'beta';
}

/**
 * Gera resposta de erro padronizada
 */
export function errorResponse(
  error: AuthError | Error,
  corsHeaders: Record<string, string>
): Response {
  const status = error instanceof AuthError ? error.status : 500;
  const code = error instanceof AuthError ? error.code : "INTERNAL_ERROR";
  
  // 🛡️ PATCH-009: Mensagem genérica para erros internos
  const safeMessage = error instanceof AuthError 
    ? error.message 
    : "Erro interno do servidor";
  
  return new Response(
    JSON.stringify({
      success: false,
      error: safeMessage,
      code,
    }),
    {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    }
  );
}
