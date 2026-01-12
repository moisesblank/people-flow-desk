// ============================================
// HOOK: useErrorNotebook - Caderno de Erros
// SANTUÁRIO v9.0 - Lei I: Performance Máxima
// ============================================

import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useSubspaceQuery, useOptimisticMutation, SUBSPACE_CACHE_PROFILES } from './useSubspaceCommunication';
import { toast } from 'sonner';

// Tipos - Atualizados para usar quiz_questions (P0 FIX 2026-01-12)
export interface ErrorNotebookEntry {
  user_id: string;
  question_id: string;
  error_count: number;
  last_error_at: string;
  mastered: boolean;
  mastered_at: string | null;
  // Dados da questão (join com quiz_questions)
  question?: {
    id: string;
    question_text: string;
    options: any;
    correct_answer: string;
    explanation: string | null;
    difficulty: string | null;
    macro: string | null;
    micro: string | null;
  };
}

export interface ErrorNotebookStats {
  totalErrors: number;
  masteredCount: number;
  pendingCount: number;
  masteryRate: number;
  byMacro: {
    macro: string;
    count: number;
    mastered: number;
  }[];
  recentErrors: ErrorNotebookEntry[];
}

export interface UseErrorNotebookOptions {
  onlyPending?: boolean;
  areaId?: string;
  limit?: number;
}

/**
 * Hook para gerenciar o Caderno de Erros do aluno
 * - Lista questões erradas
 * - Marca como dominada (mastered)
 * - Estatísticas por área
 * - Cache otimizado com TanStack Query
 */
export function useErrorNotebook(options: UseErrorNotebookOptions = {}) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { onlyPending = false, areaId, limit = 50 } = options;

  // 🌌 Query migrada para useSubspaceQuery - Cache localStorage
  const {
    data: entries,
    isLoading,
    error,
    refetch
  } = useSubspaceQuery<ErrorNotebookEntry[]>(
    ['error-notebook', user?.id || 'anon', String(onlyPending), areaId || 'all', String(limit)],
    async () => {
      if (!user?.id) return [];

      let query = supabase
        .from('error_notebook')
        .select(`
          *,
          question:quiz_questions(
            id,
            question_text,
            options,
            correct_answer,
            explanation,
            difficulty,
            macro,
            micro
          )
        `)
        .eq('user_id', user.id)
        .order('last_error_at', { ascending: false })
        .limit(limit);

      // Filtrar apenas pendentes (não dominadas)
      if (onlyPending) {
        query = query.eq('mastered', false);
      }

      // Filtrar por área (via subquery)
      // Nota: filtragem por área será feita client-side para performance

      const { data, error } = await query;

      if (error) throw error;

      // Filtrar por macro se especificado (P0 FIX: usa macro em vez de area_id)
      let filteredData = data as ErrorNotebookEntry[];
      if (areaId && filteredData) {
        filteredData = filteredData.filter(
          entry => entry.question?.macro === areaId
        );
      }

      return filteredData;
    },
    {
      profile: 'user', // 5min stale, persistente
      persistKey: `error_notebook_${user?.id}`,
      enabled: !!user?.id,
    }
  );

  // Query: estatísticas do caderno de erros - MIGRADO PARA useSubspaceQuery
  const { data: stats } = useSubspaceQuery<ErrorNotebookStats>(
    ['error-notebook-stats', user?.id || 'anon'],
    async (): Promise<ErrorNotebookStats> => {
      if (!user?.id) {
        return {
          totalErrors: 0,
          masteredCount: 0,
          pendingCount: 0,
          masteryRate: 0,
          byMacro: [],
          recentErrors: []
        };
      }

      const { data, error } = await supabase
        .from('error_notebook')
        .select(`
          *,
          question:quiz_questions(
            id, question_text, macro, micro
          )
        `)
        .eq('user_id', user.id);

      if (error) throw error;

      const entries = (data || []) as ErrorNotebookEntry[];
      const totalErrors = entries.length;
      const masteredCount = entries.filter(e => e.mastered).length;
      const pendingCount = totalErrors - masteredCount;

      // Agrupar por macro (P0 FIX: quiz_questions usa macro, não area_id)
      const macroMap = new Map<string, { count: number; mastered: number }>();
      entries.forEach(entry => {
        const macro = entry.question?.macro || 'Sem classificação';
        
        if (!macroMap.has(macro)) {
          macroMap.set(macro, { count: 0, mastered: 0 });
        }
        
        const macroData = macroMap.get(macro)!;
        macroData.count++;
        if (entry.mastered) macroData.mastered++;
      });

      const byMacro = Array.from(macroMap.entries()).map(([macro, data]) => ({
        macro,
        count: data.count,
        mastered: data.mastered
      }));

      // Últimos 5 erros
      const recentErrors = entries
        .filter(e => !e.mastered)
        .sort((a, b) => new Date(b.last_error_at).getTime() - new Date(a.last_error_at).getTime())
        .slice(0, 5);

      return {
        totalErrors,
        masteredCount,
        pendingCount,
        masteryRate: totalErrors > 0 ? (masteredCount / totalErrors) * 100 : 0,
        byMacro,
        recentErrors
      };
    },
    {
      profile: 'user',
      persistKey: `error_notebook_stats_${user?.id}`,
      enabled: !!user?.id,
      staleTime: 1000 * 60 * 2,
    }
  );

  // Mutation: marcar questão como dominada - MIGRADO PARA useOptimisticMutation
  const markAsMastered = useOptimisticMutation<ErrorNotebookEntry[], string, string>({
    queryKey: ['error-notebook', user?.id || ''],
    mutationFn: async (questionId: string) => {
      if (!user?.id) throw new Error('Usuário não autenticado');

      const { error } = await supabase
        .from('error_notebook')
        .update({
          mastered: true,
          mastered_at: new Date().toISOString()
        })
        .eq('user_id', user.id)
        .eq('question_id', questionId);

      if (error) throw error;
      return questionId;
    },
    optimisticUpdate: (old, questionId) => {
      return (old || []).map(entry =>
        entry.question_id === questionId 
          ? { ...entry, mastered: true, mastered_at: new Date().toISOString() }
          : entry
      );
    },
    successMessage: 'Questão marcada como dominada! 🎯',
    errorMessage: 'Erro ao marcar questão como dominada',
  });

  // Mutation: resetar status de dominada - MIGRADO PARA useOptimisticMutation
  const resetMastered = useOptimisticMutation<ErrorNotebookEntry[], string, string>({
    queryKey: ['error-notebook', user?.id || ''],
    mutationFn: async (questionId: string) => {
      if (!user?.id) throw new Error('Usuário não autenticado');

      const { error } = await supabase
        .from('error_notebook')
        .update({
          mastered: false,
          mastered_at: null
        })
        .eq('user_id', user.id)
        .eq('question_id', questionId);

      if (error) throw error;
      return questionId;
    },
    optimisticUpdate: (old, questionId) => {
      return (old || []).map(entry =>
        entry.question_id === questionId 
          ? { ...entry, mastered: false, mastered_at: null }
          : entry
      );
    },
    successMessage: 'Questão voltou para revisão',
    errorMessage: 'Erro ao resetar questão',
  });

  // Helpers
  const getPendingCount = () => stats?.pendingCount || 0;
  const getMasteryRate = () => stats?.masteryRate || 0;
  const getMacroWithMostErrors = () => {
    if (!stats?.byMacro.length) return null;
    return stats.byMacro.reduce((prev, curr) => 
      (curr.count - curr.mastered) > (prev.count - prev.mastered) ? curr : prev
    );
  };

  return {
    // Dados
    entries: entries || [],
    stats,
    
    // Estados
    isLoading,
    error,
    
    // Mutations
    markAsMastered: markAsMastered.mutate,
    resetMastered: resetMastered.mutate,
    isMarking: markAsMastered.isPending,
    isResetting: resetMastered.isPending,
    
    // Helpers
    getPendingCount,
    getMasteryRate,
    getMacroWithMostErrors,
    refetch,
    
    // Computed
    hasPendingErrors: (stats?.pendingCount || 0) > 0,
    isEmpty: (entries?.length || 0) === 0,
  };
}

/**
 * Hook simplificado para apenas contar erros pendentes
 * Útil para badges e indicadores
 */
export function useErrorNotebookCount() {
  const { user } = useAuth();

  return useSubspaceQuery<number>(
    ['error-notebook-count', user?.id || 'anon'],
    async () => {
      if (!user?.id) return 0;

      const { count, error } = await supabase
        .from('error_notebook')
        .select('question_id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('mastered', false);

      if (error) throw error;
      return count || 0;
    },
    {
      profile: 'dashboard',
      persistKey: `error_notebook_count_${user?.id}`,
      enabled: !!user?.id,
      staleTime: 60_000,
      persistToLocalStorage: true,
      persistTTL: 10 * 60_000,
    }
  );
}
