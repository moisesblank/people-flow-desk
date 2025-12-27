// ============================================
// 🔥 REGRA MATRIZ v3.0 - ARQUITETURA MONO-DOMÍNIO
// MIGRAÇÃO: gestao.* → /gestaofc (área interna)
// DOMÍNIO ÚNICO: pro.moisesmedeiros.com.br
// ============================================

// 📍 MAPA DE URLs DEFINITIVO (ARQUITETURA MONO-DOMÍNIO)
// 
// ┌──────────────────────────────────────────────────────────────────────────────────────┐
// │ QUEM                │ URL                                    │ VALIDAÇÃO            │
// ├──────────────────────────────────────────────────────────────────────────────────────┤
// │ 🌐 NÃO PAGANTE      │ pro.moisesmedeiros.com.br              │ Cadastro gratuito    │
// │                     │ pro.moisesmedeiros.com.br/comunidade   │ + associações        │
// ├──────────────────────────────────────────────────────────────────────────────────────┤
// │ 👨‍🎓 ALUNO BETA       │ pro.moisesmedeiros.com.br/alunos/*     │ role='beta' +        │
// │   (PAGANTE)         │ + /comunidade                          │ acesso válido        │
// │                     │ (Hotmart/Owner/Admin podem criar)      │                      │
// ├──────────────────────────────────────────────────────────────────────────────────────┤
// │ 👔 FUNCIONÁRIO      │ pro.moisesmedeiros.com.br/gestaofc/*   │ role='funcionario'   │
// │                     │ (ÁREA INTERNA RESTRITA)                │ + permissões         │
// ├──────────────────────────────────────────────────────────────────────────────────────┤
// │ 👑 OWNER (MASTER)   │ TODAS AS URLs                          │ role='owner'         │
// │   moisesblank@      │ Acesso TOTAL em tempo real             │ MOISESBLANK@GMAIL    │
// │   gmail.com         │ Pode criar/importar/exportar tudo      │ .COM                 │
// └──────────────────────────────────────────────────────────────────────────────────────┘

// ============================================
// CONSTANTES DA MATRIZ - DOMÍNIO ÚNICO
// ============================================

export const MATRIZ_URLS = {
  // URL base (ÚNICO DOMÍNIO)
  BASE: "https://pro.moisesmedeiros.com.br",
  
  // URL de gestão (agora área interna /gestaofc)
  GESTAO: "https://pro.moisesmedeiros.com.br/gestaofc",
  
  // URL base de alunos (beta)
  ALUNOS: "https://pro.moisesmedeiros.com.br/alunos",
  
  // URL pública (área gratuita + comunidade)
  PUBLICA: "https://pro.moisesmedeiros.com.br",
  
  // URL comunidade (não pagantes)
  COMUNIDADE: "https://pro.moisesmedeiros.com.br/comunidade",
  
  // Domínio principal (redireciona para pro)
  PRINCIPAL: "https://www.moisesmedeiros.com.br",
} as const;

export const MATRIZ_PATHS = {
  // Path de gestão (área interna restrita)
  GESTAO: "/gestaofc",
  
  // Path de alunos dentro do domínio pro
  ALUNOS: "/alunos",
  
  // Path de autenticação
  AUTH: "/auth",
  
  // Path de dashboard (gestão)
  DASHBOARD: "/gestaofc/dashboard",
  
  // Path home (área pública)
  HOME: "/",
  
  // Path comunidade (não pagantes)
  COMUNIDADE: "/comunidade",
} as const;

// ============================================
// TIPOS DE CATEGORIA DE ACESSO
// ============================================

export type CategoriaAcesso = 
  | "owner"           // Acesso supremo a tudo
  | "gestao"          // Funcionários - /gestaofc/*
  | "beta"            // Alunos pagantes - /alunos/*
  | "gratuito"        // Não pagantes - / (home apenas)
  | "publico";        // Visitantes - área aberta

// ============================================
// MAPEAMENTO DE ROLES PARA CATEGORIAS
// ============================================

export const ROLE_TO_CATEGORIA: Record<string, CategoriaAcesso> = {
  owner: "owner",
  admin: "gestao",
  coordenacao: "gestao",
  suporte: "gestao",
  monitoria: "gestao",
  afiliado: "gestao",
  marketing: "gestao",
  contabilidade: "gestao",
  employee: "gestao",
  beta: "beta",
  aluno_gratuito: "gratuito",
};

// ============================================
// FUNÇÕES DE VALIDAÇÃO
// ============================================

/**
 * Retorna o PATH correto para uma categoria de acesso
 * NUNCA retorna URL absoluta - apenas paths relativos
 */
export function getPathPorCategoria(categoria: CategoriaAcesso): string {
  switch (categoria) {
    case "owner":
      return MATRIZ_PATHS.DASHBOARD;
    case "gestao":
      return MATRIZ_PATHS.DASHBOARD;
    case "beta":
      return MATRIZ_PATHS.ALUNOS;
    case "gratuito":
    case "publico":
      return MATRIZ_PATHS.HOME;
    default:
      return MATRIZ_PATHS.HOME;
  }
}

/**
 * @deprecated Use getPathPorCategoria - arquitetura mono-domínio não usa URLs absolutas
 */
export function getUrlPorCategoria(categoria: CategoriaAcesso): string {
  // Retorna sempre o mesmo domínio base
  return MATRIZ_URLS.BASE;
}

/**
 * Valida se um usuário pode acessar uma URL específica
 * ARQUITETURA MONO-DOMÍNIO: validação baseada em PATH, não domínio
 */
export function validarAcessoUrl(
  categoria: CategoriaAcesso,
  pathname: string,
  _hostname: string // ignorado - mono-domínio
): { permitido: boolean; redirecionarPara?: string; motivo?: string } {
  const isGestaoPath = pathname.startsWith("/gestaofc");
  const isAlunosPath = pathname.startsWith("/alunos");
  const isAuthPath = pathname === "/auth";
  const isPublicPath = pathname === "/" || pathname.startsWith("/cursos") || pathname.startsWith("/comunidade");

  // Owner tem acesso supremo a tudo
  if (categoria === "owner") {
    return { permitido: true };
  }

  // Permitir acesso a auth sempre
  if (isAuthPath) {
    return { permitido: true };
  }

  // GESTÃO pode acessar /gestaofc/* e ver /alunos para testes
  if (categoria === "gestao") {
    if (isGestaoPath || isAlunosPath || isPublicPath) {
      return { permitido: true };
    }
    return { 
      permitido: false, 
      redirecionarPara: "/gestaofc",
      motivo: "Área não disponível" 
    };
  }

  // BETA pode acessar /alunos/* e áreas públicas
  if (categoria === "beta") {
    if (isGestaoPath) {
      return { 
        permitido: false, 
        redirecionarPara: "/alunos",
        motivo: "Área restrita para funcionários" 
      };
    }
    if (isAlunosPath || isPublicPath) {
      return { permitido: true };
    }
    return { 
      permitido: false, 
      redirecionarPara: "/alunos",
      motivo: "Acesse sua área de aluno" 
    };
  }

  // GRATUITO só pode ver área pública
  if (categoria === "gratuito") {
    if (isAlunosPath) {
      return { 
        permitido: false, 
        redirecionarPara: "/",
        motivo: "Área exclusiva para alunos pagantes" 
      };
    }
    if (isGestaoPath) {
      return { 
        permitido: false, 
        redirecionarPara: "/",
        motivo: "Área restrita para funcionários" 
      };
    }
    if (isPublicPath) {
      return { permitido: true };
    }
    return { 
      permitido: false, 
      redirecionarPara: "/",
      motivo: "Área restrita" 
    };
  }

  // PÚBLICO só pode ver home
  if (categoria === "publico") {
    if (isPublicPath) {
      return { permitido: true };
    }
    return { 
      permitido: false, 
      redirecionarPara: "/auth",
      motivo: "Faça login para acessar esta área" 
    };
  }

  return { permitido: false, redirecionarPara: "/auth" };
}
