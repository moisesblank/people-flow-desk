// ============================================
// 🏛️ CONSTITUIÇÃO SYNAPSE - PERFORMANCE FLAGS v3
// Controle centralizado de performance + detecção de dispositivo
// Integrado com LEI I (Performance) e LEI II (Dispositivos)
// ============================================

// ============================================
// TIPOS AUXILIARES PARA APIs DO NAVEGADOR
// ============================================
interface NetworkInformation extends EventTarget {
  effectiveType?: '4g' | '3g' | '2g' | 'slow-2g';
  downlink?: number;
  rtt?: number;
  saveData?: boolean;
  addEventListener(type: 'change', listener: () => void): void;
  removeEventListener(type: 'change', listener: () => void): void;
}

// ============================================
// TIPOS PRINCIPAIS
// ============================================
export interface PerformanceConfig {
  // Modo geral
  liteMode: boolean;
  autoLiteMode: boolean;
  
  // UI Effects
  enableMotion: boolean;
  enableAmbientFx: boolean;
  enableUltraEffects: boolean;
  enableBlur: boolean;
  enableShadows: boolean;
  enableGradients: boolean;
  enableParticles: boolean;
  
  // Media
  videoClickToLoad: boolean;
  imageOptimization: boolean;
  lazyLoadImages: boolean;
  useWebP: boolean;
  useAVIF: boolean;
  imageQuality: number;
  
  // Charts
  chartsEnabled: boolean;
  chartsLazyLoad: boolean;
  chartsSimplified: boolean;
  
  // Network
  prefetchEnabled: boolean;
  prefetchMargin: string;
  aggressiveCache: boolean;
  offlineMode: boolean;
  
  // Animation
  animationDuration: number;
  animationStagger: number;
  
  // Debug
  showPerformanceOverlay: boolean;
  logPerformanceMetrics: boolean;
}

export type PerformanceTier = 'quantum' | 'neural' | 'enhanced' | 'standard' | 'legacy' | 'lite';

export interface DeviceCapabilities {
  tier: PerformanceTier;
  score: number;
  cores: number;
  memory: number;
  connection: 'fast' | 'medium' | 'slow' | '3g' | '2g' | 'offline';
  connectionSpeed: number;
  saveData: boolean;
  reducedMotion: boolean;
  isLowEnd: boolean;
  isMobile: boolean;
  isTablet: boolean;
  isTouch: boolean;
  pixelRatio: number;
}

// ============================================
// CONSTANTES
// ============================================
const STORAGE_KEY = 'synapse_perf_config_v3';

// ============================================
// CONFIGURAÇÃO PADRÃO (Desktop/4G)
// ============================================
const DEFAULT_CONFIG: PerformanceConfig = {
  liteMode: false,
  autoLiteMode: true,
  
  enableMotion: true,
  enableAmbientFx: false,
  enableUltraEffects: false,
  enableBlur: true,
  enableShadows: true,
  enableGradients: true,
  enableParticles: false,
  
  videoClickToLoad: true,
  imageOptimization: true,
  lazyLoadImages: true,
  useWebP: true,
  useAVIF: false,
  imageQuality: 75,
  
  chartsEnabled: true,
  chartsLazyLoad: true,
  chartsSimplified: false,
  
  prefetchEnabled: true,
  prefetchMargin: '300px',
  aggressiveCache: true,
  offlineMode: false,
  
  animationDuration: 300,
  animationStagger: 50,
  
  showPerformanceOverlay: false,
  logPerformanceMetrics: false,
};

// ============================================
// CONFIGURAÇÕES POR TIER
// ============================================
const TIER_CONFIGS: Record<PerformanceTier, Partial<PerformanceConfig>> = {
  quantum: {
    liteMode: false,
    enableMotion: true,
    enableAmbientFx: true,
    enableUltraEffects: true,
    enableBlur: true,
    enableShadows: true,
    enableGradients: true,
    enableParticles: true,
    imageQuality: 90,
    chartsSimplified: false,
    prefetchMargin: '200px',
    animationDuration: 300,
    animationStagger: 50,
  },
  neural: {
    liteMode: false,
    enableMotion: true,
    enableAmbientFx: true,
    enableUltraEffects: false,
    enableBlur: true,
    enableShadows: true,
    enableGradients: true,
    enableParticles: false,
    imageQuality: 80,
    chartsSimplified: false,
    prefetchMargin: '300px',
    animationDuration: 280,
    animationStagger: 45,
  },
  enhanced: {
    liteMode: false,
    enableMotion: true,
    enableAmbientFx: false,
    enableUltraEffects: false,
    enableBlur: true,
    enableShadows: true,
    enableGradients: true,
    enableParticles: false,
    imageQuality: 75,
    chartsSimplified: false,
    prefetchMargin: '400px',
    animationDuration: 250,
    animationStagger: 40,
  },
  standard: {
    liteMode: false,
    enableMotion: true,
    enableAmbientFx: false,
    enableUltraEffects: false,
    enableBlur: false,
    enableShadows: true,
    enableGradients: true,
    enableParticles: false,
    imageQuality: 70,
    chartsSimplified: false,
    prefetchMargin: '500px',
    animationDuration: 200,
    animationStagger: 30,
  },
  legacy: {
    liteMode: true,
    enableMotion: false,
    enableAmbientFx: false,
    enableUltraEffects: false,
    enableBlur: false,
    enableShadows: false,
    enableGradients: false,
    enableParticles: false,
    imageQuality: 60,
    chartsSimplified: true,
    prefetchMargin: '800px',
    animationDuration: 0,
    animationStagger: 0,
    prefetchEnabled: false,
  },
  lite: {
    liteMode: true,
    enableMotion: false,
    enableAmbientFx: false,
    enableUltraEffects: false,
    enableBlur: false,
    enableShadows: false,
    enableGradients: false,
    enableParticles: false,
    imageQuality: 50,
    chartsSimplified: true,
    prefetchMargin: '1000px',
    animationDuration: 0,
    animationStagger: 0,
    prefetchEnabled: false,
  },
};

// ============================================
// CACHE DE DETECÇÃO
// ============================================
let cachedCapabilities: DeviceCapabilities | null = null;
let cachedConfig: PerformanceConfig | null = null;

// ============================================
// DETECTAR CAPACIDADES DO DISPOSITIVO
// ============================================
export function detectDeviceCapabilities(forceRefresh = false): DeviceCapabilities {
  if (cachedCapabilities && !forceRefresh) {
    return cachedCapabilities;
  }

  if (typeof window === 'undefined') {
    return {
      tier: 'standard',
      score: 50,
      cores: 4,
      memory: 4,
      connection: 'medium',
      connectionSpeed: 10,
      saveData: false,
      reducedMotion: false,
      isLowEnd: false,
      isMobile: false,
      isTablet: false,
      isTouch: false,
      pixelRatio: 1,
    };
  }

  // Detectar cores
  const cores = navigator.hardwareConcurrency || 4;
  
  // Detectar memória
  const navWithMemory = navigator as Navigator & { deviceMemory?: number };
  const memory = navWithMemory.deviceMemory || 4;
  
  // Detectar conexão
  const navWithConnection = navigator as Navigator & { connection?: NetworkInformation };
  const conn = navWithConnection.connection;
  let connection: DeviceCapabilities['connection'] = 'medium';
  let connectionSpeed = 10;
  let saveData = false;
  
  if (conn) {
    saveData = conn.saveData === true;
    connectionSpeed = conn.downlink || 10;
    const effectiveType = conn.effectiveType;
    
    if (effectiveType === '4g' && connectionSpeed > 5) {
      connection = 'fast';
    } else if (effectiveType === '4g') {
      connection = 'medium';
    } else if (effectiveType === '3g') {
      connection = '3g';
    } else if (effectiveType === '2g' || effectiveType === 'slow-2g') {
      connection = '2g';
    }
  }
  
  if (!navigator.onLine) {
    connection = 'offline';
  }
  
  // Detectar reduced motion
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  
  // Detectar dispositivo
  const ua = navigator.userAgent;
  const isMobile = /Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
  const isTablet = /iPad|Android(?!.*Mobile)/i.test(ua);
  const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  const pixelRatio = window.devicePixelRatio || 1;
  
  // Calcular score (0-120)
  let score = 50;
  
  // Cores: +5 por core acima de 2, max +30
  score += Math.min((cores - 2) * 5, 30);
  
  // Memória: +10 por GB acima de 2, max +40
  score += Math.min((memory - 2) * 10, 40);
  
  // Conexão
  if (connection === 'fast') score += 20;
  else if (connection === 'medium') score += 10;
  else if (connection === '3g') score -= 20;
  else if (connection === '2g') score -= 40;
  else if (connection === 'offline') score -= 10;
  
  // Penalidades
  if (saveData) score -= 30;
  if (isMobile && cores <= 4) score -= 15;
  if (reducedMotion) score -= 10;
  
  // Clamp
  score = Math.max(0, Math.min(120, score));
  
  // Determinar tier
  let tier: PerformanceTier;
  if (score >= 110) tier = 'quantum';
  else if (score >= 85) tier = 'neural';
  else if (score >= 60) tier = 'enhanced';
  else if (score >= 35) tier = 'standard';
  else if (score >= 15) tier = 'legacy';
  else tier = 'lite';
  
  // Low-end?
  const isLowEnd = tier === 'legacy' || tier === 'lite' || 
                   connection === '3g' || connection === '2g' || saveData;
  
  cachedCapabilities = {
    tier,
    score,
    cores,
    memory,
    connection,
    connectionSpeed,
    saveData,
    reducedMotion,
    isLowEnd,
    isMobile,
    isTablet,
    isTouch,
    pixelRatio,
  };
  
  return cachedCapabilities;
}

// ============================================
// OBTER CONFIGURAÇÃO DE PERFORMANCE
// ============================================
export function getPerformanceConfig(forceRefresh = false): PerformanceConfig {
  if (cachedConfig && !forceRefresh) {
    return cachedConfig;
  }

  const capabilities = detectDeviceCapabilities(forceRefresh);
  const tierConfig = TIER_CONFIGS[capabilities.tier];
  
  // Carregar config salva
  let savedConfig: Partial<PerformanceConfig> = {};
  if (typeof localStorage !== 'undefined') {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        savedConfig = JSON.parse(saved);
      }
    } catch {
      // Ignore
    }
  }
  
  // Merge: default < tier < saved
  cachedConfig = {
    ...DEFAULT_CONFIG,
    ...tierConfig,
    ...savedConfig,
    // Forçar reduced motion se usuário pediu
    enableMotion: capabilities.reducedMotion ? false : (savedConfig.enableMotion ?? tierConfig.enableMotion ?? DEFAULT_CONFIG.enableMotion),
  };
  
  return cachedConfig;
}

// ============================================
// SALVAR CONFIGURAÇÃO
// ============================================
export function savePerformanceConfig(config: Partial<PerformanceConfig>): void {
  if (typeof localStorage === 'undefined') return;
  
  try {
    const current = getPerformanceConfig();
    const merged = { ...current, ...config };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
    cachedConfig = merged;
  } catch {
    // Ignore
  }
}

// ============================================
// LISTENER DE MUDANÇAS
// ============================================
export function setupPerformanceListener(
  callback: (config: PerformanceConfig, capabilities: DeviceCapabilities) => void
): () => void {
  if (typeof window === 'undefined') return () => {};

  const handleChange = () => {
    cachedCapabilities = null;
    cachedConfig = null;
    const capabilities = detectDeviceCapabilities(true);
    const config = getPerformanceConfig(true);
    callback(config, capabilities);
  };

  // Conexão
  const navWithConnection = navigator as Navigator & { connection?: NetworkInformation };
  const conn = navWithConnection.connection;
  if (conn) {
    conn.addEventListener('change', handleChange);
  }

  // Online/Offline
  window.addEventListener('online', handleChange);
  window.addEventListener('offline', handleChange);

  // Reduced motion
  const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  motionQuery.addEventListener('change', handleChange);

  return () => {
    if (conn) {
      conn.removeEventListener('change', handleChange);
    }
    window.removeEventListener('online', handleChange);
    window.removeEventListener('offline', handleChange);
    motionQuery.removeEventListener('change', handleChange);
  };
}

// ============================================
// HELPERS RÁPIDOS
// ============================================
export const shouldAnimate = (): boolean => getPerformanceConfig().enableMotion;
export const shouldBlur = (): boolean => getPerformanceConfig().enableBlur;
export const shouldShowParticles = (): boolean => getPerformanceConfig().enableParticles;
export const isLiteMode = (): boolean => getPerformanceConfig().liteMode;
export const getImageQuality = (): number => getPerformanceConfig().imageQuality;
export const getAnimationDuration = (base = 300): number => {
  const config = getPerformanceConfig();
  if (!config.enableMotion) return 0;
  return Math.round(base * (config.animationDuration / 300));
};
export const getPrefetchMargin = (): string => getPerformanceConfig().prefetchMargin;

// ============================================
// CSS CLASSES HELPER
// ============================================
export function getPerformanceClasses(): string {
  const config = getPerformanceConfig();
  const capabilities = detectDeviceCapabilities();
  
  const classes: string[] = [`perf-tier-${capabilities.tier}`];
  
  if (config.liteMode) classes.push('perf-lite');
  if (!config.enableMotion) classes.push('perf-no-motion');
  if (!config.enableBlur) classes.push('perf-no-blur');
  if (!config.enableShadows) classes.push('perf-no-shadows');
  if (!config.enableGradients) classes.push('perf-no-gradients');
  if (capabilities.isLowEnd) classes.push('perf-low-end');
  if (capabilities.isMobile) classes.push('perf-mobile');
  if (capabilities.isTouch) classes.push('perf-touch');
  
  return classes.join(' ');
}

// Log em dev
if (import.meta.env.DEV) {
  console.log('[CONSTITUIÇÃO] ⚡ Performance Flags v3 carregado');
}
