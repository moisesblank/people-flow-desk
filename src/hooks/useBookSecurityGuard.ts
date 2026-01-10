// ============================================
// 📚🛡️ BOOK SECURITY GUARD v1.0
// Proteção anti-PrintScreen/DevTools para Livros Web
// OWNER BYPASS ALWAYS
// ============================================

import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const OWNER_EMAIL = 'moisesblank@gmail.com';

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

interface UseBookSecurityGuardOptions {
  bookId: string;
  bookTitle?: string;
  isOwner: boolean;
  userId?: string;
  userEmail?: string;
  userName?: string;
  onViolation?: (type: string) => void;
}

export function useBookSecurityGuard({
  bookId,
  bookTitle,
  isOwner,
  userId,
  userEmail,
  userName,
  onViolation,
}: UseBookSecurityGuardOptions) {
  const isOwnerRef = useRef(isOwner);
  const warningThrottleRef = useRef(false);
  const violationCountRef = useRef(0);

  // Atualizar ref quando isOwner mudar
  useEffect(() => {
    isOwnerRef.current = isOwner;
  }, [isOwner]);

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
          timestamp: new Date().toISOString(),
          user_agent: navigator.userAgent,
        },
      });
    } catch (err) {
      console.error('[BookSecurityGuard] Erro ao logar violação:', err);
    }

    onViolation?.(violationType);
  }, [bookId, bookTitle, userId, userEmail, userName, onViolation]);

  // ═══════════════════════════════════════════════════════════
  // MOSTRAR AVISO (THROTTLED)
  // ═══════════════════════════════════════════════════════════
  const showWarning = useCallback((type: 'screenshot' | 'devtools' | 'print') => {
    if (warningThrottleRef.current) return;
    warningThrottleRef.current = true;

    const messages = {
      screenshot: 'Screenshot bloqueado! Conteúdo protegido.',
      devtools: 'Ferramentas de desenvolvedor detectadas!',
      print: 'Impressão bloqueada! Conteúdo protegido.',
    };

    toast.error(messages[type], { 
      duration: 3000, 
      icon: '🛡️',
      description: 'Esta ação foi registrada.'
    });

    // Limpar clipboard para prevenir captura
    if (type === 'screenshot' && navigator.clipboard?.writeText) {
      navigator.clipboard.writeText('').catch(() => {});
    }

    // Throttle de 5 segundos
    setTimeout(() => {
      warningThrottleRef.current = false;
    }, 5000);
  }, []);

  // ═══════════════════════════════════════════════════════════
  // HANDLER DE KEYBOARD
  // ═══════════════════════════════════════════════════════════
  useEffect(() => {
    // Owner bypass total
    if (isOwnerRef.current) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (isOwnerRef.current) return;

      const key = e.key;
      if (!key) return;

      const keyUpper = key.toUpperCase();

      // ───────────────────────────────────────────────────────
      // PRINT SCREEN (Windows)
      // ───────────────────────────────────────────────────────
      if (PRINT_SCREEN_KEYS.includes(key) || PRINT_SCREEN_KEYS.includes(keyUpper)) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        showWarning('screenshot');
        logViolation('print_screen', { key });
        return;
      }

      // ───────────────────────────────────────────────────────
      // WIN + SHIFT + S (Snipping Tool Windows)
      // ───────────────────────────────────────────────────────
      if ((keyUpper === 'S') && e.shiftKey && (e.metaKey || e.getModifierState?.('Meta'))) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        showWarning('screenshot');
        logViolation('snipping_tool', { key });
        return;
      }

      // ───────────────────────────────────────────────────────
      // CTRL+P ou CMD+P (Print)
      // ───────────────────────────────────────────────────────
      if ((e.ctrlKey || e.metaKey) && keyUpper === 'P') {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        showWarning('print');
        logViolation('print_attempt', { key });
        return;
      }

      // ───────────────────────────────────────────────────────
      // F12 (DevTools)
      // ───────────────────────────────────────────────────────
      if (keyUpper === 'F12') {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        showWarning('devtools');
        logViolation('devtools_f12', { key });
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
          showWarning('devtools');
          logViolation('blocked_shortcut', { key, blocked });
          return;
        }
      }
    };

    // Listener com capture para interceptar antes
    document.addEventListener('keydown', handleKeyDown, { capture: true });

    return () => {
      document.removeEventListener('keydown', handleKeyDown, { capture: true });
    };
  }, [showWarning, logViolation]);

  // ═══════════════════════════════════════════════════════════
  // DETECÇÃO DE DEVTOOLS POR DIMENSÕES
  // ═══════════════════════════════════════════════════════════
  useEffect(() => {
    if (isOwnerRef.current) return;

    let lastDevToolsDetection = 0;

    const checkDevToolsDimensions = () => {
      if (isOwnerRef.current) return;

      const widthThreshold = 160;
      const heightThreshold = 160;
      
      const widthDiff = window.outerWidth - window.innerWidth;
      const heightDiff = window.outerHeight - window.innerHeight;
      
      // Se diferença grande, provavelmente DevTools aberto
      if (widthDiff > widthThreshold || heightDiff > heightThreshold) {
        const now = Date.now();
        // Throttle de 30 segundos para não logar muito
        if (now - lastDevToolsDetection > 30000) {
          lastDevToolsDetection = now;
          logViolation('devtools_dimensions', { widthDiff, heightDiff });
          // Não mostrar toast para dimensões (muito intrusivo)
        }
      }
    };

    // Verificar a cada 10 segundos
    const interval = setInterval(checkDevToolsDimensions, 10000);

    return () => clearInterval(interval);
  }, [logViolation]);

  // ═══════════════════════════════════════════════════════════
  // BLOQUEIO DE CONTEXT MENU (Right-click)
  // ═══════════════════════════════════════════════════════════
  useEffect(() => {
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
  }, []);

  // ═══════════════════════════════════════════════════════════
  // DETECÇÃO DE WINDOW BLUR (possível screenshot externo)
  // ═══════════════════════════════════════════════════════════
  useEffect(() => {
    if (isOwnerRef.current) return;

    let blurCount = 0;
    let lastBlurTime = 0;

    const handleBlur = () => {
      if (isOwnerRef.current) return;

      const now = Date.now();
      // Se blur acontecer muito rápido seguido, pode ser screenshot tool
      if (now - lastBlurTime < 2000) {
        blurCount++;
        if (blurCount >= 3) {
          logViolation('suspicious_blur', { blurCount });
          blurCount = 0;
        }
      } else {
        blurCount = 1;
      }
      lastBlurTime = now;
    };

    window.addEventListener('blur', handleBlur);

    return () => {
      window.removeEventListener('blur', handleBlur);
    };
  }, [logViolation]);

  return {
    violationCount: violationCountRef.current,
  };
}
