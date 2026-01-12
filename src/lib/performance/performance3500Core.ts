// ╔══════════════════════════════════════════════════════════════════════════════╗
// ║                                                                              ║
// ║   ⚡ EVANGELHO DA VELOCIDADE - ANO 3500 ⚡                                    ║
// ║   PERFORMANCE QUÂNTICA ABSOLUTA                                              ║
// ║                                                                              ║
// ║   DOGMA SUPREMO: Se roda em 3G, roda em QUALQUER lugar.                      ║
// ║   Este arquivo é a FONTE DA VERDADE de performance.                          ║
// ║                                                                              ║
// ╚══════════════════════════════════════════════════════════════════════════════╝

// ============================================
// CONSTANTES IMUTÁVEIS - ANO 3500
// ============================================

/**
 * Tiers de performance detectados
 * quantum > neural > enhanced > standard > legacy > critical
 */
export type PerformanceTier3500 = 
  | 'quantum'    // Top 5% - Fibra + Desktop i9/M3
  | 'neural'     // Top 15% - Fibra/4G+ + Desktop/Mobile bom
  | 'enhanced'   // Top 35% - 4G + Mobile médio
  | 'standard'   // Top 60% - 4G fraco + Mobile básico
  | 'legacy'     // Top 85% - 3G + Mobile antigo
  | 'critical';  // Bottom 15% - 2G/3G lento + SaveData

export type ConnectionSpeed3500 = 
  | 'fiber'      // >50 Mbps
  | 'wifi'       // 10-50 Mbps
  | '4g'         // 5-10 Mbps
  | '3g'         // 1-5 Mbps
  | '2g'         // <1 Mbps
  | 'offline';   // Sem conexão

/**
 * MÉTRICAS 3G OBRIGATÓRIAS
 * Core Web Vitals para dispositivo 3G básico
 */
export const METRICS_3500 = {
  // Core Web Vitals - Metas 3G
  FCP: 1500,      // First Contentful Paint < 1.5s
  LCP: 2000,      // Largest Contentful Paint < 2.0s
  CLS: 0.08,      // Cumulative Layout Shift < 0.08
  TBT: 200,       // Total Blocking Time < 200ms
  TTI: 3000,      // Time to Interactive < 3.0s
  SI: 2800,       // Speed Index < 2.8s
  FID: 50,        // First Input Delay < 50ms
  INP: 150,       // Interaction to Next Paint < 150ms

  // Budgets de Bundle
  JS_MAX: 350_000,        // 350KB JS (gzipped)
  CSS_MAX: 60_000,        // 60KB CSS (gzipped)
  IMAGES_MAX: 800_000,    // 800KB imagens iniciais
  FONTS_MAX: 100_000,     // 100KB fontes
  TOTAL_MAX: 1_500_000,   // 1.5MB total inicial

  // DOM
  DOM_NODES_MAX: 1200,    // Máximo nós DOM
  DOM_DEPTH_MAX: 15,      // Profundidade máxima
  DOM_CHILDREN_MAX: 60,   // Filhos diretos por nó

  // Requests
  REQUESTS_MAX: 35,       // Máximo requests iniciais
  PARALLEL_MAX: 6,        // Requests paralelos
} as const;

/**
 * CACHE ESTRATIFICADO POR CONEXÃO
 * Otimizado para cada cenário de rede
 */
export const CACHE_STRATEGIES_3500 = {
  // 🔴 CRÍTICO: 2G/SaveData - Cache EXTREMO
  critical: {
    staleTime: 30 * 60 * 1000,      // 30min fresh
    gcTime: 4 * 60 * 60 * 1000,     // 4h em memória
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    networkMode: 'offlineFirst' as const,
    retry: 1,
    retryDelay: 10000,
  },

  // 🟠 LEGACY: 3G - Cache agressivo
  legacy: {
    staleTime: 15 * 60 * 1000,      // 15min fresh
    gcTime: 60 * 60 * 1000,         // 1h em memória
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    networkMode: 'offlineFirst' as const,
    retry: 1,
    retryDelay: 5000,
  },

  // 🟡 STANDARD: 4G básico - Cache balanceado
  standard: {
    staleTime: 5 * 60 * 1000,       // 5min fresh
    gcTime: 30 * 60 * 1000,         // 30min em memória
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    networkMode: 'offlineFirst' as const,
    retry: 2,
    retryDelay: 2000,
  },

  // 🟢 ENHANCED: 4G bom - Cache moderado
  enhanced: {
    staleTime: 2 * 60 * 1000,       // 2min fresh
    gcTime: 15 * 60 * 1000,         // 15min em memória
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    networkMode: 'offlineFirst' as const,
    retry: 2,
    retryDelay: 1000,
  },

  // 🔵 NEURAL: WiFi/Fibra - Performance máxima
  neural: {
    staleTime: 60 * 1000,           // 1min fresh
    gcTime: 10 * 60 * 1000,         // 10min em memória
    refetchOnMount: 'always' as const,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    networkMode: 'online' as const,
    retry: 2,
    retryDelay: 500,
  },

  // ⚡ QUANTUM: Top performance
  quantum: {
    staleTime: 30 * 1000,           // 30s fresh
    gcTime: 5 * 60 * 1000,          // 5min em memória
    refetchOnMount: 'always' as const,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    networkMode: 'online' as const,
    retry: 3,
    retryDelay: 300,
  },
} as const;

/**
 * LAZY LOADING POR CONEXÃO
 * Conexões lentas = prefetch mais cedo
 */
export const LAZY_LOADING_3500 = {
  critical: { rootMargin: '1600px', threshold: 0.001 },
  legacy:   { rootMargin: '1200px', threshold: 0.01 },
  standard: { rootMargin: '800px',  threshold: 0.05 },
  enhanced: { rootMargin: '500px',  threshold: 0.1 },
  neural:   { rootMargin: '300px',  threshold: 0.15 },
  quantum:  { rootMargin: '200px',  threshold: 0.25 },
} as const;

/**
 * ANIMAÇÕES POR TIER
 * Respeita prefers-reduced-motion
 */
export const ANIMATIONS_3500 = {
  // Multiplicador de duração
  durationMultiplier: {
    critical: 0,      // Sem animações
    legacy: 0,        // Sem animações
    standard: 0.4,    // 40% da duração
    enhanced: 0.7,    // 70% da duração
    neural: 0.9,      // 90% da duração
    quantum: 1.0,     // 100% da duração
  },

  // Easing por tier
  easing: {
    critical: 'linear',
    legacy: 'linear',
    standard: 'ease-out',
    enhanced: 'cubic-bezier(0.4, 0, 0.2, 1)',
    neural: 'cubic-bezier(0.4, 0, 0.2, 1)',
    quantum: 'cubic-bezier(0.16, 1, 0.3, 1)',
  },

  // Features desabilitadas por tier
  disabledFeatures: {
    critical: ['blur', 'shadow', 'gradient', 'parallax', 'video-autoplay', 'animations', 'transitions'] as string[],
    legacy: ['blur', 'shadow', 'parallax', 'video-autoplay', 'animations'] as string[],
    standard: ['blur', 'parallax', 'video-autoplay'] as string[],
    enhanced: ['parallax'] as string[],
    neural: [] as string[],
    quantum: [] as string[],
  },
} as const;

/**
 * IMAGENS POR TIER
 */
export const IMAGES_3500 = {
  quality: {
    critical: 30,
    legacy: 45,
    standard: 60,
    enhanced: 75,
    neural: 85,
    quantum: 95,
  },

  maxWidth: {
    critical: 480,
    legacy: 640,
    standard: 800,
    enhanced: 1024,
    neural: 1280,
    quantum: 1920,
  },

  srcset: [320, 480, 640, 768, 1024, 1280, 1536, 1920],
  
  formats: {
    critical: ['webp'],
    legacy: ['webp', 'jpg'],
    standard: ['avif', 'webp', 'jpg'],
    enhanced: ['avif', 'webp', 'jpg'],
    neural: ['avif', 'webp', 'jpg'],
    quantum: ['avif', 'webp', 'jpg'],
  },
} as const;

/**
 * VIRTUALIZAÇÃO POR TIER
 */
export const VIRTUALIZATION_3500 = {
  overscan: {
    critical: 1,
    legacy: 2,
    standard: 3,
    enhanced: 4,
    neural: 6,
    quantum: 10,
  },

  threshold: 40, // Virtualizar listas > 40 itens
  
  itemHeight: {
    critical: 48,
    legacy: 52,
    standard: 56,
    enhanced: 64,
    neural: 72,
    quantum: 80,
  },
} as const;

/**
 * PREFETCH POR TIER
 */
export const PREFETCH_3500 = {
  enabled: {
    critical: false,
    legacy: false,
    standard: true,
    enhanced: true,
    neural: true,
    quantum: true,
  },

  maxConcurrent: {
    critical: 0,
    legacy: 0,
    standard: 2,
    enhanced: 3,
    neural: 4,
    quantum: 6,
  },

  routeDepth: {
    critical: 0,
    legacy: 0,
    standard: 1,
    enhanced: 2,
    neural: 3,
    quantum: 4,
  },
} as const;

// ============================================
// DETECÇÃO DE TIER
// ============================================

export interface DeviceMetrics3500 {
  tier: PerformanceTier3500;
  connection: ConnectionSpeed3500;
  cores: number;
  memory: number;
  dpr: number;
  saveData: boolean;
  reducedMotion: boolean;
  isOffline: boolean;
  is3GOrWorse: boolean;
  isLowEnd: boolean;
  isMobile: boolean;
  score: number;
}

/**
 * Detecta o tier de performance do dispositivo
 * Executa uma vez e cacheia
 */
export function detectPerformanceTier3500(): DeviceMetrics3500 {
  // SSR fallback
  if (typeof window === 'undefined') {
    return {
      tier: 'standard',
      connection: '4g',
      cores: 4,
      memory: 4,
      dpr: 1,
      saveData: false,
      reducedMotion: false,
      isOffline: false,
      is3GOrWorse: false,
      isLowEnd: false,
      isMobile: false,
      score: 50,
    };
  }

  const nav = navigator as any;
  const connection = nav.connection || nav.mozConnection || nav.webkitConnection;
  
  // Coletar métricas
  const cores = navigator.hardwareConcurrency || 2;
  const memory = nav.deviceMemory || 2;
  const dpr = Math.min(window.devicePixelRatio || 1, 3);
  const saveData = connection?.saveData === true;
  const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? false;
  const isOffline = !navigator.onLine;
  const isMobile = (() => {
    const ua = navigator.userAgent;
    // 🖥️ DESKTOP FIRST: Safari no macOS NÃO é mobile
    if (/Mac OS X|Macintosh/i.test(ua) && !/iPhone|iPad/i.test(ua)) return false;
    if (/Windows NT/i.test(ua) && !/Phone/i.test(ua)) return false;
    if (/Linux/i.test(ua) && !/Android/i.test(ua)) return false;
    return /iPhone|iPad|iPod|Android/i.test(ua);
  })();
  
  // Detectar velocidade de conexão
  let connSpeed: ConnectionSpeed3500 = '4g';
  if (isOffline) {
    connSpeed = 'offline';
  } else if (connection) {
    const effectiveType = connection.effectiveType;
    const downlink = connection.downlink || 10;
    
    if (effectiveType === 'slow-2g' || effectiveType === '2g' || downlink < 1) {
      connSpeed = '2g';
    } else if (effectiveType === '3g' || downlink < 5) {
      connSpeed = '3g';
    } else if (effectiveType === '4g' && downlink < 20) {
      connSpeed = '4g';
    } else if (downlink >= 50) {
      connSpeed = 'fiber';
    } else {
      connSpeed = 'wifi';
    }
  }

  // Calcular score (0-100)
  let score = 50;

  // Cores (+25 max)
  if (cores >= 8) score += 25;
  else if (cores >= 6) score += 18;
  else if (cores >= 4) score += 12;
  else if (cores <= 2) score -= 20;

  // Memória (+20 max)
  if (memory >= 8) score += 20;
  else if (memory >= 4) score += 10;
  else if (memory <= 2) score -= 25;

  // Conexão (+25 max)
  if (connSpeed === 'fiber') score += 25;
  else if (connSpeed === 'wifi') score += 18;
  else if (connSpeed === '4g') score += 8;
  else if (connSpeed === '3g') score -= 20;
  else if (connSpeed === '2g') score -= 40;
  else if (connSpeed === 'offline') score -= 50;

  // Penalidades
  if (saveData) score -= 30;
  if (reducedMotion) score -= 5;
  if (dpr > 2.5) score -= 8;
  if (isMobile && memory <= 4) score -= 10;

  // Determinar tier
  let tier: PerformanceTier3500;
  if (score >= 85) tier = 'quantum';
  else if (score >= 70) tier = 'neural';
  else if (score >= 50) tier = 'enhanced';
  else if (score >= 30) tier = 'standard';
  else if (score >= 10) tier = 'legacy';
  else tier = 'critical';

  // Override para saveData ou conexão muito lenta
  if (saveData || connSpeed === '2g') tier = 'critical';
  if (connSpeed === '3g' && tier !== 'critical') tier = 'legacy';

  const is3GOrWorse = ['2g', '3g', 'offline'].includes(connSpeed);
  const isLowEnd = ['critical', 'legacy', 'standard'].includes(tier);

  return {
    tier,
    connection: connSpeed,
    cores,
    memory,
    dpr,
    saveData,
    reducedMotion,
    isOffline,
    is3GOrWorse,
    isLowEnd,
    isMobile,
    score: Math.max(0, Math.min(100, score)),
  };
}

// ============================================
// UTILITÁRIOS
// ============================================

/**
 * Obtém configuração de cache para o tier
 */
export function getCacheConfig3500(tier: PerformanceTier3500) {
  return CACHE_STRATEGIES_3500[tier];
}

/**
 * Obtém configuração de lazy loading para o tier
 */
export function getLazyConfig3500(tier: PerformanceTier3500) {
  return LAZY_LOADING_3500[tier];
}

/**
 * Verifica se deve animar
 */
export function shouldAnimate3500(tier: PerformanceTier3500, reducedMotion: boolean): boolean {
  if (reducedMotion) return false;
  return ANIMATIONS_3500.durationMultiplier[tier] > 0;
}

/**
 * Obtém duração de animação ajustada
 */
export function getAnimationDuration3500(
  baseDuration: number, 
  tier: PerformanceTier3500
): number {
  return Math.round(baseDuration * ANIMATIONS_3500.durationMultiplier[tier]);
}

/**
 * Obtém qualidade de imagem para o tier
 */
export function getImageQuality3500(tier: PerformanceTier3500): number {
  return IMAGES_3500.quality[tier];
}

/**
 * Verifica se feature está habilitada para o tier
 */
export function isFeatureEnabled3500(
  tier: PerformanceTier3500, 
  feature: string
): boolean {
  const disabled = ANIMATIONS_3500.disabledFeatures[tier] as readonly string[];
  return !disabled.includes(feature);
}

/**
 * Obtém overscan para virtualização
 */
export function getOverscan3500(tier: PerformanceTier3500): number {
  return VIRTUALIZATION_3500.overscan[tier];
}

/**
 * Verifica se deve prefetch
 */
export function shouldPrefetch3500(tier: PerformanceTier3500): boolean {
  return PREFETCH_3500.enabled[tier];
}

// ============================================
// SINGLETON DE DETECÇÃO
// ============================================

let cachedMetrics: DeviceMetrics3500 | null = null;

/**
 * Obtém métricas cacheadas (detecta apenas uma vez)
 */
export function getDeviceMetrics3500(): DeviceMetrics3500 {
  if (!cachedMetrics) {
    cachedMetrics = detectPerformanceTier3500();
  }
  return cachedMetrics;
}

/**
 * Força re-detecção (usar apenas se conexão mudar)
 */
export function refreshDeviceMetrics3500(): DeviceMetrics3500 {
  cachedMetrics = detectPerformanceTier3500();
  return cachedMetrics;
}

// ============================================
// LOG DE INICIALIZAÇÃO
// ============================================

if (typeof window !== 'undefined') {
  const metrics = getDeviceMetrics3500();
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║     ⚡ EVANGELHO DA VELOCIDADE - ANO 3500 ⚡                  ║
╠══════════════════════════════════════════════════════════════╣
║  Tier: ${metrics.tier.toUpperCase().padEnd(10)} | Score: ${metrics.score.toString().padStart(3)}/100          ║
║  Conexão: ${metrics.connection.toUpperCase().padEnd(8)} | Cores: ${metrics.cores.toString().padStart(2)} | RAM: ${metrics.memory}GB ║
║  3G/Worse: ${metrics.is3GOrWorse ? 'SIM' : 'NÃO '.padEnd(3)} | SaveData: ${metrics.saveData ? 'SIM' : 'NÃO'}            ║
╚══════════════════════════════════════════════════════════════╝
  `.trim());
}

export default {
  METRICS_3500,
  CACHE_STRATEGIES_3500,
  LAZY_LOADING_3500,
  ANIMATIONS_3500,
  IMAGES_3500,
  VIRTUALIZATION_3500,
  PREFETCH_3500,
  detectPerformanceTier3500,
  getDeviceMetrics3500,
  getCacheConfig3500,
  getLazyConfig3500,
  shouldAnimate3500,
  getAnimationDuration3500,
  getImageQuality3500,
  isFeatureEnabled3500,
  getOverscan3500,
  shouldPrefetch3500,
};