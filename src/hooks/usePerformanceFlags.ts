// ============================================
// 🏛️ CONSTITUIÇÃO SYNAPSE - usePerformanceFlags
// Hook reativo para governança de features
// ============================================

import { useMemo } from 'react';
import { useNetworkInfo, useReducedMotion } from '@/hooks/usePerformance';
import { 
  getPerformanceFlags, 
  detectLowEndDevice,
  PerformanceFlags 
} from '@/lib/performance/featureFlags';

/**
 * Hook que retorna flags de performance reativos
 * Atualiza automaticamente quando conexão muda
 */
export function usePerformanceFlags(): PerformanceFlags {
  const { isSlowConnection, saveData } = useNetworkInfo();
  const reducedMotion = useReducedMotion();
  
  // Detectar low-end device (só uma vez)
  const isLowEndDevice = useMemo(() => detectLowEndDevice(), []);
  
  // Calcular flags reativamente
  return useMemo(() => 
    getPerformanceFlags(isSlowConnection, isLowEndDevice, reducedMotion, saveData),
    [isSlowConnection, isLowEndDevice, reducedMotion, saveData]
  );
}

/**
 * Hook para verificar se está em lite mode
 */
export function useIsLiteMode(): boolean {
  const flags = usePerformanceFlags();
  return flags.perf_mode_lite;
}

/**
 * Hook para verificar se animações estão habilitadas
 */
export function useShouldAnimate(): boolean {
  const flags = usePerformanceFlags();
  return flags.ui_futuristic_motion;
}

/**
 * Hook para verificar se efeitos ambient estão habilitados
 */
export function useShouldUseAmbient(): boolean {
  const flags = usePerformanceFlags();
  return flags.ui_ambient_fx;
}

export default usePerformanceFlags;
