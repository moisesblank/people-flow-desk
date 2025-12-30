import { useCallback, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface CalculatorHistoryItem {
  expression: string;
  result: string;
  timestamp: number;
}

interface PersistPayload {
  history: CalculatorHistoryItem[];
  memory: number;
}

export function useUserCalculatorPersistence() {
  const saveTimerRef = useRef<number | null>(null);

  const loadFromBackend = useCallback(async (): Promise<PersistPayload | null> => {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return null;

    const { data, error } = await supabase
      .from("user_calculator_state")
      .select("history,memory")
      .eq("user_id", userData.user.id)
      .maybeSingle();

    if (error) throw error;
    if (!data) return { history: [], memory: 0 };

    return {
      history: (data.history as unknown as CalculatorHistoryItem[]) ?? [],
      memory: Number(data.memory ?? 0),
    };
  }, []);

  const saveToBackend = useCallback(async (payload: PersistPayload) => {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return;

    const { error } = await supabase
      .from("user_calculator_state")
      .upsert(
        {
          user_id: userData.user.id,
          history: payload.history as unknown as any,
          memory: payload.memory,
        },
        { onConflict: "user_id" }
      );

    if (error) throw error;
  }, []);

  const saveToBackendDebounced = useCallback(
    (payload: PersistPayload, delayMs = 500) => {
      if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);
      saveTimerRef.current = window.setTimeout(() => {
        saveToBackend(payload).catch((e) => {
          console.warn("[Calculator] Falha ao salvar no backend:", e);
        });
      }, delayMs);
    },
    [saveToBackend]
  );

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);
    };
  }, []);

  return {
    loadFromBackend,
    saveToBackend,
    saveToBackendDebounced,
  };
}
