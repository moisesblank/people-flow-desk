// ============================================
// 🏛️ CONSTITUIÇÃO SYNAPSE - usePerformanceConfig
// Hook reativo para o novo sistema de performance flags v3
// ============================================

import { useMemo, useEffect, useState, useCallback } from 'react';
import { 
  getPerformanceConfig, 
  detectDeviceCapabilities,
  setupPerformanceListener,
  savePerformanceConfig,
  getPerformanceClasses,
  type PerformanceConfig,
  type DeviceCapabilities,
  type PerformanceTier
} from '@/lib/performance/performanceFlags';

interface UsePerformanceConfigReturn {
  // Config completa
  config: PerformanceConfig;
  capabilities: DeviceCapabilities;
  tier: PerformanceTier;
  
  // Flags simplificadas
  isLowEnd: boolean;
  isLiteMode: boolean;
  shouldAnimate: boolean;
  shouldBlur: boolean;
  shouldShowParticles: boolean;
  shouldShowGradients: boolean;
  isMobile: boolean;
  isTouch: boolean;
  
  // Helpers
  getAnimationDuration: (base?: number) => number;
  getPrefetchMargin: () => string;
  getImageQuality: () => number;
  getCssClasses: () => string;
  
  // Motion props para framer-motion
  motionProps: {
    initial?: { opacity: number; y: number };
    animate?: { opacity: number; y: number };
    transition?: { duration: number; ease: number[] };
  };
  
  // Ações
  updateConfig: (partial: Partial<PerformanceConfig>) => void;
  toggleLiteMode: () => void;
}

/**
 * Hook reativo para o sistema de performance v3
 * Detecta capacidades do dispositivo e reage a mudanças de conexão
 */
export function usePerformanceConfig(): UsePerformanceConfigReturn {
  const [config, setConfig] = useState<PerformanceConfig>(() => getPerformanceConfig());
  const [capabilities, setCapabilities] = useState<DeviceCapabilities>(() => detectDeviceCapabilities());
  
  // Listener para mudanças
  useEffect(() => {
    const cleanup = setupPerformanceListener((newConfig, newCapabilities) => {
      setConfig(newConfig);
      setCapabilities(newCapabilities);
    });
    return cleanup;
  }, []);
  
  // Update config
  const updateConfig = useCallback((partial: Partial<PerformanceConfig>) => {
    savePerformanceConfig(partial);
    setConfig(prev => ({ ...prev, ...partial }));
  }, []);
  
  // Toggle lite mode
  const toggleLiteMode = useCallback(() => {
    updateConfig({ liteMode: !config.liteMode, autoLiteMode: false });
  }, [config.liteMode, updateConfig]);
  
  return useMemo(() => {
    const isLowEnd = capabilities.isLowEnd;
    const isLiteMode = config.liteMode;
    const shouldAnimate = config.enableMotion && !capabilities.reducedMotion;
    const shouldBlur = config.enableBlur;
    const shouldShowParticles = config.enableParticles;
    const shouldShowGradients = config.enableGradients;
    
    // Motion props para framer-motion
    const motionProps = shouldAnimate
      ? {
          initial: { opacity: 0, y: 10 },
          animate: { opacity: 1, y: 0 },
          transition: { 
            duration: config.animationDuration / 1000, 
            ease: [0.4, 0, 0.2, 1] 
          },
        }
      : {};
    
    return {
      config,
      capabilities,
      tier: capabilities.tier,
      
      isLowEnd,
      isLiteMode,
      shouldAnimate,
      shouldBlur,
      shouldShowParticles,
      shouldShowGradients,
      isMobile: capabilities.isMobile,
      isTouch: capabilities.isTouch,
      
      getAnimationDuration: (base = 300) => 
        shouldAnimate ? Math.round(base * (config.animationDuration / 300)) : 0,
      getPrefetchMargin: () => config.prefetchMargin,
      getImageQuality: () => config.imageQuality,
      getCssClasses: getPerformanceClasses,
      
      motionProps,
      
      updateConfig,
      toggleLiteMode,
    };
  }, [config, capabilities, updateConfig, toggleLiteMode]);
}

/**
 * Hook simplificado - só retorna se deve animar
 */
export function useShouldAnimateV3(): boolean {
  const { shouldAnimate } = usePerformanceConfig();
  return shouldAnimate;
}

/**
 * Hook simplificado - só retorna tier
 */
export function usePerformanceTier(): PerformanceTier {
  const { tier } = usePerformanceConfig();
  return tier;
}

/**
 * Hook simplificado - só retorna se é lite mode
 */
export function useIsLiteMode(): boolean {
  const { isLiteMode } = usePerformanceConfig();
  return isLiteMode;
}

export default usePerformanceConfig;

// 🏛️ LEI I: Log apenas em dev
if (import.meta.env.DEV) {
  console.log('[CONSTITUIÇÃO] ⚡ usePerformanceConfig v3 carregado');
}
