// ============================================
// 🔥 REGRA MATRIZ v1.0 - ARQUITETURA DE URLs
// ============================================
// DOCUMENTAÇÃO OFICIAL DO SISTEMA DE ROTAS E ACESSOS
// ============================================

// 🎯 REGRA MATRIZ - MAPEAMENTO DE URLs POR CATEGORIA
// 
// ┌─────────────────────────────────────────────────────────────────────────┐
// │ CATEGORIA        │ URL BASE                              │ ACESSO      │
// ├─────────────────────────────────────────────────────────────────────────┤
// │ OWNER (Master)   │ TODOS OS DOMÍNIOS                     │ SUPREMO     │
// │ GESTÃO           │ https://gestao.moisesmedeiros.com.br  │ Funcionários│
// │ BETA (Alunos)    │ http://pro.moisesmedeiros.com.br/alunos│ Pagantes   │
// │ ÁREA GRATUITA    │ https://pro.moisesmedeiros.com.br     │ Público     │
// └─────────────────────────────────────────────────────────────────────────┘
// 
// 📋 HIERARQUIA DE ACESSOS:
// 1. OWNER (moisesblank@gmail.com) → Acesso TOTAL a qualquer domínio/área
// 2. FUNCIONÁRIOS (gestão) → Apenas domínio gestao.*
// 3. ALUNOS BETA (pagantes) → Área /alunos em pro.*
// 4. NÃO PAGANTES (gratuitos) → Apenas área pública em pro.*
// 
// 🔐 VALIDAÇÕES:
// - Cada acesso é validado por domínio + role + autenticação
// - Owner tem bypass total
// - Beta SEMPRE redireciona para pro.moisesmedeiros.com.br/alunos
// - Gestão SEMPRE redireciona para gestao.*

// ============================================
// CONSTANTES DA MATRIZ
// ============================================

export const MATRIZ_URLS = {
  // URL base de gestão (funcionários)
  GESTAO: "https://gestao.moisesmedeiros.com.br",
  
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
  // Path de alunos dentro do domínio pro
  ALUNOS: "/alunos",
  
  // Path de autenticação
  AUTH: "/auth",
  
  // Path de dashboard (gestão)
  DASHBOARD: "/dashboard",
  
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
  | "gestao"          // Funcionários - gestao.*
  | "beta"            // Alunos pagantes - pro.*/alunos
  | "gratuito"        // Não pagantes - pro.* (home apenas)
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
 * Retorna a URL correta para uma categoria de acesso
 */
export function getUrlPorCategoria(categoria: CategoriaAcesso): string {
  switch (categoria) {
    case "owner":
      return MATRIZ_URLS.GESTAO; // Owner vai para gestão por padrão
    case "gestao":
      return MATRIZ_URLS.GESTAO;
    case "beta":
      return MATRIZ_URLS.ALUNOS;
    case "gratuito":
    case "publico":
      return MATRIZ_URLS.PUBLICA;
    default:
      return MATRIZ_URLS.PUBLICA;
  }
}

/**
 * Retorna o path interno para redirecionamento após login
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
 * Valida se um usuário pode acessar uma URL específica
 */
export function validarAcessoUrl(
  categoria: CategoriaAcesso,
  pathname: string,
  hostname: string
): { permitido: boolean; redirecionarPara?: string; motivo?: string } {
  const isGestao = hostname.includes("gestao.");
  const isPro = hostname.includes("pro.") || hostname.includes("www.") || hostname === "moisesmedeiros.com.br";
  const isAlunosPath = pathname.startsWith("/alunos");
  const isAuthPath = pathname === "/auth";
  const isPublicPath = pathname === "/" || pathname.startsWith("/cursos");

  // Owner tem acesso supremo a tudo
  if (categoria === "owner") {
    return { permitido: true };
  }

  // Permitir acesso a auth em qualquer domínio
  if (isAuthPath) {
    return { permitido: true };
  }

  // BETA deve acessar /alunos em pro.*
  if (categoria === "beta") {
    if (isGestao) {
      return { 
        permitido: false, 
        redirecionarPara: MATRIZ_URLS.ALUNOS,
        motivo: "Alunos Beta devem acessar a área de alunos" 
      };
    }
    if (!isAlunosPath && !isPublicPath) {
      return { 
        permitido: false, 
        redirecionarPara: "/alunos",
        motivo: "Área restrita para funcionários" 
      };
    }
    return { permitido: true };
  }

  // GESTÃO deve acessar gestao.*
  if (categoria === "gestao") {
    if (isPro && !isPublicPath) {
      // Permitir visualização de /alunos para testes
      if (isAlunosPath) {
        return { permitido: true };
      }
      return { 
        permitido: false, 
        redirecionarPara: MATRIZ_URLS.GESTAO,
        motivo: "Funcionários devem acessar a área de gestão" 
      };
    }
    return { permitido: true };
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
    if (isGestao) {
      return { 
        permitido: false, 
        redirecionarPara: MATRIZ_URLS.PUBLICA,
        motivo: "Área restrita para funcionários" 
      };
    }
    return { permitido: true };
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

// ============================================
// DOCUMENTAÇÃO INLINE (para referência rápida)
// ============================================

// 📌 RESUMO DA REGRA MATRIZ:
// 
// 1. www.moisesmedeiros.com.br → Redireciona para pro.moisesmedeiros.com.br
// 
// 2. pro.moisesmedeiros.com.br (HOME PÚBLICA)
//    - Área aberta para todos
//    - Botão "ENTRAR" → /auth
//    - Após login:
//      • BETA → /alunos (central do aluno)
//      • GESTÃO → gestao.moisesmedeiros.com.br/dashboard
//      • OWNER → /dashboard (pode navegar para qualquer área)
// 
// 3. pro.moisesmedeiros.com.br/alunos (CENTRAL DO ALUNO)
//    - Exclusivo para BETA (alunos pagantes)
//    - Owner pode acessar para testar experiência
// 
// 4. gestao.moisesmedeiros.com.br (ÁREA DE GESTÃO)
//    - Funcionários e Admin
//    - Owner com acesso supremo
//    - Gestão de alunos, finanças, equipe, etc.
// 
// 🔒 VALIDAÇÕES APLICADAS:
//    - Cada requisição valida: domínio + role + autenticação
//    - Acessos inválidos são redirecionados automaticamente
//    - Logs de auditoria para tentativas de acesso negado
