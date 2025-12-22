// ============================================
// 🔥 USE VIDEO FORTRESS - Hook Completo
// Sistema de Proteção de Vídeos ULTRA
// ============================================

import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

// ============================================
// TIPOS
// ============================================
export type VideoSessionStatus = 'active' | 'expired' | 'revoked' | 'ended';
export type VideoViolationType = 
  | 'devtools_open' | 'screenshot_attempt' | 'screen_recording'
  | 'multiple_sessions' | 'invalid_domain' | 'expired_token'
  | 'keyboard_shortcut' | 'context_menu' | 'drag_attempt'
  | 'copy_attempt' | 'visibility_abuse' | 'iframe_manipulation'
  | 'network_tampering' | 'unknown';

export interface VideoSession {
  sessionId: string;
  sessionCode: string;
  sessionToken: string;
  expiresAt: string;
  watermark: {
    text: string;
    hash: string;
    mode: 'moving' | 'static';
  };
  revokedPrevious: number;
}

export interface VideoFortressConfig {
  lessonId?: string;
  courseId?: string;
  provider?: 'youtube' | 'panda';
  videoId: string;
  ttlMinutes?: number;
  enableHeartbeat?: boolean;
  heartbeatInterval?: number;
  enableViolationDetection?: boolean;
  onSessionRevoked?: () => void;
  onSessionExpired?: () => void;
  onViolation?: (type: VideoViolationType, action: string) => void;
}

interface UseVideoFortressReturn {
  session: VideoSession | null;
  isLoading: boolean;
  error: string | null;
  isActive: boolean;
  riskScore: number;
  startSession: () => Promise<boolean>;
  endSession: (position?: number, completion?: number) => Promise<void>;
  reportViolation: (type: VideoViolationType, severity?: number, details?: Record<string, any>) => Promise<void>;
  sendHeartbeat: (position?: number) => Promise<void>;
  watermarkData: { text: string; hash: string } | null;
}

// ============================================
// HOOK PRINCIPAL
// ============================================
export const useVideoFortress = (config: VideoFortressConfig): UseVideoFortressReturn => {
  const { user } = useAuth();
  const [session, setSession] = useState<VideoSession | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [riskScore, setRiskScore] = useState(0);
  
  const heartbeatRef = useRef<NodeJS.Timeout | null>(null);
  const sessionTokenRef = useRef<string | null>(null);

  const {
    lessonId,
    courseId,
    provider = 'panda',
    videoId,
    ttlMinutes = 5,
    enableHeartbeat = true,
    heartbeatInterval = 30000, // 30 segundos
    enableViolationDetection = true,
    onSessionRevoked,
    onSessionExpired,
    onViolation,
  } = config;

  // ============================================
  // CRIAR SESSÃO
  // ============================================
  const startSession = useCallback(async (): Promise<boolean> => {
    if (!user?.id || !videoId) {
      setError('Usuário não autenticado ou videoId não fornecido');
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Obter fingerprint do dispositivo
      const deviceFingerprint = await generateDeviceFingerprint();
      
      const { data, error: rpcError } = await supabase.rpc('create_video_session', {
        p_user_id: user.id,
        p_lesson_id: lessonId || null,
        p_course_id: courseId || null,
        p_provider: provider,
        p_provider_video_id: videoId,
        p_device_fingerprint: deviceFingerprint,
        p_ttl_minutes: ttlMinutes,
      });

      if (rpcError) throw rpcError;
      
      const result = data as Record<string, any>;
      
      if (!result.success) {
        if (result.error === 'USER_BANNED') {
          toast.error('🚫 Acesso bloqueado', {
            description: 'Você foi banido por violações de segurança.',
          });
          setError('USER_BANNED');
          return false;
        }
        throw new Error(result.error || 'Erro ao criar sessão');
      }

      const newSession: VideoSession = {
        sessionId: result.session_id,
        sessionCode: result.session_code,
        sessionToken: result.session_token,
        expiresAt: result.expires_at,
        watermark: result.watermark,
        revokedPrevious: result.revoked_previous || 0,
      };

      setSession(newSession);
      sessionTokenRef.current = newSession.sessionToken;

      // Iniciar heartbeat se habilitado
      if (enableHeartbeat) {
        startHeartbeat();
      }

      // Iniciar detecção de violações
      if (enableViolationDetection) {
        startViolationDetection();
      }

      return true;
    } catch (err: any) {
      console.error('[VideoFortress] Erro ao criar sessão:', err);
      setError(err.message);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [user, videoId, lessonId, courseId, provider, ttlMinutes, enableHeartbeat, enableViolationDetection]);

  // ============================================
  // HEARTBEAT
  // ============================================
  const sendHeartbeat = useCallback(async (position?: number): Promise<void> => {
    if (!sessionTokenRef.current) return;

    try {
      const { data, error: rpcError } = await supabase.rpc('video_session_heartbeat', {
        p_session_token: sessionTokenRef.current,
        p_position_seconds: position || null,
      });

      if (rpcError) throw rpcError;
      
      const result = data as Record<string, any>;
      
      if (!result.success) {
        if (result.error === 'SESSION_REVOKED') {
          stopHeartbeat();
          toast.warning('⚠️ Sessão encerrada', {
            description: 'Você iniciou outra sessão em outro dispositivo.',
          });
          onSessionRevoked?.();
          setSession(null);
        } else if (result.error === 'SESSION_EXPIRED') {
          stopHeartbeat();
          onSessionExpired?.();
          setSession(null);
        }
      }
    } catch (err) {
      console.error('[VideoFortress] Erro no heartbeat:', err);
    }
  }, [onSessionRevoked, onSessionExpired]);

  const startHeartbeat = useCallback(() => {
    stopHeartbeat();
    heartbeatRef.current = setInterval(() => {
      sendHeartbeat();
    }, heartbeatInterval);
  }, [heartbeatInterval, sendHeartbeat]);

  const stopHeartbeat = useCallback(() => {
    if (heartbeatRef.current) {
      clearInterval(heartbeatRef.current);
      heartbeatRef.current = null;
    }
  }, []);

  // ============================================
  // FINALIZAR SESSÃO
  // ============================================
  const endSession = useCallback(async (position?: number, completion?: number): Promise<void> => {
    if (!sessionTokenRef.current) return;

    stopHeartbeat();

    try {
      await supabase.rpc('end_video_session', {
        p_session_token: sessionTokenRef.current,
        p_final_position: position || null,
        p_completion_percentage: completion || null,
      });
    } catch (err) {
      console.error('[VideoFortress] Erro ao finalizar sessão:', err);
    } finally {
      setSession(null);
      sessionTokenRef.current = null;
    }
  }, [stopHeartbeat]);

  // ============================================
  // REPORTAR VIOLAÇÃO
  // ============================================
  const reportViolation = useCallback(async (
    type: VideoViolationType,
    severity: number = 1,
    details?: Record<string, any>
  ): Promise<void> => {
    if (!sessionTokenRef.current) return;

    try {
      const { data, error: rpcError } = await supabase.rpc('register_video_violation', {
        p_session_token: sessionTokenRef.current,
        p_violation_type: type,
        p_severity: severity,
        p_details: details || null,
      });

      if (rpcError) throw rpcError;
      
      const result = data as Record<string, any>;
      
      if (result.success) {
        setRiskScore(result.new_risk_score || 0);
        
        if (result.action_taken && result.action_taken !== 'none') {
          onViolation?.(type, result.action_taken);
          
          if (result.action_taken === 'warn') {
            toast.warning('⚠️ Atividade suspeita detectada');
          } else if (result.action_taken === 'pause') {
            toast.error('🛑 Vídeo pausado por segurança');
          } else if (result.session_revoked) {
            toast.error('🚫 Sessão encerrada por violação de segurança');
            stopHeartbeat();
            setSession(null);
          }
        }
      }
    } catch (err) {
      console.error('[VideoFortress] Erro ao reportar violação:', err);
    }
  }, [onViolation, stopHeartbeat]);

  // ============================================
  // DETECÇÃO DE VIOLAÇÕES
  // ============================================
  const startViolationDetection = useCallback(() => {
    // Detectar DevTools
    const checkDevTools = () => {
      const threshold = 160;
      const widthDiff = window.outerWidth - window.innerWidth > threshold;
      const heightDiff = window.outerHeight - window.innerHeight > threshold;
      
      if (widthDiff || heightDiff) {
        reportViolation('devtools_open', 3);
      }
    };

    // Bloquear atalhos perigosos
    const handleKeydown = (e: KeyboardEvent) => {
      const isCtrl = e.ctrlKey || e.metaKey;
      const isShift = e.shiftKey;
      const key = e.key.toLowerCase();

      if (isCtrl && (key === 's' || key === 'p' || key === 'u')) {
        e.preventDefault();
        reportViolation('keyboard_shortcut', 2, { key: e.key });
      }
      
      if (e.key === 'F12') {
        e.preventDefault();
        reportViolation('devtools_open', 3);
      }
      
      if (isCtrl && isShift && (key === 'i' || key === 'j' || key === 'c')) {
        e.preventDefault();
        reportViolation('devtools_open', 4);
      }
    };

    // Bloquear menu de contexto
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      reportViolation('context_menu', 1);
    };

    // Detectar print screen
    const handleKeyup = (e: KeyboardEvent) => {
      if (e.key === 'PrintScreen') {
        reportViolation('screenshot_attempt', 5);
        toast.error('📸 Captura de tela detectada e registrada!');
      }
    };

    // Detectar visibility change (anti-gravação)
    const handleVisibilityChange = () => {
      if (document.hidden) {
        reportViolation('visibility_abuse', 1, { reason: 'tab_hidden' });
      }
    };

    // Listeners
    window.addEventListener('keydown', handleKeydown);
    window.addEventListener('keyup', handleKeyup);
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    const devToolsInterval = setInterval(checkDevTools, 2000);

    return () => {
      window.removeEventListener('keydown', handleKeydown);
      window.removeEventListener('keyup', handleKeyup);
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(devToolsInterval);
    };
  }, [reportViolation]);

  // Cleanup ao desmontar
  useEffect(() => {
    return () => {
      stopHeartbeat();
    };
  }, [stopHeartbeat]);

  return {
    session,
    isLoading,
    error,
    isActive: !!session && session.expiresAt > new Date().toISOString(),
    riskScore,
    startSession,
    endSession,
    reportViolation,
    sendHeartbeat,
    watermarkData: session ? { text: session.watermark.text, hash: session.watermark.hash } : null,
  };
};

// ============================================
// UTILS
// ============================================
async function generateDeviceFingerprint(): Promise<string> {
  const components = [
    navigator.userAgent,
    navigator.language,
    screen.width + 'x' + screen.height,
    new Date().getTimezoneOffset(),
    navigator.hardwareConcurrency || 0,
  ];
  
  const fingerprint = components.join('|');
  const encoder = new TextEncoder();
  const data = encoder.encode(fingerprint);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export default useVideoFortress;
