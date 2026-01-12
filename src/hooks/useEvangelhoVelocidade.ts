// ============================================
// ⚡ EVANGELHO DA VELOCIDADE v3.0 - HOOKS ⚡
// ANO 2300 - Performance Quântica
// ============================================

import { useState, useEffect, useCallback, useMemo, useDeferredValue, startTransition } from 'react';
import { PERFORMANCE_DOGMAS, detectPerformanceTier, sacredCache, type PerformanceTier } from '@/lib/performance/evangelhoVelocidade';

export function usePerformanceTier(): PerformanceTier {
  const [tier, setTier] = useState<PerformanceTier>(() => detectPerformanceTier());
  useEffect(() => {
    const connection = (navigator as any).connection;
    if (connection) {
      const handler = () => setTier(detectPerformanceTier());
      connection.addEventListener('change', handler);
      return () => connection.removeEventListener('change', handler);
    }
  }, []);
  return tier;
}

export function useSacredCache<T>(key: string, fetcher: () => Promise<T>, options?: { ttl?: number; enabled?: boolean }) {
  const [data, setData] = useState<T | null>(() => sacredCache.get<T>(key));
  const [isLoading, setIsLoading] = useState(!sacredCache.has(key));
  const [error, setError] = useState<Error | null>(null);

  const fetch = useCallback(async () => {
    if (options?.enabled === false) return;
    try {
      setIsLoading(true);
      const result = await fetcher();
      sacredCache.set(key, result, { ttl: options?.ttl });
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setIsLoading(false);
    }
  }, [key, fetcher, options?.enabled, options?.ttl]);

  useEffect(() => {
    if (!sacredCache.has(key) && options?.enabled !== false) fetch();
  }, [key, fetch, options?.enabled]);

  return { data, isLoading, error, refetch: fetch };
}

export function useDeferredRender<T>(value: T): T {
  return useDeferredValue(value);
}

export function useOptimizedAnimation(enabled: boolean = true) {
  // 🏛️ PREMIUM GARANTIDO: Animações sempre ativas (respeita apenas prefers-reduced-motion)
  const reducedMotion = typeof window !== 'undefined' 
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches 
    : false;
  
  return useMemo(() => {
    if (!enabled || reducedMotion) {
      return { shouldAnimate: false, duration: 0, easing: 'linear' };
    }
    // Premium: duração quantum para todos
    return { shouldAnimate: true, duration: 150, easing: 'cubic-bezier(0.4, 0, 0.2, 1)' };
  }, [enabled, reducedMotion]);
}

export function useRenderPriority(priority: 'critical' | 'high' | 'normal' | 'low') {
  // 🏛️ PREMIUM GARANTIDO: Renderização imediata para todos (tier quantum)
  const [shouldRender, setShouldRender] = useState(priority === 'critical');

  useEffect(() => {
    if (priority === 'critical') { setShouldRender(true); return; }
    // Premium: sem delays, renderização imediata
    setShouldRender(true);
  }, [priority]);

  return { shouldRender: true, renderImmediately: priority === 'critical' };
}
