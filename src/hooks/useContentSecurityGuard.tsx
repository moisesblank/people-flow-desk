// ============================================
// 🛡️ CONTENT SECURITY GUARD - UNIVERSAL v1.0
// Proteção anti-PrintScreen/DevTools para TODO conteúdo
// Extração do useBookSecurityGuard para uso universal
// OWNER BYPASS ALWAYS
// ============================================

import { useEffect, useRef, useCallback, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { antiDebugger } from '@/lib/security/antiDebugger';

// 🛡️ DEPRECATED: OWNER_EMAIL removido - usar isOwner via role='owner'
// const OWNER_EMAIL = 'moisesblank@gmail.com';

// ═══════════════════════════════════════════════════════════
// TECLAS DE PRINT SCREEN (múltiplos formatos)
// ═══════════════════════════════════════════════════════════
const PRINT_SCREEN_KEYS = ['PrintScreen', 'PrtSc', 'PrtScn', 'Print', 'Snapshot'];

// ═══════════════════════════════════════════════════════════
// TECLAS BLOQUEADAS
// ═══════════════════════════════════════════════════════════
const BLOCKED_SHORTCUTS = [
  // DevTools Windows/Linux
  { key: 'F12', ctrl: false, shift: false, meta: false },
  { key: 'F12', ctrl: true, shift: false, meta: false },
  { key: 'I', ctrl: true, shift: true, meta: false },
  { key: 'J', ctrl: true, shift: true, meta: false },
  { key: 'C', ctrl: true, shift: true, meta: false },
  { key: 'U', ctrl: true, shift: false, meta: false },
  { key: 'S', ctrl: true, shift: false, meta: false }, // Save
  { key: 'P', ctrl: true, shift: false, meta: false }, // Print
  
  // DevTools macOS
  { key: 'I', ctrl: false, shift: false, meta: true, alt: true },
  { key: 'J', ctrl: false, shift: false, meta: true, alt: true },
  { key: 'C', ctrl: false, shift: false, meta: true, alt: true },
  { key: 'U', ctrl: false, shift: false, meta: true },
  { key: 'S', ctrl: false, shift: false, meta: true }, // Cmd+S
  { key: 'P', ctrl: false, shift: false, meta: true }, // Cmd+P
  
  // macOS Screenshots
  { key: '3', ctrl: false, shift: true, meta: true }, // Cmd+Shift+3
  { key: '4', ctrl: false, shift: true, meta: true }, // Cmd+Shift+4
  { key: '5', ctrl: false, shift: true, meta: true }, // Cmd+Shift+5
  { key: '6', ctrl: false, shift: true, meta: true }, // Cmd+Shift+6
];

// ═══════════════════════════════════════════════════════════
// CONFIGURAÇÃO DE ESCALONAMENTO
// ═══════════════════════════════════════════════════════════
const ESCALATION_CONFIG = {
  WINDOW_MS: 5 * 60 * 1000,
  LEVEL_1_TOAST: 1,
  LEVEL_2_OVERLAY: 2,
  LEVEL_3_SESSION_END: 5,
  OVERLAY_DURATION_MS: 5000,
};

export interface UseContentSecurityGuardOptions {
  /** Identificador do conteúdo (bookId, materialId, etc) */
  contentId: string;
  /** Tipo do conteúdo para logs */
  contentType: 'book' | 'material' | 'pdf' | 'video' | 'course';
  /** Título do conteúdo */
  contentTitle?: string;
  /** Se o usuário é owner (bypass) */
  isOwner?: boolean;
  /** ID do usuário */
  userId?: string;
  /** Email do usuário */
  userEmail?: string;
  /** Nome do usuário */
  userName?: string;
  /** Se deve ativar os listeners */
  enabled?: boolean;
  /** Callback ao detectar violação */
  onViolation?: (type: string) => void;
  /** Callback ao encerrar sessão */
  onSessionEnd?: () => void;
}

interface ViolationAttempt {
  timestamp: number;
  type: string;
}

export function useContentSecurityGuard({
  contentId,
  contentType,
  contentTitle,
  isOwner: isOwnerProp,
  userId,
  userEmail,
  userName,
  enabled = true,
  onViolation,
  onSessionEnd,
}: UseContentSecurityGuardOptions) {
  const { user, role } = useAuth();
  
  // Detectar owner automaticamente se não passado - 🛡️ v2: via role='owner'
  const isOwner = isOwnerProp ?? role === 'owner';
  
  const isOwnerRef = useRef(isOwner);
  const warningThrottleRef = useRef(false);
  const violationCountRef = useRef(0);
  
  const [showSevereOverlay, setShowSevereOverlay] = useState(false);
  const attemptsRef = useRef<ViolationAttempt[]>([]);
  const antiDebugCleanupRef = useRef<(() => void) | null>(null);

  // Atualizar ref quando isOwner mudar
  useEffect(() => {
    isOwnerRef.current = isOwner;
  }, [isOwner]);

  // ═══════════════════════════════════════════════════════════
  // ANTI-DEBUGGER AGRESSIVO
  // ═══════════════════════════════════════════════════════════
  useEffect(() => {
    if (!enabled) return;
    if (isOwner) {
      antiDebugger.setOwnerMode(userEmail || user?.email);
      return;
    }
    
    // Inicializar anti-debugger
    antiDebugCleanupRef.current = antiDebugger.init(userEmail || user?.email);
    
    // Ativar modo agressivo para páginas de conteúdo
    antiDebugger.enableAggressiveMode();
    
    return () => {
      if (antiDebugCleanupRef.current) {
        antiDebugCleanupRef.current();
      }
    };
  }, [enabled, isOwner, userEmail, user?.email]);

  // ═══════════════════════════════════════════════════════════
  // CONTAR TENTATIVAS NA JANELA DE TEMPO
  // ═══════════════════════════════════════════════════════════
  const getRecentAttempts = useCallback(() => {
    const now = Date.now();
    const windowStart = now - ESCALATION_CONFIG.WINDOW_MS;
    attemptsRef.current = attemptsRef.current.filter(a => a.timestamp > windowStart);
    return attemptsRef.current.length;
  }, []);

  const addAttempt = useCallback((type: string) => {
    attemptsRef.current.push({
      timestamp: Date.now(),
      type,
    });
    return getRecentAttempts();
  }, [getRecentAttempts]);

  // ═══════════════════════════════════════════════════════════
  // LOG DE VIOLAÇÃO NO BACKEND
  // ═══════════════════════════════════════════════════════════
  const logViolation = useCallback(async (violationType: string, metadata?: Record<string, unknown>) => {
    if (isOwnerRef.current) return;
    
    violationCountRef.current += 1;
    
    try {
      // Log genérico em book_access_logs (pode ser expandido)
      await supabase.from('book_access_logs').insert({
        book_id: contentType === 'book' ? contentId : null,
        book_title: contentTitle || 'Unknown',
        user_id: userId || user?.id,
        user_email: userEmail || user?.email,
        user_name: userName || user?.user_metadata?.name,
        event_type: 'security_violation',
        is_violation: true,
        violation_type: violationType,
        event_description: `[${contentType.toUpperCase()}] Tentativa de ${violationType} detectada`,
        metadata: {
          ...metadata,
          content_type: contentType,
          content_id: contentId,
          violation_count: violationCountRef.current,
          attempts_in_window: getRecentAttempts(),
          timestamp: new Date().toISOString(),
          user_agent: navigator.userAgent,
        },
      });
    } catch (err) {
      console.error('[ContentSecurityGuard] Erro ao logar violação:', err);
    }

    onViolation?.(violationType);
  }, [contentId, contentType, contentTitle, userId, userEmail, userName, user, onViolation, getRecentAttempts]);

  // ═══════════════════════════════════════════════════════════
  // RESPOSTA ESCALONADA
  // ═══════════════════════════════════════════════════════════
  const handleEscalatedResponse = useCallback((type: 'screenshot' | 'devtools' | 'print') => {
    if (isOwnerRef.current) return;
    
    const attemptCount = addAttempt(type);
    
    console.log(`[ContentSecurityGuard] Tentativa #${attemptCount} de ${type}`);
    
    // NÍVEL 3: SESSÃO ENCERRADA (5+ tentativas)
    if (attemptCount >= ESCALATION_CONFIG.LEVEL_3_SESSION_END) {
      toast.error('Sessão encerrada por violações repetidas', {
        duration: 5000,
        icon: '🚫',
        description: 'Você será redirecionado para login.',
      });
      logViolation(`${type}_session_end`, { attemptCount });
      
      // Revogar sessão no backend
      const effectiveUserId = userId || user?.id;
      if (effectiveUserId) {
        console.error(`[ContentSecurityGuard] 🚨 REVOGANDO SESSÃO: ${type} após ${attemptCount} violações`);
        supabase.rpc('revoke_session_on_violation', {
          p_user_id: effectiveUserId,
          p_reason: 'security_violation_escalated',
          p_violation_type: type,
          p_auto_ban: attemptCount >= 10,
        }).then(({ data, error }) => {
          if (error) {
            console.error('[ContentSecurityGuard] Erro ao revogar sessão:', error);
          } else {
            console.log('[ContentSecurityGuard] ✅ Sessão revogada:', data);
          }
        });
      }
      
      onSessionEnd?.();
      
      // Hard redirect
      setTimeout(() => {
        window.location.href = '/auth?reason=security_violation';
      }, 1000);
      
      return;
    }
    
    // NÍVEL 2: OVERLAY SEVERO (2-4 tentativas)
    if (attemptCount >= ESCALATION_CONFIG.LEVEL_2_OVERLAY) {
      setShowSevereOverlay(true);
      toast.error('⚠️ AVISO SEVERO: Capturas são proibidas!', {
        duration: 5000,
        icon: '🛡️',
        description: `Tentativa ${attemptCount} de ${ESCALATION_CONFIG.LEVEL_3_SESSION_END}. Próximas tentativas encerrarão sua sessão.`,
      });
      logViolation(`${type}_overlay`, { attemptCount });
      
      setTimeout(() => {
        setShowSevereOverlay(false);
      }, ESCALATION_CONFIG.OVERLAY_DURATION_MS);
      return;
    }
    
    // NÍVEL 1: TOAST DISCRETO (1ª tentativa)
    const messages = {
      screenshot: 'Capturas de tela não são permitidas neste conteúdo.',
      devtools: 'Ferramentas de desenvolvedor detectadas!',
      print: 'Impressão bloqueada! Conteúdo protegido.',
    };

    toast.error(messages[type], { 
      duration: 3000, 
      icon: '🛡️',
      description: 'Esta ação foi registrada.'
    });
    
    logViolation(type, { attemptCount });

    // Limpar clipboard
    if (type === 'screenshot' && navigator.clipboard?.writeText) {
      navigator.clipboard.writeText('').catch(() => {});
    }
  }, [addAttempt, logViolation, onSessionEnd, userId, user?.id]);

  // ═══════════════════════════════════════════════════════════
  // HANDLER DE KEYBOARD (keydown + keyup para PrintScreen)
  // ═══════════════════════════════════════════════════════════
  useEffect(() => {
    if (!enabled) return;
    if (isOwnerRef.current) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (isOwnerRef.current) return;

      const key = e.key;
      if (!key) return;

      const keyUpper = key.toUpperCase();

      // PRINT SCREEN (keydown)
      if (PRINT_SCREEN_KEYS.includes(key) || PRINT_SCREEN_KEYS.includes(keyUpper)) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        console.warn('[ContentSecurityGuard] 🚨 PrintScreen detectado via keydown');
        handleEscalatedResponse('screenshot');
        // Limpar clipboard imediatamente
        if (navigator.clipboard?.writeText) {
          navigator.clipboard.writeText('⚠️ Captura bloqueada').catch(() => {});
        }
        return;
      }

      // WIN + SHIFT + S
      if ((keyUpper === 'S') && e.shiftKey && (e.metaKey || e.getModifierState?.('Meta'))) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        console.warn('[ContentSecurityGuard] 🚨 Win+Shift+S detectado');
        handleEscalatedResponse('screenshot');
        return;
      }

      // CTRL+P / CMD+P
      if ((e.ctrlKey || e.metaKey) && keyUpper === 'P') {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        handleEscalatedResponse('print');
        return;
      }

      // F12
      if (keyUpper === 'F12') {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        handleEscalatedResponse('devtools');
        return;
      }

      // COMBINAÇÕES BLOQUEADAS
      for (const blocked of BLOCKED_SHORTCUTS) {
        const blockedKeyUpper = blocked.key.toUpperCase();
        if (blockedKeyUpper !== keyUpper) continue;

        const ctrlMatch = (blocked.ctrl ?? false) === e.ctrlKey;
        const shiftMatch = (blocked.shift ?? false) === e.shiftKey;
        const metaMatch = (blocked.meta ?? false) === e.metaKey;
        const altMatch = blocked.alt === undefined || blocked.alt === e.altKey;

        if (ctrlMatch && shiftMatch && metaMatch && altMatch) {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
          handleEscalatedResponse('devtools');
          return;
        }
      }
    };

    // ═══════════════════════════════════════════════════════════
    // 🚨 P0 FIX: KEYUP HANDLER para PrintScreen
    // Chrome NÃO dispara keydown para PrintScreen em muitos casos
    // Mas SEMPRE dispara keyup após a captura
    // ═══════════════════════════════════════════════════════════
    const handleKeyUp = (e: KeyboardEvent) => {
      if (isOwnerRef.current) return;
      
      const key = e.key;
      if (!key) return;
      
      // PrintScreen via keyup (mais confiável no Chrome)
      if (PRINT_SCREEN_KEYS.includes(key) || PRINT_SCREEN_KEYS.includes(key.toUpperCase())) {
        console.warn('[ContentSecurityGuard] 🚨 PrintScreen detectado via KEYUP');
        handleEscalatedResponse('screenshot');
        
        // Limpar clipboard após a captura
        if (navigator.clipboard?.writeText) {
          navigator.clipboard.writeText('⚠️ Captura bloqueada').catch(() => {});
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown, { capture: true });
    document.addEventListener('keyup', handleKeyUp, { capture: true });

    return () => {
      document.removeEventListener('keydown', handleKeyDown, { capture: true });
      document.removeEventListener('keyup', handleKeyUp, { capture: true });
    };
  }, [enabled, handleEscalatedResponse]);

  // ═══════════════════════════════════════════════════════════
  // DETECÇÃO DE GRAVAÇÃO DE TELA (blur frequency)
  // ═══════════════════════════════════════════════════════════
  useEffect(() => {
    if (!enabled) return;
    if (isOwnerRef.current) return;

    let blurCount = 0;
    let lastBlurTime = 0;
    const BLUR_THRESHOLD = 5;
    const BLUR_WINDOW = 10000;

    const handleBlur = () => {
      if (isOwnerRef.current) return;

      const now = Date.now();
      
      if (now - lastBlurTime > BLUR_WINDOW) {
        blurCount = 0;
      }
      
      blurCount++;
      lastBlurTime = now;
      
      if (blurCount >= BLUR_THRESHOLD) {
        console.warn('[ContentSecurityGuard] ⚠️ Possível gravação de tela detectada');
        logViolation('possible_screen_recording', { blurCount });
        
        if (!warningThrottleRef.current) {
          warningThrottleRef.current = true;
          toast.warning('Detectamos atividade incomum. Seu acesso está sendo monitorado.', {
            duration: 4000,
            icon: '👁️',
          });
          setTimeout(() => {
            warningThrottleRef.current = false;
          }, 30000);
        }
        
        blurCount = 0;
      }
    };

    window.addEventListener('blur', handleBlur);

    return () => {
      window.removeEventListener('blur', handleBlur);
    };
  }, [enabled, logViolation]);

  // ═══════════════════════════════════════════════════════════
  // 🚨 DETECÇÃO DE DEVTOOLS VIA MENU CHROME (polling agressivo)
  // Detecta DevTools aberto via menu 3 pontinhos (não dispara keydown)
  // ═══════════════════════════════════════════════════════════
  useEffect(() => {
    if (!enabled) return;
    if (isOwnerRef.current) return;

    let lastDevToolsDetection = 0;
    let consecutiveDetections = 0;

    const checkDevToolsDimensions = () => {
      if (isOwnerRef.current) return;

      const widthThreshold = 160;
      const heightThreshold = 160;
      
      const widthDiff = window.outerWidth - window.innerWidth;
      const heightDiff = window.outerHeight - window.innerHeight;
      
      if (widthDiff > widthThreshold || heightDiff > heightThreshold) {
        consecutiveDetections++;
        
        if (consecutiveDetections >= 2) {
          const now = Date.now();
          if (now - lastDevToolsDetection > 10000) {
            lastDevToolsDetection = now;
            console.error('[ContentSecurityGuard] 🚨 DevTools detectado via MENU CHROME!');
            handleEscalatedResponse('devtools');
          }
        }
      } else {
        consecutiveDetections = 0;
      }
    };

    const interval = setInterval(checkDevToolsDimensions, 1000);

    return () => clearInterval(interval);
  }, [enabled, handleEscalatedResponse]);

  // ═══════════════════════════════════════════════════════════
  // BLOQUEIO DE CONTEXT MENU
  // ═══════════════════════════════════════════════════════════
  useEffect(() => {
    if (!enabled) return;
    if (isOwnerRef.current) return;

    const blockContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      handleEscalatedResponse('screenshot');
      return false;
    };

    document.addEventListener('contextmenu', blockContextMenu);

    return () => {
      document.removeEventListener('contextmenu', blockContextMenu);
    };
  }, [enabled, handleEscalatedResponse]);

  // ═══════════════════════════════════════════════════════════
  // OVERLAY SEVERO COMPONENT
  // ═══════════════════════════════════════════════════════════
  const SevereOverlay = useCallback(() => {
    if (!showSevereOverlay) return null;
    
    return (
      <div className="fixed inset-0 z-[9999] bg-black flex items-center justify-center pointer-events-none">
        <div className="text-center space-y-4 animate-pulse">
          <div className="text-6xl">🛡️</div>
          <h1 className="text-4xl font-bold text-red-500">VIOLAÇÃO DETECTADA</h1>
          <p className="text-xl text-white/80">
            Capturas de tela são PROIBIDAS.
          </p>
          <p className="text-lg text-yellow-400">
            Esta tentativa foi registrada em seu perfil.
          </p>
        </div>
      </div>
    );
  }, [showSevereOverlay]);

  return {
    showSevereOverlay,
    SevereOverlay,
    isOwner,
  };
}

export default useContentSecurityGuard;
