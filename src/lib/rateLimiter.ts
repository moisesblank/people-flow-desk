// ============================================
// MASTER PRO ULTRA v3.0 - RATE LIMITER
// Proteção contra abuso no frontend
// ============================================

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
}

// Instâncias para diferentes endpoints
export const apiRateLimiter = new RateLimiter(100, 60000); // 100 req/min
export const chatRateLimiter = new RateLimiter(30, 60000); // 30 msg/min
export const reactionRateLimiter = new RateLimiter(60, 60000); // 60 reactions/min
export const searchRateLimiter = new RateLimiter(20, 60000); // 20 buscas/min
export const uploadRateLimiter = new RateLimiter(10, 60000); // 10 uploads/min

// Hook para uso em componentes
export function useRateLimiter(limiter: RateLimiter, key: string) {
  const canRequest = () => limiter.canMakeRequest(key);
  const remaining = () => limiter.getRemainingRequests(key);
  const resetTime = () => limiter.getResetTime(key);
  const reset = () => limiter.reset(key);

  return { canRequest, remaining, resetTime, reset };
}
