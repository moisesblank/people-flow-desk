// ============================================
// 🔥🛡️ URL ACCESS CONTROL OMEGA v4.0 🛡️🔥
// CONTROLE DE ACESSO SUPREMO - NÍVEL NASA
// ============================================
// 📍 MAPA DE URLs DEFINITIVO (REGRA SUPREMA):
// ┌───────────────────────────────────────────────────────────────────┐
// │ QUEM             │ URL BASE                           │ VALIDAÇÃO│
// ├───────────────────────────────────────────────────────────────────┤
// │ 🌐 NÃO PAGANTE   │ pro.moisesmedeiros.com.br/         │ viewer   │
// │                  │ pro.moisesmedeiros.com.br/comunidade│          │
// ├───────────────────────────────────────────────────────────────────┤
// │ 👨‍🎓 ALUNO BETA    │ pro.moisesmedeiros.com.br/alunos   │ beta     │
// │                  │ + /comunidade (acesso incluído)     │          │
// ├───────────────────────────────────────────────────────────────────┤
// │ 👔 FUNCIONÁRIO   │ gestao.moisesmedeiros.com.br/gestao│ func     │
// ├───────────────────────────────────────────────────────────────────┤
// │ 👑 OWNER         │ TODAS                              │ owner    │
// └───────────────────────────────────────────────────────────────────┘
// Owner Master: moisesblank@gmail.com = PODE TUDO
// ============================================

// ============================================
// CONSTANTES GLOBAIS IMUTÁVEIS
// ============================================

/**
 * 👑 Email do Owner Master - ACESSO SUPREMO
 * IMUTÁVEL - Definido na CONSTITUIÇÃO SYNAPSE
 */
export const OWNER_EMAIL = "moisesblank@gmail.com";

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
export type AppRole =
  // 👑 MASTER
  | "owner"          // MASTER - PODE TUDO
  // 👔 GESTÃO (funcionários)
  | "admin"          // Administrador
  | "funcionario"    // Funcionário padrão
  | "employee"       // Alias para funcionário
  | "suporte"        // Suporte ao cliente
  | "coordenacao"    // Coordenação pedagógica
  | "monitoria"      // Monitor/Tutor
  | "marketing"      // Equipe de marketing
  | "contabilidade"  // Contabilidade
  | "professor"      // Professor convidado
  | "afiliado"       // Afiliado externo
  // 👨‍🎓 ALUNOS
  | "beta"           // Aluno pagante (365 dias)
  | "aluno"          // Aluno regular
  | "aluno_gratuito" // Aluno cadastro gratuito
  // 🌐 VISITANTES
  | "viewer";        // Não pagante (cadastro grátis)

/**
 * Domínios/Áreas do sistema
 */
export type SystemDomain = 
  | "publico"     // Qualquer pessoa (/, /auth, /termos)
  | "comunidade"  // Não pagantes + Beta (/comunidade/*)
  | "alunos"      // Alunos pagantes (/alunos/*)
  | "gestao"      // Funcionários (/gestao/*)
  | "owner";      // Apenas owner (/gestao/central-*, /gestao/master)

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

/**
 * Roles que têm bypass de algumas restrições de conteúdo
 * (mas não de acesso a áreas)
 */
export const IMMUNE_ROLES: AppRole[] = [
  "owner",
  "admin",
  "funcionario",
  "employee",
  "suporte",
  "coordenacao",
  "monitoria",
  "professor",
];

/**
 * Roles que podem acessar a área de gestão
 */
export const GESTAO_ROLES: AppRole[] = [
  "owner",
  "admin",
  "funcionario",
  "employee",
  "suporte",
  "coordenacao",
  "monitoria",
  "marketing",
  "contabilidade",
  "professor",
];

/**
 * Roles que podem acessar a área de alunos
 */
export const ALUNO_ROLES: AppRole[] = [
  "owner",
  "admin",
  "beta",
  "aluno",
];

/**
 * Roles que podem acessar a comunidade
 */
export const COMUNIDADE_ROLES: AppRole[] = [
  "owner",
  "admin",
  "beta",
  "aluno",
  "viewer",
];

// ============================================
// MAPEAMENTO DE ROLES PARA CATEGORIAS
// ============================================

export const ROLE_TO_CATEGORY: Record<AppRole, AccessCategory> = {
  owner: "owner",
  admin: "gestao",
  funcionario: "gestao",
  employee: "gestao",
  suporte: "gestao",
  coordenacao: "gestao",
  monitoria: "gestao",
  marketing: "gestao",
  contabilidade: "gestao",
  professor: "gestao",
  afiliado: "gestao",
  beta: "beta",
  aluno: "beta",
  aluno_gratuito: "gratuito",
  viewer: "gratuito",
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
  // 👑 OWNER - SUPREMO
  owner: {
    areas: ["publico", "comunidade", "alunos", "gestao", "owner"],
    canCreate: true,
    canEdit: true,
    canDelete: true,
    canExport: true,
    canImport: true,
    canManageUsers: true,
    canAccessFinance: true,
    canAccessOwnerArea: true,
  },
  // 👔 ADMIN
  admin: {
    areas: ["publico", "comunidade", "alunos", "gestao"],
    canCreate: true,
    canEdit: true,
    canDelete: true,
    canExport: true,
    canImport: true,
    canManageUsers: true,
    canAccessFinance: true,
    canAccessOwnerArea: false,
  },
  // 👔 FUNCIONÁRIO
  funcionario: {
    areas: ["publico", "gestao"],
    canCreate: true,
    canEdit: true,
    canDelete: false,
    canExport: true,
    canImport: false,
    canManageUsers: false,
    canAccessFinance: false,
    canAccessOwnerArea: false,
  },
  // 👔 EMPLOYEE (alias)
  employee: {
    areas: ["publico", "gestao"],
    canCreate: true,
    canEdit: true,
    canDelete: false,
    canExport: true,
    canImport: false,
    canManageUsers: false,
    canAccessFinance: false,
    canAccessOwnerArea: false,
  },
  // 👔 SUPORTE
  suporte: {
    areas: ["publico", "gestao"],
    canCreate: false,
    canEdit: true,
    canDelete: false,
    canExport: true,
    canImport: false,
    canManageUsers: false,
    canAccessFinance: false,
    canAccessOwnerArea: false,
  },
  // 👔 COORDENAÇÃO
  coordenacao: {
    areas: ["publico", "gestao"],
    canCreate: true,
    canEdit: true,
    canDelete: false,
    canExport: true,
    canImport: false,
    canManageUsers: false,
    canAccessFinance: false,
    canAccessOwnerArea: false,
  },
  // 👔 MONITORIA
  monitoria: {
    areas: ["publico", "gestao"],
    canCreate: false,
    canEdit: true,
    canDelete: false,
    canExport: false,
    canImport: false,
    canManageUsers: false,
    canAccessFinance: false,
    canAccessOwnerArea: false,
  },
  // 👔 MARKETING
  marketing: {
    areas: ["publico", "gestao"],
    canCreate: true,
    canEdit: true,
    canDelete: false,
    canExport: true,
    canImport: true,
    canManageUsers: false,
    canAccessFinance: false,
    canAccessOwnerArea: false,
  },
  // 👔 CONTABILIDADE
  contabilidade: {
    areas: ["publico", "gestao"],
    canCreate: false,
    canEdit: true,
    canDelete: false,
    canExport: true,
    canImport: true,
    canManageUsers: false,
    canAccessFinance: true,
    canAccessOwnerArea: false,
  },
  // 👔 PROFESSOR
  professor: {
    areas: ["publico", "gestao"],
    canCreate: true,
    canEdit: true,
    canDelete: false,
    canExport: true,
    canImport: true,
    canManageUsers: false,
    canAccessFinance: false,
    canAccessOwnerArea: false,
  },
  // 👨‍🎓 BETA (Aluno Pagante)
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
  // 👨‍🎓 ALUNO
  aluno: {
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
  // 🌐 VIEWER (Não Pagante)
  viewer: {
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
  // 🌐 ALUNO GRATUITO (Cadastro Grátis)
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
  // 🤝 AFILIADO (Parceiro)
  afiliado: {
    areas: ["publico", "gestao"],
    canCreate: false,
    canEdit: false,
    canDelete: false,
    canExport: true,
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
  "/gestao/central-monitoramento",
  "/gestao/central-diagnostico",
  "/gestao/diagnostico-whatsapp",
  "/gestao/diagnostico-webhooks",
  "/gestao/site-programador",
  "/gestao/vida-pessoal",
  "/gestao/pessoal",
  "/gestao/master",
  "/gestao/owner",
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
];

// ============================================
// FUNÇÕES DE VERIFICAÇÃO
// ============================================

/**
 * 👑 Verifica se é o Owner Master (email OU role)
 * Owner tem BYPASS TOTAL para qualquer verificação
 */
export function isOwner(email?: string | null, role?: string | null): boolean {
  const emailMatch = email?.toLowerCase().trim() === OWNER_EMAIL.toLowerCase();
  const roleMatch = role === "owner";
  return emailMatch || roleMatch;
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
 */
export function getRolePermissions(role?: string | null): RolePermissions {
  if (!role) return ROLE_PERMISSIONS.viewer;
  return ROLE_PERMISSIONS[role as AppRole] || ROLE_PERMISSIONS.viewer;
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
  
  // 👔 Gestão
  if (path.startsWith("/gestao")) {
    return "gestao";
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
      redirectTo: "/gestao/dashboard",
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
 * Obtém a URL de redirecionamento após login baseado na role
 */
export function getPostLoginRedirect(role?: string | null, email?: string | null): string {
  // 👑 Owner vai para dashboard de gestão
  if (isOwner(email, role)) {
    return "/gestao/dashboard";
  }
  
  if (!role) return "/";
  
  const category = getRoleCategory(role);
  
  switch (category) {
    case "owner":
      return "/gestao/dashboard";
    case "gestao":
      return "/gestao/dashboard";
    case "beta":
      return "/alunos";
    case "gratuito":
      return "/comunidade";
    default:
      return "/";
  }
}

/**
 * Obtém a URL de redirecionamento quando acesso é negado
 */
export function getAccessDeniedRedirect(role?: string | null): string {
  if (!role) return "/auth";
  
  const category = getRoleCategory(role);
  
  switch (category) {
    case "owner":
    case "gestao":
      return "/gestao/dashboard";
    case "beta":
      return "/alunos";
    case "gratuito":
      return "/comunidade";
    default:
      return "/";
  }
}

// ============================================
// FUNÇÕES DE DETECÇÃO DE DOMÍNIO
// ============================================

/**
 * Verifica se está no domínio de gestão
 */
export function isGestaoHost(hostname?: string): boolean {
  const h = (hostname || (typeof window !== "undefined" ? window.location.hostname : "")).toLowerCase();
  return h.startsWith("gestao.") || h.includes("gestao.");
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
 * Obtém o domínio atual
 */
export function getCurrentDomain(): "gestao" | "pro" | "public" | "dev" | "unknown" {
  if (typeof window === "undefined") return "unknown";
  const h = window.location.hostname.toLowerCase();
  if (isGestaoHost(h)) return "gestao";
  if (isProHost(h)) return "pro";
  if (isPublicHost(h)) return "public";
  if (isDevHost(h)) return "dev";
  return "unknown";
}

/**
 * Valida se um role pode acessar o domínio atual
 * Regra: funcionários só acessam gestao.*, alunos só acessam pro.*
 */
export function validateDomainAccess(role: AppRole | string | null, email?: string | null): boolean {
  // Owner pode tudo
  if (isOwner(email, role)) return true;
  
  // Dev mode permite tudo
  const domain = getCurrentDomain();
  if (domain === "dev" || domain === "unknown") return true;
  
  if (!role) return domain === "public";
  
  const category = getRoleCategory(role);
  
  switch (domain) {
    case "gestao":
      // Apenas roles de gestão podem acessar gestao.*
      return category === "owner" || category === "gestao";
    case "pro":
      // Roles de aluno ou gestão podem acessar pro.*
      return category === "owner" || category === "gestao" || category === "beta" || category === "gratuito";
    case "public":
      // Qualquer um pode acessar área pública
      return true;
    default:
      return true;
  }
}

// ============================================
// EXPORTAÇÕES PARA COMPATIBILIDADE
// ============================================

// Re-exportar para manter compatibilidade com código existente
export { ROLE_PERMISSIONS as ROLE_PERMISSIONS_MAP };
