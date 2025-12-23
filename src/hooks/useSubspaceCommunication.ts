// ============================================
// 🌌 TESE 3: PROTOCOLO DE COMUNICAÇÃO SUBESPACIAL
// Rede = Inimiga | Cache = Aliado | Mutação Otimista = Lei
// ============================================

import { useCallback, useMemo, useRef, useEffect } from 'react';
import { 
  useQuery, 
  useMutation, 
  useQueryClient, 
  QueryClient,
  UseQueryOptions,
  UseMutationOptions 
} from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { CACHE_PROFILES, persistentCache, detectConnectionSpeed } from '@/lib/performance/cacheConfig';

// ============================================
// TESE 3.1: ESTRATÉGIA DE CACHING (MEMÓRIA EIDÉTICA)
// ============================================

/**
 * Perfis de cache com persistência localStorage
 * staleTime: Infinity = dados raramente mudam (cursos, estrutura)
 */
export const SUBSPACE_CACHE_PROFILES = {
  // 🔒 IMUTÁVEL - Nunca expira (cursos, estrutura, config)
  immutable: {
    staleTime: Infinity,
    gcTime: Infinity,
    persistToLocalStorage: true,
    persistTTL: 7 * 24 * 60 * 60 * 1000, // 7 dias
  },
  
  // 📚 SEMI-ESTÁTICO - Muda raramente (lista de aulas, categorias)
  semiStatic: {
    staleTime: 30 * 60 * 1000, // 30 minutos
    gcTime: 2 * 60 * 60 * 1000, // 2 horas
    persistToLocalStorage: true,
    persistTTL: 24 * 60 * 60 * 1000, // 24 horas
  },
  
  // 👤 USUÁRIO - Dados do usuário logado
  user: {
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 30 * 60 * 1000, // 30 minutos
    persistToLocalStorage: true,
    persistTTL: 60 * 60 * 1000, // 1 hora
  },
  
  // 📊 DASHBOARD - Métricas e stats
  dashboard: {
    staleTime: 2 * 60 * 1000, // 2 minutos
    gcTime: 15 * 60 * 1000, // 15 minutos
    persistToLocalStorage: false,
    persistTTL: 0,
  },
  
  // ⚡ REALTIME - Sem cache
  realtime: {
    staleTime: 0,
    gcTime: 5 * 60 * 1000,
    persistToLocalStorage: false,
    persistTTL: 0,
  },
} as const;

type CacheProfile = keyof typeof SUBSPACE_CACHE_PROFILES;

/**
 * Hook de Query com Persistência LocalStorage
 * TESE 3.1: Cache agressivo + persistência = dados instantâneos
 */
export function useSubspaceQuery<T>(
  queryKey: string[],
  queryFn: () => Promise<T>,
  options: {
    profile?: CacheProfile;
    persistKey?: string;
    enabled?: boolean;
    onSuccess?: (data: T) => void;

    // Overrides (para wrappers v3500 manterem semântica)
    staleTime?: number;
    gcTime?: number;
    persistToLocalStorage?: boolean;
    persistTTL?: number;
    refetchInterval?: number;
    refetchOnWindowFocus?: boolean;
    refetchOnMount?: boolean | 'always';
    retry?: number;
  } = {}
) {
  const {
    profile = 'dashboard',
    persistKey,
    enabled = true,
    onSuccess,
    staleTime,
    gcTime,
    persistToLocalStorage,
    persistTTL,
    refetchInterval,
    refetchOnWindowFocus = false,
    refetchOnMount,
    retry = 1,
  } = options;
  
  const baseConfig = SUBSPACE_CACHE_PROFILES[profile];
  const config = {
    ...baseConfig,
    staleTime: staleTime ?? baseConfig.staleTime,
    gcTime: gcTime ?? baseConfig.gcTime,
    persistToLocalStorage: persistToLocalStorage ?? baseConfig.persistToLocalStorage,
    persistTTL: persistTTL ?? baseConfig.persistTTL,
  };

  const cacheKey = persistKey || queryKey.join('_');
  
  // Carregar do localStorage se disponível (dados instantâneos!)
  const initialData = useMemo(() => {
    if (!config.persistToLocalStorage) return undefined;
    return persistentCache.get<T>(cacheKey);
  }, [cacheKey, config.persistToLocalStorage]);
  
  const query = useQuery({
    queryKey,
    queryFn: async () => {
      const data = await queryFn();
      
      // Persistir no localStorage para próxima visita
      if (config.persistToLocalStorage && data) {
        persistentCache.set(cacheKey, data, config.persistTTL);
      }
      
      onSuccess?.(data);
      return data;
    },
    staleTime: config.staleTime,
    gcTime: config.gcTime,
    networkMode: 'offlineFirst',
    enabled,
    refetchInterval,
    refetchOnWindowFocus,
    ...(refetchOnMount !== undefined ? { refetchOnMount } : {}),
    retry,
    // 🔥 TESE 3.1: Dados do localStorage como placeholder instantâneo
    ...(initialData !== null && initialData !== undefined ? { initialData } : {}),
  });
  
  return {
    ...query,
    // Flag indicando se veio do cache local
    isFromCache: !!initialData && query.isFetching,
  };
}

// ============================================
// TESE 3.1: MUTAÇÃO OTIMISTA (AÇÃO INSTANTÂNEA)
// ============================================

interface OptimisticMutationOptions<TData, TVariables, TContext> {
  mutationFn: (variables: TVariables) => Promise<TData>;
  // Chave da query a ser atualizada otimisticamente
  queryKey: string[];
  // Função para atualizar o cache otimisticamente
  optimisticUpdate: (oldData: TData | undefined, variables: TVariables) => TData;
  // Mensagem de sucesso (opcional)
  successMessage?: string;
  // Mensagem de erro (opcional)
  errorMessage?: string;
  // Callbacks
  onSuccess?: (data: TData, variables: TVariables) => void;
  onError?: (error: Error, variables: TVariables, context: TContext | undefined) => void;
}

/**
 * Hook de Mutação Otimista
 * TESE 3.1: UI atualiza INSTANTANEAMENTE, reverte apenas em erro
 */
export function useOptimisticMutation<TData, TVariables, TContext = { previousData: TData | undefined }>(
  options: OptimisticMutationOptions<TData, TVariables, TContext>
) {
  const queryClient = useQueryClient();
  const { 
    mutationFn, 
    queryKey, 
    optimisticUpdate,
    successMessage,
    errorMessage = 'Erro ao salvar. Tente novamente.',
    onSuccess,
    onError,
  } = options;
  
  return useMutation({
    mutationFn,
    
    // 🔥 ANTES da mutação: Atualizar UI instantaneamente
    onMutate: async (variables: TVariables) => {
      // Cancelar queries em andamento para evitar sobrescrita
      await queryClient.cancelQueries({ queryKey });
      
      // Snapshot do estado anterior (para rollback)
      const previousData = queryClient.getQueryData<TData>(queryKey);
      
      // 🚀 ATUALIZAÇÃO OTIMISTA - UI muda AGORA
      queryClient.setQueryData<TData>(queryKey, (old) => 
        optimisticUpdate(old, variables)
      );
      
      // Retornar contexto para possível rollback
      return { previousData } as TContext;
    },
    
    // ❌ EM ERRO: Rollback para estado anterior
    onError: (error: Error, variables: TVariables, context: TContext | undefined) => {
      // Reverter para o estado anterior
      if (context && (context as any).previousData !== undefined) {
        queryClient.setQueryData(queryKey, (context as any).previousData);
      }
      
      toast.error(errorMessage);
      onError?.(error, variables, context);
    },
    
    // ✅ EM SUCESSO: Sincronizar com servidor
    onSuccess: (data: TData, variables: TVariables) => {
      if (successMessage) {
        toast.success(successMessage);
      }
      onSuccess?.(data, variables);
    },
    
    // 🔄 SEMPRE: Revalidar dados do servidor
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });
}

// ============================================
// TESE 3.2: SELEÇÃO DE COLUNAS CIRÚRGICA
// ============================================

/**
 * Colunas pré-definidas para queries cirúrgicas
 * TESE 3.2: NUNCA select('*'), SEMPRE campos específicos
 */
export const SURGICAL_COLUMNS = {
  // Alunos - apenas campos necessários para lista
  alunosList: 'id, nome, email, status, created_at, foto_url',
  
  // Alunos - detalhes completos
  alunoDetail: 'id, nome, email, cpf, telefone, status, data_matricula, valor_pago, fonte, observacoes, cidade, estado, foto_url, created_at, updated_at',
  
  // Cursos - lista
  cursosList: 'id, title, slug, thumbnail_url, is_published',
  
  // Aulas - lista
  aulasList: 'id, title, duration, order_index, module_id, is_published',
  
  // Entradas financeiras
  entradasList: 'id, descricao, valor, data, categoria, tipo, status',
  
  // Contas a pagar
  contasPagarList: 'id, descricao, valor, data_vencimento, status, categoria',
  
  // Tarefas do calendário
  tarefasList: 'id, title, task_date, task_time, priority, is_completed, category',
  
  // Afiliados
  afiliadosList: 'id, nome, email, status, total_vendas, total_comissao',
  
  // Profiles
  profileBasic: 'id, full_name, avatar_url, role',
} as const;

/**
 * Helper para criar query segura
 * TESE 3.2: Garante seleção explícita de colunas
 */
export function surgicalSelect(columns: string) {
  if (columns === '*') {
    console.warn('[TESE 3.2] ⚠️ select("*") detectado! Use colunas específicas.');
  }
  return columns;
}

// ============================================
// HOOKS DE CONVENIÊNCIA
// ============================================

/**
 * Hook para invalidação inteligente de cache
 */
export function useSubspaceInvalidation() {
  const queryClient = useQueryClient();
  
  const invalidate = useCallback((keys: string[]) => {
    keys.forEach(key => {
      queryClient.invalidateQueries({ queryKey: [key] });
      // Também remove do localStorage
      persistentCache.remove(key);
    });
  }, [queryClient]);
  
  const invalidatePattern = useCallback((pattern: string) => {
    queryClient.invalidateQueries({ 
      predicate: (query) => 
        query.queryKey.some(k => 
          typeof k === 'string' && k.includes(pattern)
        )
    });
  }, [queryClient]);
  
  const clearAll = useCallback(() => {
    queryClient.clear();
    persistentCache.clear();
    console.log('[TESE 3] 🧹 Cache completo limpo');
  }, [queryClient]);
  
  return { invalidate, invalidatePattern, clearAll };
}

/**
 * Hook para prefetch de dados
 */
export function useSubspacePrefetch() {
  const queryClient = useQueryClient();
  const speed = detectConnectionSpeed();
  
  const prefetch = useCallback(async <T>(
    queryKey: string[],
    queryFn: () => Promise<T>,
    profile: CacheProfile = 'semiStatic'
  ) => {
    // Em conexão lenta, não prefetch
    if (speed === 'slow') return;
    
    const config = SUBSPACE_CACHE_PROFILES[profile];
    
    await queryClient.prefetchQuery({
      queryKey,
      queryFn,
      staleTime: config.staleTime,
    });
  }, [queryClient, speed]);
  
  const prefetchOnHover = useCallback(<T>(
    queryKey: string[],
    queryFn: () => Promise<T>,
    profile: CacheProfile = 'semiStatic'
  ) => {
    return {
      onMouseEnter: () => {
        // Prefetch com requestIdleCallback para não bloquear
        if ('requestIdleCallback' in window) {
          requestIdleCallback(() => prefetch(queryKey, queryFn, profile));
        } else {
          setTimeout(() => prefetch(queryKey, queryFn, profile), 100);
        }
      }
    };
  }, [prefetch]);
  
  return { prefetch, prefetchOnHover };
}

/**
 * Hook para estado de conexão
 */
export function useConnectionState() {
  const speed = detectConnectionSpeed();
  
  return {
    speed,
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    isSlow: speed === 'slow',
    shouldPrefetch: speed !== 'slow',
    shouldPersist: speed === 'slow', // Em conexão lenta, persiste mais
  };
}

// ============================================
// EXPORTS CONSOLIDADOS
// ============================================

export const SubspaceCommunication = {
  profiles: SUBSPACE_CACHE_PROFILES,
  columns: SURGICAL_COLUMNS,
  
  // Funções utilitárias
  surgicalSelect,
  detectSpeed: detectConnectionSpeed,
};

console.log('[TESE 3] 🌌 Protocolo de Comunicação Subespacial ativado');
