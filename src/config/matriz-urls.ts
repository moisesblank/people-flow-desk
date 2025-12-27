// ============================================
// 🔥 REGRA MATRIZ v2.0 - ARQUITETURA DE URLs
// ATUALIZADO: 2024-12-22 - Design 2300
// ============================================
// DOCUMENTAÇÃO OFICIAL DO SISTEMA DE ROTAS E ACESSOS
// ============================================

// 📍 MAPA DE URLs DEFINITIVO (LEI IV - SNA OMEGA)
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
// │ 👔 FUNCIONÁRIO      │ gestao.moisesmedeiros.com.br/gestao    │ role='funcionario'   │
// │                     │ (categorias de permissão específicas)  │ + permissões         │
// ├──────────────────────────────────────────────────────────────────────────────────────┤
// │ 👑 OWNER (MASTER)   │ TODAS AS URLs                          │ role='owner'         │
// │   moisesblank@      │ Acesso TOTAL em tempo real             │ MOISESBLANK@GMAIL    │
// │   gmail.com         │ Pode criar/importar/exportar tudo      │ .COM                 │
// └──────────────────────────────────────────────────────────────────────────────────────┘
// 
// 📋 HIERARQUIA DE ACESSOS (do maior para menor):
// 1. 👑 OWNER (moisesblank@gmail.com) → Acesso TOTAL a TUDO, SEMPRE
// 2. 👔 FUNCIONÁRIOS (gestão) → gestao.moisesmedeiros.com.br/* conforme permissões
// 3. 👨‍🎓 ALUNOS BETA (pagantes) → /alunos/* + /comunidade em pro.*
// 4. 🌐 NÃO PAGANTES (gratuitos) → / + /comunidade em pro.*
// 
// 🔐 VALIDAÇÕES:
// - Cada acesso valida: domínio + role + autenticação + access_expires_at
// - Owner = bypass total (MOISESBLANK@GMAIL.COM)
// - Beta vem de: pagamento Hotmart OU criado por Owner/Admin
// - Beta acessa /alunos/* E /comunidade
// - Gestão requer role funcionario+

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

  // ============================================
  // 🛡️ LEI SUPREMA: NUNCA REDIRECIONAR ENTRE DOMÍNIOS
  // Cada domínio é independente - redirects são sempre RELATIVOS
  // ============================================

  // BETA deve acessar /alunos em pro.*
  if (categoria === "beta") {
    if (isGestao) {
      // NÃO redireciona cross-domain - apenas indica acesso restrito
      return { 
        permitido: false, 
        motivo: "Esta área é restrita. Acesse sua área de aluno." 
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
      // NÃO redireciona cross-domain - apenas indica acesso restrito
      return { 
        permitido: false, 
        motivo: "Esta área é restrita. Acesse a gestão pelo domínio correto." 
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
      // NÃO redireciona cross-domain
      return { 
        permitido: false, 
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
