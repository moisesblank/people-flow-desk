// ============================================
// MOISÉS MEDEIROS v2.0 - GLOBAL DEVTOOLS BLOCK
// Bloqueio Global de DevTools + Print Screen em todo o projeto
// EXCETO para o OWNER: moisesblank@gmail.com
// ============================================

import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const OWNER_EMAIL = 'moisesblank@gmail.com';

// Teclas bloqueadas em diferentes sistemas operacionais
const BLOCKED_KEYS = [
  // ═══════════════════════════════════════════════════════════
  // WINDOWS / LINUX
  // ═══════════════════════════════════════════════════════════
  { key: 'F12', ctrl: false, shift: false, alt: false },
  { key: 'F12', ctrl: true, shift: false, alt: false },
  { key: 'I', ctrl: true, shift: true, alt: false }, // Ctrl+Shift+I
  { key: 'J', ctrl: true, shift: true, alt: false }, // Ctrl+Shift+J (Console)
  { key: 'C', ctrl: true, shift: true, alt: false }, // Ctrl+Shift+C (Inspect Element)
  { key: 'U', ctrl: true, shift: false, alt: false }, // Ctrl+U (View Source)
  { key: 'S', ctrl: true, shift: false, alt: false }, // Ctrl+S (Save)
  { key: 'P', ctrl: true, shift: false, alt: false }, // Ctrl+P (Print)
  
  // ═══════════════════════════════════════════════════════════
  // PRINT SCREEN - WINDOWS
  // ═══════════════════════════════════════════════════════════
  { key: 'PrintScreen', ctrl: false, shift: false, alt: false },
  { key: 'PrintScreen', ctrl: false, shift: true, alt: false }, // Shift+PrintScreen
  { key: 'PrintScreen', ctrl: true, shift: false, alt: false }, // Ctrl+PrintScreen
  { key: 'PrintScreen', ctrl: false, shift: false, alt: true }, // Alt+PrintScreen
  
  // ═══════════════════════════════════════════════════════════
  // MACOS - Command (⌘) = metaKey, Option (⌥) = altKey
  // ═══════════════════════════════════════════════════════════
  // DevTools: Option + Command + I (equivalente ao F12 do Windows)
  { key: 'I', meta: true, alt: true, shift: false },
  { key: 'i', meta: true, alt: true, shift: false },
  // Console: Option + Command + J
  { key: 'J', meta: true, alt: true, shift: false },
  { key: 'j', meta: true, alt: true, shift: false },
  // Inspect Element: Option + Command + C
  { key: 'C', meta: true, alt: true, shift: false },
  { key: 'c', meta: true, alt: true, shift: false },
  // View Source: Command + U
  { key: 'U', meta: true, alt: false, shift: false },
  { key: 'u', meta: true, alt: false, shift: false },
  // Save: Command + S
  { key: 'S', meta: true, alt: false, shift: false },
  { key: 's', meta: true, alt: false, shift: false },
  // Print: Command + P
  { key: 'P', meta: true, alt: false, shift: false },
  { key: 'p', meta: true, alt: false, shift: false },
  // Safari DevTools: Option + Command + I
  { key: 'Dead', meta: true, alt: true }, // Algumas configs de teclado Mac
  
  // ═══════════════════════════════════════════════════════════
  // MACOS - Screenshot shortcuts
  // ═══════════════════════════════════════════════════════════
  // Command + Shift + 3 (Full screen screenshot)
  { key: '3', meta: true, shift: true, alt: false },
  // Command + Shift + 4 (Selection screenshot)
  { key: '4', meta: true, shift: true, alt: false },
  // Command + Shift + 5 (Screenshot toolbar)
  { key: '5', meta: true, shift: true, alt: false },
  // Command + Shift + 6 (Touch Bar screenshot)
  { key: '6', meta: true, shift: true, alt: false },
];

// Teclas de Print Screen (múltiplos formatos)
const PRINT_SCREEN_KEYS = [
  'PrintScreen',
  'PrtSc',
  'PrtScn',
  'Print',
  'Snapshot',
];

export function useGlobalDevToolsBlock() {
  const isOwnerRef = useRef(false);
  const warningShownRef = useRef(false);

  useEffect(() => {
    // Verificar se usuário é owner
    const checkOwner = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        isOwnerRef.current = (user?.email || '').toLowerCase() === OWNER_EMAIL;
      } catch {
        isOwnerRef.current = false;
      }
    };

    checkOwner();

    // Listener de mudança de auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_, session) => {
      isOwnerRef.current = (session?.user?.email || '').toLowerCase() === OWNER_EMAIL;
    });

    // Mostrar aviso
    const showWarning = (type: 'devtools' | 'screenshot' = 'devtools') => {
      if (warningShownRef.current) return;
      warningShownRef.current = true;
      
      console.clear();
      
      if (type === 'screenshot') {
        console.log(
          '%c📸 SCREENSHOT BLOQUEADO 📸',
          'background: linear-gradient(90deg, #ef4444, #dc2626); color: white; font-size: 24px; font-weight: bold; padding: 20px 40px; border-radius: 10px;'
        );
        console.log(
          '%cCaptura de tela não é permitida nesta plataforma.',
          'color: #f87171; font-size: 14px; padding: 10px;'
        );
        toast.error('Screenshot bloqueado! Captura de tela não permitida.', {
          duration: 3000,
          icon: '🛡️',
        });
      } else {
        console.log(
          '%c🛡️ ACESSO BLOQUEADO 🛡️',
          'background: linear-gradient(90deg, #6366f1, #8b5cf6); color: white; font-size: 24px; font-weight: bold; padding: 20px 40px; border-radius: 10px;'
        );
        console.log(
          '%cAs ferramentas de desenvolvedor estão desabilitadas nesta plataforma.',
          'color: #a78bfa; font-size: 14px; padding: 10px;'
        );
      }
      
      // Reset após 5 segundos
      setTimeout(() => {
        warningShownRef.current = false;
      }, 5000);
    };

    // Bloqueio de teclas
    const handleKeyDown = (e: KeyboardEvent) => {
      // Owner pode tudo
      if (isOwnerRef.current) return;

      const key = e.key;
      const keyUpper = key.toUpperCase();
      
      // ═══════════════════════════════════════════════════════════
      // BLOQUEIO DE PRINT SCREEN (múltiplos formatos)
      // ═══════════════════════════════════════════════════════════
      if (PRINT_SCREEN_KEYS.includes(key) || PRINT_SCREEN_KEYS.includes(keyUpper)) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        showWarning('screenshot');
        
        // Limpar clipboard para prevenir captura
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText('').catch(() => {});
        }
        return false;
      }
      
      // ═══════════════════════════════════════════════════════════
      // BLOQUEIO Windows + Shift + S (Snipping Tool)
      // ═══════════════════════════════════════════════════════════
      if ((key === 's' || key === 'S') && e.shiftKey && e.metaKey) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        showWarning('screenshot');
        return false;
      }
      
      // Windows Key + Shift + S detection (via keyCode for Windows key)
      if ((key === 's' || key === 'S') && e.shiftKey && (e.getModifierState && e.getModifierState('Meta'))) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        showWarning('screenshot');
        return false;
      }
      
      // Verificar F12 (Windows e Mac com fn+F12)
      if (key === 'F12') {
        e.preventDefault();
        e.stopPropagation();
        showWarning('devtools');
        return;
      }

      // Verificar combinações bloqueadas
      for (const blocked of BLOCKED_KEYS) {
        const blockedKeyUpper = blocked.key.toUpperCase();
        const currentKeyUpper = keyUpper;
        
        // Match por key (case insensitive)
        if (blockedKeyUpper !== currentKeyUpper && blocked.key !== key) continue;
        
        // Verificar Windows/Linux (Ctrl + Shift + Alt)
        if (blocked.ctrl !== undefined) {
          if (
            e.ctrlKey === !!blocked.ctrl &&
            e.shiftKey === !!blocked.shift &&
            e.altKey === !!blocked.alt &&
            !e.metaKey
          ) {
            e.preventDefault();
            e.stopPropagation();
            
            // Detectar se é screenshot
            if (PRINT_SCREEN_KEYS.includes(blocked.key)) {
              showWarning('screenshot');
            } else {
              showWarning('devtools');
            }
            return;
          }
        }
        
        // Verificar macOS (Meta/Command + Alt/Option)
        if (blocked.meta !== undefined) {
          const metaMatch = e.metaKey === !!blocked.meta;
          const altMatch = blocked.alt !== undefined ? e.altKey === !!blocked.alt : true;
          const shiftMatch = blocked.shift !== undefined ? e.shiftKey === !!blocked.shift : true;
          
          if (metaMatch && altMatch && shiftMatch) {
            e.preventDefault();
            e.stopPropagation();
            
            // Detectar se é screenshot do Mac (Command+Shift+3/4/5/6)
            if (['3', '4', '5', '6'].includes(blocked.key)) {
              showWarning('screenshot');
            } else {
              showWarning('devtools');
            }
            return;
          }
        }
      }
    };

    // ═══════════════════════════════════════════════════════════
    // PROTEÇÃO ADICIONAL CONTRA CLIPBOARD (Print Screen)
    // ═══════════════════════════════════════════════════════════
    const handleCopy = (e: ClipboardEvent) => {
      if (isOwnerRef.current) return;
      
      // Permitir cópia de texto normal, mas bloquear imagens
      const items = e.clipboardData?.items;
      if (items) {
        for (let i = 0; i < items.length; i++) {
          if (items[i].type.indexOf('image') !== -1) {
            e.preventDefault();
            e.stopPropagation();
            showWarning('screenshot');
            return;
          }
        }
      }
    };

    // ═══════════════════════════════════════════════════════════
    // DETECÇÃO DE VISIBILITYCHANGE (usuário saiu para fazer screenshot)
    // ═══════════════════════════════════════════════════════════
    const handleVisibilityChange = () => {
      if (isOwnerRef.current) return;
      
      // Quando a página perde foco, pode ser indicativo de screenshot
      // Mostrar aviso quando voltar
      if (document.hidden) {
        // Usuário saiu da aba - pode estar fazendo screenshot
        console.log(
          '%c👁️ ATIVIDADE MONITORADA 👁️',
          'background: #f59e0b; color: black; font-size: 12px; padding: 5px 10px;'
        );
      }
    };

    // Bloqueio de clique direito global
    const handleContextMenu = (e: MouseEvent) => {
      if (isOwnerRef.current) return;
      e.preventDefault();
      showWarning('devtools');
    };

    // Detecção de DevTools aberto
    const detectDevTools = () => {
      if (isOwnerRef.current) return;
      
      const threshold = 160;
      const widthCheck = window.outerWidth - window.innerWidth > threshold;
      const heightCheck = window.outerHeight - window.innerHeight > threshold;
      
      if (widthCheck || heightCheck) {
        showWarning('devtools');
        
        // Limpar console quando DevTools é detectado
        console.clear();
        console.log(
          '%c⚠️ ATENÇÃO ⚠️',
          'background: #ef4444; color: white; font-size: 20px; font-weight: bold; padding: 10px 20px;'
        );
        console.log(
          '%cEsta área é protegida. O acesso não autorizado é monitorado.',
          'color: #f87171; font-size: 12px;'
        );
      }
    };

    // ═══════════════════════════════════════════════════════════
    // CSS ANTI-SCREENSHOT (blur quando perde foco)
    // ═══════════════════════════════════════════════════════════
    const addAntiScreenshotCSS = () => {
      const style = document.createElement('style');
      style.id = 'anti-screenshot-css';
      style.textContent = `
        /* Desabilitar seleção de texto em elementos sensíveis */
        .protected-content {
          user-select: none !important;
          -webkit-user-select: none !important;
          -moz-user-select: none !important;
          -ms-user-select: none !important;
        }
        
        /* Adicionar marca d'água invisível que aparece em screenshots */
        body::after {
          content: '';
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          z-index: 99999;
          background: repeating-linear-gradient(
            -45deg,
            transparent 0px,
            transparent 10px,
            rgba(255,0,0,0.001) 10px,
            rgba(255,0,0,0.001) 20px
          );
        }
      `;
      document.head.appendChild(style);
    };

    // Adicionar CSS anti-screenshot
    addAntiScreenshotCSS();

    // Adicionar listeners
    document.addEventListener('keydown', handleKeyDown, true);
    document.addEventListener('keyup', handleKeyDown, true);
    document.addEventListener('contextmenu', handleContextMenu, true);
    document.addEventListener('copy', handleCopy, true);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Verificar DevTools periodicamente
    const devToolsInterval = setInterval(detectDevTools, 1000);

    return () => {
      document.removeEventListener('keydown', handleKeyDown, true);
      document.removeEventListener('keyup', handleKeyDown, true);
      document.removeEventListener('contextmenu', handleContextMenu, true);
      document.removeEventListener('copy', handleCopy, true);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(devToolsInterval);
      subscription.unsubscribe();
      
      // Remover CSS
      const style = document.getElementById('anti-screenshot-css');
      if (style) style.remove();
    };
  }, []);
}
