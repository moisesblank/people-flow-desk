// =====================================================
// useGlobalComparison - Hook de Comparação Global
// Busca dados pré-calculados da tabela performance_global_daily
// =====================================================

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PerformanceStats } from "./useStudentPerformanceStats";

export interface GlobalComparisonData {
  macro: string;
  globalAccuracy: number;
  globalAvgTime: number;
  totalUsers: number;
  totalAttempts: number;
}

export interface ComparisonResult {
  globalStats: GlobalComparisonData[];
  userVsGlobal: {
    macro: string;
    userAccuracy: number;
    globalAccuracy: number;
    difference: number;
    isAboveAverage: boolean;
  }[];
  overallComparison: {
    userOverall: number;
    globalOverall: number;
    isAboveAverage: boolean;
    percentile: number; // Estimativa aproximada
  };
}

export function useGlobalComparison(
  userId: string | undefined,
  userStats: PerformanceStats | null | undefined,
  userTaxonomyData: { macro: string; accuracyPercent: number }[] | undefined
) {
  return useQuery({
    queryKey: ['global-comparison', userId],
    queryFn: async (): Promise<ComparisonResult | null> => {
      if (!userId) return null;

      // Buscar dados globais pré-calculados (apenas nível macro)
      const { data, error } = await supabase
        .from('performance_global_daily')
        .select('macro, accuracy_percent, avg_time_seconds, unique_users, total_attempts')
        .order('total_attempts', { ascending: false });

      if (error) throw error;

      // Agrupar por macro (pode ter múltiplas linhas por micro/tema)
      const macroMap = new Map<string, GlobalComparisonData>();
      
      for (const row of data || []) {
        const existing = macroMap.get(row.macro);
        if (existing) {
          // Média ponderada
          const totalAttempts = existing.totalAttempts + row.total_attempts;
          existing.globalAccuracy = 
            ((existing.globalAccuracy * existing.totalAttempts) + 
             (row.accuracy_percent * row.total_attempts)) / totalAttempts;
          existing.globalAvgTime = 
            ((existing.globalAvgTime * existing.totalAttempts) + 
             ((row.avg_time_seconds || 0) * row.total_attempts)) / totalAttempts;
          existing.totalAttempts = totalAttempts;
          existing.totalUsers = Math.max(existing.totalUsers, row.unique_users || 0);
        } else {
          macroMap.set(row.macro, {
            macro: row.macro,
            globalAccuracy: row.accuracy_percent || 0,
            globalAvgTime: row.avg_time_seconds || 0,
            totalUsers: row.unique_users || 0,
            totalAttempts: row.total_attempts || 0,
          });
        }
      }

      const globalStats = Array.from(macroMap.values());

      // Calcular comparação usuário vs global
      const userVsGlobal = (userTaxonomyData || []).map(userMacro => {
        const global = macroMap.get(userMacro.macro);
        const globalAccuracy = global?.globalAccuracy || 0;
        const difference = userMacro.accuracyPercent - globalAccuracy;

        return {
          macro: userMacro.macro,
          userAccuracy: userMacro.accuracyPercent,
          globalAccuracy,
          difference: Math.round(difference * 100) / 100,
          isAboveAverage: difference > 0,
        };
      });

      // Calcular média global geral
      let globalOverallAccuracy = 0;
      let totalGlobalAttempts = 0;
      for (const stat of globalStats) {
        globalOverallAccuracy += stat.globalAccuracy * stat.totalAttempts;
        totalGlobalAttempts += stat.totalAttempts;
      }
      globalOverallAccuracy = totalGlobalAttempts > 0 
        ? globalOverallAccuracy / totalGlobalAttempts 
        : 0;

      const userOverall = userStats?.overallAccuracy || 0;
      
      // Estimativa simplificada de percentil
      const percentile = userOverall > globalOverallAccuracy 
        ? Math.min(95, 50 + ((userOverall - globalOverallAccuracy) / globalOverallAccuracy) * 50)
        : Math.max(5, 50 - ((globalOverallAccuracy - userOverall) / globalOverallAccuracy) * 50);

      return {
        globalStats,
        userVsGlobal,
        overallComparison: {
          userOverall,
          globalOverall: Math.round(globalOverallAccuracy * 100) / 100,
          isAboveAverage: userOverall > globalOverallAccuracy,
          percentile: Math.round(percentile),
        },
      };
    },
    enabled: !!userId && !!userStats,
    staleTime: 5 * 60 * 1000, // 5 min (dados globais mudam menos)
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false, // Não precisa refetch frequente
  });
}
