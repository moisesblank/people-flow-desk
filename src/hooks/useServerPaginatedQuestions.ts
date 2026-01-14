// ============================================
// 📊 HOOK: useServerPaginatedQuestions
// ESCALA 5000+: Paginação Server-Side para Questões
// Substitui loop de 45k por query paginada
// ============================================

import { useState, useCallback, useMemo, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface QuestionFilters {
  searchTerm?: string;
  macroFilter?: string;
  microFilter?: string;
  temaFilter?: string;
  subtemaFilter?: string;
  difficultyFilter?: string;
  bancaFilter?: string;
  anoFilter?: string;
  tagsFilter?: string[];  // ex: ['MODO_TREINO'] ou ['SIMULADOS']
  isActive?: boolean;
}

export interface PaginatedQuestionsResult<T> {
  data: T[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
  itemsPerPage: number;
  isLoading: boolean;
  isFetching: boolean;
  error: Error | null;
  setCurrentPage: (page: number) => void;
  goToFirstPage: () => void;
  goToLastPage: () => void;
  goToNextPage: () => void;
  goToPreviousPage: () => void;
  refetch: () => void;
}

interface UseServerPaginatedQuestionsOptions {
  itemsPerPage?: number;
  filters?: QuestionFilters;
  enabled?: boolean;
  queryKeyPrefix?: string;
}

export function useServerPaginatedQuestions<T = any>(
  options: UseServerPaginatedQuestionsOptions = {}
): PaginatedQuestionsResult<T> {
  const {
    itemsPerPage = 100,
    filters = {},
    enabled = true,
    queryKeyPrefix = 'questions',
  } = options;

  const [currentPage, setCurrentPage] = useState(1);
  const queryClient = useQueryClient();

  // Reset para página 1 quando filtros mudam
  const filterKey = JSON.stringify(filters);
  useEffect(() => {
    setCurrentPage(1);
  }, [filterKey]);

  // Query com paginação server-side
  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: [queryKeyPrefix, 'paginated', currentPage, itemsPerPage, filters],
    queryFn: async () => {
      const from = (currentPage - 1) * itemsPerPage;
      const to = from + itemsPerPage - 1;

      // Build query com filtros
      let query = supabase
        .from('quiz_questions')
        .select('*', { count: 'exact' });

      // 🔒 FILTROS DE INTEGRIDADE PERMANENTES: Excluir questões com erros de sistema
      // (Aplicado APENAS quando chamado de rotas /alunos via queryKeyPrefix)
      if (queryKeyPrefix.includes('aluno') || queryKeyPrefix.includes('treino') || queryKeyPrefix.includes('practice')) {
        query = query
          .not('question_text', 'is', null)
          .neq('question_text', '')
          .not('explanation', 'is', null)
          .neq('explanation', '')
          .not('question_type', 'is', null)
          .neq('question_type', '');
      }

      // Aplicar filtros
      if (filters.isActive !== undefined) {
        query = query.eq('is_active', filters.isActive);
      }

      if (filters.tagsFilter && filters.tagsFilter.length > 0) {
        query = query.contains('tags', filters.tagsFilter);
      }

      // PATCH: Filtros de taxonomia agora usam .eq() com labels exatos
      // Os chamadores devem converter value→label antes de passar os filtros
      if (filters.macroFilter && filters.macroFilter !== 'all' && filters.macroFilter !== 'todas') {
        query = query.eq('macro', filters.macroFilter);
      }

      if (filters.microFilter && filters.microFilter !== 'all' && filters.microFilter !== 'todas') {
        query = query.eq('micro', filters.microFilter);
      }

      if (filters.temaFilter && filters.temaFilter !== 'all' && filters.temaFilter !== 'todas') {
        query = query.eq('tema', filters.temaFilter);
      }

      if (filters.subtemaFilter && filters.subtemaFilter !== 'all' && filters.subtemaFilter !== 'todas') {
        query = query.eq('subtema', filters.subtemaFilter);
      }

      if (filters.difficultyFilter && filters.difficultyFilter !== 'all' && filters.difficultyFilter !== 'todas') {
        query = query.eq('difficulty', filters.difficultyFilter);
      }

      if (filters.bancaFilter && filters.bancaFilter !== 'all' && filters.bancaFilter !== 'todas') {
        query = query.eq('banca', filters.bancaFilter);
      }

      if (filters.anoFilter && filters.anoFilter !== 'all' && filters.anoFilter !== 'todas') {
        query = query.eq('ano', parseInt(filters.anoFilter));
      }

      if (filters.searchTerm && filters.searchTerm.trim()) {
        query = query.ilike('question_text', `%${filters.searchTerm.trim()}%`);
      }

      // Ordenar e paginar
      const { data: questions, error: queryError, count } = await query
        .order('created_at', { ascending: false })
        .range(from, to);

      if (queryError) throw queryError;

      return {
        data: questions || [],
        totalCount: count || 0,
      };
    },
    enabled,
    staleTime: 30_000, // PATCH 5K: 30s cache para evitar sobrecarga
  });

  const totalCount = data?.totalCount || 0;
  const totalPages = Math.ceil(totalCount / itemsPerPage);

  // Navigation helpers
  const goToFirstPage = useCallback(() => setCurrentPage(1), []);
  const goToLastPage = useCallback(() => setCurrentPage(totalPages), [totalPages]);
  const goToNextPage = useCallback(() => {
    setCurrentPage(prev => Math.min(prev + 1, totalPages));
  }, [totalPages]);
  const goToPreviousPage = useCallback(() => {
    setCurrentPage(prev => Math.max(prev - 1, 1));
  }, []);

  const safeSetCurrentPage = useCallback((page: number) => {
    const safePage = Math.max(1, Math.min(page, totalPages || 1));
    setCurrentPage(safePage);
  }, [totalPages]);

  return {
    data: (data?.data || []) as T[],
    totalCount,
    currentPage,
    totalPages,
    itemsPerPage,
    isLoading,
    isFetching,
    error: error as Error | null,
    setCurrentPage: safeSetCurrentPage,
    goToFirstPage,
    goToLastPage,
    goToNextPage,
    goToPreviousPage,
    refetch,
  };
}

// ============================================
// COMPONENTE: QuestionsPagination UI
// ============================================
export { QuestionsPagination } from '@/components/shared/QuestionsPagination';
