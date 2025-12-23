// ╔══════════════════════════════════════════════════════════════════════════════╗
// ║   🏛️ CONSTITUIÇÃO SYNAPSE - HOOKS DE ENFORCEMENT v5.0                       ║
// ║   LEI I: Performance | LEI II: Dispositivos | LEI III: Segurança            ║
// ║   Retorna: tier, shouldAnimate, imageQuality, rootMargin, overscan          ║
// ╚══════════════════════════════════════════════════════════════════════════════╝

import { useMemo, useCallback, useState, useEffect } from 'react';
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
// TIPOS CONSTITUCIONAIS
// ============================================

export type ConstitutionTier = 'critical' | 'low' | 'medium' | 'high' | 'ultra';
export type ConnectionType = 'slow' | 'mobile' | 'desktop';

export interface ConstitutionConfig {
  // Core (LEI I Art. Final)
  tier: ConstitutionTier;
  connection: ConnectionType;
  shouldAnimate: boolean;
  imageQuality: number;
  rootMargin: string;
  overscan: number;
  
  // Device (LEI II)
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isTouch: boolean;
  
  // Flags
  isDataSaver: boolean;
  prefersReducedMotion: boolean;
  isSlowConnection: boolean;
  isLowEnd: boolean;
  
  // Functions
  animationDuration: (base: number) => number;
  
  // Config values
  debounceMs: number;
  throttleMs: number;
  queryLimit: number;
  
  // Budgets & Targets
  budgets: typeof LEI_I_PERFORMANCE.METRICS.BUDGETS;
  targets: typeof LEI_I_PERFORMANCE.METRICS.TARGETS;
}

// ============================================
// DETECÇÃO DE TIER (LEI I Art. 16-18)
// ============================================

function detectTier(): ConstitutionTier {
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

function detectDevice() {
  if (typeof window === 'undefined') {
    return { isMobile: false, isTablet: false, isDesktop: true, isTouch: false };
  }
  
  const ua = navigator.userAgent;
  const isMobile = /iPhone|iPod|Android.*Mobile/i.test(ua);
  const isTablet = /iPad|Android(?!.*Mobile)/i.test(ua);
  const isDesktop = !isMobile && !isTablet;
  const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  
  return { isMobile, isTablet, isDesktop, isTouch };
}

// ============================================
// HOOK PRINCIPAL - useConstitution
// ============================================

export function useConstitution(): ConstitutionConfig {
  // Estado inicial com detecção
  const [tier, setTier] = useState<ConstitutionTier>(() => detectTier());
  const [connection, setConnection] = useState<ConnectionType>(() => detectConnection());
  
  // Detectar mudanças de conexão em tempo real
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const handleConnectionChange = () => {
      setTier(detectTier());
      setConnection(detectConnection());
    };
    
    const conn = (navigator as any).connection;
    conn?.addEventListener?.('change', handleConnectionChange);
    
    window.addEventListener('online', handleConnectionChange);
    window.addEventListener('offline', handleConnectionChange);
    
    return () => {
      conn?.removeEventListener?.('change', handleConnectionChange);
      window.removeEventListener('online', handleConnectionChange);
      window.removeEventListener('offline', handleConnectionChange);
    };
  }, []);
  
  // Device detection (estável)
  const device = useMemo(() => detectDevice(), []);
  
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
  const imgQuality = useMemo(() => getImageQuality(tier), [tier]);
  
  // Artigo 26 - Overscan
  const virtualOverscan = useMemo(() => getOverscan(tier), [tier]);
  
  // Artigo 5 - rootMargin
  const lazyRootMargin = useMemo(() => getRootMargin(connection), [connection]);
  
  // Artigo 19 - Pode animar?
  const shouldAnimate = useMemo(() => {
    if (prefersReducedMotion) return false;
    return canAnimate(tier);
  }, [tier, prefersReducedMotion]);
  
  // ============================================
  // CONFIGURAÇÃO COMPLETA MEMOIZADA
  // ============================================
  
  return useMemo<ConstitutionConfig>(() => ({
    // Core
    tier,
    connection,
    shouldAnimate,
    imageQuality: imgQuality,
    rootMargin: lazyRootMargin,
    overscan: virtualOverscan,
    
    // Device
    isMobile: device.isMobile,
    isTablet: device.isTablet,
    isDesktop: device.isDesktop,
    isTouch: device.isTouch,
    
    // Flags
    isDataSaver,
    prefersReducedMotion,
    isSlowConnection: connection === 'slow',
    isLowEnd: tier === 'critical' || tier === 'low',
    
    // Functions
    animationDuration: getAnimDuration,
    
    // Config values
    debounceMs: LEI_I_PERFORMANCE.TIMING.SEARCH_DEBOUNCE_MS,
    throttleMs: LEI_I_PERFORMANCE.TIMING.SCROLL_THROTTLE_MS,
    queryLimit: LEI_I_PERFORMANCE.DB.DEFAULT_QUERY_LIMIT,
    
    // Budgets & Targets
    budgets: LEI_I_PERFORMANCE.METRICS.BUDGETS,
    targets: LEI_I_PERFORMANCE.METRICS.TARGETS,
  }), [
    tier, 
    connection, 
    shouldAnimate, 
    imgQuality,
    lazyRootMargin,
    virtualOverscan,
    device,
    isDataSaver, 
    prefersReducedMotion,
    getAnimDuration,
  ]);
}

// ============================================
// HOOKS ESPECÍFICOS (LEI I)
// ============================================

/**
 * Hook para animações constitucionais
 */
export function useConstitutionalAnimation() {
  const { shouldAnimate, animationDuration, tier } = useConstitution();
  
  return useMemo(() => ({
    shouldAnimate,
    duration: (base: number = 300) => animationDuration(base),
    ease: tier === 'ultra' || tier === 'high' 
      ? [0.4, 0, 0.2, 1]  // smooth
      : [0.4, 0, 1, 1],    // fast
    skipAnimations: !shouldAnimate,
    // Framer Motion props
    motionProps: shouldAnimate ? {
      initial: { opacity: 0, y: 20 },
      animate: { opacity: 1, y: 0 },
      exit: { opacity: 0, y: -10 },
      transition: {
        duration: animationDuration(300) / 1000,
        ease: [0.4, 0, 0.2, 1],
      },
    } : {
      initial: false,
      animate: { opacity: 1, y: 0 },
      transition: { duration: 0 },
    },
  }), [shouldAnimate, animationDuration, tier]);
}

/**
 * Hook para imagens constitucionais (LEI I Art. 7-9)
 */
export function useConstitutionalImage() {
  const { imageQuality, isDataSaver, isSlowConnection, tier } = useConstitution();
  
  return useMemo(() => ({
    quality: imageQuality,
    loading: 'lazy' as const,
    decoding: 'async' as const,
    shouldLoadImages: !isDataSaver,
    useBlurPlaceholder: !isSlowConnection,
    maxWidth: tier === 'critical' ? 640 : tier === 'low' ? 768 : 1920,
    format: isSlowConnection ? 'webp' : 'auto',
  }), [imageQuality, isDataSaver, isSlowConnection, tier]);
}

/**
 * Hook para virtualização constitucional (LEI I Art. 25-26)
 */
export function useConstitutionalVirtualization() {
  const { overscan, tier } = useConstitution();
  
  return useMemo(() => ({
    overscan,
    threshold: LEI_I_PERFORMANCE.VIRTUAL.VIRTUALIZE_ABOVE,
    shouldVirtualize: (itemCount: number) => itemCount > LEI_I_PERFORMANCE.VIRTUAL.VIRTUALIZE_ABOVE,
    itemHeight: tier === 'low' || tier === 'critical' ? 56 : 64,
  }), [overscan, tier]);
}

/**
 * Hook para lazy loading constitucional (LEI I Art. 4-6)
 */
export function useConstitutionalLazyLoad() {
  const { rootMargin, isSlowConnection } = useConstitution();
  
  return useMemo(() => ({
    rootMargin,
    threshold: 0.01,
    // Em conexões lentas, carrega mais cedo
    prefetchDistance: isSlowConnection ? '800px' : '400px',
  }), [rootMargin, isSlowConnection]);
}

/**
 * Hook para queries constitucionais (LEI I Art. 10-12)
 */
export function useConstitutionalQuery() {
  const { queryLimit, isSlowConnection, tier } = useConstitution();
  
  return useMemo(() => ({
    limit: isSlowConnection ? Math.floor(queryLimit / 2) : queryLimit,
    staleTime: isSlowConnection ? 60_000 : 30_000,
    gcTime: isSlowConnection ? 600_000 : 300_000,
    networkMode: 'offlineFirst' as const,
    refetchOnFocus: false,
    refetchOnReconnect: false,
    retry: tier === 'critical' ? 0 : 1,
  }), [queryLimit, isSlowConnection, tier]);
}

/**
 * Hook para cache React Query por tipo (LEI I Art. 10)
 */
export function useConstitutionalCacheConfig(type: 'realtime' | 'dashboard' | 'list' | 'static' | 'user') {
  const { isSlowConnection } = useConstitution();
  const baseConfig = LEI_I_PERFORMANCE.QUERY.CACHE_CONFIG[type];
  
  return useMemo(() => ({
    staleTime: isSlowConnection ? baseConfig.staleTime * 2 : baseConfig.staleTime,
    gcTime: isSlowConnection ? baseConfig.gcTime * 2 : baseConfig.gcTime,
  }), [baseConfig, isSlowConnection]);
}

// ============================================
// VALIDADORES (LEI I Art. 30-31)
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

/**
 * Hook para CSS classes baseado no tier
 */
export function useConstitutionalClasses() {
  const { tier, shouldAnimate, isSlowConnection, isMobile, isTouch } = useConstitution();
  
  return useMemo(() => {
    const classes: string[] = [`perf-tier-${tier}`];
    
    if (!shouldAnimate) classes.push('perf-no-animations');
    if (isSlowConnection) classes.push('perf-slow-connection');
    if (isMobile) classes.push('perf-mobile');
    if (isTouch) classes.push('perf-touch');
    
    return classes.join(' ');
  }, [tier, shouldAnimate, isSlowConnection, isMobile, isTouch]);
}

export default useConstitution;
