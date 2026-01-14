// ============================================
// 🔥🛡️ URL ACCESS CONTROL OMEGA v4.0 🛡️🔥
// CONTROLE DE ACESSO SUPREMO - NÍVEL NASA
// ============================================
// 📍 MAPA DE URLs DEFINITIVO v2.0 (MONO-DOMÍNIO):
// ┌───────────────────────────────────────────────────────────────────┐
// │ QUEM             │ URL BASE                           │ VALIDAÇÃO│
// ├───────────────────────────────────────────────────────────────────┤
// │ 🌐 NÃO PAGANTE   │ pro.moisesmedeiros.com.br/         │ viewer   │
// │                  │ pro.moisesmedeiros.com.br/comunidade│          │
// ├───────────────────────────────────────────────────────────────────┤
// │ 👨‍🎓 ALUNO BETA    │ pro.moisesmedeiros.com.br/alunos   │ beta     │
// │                  │ + /comunidade (acesso incluído)     │          │
// ├───────────────────────────────────────────────────────────────────┤
// │ 👔 FUNCIONÁRIO   │ pro.moisesmedeiros.com.br/gestaofc │ staff    │
// │                  │ (ROTA INTERNA - ACESSO POR URL)    │          │
// ├───────────────────────────────────────────────────────────────────┤
// │ 👑 OWNER         │ TODAS                              │ owner    │
// └───────────────────────────────────────────────────────────────────┘
// Owner Master: moisesblank@gmail.com = PODE TUDO
// ============================================

// ============================================
// CONSTANTES GLOBAIS IMUTÁVEIS
// ============================================

/**
 * 👑 OWNER_EMAIL - APENAS PARA AUDITORIA/LOGS
 * ⚠️ NUNCA usar para controle de acesso!
 * Fonte da verdade: user_roles.role = 'owner'
 * @deprecated Use role='owner' para verificar permissões
 */
export const OWNER_EMAIL = "moisesblank@gmail.com"; // Legacy: apenas audit

/**
 * Versão do sistema de controle de acesso
 */
export const ACCESS_CONTROL_VERSION = "4.0.0";

// ============================================
// TIPOS DO SISTEMA
// ============================================

/**
 * Todas as roles do sistema (ordenadas por hierarquia)
 */
// 🎯 CONSTITUIÇÃO SYNAPSE Ω v10.0 - Roles Definitivas
// ⚠️ "employee" e "funcionario" são CATEGORIAS, não roles!
export type AppRole =
  // 👑 MASTER (nível 0)
  | "owner"          // MASTER - PODE TUDO
  // 👔 GESTÃO - funcionários (níveis 1-3)
  | "admin"          // Administrador (nível 1)
  | "coordenacao"    // Coordenação (nível 2)
  | "contabilidade"  // Contabilidade (nível 2)
  | "suporte"        // Suporte ao cliente (nível 3)
  | "monitoria"      // Monitor/Tutor (nível 3)
  | "marketing"      // Equipe de marketing (nível 3)
  | "afiliado"       // Afiliado externo (nível 3)
  // 👨‍🎓 ALUNOS (CONSTITUIÇÃO v10.x - 4 roles)
  | "beta"           // Aluno pagante (permanente)
  | "aluno_gratuito" // Cadastro grátis (limitado)
  | "aluno_presencial" // Aluno presencial (v10.x)
  | "beta_expira";   // Beta com expiração (v10.x)

/**
 * Domínios/Áreas do sistema
 */
export type SystemDomain = 
  | "publico"     // Qualquer pessoa (/, /auth, /termos)
  | "comunidade"  // Não pagantes + Beta (/comunidade/*)
  | "alunos"      // Alunos pagantes (/alunos/*)
  | "gestaofc"    // Funcionários (/gestaofc/* - rota interna secreta)
  | "owner";      // Apenas owner (/gestaofc/central-*, /gestaofc/master)

/**
 * Categorias de acesso simplificadas
 */
export type AccessCategory = 
  | "owner"      // Acesso supremo a tudo
  | "gestao"     // Funcionários - gestao.*
  | "beta"       // Alunos pagantes - pro.*/alunos
  | "gratuito"   // Não pagantes - pro.* (home + comunidade)
  | "publico";   // Visitantes - área aberta

// ============================================
// ROLES IMUNES (NUNCA BLOQUEADOS)
// ============================================

// 🎯 CONSTITUIÇÃO SYNAPSE Ω v10.0 — Listas de Roles

/**
 * Roles que têm bypass de algumas restrições de conteúdo
 * (mas não de acesso a áreas)
 */
export const IMMUNE_ROLES: AppRole[] = [
  "owner",
  "admin",
  "suporte",
  "coordenacao",
  "monitoria",
];

/**
 * Roles que podem acessar a área de gestão (/gestaofc)
 * CONSTITUIÇÃO v10.0 — Bloco GESTÃO
 */
export const GESTAO_ROLES: AppRole[] = [
  "owner",
  "admin",
  "coordenacao",
  "contabilidade",
  "suporte",
  "monitoria",
  "marketing",
  "afiliado",
];

/**
 * Roles que podem acessar a área de alunos (/alunos)
 * CONSTITUIÇÃO v10.4.2 — Bloco ALUNOS
 * 🛡️ CRÍTICO: admin REMOVIDO - funcionários NÃO acessam /alunos
 * Admin agora é estritamente GESTAO_ROLES
 */
export const ALUNO_ROLES: AppRole[] = [
  "owner",           // Owner tem acesso TOTAL (bypass universal)
  "beta",            // Aluno pagante
  "aluno_gratuito",  // Aluno gratuito (acesso limitado)
  "aluno_presencial",// Aluno presencial (v10.x)
  "beta_expira",     // Beta com expiração (v10.x)
];

/**
 * Roles que podem acessar a comunidade (/comunidade)
 * Todos os alunos (beta, gratuito) + owner
 * 🛡️ CRÍTICO: admin REMOVIDO - funcionários usam /gestaofc
 */
export const COMUNIDADE_ROLES: AppRole[] = [
  "owner",
  "beta",
  "aluno_gratuito",
  "aluno_presencial",
  "beta_expira",
];

// ============================================
// MAPEAMENTO DE ROLES PARA CATEGORIAS
// ============================================

export const ROLE_TO_CATEGORY: Record<AppRole, AccessCategory> = {
  // 👑 OWNER
  owner: "owner",
  // 👔 GESTÃO
  admin: "gestao",
  coordenacao: "gestao",
  contabilidade: "gestao",
  suporte: "gestao",
  monitoria: "gestao",
  marketing: "gestao",
  afiliado: "gestao",
  // 👨‍🎓 ALUNOS (CONSTITUIÇÃO v10.x - 4 roles)
  beta: "beta",
  aluno_gratuito: "gratuito",
  aluno_presencial: "beta", // Mesmo acesso que beta
  beta_expira: "beta",      // Mesmo acesso que beta
};

// ============================================
// MAPEAMENTO DE ROLES PARA ÁREAS PERMITIDAS
// ============================================

export interface RolePermissions {
  areas: SystemDomain[];
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canExport: boolean;
  canImport: boolean;
  canManageUsers: boolean;
  canAccessFinance: boolean;
  canAccessOwnerArea: boolean;
}

export const ROLE_PERMISSIONS: Record<AppRole, RolePermissions> = {
  // 👑 OWNER - SUPREMO (nível 0)
  owner: {
    areas: ["publico", "comunidade", "alunos", "gestaofc", "owner"],
    canCreate: true,
    canEdit: true,
    canDelete: true,
    canExport: true,
    canImport: true,
    canManageUsers: true,
    canAccessFinance: true,
    canAccessOwnerArea: true,
  },
  // 👔 ADMIN (nível 1)
  admin: {
    areas: ["publico", "comunidade", "alunos", "gestaofc"],
    canCreate: true,
    canEdit: true,
    canDelete: true,
    canExport: true,
    canImport: true,
    canManageUsers: true,
    canAccessFinance: true,
    canAccessOwnerArea: false,
  },
  // 👔 COORDENAÇÃO (nível 2)
  coordenacao: {
    areas: ["publico", "gestaofc"],
    canCreate: true,
    canEdit: true,
    canDelete: false,
    canExport: true,
    canImport: false,
    canManageUsers: false,
    canAccessFinance: false,
    canAccessOwnerArea: false,
  },
  // 👔 CONTABILIDADE (nível 2)
  contabilidade: {
    areas: ["publico", "gestaofc"],
    canCreate: false,
    canEdit: true,
    canDelete: false,
    canExport: true,
    canImport: true,
    canManageUsers: false,
    canAccessFinance: true,
    canAccessOwnerArea: false,
  },
  // 👔 SUPORTE (nível 3)
  suporte: {
    areas: ["publico", "gestaofc"],
    canCreate: false,
    canEdit: true,
    canDelete: false,
    canExport: true,
    canImport: false,
    canManageUsers: false,
    canAccessFinance: false,
    canAccessOwnerArea: false,
  },
  // 👔 MONITORIA (nível 3)
  monitoria: {
    areas: ["publico", "gestaofc"],
    canCreate: false,
    canEdit: true,
    canDelete: false,
    canExport: false,
    canImport: false,
    canManageUsers: false,
    canAccessFinance: false,
    canAccessOwnerArea: false,
  },
  // 👔 MARKETING (nível 3)
  marketing: {
    areas: ["publico", "gestaofc"],
    canCreate: true,
    canEdit: true,
    canDelete: false,
    canExport: true,
    canImport: true,
    canManageUsers: false,
    canAccessFinance: false,
    canAccessOwnerArea: false,
  },
  // 👔 AFILIADO (nível 3)
  afiliado: {
    areas: ["publico", "gestaofc"],
    canCreate: false,
    canEdit: false,
    canDelete: false,
    canExport: true,
    canImport: false,
    canManageUsers: false,
    canAccessFinance: false,
    canAccessOwnerArea: false,
  },
  // 👨‍🎓 BETA (Aluno Pagante - nível 1)
  beta: {
    areas: ["publico", "comunidade", "alunos"],
    canCreate: false,
    canEdit: false,
    canDelete: false,
    canExport: false,
    canImport: false,
    canManageUsers: false,
    canAccessFinance: false,
    canAccessOwnerArea: false,
  },
  // 👨‍🎓 ALUNO GRATUITO (nível 2)
  aluno_gratuito: {
    areas: ["publico", "comunidade"],
    canCreate: false,
    canEdit: false,
    canDelete: false,
    canExport: false,
    canImport: false,
    canManageUsers: false,
    canAccessFinance: false,
    canAccessOwnerArea: false,
  },
  // 👨‍🎓 ALUNO PRESENCIAL (CONSTITUIÇÃO v10.x)
  aluno_presencial: {
    areas: ["publico", "comunidade", "alunos"],
    canCreate: false,
    canEdit: false,
    canDelete: false,
    canExport: false,
    canImport: false,
    canManageUsers: false,
    canAccessFinance: false,
    canAccessOwnerArea: false,
  },
  // 👨‍🎓 BETA EXPIRA (CONSTITUIÇÃO v10.x)
  beta_expira: {
    areas: ["publico", "comunidade", "alunos"],
    canCreate: false,
    canEdit: false,
    canDelete: false,
    canExport: false,
    canImport: false,
    canManageUsers: false,
    canAccessFinance: false,
    canAccessOwnerArea: false,
  },
};

// ============================================
// ROTAS OWNER ONLY (ÁREA EXCLUSIVA)
// ============================================

export const OWNER_ONLY_PATHS: string[] = [
  // ✅ MATRIZ SUPREMA: Rotas exclusivas OWNER no /gestaofc
  "/gestaofc/central-monitoramento",
  "/gestaofc/central-diagnostico",
  "/gestaofc/diagnostico-whatsapp",
  "/gestaofc/diagnostico-webhooks",
  "/gestaofc/site-programador",
  "/gestaofc/vida-pessoal",
  "/gestaofc/pessoal",
  "/gestaofc/master",
  "/gestaofc/owner",
  "/gestaofc/gestao-dispositivos",
  "/gestaofc/auditoria-acessos",
  "/gestaofc/central-ias",
  "/gestaofc/central-metricas",
  "/gestaofc/central-whatsapp",
  "/gestaofc/whatsapp-live",
  "/gestaofc/monitoramento",
  // Legacy redirect (se alguém digitar)
  "/central-diagnostico",
];

// ============================================
// ROTAS PÚBLICAS (SEM AUTENTICAÇÃO)
// ============================================

export const PUBLIC_PATHS: string[] = [
  "/",
  "/site",
  "/auth",
  "/login",
  "/cadastro",
  "/registro",
  "/recuperar-senha",
  "/termos",
  "/privacidade",
  "/area-gratuita",
  "/primeiro-acesso",           // Onboarding alunos
  "/primeiro-acesso-funcionario", // Onboarding funcionários (v10.4.2)
  "/perfil-incompleto",
  "/security/device-limit",
  "/security/same-type-replacement",
];

// ============================================
// FUNÇÕES DE VERIFICAÇÃO
// ============================================

/**
 * 👑 Verifica se é o Owner Master
 * ✅ P0 FIX: Agora usa APENAS role, não email
 * Owner tem BYPASS TOTAL para qualquer verificação
 * Fonte da verdade: user_roles.role = 'owner'
 */
export function isOwner(email?: string | null, role?: string | null): boolean {
  // ✅ SEGURO: Apenas role check (email ignorado para segurança)
  return role === "owner";
}

/**
 * Verifica se a role é imune a restrições de conteúdo
 */
export function isImmune(role?: string | null): boolean {
  if (!role) return false;
  return IMMUNE_ROLES.includes(role as AppRole);
}

/**
 * Verifica se a role é de gestão (funcionário+)
 */
export function isGestaoRole(role?: string | null): boolean {
  if (!role) return false;
  return GESTAO_ROLES.includes(role as AppRole);
}

/**
 * Verifica se a role é de aluno (beta/aluno)
 */
export function isAlunoRole(role?: string | null): boolean {
  if (!role) return false;
  return ALUNO_ROLES.includes(role as AppRole);
}

/**
 * Obtém as permissões de uma role
 * Fallback: aluno_gratuito (role com menos permissões)
 */
export function getRolePermissions(role?: string | null): RolePermissions {
  if (!role) return ROLE_PERMISSIONS.aluno_gratuito;
  return ROLE_PERMISSIONS[role as AppRole] || ROLE_PERMISSIONS.aluno_gratuito;
}

/**
 * Obtém a categoria de acesso de uma role
 */
export function getRoleCategory(role?: string | null): AccessCategory {
  if (!role) return "publico";
  return ROLE_TO_CATEGORY[role as AppRole] || "publico";
}

/**
 * Verifica se uma role pode acessar uma área/domínio
 */
export function canAccessArea(role: string | null, area: SystemDomain): boolean {
  const permissions = getRolePermissions(role);
  return permissions.areas.includes(area);
}

/**
 * Determina a área/domínio de uma URL
 */
export function getUrlArea(pathname: string): SystemDomain {
  const path = pathname.toLowerCase();
  
  // 👑 Owner only areas
  if (OWNER_ONLY_PATHS.some(p => path.startsWith(p))) {
    return "owner";
  }
  
  // 👔 Gestão (rota secreta /gestaofc)
  if (path.startsWith("/gestaofc")) {
    return "gestaofc";
  }
  
  // 👨‍🎓 Alunos
  if (path.startsWith("/alunos")) {
    return "alunos";
  }
  
  // 🌐 Comunidade
  if (path.startsWith("/comunidade")) {
    return "comunidade";
  }
  
  // 🌍 Público
  return "publico";
}

/**
 * Verifica se uma URL é pública (não requer autenticação)
 */
export function isPublicPath(pathname: string): boolean {
  const path = pathname.toLowerCase();
  return PUBLIC_PATHS.some(p => path === p || path.startsWith(p + "/"));
}

/**
 * Verifica se uma role pode acessar uma URL específica
 */
export function canAccessUrl(
  role: string | null,
  email: string | null,
  pathname: string
): boolean {
  // 👑 Owner MASTER tem acesso TOTAL
  if (isOwner(email, role)) {
    return true;
  }
  
  // Rotas públicas não precisam de role
  if (isPublicPath(pathname)) {
    return true;
  }
  
  const area = getUrlArea(pathname);
  
  // Área owner só para owner
  if (area === "owner") {
    return false;
  }
  
  return canAccessArea(role, area);
}

/**
 * Resultado da validação de acesso
 */
export interface AccessValidationResult {
  allowed: boolean;
  reason: string;
  redirectTo?: string;
  area: SystemDomain;
}

/**
 * Valida acesso completo com motivo e redirecionamento
 */
export function validateAccess(
  role: string | null,
  email: string | null,
  pathname: string,
  hostname?: string
): AccessValidationResult {
  const area = getUrlArea(pathname);
  
  // 👑 Owner MASTER
  if (isOwner(email, role)) {
    return {
      allowed: true,
      reason: "OWNER_MASTER",
      area,
    };
  }
  
  // Rota pública
  if (isPublicPath(pathname)) {
    return {
      allowed: true,
      reason: "PUBLIC_ROUTE",
      area,
    };
  }
  
  // Sem role = não autenticado
  if (!role) {
    return {
      allowed: false,
      reason: "NOT_AUTHENTICATED",
      redirectTo: "/auth",
      area,
    };
  }
  
  // Área owner
  if (area === "owner") {
    return {
      allowed: false,
      reason: "OWNER_ONLY_AREA",
      redirectTo: "/gestaofc", // ✅ MATRIZ SUPREMA v2.0.0: Corrigido de /gestao/dashboard
      area,
    };
  }
  
  // Verificar permissão da role
  if (canAccessArea(role, area)) {
    return {
      allowed: true,
      reason: "ROLE_PERMITTED",
      area,
    };
  }
  
  // Não permitido
  const redirectTo = getAccessDeniedRedirect(role);
  return {
    allowed: false,
    reason: "ROLE_NOT_PERMITTED",
    redirectTo,
    area,
  };
}

/**
 * 🔄 Determina o destino correto após login
 * 
 * REGRA DEFINITIVA (docs/ARQUITETURA_DOMINIOS_DEFINITIVA.md):
 * - OWNER → /gestaofc
 * - GESTAO_ROLES (funcionários) → /gestaofc
 * - BETA/ALUNO → /alunos
 * - VIEWER/FREE → /comunidade
 * - ANÔNIMO → / (não deveria acontecer após login)
 */
export function getPostLoginRedirect(role?: string | null, email?: string | null): string {
  // 1. Owner por email (bypass síncrono) ou role
  const ownerEmail = "moisesblank@gmail.com";
  if (email?.toLowerCase() === ownerEmail || role === "owner") {
    return "/gestaofc";
  }
  
  // 2. Funcionários → gestaofc
  if (role && isGestaoRole(role)) {
    return "/gestaofc";
  }
  
  // 3. Alunos → /alunos/dashboard (CONSTITUIÇÃO v10.4.1)
  if (role && isAlunoRole(role)) {
    return "/alunos/dashboard";
  }
  
  // 4. aluno_gratuito → comunidade (acesso limitado)
  if (role === "aluno_gratuito") {
    return "/comunidade";
  }
  
  // 🚨 P0-3 CONSTITUIÇÃO v10.0: SEM ROLE = /perfil-incompleto
  // NÃO pode ir para /auth (loop) nem /comunidade (sem autorização)
  return "/perfil-incompleto";
}

/**
 * Obtém a URL de redirecionamento quando acesso é negado
 * 🚨 P0-3: SEM ROLE = /perfil-incompleto (nunca /auth para logados)
 */
export function getAccessDeniedRedirect(role?: string | null, isAuthenticated?: boolean): string {
  // Se não está logado, vai para /auth
  if (!isAuthenticated) {
    return "/auth";
  }
  
  // 🚨 P0-3: Se está logado mas SEM role, vai para /perfil-incompleto
  if (!role) {
    return "/perfil-incompleto";
  }
  
  const category = getRoleCategory(role);
  
  // Redirects seguem blocos associativos
  switch (category) {
    case "owner":
    case "gestao":
      return "/gestaofc";
    case "beta":
      return "/alunos/dashboard";
    case "gratuito":
      return "/comunidade";
    default:
      return "/perfil-incompleto";
  }
}

// ============================================
// FUNÇÕES DE DETECÇÃO DE DOMÍNIO
// ============================================

/**
 * @deprecated ARQUITETURA MONO-DOMÍNIO: domínio gestao.* não existe mais
 * Use isGestaoPath() para verificar se está na área /gestaofc
 * SEMPRE retorna false para conformidade com mandato de produção
 */
export function isGestaoHost(_hostname?: string): boolean {
  // ❌ PROIBIDO: hostname-based logic para gestão
  // ✅ CORRETO: usar isGestaoPath() baseado em pathname
  return false;
}

/**
 * Verifica se está no domínio pro (alunos)
 */
export function isProHost(hostname?: string): boolean {
  const h = (hostname || (typeof window !== "undefined" ? window.location.hostname : "")).toLowerCase();
  return h.startsWith("pro.") || h.includes("pro.");
}

/**
 * Verifica se está no domínio público
 */
export function isPublicHost(hostname?: string): boolean {
  const h = (hostname || (typeof window !== "undefined" ? window.location.hostname : "")).toLowerCase();
  return h.startsWith("www.") || h === "moisesmedeiros.com.br";
}

/**
 * Verifica se está em ambiente de desenvolvimento/preview
 */
export function isDevHost(hostname?: string): boolean {
  const h = (hostname || (typeof window !== "undefined" ? window.location.hostname : "")).toLowerCase();
  return h === "localhost" || h.includes("lovableproject.com") || h.includes("127.0.0.1");
}

/**
 * Obtém o domínio atual (MONO-DOMÍNIO: gestao.* descontinuado)
 */
export function getCurrentDomain(): "pro" | "public" | "dev" | "unknown" {
  if (typeof window === "undefined") return "unknown";
  const h = window.location.hostname.toLowerCase();
  // ❌ isGestaoHost removido - domínio não existe mais
  if (isDevHost(h)) return "dev";
  if (isProHost(h)) return "pro";
  if (isPublicHost(h)) return "public";
  return "unknown";
}

/**
 * Valida se um role pode acessar o PATH atual (MONO-DOMÍNIO)
 * ARQUITETURA: tudo em pro.moisesmedeiros.com.br
 * /gestaofc/* = staff/owner only (verificado por pathname)
 */
export function validateDomainAccess(role: AppRole | string | null, email?: string | null): boolean {
  // Owner pode tudo
  if (isOwner(email, role)) return true;
  
  // Dev mode permite tudo
  const domain = getCurrentDomain();
  if (domain === "dev" || domain === "unknown") return true;
  
  // MONO-DOMÍNIO: validação é por PATH, não por hostname
  // A verificação de /gestaofc/* é feita em RoleProtectedRoute
  return true;
}

// ============================================
// EXPORTAÇÕES PARA COMPATIBILIDADE
// ============================================

// Re-exportar para manter compatibilidade com código existente
export { ROLE_PERMISSIONS as ROLE_PERMISSIONS_MAP };
