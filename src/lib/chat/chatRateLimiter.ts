// ============================================
// MASTER PRO ULTRA v3.0 - CHAT RATE LIMITER
// Rate limiting específico para chat de lives
// 1 mensagem a cada 2 segundos
// ============================================

interface RateLimitState {
  lastMessageTime: number;
  messageCount: number;
  isBlocked: boolean;
  blockExpiry: number;
}

interface RateLimitConfig {
  intervalMs: number; // Intervalo mínimo entre mensagens
  burstLimit: number; // Máximo de mensagens em sequência rápida
  burstWindowMs: number; // Janela para contar burst
  blockDurationMs: number; // Duração do bloqueio por spam
}

const DEFAULT_CONFIG: RateLimitConfig = {
  intervalMs: 2000, // 1 msg/2s
  burstLimit: 5, // Máximo 5 mensagens
  burstWindowMs: 10000, // Em 10 segundos
  blockDurationMs: 30000, // Bloqueio de 30s por spam
};

class ChatRateLimiter {
  private states: Map<string, RateLimitState> = new Map();
  private messageHistory: Map<string, number[]> = new Map();
  private config: RateLimitConfig;

  constructor(config: Partial<RateLimitConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  private getKey(userId: string, liveId: string): string {
    return `${userId}:${liveId}`;
  }

  private getState(key: string): RateLimitState {
    if (!this.states.has(key)) {
      this.states.set(key, {
        lastMessageTime: 0,
        messageCount: 0,
        isBlocked: false,
        blockExpiry: 0,
      });
    }
    return this.states.get(key)!;
  }

  private getHistory(key: string): number[] {
    if (!this.messageHistory.has(key)) {
      this.messageHistory.set(key, []);
    }
    return this.messageHistory.get(key)!;
  }

  canSendMessage(userId: string, liveId: string): { 
    allowed: boolean; 
    waitMs: number; 
    reason?: string;
  } {
    const key = this.getKey(userId, liveId);
    const state = this.getState(key);
    const now = Date.now();

    // Verificar bloqueio por spam
    if (state.isBlocked) {
      if (now < state.blockExpiry) {
        return {
          allowed: false,
          waitMs: state.blockExpiry - now,
          reason: 'Você está temporariamente bloqueado por enviar muitas mensagens',
        };
      }
      // Bloqueio expirou
      state.isBlocked = false;
      state.messageCount = 0;
    }

    // Verificar intervalo mínimo
    const timeSinceLastMessage = now - state.lastMessageTime;
    if (timeSinceLastMessage < this.config.intervalMs) {
      return {
        allowed: false,
        waitMs: this.config.intervalMs - timeSinceLastMessage,
        reason: 'Aguarde antes de enviar outra mensagem',
      };
    }

    // Verificar burst limit
    const history = this.getHistory(key);
    const recentMessages = history.filter(
      (t) => now - t < this.config.burstWindowMs
    );

    if (recentMessages.length >= this.config.burstLimit) {
      // Aplicar bloqueio temporário
      state.isBlocked = true;
      state.blockExpiry = now + this.config.blockDurationMs;
      return {
        allowed: false,
        waitMs: this.config.blockDurationMs,
        reason: 'Muitas mensagens em pouco tempo. Aguarde 30 segundos.',
      };
    }

    return { allowed: true, waitMs: 0 };
  }

  recordMessage(userId: string, liveId: string): void {
    const key = this.getKey(userId, liveId);
    const state = this.getState(key);
    const history = this.getHistory(key);
    const now = Date.now();

    state.lastMessageTime = now;
    state.messageCount++;

    // Adicionar ao histórico
    history.push(now);

    // Limpar histórico antigo
    const cutoff = now - this.config.burstWindowMs;
    this.messageHistory.set(
      key,
      history.filter((t) => t > cutoff)
    );
  }

  getWaitTime(userId: string, liveId: string): number {
    const result = this.canSendMessage(userId, liveId);
    return result.waitMs;
  }

  getRemainingCooldown(userId: string, liveId: string): number {
    const key = this.getKey(userId, liveId);
    const state = this.getState(key);
    const now = Date.now();

    if (state.isBlocked && now < state.blockExpiry) {
      return Math.ceil((state.blockExpiry - now) / 1000);
    }

    const timeSinceLastMessage = now - state.lastMessageTime;
    if (timeSinceLastMessage < this.config.intervalMs) {
      return Math.ceil((this.config.intervalMs - timeSinceLastMessage) / 1000);
    }

    return 0;
  }

  isBlocked(userId: string, liveId: string): boolean {
    const key = this.getKey(userId, liveId);
    const state = this.getState(key);
    return state.isBlocked && Date.now() < state.blockExpiry;
  }

  reset(userId: string, liveId: string): void {
    const key = this.getKey(userId, liveId);
    this.states.delete(key);
    this.messageHistory.delete(key);
  }

  resetAll(): void {
    this.states.clear();
    this.messageHistory.clear();
  }

  updateConfig(config: Partial<RateLimitConfig>): void {
    this.config = { ...this.config, ...config };
  }

  getStats(userId: string, liveId: string): {
    messagesInWindow: number;
    isBlocked: boolean;
    cooldownSeconds: number;
  } {
    const key = this.getKey(userId, liveId);
    const history = this.getHistory(key);
    const now = Date.now();

    const recentMessages = history.filter(
      (t) => now - t < this.config.burstWindowMs
    );

    return {
      messagesInWindow: recentMessages.length,
      isBlocked: this.isBlocked(userId, liveId),
      cooldownSeconds: this.getRemainingCooldown(userId, liveId),
    };
  }
}

// Singleton para uso global
export const chatRateLimiter = new ChatRateLimiter();

// Hook para uso em componentes React
export function useChatRateLimiter(userId: string, liveId: string) {
  const canSend = () => chatRateLimiter.canSendMessage(userId, liveId);
  const record = () => chatRateLimiter.recordMessage(userId, liveId);
  const waitTime = () => chatRateLimiter.getWaitTime(userId, liveId);
  const cooldown = () => chatRateLimiter.getRemainingCooldown(userId, liveId);
  const isBlocked = () => chatRateLimiter.isBlocked(userId, liveId);
  const stats = () => chatRateLimiter.getStats(userId, liveId);
  const reset = () => chatRateLimiter.reset(userId, liveId);

  return { canSend, record, waitTime, cooldown, isBlocked, stats, reset };
}
