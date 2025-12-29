// ============================================
// 🛡️ NUCLEAR LOCKDOWN SYSTEM v1.0
// Hook para verificar estado global de autenticação
// ============================================

import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

const SESSION_TOKEN_KEY = 'matriz_session_token';
const EPOCH_CHECK_INTERVAL = 30_000; // 30 segundos

// Códigos de erro específicos
export type AuthGuardError = 
  | 'AUTH_DISABLED'      // auth_enabled = false (lockdown total)
  | 'AUTH_EPOCH_REVOKED' // sessão criada em epoch anterior
  | 'SESSION_NOT_FOUND'  // sessão não existe
  | 'SESSION_EXPIRED'    // sessão expirada
  | 'VALID';             // tudo ok

interface SystemGuardState {
  authEnabled: boolean;
  authEpoch: number;
  isLoading: boolean;
  lastCheck: Date | null;
  error: AuthGuardError | null;
}

interface UseSystemGuardReturn extends SystemGuardState {
  checkAuthStatus: () => Promise<AuthGuardError>;
  validateSessionEpoch: () => Promise<AuthGuardError>;
  forceLogout: (reason: AuthGuardError) => void;
}

/**
 * Hook que verifica estado global de autenticação e epoch de sessão.
 * 
 * DOGMA SUPREMO: Se auth_enabled=false ou epoch diverge, LOGOUT IMEDIATO.
 */
export function useSystemGuard(): UseSystemGuardReturn {
  const [state, setState] = useState<SystemGuardState>({
    authEnabled: true,
    authEpoch: 1,
    isLoading: true,
    lastCheck: null,
    error: null,
  });

  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Limpa TUDO e força logout
   */
  const forceLogout = useCallback(async (reason: AuthGuardError) => {
    console.error(`[SYSTEM_GUARD] 🔴 FORÇANDO LOGOUT: ${reason}`);

    // 1. Limpar TUDO do localStorage
    const keysToRemove = [
      'matriz_session_token',
      'matriz_last_heartbeat',
      'matriz_device_fingerprint',
      'matriz_trusted_device',
      'mfa_trust_cache',
      'sb-fyikfsasudgzsjmumdlw-auth-token',
    ];
    keysToRemove.forEach(key => localStorage.removeItem(key));

    // 2. Limpar sessionStorage
    sessionStorage.clear();

    // 3. Limpar cookies de auth (se possível)
    document.cookie.split(";").forEach((c) => {
      const name = c.split("=")[0].trim();
      if (name.includes('sb-') || name.includes('supabase')) {
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
      }
    });

    // 4. Signout do Supabase
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.error('[SYSTEM_GUARD] Erro no signOut:', e);
    }

    // 5. Redirect forçado com código de erro
    window.location.replace(`/auth?error=${reason}`);
  }, []);

  /**
   * Verifica se auth está habilitado (LOCKDOWN CHECK)
   */
  const checkAuthStatus = useCallback(async (): Promise<AuthGuardError> => {
    try {
      const { data, error } = await supabase
        .from('system_guard')
        .select('auth_enabled, auth_epoch')
        .single();

      if (error) {
        console.warn('[SYSTEM_GUARD] Erro ao verificar system_guard:', error);
        // Em caso de erro, assume habilitado (fail-open para não travar)
        return 'VALID';
      }

      setState(prev => ({
        ...prev,
        authEnabled: data.auth_enabled ?? true,
        authEpoch: data.auth_epoch ?? 1,
        lastCheck: new Date(),
        isLoading: false,
      }));

      if (!data.auth_enabled) {
        console.error('[SYSTEM_GUARD] 🔒 LOCKDOWN ATIVO - Auth desabilitado!');
        setState(prev => ({ ...prev, error: 'AUTH_DISABLED' }));
        return 'AUTH_DISABLED';
      }

      return 'VALID';
    } catch (err) {
      console.error('[SYSTEM_GUARD] Erro crítico:', err);
      return 'VALID'; // Fail-open
    }
  }, []);

  /**
   * Valida epoch da sessão atual via RPC
   */
  const validateSessionEpoch = useCallback(async (): Promise<AuthGuardError> => {
    const sessionToken = localStorage.getItem(SESSION_TOKEN_KEY);
    
    if (!sessionToken) {
      // Sem sessão, não é erro de epoch
      return 'SESSION_NOT_FOUND';
    }

    try {
      const { data, error } = await supabase.rpc('validate_session_epoch', {
        p_session_token: sessionToken,
      });

      if (error) {
        console.error('[SYSTEM_GUARD] Erro ao validar epoch:', error);
        return 'VALID'; // Fail-open
      }

      // Resultado é array com {is_valid, reason, user_id}
      const result = data?.[0];
      
      if (!result?.is_valid) {
        const reason = result?.reason as AuthGuardError || 'SESSION_NOT_FOUND';
        console.error(`[SYSTEM_GUARD] 🔴 Sessão inválida: ${reason}`);
        setState(prev => ({ ...prev, error: reason }));
        return reason;
      }

      setState(prev => ({ ...prev, error: null }));
      return 'VALID';
    } catch (err) {
      console.error('[SYSTEM_GUARD] Erro crítico na validação de epoch:', err);
      return 'VALID'; // Fail-open
    }
  }, []);

  /**
   * Verificação combinada: auth_status + epoch
   */
  const fullValidation = useCallback(async () => {
    // 1. Verificar se auth está habilitado
    const authStatus = await checkAuthStatus();
    if (authStatus !== 'VALID') {
      forceLogout(authStatus);
      return;
    }

    // 2. Verificar epoch da sessão
    const epochStatus = await validateSessionEpoch();
    if (epochStatus !== 'VALID' && epochStatus !== 'SESSION_NOT_FOUND') {
      forceLogout(epochStatus);
    }
  }, [checkAuthStatus, validateSessionEpoch, forceLogout]);

  // Verificação inicial e periódica
  useEffect(() => {
    // Verificar imediatamente ao montar
    fullValidation();

    // Verificação periódica (30s)
    checkIntervalRef.current = setInterval(() => {
      fullValidation();
    }, EPOCH_CHECK_INTERVAL);

    // Verificar quando volta para a aba
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fullValidation();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [fullValidation]);

  // Listener para broadcast de lockdown
  useEffect(() => {
    const channel = supabase.channel('system-lockdown')
      .on('broadcast', { event: 'auth-lockdown' }, async (payload) => {
        console.error('[SYSTEM_GUARD] 📡 Broadcast de LOCKDOWN recebido:', payload);
        forceLogout('AUTH_DISABLED');
      })
      .on('broadcast', { event: 'epoch-increment' }, async (payload) => {
        console.error('[SYSTEM_GUARD] 📡 Broadcast de EPOCH INCREMENT recebido:', payload);
        // Revalidar epoch
        const result = await validateSessionEpoch();
        if (result !== 'VALID' && result !== 'SESSION_NOT_FOUND') {
          forceLogout(result);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [forceLogout, validateSessionEpoch]);

  return {
    ...state,
    checkAuthStatus,
    validateSessionEpoch,
    forceLogout,
  };
}

export default useSystemGuard;
