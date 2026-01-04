/**
 * 🎯 SIMULADOS — Hook de Detecção de Troca de Aba
 * Constituição SYNAPSE Ω v10.0 | Modo Hard
 * 
 * Detecta quando o usuário sai da aba e reporta ao servidor.
 * A DECISÃO de invalidar é 100% SERVER-SIDE.
 * Frontend apenas reporta eventos.
 */

import { useEffect, useCallback, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface TabFocusState {
  tabSwitches: number;
  maxAllowed: number;
  isInvalidated: boolean;
  invalidationReason: string | null;
  isMonitoring: boolean;
}

interface IncrementResponse {
  success: boolean;
  error?: string;
  tab_switches?: number;
  max_allowed?: number;
  invalidated?: boolean;
  reason?: string;
}

interface UseTabFocusOptions {
  attemptId: string | null;
  isHardMode: boolean;
  maxTabSwitches: number;
  enabled?: boolean;
  onInvalidate?: (reason: string) => void;
}

export function useTabFocus(options: UseTabFocusOptions) {
  const { attemptId, isHardMode, maxTabSwitches, enabled = true, onInvalidate } = options;
  
  const [state, setState] = useState<TabFocusState>({
    tabSwitches: 0,
    maxAllowed: maxTabSwitches,
    isInvalidated: false,
    invalidationReason: null,
    isMonitoring: false,
  });

  const isReportingRef = useRef(false);
  const lastReportTimeRef = useRef(0);
  const DEBOUNCE_MS = 1000; // Evitar spam de reports

  /**
   * Reporta troca de aba ao servidor (única responsabilidade)
   * Server decide se invalida ou não
   */
  const reportTabSwitch = useCallback(async () => {
    if (!attemptId || !isHardMode || !enabled) return;
    if (isReportingRef.current) return;
    
    // Debounce
    const now = Date.now();
    if (now - lastReportTimeRef.current < DEBOUNCE_MS) return;
    lastReportTimeRef.current = now;

    isReportingRef.current = true;

    try {
      console.log("[useTabFocus] Reporting tab switch to server...");
      
      const { data, error } = await supabase.rpc("increment_tab_switch", {
        p_attempt_id: attemptId,
      });

      if (error) {
        console.error("[useTabFocus] RPC error:", error);
        isReportingRef.current = false;
        return;
      }

      const response = data as unknown as IncrementResponse;

      if (response.success) {
        setState(prev => ({
          ...prev,
          tabSwitches: response.tab_switches || prev.tabSwitches + 1,
          maxAllowed: response.max_allowed || prev.maxAllowed,
          isInvalidated: response.invalidated || false,
          invalidationReason: response.reason || null,
        }));

        // Callback se invalidado
        if (response.invalidated && onInvalidate) {
          onInvalidate(response.reason || "TAB_SWITCH_LIMIT_EXCEEDED");
        }
      }
    } catch (err) {
      console.error("[useTabFocus] Exception:", err);
    } finally {
      isReportingRef.current = false;
    }
  }, [attemptId, isHardMode, enabled, onInvalidate]);

  /**
   * Handlers de visibilidade
   */
  useEffect(() => {
    if (!attemptId || !isHardMode || !enabled) {
      setState(prev => ({ ...prev, isMonitoring: false }));
      return;
    }

    setState(prev => ({ ...prev, isMonitoring: true, maxAllowed: maxTabSwitches }));

    const handleVisibilityChange = () => {
      if (document.hidden) {
        console.log("[useTabFocus] Tab became hidden - reporting...");
        reportTabSwitch();
      }
    };

    const handleBlur = () => {
      console.log("[useTabFocus] Window lost focus - reporting...");
      reportTabSwitch();
    };

    // Page Visibility API (mais confiável)
    document.addEventListener("visibilitychange", handleVisibilityChange);
    
    // Fallback: window blur
    window.addEventListener("blur", handleBlur);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleBlur);
      setState(prev => ({ ...prev, isMonitoring: false }));
    };
  }, [attemptId, isHardMode, enabled, maxTabSwitches, reportTabSwitch]);

  /**
   * Força um report manual (para testes ou casos específicos)
   */
  const forceReport = useCallback(() => {
    if (attemptId && isHardMode && enabled) {
      reportTabSwitch();
    }
  }, [attemptId, isHardMode, enabled, reportTabSwitch]);

  /**
   * Reseta o estado (para novo simulado)
   */
  const reset = useCallback(() => {
    setState({
      tabSwitches: 0,
      maxAllowed: maxTabSwitches,
      isInvalidated: false,
      invalidationReason: null,
      isMonitoring: false,
    });
    isReportingRef.current = false;
    lastReportTimeRef.current = 0;
  }, [maxTabSwitches]);

  return {
    ...state,
    forceReport,
    reset,
    remainingAllowed: Math.max(0, state.maxAllowed - state.tabSwitches),
  };
}
