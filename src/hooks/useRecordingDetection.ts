// ============================================
// 🚨 DETECÇÃO DE GRAVAÇÃO DE TELA v1.0
// Intercepta APIs de gravação e extensões conhecidas
// Integrado ao Blackout Anti-Pirataria v1.2
// ============================================

import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

// ═══════════════════════════════════════════════════════════
// EXTENSÕES CONHECIDAS DE GRAVAÇÃO
// ═══════════════════════════════════════════════════════════
const KNOWN_RECORDER_EXTENSIONS = [
  // Loom
  "__loom_recorder_injected__",
  "__loom__",
  "loom-sdk",
  "loom-desktop-recorder",
  // Vidyard
  "__vidyard__",
  "vidyard-sdk",
  // Screencastify
  "__screencastify__",
  "screencastify-extension",
  // Awesome Screenshot
  "__awesome_screenshot__",
  // Nimbus
  "__nimbus__",
  "nimbus-capture",
  // CloudApp
  "__cloudapp__",
  // Droplr
  "__droplr__",
  // Gyazo
  "__gyazo__",
  // ShareX (desktop mas pode ter bridge)
  "__sharex__",
];

// 🛡️ DEPRECATED: OWNER_EMAIL removido - usar role='owner' do useAuth
// const OWNER_EMAIL = "moisesblank@gmail.com";

interface RecordingDetectionResult {
  isRecordingDetected: boolean;
  detectionReason: string | null;
  triggerRecordingBlock: (reason: string) => void;
}

export function useRecordingDetection(isVideoPlaying: boolean = false): RecordingDetectionResult {
  const [isRecordingDetected, setIsRecordingDetected] = useState(false);
  const [detectionReason, setDetectionReason] = useState<string | null>(null);
  const isOwnerRef = useRef(false);
  const originalGetDisplayMedia = useRef<typeof navigator.mediaDevices.getDisplayMedia | null>(null);
  const originalMediaRecorder = useRef<typeof MediaRecorder | null>(null);

  // ═══════════════════════════════════════════════════════════
  // VERIFICAR SE É OWNER via RPC (role='owner')
  // ═══════════════════════════════════════════════════════════
  useEffect(() => {
    const checkOwner = async () => {
      try {
        const { data, error } = await supabase.rpc('check_is_owner');
        isOwnerRef.current = data === true && !error;
      } catch {
        isOwnerRef.current = false;
      }
    };
    checkOwner();
  }, []);

  // ═══════════════════════════════════════════════════════════
  // REGISTRAR VIOLAÇÃO NO BACKEND
  // ═══════════════════════════════════════════════════════════
  const registerViolation = useCallback(async (type: string, details: object) => {
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
          event_type: "RECORDING_DETECTED",
          violation_type: type,
          is_violation: true,
          severity: 5, // Gravidade máxima
          user_email: user.email,
          user_name: profile?.nome || user.user_metadata?.name,
          user_cpf: profile?.cpf,
          ...details,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
          url: window.location.href,
        },
      });

      console.error(`[RecordingDetection] ⛔ VIOLAÇÃO GRAVE: ${type}`, details);
    } catch (err) {
      console.error("[RecordingDetection] Erro ao registrar violação:", err);
    }
  }, []);

  // ═══════════════════════════════════════════════════════════
  // TRIGGER BLOQUEIO DE GRAVAÇÃO
  // ═══════════════════════════════════════════════════════════
  const triggerRecordingBlock = useCallback((reason: string) => {
    // Owner é imune
    if (isOwnerRef.current) return;

    setIsRecordingDetected(true);
    setDetectionReason(reason);
    
    registerViolation("RECORDING_DETECTED", { reason });
  }, [registerViolation]);

  // ═══════════════════════════════════════════════════════════
  // INTERCEPTAÇÕES E DETECÇÕES
  // ═══════════════════════════════════════════════════════════
  useEffect(() => {
    // Só ativar quando vídeo está tocando e não é owner
    if (!isVideoPlaying || isOwnerRef.current) return;

    // ───────────────────────────────────────────────────────────
    // 1. INTERCEPTAR getDisplayMedia (API de captura de tela)
    // ───────────────────────────────────────────────────────────
    if (navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
      originalGetDisplayMedia.current = navigator.mediaDevices.getDisplayMedia.bind(navigator.mediaDevices);

      navigator.mediaDevices.getDisplayMedia = async function(constraints?: DisplayMediaStreamOptions) {
        triggerRecordingBlock("getDisplayMedia_called");
        throw new Error("Screen capture is not allowed on this page");
      };
    }

    // ───────────────────────────────────────────────────────────
    // 2. INTERCEPTAR MediaRecorder
    // ───────────────────────────────────────────────────────────
    if (typeof window.MediaRecorder !== "undefined") {
      originalMediaRecorder.current = window.MediaRecorder;

      // @ts-ignore - Sobrescrevendo propositalmente
      window.MediaRecorder = function(...args: any[]) {
        triggerRecordingBlock("MediaRecorder_instantiated");
        throw new Error("Recording is not allowed on this page");
      };
    }

    // ───────────────────────────────────────────────────────────
    // 3. DETECTAR EXTENSÕES DE GRAVAÇÃO
    // ───────────────────────────────────────────────────────────
    const checkForExtensions = (): boolean => {
      if (isOwnerRef.current) return false;

      for (const signature of KNOWN_RECORDER_EXTENSIONS) {
        // Verificar no window
        if ((window as any)[signature]) {
          triggerRecordingBlock(`extension_detected_window: ${signature}`);
          return true;
        }

        // Verificar por ID de elemento
        if (document.getElementById(signature)) {
          triggerRecordingBlock(`extension_detected_id: ${signature}`);
          return true;
        }

        // Verificar por data-attribute
        if (document.querySelector(`[data-${signature}]`)) {
          triggerRecordingBlock(`extension_detected_data: ${signature}`);
          return true;
        }

        // Verificar por classe
        if (document.querySelector(`.${signature}`)) {
          triggerRecordingBlock(`extension_detected_class: ${signature}`);
          return true;
        }
      }

      // Verificar iframes suspeitos (Loom, Vidyard injetam iframes)
      const suspiciousIframes = document.querySelectorAll('iframe[src*="loom"], iframe[src*="vidyard"], iframe[src*="screencastify"]');
      if (suspiciousIframes.length > 0) {
        triggerRecordingBlock("suspicious_iframe_detected");
        return true;
      }

      return false;
    };

    // ───────────────────────────────────────────────────────────
    // 4. DETECTAR PICTURE-IN-PICTURE
    // ───────────────────────────────────────────────────────────
    const handlePiP = () => {
      if (isOwnerRef.current) return;

      if (document.pictureInPictureElement) {
        triggerRecordingBlock("picture_in_picture_detected");
      }
    };

    const handleEnterPiP = () => {
      if (isOwnerRef.current) return;
      triggerRecordingBlock("picture_in_picture_entered");
    };

    // ───────────────────────────────────────────────────────────
    // 5. MONITORAR document.visibilitychange para gravar via aba
    // ───────────────────────────────────────────────────────────
    const handleVisibilityChange = () => {
      if (isOwnerRef.current) return;

      // Se o documento está oculto durante reprodução, pode ser gravação
      if (document.visibilityState === "hidden" && isVideoPlaying) {
        // Não bloquear imediatamente - apenas logar (pode ser tab switch normal)
        console.warn("[RecordingDetection] Documento oculto durante reprodução de vídeo");
      }
    };

    // Verificar extensões periodicamente (a cada 5 segundos)
    const extensionCheckInterval = setInterval(checkForExtensions, 5000);

    // Event listeners
    document.addEventListener("enterpictureinpicture", handleEnterPiP);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Verificação inicial de extensões
    checkForExtensions();

    // Verificar PiP inicial
    handlePiP();

    // Cleanup
    return () => {
      // Restaurar getDisplayMedia original
      if (originalGetDisplayMedia.current && navigator.mediaDevices) {
        navigator.mediaDevices.getDisplayMedia = originalGetDisplayMedia.current;
      }

      // Restaurar MediaRecorder original
      if (originalMediaRecorder.current) {
        window.MediaRecorder = originalMediaRecorder.current;
      }

      clearInterval(extensionCheckInterval);
      document.removeEventListener("enterpictureinpicture", handleEnterPiP);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [isVideoPlaying, triggerRecordingBlock]);

  return {
    isRecordingDetected,
    detectionReason,
    triggerRecordingBlock,
  };
}
