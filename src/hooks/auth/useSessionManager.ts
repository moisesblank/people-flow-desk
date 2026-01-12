// ============================================
// 🎫 useSessionManager — Gerenciador de Sessões v3.0
// REFINAMENTO SISTÊMICO P0: Usa SEMPRE hash do servidor
// Extraído do useAuth para Single Responsibility
// ============================================

import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getServerDeviceHash, generateDeviceName, detectDeviceType } from "@/lib/deviceFingerprint";

const SESSION_TOKEN_KEY = 'matriz_session_token';

interface SessionRegistration {
  success: boolean;
  sessionToken?: string;
  error?: string;
}

export function useSessionManager() {
  /**
   * 🔐 REFINAMENTO P0: Registra sessão usando hash do SERVIDOR
   * O hash do servidor é a fonte da verdade (com pepper)
   * DEVE ser chamado DEPOIS de registerDeviceBeforeSession()
   */
  const registerSession = useCallback(async (userId: string, serverDeviceHash?: string): Promise<SessionRegistration> => {
    try {
      // 🔐 P0: Usar hash do servidor passado como parâmetro OU buscar do localStorage
      const deviceHash = serverDeviceHash || getServerDeviceHash();
      
      if (!deviceHash) {
        console.error('[SessionManager] ❌ P0 VIOLATION: Sem hash do servidor! Dispositivo deve ser registrado ANTES da sessão.');
        return { 
          success: false, 
          error: 'DEVICE_NOT_REGISTERED - Hash do servidor não encontrado' 
        };
      }

      const sessionToken = crypto.randomUUID();
      const deviceName = generateDeviceName();
      const deviceType = detectDeviceType();
      
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

      // 🔐 P0: Criar sessão com hash do SERVIDOR (mesmo hash usado em user_devices)
      const { error } = await supabase
        .from('active_sessions')
        .insert({
          user_id: userId,
          session_token: sessionToken,
          device_hash: deviceHash, // 🔐 HASH DO SERVIDOR - mesmo de user_devices!
          device_type: deviceType,
          device_name: deviceName,
          user_agent: navigator.userAgent,
          status: 'active',
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          auth_epoch_at_login: currentEpoch,
          mfa_verified: false, // Será atualizado após 2FA
        });

      if (error) {
        console.error('[SessionManager] Erro ao registrar sessão:', error);
        return { success: false, error: error.message };
      }

      localStorage.setItem(SESSION_TOKEN_KEY, sessionToken);
      console.log('[SessionManager] ✅ Sessão criada com hash do SERVIDOR:', deviceHash.slice(0, 8) + '...');
      return { success: true, sessionToken };
    } catch (err) {
      console.error('[SessionManager] Erro inesperado:', err);
      return { success: false, error: 'Erro ao registrar sessão' };
    }
  }, []);

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

  /**
   * 🔐 P0: Sincroniza hash da sessão atual com user_devices
   * Útil para corrigir sessões órfãs criadas antes do refinamento
   */
  const syncSessionWithDevice = useCallback(async (): Promise<boolean> => {
    const sessionToken = localStorage.getItem(SESSION_TOKEN_KEY);
    const serverHash = getServerDeviceHash();
    
    if (!sessionToken || !serverHash) return false;

    try {
      const { error } = await supabase
        .from('active_sessions')
        .update({ device_hash: serverHash })
        .eq('session_token', sessionToken);

      if (error) {
        console.warn('[SessionManager] Erro ao sincronizar hash:', error);
        return false;
      }

      console.log('[SessionManager] ✅ Hash da sessão sincronizado com servidor');
      return true;
    } catch {
      return false;
    }
  }, []);

  return {
    registerSession,
    revokeCurrentSession,
    validateSession,
    syncSessionWithDevice,
  };
}
