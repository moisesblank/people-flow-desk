// ============================================
// MASTER PRO ULTRA v3.0 - LIVE CLASS HOOK
// WebSocket para 5.000+ conexões simultâneas
// ============================================

import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';
import { chatRateLimiter, reactionRateLimiter } from '@/lib/rateLimiter';
import { sanitizeText } from '@/lib/sanitize';
import { toast } from 'sonner';

interface ChatMessage {
  id: string;
  user_id: string;
  user_name: string;
  message: string;
  created_at: string;
  avatar_url?: string;
}

interface Reaction {
  id: string;
  user_id: string;
  type: 'heart' | 'like' | 'laugh' | 'fire' | 'clap';
  timestamp: number;
}

interface LiveClassState {
  viewers: number;
  messages: ChatMessage[];
  reactions: Reaction[];
  isConnected: boolean;
  isLoading: boolean;
}

export function useLiveClass(classId: string) {
  const [state, setState] = useState<LiveClassState>({
    viewers: 0,
    messages: [],
    reactions: [],
    isConnected: false,
    isLoading: true
  });

  const channelRef = useRef<RealtimeChannel | null>(null);
  const userRef = useRef<{ id: string; name: string; avatar?: string } | null>(null);

  useEffect(() => {
    if (!classId) return;

    const setupChannel = async () => {
      // Obter usuário atual
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setState(prev => ({ ...prev, isLoading: false }));
        return;
      }

      // Obter perfil
      const { data: profile } = await supabase
        .from('profiles')
        .select('nome, avatar_url')
        .eq('id', user.id)
        .single();

      userRef.current = {
        id: user.id,
        name: profile?.nome || user.email?.split('@')[0] || 'Anônimo',
        avatar: profile?.avatar_url
      };

      // Criar canal para a aula
      const channel = supabase.channel(`live-class:${classId}`, {
        config: {
          presence: { key: user.id },
          broadcast: { self: true }
        }
      });

      // Presence (contagem de espectadores)
      channel.on('presence', { event: 'sync' }, () => {
        const presenceState = channel.presenceState();
        const viewerCount = Object.keys(presenceState).length;
        setState(prev => ({ ...prev, viewers: viewerCount }));
      });

      // Mensagens do chat
      channel.on('broadcast', { event: 'chat-message' }, ({ payload }) => {
        setState(prev => ({
          ...prev,
          messages: [...prev.messages.slice(-99), payload as ChatMessage] // Manter últimas 100
        }));
      });

      // Reações
      channel.on('broadcast', { event: 'reaction' }, ({ payload }) => {
        const reaction = payload as Reaction;
        setState(prev => ({
          ...prev,
          reactions: [...prev.reactions.slice(-49), reaction] // Manter últimas 50
        }));

        // Remover reação após 3 segundos
        setTimeout(() => {
          setState(prev => ({
            ...prev,
            reactions: prev.reactions.filter(r => r.id !== reaction.id)
          }));
        }, 3000);
      });

      // Conectar
      channel.subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            user_id: user.id,
            user_name: userRef.current?.name,
            online_at: new Date().toISOString()
          });

          setState(prev => ({ ...prev, isConnected: true, isLoading: false }));
        }
      });

      channelRef.current = channel;
    };

    setupChannel();

    // Cleanup
    return () => {
      if (channelRef.current) {
        channelRef.current.unsubscribe();
        channelRef.current = null;
      }
    };
  }, [classId]);

  // Enviar mensagem
  const sendMessage = useCallback(async (message: string) => {
    if (!channelRef.current || !userRef.current) return;

    const sanitized = sanitizeText(message);
    if (!sanitized) return;

    // Rate limiting
    if (!chatRateLimiter.canMakeRequest(userRef.current.id)) {
      toast.error('Muitas mensagens! Aguarde um momento.');
      return;
    }

    await channelRef.current.send({
      type: 'broadcast',
      event: 'chat-message',
      payload: {
        id: crypto.randomUUID(),
        user_id: userRef.current.id,
        user_name: userRef.current.name,
        avatar_url: userRef.current.avatar,
        message: sanitized,
        created_at: new Date().toISOString()
      } as ChatMessage
    });
  }, []);

  // Enviar reação
  const sendReaction = useCallback(async (type: Reaction['type']) => {
    if (!channelRef.current || !userRef.current) return;

    // Rate limiting
    if (!reactionRateLimiter.canMakeRequest(userRef.current.id)) {
      return; // Silencioso para reações
    }

    await channelRef.current.send({
      type: 'broadcast',
      event: 'reaction',
      payload: {
        id: crypto.randomUUID(),
        user_id: userRef.current.id,
        type,
        timestamp: Date.now()
      } as Reaction
    });
  }, []);

  return {
    ...state,
    sendMessage,
    sendReaction,
    currentUser: userRef.current
  };
}
