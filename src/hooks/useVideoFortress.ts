// ============================================
// 🔥 USE VIDEO FORTRESS - HOOK DEFINITIVO
// Integração completa com backend de proteção
// Autor: MESTRE (Claude Opus 4.5 PHD)
// ============================================

import { useState, useCallback, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

// ============================================
// TIPOS
// ============================================
export interface VideoSession {
  sessionId: string;
  sessionCode: string;
  sessionToken: string;
  embedUrl: string;
  expiresAt: string;
  watermark: {
    text: string;
    hash: string;
    mode: "moving" | "static";
  };
  provider: "panda" | "youtube";
  drmEnabled: boolean;
}

export interface VideoFortressState {
  isAuthorizing: boolean;
  isAuthorized: boolean;
  session: VideoSession | null;
  error: string | null;
  isSessionValid: boolean;
  riskScore: number;
}

export type ViolationType =
  | "devtools_open"
  | "screenshot_attempt"
  | "screen_recording"
  | "multiple_sessions"
  | "invalid_domain"
  | "keyboard_shortcut"
  | "context_menu"
  | "drag_attempt"
  | "copy_attempt"
  | "visibility_abuse"
  | "iframe_manipulation"
  | "unknown";

interface AuthorizeOptions {
  lessonId?: string;
  courseId?: string;
  providerVideoId: string;
  provider?: "panda" | "youtube";
}

// ============================================
// HOOK PRINCIPAL
// ============================================
export function useVideoFortress() {
  const { user } = useAuth();
  
  const [state, setState] = useState<VideoFortressState>({
    isAuthorizing: false,
    isAuthorized: false,
    session: null,
    error: null,
    isSessionValid: true,
    riskScore: 0,
  });

  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const visibilityViolationsRef = useRef<number>(0);
  const lastHeartbeatRef = useRef<number>(0);

  // ============================================
  // AUTORIZAR VÍDEO
  // ============================================
  const authorize = useCallback(async (options: AuthorizeOptions): Promise<VideoSession | null> => {
    if (!user) {
      setState(prev => ({ ...prev, error: "Usuário não autenticado" }));
      return null;
    }

    setState(prev => ({ ...prev, isAuthorizing: true, error: null }));

    try {
      const { data: { session: authSession } } = await supabase.auth.getSession();
      
      if (!authSession?.access_token) {
        throw new Error("Sessão de autenticação inválida");
      }

      // Gerar device fingerprint simples
      const deviceFingerprint = await generateDeviceFingerprint();

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/video-authorize`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${authSession.access_token}`,
            "x-device-fingerprint": deviceFingerprint,
            "x-request-origin": window.location.origin,
          },
          body: JSON.stringify({
            lesson_id: options.lessonId,
            course_id: options.courseId,
            provider_video_id: options.providerVideoId,
            provider: options.provider || "panda",
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        const errorMessage = getErrorMessage(data.error);
        setState(prev => ({ 
          ...prev, 
          isAuthorizing: false, 
          error: errorMessage,
          isAuthorized: false,
        }));
        toast.error("Erro ao autorizar vídeo", { description: errorMessage });
        return null;
      }

      const session: VideoSession = {
        sessionId: data.sessionId,
        sessionCode: data.sessionCode,
        sessionToken: data.sessionToken,
        embedUrl: data.embedUrl,
        expiresAt: data.expiresAt,
        watermark: data.watermark,
        provider: data.provider,
        drmEnabled: data.drmEnabled,
      };

      setState(prev => ({
        ...prev,
        isAuthorizing: false,
        isAuthorized: true,
        session,
        error: null,
        isSessionValid: true,
      }));

      // Iniciar heartbeat
      startHeartbeat(session.sessionToken);

      return session;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro desconhecido";
      setState(prev => ({ 
        ...prev, 
        isAuthorizing: false, 
        error: message,
        isAuthorized: false,
      }));
      toast.error("Falha na autorização", { description: message });
      return null;
    }
  }, [user]);

  // ============================================
  // HEARTBEAT
  // ============================================
  const startHeartbeat = useCallback((sessionToken: string) => {
    // Limpar heartbeat anterior
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
    }

    const sendHeartbeat = async () => {
      try {
        const now = Date.now();
        // Evitar heartbeats muito frequentes
        if (now - lastHeartbeatRef.current < 25000) return;
        lastHeartbeatRef.current = now;

        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/video-heartbeat`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-session-token": sessionToken,
            },
            body: JSON.stringify({
              session_token: sessionToken,
              position_seconds: getCurrentVideoPosition(),
            }),
          }
        );

        const data = await response.json();

        if (!data.success) {
          // Sessão inválida
          setState(prev => ({
            ...prev,
            isSessionValid: false,
            error: "Sessão expirada ou revogada",
          }));

          if (data.requireReauthorization) {
            toast.error("Sessão encerrada", {
              description: "Sua sessão de vídeo expirou. Clique para recarregar.",
              action: {
                label: "Recarregar",
                onClick: () => window.location.reload(),
              },
            });
          }

          stopHeartbeat();
        }
      } catch (error) {
        console.warn("Heartbeat failed:", error);
      }
    };

    // Primeiro heartbeat após 30s
    heartbeatIntervalRef.current = setInterval(sendHeartbeat, 30000);
  }, []);

  const stopHeartbeat = useCallback(() => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }
  }, []);

  // ============================================
  // REPORTAR VIOLAÇÃO
  // ============================================
  const reportViolation = useCallback(async (
    type: ViolationType,
    details?: Record<string, unknown>
  ) => {
    if (!state.session?.sessionToken) return;

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/video-violation`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-session-token": state.session.sessionToken,
          },
          body: JSON.stringify({
            session_token: state.session.sessionToken,
            violation_type: type,
            details,
            timestamp: new Date().toISOString(),
          }),
        }
      );

      const data = await response.json();

      if (data.success) {
        setState(prev => ({
          ...prev,
          riskScore: data.riskScore || prev.riskScore,
        }));

        // Executar instruções do backend
        if (data.instructions?.sessionRevoked || data.sessionRevoked) {
          setState(prev => ({ ...prev, isSessionValid: false }));
          stopHeartbeat();
        }

        if (data.instructions?.message) {
          toast.warning("⚠️ Alerta de Segurança", {
            description: data.instructions.message,
          });
        }

        return data.instructions;
      }
    } catch (error) {
      console.warn("Failed to report violation:", error);
    }

    return null;
  }, [state.session?.sessionToken, stopHeartbeat]);

  // ============================================
  // DETECTORES DE VIOLAÇÃO
  // ============================================
  
  // Detector de DevTools
  const detectDevTools = useCallback(() => {
    const threshold = 160;
    const widthDiff = window.outerWidth - window.innerWidth > threshold;
    const heightDiff = window.outerHeight - window.innerHeight > threshold;

    if (widthDiff || heightDiff) {
      reportViolation("devtools_open", {
        widthDiff: window.outerWidth - window.innerWidth,
        heightDiff: window.outerHeight - window.innerHeight,
      });
      return true;
    }
    return false;
  }, [reportViolation]);

  // Detector de visibilidade
  const handleVisibilityChange = useCallback(() => {
    if (document.hidden) {
      visibilityViolationsRef.current++;
      
      // Muitas mudanças de visibilidade = suspeito
      if (visibilityViolationsRef.current >= 5) {
        reportViolation("visibility_abuse", {
          count: visibilityViolationsRef.current,
        });
      }
    }
  }, [reportViolation]);

  // Bloquear atalhos perigosos
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const isCtrl = e.ctrlKey || e.metaKey;
    const isShift = e.shiftKey;
    const key = e.key.toLowerCase();

    // Atalhos bloqueados
    const blocked = (
      (isCtrl && ["s", "p", "c", "u"].includes(key)) ||
      e.key === "F12" ||
      (isCtrl && isShift && ["i", "j", "c", "k"].includes(key)) ||
      (e.altKey && e.metaKey && key === "i")
    );

    if (blocked) {
      e.preventDefault();
      e.stopPropagation();
      reportViolation("keyboard_shortcut", { key: e.key, ctrl: isCtrl, shift: isShift });
      return false;
    }
  }, [reportViolation]);

  // ============================================
  // SETUP DOS DETECTORES
  // ============================================
  useEffect(() => {
    if (!state.isAuthorized) return;

    // Detectar DevTools a cada segundo
    const devToolsInterval = setInterval(detectDevTools, 1000);

    // Listener de visibilidade
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Listener de teclado
    window.addEventListener("keydown", handleKeyDown);

    // Cleanup
    return () => {
      clearInterval(devToolsInterval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [state.isAuthorized, detectDevTools, handleVisibilityChange, handleKeyDown]);

  // Cleanup geral
  useEffect(() => {
    return () => {
      stopHeartbeat();
    };
  }, [stopHeartbeat]);

  // ============================================
  // FINALIZAR SESSÃO
  // ============================================
  const endSession = useCallback(async (finalPosition?: number, completionPercentage?: number) => {
    if (!state.session?.sessionToken) return;

    try {
      const { data: { session: authSession } } = await supabase.auth.getSession();
      
      await supabase.rpc("end_video_session", {
        p_session_token: state.session.sessionToken,
        p_final_position: finalPosition,
        p_completion_percentage: completionPercentage,
      });

      stopHeartbeat();
      setState(prev => ({
        ...prev,
        isAuthorized: false,
        session: null,
        isSessionValid: false,
      }));
    } catch (error) {
      console.warn("Failed to end session:", error);
    }
  }, [state.session?.sessionToken, stopHeartbeat]);

  // ============================================
  // RETORNO
  // ============================================
  return {
    ...state,
    authorize,
    reportViolation,
    endSession,
    stopHeartbeat,
  };
}

// ============================================
// UTILITÁRIOS
// ============================================

function getErrorMessage(errorCode: string): string {
  const messages: Record<string, string> = {
    UNAUTHORIZED_DOMAIN: "Este domínio não está autorizado",
    UNAUTHORIZED: "Você precisa estar logado",
    INVALID_TOKEN: "Sessão expirada, faça login novamente",
    USER_BANNED: "Seu acesso foi bloqueado por violações de segurança",
    SUBSCRIPTION_EXPIRED: "Sua assinatura expirou",
    SESSION_REVOKED: "Sessão encerrada por segurança",
    SESSION_EXPIRED: "Sessão expirada",
  };
  return messages[errorCode] || "Erro ao autorizar vídeo";
}

async function generateDeviceFingerprint(): Promise<string> {
  const components = [
    navigator.userAgent,
    navigator.language,
    screen.width,
    screen.height,
    screen.colorDepth,
    new Date().getTimezoneOffset(),
    navigator.hardwareConcurrency,
  ];

  const text = components.join("|");
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("").slice(0, 32);
}

function getCurrentVideoPosition(): number {
  // Tentar pegar posição do player ativo
  const video = document.querySelector("video");
  if (video) return Math.floor(video.currentTime);
  return 0;
}

// ============================================
// HOOK AUXILIAR: Proteção de Conteúdo
// ============================================
export function useContentProtection(containerRef: React.RefObject<HTMLElement>) {
  const { reportViolation } = useVideoFortress();

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleContextMenu = (e: Event) => {
      e.preventDefault();
      reportViolation("context_menu");
      return false;
    };

    const handleDragStart = (e: Event) => {
      e.preventDefault();
      reportViolation("drag_attempt");
      return false;
    };

    const handleCopy = (e: Event) => {
      e.preventDefault();
      reportViolation("copy_attempt");
      return false;
    };

    container.addEventListener("contextmenu", handleContextMenu);
    container.addEventListener("dragstart", handleDragStart);
    container.addEventListener("copy", handleCopy);

    return () => {
      container.removeEventListener("contextmenu", handleContextMenu);
      container.removeEventListener("dragstart", handleDragStart);
      container.removeEventListener("copy", handleCopy);
    };
  }, [containerRef, reportViolation]);
}

export default useVideoFortress;
