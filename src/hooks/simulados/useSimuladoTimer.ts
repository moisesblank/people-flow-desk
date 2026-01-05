/**
 * 🎯 SIMULADOS — Hook de Timer
 * Constituição SYNAPSE Ω v10.0
 * 
 * Timer preciso baseado em startedAt do servidor.
 * Não depende de clock local para decisões críticas.
 */

import { useState, useEffect, useCallback, useMemo, useRef } from "react";

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

  // Thresholds em segundos (estáveis)
  const warningThreshold = warningThresholdMinutes * 60;
  const criticalThreshold = criticalThresholdMinutes * 60;
  const totalDuration = durationMinutes * 60;

  const [state, setState] = useState<TimerState>({
    timeRemaining: totalDuration,
    timeElapsed: 0,
    isExpired: false,
    isWarning: false,
    isCritical: false,
    progress: 0,
  });

  // Usar refs para flags de callback (evita re-render loops)
  const hasCalledWarningRef = useRef(false);
  const hasCalledCriticalRef = useRef(false);
  const hasCalledExpireRef = useRef(false);
  
  // Refs para callbacks (estabilidade)
  const onExpireRef = useRef(onExpire);
  const onWarningRef = useRef(onWarning);
  const onCriticalRef = useRef(onCritical);
  
  // Atualizar refs quando callbacks mudam
  useEffect(() => {
    onExpireRef.current = onExpire;
    onWarningRef.current = onWarning;
    onCriticalRef.current = onCritical;
  }, [onExpire, onWarning, onCritical]);

  /**
   * Loop de atualização do timer - ESTÁVEL
   */
  useEffect(() => {
    if (!enabled || !startedAt) {
      // Reset state quando desabilitado
      setState({
        timeRemaining: totalDuration,
        timeElapsed: 0,
        isExpired: false,
        isWarning: false,
        isCritical: false,
        progress: 0,
      });
      return;
    }

    const update = () => {
      const now = new Date();
      const elapsedMs = now.getTime() - startedAt.getTime();
      const elapsedSeconds = Math.floor(elapsedMs / 1000);
      const remainingSeconds = Math.max(0, totalDuration - elapsedSeconds);

      const isExpired = remainingSeconds === 0;
      const isWarning = remainingSeconds <= warningThreshold && remainingSeconds > criticalThreshold;
      const isCritical = remainingSeconds <= criticalThreshold && remainingSeconds > 0;
      const progress = Math.min(100, (elapsedSeconds / totalDuration) * 100);

      setState({
        timeRemaining: remainingSeconds,
        timeElapsed: elapsedSeconds,
        isExpired,
        isWarning,
        isCritical,
        progress,
      });

      // Callbacks de threshold (uma vez cada) - usando refs
      if (isWarning && !hasCalledWarningRef.current) {
        hasCalledWarningRef.current = true;
        onWarningRef.current?.();
      }

      if (isCritical && !hasCalledCriticalRef.current) {
        hasCalledCriticalRef.current = true;
        onCriticalRef.current?.();
      }

      if (isExpired && !hasCalledExpireRef.current) {
        hasCalledExpireRef.current = true;
        onExpireRef.current?.();
      }
    };

    update(); // Primeira execução imediata
    const interval = setInterval(update, 1000);

    return () => clearInterval(interval);
  }, [enabled, startedAt, totalDuration, warningThreshold, criticalThreshold]);

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
    hasCalledWarningRef.current = false;
    hasCalledCriticalRef.current = false;
    hasCalledExpireRef.current = false;
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
