/**
 * 🎯 SIMULADOS — Hook Anti-Cheat Consolidado
 * Constituição SYNAPSE Ω v10.0 | Modo Hard
 * 
 * Combina monitoramento de:
 * - Troca de aba (useTabFocus)
 * - Câmera (useCameraStream)
 * - Tempo restante
 * 
 * Frontend apenas REPORTA. Decisões são SERVER-SIDE.
 */

import { useState, useCallback, useEffect } from "react";
import { useTabFocus, type TabFocusState } from "./useTabFocus";
import { useCameraStream, type CameraState } from "./useCameraStream";

export interface AntiCheatState {
  isReady: boolean;
  tabFocus: TabFocusState;
  camera: CameraState;
  violations: AntiCheatViolation[];
  isInvalidated: boolean;
  invalidationReason: string | null;
}

export interface AntiCheatViolation {
  type: "TAB_SWITCH" | "CAMERA_DENIED" | "CAMERA_ERROR" | "TIME_EXPIRED";
  timestamp: Date;
  details?: string;
}

interface UseAntiCheatOptions {
  attemptId: string | null;
  isHardMode: boolean;
  maxTabSwitches: number;
  requiresCamera: boolean;
  durationMinutes: number;
  startedAt: Date | null;
  enabled?: boolean;
  onInvalidate?: (reason: string) => void;
  onTimeExpired?: () => void;
}

export function useAntiCheat(options: UseAntiCheatOptions) {
  const {
    attemptId,
    isHardMode,
    maxTabSwitches,
    requiresCamera,
    durationMinutes,
    startedAt,
    enabled = true,
    onInvalidate,
    onTimeExpired,
  } = options;

  const [violations, setViolations] = useState<AntiCheatViolation[]>([]);
  const [isReady, setIsReady] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number>(durationMinutes * 60);

  // Hook de Tab Focus
  const tabFocus = useTabFocus({
    attemptId,
    isHardMode,
    maxTabSwitches,
    enabled: enabled && isHardMode,
    onInvalidate: (reason) => {
      addViolation("TAB_SWITCH", reason);
      onInvalidate?.(reason);
    },
  });

  // Hook de Câmera
  const camera = useCameraStream({
    enabled: enabled && isHardMode && requiresCamera,
    requiresCamera,
    onDenied: () => {
      addViolation("CAMERA_DENIED", "Acesso à câmera negado");
    },
    onError: (error) => {
      addViolation("CAMERA_ERROR", error);
    },
  });

  /**
   * Adiciona violação ao registro local
   */
  const addViolation = useCallback((type: AntiCheatViolation["type"], details?: string) => {
    const violation: AntiCheatViolation = {
      type,
      timestamp: new Date(),
      details,
    };
    setViolations(prev => [...prev, violation]);
    console.log("[useAntiCheat] Violation recorded:", violation);
  }, []);

  /**
   * Inicializa o sistema anti-cheat
   */
  const initialize = useCallback(async (): Promise<boolean> => {
    if (!isHardMode) {
      setIsReady(true);
      return true;
    }

    // Se requer câmera, solicitar acesso
    if (requiresCamera) {
      const cameraGranted = await camera.requestCamera();
      if (!cameraGranted) {
        console.warn("[useAntiCheat] Camera access not granted");
        // Não bloqueia, mas registra violação
      }
    }

    setIsReady(true);
    return true;
  }, [isHardMode, requiresCamera, camera]);

  /**
   * Timer de tempo restante
   */
  useEffect(() => {
    if (!startedAt || !enabled) return;

    const endTime = new Date(startedAt.getTime() + durationMinutes * 60 * 1000);
    
    const updateTimer = () => {
      const now = new Date();
      const remaining = Math.max(0, Math.floor((endTime.getTime() - now.getTime()) / 1000));
      setTimeRemaining(remaining);

      if (remaining === 0) {
        addViolation("TIME_EXPIRED", "Tempo esgotado");
        onTimeExpired?.();
      }
    };

    updateTimer(); // Primeira execução
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [startedAt, durationMinutes, enabled, addViolation, onTimeExpired]);

  /**
   * Cleanup
   */
  const cleanup = useCallback(() => {
    camera.stopCamera();
    tabFocus.reset();
    setViolations([]);
    setIsReady(false);
  }, [camera, tabFocus]);

  /**
   * Formata tempo restante
   */
  const formatTimeRemaining = useCallback((): string => {
    const hours = Math.floor(timeRemaining / 3600);
    const minutes = Math.floor((timeRemaining % 3600) / 60);
    const seconds = timeRemaining % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  }, [timeRemaining]);

  return {
    // Estado consolidado
    isReady,
    isHardMode,
    tabFocus,
    camera,
    violations,
    timeRemaining,
    timeRemainingFormatted: formatTimeRemaining(),
    isInvalidated: tabFocus.isInvalidated,
    invalidationReason: tabFocus.invalidationReason,

    // Ações
    initialize,
    cleanup,

    // Conveniências
    isMonitoring: tabFocus.isMonitoring || camera.isActive,
    hasViolations: violations.length > 0,
    violationCount: violations.length,
    tabSwitchesRemaining: tabFocus.remainingAllowed,
  };
}
