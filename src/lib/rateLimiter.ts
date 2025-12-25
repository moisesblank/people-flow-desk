// ============================================
// 🔥 RATE LIMITER v4.0 - LEI I (Performance 3500/3G)
// Alinhado com rate-limit-gateway Edge Function
// Otimizado para 5000 usuários simultâneos
// ============================================

/**
 * Configuração centralizada de Rate Limits
 * Deve SEMPRE estar alinhada com rate-limit-gateway
 */
export const RATE_LIMIT_CONFIG = {
  // === AUTH (CRÍTICO) ===
  auth: {
    login: { limit: 5, windowMs: 300000 },       // 5/5min
    signup: { limit: 3, windowMs: 600000 },      // 3/10min
    passwordReset: { limit: 3, windowMs: 600000 },// 3/10min
    twoFactor: { limit: 5, windowMs: 300000 },   // 5/5min
  },
  
  // === AI (ALTO CUSTO) ===
  ai: {
    chat: { limit: 20, windowMs: 60000 },        // 20/min
    tutor: { limit: 15, windowMs: 60000 },       // 15/min
    assistant: { limit: 15, windowMs: 60000 },   // 15/min
    bookChat: { limit: 10, windowMs: 60000 },    // 10/min
    generate: { limit: 5, windowMs: 60000 },     // 5/min
  },
  
  // === VIDEO ===
  video: {
    authorize: { limit: 30, windowMs: 60000 },   // 30/min
    panda: { limit: 30, windowMs: 60000 },       // 30/min
    bookPage: { limit: 60, windowMs: 60000 },    // 60/min
  },
  
  // === CHAT/REALTIME ===
  chat: {
    message: { limit: 30, windowMs: 60000 },     // 30/min
    reaction: { limit: 60, windowMs: 60000 },    // 60/min
    presence: { limit: 12, windowMs: 60000 },    // 12/min
  },
  
  // === API GERAL ===
  api: {
    general: { limit: 100, windowMs: 60000 },    // 100/min
    search: { limit: 30, windowMs: 60000 },      // 30/min
    upload: { limit: 10, windowMs: 60000 },      // 10/min
    download: { limit: 50, windowMs: 60000 },    // 50/min
  },
  
  // === EMAIL ===
  email: {
    send: { limit: 10, windowMs: 60000 },        // 10/min
    notification: { limit: 20, windowMs: 60000 },// 20/min
  },
} as const;

class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  private limit: number;
  private window: number; // em ms

  constructor(limit: number = 10, windowMs: number = 60000) {
    this.limit = limit;
    this.window = windowMs;
  }

  canMakeRequest(key: string): boolean {
    const now = Date.now();
    const timestamps = this.requests.get(key) || [];

    // Remover timestamps antigos
    const validTimestamps = timestamps.filter(t => now - t < this.window);

    if (validTimestamps.length >= this.limit) {
      return false;
    }

    validTimestamps.push(now);
    this.requests.set(key, validTimestamps);

    return true;
  }

  getRemainingRequests(key: string): number {
    const now = Date.now();
    const timestamps = this.requests.get(key) || [];
    const validTimestamps = timestamps.filter(t => now - t < this.window);

    return Math.max(0, this.limit - validTimestamps.length);
  }

  getResetTime(key: string): number {
    const timestamps = this.requests.get(key) || [];
    if (timestamps.length === 0) return 0;

    const oldest = Math.min(...timestamps);
    return Math.max(0, this.window - (Date.now() - oldest));
  }

  reset(key: string): void {
    this.requests.delete(key);
  }

  resetAll(): void {
    this.requests.clear();
  }
  
  /** Atualiza limites dinamicamente */
  updateLimits(limit: number, windowMs: number): void {
    this.limit = limit;
    this.window = windowMs;
  }
}

// ============================================
// INSTÂNCIAS PRÉ-CONFIGURADAS (LEI I)
// ============================================

// AUTH - Proteção contra brute force
export const loginRateLimiter = new RateLimiter(
  RATE_LIMIT_CONFIG.auth.login.limit, 
  RATE_LIMIT_CONFIG.auth.login.windowMs
);

// AI - Alto custo (tokens)
export const aiChatRateLimiter = new RateLimiter(
  RATE_LIMIT_CONFIG.ai.chat.limit, 
  RATE_LIMIT_CONFIG.ai.chat.windowMs
);
export const aiTutorRateLimiter = new RateLimiter(
  RATE_LIMIT_CONFIG.ai.tutor.limit, 
  RATE_LIMIT_CONFIG.ai.tutor.windowMs
);

// CHAT - 5000 simultâneos
export const chatRateLimiter = new RateLimiter(
  RATE_LIMIT_CONFIG.chat.message.limit, 
  RATE_LIMIT_CONFIG.chat.message.windowMs
);
export const reactionRateLimiter = new RateLimiter(
  RATE_LIMIT_CONFIG.chat.reaction.limit, 
  RATE_LIMIT_CONFIG.chat.reaction.windowMs
);

// API - Geral
export const apiRateLimiter = new RateLimiter(
  RATE_LIMIT_CONFIG.api.general.limit, 
  RATE_LIMIT_CONFIG.api.general.windowMs
);
export const searchRateLimiter = new RateLimiter(
  RATE_LIMIT_CONFIG.api.search.limit, 
  RATE_LIMIT_CONFIG.api.search.windowMs
);
export const uploadRateLimiter = new RateLimiter(
  RATE_LIMIT_CONFIG.api.upload.limit, 
  RATE_LIMIT_CONFIG.api.upload.windowMs
);

// Hook para uso em componentes
export function useRateLimiterHook(limiter: RateLimiter, key: string) {
  const canRequest = () => limiter.canMakeRequest(key);
  const remaining = () => limiter.getRemainingRequests(key);
  const resetTime = () => limiter.getResetTime(key);
  const reset = () => limiter.reset(key);

  return { canRequest, remaining, resetTime, reset };
}

// Export default da classe para uso customizado
export default RateLimiter;
