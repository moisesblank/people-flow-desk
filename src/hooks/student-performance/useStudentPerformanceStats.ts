// =====================================================
// useStudentPerformanceStats - Hook de Estatísticas Resumidas
// Retorna dados para os 4 cards principais do dashboard
// =====================================================

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface PerformanceStats {
  totalQuestions: number;
  totalCorrect: number;
  overallAccuracy: number;
  avgTimeSeconds: number;
  bestMacro: string;
  bestMacroAccuracy: number;
  worstMacro: string;
  worstMacroAccuracy: number;
  totalXp: number;
  currentStreak: number;
}

export function useStudentPerformanceStats(userId: string | undefined, daysBack: number = 360) {
  return useQuery({
    queryKey: ['student-performance-stats', userId, daysBack],
    queryFn: async (): Promise<PerformanceStats | null> => {
      if (!userId) return null;

      const { data, error } = await supabase.rpc('get_student_performance_stats', {
        p_user_id: userId,
        p_days_back: daysBack,
      });

      if (error) throw error;
      
      // RPC retorna array com 1 elemento
      const row = Array.isArray(data) ? data[0] : data;
      
      if (!row) {
        return {
          totalQuestions: 0,
          totalCorrect: 0,
          overallAccuracy: 0,
          avgTimeSeconds: 0,
          bestMacro: 'N/A',
          bestMacroAccuracy: 0,
          worstMacro: 'N/A',
          worstMacroAccuracy: 0,
          totalXp: 0,
          currentStreak: 0,
        };
      }

      return {
        totalQuestions: Number(row.total_questions) || 0,
        totalCorrect: Number(row.total_correct) || 0,
        overallAccuracy: Number(row.overall_accuracy) || 0,
        avgTimeSeconds: Number(row.avg_time_seconds) || 0,
        bestMacro: row.best_macro || 'N/A',
        bestMacroAccuracy: Number(row.best_macro_accuracy) || 0,
        worstMacro: row.worst_macro || 'N/A',
        worstMacroAccuracy: Number(row.worst_macro_accuracy) || 0,
        totalXp: Number(row.total_xp) || 0,
        currentStreak: Number(row.current_streak) || 0,
      };
    },
    enabled: !!userId,
    staleTime: 0,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });
}
