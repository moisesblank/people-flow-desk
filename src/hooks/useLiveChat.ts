// ============================================
// 🔥 HOOK: useLiveChat
// Chat em tempo real para lives - 5.000 simultâneos
// Supabase Realtime + Rate Limiting + Moderação
// Design 2300 - Futurista e Performático
// ============================================

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useChatRateLimit, useChatModeration } from './useChatRateLimit';
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

export interface LiveChatState {
  messages: ChatMessage[];
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
  viewerCount: number;
  isSlowMode: boolean;
  pinnedMessage: ChatMessage | null;
}

export interface UseLiveChatReturn {
  /** Estado do chat */
  state: LiveChatState;
  /** Enviar mensagem */
  sendMessage: (content: string) => Promise<boolean>;
  /** Rate limiter */
  rateLimit: ReturnType<typeof useChatRateLimit>;
  /** Ações de moderação (apenas para mods/admins) */
  moderation: ReturnType<typeof useChatModeration>;
  /** Carregar mais mensagens (paginação) */
  loadMoreMessages: () => Promise<void>;
  /** Verificar se usuário é moderador */
  isModerator: boolean;
  /** Verificar se usuário é admin/owner */
  isAdmin: boolean;
  /** Reconectar ao chat */
  reconnect: () => void;
}

// ============================================
// CONFIGURAÇÕES
// ============================================
const MESSAGES_PER_PAGE = 50;
const MAX_MESSAGES_IN_MEMORY = 200;
const RECONNECT_DELAY = 3000;
const MAX_RECONNECT_ATTEMPTS = 5;

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
    pinnedMessage: null,
  });

  // Referências
  const channelRef = useRef<RealtimeChannel | null>(null);
  const reconnectAttempts = useRef(0);
  const reconnectTimer = useRef<NodeJS.Timeout | null>(null);

  // Rate limiter
  const rateLimit = useChatRateLimit({
    minInterval: 2000,  // 2 segundos
    maxMessages: 10,    // 10 por minuto
    windowSize: 60000,  // 1 minuto
    maxChars: 280,      // 280 caracteres
    slowMode: state.isSlowMode,
    isTimedOut: false,
    timeoutRemaining: 0,
  });

  // Moderação
  const moderation = useChatModeration(liveId);

  // Verificar roles
  const userRole = useMemo(() => {
    if (!profile) return 'viewer';
    // @ts-ignore - profile pode ter role
    const role = profile.role || 'viewer';
    return role as ChatMessage['user_role'];
  }, [profile]);

  const isModerator = useMemo(() => {
    return ['owner', 'admin', 'moderator'].includes(userRole);
  }, [userRole]);

  const isAdmin = useMemo(() => {
    return ['owner', 'admin'].includes(userRole);
  }, [userRole]);

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
        setState(prev => ({ ...prev, error: error.message }));
        return;
      }

      if (data) {
        const messages = data.reverse() as ChatMessage[];
        setState(prev => ({
          ...prev,
          messages: before 
            ? [...messages, ...prev.messages].slice(-MAX_MESSAGES_IN_MEMORY)
            : messages,
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
    if (state.messages.length === 0) return;
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
      .channel(`live-chat-${liveId}`)
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
          }));
        }
      )
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
          
          setState(prev => ({
            ...prev,
            messages: prev.messages.map(msg =>
              msg.id === updatedMessage.id ? updatedMessage : msg
            ),
            pinnedMessage: updatedMessage.is_pinned ? updatedMessage : prev.pinnedMessage,
          }));
        }
      )
      .on('presence', { event: 'sync' }, () => {
        const presenceState = channel.presenceState();
        const viewerCount = Object.keys(presenceState).length;
        setState(prev => ({ ...prev, viewerCount }));
      })
      .subscribe(async (status) => {
        console.log('[CHAT] Status:', status);
        
        if (status === 'SUBSCRIBED') {
          setState(prev => ({ ...prev, isConnected: true, error: null }));
          reconnectAttempts.current = 0;

          // Track presence
          await channel.track({
            user_id: user?.id,
            online_at: new Date().toISOString(),
          });
        } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
          setState(prev => ({ ...prev, isConnected: false }));
          handleReconnect();
        }
      });

    channelRef.current = channel;
  }, [liveId, user?.id]);

  // ============================================
  // RECONECTAR
  // ============================================
  const handleReconnect = useCallback(() => {
    if (reconnectAttempts.current >= MAX_RECONNECT_ATTEMPTS) {
      console.error('[CHAT] ❌ Máximo de tentativas de reconexão atingido');
      setState(prev => ({ 
        ...prev, 
        error: 'Conexão perdida. Recarregue a página.' 
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
    connectToRealtime();
  }, [connectToRealtime]);

  // ============================================
  // ENVIAR MENSAGEM
  // ============================================
  const sendMessage = useCallback(async (content: string): Promise<boolean> => {
    if (!user || !profile || !liveId) {
      console.error('[CHAT] Usuário não autenticado');
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
      setState(prev => ({ 
        ...prev, 
        error: `Aguarde ${Math.ceil(rateLimit.state.cooldownRemaining / 1000)}s para enviar outra mensagem` 
      }));
      return false;
    }

    try {
      const messageData = {
        live_id: liveId,
        user_id: user.id,
        // @ts-ignore
        user_name: profile.name || profile.email || 'Anônimo',
        // @ts-ignore
        user_avatar: profile.avatar_url,
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
        setState(prev => ({ ...prev, error: 'Erro ao enviar mensagem' }));
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
  }, [user, profile, liveId, userRole, rateLimit]);

  // ============================================
  // EFEITOS
  // ============================================
  
  // Carregar mensagens iniciais
  useEffect(() => {
    if (liveId) {
      loadMessages();
    }
  }, [liveId, loadMessages]);

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
  };
}

export default useLiveChat;
