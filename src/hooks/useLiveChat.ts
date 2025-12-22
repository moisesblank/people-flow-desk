// ============================================
// MASTER PRO ULTRA v3.0 - LIVE CHAT HOOK
// Hook completo para chat de lives com Realtime
// ============================================

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { chatRateLimiter } from '@/lib/chat/chatRateLimiter';
import { moderateMessage } from '@/lib/chat/chatModeration';
import { addMessageToBuffer, loadRecentMessages, flushBuffer } from '@/lib/chat/chatPersistence';
import { RealtimeChannel } from '@supabase/supabase-js';
import type { LiveMessage } from '@/config/performance-5k';

export interface ChatMessage {
  id: string;
  liveId: string;
  userId: string;
  userName: string;
  avatarUrl?: string;
  message: string;
  isHighlighted: boolean;
  isModerator: boolean;
  createdAt: string;
}

export interface LiveChatState {
  messages: ChatMessage[];
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
  viewerCount: number;
  isSending: boolean;
  cooldownSeconds: number;
}

interface UseLiveChatOptions {
  liveId: string;
  maxMessages?: number;
  autoScroll?: boolean;
}

// Helper para converter LiveMessage para ChatMessage
function liveMessageToChatMessage(m: LiveMessage, liveId: string): ChatMessage {
  return {
    id: m.id,
    liveId: liveId,
    userId: m.user_id,
    userName: m.user_name,
    avatarUrl: m.avatar_url,
    message: m.message,
    isHighlighted: m.is_highlighted || false,
    isModerator: m.is_moderator || false,
    createdAt: m.created_at,
  };
}

export function useLiveChat({ liveId, maxMessages = 100 }: UseLiveChatOptions) {
  const [state, setState] = useState<LiveChatState>({
    messages: [],
    isConnected: false,
    isLoading: true,
    error: null,
    viewerCount: 0,
    isSending: false,
    cooldownSeconds: 0,
  });

  const channelRef = useRef<RealtimeChannel | null>(null);
  const currentUserRef = useRef<{ id: string; name: string; avatar?: string } | null>(null);
  const cooldownIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Carregar usuário atual
  useEffect(() => {
    const loadUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('nome, avatar_url')
          .eq('id', user.id)
          .single();

        currentUserRef.current = {
          id: user.id,
          name: profile?.nome || 'Usuário',
          avatar: profile?.avatar_url || undefined,
        };
      }
    };
    loadUser();
  }, []);

  // Carregar mensagens iniciais
  useEffect(() => {
    const loadMessages = async () => {
      setState(prev => ({ ...prev, isLoading: true }));
      
      try {
        const messages = await loadRecentMessages(liveId, maxMessages);
        setState(prev => ({
          ...prev,
          messages: messages.map(m => liveMessageToChatMessage(m, liveId)),
          isLoading: false,
        }));
      } catch (error) {
        setState(prev => ({
          ...prev,
          error: 'Erro ao carregar mensagens',
          isLoading: false,
        }));
      }
    };

    loadMessages();
  }, [liveId, maxMessages]);

  // Configurar Realtime
  useEffect(() => {
    const channel = supabase.channel(`live-chat:${liveId}`, {
      config: {
        presence: { key: currentUserRef.current?.id || 'anonymous' },
        broadcast: { self: true },
      },
    });

    // Escutar novas mensagens via broadcast
    channel.on('broadcast', { event: 'new-message' }, ({ payload }) => {
      const newMessage = payload as ChatMessage;
      setState(prev => {
        const updated = [...prev.messages, newMessage];
        if (updated.length > maxMessages) {
          return { ...prev, messages: updated.slice(-maxMessages) };
        }
        return { ...prev, messages: updated };
      });
    });

    // Escutar presence para contar viewers
    channel.on('presence', { event: 'sync' }, () => {
      const presenceState = channel.presenceState();
      const count = Object.keys(presenceState).length;
      setState(prev => ({ ...prev, viewerCount: count }));
    });

    // Escutar mudanças no banco (backup)
    channel.on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'live_chat_messages',
        filter: `live_id=eq.${liveId}`,
      },
      (payload) => {
        const newMessage: ChatMessage = {
          id: payload.new.id,
          liveId: payload.new.live_id,
          userId: payload.new.user_id,
          userName: payload.new.user_name,
          avatarUrl: payload.new.avatar_url,
          message: payload.new.message,
          isHighlighted: payload.new.is_highlighted || false,
          isModerator: payload.new.is_moderator || false,
          createdAt: payload.new.created_at,
        };

        setState(prev => {
          if (prev.messages.some(m => m.id === newMessage.id)) {
            return prev;
          }
          const updated = [...prev.messages, newMessage];
          if (updated.length > maxMessages) {
            return { ...prev, messages: updated.slice(-maxMessages) };
          }
          return { ...prev, messages: updated };
        });
      }
    );

    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        setState(prev => ({ ...prev, isConnected: true, error: null }));
        await channel.track({
          online_at: new Date().toISOString(),
          user_name: currentUserRef.current?.name,
        });
      } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
        setState(prev => ({ ...prev, isConnected: false }));
      }
    });

    channelRef.current = channel;

    return () => {
      flushBuffer(liveId);
      supabase.removeChannel(channel);
    };
  }, [liveId, maxMessages]);

  // Atualizar cooldown
  useEffect(() => {
    const userId = currentUserRef.current?.id || 'anonymous';
    
    cooldownIntervalRef.current = setInterval(() => {
      const seconds = chatRateLimiter.getRemainingCooldown(userId, liveId);
      setState(prev => {
        if (prev.cooldownSeconds !== seconds) {
          return { ...prev, cooldownSeconds: seconds };
        }
        return prev;
      });
    }, 500);

    return () => {
      if (cooldownIntervalRef.current) {
        clearInterval(cooldownIntervalRef.current);
      }
    };
  }, [liveId]);

  // Enviar mensagem
  const sendMessage = useCallback(async (text: string): Promise<boolean> => {
    if (!currentUserRef.current) {
      setState(prev => ({ ...prev, error: 'Você precisa estar logado para enviar mensagens' }));
      return false;
    }

    const userId = currentUserRef.current.id;

    // Verificar rate limit
    const canSend = chatRateLimiter.canSendMessage(userId, liveId);
    if (!canSend.allowed) {
      setState(prev => ({ ...prev, error: canSend.reason || 'Aguarde para enviar' }));
      return false;
    }

    // Moderar mensagem
    const moderation = moderateMessage(text, userId);
    if (!moderation.isAllowed) {
      setState(prev => ({ ...prev, error: moderation.violations.join(', ') || 'Mensagem bloqueada' }));
      return false;
    }

    setState(prev => ({ ...prev, isSending: true, error: null }));

    try {
      const messageId = crypto.randomUUID();
      const now = new Date().toISOString();

      const message: ChatMessage = {
        id: messageId,
        liveId,
        userId: currentUserRef.current.id,
        userName: currentUserRef.current.name,
        avatarUrl: currentUserRef.current.avatar,
        message: moderation.sanitizedMessage,
        isHighlighted: false,
        isModerator: false,
        createdAt: now,
      };

      // Broadcast para todos os clientes
      await channelRef.current?.send({
        type: 'broadcast',
        event: 'new-message',
        payload: message,
      });

      // Adicionar ao buffer de persistência (formato LiveMessage)
      const liveMessage: LiveMessage = {
        id: messageId,
        user_id: currentUserRef.current.id,
        user_name: currentUserRef.current.name,
        avatar_url: currentUserRef.current.avatar,
        message: moderation.sanitizedMessage,
        is_highlighted: false,
        is_moderator: false,
        created_at: now,
      };
      addMessageToBuffer(liveId, liveMessage);

      // Registrar no rate limiter
      chatRateLimiter.recordMessage(userId, liveId);

      setState(prev => ({ ...prev, isSending: false }));
      return true;
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        isSending: false, 
        error: 'Erro ao enviar mensagem' 
      }));
      return false;
    }
  }, [liveId]);

  // Destacar mensagem (moderadores)
  const highlightMessage = useCallback(async (messageId: string) => {
    await supabase
      .from('live_chat_messages')
      .update({ is_highlighted: true })
      .eq('id', messageId);
  }, []);

  // Deletar mensagem (moderadores)
  const deleteMessage = useCallback(async (messageId: string) => {
    await supabase
      .from('live_chat_messages')
      .delete()
      .eq('id', messageId);

    setState(prev => ({
      ...prev,
      messages: prev.messages.filter(m => m.id !== messageId),
    }));
  }, []);

  return {
    ...state,
    sendMessage,
    highlightMessage,
    deleteMessage,
    currentUser: currentUserRef.current,
  };
}
