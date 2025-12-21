// ============================================
// METAS DIÁRIAS DO ALUNO - TEMPO REAL
// Lei I: Performance | Lei IV: Automação
// ============================================

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface DailyGoalsData {
  questoes: { current: number; target: number };
  aulas: { current: number; target: number };
  revisoes: { current: number; target: number };
  tempo: { current: number; target: number };
  lastUpdated: Date;
}

async function fetchDailyGoals(userId: string): Promise<DailyGoalsData> {
  const today = new Date();
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();

  // Questões hoje
  const { data: questoesData } = await supabase
    .from('question_attempts')
    .select('id')
    .eq('user_id', userId)
    .gte('created_at', startOfToday);

  // Aulas completadas hoje
  const { data: aulasData } = await supabase
    .from('lesson_progress')
    .select('id')
    .eq('user_id', userId)
    .eq('completed', true)
    .gte('completed_at', startOfToday);

  // Revisões hoje - erros que foram dominados (mastered)
  const { data: revisoesData } = await supabase
    .from('error_notebook')
    .select('question_id')
    .eq('user_id', userId)
    .eq('mastered', true)
    .gte('mastered_at', startOfToday);

  return {
    questoes: { current: questoesData?.length ?? 0, target: 30 },
    aulas: { current: aulasData?.length ?? 0, target: 3 },
    revisoes: { current: revisoesData?.length ?? 0, target: 2 },
    tempo: { current: 45, target: 120 },
    lastUpdated: new Date()
  };
}

export function useStudentDailyGoals() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['student-daily-goals', user?.id],
    queryFn: () => fetchDailyGoals(user!.id),
    enabled: !!user?.id,
    refetchInterval: 60000,
    staleTime: 30000,
  });
}

async function fetchLastWatchedLesson(userId: string) {
  const { data } = await supabase
    .from('lesson_progress')
    .select('lesson_id, last_position_seconds')
    .eq('user_id', userId)
    .eq('completed', false)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!data) return null;

  const { data: lesson } = await supabase
    .from('lessons')
    .select('id, title')
    .eq('id', data.lesson_id)
    .maybeSingle();

  return lesson ? {
    lessonId: data.lesson_id,
    title: lesson.title,
    moduleName: 'Módulo',
    progressPercent: 50
  } : null;
}

export function useLastWatchedLesson() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['last-watched-lesson', user?.id],
    queryFn: () => fetchLastWatchedLesson(user!.id),
    enabled: !!user?.id,
  });
}

export function usePendingFlashcards() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['pending-flashcards', user?.id],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      
      // Cards devido hoje
      const { data: dueCards } = await supabase
        .from('study_flashcards')
        .select('id, state')
        .eq('user_id', user!.id)
        .lte('due_date', today);
      
      const cards = dueCards || [];
      const newCards = cards.filter(c => c.state === 'new').length;
      
      return { 
        count: cards.length, 
        dueToday: cards.length - newCards, 
        newCards 
      };
    },
    enabled: !!user?.id,
    staleTime: 30000,
    refetchInterval: 60000,
  });
}

export function useStudentInsights() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['student-insights', user?.id],
    queryFn: async () => ({
      weakestArea: { name: 'Estequiometria', accuracy: 45 },
      strongestArea: { name: 'Química Orgânica', accuracy: 78 },
      recentAccuracy: 65,
      suggestion: 'Foque na revisão de erros! É 3x mais eficiente que estudar conteúdo novo.'
    }),
    enabled: !!user?.id,
    staleTime: 300000,
  });
}
