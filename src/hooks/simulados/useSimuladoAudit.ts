/**
 * 🎯 SIMULADOS — Hook de Auditoria e Logs
 * Constituição SYNAPSE Ω v10.0
 * 
 * Registra eventos de auditoria persistentes no banco.
 * Substitui console.log por registro durável.
 */

import { useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

type AuditCategory = "SIMULADO" | "TREINO" | "SYSTEM";
type AuditLevel = "info" | "warn" | "error";
type AuditAction = 
  | "START" 
  | "FINISH" 
  | "INVALIDATE" 
  | "DISQUALIFY"
  | "TIMEOUT"
  | "ERROR"
  | "TAB_SWITCH"
  | "CAMERA_DENIED"
  | "CONSENT_ACCEPTED"
  | "RESUME"
  | "EXIT"
  | "FLAG_CHANGED"
  | "RANKING_SNAPSHOT"
  | "DISPUTE_OPENED";

interface AuditLogOptions {
  simuladoId?: string;
  attemptId?: string;
}

interface UseSimuladoAuditReturn {
  logEvent: (
    action: AuditAction,
    details?: Record<string, unknown>,
    level?: AuditLevel
  ) => Promise<void>;
  logError: (action: string, error: Error | string) => Promise<void>;
}

/**
 * Gera hash simples para identificação
 */
function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

export function useSimuladoAudit(options: AuditLogOptions = {}): UseSimuladoAuditReturn {
  const { simuladoId, attemptId } = options;
  const sessionIdRef = useRef<string>(`session_${Date.now()}_${Math.random().toString(36).slice(2)}`);

  /**
   * Registra evento de auditoria no banco
   */
  const logEvent = useCallback(async (
    action: AuditAction,
    details: Record<string, unknown> = {},
    level: AuditLevel = "info"
  ): Promise<void> => {
    try {
      // Determinar categoria baseado em contexto
      const category: AuditCategory = simuladoId ? "SIMULADO" : "SYSTEM";
      
      // Adicionar metadados
      const enrichedDetails = {
        ...details,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
        url: window.location.href,
      };

      // Enviar para o banco via RPC
      const { error } = await supabase.rpc("log_simulado_audit", {
        p_category: category,
        p_action: action,
        p_level: level,
        p_simulado_id: simuladoId || null,
        p_attempt_id: attemptId || null,
        p_session_id: sessionIdRef.current,
        p_ip_hash: hashString(navigator.userAgent + screen.width), // Fingerprint leve
        p_details: enrichedDetails,
      });

      if (error) {
        // Log silencioso - não quebrar fluxo por falha de auditoria
        console.warn("[AUDIT] Falha ao registrar:", error.message);
      } else {
        // Log em dev para debug
        if (import.meta.env.DEV) {
          console.log(`[AUDIT][${category}][${action}]`, enrichedDetails);
        }
      }
    } catch (err) {
      // Nunca quebrar fluxo por erro de auditoria
      console.warn("[AUDIT] Erro silencioso:", err);
    }
  }, [simuladoId, attemptId]);

  /**
   * Log de erro com stack trace
   */
  const logError = useCallback(async (
    action: string,
    error: Error | string
  ): Promise<void> => {
    await logEvent("ERROR", {
      action,
      errorMessage: error instanceof Error ? error.message : error,
      errorStack: error instanceof Error ? error.stack : undefined,
    }, "error");
  }, [logEvent]);

  return {
    logEvent,
    logError,
  };
}

/**
 * Hook para criar snapshot de ranking (owner/admin only)
 */
export function useRankingSnapshot() {
  const createSnapshot = useCallback(async (
    simuladoId?: string,
    snapshotType: "manual" | "scheduled" | "freeze" = "manual",
    reason?: string
  ): Promise<string | null> => {
    try {
      const { data, error } = await supabase.rpc("create_ranking_snapshot", {
        p_simulado_id: simuladoId || null,
        p_snapshot_type: snapshotType,
        p_reason: reason || null,
      });

      if (error) {
        console.error("[SNAPSHOT] Erro:", error);
        return null;
      }

      console.log("[SNAPSHOT] Criado:", data);
      return data as string;
    } catch (err) {
      console.error("[SNAPSHOT] Erro:", err);
      return null;
    }
  }, []);

  return { createSnapshot };
}

/**
 * Hook para abrir contestação de ranking
 */
export function useRankingDispute() {
  const openDispute = useCallback(async (
    simuladoId: string,
    attemptId?: string,
    disputeType: "score_error" | "invalidation_appeal" | "technical_issue" = "technical_issue",
    description: string = "",
    evidence?: Record<string, string | number | boolean | null>
  ): Promise<string | null> => {
    try {
      const { data, error } = await supabase.rpc("open_ranking_dispute", {
        p_simulado_id: simuladoId,
        p_attempt_id: attemptId || null,
        p_dispute_type: disputeType,
        p_description: description,
        p_evidence: evidence || null,
      });

      if (error) {
        console.error("[DISPUTE] Erro:", error);
        return null;
      }

      console.log("[DISPUTE] Aberta:", data);
      return data as string;
    } catch (err) {
      console.error("[DISPUTE] Erro:", err);
      return null;
    }
  }, []);

  return { openDispute };
}
