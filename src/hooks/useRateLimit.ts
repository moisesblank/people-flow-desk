// ============================================
// 🛡️ HOOK: useRateLimit
// Rate limiting client-side com fallback
// Implementa: C030
// ============================================

import { useState, useCallback, useRef, useEffect } from 'react';

// ============================================
// TIPOS
// ============================================
interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  blockDurationMs?: number;
}

interface RateLimitState {
  isBlocked: boolean;
  remaining: number;
  blockedUntil: number | null;
  requestCount: number;
}

interface UseRateLimitReturn {
  state: RateLimitState;
  checkLimit: () => boolean;
  recordRequest: () => void;
  reset: () => void;
  getTimeUntilReset: () => number;
}

// ============================================
// CONFIGURAÇÕES PADRÃO POR ENDPOINT
// ============================================
export const RATE_LIMIT_CONFIGS: Record<string, RateLimitConfig> = {
  login: { maxRequests: 5, windowMs: 60000, blockDurationMs: 300000 }, // 5/min, block 5min
  passwordReset: { maxRequests: 3, windowMs: 300000, blockDurationMs: 600000 }, // 3/5min, block 10min
  chatMessage: { maxRequests: 10, windowMs: 10000 }, // 10/10s
  videoUrl: { maxRequests: 10, windowMs: 60000, blockDurationMs: 60000 }, // 10/min
  apiCall: { maxRequests: 100, windowMs: 60000 }, // 100/min
  download: { maxRequests: 5, windowMs: 60000, blockDurationMs: 120000 }, // 5/min
};

// ============================================
// STORAGE KEY
// ============================================
const STORAGE_PREFIX = 'rate_limit_';

// ============================================
// HOOK
// ============================================
export function useRateLimit(
  endpoint: string,
  config?: Partial<RateLimitConfig>
): UseRateLimitReturn {
  // Mesclar config padrão
  const finalConfig: RateLimitConfig = {
    ...(RATE_LIMIT_CONFIGS[endpoint] || { maxRequests: 100, windowMs: 60000 }),
    ...config,
  };

  const [state, setState] = useState<RateLimitState>(() => {
    // Tentar recuperar estado do localStorage
    try {
      const stored = localStorage.getItem(`${STORAGE_PREFIX}${endpoint}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        const now = Date.now();
        
        // Se bloqueio expirou, resetar
        if (parsed.blockedUntil && parsed.blockedUntil < now) {
          return {
            isBlocked: false,
            remaining: finalConfig.maxRequests,
            blockedUntil: null,
            requestCount: 0,
          };
        }
        
        // Se janela expirou, resetar contador
        if (parsed.windowStart && (now - parsed.windowStart) > finalConfig.windowMs) {
          return {
            isBlocked: false,
            remaining: finalConfig.maxRequests,
            blockedUntil: null,
            requestCount: 0,
          };
        }
        
        return {
          isBlocked: parsed.blockedUntil ? parsed.blockedUntil > now : false,
          remaining: Math.max(0, finalConfig.maxRequests - (parsed.requestCount || 0)),
          blockedUntil: parsed.blockedUntil || null,
          requestCount: parsed.requestCount || 0,
        };
      }
    } catch {
      // Ignorar erros de parse
    }
    
    return {
      isBlocked: false,
      remaining: finalConfig.maxRequests,
      blockedUntil: null,
      requestCount: 0,
    };
  });

  const windowStartRef = useRef<number>(Date.now());

  // Persistir estado
  useEffect(() => {
    try {
      localStorage.setItem(`${STORAGE_PREFIX}${endpoint}`, JSON.stringify({
        ...state,
        windowStart: windowStartRef.current,
      }));
    } catch {
      // Ignorar erros de storage
    }
  }, [state, endpoint]);

  // Verificar e resetar janela expirada
  const checkWindowExpiry = useCallback(() => {
    const now = Date.now();
    const windowStart = windowStartRef.current;
    
    if ((now - windowStart) > finalConfig.windowMs) {
      windowStartRef.current = now;
      setState({
        isBlocked: false,
        remaining: finalConfig.maxRequests,
        blockedUntil: null,
        requestCount: 0,
      });
      return true; // Janela resetada
    }
    
    // Verificar se bloqueio expirou
    if (state.blockedUntil && state.blockedUntil < now) {
      windowStartRef.current = now;
      setState({
        isBlocked: false,
        remaining: finalConfig.maxRequests,
        blockedUntil: null,
        requestCount: 0,
      });
      return true;
    }
    
    return false;
  }, [finalConfig.maxRequests, finalConfig.windowMs, state.blockedUntil]);

  // Verificar se pode fazer request
  const checkLimit = useCallback((): boolean => {
    checkWindowExpiry();
    return !state.isBlocked && state.remaining > 0;
  }, [checkWindowExpiry, state.isBlocked, state.remaining]);

  // Registrar request
  const recordRequest = useCallback(() => {
    checkWindowExpiry();
    
    setState(prev => {
      const newCount = prev.requestCount + 1;
      const newRemaining = Math.max(0, finalConfig.maxRequests - newCount);
      
      // Se atingiu limite, bloquear
      if (newRemaining === 0 && finalConfig.blockDurationMs) {
        const blockedUntil = Date.now() + finalConfig.blockDurationMs;
        
        return {
          isBlocked: true,
          remaining: 0,
          blockedUntil,
          requestCount: newCount,
        };
      }
      
      return {
        ...prev,
        remaining: newRemaining,
        requestCount: newCount,
      };
    });
  }, [checkWindowExpiry, finalConfig.maxRequests, finalConfig.blockDurationMs]);

  // Resetar manualmente
  const reset = useCallback(() => {
    windowStartRef.current = Date.now();
    setState({
      isBlocked: false,
      remaining: finalConfig.maxRequests,
      blockedUntil: null,
      requestCount: 0,
    });
    localStorage.removeItem(`${STORAGE_PREFIX}${endpoint}`);
  }, [endpoint, finalConfig.maxRequests]);

  // Tempo até reset
  const getTimeUntilReset = useCallback((): number => {
    if (state.blockedUntil) {
      return Math.max(0, state.blockedUntil - Date.now());
    }
    
    const windowEnd = windowStartRef.current + finalConfig.windowMs;
    return Math.max(0, windowEnd - Date.now());
  }, [state.blockedUntil, finalConfig.windowMs]);

  return {
    state,
    checkLimit,
    recordRequest,
    reset,
    getTimeUntilReset,
  };
}

// ============================================
// HOOK ESPECÍFICO: useLoginRateLimit
// ============================================
export function useLoginRateLimit() {
  return useRateLimit('login');
}

// ============================================
// HOOK ESPECÍFICO: useApiRateLimit
// ============================================
export function useApiRateLimit(endpoint: string = 'apiCall') {
  return useRateLimit(endpoint);
}

export default useRateLimit;
