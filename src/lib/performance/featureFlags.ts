// ============================================
// 🏛️ CONSTITUIÇÃO SYNAPSE - FEATURE FLAGS (LEGACY BRIDGE)
// Mantém compatibilidade com código antigo
// Redireciona para performanceFlags.ts v3
// ============================================

import { 
  getPerformanceConfig, 
  detectDeviceCapabilities,
  type PerformanceConfig,
  type DeviceCapabilities 
} from './performanceFlags';

export interface PerformanceFlags {
  /** Modo economia total - ativa automaticamente em 3G/2G/saveData/lowEnd */
  perf_mode_lite: boolean;
  /** Microanimações (transform/opacity) */
  ui_futuristic_motion: boolean;
  /** Glows, blurs decorativos */
  ui_ambient_fx: boolean;
  /** Efeitos premium (partículas, etc) - NUNCA auto-liga */
  ui_ultra: boolean;
}

/**
 * Calcula flags de performance baseado no dispositivo/conexão
 * @deprecated Use getPerformanceConfig() de performanceFlags.ts
 */
export function getPerformanceFlags(
  isSlowConnection: boolean,
  isLowEndDevice: boolean,
  reducedMotion: boolean,
  saveData: boolean
): PerformanceFlags {
  const config = getPerformanceConfig();
  
  return {
    perf_mode_lite: config.liteMode,
    ui_futuristic_motion: config.enableMotion,
    ui_ambient_fx: config.enableAmbientFx,
    ui_ultra: config.enableUltraEffects,
  };
}

/**
 * Detecta se dispositivo é low-end baseado em hardware
 * @deprecated Use detectDeviceCapabilities().isLowEnd de performanceFlags.ts
 */
export function detectLowEndDevice(): boolean {
  return detectDeviceCapabilities().isLowEnd;
}

/**
 * Detecta se conexão é lenta (3G ou pior)
 * @deprecated Use detectDeviceCapabilities().connection de performanceFlags.ts
 */
export function detectSlowConnection(): boolean {
  const conn = detectDeviceCapabilities().connection;
  return conn === '3g' || conn === '2g' || conn === 'slow' || conn === 'offline';
}

// Re-export para compatibilidade
export { getPerformanceConfig, detectDeviceCapabilities };
export type { PerformanceConfig, DeviceCapabilities };

// 🏛️ LEI I: Sem console.log em produção
if (import.meta.env.DEV) {
  console.log('[CONSTITUIÇÃO] ⚡ Feature Flags (bridge) carregados');
}
