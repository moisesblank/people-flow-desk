// ============================================
// 🛡️ EVANGELHO DA SEGURANÇA v2.2
// SESSION_BINDING_ENFORCEMENT — Revogação INSTANTÂNEA via Realtime
// Frontend NUNCA revoga sessões — só reage a eventos do backend
// ✅ forwardRef para compatibilidade com Radix UI
// ============================================

import { useEffect, useRef, useCallback, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { SessionRevokedOverlay } from './SessionRevokedOverlay';

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
  const hasLoggedOutRef = useRef(false);
  
  // Estado para controlar o overlay visual
  const [showRevokedOverlay, setShowRevokedOverlay] = useState(false);

  const BOOTSTRAP_RETRY_MS = 10_000;
  const MAX_BOOTSTRAP_ATTEMPTS = 3;

  /**
   * Exibe overlay visual e prepara logout
   * SOMENTE quando backend confirma revogação por novo dispositivo
   * 👑 OWNER bypass: nunca exibe overlay para moisesblank@gmail.com
   */
  const handleDeviceRevocation = useCallback(() => {
    // 👑 OWNER bypass UX-only: NUNCA mostrar overlay para o OWNER
    const isOwner = user?.email?.toLowerCase() === 'moisesblank@gmail.com';
    if (isOwner) {
      console.log('[SessionGuard] 👑 OWNER bypass - NÃO exibindo overlay de revogação');
      return;
    }

    if (hasLoggedOutRef.current) return;
    hasLoggedOutRef.current = true;

    console.error('[SessionGuard] 🔴 Sessão revogada - novo dispositivo detectado');

    // Limpar tokens imediatamente
    const keysToRemove = [
      'matriz_session_token',
      'matriz_last_heartbeat',
      'matriz_device_fingerprint',
      'matriz_trusted_device',
      'mfa_trust_cache',
    ];
    keysToRemove.forEach((key) => localStorage.removeItem(key));
    sessionStorage.clear();

    // Mostrar overlay visual
    setShowRevokedOverlay(true);
  }, [user?.email]);

  /**
   * Callback quando usuário fecha o overlay
   */
  const handleOverlayClose = useCallback(async () => {
    setShowRevokedOverlay(false);
    await signOut();
  }, [signOut]);

  /**
   * Limpa TUDO e força logout — SOMENTE quando backend confirma revogação
   * Guarda contra múltiplos logouts simultâneos
   */
  const handleBackendRevocation = useCallback(async (reason: string, isDeviceChange = false) => {
    if (hasLoggedOutRef.current) return;
    
    // Se é mudança de dispositivo, usar overlay visual
    if (isDeviceChange) {
      handleDeviceRevocation();
      return;
    }

    hasLoggedOutRef.current = true;
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

    await signOut();
  }, [signOut, handleDeviceRevocation]);

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
   * 🔧 FIX CRÍTICO: Falha de bootstrap NUNCA força logout!
   */
  const bootstrapSessionTokenIfMissing = useCallback(async () => {
    if (!user) return;

    const existing = localStorage.getItem(SESSION_TOKEN_KEY);
    if (existing) return;

    const now = Date.now();
    if (isBootstrappingRef.current) return;
    if (now - lastBootstrapAtRef.current < BOOTSTRAP_RETRY_MS) return;

    if (bootstrapAttemptsRef.current >= MAX_BOOTSTRAP_ATTEMPTS) {
      console.warn('[SessionGuard] ⚠️ Máximo de tentativas de bootstrap atingido. Aguardando próximo ciclo.');
      bootstrapAttemptsRef.current = 0;
      lastBootstrapAtRef.current = now + 60_000;
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
      bootstrapAttemptsRef.current = 0;
    } catch (e) {
      console.error('[SessionGuard] ❌ Erro inesperado no bootstrap:', e);
    } finally {
      isBootstrappingRef.current = false;
    }
  }, [user, detectClientDeviceMeta]);

  /**
   * Validar sessão consultando o BACKEND — nunca revoga por timer
   */
  const validateSession = useCallback(async (): Promise<boolean> => {
    if (!user || isValidatingRef.current || hasLoggedOutRef.current) return true;

    const storedToken = localStorage.getItem(SESSION_TOKEN_KEY);

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
        return true;
      }

      const result = data?.[0];

      if (!result?.is_valid) {
        const reason = result?.reason || 'SESSION_INVALID';

        // 🔧 P0 PATCH: Recuperação segura para SESSION_NOT_FOUND
        // Cenário real: token local existe, mas não está mais no backend (ex: novo dispositivo / storage race).
        // Estratégia: limpar token local e tentar 1 bootstrap; se persistir, segue fluxo normal (logout/overlay).
        if (reason === 'SESSION_NOT_FOUND') {
          const lastRecoveryAt = Number(sessionStorage.getItem('matriz_session_nf_recovery_at') || '0');
          const canRecover = Date.now() - lastRecoveryAt > 10_000; // anti-loop

          if (canRecover) {
            console.warn('[SessionGuard] 🟠 SESSION_NOT_FOUND → tentando bootstrap de recuperação');
            sessionStorage.setItem('matriz_session_nf_recovery_at', String(Date.now()));
            localStorage.removeItem(SESSION_TOKEN_KEY);
            await bootstrapSessionTokenIfMissing();
            isValidatingRef.current = false;
            return true;
          }
        }

        // 🎯 DIFERENCIAR: user_logout não mostra overlay de conflito
        // SESSION_NOT_FOUND pode ser user_logout ou conflito real
        // Para ser preciso, verificamos se acabamos de fazer logout
        const justLoggedOut = !localStorage.getItem(SESSION_TOKEN_KEY);
        const isUserInitiatedLogout = justLoggedOut || reason === 'USER_LOGOUT';
        const isInactivityTimeout = reason === 'INACTIVITY_TIMEOUT';

        console.warn(`[SessionGuard] 🔴 Backend revogou: ${reason}, justLoggedOut: ${justLoggedOut}`);
        
        if (isUserInitiatedLogout || isInactivityTimeout) {
          // Logout silencioso (sem overlay de conflito)
          await handleBackendRevocation(reason, false);
        } else {
          // Conflito de sessão: mostrar overlay
          await handleBackendRevocation(reason, true);
        }

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
  }, [user, handleBackendRevocation, bootstrapSessionTokenIfMissing]);

  // ✅ Verificação periódica + visibilidade
  useEffect(() => {
    if (!user) return;

    const intervalId = window.setInterval(() => {
      validateSession();
    }, SESSION_CHECK_INTERVAL);

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

  // 🛡️ Broadcasts de lockdown/epoch/device-revoked/user-deleted (com retry)
  useEffect(() => {
    if (!user) return;

    let channel: any = null;
    let userChannel: any = null;
    let reconnectTimer: NodeJS.Timeout | null = null;
    let reconnectAttempts = 0;
    const MAX_RECONNECT = 5;
    const BASE_DELAY = 2000;

    const connectChannels = () => {
      // Limpar canais existentes
      if (channel) supabase.removeChannel(channel);
      if (userChannel) supabase.removeChannel(userChannel);

      channel = supabase
        .channel('session-guard-lockdown')
        .on('broadcast', { event: 'auth-lockdown' }, async () => {
          console.error('[SessionGuard] 📡 LOCKDOWN BROADCAST recebido!');
          await handleBackendRevocation('Sistema em manutenção de emergência.');
        })
        .on('broadcast', { event: 'epoch-increment' }, async () => {
          console.error('[SessionGuard] 📡 EPOCH INCREMENT recebido!');
          await validateSession();
        })
        .subscribe((status) => {
          console.log('[SessionGuard] 📡 Lockdown channel status:', status);
          if (status === 'CHANNEL_ERROR' && reconnectAttempts < MAX_RECONNECT) {
            reconnectAttempts++;
            const delay = BASE_DELAY * Math.pow(2, reconnectAttempts - 1);
            console.log(`[SessionGuard] 🔄 Reconectando lockdown (${reconnectAttempts}/${MAX_RECONNECT}) em ${delay}ms`);
            if (reconnectTimer) clearTimeout(reconnectTimer);
            reconnectTimer = setTimeout(connectChannels, delay);
          }
        });

      userChannel = supabase
        .channel(`user:${user.id}`)
        .on('broadcast', { event: 'device-revoked' }, async (payload) => {
          console.error('[SessionGuard] 📡 DEVICE REVOKED recebido!', payload);
          await handleBackendRevocation('Este dispositivo foi removido.');
        })
        .on('broadcast', { event: 'user-deleted' }, async () => {
          console.error('[SessionGuard] 📡 USER DELETED recebido!');
          await handleBackendRevocation('Sua conta foi removida.');
        })
        .on('broadcast', { event: 'session-revoked' }, async (msg) => {
          const reason = msg?.payload?.reason;
          console.error('[SessionGuard] 📡 SESSION REVOKED BROADCAST recebido!', { reason });
          
          if (reason === 'user_logout') {
            console.log('[SessionGuard] ✅ Broadcast de logout manual - ignorando overlay');
            return;
          }
          
          handleDeviceRevocation();
        })
        .subscribe((status) => {
          console.log('[SessionGuard] 📡 User channel status:', status);
          if (status === 'SUBSCRIBED') {
            reconnectAttempts = 0;
          }
        });
    };

    connectChannels();

    return () => {
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (channel) supabase.removeChannel(channel);
      if (userChannel) supabase.removeChannel(userChannel);
    };
  }, [user, handleBackendRevocation, validateSession, handleDeviceRevocation]);

  // 🔒 SESSION_BINDING_ENFORCEMENT: Realtime listener on active_sessions (com retry)
  useEffect(() => {
    if (!user) return;

    let realtimeChannel: any = null;
    let reconnectTimer: NodeJS.Timeout | null = null;
    let reconnectAttempts = 0;
    const MAX_RECONNECT = 5;
    const BASE_DELAY = 2000;

    const myToken = localStorage.getItem(SESSION_TOKEN_KEY);
    console.log('[SessionGuard] 🔗 Iniciando listener Realtime para user:', user.id, 'token:', myToken?.slice(0, 8) + '...');

    const connectSessionChannel = () => {
      if (realtimeChannel) supabase.removeChannel(realtimeChannel);

      realtimeChannel = supabase
        .channel(`session-revocation-${user.id}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'active_sessions',
            filter: `user_id=eq.${user.id}`,
          },
          async (payload) => {
            const newStatus = payload.new?.status;
            const payloadToken = payload.new?.session_token;
            const revokedReason = payload.new?.revoked_reason;
            const currentToken = localStorage.getItem(SESSION_TOKEN_KEY);
            
            console.log('[SessionGuard] 📡 Realtime UPDATE active_sessions:', {
              newStatus,
              revokedReason,
              payloadToken: payloadToken?.slice(0, 8) + '...',
              currentToken: currentToken?.slice(0, 8) + '...',
              match: payloadToken === currentToken
            });

            if (newStatus === 'revoked' && payloadToken === currentToken) {
              const isUserInitiatedLogout = revokedReason === 'user_logout';
              
              if (isUserInitiatedLogout) {
                console.log('[SessionGuard] ✅ Logout manual detectado - sem overlay de conflito');
                const keysToRemove = [
                  'matriz_session_token',
                  'matriz_last_heartbeat',
                  'matriz_device_fingerprint',
                  'matriz_trusted_device',
                  'mfa_trust_cache',
                ];
                keysToRemove.forEach((key) => localStorage.removeItem(key));
                sessionStorage.clear();
                await signOut();
              } else {
                console.error('[SessionGuard] 🔴 Conflito de sessão detectado:', revokedReason);
                handleDeviceRevocation();
              }
            }
          }
        )
        .subscribe((status) => {
          console.log('[SessionGuard] 📡 Realtime subscription status:', status);
          if (status === 'SUBSCRIBED') {
            reconnectAttempts = 0;
          } else if (status === 'CHANNEL_ERROR' && reconnectAttempts < MAX_RECONNECT) {
            reconnectAttempts++;
            const delay = BASE_DELAY * Math.pow(2, reconnectAttempts - 1);
            console.log(`[SessionGuard] 🔄 Reconectando session channel (${reconnectAttempts}/${MAX_RECONNECT}) em ${delay}ms`);
            if (reconnectTimer) clearTimeout(reconnectTimer);
            reconnectTimer = setTimeout(connectSessionChannel, delay);
          }
        });
    };

    connectSessionChannel();

    return () => {
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (realtimeChannel) supabase.removeChannel(realtimeChannel);
    };
  }, [user, handleDeviceRevocation, signOut]);

  return (
    <>
      {children}
      <SessionRevokedOverlay 
        isVisible={showRevokedOverlay} 
        onClose={handleOverlayClose} 
      />
    </>
  );
}

export default SessionGuard;
