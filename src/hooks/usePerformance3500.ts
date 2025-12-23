// ╔══════════════════════════════════════════════════════════════════════════════╗
// ║   ⚡ HOOK MESTRE DE PERFORMANCE - ANO 3500 ⚡                                 ║
// ║   O único hook que você precisa para performance                             ║
// ║   Se roda em 3G, roda em QUALQUER lugar.                                     ║
// ╚══════════════════════════════════════════════════════════════════════════════╝

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  type PerformanceTier3500,
  type DeviceMetrics3500,
  getDeviceMetrics3500,
  refreshDeviceMetrics3500,
  getCacheConfig3500,
  getLazyConfig3500,
  shouldAnimate3500,
  getAnimationDuration3500,
  getImageQuality3500,
  isFeatureEnabled3500,
  getOverscan3500,
  shouldPrefetch3500,
  VIRTUALIZATION_3500,
  IMAGES_3500,
  PREFETCH_3500,
} from '@/lib/performance/performance3500Core';

// ============================================
// TIPOS
// ============================================

export interface Performance3500Config {
  // Métricas do dispositivo
  metrics: DeviceMetrics3500;
  
  // Flags de performance
  shouldAnimate: boolean;
  shouldPrefetch: boolean;
  isLowEnd: boolean;
  is3GOrWorse: boolean;
  isOffline: boolean;
  isMobile: boolean;
  
  // Configurações de cache
  cacheConfig: ReturnType<typeof getCacheConfig3500>;
  
  // Configurações de lazy loading
  lazyConfig: ReturnType<typeof getLazyConfig3500>;
  
  // Valores calculados
  imageQuality: number;
  imageMaxWidth: number;
  overscan: number;
  prefetchDepth: number;
  maxConcurrentPrefetch: number;
  virtualItemHeight: number;
  
  // Funções utilitárias
  getAnimDuration: (base: number) => number;
  getEasing: () => string;
  isFeatureEnabled: (feature: string) => boolean;
  getOptimizedImageUrl: (url: string, width?: number) => string;
  
  // Framer Motion config pronto
  motionConfig: {
    initial: object | boolean;
    animate: object;
    exit: object | undefined;
    transition: object;
  };
}

// ============================================
// HOOK PRINCIPAL
// ============================================

/**
 * Hook mestre de performance ANO 3500
 * Detecta tier uma vez e fornece todas as configs necessárias
 */
export function usePerformance3500(): Performance3500Config {
  const [metrics, setMetrics] = useState<DeviceMetrics3500>(() => getDeviceMetrics3500());
  const connectionChangeRef = useRef(false);

  // Listener para mudança de conexão
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const connection = (navigator as any).connection;
    if (!connection) return;

    const handleChange = () => {
      connectionChangeRef.current = true;
      const newMetrics = refreshDeviceMetrics3500();
      setMetrics(newMetrics);
    };

    connection.addEventListener('change', handleChange);
    window.addEventListener('online', handleChange);
    window.addEventListener('offline', handleChange);

    return () => {
      connection.removeEventListener('change', handleChange);
      window.removeEventListener('online', handleChange);
      window.removeEventListener('offline', handleChange);
    };
  }, []);

  // Configurações memoizadas
  const tier = metrics.tier;

  const cacheConfig = useMemo(() => getCacheConfig3500(tier), [tier]);
  const lazyConfig = useMemo(() => getLazyConfig3500(tier), [tier]);

  const shouldAnimate = useMemo(
    () => shouldAnimate3500(tier, metrics.reducedMotion),
    [tier, metrics.reducedMotion]
  );

  const canPrefetch = useMemo(() => shouldPrefetch3500(tier), [tier]);

  const imageQuality = useMemo(() => getImageQuality3500(tier), [tier]);
  const imageMaxWidth = useMemo(() => IMAGES_3500.maxWidth[tier], [tier]);
  const overscan = useMemo(() => getOverscan3500(tier), [tier]);
  const prefetchDepth = useMemo(() => PREFETCH_3500.routeDepth[tier], [tier]);
  const maxConcurrentPrefetch = useMemo(() => PREFETCH_3500.maxConcurrent[tier], [tier]);
  const virtualItemHeight = useMemo(() => VIRTUALIZATION_3500.itemHeight[tier], [tier]);

  // Funções utilitárias
  const getAnimDuration = useCallback(
    (base: number) => getAnimationDuration3500(base, tier),
    [tier]
  );

  const getEasing = useCallback(
    () => {
      const easings: Record<PerformanceTier3500, string> = {
        critical: 'linear',
        legacy: 'linear',
        standard: 'ease-out',
        enhanced: 'cubic-bezier(0.4, 0, 0.2, 1)',
        neural: 'cubic-bezier(0.4, 0, 0.2, 1)',
        quantum: 'cubic-bezier(0.16, 1, 0.3, 1)',
      };
      return easings[tier];
    },
    [tier]
  );

  const isFeatureEnabled = useCallback(
    (feature: string) => isFeatureEnabled3500(tier, feature),
    [tier]
  );

  const getOptimizedImageUrl = useCallback(
    (url: string, width?: number) => {
      if (!url || url.startsWith('data:')) return url;

      // Supabase Storage
      if (url.includes('supabase.co/storage')) {
        const separator = url.includes('?') ? '&' : '?';
        const params = [`quality=${imageQuality}`];
        if (width) params.push(`width=${Math.min(width, imageMaxWidth)}`);
        return `${url}${separator}${params.join('&')}`;
      }

      return url;
    },
    [imageQuality, imageMaxWidth]
  );

  // Framer Motion config pronto para usar
  const motionConfig = useMemo(() => {
    if (!shouldAnimate) {
      return {
        initial: false,
        animate: { opacity: 1 },
        exit: undefined,
        transition: { duration: 0 },
      };
    }

    const duration = getAnimDuration(200) / 1000;
    const easing = getEasing();

    return {
      initial: { opacity: 0, y: 8 },
      animate: { opacity: 1, y: 0 },
      exit: { opacity: 0, y: -8 },
      transition: {
        duration,
        ease: easing === 'linear' ? 'linear' : [0.4, 0, 0.2, 1],
      },
    };
  }, [shouldAnimate, getAnimDuration, getEasing]);

  return {
    metrics,
    shouldAnimate,
    shouldPrefetch: canPrefetch,
    isLowEnd: metrics.isLowEnd,
    is3GOrWorse: metrics.is3GOrWorse,
    isOffline: metrics.isOffline,
    isMobile: metrics.isMobile,
    cacheConfig,
    lazyConfig,
    imageQuality,
    imageMaxWidth,
    overscan,
    prefetchDepth,
    maxConcurrentPrefetch,
    virtualItemHeight,
    getAnimDuration,
    getEasing,
    isFeatureEnabled,
    getOptimizedImageUrl,
    motionConfig,
  };
}

// ============================================
// HOOKS ESPECIALIZADOS
// ============================================

/**
 * Hook apenas para cache config
 */
export function useCacheConfig3500() {
  const metrics = useMemo(() => getDeviceMetrics3500(), []);
  return useMemo(() => getCacheConfig3500(metrics.tier), [metrics.tier]);
}

/**
 * Hook apenas para lazy loading config
 */
export function useLazyConfig3500() {
  const metrics = useMemo(() => getDeviceMetrics3500(), []);
  return useMemo(() => ({
    ...getLazyConfig3500(metrics.tier),
    connectionSpeed: metrics.connection,
    isLowEnd: metrics.isLowEnd,
  }), [metrics]);
}

/**
 * Hook apenas para animações
 */
export function useAnimation3500() {
  const metrics = useMemo(() => getDeviceMetrics3500(), []);
  
  const shouldAnimate = useMemo(
    () => shouldAnimate3500(metrics.tier, metrics.reducedMotion),
    [metrics.tier, metrics.reducedMotion]
  );

  const getDuration = useCallback(
    (base: number) => shouldAnimate ? getAnimationDuration3500(base, metrics.tier) : 0,
    [shouldAnimate, metrics.tier]
  );

  return { shouldAnimate, getDuration, tier: metrics.tier };
}

/**
 * Hook apenas para imagens
 */
export function useImage3500() {
  const metrics = useMemo(() => getDeviceMetrics3500(), []);
  
  return useMemo(() => ({
    quality: getImageQuality3500(metrics.tier),
    maxWidth: IMAGES_3500.maxWidth[metrics.tier],
    formats: IMAGES_3500.formats[metrics.tier],
    srcset: IMAGES_3500.srcset,
    loading: 'lazy' as const,
    decoding: 'async' as const,
  }), [metrics.tier]);
}

/**
 * Hook apenas para virtualização
 */
export function useVirtualization3500() {
  const metrics = useMemo(() => getDeviceMetrics3500(), []);
  
  return useMemo(() => ({
    overscan: getOverscan3500(metrics.tier),
    itemHeight: VIRTUALIZATION_3500.itemHeight[metrics.tier],
    threshold: VIRTUALIZATION_3500.threshold,
    shouldVirtualize: (count: number) => count > VIRTUALIZATION_3500.threshold,
  }), [metrics.tier]);
}

/**
 * Hook apenas para prefetch
 */
export function usePrefetch3500() {
  const metrics = useMemo(() => getDeviceMetrics3500(), []);
  
  return useMemo(() => ({
    enabled: shouldPrefetch3500(metrics.tier),
    maxConcurrent: PREFETCH_3500.maxConcurrent[metrics.tier],
    routeDepth: PREFETCH_3500.routeDepth[metrics.tier],
  }), [metrics.tier]);
}

// ============================================
// COMPONENTES DE CONVENIÊNCIA
// ============================================

/**
 * Hook para obter tier diretamente
 */
export function useTier3500(): PerformanceTier3500 {
  return useMemo(() => getDeviceMetrics3500().tier, []);
}

/**
 * Hook para verificar se é low-end
 */
export function useIsLowEnd3500(): boolean {
  return useMemo(() => getDeviceMetrics3500().isLowEnd, []);
}

/**
 * Hook para verificar se é 3G ou pior
 */
export function useIs3GOrWorse(): boolean {
  const [is3G, setIs3G] = useState(() => getDeviceMetrics3500().is3GOrWorse);

  useEffect(() => {
    const connection = (navigator as any).connection;
    if (!connection) return;

    const handleChange = () => {
      setIs3G(refreshDeviceMetrics3500().is3GOrWorse);
    };

    connection.addEventListener('change', handleChange);
    return () => connection.removeEventListener('change', handleChange);
  }, []);

  return is3G;
}

export default usePerformance3500;