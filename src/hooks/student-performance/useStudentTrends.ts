// =====================================================
// useStudentTrends - Hook de Tendências por Macro
// Compara períodos para identificar evolução ou regressão
// =====================================================

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface TrendData {
  macro: string;
  recentAccuracy: number;
  previousAccuracy: number;
  trend: 'up' | 'down' | 'stable' | 'insufficient_data';
  recentAttempts: number;
  previousAttempts: number;
  isStatisticallyValid: boolean;
}

export function useStudentTrends(userId: string | undefined, periodDays: number = 14) {
  return useQuery({
    queryKey: ['student-trends', userId, periodDays],
    queryFn: async (): Promise<TrendData[]> => {
      if (!userId) return [];

      const { data, error } = await supabase.rpc('get_student_trends', {
        p_user_id: userId,
        p_period_days: periodDays,
      });

      if (error) throw error;
      
      if (!Array.isArray(data)) return [];

      return data.map((row: any) => ({
        macro: row.macro || 'Sem Macro',
        recentAccuracy: Number(row.recent_accuracy) || 0,
        previousAccuracy: Number(row.previous_accuracy) || 0,
        trend: row.trend as TrendData['trend'],
        recentAttempts: Number(row.recent_attempts) || 0,
        previousAttempts: Number(row.previous_attempts) || 0,
        isStatisticallyValid: Boolean(row.is_statistically_valid),
      }));
    },
    enabled: !!userId,
    staleTime: 60_000, // PATCH 5K: 60s cache para performance de usuário
    gcTime: 5 * 60 * 1000,
    // 🚀 PATCH 5K v2: Desabilita refetch em troca de aba
    // ANTES: 5K alunos × 10 trocas/hora = 50.000 req/hora extras
    // DEPOIS: 0 requisições extras (usa cache até staleTime expirar)
    refetchOnWindowFocus: false,
    refetchOnMount: true,
  });
}
