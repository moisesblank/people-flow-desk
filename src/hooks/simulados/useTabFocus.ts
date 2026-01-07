/**
 * 🎯 SIMULADOS — Hook de Detecção de Troca de Aba
 * Constituição SYNAPSE Ω v10.0 | Modo Hard
 * 
 * Detecta quando o usuário sai da aba e reporta ao servidor.
 * A DECISÃO de invalidar é 100% SERVER-SIDE.
 * Frontend apenas reporta eventos.
 * 
 * FIX v11.4: Estabilização de dependências para evitar loop infinito
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

  // === FIX v11.4: Refs para estabilizar dependências ===
  const isReportingRef = useRef(false);
  const lastReportTimeRef = useRef(0);
  const onInvalidateRef = useRef(onInvalidate);
  const attemptIdRef = useRef(attemptId);
  const isHardModeRef = useRef(isHardMode);
  const enabledRef = useRef(enabled);
  
  const DEBOUNCE_MS = 1000; // Evitar spam de reports

  // Manter refs atualizados sem causar re-render
  useEffect(() => {
    onInvalidateRef.current = onInvalidate;
  }, [onInvalidate]);

  useEffect(() => {
    attemptIdRef.current = attemptId;
  }, [attemptId]);

  useEffect(() => {
    isHardModeRef.current = isHardMode;
  }, [isHardMode]);

  useEffect(() => {
    enabledRef.current = enabled;
  }, [enabled]);

  /**
   * Reporta troca de aba ao servidor (única responsabilidade)
   * Server decide se invalida ou não
   * FIX v11.4: Usa refs para evitar recriação do callback
   */
  const reportTabSwitch = useCallback(async () => {
    const currentAttemptId = attemptIdRef.current;
    const currentIsHardMode = isHardModeRef.current;
    const currentEnabled = enabledRef.current;
    
    if (!currentAttemptId || !currentIsHardMode || !currentEnabled) return;
    if (isReportingRef.current) return;
    
    // Debounce
    const now = Date.now();
    if (now - lastReportTimeRef.current < DEBOUNCE_MS) return;
    lastReportTimeRef.current = now;

    isReportingRef.current = true;

    try {
      console.log("[useTabFocus] Reporting tab switch to server...");
      
      const { data, error } = await supabase.rpc("increment_tab_switch", {
        p_attempt_id: currentAttemptId,
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

        // Callback se invalidado (usa ref para estabilidade)
        if (response.invalidated && onInvalidateRef.current) {
          onInvalidateRef.current(response.reason || "TAB_SWITCH_LIMIT_EXCEEDED");
        }
      }
    } catch (err) {
      console.error("[useTabFocus] Exception:", err);
    } finally {
      isReportingRef.current = false;
    }
  }, []); // FIX v11.4: Array vazio - usa refs internamente

  /**
   * Handlers de visibilidade
   * FIX v11.4: Dependências estáveis
   */
  useEffect(() => {
    // Verificar condições usando valores atuais (não refs aqui para detectar mudanças)
    if (!attemptId || !isHardMode || !enabled) {
      setState(prev => {
        // Evitar setState desnecessário se já está com isMonitoring: false
        if (!prev.isMonitoring) return prev;
        return { ...prev, isMonitoring: false };
      });
      return;
    }

    setState(prev => {
      // Evitar setState desnecessário se já está com valores corretos
      if (prev.isMonitoring && prev.maxAllowed === maxTabSwitches) return prev;
      return { ...prev, isMonitoring: true, maxAllowed: maxTabSwitches };
    });

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
      // FIX v11.4: NÃO chamar setState no cleanup para evitar loop
      // O próximo render vai lidar com isso via as verificações acima
    };
  }, [attemptId, isHardMode, enabled, maxTabSwitches, reportTabSwitch]);

  /**
   * Força um report manual (para testes ou casos específicos)
   */
  const forceReport = useCallback(() => {
    if (attemptIdRef.current && isHardModeRef.current && enabledRef.current) {
      reportTabSwitch();
    }
  }, [reportTabSwitch]);

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
