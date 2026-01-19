/**
 * 🎯 SIMULADOS — Hook de Tentativas
 * Constituição SYNAPSE Ω v10.0 | Server-Side Only
 * 
 * Gerencia o ciclo de vida de uma tentativa de simulado:
 * - start_simulado_attempt (idempotente)
 * - finish_simulado_attempt (idempotente)
 * - Apenas primeira tentativa pontua (is_scored_for_ranking)
 */

import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { formatError } from "@/lib/utils/formatError";

// Tipos
export interface SimuladoAttemptConfig {
  simuladoId: string;
  durationMinutes: number;
  isHardMode: boolean;
  maxTabSwitches: number;
  requiresCamera: boolean;
}

export interface AttemptState {
  attemptId: string | null;
  isResumed: boolean;
  isScoredForRanking: boolean;
  startedAt: Date | null;
  attemptNumber: number;
  status: "IDLE" | "RUNNING" | "FINISHED" | "INVALIDATED" | "LOADING" | "ERROR";
  error: string | null;
}

export interface AttemptResult {
  score: number;
  correctAnswers: number;
  wrongAnswers: number;
  unanswered: number;
  xpAwarded: number;
  isScoredForRanking: boolean;
  timeSpentSeconds: number;
}

interface StartAttemptResponse {
  success: boolean;
  error?: string;
  attempt_id?: string;
  is_resumed?: boolean;
  is_scored_for_ranking?: boolean;
  started_at?: string;
  attempt_number?: number;
  duration_minutes?: number;
  is_hard_mode?: boolean;
  max_tab_switches?: number;
  requires_camera?: boolean;
  starts_at?: string;
  ended_at?: string;
}

interface FinishAttemptResponse {
  success: boolean;
  error?: string;
  reason?: string;
  already_finished?: boolean;
  score?: number;
  correct_answers?: number;
  wrong_answers?: number;
  unanswered?: number;
  xp_awarded?: number;
  is_scored_for_ranking?: boolean;
  time_spent_seconds?: number;
}

export function useSimuladoAttempt() {
  const { toast } = useToast();
  
  const [state, setState] = useState<AttemptState>({
    attemptId: null,
    isResumed: false,
    isScoredForRanking: false,
    startedAt: null,
    attemptNumber: 0,
    status: "IDLE",
    error: null,
  });

  const [config, setConfig] = useState<SimuladoAttemptConfig | null>(null);
  const [result, setResult] = useState<AttemptResult | null>(null);

  /**
   * Inicia ou retoma tentativa (idempotente)
   * Se já existe tentativa RUNNING, retorna ela
   */
  const startAttempt = useCallback(async (simuladoId: string): Promise<boolean> => {
    setState(prev => ({ ...prev, status: "LOADING", error: null }));

    try {
      // Coletar contexto do dispositivo
      const deviceFingerprint = await generateDeviceFingerprint();

      const { data, error } = await supabase.rpc("start_simulado_attempt", {
        p_simulado_id: simuladoId,
        p_ip_address: null, // Server vai capturar via request
        p_user_agent: navigator.userAgent,
        p_device_fingerprint: deviceFingerprint,
      });

      if (error) {
        console.error("[useSimuladoAttempt] RPC error:", error);
        const msg = formatError(error);
        setState(prev => ({ ...prev, status: "ERROR", error: msg }));
        toast({
          title: "Erro ao iniciar simulado",
          description: msg,
          variant: "destructive",
        });
        return false;
      }

      const response = data as unknown as StartAttemptResponse;

      if (!response.success) {
        // Usar mensagem customizada do servidor quando disponível (feature flags)
        const serverMessage = (response as unknown as { message?: string }).message;
        const errorMsg = translateError(response.error || "UNKNOWN_ERROR", serverMessage);
        setState(prev => ({ ...prev, status: "ERROR", error: errorMsg }));
        toast({
          title: "Não foi possível iniciar",
          description: errorMsg,
          variant: "destructive",
        });
        return false;
      }

      // Atualizar estado com dados da tentativa
      setState({
        attemptId: response.attempt_id || null,
        isResumed: response.is_resumed || false,
        isScoredForRanking: response.is_scored_for_ranking || false,
        startedAt: response.started_at ? new Date(response.started_at) : new Date(),
        attemptNumber: response.attempt_number || 1,
        status: "RUNNING",
        error: null,
      });

      // Configurações do simulado
      setConfig({
        simuladoId,
        durationMinutes: response.duration_minutes || 180,
        isHardMode: response.is_hard_mode || false,
        maxTabSwitches: response.max_tab_switches || 3,
        requiresCamera: response.requires_camera || false,
      });

      if (response.is_resumed) {
        toast({
          title: "Tentativa retomada",
          description: "Você está continuando de onde parou.",
        });
      }

      return true;
    } catch (err) {
      console.error("[useSimuladoAttempt] Exception:", err);
      setState(prev => ({ ...prev, status: "ERROR", error: "Erro inesperado" }));
      return false;
    }
  }, [toast]);

  /**
   * Finaliza tentativa e calcula pontuação (idempotente)
   * Se já finalizada, retorna resultado existente
   */
  const finishAttempt = useCallback(async (): Promise<AttemptResult | null> => {
    if (!state.attemptId) {
      const msg = "Não foi possível finalizar: tentativa não encontrada.";
      console.error("[useSimuladoAttempt] No attemptId to finish");
      setState(prev => ({ ...prev, status: "ERROR", error: msg }));
      toast({
        title: "Erro ao finalizar simulado",
        description: msg,
        variant: "destructive",
      });
      return null;
    }

    setState(prev => ({ ...prev, status: "LOADING", error: null }));

    try {
      const { data, error } = await supabase.rpc("finish_simulado_attempt", {
        p_attempt_id: state.attemptId,
      });

      if (error) {
        console.error("[useSimuladoAttempt] Finish RPC error:", error);
        const msg = formatError(error);
        setState(prev => ({ ...prev, status: "ERROR", error: msg }));
        toast({
          title: "Erro ao finalizar simulado",
          description: msg,
          variant: "destructive",
        });
        return null;
      }

      const response = data as unknown as FinishAttemptResponse;

      if (!response.success) {
        const errorMsg = translateError(response.error || "UNKNOWN_ERROR");
        setState(prev => ({ ...prev, status: "ERROR", error: errorMsg }));

        toast({
          title: "Não foi possível finalizar",
          description:
            response.error === "ATTEMPT_INVALIDATED"
              ? (response.reason || "Esta tentativa foi desclassificada.")
              : errorMsg,
          variant: "destructive",
        });

        return null;
      }

      const attemptResult: AttemptResult = {
        score: response.score || 0,
        correctAnswers: response.correct_answers || 0,
        wrongAnswers: response.wrong_answers || 0,
        unanswered: response.unanswered || 0,
        xpAwarded: response.xp_awarded || 0,
        isScoredForRanking: response.is_scored_for_ranking || false,
        timeSpentSeconds: response.time_spent_seconds || 0,
      };

      setResult(attemptResult);
      setState(prev => ({ ...prev, status: "FINISHED" }));

      // Feedback de XP
      if (attemptResult.xpAwarded > 0) {
        toast({
          title: `+${attemptResult.xpAwarded} XP! 🎉`,
          description: "Pontuação registrada no ranking.",
        });
      } else if (!attemptResult.isScoredForRanking) {
        toast({
          title: "Simulado finalizado",
          description: "Esta tentativa não conta para o ranking (retake).",
        });
      }

      return attemptResult;
    } catch (err) {
      console.error("[useSimuladoAttempt] Finish exception:", err);
      setState(prev => ({ ...prev, status: "ERROR", error: "Erro ao finalizar" }));
      return null;
    }
  }, [state.attemptId, toast]);

  /**
   * Sincroniza estado local com tentativa já existente no servidor
   * (ex: refresh/reload no meio do simulado)
   */
  const syncFromServerAttempt = useCallback((attempt: {
    id: string;
    status: "RUNNING" | "FINISHED" | "ABANDONED" | "INVALIDATED";
    started_at: string;
    attempt_number: number;
    is_scored_for_ranking: boolean;
  }) => {
    setState(prev => {
      // Evitar setState redundante
      if (prev.attemptId === attempt.id && prev.status !== "IDLE") return prev;

      const mappedStatus: AttemptState["status"] =
        attempt.status === "RUNNING"
          ? "RUNNING"
          : attempt.status === "INVALIDATED"
            ? "INVALIDATED"
            : "FINISHED";

      return {
        ...prev,
        attemptId: attempt.id,
        // Já existe no servidor = foi retomada (mesmo que seja a primeira sessão do usuário)
        isResumed: true,
        isScoredForRanking: attempt.is_scored_for_ranking,
        startedAt: attempt.started_at ? new Date(attempt.started_at) : prev.startedAt,
        attemptNumber: attempt.attempt_number || prev.attemptNumber || 1,
        status: mappedStatus,
        error: null,
      };
    });
  }, []);

  /**
   * Reseta o estado (para novo simulado)
   */
  const reset = useCallback(() => {
    setState({
      attemptId: null,
      isResumed: false,
      isScoredForRanking: false,
      startedAt: null,
      attemptNumber: 0,
      status: "IDLE",
      error: null,
    });
    setConfig(null);
    setResult(null);
  }, []);

  return {
    // Estado
    state,
    config,
    result,

    // Ações
    startAttempt,
    finishAttempt,
    syncFromServerAttempt,
    reset,

    // Conveniências
    isRunning: state.status === "RUNNING",
    isLoading: state.status === "LOADING",
    isFinished: state.status === "FINISHED",
    isInvalidated: state.status === "INVALIDATED",
    hasError: state.status === "ERROR",
  };
}

// ============================================
// UTILITÁRIOS PRIVADOS
// ============================================

/**
 * Gera fingerprint básico do dispositivo
 */
async function generateDeviceFingerprint(): Promise<string> {
  const components = [
    navigator.userAgent,
    navigator.language,
    screen.width,
    screen.height,
    screen.colorDepth,
    new Date().getTimezoneOffset(),
    navigator.hardwareConcurrency || 0,
  ];
  
  const raw = components.join("|");
  
  // Hash simples usando SubtleCrypto
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(raw);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
  } catch {
    // Fallback para ambientes sem SubtleCrypto
    return btoa(raw).slice(0, 32);
  }
}

/**
 * Traduz códigos de erro para mensagens amigáveis
 */
function translateError(code: string, message?: string): string {
  const errors: Record<string, string> = {
    NOT_AUTHENTICATED: "Você precisa estar logado para fazer o simulado.",
    SIMULADO_NOT_FOUND: "Simulado não encontrado ou inativo.",
    SIMULADO_NOT_STARTED: "Este simulado ainda não começou.",
    SIMULADO_ENDED: "O prazo para este simulado já encerrou.",
    ATTEMPT_NOT_FOUND: "Tentativa não encontrada.",
    NOT_AUTHORIZED: "Você não tem permissão para esta ação.",
    ATTEMPT_INVALIDATED: "Esta tentativa foi invalidada.",
    ATTEMPT_NOT_RUNNING: "Esta tentativa não está em andamento.",
    ATTEMPT_ALREADY_TERMINAL: "Esta tentativa já foi finalizada.",
    // Feature flags - execução cortada no servidor
    SYSTEM_DISABLED: "O sistema de simulados está temporariamente desativado.",
    NEW_ATTEMPTS_BLOCKED: "Novas tentativas estão bloqueadas para manutenção.",
    SIMULADO_MAINTENANCE: "Este simulado está em manutenção. Tente novamente em breve.",
    UNKNOWN_ERROR: "Ocorreu um erro inesperado.",
  };
  
  // Usar mensagem customizada do servidor se disponível
  if (message) return message;
  
  return errors[code] || code;
}
