// ============================================
// SYNAPSE v14.0 - HOOK DE TRACKING DE SESSÕES
// Registra login, atividade e logout automaticamente
// VERSÃO CORRIGIDA - Funcional
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
  
  // 🖥️ DESKTOP FIRST: macOS/Windows/Linux detection ANTES de Mobi check
  let deviceType: 'mobile' | 'tablet' | 'desktop' = 'desktop';
  
  const isDesktopOS = 
    (/Mac OS X|Macintosh/i.test(ua) && !/iPhone|iPad/i.test(ua)) ||
    (/Windows NT/i.test(ua) && !/Phone/i.test(ua)) ||
    (/Linux/i.test(ua) && !/Android/i.test(ua));
  
  if (!isDesktopOS) {
    if (/iPad|Tablet/i.test(ua) || (/Android/i.test(ua) && !/Mobile/i.test(ua))) {
      deviceType = 'tablet';
    } else if (/Mobile|Android.*Mobile|iPhone|iPod|Mobi/i.test(ua)) {
      deviceType = 'mobile';
    }
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
  const currentUserId = useRef<string | null>(null);

  const registerSession = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || sessionRegistered.current) return;

      currentUserId.current = user.id;
      const info = detectSessionInfo();
      
      const { error } = await supabase.rpc('register_user_login', {
        _user_agent: info.userAgent,
        _device_type: info.deviceType,
        _browser: info.browser,
        _os: info.os
      });

      if (!error) {
        sessionRegistered.current = true;
      }
    } catch {
      // Silencioso - não interromper por erro de sessão
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
      // Usar chamada direta em vez de sendBeacon que não funciona com auth
      await supabase.rpc('register_user_logout');
      sessionRegistered.current = false;
      currentUserId.current = null;
    } catch {
      // Silencioso - não interromper por erro de logout
    }
  }, []);

  useEffect(() => {
    // Listener para mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        registerSession();
      } else if (event === 'SIGNED_OUT') {
        registerLogout();
      }
    });

    // Verificar se já está logado
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        registerSession();
      }
    });

    // PATCH-CUSTO: Aumentado de 2min para 5min + jitter anti-herd (0-30s)
    const jitter = Math.floor(Math.random() * 30000);
    activityInterval.current = setInterval(updateActivity, 300000 + jitter);

    // Handlers de visibilidade e unload
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        updateActivity();
      }
    };

    // Usar beforeunload com fetch keepalive para garantir logout
    const handleBeforeUnload = async () => {
      if (currentUserId.current) {
        // Tentar logout síncrono antes de fechar
        try {
          await supabase.rpc('register_user_logout');
        } catch {
          // Ignorar erros no unload
        }
      }
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

  return { updateActivity, registerLogout };
}

export default useSessionTracking;
