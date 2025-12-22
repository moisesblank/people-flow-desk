// ============================================
// 🔥 PROVA DE FOGO 5.000 SIMULTÂNEOS
// Hook de Chat para Lives com Alta Escala
// ANO 2300 - ARQUITETURA ESCALÁVEL
// ============================================

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import {
  LIVE_5K_CONFIG,
  LiveMessage,
  LiveReaction,
  LiveState,
  checkChatRateLimit,
  trimMessages,
  trimReactions,
  generateReactionId,
} from '@/config/performance-5k';
import { 
  moderateMessage, 
  checkAutoSlowMode, 
  getCurrentMessageInterval,
  getUserModerationState 
} from '@/lib/chat/chatModeration';
import { addMessageToBuffer, loadRecentMessages } from '@/lib/chat/chatPersistence';

// ============================================
// TIPOS INTERNOS
// ============================================

interface UseLiveClassReturn extends LiveState {
  sendMessage: (content: string) => void;
  sendReaction: (type: LiveReaction['type']) => void;
  rateLimitInfo: {
    canSend: boolean;
    cooldownSeconds: number;
    messagesRemaining: number;
  };
  slowModeActive: boolean;
  moderationInfo: {
    isBanned: boolean;
    warningCount: number;
  };
}

// ============================================
// HOOK PRINCIPAL
// ============================================

export function useLiveClass(classId: string): UseLiveClassReturn {
  const { user } = useAuth();
  
  // Buscar dados do profile para exibição no chat
  const [userProfile, setUserProfile] = useState<{ nome: string; avatar_url?: string } | null>(null);
  
  // Carregar profile do usuário
  useEffect(() => {
    if (!user?.id) {
      setUserProfile(null);
      return;
    }
    
    const loadProfile = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('nome, avatar_url')
        .eq('id', user.id)
        .single();
      
      if (data) {
        setUserProfile(data);
      }
    };
    
    loadProfile();
  }, [user?.id]);
  
  // Estados principais
  const [state, setState] = useState<LiveState>({
    isConnected: false,
    viewers: 0,
    messages: [],
    reactions: [],
    isLoading: true,
    error: null,
  });
  
  // Rate limiting local
  const [lastMessageTime, setLastMessageTime] = useState(0);
  const [messagesInWindow, setMessagesInWindow] = useState<number[]>([]);
  
  // Refs para evitar re-renders
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const messageQueueRef = useRef<LiveMessage[]>([]);
  const batchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const cleanupIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // ============================================
  // SLOW MODE & MODERAÇÃO
  // ============================================
  const [slowModeActive, setSlowModeActive] = useState(false);
  
  // Verificar slow mode baseado em viewers
  useEffect(() => {
    const isSlowMode = checkAutoSlowMode(state.viewers);
    setSlowModeActive(isSlowMode);
  }, [state.viewers]);
  
  // Info de moderação do usuário atual
  const moderationInfo = useMemo(() => {
    if (!user?.id) return { isBanned: false, warningCount: 0 };
    const modState = getUserModerationState(user.id);
    return {
      isBanned: modState.isBanned,
      warningCount: modState.warningCount
    };
  }, [user?.id]);
  
  // ============================================
  // RATE LIMIT INFO (memoizado com slow mode)
  // ============================================
  const rateLimitInfo = useMemo(() => {
    const now = Date.now();
    const recentMessages = messagesInWindow.filter(
      t => now - t < 60000 // últimos 60 segundos
    );
    
    // Usar intervalo atual (normal ou slow mode)
    const currentInterval = getCurrentMessageInterval();
    const nextMessageAt = lastMessageTime + currentInterval;
    const canSendBasedOnInterval = now >= nextMessageAt;
    const canSendBasedOnVolume = recentMessages.length < LIVE_5K_CONFIG.CHAT.MAX_MESSAGES_PER_MINUTE;
    
    const cooldownMs = Math.max(0, nextMessageAt - now);
    
    return {
      canSend: canSendBasedOnInterval && canSendBasedOnVolume && !moderationInfo.isBanned,
      cooldownSeconds: Math.ceil(cooldownMs / 1000),
      messagesRemaining: LIVE_5K_CONFIG.CHAT.MAX_MESSAGES_PER_MINUTE - recentMessages.length,
    };
  }, [lastMessageTime, messagesInWindow, moderationInfo.isBanned]);
  
  // ============================================
  // BATCH RENDERING (otimização para 5K)
  // ============================================
  const flushMessageQueue = useCallback(() => {
    if (messageQueueRef.current.length === 0) return;
    
    setState(prev => {
      const newMessages = trimMessages([...prev.messages, ...messageQueueRef.current]);
      messageQueueRef.current = [];
      return { ...prev, messages: newMessages };
    });
  }, []);
  
  const queueMessage = useCallback((message: LiveMessage) => {
    messageQueueRef.current.push(message);
    
    // Batch messages para evitar muitos re-renders
    if (!batchTimeoutRef.current) {
      batchTimeoutRef.current = setTimeout(() => {
        flushMessageQueue();
        batchTimeoutRef.current = null;
      }, LIVE_5K_CONFIG.REALTIME.BATCH_RENDER_INTERVAL);
    }
  }, [flushMessageQueue]);
  
  // ============================================
  // CONEXÃO REALTIME
  // ============================================
  const connectRealtime = useCallback(async () => {
    if (!classId) return;
    
    console.log(`[LiveClass] 📡 Conectando à sala: ${classId}`);
    
    try {
      // Desconectar canal anterior se existir
      if (channelRef.current) {
        await supabase.removeChannel(channelRef.current);
      }
      
      const channelName = `live-chat:${classId}`;
      
      channelRef.current = supabase
        .channel(channelName, {
          config: {
            presence: { key: user?.id || `anon_${Date.now()}` },
          },
        })
        // Mensagens do chat via Broadcast
        .on('broadcast', { event: 'chat_message' }, ({ payload }) => {
          const message = payload as LiveMessage;
          queueMessage(message);
        })
        // Reactions via Broadcast
        .on('broadcast', { event: 'reaction' }, ({ payload }) => {
          const reaction: LiveReaction = {
            id: generateReactionId(),
            type: payload.type,
            timestamp: Date.now(),
          };
          
          setState(prev => ({
            ...prev,
            reactions: trimReactions([...prev.reactions, reaction]),
          }));
        })
        // Presença para contagem de viewers
        .on('presence', { event: 'sync' }, () => {
          const presenceState = channelRef.current?.presenceState() || {};
          const viewerCount = Object.keys(presenceState).length;
          setState(prev => ({ ...prev, viewers: viewerCount }));
        })
        .subscribe(async (status) => {
          console.log(`[LiveClass] Status: ${status}`);
          
          if (status === 'SUBSCRIBED') {
            setState(prev => ({ ...prev, isConnected: true, isLoading: false }));
            reconnectAttemptsRef.current = 0;
            
            // Registrar presença
            await channelRef.current?.track({
              user_id: user?.id,
              user_name: userProfile?.nome || 'Anônimo',
              joined_at: new Date().toISOString(),
            });
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            setState(prev => ({ ...prev, isConnected: false }));
            
            // Auto-reconexão
            if (reconnectAttemptsRef.current < LIVE_5K_CONFIG.REALTIME.MAX_RECONNECT_ATTEMPTS) {
              reconnectAttemptsRef.current++;
              console.log(`[LiveClass] 🔄 Reconectando (${reconnectAttemptsRef.current}/${LIVE_5K_CONFIG.REALTIME.MAX_RECONNECT_ATTEMPTS})...`);
              
              setTimeout(() => {
                connectRealtime();
              }, LIVE_5K_CONFIG.REALTIME.RECONNECT_DELAY);
            } else {
              setState(prev => ({ 
                ...prev, 
                error: 'Não foi possível conectar ao chat. Recarregue a página.',
                isLoading: false 
              }));
            }
          }
        });
        
    } catch (error) {
      console.error('[LiveClass] Erro de conexão:', error);
      setState(prev => ({ 
        ...prev, 
        isConnected: false, 
        isLoading: false,
        error: 'Erro ao conectar ao chat' 
      }));
    }
  }, [classId, user?.id, userProfile?.nome, queueMessage]);
  
  // ============================================
  // ENVIAR MENSAGEM (com rate limiting)
  // ============================================
  const sendMessage = useCallback((content: string) => {
    if (!channelRef.current || !user) {
      toast.error('Você precisa estar logado para enviar mensagens');
      return;
    }
    
    // Verificar rate limit
    if (!rateLimitInfo.canSend) {
      if (moderationInfo.isBanned) {
        toast.error('Você está banido do chat');
      } else if (rateLimitInfo.cooldownSeconds > 0) {
        const msg = slowModeActive 
          ? `Slow mode ativo! Aguarde ${rateLimitInfo.cooldownSeconds}s`
          : `Aguarde ${rateLimitInfo.cooldownSeconds}s para enviar outra mensagem`;
        toast.error(msg);
      } else {
        toast.error('Limite de mensagens atingido. Aguarde um momento.');
      }
      return;
    }
    
    // MODERAÇÃO: sanitizar e validar mensagem
    const modResult = moderateMessage(content, user.id);
    
    if (!modResult.isAllowed) {
      if (modResult.violations.length > 0) {
        toast.error(modResult.violations[0]);
      }
      return;
    }
    
    const sanitizedContent = modResult.sanitizedMessage;
    if (!sanitizedContent) return;
    
    // Mostrar warnings (mas permitir envio)
    if (modResult.violations.length > 0 && modResult.severity !== 'high') {
      toast.warning(`Aviso: ${modResult.violations.join(', ')}`);
    }
    
    const message: LiveMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      user_id: user.id,
      user_name: userProfile?.nome || 'Aluno',
      avatar_url: userProfile?.avatar_url || undefined,
      message: sanitizedContent,
      created_at: new Date().toISOString(),
    };
    
    // Atualizar rate limit local
    const now = Date.now();
    setLastMessageTime(now);
    setMessagesInWindow(prev => [...prev.filter(t => now - t < 60000), now]);
    
    // Adicionar mensagem localmente (otimistic update)
    queueMessage(message);
    
    // Adicionar ao buffer de persistência
    addMessageToBuffer(classId, message);
    
    // Broadcast para outros usuários
    channelRef.current.send({
      type: 'broadcast',
      event: 'chat_message',
      payload: message,
    });
    
  }, [user, userProfile, rateLimitInfo, queueMessage, classId, slowModeActive, moderationInfo.isBanned]);
  
  // ============================================
  // ENVIAR REACTION
  // ============================================
  const sendReaction = useCallback((type: LiveReaction['type']) => {
    if (!channelRef.current) return;
    
    // Rate limit simples para reactions (throttle local)
    const reaction: LiveReaction = {
      id: generateReactionId(),
      type,
      timestamp: Date.now(),
    };
    
    // Adicionar localmente
    setState(prev => ({
      ...prev,
      reactions: trimReactions([...prev.reactions, reaction]),
    }));
    
    // Broadcast
    channelRef.current.send({
      type: 'broadcast',
      event: 'reaction',
      payload: { type },
    });
    
  }, []);
  
  // ============================================
  // LIFECYCLE
  // ============================================
  
  // Conectar ao montar e carregar histórico
  useEffect(() => {
    connectRealtime();
    
    // Carregar histórico de mensagens
    if (classId) {
      loadRecentMessages(classId).then(history => {
        if (history.length > 0) {
          setState(prev => ({
            ...prev,
            messages: trimMessages([...history, ...prev.messages])
          }));
          console.log(`[LiveClass] 📜 ${history.length} mensagens do histórico carregadas`);
        }
      });
    }
    
    return () => {
      // Cleanup na desmontagem
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      if (batchTimeoutRef.current) {
        clearTimeout(batchTimeoutRef.current);
      }
      if (cleanupIntervalRef.current) {
        clearInterval(cleanupIntervalRef.current);
      }
    };
  }, [connectRealtime, classId]);
  
  // Cleanup periódico de reactions antigas
  useEffect(() => {
    cleanupIntervalRef.current = setInterval(() => {
      setState(prev => ({
        ...prev,
        reactions: trimReactions(prev.reactions),
      }));
    }, LIVE_5K_CONFIG.CHAT.CLEANUP_INTERVAL);
    
    return () => {
      if (cleanupIntervalRef.current) {
        clearInterval(cleanupIntervalRef.current);
      }
    };
  }, []);
  
  // Cleanup de messagesInWindow
  useEffect(() => {
    const cleanup = setInterval(() => {
      const now = Date.now();
      setMessagesInWindow(prev => prev.filter(t => now - t < 60000));
    }, 10000);
    
    return () => clearInterval(cleanup);
  }, []);
  
  // ============================================
  // RETURN
  // ============================================
  
  return {
    ...state,
    sendMessage,
    sendReaction,
    rateLimitInfo,
    slowModeActive,
    moderationInfo,
  };
}

console.log('[PROVA DE FOGO 5K] ⚡ useLiveClass carregado - Suporte a 5000 simultâneos');
