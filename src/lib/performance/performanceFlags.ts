// ============================================
// 🌌🔥 PERFORMANCE FLAGS — CONTROLE TOTAL NÍVEL NASA 🔥🌌
// ANO 2300 — DESIGN FUTURISTA COM RENDIMENTO 3500
// ESTE É O PROJETO DA VIDA DO MESTRE MOISÉS MEDEIROS
// ============================================
//
// 📍 MAPA DE URLs DEFINITIVO:
//   🌐 NÃO PAGANTE: pro.moisesmedeiros.com.br/ + /comunidade
//   👨‍🎓 ALUNO BETA: pro.moisesmedeiros.com.br/alunos
//   👔 FUNCIONÁRIO: gestao.moisesmedeiros.com.br/gestao
//   👑 OWNER: TODAS (moisesblank@gmail.com = MASTER)
//
// ============================================

// ============================================
// TIPOS AUXILIARES PARA APIs DO NAVEGADOR
// ============================================
interface NetworkInformation extends EventTarget {
  effectiveType?: '4g' | '3g' | '2g' | 'slow-2g';
  downlink?: number;
  saveData?: boolean;
  addEventListener(type: 'change', listener: () => void): void;
}

// ============================================
// TIPOS
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
  
  // Media
  videoClickToLoad: boolean;
  imageOptimization: boolean;
  lazyLoadImages: boolean;
  useWebP: boolean;
  useAVIF: boolean;
  
  // Charts
  chartsEnabled: boolean;
  chartsLazyLoad: boolean;
  
  // Network
  prefetchEnabled: boolean;
  aggressiveCache: boolean;
  offlineMode: boolean;
  
  // Debug
  showPerformanceOverlay: boolean;
  logPerformanceMetrics: boolean;
}

export interface DeviceCapabilities {
  tier: 'quantum' | 'neural' | 'enhanced' | 'standard' | 'legacy' | 'lite';
  score: number;
  cores: number;
  memory: number;
  connection: 'fast' | 'medium' | 'slow' | '3g' | '2g' | 'offline';
  saveData: boolean;
  reducedMotion: boolean;
  isLowEnd: boolean;
  isMobile: boolean;
}

// ============================================
// CONSTANTES
// ============================================
const STORAGE_KEY = 'mm_perf_config_v3';
const OWNER_EMAIL = 'moisesblank@gmail.com';

// ============================================
// CONFIGURAÇÃO PADRÃO
// ============================================
const DEFAULT_CONFIG: PerformanceConfig = {
  liteMode: false,
  autoLiteMode: true,
  
  enableMotion: true,
  enableAmbientFx: false, // Desligado por padrão (performance)
  enableUltraEffects: false,
  enableBlur: true,
  enableShadows: true,
  enableGradients: true,
  
  videoClickToLoad: true, // SEMPRE true
  imageOptimization: true,
  lazyLoadImages: true,
  useWebP: true,
  useAVIF: false, // Nem todos browsers suportam
  
  chartsEnabled: true,
  chartsLazyLoad: true, // Lazy por padrão
  
  prefetchEnabled: true,
  aggressiveCache: true,
  offlineMode: false,
  
  showPerformanceOverlay: false,
  logPerformanceMetrics: false,
};

// ============================================
// CONFIGURAÇÃO LITE (3G / DISPOSITIVOS FRACOS)
// ============================================
const LITE_CONFIG: Partial<PerformanceConfig> = {
  liteMode: true,
  
  enableMotion: false,
  enableAmbientFx: false,
  enableUltraEffects: false,
  enableBlur: false,
  enableShadows: false,
  enableGradients: false,
  
  videoClickToLoad: true,
  imageOptimization: true,
  lazyLoadImages: true,
  useWebP: true,
  
  chartsEnabled: true,
  chartsLazyLoad: true,
  
  prefetchEnabled: false, // Não prefetch em 3G
  aggressiveCache: true,
};

// ============================================
// DETECTAR CAPACIDADES DO DISPOSITIVO
// ============================================
export function detectDeviceCapabilities(): DeviceCapabilities {
  if (typeof window === 'undefined') {
    return {
      tier: 'standard',
      score: 50,
      cores: 4,
      memory: 4,
      connection: 'medium',
      saveData: false,
      reducedMotion: false,
      isLowEnd: false,
      isMobile: false,
    };
  }

  // Detectar cores
  const cores = navigator.hardwareConcurrency || 4;
  
  // Detectar memória (Chrome only)
  const navWithMemory = navigator as Navigator & { deviceMemory?: number };
  const memory = navWithMemory.deviceMemory || 4;
  
  // Detectar conexão
  const navWithConnection = navigator as Navigator & { connection?: NetworkInformation };
  const conn = navWithConnection.connection;
  let connection: DeviceCapabilities['connection'] = 'medium';
  let saveData = false;
  
  if (conn) {
    saveData = conn.saveData === true;
    const effectiveType = conn.effectiveType;
    
    if (effectiveType === '4g' && conn.downlink > 5) {
      connection = 'fast';
    } else if (effectiveType === '4g') {
      connection = 'medium';
    } else if (effectiveType === '3g') {
      connection = '3g';
    } else if (effectiveType === '2g' || effectiveType === 'slow-2g') {
      connection = '2g';
    }
  }
  
  // Detectar reduced motion
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  
  // Detectar mobile
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  
  // Calcular score
  let score = 50;
  
  // Cores: +5 por core acima de 2
  score += Math.min((cores - 2) * 5, 30);
  
  // Memória: +10 por GB acima de 2
  score += Math.min((memory - 2) * 10, 40);
  
  // Conexão
  if (connection === 'fast') score += 20;
  else if (connection === 'medium') score += 10;
  else if (connection === '3g') score -= 20;
  else if (connection === '2g') score -= 40;
  
  // Penalidades
  if (saveData) score -= 30;
  if (isMobile && cores <= 4) score -= 15;
  
  // Clamp
  score = Math.max(0, Math.min(120, score));
  
  // Determinar tier
  let tier: DeviceCapabilities['tier'];
  if (score >= 110) tier = 'quantum';
  else if (score >= 85) tier = 'neural';
  else if (score >= 60) tier = 'enhanced';
  else if (score >= 35) tier = 'standard';
  else if (score >= 15) tier = 'legacy';
  else tier = 'lite';
  
  // Low-end?
  const isLowEnd = tier === 'legacy' || tier === 'lite' || connection === '3g' || connection === '2g' || saveData;
  
  return {
    tier,
    score,
    cores,
    memory,
    connection,
    saveData,
    reducedMotion,
    isLowEnd,
    isMobile,
  };
}

// ============================================
// CLASSE PRINCIPAL
// ============================================
class PerformanceFlagsManager {
  private config: PerformanceConfig;
  private capabilities: DeviceCapabilities;
  private listeners: Set<(config: PerformanceConfig) => void> = new Set();
  private initialized = false;

  constructor() {
    this.capabilities = detectDeviceCapabilities();
    this.config = this.loadConfig();
  }

  // Inicializar (chamar no app start)
  init(): void {
    if (this.initialized) return;
    this.initialized = true;

    // Auto-aplicar lite mode se necessário
    if (this.config.autoLiteMode && this.capabilities.isLowEnd) {
      this.enableLiteMode();
      console.log('[PERF] 🔋 Lite Mode ativado automaticamente (dispositivo/rede lenta)');
    }

    // Observar mudanças de conexão
    const navWithConnection = navigator as Navigator & { connection?: NetworkInformation };
    if (typeof navigator !== 'undefined' && navWithConnection.connection) {
      navWithConnection.connection.addEventListener('change', () => {
        this.capabilities = detectDeviceCapabilities();
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

    // Log inicial
    console.log(`[PERF] ⚡ Device Tier: ${this.capabilities.tier} (${this.capabilities.score}/120)`);
    console.log(`[PERF] 📶 Connection: ${this.capabilities.connection}`);
    console.log(`[PERF] 🔋 Lite Mode: ${this.config.liteMode ? 'ON' : 'OFF'}`);
  }

  // Carregar config do storage
  private loadConfig(): PerformanceConfig {
    if (typeof localStorage === 'undefined') {
      return { ...DEFAULT_CONFIG };
    }

    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return { ...DEFAULT_CONFIG, ...parsed };
      }
    } catch {
      // Ignorar erro
    }

    return { ...DEFAULT_CONFIG };
  }

  // Salvar config
  private saveConfig(): void {
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.config));
      } catch {
        // Storage cheio ou bloqueado
      }
    }
  }

  // Notificar listeners
  private notify(): void {
    this.listeners.forEach(fn => fn(this.config));
  }

  // Obter valor
  get<K extends keyof PerformanceConfig>(key: K): PerformanceConfig[K] {
    return this.config[key];
  }

  // Definir valor
  set<K extends keyof PerformanceConfig>(key: K, value: PerformanceConfig[K]): void {
    this.config[key] = value;
    this.saveConfig();
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
    this.saveConfig();
    this.notify();
    this.applyLiteModeCSS(true);
  }

  // Desativar Lite Mode
  disableLiteMode(): void {
    this.config = { ...this.loadConfig(), liteMode: false };
    this.saveConfig();
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
        
        /* Desabilitar animações */
        *, *::before, *::after {
          animation-duration: 0.01ms !important;
          animation-iteration-count: 1 !important;
          transition-duration: 0.01ms !important;
        }
        
        /* Desabilitar blur */
        .backdrop-blur, .backdrop-blur-sm, .backdrop-blur-md, .backdrop-blur-lg, .backdrop-blur-xl {
          backdrop-filter: none !important;
          -webkit-backdrop-filter: none !important;
        }
        
        /* Desabilitar sombras pesadas */
        .shadow-lg, .shadow-xl, .shadow-2xl {
          box-shadow: 0 1px 3px rgba(0,0,0,0.1) !important;
        }
        
        /* Simplificar gradientes */
        .bg-gradient-to-r, .bg-gradient-to-l, .bg-gradient-to-t, .bg-gradient-to-b {
          background: var(--background) !important;
        }
        
        /* Ocultar efeitos decorativos */
        [data-perf-effect], .perf-effect, .ambient-effect {
          display: none !important;
        }
      `;
      document.head.appendChild(style);
    }
  }

  // Subscribe para mudanças
  subscribe(fn: (config: PerformanceConfig) => void): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  // Checar se deve carregar algo pesado
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
    this.config = { ...DEFAULT_CONFIG };
    this.saveConfig();
    this.notify();
    this.applyLiteModeCSS(false);
  }
}

// ============================================
// SINGLETON EXPORT
// ============================================
export const perfFlags = new PerformanceFlagsManager();

// ============================================
// HOOKS HELPERS
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
