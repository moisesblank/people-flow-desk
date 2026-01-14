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
        // Selecionar campos base + campos de gabarito (correct_answer, explanation, video)
        // TEMPORAL TRUTH RULE: Incluir TODOS os campos da taxonomia (macro, micro, tema, subtema)
        // RLS e a lógica de exibição controlam quando mostrar gabarito
        const { data: questionsData, error: questionsError } = await supabase
          .from("quiz_questions")
          .select("id, question_text, question_type, options, image_url, image_urls, difficulty, banca, ano, correct_answer, explanation, video_url, video_provider, has_video_resolution, macro, micro, tema, subtema, tags, points")
          .in("id", simData.question_ids)
          // FILTROS DE INTEGRIDADE: Excluir questões com erros de sistema
          .not('question_text', 'is', null)
          .neq('question_text', '')
          .not('explanation', 'is', null)
          .neq('explanation', '')
          .not('question_type', 'is', null)
          .neq('question_type', '');
        
        if (questionsError) {
          console.error("[useSimuladoState] Error loading questions:", questionsError);
        } else if (questionsData) {
          // Verificar se gabarito já foi liberado OU se o aluno já finalizou o simulado
          const gabaritoAt = simData.results_released_at ? new Date(simData.results_released_at) : null;
          const isGabaritoReleasedByTime = gabaritoAt ? new Date() >= gabaritoAt : false;
          
          // Buscar tentativa do usuário para verificar se já finalizou
          const { data: { user } } = await supabase.auth.getUser();
          let hasCompletedAttempt = false;
          
          if (user) {
            // ATENÇÃO: O status no banco é "FINISHED" (maiúsculo), não "completed"
            const { data: attemptCheck } = await supabase
              .from("simulado_attempts")
              .select("status")
              .eq("simulado_id", simuladoId)
              .eq("user_id", user.id)
              .in("status", ["FINISHED", "completed", "finished"])
              .limit(1)
              .maybeSingle();
            
            hasCompletedAttempt = !!attemptCheck;
          }
          
          // REGRA: Liberar resolução se gabarito liberado por tempo OU se aluno já finalizou
          // Isso garante que após finalizar, o aluno SEMPRE veja a resolução (reflexo exato da entidade)
          const shouldShowResolution = isGabaritoReleasedByTime || hasCompletedAttempt;
          
          // Ordenar conforme question_ids
          // TEMPORAL TRUTH RULE: Metadados (macro, micro, tema, subtema) SEMPRE visíveis
          // correct_answer, explanation e video_url: condicionais ao gabarito OU finalização
          const orderedQuestions = simData.question_ids.map((id: string, index: number) => {
            const q = questionsData.find((q) => q.id === id);
            if (!q) return null;
            
            // Campos SEMPRE visíveis (antes e após resolução)
            const baseFields = { 
              id: q.id,
              question_text: q.question_text,
              question_type: q.question_type,
              options: q.options,
              image_url: q.image_url,
              image_urls: q.image_urls,
              difficulty: q.difficulty,
              banca: q.banca,
              ano: q.ano,
              order: index,
              // TAXONOMIA COMPLETA (TEMPORAL TRUTH)
              macro: q.macro,
              micro: q.micro,
              tema: q.tema,
              subtema: q.subtema,
              tags: q.tags,
              points: q.points,
            };
            
            // Se resolução não liberada (nem por tempo, nem por finalização), omitir campos sensíveis
            if (!shouldShowResolution) {
              return baseFields;
            }
            
            // Resolução liberada: incluir TODOS os campos da entidade (REFLEXO EXATO)
            return { 
              ...baseFields, 
              correct_answer: q.correct_answer,
              explanation: q.explanation,
              video_url: q.video_url,
              video_provider: q.video_provider,
              has_video_resolution: q.has_video_resolution,
            };
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
