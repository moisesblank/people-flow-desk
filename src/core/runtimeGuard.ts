// ============================================
// 🛡️ Ω2: RUNTIME GUARD — ANO 2300
// CAPTURA 404, RPC FAILURES, SIGNED URL ERRORS
// "NADA NÃO PEGA" — TUDO É LOGADO
// ============================================

import { supabase } from "@/integrations/supabase/client";
import { getRouteContract, canAccessBucket, canCallEdgeFunction } from "./uiContractsRegistry";

// ============================================
// TIPOS
// ============================================

export interface RuntimeError {
  type: 'navigation_404' | 'rpc_failure' | 'signed_url_error' | 'fetch_error' | 'dead_click' | 'permission_denied';
  path?: string;
  endpoint?: string;
  bucket?: string;
  errorMessage: string;
  userRole?: string;
  userId?: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface RuntimeGuardConfig {
  logToConsole: boolean;
  logToDatabase: boolean;
  captureStackTrace: boolean;
  alertOnCritical: boolean;
}

// ============================================
// CONFIGURAÇÃO PADRÃO
// ============================================

const DEFAULT_CONFIG: RuntimeGuardConfig = {
  logToConsole: true,
  logToDatabase: true,
  captureStackTrace: true,
  alertOnCritical: true,
};

let config: RuntimeGuardConfig = { ...DEFAULT_CONFIG };

// ============================================
// FUNÇÕES PRINCIPAIS
// ============================================

/**
 * Configura o runtime guard
 */
export function configureRuntimeGuard(newConfig: Partial<RuntimeGuardConfig>): void {
  config = { ...config, ...newConfig };
}

/**
 * Loga um erro de runtime
 */
export async function logRuntimeError(error: RuntimeError): Promise<void> {
  if (config.logToConsole) {
    console.error('[RUNTIME-GUARD]', error.type, error);
  }

  if (config.logToDatabase) {
    try {
      const insertData = {
        event_type: `runtime_${error.type}`,
        severity: error.type === 'permission_denied' ? 'warn' : 'error',
        source: 'runtime_guard',
        ip_address: null as string | null,
        user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
        payload: {
          path: error.path,
          endpoint: error.endpoint,
          bucket: error.bucket,
          errorMessage: error.errorMessage,
          userRole: error.userRole,
          userId: error.userId,
          metadata: error.metadata,
        },
      };
      await supabase.from('security_events').insert(insertData as any);
    } catch (dbError) {
      console.error('[RUNTIME-GUARD] Falha ao logar no banco:', dbError);
    }
  }
}

/**
 * Captura erros de navegação 404
 */
export function captureNavigation404(path: string, userRole?: string, userId?: string): void {
  const contract = getRouteContract(path);
  
  logRuntimeError({
    type: 'navigation_404',
    path,
    errorMessage: contract 
      ? `Rota registrada mas não encontrada: ${path}` 
      : `Rota não registrada: ${path}`,
    userRole,
    userId,
    timestamp: new Date().toISOString(),
    metadata: { hasContract: !!contract },
  });
}

/**
 * Captura erros de RPC (chamadas Supabase)
 */
export function captureRpcFailure(
  rpcName: string, 
  errorMessage: string, 
  userRole?: string, 
  userId?: string,
  params?: Record<string, unknown>
): void {
  logRuntimeError({
    type: 'rpc_failure',
    endpoint: rpcName,
    errorMessage,
    userRole,
    userId,
    timestamp: new Date().toISOString(),
    metadata: { params },
  });
}

/**
 * Captura erros de signed URL
 */
export function captureSignedUrlError(
  bucket: string, 
  path: string, 
  errorMessage: string,
  userRole?: string,
  userId?: string
): void {
  const canAccess = userRole ? canAccessBucket(bucket, userRole) : false;
  
  logRuntimeError({
    type: 'signed_url_error',
    bucket,
    path,
    errorMessage,
    userRole,
    userId,
    timestamp: new Date().toISOString(),
    metadata: { 
      bucketCanAccess: canAccess,
      fullPath: `${bucket}/${path}`,
    },
  });
}

/**
 * Captura erros de fetch (API calls)
 */
export function captureFetchError(
  url: string, 
  errorMessage: string,
  status?: number,
  userRole?: string,
  userId?: string
): void {
  logRuntimeError({
    type: 'fetch_error',
    endpoint: url,
    errorMessage,
    userRole,
    userId,
    timestamp: new Date().toISOString(),
    metadata: { status },
  });
}

/**
 * Captura cliques mortos (href="#", onClick vazio)
 */
export function captureDeadClick(
  elementId: string, 
  elementType: string,
  location: string,
  userRole?: string,
  userId?: string
): void {
  logRuntimeError({
    type: 'dead_click',
    path: location,
    errorMessage: `Elemento morto: ${elementType}#${elementId}`,
    userRole,
    userId,
    timestamp: new Date().toISOString(),
    metadata: { 
      elementId, 
      elementType,
      location,
    },
  });
}

/**
 * Captura erros de permissão negada
 */
export function capturePermissionDenied(
  resource: string,
  requiredRole: string,
  actualRole?: string,
  userId?: string
): void {
  logRuntimeError({
    type: 'permission_denied',
    path: resource,
    errorMessage: `Permissão negada: requer '${requiredRole}', tem '${actualRole || 'none'}'`,
    userRole: actualRole,
    userId,
    timestamp: new Date().toISOString(),
    metadata: { 
      requiredRole, 
      actualRole,
      resource,
    },
  });
}

// ============================================
// INTERCEPTORS GLOBAIS
// ============================================

/**
 * Inicializa interceptors globais de erro
 */
export function initRuntimeGuard(): void {
  // Interceptar erros não capturados
  window.addEventListener('error', (event) => {
    logRuntimeError({
      type: 'fetch_error',
      errorMessage: event.message,
      timestamp: new Date().toISOString(),
      metadata: {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      },
    });
  });

  // Interceptar rejeições de promise não tratadas
  window.addEventListener('unhandledrejection', (event) => {
    const errorMessage = event.reason?.message || String(event.reason);
    
    // Filtrar erros de rede/API
    if (errorMessage.includes('fetch') || errorMessage.includes('network')) {
      logRuntimeError({
        type: 'fetch_error',
        errorMessage,
        timestamp: new Date().toISOString(),
        metadata: { reason: event.reason },
      });
    }
  });

  // Interceptar cliques em elementos com href="#"
  document.addEventListener('click', (event) => {
    const target = event.target as HTMLElement;
    const anchor = target.closest('a');
    
    if (anchor) {
      const href = anchor.getAttribute('href');
      if (href === '#' || href === '') {
        captureDeadClick(
          anchor.id || 'unknown',
          'anchor',
          window.location.pathname
        );
      }
    }
  }, true);

  console.log('[RUNTIME-GUARD] ✅ Inicializado');
}

// ============================================
// WRAPPER PARA SUPABASE RPC
// ============================================

/**
 * Wrapper seguro para chamadas RPC com logging automático
 */
export async function safeRpc<T>(
  rpcName: string,
  params?: Record<string, unknown>,
  userRole?: string,
  userId?: string
): Promise<{ data: T | null; error: Error | null }> {
  try {
    const { data, error } = await supabase.rpc(rpcName as any, params as any);
    
    if (error) {
      captureRpcFailure(rpcName, error.message, userRole, userId, params);
      return { data: null, error };
    }
    
    return { data: data as T, error: null };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    captureRpcFailure(rpcName, errorMessage, userRole, userId, params);
    return { data: null, error: err as Error };
  }
}

/**
 * Wrapper seguro para criar signed URL com logging automático
 */
export async function safeSignedUrl(
  bucket: string,
  path: string,
  expiresIn: number = 3600,
  userRole?: string,
  userId?: string
): Promise<{ url: string | null; error: Error | null }> {
  // Verificar permissão antes
  if (userRole && !canAccessBucket(bucket, userRole)) {
    capturePermissionDenied(`${bucket}/${path}`, 'bucket_access', userRole, userId);
    return { url: null, error: new Error('Acesso ao bucket não permitido') };
  }

  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(path, expiresIn);
    
    if (error) {
      captureSignedUrlError(bucket, path, error.message, userRole, userId);
      return { url: null, error };
    }
    
    return { url: data.signedUrl, error: null };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    captureSignedUrlError(bucket, path, errorMessage, userRole, userId);
    return { url: null, error: err as Error };
  }
}

// ============================================
// EXPORTS
// ============================================

export const RUNTIME_GUARD_VERSION = '1.0.0';

export default {
  configureRuntimeGuard,
  logRuntimeError,
  captureNavigation404,
  captureRpcFailure,
  captureSignedUrlError,
  captureFetchError,
  captureDeadClick,
  capturePermissionDenied,
  initRuntimeGuard,
  safeRpc,
  safeSignedUrl,
};
