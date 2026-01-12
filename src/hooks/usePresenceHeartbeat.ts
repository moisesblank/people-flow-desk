// ============================================
// HOOK DE HEARTBEAT DE PRESENÇA
// Envia ping a cada 15 minutos para marcar online
// Otimizado para 5.000 usuários simultâneos
// ============================================

import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useRolePermissions } from '@/hooks/useRolePermissions';

// OTIMIZAÇÃO: 15min reduz ~40% do tráfego de presença
const HEARTBEAT_INTERVAL = 15 * 60 * 1000; // 15 minutos em ms
const INITIAL_DELAY = 2000; // 2 segundos após login

export function usePresenceHeartbeat() {
  const { user } = useAuth();
  const { isOwner, isAdmin } = useRolePermissions();
  const isAdminOrOwner = isOwner || isAdmin;
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const hasInitialized = useRef(false);

  const getDeviceType = useCallback((): string => {
    const ua = navigator.userAgent;
    
    // 🖥️ DESKTOP FIRST: macOS/Windows/Linux detection ANTES de Mobi check
    if (/Mac OS X|Macintosh/i.test(ua) && !/iPhone|iPad/i.test(ua)) return 'desktop';
    if (/Windows NT/i.test(ua) && !/Phone/i.test(ua)) return 'desktop';
    if (/Linux/i.test(ua) && !/Android/i.test(ua)) return 'desktop';
    
    // 📱 Tablet detection
    if (/tablet|ipad|playbook|silk/i.test(ua)) return 'tablet';
    if (/Android/i.test(ua) && !/Mobile/i.test(ua)) return 'tablet';
    
    // 📲 Mobile detection
    if (/mobile|iphone|ipod|android.*mobile|blackberry|opera mini|iemobile/i.test(ua)) return 'mobile';
    
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

  // Effect principal: heartbeat periódico
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
      
      // Depois, a cada 15 minutos (otimizado de 10min)
      intervalRef.current = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL);
    }, INITIAL_DELAY);

    // Evento antes de sair da página (todos os usuários)
    const handleBeforeUnload = () => {
      markOffline();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      clearTimeout(initialTimeout);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      window.removeEventListener('beforeunload', handleBeforeUnload);
      hasInitialized.current = false;
    };
  }, [user?.id, sendHeartbeat, markOffline]);

  // Effect separado: visibilitychange APENAS para admins/owner
  // OTIMIZAÇÃO: Alunos não enviam ping ao trocar de aba (~40% menos tráfego)
  useEffect(() => {
    if (!user?.id || !isAdminOrOwner) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        sendHeartbeat();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    console.debug('[Presence] Admin visibility tracking enabled');

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user?.id, isAdminOrOwner, sendHeartbeat]);

  return { sendHeartbeat, markOffline };
}
