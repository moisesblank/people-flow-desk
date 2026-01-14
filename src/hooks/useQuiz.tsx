// ============================================
// HOOK DE QUIZZES E SIMULADOS - LMS v5.0
// FASE 3: useOptimisticMutation - 0ms feedback
// Adaptado para PARTE 5 - Arena da Glória
// ============================================

import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { usePublishEvent } from '@/hooks/usePublishEvent';
import { useSubspaceQuery, useOptimisticMutation, SUBSPACE_CACHE_PROFILES } from './useSubspaceCommunication';
import { toast } from 'sonner';

export interface Quiz {
  id: string;
  course_id: string | null;
  module_id: string | null;
  title: string;
  description: string | null;
  quiz_type: 'quiz' | 'simulado' | 'avaliacao';
  time_limit_minutes: number | null;
  passing_score: number;
  max_attempts: number;
  shuffle_questions: boolean;
  show_correct_answers: boolean;
  xp_reward: number;
  is_published: boolean;
  created_at: string;
}

export interface QuizQuestion {
  id: string;
  quiz_id?: string;
  question_text: string;
  question_type: 'multiple_choice' | 'true_false' | 'essay';
  options: Array<{ id: string; text: string; image_url?: string }>;
  correct_answer: string;
  explanation: string | null;
  points: number;
  difficulty: 'facil' | 'medio' | 'dificil';
  topic: string | null;
  position: number;
  macro?: string; // MACRO é obrigatório no banco, mas opcional no input (fallback aplicado)
}

export interface QuizAttempt {
  id: string;
  quiz_id: string;
  user_id: string;
  score: number;
  max_score: number;
  percentage: number;
  passed: boolean;
  time_spent_seconds: number;
  answers: Record<string, string>;
  started_at: string;
  completed_at: string | null;
}

// 🌌 Hook migrado para useSubspaceQuery - Cache localStorage
export function useQuizzes(courseId?: string, moduleId?: string) {
  return useSubspaceQuery<Quiz[]>(
    ['quizzes', courseId || 'all', moduleId || 'all'],
    async () => {
      let query = supabase
        .from('quizzes')
        .select('*')
        .eq('is_published', true)
        .order('created_at', { ascending: false });

      if (courseId) query = query.eq('course_id', courseId);
      if (moduleId) query = query.eq('module_id', moduleId);

      const { data, error } = await query;
      if (error) throw error;
      return data as Quiz[];
    },
    {
      profile: 'semiStatic', // 10min stale, conteúdo estável
      persistKey: `quizzes_${courseId || 'all'}_${moduleId || 'all'}`,
    }
  );
}

// Hook para buscar um quiz específico com questões - MIGRADO para useSubspaceQuery
export function useQuiz(quizId: string | undefined) {
  return useSubspaceQuery<{ quiz: Quiz; questions: QuizQuestion[] } | null>(
    ['quiz', quizId || 'none'],
    async () => {
      if (!quizId) return null;

      const [quizRes, questionsRes] = await Promise.all([
        supabase.from('quizzes').select('*').eq('id', quizId).single(),
        supabase
          .from('quiz_questions')
          .select('*')
          .eq('quiz_id', quizId)
          // 🔒 FILTROS DE INTEGRIDADE PERMANENTES: Excluir questões com erros de sistema
          .not('question_text', 'is', null)
          .neq('question_text', '')
          .not('explanation', 'is', null)
          .neq('explanation', '')
          .not('question_type', 'is', null)
          .neq('question_type', '')
          .order('position', { ascending: true }),
      ]);

      if (quizRes.error) throw quizRes.error;
      if (questionsRes.error) throw questionsRes.error;

      const questions = questionsRes.data.map((q: any) => ({
        ...q,
        options: Array.isArray(q.options) ? q.options : [],
        difficulty: q.difficulty as 'facil' | 'medio' | 'dificil',
        question_type: q.question_type as 'multiple_choice' | 'true_false' | 'essay',
      }));

      return {
        quiz: quizRes.data as Quiz,
        questions: questions as QuizQuestion[],
      };
    },
    {
      profile: 'semiStatic',
      persistKey: `quiz_detail_${quizId}`,
      enabled: !!quizId,
    }
  );
}

// Hook para tentativas do usuário - MIGRADO para useSubspaceQuery
export function useQuizAttempts(quizIdOrUserId: string | undefined, isUserId = false) {
  const { user } = useAuth();
  const userId = isUserId ? quizIdOrUserId : user?.id;
  const quizId = isUserId ? undefined : quizIdOrUserId;

  return useSubspaceQuery<QuizAttempt[]>(
    ['quiz-attempts', quizId || 'all', userId || 'anon', String(isUserId)],
    async () => {
      if (!userId) return [];

      let query = supabase
        .from('quiz_attempts')
        .select('*')
        .eq('user_id', userId)
        .order('started_at', { ascending: false });

      if (quizId) {
        query = query.eq('quiz_id', quizId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as QuizAttempt[];
    },
    {
      profile: 'user',
      persistKey: `quiz_attempts_${quizId || 'all'}_${userId}`,
      enabled: !!userId,
    }
  );
}

// Hook para todas as tentativas - MIGRADO para useSubspaceQuery
export function useAllUserAttempts() {
  const { user } = useAuth();

  return useSubspaceQuery<QuizAttempt[]>(
    ['all-quiz-attempts', user?.id || 'anon'],
    async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('quiz_attempts')
        .select('*')
        .eq('user_id', user.id)
        .order('started_at', { ascending: false });

      if (error) throw error;
      return data as QuizAttempt[];
    },
    {
      profile: 'user',
      persistKey: `all_quiz_attempts_${user?.id}`,
      enabled: !!user?.id,
    }
  );
}

// Hook para iniciar uma tentativa (v5.0 - Event-Driven + FASE 3)
export function useStartQuizAttempt() {
  const { user } = useAuth();
  const { publishQuizStarted } = usePublishEvent();

  return useOptimisticMutation<QuizAttempt[], string, QuizAttempt>({
    queryKey: ['quiz-attempts'],
    mutationFn: async (quizId) => {
      if (!user?.id) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('quiz_attempts')
        .insert({
          quiz_id: quizId,
          user_id: user.id,
          score: 0,
          max_score: 0,
          percentage: 0,
          passed: false,
          time_spent_seconds: 0,
          answers: {},
        })
        .select()
        .single();

      if (error) throw error;

      // PARTE 5: Publicar evento de início de quiz
      await publishQuizStarted(quizId);

      return data as QuizAttempt;
    },
    optimisticUpdate: (old, quizId) => [
      ...(old || []),
      {
        id: `temp-${Date.now()}`,
        quiz_id: quizId,
        user_id: user?.id || '',
        score: 0,
        max_score: 0,
        percentage: 0,
        passed: false,
        time_spent_seconds: 0,
        answers: {},
        created_at: new Date().toISOString(),
        started_at: new Date().toISOString(),
        completed_at: null
      } as QuizAttempt
    ],
    successMessage: 'Tentativa iniciada!',
    errorMessage: 'Erro ao iniciar tentativa',
  });
}

// Hook para submeter respostas (v5.0 - Event-Driven + FASE 3)
export function useSubmitQuiz() {
  const queryClient = useQueryClient();
  const { publishQuizPassed, publishQuizFailed, publishCorrectAnswer, publishWrongAnswer } = usePublishEvent();

  return useOptimisticMutation<QuizAttempt[], { attemptId: string; answers: Record<string, string>; questions: QuizQuestion[]; timeSpent: number }, { attempt: QuizAttempt; xpEarned: number }>({
    queryKey: ['quiz-attempts'],
    mutationFn: async ({ attemptId, answers, questions, timeSpent }) => {
      // Calcular pontuação
      let score = 0;
      let maxScore = 0;
      const correctAnswers: string[] = [];
      const wrongAnswers: string[] = [];

      const answerRecords = questions.map((q) => {
        const userAnswer = answers[q.id] || '';
        const isCorrect = userAnswer === q.correct_answer;
        if (isCorrect) {
          score += q.points;
          correctAnswers.push(q.id);
        } else {
          wrongAnswers.push(q.id);
        }
        maxScore += q.points;

        return {
          attempt_id: attemptId,
          question_id: q.id,
          user_answer: userAnswer,
          is_correct: isCorrect,
          points_earned: isCorrect ? q.points : 0,
        };
      });

      const percentage = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;

      // Buscar quiz para verificar nota de aprovação
      const { data: attempt } = await supabase
        .from('quiz_attempts')
        .select('quiz_id')
        .eq('id', attemptId)
        .single();

      const quizId = attempt?.quiz_id;

      const { data: quiz } = await supabase
        .from('quizzes')
        .select('passing_score, xp_reward')
        .eq('id', quizId)
        .single();

      const passed = percentage >= (quiz?.passing_score || 70);

      // Inserir respostas
      const { error: answersError } = await supabase
        .from('quiz_answers')
        .insert(answerRecords);

      if (answersError) throw answersError;

      // Atualizar tentativa
      const { data, error } = await supabase
        .from('quiz_attempts')
        .update({
          score,
          max_score: maxScore,
          percentage,
          passed,
          time_spent_seconds: timeSpent,
          answers,
          completed_at: new Date().toISOString(),
        })
        .eq('id', attemptId)
        .select()
        .single();

      if (error) throw error;

      // PARTE 5: Publicar eventos de cada resposta (gamificação por evento)
      for (const questionId of correctAnswers) {
        await publishCorrectAnswer(questionId, quizId);
      }
      for (const questionId of wrongAnswers) {
        await publishWrongAnswer(questionId, quizId);
      }

      // Publicar evento de resultado do quiz
      if (passed) {
        await publishQuizPassed(quizId, percentage, questions.length);
      } else {
        await publishQuizFailed(quizId, percentage, questions.length);
      }

      return { attempt: data as QuizAttempt, xpEarned: passed ? quiz?.xp_reward || 0 : 0 };
    },
    optimisticUpdate: (old, { attemptId }) => {
      return (old || []).map(a => 
        a.id === attemptId 
          ? { ...a, completed_at: new Date().toISOString() } 
          : a
      );
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['user-gamification'] });
      if (result.attempt.passed) {
        toast.success(`Parabéns! Você passou com ${result.attempt.percentage}%! +${result.xpEarned} XP`);
      } else {
        toast.info(`Você obteve ${result.attempt.percentage}%. Tente novamente!`);
      }
    },
    errorMessage: 'Erro ao submeter quiz',
  });
}

// Hook para criar quiz - MIGRADO PARA useOptimisticMutation
export function useCreateQuiz() {
  return useOptimisticMutation<Quiz[], Omit<Quiz, 'id' | 'created_at'>, Quiz>({
    queryKey: ['quizzes', 'all', 'all'],
    mutationFn: async (quiz) => {
      const { data, error } = await supabase
        .from('quizzes')
        .insert(quiz)
        .select()
        .single();

      if (error) throw error;
      return data as Quiz;
    },
    optimisticUpdate: (old, newQuiz) => {
      const tempQuiz: Quiz = {
        ...newQuiz,
        id: `temp-${Date.now()}`,
        created_at: new Date().toISOString(),
      };
      return [tempQuiz, ...(old || [])];
    },
    successMessage: 'Quiz criado com sucesso!',
    errorMessage: 'Erro ao criar quiz',
  });
}

// Hook para adicionar questão - MIGRADO PARA useOptimisticMutation
export function useAddQuestion() {
  const queryClient = useQueryClient();

  return useOptimisticMutation<any[], Omit<QuizQuestion, 'id'>, any>({
    queryKey: ['quiz-questions'],
    mutationFn: async (question) => {
      const insertData: Record<string, any> = {
        question_text: question.question_text,
        question_type: question.question_type,
        options: question.options,
        correct_answer: question.correct_answer,
        explanation: question.explanation,
        points: question.points,
        difficulty: question.difficulty,
        topic: question.topic,
        position: question.position,
        macro: question.macro || 'Química Geral', // MACRO é obrigatório (NOT NULL)
      };
      
      // Adicionar quiz_id apenas se existir (campo opcional)
      if (question.quiz_id) {
        insertData.quiz_id = question.quiz_id;
      }
      
      const { data, error } = await supabase
        .from('quiz_questions')
        .insert(insertData as any)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    optimisticUpdate: (old, newQuestion) => {
      const tempQuestion = {
        ...newQuestion,
        id: `temp-${Date.now()}`,
      };
      return [...(old || []), tempQuestion];
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['quiz', variables.quiz_id] });
    },
    successMessage: 'Questão adicionada!',
    errorMessage: 'Erro ao adicionar questão',
  });
}
