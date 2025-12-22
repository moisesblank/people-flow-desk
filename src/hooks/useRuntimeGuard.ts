// ============================================
// 🛡️ Ω2: HOOK RUNTIME GUARD — ANO 2300
// INTEGRAÇÃO COM COMPONENTES REACT
// ============================================

import { useEffect, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import {
  initRuntimeGuard,
  captureNavigation404,
  captureRpcFailure,
  captureSignedUrlError,
  captureFetchError,
  captureDeadClick,
  capturePermissionDenied,
  safeRpc,
  safeSignedUrl,
  type RuntimeError,
} from "@/core/runtimeGuard";
import { getRouteContract } from "@/core/uiContractsRegistry";

// ============================================
// HOOK PRINCIPAL
// ============================================

export interface UseRuntimeGuardReturn {
  /** Captura erro 404 */
  capture404: (path?: string) => void;
  /** Captura erro de RPC */
  captureRpc: (rpcName: string, error: string, params?: Record<string, unknown>) => void;
  /** Captura erro de signed URL */
  captureSignedUrl: (bucket: string, path: string, error: string) => void;
  /** Captura erro de fetch */
  captureFetch: (url: string, error: string, status?: number) => void;
  /** Captura clique morto */
  captureDeadBtn: (elementId: string, elementType?: string) => void;
  /** Captura permissão negada */
  captureDenied: (resource: string, requiredRole: string) => void;
  /** Wrapper seguro para RPC */
  rpc: <T>(name: string, params?: Record<string, unknown>) => Promise<{ data: T | null; error: Error | null }>;
  /** Wrapper seguro para signed URL */
  signedUrl: (bucket: string, path: string, expiresIn?: number) => Promise<{ url: string | null; error: Error | null }>;
}

/**
 * Hook para integrar o Runtime Guard com componentes React
 */
export function useRuntimeGuard(): UseRuntimeGuardReturn {
  const location = useLocation();
  const { user, role } = useAuth();
  const userId = user?.id;
  const userRole = role || undefined;

  // Inicializar guard globalmente (uma vez)
  useEffect(() => {
    initRuntimeGuard();
  }, []);

  // Verificar rota ao navegar
  useEffect(() => {
    const contract = getRouteContract(location.pathname);
    
    // Se não encontrou contrato e não é rota dinâmica conhecida
    if (!contract && !location.pathname.includes(':')) {
      // Verificar se é uma subrota de algo registrado
      const parentPath = location.pathname.split('/').slice(0, -1).join('/');
      const parentContract = getRouteContract(parentPath);
      
      if (!parentContract) {
        console.warn(`[RUNTIME-GUARD] Rota sem contrato: ${location.pathname}`);
      }
    }
  }, [location.pathname]);

  // Callbacks memoizados
  const capture404 = useCallback((path?: string) => {
    captureNavigation404(path || location.pathname, userRole, userId);
  }, [location.pathname, userRole, userId]);

  const captureRpc = useCallback((rpcName: string, error: string, params?: Record<string, unknown>) => {
    captureRpcFailure(rpcName, error, userRole, userId, params);
  }, [userRole, userId]);

  const captureSignedUrlFn = useCallback((bucket: string, path: string, error: string) => {
    captureSignedUrlError(bucket, path, error, userRole, userId);
  }, [userRole, userId]);

  const captureFetch = useCallback((url: string, error: string, status?: number) => {
    captureFetchError(url, error, status, userRole, userId);
  }, [userRole, userId]);

  const captureDeadBtn = useCallback((elementId: string, elementType: string = 'button') => {
    captureDeadClick(elementId, elementType, location.pathname, userRole, userId);
  }, [location.pathname, userRole, userId]);

  const captureDenied = useCallback((resource: string, requiredRole: string) => {
    capturePermissionDenied(resource, requiredRole, userRole, userId);
  }, [userRole, userId]);

  const rpc = useCallback(<T,>(name: string, params?: Record<string, unknown>) => {
    return safeRpc<T>(name, params, userRole, userId);
  }, [userRole, userId]);

  const signedUrl = useCallback((bucket: string, path: string, expiresIn?: number) => {
    return safeSignedUrl(bucket, path, expiresIn, userRole, userId);
  }, [userRole, userId]);

  return {
    capture404,
    captureRpc,
    captureSignedUrl: captureSignedUrlFn,
    captureFetch,
    captureDeadBtn,
    captureDenied,
    rpc,
    signedUrl,
  };
}

// ============================================
// HOOK PARA VERIFICAÇÃO DE CONTRATO
// ============================================

/**
 * Verifica se a rota atual tem contrato válido
 */
export function useRouteContract(): {
  hasContract: boolean;
  contract: { role: string; area: string } | null;
  pathname: string;
} {
  const location = useLocation();
  const contract = getRouteContract(location.pathname);

  return {
    hasContract: !!contract,
    contract,
    pathname: location.pathname,
  };
}

export default useRuntimeGuard;
