// ============================================
// useAsyncData - Hook para gerenciamento de dados assíncronos
// ============================================
// 
// CONSTITUIÇÃO SYNAPSE Ω v10.x
// Lei I: Performance | Lei VI: Estabilidade
//
// Este hook centraliza o padrão repetitivo de:
// - Estado isLoading
// - Função fetchData com try/catch
// - Tratamento de erros
// - Revalidação automática
//
// ANTES: 12+ instâncias duplicadas em páginas
// DEPOIS: Um hook reutilizável
//
// @module hooks/useAsyncData
// ============================================

import { useState, useCallback, useEffect, useRef } from 'react';
import { toast } from 'sonner';

export interface UseAsyncDataOptions<T> {
  /** Função que busca os dados */
  fetcher: () => Promise<T>;
  
  /** Executar imediatamente ao montar (default: true) */
  immediate?: boolean;
  
  /** Dependências para re-executar (como useEffect deps) */
  deps?: any[];
  
  /** Intervalo de revalidação automática em ms (0 = desabilitado) */
  revalidateInterval?: number;
  
  /** Mensagem de erro customizada */
  errorMessage?: string;
  
  /** Callback de sucesso */
  onSuccess?: (data: T) => void;
  
  /** Callback de erro */
  onError?: (error: Error) => void;
  
  /** Mostrar toast de erro automaticamente (default: true) */
  showErrorToast?: boolean;
  
  /** Valor inicial dos dados */
  initialData?: T;
}

export interface UseAsyncDataReturn<T> {
  /** Dados retornados pelo fetcher */
  data: T | undefined;
  
  /** Indica se está carregando */
  isLoading: boolean;
  
  /** Indica se está revalidando (já tem dados, buscando atualização) */
  isRefreshing: boolean;
  
  /** Erro ocorrido, se houver */
  error: Error | null;
  
  /** Função para recarregar os dados manualmente */
  refetch: () => Promise<void>;
  
  /** Função para atualizar os dados localmente (otimistic update) */
  mutate: (newData: T | ((prev: T | undefined) => T)) => void;
  
  /** Última vez que os dados foram atualizados */
  lastUpdated: Date | null;
}

/**
 * Hook para gerenciamento de dados assíncronos com loading state
 * 
 * @example
 * // Uso básico
 * const { data: users, isLoading, refetch } = useAsyncData({
 *   fetcher: async () => {
 *     const { data } = await supabase.from('users').select('*');
 *     return data || [];
 *   }
 * });
 * 
 * @example
 * // Com revalidação automática
 * const { data, isRefreshing } = useAsyncData({
 *   fetcher: fetchDashboardStats,
 *   revalidateInterval: 30000, // 30 segundos
 * });
 * 
 * @example
 * // Com dependências
 * const { data: items } = useAsyncData({
 *   fetcher: () => fetchItemsByCategory(categoryId),
 *   deps: [categoryId],
 * });
 */
export function useAsyncData<T>({
  fetcher,
  immediate = true,
  deps = [],
  revalidateInterval = 0,
  errorMessage = 'Erro ao carregar dados',
  onSuccess,
  onError,
  showErrorToast = true,
  initialData,
}: UseAsyncDataOptions<T>): UseAsyncDataReturn<T> {
  const [data, setData] = useState<T | undefined>(initialData);
  const [isLoading, setIsLoading] = useState(immediate);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  
  const mountedRef = useRef(true);
  const fetchCountRef = useRef(0);

  const execute = useCallback(async (isRevalidation = false) => {
    const currentFetchId = ++fetchCountRef.current;
    
    try {
      if (isRevalidation) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setError(null);
      
      const result = await fetcher();
      
      // Evita race conditions - só atualiza se ainda for a requisição mais recente
      if (!mountedRef.current || currentFetchId !== fetchCountRef.current) {
        return;
      }
      
      setData(result);
      setLastUpdated(new Date());
      onSuccess?.(result);
      
    } catch (err) {
      if (!mountedRef.current || currentFetchId !== fetchCountRef.current) {
        return;
      }
      
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      
      if (showErrorToast) {
        toast.error(errorMessage);
      }
      
      onError?.(error);
      console.error('[useAsyncData]', errorMessage, error);
      
    } finally {
      if (mountedRef.current && currentFetchId === fetchCountRef.current) {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    }
  }, [fetcher, errorMessage, showErrorToast, onSuccess, onError]);

  const refetch = useCallback(async () => {
    await execute(data !== undefined);
  }, [execute, data]);

  const mutate = useCallback((newData: T | ((prev: T | undefined) => T)) => {
    setData(prev => typeof newData === 'function' 
      ? (newData as (prev: T | undefined) => T)(prev) 
      : newData
    );
    setLastUpdated(new Date());
  }, []);

  // Execução inicial e quando deps mudam
  useEffect(() => {
    if (immediate) {
      execute(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [immediate, ...deps]);

  // Revalidação automática
  useEffect(() => {
    if (revalidateInterval <= 0) return;
    
    const interval = setInterval(() => {
      if (mountedRef.current && !isLoading) {
        execute(true);
      }
    }, revalidateInterval);
    
    return () => clearInterval(interval);
  }, [revalidateInterval, execute, isLoading]);

  // Cleanup
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  return {
    data,
    isLoading,
    isRefreshing,
    error,
    refetch,
    mutate,
    lastUpdated,
  };
}

/**
 * Hook simplificado para múltiplas queries paralelas
 * 
 * @example
 * const { data, isLoading } = useAsyncDataParallel({
 *   users: () => supabase.from('users').select('*'),
 *   posts: () => supabase.from('posts').select('*'),
 * });
 * 
 * // data.users, data.posts
 */
export function useAsyncDataParallel<T extends Record<string, () => Promise<any>>>(
  fetchers: T,
  options?: Omit<UseAsyncDataOptions<any>, 'fetcher'>
): UseAsyncDataReturn<{ [K in keyof T]: Awaited<ReturnType<T[K]>> }> {
  const combinedFetcher = useCallback(async () => {
    const keys = Object.keys(fetchers) as (keyof T)[];
    const results = await Promise.all(keys.map(key => fetchers[key]()));
    
    return keys.reduce((acc, key, index) => {
      acc[key] = results[index];
      return acc;
    }, {} as { [K in keyof T]: Awaited<ReturnType<T[K]>> });
  }, [fetchers]);

  return useAsyncData({
    ...options,
    fetcher: combinedFetcher,
  });
}

export default useAsyncData;
