// ============================================
// 🔄 LEGACY REDIRECTS v2.0
// RETROCOMPATIBILIDADE DE ROTAS
// ============================================
//
// 📍 MAPEAMENTO OBRIGATÓRIO:
//   /aluno/* → /alunos/*
//   /admin/* → /gestao/*
//   /aluno/comunidade → /comunidade
//
// Todas as redirects geram log de auditoria
//
// ============================================

import { OWNER_EMAIL } from "@/core/urlAccessControl";

// ============================================
// TIPOS
// ============================================

export interface LegacyRedirect {
  from: RegExp;
  to: string | ((match: RegExpMatchArray) => string);
  permanent: boolean; // 301 vs 302
  description: string;
  logEvent: boolean;
}

export interface RedirectResult {
  shouldRedirect: boolean;
  from: string;
  to: string;
  permanent: boolean;
  matched: boolean;
  description?: string;
}

// ============================================
// MAPEAMENTO DE REDIRECTS LEGADOS
// ============================================

export const LEGACY_REDIRECTS: LegacyRedirect[] = [
  // /aluno/* → /alunos/*
  {
    from: /^\/aluno\/(.*)$/,
    to: (match) => `/alunos/${match[1] || ""}`.replace(/\/$/, ""),
    permanent: true,
    description: "Redirect /aluno/* para /alunos/*",
    logEvent: true,
  },
  
  // /aluno → /alunos
  {
    from: /^\/aluno\/?$/,
    to: "/alunos",
    permanent: true,
    description: "Redirect /aluno para /alunos",
    logEvent: true,
  },
  
  // /admin/* → /gestao/*
  {
    from: /^\/admin\/(.*)$/,
    to: (match) => `/gestao/${match[1] || ""}`.replace(/\/$/, ""),
    permanent: true,
    description: "Redirect /admin/* para /gestao/*",
    logEvent: true,
  },
  
  // /admin → /gestao
  {
    from: /^\/admin\/?$/,
    to: "/gestao",
    permanent: true,
    description: "Redirect /admin para /gestao",
    logEvent: true,
  },
  
  // /aluno/comunidade → /comunidade (específico)
  {
    from: /^\/aluno\/comunidade\/?$/,
    to: "/comunidade",
    permanent: true,
    description: "Redirect /aluno/comunidade para /comunidade",
    logEvent: true,
  },
  
  // /student/* → /alunos/* (inglês)
  {
    from: /^\/student\/(.*)$/,
    to: (match) => `/alunos/${match[1] || ""}`.replace(/\/$/, ""),
    permanent: true,
    description: "Redirect /student/* para /alunos/*",
    logEvent: true,
  },
  
  // /dashboard → /gestao/dashboard (legado gestão)
  {
    from: /^\/dashboard\/?$/,
    to: "/gestao/dashboard",
    permanent: false, // Pode mudar
    description: "Redirect /dashboard para /gestao/dashboard",
    logEvent: true,
  },
  
  // /app → /alunos (portal antigo)
  {
    from: /^\/app\/?$/,
    to: "/alunos",
    permanent: true,
    description: "Redirect /app para /alunos",
    logEvent: true,
  },
  
  // /portal-aluno → /alunos
  {
    from: /^\/portal-aluno\/?$/,
    to: "/alunos",
    permanent: true,
    description: "Redirect /portal-aluno para /alunos",
    logEvent: true,
  },
  
  // /gestao-alunos → /gestao/alunos
  {
    from: /^\/gestao-alunos\/?$/,
    to: "/gestao/alunos",
    permanent: true,
    description: "Redirect /gestao-alunos para /gestao/alunos",
    logEvent: true,
  },
];

// ============================================
// FUNÇÃO PRINCIPAL: VERIFICAR REDIRECT
// ============================================

export function shouldRedirect(pathname: string): RedirectResult {
  const cleanPath = pathname.split("?")[0].split("#")[0]; // Remove query e hash
  
  for (const redirect of LEGACY_REDIRECTS) {
    const match = cleanPath.match(redirect.from);
    
    if (match) {
      const target = typeof redirect.to === "function" 
        ? redirect.to(match) 
        : redirect.to;
      
      return {
        shouldRedirect: true,
        from: pathname,
        to: target,
        permanent: redirect.permanent,
        matched: true,
        description: redirect.description,
      };
    }
  }
  
  return {
    shouldRedirect: false,
    from: pathname,
    to: pathname,
    permanent: false,
    matched: false,
  };
}

// ============================================
// OBTER TARGET DE REDIRECT
// ============================================

export function getRedirectTarget(pathname: string): string | null {
  const result = shouldRedirect(pathname);
  return result.shouldRedirect ? result.to : null;
}

// ============================================
// EXECUTAR REDIRECT (COM LOG)
// ============================================

export function handleLegacyRedirect(
  pathname: string,
  options?: {
    logFn?: (event: RedirectLogEvent) => void;
    navigate?: (path: string) => void;
  }
): boolean {
  const result = shouldRedirect(pathname);
  
  if (!result.shouldRedirect) {
    return false;
  }
  
  // Log do redirect
  if (options?.logFn) {
    options.logFn({
      type: "legacy_redirect",
      from: result.from,
      to: result.to,
      permanent: result.permanent,
      description: result.description,
      timestamp: new Date().toISOString(),
      userAgent: typeof navigator !== "undefined" ? navigator.userAgent : undefined,
    });
  }
  
  // Executar redirect
  if (options?.navigate) {
    options.navigate(result.to);
  } else if (typeof window !== "undefined") {
    // Usar replace para não poluir histórico
    window.history.replaceState(null, "", result.to);
  }
  
  return true;
}

// ============================================
// EVENTO DE LOG
// ============================================

export interface RedirectLogEvent {
  type: "legacy_redirect";
  from: string;
  to: string;
  permanent: boolean;
  description?: string;
  timestamp: string;
  userAgent?: string;
  userId?: string;
}

export function logLegacyRedirect(event: RedirectLogEvent): void {
  // Log no console em desenvolvimento
  if (process.env.NODE_ENV === "development") {
    console.log("[Legacy Redirect]", event.from, "→", event.to);
  }
  
  // Em produção, poderia enviar para analytics/auditoria
  // Mas não bloqueamos o fluxo por isso
}

// ============================================
// HOOK PARA USO EM COMPONENTES
// ============================================

export function useLegacyRedirect() {
  const check = (pathname: string) => shouldRedirect(pathname);
  const getTarget = (pathname: string) => getRedirectTarget(pathname);
  const handle = (pathname: string, navigate?: (path: string) => void) => 
    handleLegacyRedirect(pathname, { navigate, logFn: logLegacyRedirect });
  
  return {
    check,
    getTarget,
    handle,
    LEGACY_REDIRECTS,
  };
}

// ============================================
// OWNER BYPASS (não redireciona owner se ele quiser acessar rota legada diretamente)
// ============================================

export function isOwnerBypassRedirect(email?: string, forceRedirect = true): boolean {
  // Owner pode acessar rotas legadas diretamente se quiser (debug)
  if (!forceRedirect && email?.toLowerCase() === OWNER_EMAIL.toLowerCase()) {
    return true;
  }
  return false;
}

// ============================================
// EXPORT
// ============================================

export default {
  LEGACY_REDIRECTS,
  shouldRedirect,
  getRedirectTarget,
  handleLegacyRedirect,
  logLegacyRedirect,
  useLegacyRedirect,
  isOwnerBypassRedirect,
};
