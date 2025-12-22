// ============================================
// 🔥🛡️ URL GUARD HOOK OMEGA v2.0 🛡️🔥
// PROTEÇÃO DE ROTAS EM TEMPO REAL
// ============================================
// Integrado com CONSTITUIÇÃO SYNAPSE LEI III
// ============================================

import { useEffect, useRef, useState, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import {
  validateAccess,
  getPostLoginRedirect,
  isPublicPath,
  isOwner,
  type AccessValidationResult,
  OWNER_EMAIL,
} from "@/core/urlAccessControl";

// ============================================
// TIPOS
// ============================================

export interface UrlGuardState {
  /** Resultado da validação de acesso */
  result: AccessValidationResult | null;
  /** Se está verificando o acesso */
  isChecking: boolean;
  /** Se o acesso foi permitido */
  isAllowed: boolean;
  /** Motivo do resultado */
  reason: string;
  /** URL atual sendo verificada */
  currentPath: string;
}

export interface UseUrlGuardReturn extends UrlGuardState {
  /** Forçar uma nova verificação */
  recheck: () => void;
  /** Redirecionar para a área correta */
  redirectToHome: () => void;
}

// ============================================
// HOOK PRINCIPAL
// ============================================

/**
 * 🛡️ Hook de proteção de URLs
 * 
 * Verifica em tempo real se o usuário tem acesso à rota atual
 * e redireciona automaticamente se necessário.
 * 
 * @param options Opções do hook
 * @returns Estado e funções do guard
 */
export function useUrlGuard(options?: {
  /** Se deve redirecionar automaticamente (default: true) */
  autoRedirect?: boolean;
  /** Callback quando acesso é negado */
  onAccessDenied?: (result: AccessValidationResult) => void;
}): UseUrlGuardReturn {
  const { autoRedirect = true, onAccessDenied } = options || {};
  
  const { user, role } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  
  const [state, setState] = useState<UrlGuardState>({
    result: null,
    isChecking: true,
    isAllowed: false,
    reason: "",
    currentPath: location.pathname,
  });
  
  const lastPathRef = useRef<string>("");
  const lastRoleRef = useRef<string | null>(null);
  
  // Função de verificação
  const checkAccess = useCallback(() => {
    const pathname = location.pathname;
    const email = user?.email || null;
    const hostname = typeof window !== "undefined" ? window.location.hostname : "";
    
    // Evitar verificações duplicadas
    if (lastPathRef.current === pathname && lastRoleRef.current === role) {
      return;
    }
    
    lastPathRef.current = pathname;
    lastRoleRef.current = role;
    
    setState(prev => ({ ...prev, isChecking: true, currentPath: pathname }));
    
    // Rotas públicas - permitir imediatamente
    if (isPublicPath(pathname)) {
      setState({
        result: {
          allowed: true,
          reason: "PUBLIC_ROUTE",
          area: "publico",
        },
        isChecking: false,
        isAllowed: true,
        reason: "PUBLIC_ROUTE",
        currentPath: pathname,
      });
      return;
    }
    
    // Validar acesso
    const result = validateAccess(role, email, pathname, hostname);
    
    setState({
      result,
      isChecking: false,
      isAllowed: result.allowed,
      reason: result.reason,
      currentPath: pathname,
    });
    
    // Tratar acesso negado
    if (!result.allowed) {
      // Callback
      if (onAccessDenied) {
        onAccessDenied(result);
      }
      
      // Redirecionar automaticamente
      if (autoRedirect && result.redirectTo) {
        console.log(`[URL-GUARD] 🚫 Acesso negado: ${result.reason} → Redirecionando para ${result.redirectTo}`);
        navigate(result.redirectTo, { replace: true });
      }
    }
  }, [location.pathname, user?.email, role, autoRedirect, onAccessDenied, navigate]);
  
  // Verificar quando muda a rota ou role
  useEffect(() => {
    checkAccess();
  }, [checkAccess]);
  
  // Função para forçar reverificação
  const recheck = useCallback(() => {
    lastPathRef.current = "";
    lastRoleRef.current = null;
    checkAccess();
  }, [checkAccess]);
  
  // Função para redirecionar para home da role
  const redirectToHome = useCallback(() => {
    const redirectPath = getPostLoginRedirect(role, user?.email);
    navigate(redirectPath, { replace: true });
  }, [role, user?.email, navigate]);
  
  return {
    ...state,
    recheck,
    redirectToHome,
  };
}

// ============================================
// HOOK SIMPLIFICADO PARA COMPONENTES
// ============================================

/**
 * Hook simplificado que retorna apenas se tem acesso
 * Útil para guards de componentes
 */
export function useHasAccess(): {
  hasAccess: boolean;
  isLoading: boolean;
  isOwner: boolean;
  role: string | null;
} {
  const { user, role, isLoading } = useAuth();
  const location = useLocation();
  const email = user?.email || null;
  
  const [hasAccess, setHasAccess] = useState(true);
  
  useEffect(() => {
    if (isLoading) return;
    
    const result = validateAccess(
      role,
      email,
      location.pathname,
      typeof window !== "undefined" ? window.location.hostname : ""
    );
    
    setHasAccess(result.allowed);
  }, [role, email, location.pathname, isLoading]);
  
  return {
    hasAccess,
    isLoading,
    isOwner: isOwner(email, role),
    role,
  };
}

// ============================================
// HOOK PARA VERIFICAÇÃO DE ÁREA
// ============================================

/**
 * Hook para verificar se o usuário pode acessar uma área específica
 */
export function useCanAccessArea(area: "publico" | "comunidade" | "alunos" | "gestao" | "owner"): {
  canAccess: boolean;
  isLoading: boolean;
} {
  const { user, role, isLoading } = useAuth();
  
  const canAccess = (() => {
    if (isLoading) return false;
    if (isOwner(user?.email, role)) return true;
    
    // Mapear role para áreas permitidas
    const areaPermissions: Record<string, string[]> = {
      owner: ["publico", "comunidade", "alunos", "gestao", "owner"],
      admin: ["publico", "comunidade", "alunos", "gestao"],
      funcionario: ["publico", "gestao"],
      employee: ["publico", "gestao"],
      suporte: ["publico", "gestao"],
      coordenacao: ["publico", "gestao"],
      monitoria: ["publico", "gestao"],
      marketing: ["publico", "gestao"],
      contabilidade: ["publico", "gestao"],
      professor: ["publico", "gestao"],
      beta: ["publico", "comunidade", "alunos"],
      aluno: ["publico", "comunidade", "alunos"],
      viewer: ["publico", "comunidade"],
    };
    
    const allowed = areaPermissions[role || ""] || ["publico"];
    return allowed.includes(area);
  })();
  
  return { canAccess, isLoading };
}

export default useUrlGuard;
