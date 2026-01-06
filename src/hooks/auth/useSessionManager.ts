// ============================================
// 🎫 useSessionManager — Gerenciador de Sessões
// Extraído do useAuth para Single Responsibility
// ============================================

import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useDeviceFingerprint } from "./useDeviceFingerprint";

const SESSION_TOKEN_KEY = 'matriz_session_token';

interface SessionRegistration {
  success: boolean;
  sessionToken?: string;
  error?: string;
}

export function useSessionManager() {
  const { collect: collectFingerprint } = useDeviceFingerprint();

  /**
   * Registra uma nova sessão (DOGMA I: Sessão Única)
   */
  const registerSession = useCallback(async (userId: string): Promise<SessionRegistration> => {
    try {
      const fingerprint = await collectFingerprint();
      const sessionToken = crypto.randomUUID();
      
      // 🗑️ DELETAR sessões anteriores deste usuário (EXCLUSÃO DEFINITIVA)
      await supabase
        .from('active_sessions')
        .delete()
        .eq('user_id', userId);
      
      console.log('[SessionManager] 🗑️ Sessões anteriores DELETADAS definitivamente');

      // Buscar epoch atual do sistema
      const { data: guardData } = await supabase
        .from('system_guard')
        .select('auth_epoch')
        .single();
      
      const currentEpoch = guardData?.auth_epoch ?? 1;

      // Criar nova sessão DO ZERO
      const { error } = await supabase
        .from('active_sessions')
        .insert({
          user_id: userId,
          session_token: sessionToken,
          device_hash: fingerprint.hash,
          device_type: fingerprint.data.deviceType as string,
          device_name: `${fingerprint.data.browser} on ${fingerprint.data.os}`,
          user_agent: navigator.userAgent,
          status: 'active',
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          auth_epoch_at_login: currentEpoch,
        });

      if (error) {
        console.error('[SessionManager] Erro ao registrar sessão:', error);
        return { success: false, error: error.message };
      }

      localStorage.setItem(SESSION_TOKEN_KEY, sessionToken);
      return { success: true, sessionToken };
    } catch (err) {
      console.error('[SessionManager] Erro inesperado:', err);
      return { success: false, error: 'Erro ao registrar sessão' };
    }
  }, [collectFingerprint]);

  /**
   * 🗑️ DELETA a sessão atual (EXCLUSÃO DEFINITIVA - não revoga, DELETA)
   */
  const revokeCurrentSession = useCallback(async (_reason: string = 'user_logout') => {
    const sessionToken = localStorage.getItem(SESSION_TOKEN_KEY);
    if (!sessionToken) return;

    try {
      // 🗑️ DELETE DEFINITIVO - não UPDATE para 'revoked'
      await supabase
        .from('active_sessions')
        .delete()
        .eq('session_token', sessionToken);
      
      console.log('[SessionManager] 🗑️ Sessão DELETADA definitivamente');
    } catch (err) {
      console.warn('[SessionManager] Erro ao deletar sessão:', err);
    } finally {
      localStorage.removeItem(SESSION_TOKEN_KEY);
    }
  }, []);

  /**
   * Verifica se a sessão atual é válida
   */
  const validateSession = useCallback(async (): Promise<boolean> => {
    const sessionToken = localStorage.getItem(SESSION_TOKEN_KEY);
    if (!sessionToken) return false;

    try {
      const { data, error } = await supabase
        .from('active_sessions')
        .select('status, expires_at')
        .eq('session_token', sessionToken)
        .maybeSingle();

      if (error || !data) return false;
      if (data.status !== 'active') return false;
      if (new Date(data.expires_at) < new Date()) return false;

      return true;
    } catch {
      return false;
    }
  }, []);

  return {
    registerSession,
    revokeCurrentSession,
    validateSession,
  };
}
