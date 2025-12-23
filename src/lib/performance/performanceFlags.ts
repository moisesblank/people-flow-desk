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

// 🏛️ LEI I v2.0 - 6 tiers oficiais
export type PerformanceTier = 'quantum' | 'neural' | 'enhanced' | 'standard' | 'legacy' | 'critical';

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
  critical: {
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
  else tier = 'critical';
  
  // Low-end?
  const isLowEnd = tier === 'legacy' || tier === 'critical' || 
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

// ============================================
// LITE MODE CONFIG
// ============================================
const LITE_CONFIG: Partial<PerformanceConfig> = {
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
  prefetchEnabled: false,
  prefetchMargin: '1000px',
  animationDuration: 0,
  animationStagger: 0,
};

// ============================================
// CLASSE PRINCIPAL - SINGLETON MANAGER
// ============================================
class PerformanceFlagsManager {
  private config: PerformanceConfig;
  private capabilities: DeviceCapabilities;
  private listeners: Set<(config: PerformanceConfig) => void> = new Set();
  private initialized = false;

  constructor() {
    this.capabilities = detectDeviceCapabilities();
    this.config = getPerformanceConfig();
  }

  // Inicializar (chamar no app start)
  init(): void {
    if (this.initialized) return;
    this.initialized = true;

    // Auto-aplicar lite mode se necessário
    if (this.config.autoLiteMode && this.capabilities.isLowEnd) {
      this.enableLiteMode();
      if (import.meta.env.DEV) {
        console.log('[PERF] 🔋 Lite Mode ativado automaticamente');
      }
    }

    // Observar mudanças de conexão
    const navWithConnection = navigator as Navigator & { connection?: NetworkInformation };
    if (typeof navigator !== 'undefined' && navWithConnection.connection) {
      navWithConnection.connection.addEventListener('change', () => {
        this.capabilities = detectDeviceCapabilities(true);
        if (this.config.autoLiteMode && this.capabilities.isLowEnd && !this.config.liteMode) {
          this.enableLiteMode();
        }
      });
    }

    // Observar prefers-reduced-motion
    if (typeof window !== 'undefined') {
      window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', (e) => {
        if (e.matches) {
          this.set('enableMotion', false);
        }
      });
    }

    // Log inicial em dev
    if (import.meta.env.DEV) {
      console.log(`[PERF] ⚡ Tier: ${this.capabilities.tier} (${this.capabilities.score}/120)`);
      console.log(`[PERF] 📶 Connection: ${this.capabilities.connection}`);
      console.log(`[PERF] 🔋 Lite: ${this.config.liteMode ? 'ON' : 'OFF'}`);
    }
  }

  // Obter valor
  get<K extends keyof PerformanceConfig>(key: K): PerformanceConfig[K] {
    return this.config[key];
  }

  // Definir valor
  set<K extends keyof PerformanceConfig>(key: K, value: PerformanceConfig[K]): void {
    this.config[key] = value;
    savePerformanceConfig({ [key]: value });
    this.notify();
  }

  // Obter config completa
  getConfig(): Readonly<PerformanceConfig> {
    return { ...this.config };
  }

  // Obter capabilities
  getCapabilities(): Readonly<DeviceCapabilities> {
    return { ...this.capabilities };
  }

  // Ativar Lite Mode
  enableLiteMode(): void {
    this.config = { ...this.config, ...LITE_CONFIG };
    savePerformanceConfig(this.config);
    this.notify();
    this.applyLiteModeCSS(true);
  }

  // Desativar Lite Mode
  disableLiteMode(): void {
    this.config = { ...getPerformanceConfig(true), liteMode: false };
    savePerformanceConfig(this.config);
    this.notify();
    this.applyLiteModeCSS(false);
  }

  // Toggle Lite Mode
  toggleLiteMode(): void {
    if (this.config.liteMode) {
      this.disableLiteMode();
    } else {
      this.enableLiteMode();
    }
  }

  // Aplicar CSS de Lite Mode
  private applyLiteModeCSS(enable: boolean): void {
    if (typeof document === 'undefined') return;

    const existingStyle = document.getElementById('perf-lite-mode');
    if (existingStyle) {
      existingStyle.remove();
    }

    if (enable) {
      const style = document.createElement('style');
      style.id = 'perf-lite-mode';
      style.textContent = `
        /* 🔋 LITE MODE — Performance Máxima */
        *, *::before, *::after {
          animation-duration: 0.01ms !important;
          animation-iteration-count: 1 !important;
          transition-duration: 0.01ms !important;
        }
        .backdrop-blur, .backdrop-blur-sm, .backdrop-blur-md, .backdrop-blur-lg, .backdrop-blur-xl {
          backdrop-filter: none !important;
          -webkit-backdrop-filter: none !important;
        }
        .shadow-lg, .shadow-xl, .shadow-2xl {
          box-shadow: 0 1px 3px rgba(0,0,0,0.1) !important;
        }
        [data-perf-effect], .perf-effect, .ambient-effect {
          display: none !important;
        }
      `;
      document.head.appendChild(style);
    }
  }

  // Notificar listeners
  private notify(): void {
    this.listeners.forEach(fn => fn(this.config));
  }

  // Subscribe para mudanças
  subscribe(fn: (config: PerformanceConfig) => void): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  // Checar se deve carregar feature pesada
  shouldLoadHeavyFeature(feature: 'charts' | 'motion' | 'ambient' | 'ultra'): boolean {
    if (this.config.liteMode) return false;

    switch (feature) {
      case 'charts':
        return this.config.chartsEnabled;
      case 'motion':
        return this.config.enableMotion && !this.capabilities.reducedMotion;
      case 'ambient':
        return this.config.enableAmbientFx && !this.capabilities.isLowEnd;
      case 'ultra':
        return this.config.enableUltraEffects && this.capabilities.tier === 'quantum';
      default:
        return true;
    }
  }

  // Reset para defaults
  reset(): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
    }
    cachedConfig = null;
    cachedCapabilities = null;
    this.config = getPerformanceConfig(true);
    this.capabilities = detectDeviceCapabilities(true);
    this.notify();
    this.applyLiteModeCSS(false);
  }
}

// ============================================
// SINGLETON EXPORT
// ============================================
export const perfFlags = new PerformanceFlagsManager();

// ============================================
// HOOKS HELPERS (para uso direto sem React)
// ============================================
export function useLiteMode(): boolean {
  return perfFlags.get('liteMode');
}

export function useMotionEnabled(): boolean {
  return perfFlags.shouldLoadHeavyFeature('motion');
}

export function useChartsEnabled(): boolean {
  return perfFlags.shouldLoadHeavyFeature('charts');
}

// ============================================
// INICIALIZAÇÃO AUTOMÁTICA
// ============================================
if (typeof window !== 'undefined') {
  perfFlags.init();
}

export default perfFlags;
