// ============================================
// MASTER PRO ULTRA v3.0 - CHAT RATE LIMIT HOOK
// Hook React para controle de rate limit do chat
// Com validação, slow mode e timeout
// ============================================

import { useState, useCallback, useRef, useEffect } from 'react';

// ============================================
// INTERFACES
// ============================================

interface RateLimitState {
  canSend: boolean;
  cooldownRemaining: number;
  messagesInWindow: number;
  isSlowMode: boolean;
  isTimedOut: boolean;
  timeoutRemaining: number;
}

interface RateLimitConfig {
  cooldownMs: number;
  slowModeCooldownMs: number;
  maxMessages: number;
  windowMs: number;
  maxChars: number;
  slowMode: boolean;
  isTimedOut: boolean;
  timeoutRemaining: number;
}

interface UseChatRateLimitOptions {
  cooldownMs?: number;
  slowModeCooldownMs?: number;
  maxMessages?: number;
  windowMs?: number;
  maxChars?: number;
  customConfig?: Partial<RateLimitConfig>;
}

// ============================================
// CONSTANTES DE MODERAÇÃO
// ============================================

const BLOCKED_WORDS = [
  'porra', 'caralho', 'foda', 'merda', 'buceta', 'pinto', 'rola',
  'viado', 'bicha', 'sapatao', 'traveco', 'preto fedido', 'macaco',
  'nazista', 'hitler', 'suicidio', 'se mata', 'vai morrer',
  'estupro', 'pedofilo', 'crack', 'cocaina', 'maconha',
];

const SPAM_PATTERNS = [
  /(.)\1{5,}/i, // Caractere repetido 6+ vezes
  /(\b\w+\b)(\s+\1){3,}/i, // Palavra repetida 4+ vezes
  /^[A-Z\s!?]+$/m, // Tudo maiúsculo (caps lock)
  /(https?:\/\/[^\s]+)/gi, // URLs (opcional bloquear)
];

// ============================================
// HOOK PRINCIPAL
// ============================================

export function useChatRateLimit(options: UseChatRateLimitOptions = {}) {
  const {
    cooldownMs = 2000,
    slowModeCooldownMs = 5000,
    maxMessages = 5,
    windowMs = 10000,
    maxChars = 500,
    customConfig,
  } = options;

  // ============================================
  // ESTADO
  // ============================================

  const [state, setState] = useState<RateLimitState>({
    canSend: true,
    cooldownRemaining: 0,
    messagesInWindow: 0,
    isSlowMode: false,
    isTimedOut: false,
    timeoutRemaining: 0,
  });

  // ============================================
  // REFS
  // ============================================

  const messageTimestamps = useRef<number[]>([]);
  const lastMessageTime = useRef<number>(0);
  const cooldownTimer = useRef<NodeJS.Timeout | null>(null);
  const timeoutTimer = useRef<NodeJS.Timeout | null>(null);
  const updateIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const config = useRef<RateLimitConfig>({
    cooldownMs,
    slowModeCooldownMs,
    maxMessages,
    windowMs,
    maxChars,
    slowMode: false,
    isTimedOut: false,
    timeoutRemaining: 0,
  });

  // ============================================
  // VERIFICAR SE PODE ENVIAR
  // ============================================

  const checkCanSend = useCallback((): { allowed: boolean; waitMs: number; reason?: string } => {
    const now = Date.now();

    // Verificar timeout
    if (state.isTimedOut) {
      return {
        allowed: false,
        waitMs: state.timeoutRemaining * 1000,
        reason: 'Você está temporariamente bloqueado',
      };
    }

    // Verificar cooldown
    const currentCooldown = state.isSlowMode 
      ? config.current.slowModeCooldownMs 
      : config.current.cooldownMs;

    const timeSinceLastMessage = now - lastMessageTime.current;
    if (timeSinceLastMessage < currentCooldown) {
      return {
        allowed: false,
        waitMs: currentCooldown - timeSinceLastMessage,
        reason: 'Aguarde antes de enviar outra mensagem',
      };
    }

    // Verificar burst limit
    const recentMessages = messageTimestamps.current.filter(
      (t) => now - t < config.current.windowMs
    );

    if (recentMessages.length >= config.current.maxMessages) {
      return {
        allowed: false,
        waitMs: config.current.windowMs - (now - recentMessages[0]),
        reason: 'Muitas mensagens em pouco tempo',
      };
    }

    return { allowed: true, waitMs: 0 };
  }, [state.isTimedOut, state.timeoutRemaining, state.isSlowMode]);

  // ============================================
  // REGISTRAR MENSAGEM ENVIADA
  // ============================================

  const recordMessage = useCallback(() => {
    const now = Date.now();

    // Atualizar timestamps
    lastMessageTime.current = now;
    messageTimestamps.current.push(now);

    // Limpar timestamps antigos
    const cutoff = now - config.current.windowMs;
    messageTimestamps.current = messageTimestamps.current.filter((t) => t > cutoff);

    // Atualizar estado
    setState(prev => ({
      ...prev,
      canSend: false,
      messagesInWindow: messageTimestamps.current.length,
    }));

    // Iniciar cooldown
    const currentCooldown = state.isSlowMode 
      ? config.current.slowModeCooldownMs 
      : config.current.cooldownMs;

    if (cooldownTimer.current) {
      clearInterval(cooldownTimer.current);
    }

    let remaining = Math.ceil(currentCooldown / 1000);
    setState(prev => ({ ...prev, cooldownRemaining: remaining }));

    cooldownTimer.current = setInterval(() => {
      remaining -= 1;
      if (remaining <= 0) {
        if (cooldownTimer.current) {
          clearInterval(cooldownTimer.current);
          cooldownTimer.current = null;
        }
        setState(prev => ({
          ...prev,
          canSend: true,
          cooldownRemaining: 0,
        }));
      } else {
        setState(prev => ({ ...prev, cooldownRemaining: remaining }));
      }
    }, 1000);
  }, [state.isSlowMode]);

  // ============================================
  // RESET
  // ============================================

  const reset = useCallback(() => {
    messageTimestamps.current = [];
    lastMessageTime.current = 0;

    if (cooldownTimer.current) {
      clearInterval(cooldownTimer.current);
      cooldownTimer.current = null;
    }

    if (timeoutTimer.current) {
      clearTimeout(timeoutTimer.current);
      timeoutTimer.current = null;
    }

    setState({
      canSend: true,
      cooldownRemaining: 0,
      messagesInWindow: 0,
      isSlowMode: false,
      isTimedOut: false,
      timeoutRemaining: 0,
    });
  }, []);

  // ============================================
  // SLOW MODE
  // ============================================

  const enableSlowMode = useCallback((intervalMs?: number) => {
    if (intervalMs) {
      config.current.slowModeCooldownMs = intervalMs;
    }
    config.current.slowMode = true;
    setState(prev => ({ ...prev, isSlowMode: true }));
  }, []);

  const disableSlowMode = useCallback(() => {
    config.current.slowMode = false;
    setState(prev => ({ ...prev, isSlowMode: false }));
  }, []);

  // ============================================
  // TIMEOUT
  // ============================================

  const applyTimeout = useCallback((durationMs: number) => {
    const seconds = Math.ceil(durationMs / 1000);

    setState(prev => ({
      ...prev,
      isTimedOut: true,
      canSend: false,
      timeoutRemaining: seconds,
    }));

    // Timer para atualizar countdown
    if (updateIntervalRef.current) {
      clearInterval(updateIntervalRef.current);
    }

    updateIntervalRef.current = setInterval(() => {
      setState(prev => {
        const newRemaining = prev.timeoutRemaining - 1;
        if (newRemaining <= 0) {
          if (updateIntervalRef.current) {
            clearInterval(updateIntervalRef.current);
            updateIntervalRef.current = null;
          }
          return prev;
        }
        return { ...prev, timeoutRemaining: newRemaining };
      });
    }, 1000);

    // Timer para remover timeout
    if (timeoutTimer.current) {
      clearTimeout(timeoutTimer.current);
    }

    timeoutTimer.current = setTimeout(() => {
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
        updateIntervalRef.current = null;
      }
      setState(prev => ({
        ...prev,
        isTimedOut: false,
        canSend: true,
        timeoutRemaining: 0,
      }));
    }, durationMs);
  }, []);

  // ============================================
  // VALIDAR MENSAGEM (ULTRA SEGURO)
  // ============================================

  const validateMessage = useCallback((message: string): { valid: boolean; error?: string } => {
    // Verificar se está vazia
    if (!message || message.trim().length === 0) {
      return { valid: false, error: 'Mensagem não pode estar vazia' };
    }

    // Verificar tamanho mínimo
    if (message.trim().length < 2) {
      return { valid: false, error: 'Mensagem muito curta' };
    }

    // Verificar tamanho máximo
    if (message.length > config.current.maxChars) {
      return { 
        valid: false, 
        error: `Mensagem muito longa (máx. ${config.current.maxChars} caracteres)` 
      };
    }

    // Verificar palavras bloqueadas
    const lowerMessage = message.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    for (const word of BLOCKED_WORDS) {
      if (lowerMessage.includes(word)) {
        return { valid: false, error: 'Mensagem contém conteúdo não permitido' };
      }
    }

    // Verificar padrões de spam
    for (const pattern of SPAM_PATTERNS) {
      if (pattern.test(message)) {
        return { valid: false, error: 'Mensagem parece ser spam' };
      }
    }

    // Verificar se é apenas emojis/símbolos
    const textOnly = message.replace(/[\p{Emoji}\p{Symbol}\s]/gu, '');
    if (textOnly.length === 0 && message.length > 10) {
      return { valid: false, error: 'Mensagem deve conter texto' };
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
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
      }
    };
  }, []);

  // ============================================
  // SINCRONIZAR CONFIG EXTERNA
  // ============================================

  useEffect(() => {
    if (customConfig) {
      config.current = { ...config.current, ...customConfig };
      setState(prev => ({
        ...prev,
        isSlowMode: config.current.slowMode,
        isTimedOut: config.current.isTimedOut,
        timeoutRemaining: config.current.timeoutRemaining,
      }));
    }
  }, [customConfig?.slowMode, customConfig?.isTimedOut, customConfig?.timeoutRemaining]);

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
