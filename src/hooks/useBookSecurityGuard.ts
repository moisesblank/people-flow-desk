// ============================================
// 📚🛡️ BOOK SECURITY GUARD v3.1
// Proteção anti-PrintScreen/DevTools para Livros Web
// M4: Escalonamento de resposta + Detecção gravação
// P0-1: Revogação de sessão via RPC + Redirect /auth
// v3.1: Anti-Debugger agressivo + Console flooding
// OWNER BYPASS ALWAYS
// ============================================

import { useEffect, useRef, useCallback, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { antiDebugger } from '@/lib/security/antiDebugger';

// P1-2 SECURITY FIX: OWNER_EMAIL removido completamente
// Verificação de owner é via role === 'owner' (useRolePermissions)

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
// M4: CONFIGURAÇÃO DE ESCALONAMENTO
// ═══════════════════════════════════════════════════════════
const ESCALATION_CONFIG = {
  // Janela de tempo para contar tentativas (5 minutos)
  WINDOW_MS: 5 * 60 * 1000,
  // Nível 1: Toast discreto (1ª tentativa)
  LEVEL_1_TOAST: 1,
  // Nível 2: Overlay severo (2ª tentativa)
  LEVEL_2_OVERLAY: 2,
  // Nível 3: Sessão encerrada (5ª tentativa)
  LEVEL_3_SESSION_END: 5,
  // Duração do overlay em ms
  OVERLAY_DURATION_MS: 5000,
};

interface UseBookSecurityGuardOptions {
  bookId: string;
  bookTitle?: string;
  isOwner: boolean;
  userId?: string;
  userEmail?: string;
  userName?: string;
  /** ✅ STAGGER: Se false, não ativa os listeners (montagem escalonada) */
  enabled?: boolean;
  onViolation?: (type: string) => void;
  onSessionEnd?: () => void;
}

interface ViolationAttempt {
  timestamp: number;
  type: string;
}

export function useBookSecurityGuard({
  bookId,
  bookTitle,
  isOwner,
  userId,
  userEmail,
  userName,
  enabled = true, // ✅ STAGGER: Default true para retrocompatibilidade
  onViolation,
  onSessionEnd,
}: UseBookSecurityGuardOptions) {
  const isOwnerRef = useRef(isOwner);
  const warningThrottleRef = useRef(false);
  const violationCountRef = useRef(0);
  
  // ✅ M4: Estado para overlay severo
  const [showSevereOverlay, setShowSevereOverlay] = useState(false);
  
  // ✅ M4: Histórico de tentativas para escalonamento
  const attemptsRef = useRef<ViolationAttempt[]>([]);
  const antiDebugCleanupRef = useRef<(() => void) | null>(null);

  // Atualizar ref quando isOwner mudar
  useEffect(() => {
    isOwnerRef.current = isOwner;
  }, [isOwner]);

  // ═══════════════════════════════════════════════════════════
  // v3.1: ANTI-DEBUGGER AGRESSIVO
  // ═══════════════════════════════════════════════════════════
  useEffect(() => {
    if (!enabled) return;
    if (isOwner) {
      antiDebugger.setOwnerMode(userEmail);
      return;
    }
    
    // Inicializar anti-debugger
    antiDebugCleanupRef.current = antiDebugger.init(userEmail);
    
    // Ativar modo agressivo para páginas de conteúdo
    antiDebugger.enableAggressiveMode();
    
    return () => {
      if (antiDebugCleanupRef.current) {
        antiDebugCleanupRef.current();
      }
    };
  }, [enabled, isOwner, userEmail]);

  // ═══════════════════════════════════════════════════════════
  // M4: CONTAR TENTATIVAS NA JANELA DE TEMPO
  // ═══════════════════════════════════════════════════════════
  const getRecentAttempts = useCallback(() => {
    const now = Date.now();
    const windowStart = now - ESCALATION_CONFIG.WINDOW_MS;
    
    // Limpar tentativas antigas
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
      await supabase.from('book_access_logs').insert({
        book_id: bookId,
        book_title: bookTitle || 'Unknown',
        user_id: userId,
        user_email: userEmail,
        user_name: userName,
        event_type: 'security_violation',
        is_violation: true,
        violation_type: violationType,
        event_description: `Tentativa de ${violationType} detectada`,
        metadata: {
          ...metadata,
          violation_count: violationCountRef.current,
          attempts_in_window: getRecentAttempts(),
          timestamp: new Date().toISOString(),
          user_agent: navigator.userAgent,
        },
      });
    } catch (err) {
      console.error('[BookSecurityGuard] Erro ao logar violação:', err);
    }

    onViolation?.(violationType);
  }, [bookId, bookTitle, userId, userEmail, userName, onViolation, getRecentAttempts]);

  // ═══════════════════════════════════════════════════════════
  // M4: RESPOSTA ESCALONADA
  // ═══════════════════════════════════════════════════════════
  const handleEscalatedResponse = useCallback((type: 'screenshot' | 'devtools' | 'print') => {
    if (isOwnerRef.current) return;
    
    // Registrar tentativa
    const attemptCount = addAttempt(type);
    
    console.log(`[BookSecurityGuard] Tentativa #${attemptCount} de ${type}`);
    
    // ─────────────────────────────────────────────────────────
    // NÍVEL 3: SESSÃO ENCERRADA (5+ tentativas) — P0-1 FIX
    // Revoga sessão NO BACKEND + força redirect para /auth
    // ─────────────────────────────────────────────────────────
    if (attemptCount >= ESCALATION_CONFIG.LEVEL_3_SESSION_END) {
      toast.error('Sessão encerrada por violações repetidas', {
        duration: 5000,
        icon: '🚫',
        description: 'Você será redirecionado para login.',
      });
      logViolation(`${type}_session_end`, { attemptCount });
      
      // 🛡️ P0-1: REVOGAR SESSÃO NO BACKEND VIA RPC
      if (userId) {
        console.error(`[BookSecurityGuard] 🚨 REVOGANDO SESSÃO: ${type} após ${attemptCount} violações`);
        supabase.rpc('revoke_session_on_violation', {
          p_user_id: userId,
          p_reason: 'security_violation_escalated',
          p_violation_type: type,
          p_auto_ban: attemptCount >= 10, // Auto-ban após 10 violações
        }).then(({ data, error }) => {
          if (error) {
            console.error('[BookSecurityGuard] Erro ao revogar sessão:', error);
          } else {
            console.log('[BookSecurityGuard] ✅ Sessão revogada:', data);
          }
        });
      }
      
      // Callback local + redirect forçado
      onSessionEnd?.();
      
      // 🛡️ P0-1: HARD REDIRECT para /auth após 1s
      setTimeout(() => {
        window.location.href = '/auth?reason=security_violation';
      }, 1000);
      
      return;
    }
    
    // ─────────────────────────────────────────────────────────
    // NÍVEL 2: OVERLAY SEVERO (2-4 tentativas)
    // ─────────────────────────────────────────────────────────
    if (attemptCount >= ESCALATION_CONFIG.LEVEL_2_OVERLAY) {
      setShowSevereOverlay(true);
      toast.error('⚠️ AVISO SEVERO: Capturas são proibidas!', {
        duration: 5000,
        icon: '🛡️',
        description: `Tentativa ${attemptCount} de ${ESCALATION_CONFIG.LEVEL_3_SESSION_END}. Próximas tentativas encerrarão sua sessão.`,
      });
      logViolation(`${type}_overlay`, { attemptCount });
      
      // Remover overlay após duração
      setTimeout(() => {
        setShowSevereOverlay(false);
      }, ESCALATION_CONFIG.OVERLAY_DURATION_MS);
      return;
    }
    
    // ─────────────────────────────────────────────────────────
    // NÍVEL 1: TOAST DISCRETO (1ª tentativa)
    // ─────────────────────────────────────────────────────────
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

    // Limpar clipboard para prevenir captura
    if (type === 'screenshot' && navigator.clipboard?.writeText) {
      navigator.clipboard.writeText('').catch(() => {});
    }
  }, [addAttempt, logViolation, onSessionEnd]);

  // ═══════════════════════════════════════════════════════════
  // HANDLER DE KEYBOARD (keydown + keyup para PrintScreen)
  // ═══════════════════════════════════════════════════════════
  useEffect(() => {
    // ✅ STAGGER: Se não habilitado, não ativa listeners
    if (!enabled) return;
    // Owner bypass total
    if (isOwnerRef.current) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (isOwnerRef.current) return;

      const key = e.key;
      if (!key) return;

      const keyUpper = key.toUpperCase();

      // ───────────────────────────────────────────────────────
      // PRINT SCREEN (Windows) - keydown
      // ───────────────────────────────────────────────────────
      if (PRINT_SCREEN_KEYS.includes(key) || PRINT_SCREEN_KEYS.includes(keyUpper)) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        console.warn('[BookSecurityGuard] 🚨 PrintScreen detectado via keydown');
        handleEscalatedResponse('screenshot');
        // Limpar clipboard imediatamente
        if (navigator.clipboard?.writeText) {
          navigator.clipboard.writeText('⚠️ Captura bloqueada').catch(() => {});
        }
        return;
      }

      // ───────────────────────────────────────────────────────
      // WIN + SHIFT + S (Snipping Tool Windows)
      // ───────────────────────────────────────────────────────
      if ((keyUpper === 'S') && e.shiftKey && (e.metaKey || e.getModifierState?.('Meta'))) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        console.warn('[BookSecurityGuard] 🚨 Win+Shift+S detectado');
        handleEscalatedResponse('screenshot');
        return;
      }

      // ───────────────────────────────────────────────────────
      // CTRL+P ou CMD+P (Print)
      // ───────────────────────────────────────────────────────
      if ((e.ctrlKey || e.metaKey) && keyUpper === 'P') {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        handleEscalatedResponse('print');
        return;
      }

      // ───────────────────────────────────────────────────────
      // F12 (DevTools)
      // ───────────────────────────────────────────────────────
      if (keyUpper === 'F12') {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        handleEscalatedResponse('devtools');
        return;
      }

      // ───────────────────────────────────────────────────────
      // COMBINAÇÕES BLOQUEADAS
      // ───────────────────────────────────────────────────────
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
        console.warn('[BookSecurityGuard] 🚨 PrintScreen detectado via KEYUP');
        handleEscalatedResponse('screenshot');
        
        // Limpar clipboard após a captura
        if (navigator.clipboard?.writeText) {
          navigator.clipboard.writeText('⚠️ Captura bloqueada').catch(() => {});
        }
      }
    };

    // Listeners com capture para interceptar antes de qualquer outro handler
    document.addEventListener('keydown', handleKeyDown, { capture: true });
    document.addEventListener('keyup', handleKeyUp, { capture: true });

    return () => {
      document.removeEventListener('keydown', handleKeyDown, { capture: true });
      document.removeEventListener('keyup', handleKeyUp, { capture: true });
    };
  }, [enabled, handleEscalatedResponse]);

  // ═══════════════════════════════════════════════════════════
  // M4 - ITEM 1: DETECÇÃO DE GRAVAÇÃO DE TELA
  // ═══════════════════════════════════════════════════════════
  useEffect(() => {
    // ✅ STAGGER: Se não habilitado, não ativa listeners
    if (!enabled) return;
    if (isOwnerRef.current) return;

    let blurCount = 0;
    let lastBlurTime = 0;
    const BLUR_THRESHOLD = 5; // 5 blurs rápidos = suspeito
    const BLUR_WINDOW = 10000; // 10 segundos

    const handleBlur = () => {
      if (isOwnerRef.current) return;

      const now = Date.now();
      
      // Reset se fora da janela
      if (now - lastBlurTime > BLUR_WINDOW) {
        blurCount = 0;
      }
      
      blurCount++;
      lastBlurTime = now;
      
      // Muitos blurs rápidos = possível gravação de tela
      if (blurCount >= BLUR_THRESHOLD) {
        console.warn('[BookSecurityGuard] Possível gravação de tela detectada');
        toast.warning('Atividade suspeita detectada', {
          duration: 3000,
          icon: '📹',
          description: 'Gravação de tela pode estar ativa.',
        });
        logViolation('screen_recording_suspected', { blurCount });
        blurCount = 0;
      }
    };

    window.addEventListener('blur', handleBlur);

    return () => {
      window.removeEventListener('blur', handleBlur);
    };
  }, [logViolation]);

  // ═══════════════════════════════════════════════════════════
  // 🚨 DETECÇÃO DE DEVTOOLS VIA MENU CHROME (polling agressivo)
  // Detecta DevTools aberto via menu 3 pontinhos (não dispara keydown)
  // ═══════════════════════════════════════════════════════════
  useEffect(() => {
    // ✅ STAGGER: Se não habilitado, não ativa listeners
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
      
      // Se diferença grande, provavelmente DevTools aberto
      if (widthDiff > widthThreshold || heightDiff > heightThreshold) {
        consecutiveDetections++;
        
        // Se detectou 2x consecutivas (2s), é DevTools real
        if (consecutiveDetections >= 2) {
          const now = Date.now();
          // Throttle de 10 segundos entre logs
          if (now - lastDevToolsDetection > 10000) {
            lastDevToolsDetection = now;
            console.error('[BookSecurityGuard] 🚨 DevTools detectado via MENU CHROME!');
            
            // 🛡️ ESCALONAR COMO VIOLAÇÃO REAL
            handleEscalatedResponse('devtools');
          }
        }
      } else {
        consecutiveDetections = 0;
      }
    };

    // ⚡ Verificar a cada 1 segundo (mais agressivo)
    const interval = setInterval(checkDevToolsDimensions, 1000);

    return () => clearInterval(interval);
  }, [enabled, handleEscalatedResponse]);

  // ═══════════════════════════════════════════════════════════
  // BLOQUEIO DE CONTEXT MENU (Right-click)
  // ═══════════════════════════════════════════════════════════
  useEffect(() => {
    // ✅ STAGGER: Se não habilitado, não ativa listeners
    if (!enabled) return;
    if (isOwnerRef.current) return;

    const handleContextMenu = (e: MouseEvent) => {
      if (isOwnerRef.current) return;
      e.preventDefault();
      toast.error('Menu de contexto bloqueado', { duration: 2000, icon: '🔒' });
    };

    document.addEventListener('contextmenu', handleContextMenu);

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [enabled]);

  // ═══════════════════════════════════════════════════════════
  // M4 - DETECÇÃO DE PICTURE-IN-PICTURE
  // ═══════════════════════════════════════════════════════════
  useEffect(() => {
    // ✅ STAGGER: Se não habilitado, não ativa listeners
    if (!enabled) return;
    if (isOwnerRef.current) return;

    const checkPiP = () => {
      if (document.pictureInPictureElement) {
        console.warn('[BookSecurityGuard] PiP detectado');
        logViolation('picture_in_picture', {});
        toast.warning('Picture-in-Picture detectado', {
          duration: 3000,
          icon: '📺',
        });
      }
    };

    // Verificar quando entra em PiP
    document.addEventListener('enterpictureinpicture', checkPiP);

    return () => {
      document.removeEventListener('enterpictureinpicture', checkPiP);
    };
  }, [logViolation]);

  return {
    violationCount: violationCountRef.current,
    showSevereOverlay, // ✅ M4: Expor estado do overlay
    attemptsInWindow: getRecentAttempts(),
  };
}