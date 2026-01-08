// ============================================
// 🚨 BLACKOUT ANTI-PIRATARIA v1.0
// Hook de controle de detecções e punições
// Rota alvo: /alunos/videoaulas
// ============================================

import { useEffect, useCallback, useRef } from "react";
import { useLocation } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useSecurityBlackoutStore, ViolationType } from "@/stores/securityBlackoutStore";

const OWNER_EMAIL = "moisesblank@gmail.com";
const TARGET_PATH = "/alunos/videoaulas";

interface UseSecurityBlackoutOptions {
  enabled?: boolean;
}

export function useSecurityBlackout(options: UseSecurityBlackoutOptions = {}) {
  const { enabled = true } = options;
  const location = useLocation();
  const isOwnerRef = useRef(false);
  const lastBlurTimeRef = useRef(0);
  const detectionActiveRef = useRef(false);
  
  const {
    isBlocked,
    blockType,
    blockEndTime,
    printScreenCount,
    lastViolationType,
    watermarkBoostEndTime,
    registerViolation,
    checkAndClearExpiredBlocks,
    resetAll,
  } = useSecurityBlackoutStore();

  // Verificar se estamos na rota alvo
  const isTargetRoute = location.pathname.startsWith(TARGET_PATH);

  // ═══════════════════════════════════════════════════════════
  // VERIFICAR SE É OWNER
  // ═══════════════════════════════════════════════════════════
  useEffect(() => {
    const checkOwner = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        isOwnerRef.current = (user?.email || "").toLowerCase() === OWNER_EMAIL;
        
        // Se for owner, resetar qualquer bloqueio
        if (isOwnerRef.current) {
          resetAll();
        }
      } catch {
        isOwnerRef.current = false;
      }
    };

    checkOwner();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_, session) => {
      isOwnerRef.current = (session?.user?.email || "").toLowerCase() === OWNER_EMAIL;
      if (isOwnerRef.current) {
        resetAll();
      }
    });

    return () => subscription.unsubscribe();
  }, [resetAll]);

  // ═══════════════════════════════════════════════════════════
  // LIMPAR BLOQUEIOS EXPIRADOS
  // ═══════════════════════════════════════════════════════════
  useEffect(() => {
    if (!enabled || !isTargetRoute) return;
    
    const interval = setInterval(() => {
      checkAndClearExpiredBlocks();
    }, 1000);

    return () => clearInterval(interval);
  }, [enabled, isTargetRoute, checkAndClearExpiredBlocks]);

  // ═══════════════════════════════════════════════════════════
  // REGISTRAR VIOLAÇÃO COM LOG NO BACKEND
  // ═══════════════════════════════════════════════════════════
  const handleViolation = useCallback(async (type: ViolationType) => {
    // Owner é imune
    if (isOwnerRef.current) return;
    
    // Só atua na rota alvo
    if (!location.pathname.startsWith(TARGET_PATH)) return;
    
    // Registrar no store
    registerViolation(type, location.pathname);
    
    // Mostrar toast de warning
    if (type === "devtools" || type === "window_blur" || type === "screen_capture") {
      toast.error("🚨 ACESSO BLOQUEADO", {
        description: "Tentativa de captura detectada. Seu acesso foi registrado.",
        duration: 5000,
      });
    } else if (type === "printscreen" || type === "screenshot") {
      const count = printScreenCount + 1;
      if (count === 1) {
        toast.warning("⚠️ Captura de tela detectada!", {
          description: "Próxima tentativa resultará em suspensão temporária.",
          duration: 4000,
        });
      } else if (count === 2) {
        toast.error("🚫 Bloqueio temporário de 30 segundos", {
          description: "Múltiplas tentativas de captura detectadas.",
          duration: 5000,
        });
      }
    }
    
    // Logar no backend (video_access_logs via campo details)
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Buscar perfil para nome
      const { data: profile } = await supabase
        .from("profiles")
        .select("nome")
        .eq("id", user.id)
        .single();

      await supabase.from("video_access_logs").insert({
        user_id: user.id,
        action: "warn" as const,
        details: {
          event_type: "SECURITY_VIOLATION",
          violation_type: type,
          is_violation: true,
          user_email: user.email,
          user_name: profile?.nome || user.user_metadata?.name,
          event_description: `Blackout Anti-Pirataria: ${type} detectado em ${location.pathname}`,
          route: location.pathname,
          timestamp: new Date().toISOString(),
          print_screen_count: printScreenCount + 1,
          block_type: isBlocked ? blockType : null,
        },
      });
    } catch (err) {
      console.error("[SecurityBlackout] Erro ao logar violação:", err);
    }
  }, [location.pathname, printScreenCount, registerViolation, isBlocked, blockType]);

  // ═══════════════════════════════════════════════════════════
  // DETECÇÃO DE DEVTOOLS (via dimensões)
  // ═══════════════════════════════════════════════════════════
  useEffect(() => {
    if (!enabled || !isTargetRoute || isOwnerRef.current) return;
    
    const detectDevTools = () => {
      if (isOwnerRef.current) return;
      
      const threshold = 160;
      const widthCheck = window.outerWidth - window.innerWidth > threshold;
      const heightCheck = window.outerHeight - window.innerHeight > threshold;
      
      if ((widthCheck || heightCheck) && !detectionActiveRef.current) {
        detectionActiveRef.current = true;
        handleViolation("devtools");
      }
    };
    
    // Verificar a cada 2 segundos
    const interval = setInterval(detectDevTools, 2000);
    
    return () => clearInterval(interval);
  }, [enabled, isTargetRoute, handleViolation]);

  // ═══════════════════════════════════════════════════════════
  // DETECÇÃO DE WINDOW BLUR (possível screen capture)
  // ═══════════════════════════════════════════════════════════
  useEffect(() => {
    if (!enabled || !isTargetRoute || isOwnerRef.current) return;
    
    const handleBlur = () => {
      if (isOwnerRef.current) return;
      
      const now = Date.now();
      // Debounce de 5 segundos para evitar falsos positivos
      if (now - lastBlurTimeRef.current < 5000) return;
      lastBlurTimeRef.current = now;
      
      // Window blur durante videoaulas = suspeito
      handleViolation("window_blur");
    };
    
    window.addEventListener("blur", handleBlur);
    return () => window.removeEventListener("blur", handleBlur);
  }, [enabled, isTargetRoute, handleViolation]);

  // ═══════════════════════════════════════════════════════════
  // DETECÇÃO DE PRINT SCREEN (via keydown)
  // ═══════════════════════════════════════════════════════════
  useEffect(() => {
    if (!enabled || !isTargetRoute || isOwnerRef.current) return;
    
    const PRINT_SCREEN_KEYS = ["PrintScreen", "PrtSc", "PrtScn", "Print", "Snapshot"];
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isOwnerRef.current) return;
      
      const key = e.key;
      if (!key) return;
      
      // PrintScreen
      if (PRINT_SCREEN_KEYS.includes(key)) {
        e.preventDefault();
        e.stopPropagation();
        handleViolation("printscreen");
        
        // Limpar clipboard
        if (navigator.clipboard?.writeText) {
          navigator.clipboard.writeText("").catch(() => {});
        }
        return;
      }
      
      // Windows + Shift + S (Snipping Tool)
      if ((key === "s" || key === "S") && e.shiftKey && (e.metaKey || e.getModifierState?.("Meta"))) {
        e.preventDefault();
        e.stopPropagation();
        handleViolation("screenshot");
        return;
      }
      
      // Mac screenshots: Cmd+Shift+3/4/5
      if (e.metaKey && e.shiftKey && ["3", "4", "5", "6"].includes(key)) {
        e.preventDefault();
        e.stopPropagation();
        handleViolation("screenshot");
        return;
      }
      
      // F12 = DevTools
      if (key === "F12") {
        e.preventDefault();
        e.stopPropagation();
        handleViolation("devtools");
        return;
      }
      
      // Ctrl+Shift+I/J/C = DevTools
      if (e.ctrlKey && e.shiftKey && ["I", "i", "J", "j", "C", "c"].includes(key)) {
        e.preventDefault();
        e.stopPropagation();
        handleViolation("devtools");
        return;
      }
      
      // Cmd+Option+I/J/C = DevTools (Mac)
      if (e.metaKey && e.altKey && ["I", "i", "J", "j", "C", "c"].includes(key)) {
        e.preventDefault();
        e.stopPropagation();
        handleViolation("devtools");
        return;
      }
    };
    
    document.addEventListener("keydown", handleKeyDown, { capture: true });
    return () => document.removeEventListener("keydown", handleKeyDown, { capture: true });
  }, [enabled, isTargetRoute, handleViolation]);

  return {
    isBlocked: isTargetRoute ? isBlocked : false,
    blockType,
    blockEndTime,
    lastViolationType,
    watermarkBoostActive: watermarkBoostEndTime ? Date.now() < watermarkBoostEndTime : false,
    isOwner: isOwnerRef.current,
    isTargetRoute,
    triggerViolation: handleViolation,
    resetAll, // Para owner/debug
  };
}
