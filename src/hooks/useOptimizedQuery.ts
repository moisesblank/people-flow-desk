// ============================================
// ⚡ HOOK SAGRADO DE QUERIES OTIMIZADAS v3500 ⚡
// DOGMA IV + V: Queries Sub-50ms + Cache Quântico
// ============================================

import { useQueryClient, UseQueryOptions } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';
import { CACHE_PROFILES, INVALIDATION_KEYS } from '@/lib/performance/cacheConfig';
import { useSubspaceQuery } from './useSubspaceCommunication';

// Tipo para configuração de cache (usando CACHE_PROFILES v3500)
type CacheType = keyof typeof CACHE_PROFILES;

interface OptimizedQueryOptions<T> extends Omit<UseQueryOptions<T, Error>, 'queryKey' | 'queryFn'> {
  cacheType?: CacheType;
  enablePrefetch?: boolean;
}

/**
 * Hook para queries otimizadas com cache inteligente
 * Aplica DOGMA V automaticamente baseado no tipo de dados
 */
export function useOptimizedQuery<T>(
  queryKey: string[],
  queryFn: () => Promise<T>,
  options: OptimizedQueryOptions<T> = {}
) {
  const { cacheType = 'list', enablePrefetch = false, ...queryOptions } = options;
  
  // Aplicar configuração de cache baseada no tipo (v3500)
  const cacheConfig = CACHE_PROFILES[cacheType];
  
  return useSubspaceQuery<T>(
    queryKey,
    queryFn,
    {
      profile: 'semiStatic',
      persistKey: queryKey.join('_'),
      staleTime: cacheConfig.staleTime,
      gcTime: cacheConfig.gcTime,
      persistToLocalStorage: true,
      persistTTL: Math.max(cacheConfig.gcTime, 60_000),
      refetchOnWindowFocus: false,
      retry: 1,
      ...queryOptions,
    } as any
  );
}

/**
 * Hook para invalidação inteligente de cache
 * Invalida queries relacionadas automaticamente
 */
export function useSmartInvalidation() {
  const queryClient = useQueryClient();

  const invalidate = useCallback((category: keyof typeof INVALIDATION_KEYS) => {
    const keysToInvalidate = INVALIDATION_KEYS[category];
    
    keysToInvalidate.forEach(key => {
      queryClient.invalidateQueries({ queryKey: [key] });
    });

    console.log(`[DOGMA V] Cache invalidado: ${category}`);
  }, [queryClient]);

  const invalidateAll = useCallback(() => {
    queryClient.invalidateQueries();
    console.log('[DOGMA V] Todo o cache invalidado');
  }, [queryClient]);

  const prefetch = useCallback(async (queryKey: string[], queryFn: () => Promise<unknown>) => {
    await queryClient.prefetchQuery({
      queryKey,
      queryFn,
      staleTime: CACHE_PROFILES.dashboard.staleTime,
    });
  }, [queryClient]);

  return { invalidate, invalidateAll, prefetch };
}

/**
 * Hook para batching de múltiplas queries
 * DOGMA VI: Reduzir número de requisições
 */
export function useBatchedQueries<T extends Record<string, () => Promise<unknown>>>(
  queries: T,
  options: { enabled?: boolean; cacheType?: CacheType } = {}
) {
  const { enabled = true, cacheType = 'list' } = options;
  const cacheConfig = CACHE_PROFILES[cacheType];
  
  const queryKeys = useMemo(() => Object.keys(queries), [queries]);
  
  const results = queryKeys.map(key => {
    return useSubspaceQuery(
      [key],
      queries[key],
      {
        profile: 'semiStatic',
        persistKey: `batched_${key}`,
        enabled,
        staleTime: cacheConfig.staleTime,
        gcTime: cacheConfig.gcTime,
        persistToLocalStorage: true,
        persistTTL: Math.max(cacheConfig.gcTime, 60_000),
        retry: 1,
      }
    );
  });

  const isLoading = results.some(r => r.isLoading);
  const isError = results.some(r => r.isError);
  const data = useMemo(() => {
    return queryKeys.reduce((acc, key, index) => {
      acc[key] = results[index].data;
      return acc;
    }, {} as Record<string, unknown>);
  }, [queryKeys, results]);

  return { data, isLoading, isError, results };
}

/**
 * Hook para prefetch de rotas
 * DOGMA VII: Preparar dados antes da navegação
 */
export function useRoutePrefetch() {
  const queryClient = useQueryClient();

  const prefetchRoute = useCallback((route: string, queries: Record<string, () => Promise<unknown>>) => {
    // Prefetch usando requestIdleCallback para não bloquear
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => {
        Object.entries(queries).forEach(([key, fn]) => {
          queryClient.prefetchQuery({
            queryKey: [route, key],
            queryFn: fn,
            staleTime: CACHE_PROFILES.immutable.staleTime,
          });
        });
      });
    } else {
      setTimeout(() => {
        Object.entries(queries).forEach(([key, fn]) => {
          queryClient.prefetchQuery({
            queryKey: [route, key],
            queryFn: fn,
            staleTime: CACHE_PROFILES.immutable.staleTime,
          });
        });
      }, 100);
    }
  }, [queryClient]);

  return { prefetchRoute };
}

console.log('[DOGMA IV+V] ⚡ Sistema de queries otimizadas carregado');
