// ============================================
// TESTAMENTO DA SINGULARIDADE v5.0
// HOOK DE PRÁTICA DE QUESTÕES
// Sistema de prática com Event-Driven Architecture
// PARTE 5 - Arena da Glória
// ============================================

import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { usePublishEvent } from "@/hooks/usePublishEvent";
import { useSubspaceQuery, SUBSPACE_CACHE_PROFILES } from './useSubspaceCommunication';
import { toast } from "sonner";

export interface PracticeQuestion {
  id: string;
  question_text: string;
  question_type: "multiple_choice" | "true_false" | "essay";
  options: Array<{ id: string; text: string }>;
  correct_answer: string;
  explanation: string | null;
  points: number;
  difficulty: "facil" | "medio" | "dificil";
  topic: string | null;
  subject?: string;
  source?: string;
}

export interface QuestionAttempt {
  id: string;
  user_id: string;
  question_id: string;
  user_answer: string;
  is_correct: boolean;
  time_spent_seconds: number | null;
  created_at: string;
}

export interface PracticeSession {
  questions: PracticeQuestion[];
  currentIndex: number;
  correctCount: number;
  wrongCount: number;
  answers: Record<string, { answer: string; isCorrect: boolean }>;
  startTime: number;
}

// 🌌 Hook migrado para useSubspaceQuery - Cache localStorage
export function usePracticeQuestions(options?: {
  subject?: string;
  topic?: string;
  difficulty?: string;
  limit?: number;
}) {
  return useSubspaceQuery<PracticeQuestion[]>(
    ["practice-questions", JSON.stringify(options || {})],
    async () => {
      let query = supabase
        .from("quiz_questions")
        .select("*")
        .order("position", { ascending: true });

      if (options?.limit) {
        query = query.limit(options.limit);
      }

      const { data, error } = await query;
      if (error) throw error;

      return (data || []).map((q: any) => ({
        ...q,
        options: Array.isArray(q.options) ? q.options : [],
        difficulty: q.difficulty as "facil" | "medio" | "dificil",
        question_type: q.question_type as "multiple_choice" | "true_false" | "essay",
      })) as PracticeQuestion[];
    },
    {
      profile: 'semiStatic', // 10min stale, questões são estáveis
      persistKey: `practice_questions_${JSON.stringify(options || {})}`,
    }
  );
}

// Hook para registrar tentativa de questão
export function useQuestionAttempt() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { publishCorrectAnswer, publishWrongAnswer } = usePublishEvent();

  return useMutation({
    mutationFn: async ({
      questionId,
      userAnswer,
      correctAnswer,
      timeSpent,
    }: {
      questionId: string;
      userAnswer: string;
      correctAnswer: string;
      timeSpent?: number;
    }) => {
      if (!user?.id) throw new Error("Usuário não autenticado");

      const isCorrect = userAnswer === correctAnswer;

      // PARTE 5: Publicar evento (Sistema Nervoso Divino)
      // O evento c-grant-xp irá processar o XP automaticamente
      if (isCorrect) {
        await publishCorrectAnswer(questionId);
      } else {
        await publishWrongAnswer(questionId);
      }

      return { isCorrect, questionId, userAnswer };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["user-gamification"] });
      if (result.isCorrect) {
        toast.success("Resposta correta! +10 XP");
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao registrar resposta");
    },
  });
}

// Hook principal para sessão de prática
export function usePracticeSession(questions: PracticeQuestion[]) {
  const [session, setSession] = useState<PracticeSession>({
    questions,
    currentIndex: 0,
    correctCount: 0,
    wrongCount: 0,
    answers: {},
    startTime: Date.now(),
  });

  const { mutateAsync: recordAttempt, isPending: isRecording } = useQuestionAttempt();

  const currentQuestion = session.questions[session.currentIndex];
  const isComplete = session.currentIndex >= session.questions.length;
  const progress = ((session.currentIndex) / session.questions.length) * 100;

  const handleAnswer = useCallback(async (answer: string) => {
    if (!currentQuestion) return;

    const isCorrect = answer === currentQuestion.correct_answer;
    const timeSpent = Math.floor((Date.now() - session.startTime) / 1000);

    // Registrar tentativa (publica evento automaticamente)
    try {
      await recordAttempt({
        questionId: currentQuestion.id,
        userAnswer: answer,
        correctAnswer: currentQuestion.correct_answer,
        timeSpent,
      });
    } catch {
      // Continua mesmo se falhar a publicação
    }

    setSession((prev) => ({
      ...prev,
      answers: {
        ...prev.answers,
        [currentQuestion.id]: { answer, isCorrect },
      },
      correctCount: prev.correctCount + (isCorrect ? 1 : 0),
      wrongCount: prev.wrongCount + (isCorrect ? 0 : 1),
    }));

    return isCorrect;
  }, [currentQuestion, recordAttempt, session.startTime]);

  const nextQuestion = useCallback(() => {
    setSession((prev) => ({
      ...prev,
      currentIndex: prev.currentIndex + 1,
      startTime: Date.now(),
    }));
  }, []);

  const previousQuestion = useCallback(() => {
    setSession((prev) => ({
      ...prev,
      currentIndex: Math.max(0, prev.currentIndex - 1),
    }));
  }, []);

  const resetSession = useCallback(() => {
    setSession({
      questions,
      currentIndex: 0,
      correctCount: 0,
      wrongCount: 0,
      answers: {},
      startTime: Date.now(),
    });
  }, [questions]);

  const getStats = useCallback(() => {
    const total = session.questions.length;
    const answered = Object.keys(session.answers).length;
    const percentage = total > 0 ? Math.round((session.correctCount / total) * 100) : 0;

    return {
      total,
      answered,
      correct: session.correctCount,
      wrong: session.wrongCount,
      percentage,
      remaining: total - answered,
    };
  }, [session]);

  return {
    currentQuestion,
    currentIndex: session.currentIndex,
    isComplete,
    progress,
    answers: session.answers,
    handleAnswer,
    nextQuestion,
    previousQuestion,
    resetSession,
    getStats,
    isRecording,
  };
}

// Hook para histórico de prática do usuário
export function usePracticeHistory() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["practice-history", user?.id],
    queryFn: async () => {
      if (!user?.id) return { totalAttempts: 0, correctCount: 0, wrongCount: 0, accuracy: 0 };

      const { data, error } = await supabase
        .from("quiz_answers")
        .select("is_correct")
        .limit(1000);

      if (error) throw error;

      const totalAttempts = data?.length || 0;
      const correctCount = data?.filter((a) => a.is_correct).length || 0;
      const wrongCount = totalAttempts - correctCount;
      const accuracy = totalAttempts > 0 ? Math.round((correctCount / totalAttempts) * 100) : 0;

      return { totalAttempts, correctCount, wrongCount, accuracy };
    },
    enabled: !!user?.id,
  });
}
