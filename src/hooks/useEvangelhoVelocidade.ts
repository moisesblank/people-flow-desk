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
  const { tier, recommendations } = usePerformanceTier();
  return useMemo(() => {
    const reducedMotion = recommendations.some(r => r.includes('Animações'));
    if (!enabled || reducedMotion || tier === 'legacy') {
      return { shouldAnimate: false, duration: 0, easing: 'linear' };
    }
    // v3.0 tier mapping
    const durationMap = { quantum: 150, neural: 200, enhanced: 250, standard: 300, legacy: 0 };
    return { shouldAnimate: true, duration: durationMap[tier], easing: 'cubic-bezier(0.4, 0, 0.2, 1)' };
  }, [tier, enabled, recommendations]);
}

export function useRenderPriority(priority: 'critical' | 'high' | 'normal' | 'low') {
  const { tier } = usePerformanceTier();
  const [shouldRender, setShouldRender] = useState(priority === 'critical');

  useEffect(() => {
    if (priority === 'critical') { setShouldRender(true); return; }
    // v3.0 tier mapping
    const delays = {
      quantum: { high: 0, normal: 0, low: 0 },
      neural: { high: 0, normal: 0, low: 50 },
      enhanced: { high: 0, normal: 50, low: 100 },
      standard: { high: 0, normal: 100, low: 200 },
      legacy: { high: 50, normal: 200, low: 500 },
    };
    const delay = delays[tier][priority as 'high' | 'normal' | 'low'];
    const timer = setTimeout(() => startTransition(() => setShouldRender(true)), delay);
    return () => clearTimeout(timer);
  }, [priority, tier]);

  return { shouldRender, renderImmediately: priority === 'critical' };
}
