// ============================================
// 🔥🛡️ URL ACCESS CONTROL OMEGA v3.0 🛡️🔥
// CONTROLE DE ACESSO POR URL E ROLE
// ============================================
// 📍 MAPA DE URLs DEFINITIVO (REGRA SUPREMA):
// ┌───────────────────────────────────────────────────────────────────┐
// │ QUEM             │ URL BASE                           │ VALIDAÇÃO│
// ├───────────────────────────────────────────────────────────────────┤
// │ 🌐 NÃO PAGANTE   │ pro.moisesmedeiros.com.br/         │ viewer   │
// │ 👨‍🎓 ALUNO BETA    │ pro.moisesmedeiros.com.br/alunos   │ beta     │
// │ 👔 FUNCIONÁRIO   │ gestao.moisesmedeiros.com.br/gestao│ func     │
// │ 👑 OWNER         │ TODAS                              │ owner    │
// └───────────────────────────────────────────────────────────────────┘
// Owner Master: moisesblank@gmail.com = PODE TUDO
// ============================================

// ============================================
// CONSTANTES GLOBAIS
// ============================================

/**
 * Email do Owner Master - ACESSO SUPREMO
 */
export const OWNER_EMAIL = "moisesblank@gmail.com";

/**
 * Todas as roles do sistema
 */
export type AppRole =
  | "owner"         // MASTER - PODE TUDO
  | "admin"         // Administrador
  | "funcionario"   // Funcionário padrão
  | "suporte"       // Suporte ao cliente
  | "coordenacao"   // Coordenação pedagógica
  | "monitoria"     // Monitor/Tutor
  | "marketing"     // Equipe de marketing
  | "contabilidade" // Contabilidade
  | "professor"     // Professor convidado
  | "beta"          // Aluno pagante (365 dias)
  | "aluno"         // Aluno regular
  | "viewer"        // Não pagante (cadastro grátis)
  | "employee";     // Alias para funcionário

/**
 * Áreas do sistema
 */
export type SystemDomain = "publico" | "comunidade" | "alunos" | "gestao" | "owner";

// ============================================
// ROLES IMUNES (NUNCA BLOQUEADOS)
// ============================================

export const IMMUNE_ROLES: AppRole[] = [
  "owner",
  "admin",
  "funcionario",
  "suporte",
  "coordenacao",
  "monitoria",
  "employee",
];

// ============================================
// MAPEAMENTO DE ROLES PARA ÁREAS
// ============================================

export const ROLE_PERMISSIONS: Record<AppRole, {
  areas: SystemDomain[];
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canExport: boolean;
  canImport: boolean;
}> = {
  owner: {
    areas: ["publico", "comunidade", "alunos", "gestao", "owner"],
    canCreate: true,
    canEdit: true,
    canDelete: true,
    canExport: true,
    canImport: true,
  },
  admin: {
    areas: ["publico", "comunidade", "alunos", "gestao"],
    canCreate: true,
    canEdit: true,
    canDelete: true,
    canExport: true,
    canImport: true,
  },
  funcionario: {
    areas: ["publico", "gestao"],
    canCreate: true,
    canEdit: true,
    canDelete: false,
    canExport: true,
    canImport: false,
  },
  employee: {
    areas: ["publico", "gestao"],
    canCreate: true,
    canEdit: true,
    canDelete: false,
    canExport: true,
    canImport: false,
  },
  suporte: {
    areas: ["publico", "gestao"],
    canCreate: false,
    canEdit: true,
    canDelete: false,
    canExport: true,
    canImport: false,
  },
  coordenacao: {
    areas: ["publico", "gestao"],
    canCreate: true,
    canEdit: true,
    canDelete: false,
    canExport: true,
    canImport: false,
  },
  monitoria: {
    areas: ["publico", "gestao"],
    canCreate: false,
    canEdit: true,
    canDelete: false,
    canExport: false,
    canImport: false,
  },
  marketing: {
    areas: ["publico", "gestao"],
    canCreate: true,
    canEdit: true,
    canDelete: false,
    canExport: true,
    canImport: true,
  },
  contabilidade: {
    areas: ["publico", "gestao"],
    canCreate: false,
    canEdit: true,
    canDelete: false,
    canExport: true,
    canImport: true,
  },
  professor: {
    areas: ["publico", "gestao"],
    canCreate: true,
    canEdit: true,
    canDelete: false,
    canExport: true,
    canImport: true,
  },
  beta: {
    areas: ["publico", "comunidade", "alunos"],
    canCreate: false,
    canEdit: false,
    canDelete: false,
    canExport: false,
    canImport: false,
  },
  aluno: {
    areas: ["publico", "comunidade", "alunos"],
    canCreate: false,
    canEdit: false,
    canDelete: false,
    canExport: false,
    canImport: false,
  },
  viewer: {
    areas: ["publico", "comunidade"],
    canCreate: false,
    canEdit: false,
    canDelete: false,
    canExport: false,
    canImport: false,
  },
};

// ============================================
// FUNÇÕES DE VERIFICAÇÃO
// ============================================

/**
 * Verifica se é o Owner Master (email + role)
 */
export function isOwner(email?: string | null, role?: string | null): boolean {
  const emailMatch = email?.toLowerCase() === OWNER_EMAIL.toLowerCase();
  const roleMatch = role === "owner";
  return emailMatch || roleMatch;
}

/**
 * Verifica se a role é imune a restrições
 */
export function isImmune(role?: string | null): boolean {
  if (!role) return false;
  return IMMUNE_ROLES.includes(role as AppRole);
}

/**
 * Obtém as permissões de uma role
 */
export function getRolePermissions(role?: string | null) {
  if (!role) return ROLE_PERMISSIONS.viewer;
  return ROLE_PERMISSIONS[role as AppRole] || ROLE_PERMISSIONS.viewer;
}

/**
 * Verifica se uma role pode acessar uma área
 */
export function canAccessArea(role: string | null, area: SystemDomain): boolean {
  const permissions = getRolePermissions(role);
  return permissions.areas.includes(area);
}

/**
 * Determina a área de uma URL
 */
export function getUrlArea(pathname: string): SystemDomain {
  const path = pathname.toLowerCase();
  
  // Owner only
  if (
    path.includes("/central-monitoramento") ||
    path.includes("/diagnostico-") ||
    path.includes("/site-programador") ||
    path.includes("/central-diagnostico") ||
    path.includes("/vida-pessoal") ||
    path.includes("/pessoal") ||
    path.includes("/master") ||
    path.includes("/owner")
  ) {
    return "owner";
  }
  
  // Gestão
  if (path.startsWith("/gestao")) {
    return "gestao";
  }
  
  // Alunos
  if (path.startsWith("/alunos")) {
    return "alunos";
  }
  
  // Comunidade
  if (path.startsWith("/comunidade")) {
    return "comunidade";
  }
  
  // Público
  return "publico";
}

/**
 * Verifica se uma role pode acessar uma URL
 */
export function canAccessUrl(
  role: string | null,
  email: string | null,
  pathname: string
): boolean {
  // Owner MASTER tem acesso total
  if (isOwner(email, role)) {
    return true;
  }
  
  const area = getUrlArea(pathname);
  return canAccessArea(role, area);
}

/**
 * Obtém a URL de redirecionamento após login baseado na role
 */
export function getPostLoginRedirect(role?: string | null, email?: string | null): string {
  // Owner vai para dashboard de gestão
  if (isOwner(email, role)) {
    return "/gestao/dashboard";
  }
  
  if (!role) return "/";
  
  const r = role as AppRole;
  
  // Alunos pagantes
  if (r === "beta" || r === "aluno") {
    return "/alunos";
  }
  
  // Não pagantes
  if (r === "viewer") {
    return "/comunidade";
  }
  
  // Funcionários e staff
  if (
    r === "funcionario" || 
    r === "employee" || 
    r === "admin" ||
    r === "suporte" ||
    r === "coordenacao" ||
    r === "monitoria" ||
    r === "marketing" ||
    r === "contabilidade" ||
    r === "professor"
  ) {
    return "/gestao/dashboard";
  }
  
  return "/";
}

/**
 * Obtém a URL de redirecionamento quando acesso é negado
 */
export function getAccessDeniedRedirect(role?: string | null): string {
  if (!role) return "/auth";
  
  const r = role as AppRole;
  
  if (r === "beta" || r === "aluno") {
    return "/alunos";
  }
  
  if (r === "viewer") {
    return "/comunidade";
  }
  
  if (IMMUNE_ROLES.includes(r)) {
    return "/gestao/dashboard";
  }
  
  return "/";
}
