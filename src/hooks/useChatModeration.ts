// ============================================
// MASTER PRO ULTRA v3.0 - CHAT MODERATION HOOK
// Hook para ações de moderação do chat de lives
// ============================================

import { useState, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

// ============================================
// INTERFACES
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

// ============================================
// HOOK PRINCIPAL
// ============================================

export function useChatModeration(liveId: string): ModeratorActions {
  const { user, role } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Verificar se é moderador (owner ou admin)
  const isModerator = useMemo(() => {
    if (!role) return false;
    return ['owner', 'admin'].includes(role);
  }, [role]);

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

export default useChatModeration;
