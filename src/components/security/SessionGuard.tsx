// ============================================
// 🛡️ EVANGELHO DA SEGURANÇA v2.0
// COMPONENTE DE PROTEÇÃO DE SESSÃO (OBSERVADOR PASSIVO)
// Frontend NUNCA revoga sessões — só reage a eventos do backend
// ============================================

import { useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const SESSION_TOKEN_KEY = 'matriz_session_token';
const SESSION_CHECK_INTERVAL = 30000; // 30s

interface SessionGuardProps {
  children: React.ReactNode;
}

export function SessionGuard({ children }: SessionGuardProps) {
  const { user, signOut } = useAuth();
  const isValidatingRef = useRef(false);

  /**
   * Limpa TUDO e força logout — SOMENTE quando backend confirma revogação
   */
  const handleBackendRevocation = useCallback(async (reason: string) => {
    console.error(`[SessionGuard] 🔴 Backend confirmou revogação: ${reason}`);

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
   * Validar sessão consultando o BACKEND — nunca revoga por timer
   */
  const validateSession = useCallback(async (): Promise<boolean> => {
    if (!user || isValidatingRef.current) return true;

    const storedToken = localStorage.getItem(SESSION_TOKEN_KEY);
    
    // ✅ SEM TOKEN = ainda não foi criado, NÃO derrubar
    // O backend é a fonte da verdade. Esperar o token aparecer.
    if (!storedToken) {
      console.log('[SessionGuard] Token ainda não existe, aguardando...');
      return true; // NÃO fazer logout
    }

    isValidatingRef.current = true;

    try {
      const { data, error } = await supabase.rpc('validate_session_epoch', {
        p_session_token: storedToken,
      });

      if (error) {
        console.error('[SessionGuard] Erro na validação (rede):', error);
        isValidatingRef.current = false;
        // Erro de rede NÃO derruba sessão — mantém estabilidade
        return true;
      }

      const result = data?.[0];

      // ✅ SOMENTE fazer logout se BACKEND confirmar sessão inválida
      if (!result?.is_valid) {
        const reason = result?.reason || 'SESSION_INVALID';

        let message = 'Sessão inválida. Faça login novamente.';
        switch (reason) {
          case 'AUTH_DISABLED':
            message = 'Sistema em manutenção. Por favor, aguarde.';
            break;
          case 'AUTH_EPOCH_REVOKED':
            message = 'Sua sessão foi invalidada por medida de segurança.';
            break;
          case 'SESSION_NOT_FOUND':
            message = 'Sessão não encontrada no servidor.';
            break;
          case 'SESSION_EXPIRED':
            message = 'Sessão expirada no servidor.';
            break;
          case 'USER_DELETED':
            message = 'Sua conta foi removida.';
            break;
          case 'USER_DISABLED':
            message = 'Sua conta foi desativada.';
            break;
          default:
            break;
        }

        console.warn(`[SessionGuard] 🔴 Backend revogou: ${reason}`);
        await handleBackendRevocation(message);

        isValidatingRef.current = false;
        return false;
      }

      isValidatingRef.current = false;
      return true;
    } catch (err) {
      console.error('[SessionGuard] Erro na validação:', err);
      isValidatingRef.current = false;
      // Erro de exceção NÃO derruba sessão
      return true;
    }
  }, [user, handleBackendRevocation]);

  // ✅ Verificação periódica + visibilidade — SEM timer de grace period
  useEffect(() => {
    if (!user) return;

    // Validação periódica a cada 30s (consulta backend)
    const intervalId = window.setInterval(() => {
      validateSession();
    }, SESSION_CHECK_INTERVAL);

    // Validar ao retornar para a aba
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        validateSession();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user, validateSession]);

  // 🛡️ Broadcasts de lockdown/epoch/device-revoked/user-deleted
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('session-guard-lockdown')
      .on('broadcast', { event: 'auth-lockdown' }, async () => {
        console.error('[SessionGuard] 📡 LOCKDOWN BROADCAST recebido!');
        await handleBackendRevocation('Sistema em manutenção de emergência.');
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
        await handleBackendRevocation('Este dispositivo foi removido.');
      })
      .on('broadcast', { event: 'user-deleted' }, async () => {
        console.error('[SessionGuard] 📡 USER DELETED recebido!');
        await handleBackendRevocation('Sua conta foi removida.');
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(userChannel);
    };
  }, [user, handleBackendRevocation, validateSession]);

  return <>{children}</>;
}

export default SessionGuard;
