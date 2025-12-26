// ============================================
// 🏛️ LEI III: SESSION HEARTBEAT CONTÍNUO
// Verifica sessão a cada intervalo
// Detecta mudanças de IP/país e revoga se suspeito
// ============================================

import { useEffect, useRef, useCallback, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useEnhancedFingerprint } from './useEnhancedFingerprint';
import { toast } from 'sonner';

interface HeartbeatConfig {
  intervalMs: number;           // Intervalo entre heartbeats (default: 60s)
  maxMissedHeartbeats: number;  // Máximo de heartbeats perdidos (default: 3)
  validateDeviceOnHeartbeat: boolean; // Validar dispositivo a cada heartbeat
  onSessionRevoked?: (reason: string) => void;
  onSuspiciousActivity?: (details: any) => void;
}

const DEFAULT_CONFIG: HeartbeatConfig = {
  intervalMs: 60_000, // 1 minuto
  maxMissedHeartbeats: 3,
  validateDeviceOnHeartbeat: true,
};

const SESSION_TOKEN_KEY = 'matriz_session_token';
const LAST_HEARTBEAT_KEY = 'matriz_last_heartbeat';

export function useSessionHeartbeat(config: Partial<HeartbeatConfig> = {}) {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const missedHeartbeatsRef = useRef(0);
  const [isActive, setIsActive] = useState(false);
  const [lastHeartbeat, setLastHeartbeat] = useState<Date | null>(null);
  const { collect } = useEnhancedFingerprint();

  // Função de heartbeat
  const sendHeartbeat = useCallback(async () => {
    const sessionToken = localStorage.getItem(SESSION_TOKEN_KEY);
    
    if (!sessionToken) {
      console.log('[Heartbeat] Sem session token, parando heartbeat');
      stopHeartbeat();
      return;
    }

    try {
      // Atualizar last_activity na sessão
      const { data: session, error: sessionError } = await supabase
        .from('active_sessions')
        .update({ 
          last_activity_at: new Date().toISOString(),
        })
        .eq('session_token', sessionToken)
        .eq('status', 'active')
        .select('id, user_id, device_hash, country_code, ip_address')
        .single();

      if (sessionError || !session) {
        // Sessão não encontrada ou inativa
        console.warn('[Heartbeat] Sessão inválida:', sessionError?.message);
        missedHeartbeatsRef.current++;
        
        if (missedHeartbeatsRef.current >= finalConfig.maxMissedHeartbeats) {
          // Revogar sessão local
          localStorage.removeItem(SESSION_TOKEN_KEY);
          finalConfig.onSessionRevoked?.('Sessão expirada ou revogada');
          toast.error('Sua sessão expirou', {
            description: 'Por favor, faça login novamente.',
          });
          stopHeartbeat();
          
          // Forçar logout
          await supabase.auth.signOut();
        }
        return;
      }

      // Reset contador de missed heartbeats
      missedHeartbeatsRef.current = 0;
      setLastHeartbeat(new Date());
      localStorage.setItem(LAST_HEARTBEAT_KEY, new Date().toISOString());

      // Validar dispositivo se configurado
      if (finalConfig.validateDeviceOnHeartbeat) {
        const fingerprintData = await collect();
        
        // Verificar se o fingerprint mudou drasticamente
        if (session.device_hash && session.device_hash !== fingerprintData.hash) {
          console.warn('[Heartbeat] Fingerprint mudou durante a sessão!');
          
          // Logar evento suspeito na tabela device_suspicious_events
          await supabase.from('device_suspicious_events').insert({
            user_id: session.user_id,
            device_hash: session.device_hash,
            event_type: 'fingerprint_change_during_session',
            severity: 'warning',
            description: 'Fingerprint do dispositivo mudou durante a sessão ativa',
            metadata: {
              old_hash: session.device_hash,
              new_hash: fingerprintData.hash,
              session_id: session.id,
            },
            action_taken: 'logged',
          });

          finalConfig.onSuspiciousActivity?.({
            type: 'fingerprint_change',
            message: 'Dispositivo mudou durante a sessão',
          });
        }
      }

      console.log('[Heartbeat] ✅ Heartbeat enviado com sucesso');

    } catch (error) {
      console.error('[Heartbeat] Erro:', error);
      missedHeartbeatsRef.current++;
    }
  }, [collect, finalConfig]);

  // Iniciar heartbeat
  const startHeartbeat = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    setIsActive(true);
    missedHeartbeatsRef.current = 0;

    // Primeiro heartbeat imediato
    sendHeartbeat();

    // PATCH-012: jitter anti-herd (0-10s)
    const jitter = Math.floor(Math.random() * 10000);
    const intervalWithJitter = finalConfig.intervalMs + jitter;
    intervalRef.current = setInterval(sendHeartbeat, intervalWithJitter);

    console.log(`[Heartbeat] ▶️ Iniciado (intervalo: ${intervalWithJitter}ms com jitter)`);
  }, [sendHeartbeat, finalConfig.intervalMs]);

  // Parar heartbeat
  const stopHeartbeat = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsActive(false);
    console.log('[Heartbeat] ⏹️ Parado');
  }, []);

  // Detectar mudança de visibilidade da página
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Página ficou visível - verificar última vez que enviou heartbeat
        const lastHeartbeatStr = localStorage.getItem(LAST_HEARTBEAT_KEY);
        if (lastHeartbeatStr) {
          const lastHeartbeatDate = new Date(lastHeartbeatStr);
          const timeSinceLastHeartbeat = Date.now() - lastHeartbeatDate.getTime();
          
          // Se passou mais tempo que 2x o intervalo, enviar heartbeat imediato
          if (timeSinceLastHeartbeat > finalConfig.intervalMs * 2) {
            console.log('[Heartbeat] Página voltou após muito tempo, enviando heartbeat...');
            sendHeartbeat();
          }
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [sendHeartbeat, finalConfig.intervalMs]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    startHeartbeat,
    stopHeartbeat,
    sendHeartbeat,
    isActive,
    lastHeartbeat,
    missedHeartbeats: missedHeartbeatsRef.current,
  };
}
