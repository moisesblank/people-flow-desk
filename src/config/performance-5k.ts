// ============================================
// 🔥 PROVA DE FOGO 5.000 SIMULTÂNEOS
// Configurações de Performance para Alta Escala
// ANO 2300 - MATRIZ DIGITAL SUPREMA
// ============================================

/**
 * DOGMAS DE PERFORMANCE PARA 5K SIMULTÂNEOS
 * Baseado na arquitetura existente, SEM QUEBRAR NADA
 */

export const LIVE_5K_CONFIG = {
  // ============================================
  // CHAT RATE LIMITING (CRÍTICO)
  // ============================================
  CHAT: {
    /** Intervalo mínimo entre mensagens - NORMAL (ms) */
    MIN_MESSAGE_INTERVAL: 2000, // 1 msg a cada 2s
    
    /** Intervalo em SLOW MODE - pico de usuários (ms) */
    SLOW_MODE_INTERVAL: 5000, // 1 msg a cada 5s
    
    /** Threshold para ativar slow mode automaticamente */
    SLOW_MODE_THRESHOLD_VIEWERS: 1000,
    
    /** Máximo de mensagens por minuto por usuário */
    MAX_MESSAGES_PER_MINUTE: 20,
    
    /** Tamanho máximo de mensagem (caracteres) */
    MAX_MESSAGE_LENGTH: 280,
    
    /** Máximo de mensagens exibidas no chat (virtualização) */
    MAX_VISIBLE_MESSAGES: 150,
    
    /** Intervalo de limpeza de mensagens antigas (ms) */
    CLEANUP_INTERVAL: 30000,
    
    /** Timeout para considerar mensagem como falha */
    SEND_TIMEOUT: 5000,
    
    /** Limite de reactions por segundo */
    MAX_REACTIONS_PER_SECOND: 5,
    
    /** Retenção de mensagens (ms) - 24 horas */
    MESSAGE_RETENTION_MS: 86400000,
    
    /** Batch size para persistência */
    BATCH_PERSIST_SIZE: 50,
    
    /** Intervalo de batch persist (ms) */
    BATCH_PERSIST_INTERVAL: 10000,
  },
  
  // ============================================
  // REALTIME OTIMIZAÇÕES
  // ============================================
  REALTIME: {
    /** Throttle de updates recebidos (ms) */
    UPDATE_THROTTLE: 100,
    
    /** Batch de mensagens para render (ms) */
    BATCH_RENDER_INTERVAL: 50,
    
    /** Reconexão automática (ms) */
    RECONNECT_DELAY: 3000,
    
    /** Máximo de tentativas de reconexão */
    MAX_RECONNECT_ATTEMPTS: 10,
    
    /** Heartbeat interval (ms) */
    HEARTBEAT_INTERVAL: 30000,
    
    /** Timeout de conexão (ms) */
    CONNECTION_TIMEOUT: 10000,
  },
  
  // ============================================
  // UI/RENDER OTIMIZAÇÕES
  // ============================================
  UI: {
    /** Altura estimada de cada mensagem (px) para virtualização */
    MESSAGE_HEIGHT_ESTIMATE: 60,
    
    /** Overscan para virtualização (itens extras renderizados) */
    OVERSCAN_COUNT: 5,
    
    /** Debounce para scroll auto (ms) */
    SCROLL_DEBOUNCE: 100,
    
    /** Animações habilitadas por tier */
    ANIMATIONS_BY_TIER: {
      quantum: true,
      neural: true,
      enhanced: true,
      standard: true,
      legacy: false,
    },
    
    /** Reactions floating máximas visíveis */
    MAX_FLOATING_REACTIONS: 15,
    
    /** Duração da animação de reaction (ms) */
    REACTION_ANIMATION_DURATION: 3000,
  },
  
  // ============================================
  // VIEWERS/PRESENÇA
  // ============================================
  VIEWERS: {
    /** Intervalo de atualização de viewers (ms) */
    UPDATE_INTERVAL: 5000,
    
    /** Cache de viewers (ms) */
    CACHE_TTL: 10000,
    
    /** Debounce para broadcast de presença (ms) */
    PRESENCE_DEBOUNCE: 1000,
  },
  
  // ============================================
  // CACHE ESPECÍFICO PARA LIVES
  // ============================================
  CACHE: {
    /** TTL para dados da live (ms) */
    LIVE_DATA_TTL: 5000,
    
    /** TTL para histórico de mensagens (ms) */
    MESSAGES_HISTORY_TTL: 60000,
    
    /** Máximo de lives no cache */
    MAX_CACHED_LIVES: 10,
  },
} as const;

// ============================================
// TIPOS
// ============================================

export interface LiveMessage {
  id: string;
  user_id: string;
  user_name: string;
  avatar_url?: string;
  message: string;
  created_at: string;
  is_highlighted?: boolean;
  is_moderator?: boolean;
}

export interface LiveReaction {
  id: string;
  type: 'heart' | 'like' | 'laugh' | 'fire';
  timestamp: number;
}

export interface LiveState {
  isConnected: boolean;
  viewers: number;
  messages: LiveMessage[];
  reactions: LiveReaction[];
  isLoading: boolean;
  error: string | null;
}

export interface RateLimitState {
  canSendMessage: boolean;
  nextMessageAt: number;
  messagesInWindow: number;
  isBlocked: boolean;
  blockReason?: string;
}

// ============================================
// UTILITIES
// ============================================

/**
 * Verifica se pode enviar mensagem baseado no rate limit
 */
export function checkChatRateLimit(
  lastMessageTime: number,
  messagesInLastMinute: number
): RateLimitState {
  const now = Date.now();
  const timeSinceLastMessage = now - lastMessageTime;
  const canSendBasedOnInterval = timeSinceLastMessage >= LIVE_5K_CONFIG.CHAT.MIN_MESSAGE_INTERVAL;
  const canSendBasedOnVolume = messagesInLastMinute < LIVE_5K_CONFIG.CHAT.MAX_MESSAGES_PER_MINUTE;
  
  return {
    canSendMessage: canSendBasedOnInterval && canSendBasedOnVolume,
    nextMessageAt: lastMessageTime + LIVE_5K_CONFIG.CHAT.MIN_MESSAGE_INTERVAL,
    messagesInWindow: messagesInLastMinute,
    isBlocked: !canSendBasedOnVolume,
    blockReason: !canSendBasedOnVolume 
      ? 'Limite de mensagens por minuto atingido'
      : !canSendBasedOnInterval 
        ? 'Aguarde para enviar outra mensagem'
        : undefined
  };
}

/**
 * Limita mensagens para renderização eficiente
 */
export function trimMessages(messages: LiveMessage[]): LiveMessage[] {
  if (messages.length <= LIVE_5K_CONFIG.CHAT.MAX_VISIBLE_MESSAGES) {
    return messages;
  }
  return messages.slice(-LIVE_5K_CONFIG.CHAT.MAX_VISIBLE_MESSAGES);
}

/**
 * Limita reactions para não sobrecarregar animações
 */
export function trimReactions(reactions: LiveReaction[]): LiveReaction[] {
  const now = Date.now();
  const validReactions = reactions.filter(
    r => now - r.timestamp < LIVE_5K_CONFIG.UI.REACTION_ANIMATION_DURATION
  );
  
  if (validReactions.length <= LIVE_5K_CONFIG.UI.MAX_FLOATING_REACTIONS) {
    return validReactions;
  }
  
  return validReactions.slice(-LIVE_5K_CONFIG.UI.MAX_FLOATING_REACTIONS);
}

/**
 * Gera ID único para reaction
 */
export function generateReactionId(): string {
  return `reaction_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

console.log('[PROVA DE FOGO 5K] ⚡ Configurações carregadas - Matriz 2300');
