/**
 * 🎯 SIMULADOS — Hook de Logging e Observabilidade
 * Constituição SYNAPSE Ω v10.0
 * 
 * Registra eventos críticos:
 * - Start / Finish
 * - Invalidate / Disqualify
 * - Erros
 * 
 * Distingue Treino × Simulado.
 */

import { useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

type LogLevel = "info" | "warn" | "error";
type LogCategory = "SIMULADO" | "TREINO";
type LogAction = 
  | "START" 
  | "FINISH" 
  | "INVALIDATE" 
  | "DISQUALIFY"
  | "TIMEOUT"
  | "ERROR"
  | "TAB_SWITCH"
  | "CAMERA_DENIED"
  | "RESUME"
  | "EXIT";

interface LogEntry {
  category: LogCategory;
  action: LogAction;
  level: LogLevel;
  simuladoId?: string;
  attemptId?: string;
  userId?: string;
  details?: Record<string, unknown>;
  timestamp: Date;
}

interface UseSimuladoLoggerOptions {
  simuladoId: string;
  isSimulado?: boolean; // false = treino
  userId?: string;
}

interface UseSimuladoLoggerReturn {
  logStart: (attemptId: string, isResumed?: boolean) => void;
  logFinish: (attemptId: string, result: { score: number; isScoredForRanking: boolean }) => void;
  logInvalidate: (attemptId: string, reason: string) => void;
  logDisqualify: (attemptId: string, reason: string) => void;
  logError: (action: string, error: Error | string) => void;
  logTabSwitch: (attemptId: string, count: number) => void;
  logCameraDenied: (attemptId: string) => void;
  logTimeout: (attemptId: string) => void;
  logExit: (attemptId: string | null) => void;
}

export function useSimuladoLogger(options: UseSimuladoLoggerOptions): UseSimuladoLoggerReturn {
  const { simuladoId, isSimulado = true, userId } = options;
  
  const category: LogCategory = isSimulado ? "SIMULADO" : "TREINO";
  const sessionIdRef = useRef<string>(`session_${Date.now()}`);

  /**
   * Envia log para console e (opcionalmente) servidor
   */
  const sendLog = useCallback(async (entry: LogEntry) => {
    // Console log sempre
    const prefix = `[${entry.category}][${entry.action}]`;
    const message = JSON.stringify(entry.details || {});
    
    switch (entry.level) {
      case "error":
        console.error(prefix, message);
        break;
      case "warn":
        console.warn(prefix, message);
        break;
      default:
        console.log(prefix, message);
    }

    // Opcional: enviar para tabela de logs (se existir)
    // Por ora, apenas console
    try {
      // Future: supabase.from("simulado_logs").insert(entry)
    } catch (e) {
      // Silencioso - logs não devem quebrar fluxo
    }
  }, []);

  const logStart = useCallback((attemptId: string, isResumed = false) => {
    sendLog({
      category,
      action: isResumed ? "RESUME" : "START",
      level: "info",
      simuladoId,
      attemptId,
      userId,
      details: {
        sessionId: sessionIdRef.current,
        isResumed,
        timestamp: new Date().toISOString(),
      },
      timestamp: new Date(),
    });
  }, [category, simuladoId, userId, sendLog]);

  const logFinish = useCallback((attemptId: string, result: { score: number; isScoredForRanking: boolean }) => {
    sendLog({
      category,
      action: "FINISH",
      level: "info",
      simuladoId,
      attemptId,
      userId,
      details: {
        sessionId: sessionIdRef.current,
        score: result.score,
        isScoredForRanking: result.isScoredForRanking,
        timestamp: new Date().toISOString(),
      },
      timestamp: new Date(),
    });
  }, [category, simuladoId, userId, sendLog]);

  const logInvalidate = useCallback((attemptId: string, reason: string) => {
    sendLog({
      category,
      action: "INVALIDATE",
      level: "warn",
      simuladoId,
      attemptId,
      userId,
      details: {
        sessionId: sessionIdRef.current,
        reason,
        timestamp: new Date().toISOString(),
      },
      timestamp: new Date(),
    });
  }, [category, simuladoId, userId, sendLog]);

  const logDisqualify = useCallback((attemptId: string, reason: string) => {
    sendLog({
      category,
      action: "DISQUALIFY",
      level: "warn",
      simuladoId,
      attemptId,
      userId,
      details: {
        sessionId: sessionIdRef.current,
        reason,
        timestamp: new Date().toISOString(),
      },
      timestamp: new Date(),
    });
  }, [category, simuladoId, userId, sendLog]);

  const logError = useCallback((action: string, error: Error | string) => {
    sendLog({
      category,
      action: "ERROR",
      level: "error",
      simuladoId,
      userId,
      details: {
        sessionId: sessionIdRef.current,
        action,
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString(),
      },
      timestamp: new Date(),
    });
  }, [category, simuladoId, userId, sendLog]);

  const logTabSwitch = useCallback((attemptId: string, count: number) => {
    sendLog({
      category,
      action: "TAB_SWITCH",
      level: count > 2 ? "warn" : "info",
      simuladoId,
      attemptId,
      userId,
      details: {
        sessionId: sessionIdRef.current,
        switchCount: count,
        timestamp: new Date().toISOString(),
      },
      timestamp: new Date(),
    });
  }, [category, simuladoId, userId, sendLog]);

  const logCameraDenied = useCallback((attemptId: string) => {
    sendLog({
      category,
      action: "CAMERA_DENIED",
      level: "warn",
      simuladoId,
      attemptId,
      userId,
      details: {
        sessionId: sessionIdRef.current,
        timestamp: new Date().toISOString(),
      },
      timestamp: new Date(),
    });
  }, [category, simuladoId, userId, sendLog]);

  const logTimeout = useCallback((attemptId: string) => {
    sendLog({
      category,
      action: "TIMEOUT",
      level: "info",
      simuladoId,
      attemptId,
      userId,
      details: {
        sessionId: sessionIdRef.current,
        timestamp: new Date().toISOString(),
      },
      timestamp: new Date(),
    });
  }, [category, simuladoId, userId, sendLog]);

  const logExit = useCallback((attemptId: string | null) => {
    sendLog({
      category,
      action: "EXIT",
      level: "info",
      simuladoId,
      attemptId: attemptId || undefined,
      userId,
      details: {
        sessionId: sessionIdRef.current,
        timestamp: new Date().toISOString(),
      },
      timestamp: new Date(),
    });
  }, [category, simuladoId, userId, sendLog]);

  return {
    logStart,
    logFinish,
    logInvalidate,
    logDisqualify,
    logError,
    logTabSwitch,
    logCameraDenied,
    logTimeout,
    logExit,
  };
}
