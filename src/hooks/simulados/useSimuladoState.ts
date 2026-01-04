/**
 * 🎯 SIMULADOS — Hook de Estado
 * Constituição SYNAPSE Ω v10.0
 * 
 * Gerencia a máquina de estados do simulado.
 * Estado SEMPRE derivado do servidor.
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  SimuladoState,
  Simulado,
  SimuladoAttempt,
  SimuladoQuestion,
  determineSimuladoState,
} from "@/components/simulados/types";

interface UseSimuladoStateOptions {
  simuladoId: string;
  enabled?: boolean;
}

interface SimuladoStateData {
  // Estado atual
  currentState: SimuladoState;
  
  // Dados carregados
  simulado: Simulado | null;
  attempt: SimuladoAttempt | null;
  questions: SimuladoQuestion[];
  
  // Flags derivadas
  isRetake: boolean;
  isGabaritoReleased: boolean;
  canStart: boolean;
  hasEnded: boolean;
  
  // Tempos calculados (servidor)
  startsIn: number | null; // segundos até starts_at
  endsIn: number | null; // segundos até ends_at
  gabaritoIn: number | null; // segundos até gabarito
  
  // Loading/Error
  isLoading: boolean;
  error: string | null;
}

export function useSimuladoState(options: UseSimuladoStateOptions) {
  const { simuladoId, enabled = true } = options;
  
  const [simulado, setSimulado] = useState<Simulado | null>(null);
  const [attempt, setAttempt] = useState<SimuladoAttempt | null>(null);
  const [questions, setQuestions] = useState<SimuladoQuestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [serverTime, setServerTime] = useState<Date>(new Date());

  /**
   * Carrega dados do simulado
   */
  const loadSimulado = useCallback(async () => {
    if (!enabled || !simuladoId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Buscar simulado
      const { data: simData, error: simError } = await supabase
        .from("simulados")
        .select("*")
        .eq("id", simuladoId)
        .single();
      
      if (simError) throw simError;
      if (!simData) throw new Error("Simulado não encontrado");
      
      setSimulado(simData as Simulado);
      
      // Buscar tentativa ativa do usuário
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: attemptData } = await supabase
          .from("simulado_attempts")
          .select("*")
          .eq("simulado_id", simuladoId)
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        
        if (attemptData) {
          setAttempt(attemptData as SimuladoAttempt);
        }
      }
      
      // Carregar questões
      if (simData.question_ids && simData.question_ids.length > 0) {
        const { data: questionsData, error: questionsError } = await supabase
          .from("quiz_questions")
          .select("id, question_text, question_type, options, image_url, difficulty, banca, ano")
          .in("id", simData.question_ids);
        
        if (questionsError) {
          console.error("[useSimuladoState] Error loading questions:", questionsError);
        } else if (questionsData) {
          // Ordenar conforme question_ids
          const orderedQuestions = simData.question_ids.map((id: string, index: number) => {
            const q = questionsData.find((q: { id: string }) => q.id === id);
            return q ? { ...q, order: index } : null;
          }).filter(Boolean) as SimuladoQuestion[];
          
          setQuestions(orderedQuestions);
        }
      }
      
      // Atualizar tempo do servidor
      setServerTime(new Date());
      
    } catch (err) {
      console.error("[useSimuladoState] Error:", err);
      setError(err instanceof Error ? err.message : "Erro ao carregar simulado");
    } finally {
      setIsLoading(false);
    }
  }, [simuladoId, enabled]);

  /**
   * Atualiza tentativa (após start/finish)
   */
  const updateAttempt = useCallback((newAttempt: SimuladoAttempt | null) => {
    setAttempt(newAttempt);
  }, []);

  /**
   * Recarrega dados
   */
  const refresh = useCallback(() => {
    loadSimulado();
  }, [loadSimulado]);

  // Carregar ao montar
  useEffect(() => {
    loadSimulado();
  }, [loadSimulado]);

  // Atualizar tempo do servidor periodicamente
  useEffect(() => {
    const interval = setInterval(() => {
      setServerTime(new Date());
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);

  // Calcular estado atual
  const currentState = useMemo(() => {
    if (isLoading) return SimuladoState.LOADING;
    if (error) return SimuladoState.ERROR;
    return determineSimuladoState(simulado, attempt, serverTime);
  }, [simulado, attempt, serverTime, isLoading, error]);

  // Calcular flags derivadas
  const derivedFlags = useMemo(() => {
    const now = serverTime;
    
    const startsAt = simulado?.starts_at ? new Date(simulado.starts_at) : null;
    const endsAt = simulado?.ends_at ? new Date(simulado.ends_at) : null;
    const gabaritoAt = simulado?.results_released_at ? new Date(simulado.results_released_at) : null;
    
    return {
      isRetake: attempt ? !attempt.is_scored_for_ranking : false,
      isGabaritoReleased: gabaritoAt ? now >= gabaritoAt : false,
      canStart: currentState === SimuladoState.READY || currentState === SimuladoState.RUNNING,
      hasEnded: endsAt ? now > endsAt : false,
      startsIn: startsAt && now < startsAt ? Math.floor((startsAt.getTime() - now.getTime()) / 1000) : null,
      endsIn: endsAt && now < endsAt ? Math.floor((endsAt.getTime() - now.getTime()) / 1000) : null,
      gabaritoIn: gabaritoAt && now < gabaritoAt ? Math.floor((gabaritoAt.getTime() - now.getTime()) / 1000) : null,
    };
  }, [simulado, attempt, currentState, serverTime]);

  const stateData: SimuladoStateData = {
    currentState,
    simulado,
    attempt,
    questions,
    ...derivedFlags,
    isLoading,
    error,
  };

  return {
    ...stateData,
    updateAttempt,
    refresh,
    serverTime,
  };
}
