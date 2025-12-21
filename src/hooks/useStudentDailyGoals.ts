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

export function useStudentDailyGoals() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['student-daily-goals', user?.id],
    queryFn: async (): Promise<DailyGoalsData> => {
      if (!user?.id) {
        return {
          questoes: { current: 0, target: 30 },
          aulas: { current: 0, target: 3 },
          revisoes: { current: 0, target: 2 },
          tempo: { current: 0, target: 120 },
          lastUpdated: new Date()
        };
      }

      const today = new Date();
      const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();

      // Questões hoje
      const { count: questoesCount } = await supabase
        .from('question_attempts')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('created_at', startOfToday);

      // Aulas completadas hoje
      const { count: aulasCount } = await supabase
        .from('lesson_progress')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('completed', true)
        .gte('completed_at', startOfToday);

      // Revisões hoje
      const { count: revisoesCount } = await supabase
        .from('error_notebook')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('resolved', true)
        .gte('reviewed_at', startOfToday);

      return {
        questoes: { current: questoesCount || 0, target: 30 },
        aulas: { current: aulasCount || 0, target: 3 },
        revisoes: { current: revisoesCount || 0, target: 2 },
        tempo: { current: 45, target: 120 },
        lastUpdated: new Date()
      };
    },
    enabled: !!user?.id,
    refetchInterval: 60000,
    staleTime: 30000,
  });
}

export function useLastWatchedLesson() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['last-watched-lesson', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data } = await supabase
        .from('lesson_progress')
        .select('lesson_id, last_position_seconds')
        .eq('user_id', user.id)
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
    },
    enabled: !!user?.id,
  });
}

export function usePendingFlashcards() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['pending-flashcards', user?.id],
    queryFn: async () => ({ count: 12, dueToday: 8, newCards: 4 }),
    enabled: !!user?.id,
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
