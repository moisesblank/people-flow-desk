// ============================================
// 🔥🛡️ URL ACCESS CONTROL — MAPA DEFINITIVO 🛡️🔥
// Controle de acesso baseado em domínio + role
// ZERO ACESSO INDEVIDO
// ============================================

// ============================================
// MAPA DE URLs DEFINITIVO (REGRA SUPREMA)
// ============================================
// 🌐 NÃO PAGANTE   → pro.moisesmedeiros.com.br/        → Criar conta = livre
// 👨‍🎓 ALUNO BETA    → pro.moisesmedeiros.com.br/alunos  → role='beta' + acesso
// 👔 FUNCIONÁRIO   → gestao.moisesmedeiros.com.br/     → role='funcionario'
// 👑 OWNER         → TODAS                              → role='owner'
// ============================================

export type UserRole = 
  | "owner"
  | "admin"
  | "funcionario"
  | "suporte"
  | "coordenacao"
  | "monitoria"
  | "afiliado"
  | "marketing"
  | "contabilidade"
  | "professor"
  | "aluno"
  | "beta"
  | "viewer"
  | null;

export type DomainType = "gestao" | "pro" | "unknown";

export interface AccessCheckResult {
  allowed: boolean;
  reason: string;
  redirectTo?: string;
  requiresAuth: boolean;
}

// ============================================
// CONFIGURAÇÃO DE DOMÍNIOS
// ============================================
export const DOMAIN_CONFIG = {
  gestao: {
    hostname: "gestao.moisesmedeiros.com.br",
    allowedRoles: ["owner", "admin", "funcionario", "suporte", "coordenacao", "monitoria", "marketing", "contabilidade", "professor"] as UserRole[],
    defaultRedirect: "/dashboard",
    loginRedirect: "/auth",
    noAccessRedirect: "https://pro.moisesmedeiros.com.br/",
  },
  pro: {
    hostname: "pro.moisesmedeiros.com.br",
    allowedRoles: ["owner", "admin", "beta", "aluno", "viewer"] as UserRole[],
    defaultRedirect: "/",
    loginRedirect: "/auth",
    noAccessRedirect: "/area-gratuita",
  },
  localhost: {
    hostname: "localhost",
    allowedRoles: ["owner", "admin", "funcionario", "suporte", "coordenacao", "monitoria", "afiliado", "marketing", "contabilidade", "professor", "aluno", "beta", "viewer"] as UserRole[],
    defaultRedirect: "/dashboard",
    loginRedirect: "/auth",
    noAccessRedirect: "/",
  },
};

// ============================================
// ROTAS PÚBLICAS (SEM AUTH)
// ============================================
export const PUBLIC_ROUTES = [
  "/",
  "/site",
  "/auth",
  "/termos",
  "/privacidade",
  "/area-gratuita",
  "/home",
];

// ============================================
// ROTAS DO PORTAL ALUNO (PRO + BETA/ALUNO)
// ============================================
export const ALUNO_ROUTES_PREFIX = "/alunos";

export const ALUNO_ROUTES = [
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
];

// ============================================
// ROTAS DE GESTÃO (GESTAO + FUNCIONARIO)
// ============================================
export const GESTAO_ROUTES = [
  "/dashboard",
  "/dashboard-executivo",
  "/tarefas",
  "/integracoes",
  "/calendario",
  "/funcionarios",
  "/documentos",
  "/marketing",
  "/lancamento",
  "/metricas",
  "/arquivos",
  "/area-professor",
  "/planejamento-aula",
  "/laboratorio",
  "/turmas-online",
  "/turmas-presenciais",
  "/cursos",
  "/simulados",
  "/lives",
  "/entradas",
  "/financas-empresa",
  "/financas-pessoais",
  "/pagamentos",
  "/contabilidade",
  "/transacoes-hotmart",
  "/gestao-alunos",
  "/portal-aluno",
  "/relatorios",
  "/afiliados",
  "/vida-pessoal",
  "/pessoal",
  "/permissoes",
  "/configuracoes",
  "/gestao-equipe",
  "/gestao-site",
  "/gestao-dispositivos",
  "/auditoria-acessos",
  "/central-monitoramento",
  "/monitoramento",
  "/central-whatsapp",
  "/whatsapp-live",
  "/diagnostico-whatsapp",
  "/diagnostico-webhooks",
  "/central-metricas",
  "/central-ias",
  "/leads-whatsapp",
  "/site-programador",
  "/central-diagnostico",
  "/empresas/dashboard",
  "/empresas/receitas",
  "/empresas/arquivos",
  "/empresas/rh",
  "/perfil",
  "/guia",
];

// ============================================
// ROTAS EXCLUSIVAS DO OWNER
// ============================================
export const OWNER_ONLY_ROUTES = [
  "/central-monitoramento",
  "/diagnostico-whatsapp",
  "/diagnostico-webhooks",
  "/site-programador",
  "/central-diagnostico",
  "/vida-pessoal",
  "/pessoal",
];

// ============================================
// FUNÇÕES DE VERIFICAÇÃO
// ============================================

/**
 * Detecta o domínio atual
 */
export function detectDomain(): DomainType {
  if (typeof window === "undefined") return "unknown";
  
  const hostname = window.location.hostname;
  
  if (hostname.includes("gestao.moisesmedeiros")) return "gestao";
  if (hostname.includes("pro.moisesmedeiros")) return "pro";
  if (hostname.includes("localhost") || hostname.includes("127.0.0.1")) return "gestao"; // Dev = gestão
  
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
 * Verifica se é uma rota do portal do aluno
 */
export function isAlunoRoute(path: string): boolean {
  return path.startsWith(ALUNO_ROUTES_PREFIX);
}

/**
 * Verifica se é uma rota de gestão
 */
export function isGestaoRoute(path: string): boolean {
  return GESTAO_ROUTES.some(route => 
    path === route || path.startsWith(route + "/")
  );
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
 */
export function checkRouteAccess(
  path: string,
  role: UserRole,
  isAuthenticated: boolean
): AccessCheckResult {
  const domain = detectDomain();
  
  // 1. Rotas públicas — sempre permitido
  if (isPublicRoute(path)) {
    return {
      allowed: true,
      reason: "PUBLIC_ROUTE",
      requiresAuth: false,
    };
  }
  
  // 2. Não autenticado — redireciona para login
  if (!isAuthenticated) {
    return {
      allowed: false,
      reason: "NOT_AUTHENTICATED",
      redirectTo: "/auth",
      requiresAuth: true,
    };
  }
  
  // 3. Owner — acesso total
  if (role === "owner") {
    return {
      allowed: true,
      reason: "OWNER_ACCESS",
      requiresAuth: true,
    };
  }
  
  // 4. Rotas exclusivas do owner
  if (isOwnerOnlyRoute(path)) {
    return {
      allowed: false,
      reason: "OWNER_ONLY",
      redirectTo: "/dashboard",
      requiresAuth: true,
    };
  }
  
  // 5. Verificação por domínio
  if (domain === "gestao") {
    // Domínio de gestão — apenas funcionários
    const allowedRoles = DOMAIN_CONFIG.gestao.allowedRoles;
    if (role && allowedRoles.includes(role)) {
      return {
        allowed: true,
        reason: "GESTAO_AUTHORIZED",
        requiresAuth: true,
      };
    }
    
    return {
      allowed: false,
      reason: "NOT_ALLOWED_ON_GESTAO",
      redirectTo: "https://pro.moisesmedeiros.com.br/",
      requiresAuth: true,
    };
  }
  
  if (domain === "pro") {
    // Rotas do portal aluno
    if (isAlunoRoute(path)) {
      if (role === "beta" || role === "aluno" || role === "admin") {
        return {
          allowed: true,
          reason: "ALUNO_AUTHORIZED",
          requiresAuth: true,
        };
      }
      
      return {
        allowed: false,
        reason: "NOT_BETA_OR_ALUNO",
        redirectTo: "/area-gratuita",
        requiresAuth: true,
      };
    }
    
    // Outras rotas no domínio pro
    const allowedRoles = DOMAIN_CONFIG.pro.allowedRoles;
    if (role && allowedRoles.includes(role)) {
      return {
        allowed: true,
        reason: "PRO_AUTHORIZED",
        requiresAuth: true,
      };
    }
    
    return {
      allowed: false,
      reason: "NOT_ALLOWED_ON_PRO",
      redirectTo: "/area-gratuita",
      requiresAuth: true,
    };
  }
  
  // 6. Fallback — negar
  return {
    allowed: false,
    reason: "UNKNOWN_DOMAIN",
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
  isAuthenticated: boolean
): boolean {
  const result = checkRouteAccess(route, role, isAuthenticated);
  return result.allowed;
}

/**
 * Retorna a URL de redirecionamento após login
 */
export function getPostLoginRedirect(role: UserRole): string {
  if (role === "owner" || role === "admin") {
    return "/dashboard";
  }
  
  if (role === "beta" || role === "aluno") {
    return "/alunos/dashboard";
  }
  
  const domain = detectDomain();
  
  if (domain === "gestao") {
    return "/dashboard";
  }
  
  if (domain === "pro") {
    return "/alunos";
  }
  
  return "/dashboard";
}

/**
 * Gera relatório de acesso para logs
 */
export function generateAccessReport(
  path: string,
  role: UserRole,
  isAuthenticated: boolean
): {
  path: string;
  domain: DomainType;
  role: UserRole;
  isAuthenticated: boolean;
  result: AccessCheckResult;
  timestamp: string;
} {
  return {
    path,
    domain: detectDomain(),
    role,
    isAuthenticated,
    result: checkRouteAccess(path, role, isAuthenticated),
    timestamp: new Date().toISOString(),
  };
}

// ============================================
// EXPORTS
// ============================================
export default {
  DOMAIN_CONFIG,
  PUBLIC_ROUTES,
  ALUNO_ROUTES,
  GESTAO_ROUTES,
  OWNER_ONLY_ROUTES,
  detectDomain,
  isPublicRoute,
  isAlunoRoute,
  isGestaoRoute,
  isOwnerOnlyRoute,
  checkRouteAccess,
  canSeeMenuItem,
  getPostLoginRedirect,
  generateAccessReport,
};
