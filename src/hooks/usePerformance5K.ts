// ============================================
// ⚡ Ω6: HOOK - usePerformance5K
// Hook React para otimizações de 5K usuários + 3G
// ============================================

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  detectPerformanceTier,
  createThrottle,
  createDebounce,
  rafThrottle,
  checkLocalRateLimit,
  getAdaptiveImageQuality,
  getPerformanceClasses,
  prefetchBookPages,
  PerformanceMetrics,
  PerformanceTier,
  PERFORMANCE_5K_CONFIG,
} from '@/lib/performance/performance5KOptimizer';

// ============================================
// HOOK: usePerformanceMetrics
// Detecta e monitora métricas de performance
// ============================================

export function usePerformanceMetrics(): PerformanceMetrics {
  const [metrics, setMetrics] = useState<PerformanceMetrics>(() => detectPerformanceTier());
  
  useEffect(() => {
    // Re-detectar em mudança de rede
    const connection = (navigator as any).connection;
    
    const handleChange = () => {
      setMetrics(detectPerformanceTier());
    };
    
    if (connection) {
      connection.addEventListener('change', handleChange);
    }
    
    // Re-detectar em visibilidade
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        setMetrics(detectPerformanceTier());
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibility);
    
    return () => {
      if (connection) {
        connection.removeEventListener('change', handleChange);
      }
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);
  
  return metrics;
}

// ============================================
// HOOK: useThrottle
// Throttle reativo
// ============================================

export function useThrottle<T extends (...args: any[]) => any>(
  fn: T,
  ms?: number,
  deps: any[] = []
): T {
  const metrics = usePerformanceMetrics();
  
  // Ajustar throttle baseado no tier
  const adjustedMs = useMemo(() => {
    if (ms !== undefined) return ms;
    
    return PERFORMANCE_5K_CONFIG.THROTTLE_MS[metrics.tier.toUpperCase() as keyof typeof PERFORMANCE_5K_CONFIG.THROTTLE_MS] || 100;
  }, [ms, metrics.tier]);
  
  const throttledRef = useRef<ReturnType<typeof createThrottle<T>> | null>(null);
  
  useEffect(() => {
    throttledRef.current = createThrottle(fn, adjustedMs);
    
    return () => {
      throttledRef.current?.cancel();
    };
  }, [fn, adjustedMs, ...deps]);
  
  return useCallback((...args: Parameters<T>) => {
    return throttledRef.current?.(...args);
  }, []) as T;
}

// ============================================
// HOOK: useDebounce
// Debounce reativo
// ============================================

export function useDebounce<T extends (...args: any[]) => any>(
  fn: T,
  ms: number,
  deps: any[] = []
): T & { cancel: () => void; flush: () => void } {
  const debouncedRef = useRef<ReturnType<typeof createDebounce<T>> | null>(null);
  
  useEffect(() => {
    debouncedRef.current = createDebounce(fn, ms);
    
    return () => {
      debouncedRef.current?.cancel();
    };
  }, [fn, ms, ...deps]);
  
  const debounced = useCallback((...args: Parameters<T>) => {
    return debouncedRef.current?.(...args);
  }, []) as T & { cancel: () => void; flush: () => void };
  
  debounced.cancel = () => debouncedRef.current?.cancel();
  debounced.flush = () => debouncedRef.current?.flush();
  
  return debounced;
}

// ============================================
// HOOK: useRafThrottle
// RAF-based throttle
// ============================================

export function useRafThrottle<T extends (...args: any[]) => any>(
  fn: T,
  deps: any[] = []
): T {
  const throttledRef = useRef<ReturnType<typeof rafThrottle<T>> | null>(null);
  
  useEffect(() => {
    throttledRef.current = rafThrottle(fn);
    
    return () => {
      throttledRef.current?.cancel();
    };
  }, [fn, ...deps]);
  
  return useCallback((...args: Parameters<T>) => {
    return throttledRef.current?.(...args);
  }, []) as T;
}

// ============================================
// HOOK: useLocalRateLimit
// Rate limiting local
// ============================================

export function useLocalRateLimit(key: string, limit: number, windowMs: number = 60000) {
  const check = useCallback(() => {
    return checkLocalRateLimit(key, limit, windowMs);
  }, [key, limit, windowMs]);
  
  const withRateLimit = useCallback(<T>(action: () => T): T | null => {
    const result = check();
    if (!result.allowed) {
      console.warn(`[RateLimit] ${key} excedido. Reset em ${result.resetIn}ms`);
      return null;
    }
    return action();
  }, [key, check]);
  
  return {
    check,
    withRateLimit,
  };
}

// ============================================
// HOOK: useAdaptiveImage
// Qualidade de imagem adaptativa
// ============================================

export function useAdaptiveImage() {
  const metrics = usePerformanceMetrics();
  
  const quality = useMemo(() => getAdaptiveImageQuality(metrics), [metrics]);
  
  const getOptimizedSrc = useCallback((
    baseSrc: string,
    options?: { width?: number; format?: 'webp' | 'jpg' | 'png' }
  ): string => {
    // Se for URL de storage, adicionar parâmetros de transformação
    // (depende do backend suportar)
    const url = new URL(baseSrc, window.location.origin);
    
    if (options?.width) {
      const maxWidth = metrics.is3GOrWorse ? Math.min(800, options.width) : options.width;
      url.searchParams.set('width', String(maxWidth));
    }
    
    if (options?.format) {
      url.searchParams.set('format', options.format);
    }
    
    url.searchParams.set('quality', String(Math.round(quality * 100)));
    
    return url.toString();
  }, [metrics, quality]);
  
  return {
    quality,
    is3G: metrics.is3GOrWorse,
    isLowEnd: metrics.isLowEnd,
    getOptimizedSrc,
  };
}

// ============================================
// HOOK: usePerformanceClasses
// Classes CSS adaptativas
// ============================================

export function usePerformanceClasses(): string {
  const metrics = usePerformanceMetrics();
  return useMemo(() => getPerformanceClasses(metrics), [metrics]);
}

// ============================================
// HOOK: useBookPrefetch
// Prefetch de páginas de livro
// ============================================

export function useBookPrefetch(
  currentPage: number,
  getPageUrl: (page: number) => string | null,
  totalPages: number
) {
  const metrics = usePerformanceMetrics();
  
  useEffect(() => {
    prefetchBookPages(currentPage, getPageUrl, totalPages, metrics);
  }, [currentPage, getPageUrl, totalPages, metrics]);
}

// ============================================
// HOOK: useVirtualization
// Configurações de virtualização adaptativas
// ============================================

export function useVirtualization() {
  const metrics = usePerformanceMetrics();
  
  const overscan = useMemo(() => {
    const tierKey = metrics.tier.toUpperCase() as keyof typeof PERFORMANCE_5K_CONFIG.VIRTUALIZATION.OVERSCAN;
    return PERFORMANCE_5K_CONFIG.VIRTUALIZATION.OVERSCAN[tierKey] || 3;
  }, [metrics.tier]);
  
  return {
    overscan,
    minItemHeight: PERFORMANCE_5K_CONFIG.VIRTUALIZATION.MIN_ITEM_HEIGHT,
    windowSize: PERFORMANCE_5K_CONFIG.VIRTUALIZATION.WINDOW_SIZE,
  };
}

// ============================================
// HOOK: use3GFallback
// Fallbacks para 3G
// ============================================

export function use3GFallback() {
  const metrics = usePerformanceMetrics();
  
  const fallbacks = useMemo(() => {
    if (metrics.is3GOrWorse || metrics.saveData) {
      return PERFORMANCE_5K_CONFIG.FALLBACK_3G;
    }
    
    if (metrics.isLowEnd) {
      return {
        DISABLE_ANIMATIONS: false,
        DISABLE_BLUR: true,
        DISABLE_SHADOWS: true,
        REDUCE_IMAGE_SIZE: true,
        DISABLE_PREFETCH: false,
        SIMPLIFIED_UI: false,
      };
    }
    
    return {
      DISABLE_ANIMATIONS: false,
      DISABLE_BLUR: false,
      DISABLE_SHADOWS: false,
      REDUCE_IMAGE_SIZE: false,
      DISABLE_PREFETCH: false,
      SIMPLIFIED_UI: false,
    };
  }, [metrics]);
  
  return {
    ...fallbacks,
    is3G: metrics.is3GOrWorse,
    isLowEnd: metrics.isLowEnd,
    saveData: metrics.saveData,
    tier: metrics.tier,
  };
}

// ============================================
// HOOK: useAnnotationSaver
// Salvamento otimizado de anotações
// ============================================

import { compressAnnotations, decompressAnnotations } from '@/lib/performance/performance5KOptimizer';

export function useAnnotationSaver(
  saveFunction: (data: string) => Promise<void>,
  loadFunction: () => Promise<string | null>
) {
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(true);
  const [annotations, setAnnotations] = useState<any[]>([]);
  
  // Rate limit para salvamentos
  const { check: checkRateLimit } = useLocalRateLimit(
    'annotation-save',
    PERFORMANCE_5K_CONFIG.RATE_LIMIT.ANNOTATIONS_PER_MIN,
    60000
  );
  
  // Debounce do salvamento
  const debouncedSave = useDebounce(async (data: any[]) => {
    const rateCheck = checkRateLimit();
    if (!rateCheck.allowed) {
      console.warn('[Annotations] Rate limit atingido');
      return;
    }
    
    setIsSaving(true);
    try {
      const compressed = compressAnnotations(data);
      await saveFunction(compressed);
      setIsSaved(true);
    } catch (error) {
      console.error('[Annotations] Erro ao salvar:', error);
    } finally {
      setIsSaving(false);
    }
  }, PERFORMANCE_5K_CONFIG.DEBOUNCE_MS.ANNOTATION_SAVE);
  
  // Carregar anotações
  const load = useCallback(async () => {
    try {
      const data = await loadFunction();
      if (data) {
        const decompressed = decompressAnnotations(data);
        setAnnotations(decompressed);
      }
    } catch (error) {
      console.error('[Annotations] Erro ao carregar:', error);
    }
  }, [loadFunction]);
  
  // Atualizar anotações
  const update = useCallback((newAnnotations: any[]) => {
    setAnnotations(newAnnotations);
    setIsSaved(false);
    debouncedSave(newAnnotations);
  }, [debouncedSave]);
  
  // Forçar salvamento
  const forceSave = useCallback(() => {
    debouncedSave.flush();
  }, [debouncedSave]);
  
  return {
    annotations,
    isSaving,
    isSaved,
    load,
    update,
    forceSave,
  };
}

// ============================================
// EXPORTS
// ============================================

export {
  PERFORMANCE_5K_CONFIG,
  detectPerformanceTier,
};

export type { PerformanceMetrics, PerformanceTier };

export default {
  usePerformanceMetrics,
  useThrottle,
  useDebounce,
  useRafThrottle,
  useLocalRateLimit,
  useAdaptiveImage,
  usePerformanceClasses,
  useBookPrefetch,
  useVirtualization,
  use3GFallback,
  useAnnotationSaver,
};
