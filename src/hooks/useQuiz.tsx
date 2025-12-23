// ============================================
// HOOK DE QUIZZES E SIMULADOS - LMS v5.0
// Sistema completo de avaliações com Event-Driven
// Adaptado para PARTE 5 - Arena da Glória
// ============================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { usePublishEvent } from '@/hooks/usePublishEvent';
import { useSubspaceQuery, SUBSPACE_CACHE_PROFILES } from './useSubspaceCommunication';
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
  quiz_id: string;
  question_text: string;
  question_type: 'multiple_choice' | 'true_false' | 'essay';
  options: Array<{ id: string; text: string }>;
  correct_answer: string;
  explanation: string | null;
  points: number;
  difficulty: 'facil' | 'medio' | 'dificil';
  topic: string | null;
  position: number;
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

// Hook para buscar um quiz específico com questões
export function useQuiz(quizId: string | undefined) {
  return useQuery({
    queryKey: ['quiz', quizId],
    queryFn: async () => {
      if (!quizId) return null;

      const [quizRes, questionsRes] = await Promise.all([
        supabase.from('quizzes').select('*').eq('id', quizId).single(),
        supabase
          .from('quiz_questions')
          .select('*')
          .eq('quiz_id', quizId)
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
    enabled: !!quizId,
  });
}

// Hook para tentativas do usuário em um quiz específico
export function useQuizAttempts(quizIdOrUserId: string | undefined, isUserId = false) {
  const { user } = useAuth();
  const userId = isUserId ? quizIdOrUserId : user?.id;
  const quizId = isUserId ? undefined : quizIdOrUserId;

  return useQuery({
    queryKey: ['quiz-attempts', quizId, userId, isUserId],
    queryFn: async () => {
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
    enabled: !!userId,
  });
}

// Hook para todas as tentativas do usuário (para widget)
export function useAllUserAttempts() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['all-quiz-attempts', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('quiz_attempts')
        .select('*')
        .eq('user_id', user.id)
        .order('started_at', { ascending: false });

      if (error) throw error;
      return data as QuizAttempt[];
    },
    enabled: !!user?.id,
  });
}

// Hook para iniciar uma tentativa (v5.0 - Event-Driven)
export function useStartQuizAttempt() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { publishQuizStarted } = usePublishEvent();

  return useMutation({
    mutationFn: async (quizId: string) => {
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
    onSuccess: (_, quizId) => {
      queryClient.invalidateQueries({ queryKey: ['quiz-attempts', quizId] });
      toast.success('Tentativa iniciada!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao iniciar tentativa');
    },
  });
}

// Hook para submeter respostas (v5.0 - Event-Driven)
export function useSubmitQuiz() {
  const queryClient = useQueryClient();
  const { publishQuizPassed, publishQuizFailed, publishCorrectAnswer, publishWrongAnswer } = usePublishEvent();

  return useMutation({
    mutationFn: async ({
      attemptId,
      answers,
      questions,
      timeSpent,
    }: {
      attemptId: string;
      answers: Record<string, string>;
      questions: QuizQuestion[];
      timeSpent: number;
    }) => {
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
      // Publicar eventos de respostas corretas/erradas em batch
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
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['quiz-attempts'] });
      queryClient.invalidateQueries({ queryKey: ['user-gamification'] });
      if (result.attempt.passed) {
        toast.success(`Parabéns! Você passou com ${result.attempt.percentage}%! +${result.xpEarned} XP`);
      } else {
        toast.info(`Você obteve ${result.attempt.percentage}%. Tente novamente!`);
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao submeter quiz');
    },
  });
}

// Hook para admin criar quiz
export function useCreateQuiz() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (quiz: Omit<Quiz, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('quizzes')
        .insert(quiz)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quizzes'] });
      toast.success('Quiz criado com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao criar quiz');
    },
  });
}

// Hook para admin adicionar questão
export function useAddQuestion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (question: Omit<QuizQuestion, 'id'>) => {
      const { data, error } = await supabase
        .from('quiz_questions')
        .insert(question)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['quiz', variables.quiz_id] });
      toast.success('Questão adicionada!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao adicionar questão');
    },
  });
}
