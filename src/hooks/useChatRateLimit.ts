// ============================================
// 🔥 HOOK: useChatRateLimit
// Rate limiting inteligente para chat de lives
// Suporte a 5.000 usuários simultâneos
// Design 2300 - Futurista e Performático
// ============================================

import { useState, useCallback, useRef, useEffect } from 'react';

// ============================================
// CONFIGURAÇÕES DO RATE LIMITER
// ============================================
export interface RateLimitConfig {
  /** Intervalo mínimo entre mensagens (ms) */
  minInterval: number;
  /** Máximo de mensagens por janela de tempo */
  maxMessages: number;
  /** Janela de tempo para contagem (ms) */
  windowSize: number;
  /** Limite de caracteres por mensagem */
  maxChars: number;
  /** Modo slow ativo (duplica o intervalo) */
  slowMode: boolean;
  /** Usuário está em timeout */
  isTimedOut: boolean;
  /** Tempo restante do timeout (ms) */
  timeoutRemaining: number;
}

export interface RateLimitState {
  /** Pode enviar mensagem agora? */
  canSend: boolean;
  /** Tempo até poder enviar (ms) */
  cooldownRemaining: number;
  /** Mensagens enviadas na janela atual */
  messageCount: number;
  /** Está em slow mode? */
  isSlowMode: boolean;
  /** Está em timeout? */
  isTimedOut: boolean;
  /** Tempo restante do timeout */
  timeoutRemaining: number;
}

export interface UseChatRateLimitReturn {
  /** Estado atual do rate limiter */
  state: RateLimitState;
  /** Verificar se pode enviar (atualiza estado) */
  checkCanSend: () => boolean;
  /** Registrar envio de mensagem */
  recordMessage: () => void;
  /** Resetar contadores */
  reset: () => void;
  /** Ativar slow mode */
  enableSlowMode: () => void;
  /** Desativar slow mode */
  disableSlowMode: () => void;
  /** Aplicar timeout ao usuário */
  applyTimeout: (durationMs: number) => void;
  /** Validar mensagem (tamanho, conteúdo) */
  validateMessage: (message: string) => { valid: boolean; error?: string };
  /** Configurações atuais */
  config: RateLimitConfig;
}

// ============================================
// CONFIGURAÇÕES PADRÃO (2300 FUTURISTA)
// ============================================
const DEFAULT_CONFIG: RateLimitConfig = {
  minInterval: 2000,      // 2 segundos entre mensagens
  maxMessages: 10,        // Máximo 10 mensagens por janela
  windowSize: 60000,      // Janela de 1 minuto
  maxChars: 280,          // Limite Twitter-style
  slowMode: false,
  isTimedOut: false,
  timeoutRemaining: 0,
};

// Palavras bloqueadas (básico - expandir conforme necessário)
const BLOCKED_WORDS = [
  'spam',
  // Adicionar mais conforme necessário
];

// ============================================
// HOOK PRINCIPAL
// ============================================
export function useChatRateLimit(
  customConfig?: Partial<RateLimitConfig>
): UseChatRateLimitReturn {
  // Merge de configurações
  const config = useRef<RateLimitConfig>({
    ...DEFAULT_CONFIG,
    ...customConfig,
  });

  // Estado do rate limiter
  const [state, setState] = useState<RateLimitState>({
    canSend: true,
    cooldownRemaining: 0,
    messageCount: 0,
    isSlowMode: config.current.slowMode,
    isTimedOut: false,
    timeoutRemaining: 0,
  });

  // Histórico de mensagens (timestamps)
  const messageHistory = useRef<number[]>([]);
  
  // Último envio
  const lastSendTime = useRef<number>(0);
  
  // Timer do cooldown
  const cooldownTimer = useRef<NodeJS.Timeout | null>(null);
  
  // Timer do timeout
  const timeoutTimer = useRef<NodeJS.Timeout | null>(null);

  // ============================================
  // LIMPAR MENSAGENS ANTIGAS DA JANELA
  // ============================================
  const cleanOldMessages = useCallback(() => {
    const now = Date.now();
    const windowStart = now - config.current.windowSize;
    messageHistory.current = messageHistory.current.filter(
      (timestamp) => timestamp > windowStart
    );
  }, []);

  // ============================================
  // VERIFICAR SE PODE ENVIAR
  // ============================================
  const checkCanSend = useCallback((): boolean => {
    // Se está em timeout, não pode enviar
    if (state.isTimedOut) {
      return false;
    }

    const now = Date.now();
    const interval = state.isSlowMode 
      ? config.current.minInterval * 2 
      : config.current.minInterval;

    // Verificar cooldown desde última mensagem
    const timeSinceLastSend = now - lastSendTime.current;
    if (timeSinceLastSend < interval) {
      const remaining = interval - timeSinceLastSend;
      setState(prev => ({
        ...prev,
        canSend: false,
        cooldownRemaining: remaining,
      }));
      return false;
    }

    // Limpar mensagens antigas e verificar limite da janela
    cleanOldMessages();
    if (messageHistory.current.length >= config.current.maxMessages) {
      setState(prev => ({
        ...prev,
        canSend: false,
        messageCount: messageHistory.current.length,
      }));
      return false;
    }

    setState(prev => ({
      ...prev,
      canSend: true,
      cooldownRemaining: 0,
      messageCount: messageHistory.current.length,
    }));
    return true;
  }, [state.isSlowMode, state.isTimedOut, cleanOldMessages]);

  // ============================================
  // REGISTRAR ENVIO DE MENSAGEM
  // ============================================
  const recordMessage = useCallback(() => {
    const now = Date.now();
    lastSendTime.current = now;
    messageHistory.current.push(now);

    const interval = state.isSlowMode 
      ? config.current.minInterval * 2 
      : config.current.minInterval;

    // Atualizar estado
    setState(prev => ({
      ...prev,
      canSend: false,
      cooldownRemaining: interval,
      messageCount: messageHistory.current.length,
    }));

    // Iniciar timer de cooldown
    if (cooldownTimer.current) {
      clearInterval(cooldownTimer.current);
    }

    cooldownTimer.current = setInterval(() => {
      const remaining = interval - (Date.now() - now);
      if (remaining <= 0) {
        if (cooldownTimer.current) {
          clearInterval(cooldownTimer.current);
        }
        setState(prev => ({
          ...prev,
          canSend: true,
          cooldownRemaining: 0,
        }));
      } else {
        setState(prev => ({
          ...prev,
          cooldownRemaining: remaining,
        }));
      }
    }, 100);
  }, [state.isSlowMode]);

  // ============================================
  // RESETAR CONTADORES
  // ============================================
  const reset = useCallback(() => {
    messageHistory.current = [];
    lastSendTime.current = 0;
    if (cooldownTimer.current) {
      clearInterval(cooldownTimer.current);
    }
    if (timeoutTimer.current) {
      clearTimeout(timeoutTimer.current);
    }
    setState({
      canSend: true,
      cooldownRemaining: 0,
      messageCount: 0,
      isSlowMode: config.current.slowMode,
      isTimedOut: false,
      timeoutRemaining: 0,
    });
  }, []);

  // ============================================
  // ATIVAR SLOW MODE
  // ============================================
  const enableSlowMode = useCallback(() => {
    config.current.slowMode = true;
    setState(prev => ({
      ...prev,
      isSlowMode: true,
    }));
  }, []);

  // ============================================
  // DESATIVAR SLOW MODE
  // ============================================
  const disableSlowMode = useCallback(() => {
    config.current.slowMode = false;
    setState(prev => ({
      ...prev,
      isSlowMode: false,
    }));
  }, []);

  // ============================================
  // APLICAR TIMEOUT
  // ============================================
  const applyTimeout = useCallback((durationMs: number) => {
    setState(prev => ({
      ...prev,
      isTimedOut: true,
      canSend: false,
      timeoutRemaining: durationMs,
    }));

    // Timer para atualizar countdown
    const startTime = Date.now();
    const updateInterval = setInterval(() => {
      const remaining = durationMs - (Date.now() - startTime);
      if (remaining <= 0) {
        clearInterval(updateInterval);
        setState(prev => ({
          ...prev,
          isTimedOut: false,
          canSend: true,
          timeoutRemaining: 0,
        }));
      } else {
        setState(prev => ({
          ...prev,
          timeoutRemaining: remaining,
        }));
      }
    }, 1000);

    timeoutTimer.current = setTimeout(() => {
      clearInterval(updateInterval);
      setState(prev => ({
        ...prev,
        isTimedOut: false,
        canSend: true,
        timeoutRemaining: 0,
      }));
    }, durationMs);
  }, []);

  // ============================================
  // VALIDAR MENSAGEM
  // ============================================
  const validateMessage = useCallback((message: string): { valid: boolean; error?: string } => {
    // Verificar se está vazia
    if (!message || message.trim().length === 0) {
      return { valid: false, error: 'Mensagem não pode estar vazia' };
    }

    // Verificar tamanho
    if (message.length > config.current.maxChars) {
      return { 
        valid: false, 
        error: `Mensagem muito longa (máx. ${config.current.maxChars} caracteres)` 
      };
    }

    // Verificar palavras bloqueadas
    const lowerMessage = message.toLowerCase();
    for (const word of BLOCKED_WORDS) {
      if (lowerMessage.includes(word)) {
        return { valid: false, error: 'Mensagem contém conteúdo não permitido' };
      }
    }

    // Verificar spam (muitos caracteres repetidos)
    if (/(.)\1{10,}/.test(message)) {
      return { valid: false, error: 'Mensagem parece ser spam' };
    }

    return { valid: true };
  }, []);

  // ============================================
  // CLEANUP
  // ============================================
  useEffect(() => {
    return () => {
      if (cooldownTimer.current) {
        clearInterval(cooldownTimer.current);
      }
      if (timeoutTimer.current) {
        clearTimeout(timeoutTimer.current);
      }
    };
  }, []);

  return {
    state,
    checkCanSend,
    recordMessage,
    reset,
    enableSlowMode,
    disableSlowMode,
    applyTimeout,
    validateMessage,
    config: config.current,
  };
}

// ============================================
// HOOK PARA MODERAÇÃO
// ============================================
export interface ModeratorActions {
  /** Dar timeout em um usuário */
  timeoutUser: (userId: string, durationMs: number, reason?: string) => Promise<void>;
  /** Banir usuário do chat */
  banUser: (userId: string, reason?: string) => Promise<void>;
  /** Desbanir usuário */
  unbanUser: (userId: string) => Promise<void>;
  /** Deletar mensagem */
  deleteMessage: (messageId: string) => Promise<void>;
  /** Ativar slow mode global */
  enableGlobalSlowMode: () => Promise<void>;
  /** Desativar slow mode global */
  disableGlobalSlowMode: () => Promise<void>;
  /** Limpar todo o chat */
  clearChat: () => Promise<void>;
}

export function useChatModeration(liveId: string): ModeratorActions {
  const timeoutUser = useCallback(async (userId: string, durationMs: number, reason?: string) => {
    console.log(`[MODERAÇÃO] Timeout: ${userId} por ${durationMs}ms. Razão: ${reason}`);
    // TODO: Implementar chamada ao Supabase
  }, []);

  const banUser = useCallback(async (userId: string, reason?: string) => {
    console.log(`[MODERAÇÃO] Ban: ${userId}. Razão: ${reason}`);
    // TODO: Implementar chamada ao Supabase
  }, [liveId]);

  const unbanUser = useCallback(async (userId: string) => {
    console.log(`[MODERAÇÃO] Unban: ${userId}`);
    // TODO: Implementar chamada ao Supabase
  }, [liveId]);

  const deleteMessage = useCallback(async (messageId: string) => {
    console.log(`[MODERAÇÃO] Delete message: ${messageId}`);
    // TODO: Implementar chamada ao Supabase
  }, []);

  const enableGlobalSlowMode = useCallback(async () => {
    console.log(`[MODERAÇÃO] Slow mode ativado para live: ${liveId}`);
    // TODO: Implementar chamada ao Supabase
  }, [liveId]);

  const disableGlobalSlowMode = useCallback(async () => {
    console.log(`[MODERAÇÃO] Slow mode desativado para live: ${liveId}`);
    // TODO: Implementar chamada ao Supabase
  }, [liveId]);

  const clearChat = useCallback(async () => {
    console.log(`[MODERAÇÃO] Chat limpo para live: ${liveId}`);
    // TODO: Implementar chamada ao Supabase
  }, [liveId]);

  return {
    timeoutUser,
    banUser,
    unbanUser,
    deleteMessage,
    enableGlobalSlowMode,
    disableGlobalSlowMode,
    clearChat,
  };
}

export default useChatRateLimit;
