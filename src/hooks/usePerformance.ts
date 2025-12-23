// ============================================
// 🌌🔥 USE PERFORMANCE — HOOK CENTRAL NÍVEL NASA 🔥🌌
// ANO 2300 — MONITORAMENTO E CONTROLE TOTAL
// ESTE É O PROJETO DA VIDA DO MESTRE MOISÉS MEDEIROS
// ============================================

import { useState, useEffect, useCallback, useRef } from "react";
import { perfFlags, PerformanceConfig, DeviceCapabilities } from "@/lib/performance/performanceFlags";

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
    metrics.domContentLoaded = navTiming.domContentLoadedEventEnd - navTiming.navigationStart;
    metrics.windowLoad = navTiming.loadEventEnd - navTiming.navigationStart;
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
      // Aguardar um pouco para garantir que todas as métricas estão disponíveis
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
    setMetrics(collectMetrics());
  }, []);

  const shouldLoadFeature = useCallback((feature: 'charts' | 'motion' | 'ambient' | 'ultra') => {
    return perfFlags.shouldLoadHeavyFeature(feature);
  }, []);

  return {
    config,
    capabilities,
    metrics,
    enableLiteMode,
    disableLiteMode,
    toggleLiteMode,
    setConfig,
    resetConfig,
    refreshMetrics,
    shouldLoadFeature,
    isLiteMode: config.liteMode,
    isLowEnd: capabilities.isLowEnd,
    isMobile: capabilities.isMobile,
    connectionType: capabilities.connection,
  };
}

export default usePerformance;
