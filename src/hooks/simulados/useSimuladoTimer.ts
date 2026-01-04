/**
 * 🎯 SIMULADOS — Hook de Timer
 * Constituição SYNAPSE Ω v10.0
 * 
 * Timer preciso baseado em startedAt do servidor.
 * Não depende de clock local para decisões críticas.
 */

import { useState, useEffect, useCallback, useMemo } from "react";

export interface TimerState {
  timeRemaining: number; // segundos
  timeElapsed: number;   // segundos
  isExpired: boolean;
  isWarning: boolean;    // últimos 5 minutos
  isCritical: boolean;   // último minuto
  progress: number;      // 0-100
}

interface UseSimuladoTimerOptions {
  startedAt: Date | null;
  durationMinutes: number;
  enabled?: boolean;
  warningThresholdMinutes?: number;
  criticalThresholdMinutes?: number;
  onExpire?: () => void;
  onWarning?: () => void;
  onCritical?: () => void;
}

export function useSimuladoTimer(options: UseSimuladoTimerOptions) {
  const {
    startedAt,
    durationMinutes,
    enabled = true,
    warningThresholdMinutes = 5,
    criticalThresholdMinutes = 1,
    onExpire,
    onWarning,
    onCritical,
  } = options;

  const [state, setState] = useState<TimerState>({
    timeRemaining: durationMinutes * 60,
    timeElapsed: 0,
    isExpired: false,
    isWarning: false,
    isCritical: false,
    progress: 0,
  });

  // Flags para evitar callbacks duplicados
  const [hasCalledWarning, setHasCalledWarning] = useState(false);
  const [hasCalledCritical, setHasCalledCritical] = useState(false);
  const [hasCalledExpire, setHasCalledExpire] = useState(false);

  // Thresholds em segundos
  const warningThreshold = warningThresholdMinutes * 60;
  const criticalThreshold = criticalThresholdMinutes * 60;
  const totalDuration = durationMinutes * 60;

  /**
   * Calcula estado baseado no tempo atual
   */
  const calculateState = useCallback((): TimerState => {
    if (!startedAt) {
      return {
        timeRemaining: totalDuration,
        timeElapsed: 0,
        isExpired: false,
        isWarning: false,
        isCritical: false,
        progress: 0,
      };
    }

    const now = new Date();
    const elapsedMs = now.getTime() - startedAt.getTime();
    const elapsedSeconds = Math.floor(elapsedMs / 1000);
    const remainingSeconds = Math.max(0, totalDuration - elapsedSeconds);

    const isExpired = remainingSeconds === 0;
    const isWarning = remainingSeconds <= warningThreshold && remainingSeconds > criticalThreshold;
    const isCritical = remainingSeconds <= criticalThreshold && remainingSeconds > 0;
    const progress = Math.min(100, (elapsedSeconds / totalDuration) * 100);

    return {
      timeRemaining: remainingSeconds,
      timeElapsed: elapsedSeconds,
      isExpired,
      isWarning,
      isCritical,
      progress,
    };
  }, [startedAt, totalDuration, warningThreshold, criticalThreshold]);

  /**
   * Loop de atualização
   */
  useEffect(() => {
    if (!enabled || !startedAt) return;

    const update = () => {
      const newState = calculateState();
      setState(newState);

      // Callbacks de threshold (uma vez cada)
      if (newState.isWarning && !hasCalledWarning) {
        setHasCalledWarning(true);
        onWarning?.();
      }

      if (newState.isCritical && !hasCalledCritical) {
        setHasCalledCritical(true);
        onCritical?.();
      }

      if (newState.isExpired && !hasCalledExpire) {
        setHasCalledExpire(true);
        onExpire?.();
      }
    };

    update(); // Primeira execução
    const interval = setInterval(update, 1000);

    return () => clearInterval(interval);
  }, [enabled, startedAt, calculateState, hasCalledWarning, hasCalledCritical, hasCalledExpire, onWarning, onCritical, onExpire]);

  /**
   * Formata tempo para exibição
   */
  const formatTime = useCallback((seconds: number): string => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;

    if (h > 0) {
      return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
    }
    return `${m}:${s.toString().padStart(2, "0")}`;
  }, []);

  /**
   * Reset para novo simulado
   */
  const reset = useCallback(() => {
    setState({
      timeRemaining: totalDuration,
      timeElapsed: 0,
      isExpired: false,
      isWarning: false,
      isCritical: false,
      progress: 0,
    });
    setHasCalledWarning(false);
    setHasCalledCritical(false);
    setHasCalledExpire(false);
  }, [totalDuration]);

  // Formatações memorizadas
  const timeRemainingFormatted = useMemo(() => formatTime(state.timeRemaining), [formatTime, state.timeRemaining]);
  const timeElapsedFormatted = useMemo(() => formatTime(state.timeElapsed), [formatTime, state.timeElapsed]);

  return {
    ...state,
    timeRemainingFormatted,
    timeElapsedFormatted,
    reset,
    formatTime,
  };
}
