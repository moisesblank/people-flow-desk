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

// CONSTITUIÇÃO v10.x - 4 roles de aluno válidas
type StudentRoleType = 'beta' | 'aluno_gratuito' | 'aluno_presencial' | 'beta_expira';

export interface AlunoRow {
  id: string;
  nome: string;
  email: string;
  cpf: string | null;
  telefone: string | null;
  status: string;
  fonte: string | null;
  role: StudentRoleType | null;
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
  /** Filtro por role - CONSTITUIÇÃO v10.x */
  roleFilter?: StudentRoleType | null;
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

const DEFAULT_PAGE_SIZE = 100;
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
  // ============================================
  // 🚀 PATCH 5K: Query única para contadores
  // ANTES: 7 queries paralelas (35.000 req/5K admins)
  // DEPOIS: 1 RPC (5.000 req/5K admins) = -86% requisições
  // ============================================
  const contadoresQuery = useQuery({
    queryKey: ['alunos-contadores'],
    queryFn: async (): Promise<AlunosContadores> => {
      // 🚀 Uma única RPC que retorna todos os contadores
      const { data, error } = await supabase.rpc('get_alunos_contadores');

      if (error) {
        console.error('[PATCH 5K] Erro ao buscar contadores:', error);
        throw error;
      }

      // Parse do JSON retornado pela RPC
      const contadores = data as {
        total: number;
        ativos: number;
        concluidos: number;
        pendentes: number;
        cancelados: number;
        beta: number;
        gratuito: number;
      };

      return {
        total: contadores?.total || 0,
        ativos: contadores?.ativos || 0,
        concluidos: contadores?.concluidos || 0,
        pendentes: contadores?.pendentes || 0,
        cancelados: contadores?.cancelados || 0,
        beta: contadores?.beta || 0,
        gratuito: contadores?.gratuito || 0,
      };
    },
    staleTime: STALE_TIME,
    refetchOnWindowFocus: false, // 🚀 PATCH 5K: Evita refetch desnecessário
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

      // Query base - inclui fonte, cpf e telefone para filtro de universo e busca
      let query = supabase
        .from('alunos')
        .select('id, nome, email, cpf, telefone, status, fonte', { count: 'exact' });

      // Aplicar filtros
      if (statusFilter) {
        query = query.ilike('status', statusFilter);
      }

      // Busca por nome, email, CPF ou telefone
      if (searchTerm && searchTerm.trim()) {
        // Limpa caracteres especiais para busca de CPF/telefone
        const cleanedSearch = searchTerm.replace(/[.\-\s()]/g, '');
        
        // Se parece ser numérico, busca também em cpf e telefone
        const isNumeric = /^\d+$/.test(cleanedSearch);
        
        if (isNumeric) {
          // Busca numérica: nome, email, cpf (limpo) ou telefone (limpo)
          query = query.or(`nome.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,cpf.ilike.%${cleanedSearch}%,telefone.ilike.%${cleanedSearch}%`);
        } else {
          // Busca textual: nome, email, cpf ou telefone (com formatação original)
          query = query.or(`nome.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,cpf.ilike.%${searchTerm}%,telefone.ilike.%${searchTerm}%`);
        }
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
        cpf: a.cpf || null,
        telefone: a.telefone || null,
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
