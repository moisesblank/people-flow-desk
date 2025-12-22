// ============================================
// 🔥🛡️ URL ACCESS CONTROL — MAPA DEFINITIVO OMEGA 🛡️🔥
// PROJETO DA VIDA DO MESTRE MOISÉS MEDEIROS
// REGRA MANDATÓRIA — OBEDECER SEMPRE E EM TEMPO REAL
// ============================================

// ============================================
// 📍 MAPA DE URLs DEFINITIVO (REGRA SUPREMA)
// ============================================
//
// 🌐 NÃO PAGANTE (ÁREA COMUM):
//    - pro.moisesmedeiros.com.br/
//    - pro.moisesmedeiros.com.br/comunidade
//    - Cadastro gratuito = acesso livre a essas áreas
//
// 👨‍🎓 ALUNO BETA (PAGANTE):
//    - pro.moisesmedeiros.com.br/alunos
//    - role='beta' + acesso válido
//    - Acesso a TUDO da área alunos + comunidade
//    - Vem de pagamento OU criado por owner/admin
//
// 👔 FUNCIONÁRIO:
//    - gestao.moisesmedeiros.com.br/gestao
//    - role='funcionario' (ou subcategorias)
//    - Permissões específicas por categoria
//
// 👑 PROPRIETÁRIO (OWNER):
//    - TODAS AS URLs
//    - role='owner'
//    - Email: moisesblank@gmail.com
//    - Função MASTER = PODE TUDO EM TEMPO REAL
//
// ============================================

// ============================================
// OWNER MASTER — PODE TUDO
// ============================================
export const OWNER_EMAIL = "moisesblank@gmail.com";

// ============================================
// TIPOS
// ============================================
export type UserRole = 
  | "owner"      // MASTER — PODE TUDO
  | "admin"      // Administrador
  | "funcionario" // Funcionário genérico
  | "suporte"    // Suporte ao cliente
  | "coordenacao" // Coordenação
  | "monitoria"  // Monitoria
  | "afiliado"   // Afiliado
  | "marketing"  // Marketing
  | "contabilidade" // Contabilidade
  | "professor"  // Professor
  | "beta"       // ALUNO PAGANTE
  | "aluno"      // Aluno (legacy)
  | "viewer"     // Visitante cadastrado (não pagante)
  | null;

export type DomainType = "gestao" | "pro" | "unknown";

export interface AccessCheckResult {
  allowed: boolean;
  reason: string;
  redirectTo?: string;
  requiresAuth: boolean;
  requiresPayment?: boolean;
}

// ============================================
// CONFIGURAÇÃO DE DOMÍNIOS
// ============================================
export const DOMAIN_CONFIG = {
  // 👔 GESTÃO — gestao.moisesmedeiros.com.br
  gestao: {
    hostname: "gestao.moisesmedeiros.com.br",
    basePath: "/gestao",
    // Roles que podem acessar a área de gestão
    allowedRoles: [
      "owner",       // MASTER
      "admin",       // Admin
      "funcionario", // Funcionário genérico
      "suporte",     // Suporte
      "coordenacao", // Coordenação
      "monitoria",   // Monitoria
      "marketing",   // Marketing
      "contabilidade", // Contabilidade
      "professor",   // Professor
    ] as UserRole[],
    defaultRedirect: "/gestao/dashboard",
    loginRedirect: "/auth",
    noAccessRedirect: "https://pro.moisesmedeiros.com.br/",
  },
  
  // 🌐 PRO — pro.moisesmedeiros.com.br
  pro: {
    hostname: "pro.moisesmedeiros.com.br",
    basePath: "/",
    // Roles que podem acessar o domínio pro
    allowedRoles: [
      "owner",   // MASTER
      "admin",   // Admin
      "beta",    // ALUNO PAGANTE
      "aluno",   // Aluno legacy
      "viewer",  // Visitante cadastrado
    ] as UserRole[],
    defaultRedirect: "/",
    loginRedirect: "/auth",
    noAccessRedirect: "/",
  },
  
  // 💻 LOCALHOST (desenvolvimento)
  localhost: {
    hostname: "localhost",
    basePath: "/",
    allowedRoles: [
      "owner", "admin", "funcionario", "suporte", "coordenacao", 
      "monitoria", "afiliado", "marketing", "contabilidade", 
      "professor", "beta", "aluno", "viewer"
    ] as UserRole[],
    defaultRedirect: "/dashboard",
    loginRedirect: "/auth",
    noAccessRedirect: "/",
  },
};

// ============================================
// 🌐 ROTAS PÚBLICAS (SEM AUTH - QUALQUER UM)
// ============================================
export const PUBLIC_ROUTES = [
  "/",
  "/site",
  "/auth",
  "/termos",
  "/privacidade",
  "/home",
  "/area-gratuita",
  "/cadastro",
  "/login",
  "/recuperar-senha",
];

// ============================================
// 🌐 ROTAS DA COMUNIDADE (NÃO PAGANTE + BETA)
// Cadastro gratuito = acesso
// ============================================
export const COMUNIDADE_ROUTES = [
  "/comunidade",
  "/comunidade/forum",
  "/comunidade/posts",
  "/comunidade/membros",
  "/comunidade/eventos",
  "/comunidade/chat",
];

// ============================================
// 👨‍🎓 ROTAS DO ALUNO BETA (PAGANTE)
// role='beta' obrigatório
// ============================================
export const ALUNO_BETA_ROUTES_PREFIX = "/alunos";

export const ALUNO_BETA_ROUTES = [
  "/alunos",
  "/alunos/dashboard",
  "/alunos/cronograma",
  "/alunos/videoaulas",
  "/alunos/materiais",
  "/alunos/resumos",
  "/alunos/mapas-mentais",
  "/alunos/questoes",
  "/alunos/simulados",
  "/alunos/redacao",
  "/alunos/desempenho",
  "/alunos/ranking",
  "/alunos/conquistas",
  "/alunos/tutoria",
  "/alunos/forum",
  "/alunos/lives",
  "/alunos/duvidas",
  "/alunos/revisao",
  "/alunos/laboratorio",
  "/alunos/calculadora",
  "/alunos/tabela-periodica",
  "/alunos/flashcards",
  "/alunos/metas",
  "/alunos/agenda",
  "/alunos/certificados",
  "/alunos/perfil",
  "/alunos/cursos",
  "/alunos/aulas",
  "/alunos/progresso",
  "/alunos/historico",
];

// ============================================
// 👔 ROTAS DE GESTÃO (FUNCIONÁRIOS)
// gestao.moisesmedeiros.com.br/gestao/*
// ============================================
export const GESTAO_ROUTES_PREFIX = "/gestao";

export const GESTAO_ROUTES = [
  "/gestao",
  "/gestao/dashboard",
  "/gestao/dashboard-executivo",
  "/gestao/tarefas",
  "/gestao/integracoes",
  "/gestao/calendario",
  "/gestao/funcionarios",
  "/gestao/documentos",
  "/gestao/marketing",
  "/gestao/lancamento",
  "/gestao/metricas",
  "/gestao/arquivos",
  "/gestao/area-professor",
  "/gestao/planejamento-aula",
  "/gestao/laboratorio",
  "/gestao/turmas-online",
  "/gestao/turmas-presenciais",
  "/gestao/cursos",
  "/gestao/simulados",
  "/gestao/lives",
  "/gestao/entradas",
  "/gestao/financas-empresa",
  "/gestao/financas-pessoais",
  "/gestao/pagamentos",
  "/gestao/contabilidade",
  "/gestao/transacoes-hotmart",
  "/gestao/gestao-alunos",
  "/gestao/portal-aluno",
  "/gestao/relatorios",
  "/gestao/afiliados",
  "/gestao/permissoes",
  "/gestao/configuracoes",
  "/gestao/gestao-equipe",
  "/gestao/gestao-site",
  "/gestao/gestao-dispositivos",
  "/gestao/auditoria-acessos",
  "/gestao/central-monitoramento",
  "/gestao/monitoramento",
  "/gestao/central-whatsapp",
  "/gestao/whatsapp-live",
  "/gestao/leads-whatsapp",
  "/gestao/central-metricas",
  "/gestao/central-ias",
  "/gestao/empresas/dashboard",
  "/gestao/empresas/receitas",
  "/gestao/empresas/arquivos",
  "/gestao/empresas/rh",
  "/gestao/perfil",
  "/gestao/guia",
];

// ============================================
// 👑 ROTAS EXCLUSIVAS DO OWNER
// Apenas moisesblank@gmail.com
// ============================================
export const OWNER_ONLY_ROUTES = [
  "/gestao/central-monitoramento",
  "/gestao/diagnostico-whatsapp",
  "/gestao/diagnostico-webhooks",
  "/gestao/site-programador",
  "/gestao/central-diagnostico",
  "/gestao/vida-pessoal",
  "/gestao/pessoal",
  "/gestao/master",
  "/gestao/owner",
  "/central-diagnostico",
];

// ============================================
// FUNÇÕES DE VERIFICAÇÃO
// ============================================

/**
 * Verifica se é o OWNER MASTER
 */
export function isOwner(email?: string | null, role?: UserRole): boolean {
  if (role === "owner") return true;
  if (email?.toLowerCase() === OWNER_EMAIL.toLowerCase()) return true;
  return false;
}

/**
 * Detecta o domínio atual
 */
export function detectDomain(): DomainType {
  if (typeof window === "undefined") return "unknown";
  
  const hostname = window.location.hostname;
  
  if (hostname.includes("gestao.moisesmedeiros")) return "gestao";
  if (hostname.includes("pro.moisesmedeiros")) return "pro";
  if (hostname.includes("localhost") || hostname.includes("127.0.0.1")) {
    // No localhost, detectar pelo path
    const path = window.location.pathname;
    if (path.startsWith("/gestao")) return "gestao";
    return "pro"; // Default para pro no dev
  }
  
  return "unknown";
}

/**
 * Verifica se é uma rota pública
 */
export function isPublicRoute(path: string): boolean {
  return PUBLIC_ROUTES.some(route => 
    path === route || path.startsWith(route + "/")
  );
}

/**
 * Verifica se é uma rota da comunidade (não pagante)
 */
export function isComunidadeRoute(path: string): boolean {
  return COMUNIDADE_ROUTES.some(route => 
    path === route || path.startsWith(route + "/")
  ) || path === "/comunidade";
}

/**
 * Verifica se é uma rota do portal do aluno BETA (pagante)
 */
export function isAlunoBetaRoute(path: string): boolean {
  return path.startsWith(ALUNO_BETA_ROUTES_PREFIX);
}

/**
 * Verifica se é uma rota de gestão (funcionários)
 */
export function isGestaoRoute(path: string): boolean {
  return path.startsWith(GESTAO_ROUTES_PREFIX) || 
         GESTAO_ROUTES.some(route => path === route || path.startsWith(route + "/"));
}

/**
 * Verifica se é uma rota exclusiva do owner
 */
export function isOwnerOnlyRoute(path: string): boolean {
  return OWNER_ONLY_ROUTES.some(route => 
    path === route || path.startsWith(route + "/")
  );
}

/**
 * Verifica se o usuário pode acessar uma rota
 * REGRA MANDATÓRIA — OBEDECER SEMPRE
 */
export function checkRouteAccess(
  path: string,
  role: UserRole,
  isAuthenticated: boolean,
  email?: string | null
): AccessCheckResult {
  const domain = detectDomain();
  
  // ============================================
  // 👑 OWNER MASTER — PODE TUDO EM TEMPO REAL
  // ============================================
  if (isOwner(email, role)) {
    return {
      allowed: true,
      reason: "OWNER_MASTER_ACCESS",
      requiresAuth: true,
    };
  }
  
  // ============================================
  // 1. ROTAS PÚBLICAS — QUALQUER UM
  // ============================================
  if (isPublicRoute(path)) {
    return {
      allowed: true,
      reason: "PUBLIC_ROUTE",
      requiresAuth: false,
    };
  }
  
  // ============================================
  // 2. NÃO AUTENTICADO — REDIRECIONA PARA LOGIN
  // ============================================
  if (!isAuthenticated) {
    return {
      allowed: false,
      reason: "NOT_AUTHENTICATED",
      redirectTo: "/auth",
      requiresAuth: true,
    };
  }
  
  // ============================================
  // 3. ROTAS EXCLUSIVAS DO OWNER
  // ============================================
  if (isOwnerOnlyRoute(path)) {
    return {
      allowed: false,
      reason: "OWNER_ONLY",
      redirectTo: domain === "gestao" ? "/gestao/dashboard" : "/",
      requiresAuth: true,
    };
  }
  
  // ============================================
  // 4. ROTAS DA COMUNIDADE (NÃO PAGANTE + BETA)
  //    Qualquer usuário autenticado pode acessar
  // ============================================
  if (isComunidadeRoute(path)) {
    return {
      allowed: true,
      reason: "COMUNIDADE_ROUTE",
      requiresAuth: true,
    };
  }
  
  // ============================================
  // 5. ROTAS DO ALUNO BETA (PAGANTE)
  //    Apenas role='beta' ou superior
  // ============================================
  if (isAlunoBetaRoute(path)) {
    const betaAllowed: UserRole[] = ["owner", "admin", "beta", "aluno"];
    
    if (role && betaAllowed.includes(role)) {
      return {
        allowed: true,
        reason: "ALUNO_BETA_AUTHORIZED",
        requiresAuth: true,
      };
    }
    
    return {
      allowed: false,
      reason: "NOT_BETA_REQUIRES_PAYMENT",
      redirectTo: "/comunidade",
      requiresAuth: true,
      requiresPayment: true,
    };
  }
  
  // ============================================
  // 6. ROTAS DE GESTÃO (FUNCIONÁRIOS)
  //    gestao.moisesmedeiros.com.br/gestao/*
  // ============================================
  if (isGestaoRoute(path)) {
    const gestaoAllowed = DOMAIN_CONFIG.gestao.allowedRoles;
    
    if (role && gestaoAllowed.includes(role)) {
      return {
        allowed: true,
        reason: "GESTAO_FUNCIONARIO_AUTHORIZED",
        requiresAuth: true,
      };
    }
    
    return {
      allowed: false,
      reason: "NOT_FUNCIONARIO",
      redirectTo: "https://pro.moisesmedeiros.com.br/",
      requiresAuth: true,
    };
  }
  
  // ============================================
  // 7. VERIFICAÇÃO POR DOMÍNIO
  // ============================================
  if (domain === "gestao") {
    const allowedRoles = DOMAIN_CONFIG.gestao.allowedRoles;
    if (role && allowedRoles.includes(role)) {
      return {
        allowed: true,
        reason: "GESTAO_DOMAIN_AUTHORIZED",
        requiresAuth: true,
      };
    }
    
    return {
      allowed: false,
      reason: "NOT_ALLOWED_ON_GESTAO_DOMAIN",
      redirectTo: "https://pro.moisesmedeiros.com.br/",
      requiresAuth: true,
    };
  }
  
  if (domain === "pro") {
    const allowedRoles = DOMAIN_CONFIG.pro.allowedRoles;
    if (role && allowedRoles.includes(role)) {
      return {
        allowed: true,
        reason: "PRO_DOMAIN_AUTHORIZED",
        requiresAuth: true,
      };
    }
    
    // Viewer (cadastrado gratuito) pode acessar comunidade
    if (role === "viewer") {
      return {
        allowed: true,
        reason: "VIEWER_LIMITED_ACCESS",
        requiresAuth: true,
      };
    }
    
    return {
      allowed: false,
      reason: "NOT_ALLOWED_ON_PRO_DOMAIN",
      redirectTo: "/comunidade",
      requiresAuth: true,
    };
  }
  
  // ============================================
  // 8. FALLBACK — NEGAR
  // ============================================
  return {
    allowed: false,
    reason: "UNKNOWN_ROUTE_OR_DOMAIN",
    redirectTo: "/auth",
    requiresAuth: true,
  };
}

/**
 * Verifica se o usuário pode ver um item de menu
 */
export function canSeeMenuItem(
  route: string,
  role: UserRole,
  isAuthenticated: boolean,
  email?: string | null
): boolean {
  const result = checkRouteAccess(route, role, isAuthenticated, email);
  return result.allowed;
}

/**
 * Retorna a URL de redirecionamento após login
 */
export function getPostLoginRedirect(role: UserRole, email?: string | null): string {
  // Owner vai para gestão
  if (isOwner(email, role)) {
    return "/gestao/dashboard";
  }
  
  // Funcionários vão para gestão
  const funcionarioRoles: UserRole[] = [
    "admin", "funcionario", "suporte", "coordenacao", 
    "monitoria", "marketing", "contabilidade", "professor"
  ];
  if (role && funcionarioRoles.includes(role)) {
    return "/gestao/dashboard";
  }
  
  // Alunos beta vão para portal do aluno
  if (role === "beta" || role === "aluno") {
    return "/alunos/dashboard";
  }
  
  // Viewers vão para comunidade
  if (role === "viewer") {
    return "/comunidade";
  }
  
  // Default
  const domain = detectDomain();
  if (domain === "gestao") return "/gestao/dashboard";
  return "/comunidade";
}

/**
 * Retorna a área permitida para um role
 */
export function getAllowedAreaForRole(role: UserRole): string[] {
  if (role === "owner") {
    return ["*"]; // Tudo
  }
  
  const funcionarioRoles: UserRole[] = [
    "admin", "funcionario", "suporte", "coordenacao", 
    "monitoria", "marketing", "contabilidade", "professor"
  ];
  
  if (role && funcionarioRoles.includes(role)) {
    return ["gestao", "comunidade"];
  }
  
  if (role === "beta" || role === "aluno") {
    return ["alunos", "comunidade"];
  }
  
  if (role === "viewer") {
    return ["comunidade"];
  }
  
  return [];
}

/**
 * Gera relatório de acesso para logs
 */
export function generateAccessReport(
  path: string,
  role: UserRole,
  isAuthenticated: boolean,
  email?: string | null
): {
  path: string;
  domain: DomainType;
  role: UserRole;
  email: string | null;
  isOwner: boolean;
  isAuthenticated: boolean;
  result: AccessCheckResult;
  timestamp: string;
} {
  return {
    path,
    domain: detectDomain(),
    role,
    email: email || null,
    isOwner: isOwner(email, role),
    isAuthenticated,
    result: checkRouteAccess(path, role, isAuthenticated, email),
    timestamp: new Date().toISOString(),
  };
}

// ============================================
// MAPA DE PERMISSÕES POR ROLE
// ============================================
export const ROLE_PERMISSIONS: Record<UserRole extends null ? never : NonNullable<UserRole>, {
  label: string;
  areas: string[];
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canExport: boolean;
  canImport: boolean;
  isAdmin: boolean;
}> = {
  owner: {
    label: "Proprietário (Master)",
    areas: ["*"],
    canCreate: true,
    canEdit: true,
    canDelete: true,
    canExport: true,
    canImport: true,
    isAdmin: true,
  },
  admin: {
    label: "Administrador",
    areas: ["gestao", "comunidade"],
    canCreate: true,
    canEdit: true,
    canDelete: true,
    canExport: true,
    canImport: true,
    isAdmin: true,
  },
  funcionario: {
    label: "Funcionário",
    areas: ["gestao"],
    canCreate: true,
    canEdit: true,
    canDelete: false,
    canExport: true,
    canImport: false,
    isAdmin: false,
  },
  suporte: {
    label: "Suporte",
    areas: ["gestao"],
    canCreate: false,
    canEdit: true,
    canDelete: false,
    canExport: true,
    canImport: false,
    isAdmin: false,
  },
  coordenacao: {
    label: "Coordenação",
    areas: ["gestao"],
    canCreate: true,
    canEdit: true,
    canDelete: false,
    canExport: true,
    canImport: false,
    isAdmin: false,
  },
  monitoria: {
    label: "Monitoria",
    areas: ["gestao"],
    canCreate: false,
    canEdit: true,
    canDelete: false,
    canExport: false,
    canImport: false,
    isAdmin: false,
  },
  afiliado: {
    label: "Afiliado",
    areas: ["gestao"],
    canCreate: false,
    canEdit: false,
    canDelete: false,
    canExport: true,
    canImport: false,
    isAdmin: false,
  },
  marketing: {
    label: "Marketing",
    areas: ["gestao"],
    canCreate: true,
    canEdit: true,
    canDelete: false,
    canExport: true,
    canImport: true,
    isAdmin: false,
  },
  contabilidade: {
    label: "Contabilidade",
    areas: ["gestao"],
    canCreate: false,
    canEdit: true,
    canDelete: false,
    canExport: true,
    canImport: true,
    isAdmin: false,
  },
  professor: {
    label: "Professor",
    areas: ["gestao"],
    canCreate: true,
    canEdit: true,
    canDelete: false,
    canExport: true,
    canImport: true,
    isAdmin: false,
  },
  beta: {
    label: "Aluno Beta (Pagante)",
    areas: ["alunos", "comunidade"],
    canCreate: false,
    canEdit: false,
    canDelete: false,
    canExport: false,
    canImport: false,
    isAdmin: false,
  },
  aluno: {
    label: "Aluno",
    areas: ["alunos", "comunidade"],
    canCreate: false,
    canEdit: false,
    canDelete: false,
    canExport: false,
    canImport: false,
    isAdmin: false,
  },
  viewer: {
    label: "Visitante (Não Pagante)",
    areas: ["comunidade"],
    canCreate: false,
    canEdit: false,
    canDelete: false,
    canExport: false,
    canImport: false,
    isAdmin: false,
  },
};

// ============================================
// EXPORTS
// ============================================
export default {
  OWNER_EMAIL,
  DOMAIN_CONFIG,
  PUBLIC_ROUTES,
  COMUNIDADE_ROUTES,
  ALUNO_BETA_ROUTES,
  GESTAO_ROUTES,
  OWNER_ONLY_ROUTES,
  ROLE_PERMISSIONS,
  isOwner,
  detectDomain,
  isPublicRoute,
  isComunidadeRoute,
  isAlunoBetaRoute,
  isGestaoRoute,
  isOwnerOnlyRoute,
  checkRouteAccess,
  canSeeMenuItem,
  getPostLoginRedirect,
  getAllowedAreaForRole,
  generateAccessReport,
};
