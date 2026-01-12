// ╔══════════════════════════════════════════════════════════════════════════════╗
// ║   🏛️ CONSTITUIÇÃO SYNAPSE - HOOKS DE ENFORCEMENT v5.1                       ║
// ║   LEI I: Performance | LEI II: Dispositivos | LEI III: Segurança            ║
// ║   Adaptado para LEI_I_PERFORMANCE v2.0                                       ║
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
  checkWebVital3G,
  type PerformanceTier,
} from '@/lib/constitution/LEI_I_PERFORMANCE';

// ============================================
// TIPOS CONSTITUCIONAIS
// ============================================

export type ConstitutionTier = PerformanceTier;
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
  targets: typeof LEI_I_PERFORMANCE.METRICS.TARGETS_3G;
}

// ============================================
// DETECÇÃO DE TIER (LEI I Art. 77-78)
// ============================================

function detectTier(): ConstitutionTier {
  if (typeof window === 'undefined') return 'enhanced';
  
  const connection = (navigator as any).connection;
  const memory = (navigator as any).deviceMemory || 4;
  const cores = navigator.hardwareConcurrency || 2;
  
  // Data Saver ativo = critical
  if (connection?.saveData) return 'critical';
  
  // 2G = critical
  if (connection?.effectiveType === '2g' || connection?.effectiveType === 'slow-2g') {
    return 'critical';
  }
  
  // 3G = legacy
  if (connection?.effectiveType === '3g') return 'legacy';
  
  // Hardware fraco = legacy
  if (memory <= 2 || cores <= 2) return 'legacy';
  
  // 4G + hardware médio = standard
  if (connection?.effectiveType === '4g' && memory <= 4) return 'standard';
  
  // Hardware bom = enhanced
  if (cores >= 4 && memory >= 4 && memory < 8) return 'enhanced';
  
  // Hardware muito bom = neural
  if (cores >= 6 && memory >= 8) return 'neural';
  
  // Hardware top = quantum
  if (cores >= 8 && memory >= 8) return 'quantum';
  
  return 'enhanced';
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
  
  // 🖥️ DESKTOP FIRST: macOS/Windows/Linux detection ANTES de Mobi check
  const isMacDesktop = /Mac OS X|Macintosh/i.test(ua) && !/iPhone|iPad/i.test(ua);
  const isWindowsDesktop = /Windows NT/i.test(ua) && !/Phone/i.test(ua);
  const isLinuxDesktop = /Linux/i.test(ua) && !/Android/i.test(ua);
  const isDesktopOS = isMacDesktop || isWindowsDesktop || isLinuxDesktop;
  
  // 📱 Tablet detection
  const isTablet = !isDesktopOS && (/iPad|Tablet/i.test(ua) || (/Android/i.test(ua) && !/Mobile/i.test(ua)));
  
  // 📲 Mobile detection
  const isMobile = !isDesktopOS && !isTablet && /iPhone|iPod|Android.*Mobile|Mobi/i.test(ua);
  
  const isDesktop = isDesktopOS || (!isMobile && !isTablet);
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
  
  // Artigo 34 - Reduced Motion
  const prefersReducedMotion = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);
  
  // Artigo 80 - Data Saver
  const isDataSaver = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return (navigator as any).connection?.saveData === true;
  }, []);
  
  // ============================================
  // FUNÇÕES DE ENFORCEMENT
  // ============================================
  
  // Artigo 35 - Duração de animação
  const getAnimDuration = useCallback((base: number) => {
    if (prefersReducedMotion) return 0;
    return getAnimationDuration(base, tier);
  }, [tier, prefersReducedMotion]);
  
  // Artigo 12 - Qualidade de imagem
  const imgQuality = useMemo(() => getImageQuality(tier), [tier]);
  
  // Artigo 48 - Overscan
  const virtualOverscan = useMemo(() => getOverscan(tier), [tier]);
  
  // Artigo 7 - rootMargin
  const lazyRootMargin = useMemo(() => getRootMargin(tier), [tier]);
  
  // Artigo 34 - Pode animar?
  const shouldAnimate = useMemo(() => {
    if (prefersReducedMotion) return false;
    return canAnimate(tier, prefersReducedMotion);
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
    isLowEnd: tier === 'critical' || tier === 'legacy' || tier === 'standard',
    
    // Functions
    animationDuration: getAnimDuration,
    
    // Config values (LEI I v2.0 format)
    debounceMs: LEI_I_PERFORMANCE.TIMING.DEBOUNCE.search,
    throttleMs: LEI_I_PERFORMANCE.TIMING.THROTTLE.scroll,
    queryLimit: LEI_I_PERFORMANCE.DB.LIMITS.default,
    
    // Budgets & Targets
    budgets: LEI_I_PERFORMANCE.METRICS.BUDGETS,
    targets: LEI_I_PERFORMANCE.METRICS.TARGETS_3G,
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
    ease: tier === 'quantum' || tier === 'neural' 
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
 * Hook para imagens constitucionais (LEI I Art. 10-14)
 */
export function useConstitutionalImage() {
  const { imageQuality, isDataSaver, isSlowConnection, tier } = useConstitution();
  
  return useMemo(() => ({
    quality: imageQuality,
    loading: 'lazy' as const,
    decoding: 'async' as const,
    shouldLoadImages: !isDataSaver,
    useBlurPlaceholder: !isSlowConnection,
    maxWidth: LEI_I_PERFORMANCE.IMAGE.MAX_WIDTH_BY_TIER[tier],
    format: isSlowConnection ? 'webp' : 'auto',
  }), [imageQuality, isDataSaver, isSlowConnection, tier]);
}

/**
 * Hook para virtualização constitucional (LEI I Art. 47-50)
 */
export function useConstitutionalVirtualization() {
  const { overscan, tier } = useConstitution();
  
  return useMemo(() => ({
    overscan,
    threshold: LEI_I_PERFORMANCE.VIRTUAL.VIRTUALIZE_ABOVE,
    shouldVirtualize: (itemCount: number) => itemCount > LEI_I_PERFORMANCE.VIRTUAL.VIRTUALIZE_ABOVE,
    itemHeight: LEI_I_PERFORMANCE.VIRTUAL.ITEM_HEIGHT_BY_TIER[tier],
  }), [overscan, tier]);
}

/**
 * Hook para lazy loading constitucional (LEI I Art. 6-9)
 */
export function useConstitutionalLazyLoad() {
  const { rootMargin, isSlowConnection, tier } = useConstitution();
  
  return useMemo(() => ({
    rootMargin,
    threshold: LEI_I_PERFORMANCE.LAZY.THRESHOLD_BY_TIER[tier],
    // Em conexões lentas, carrega mais cedo
    prefetchDistance: isSlowConnection ? '800px' : '400px',
  }), [rootMargin, isSlowConnection, tier]);
}

/**
 * Hook para queries constitucionais (LEI I Art. 15-21)
 */
export function useConstitutionalQuery() {
  const { queryLimit, isSlowConnection, tier } = useConstitution();
  
  const cacheConfig = LEI_I_PERFORMANCE.QUERY.CACHE_BY_TIER[tier];
  
  return useMemo(() => ({
    limit: isSlowConnection ? Math.floor(queryLimit / 2) : queryLimit,
    staleTime: cacheConfig.staleTime,
    gcTime: cacheConfig.gcTime,
    networkMode: LEI_I_PERFORMANCE.QUERY.NETWORK_MODE,
    refetchOnFocus: LEI_I_PERFORMANCE.QUERY.REFETCH_ON_FOCUS,
    refetchOnReconnect: LEI_I_PERFORMANCE.QUERY.REFETCH_ON_RECONNECT,
    retry: tier === 'critical' ? 0 : LEI_I_PERFORMANCE.QUERY.RETRY.count,
  }), [queryLimit, isSlowConnection, tier, cacheConfig]);
}

/**
 * Hook para cache React Query por tipo (LEI I Art. 16)
 */
export function useConstitutionalCacheConfig(type: 'immutable' | 'config' | 'dashboard' | 'list' | 'user' | 'realtime') {
  const { isSlowConnection } = useConstitution();
  const baseConfig = LEI_I_PERFORMANCE.QUERY.CACHE_BY_TYPE[type];
  
  return useMemo(() => ({
    staleTime: isSlowConnection ? baseConfig.staleTime * 2 : baseConfig.staleTime,
    gcTime: isSlowConnection ? baseConfig.gcTime * 2 : baseConfig.gcTime,
  }), [baseConfig, isSlowConnection]);
}

// ============================================
// VALIDADORES (LEI I Art. 57-60)
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
 * Valida Core Web Vital para 3G
 */
export function useValidateWebVital() {
  return useCallback((metric: keyof typeof LEI_I_PERFORMANCE.METRICS.TARGETS_3G, value: number) => {
    return checkWebVital3G(metric, value);
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

// ============================================
// LOG DE INICIALIZAÇÃO
// ============================================

if (import.meta.env.DEV) {
  console.log('[CONSTITUIÇÃO] ⚡ useConstitution v5.1 carregado (compatível com LEI I v2.0)');
}

export default useConstitution;
