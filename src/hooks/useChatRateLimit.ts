// ============================================
// 🔥 HOOK: useChatRateLimit v2.0 - ULTRA EDITION
// Rate limiting inteligente para chat de lives
// Suporte a 5.000+ usuários simultâneos
// Design 2300 - Futurista, Performático, Seguro
// ============================================

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

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
  maxMessages: 15,        // Máximo 15 mensagens por janela
  windowSize: 60000,      // Janela de 1 minuto
  maxChars: 500,          // 500 caracteres max
  slowMode: false,
  isTimedOut: false,
  timeoutRemaining: 0,
};

// ============================================
// PALAVRAS BLOQUEADAS (EXPANDIDO)
// ============================================
const BLOCKED_WORDS = [
  'spam', 'scam', 'golpe', 'fraude', 'fake',
  'nude', 'nudes', 'porn', 'porno', 'xxx',
  'merda', 'porra', 'caralho', 'puta', 'viado',
  'nazista', 'nazi', 'hitler', 'kkk',
  'pix', 'deposito', 'dinheiro facil', 'investimento garantido',
  'whats', 'telegram', '@', 'http', 'www.',
];

// Padrões de spam mais sofisticados
const SPAM_PATTERNS = [
  /(.)\1{5,}/,                    // Caracteres repetidos
  /^[A-Z\s]{20,}$/,              // Tudo maiúsculo longo
  /(.{3,})\1{2,}/,               // Sequências repetidas
  /[!?]{3,}/,                     // Muita pontuação
  /(ha){5,}|(ks){5,}|(rs){5,}/i, // Risadas excessivas
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
    isTimedOut: config.current.isTimedOut,
    timeoutRemaining: config.current.timeoutRemaining,
  });

  // Histórico de mensagens (timestamps)
  const messageHistory = useRef<number[]>([]);
  
  // Último envio
  const lastSendTime = useRef<number>(0);
  
  // Timer do cooldown
  const cooldownTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  
  // Timer do timeout
  const timeoutTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  // Update interval timer
  const updateIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

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
          cooldownTimer.current = null;
        }
        setState(prev => ({
          ...prev,
          canSend: !prev.isTimedOut,
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
      cooldownTimer.current = null;
    }
    if (timeoutTimer.current) {
      clearTimeout(timeoutTimer.current);
      timeoutTimer.current = null;
    }
    if (updateIntervalRef.current) {
      clearInterval(updateIntervalRef.current);
      updateIntervalRef.current = null;
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
    // Limpar timers existentes
    if (timeoutTimer.current) {
      clearTimeout(timeoutTimer.current);
    }
    if (updateIntervalRef.current) {
      clearInterval(updateIntervalRef.current);
    }

    setState(prev => ({
      ...prev,
      isTimedOut: true,
      canSend: false,
      timeoutRemaining: durationMs,
    }));

    // Timer para atualizar countdown
    const startTime = Date.now();
    updateIntervalRef.current = setInterval(() => {
      const remaining = durationMs - (Date.now() - startTime);
      if (remaining <= 0) {
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
      } else {
        setState(prev => ({
          ...prev,
          timeoutRemaining: remaining,
        }));
      }
    }, 1000);

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

// ============================================
// HOOK PARA MODERAÇÃO v2.0 - IMPLEMENTAÇÃO REAL
// ============================================
export interface ModeratorActions {
  /** Dar timeout em um usuário */
  timeoutUser: (userId: string, durationMs: number, reason?: string) => Promise<boolean>;
  /** Banir usuário do chat */
  banUser: (userId: string, reason?: string) => Promise<boolean>;
  /** Desbanir usuário */
  unbanUser: (userId: string) => Promise<boolean>;
  /** Deletar mensagem */
  deleteMessage: (messageId: string) => Promise<boolean>;
  /** Ativar slow mode global */
  enableGlobalSlowMode: () => Promise<boolean>;
  /** Desativar slow mode global */
  disableGlobalSlowMode: () => Promise<boolean>;
  /** Limpar todo o chat */
  clearChat: () => Promise<boolean>;
  /** Pin de mensagem */
  pinMessage: (messageId: string) => Promise<boolean>;
  /** Unpin de mensagem */
  unpinMessage: (messageId: string) => Promise<boolean>;
  /** Estado de loading */
  isLoading: boolean;
  /** Erro atual */
  error: string | null;
}

export function useChatModeration(liveId: string): ModeratorActions {
  const { user, profile } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Verificar se é moderador
  const isModerator = useMemo(() => {
    if (!profile) return false;
    // @ts-ignore
    const role = profile.role as string;
    return ['owner', 'admin', 'moderator'].includes(role);
  }, [profile]);

  // ============================================
  // TIMEOUT USER
  // ============================================
  const timeoutUser = useCallback(async (
    userId: string, 
    durationMs: number, 
    reason?: string
  ): Promise<boolean> => {
    if (!isModerator || !user) {
      setError('Sem permissão para dar timeout');
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      const timeoutUntil = new Date(Date.now() + durationMs).toISOString();
      
      const { error: insertError } = await supabase
        .from('live_chat_bans')
        .upsert({
          live_id: liveId,
          user_id: userId,
          banned_by: user.id,
          is_ban: false,
          timeout_until: timeoutUntil,
          reason: reason || 'Timeout por moderador',
        }, {
          onConflict: 'live_id,user_id'
        });

      if (insertError) {
        console.error('[MODERAÇÃO] Erro timeout:', insertError);
        setError('Erro ao aplicar timeout');
        return false;
      }

      console.log(`[MODERAÇÃO] ✅ Timeout aplicado: ${userId} por ${durationMs}ms`);
      return true;

    } catch (err) {
      console.error('[MODERAÇÃO] Erro:', err);
      setError('Erro interno');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [liveId, user, isModerator]);

  // ============================================
  // BAN USER
  // ============================================
  const banUser = useCallback(async (userId: string, reason?: string): Promise<boolean> => {
    if (!isModerator || !user) {
      setError('Sem permissão para banir');
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { error: insertError } = await supabase
        .from('live_chat_bans')
        .upsert({
          live_id: liveId,
          user_id: userId,
          banned_by: user.id,
          is_ban: true,
          timeout_until: null, // Ban permanente
          reason: reason || 'Banido por moderador',
        }, {
          onConflict: 'live_id,user_id'
        });

      if (insertError) {
        console.error('[MODERAÇÃO] Erro ban:', insertError);
        setError('Erro ao banir usuário');
        return false;
      }

      console.log(`[MODERAÇÃO] ✅ Usuário banido: ${userId}`);
      return true;

    } catch (err) {
      console.error('[MODERAÇÃO] Erro:', err);
      setError('Erro interno');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [liveId, user, isModerator]);

  // ============================================
  // UNBAN USER
  // ============================================
  const unbanUser = useCallback(async (userId: string): Promise<boolean> => {
    if (!isModerator || !user) {
      setError('Sem permissão');
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { error: deleteError } = await supabase
        .from('live_chat_bans')
        .delete()
        .eq('live_id', liveId)
        .eq('user_id', userId);

      if (deleteError) {
        console.error('[MODERAÇÃO] Erro unban:', deleteError);
        setError('Erro ao desbanir');
        return false;
      }

      console.log(`[MODERAÇÃO] ✅ Usuário desbanido: ${userId}`);
      return true;

    } catch (err) {
      console.error('[MODERAÇÃO] Erro:', err);
      setError('Erro interno');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [liveId, user, isModerator]);

  // ============================================
  // DELETE MESSAGE
  // ============================================
  const deleteMessage = useCallback(async (messageId: string): Promise<boolean> => {
    if (!isModerator) {
      setError('Sem permissão');
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { error: updateError } = await supabase
        .from('live_chat_messages')
        .update({ 
          is_deleted: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', messageId);

      if (updateError) {
        console.error('[MODERAÇÃO] Erro delete:', updateError);
        setError('Erro ao deletar mensagem');
        return false;
      }

      console.log(`[MODERAÇÃO] ✅ Mensagem deletada: ${messageId}`);
      return true;

    } catch (err) {
      console.error('[MODERAÇÃO] Erro:', err);
      setError('Erro interno');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isModerator]);

  // ============================================
  // PIN MESSAGE
  // ============================================
  const pinMessage = useCallback(async (messageId: string): Promise<boolean> => {
    if (!isModerator) {
      setError('Sem permissão');
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Primeiro, desafixar todas as mensagens da live
      await supabase
        .from('live_chat_messages')
        .update({ is_pinned: false })
        .eq('live_id', liveId)
        .eq('is_pinned', true);

      // Fixar a nova mensagem
      const { error: updateError } = await supabase
        .from('live_chat_messages')
        .update({ 
          is_pinned: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', messageId);

      if (updateError) {
        console.error('[MODERAÇÃO] Erro pin:', updateError);
        setError('Erro ao fixar mensagem');
        return false;
      }

      console.log(`[MODERAÇÃO] ✅ Mensagem fixada: ${messageId}`);
      return true;

    } catch (err) {
      console.error('[MODERAÇÃO] Erro:', err);
      setError('Erro interno');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [liveId, isModerator]);

  // ============================================
  // UNPIN MESSAGE
  // ============================================
  const unpinMessage = useCallback(async (messageId: string): Promise<boolean> => {
    if (!isModerator) {
      setError('Sem permissão');
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { error: updateError } = await supabase
        .from('live_chat_messages')
        .update({ 
          is_pinned: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', messageId);

      if (updateError) {
        console.error('[MODERAÇÃO] Erro unpin:', updateError);
        setError('Erro ao desafixar mensagem');
        return false;
      }

      console.log(`[MODERAÇÃO] ✅ Mensagem desafixada: ${messageId}`);
      return true;

    } catch (err) {
      console.error('[MODERAÇÃO] Erro:', err);
      setError('Erro interno');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isModerator]);

  // ============================================
  // ENABLE GLOBAL SLOW MODE
  // ============================================
  const enableGlobalSlowMode = useCallback(async (): Promise<boolean> => {
    if (!isModerator) {
      setError('Sem permissão');
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { error: upsertError } = await supabase
        .from('live_chat_settings')
        .upsert({
          live_id: liveId,
          slow_mode: true,
          slow_mode_interval: 5000, // 5 segundos
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'live_id'
        });

      if (upsertError) {
        console.error('[MODERAÇÃO] Erro slow mode:', upsertError);
        setError('Erro ao ativar slow mode');
        return false;
      }

      console.log(`[MODERAÇÃO] ✅ Slow mode ativado para live: ${liveId}`);
      return true;

    } catch (err) {
      console.error('[MODERAÇÃO] Erro:', err);
      setError('Erro interno');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [liveId, isModerator]);

  // ============================================
  // DISABLE GLOBAL SLOW MODE
  // ============================================
  const disableGlobalSlowMode = useCallback(async (): Promise<boolean> => {
    if (!isModerator) {
      setError('Sem permissão');
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { error: upsertError } = await supabase
        .from('live_chat_settings')
        .upsert({
          live_id: liveId,
          slow_mode: false,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'live_id'
        });

      if (upsertError) {
        console.error('[MODERAÇÃO] Erro slow mode:', upsertError);
        setError('Erro ao desativar slow mode');
        return false;
      }

      console.log(`[MODERAÇÃO] ✅ Slow mode desativado para live: ${liveId}`);
      return true;

    } catch (err) {
      console.error('[MODERAÇÃO] Erro:', err);
      setError('Erro interno');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [liveId, isModerator]);

  // ============================================
  // CLEAR CHAT
  // ============================================
  const clearChat = useCallback(async (): Promise<boolean> => {
    if (!isModerator) {
      setError('Sem permissão');
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Soft delete - marca todas como deletadas
      const { error: updateError } = await supabase
        .from('live_chat_messages')
        .update({ 
          is_deleted: true,
          updated_at: new Date().toISOString()
        })
        .eq('live_id', liveId)
        .eq('is_deleted', false);

      if (updateError) {
        console.error('[MODERAÇÃO] Erro clear chat:', updateError);
        setError('Erro ao limpar chat');
        return false;
      }

      console.log(`[MODERAÇÃO] ✅ Chat limpo para live: ${liveId}`);
      return true;

    } catch (err) {
      console.error('[MODERAÇÃO] Erro:', err);
      setError('Erro interno');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [liveId, isModerator]);

  return {
    timeoutUser,
    banUser,
    unbanUser,
    deleteMessage,
    enableGlobalSlowMode,
    disableGlobalSlowMode,
    clearChat,
    pinMessage,
    unpinMessage,
    isLoading,
    error,
  };
}

export default useChatRateLimit;
