// ============================================
// 💓 useHeartbeat — Heartbeat de Sessão Isolado
// Extraído do useAuth para Single Responsibility
// ============================================

import { useCallback, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

const SESSION_TOKEN_KEY = 'matriz_session_token';
const LAST_HEARTBEAT_KEY = 'matriz_last_heartbeat';
const HEARTBEAT_INTERVAL = 60_000; // 1 minuto

interface UseHeartbeatOptions {
  onSessionExpired?: () => void;
  enabled?: boolean;
}

export function useHeartbeat(options: UseHeartbeatOptions = {}) {
  const { onSessionExpired, enabled = true } = options;
  const heartbeatIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const missedHeartbeatsRef = useRef(0);

  const sendHeartbeat = useCallback(async () => {
    const sessionToken = localStorage.getItem(SESSION_TOKEN_KEY);
    
    if (!sessionToken) return;

    try {
      const { error } = await supabase
        .from('active_sessions')
        .update({ last_activity_at: new Date().toISOString() })
        .eq('session_token', sessionToken)
        .eq('status', 'active');

      if (error) {
        missedHeartbeatsRef.current++;
        console.warn('[Heartbeat] Erro:', error.message);
        
        if (missedHeartbeatsRef.current >= 3) {
          console.warn('[Heartbeat] Sessão expirada após 3 falhas');
          localStorage.removeItem(SESSION_TOKEN_KEY);
          onSessionExpired?.();
        }
      } else {
        missedHeartbeatsRef.current = 0;
        localStorage.setItem(LAST_HEARTBEAT_KEY, new Date().toISOString());
      }
    } catch {
      missedHeartbeatsRef.current++;
    }
  }, [onSessionExpired]);

  const start = useCallback(() => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
    }
    
    missedHeartbeatsRef.current = 0;
    sendHeartbeat();
    
    // Jitter anti-herd (0-10s)
    const jitter = Math.floor(Math.random() * 10000);
    heartbeatIntervalRef.current = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL + jitter);
  }, [sendHeartbeat]);

  const stop = useCallback(() => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => stop();
  }, [stop]);

  // Auto-start if enabled
  useEffect(() => {
    if (enabled) {
      start();
    } else {
      stop();
    }
  }, [enabled, start, stop]);

  return { start, stop, sendHeartbeat };
}
