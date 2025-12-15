// ============================================
// SYNAPSE v14.0 - HOOK DE TRACKING DE SESSÕES
// Registra login, atividade e logout automaticamente
// ============================================

import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface SessionInfo {
  userAgent: string;
  deviceType: 'mobile' | 'tablet' | 'desktop';
  browser: string;
  os: string;
}

function detectSessionInfo(): SessionInfo {
  const ua = navigator.userAgent;
  
  // Detectar tipo de dispositivo
  let deviceType: 'mobile' | 'tablet' | 'desktop' = 'desktop';
  if (/Mobile|Android|iPhone|iPod/i.test(ua)) {
    deviceType = 'mobile';
  } else if (/iPad|Tablet/i.test(ua)) {
    deviceType = 'tablet';
  }
  
  // Detectar navegador
  let browser = 'Outro';
  if (ua.includes('Edg/')) browser = 'Edge';
  else if (ua.includes('Chrome')) browser = 'Chrome';
  else if (ua.includes('Firefox')) browser = 'Firefox';
  else if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'Safari';
  else if (ua.includes('Opera') || ua.includes('OPR')) browser = 'Opera';
  
  // Detectar sistema operacional
  let os = 'Outro';
  if (ua.includes('Windows NT 10')) os = 'Windows 10/11';
  else if (ua.includes('Windows')) os = 'Windows';
  else if (ua.includes('Mac OS X')) os = 'macOS';
  else if (ua.includes('Android')) os = 'Android';
  else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';
  else if (ua.includes('Linux')) os = 'Linux';
  
  return { userAgent: ua, deviceType, browser, os };
}

export function useSessionTracking() {
  const sessionRegistered = useRef(false);
  const activityInterval = useRef<NodeJS.Timeout | null>(null);

  const registerSession = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || sessionRegistered.current) return;

      const info = detectSessionInfo();
      
      const { error } = await supabase.rpc('register_user_login', {
        _user_agent: info.userAgent,
        _device_type: info.deviceType,
        _browser: info.browser,
        _os: info.os
      });

      if (!error) {
        sessionRegistered.current = true;
        console.log('📍 Sessão registrada:', info.browser, info.os);
      }
    } catch (err) {
      console.error('Erro ao registrar sessão:', err);
    }
  }, []);

  const updateActivity = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      await supabase.rpc('update_user_activity');
    } catch (err) {
      // Silencioso - não interromper por erro de atividade
    }
  }, []);

  const registerLogout = useCallback(async () => {
    try {
      await supabase.rpc('register_user_logout');
    } catch (err) {
      // Silencioso
    }
  }, []);

  useEffect(() => {
    // Listener para mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        registerSession();
      } else if (event === 'SIGNED_OUT') {
        registerLogout();
        sessionRegistered.current = false;
      }
    });

    // Verificar se já está logado
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        registerSession();
      }
    });

    // Atualizar atividade a cada 2 minutos
    activityInterval.current = setInterval(updateActivity, 120000);

    // Handlers de visibilidade e unload
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        updateActivity();
      }
    };

    const handleBeforeUnload = () => {
      // Usar sendBeacon para garantir que a requisição seja enviada
      const url = `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/rpc/register_user_logout`;
      navigator.sendBeacon(url);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      subscription.unsubscribe();
      if (activityInterval.current) {
        clearInterval(activityInterval.current);
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [registerSession, updateActivity, registerLogout]);

  return { updateActivity };
}

export default useSessionTracking;
