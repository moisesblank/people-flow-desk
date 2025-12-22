// ============================================
// MASTER PRO ULTRA v3.0 - LIVE CHAT HOOK
// Hook completo para chat de lives com Realtime
// Integra: useAuth, useChatRateLimit, useChatModeration
// ============================================

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';
import { useAuth } from '@/hooks/useAuth';
import { useChatRateLimit } from '@/hooks/useChatRateLimit';
import { useChatModeration } from '@/hooks/useChatModeration';
import { moderateMessage } from '@/lib/chat/chatModeration';

// ============================================
// INTERFACES
// ============================================

export interface ChatMessage {
  id: string;
  liveId: string;
  userId: string;
  userName: string;
  avatarUrl?: string;
  message: string;
  isHighlighted: boolean;
  isModerator: boolean;
  isPinned?: boolean;
  isDeleted?: boolean;
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
  isSlowMode: boolean;
  isChatEnabled: boolean;
  isBanned: boolean;
  isTimedOut: boolean;
  pinnedMessage: ChatMessage | null;
}

interface UseLiveChatOptions {
  liveId: string;
  maxMessages?: number;
  autoScroll?: boolean;
}

interface ChatSettings {
  slow_mode: boolean;
  slow_mode_interval: number;
  chat_enabled: boolean;
}

// ============================================
// CONSTANTES
// ============================================

const MESSAGES_PER_PAGE = 50;
const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_DELAY = 2000;
const BAN_CHECK_INTERVAL = 30000;

// ============================================
// HOOK PRINCIPAL
// ============================================

export function useLiveChat({ liveId, maxMessages = 100 }: UseLiveChatOptions) {
  // ============================================
  // HOOKS INTEGRADOS
  // ============================================
  
  const { user, role } = useAuth();
  const rateLimit = useChatRateLimit();
  const moderation = useChatModeration(liveId);

  // ============================================
  // ROLES
  // ============================================

  const isModerator = useMemo(() => {
    if (!role) return false;
    return ['owner', 'admin', 'moderator'].includes(role);
  }, [role]);

  const isAdmin = useMemo(() => {
    if (!role) return false;
    return ['owner', 'admin'].includes(role);
  }, [role]);

  // ============================================
  // ESTADO
  // ============================================

  const [state, setState] = useState<LiveChatState>({
    messages: [],
    isConnected: false,
    isLoading: true,
    error: null,
    viewerCount: 0,
    isSending: false,
    cooldownSeconds: 0,
    isSlowMode: false,
    isChatEnabled: true,
    isBanned: false,
    isTimedOut: false,
    pinnedMessage: null,
  });

  // ============================================
  // REFS
  // ============================================

  const channelRef = useRef<RealtimeChannel | null>(null);
  const reconnectTimer = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);
  const banCheckTimer = useRef<NodeJS.Timeout | null>(null);
  const hasMoreRef = useRef(true);
  const oldestMessageRef = useRef<string | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  const profileRef = useRef<{ nome: string; avatar_url?: string } | null>(null);

  // ============================================
  // CARREGAR PERFIL DO USUÁRIO
  // ============================================

  useEffect(() => {
    const loadProfile = async () => {
      if (!user) {
        profileRef.current = null;
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('nome, avatar_url')
        .eq('id', user.id)
        .single();

      profileRef.current = profile;
    };

    loadProfile();
  }, [user]);

  // ============================================
  // CARREGAR CONFIGURAÇÕES DO CHAT
  // ============================================

  const loadChatSettings = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('live_chat_settings')
        .select('slow_mode, slow_mode_interval, chat_enabled')
        .eq('live_id', liveId)
        .maybeSingle();

      if (error) {
        console.error('[CHAT] Erro ao carregar settings:', error);
        return;
      }

      if (data) {
        const settings = data as ChatSettings;
        setState(prev => ({
          ...prev,
          isSlowMode: settings.slow_mode || false,
          isChatEnabled: settings.chat_enabled !== false,
        }));

        // Sincronizar slow mode com rate limiter
        if (settings.slow_mode) {
          rateLimit.enableSlowMode(settings.slow_mode_interval || 5000);
        } else {
          rateLimit.disableSlowMode();
        }
      }
    } catch (err) {
      console.error('[CHAT] Erro settings:', err);
    }
  }, [liveId, rateLimit]);

  // ============================================
  // VERIFICAR BAN/TIMEOUT DO USUÁRIO
  // ============================================

  const checkUserBanStatus = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('live_chat_bans')
        .select('is_ban, timeout_until')
        .eq('live_id', liveId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('[CHAT] Erro ao verificar ban:', error);
        return;
      }

      if (data) {
        const now = new Date();
        const timeoutUntil = data.timeout_until ? new Date(data.timeout_until) : null;

        setState(prev => ({
          ...prev,
          isBanned: data.is_ban || false,
          isTimedOut: timeoutUntil ? timeoutUntil > now : false,
        }));

        // Aplicar timeout no rate limiter
        if (timeoutUntil && timeoutUntil > now) {
          const remainingMs = timeoutUntil.getTime() - now.getTime();
          rateLimit.applyTimeout(remainingMs);
        }
      } else {
        setState(prev => ({
          ...prev,
          isBanned: false,
          isTimedOut: false,
        }));
      }
    } catch (err) {
      console.error('[CHAT] Erro ban check:', err);
    }
  }, [user, liveId, rateLimit]);

  // ============================================
  // CARREGAR MENSAGENS INICIAIS
  // ============================================

  const loadInitialMessages = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true }));

    try {
      const { data, error } = await supabase
        .from('live_chat_messages')
        .select('*')
        .eq('live_id', liveId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false })
        .limit(MESSAGES_PER_PAGE);

      if (error) throw error;

      const messages: ChatMessage[] = (data || []).reverse().map(m => ({
        id: m.id,
        liveId: m.live_id,
        userId: m.user_id,
        userName: m.user_name,
        avatarUrl: m.avatar_url,
        message: m.message,
        isHighlighted: m.is_highlighted || false,
        isModerator: m.is_moderator || false,
        isPinned: m.is_pinned || false,
        isDeleted: m.is_deleted || false,
        createdAt: m.created_at,
      }));

      // Buscar mensagem pinada
      const pinnedMessage = messages.find(m => m.isPinned) || null;

      if (messages.length > 0) {
        oldestMessageRef.current = messages[0].createdAt;
      }

      hasMoreRef.current = (data?.length || 0) >= MESSAGES_PER_PAGE;

      setState(prev => ({
        ...prev,
        messages,
        pinnedMessage,
        isLoading: false,
        error: null,
      }));
    } catch (error) {
      console.error('[CHAT] Erro ao carregar mensagens:', error);
      setState(prev => ({
        ...prev,
        error: 'Erro ao carregar mensagens',
        isLoading: false,
      }));
    }
  }, [liveId]);

  // ============================================
  // CARREGAR MAIS MENSAGENS (PAGINAÇÃO)
  // ============================================

  const loadMoreMessages = useCallback(async () => {
    if (!hasMoreRef.current || !oldestMessageRef.current) return;

    try {
      const { data, error } = await supabase
        .from('live_chat_messages')
        .select('*')
        .eq('live_id', liveId)
        .eq('is_deleted', false)
        .lt('created_at', oldestMessageRef.current)
        .order('created_at', { ascending: false })
        .limit(MESSAGES_PER_PAGE);

      if (error) throw error;

      const olderMessages: ChatMessage[] = (data || []).reverse().map(m => ({
        id: m.id,
        liveId: m.live_id,
        userId: m.user_id,
        userName: m.user_name,
        avatarUrl: m.avatar_url,
        message: m.message,
        isHighlighted: m.is_highlighted || false,
        isModerator: m.is_moderator || false,
        isPinned: m.is_pinned || false,
        isDeleted: m.is_deleted || false,
        createdAt: m.created_at,
      }));

      if (olderMessages.length > 0) {
        oldestMessageRef.current = olderMessages[0].createdAt;
      }

      hasMoreRef.current = (data?.length || 0) >= MESSAGES_PER_PAGE;

      setState(prev => ({
        ...prev,
        messages: [...olderMessages, ...prev.messages],
      }));
    } catch (error) {
      console.error('[CHAT] Erro ao carregar mais mensagens:', error);
    }
  }, [liveId]);

  // ============================================
  // CONECTAR AO REALTIME
  // ============================================

  const connectToRealtime = useCallback(async () => {
    if (channelRef.current) {
      await supabase.removeChannel(channelRef.current);
    }

    const channel = supabase.channel(`live-chat:${liveId}`, {
      config: {
        presence: { key: user?.id || 'anonymous' },
        broadcast: { self: true },
      },
    });

    // Escutar novas mensagens via broadcast
    channel.on('broadcast', { event: 'new-message' }, ({ payload }) => {
      const newMessage = payload as ChatMessage;
      
      setState(prev => {
        // Evitar duplicatas
        if (prev.messages.some(m => m.id === newMessage.id)) {
          return prev;
        }
        
        const updated = [...prev.messages, newMessage];
        if (updated.length > maxMessages) {
          return { ...prev, messages: updated.slice(-maxMessages) };
        }
        return { ...prev, messages: updated };
      });
    });

    // Escutar mensagens deletadas
    channel.on('broadcast', { event: 'message-deleted' }, ({ payload }) => {
      const { messageId } = payload;
      setState(prev => ({
        ...prev,
        messages: prev.messages.filter(m => m.id !== messageId),
      }));
    });

    // Escutar mudanças de settings (slow mode, chat enabled)
    channel.on('broadcast', { event: 'settings-changed' }, ({ payload }) => {
      const { slowMode, chatEnabled, slowModeInterval } = payload;
      
      setState(prev => ({
        ...prev,
        isSlowMode: slowMode,
        isChatEnabled: chatEnabled,
      }));

      if (slowMode) {
        rateLimit.enableSlowMode(slowModeInterval || 5000);
      } else {
        rateLimit.disableSlowMode();
      }
    });

    // Escutar presence para contar viewers
    channel.on('presence', { event: 'sync' }, () => {
      const presenceState = channel.presenceState();
      const count = Object.keys(presenceState).length;
      setState(prev => ({ ...prev, viewerCount: count }));
    });

    // Backup: escutar postgres_changes
    channel.on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'live_chat_messages',
        filter: `live_id=eq.${liveId}`,
      },
      (payload) => {
        const m = payload.new as any;
        
        if (m.is_deleted) return;

        const newMessage: ChatMessage = {
          id: m.id,
          liveId: m.live_id,
          userId: m.user_id,
          userName: m.user_name,
          avatarUrl: m.avatar_url,
          message: m.message,
          isHighlighted: m.is_highlighted || false,
          isModerator: m.is_moderator || false,
          isPinned: m.is_pinned || false,
          isDeleted: m.is_deleted || false,
          createdAt: m.created_at,
        };

        setState(prev => {
          if (prev.messages.some(msg => msg.id === newMessage.id)) {
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
        console.log('[CHAT] ✅ Conectado ao Realtime');
        reconnectAttempts.current = 0;

        setState(prev => ({ ...prev, isConnected: true, error: null }));

        // Rastrear presença
        await channel.track({
          online_at: new Date().toISOString(),
          user_id: user?.id,
          user_name: profileRef.current?.nome || 'Anônimo',
        });
      } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
        console.log('[CHAT] ❌ Desconectado do Realtime');
        setState(prev => ({ ...prev, isConnected: false }));

        // Tentar reconectar
        if (reconnectAttempts.current < MAX_RECONNECT_ATTEMPTS) {
          reconnectAttempts.current++;
          reconnectTimer.current = setTimeout(() => {
            console.log(`[CHAT] 🔄 Tentando reconectar (${reconnectAttempts.current}/${MAX_RECONNECT_ATTEMPTS})`);
            connectToRealtime();
          }, RECONNECT_DELAY * reconnectAttempts.current);
        }
      }
    });

    channelRef.current = channel;
  }, [liveId, user, maxMessages, rateLimit]);

  // ============================================
  // RECONECTAR MANUALMENTE
  // ============================================

  const reconnect = useCallback(() => {
    reconnectAttempts.current = 0;
    connectToRealtime();
  }, [connectToRealtime]);

  // ============================================
  // SCROLL TO BOTTOM
  // ============================================

  const scrollToBottom = useCallback(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, []);

  // ============================================
  // ENVIAR MENSAGEM
  // ============================================

  const sendMessage = useCallback(async (text: string): Promise<boolean> => {
    // Verificar autenticação
    if (!user) {
      setState(prev => ({ ...prev, error: 'Você precisa estar logado' }));
      return false;
    }

    // Verificar se está banido
    if (state.isBanned) {
      setState(prev => ({ ...prev, error: 'Você está banido deste chat' }));
      return false;
    }

    // Verificar se chat está habilitado
    if (!state.isChatEnabled) {
      setState(prev => ({ ...prev, error: 'Chat desabilitado temporariamente' }));
      return false;
    }

    // Verificar rate limit
    const canSendCheck = rateLimit.checkCanSend();
    if (!canSendCheck.allowed) {
      setState(prev => ({ ...prev, error: canSendCheck.reason || 'Aguarde para enviar' }));
      return false;
    }

    // Validar mensagem
    const validation = rateLimit.validateMessage(text);
    if (!validation.valid) {
      setState(prev => ({ ...prev, error: validation.error || 'Mensagem inválida' }));
      return false;
    }

    // Moderar mensagem
    const moderationResult = moderateMessage(text, user.id);
    if (!moderationResult.isAllowed) {
      setState(prev => ({ 
        ...prev, 
        error: moderationResult.violations.join(', ') || 'Mensagem bloqueada' 
      }));
      return false;
    }

    setState(prev => ({ ...prev, isSending: true, error: null }));

    try {
      const messageId = crypto.randomUUID();
      const now = new Date().toISOString();

      const message: ChatMessage = {
        id: messageId,
        liveId,
        userId: user.id,
        userName: profileRef.current?.nome || 'Usuário',
        avatarUrl: profileRef.current?.avatar_url,
        message: moderationResult.sanitizedMessage,
        isHighlighted: false,
        isModerator: isModerator,
        isPinned: false,
        isDeleted: false,
        createdAt: now,
      };

      // Broadcast para todos
      await channelRef.current?.send({
        type: 'broadcast',
        event: 'new-message',
        payload: message,
      });

      // Persistir no banco
      const { error } = await supabase
        .from('live_chat_messages')
        .insert({
          id: messageId,
          live_id: liveId,
          user_id: user.id,
          user_name: profileRef.current?.nome || 'Usuário',
          avatar_url: profileRef.current?.avatar_url,
          message: moderationResult.sanitizedMessage,
          is_moderator: isModerator,
          is_highlighted: false,
          is_pinned: false,
          is_deleted: false,
        });

      if (error) {
        console.error('[CHAT] Erro ao persistir:', error);
      }

      // Registrar no rate limiter
      rateLimit.recordMessage();

      setState(prev => ({ ...prev, isSending: false }));
      return true;
    } catch (error) {
      console.error('[CHAT] Erro ao enviar:', error);
      setState(prev => ({
        ...prev,
        isSending: false,
        error: 'Erro ao enviar mensagem',
      }));
      return false;
    }
  }, [user, liveId, state.isBanned, state.isChatEnabled, rateLimit, isModerator]);

  // ============================================
  // EFFECTS
  // ============================================

  // Carregar dados iniciais
  useEffect(() => {
    loadInitialMessages();
    loadChatSettings();
    checkUserBanStatus();
  }, [loadInitialMessages, loadChatSettings, checkUserBanStatus]);

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

  // ============================================
  // RETURN
  // ============================================

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
