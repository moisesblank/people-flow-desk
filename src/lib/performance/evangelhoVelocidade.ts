// ============================================
// ⚡ EVANGELHO DA VELOCIDADE v2.0 ⚡
// A DIRETRIZ SUPREMA DE PERFORMANCE
// ============================================

export const PERFORMANCE_DOGMAS = {
  MAX_FIRST_PAINT: 100,
  MAX_INTERACTIVE: 300,
  MAX_API_RESPONSE: 200,
  CACHE_STALE_TIME: 30 * 1000,
  CACHE_GC_TIME: 15 * 60 * 1000,
  PREFETCH_DISTANCE: 500,
  BATCH_DELAY: 16,
  OVERSCAN_COUNT: 3,
} as const;

export interface PerformanceTier {
  tier: 'divine' | 'blessed' | 'mortal' | 'challenged';
  score: number;
  recommendations: string[];
}

export function detectPerformanceTier(): PerformanceTier {
  if (typeof window === 'undefined') {
    return { tier: 'mortal', score: 50, recommendations: [] };
  }

  let score = 100;
  const recommendations: string[] = [];
  const cores = navigator.hardwareConcurrency || 2;
  if (cores <= 2) score -= 30;
  
  const memory = (navigator as any).deviceMemory || 4;
  if (memory <= 2) score -= 25;

  const connection = (navigator as any).connection;
  if (connection?.effectiveType === '2g' || connection?.effectiveType === 'slow-2g') {
    score -= 35;
    recommendations.push('Modo economia de dados');
  }

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    recommendations.push('Animações desabilitadas');
  }

  let tier: PerformanceTier['tier'];
  if (score >= 85) tier = 'divine';
  else if (score >= 60) tier = 'blessed';
  else if (score >= 35) tier = 'mortal';
  else tier = 'challenged';

  return { tier, score: Math.max(0, score), recommendations };
}

class SacredCache {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();

  set(key: string, data: any, ttl = PERFORMANCE_DOGMAS.CACHE_STALE_TIME): void {
    if (this.cache.size >= 100) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) this.cache.delete(oldestKey);
    }
    this.cache.set(key, { data, timestamp: Date.now(), ttl });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }
    return entry.data as T;
  }

  has(key: string): boolean {
    return this.get(key) !== null;
  }

  invalidate(pattern?: string): void {
    if (!pattern) { this.cache.clear(); return; }
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) this.cache.delete(key);
    }
  }
}

export const sacredCache = new SacredCache();

class Prefetcher {
  private prefetched = new Set<string>();
  private observer: IntersectionObserver | null = null;

  init(): void {
    if (typeof window === 'undefined' || this.observer) return;
    this.observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          const link = entry.target as HTMLAnchorElement;
          if (link.href && !this.prefetched.has(link.href)) {
            this.prefetch(link.href);
          }
        }
      }
    }, { rootMargin: `${PERFORMANCE_DOGMAS.PREFETCH_DISTANCE}px` });
  }

  observe(element: HTMLElement): void { this.observer?.observe(element); }
  unobserve(element: HTMLElement): void { this.observer?.unobserve(element); }

  prefetch(url: string): void {
    if (this.prefetched.has(url)) return;
    this.prefetched.add(url);
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = url;
    document.head.appendChild(link);
  }
}

class PerformanceMonitor {
  private metrics = { fps: 60, fcp: null as number | null, lcp: null as number | null };

  getMetrics() { return { ...this.metrics }; }
  getPerformanceScore(): number { return this.metrics.fps >= 45 ? 90 : 60; }
  logReport(): void {
    console.log(`[EVANGELHO] Performance Score: ${this.getPerformanceScore()}, FPS: ${this.metrics.fps}`);
  }
}

export const prefetcher = new Prefetcher();
export const performanceMonitor = new PerformanceMonitor();

if (typeof window !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => prefetcher.init());
  } else {
    prefetcher.init();
  }
}
