// ============================================
// MOISÉS MEDEIROS v1.0 - GLOBAL DEVTOOLS BLOCK
// Bloqueio Global de DevTools em todo o projeto
// EXCETO para o OWNER: moisesblank@gmail.com
// ============================================

import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

const OWNER_EMAIL = 'moisesblank@gmail.com';

// Teclas bloqueadas em diferentes sistemas operacionais
const BLOCKED_KEYS = [
  // Windows/Linux
  { key: 'F12', ctrl: false, shift: false, alt: false },
  { key: 'F12', ctrl: true, shift: false, alt: false },
  { key: 'I', ctrl: true, shift: true, alt: false }, // Ctrl+Shift+I
  { key: 'J', ctrl: true, shift: true, alt: false }, // Ctrl+Shift+J (Console)
  { key: 'C', ctrl: true, shift: true, alt: false }, // Ctrl+Shift+C (Inspect Element)
  { key: 'U', ctrl: true, shift: false, alt: false }, // Ctrl+U (View Source)
  { key: 'S', ctrl: true, shift: false, alt: false }, // Ctrl+S (Save)
  { key: 'P', ctrl: true, shift: false, alt: false }, // Ctrl+P (Print)
  
  // macOS (Command key = metaKey)
  { key: 'I', meta: true, alt: true }, // Cmd+Opt+I
  { key: 'J', meta: true, alt: true }, // Cmd+Opt+J
  { key: 'C', meta: true, alt: true }, // Cmd+Opt+C
  { key: 'U', meta: true, shift: false }, // Cmd+U (View Source)
  { key: 'S', meta: true, shift: false }, // Cmd+S (Save)
  { key: 'P', meta: true, shift: false }, // Cmd+P (Print)
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

    // Bloqueio de teclas
    const handleKeyDown = (e: KeyboardEvent) => {
      // Owner pode tudo
      if (isOwnerRef.current) return;

      const key = e.key.toUpperCase();
      
      // Verificar F12
      if (e.key === 'F12') {
        e.preventDefault();
        e.stopPropagation();
        showWarning();
        return;
      }

      // Verificar combinações bloqueadas
      for (const blocked of BLOCKED_KEYS) {
        const blockedKey = blocked.key.toUpperCase();
        
        // Windows/Linux (Ctrl + Shift)
        if (blockedKey === key && blocked.ctrl !== undefined) {
          if (
            e.ctrlKey === !!blocked.ctrl &&
            e.shiftKey === !!blocked.shift &&
            e.altKey === !!blocked.alt
          ) {
            e.preventDefault();
            e.stopPropagation();
            showWarning();
            return;
          }
        }
        
        // macOS (Meta/Command + Alt/Option)
        if (blockedKey === key && blocked.meta !== undefined) {
          if (
            e.metaKey === !!blocked.meta &&
            (blocked.alt !== undefined ? e.altKey === !!blocked.alt : true) &&
            (blocked.shift !== undefined ? e.shiftKey === !!blocked.shift : true)
          ) {
            e.preventDefault();
            e.stopPropagation();
            showWarning();
            return;
          }
        }
      }
    };

    // Mostrar aviso
    const showWarning = () => {
      if (warningShownRef.current) return;
      warningShownRef.current = true;
      
      console.clear();
      console.log(
        '%c🛡️ ACESSO BLOQUEADO 🛡️',
        'background: linear-gradient(90deg, #6366f1, #8b5cf6); color: white; font-size: 24px; font-weight: bold; padding: 20px 40px; border-radius: 10px;'
      );
      console.log(
        '%cAs ferramentas de desenvolvedor estão desabilitadas nesta plataforma.',
        'color: #a78bfa; font-size: 14px; padding: 10px;'
      );
      
      // Reset após 5 segundos
      setTimeout(() => {
        warningShownRef.current = false;
      }, 5000);
    };

    // Bloqueio de clique direito global
    const handleContextMenu = (e: MouseEvent) => {
      if (isOwnerRef.current) return;
      e.preventDefault();
      showWarning();
    };

    // Detecção de DevTools aberto
    const detectDevTools = () => {
      if (isOwnerRef.current) return;
      
      const threshold = 160;
      const widthCheck = window.outerWidth - window.innerWidth > threshold;
      const heightCheck = window.outerHeight - window.innerHeight > threshold;
      
      if (widthCheck || heightCheck) {
        showWarning();
        
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

    // Adicionar listeners
    document.addEventListener('keydown', handleKeyDown, true);
    document.addEventListener('contextmenu', handleContextMenu, true);
    
    // Verificar DevTools periodicamente
    const devToolsInterval = setInterval(detectDevTools, 1000);

    return () => {
      document.removeEventListener('keydown', handleKeyDown, true);
      document.removeEventListener('contextmenu', handleContextMenu, true);
      clearInterval(devToolsInterval);
      subscription.unsubscribe();
    };
  }, []);
}
