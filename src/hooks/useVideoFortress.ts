// ============================================
// 🔥 USE VIDEO FORTRESS v3.0 - ULTRA SECURED
// Sistema de Proteção de Vídeos MÁXIMO
// Integrado com useRolePermissions + SANCTUM
// ============================================

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useRolePermissions } from '@/hooks/useRolePermissions';
import { toast } from 'sonner';

// ============================================
// TIPOS
// ============================================
export type VideoSessionStatus = 'active' | 'expired' | 'revoked' | 'ended';

// Tipos de violação que existem no banco de dados
export type VideoViolationType = 
  | 'devtools_open' | 'screenshot_attempt' | 'screen_recording'
  | 'multiple_sessions' | 'invalid_domain' | 'expired_token'
  | 'keyboard_shortcut' | 'context_menu' | 'drag_attempt'
  | 'copy_attempt' | 'visibility_abuse' | 'iframe_manipulation'
  | 'network_tampering' | 'unknown';

// Tipos internos para detecção (mapeados para 'unknown' ao enviar ao banco)
type InternalViolationType = VideoViolationType | 'extension_detected' | 'automation_detected' | 'debugger_detected' | 'console_open';

export type ViolationAction = 'none' | 'warn' | 'degrade' | 'pause' | 'revoke';

// Função para mapear tipos internos para tipos do banco
function mapViolationType(type: InternalViolationType): VideoViolationType {
  const internalTypes = ['extension_detected', 'automation_detected', 'debugger_detected', 'console_open'];
  return internalTypes.includes(type) ? 'unknown' : type as VideoViolationType;
}

export interface VideoSession {
  sessionId: string;
  sessionCode: string;
  sessionToken: string;
  expiresAt: string;
  watermark: {
    text: string;
    hash: string;
    mode: 'moving' | 'static' | 'diagonal';
  };
  revokedPrevious: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

export interface VideoFortressConfig {
  lessonId?: string;
  courseId?: string;
  provider?: 'youtube' | 'panda' | 'vimeo';
  videoId: string;
  ttlMinutes?: number;
  enableHeartbeat?: boolean;
  heartbeatInterval?: number;
  enableViolationDetection?: boolean;
  enableAntiDevTools?: boolean;
  enableAntiScreenshot?: boolean;
  enableAntiExtensions?: boolean;
  sanctumBypass?: boolean; // Para roles imunes
  onSessionRevoked?: () => void;
  onSessionExpired?: () => void;
  onViolation?: (type: VideoViolationType, action: ViolationAction) => void;
  onRiskLevelChange?: (level: 'low' | 'medium' | 'high' | 'critical') => void;
}

interface UseVideoFortressReturn {
  session: VideoSession | null;
  isLoading: boolean;
  error: string | null;
  isActive: boolean;
  riskScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  isImmune: boolean; // SANCTUM: roles imunes
  startSession: () => Promise<boolean>;
  endSession: (position?: number, completion?: number) => Promise<void>;
  reportViolation: (type: VideoViolationType, severity?: number, details?: Record<string, any>) => Promise<void>;
  sendHeartbeat: (position?: number) => Promise<void>;
  pauseVideo: () => void;
  resumeVideo: () => void;
  watermarkData: { text: string; hash: string; mode: string } | null;
  protectionStats: {
    violationsBlocked: number;
    heartbeatsSent: number;
    sessionDuration: number;
  };
}

// ============================================
// CONSTANTES
// ============================================
const IMMUNE_ROLES = ['owner', 'admin', 'funcionario', 'suporte', 'coordenacao'];
const SANCTUM_THRESHOLDS = {
  warn: 30,
  degrade: 60,
  pause: 100,
  revoke: 200,
};

// ============================================
// HOOK PRINCIPAL
// ============================================
export const useVideoFortress = (config: VideoFortressConfig): UseVideoFortressReturn => {
  const { user } = useAuth();
  const { role, isOwner, isAdmin, isFuncionarioOrAbove } = useRolePermissions();
  
  const [session, setSession] = useState<VideoSession | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [riskScore, setRiskScore] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [protectionStats, setProtectionStats] = useState({
    violationsBlocked: 0,
    heartbeatsSent: 0,
    sessionDuration: 0,
  });
  
  const heartbeatRef = useRef<NodeJS.Timeout | null>(null);
  const sessionTokenRef = useRef<string | null>(null);
  const sessionStartRef = useRef<number | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);
  const pauseCallbackRef = useRef<(() => void) | null>(null);
  const resumeCallbackRef = useRef<(() => void) | null>(null);

  const {
    lessonId,
    courseId,
    provider = 'panda',
    videoId,
    ttlMinutes = 5,
    enableHeartbeat = true,
    heartbeatInterval = 30000,
    enableViolationDetection = true,
    enableAntiDevTools = true,
    enableAntiScreenshot = true,
    enableAntiExtensions = true,
    sanctumBypass,
    onSessionRevoked,
    onSessionExpired,
    onViolation,
    onRiskLevelChange,
  } = config;

  // ============================================
  // SANCTUM: Verificar imunidade por role
  // ============================================
  const isImmune = useMemo(() => {
    if (sanctumBypass) return true;
    if (isOwner || isAdmin) return true;
    if (isFuncionarioOrAbove) return true;
    return IMMUNE_ROLES.includes(role || '');
  }, [role, isOwner, isAdmin, isFuncionarioOrAbove, sanctumBypass]);

  // ============================================
  // CALCULAR RISK LEVEL
  // ============================================
  const riskLevel = useMemo((): 'low' | 'medium' | 'high' | 'critical' => {
    if (isImmune) return 'low';
    if (riskScore >= 1000) return 'critical';
    if (riskScore >= 500) return 'high';
    if (riskScore >= 200) return 'medium';
    return 'low';
  }, [riskScore, isImmune]);

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
        watermark: {
          ...result.watermark,
          mode: isImmune ? 'static' : 'moving',
        },
        revokedPrevious: result.revoked_previous || 0,
        riskLevel: 'low',
      };

      setSession(newSession);
      sessionTokenRef.current = newSession.sessionToken;
      sessionStartRef.current = Date.now();

      // Notificar sobre sessões revogadas
      if (newSession.revokedPrevious > 0) {
        toast.info(`📱 ${newSession.revokedPrevious} sessão(ões) anterior(es) encerrada(s)`);
      }

      // Iniciar heartbeat
      if (enableHeartbeat) {
        startHeartbeat();
      }

      // Iniciar proteções (se não for imune)
      if (enableViolationDetection && !isImmune) {
        cleanupRef.current = startViolationDetection();
      }

      console.log('[VideoFortress] ✅ Sessão criada:', newSession.sessionCode);
      return true;
    } catch (err: any) {
      console.error('[VideoFortress] ❌ Erro ao criar sessão:', err);
      setError(err.message);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [user, videoId, lessonId, courseId, provider, ttlMinutes, enableHeartbeat, enableViolationDetection, isImmune]);

  // ============================================
  // HEARTBEAT - Manter sessão viva
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
      
      setProtectionStats(prev => ({
        ...prev,
        heartbeatsSent: prev.heartbeatsSent + 1,
        sessionDuration: sessionStartRef.current ? Math.floor((Date.now() - sessionStartRef.current) / 1000) : 0,
      }));
      
      if (!result.success) {
        if (result.error === 'SESSION_REVOKED') {
          handleSessionEnd('revoked');
          toast.warning('⚠️ Sessão encerrada', {
            description: 'Você iniciou outra sessão em outro dispositivo.',
          });
          onSessionRevoked?.();
        } else if (result.error === 'SESSION_EXPIRED') {
          handleSessionEnd('expired');
          onSessionExpired?.();
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
  const handleSessionEnd = useCallback((reason: 'ended' | 'revoked' | 'expired') => {
    stopHeartbeat();
    cleanupRef.current?.();
    setSession(null);
    sessionTokenRef.current = null;
    console.log(`[VideoFortress] Sessão finalizada: ${reason}`);
  }, [stopHeartbeat]);

  const endSession = useCallback(async (position?: number, completion?: number): Promise<void> => {
    if (!sessionTokenRef.current) return;

    stopHeartbeat();
    cleanupRef.current?.();

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
  // REPORTAR VIOLAÇÃO - SANCTUM 2.0
  // ============================================
  const reportViolation = useCallback(async (
    type: VideoViolationType,
    severity: number = 1,
    details?: Record<string, any>
  ): Promise<void> => {
    // SANCTUM: Usuários imunes apenas logam, sem penalidade
    if (isImmune) {
      console.log(`[VideoFortress/SANCTUM] 🛡️ Violação ignorada (role imune): ${type}`);
      return;
    }

    if (!sessionTokenRef.current) return;

    setProtectionStats(prev => ({
      ...prev,
      violationsBlocked: prev.violationsBlocked + 1,
    }));

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
        const newScore = result.new_risk_score || 0;
        setRiskScore(newScore);
        
        const action = result.action_taken as ViolationAction;
        if (action && action !== 'none') {
          onViolation?.(type, action);
          
          // Notificar sobre nível de risco
          if (newScore >= SANCTUM_THRESHOLDS.pause) {
            onRiskLevelChange?.('critical');
          } else if (newScore >= SANCTUM_THRESHOLDS.degrade) {
            onRiskLevelChange?.('high');
          } else if (newScore >= SANCTUM_THRESHOLDS.warn) {
            onRiskLevelChange?.('medium');
          }
          
          // Ações baseadas no resultado
          switch (action) {
            case 'warn':
              toast.warning('⚠️ Atividade suspeita detectada', {
                description: 'Comportamento sendo monitorado.',
              });
              break;
            case 'degrade':
              toast.warning('🔻 Qualidade reduzida por segurança');
              break;
            case 'pause':
              toast.error('🛑 Vídeo pausado por segurança');
              setIsPaused(true);
              pauseCallbackRef.current?.();
              break;
          }
          
          if (result.session_revoked) {
            toast.error('🚫 Sessão encerrada por violação');
            handleSessionEnd('revoked');
          }
        }
      }
    } catch (err) {
      console.error('[VideoFortress] Erro ao reportar violação:', err);
    }
  }, [isImmune, onViolation, onRiskLevelChange, handleSessionEnd]);

  // ============================================
  // DETECÇÃO DE VIOLAÇÕES - ULTRA
  // ============================================
  const startViolationDetection = useCallback(() => {
    const cleanupFns: (() => void)[] = [];

    // 1. DevTools Detection (múltiplos métodos)
    if (enableAntiDevTools) {
      // Método 1: Diferença de dimensões
      const checkDevTools = () => {
        const threshold = 160;
        const widthDiff = window.outerWidth - window.innerWidth > threshold;
        const heightDiff = window.outerHeight - window.innerHeight > threshold;
        
        if (widthDiff || heightDiff) {
          reportViolation('devtools_open', 3, { method: 'dimension' });
        }
      };

      // Método 2: Debugger detection - DESATIVADO
      // O statement "debugger" pausa a execução e bloqueia player de vídeo
      // Mantendo apenas detecção por dimensões (não bloqueia)
      const checkDebugger = () => {
        // Desativado: debugger statement causava bloqueio do player
      };

      // Método 3: Console.log timing
      const checkConsole = () => {
        const element = new Image();
        Object.defineProperty(element, 'id', {
          get: function() {
            reportViolation('devtools_open', 2, { method: 'console_object' });
            return 'devtools-check';
          }
        });
        console.log('%c', element as any);
      };

      const devToolsInterval = setInterval(() => {
        checkDevTools();
        // checkConsole(); // Comentado pois pode causar spam
      }, 3000);

      cleanupFns.push(() => clearInterval(devToolsInterval));
    }

    // 2. Keyboard Shortcuts Blocking
    const handleKeydown = (e: KeyboardEvent) => {
      const isCtrl = e.ctrlKey || e.metaKey;
      const isShift = e.shiftKey;
      const isAlt = e.altKey;
      const key = e.key.toLowerCase();

      // 🚨 PROTEÇÃO DEVTOOLS DESATIVADA POR ORDEM DO OWNER (2026-01-06)
      // F12 - PERMITIDO
      // Ctrl+Shift+I/J/C (DevTools) - PERMITIDO

      // Ctrl+S/P/U (Save/Print/Source)
      if (isCtrl && ['s', 'p', 'u'].includes(key)) {
        e.preventDefault();
        reportViolation('keyboard_shortcut', 2, { key: `Ctrl+${key.toUpperCase()}` });
        return;
      }

      // Ctrl+Shift+S (Screenshot em alguns sistemas)
      if (isCtrl && isShift && key === 's') {
        e.preventDefault();
        reportViolation('screenshot_attempt', 4);
        return;
      }
    };

    const handleKeyup = (e: KeyboardEvent) => {
      if (e.key === 'PrintScreen') {
        reportViolation('screenshot_attempt', 5);
        toast.error('📸 Captura de tela detectada!', {
          description: 'Esta ação foi registrada.',
        });
      }
    };

    window.addEventListener('keydown', handleKeydown);
    window.addEventListener('keyup', handleKeyup);
    cleanupFns.push(() => {
      window.removeEventListener('keydown', handleKeydown);
      window.removeEventListener('keyup', handleKeyup);
    });

    // 3. Context Menu Blocking (Desktop + Mobile)
    const handleContextMenu = (e: MouseEvent | TouchEvent) => {
      e.preventDefault();
      reportViolation('context_menu', 1);
    };

    document.addEventListener('contextmenu', handleContextMenu);
    cleanupFns.push(() => document.removeEventListener('contextmenu', handleContextMenu));

    // 4. Visibility Change (Tab switching) - Desktop + Mobile
    const handleVisibilityChange = () => {
      if (document.hidden) {
        reportViolation('visibility_abuse', 1, { reason: 'tab_hidden' });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    cleanupFns.push(() => document.removeEventListener('visibilitychange', handleVisibilityChange));

    // 5. Copy/Drag Prevention
    const handleCopy = (e: ClipboardEvent) => {
      e.preventDefault();
      reportViolation('copy_attempt', 2);
    };

    const handleDragStart = (e: DragEvent) => {
      e.preventDefault();
      reportViolation('drag_attempt', 1);
    };

    document.addEventListener('copy', handleCopy);
    document.addEventListener('dragstart', handleDragStart);
    cleanupFns.push(() => {
      document.removeEventListener('copy', handleCopy);
      document.removeEventListener('dragstart', handleDragStart);
    });

    // ============================================
    // 📱 PROTEÇÕES ESPECÍFICAS PARA MOBILE/TOUCH
    // ============================================
    
    // 6.a Long-press blocking (iOS/Android)
    let longPressTimer: NodeJS.Timeout | null = null;
    const handleTouchStart = (e: TouchEvent) => {
      // Detectar multi-touch (possível screenshot gesture)
      if (e.touches.length >= 3) {
        e.preventDefault();
        reportViolation('screenshot_attempt', 4, { method: 'multi_touch_3fingers' });
      }
      
      // Long-press detection
      longPressTimer = setTimeout(() => {
        reportViolation('context_menu', 1, { method: 'long_press_touch' });
      }, 400);
    };
    
    const handleTouchEnd = () => {
      if (longPressTimer) {
        clearTimeout(longPressTimer);
        longPressTimer = null;
      }
    };
    
    const handleTouchMove = () => {
      if (longPressTimer) {
        clearTimeout(longPressTimer);
        longPressTimer = null;
      }
    };
    
    document.addEventListener('touchstart', handleTouchStart, { capture: true, passive: false });
    document.addEventListener('touchend', handleTouchEnd, { capture: true });
    document.addEventListener('touchmove', handleTouchMove, { capture: true });
    cleanupFns.push(() => {
      document.removeEventListener('touchstart', handleTouchStart, { capture: true });
      document.removeEventListener('touchend', handleTouchEnd, { capture: true });
      document.removeEventListener('touchmove', handleTouchMove, { capture: true });
      if (longPressTimer) clearTimeout(longPressTimer);
    });
    
    // 6.b iOS Gesture blocking (Safari)
    const handleGesture = (e: Event) => {
      e.preventDefault();
      reportViolation('screenshot_attempt', 3, { method: 'ios_gesture' });
    };
    
    document.addEventListener('gesturestart', handleGesture, { capture: true });
    document.addEventListener('gesturechange', handleGesture, { capture: true });
    cleanupFns.push(() => {
      document.removeEventListener('gesturestart', handleGesture, { capture: true });
      document.removeEventListener('gesturechange', handleGesture, { capture: true });
    });
    
    // 6.c iOS Screenshot detection (blur event)
    const handleBlur = () => {
      // iOS dispara blur muito rapidamente quando screenshot é tirado
      setTimeout(() => {
        if (document.hidden || !document.hasFocus()) {
          reportViolation('screenshot_attempt', 2, { method: 'ios_blur_detection' });
        }
      }, 50);
    };
    
    window.addEventListener('blur', handleBlur);
    cleanupFns.push(() => window.removeEventListener('blur', handleBlur));

    // 6. Extension Detection (Chrome/Firefox)
    if (enableAntiExtensions) {
      const checkExtensions = () => {
        // Detectar extensões conhecidas de download/gravação
        const suspiciousElements = document.querySelectorAll('[id*="video-download"], [class*="video-download"], [data-extension]');
        if (suspiciousElements.length > 0) {
          reportViolation('unknown', 4, { reason: 'extension_detected', count: suspiciousElements.length });
        }
      };

      // PATCH-025: jitter anti-herd (0-3s)
      const extensionJitter = Math.floor(Math.random() * 3000);
      const extensionInterval = setInterval(checkExtensions, 10000 + extensionJitter);
      cleanupFns.push(() => clearInterval(extensionInterval));
    }

    // 7. Automation Detection
    const detectAutomation = () => {
      const isAutomated = 
        (navigator as any).webdriver ||
        (window as any).__selenium_unwrapped ||
        (window as any).__webdriver_evaluate ||
        (document as any).__webdriver_unwrapped;
      
      if (isAutomated) {
        reportViolation('unknown', 8, { reason: 'automation_detected' });
      }
    };

    detectAutomation();
    const automationInterval = setInterval(detectAutomation, 30000);
    cleanupFns.push(() => clearInterval(automationInterval));

    // Retornar função de cleanup
    return () => {
      cleanupFns.forEach(fn => fn());
    };
  }, [enableAntiDevTools, enableAntiExtensions, reportViolation]);

  // ============================================
  // CONTROLES DE VÍDEO
  // ============================================
  const pauseVideo = useCallback(() => {
    setIsPaused(true);
    pauseCallbackRef.current?.();
  }, []);

  const resumeVideo = useCallback(() => {
    if (riskLevel === 'critical') {
      toast.error('Não é possível continuar. Risco muito alto.');
      return;
    }
    setIsPaused(false);
    resumeCallbackRef.current?.();
  }, [riskLevel]);

  // ============================================
  // CLEANUP
  // ============================================
  useEffect(() => {
    return () => {
      stopHeartbeat();
      cleanupRef.current?.();
    };
  }, [stopHeartbeat]);

  // ============================================
  // RETURN
  // ============================================
  return {
    session,
    isLoading,
    error,
    isActive: !!session && session.expiresAt > new Date().toISOString() && !isPaused,
    riskScore,
    riskLevel,
    isImmune,
    startSession,
    endSession,
    reportViolation,
    sendHeartbeat,
    pauseVideo,
    resumeVideo,
    watermarkData: session ? {
      text: session.watermark.text,
      hash: session.watermark.hash,
      mode: session.watermark.mode,
    } : null,
    protectionStats,
  };
};

// ============================================
// UTILS
// ============================================
async function generateDeviceFingerprint(): Promise<string> {
  // Patch: nunca bloquear player por falha de fingerprint
  try {
    if (typeof window === 'undefined') return 'server';

    const components = [
      navigator.userAgent,
      navigator.language,
      navigator.languages?.join(','),
      screen.width + 'x' + screen.height,
      screen.colorDepth,
      new Date().getTimezoneOffset(),
      navigator.hardwareConcurrency || 0,
      (navigator as any).deviceMemory || 0,
      navigator.platform,
      (performance as any).memory?.jsHeapSizeLimit || 0,
    ];

    // Canvas fingerprint (best-effort)
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.textBaseline = 'top';
        ctx.font = '14px Arial';
        ctx.fillText('VideoFortress', 2, 2);
        components.push(canvas.toDataURL());
      }
    } catch {
      // ignore
    }

    const fingerprint = components.join('|');
    const encoder = new TextEncoder();
    const data = encoder.encode(fingerprint);

    // crypto.subtle pode não existir em contextos inseguros; fallback determinístico
    if (!globalThis.crypto?.subtle?.digest) {
      return `no-subtle-${data.length}-${Math.abs(new Date().getTimezoneOffset())}`;
    }

    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

  } catch (e) {
    console.warn('[VideoFortress] Fingerprint fallback due to error:', e);
    return `fp-fallback-${Date.now()}`;
  }
}

export default useVideoFortress;
