// ============================================
// 🛡️ EVANGELHO DA SEGURANÇA v2.0
// COMPONENTE DE PROTEÇÃO DE SESSÃO ÚNICA
// + NUCLEAR LOCKDOWN INTEGRATION
// ============================================

import { useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const SESSION_TOKEN_KEY = 'matriz_session_token';
const SESSION_CHECK_INTERVAL = 30000; // 30s (DOGMA I)
const SESSION_BOOTSTRAP_GRACE_MS = 6000; // tempo para o login criar o token

interface SessionGuardProps {
  children: React.ReactNode;
}

export function SessionGuard({ children }: SessionGuardProps) {
  const { user, signOut } = useAuth();
  const isValidatingRef = useRef(false);

  /**
   * Limpa TUDO e força logout (BLOCO 3: frontend_regras)
   */
  const forceLogoutWithCleanup = useCallback(async (reason: string) => {
    console.error(`[SessionGuard] 🔴 Forçando logout: ${reason}`);

    // Limpar TUDO
    const keysToRemove = [
      'matriz_session_token',
      'matriz_last_heartbeat',
      'matriz_device_fingerprint',
      'matriz_trusted_device',
      'mfa_trust_cache',
    ];
    keysToRemove.forEach((key) => localStorage.removeItem(key));
    sessionStorage.clear();

    toast.error('Sessão encerrada', {
      description: reason,
      duration: 5000,
    });

    await signOut();
  }, [signOut]);

  /**
   * Validar sessão usando EPOCH
   */
  const validateSession = useCallback(async (): Promise<boolean> => {
    if (!user || isValidatingRef.current) return true;

    isValidatingRef.current = true;

    try {
      const storedToken = localStorage.getItem(SESSION_TOKEN_KEY);

      // ✅ FAIL-CLOSED (com grace): usuário autenticado sem token de sessão de segurança = inválido
      if (!storedToken) {
        isValidatingRef.current = false;
        return false;
      }

      const { data, error } = await supabase.rpc('validate_session_epoch', {
        p_session_token: storedToken,
      });

      if (error) {
        console.error('[SessionGuard] Erro na validação:', error);
        isValidatingRef.current = false;
        // Não derrubar por erro de rede (mantém estabilidade)
        return true;
      }

      const result = data?.[0];

      if (!result?.is_valid) {
        const reason = result?.reason || 'SESSION_INVALID';

        let message = 'Sessão inválida. Faça login novamente.';
        switch (reason) {
          case 'AUTH_DISABLED':
            message = 'Sistema em manutenção. Por favor, aguarde.';
            break;
          case 'AUTH_EPOCH_REVOKED':
            message = 'Sua sessão foi invalidada por medida de segurança. Faça login novamente.';
            break;
          case 'SESSION_NOT_FOUND':
            message = 'Sessão não encontrada. Faça login novamente.';
            break;
          case 'SESSION_EXPIRED':
            message = 'Sessão expirada. Faça login novamente.';
            break;
          default:
            break;
        }

        console.warn(`[SessionGuard] 🔴 ${reason}: ${message}`);
        await forceLogoutWithCleanup(message);

        isValidatingRef.current = false;
        return false;
      }

      isValidatingRef.current = false;
      return true;
    } catch (err) {
      console.error('[SessionGuard] Erro na validação:', err);
      isValidatingRef.current = false;
      return true;
    }
  }, [user, forceLogoutWithCleanup]);

  // ✅ DOGMA I: verificação periódica + validação ao retornar para a aba
  useEffect(() => {
    if (!user) return;

    let intervalId: number | undefined;
    let bootstrapTimeoutId: number | undefined;

    // 1) Grace period para o Auth.tsx criar o token
    bootstrapTimeoutId = window.setTimeout(async () => {
      const token = localStorage.getItem(SESSION_TOKEN_KEY);
      if (!token) {
        await forceLogoutWithCleanup('Falha ao inicializar sessão de segurança. Faça login novamente.');
        return;
      }
      // valida imediatamente após bootstrap
      await validateSession();

      // 2) validação periódica
      intervalId = window.setInterval(() => {
        validateSession();
      }, SESSION_CHECK_INTERVAL);
    }, SESSION_BOOTSTRAP_GRACE_MS);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        validateSession();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (bootstrapTimeoutId) window.clearTimeout(bootstrapTimeoutId);
      if (intervalId) window.clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user, validateSession, forceLogoutWithCleanup]);

  // 🛡️ Broadcasts de lockdown/epoch/device-revoked/user-deleted
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('session-guard-lockdown')
      .on('broadcast', { event: 'auth-lockdown' }, async () => {
        console.error('[SessionGuard] 📡 LOCKDOWN BROADCAST recebido!');
        await forceLogoutWithCleanup('Sistema em manutenção de emergência.');
      })
      .on('broadcast', { event: 'epoch-increment' }, async () => {
        console.error('[SessionGuard] 📡 EPOCH INCREMENT recebido!');
        await validateSession();
      })
      .subscribe();

    const userChannel = supabase
      .channel(`user:${user.id}`)
      .on('broadcast', { event: 'device-revoked' }, async (payload) => {
        console.error('[SessionGuard] 📡 DEVICE REVOKED recebido!', payload);
        await forceLogoutWithCleanup('Este dispositivo foi removido. Faça login novamente.');
      })
      .on('broadcast', { event: 'user-deleted' }, async () => {
        console.error('[SessionGuard] 📡 USER DELETED recebido!');
        await forceLogoutWithCleanup('Sua conta foi removida.');
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(userChannel);
    };
  }, [user, forceLogoutWithCleanup, validateSession]);

  return <>{children}</>;
}

export default SessionGuard;
