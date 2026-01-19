// ============================================
// ☢️ MOISÉS MEDEIROS v4.0 - NUCLEAR SHIELD EDITION
// Bloqueio Global de DevTools + Print Screen + Cópia de Conteúdo
// EXCETO para o OWNER: moisesblank@gmail.com
// ============================================
// ☢️ NUCLEAR SHIELD v3.0 INTEGRADO (2026-01-12)
// ============================================

import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { initNuclearShield } from "@/lib/security/nuclearShield";

// ═══════════════════════════════════════════════════════════
// 🔧 MASTER KILL SWITCH - PROTEÇÃO DE DEVTOOLS
// ═══════════════════════════════════════════════════════════
// ☢️ NUCLEAR SHIELD: ATIVO (2026-01-12)
const DEVTOOLS_PROTECTION_ENABLED = true;

// 🛡️ DEPRECATED: OWNER_EMAIL removido - usar RPC check_is_owner
// const OWNER_EMAIL = "moisesblank@gmail.com";

// Teclas bloqueadas em diferentes sistemas operacionais
const BLOCKED_KEYS = [
  // ═══════════════════════════════════════════════════════════
  // WINDOWS / LINUX
  // ═══════════════════════════════════════════════════════════
  { key: "F12", ctrl: false, shift: false, alt: false },
  { key: "F12", ctrl: true, shift: false, alt: false },
  { key: "I", ctrl: true, shift: true, alt: false }, // Ctrl+Shift+I
  { key: "J", ctrl: true, shift: true, alt: false }, // Ctrl+Shift+J (Console)
  { key: "C", ctrl: true, shift: true, alt: false }, // Ctrl+Shift+C (Inspect Element)
  { key: "U", ctrl: true, shift: false, alt: false }, // Ctrl+U (View Source)
  { key: "S", ctrl: true, shift: false, alt: false }, // Ctrl+S (Save)
  { key: "P", ctrl: true, shift: false, alt: false }, // Ctrl+P (Print)

  // ═══════════════════════════════════════════════════════════
  // PRINT SCREEN - WINDOWS
  // ═══════════════════════════════════════════════════════════
  { key: "PrintScreen", ctrl: false, shift: false, alt: false },
  { key: "PrintScreen", ctrl: false, shift: true, alt: false }, // Shift+PrintScreen
  { key: "PrintScreen", ctrl: true, shift: false, alt: false }, // Ctrl+PrintScreen
  { key: "PrintScreen", ctrl: false, shift: false, alt: true }, // Alt+PrintScreen

  // ═══════════════════════════════════════════════════════════
  // MACOS - Command (⌘) = metaKey, Option (⌥) = altKey
  // ═══════════════════════════════════════════════════════════
  // DevTools: Option + Command + I (equivalente ao F12 do Windows)
  { key: "I", meta: true, alt: true, shift: false },
  { key: "i", meta: true, alt: true, shift: false },
  // Console: Option + Command + J
  { key: "J", meta: true, alt: true, shift: false },
  { key: "j", meta: true, alt: true, shift: false },
  // Inspect Element: Option + Command + C
  { key: "C", meta: true, alt: true, shift: false },
  { key: "c", meta: true, alt: true, shift: false },
  // View Source: Command + U
  { key: "U", meta: true, alt: false, shift: false },
  { key: "u", meta: true, alt: false, shift: false },
  // Save: Command + S
  { key: "S", meta: true, alt: false, shift: false },
  { key: "s", meta: true, alt: false, shift: false },
  // Print: Command + P
  { key: "P", meta: true, alt: false, shift: false },
  { key: "p", meta: true, alt: false, shift: false },
  // Safari DevTools: Option + Command + I
  { key: "Dead", meta: true, alt: true }, // Algumas configs de teclado Mac

  // ═══════════════════════════════════════════════════════════
  // MACOS - Screenshot shortcuts
  // ═══════════════════════════════════════════════════════════
  // Command + Shift + 3 (Full screen screenshot)
  { key: "3", meta: true, shift: true, alt: false },
  // Command + Shift + 4 (Selection screenshot)
  { key: "4", meta: true, shift: true, alt: false },
  // Command + Shift + 5 (Screenshot toolbar)
  { key: "5", meta: true, shift: true, alt: false },
  // Command + Shift + 6 (Touch Bar screenshot)
  { key: "6", meta: true, shift: true, alt: false },
];

// Teclas de Print Screen (múltiplos formatos)
const PRINT_SCREEN_KEYS = ["PrintScreen", "PrtSc", "PrtScn", "Print", "Snapshot"];

export function useGlobalDevToolsBlock() {
  const isOwnerRef = useRef(false);
  const warningShownRef = useRef(false);

  useEffect(() => {
    // 🚨 PROTEÇÃO DESATIVADA - EARLY RETURN
    if (!DEVTOOLS_PROTECTION_ENABLED) {
      console.log('🔧 [DevTools Protection] DESATIVADO globalmente');
      return;
    }

    // Verificar se usuário é owner
    let nuclearCleanup: (() => void) | null = null;
    
    const checkOwner = async () => {
      try {
        // 🛡️ v2: Verificar owner via RPC (não por email)
        const { data: isOwnerData } = await supabase.rpc('check_is_owner');
        isOwnerRef.current = isOwnerData === true;

        // ☢️ NUCLEAR SHIELD: inicializar com ROLE (evita depender de email no bundle)
        nuclearCleanup = initNuclearShield(isOwnerRef.current ? 'owner' : null);

        // Se for owner, remover restrições de CSS
        if (isOwnerRef.current) {
          document.body.classList.add("owner-mode");
        } else {
          document.body.classList.remove("owner-mode");
        }
      } catch {
        isOwnerRef.current = false;
        // ☢️ Inicializar Nuclear Shield sem role (proteção máxima)
        nuclearCleanup = initNuclearShield(null);
      }
    };

    checkOwner();

    // Listener de mudança de auth
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async () => {
      const { data: isOwnerData } = await supabase.rpc('check_is_owner');
      isOwnerRef.current = isOwnerData === true;

      if (isOwnerRef.current) {
        document.body.classList.add("owner-mode");
      } else {
        document.body.classList.remove("owner-mode");
      }
    });

    // 🏛️ LEI I: ZERO console spam em produção - apenas toast
    const showWarning = (type: "devtools" | "screenshot" | "copy" = "devtools") => {
      if (warningShownRef.current) return;
      warningShownRef.current = true;

      // Toast apenas - sem console spam (salva CPU)
      if (type === "screenshot") {
        toast.error("Screenshot bloqueado!", { duration: 2000, icon: "🛡️" });
      } else if (type === "copy") {
        toast.error("Conteúdo protegido!", { duration: 2000, icon: "🔒" });
      }
      // DevTools: silencioso (sem toast repetitivo)

      // Reset após 10 segundos (reduz frequência)
      setTimeout(() => {
        warningShownRef.current = false;
      }, 10000);
    };

    // ═══════════════════════════════════════════════════════════
    // BLOQUEIO TOTAL DE CÓPIA (Ctrl+C, Ctrl+X, Command+C, Command+X)
    // ═══════════════════════════════════════════════════════════
    const handleKeyDown = (e: KeyboardEvent) => {
      // Owner pode tudo
      if (isOwnerRef.current) return;

      // Safe guard: e.key pode ser undefined em alguns dispositivos/navegadores
      const key = e.key;
      if (!key) return;

      const keyUpper = key.toUpperCase();

      // ═══════════════════════════════════════════════════════════
      // BLOQUEIO DE CTRL+C / CTRL+X / CTRL+A (Windows/Linux)
      // ═══════════════════════════════════════════════════════════
      if (e.ctrlKey && !e.shiftKey && !e.altKey && !e.metaKey) {
        if (keyUpper === "C" || keyUpper === "X") {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
          showWarning("copy");
          return false;
        }
      }

      // ═══════════════════════════════════════════════════════════
      // BLOQUEIO DE CMD+C / CMD+X (macOS)
      // ═══════════════════════════════════════════════════════════
      if (e.metaKey && !e.ctrlKey && !e.altKey) {
        if (keyUpper === "C" || keyUpper === "X") {
          // Verificar se não é Ctrl+Shift+C (devtools)
          if (!e.shiftKey) {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            showWarning("copy");
            return false;
          }
        }
      }

      // ═══════════════════════════════════════════════════════════
      // BLOQUEIO DE PRINT SCREEN (múltiplos formatos)
      // ═══════════════════════════════════════════════════════════
      if (PRINT_SCREEN_KEYS.includes(key) || PRINT_SCREEN_KEYS.includes(keyUpper)) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        showWarning("screenshot");

        // Limpar clipboard para prevenir captura
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText("").catch(() => {});
        }
        return false;
      }

      // ═══════════════════════════════════════════════════════════
      // BLOQUEIO Windows + Shift + S (Snipping Tool)
      // ═══════════════════════════════════════════════════════════
      if ((key === "s" || key === "S") && e.shiftKey && e.metaKey) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        showWarning("screenshot");
        return false;
      }

      // Windows Key + Shift + S detection (via keyCode for Windows key)
      if ((key === "s" || key === "S") && e.shiftKey && e.getModifierState && e.getModifierState("Meta")) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        showWarning("screenshot");
        return false;
      }

      // ⚠️ F12 TEMPORARIAMENTE LIBERADO PARA DEBUG
      // Verificar F12 (Windows e Mac com fn+F12)
      if (key === "F12") {
        e.preventDefault();
        e.stopPropagation();
        showWarning("devtools");
        return;
      }
      // if (key === 'F12') {
      //   e.preventDefault();
      //   e.stopPropagation();
      //   showWarning('devtools');
      //   return;
      // }

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
              showWarning("screenshot");
            } else {
              showWarning("devtools");
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
            if (["3", "4", "5", "6"].includes(blocked.key)) {
              showWarning("screenshot");
            } else {
              showWarning("devtools");
            }
            return;
          }
        }
      }
    };

    // ═══════════════════════════════════════════════════════════
    // BLOQUEIO TOTAL NO EVENTO COPY (backup)
    // ═══════════════════════════════════════════════════════════
    const handleCopy = (e: ClipboardEvent) => {
      if (isOwnerRef.current) return;

      // Bloquear TODA cópia de conteúdo
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();

      // Limpar clipboard
      if (e.clipboardData) {
        e.clipboardData.setData("text/plain", "");
        e.clipboardData.setData("text/html", "");
      }

      showWarning("copy");
      return false;
    };

    // ═══════════════════════════════════════════════════════════
    // BLOQUEIO DE CUT (Ctrl+X / Cmd+X)
    // ═══════════════════════════════════════════════════════════
    const handleCut = (e: ClipboardEvent) => {
      if (isOwnerRef.current) return;

      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();

      showWarning("copy");
      return false;
    };

    // ═══════════════════════════════════════════════════════════
    // BLOQUEIO DE DRAG AND DROP (para evitar arrastar conteúdo)
    // ═══════════════════════════════════════════════════════════
    const handleDragStart = (e: DragEvent) => {
      if (isOwnerRef.current) return;

      e.preventDefault();
      e.stopPropagation();
      showWarning("copy");
    };

    // ═══════════════════════════════════════════════════════════
    // DETECÇÃO DE VISIBILITYCHANGE (usuário saiu para fazer screenshot)
    // ═══════════════════════════════════════════════════════════
    const handleVisibilityChange = () => {
      if (isOwnerRef.current) return;

      // 🏛️ LEI I: Silencioso - sem console spam em visibility change
    };

    // Bloqueio de clique direito global (silencioso)
    const handleContextMenu = (e: MouseEvent) => {
      if (isOwnerRef.current) return;
      e.preventDefault();
      // 🏛️ LEI I: Sem warning repetitivo - apenas bloqueia
    };

    // Detecção de DevTools aberto (silenciosa - salva CPU)
    const detectDevTools = () => {
      if (isOwnerRef.current) return;

      const threshold = 160;
      const widthCheck = window.outerWidth - window.innerWidth > threshold;
      const heightCheck = window.outerHeight - window.innerHeight > threshold;

      if (widthCheck || heightCheck) {
        // 🏛️ LEI I: SILENCIOSO - sem console spam, sem clear
        // Apenas marca internamente para uso futuro se necessário
      }
    };

    // ═══════════════════════════════════════════════════════════
    // CSS ANTI-COPY + ANTI-SCREENSHOT
    // Bloqueia seleção e cópia de todo conteúdo (exceto owner)
    // ═══════════════════════════════════════════════════════════
    const addProtectionCSS = () => {
      const style = document.createElement("style");
      style.id = "global-protection-css";
      style.textContent = `
        /* ═══════════════════════════════════════════════════════════
           BLOQUEIO GLOBAL DE CÓPIA - v3.0
           Permite seleção, mas bloqueia cópia de conteúdo
        ═══════════════════════════════════════════════════════════ */
        
        /* Desabilitar arrastar conteúdo */
        body:not(.owner-mode) *:not(input):not(textarea) {
          -webkit-user-drag: none !important;
          -khtml-user-drag: none !important;
          -moz-user-drag: none !important;
          -o-user-drag: none !important;
          user-drag: none !important;
        }
        
        /* Desabilitar seleção de texto em áreas protegidas */
        body:not(.owner-mode) {
          -webkit-touch-callout: none !important;
        }
        
        /* Desabilitar cópia via CSS (backup adicional) */
        body:not(.owner-mode) *::selection {
          background: hsl(var(--primary) / 0.3) !important;
        }
        
        body:not(.owner-mode) *::-moz-selection {
          background: hsl(var(--primary) / 0.3) !important;
        }
        
        /* Desabilitar print (backup) */
        @media print {
          body:not(.owner-mode) {
            display: none !important;
          }
        }
        
        /* Proteger imagens */
        body:not(.owner-mode) img {
          pointer-events: none !important;
          -webkit-user-drag: none !important;
        }
        
        /* Proteger vídeos */
        body:not(.owner-mode) video {
          pointer-events: auto !important;
        }
        
        /* Proteger iframes */
        body:not(.owner-mode) iframe {
          pointer-events: auto !important;
        }
        
        /* Proteger PDFs embutidos */
        body:not(.owner-mode) embed,
        body:not(.owner-mode) object {
          pointer-events: auto !important;
        }
        
        /* Adicionar marca d'água invisível */
        body:not(.owner-mode)::after {
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
        
        /* OWNER MODE - Liberar tudo */
        body.owner-mode * {
          -webkit-user-select: auto !important;
          -moz-user-select: auto !important;
          -ms-user-select: auto !important;
          user-select: auto !important;
          -webkit-user-drag: auto !important;
        }
        
        body.owner-mode img {
          pointer-events: auto !important;
          -webkit-user-drag: auto !important;
        }
      `;
      document.head.appendChild(style);
    };

    // Adicionar CSS de proteção
    addProtectionCSS();

    // Adicionar listeners
    document.addEventListener("keydown", handleKeyDown, true);
    document.addEventListener("keyup", handleKeyDown, true);
    document.addEventListener("contextmenu", handleContextMenu, true);
    document.addEventListener("copy", handleCopy, true);
    document.addEventListener("cut", handleCut, true);
    document.addEventListener("dragstart", handleDragStart, true);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Verificar DevTools periodicamente
    // 🏛️ PATCH-LOOP: Aumentado de 10s para 60s para MÁXIMA economia de CPU
    // A proteção por teclas (F12, Ctrl+Shift+I) já é suficiente - polling é backup de último recurso
    const devToolsInterval = setInterval(detectDevTools, 60000);

    return () => {
      document.removeEventListener("keydown", handleKeyDown, true);
      document.removeEventListener("keyup", handleKeyDown, true);
      document.removeEventListener("contextmenu", handleContextMenu, true);
      document.removeEventListener("copy", handleCopy, true);
      document.removeEventListener("cut", handleCut, true);
      document.removeEventListener("dragstart", handleDragStart, true);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      clearInterval(devToolsInterval);
      subscription.unsubscribe();

      // Remover CSS
      const style = document.getElementById("global-protection-css");
      if (style) style.remove();

      // Remover classe owner
      document.body.classList.remove("owner-mode");
    };
  }, []);
}
