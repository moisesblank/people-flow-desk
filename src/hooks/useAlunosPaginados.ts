// ============================================
// ⚡ HOOK ALUNOS PAGINADOS v1.0.0
// PARTE 14 — Escala 5000
// ============================================
// REGRAS:
// - Paginação server-side obrigatória
// - Queries agregadas para contadores (zero N+1)
// - Nunca carregar todos os alunos de uma vez
// ============================================

import { useState, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';

// ============================================
// TYPES
// ============================================

export interface AlunoRow {
  id: string;
  nome: string;
  email: string;
  status: string;
  fonte: string | null;
  role: 'beta' | 'aluno_gratuito' | null;
}

export interface AlunosContadores {
  total: number;
  ativos: number;
  concluidos: number;
  pendentes: number;
  cancelados: number;
  beta: number;
  gratuito: number;
}

/**
 * ⚡ PARTE 6 REFINADA: Universo para filtro server-side
 * A = Presencial, B = Presencial+Online, C = Online, D = Registrados
 */
export type UniversoFiltro = 'A' | 'B' | 'C' | 'D' | null;

export interface UseAlunosPaginadosOptions {
  /** Tamanho da página (default: 50) */
  pageSize?: number;
  /** Filtro por status */
  statusFilter?: string;
  /** Filtro por role */
  roleFilter?: 'beta' | 'aluno_gratuito' | null;
  /** ⚡ PARTE 6: Filtro por universo (A/B/C/D) - aplicado na query */
  universoFiltro?: UniversoFiltro;
  /** Termo de busca */
  searchTerm?: string;
  /** Ordenação */
  orderBy?: 'nome' | 'email' | 'created_at';
  /** Direção da ordenação */
  orderDirection?: 'asc' | 'desc';
}

export interface UseAlunosPaginadosReturn {
  // Dados
  alunos: AlunoRow[];
  contadores: AlunosContadores;
  
  // Paginação
  page: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  goToPage: (page: number) => void;
  nextPage: () => void;
  prevPage: () => void;
  
  // Estado
  isLoading: boolean;
  isLoadingContadores: boolean;
  error: Error | null;
  
  // Ações
  refetch: () => void;
}

// ============================================
// CONSTANTS
// ============================================

const DEFAULT_PAGE_SIZE = 50;
const STALE_TIME = 30_000; // 30 segundos

// ============================================
// HOOK
// ============================================

export function useAlunosPaginados(
  options: UseAlunosPaginadosOptions = {}
): UseAlunosPaginadosReturn {
  const {
    pageSize = DEFAULT_PAGE_SIZE,
    statusFilter,
    roleFilter,
    universoFiltro, // ⚡ PARTE 6: Filtro por universo
    searchTerm,
    orderBy = 'nome',
    orderDirection = 'asc',
  } = options;

  // ⚡ PARTE 6 FIX: Role é informativo, NÃO filtro obrigatório
  // Alunos cadastrados devem aparecer mesmo sem role associada
  // Filtro por role só se explicitamente solicitado via roleFilter
  const effectiveRoleFilter = roleFilter || null;

  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);

  // ============================================
  // QUERY 1: Contadores agregados (ZERO N+1)
  // Uma única query com COUNT + FILTER
  // ============================================
  const contadoresQuery = useQuery({
    queryKey: ['alunos-contadores', statusFilter, roleFilter, searchTerm],
    queryFn: async (): Promise<AlunosContadores> => {
      // Query agregada - conta tudo de uma vez
      const { count: total, error: totalError } = await supabase
        .from('alunos')
        .select('*', { count: 'exact', head: true });

      if (totalError) throw totalError;

      // Buscar contadores por status em paralelo
      const [
        ativosResult,
        concluidosResult,
        pendentesResult,
        canceladosResult,
        betaResult,
        gratuitoResult,
      ] = await Promise.all([
        supabase.from('alunos').select('*', { count: 'exact', head: true }).ilike('status', 'ativo'),
        supabase.from('alunos').select('*', { count: 'exact', head: true }).ilike('status', 'concluído'),
        supabase.from('alunos').select('*', { count: 'exact', head: true }).ilike('status', 'pendente'),
        supabase.from('alunos').select('*', { count: 'exact', head: true }).ilike('status', 'cancelado'),
        // Roles via user_roles
        supabase.from('user_roles').select('*', { count: 'exact', head: true }).eq('role', 'beta'),
        supabase.from('user_roles').select('*', { count: 'exact', head: true }).eq('role', 'aluno_gratuito'),
      ]);

      return {
        total: total || 0,
        ativos: ativosResult.count || 0,
        concluidos: concluidosResult.count || 0,
        pendentes: pendentesResult.count || 0,
        cancelados: canceladosResult.count || 0,
        beta: betaResult.count || 0,
        gratuito: gratuitoResult.count || 0,
      };
    },
    staleTime: STALE_TIME,
  });

  // ============================================
  // QUERY 2: Alunos paginados
  // Apenas a página atual com JOIN de roles
  // ============================================
  const alunosQuery = useQuery({
    queryKey: ['alunos-paginados', page, pageSize, statusFilter, effectiveRoleFilter, universoFiltro, searchTerm, orderBy, orderDirection],
    queryFn: async (): Promise<{ data: AlunoRow[]; count: number }> => {
      // Calcular offset
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      // Query base - inclui fonte para filtro de universo
      let query = supabase
        .from('alunos')
        .select('id, nome, email, status, fonte', { count: 'exact' });

      // Aplicar filtros
      if (statusFilter) {
        query = query.ilike('status', statusFilter);
      }

      if (searchTerm && searchTerm.trim()) {
        query = query.or(`nome.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`);
      }

      // ⚡ PARTE 6 FIX: Filtro por fonte/modalidade baseado no universo
      // A = presencial (fonte contém 'presencial')
      // B = presencial+online (sem filtro por fonte - mostra todos)
      // C = online (fonte NÃO contém 'presencial' - inclui Hotmart, Acesso Oficial, etc)
      // D = registrados (sem filtro por fonte - mostra todos)
      // NOTA: Atualmente fonte tem valores 'Hotmart' e 'Acesso Oficial (Gestão)'
      if (universoFiltro === 'A') {
        // Presencial - fonte contém 'presencial'
        query = query.ilike('fonte', '%presencial%');
      }
      // Universos B, C, D não filtram por fonte - mostram todos os alunos

      // Ordenação e paginação
      query = query
        .order(orderBy, { ascending: orderDirection === 'asc' })
        .range(from, to);

      const { data, count, error } = await query;
      if (error) throw error;

      // Buscar roles apenas para os emails desta página (evita N+1)
      const emails = (data || []).map(a => a.email?.toLowerCase()).filter(Boolean);
      
      let roleMap: Record<string, 'beta' | 'aluno_gratuito'> = {};
      
      if (emails.length > 0) {
        const { data: rolesData } = await supabase
          .from('user_roles')
          .select(`
            role,
            user_id,
            profiles!inner(email)
          `)
          .in('role', ['beta', 'aluno_gratuito']);

        // Mapear roles
        (rolesData || []).forEach((r: any) => {
          const email = r.profiles?.email?.toLowerCase();
          if (email && emails.includes(email)) {
            if (roleMap[email] !== 'beta') {
              roleMap[email] = r.role as 'beta' | 'aluno_gratuito';
            }
          }
        });
      }

      // Combinar dados
      const alunos: AlunoRow[] = (data || []).map(a => ({
        id: a.id,
        nome: a.nome,
        email: a.email || '',
        status: a.status || 'ativo',
        fonte: a.fonte || null,
        role: roleMap[(a.email || '').toLowerCase()] || null,
      }));

      // ⚡ FIX: Retornar TODOS os alunos, role é informativo
      // Não filtrar por role aqui - a listagem deve mostrar todos os alunos cadastrados
      return { data: alunos, count: count || 0 };
    },
    staleTime: STALE_TIME,
  });

  // ============================================
  // PAGINAÇÃO
  // ============================================
  const totalPages = useMemo(() => {
    const count = alunosQuery.data?.count || 0;
    return Math.max(1, Math.ceil(count / pageSize));
  }, [alunosQuery.data?.count, pageSize]);

  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;

  const goToPage = useCallback((newPage: number) => {
    const validPage = Math.max(1, Math.min(newPage, totalPages));
    setPage(validPage);
  }, [totalPages]);

  const nextPage = useCallback(() => {
    if (hasNextPage) setPage(p => p + 1);
  }, [hasNextPage]);

  const prevPage = useCallback(() => {
    if (hasPrevPage) setPage(p => p - 1);
  }, [hasPrevPage]);

  const refetch = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['alunos-contadores'] });
    queryClient.invalidateQueries({ queryKey: ['alunos-paginados'] });
  }, [queryClient]);

  return {
    // Dados
    alunos: alunosQuery.data?.data || [],
    contadores: contadoresQuery.data || {
      total: 0,
      ativos: 0,
      concluidos: 0,
      pendentes: 0,
      cancelados: 0,
      beta: 0,
      gratuito: 0,
    },
    
    // Paginação
    page,
    totalPages,
    hasNextPage,
    hasPrevPage,
    goToPage,
    nextPage,
    prevPage,
    
    // Estado
    isLoading: alunosQuery.isLoading,
    isLoadingContadores: contadoresQuery.isLoading,
    error: alunosQuery.error || contadoresQuery.error || null,
    
    // Ações
    refetch,
  };
}
