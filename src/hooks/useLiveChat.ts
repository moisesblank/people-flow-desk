// ============================================
// 🔥 HOOK: useLiveChat v2.0 - ULTRA EDITION
// Chat em tempo real para lives - 5.000+ simultâneos
// Supabase Realtime + Rate Limiting + Moderação REAL
// Design 2300 - Futurista, Performático, Seguro
// ============================================

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useChatRateLimit, useChatModeration, type ModeratorActions } from './useChatRateLimit';
import { RealtimeChannel } from '@supabase/supabase-js';

// ============================================
// TIPOS E INTERFACES
// ============================================
export interface ChatMessage {
  id: string;
  live_id: string;
  user_id: string;
  user_name: string;
  user_avatar?: string;
  user_role: 'owner' | 'admin' | 'moderator' | 'beta' | 'viewer';
  content: string;
  created_at: string;
  is_deleted: boolean;
  is_pinned: boolean;
}

export interface ChatUser {
  id: string;
  name: string;
  avatar?: string;
  role: 'owner' | 'admin' | 'moderator' | 'beta' | 'viewer';
  isBanned: boolean;
  isTimedOut: boolean;
  timeoutUntil?: string;
}

export interface ChatSettings {
  slow_mode: boolean;
  slow_mode_interval: number;
  subscribers_only: boolean;
  chat_enabled: boolean;
}

export interface LiveChatState {
  messages: ChatMessage[];
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
  viewerCount: number;
  isSlowMode: boolean;
  slowModeInterval: number;
  pinnedMessage: ChatMessage | null;
  isBanned: boolean;
  isTimedOut: boolean;
  timeoutUntil: string | null;
  chatEnabled: boolean;
}

export interface UseLiveChatReturn {
  /** Estado do chat */
  state: LiveChatState;
  /** Enviar mensagem */
  sendMessage: (content: string) => Promise<boolean>;
  /** Rate limiter */
  rateLimit: ReturnType<typeof useChatRateLimit>;
  /** Ações de moderação (apenas para mods/admins) */
  moderation: ModeratorActions;
  /** Carregar mais mensagens (paginação) */
  loadMoreMessages: () => Promise<void>;
  /** Verificar se usuário é moderador */
  isModerator: boolean;
  /** Verificar se usuário é admin/owner */
  isAdmin: boolean;
  /** Reconectar ao chat */
  reconnect: () => void;
  /** Scroll para última mensagem */
  scrollToBottom: () => void;
  /** Verificar se há mais mensagens antigas */
  hasMoreMessages: boolean;
}

// ============================================
// CONFIGURAÇÕES
// ============================================
const MESSAGES_PER_PAGE = 50;
const MAX_MESSAGES_IN_MEMORY = 200;
const RECONNECT_DELAY = 3000;
const MAX_RECONNECT_ATTEMPTS = 5;
const BAN_CHECK_INTERVAL = 30000; // 30 segundos

// ============================================
// HOOK PRINCIPAL
// ============================================
export function useLiveChat(liveId: string): UseLiveChatReturn {
  const { user, profile } = useAuth();
  
  // Estado do chat
  const [state, setState] = useState<LiveChatState>({
    messages: [],
    isConnected: false,
    isLoading: true,
    error: null,
    viewerCount: 0,
    isSlowMode: false,
    slowModeInterval: 2000,
    pinnedMessage: null,
    isBanned: false,
    isTimedOut: false,
    timeoutUntil: null,
    chatEnabled: true,
  });

  // Referências
  const channelRef = useRef<RealtimeChannel | null>(null);
  const reconnectAttempts = useRef(0);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const banCheckTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const hasMoreRef = useRef(true);

  // Rate limiter - configurado dinamicamente com slow mode
  const rateLimit = useChatRateLimit({
    minInterval: state.isSlowMode ? state.slowModeInterval : 2000,
    maxMessages: 15,
    windowSize: 60000,
    maxChars: 500,
    slowMode: state.isSlowMode,
    isTimedOut: state.isTimedOut,
    timeoutRemaining: state.timeoutUntil 
      ? Math.max(0, new Date(state.timeoutUntil).getTime() - Date.now()) 
      : 0,
  });

  // Moderação
  const moderation = useChatModeration(liveId);

  // Verificar roles
  const userRole = useMemo(() => {
    if (!profile) return 'viewer';
    // @ts-ignore - profile pode ter role
    const role = profile.role || 'viewer';
    if (profile.email === 'moisesblank@gmail.com') return 'owner';
    return role as ChatMessage['user_role'];
  }, [profile]);

  const isModerator = useMemo(() => {
    return ['owner', 'admin', 'moderator'].includes(userRole);
  }, [userRole]);

  const isAdmin = useMemo(() => {
    return ['owner', 'admin'].includes(userRole);
  }, [userRole]);

  // ============================================
  // VERIFICAR BAN/TIMEOUT DO USUÁRIO
  // ============================================
  const checkUserBanStatus = useCallback(async () => {
    if (!user || !liveId) return;

    try {
      const { data, error } = await supabase
        .from('live_chat_bans')
        .select('*')
        .eq('live_id', liveId)
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = not found
        console.error('[CHAT] Erro ao verificar ban:', error);
        return;
      }

      if (data) {
        const now = new Date();
        
        if (data.is_ban) {
          setState(prev => ({
            ...prev,
            isBanned: true,
            isTimedOut: false,
            timeoutUntil: null,
          }));
        } else if (data.timeout_until) {
          const timeoutEnd = new Date(data.timeout_until);
          if (timeoutEnd > now) {
            setState(prev => ({
              ...prev,
              isBanned: false,
              isTimedOut: true,
              timeoutUntil: data.timeout_until,
            }));
            // Aplicar timeout no rate limiter
            rateLimit.applyTimeout(timeoutEnd.getTime() - now.getTime());
          } else {
            // Timeout expirou
            setState(prev => ({
              ...prev,
              isBanned: false,
              isTimedOut: false,
              timeoutUntil: null,
            }));
          }
        }
      } else {
        // Sem ban/timeout
        setState(prev => ({
          ...prev,
          isBanned: false,
          isTimedOut: false,
          timeoutUntil: null,
        }));
      }
    } catch (err) {
      console.error('[CHAT] Erro:', err);
    }
  }, [user, liveId, rateLimit]);

  // ============================================
  // CARREGAR CONFIGURAÇÕES DO CHAT
  // ============================================
  const loadChatSettings = useCallback(async () => {
    if (!liveId) return;

    try {
      const { data, error } = await supabase
        .from('live_chat_settings')
        .select('*')
        .eq('live_id', liveId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('[CHAT] Erro ao carregar settings:', error);
        return;
      }

      if (data) {
        setState(prev => ({
          ...prev,
          isSlowMode: data.slow_mode ?? false,
          slowModeInterval: data.slow_mode_interval ?? 2000,
          chatEnabled: data.chat_enabled ?? true,
        }));
      }
    } catch (err) {
      console.error('[CHAT] Erro:', err);
    }
  }, [liveId]);

  // ============================================
  // CARREGAR MENSAGENS INICIAIS
  // ============================================
  const loadMessages = useCallback(async (before?: string) => {
    if (!liveId) return;

    try {
      let query = supabase
        .from('live_chat_messages')
        .select('*')
        .eq('live_id', liveId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false })
        .limit(MESSAGES_PER_PAGE);

      if (before) {
        query = query.lt('created_at', before);
      }

      const { data, error } = await query;

      if (error) {
        console.error('[CHAT] Erro ao carregar mensagens:', error);
        setState(prev => ({ ...prev, error: error.message, isLoading: false }));
        return;
      }

      if (data) {
        const messages = data.reverse() as ChatMessage[];
        
        // Verificar se há mais mensagens
        hasMoreRef.current = data.length === MESSAGES_PER_PAGE;
        
        // Encontrar mensagem pinada
        const pinned = messages.find(m => m.is_pinned) || null;
        
        setState(prev => ({
          ...prev,
          messages: before 
            ? [...messages, ...prev.messages].slice(-MAX_MESSAGES_IN_MEMORY)
            : messages,
          pinnedMessage: pinned || prev.pinnedMessage,
          isLoading: false,
          error: null,
        }));
      }
    } catch (err) {
      console.error('[CHAT] Erro:', err);
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: 'Erro ao carregar mensagens' 
      }));
    }
  }, [liveId]);

  // ============================================
  // CARREGAR MAIS MENSAGENS (PAGINAÇÃO)
  // ============================================
  const loadMoreMessages = useCallback(async () => {
    if (state.messages.length === 0 || !hasMoreRef.current) return;
    const oldestMessage = state.messages[0];
    await loadMessages(oldestMessage.created_at);
  }, [state.messages, loadMessages]);

  // ============================================
  // CONECTAR AO REALTIME
  // ============================================
  const connectToRealtime = useCallback(() => {
    if (!liveId || channelRef.current) return;

    console.log('[CHAT] 📡 Conectando ao Realtime...');

    const channel = supabase
      .channel(`live-chat-${liveId}`, {
        config: {
          presence: { key: user?.id || 'anonymous' },
        },
      })
      // Novas mensagens
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'live_chat_messages',
          filter: `live_id=eq.${liveId}`,
        },
        (payload) => {
          const newMessage = payload.new as ChatMessage;
          console.log('[CHAT] 📨 Nova mensagem:', newMessage.id);
          
          setState(prev => ({
            ...prev,
            messages: [...prev.messages, newMessage].slice(-MAX_MESSAGES_IN_MEMORY),
            pinnedMessage: newMessage.is_pinned ? newMessage : prev.pinnedMessage,
          }));
        }
      )
      // Atualizações de mensagens (delete, pin)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'live_chat_messages',
          filter: `live_id=eq.${liveId}`,
        },
        (payload) => {
          const updatedMessage = payload.new as ChatMessage;
          
          setState(prev => {
            // Atualizar mensagem na lista
            const newMessages = prev.messages.map(msg =>
              msg.id === updatedMessage.id ? updatedMessage : msg
            );
            
            // Atualizar pinned message
            let newPinned = prev.pinnedMessage;
            if (updatedMessage.is_pinned) {
              newPinned = updatedMessage;
            } else if (prev.pinnedMessage?.id === updatedMessage.id) {
              newPinned = null;
            }
            
            return {
              ...prev,
              messages: newMessages,
              pinnedMessage: newPinned,
            };
          });
        }
      )
      // Atualizações de settings (slow mode)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'live_chat_settings',
          filter: `live_id=eq.${liveId}`,
        },
        (payload) => {
          const settings = payload.new as ChatSettings;
          setState(prev => ({
            ...prev,
            isSlowMode: settings.slow_mode,
            slowModeInterval: settings.slow_mode_interval,
            chatEnabled: settings.chat_enabled,
          }));
        }
      )
      // Presence (contador de viewers)
      .on('presence', { event: 'sync' }, () => {
        const presenceState = channel.presenceState();
        const viewerCount = Object.keys(presenceState).length;
        setState(prev => ({ ...prev, viewerCount }));
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log('[CHAT] 👋 Usuário entrou:', key);
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.log('[CHAT] 👋 Usuário saiu:', key);
      })
      .subscribe(async (status) => {
        console.log('[CHAT] Status:', status);
        
        if (status === 'SUBSCRIBED') {
          setState(prev => ({ ...prev, isConnected: true, error: null }));
          reconnectAttempts.current = 0;

          // Track presence
          if (user) {
            await channel.track({
              user_id: user.id,
              // @ts-ignore
              user_name: profile?.name || 'Anônimo',
              online_at: new Date().toISOString(),
            });
          }
        } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
          setState(prev => ({ ...prev, isConnected: false }));
          handleReconnect();
        }
      });

    channelRef.current = channel;
  }, [liveId, user, profile]);

  // ============================================
  // RECONECTAR
  // ============================================
  const handleReconnect = useCallback(() => {
    if (reconnectAttempts.current >= MAX_RECONNECT_ATTEMPTS) {
      console.error('[CHAT] ❌ Máximo de tentativas de reconexão atingido');
      setState(prev => ({ 
        ...prev, 
        error: 'Conexão perdida. Clique em reconectar.' 
      }));
      return;
    }

    reconnectAttempts.current++;
    console.log(`[CHAT] 🔄 Tentando reconectar... (${reconnectAttempts.current}/${MAX_RECONNECT_ATTEMPTS})`);

    reconnectTimer.current = setTimeout(() => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      connectToRealtime();
    }, RECONNECT_DELAY * reconnectAttempts.current);
  }, [connectToRealtime]);

  const reconnect = useCallback(() => {
    reconnectAttempts.current = 0;
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
    setState(prev => ({ ...prev, error: null }));
    connectToRealtime();
  }, [connectToRealtime]);

  // ============================================
  // ENVIAR MENSAGEM
  // ============================================
  const sendMessage = useCallback(async (content: string): Promise<boolean> => {
    if (!user || !profile || !liveId) {
      console.error('[CHAT] Usuário não autenticado');
      setState(prev => ({ ...prev, error: 'Faça login para enviar mensagens' }));
      return false;
    }

    // Verificar se está banido
    if (state.isBanned) {
      setState(prev => ({ ...prev, error: 'Você foi banido deste chat' }));
      return false;
    }

    // Verificar se está em timeout
    if (state.isTimedOut) {
      setState(prev => ({ ...prev, error: 'Você está em timeout' }));
      return false;
    }

    // Verificar se chat está habilitado
    if (!state.chatEnabled) {
      setState(prev => ({ ...prev, error: 'O chat está desativado' }));
      return false;
    }

    // Validar mensagem
    const validation = rateLimit.validateMessage(content);
    if (!validation.valid) {
      setState(prev => ({ ...prev, error: validation.error || 'Mensagem inválida' }));
      return false;
    }

    // Verificar rate limit
    if (!rateLimit.checkCanSend()) {
      const seconds = Math.ceil(rateLimit.state.cooldownRemaining / 1000);
      setState(prev => ({ 
        ...prev, 
        error: `Aguarde ${seconds}s para enviar outra mensagem` 
      }));
      return false;
    }

    try {
      const messageData = {
        live_id: liveId,
        user_id: user.id,
        // @ts-ignore
        user_name: profile.name || profile.full_name || profile.email?.split('@')[0] || 'Anônimo',
        // @ts-ignore
        user_avatar: profile.avatar_url || null,
        user_role: userRole,
        content: content.trim(),
        is_deleted: false,
        is_pinned: false,
      };

      const { error } = await supabase
        .from('live_chat_messages')
        .insert(messageData);

      if (error) {
        console.error('[CHAT] Erro ao enviar:', error);
        
        // Verificar se é erro de RLS (banido)
        if (error.code === '42501') {
          setState(prev => ({ ...prev, error: 'Você não tem permissão para enviar mensagens' }));
          await checkUserBanStatus();
        } else {
          setState(prev => ({ ...prev, error: 'Erro ao enviar mensagem' }));
        }
        return false;
      }

      // Registrar no rate limiter
      rateLimit.recordMessage();
      setState(prev => ({ ...prev, error: null }));
      return true;

    } catch (err) {
      console.error('[CHAT] Erro:', err);
      setState(prev => ({ ...prev, error: 'Erro ao enviar mensagem' }));
      return false;
    }
  }, [user, profile, liveId, userRole, rateLimit, state.isBanned, state.isTimedOut, state.chatEnabled, checkUserBanStatus]);

  // ============================================
  // SCROLL TO BOTTOM
  // ============================================
  const scrollToBottom = useCallback(() => {
    // Emitir evento customizado para o componente de UI
    window.dispatchEvent(new CustomEvent('chat-scroll-bottom'));
  }, []);

  // ============================================
  // EFEITOS
  // ============================================
  
  // Carregar dados iniciais
  useEffect(() => {
    if (liveId) {
      loadMessages();
      loadChatSettings();
      checkUserBanStatus();
    }
  }, [liveId, loadMessages, loadChatSettings, checkUserBanStatus]);

  // Conectar ao Realtime
  useEffect(() => {
    connectToRealtime();

    return () => {
      if (channelRef.current) {
        console.log('[CHAT] 🔌 Desconectando...');
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      if (reconnectTimer.current) {
        clearTimeout(reconnectTimer.current);
      }
    };
  }, [connectToRealtime]);

  // Verificar ban/timeout periodicamente
  useEffect(() => {
    if (user && liveId) {
      banCheckTimer.current = setInterval(checkUserBanStatus, BAN_CHECK_INTERVAL);
    }

    return () => {
      if (banCheckTimer.current) {
        clearInterval(banCheckTimer.current);
      }
    };
  }, [user, liveId, checkUserBanStatus]);

  // Atualizar slow mode no rate limiter
  useEffect(() => {
    if (state.isSlowMode) {
      rateLimit.enableSlowMode();
    } else {
      rateLimit.disableSlowMode();
    }
  }, [state.isSlowMode, rateLimit]);

  return {
    state,
    sendMessage,
    rateLimit,
    moderation,
    loadMoreMessages,
    isModerator,
    isAdmin,
    reconnect,
    scrollToBottom,
    hasMoreMessages: hasMoreRef.current,
  };
}

export default useLiveChat;
