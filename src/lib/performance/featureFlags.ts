// ============================================
// 🏛️ CONSTITUIÇÃO SYNAPSE - FEATURE FLAGS
// Governança central de features por performance tier
// ============================================

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
 * @returns Flags que governam features visuais
 */
export function getPerformanceFlags(
  isSlowConnection: boolean,
  isLowEndDevice: boolean,
  reducedMotion: boolean,
  saveData: boolean
): PerformanceFlags {
  // Lite mode ativa automaticamente em 3G/2G/saveData/lowEnd
  const perf_mode_lite = isSlowConnection || isLowEndDevice || saveData;
  
  return {
    perf_mode_lite,
    // Motion: desliga em lite mode ou se usuário pediu reduced motion
    ui_futuristic_motion: !perf_mode_lite && !reducedMotion,
    // Ambient FX: desliga em lite mode (blur é pesado)
    ui_ambient_fx: !perf_mode_lite && !reducedMotion,
    // Ultra: NUNCA auto-liga, só manual pelo owner
    ui_ultra: false,
  };
}

/**
 * Detecta se dispositivo é low-end baseado em hardware
 */
export function detectLowEndDevice(): boolean {
  if (typeof navigator === 'undefined') return false;
  
  const cores = navigator.hardwareConcurrency || 4;
  const memory = (navigator as any).deviceMemory || 4;
  
  // Low-end: ≤2 cores OU ≤2GB RAM
  return cores <= 2 || memory <= 2;
}

/**
 * Detecta se conexão é lenta (3G ou pior)
 */
export function detectSlowConnection(): boolean {
  if (typeof navigator === 'undefined') return false;
  
  const connection = (navigator as any).connection;
  if (!connection) return false;
  
  const effectiveType = connection.effectiveType || '4g';
  const saveData = connection.saveData || false;
  
  return ['slow-2g', '2g', '3g'].includes(effectiveType) || saveData;
}

// 🏛️ LEI I: Sem console.log em produção
if (import.meta.env.DEV) {
  console.log('[CONSTITUIÇÃO] ⚡ Feature Flags carregados');
}
