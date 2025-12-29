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
  const isBootstrappingRef = useRef(false);
  const bootstrapAttemptsRef = useRef(0);
  const lastBootstrapAtRef = useRef(0);

  const BOOTSTRAP_RETRY_MS = 10_000;
  const MAX_BOOTSTRAP_ATTEMPTS = 3;

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

  const detectClientDeviceMeta = useCallback(() => {
    const ua = navigator.userAgent;

    let device_type = 'desktop';
    if (/Mobi|Android|iPhone|iPad/i.test(ua)) {
      device_type = /iPad|Tablet/i.test(ua) ? 'tablet' : 'mobile';
    }

    let browser = 'unknown';
    if (ua.includes('Firefox')) browser = 'Firefox';
    else if (ua.includes('Edg')) browser = 'Edge';
    else if (ua.includes('Chrome')) browser = 'Chrome';
    else if (ua.includes('Safari')) browser = 'Safari';

    let os = 'unknown';
    if (ua.includes('Windows')) os = 'Windows';
    else if (ua.includes('Mac')) os = 'macOS';
    else if (ua.includes('Linux')) os = 'Linux';
    else if (ua.includes('Android')) os = 'Android';
    else if (ua.includes('iPhone')) os = 'iOS';

    return { device_type, browser, os };
  }, []);

  /**
   * Bootstrap do token de sessão (P0):
   * Se o usuário está autenticado mas não existe matriz_session_token,
   * criamos a sessão única via backend (fonte da verdade).
   *
   * Isso evita "sessão zumbi" sem token e restaura o DOGMA I.
   */
  const bootstrapSessionTokenIfMissing = useCallback(async () => {
    if (!user) return;

    const existing = localStorage.getItem(SESSION_TOKEN_KEY);
    if (existing) return;

    // Evitar spam e permitir retry (P0): se o token não existir, precisamos criar.
    const now = Date.now();
    if (isBootstrappingRef.current) return;
    if (now - lastBootstrapAtRef.current < BOOTSTRAP_RETRY_MS) return;

    if (bootstrapAttemptsRef.current >= MAX_BOOTSTRAP_ATTEMPTS) {
      await handleBackendRevocation('Falha crítica de segurança: sessão não inicializada.');
      return;
    }

    bootstrapAttemptsRef.current += 1;
    lastBootstrapAtRef.current = now;
    isBootstrappingRef.current = true;

    try {
      console.warn('[SessionGuard] ⚠️ Token ausente — bootstrap de sessão única (RPC)');
      const meta = detectClientDeviceMeta();

      const { data, error } = await supabase.rpc('create_single_session', {
        _ip_address: null,
        _user_agent: navigator.userAgent.slice(0, 255),
        _device_type: meta.device_type,
        _browser: meta.browser,
        _os: meta.os,
        _device_hash_from_server: null,
      });

      const token = data?.[0]?.session_token;
      if (error || !token) {
        console.error('[SessionGuard] ❌ Bootstrap falhou:', error);
        return;
      }

      localStorage.setItem(SESSION_TOKEN_KEY, token);
      console.log('[SessionGuard] ✅ Bootstrap OK: matriz_session_token criado');

      // Reset contador após sucesso
      bootstrapAttemptsRef.current = 0;
    } catch (e) {
      console.error('[SessionGuard] ❌ Erro inesperado no bootstrap:', e);
    } finally {
      isBootstrappingRef.current = false;
    }
  }, [
    user,
    detectClientDeviceMeta,
    handleBackendRevocation,
    BOOTSTRAP_RETRY_MS,
    MAX_BOOTSTRAP_ATTEMPTS,
  ]);

  /**
   * Validar sessão consultando o BACKEND — nunca revoga por timer
   */
  const validateSession = useCallback(async (): Promise<boolean> => {
    if (!user || isValidatingRef.current) return true;

    const storedToken = localStorage.getItem(SESSION_TOKEN_KEY);

    // ✅ Se não há token, tentamos bootstrap (1x) e não derrubamos por timer
    if (!storedToken) {
      await bootstrapSessionTokenIfMissing();
      return true;
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
  }, [user, handleBackendRevocation, bootstrapSessionTokenIfMissing]);

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
