// ============================================
// 🚨 BLACKOUT ANTI-PIRATARIA v1.2
// Hook de controle de detecções e punições
// PROTEÇÃO GLOBAL + DETECÇÃO DE GRAVAÇÃO + BLUR PATTERN
// ============================================

import { useEffect, useCallback, useRef } from "react";
import { useLocation } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useSecurityBlackoutStore, ViolationType } from "@/stores/securityBlackoutStore";
import { useRecordingDetection } from "@/hooks/useRecordingDetection";

const OWNER_EMAIL = "moisesblank@gmail.com";
// 🚨 v1.2: PROTEÇÃO GLOBAL - Aplica em TODO o sistema

interface UseSecurityBlackoutOptions {
  enabled?: boolean;
  isVideoPlaying?: boolean; // v1.2: Para ativar detecção de gravação
}

export function useSecurityBlackout(options: UseSecurityBlackoutOptions = {}) {
  const { enabled = true, isVideoPlaying = false } = options;
  const location = useLocation();
  const isOwnerRef = useRef(false);
  const detectionActiveRef = useRef(false);
  
  const {
    isBlocked,
    blockType,
    blockEndTime,
    printScreenCount,
    lastViolationType,
    watermarkBoostEndTime,
    registerViolation,
    registerBlur,
    checkAndClearExpiredBlocks,
    resetAll,
  } = useSecurityBlackoutStore();

  // v1.2: Detecção de gravação (APIs + extensões + PiP)
  const { isRecordingDetected, detectionReason, triggerRecordingBlock } = useRecordingDetection(isVideoPlaying);

  // 🚨 v1.2: PROTEÇÃO GLOBAL - Sempre ativo (exceto rotas públicas)
  const PUBLIC_ROUTES = ["/auth", "/termos", "/privacidade", "/", "/site"];
  const isPublicRoute = PUBLIC_ROUTES.some(route => location.pathname === route);
  const isTargetRoute = !isPublicRoute; // Protege TUDO exceto rotas públicas

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
  const handleViolation = useCallback(async (type: ViolationType, details?: string) => {
    // Owner é imune
    if (isOwnerRef.current) return;
    
    // 🚨 v1.2: Só ignora rotas públicas
    const PUBLIC_ROUTES = ["/auth", "/termos", "/privacidade", "/", "/site"];
    if (PUBLIC_ROUTES.some(route => location.pathname === route)) return;
    
    // Registrar no store
    registerViolation(type, location.pathname, details);
    
    // Mostrar toast de warning baseado no tipo
    if (type === "devtools" || type === "screen_capture" || type === "recording_api" || 
        type === "recording_extension" || type === "picture_in_picture" || type === "suspicious_blur") {
      toast.error("🚨 ACESSO BLOQUEADO", {
        description: "Tentativa de captura/gravação detectada. Seu acesso foi registrado.",
        duration: 5000,
      });
    } else if (type === "window_blur") {
      // v1.2: Blur único não mostra toast (apenas padrão suspeito)
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
        .select("nome, cpf")
        .eq("id", user.id)
        .single();

      await supabase.from("video_access_logs").insert({
        user_id: user.id,
        action: "warn" as const,
        details: {
          event_type: "SECURITY_VIOLATION",
          violation_type: type,
          violation_details: details,
          is_violation: true,
          user_email: user.email,
          user_name: profile?.nome || user.user_metadata?.name,
          user_cpf: profile?.cpf,
          event_description: `Blackout Anti-Pirataria v1.2: ${type} detectado em ${location.pathname}`,
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
        handleViolation("devtools", "dimension_check");
      }
    };
    
    // Verificar a cada 2 segundos
    const interval = setInterval(detectDevTools, 2000);
    
    return () => clearInterval(interval);
  }, [enabled, isTargetRoute, handleViolation]);

  // ═══════════════════════════════════════════════════════════
  // v1.2: DETECÇÃO DE BLUR PATTERN (5+ blurs em <3s = suspeito)
  // ═══════════════════════════════════════════════════════════
  useEffect(() => {
    if (!enabled || !isTargetRoute || isOwnerRef.current) return;
    
    const handleBlur = () => {
      if (isOwnerRef.current) return;
      
      // Registrar blur e verificar padrão
      const isSuspicious = registerBlur();
      
      if (isSuspicious) {
        // Padrão suspeito detectado! 5+ blurs em <3s
        handleViolation("suspicious_blur", "5+_blurs_in_3s");
      }
    };
    
    window.addEventListener("blur", handleBlur);
    return () => window.removeEventListener("blur", handleBlur);
  }, [enabled, isTargetRoute, handleViolation, registerBlur]);

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
        handleViolation("printscreen", "key_detected");
        
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
        handleViolation("screenshot", "snipping_tool");
        return;
      }
      
      // Mac screenshots: Cmd+Shift+3/4/5
      if (e.metaKey && e.shiftKey && ["3", "4", "5", "6"].includes(key)) {
        e.preventDefault();
        e.stopPropagation();
        handleViolation("screenshot", "mac_screenshot");
        return;
      }
      
      // F12 = DevTools
      if (key === "F12") {
        e.preventDefault();
        e.stopPropagation();
        handleViolation("devtools", "f12_key");
        return;
      }
      
      // Ctrl+Shift+I/J/C = DevTools
      if (e.ctrlKey && e.shiftKey && ["I", "i", "J", "j", "C", "c"].includes(key)) {
        e.preventDefault();
        e.stopPropagation();
        handleViolation("devtools", "ctrl_shift_shortcut");
        return;
      }
      
      // Cmd+Option+I/J/C = DevTools (Mac)
      if (e.metaKey && e.altKey && ["I", "i", "J", "j", "C", "c"].includes(key)) {
        e.preventDefault();
        e.stopPropagation();
        handleViolation("devtools", "cmd_option_shortcut");
        return;
      }
    };
    
    document.addEventListener("keydown", handleKeyDown, { capture: true });
    return () => document.removeEventListener("keydown", handleKeyDown, { capture: true });
  }, [enabled, isTargetRoute, handleViolation]);

  // ═══════════════════════════════════════════════════════════
  // v1.2: SINCRONIZAR DETECÇÃO DE GRAVAÇÃO COM STORE
  // ═══════════════════════════════════════════════════════════
  useEffect(() => {
    if (isRecordingDetected && detectionReason) {
      // Determinar tipo de violação
      let violationType: ViolationType = "recording_api";
      
      if (detectionReason.includes("extension")) {
        violationType = "recording_extension";
      } else if (detectionReason.includes("picture_in_picture")) {
        violationType = "picture_in_picture";
      } else if (detectionReason.includes("MediaRecorder")) {
        violationType = "recording_api";
      }
      
      // Registrar no store (isso ativa o bloqueio permanente)
      registerViolation(violationType, location.pathname, detectionReason);
    }
  }, [isRecordingDetected, detectionReason, registerViolation, location.pathname]);

  return {
    // Estado de bloqueio (combinado: store + detecção de gravação)
    isBlocked: isTargetRoute ? (isBlocked || isRecordingDetected) : false,
    blockType: isRecordingDetected ? "permanent" : blockType,
    blockEndTime,
    lastViolationType,
    watermarkBoostActive: watermarkBoostEndTime ? Date.now() < watermarkBoostEndTime : false,
    isOwner: isOwnerRef.current,
    isTargetRoute,
    // v1.2: Detecção de gravação
    isRecordingDetected,
    recordingReason: detectionReason,
    // Actions
    triggerViolation: handleViolation,
    triggerRecordingBlock,
    resetAll, // Para owner/debug
  };
}
