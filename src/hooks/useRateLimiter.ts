// ============================================
// 🔥 HOOK: useRateLimiter v2.0 - LEI I (Performance 3500/3G)
// Rate Limiting híbrido: Local + Backend
// Otimizado para 5000 usuários simultâneos
// ============================================

import { useState, useCallback, useRef, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { RATE_LIMIT_CONFIG } from "@/lib/rateLimiter";

interface RateLimitConfig {
  endpoint: string;
  maxAttempts?: number;
  windowSeconds?: number;
  /** Se true, não faz chamada ao backend (apenas local) */
  localOnly?: boolean;
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfter?: number;
}

/** Mapeia endpoints para configs do RATE_LIMIT_CONFIG */
const ENDPOINT_DEFAULTS: Record<string, { limit: number; windowMs: number }> = {
  // Auth
  'login': RATE_LIMIT_CONFIG.auth.login,
  'signup': RATE_LIMIT_CONFIG.auth.signup,
  'password-reset': RATE_LIMIT_CONFIG.auth.passwordReset,
  '2fa': RATE_LIMIT_CONFIG.auth.twoFactor,
  
  // AI
  'ai-chat': RATE_LIMIT_CONFIG.ai.chat,
  'ai-tutor': RATE_LIMIT_CONFIG.ai.tutor,
  'ai-assistant': RATE_LIMIT_CONFIG.ai.assistant,
  'book-chat-ai': RATE_LIMIT_CONFIG.ai.bookChat,
  'generate-ai-content': RATE_LIMIT_CONFIG.ai.generate,
  
  // Video
  'video-authorize': RATE_LIMIT_CONFIG.video.authorize,
  'panda-video': RATE_LIMIT_CONFIG.video.panda,
  'book-page-signed-url': RATE_LIMIT_CONFIG.video.bookPage,
  
  // Chat
  'chat-message': RATE_LIMIT_CONFIG.chat.message,
  'chat-reaction': RATE_LIMIT_CONFIG.chat.reaction,
  'live-presence': RATE_LIMIT_CONFIG.chat.presence,
  
  // API
  'api-call': RATE_LIMIT_CONFIG.api.general,
  'search': RATE_LIMIT_CONFIG.api.search,
  'upload': RATE_LIMIT_CONFIG.api.upload,
  'file-download': RATE_LIMIT_CONFIG.api.download,
  
  // Email
  'send-email': RATE_LIMIT_CONFIG.email.send,
  'send-notification': RATE_LIMIT_CONFIG.email.notification,
};

export const useRateLimiter = () => {
  const [isBlocked, setIsBlocked] = useState(false);
  const [retryAfter, setRetryAfter] = useState<number | null>(null);
  const attemptsRef = useRef<Map<string, { count: number; resetAt: number }>>(new Map());
  
  /** Cache de bloqueios recentes (evita chamadas desnecessárias ao backend) */
  const recentBlocksRef = useRef<Map<string, number>>(new Map());

  /**
   * Obtém configuração padrão para o endpoint
   */
  const getDefaultConfig = useCallback((endpoint: string) => {
    const defaults = ENDPOINT_DEFAULTS[endpoint];
    if (defaults) {
      return { limit: defaults.limit, windowSeconds: defaults.windowMs / 1000 };
    }
    return { limit: 30, windowSeconds: 60 }; // default
  }, []);

  /**
   * Verifica rate limit localmente (rápido) + backend (preciso)
   */
  const checkRateLimit = useCallback(async (config: RateLimitConfig): Promise<RateLimitResult> => {
    const defaults = getDefaultConfig(config.endpoint);
    const { 
      endpoint, 
      maxAttempts = defaults.limit, 
      windowSeconds = defaults.windowSeconds,
      localOnly = false 
    } = config;
    const now = Date.now();
    
    // Verificar se foi bloqueado recentemente (evita spam ao backend)
    const recentBlock = recentBlocksRef.current.get(endpoint);
    if (recentBlock && recentBlock > now) {
      const retryIn = Math.ceil((recentBlock - now) / 1000);
      setIsBlocked(true);
      setRetryAfter(retryIn);
      return { allowed: false, remaining: 0, retryAfter: retryIn };
    }
    
    // Verificação local primeiro (mais rápido)
    const key = endpoint;
    const cached = attemptsRef.current.get(key);
    
    if (cached && cached.resetAt > now) {
      if (cached.count >= maxAttempts) {
        const retryIn = Math.ceil((cached.resetAt - now) / 1000);
        setIsBlocked(true);
        setRetryAfter(retryIn);
        recentBlocksRef.current.set(endpoint, cached.resetAt);
        return { allowed: false, remaining: 0, retryAfter: retryIn };
      }
      cached.count++;
    } else {
      attemptsRef.current.set(key, {
        count: 1,
        resetAt: now + (windowSeconds * 1000)
      });
    }
    
    // Se localOnly, não chamar backend
    if (localOnly) {
      setIsBlocked(false);
      setRetryAfter(null);
      return { 
        allowed: true, 
        remaining: maxAttempts - (attemptsRef.current.get(key)?.count || 1) 
      };
    }
    
    // Verificação no backend para precisão (apenas para endpoints críticos)
    const criticalEndpoints = ['login', 'signup', 'password-reset', '2fa', 'ai-chat', 'ai-tutor'];
    if (!criticalEndpoints.includes(endpoint)) {
      setIsBlocked(false);
      setRetryAfter(null);
      return { 
        allowed: true, 
        remaining: maxAttempts - (attemptsRef.current.get(key)?.count || 1) 
      };
    }
    
    try {
      const { data, error } = await supabase.functions.invoke('rate-limit-gateway', {
        body: { endpoint, action: 'check' }
      });
      
      if (error || !data?.allowed) {
        const retryIn = data?.retryAfter || windowSeconds;
        setIsBlocked(true);
        setRetryAfter(retryIn);
        recentBlocksRef.current.set(endpoint, now + (retryIn * 1000));
        return { 
          allowed: false, 
          remaining: 0, 
          retryAfter: retryIn 
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
      console.warn('[Rate Limit] Backend check failed, allowing:', err);
      return { allowed: true, remaining: maxAttempts };
    }
  }, [getDefaultConfig]);

  /**
   * Wrapper para executar ação com rate limiting
   */
  const withRateLimit = useCallback(async <T>(
    config: RateLimitConfig,
    action: () => Promise<T>
  ): Promise<T | null> => {
    const result = await checkRateLimit(config);
    
    if (!result.allowed) {
      console.warn(`🚫 Rate limit: bloqueado por ${result.retryAfter}s (${config.endpoint})`);
      return null;
    }
    
    return action();
  }, [checkRateLimit]);

  /**
   * Resetar contador local (após sucesso)
   */
  const resetLimit = useCallback((endpoint: string) => {
    attemptsRef.current.delete(endpoint);
    recentBlocksRef.current.delete(endpoint);
    setIsBlocked(false);
    setRetryAfter(null);
  }, []);

  /**
   * Obter estado atual de um endpoint
   */
  const getStatus = useCallback((endpoint: string) => {
    const defaults = getDefaultConfig(endpoint);
    const cached = attemptsRef.current.get(endpoint);
    const now = Date.now();
    
    if (!cached || cached.resetAt <= now) {
      return { count: 0, remaining: defaults.limit, isBlocked: false };
    }
    
    return {
      count: cached.count,
      remaining: Math.max(0, defaults.limit - cached.count),
      isBlocked: cached.count >= defaults.limit,
      resetIn: Math.ceil((cached.resetAt - now) / 1000)
    };
  }, [getDefaultConfig]);

  /** Configurações expostas para uso externo */
  const config = useMemo(() => RATE_LIMIT_CONFIG, []);

  return {
    isBlocked,
    retryAfter,
    checkRateLimit,
    withRateLimit,
    resetLimit,
    getStatus,
    config,
    ENDPOINT_DEFAULTS
  };
};

export default useRateLimiter;
