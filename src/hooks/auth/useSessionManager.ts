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
      
      // Revogar sessões anteriores deste usuário
      await supabase
        .from('active_sessions')
        .update({ 
          status: 'revoked', 
          revoked_at: new Date().toISOString(),
          revoked_reason: 'new_session_started'
        })
        .eq('user_id', userId)
        .eq('status', 'active');

      // Buscar epoch atual do sistema
      const { data: guardData } = await supabase
        .from('system_guard')
        .select('auth_epoch')
        .single();
      
      const currentEpoch = guardData?.auth_epoch ?? 1;

      // Criar nova sessão COM epoch
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
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 dias
          auth_epoch_at_login: currentEpoch, // 🛡️ BLOCO 2: Registrar epoch no login
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
   * Revoga a sessão atual
   */
  const revokeCurrentSession = useCallback(async (reason: string = 'user_logout') => {
    const sessionToken = localStorage.getItem(SESSION_TOKEN_KEY);
    if (!sessionToken) return;

    try {
      await supabase
        .from('active_sessions')
        .update({ 
          status: 'revoked', 
          revoked_at: new Date().toISOString(),
          revoked_reason: reason
        })
        .eq('session_token', sessionToken);
    } catch (err) {
      console.warn('[SessionManager] Erro ao revogar sessão:', err);
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
