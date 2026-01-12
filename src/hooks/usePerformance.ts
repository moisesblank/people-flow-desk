// ============================================
// 🌌🔥 USE PERFORMANCE — HOOK CENTRAL NÍVEL NASA 🔥🌌
// ANO 2300 — MONITORAMENTO E CONTROLE TOTAL
// ============================================

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { 
  perfFlags, 
  PerformanceConfig, 
  DeviceCapabilities,
  detectDeviceCapabilities,
  getPerformanceConfig 
} from "@/lib/performance/performanceFlags";

// ============================================
// TIPOS
// ============================================
export interface PerformanceMetrics {
  // Core Web Vitals
  lcp: number | null;
  fid: number | null;
  cls: number | null;
  inp: number | null;
  fcp: number | null;
  ttfb: number | null;
  
  // Custom
  tti: number | null;
  tbt: number | null;
  fps: number;
  
  // Resource
  jsSize: number;
  cssSize: number;
  imageSize: number;
  totalSize: number;
  requestCount: number;
  
  // Timing
  domContentLoaded: number | null;
  windowLoad: number | null;
  
  // Status
  isGood: boolean;
  score: number;
}

interface UsePerformanceReturn {
  // Config
  config: PerformanceConfig;
  capabilities: DeviceCapabilities;
  
  // Métricas
  metrics: PerformanceMetrics | null;
  
  // Actions
  enableLiteMode: () => void;
  disableLiteMode: () => void;
  toggleLiteMode: () => void;
  setConfig: <K extends keyof PerformanceConfig>(key: K, value: PerformanceConfig[K]) => void;
  resetConfig: () => void;
  refreshMetrics: () => void;
  
  // Helpers
  shouldLoadFeature: (feature: 'charts' | 'motion' | 'ambient' | 'ultra') => boolean;
  isLiteMode: boolean;
  isLowEnd: boolean;
  isMobile: boolean;
  connectionType: DeviceCapabilities['connection'];
  
  // Backward compatibility properties
  isSlowConnection: boolean;
  disableAnimations: boolean;
  shouldReduceMotion: boolean;
  isLowEndDevice: boolean;
  animationDuration: number;
  isTablet: boolean;
  isDesktop: boolean;
  useLowQualityImages: boolean;
  saveData: boolean;
  effectiveType: string;
}

// ============================================
// COLETAR MÉTRICAS
// ============================================
function collectMetrics(): PerformanceMetrics {
  const metrics: PerformanceMetrics = {
    lcp: null,
    fid: null,
    cls: null,
    inp: null,
    fcp: null,
    ttfb: null,
    tti: null,
    tbt: null,
    fps: 60,
    jsSize: 0,
    cssSize: 0,
    imageSize: 0,
    totalSize: 0,
    requestCount: 0,
    domContentLoaded: null,
    windowLoad: null,
    isGood: true,
    score: 100,
  };

  if (typeof window === 'undefined' || typeof performance === 'undefined') {
    return metrics;
  }

  // Navigation Timing
  const navTiming = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
  
  if (navTiming) {
    metrics.ttfb = navTiming.responseStart - navTiming.requestStart;
    metrics.domContentLoaded = navTiming.domContentLoadedEventEnd - navTiming.startTime;
    metrics.windowLoad = navTiming.loadEventEnd - navTiming.startTime;
  }

  // Resource Timing
  const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
  
  resources.forEach(resource => {
    const size = resource.transferSize || 0;
    metrics.totalSize += size;
    metrics.requestCount++;
    
    if (resource.initiatorType === 'script') {
      metrics.jsSize += size;
    } else if (resource.initiatorType === 'css' || resource.initiatorType === 'link') {
      metrics.cssSize += size;
    } else if (resource.initiatorType === 'img') {
      metrics.imageSize += size;
    }
  });

  // Paint Timing
  const paintEntries = performance.getEntriesByType('paint');
  const fcpEntry = paintEntries.find(entry => entry.name === 'first-contentful-paint');
  if (fcpEntry) {
    metrics.fcp = fcpEntry.startTime;
  }

  // LCP via PerformanceObserver (se disponível nos entries)
  try {
    const lcpEntries = performance.getEntriesByType('largest-contentful-paint');
    if (lcpEntries.length > 0) {
      const lastEntry = lcpEntries[lcpEntries.length - 1] as PerformanceEntry & { startTime: number };
      metrics.lcp = lastEntry.startTime;
    }
  } catch {
    // LCP pode não estar disponível
  }

  // Layout Shift (CLS)
  try {
    const layoutShiftEntries = performance.getEntriesByType('layout-shift');
    metrics.cls = layoutShiftEntries.reduce((sum, entry) => {
      const layoutEntry = entry as PerformanceEntry & { hadRecentInput?: boolean; value?: number };
      if (!layoutEntry.hadRecentInput && layoutEntry.value) {
        return sum + layoutEntry.value;
      }
      return sum;
    }, 0);
  } catch {
    // CLS pode não estar disponível
  }

  // Calcular score
  let score = 100;
  
  // Penalidades baseadas em thresholds
  if (metrics.lcp !== null) {
    if (metrics.lcp > 4000) score -= 30;
    else if (metrics.lcp > 2500) score -= 15;
  }
  
  if (metrics.fcp !== null) {
    if (metrics.fcp > 3000) score -= 20;
    else if (metrics.fcp > 1800) score -= 10;
  }
  
  if (metrics.cls !== null) {
    if (metrics.cls > 0.25) score -= 25;
    else if (metrics.cls > 0.1) score -= 10;
  }
  
  if (metrics.ttfb !== null) {
    if (metrics.ttfb > 600) score -= 15;
    else if (metrics.ttfb > 200) score -= 5;
  }
  
  // Penalizar por tamanho
  if (metrics.jsSize > 500000) score -= 10;
  if (metrics.totalSize > 2000000) score -= 10;
  if (metrics.requestCount > 100) score -= 5;

  metrics.score = Math.max(0, score);
  metrics.isGood = score >= 70;

  return metrics;
}

// ============================================
// HOOK PRINCIPAL
// ============================================
export function usePerformance(): UsePerformanceReturn {
  const [config, setConfigState] = useState<PerformanceConfig>(perfFlags.getConfig());
  const [capabilities] = useState<DeviceCapabilities>(perfFlags.getCapabilities());
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  
  const metricsCollected = useRef(false);

  // Subscribe para mudanças de config
  useEffect(() => {
    const unsubscribe = perfFlags.subscribe((newConfig) => {
      setConfigState(newConfig);
    });
    return unsubscribe;
  }, []);

  // Coletar métricas após load
  useEffect(() => {
    if (metricsCollected.current) return;

    const collect = () => {
      metricsCollected.current = true;
      setMetrics(collectMetrics());
    };

    if (document.readyState === 'complete') {
      setTimeout(collect, 1000);
    } else {
      window.addEventListener('load', () => setTimeout(collect, 1000), { once: true });
    }
  }, []);

  // Actions
  const enableLiteMode = useCallback(() => {
    perfFlags.enableLiteMode();
  }, []);

  const disableLiteMode = useCallback(() => {
    perfFlags.disableLiteMode();
  }, []);

  const toggleLiteMode = useCallback(() => {
    perfFlags.toggleLiteMode();
  }, []);

  const setConfig = useCallback(<K extends keyof PerformanceConfig>(
    key: K, 
    value: PerformanceConfig[K]
  ) => {
    perfFlags.set(key, value);
  }, []);

  const resetConfig = useCallback(() => {
    perfFlags.reset();
  }, []);

  const refreshMetrics = useCallback(() => {
    metricsCollected.current = false;
    setMetrics(collectMetrics());
  }, []);

  // Helper para verificar se deve carregar feature
  const shouldLoadFeature = useCallback((feature: 'charts' | 'motion' | 'ambient' | 'ultra') => {
    return perfFlags.shouldLoadHeavyFeature(feature);
  }, []);

  // 🏛️ PREMIUM GARANTIDO: Forçar valores para consistência visual
  // isSlowConnection ainda calculado para lazy load, mas NUNCA para decisões visuais
  const isSlowConnection = capabilities.connection === '3g' || capabilities.connection === '2g' || capabilities.connection === 'slow';
  // disableAnimations APENAS respeita reduced motion do SO, nunca hardware
  const disableAnimations = capabilities.reducedMotion;
  const shouldReduceMotion = capabilities.reducedMotion;

  return {
    // Config
    config,
    capabilities,
    
    // Métricas
    metrics,
    
    // Actions
    enableLiteMode,
    disableLiteMode,
    toggleLiteMode,
    setConfig,
    resetConfig,
    refreshMetrics,
    
    // Helpers
    shouldLoadFeature,
    isLiteMode: config.liteMode,
    isLowEnd: capabilities.isLowEnd,
    isMobile: capabilities.isMobile,
    connectionType: capabilities.connection,
    
    // Backward compatibility
    isSlowConnection,
    disableAnimations,
    shouldReduceMotion,
    isLowEndDevice: capabilities.isLowEnd,
    animationDuration: config.animationDuration,
    isTablet: capabilities.isTablet,
    isDesktop: !capabilities.isMobile && !capabilities.isTablet,
    useLowQualityImages: isSlowConnection || capabilities.saveData,
    saveData: capabilities.saveData,
    effectiveType: capabilities.connection === 'fast' ? '4g' : capabilities.connection,
  };
}

// ============================================
// HOOKS SIMPLIFICADOS (BACKWARD COMPATIBILITY)
// ============================================

// Network Info hook
interface NetworkInfo {
  isSlowConnection: boolean;
  isMobile: boolean;
  effectiveType: string;
  saveData: boolean;
}

export function useNetworkInfo(): NetworkInfo {
  const [info, setInfo] = useState<NetworkInfo>(() => {
    const caps = detectDeviceCapabilities();
    return {
      isSlowConnection: caps.connection === '3g' || caps.connection === '2g' || caps.connection === 'slow',
      isMobile: caps.isMobile,
      effectiveType: caps.connection === 'fast' ? '4g' : caps.connection === 'medium' ? '4g' : caps.connection,
      saveData: caps.saveData,
    };
  });

  useEffect(() => {
    const updateInfo = () => {
      const caps = detectDeviceCapabilities(true);
      setInfo({
        isSlowConnection: caps.connection === '3g' || caps.connection === '2g' || caps.connection === 'slow',
        isMobile: caps.isMobile,
        effectiveType: caps.connection === 'fast' ? '4g' : caps.connection === 'medium' ? '4g' : caps.connection,
        saveData: caps.saveData,
      });
    };

    const nav = navigator as Navigator & { connection?: EventTarget & { addEventListener: (type: string, listener: () => void) => void; removeEventListener: (type: string, listener: () => void) => void } };
    const connection = nav.connection;
    connection?.addEventListener?.('change', updateInfo);
    window.addEventListener('resize', updateInfo);

    return () => {
      connection?.removeEventListener?.('change', updateInfo);
      window.removeEventListener('resize', updateInfo);
    };
  }, []);

  return info;
}

// Lazy Load hook
interface LazyLoadOptions {
  rootMargin?: string;
  threshold?: number;
}

export function useLazyLoad(options: LazyLoadOptions = {}) {
  const config = getPerformanceConfig();
  const { rootMargin = config.prefetchMargin, threshold = 0.01 } = options;
  const ref = useRef<HTMLElement | null>(null);
  const [isIntersecting, setIsIntersecting] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element || isIntersecting) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsIntersecting(true);
          observer.disconnect();
        }
      },
      { rootMargin, threshold }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [rootMargin, threshold, isIntersecting]);

  return { ref, isIntersecting };
}

// Debounce hook
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

// Throttle hook
export function useThrottle<T extends (...args: unknown[]) => unknown>(
  callback: T,
  delay: number
): T {
  const lastRan = useRef(Date.now());
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  return useCallback(
    ((...args: Parameters<T>) => {
      const now = Date.now();
      if (now - lastRan.current >= delay) {
        lastRan.current = now;
        callback(...args);
      } else {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
          lastRan.current = Date.now();
          callback(...args);
        }, delay - (now - lastRan.current));
      }
    }) as T,
    [callback, delay]
  );
}

// Reduced Motion hook
export function useReducedMotion(): boolean {
  const [reducedMotion, setReducedMotion] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  return reducedMotion;
}

// Viewport hook
export function useViewport() {
  const [viewport, setViewport] = useState(() => ({
    width: typeof window !== 'undefined' ? window.innerWidth : 1200,
    height: typeof window !== 'undefined' ? window.innerHeight : 800,
    isMobile: typeof window !== 'undefined' && window.innerWidth < 768,
    isTablet: typeof window !== 'undefined' && window.innerWidth >= 768 && window.innerWidth < 1024,
    isDesktop: typeof window !== 'undefined' && window.innerWidth >= 1024,
  }));

  useEffect(() => {
    let rafId: number;
    const updateViewport = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        setViewport({
          width: window.innerWidth,
          height: window.innerHeight,
          isMobile: window.innerWidth < 768,
          isTablet: window.innerWidth >= 768 && window.innerWidth < 1024,
          isDesktop: window.innerWidth >= 1024,
        });
      });
    };

    window.addEventListener('resize', updateViewport, { passive: true });
    return () => {
      window.removeEventListener('resize', updateViewport);
      cancelAnimationFrame(rafId);
    };
  }, []);

  return viewport;
}

// Performance Mode (backward compat alias)
export function usePerformanceMode() {
  const network = useNetworkInfo();
  const reducedMotion = useReducedMotion();
  const viewport = useViewport();
  const config = getPerformanceConfig();

  // 🏛️ PREMIUM GARANTIDO: Forçar valores para consistência visual
  return useMemo(() => ({
    isLightMode: false, // NUNCA lite mode para UI
    disableAnimations: reducedMotion, // APENAS respeitar prefers-reduced-motion
    shouldReduceMotion: reducedMotion, // APENAS respeitar prefers-reduced-motion
    useLowQualityImages: network.saveData, // APENAS save-data explícito
    isMobile: viewport.isMobile,
    isTablet: viewport.isTablet,
    isDesktop: viewport.isDesktop,
    isLowEndDevice: false, // NUNCA marcar como low-end para UI
    animationDuration: config.animationDuration,
    connectionType: network.effectiveType,
    metrics: { fps: 60 },
    ...network,
  }), [config, network, reducedMotion, viewport]);
}

// Optimized Animations hook
export function useOptimizedAnimations() {
  const { shouldReduceMotion, isMobile } = usePerformanceMode();
  const config = getPerformanceConfig();
  
  // 🏛️ PREMIUM GARANTIDO: Animações sempre habilitadas (exceto prefers-reduced-motion)
  return useMemo(() => ({
    skipAnimations: shouldReduceMotion,
    duration: shouldReduceMotion ? 0 : isMobile ? 0.15 : 0.25,
    ease: [0.25, 0.1, 0.25, 1] as const,
    stagger: shouldReduceMotion ? 0 : 0.03,
  }), [shouldReduceMotion, isMobile]);
}

export default usePerformance;
