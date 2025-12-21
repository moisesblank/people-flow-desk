// ============================================
// ⚡ HOOK: useQuantumPerformance - ANO 2300 ⚡
// Performance Adaptativa Quântica
// ============================================

import { useState, useEffect, useCallback, useMemo } from "react";
import { detectPerformanceTier, PerformanceTier } from "@/lib/performance/evangelhoVelocidade";

interface QuantumPerformanceConfig {
  imageQuality: 'ultra' | 'high' | 'medium' | 'low' | 'minimal';
  animationLevel: 'full' | 'reduced' | 'minimal' | 'none';
  prefetchDepth: number;
  cacheStrategy: 'aggressive' | 'balanced' | 'conservative';
  videoQuality: '4k' | '1080p' | '720p' | '480p' | 'auto';
  parallelRequests: number;
  virtualListOverscan: number;
}

interface QuantumPerformanceState {
  tier: PerformanceTier;
  config: QuantumPerformanceConfig;
  isLowPowerMode: boolean;
  networkSpeed: 'fast' | 'medium' | 'slow' | 'offline';
  memoryPressure: 'none' | 'moderate' | 'critical';
}

const DEFAULT_CONFIG: QuantumPerformanceConfig = {
  imageQuality: 'high',
  animationLevel: 'full',
  prefetchDepth: 3,
  cacheStrategy: 'balanced',
  videoQuality: 'auto',
  parallelRequests: 6,
  virtualListOverscan: 5
};

function getConfigForTier(tier: PerformanceTier['tier']): QuantumPerformanceConfig {
  switch (tier) {
    case 'quantum':
      return {
        imageQuality: 'ultra',
        animationLevel: 'full',
        prefetchDepth: 5,
        cacheStrategy: 'aggressive',
        videoQuality: '4k',
        parallelRequests: 10,
        virtualListOverscan: 10
      };
    case 'neural':
      return {
        imageQuality: 'high',
        animationLevel: 'full',
        prefetchDepth: 4,
        cacheStrategy: 'aggressive',
        videoQuality: '1080p',
        parallelRequests: 8,
        virtualListOverscan: 7
      };
    case 'enhanced':
      return {
        imageQuality: 'high',
        animationLevel: 'reduced',
        prefetchDepth: 3,
        cacheStrategy: 'balanced',
        videoQuality: '1080p',
        parallelRequests: 6,
        virtualListOverscan: 5
      };
    case 'standard':
      return {
        imageQuality: 'medium',
        animationLevel: 'reduced',
        prefetchDepth: 2,
        cacheStrategy: 'balanced',
        videoQuality: '720p',
        parallelRequests: 4,
        virtualListOverscan: 3
      };
    case 'legacy':
      return {
        imageQuality: 'low',
        animationLevel: 'none',
        prefetchDepth: 1,
        cacheStrategy: 'conservative',
        videoQuality: '480p',
        parallelRequests: 2,
        virtualListOverscan: 1
      };
    default:
      return DEFAULT_CONFIG;
  }
}

export function useQuantumPerformance() {
  const [state, setState] = useState<QuantumPerformanceState>(() => {
    const tier = detectPerformanceTier();
    return {
      tier,
      config: getConfigForTier(tier.tier),
      isLowPowerMode: false,
      networkSpeed: 'fast',
      memoryPressure: 'none'
    };
  });

  // Monitor network changes
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const connection = (navigator as any).connection;
    if (!connection) return;

    const updateNetwork = () => {
      const effectiveType = connection.effectiveType;
      let speed: QuantumPerformanceState['networkSpeed'] = 'fast';
      
      if (!navigator.onLine) speed = 'offline';
      else if (effectiveType === '4g') speed = 'fast';
      else if (effectiveType === '3g') speed = 'medium';
      else speed = 'slow';

      setState(prev => {
        if (prev.networkSpeed === speed) return prev;
        
        // Ajustar config baseado na rede
        const newConfig = { ...prev.config };
        if (speed === 'slow') {
          newConfig.imageQuality = 'low';
          newConfig.videoQuality = '480p';
          newConfig.prefetchDepth = 1;
        } else if (speed === 'medium') {
          newConfig.imageQuality = 'medium';
          newConfig.videoQuality = '720p';
          newConfig.prefetchDepth = 2;
        }
        
        return { ...prev, networkSpeed: speed, config: newConfig };
      });
    };

    connection.addEventListener('change', updateNetwork);
    window.addEventListener('online', updateNetwork);
    window.addEventListener('offline', updateNetwork);
    updateNetwork();

    return () => {
      connection.removeEventListener('change', updateNetwork);
      window.removeEventListener('online', updateNetwork);
      window.removeEventListener('offline', updateNetwork);
    };
  }, []);

  // Monitor memory pressure (se disponível)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const performance = window.performance as any;
    if (!performance?.memory) return;

    const checkMemory = () => {
      const { usedJSHeapSize, jsHeapSizeLimit } = performance.memory;
      const usage = usedJSHeapSize / jsHeapSizeLimit;

      let pressure: QuantumPerformanceState['memoryPressure'] = 'none';
      if (usage > 0.9) pressure = 'critical';
      else if (usage > 0.7) pressure = 'moderate';

      setState(prev => {
        if (prev.memoryPressure === pressure) return prev;
        
        // Ajustar config baseado em memória
        const newConfig = { ...prev.config };
        if (pressure === 'critical') {
          newConfig.cacheStrategy = 'conservative';
          newConfig.prefetchDepth = 1;
          newConfig.virtualListOverscan = 1;
        }
        
        return { ...prev, memoryPressure: pressure, config: newConfig };
      });
    };

    const interval = setInterval(checkMemory, 10000);
    checkMemory();

    return () => clearInterval(interval);
  }, []);

  // Funções utilitárias
  const shouldAnimate = useMemo(() => {
    return state.config.animationLevel !== 'none';
  }, [state.config.animationLevel]);

  const getAnimationDuration = useCallback((baseDuration: number): number => {
    switch (state.config.animationLevel) {
      case 'full': return baseDuration;
      case 'reduced': return baseDuration * 0.5;
      case 'minimal': return baseDuration * 0.25;
      case 'none': return 0;
    }
  }, [state.config.animationLevel]);

  const getImageSrc = useCallback((src: string, width?: number): string => {
    if (!src || src.startsWith('data:')) return src;
    
    const quality = {
      ultra: 100,
      high: 85,
      medium: 70,
      low: 50,
      minimal: 30
    }[state.config.imageQuality];

    // Se for URL do Supabase Storage, adicionar parâmetros
    if (src.includes('supabase.co/storage')) {
      const url = new URL(src);
      url.searchParams.set('quality', quality.toString());
      if (width) url.searchParams.set('width', width.toString());
      return url.toString();
    }

    return src;
  }, [state.config.imageQuality]);

  const getVideoQuality = useCallback((): string => {
    if (state.config.videoQuality === 'auto') {
      // Auto-select baseado em network
      switch (state.networkSpeed) {
        case 'fast': return '1080p';
        case 'medium': return '720p';
        case 'slow': return '480p';
        case 'offline': return '480p';
      }
    }
    return state.config.videoQuality;
  }, [state.config.videoQuality, state.networkSpeed]);

  return {
    // Estado
    tier: state.tier,
    config: state.config,
    isLowPowerMode: state.isLowPowerMode,
    networkSpeed: state.networkSpeed,
    memoryPressure: state.memoryPressure,

    // Flags úteis
    shouldAnimate,
    isOffline: state.networkSpeed === 'offline',
    isSlowNetwork: state.networkSpeed === 'slow',
    isHighPerformance: state.tier.tier === 'quantum' || state.tier.tier === 'neural',

    // Funções
    getAnimationDuration,
    getImageSrc,
    getVideoQuality,

    // Framer Motion config
    motionConfig: {
      initial: shouldAnimate ? { opacity: 0, y: 10 } : false,
      animate: { opacity: 1, y: 0 },
      exit: shouldAnimate ? { opacity: 0, y: -10 } : undefined,
      transition: { 
        duration: getAnimationDuration(0.3),
        ease: [0.4, 0, 0.2, 1]
      }
    }
  };
}

export default useQuantumPerformance;
