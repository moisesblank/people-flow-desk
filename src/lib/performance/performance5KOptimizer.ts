// ============================================
// ⚡ Ω6: PERFORMANCE 5K + 3G OPTIMIZER
// Otimizações para 5000 usuários simultâneos + 3G
// ============================================

import { TIMING_CONSTITUTION } from '@/lib/constitution/LEI_I_PERFORMANCE';

// ============================================
// CONSTANTES DE PERFORMANCE
// ============================================

export const PERFORMANCE_5K_CONFIG = {
  // Limites de conexão
  MAX_CONCURRENT_REQUESTS: 6,
  MAX_WEBSOCKET_CONNECTIONS: 1,
  
  // Throttling por tier
  THROTTLE_MS: {
    ULTRA: 16,      // 60fps
    HIGH: 33,       // 30fps
    MEDIUM: 50,     // 20fps
    LOW: 100,       // 10fps
    CRITICAL: 200,  // 5fps
  },
  
  // Debounce por ação
  DEBOUNCE_MS: {
    SEARCH: 300,
    INPUT: 150,
    RESIZE: 200,
    SCROLL: 100,
    ANNOTATION_SAVE: 1000,
    CHAT_TYPING: 500,
  },
  
  // Cache TTL (ms)
  CACHE_TTL: {
    STATIC: 86400000,     // 24h
    DYNAMIC: 300000,      // 5min
    REALTIME: 5000,       // 5s
    USER_DATA: 60000,     // 1min
    BOOK_PAGE: 120000,    // 2min
  },
  
  // Prefetch
  PREFETCH: {
    DISTANCE_PX: 800,
    MAX_CONCURRENT: 3,
    BOOK_PAGES_AHEAD: 2,
  },
  
  // Virtualização
  VIRTUALIZATION: {
    OVERSCAN: {
      ULTRA: 8,
      HIGH: 5,
      MEDIUM: 3,
      LOW: 2,
      CRITICAL: 1,
    },
    MIN_ITEM_HEIGHT: 44,
    WINDOW_SIZE: 10,
  },
  
  // Rate Limiting local
  RATE_LIMIT: {
    ANNOTATIONS_PER_MIN: 60,
    CHAT_MESSAGES_PER_MIN: 20,
    PAGE_TURNS_PER_MIN: 120,
    REACTIONS_PER_MIN: 30,
  },
  
  // Compressão
  COMPRESSION: {
    ANNOTATION_MAX_POINTS: 500,  // Reduzir pontos de desenho
    IMAGE_QUALITY_3G: 0.6,
    IMAGE_QUALITY_4G: 0.8,
    IMAGE_QUALITY_WIFI: 0.9,
  },
  
  // 3G Fallbacks
  FALLBACK_3G: {
    DISABLE_ANIMATIONS: true,
    DISABLE_BLUR: true,
    DISABLE_SHADOWS: true,
    REDUCE_IMAGE_SIZE: true,
    DISABLE_PREFETCH: true,
    SIMPLIFIED_UI: true,
  },
} as const;

// ============================================
// TIPOS
// ============================================

export type PerformanceTier = 'ultra' | 'high' | 'medium' | 'low' | 'critical';
export type NetworkType = '4g' | '3g' | '2g' | 'slow-2g' | 'wifi' | 'unknown';

export interface PerformanceMetrics {
  tier: PerformanceTier;
  network: NetworkType;
  cores: number;
  memory: number;
  devicePixelRatio: number;
  saveData: boolean;
  reducedMotion: boolean;
  is3GOrWorse: boolean;
  isLowEnd: boolean;
}

export interface ThrottleOptions {
  leading?: boolean;
  trailing?: boolean;
}

// ============================================
// DETECÇÃO DE PERFORMANCE
// ============================================

/**
 * Detecta tier de performance do dispositivo
 */
export function detectPerformanceTier(): PerformanceMetrics {
  const nav = navigator as any;
  const connection = nav.connection || nav.mozConnection || nav.webkitConnection;
  
  // Valores padrão
  let network: NetworkType = 'unknown';
  let saveData = false;
  
  if (connection) {
    network = connection.effectiveType || 'unknown';
    saveData = connection.saveData || false;
  }
  
  const cores = navigator.hardwareConcurrency || 2;
  const memory = (nav.deviceMemory || 2);
  const dpr = window.devicePixelRatio || 1;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  
  // Calcular tier
  let score = 50;
  
  // Cores
  if (cores >= 8) score += 20;
  else if (cores >= 4) score += 10;
  else if (cores <= 2) score -= 15;
  
  // Memória
  if (memory >= 8) score += 15;
  else if (memory >= 4) score += 5;
  else if (memory <= 2) score -= 20;
  
  // Rede
  if (network === '4g' || network === 'wifi') score += 10;
  else if (network === '3g') score -= 15;
  else if (network === '2g' || network === 'slow-2g') score -= 35;
  
  // SaveData
  if (saveData) score -= 20;
  
  // DPR alto = mais processamento
  if (dpr > 2) score -= 5;
  
  // Reduced motion
  if (reducedMotion) score -= 5;
  
  // Determinar tier
  let tier: PerformanceTier;
  if (score >= 80) tier = 'ultra';
  else if (score >= 60) tier = 'high';
  else if (score >= 40) tier = 'medium';
  else if (score >= 20) tier = 'low';
  else tier = 'critical';
  
  const is3GOrWorse = ['3g', '2g', 'slow-2g'].includes(network);
  const isLowEnd = tier === 'low' || tier === 'critical';
  
  return {
    tier,
    network,
    cores,
    memory,
    devicePixelRatio: dpr,
    saveData,
    reducedMotion,
    is3GOrWorse,
    isLowEnd,
  };
}

// ============================================
// UTILITIES
// ============================================

/**
 * Throttle otimizado com cleanup
 */
export function createThrottle<T extends (...args: any[]) => any>(
  fn: T,
  ms: number,
  options: ThrottleOptions = {}
): T & { cancel: () => void } {
  const { leading = true, trailing = true } = options;
  
  let lastCall = 0;
  let timeout: ReturnType<typeof setTimeout> | null = null;
  let lastArgs: Parameters<T> | null = null;
  
  const throttled = ((...args: Parameters<T>) => {
    const now = Date.now();
    const remaining = ms - (now - lastCall);
    
    lastArgs = args;
    
    if (remaining <= 0 || remaining > ms) {
      if (timeout) {
        clearTimeout(timeout);
        timeout = null;
      }
      lastCall = now;
      if (leading) {
        return fn(...args);
      }
    } else if (!timeout && trailing) {
      timeout = setTimeout(() => {
        lastCall = Date.now();
        timeout = null;
        if (lastArgs) {
          fn(...lastArgs);
        }
      }, remaining);
    }
  }) as T & { cancel: () => void };
  
  throttled.cancel = () => {
    if (timeout) {
      clearTimeout(timeout);
      timeout = null;
    }
    lastArgs = null;
  };
  
  return throttled;
}

/**
 * Debounce otimizado
 */
export function createDebounce<T extends (...args: any[]) => any>(
  fn: T,
  ms: number
): T & { cancel: () => void; flush: () => void } {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  let lastArgs: Parameters<T> | null = null;
  
  const debounced = ((...args: Parameters<T>) => {
    lastArgs = args;
    
    if (timeout) {
      clearTimeout(timeout);
    }
    
    timeout = setTimeout(() => {
      timeout = null;
      if (lastArgs) {
        fn(...lastArgs);
      }
    }, ms);
  }) as T & { cancel: () => void; flush: () => void };
  
  debounced.cancel = () => {
    if (timeout) {
      clearTimeout(timeout);
      timeout = null;
    }
    lastArgs = null;
  };
  
  debounced.flush = () => {
    if (timeout && lastArgs) {
      clearTimeout(timeout);
      timeout = null;
      fn(...lastArgs);
    }
  };
  
  return debounced;
}

/**
 * Request Animation Frame throttle
 */
export function rafThrottle<T extends (...args: any[]) => any>(
  fn: T
): T & { cancel: () => void } {
  let rafId: number | null = null;
  let lastArgs: Parameters<T> | null = null;
  
  const throttled = ((...args: Parameters<T>) => {
    lastArgs = args;
    
    if (rafId === null) {
      rafId = requestAnimationFrame(() => {
        rafId = null;
        if (lastArgs) {
          fn(...lastArgs);
        }
      });
    }
  }) as T & { cancel: () => void };
  
  throttled.cancel = () => {
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
    lastArgs = null;
  };
  
  return throttled;
}

// ============================================
// COMPRESSÃO DE ANOTAÇÕES
// ============================================

export interface AnnotationPoint {
  x: number;
  y: number;
  pressure?: number;
}

/**
 * Simplifica path de anotação (Douglas-Peucker simplificado)
 */
export function simplifyAnnotationPath(
  points: AnnotationPoint[],
  tolerance: number = 2
): AnnotationPoint[] {
  if (points.length < 3) return points;
  
  const maxPoints = PERFORMANCE_5K_CONFIG.COMPRESSION.ANNOTATION_MAX_POINTS;
  
  // Se já está dentro do limite, retornar
  if (points.length <= maxPoints) return points;
  
  // Simplificação por amostragem
  const ratio = Math.ceil(points.length / maxPoints);
  const simplified: AnnotationPoint[] = [points[0]];
  
  for (let i = ratio; i < points.length - 1; i += ratio) {
    simplified.push(points[i]);
  }
  
  simplified.push(points[points.length - 1]);
  
  return simplified;
}

/**
 * Comprime array de anotações para storage
 */
export function compressAnnotations(
  annotations: any[]
): string {
  // Simplificar paths
  const simplified = annotations.map(ann => {
    if (ann.points && Array.isArray(ann.points)) {
      return {
        ...ann,
        points: simplifyAnnotationPath(ann.points),
      };
    }
    return ann;
  });
  
  // Converter para JSON e comprimir (base64)
  const json = JSON.stringify(simplified);
  
  // Em produção, usar compressão real (pako/lz-string)
  // Por ora, retornar JSON diretamente
  return json;
}

/**
 * Descomprime anotações do storage
 */
export function decompressAnnotations(compressed: string): any[] {
  try {
    return JSON.parse(compressed);
  } catch {
    return [];
  }
}

// ============================================
// QUALIDADE DE IMAGEM ADAPTATIVA
// ============================================

/**
 * Determina qualidade de imagem baseado na rede
 */
export function getAdaptiveImageQuality(metrics: PerformanceMetrics): number {
  if (metrics.is3GOrWorse || metrics.saveData) {
    return PERFORMANCE_5K_CONFIG.COMPRESSION.IMAGE_QUALITY_3G;
  }
  
  if (metrics.network === '4g') {
    return PERFORMANCE_5K_CONFIG.COMPRESSION.IMAGE_QUALITY_4G;
  }
  
  return PERFORMANCE_5K_CONFIG.COMPRESSION.IMAGE_QUALITY_WIFI;
}

/**
 * Calcula dimensões otimizadas para imagem
 */
export function getOptimizedImageDimensions(
  originalWidth: number,
  originalHeight: number,
  metrics: PerformanceMetrics
): { width: number; height: number } {
  let maxWidth = originalWidth;
  
  if (metrics.is3GOrWorse || metrics.saveData) {
    maxWidth = Math.min(800, originalWidth);
  } else if (metrics.isLowEnd) {
    maxWidth = Math.min(1200, originalWidth);
  } else {
    maxWidth = Math.min(1920, originalWidth);
  }
  
  const ratio = maxWidth / originalWidth;
  
  return {
    width: Math.round(originalWidth * ratio),
    height: Math.round(originalHeight * ratio),
  };
}

// ============================================
// RATE LIMITER LOCAL
// ============================================

const rateLimitCounters = new Map<string, { count: number; resetAt: number }>();

/**
 * Verifica rate limit local
 */
export function checkLocalRateLimit(
  key: string,
  limit: number,
  windowMs: number = 60000
): { allowed: boolean; remaining: number; resetIn: number } {
  const now = Date.now();
  const entry = rateLimitCounters.get(key);
  
  if (!entry || entry.resetAt < now) {
    // Nova janela
    rateLimitCounters.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1, resetIn: windowMs };
  }
  
  if (entry.count >= limit) {
    return {
      allowed: false,
      remaining: 0,
      resetIn: entry.resetAt - now,
    };
  }
  
  entry.count++;
  return {
    allowed: true,
    remaining: limit - entry.count,
    resetIn: entry.resetAt - now,
  };
}

// ============================================
// PREFETCH MANAGER
// ============================================

const prefetchedUrls = new Set<string>();
const activePrefetches = new Map<string, Promise<void>>();

/**
 * Prefetch inteligente com controle de concorrência
 */
export async function smartPrefetch(
  url: string,
  priority: 'high' | 'low' = 'low'
): Promise<void> {
  // Já foi prefetched
  if (prefetchedUrls.has(url)) return;
  
  // Já está em andamento
  if (activePrefetches.has(url)) {
    return activePrefetches.get(url);
  }
  
  // Verificar limite de concorrência
  if (activePrefetches.size >= PERFORMANCE_5K_CONFIG.PREFETCH.MAX_CONCURRENT) {
    if (priority === 'low') return;
    // Se alta prioridade, esperar um slot
  }
  
  const prefetchPromise = (async () => {
    try {
      if (url.match(/\.(jpg|jpeg|png|webp|gif)$/i)) {
        // Imagem: usar Image object
        await new Promise<void>((resolve, reject) => {
          const img = new Image();
          img.onload = () => resolve();
          img.onerror = reject;
          img.src = url;
        });
      } else {
        // Outros: usar fetch
        await fetch(url, { method: 'HEAD', mode: 'no-cors' });
      }
      
      prefetchedUrls.add(url);
    } finally {
      activePrefetches.delete(url);
    }
  })();
  
  activePrefetches.set(url, prefetchPromise);
  return prefetchPromise;
}

/**
 * Prefetch de páginas de livro
 */
export function prefetchBookPages(
  currentPage: number,
  getPageUrl: (page: number) => string | null,
  totalPages: number,
  metrics: PerformanceMetrics
): void {
  // Não prefetch em 3G
  if (metrics.is3GOrWorse || metrics.saveData) return;
  
  const pagesAhead = metrics.isLowEnd ? 1 : PERFORMANCE_5K_CONFIG.PREFETCH.BOOK_PAGES_AHEAD;
  
  for (let i = 1; i <= pagesAhead; i++) {
    const nextPage = currentPage + i;
    if (nextPage <= totalPages) {
      const url = getPageUrl(nextPage);
      if (url) {
        smartPrefetch(url, i === 1 ? 'high' : 'low');
      }
    }
  }
}

// ============================================
// CSS CLASSES ADAPTATIVAS
// ============================================

/**
 * Gera classes CSS baseadas no tier de performance
 */
export function getPerformanceClasses(metrics: PerformanceMetrics): string {
  const classes: string[] = [];
  
  if (metrics.is3GOrWorse || metrics.saveData) {
    classes.push('perf-3g');
    classes.push('no-animations');
    classes.push('no-blur');
    classes.push('no-shadows');
  } else if (metrics.isLowEnd) {
    classes.push('perf-low');
    classes.push('reduced-animations');
  } else if (metrics.tier === 'high' || metrics.tier === 'ultra') {
    classes.push('perf-high');
  }
  
  if (metrics.reducedMotion) {
    classes.push('reduced-motion');
  }
  
  return classes.join(' ');
}

// ============================================
// EXPORTS
// ============================================

export default {
  PERFORMANCE_5K_CONFIG,
  detectPerformanceTier,
  createThrottle,
  createDebounce,
  rafThrottle,
  simplifyAnnotationPath,
  compressAnnotations,
  decompressAnnotations,
  getAdaptiveImageQuality,
  getOptimizedImageDimensions,
  checkLocalRateLimit,
  smartPrefetch,
  prefetchBookPages,
  getPerformanceClasses,
};
