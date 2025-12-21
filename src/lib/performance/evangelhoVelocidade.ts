// ============================================
// ⚡ EVANGELHO DA VELOCIDADE v3.0 - ANO 2300 ⚡
// DOGMAS I-VIII - Performance Quântica Absoluta
// ============================================
// A Matriz exige velocidade da luz. Nada menos.

export const PERFORMANCE_DOGMAS = {
  // Tempos em milissegundos - padrão 2300
  MAX_FIRST_PAINT: 50,       // Renderização quântica
  MAX_INTERACTIVE: 150,      // Interação neural
  MAX_API_RESPONSE: 100,     // API sub-luminal
  
  // Cache em milissegundos
  CACHE_STALE_TIME: 30 * 1000,
  CACHE_GC_TIME: 15 * 60 * 1000,
  
  // Prefetch e batching
  PREFETCH_DISTANCE: 800,    // Área de detecção expandida
  BATCH_DELAY: 8,            // Frame time otimizado
  OVERSCAN_COUNT: 5,         // Buffer de virtualização
  
  // Database
  MAX_QUERY_TIME: 25,        // Queries sub-quânticas
  MAX_BUNDLE_SIZE: 100 * 1024, // Bundle ultra-compacto
  
  // 2300 Features
  QUANTUM_CACHE_SIZE: 200,   // Cache quântico expandido
  NEURAL_PREFETCH_DEPTH: 3,  // Profundidade de prefetch
  ADAPTIVE_QUALITY_LEVELS: 5, // Níveis de qualidade adaptativa
} as const;

export interface PerformanceTier {
  tier: 'quantum' | 'neural' | 'enhanced' | 'standard' | 'legacy';
  score: number;
  recommendations: string[];
  capabilities: {
    canUseWebGPU: boolean;
    canUseSharedArrayBuffer: boolean;
    canUseOffscreenCanvas: boolean;
    supportsHDR: boolean;
    supports120fps: boolean;
  };
}

export function detectPerformanceTier(): PerformanceTier {
  if (typeof window === 'undefined') {
    return { 
      tier: 'standard', 
      score: 50, 
      recommendations: [],
      capabilities: {
        canUseWebGPU: false,
        canUseSharedArrayBuffer: false,
        canUseOffscreenCanvas: false,
        supportsHDR: false,
        supports120fps: false,
      }
    };
  }
  
  let score = 100;
  const recommendations: string[] = [];
  
  // Análise de hardware avançada
  const cores = navigator.hardwareConcurrency || 2;
  const memory = (navigator as any).deviceMemory || 4;
  const connection = (navigator as any).connection;
  
  // Detecção de capacidades 2300
  const capabilities = {
    canUseWebGPU: 'gpu' in navigator,
    canUseSharedArrayBuffer: typeof SharedArrayBuffer !== 'undefined',
    canUseOffscreenCanvas: typeof OffscreenCanvas !== 'undefined',
    supportsHDR: window.matchMedia('(dynamic-range: high)').matches,
    supports120fps: window.matchMedia('(min-resolution: 120dpi)').matches,
  };
  
  // Scoring baseado em hardware
  if (cores >= 16) score += 10;
  else if (cores >= 8) score += 5;
  else if (cores <= 2) score -= 30;
  
  if (memory >= 16) score += 10;
  else if (memory >= 8) score += 5;
  else if (memory <= 2) score -= 25;
  
  // Scoring baseado em rede
  if (connection) {
    const effectiveType = connection.effectiveType;
    if (effectiveType === '4g') score += 5;
    else if (effectiveType === '3g') score -= 15;
    else if (effectiveType === '2g' || effectiveType === 'slow-2g') {
      score -= 35;
      recommendations.push('⚡ Modo economia de dados ativado');
    }
    
    if (connection.saveData) {
      score -= 20;
      recommendations.push('📡 Data Saver detectado');
    }
  }
  
  // Scoring baseado em capacidades avançadas
  if (capabilities.canUseWebGPU) score += 15;
  if (capabilities.canUseSharedArrayBuffer) score += 5;
  if (capabilities.supportsHDR) score += 5;
  if (capabilities.supports120fps) score += 5;
  
  // Preferências do usuário
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    recommendations.push('🎭 Animações reduzidas por preferência');
  }
  
  // Determinação do tier
  let tier: PerformanceTier['tier'];
  if (score >= 110) tier = 'quantum';
  else if (score >= 85) tier = 'neural';
  else if (score >= 60) tier = 'enhanced';
  else if (score >= 35) tier = 'standard';
  else tier = 'legacy';
  
  return { tier, score: Math.max(0, Math.min(120, score)), recommendations, capabilities };
}

// ============================================
// CACHE QUÂNTICO - v3.0
// ============================================

interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
  ttl: number;
  accessCount: number;
  priority: 'critical' | 'high' | 'normal' | 'low';
}

class QuantumCache {
  private cache = new Map<string, CacheEntry>();
  private maxSize: number;
  private hitCount = 0;
  private missCount = 0;
  
  constructor(maxSize = PERFORMANCE_DOGMAS.QUANTUM_CACHE_SIZE) {
    this.maxSize = maxSize;
  }
  
  set<T>(key: string, data: T, options?: { ttl?: number; priority?: CacheEntry['priority'] }): void {
    const ttl = options?.ttl ?? PERFORMANCE_DOGMAS.CACHE_STALE_TIME;
    const priority = options?.priority ?? 'normal';
    
    // Eviction inteligente baseada em LRU + prioridade
    if (this.cache.size >= this.maxSize) {
      this.evictLeastValuable();
    }
    
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
      accessCount: 0,
      priority
    });
  }
  
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) {
      this.missCount++;
      return null;
    }
    
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      this.missCount++;
      return null;
    }
    
    entry.accessCount++;
    this.hitCount++;
    return entry.data as T;
  }
  
  has(key: string): boolean {
    return this.get(key) !== null;
  }
  
  invalidate(pattern?: string): void {
    if (!pattern) {
      this.cache.clear();
      return;
    }
    
    const regex = new RegExp(pattern);
    for (const key of this.cache.keys()) {
      if (regex.test(key)) this.cache.delete(key);
    }
  }
  
  private evictLeastValuable(): void {
    let leastValuable: string | null = null;
    let lowestScore = Infinity;
    
    const priorityWeight = { critical: 1000, high: 100, normal: 10, low: 1 };
    
    for (const [key, entry] of this.cache.entries()) {
      const age = Date.now() - entry.timestamp;
      const score = (entry.accessCount * priorityWeight[entry.priority]) / (age / 1000);
      
      if (score < lowestScore) {
        lowestScore = score;
        leastValuable = key;
      }
    }
    
    if (leastValuable) this.cache.delete(leastValuable);
  }
  
  getStats() {
    const total = this.hitCount + this.missCount;
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hitRate: total > 0 ? (this.hitCount / total * 100).toFixed(1) + '%' : '0%',
      hits: this.hitCount,
      misses: this.missCount
    };
  }
}

export const sacredCache = new QuantumCache();

// ============================================
// PREFETCHER NEURAL - v3.0
// ============================================

class NeuralPrefetcher {
  private prefetched = new Set<string>();
  private observer: IntersectionObserver | null = null;
  private predictionCache = new Map<string, string[]>();
  
  init(): void {
    if (typeof window === 'undefined' || this.observer) return;
    
    this.observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          const link = entry.target as HTMLAnchorElement;
          if (link.href && !this.prefetched.has(link.href)) {
            this.prefetch(link.href);
            this.predictAndPrefetch(link.href);
          }
        }
      }
    }, { 
      rootMargin: `${PERFORMANCE_DOGMAS.PREFETCH_DISTANCE}px`,
      threshold: 0.1
    });
    
    // Auto-observe all links
    this.observeAllLinks();
  }
  
  private observeAllLinks(): void {
    const links = document.querySelectorAll('a[href^="/"]');
    links.forEach(link => this.observer?.observe(link));
    
    // MutationObserver for dynamic content
    const mutationObserver = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        mutation.addedNodes.forEach((node) => {
          if (node instanceof HTMLElement) {
            const links = node.querySelectorAll('a[href^="/"]');
            links.forEach(link => this.observer?.observe(link));
          }
        });
      }
    });
    
    mutationObserver.observe(document.body, { childList: true, subtree: true });
  }
  
  observe(element: HTMLElement): void {
    this.observer?.observe(element);
  }
  
  unobserve(element: HTMLElement): void {
    this.observer?.unobserve(element);
  }
  
  prefetch(url: string): void {
    if (this.prefetched.has(url)) return;
    this.prefetched.add(url);
    
    // Use rel="preload" for same-origin, prefetch for others
    const link = document.createElement('link');
    const isSameOrigin = new URL(url, window.location.origin).origin === window.location.origin;
    link.rel = isSameOrigin ? 'preload' : 'prefetch';
    link.as = 'document';
    link.href = url;
    document.head.appendChild(link);
  }
  
  private predictAndPrefetch(currentUrl: string): void {
    // Prefetch relacionado baseado em padrões
    const predictions = this.predictionCache.get(currentUrl);
    if (predictions) {
      predictions.slice(0, PERFORMANCE_DOGMAS.NEURAL_PREFETCH_DEPTH).forEach(url => {
        this.prefetch(url);
      });
    }
  }
  
  setPredictions(url: string, relatedUrls: string[]): void {
    this.predictionCache.set(url, relatedUrls);
  }
  
  getStats() {
    return {
      prefetchedCount: this.prefetched.size,
      predictionsCount: this.predictionCache.size
    };
  }
}

// ============================================
// PERFORMANCE MONITOR NEURAL - v3.0
// ============================================

class NeuralPerformanceMonitor {
  private metrics = {
    fps: 60,
    fcp: null as number | null,
    lcp: null as number | null,
    cls: 0,
    fid: null as number | null,
    ttfb: null as number | null
  };
  
  private frameCount = 0;
  private lastFrameTime = performance.now();
  private isMonitoring = false;
  
  startMonitoring(): void {
    if (this.isMonitoring || typeof window === 'undefined') return;
    this.isMonitoring = true;
    
    // FPS monitoring
    const measureFPS = () => {
      const now = performance.now();
      this.frameCount++;
      
      if (now - this.lastFrameTime >= 1000) {
        this.metrics.fps = this.frameCount;
        this.frameCount = 0;
        this.lastFrameTime = now;
      }
      
      if (this.isMonitoring) {
        requestAnimationFrame(measureFPS);
      }
    };
    
    requestAnimationFrame(measureFPS);
  }
  
  stopMonitoring(): void {
    this.isMonitoring = false;
  }
  
  updateMetric(name: keyof typeof this.metrics, value: number): void {
    (this.metrics as any)[name] = value;
  }
  
  getMetrics() {
    return { ...this.metrics };
  }
  
  getPerformanceScore(): number {
    let score = 100;
    
    // FPS scoring
    if (this.metrics.fps < 30) score -= 30;
    else if (this.metrics.fps < 45) score -= 15;
    else if (this.metrics.fps < 55) score -= 5;
    
    // LCP scoring
    if (this.metrics.lcp !== null) {
      if (this.metrics.lcp > 4000) score -= 20;
      else if (this.metrics.lcp > 2500) score -= 10;
    }
    
    // CLS scoring
    if (this.metrics.cls > 0.25) score -= 20;
    else if (this.metrics.cls > 0.1) score -= 10;
    
    return Math.max(0, Math.min(100, score));
  }
  
  logReport(): void {
    const score = this.getPerformanceScore();
    const tier = detectPerformanceTier();
    
    console.log(`
╔══════════════════════════════════════════════════════════╗
║       ⚡ EVANGELHO DA VELOCIDADE v3.0 - RELATÓRIO ⚡       ║
╠══════════════════════════════════════════════════════════╣
║  Performance Score: ${score}/100                            ║
║  Device Tier: ${tier.tier.toUpperCase().padEnd(10)}                           ║
║  FPS: ${String(this.metrics.fps).padEnd(5)} | LCP: ${this.metrics.lcp ? this.metrics.lcp + 'ms' : 'N/A'}              ║
║  CLS: ${this.metrics.cls.toFixed(3).padEnd(5)} | FID: ${this.metrics.fid ? this.metrics.fid + 'ms' : 'N/A'}              ║
║  Cache: ${sacredCache.getStats().hitRate} hit rate                       ║
║  Prefetch: ${prefetcher.getStats().prefetchedCount} URLs                           ║
╚══════════════════════════════════════════════════════════╝
    `.trim());
  }
}

export const prefetcher = new NeuralPrefetcher();
export const performanceMonitor = new NeuralPerformanceMonitor();

// ============================================
// AUTO-INICIALIZAÇÃO QUÂNTICA
// ============================================

if (typeof window !== 'undefined') {
  const init = () => {
    prefetcher.init();
    performanceMonitor.startMonitoring();
    
    // Log inicial
    const tier = detectPerformanceTier();
    console.log(`[EVANGELHO v3.0] ⚡ Tier: ${tier.tier} (${tier.score}/120)`);
    if (tier.recommendations.length > 0) {
      tier.recommendations.forEach(r => console.log(`[EVANGELHO] ${r}`));
    }
  };
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
}
