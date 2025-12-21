// ============================================
// 🔥 HOOK: useRateLimiter - DOGMA X
// Rate Limiting no Frontend
// ============================================

import { useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

interface RateLimitConfig {
  endpoint: string;
  maxAttempts?: number;
  windowSeconds?: number;
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfter?: number;
}

export const useRateLimiter = () => {
  const [isBlocked, setIsBlocked] = useState(false);
  const [retryAfter, setRetryAfter] = useState<number | null>(null);
  const attemptsRef = useRef<Map<string, { count: number; resetAt: number }>>(new Map());

  /**
   * Verifica rate limit localmente (rápido) + backend (preciso)
   */
  const checkRateLimit = useCallback(async (config: RateLimitConfig): Promise<RateLimitResult> => {
    const { endpoint, maxAttempts = 10, windowSeconds = 60 } = config;
    const now = Date.now();
    
    // Verificação local primeiro (mais rápido)
    const key = endpoint;
    const cached = attemptsRef.current.get(key);
    
    if (cached && cached.resetAt > now) {
      if (cached.count >= maxAttempts) {
        const retryIn = Math.ceil((cached.resetAt - now) / 1000);
        setIsBlocked(true);
        setRetryAfter(retryIn);
        return { allowed: false, remaining: 0, retryAfter: retryIn };
      }
      cached.count++;
    } else {
      attemptsRef.current.set(key, {
        count: 1,
        resetAt: now + (windowSeconds * 1000)
      });
    }
    
    // Verificação no backend para precisão
    try {
      const { data, error } = await supabase.functions.invoke('rate-limit-gateway', {
        body: { endpoint, action: 'check' }
      });
      
      if (error || !data?.allowed) {
        setIsBlocked(true);
        setRetryAfter(data?.retryAfter || 60);
        return { 
          allowed: false, 
          remaining: 0, 
          retryAfter: data?.retryAfter || 60 
        };
      }
      
      setIsBlocked(false);
      setRetryAfter(null);
      return { 
        allowed: true, 
        remaining: data?.remaining || maxAttempts - 1 
      };
      
    } catch (err) {
      // Em caso de erro, permitir (fail-open para não bloquear usuários)
      console.warn('Rate limit check failed, allowing request:', err);
      return { allowed: true, remaining: maxAttempts };
    }
  }, []);

  /**
   * Wrapper para executar ação com rate limiting
   */
  const withRateLimit = useCallback(async <T>(
    config: RateLimitConfig,
    action: () => Promise<T>
  ): Promise<T | null> => {
    const result = await checkRateLimit(config);
    
    if (!result.allowed) {
      console.warn(`🚫 Rate limit: bloqueado por ${result.retryAfter}s`);
      return null;
    }
    
    return action();
  }, [checkRateLimit]);

  /**
   * Resetar contador local (após sucesso)
   */
  const resetLimit = useCallback((endpoint: string) => {
    attemptsRef.current.delete(endpoint);
    setIsBlocked(false);
    setRetryAfter(null);
  }, []);

  return {
    isBlocked,
    retryAfter,
    checkRateLimit,
    withRateLimit,
    resetLimit
  };
};

export default useRateLimiter;
