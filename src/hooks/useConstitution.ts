// ╔══════════════════════════════════════════════════════════════════════════════╗
// ║   🏛️ CONSTITUIÇÃO SYNAPSE - HOOKS DE ENFORCEMENT                            ║
// ║   Hooks para garantir que as leis sejam sempre aplicadas                    ║
// ╚══════════════════════════════════════════════════════════════════════════════╝

import { useMemo, useCallback } from 'react';
import { 
  LEI_I_PERFORMANCE,
  getAnimationDuration,
  getImageQuality,
  getOverscan,
  getRootMargin,
  canAnimate,
  checkBudget,
  checkWebVital,
} from '@/lib/constitution/LEI_I_PERFORMANCE';

// ============================================
// DETECÇÃO DE TIER (Artigos 16-18)
// ============================================

type PerformanceTier = 'critical' | 'low' | 'medium' | 'high' | 'ultra';
type ConnectionType = 'slow' | 'mobile' | 'desktop';

function detectTier(): PerformanceTier {
  if (typeof window === 'undefined') return 'medium';
  
  const connection = (navigator as any).connection;
  const memory = (navigator as any).deviceMemory || 4;
  const cores = navigator.hardwareConcurrency || 2;
  
  // Data Saver ativo = critical
  if (connection?.saveData) return 'critical';
  
  // 2G = critical
  if (connection?.effectiveType === '2g' || connection?.effectiveType === 'slow-2g') {
    return 'critical';
  }
  
  // 3G = low
  if (connection?.effectiveType === '3g') return 'low';
  
  // Hardware fraco = low
  if (memory <= 2 || cores <= 2) return 'low';
  
  // 4G + hardware médio = medium
  if (connection?.effectiveType === '4g' && memory <= 4) return 'medium';
  
  // Hardware bom = high
  if (cores >= 4 && memory >= 4) return 'high';
  
  // Hardware top = ultra
  if (cores >= 8 && memory >= 8) return 'ultra';
  
  return 'medium';
}

function detectConnection(): ConnectionType {
  if (typeof window === 'undefined') return 'desktop';
  
  const connection = (navigator as any).connection;
  
  if (connection?.saveData || 
      connection?.effectiveType === '2g' || 
      connection?.effectiveType === 'slow-2g' ||
      connection?.effectiveType === '3g') {
    return 'slow';
  }
  
  if (/iPhone|iPad|iPod|Android/i.test(navigator.userAgent)) {
    return 'mobile';
  }
  
  return 'desktop';
}

// ============================================
// HOOK PRINCIPAL - useConstitution
// ============================================

export function useConstitution() {
  const tier = useMemo(() => detectTier(), []);
  const connection = useMemo(() => detectConnection(), []);
  
  // Artigo 19 - Reduced Motion
  const prefersReducedMotion = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);
  
  // Artigo 18 - Data Saver
  const isDataSaver = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return (navigator as any).connection?.saveData === true;
  }, []);
  
  // ============================================
  // FUNÇÕES DE ENFORCEMENT
  // ============================================
  
  // Artigo 21 - Duração de animação
  const getAnimDuration = useCallback((base: number) => {
    if (prefersReducedMotion) return 0;
    return getAnimationDuration(base, tier);
  }, [tier, prefersReducedMotion]);
  
  // Artigo 9 - Qualidade de imagem
  const getImgQuality = useCallback(() => {
    return getImageQuality(tier);
  }, [tier]);
  
  // Artigo 26 - Overscan
  const getVirtualOverscan = useCallback(() => {
    return getOverscan(tier);
  }, [tier]);
  
  // Artigo 5 - rootMargin
  const getLazyRootMargin = useCallback(() => {
    return getRootMargin(connection);
  }, [connection]);
  
  // Artigo 19 - Pode animar?
  const shouldAnimate = useMemo(() => {
    if (prefersReducedMotion) return false;
    return canAnimate(tier);
  }, [tier, prefersReducedMotion]);
  
  // ============================================
  // CONFIGURAÇÕES COMPLETAS
  // ============================================
  
  const config = useMemo(() => ({
    // Tier detectado
    tier,
    connection,
    
    // Flags
    shouldAnimate,
    isDataSaver,
    prefersReducedMotion,
    isSlowConnection: connection === 'slow',
    isMobile: connection === 'mobile',
    isLowEnd: tier === 'critical' || tier === 'low',
    
    // Valores calculados
    animationDuration: (base: number) => getAnimDuration(base),
    imageQuality: getImgQuality(),
    overscan: getVirtualOverscan(),
    rootMargin: getLazyRootMargin(),
    
    // Configurações da constituição
    debounceMs: LEI_I_PERFORMANCE.TIMING.SEARCH_DEBOUNCE_MS,
    throttleMs: LEI_I_PERFORMANCE.TIMING.SCROLL_THROTTLE_MS,
    queryLimit: LEI_I_PERFORMANCE.DB.DEFAULT_QUERY_LIMIT,
    
    // Budgets
    budgets: LEI_I_PERFORMANCE.METRICS.BUDGETS,
    targets: LEI_I_PERFORMANCE.METRICS.TARGETS,
    
  }), [
    tier, 
    connection, 
    shouldAnimate, 
    isDataSaver, 
    prefersReducedMotion,
    getAnimDuration,
    getImgQuality,
    getVirtualOverscan,
    getLazyRootMargin,
  ]);
  
  return config;
}

// ============================================
// HOOKS ESPECÍFICOS
// ============================================

/**
 * Hook para animações constitucionais
 */
export function useConstitutionalAnimation() {
  const { shouldAnimate, animationDuration, tier } = useConstitution();
  
  return useMemo(() => ({
    shouldAnimate,
    duration: (base: number = 300) => animationDuration(base),
    ease: tier === 'ultra' ? [0.4, 0, 0.2, 1] : [0.4, 0, 1, 1],
    skipAnimations: !shouldAnimate,
  }), [shouldAnimate, animationDuration, tier]);
}

/**
 * Hook para imagens constitucionais
 */
export function useConstitutionalImage() {
  const { imageQuality, isDataSaver, isSlowConnection } = useConstitution();
  
  return useMemo(() => ({
    quality: imageQuality,
    loading: 'lazy' as const,
    decoding: 'async' as const,
    shouldLoadImages: !isDataSaver,
    useBlurPlaceholder: !isSlowConnection,
  }), [imageQuality, isDataSaver, isSlowConnection]);
}

/**
 * Hook para virtualização constitucional
 */
export function useConstitutionalVirtualization() {
  const { overscan, tier } = useConstitution();
  
  return useMemo(() => ({
    overscan,
    threshold: LEI_I_PERFORMANCE.VIRTUAL.VIRTUALIZE_ABOVE,
    shouldVirtualize: (itemCount: number) => itemCount > LEI_I_PERFORMANCE.VIRTUAL.VIRTUALIZE_ABOVE,
    itemHeight: tier === 'low' || tier === 'critical' ? 60 : 80,
  }), [overscan, tier]);
}

/**
 * Hook para lazy loading constitucional
 */
export function useConstitutionalLazyLoad() {
  const { rootMargin, isSlowConnection } = useConstitution();
  
  return useMemo(() => ({
    rootMargin,
    threshold: 0.01,
    // Em conexões lentas, carrega mais cedo
    prefetchDistance: isSlowConnection ? 800 : 400,
  }), [rootMargin, isSlowConnection]);
}

/**
 * Hook para queries constitucionais
 */
export function useConstitutionalQuery() {
  const { queryLimit, isSlowConnection } = useConstitution();
  
  return useMemo(() => ({
    limit: isSlowConnection ? Math.floor(queryLimit / 2) : queryLimit,
    staleTime: isSlowConnection ? 60_000 : 30_000,
    gcTime: isSlowConnection ? 600_000 : 300_000,
    networkMode: 'offlineFirst' as const,
    refetchOnFocus: false,
    refetchOnReconnect: false,
  }), [queryLimit, isSlowConnection]);
}

// ============================================
// VALIDADORES
// ============================================

/**
 * Valida se está dentro do budget
 */
export function useValidateBudget() {
  return useCallback((metric: keyof typeof LEI_I_PERFORMANCE.METRICS.BUDGETS, value: number) => {
    return checkBudget(metric, value);
  }, []);
}

/**
 * Valida Core Web Vital
 */
export function useValidateWebVital() {
  return useCallback((metric: keyof typeof LEI_I_PERFORMANCE.METRICS.TARGETS, value: number) => {
    return checkWebVital(metric, value);
  }, []);
}

export default useConstitution;
