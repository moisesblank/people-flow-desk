/**
 * 🎯 SIMULADOS — Hook de Respostas
 * Constituição SYNAPSE Ω v10.0
 * 
 * Gerencia respostas do usuário durante o simulado.
 * Persiste em tempo real para evitar perda de dados.
 */

import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface Answer {
  questionId: string;
  selectedOption: string | null;
  answeredAt: Date | null;
  timeSpentSeconds: number;
}

export interface AnswersState {
  answers: Map<string, Answer>;
  currentQuestionId: string | null;
  questionStartTime: Date | null;
  isSaving: boolean;
  lastSavedAt: Date | null;
}

interface UseSimuladoAnswersOptions {
  attemptId: string | null;
  questionIds: string[];
  enabled?: boolean;
  autoSave?: boolean;
}

export function useSimuladoAnswers(options: UseSimuladoAnswersOptions) {
  const { attemptId, questionIds, enabled = true, autoSave = true } = options;
  const { toast } = useToast();

  const [answers, setAnswers] = useState<Map<string, Answer>>(new Map());
  const [currentQuestionId, setCurrentQuestionId] = useState<string | null>(null);
  const [questionStartTime, setQuestionStartTime] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);

  /**
   * Carrega respostas existentes (para retomar tentativa)
   */
  const loadExistingAnswers = useCallback(async () => {
    if (!attemptId || !enabled) return;

    try {
      const { data, error } = await supabase
        .from("simulado_answers")
        .select("question_id, selected_option, answered_at, time_spent_seconds")
        .eq("attempt_id", attemptId);

      if (error) {
        console.error("[useSimuladoAnswers] Load error:", error);
        return;
      }

      if (data && data.length > 0) {
        const loadedAnswers = new Map<string, Answer>();
        data.forEach(row => {
          loadedAnswers.set(row.question_id, {
            questionId: row.question_id,
            selectedOption: row.selected_option,
            answeredAt: row.answered_at ? new Date(row.answered_at) : null,
            timeSpentSeconds: row.time_spent_seconds || 0,
          });
        });
        setAnswers(loadedAnswers);
        console.log(`[useSimuladoAnswers] Loaded ${loadedAnswers.size} existing answers`);
      }
    } catch (err) {
      console.error("[useSimuladoAnswers] Load exception:", err);
    }
  }, [attemptId, enabled]);

  /**
   * Navega para uma questão
   */
  const navigateToQuestion = useCallback((questionId: string) => {
    // Se estava em outra questão, salvar tempo gasto
    if (currentQuestionId && questionStartTime && currentQuestionId !== questionId) {
      const timeSpent = Math.floor((Date.now() - questionStartTime.getTime()) / 1000);
      setAnswers(prev => {
        const updated = new Map(prev);
        const existing = updated.get(currentQuestionId);
        if (existing) {
          updated.set(currentQuestionId, {
            ...existing,
            timeSpentSeconds: existing.timeSpentSeconds + timeSpent,
          });
        }
        return updated;
      });
    }

    setCurrentQuestionId(questionId);
    setQuestionStartTime(new Date());
  }, [currentQuestionId, questionStartTime]);

  /**
   * Seleciona resposta para questão atual
   */
  const selectAnswer = useCallback(async (questionId: string, optionKey: string) => {
    if (!attemptId || !enabled) return;

    const now = new Date();
    const timeSpent = questionStartTime 
      ? Math.floor((now.getTime() - questionStartTime.getTime()) / 1000)
      : 0;

    // Atualizar estado local imediatamente
    setAnswers(prev => {
      const updated = new Map(prev);
      const existing = updated.get(questionId);
      updated.set(questionId, {
        questionId,
        selectedOption: optionKey,
        answeredAt: now,
        timeSpentSeconds: (existing?.timeSpentSeconds || 0) + timeSpent,
      });
      return updated;
    });

    // Resetar timer da questão
    setQuestionStartTime(new Date());

    // Persistir se autoSave habilitado
    if (autoSave) {
      await saveAnswer(questionId, optionKey, timeSpent);
    }
  }, [attemptId, enabled, questionStartTime, autoSave]);

  /**
   * Persiste resposta no banco
   */
  const saveAnswer = useCallback(async (questionId: string, optionKey: string, additionalTime: number = 0) => {
    if (!attemptId) return;

    setIsSaving(true);

    try {
      const existingAnswer = answers.get(questionId);
      const totalTime = (existingAnswer?.timeSpentSeconds || 0) + additionalTime;

      const { error } = await supabase
        .from("simulado_answers")
        .upsert({
          attempt_id: attemptId,
          question_id: questionId,
          selected_option: optionKey,
          answered_at: new Date().toISOString(),
          time_spent_seconds: totalTime,
        }, {
          onConflict: "attempt_id,question_id",
        });

      if (error) {
        console.error("[useSimuladoAnswers] Save error:", error);
        toast({
          title: "Erro ao salvar resposta",
          description: "Tentando novamente...",
          variant: "destructive",
        });
        return;
      }

      setLastSavedAt(new Date());
    } catch (err) {
      console.error("[useSimuladoAnswers] Save exception:", err);
    } finally {
      setIsSaving(false);
    }
  }, [attemptId, answers, toast]);

  /**
   * Salva todas as respostas pendentes
   */
  const saveAllAnswers = useCallback(async () => {
    if (!attemptId || answers.size === 0) return;

    setIsSaving(true);

    try {
      const answersArray = Array.from(answers.values()).map(a => ({
        attempt_id: attemptId,
        question_id: a.questionId,
        selected_option: a.selectedOption,
        answered_at: a.answeredAt?.toISOString() || new Date().toISOString(),
        time_spent_seconds: a.timeSpentSeconds,
      }));

      const { error } = await supabase
        .from("simulado_answers")
        .upsert(answersArray, {
          onConflict: "attempt_id,question_id",
        });

      if (error) {
        console.error("[useSimuladoAnswers] Bulk save error:", error);
        return false;
      }

      setLastSavedAt(new Date());
      return true;
    } catch (err) {
      console.error("[useSimuladoAnswers] Bulk save exception:", err);
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [attemptId, answers]);

  /**
   * Retorna resposta de uma questão
   */
  const getAnswer = useCallback((questionId: string): Answer | undefined => {
    return answers.get(questionId);
  }, [answers]);

  /**
   * Verifica se questão foi respondida
   */
  const isAnswered = useCallback((questionId: string): boolean => {
    const answer = answers.get(questionId);
    return answer?.selectedOption !== null && answer?.selectedOption !== undefined;
  }, [answers]);

  /**
   * Estatísticas de progresso
   */
  const getProgress = useCallback(() => {
    const total = questionIds.length;
    const answered = Array.from(answers.values()).filter(a => a.selectedOption !== null).length;
    return {
      total,
      answered,
      remaining: total - answered,
      percentage: total > 0 ? Math.round((answered / total) * 100) : 0,
    };
  }, [questionIds, answers]);

  /**
   * Reset para novo simulado
   */
  const reset = useCallback(() => {
    setAnswers(new Map());
    setCurrentQuestionId(null);
    setQuestionStartTime(null);
    setLastSavedAt(null);
  }, []);

  // Carregar respostas existentes ao iniciar
  useEffect(() => {
    if (attemptId && enabled) {
      loadExistingAnswers();
    }
  }, [attemptId, enabled, loadExistingAnswers]);

  return {
    answers,
    currentQuestionId,
    isSaving,
    lastSavedAt,
    
    // Ações
    navigateToQuestion,
    selectAnswer,
    saveAnswer,
    saveAllAnswers,
    loadExistingAnswers,
    getAnswer,
    isAnswered,
    getProgress,
    reset,
    
    // Conveniências
    answeredCount: Array.from(answers.values()).filter(a => a.selectedOption !== null).length,
    totalQuestions: questionIds.length,
  };
}
