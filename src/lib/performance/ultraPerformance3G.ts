// ╔══════════════════════════════════════════════════════════════════════════════╗
// ║                                                                              ║
// ║   ⚡ ULTRA PERFORMANCE 3G v5.0 - MODO AGRESSIVO ⚡                            ║
// ║   PHD-Level Performance Optimization                                         ║
// ║                                                                              ║
// ║   DOGMA SUPREMO: 5000 usuários simultâneos em 3G = ZERO lag                  ║
// ║                                                                              ║
// ╚══════════════════════════════════════════════════════════════════════════════╝

// ============================================
// TIER DETECTION - Ultra preciso
// ============================================

/**
 * 🏛️ LEI I v2.0 - 6 TIERS OFICIAIS DA CONSTITUIÇÃO
 * critical → legacy → standard → enhanced → neural → quantum
 * MANTENDO ALIAS para retrocompatibilidade
 */
export type UltraTier = 
  | 'quantum'    // Top 5% - Fibra + Desktop i9/M3
  | 'neural'     // Top 15% - Fibra/4G+ + Desktop/Mobile bom
  | 'enhanced'   // Top 35% - 4G + Mobile médio
  | 'standard'   // Top 60% - 4G fraco + Mobile básico
  | 'legacy'     // Top 85% - 3G + Mobile antigo
  | 'critical';  // Bottom 15% - 2G/SaveData + Hardware fraco

// Alias para retrocompatibilidade
export type LegacyTier = 'ultra' | 'high' | 'medium' | 'low' | 'critical';
const TIER_ALIAS: Record<LegacyTier, UltraTier> = {
  ultra: 'quantum',
  high: 'neural',
  medium: 'enhanced',
  low: 'legacy',
  critical: 'critical',
};

export interface UltraPerformanceState {
  tier: UltraTier;
  connection: {
    type: string;
    downlink: number;
    rtt: number;
    saveData: boolean;
    effectiveType: string;
  };
  device: {
    cores: number;
    memory: number;
    isLowEnd: boolean;
    isMobile: boolean;
    dpr: number;
  };
  flags: {
    enableAnimations: boolean;
    enableBlur: boolean;
    enableShadows: boolean;
    enableParticles: boolean;
    enableVideoAutoplay: boolean;
    enablePrefetch: boolean;
    enableHDImages: boolean;
    enableGradients: boolean;
    reduceMotion: boolean;
  };
  budgets: {
    jsMax: number;
    cssMax: number;
    imagesMax: number;
    fontsMax: number;
    requestsMax: number;
  };
  cache: {
    staleTime: number;
    gcTime: number;
  };
  animation: {
    duration: number;
    stagger: number;
    easing: string;
  };
  image: {
    quality: number;
    maxWidth: number;
    format: 'webp' | 'avif' | 'jpeg';
  };
  lazy: {
    rootMargin: string;
    threshold: number;
  };
}

// ============================================
// DETECTION FUNCTIONS
// ============================================

function getConnectionInfo() {
  if (typeof navigator === 'undefined') {
    return { type: 'unknown', downlink: 10, rtt: 50, saveData: false, effectiveType: '4g' };
  }
  
  const conn = (navigator as any).connection || 
               (navigator as any).mozConnection || 
               (navigator as any).webkitConnection;
  
  return {
    type: conn?.type || 'unknown',
    downlink: conn?.downlink || 10,
    rtt: conn?.rtt || 50,
    saveData: conn?.saveData || false,
    effectiveType: conn?.effectiveType || '4g',
  };
}

function getDeviceInfo() {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return { cores: 4, memory: 4, isLowEnd: false, isMobile: false, dpr: 1 };
  }
  
  const cores = navigator.hardwareConcurrency || 4;
  const memory = (navigator as any).deviceMemory || 4;
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  const dpr = window.devicePixelRatio || 1;
  const isLowEnd = cores <= 2 || memory <= 2 || (isMobile && memory <= 4);
  
  return { cores, memory, isLowEnd, isMobile, dpr };
}

/**
 * 🏛️ LEI I v2.0 - Detecta tier usando nomenclatura oficial
 */
function detectTier(connection: ReturnType<typeof getConnectionInfo>, device: ReturnType<typeof getDeviceInfo>): UltraTier {
  const { effectiveType, saveData, downlink, rtt } = connection;
  const { isLowEnd, cores, memory } = device;
  
  // CRITICAL: 2G, SaveData, ou hardware muito fraco
  if (saveData || effectiveType === '2g' || effectiveType === 'slow-2g') {
    return 'critical';
  }
  
  // LEGACY: 3G ou hardware fraco
  if (effectiveType === '3g' || isLowEnd || cores <= 2 || memory <= 2) {
    return 'legacy';
  }
  
  // STANDARD: 4G fraco ou hardware médio
  if (downlink < 5 || rtt > 150 || memory <= 4) {
    return 'standard';
  }
  
  // ENHANCED: 4G bom
  if (downlink < 20 || effectiveType === '4g') {
    return 'enhanced';
  }
  
  // NEURAL: WiFi bom
  if (downlink < 50) {
    return 'neural';
  }
  
  // QUANTUM: Fibra/WiFi + hardware top
  return 'quantum';
}

function getReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

// ============================================
// TIER CONFIGURATIONS - Ultra detalhado
// ============================================

// 🏛️ LEI I v2.0 - Configurações por tier oficial
const TIER_CONFIG: Record<UltraTier, Omit<UltraPerformanceState, 'tier' | 'connection' | 'device'>> = {
  critical: {
    flags: {
      enableAnimations: false,
      enableBlur: false,
      enableShadows: false,
      enableParticles: false,
      enableVideoAutoplay: false,
      enablePrefetch: false,
      enableHDImages: false,
      enableGradients: false,
      reduceMotion: true,
    },
    budgets: {
      jsMax: 150_000,      // 150KB JS
      cssMax: 30_000,      // 30KB CSS
      imagesMax: 200_000,  // 200KB imagens
      fontsMax: 50_000,    // 50KB fontes
      requestsMax: 15,     // 15 requests
    },
    cache: {
      staleTime: 60 * 60 * 1000,     // 1 hora
      gcTime: 4 * 60 * 60 * 1000,    // 4 horas
    },
    animation: {
      duration: 0,
      stagger: 0,
      easing: 'linear',
    },
    image: {
      quality: 30,
      maxWidth: 640,
      format: 'webp',
    },
    lazy: {
      rootMargin: '2000px',  // Prefetch MUITO cedo
      threshold: 0.001,
    },
  },
  
  
  legacy: {
    flags: {
      enableAnimations: false,
      enableBlur: false,
      enableShadows: false,
      enableParticles: false,
      enableVideoAutoplay: false,
      enablePrefetch: true,
      enableHDImages: false,
      enableGradients: false,
      reduceMotion: true,
    },
    budgets: {
      jsMax: 250_000,
      cssMax: 50_000,
      imagesMax: 400_000,
      fontsMax: 80_000,
      requestsMax: 25,
    },
    cache: {
      staleTime: 30 * 60 * 1000,
      gcTime: 2 * 60 * 60 * 1000,
    },
    animation: {
      duration: 0,
      stagger: 0,
      easing: 'linear',
    },
    image: {
      quality: 45,
      maxWidth: 768,
      format: 'webp',
    },
    lazy: {
      rootMargin: '1200px',
      threshold: 0.01,
    },
  },
  
  standard: {
    flags: {
      enableAnimations: true,
      enableBlur: false,
      enableShadows: true,
      enableParticles: false,
      enableVideoAutoplay: false,
      enablePrefetch: true,
      enableHDImages: false,
      enableGradients: true,
      reduceMotion: false,
    },
    budgets: {
      jsMax: 400_000,
      cssMax: 80_000,
      imagesMax: 600_000,
      fontsMax: 100_000,
      requestsMax: 35,
    },
    cache: {
      staleTime: 5 * 60 * 1000,
      gcTime: 30 * 60 * 1000,
    },
    animation: {
      duration: 150,
      stagger: 30,
      easing: 'ease-out',
    },
    image: {
      quality: 65,
      maxWidth: 1024,
      format: 'webp',
    },
    lazy: {
      rootMargin: '600px',
      threshold: 0.05,
    },
  },
  
  
  enhanced: {
    flags: {
      enableAnimations: true,
      enableBlur: true,
      enableShadows: true,
      enableParticles: false,
      enableVideoAutoplay: true,
      enablePrefetch: true,
      enableHDImages: true,
      enableGradients: true,
      reduceMotion: false,
    },
    budgets: {
      jsMax: 600_000,
      cssMax: 120_000,
      imagesMax: 1_000_000,
      fontsMax: 150_000,
      requestsMax: 50,
    },
    cache: {
      staleTime: 2 * 60 * 1000,
      gcTime: 15 * 60 * 1000,
    },
    animation: {
      duration: 250,
      stagger: 50,
      easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
    },
    image: {
      quality: 80,
      maxWidth: 1920,
      format: 'webp',
    },
    lazy: {
      rootMargin: '400px',
      threshold: 0.1,
    },
  },
  
  neural: {
    flags: {
      enableAnimations: true,
      enableBlur: true,
      enableShadows: true,
      enableParticles: false,
      enableVideoAutoplay: true,
      enablePrefetch: true,
      enableHDImages: true,
      enableGradients: true,
      reduceMotion: false,
    },
    budgets: {
      jsMax: 800_000,
      cssMax: 150_000,
      imagesMax: 1_500_000,
      fontsMax: 180_000,
      requestsMax: 60,
    },
    cache: {
      staleTime: 60 * 1000,
      gcTime: 10 * 60 * 1000,
    },
    animation: {
      duration: 300,
      stagger: 60,
      easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
    },
    image: {
      quality: 85,
      maxWidth: 1920,
      format: 'avif',
    },
    lazy: {
      rootMargin: '300px',
      threshold: 0.15,
    },
  },
  
  quantum: {
    flags: {
      enableAnimations: true,
      enableBlur: true,
      enableShadows: true,
      enableParticles: true,
      enableVideoAutoplay: true,
      enablePrefetch: true,
      enableHDImages: true,
      enableGradients: true,
      reduceMotion: false,
    },
    budgets: {
      jsMax: 1_000_000,
      cssMax: 200_000,
      imagesMax: 2_000_000,
      fontsMax: 200_000,
      requestsMax: 80,
    },
    cache: {
      staleTime: 30 * 1000,
      gcTime: 5 * 60 * 1000,
    },
    animation: {
      duration: 350,
      stagger: 80,
      easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
    },
    image: {
      quality: 90,
      maxWidth: 2560,
      format: 'avif',
    },
    lazy: {
      rootMargin: '200px',
      threshold: 0.2,
    },
  },
};

// ============================================
// MAIN DETECTION FUNCTION
// ============================================

let cachedState: UltraPerformanceState | null = null;

export function detectUltraPerformance(forceRefresh = false): UltraPerformanceState {
  if (cachedState && !forceRefresh) {
    return cachedState;
  }
  
  const connection = getConnectionInfo();
  const device = getDeviceInfo();
  const tier = detectTier(connection, device);
  const config = TIER_CONFIG[tier];
  const reducedMotion = getReducedMotion();
  
  // Aplica reduced motion se usuário solicitou
  const flags = { ...config.flags };
  if (reducedMotion) {
    flags.enableAnimations = false;
    flags.reduceMotion = true;
  }
  
  cachedState = {
    tier,
    connection,
    device,
    flags,
    budgets: config.budgets,
    cache: config.cache,
    animation: reducedMotion 
      ? { duration: 0, stagger: 0, easing: 'linear' } 
      : config.animation,
    image: config.image,
    lazy: config.lazy,
  };
  
  // Log apenas em dev
  if (import.meta.env.DEV) {
    console.log(`[ULTRA-PERF] ⚡ Tier: ${tier.toUpperCase()}`, {
      connection: `${connection.effectiveType} (${connection.downlink}Mbps, ${connection.rtt}ms)`,
      device: `${device.cores} cores, ${device.memory}GB RAM`,
      flags: Object.entries(flags).filter(([_, v]) => v).map(([k]) => k).join(', '),
    });
  }
  
  return cachedState;
}

// ============================================
// CONVENIENCE FUNCTIONS
// ============================================

export function isLowEndExperience(): boolean {
  const state = detectUltraPerformance();
  return state.tier === 'critical' || state.tier === 'legacy' || state.tier === 'standard';
}

export function shouldAnimate(): boolean {
  const state = detectUltraPerformance();
  return state.flags.enableAnimations && !state.flags.reduceMotion;
}

export function shouldUseBlur(): boolean {
  const state = detectUltraPerformance();
  return state.flags.enableBlur;
}

export function getImageQuality(): number {
  const state = detectUltraPerformance();
  return state.image.quality;
}

export function getAnimationDuration(baseDuration: number = 300): number {
  const state = detectUltraPerformance();
  return state.flags.enableAnimations ? state.animation.duration : 0;
}

export function getLazyLoadMargin(): string {
  const state = detectUltraPerformance();
  return state.lazy.rootMargin;
}

export function getCacheStaleTime(): number {
  const state = detectUltraPerformance();
  return state.cache.staleTime;
}

// ============================================
// LISTENER FOR NETWORK CHANGES
// ============================================

export function setupPerformanceListener(callback: (state: UltraPerformanceState) => void): () => void {
  if (typeof navigator === 'undefined') return () => {};
  
  const conn = (navigator as any).connection;
  if (!conn) return () => {};
  
  const handler = () => {
    cachedState = null; // Force refresh
    callback(detectUltraPerformance(true));
  };
  
  conn.addEventListener('change', handler);
  
  // Also listen for reduced motion changes
  const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  motionQuery.addEventListener('change', handler);
  
  return () => {
    conn.removeEventListener('change', handler);
    motionQuery.removeEventListener('change', handler);
  };
}

// ============================================
// CSS CLASSES HELPER
// ============================================

export function getPerformanceClasses(): string {
  const state = detectUltraPerformance();
  const classes: string[] = [`perf-tier-${state.tier}`];
  
  if (!state.flags.enableAnimations) classes.push('perf-no-animations');
  if (!state.flags.enableBlur) classes.push('perf-no-blur');
  if (!state.flags.enableShadows) classes.push('perf-no-shadows');
  if (!state.flags.enableParticles) classes.push('perf-no-particles');
  if (!state.flags.enableGradients) classes.push('perf-no-gradients');
  if (state.flags.reduceMotion) classes.push('perf-reduced-motion');
  
  return classes.join(' ');
}

// ============================================
// PERFORMANCE BUDGET VALIDATOR
// ============================================

export interface BudgetViolation {
  metric: string;
  current: number;
  max: number;
  severity: 'warning' | 'error';
}

export function validatePerformanceBudget(metrics: {
  jsSize?: number;
  cssSize?: number;
  imagesSize?: number;
  fontsSize?: number;
  requestCount?: number;
}): BudgetViolation[] {
  const state = detectUltraPerformance();
  const violations: BudgetViolation[] = [];
  
  if (metrics.jsSize && metrics.jsSize > state.budgets.jsMax) {
    violations.push({
      metric: 'JS Size',
      current: metrics.jsSize,
      max: state.budgets.jsMax,
      severity: metrics.jsSize > state.budgets.jsMax * 1.5 ? 'error' : 'warning',
    });
  }
  
  if (metrics.cssSize && metrics.cssSize > state.budgets.cssMax) {
    violations.push({
      metric: 'CSS Size',
      current: metrics.cssSize,
      max: state.budgets.cssMax,
      severity: metrics.cssSize > state.budgets.cssMax * 1.5 ? 'error' : 'warning',
    });
  }
  
  if (metrics.imagesSize && metrics.imagesSize > state.budgets.imagesMax) {
    violations.push({
      metric: 'Images Size',
      current: metrics.imagesSize,
      max: state.budgets.imagesMax,
      severity: 'warning',
    });
  }
  
  if (metrics.requestCount && metrics.requestCount > state.budgets.requestsMax) {
    violations.push({
      metric: 'Request Count',
      current: metrics.requestCount,
      max: state.budgets.requestsMax,
      severity: metrics.requestCount > state.budgets.requestsMax * 1.5 ? 'error' : 'warning',
    });
  }
  
  return violations;
}
