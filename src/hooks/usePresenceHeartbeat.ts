// ============================================
// HOOK DE HEARTBEAT DE PRESENÇA
// Envia ping a cada 10 minutos para marcar online
// ============================================

import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

const HEARTBEAT_INTERVAL = 10 * 60 * 1000; // 10 minutos em ms
const INITIAL_DELAY = 2000; // 2 segundos após login

export function usePresenceHeartbeat() {
  const { user } = useAuth();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const hasInitialized = useRef(false);

  const getDeviceType = useCallback((): string => {
    const ua = navigator.userAgent;
    if (/tablet|ipad|playbook|silk/i.test(ua)) return 'tablet';
    if (/mobile|iphone|ipod|android|blackberry|opera mini|iemobile/i.test(ua)) return 'mobile';
    return 'desktop';
  }, []);

  const sendHeartbeat = useCallback(async () => {
    if (!user?.id) return;

    try {
      const deviceType = getDeviceType();
      
      // Usar a função RPC para upsert
      const { error } = await supabase.rpc('update_user_presence', {
        p_device_type: deviceType,
        p_ip_hash: null
      });

      if (error) {
        console.warn('[Presence] Heartbeat error:', error.message);
      } else {
        console.debug('[Presence] Heartbeat sent:', new Date().toISOString());
      }
    } catch (err) {
      console.warn('[Presence] Heartbeat failed:', err);
    }
  }, [user?.id, getDeviceType]);

  // Marcar offline ao sair
  const markOffline = useCallback(async () => {
    if (!user?.id) return;

    try {
      await supabase
        .from('user_presence')
        .update({ is_online: false, updated_at: new Date().toISOString() })
        .eq('user_id', user.id);
    } catch (err) {
      console.warn('[Presence] Failed to mark offline:', err);
    }
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) {
      // Limpar intervalo se não há usuário
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      hasInitialized.current = false;
      return;
    }

    // Evitar inicialização duplicada
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    // Primeiro heartbeat após delay inicial
    const initialTimeout = setTimeout(() => {
      sendHeartbeat();
      
      // Depois, a cada 10 minutos
      intervalRef.current = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL);
    }, INITIAL_DELAY);

    // Eventos de visibilidade da página
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        sendHeartbeat();
      }
    };

    // Evento antes de sair da página
    const handleBeforeUnload = () => {
      markOffline();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      clearTimeout(initialTimeout);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      hasInitialized.current = false;
    };
  }, [user?.id, sendHeartbeat, markOffline]);

  return { sendHeartbeat, markOffline };
}
