// ╔══════════════════════════════════════════════════════════════════════════════╗
// ║   🏛️ CONSTITUIÇÃO SYNAPSE - HOOK UNIFICADO DE PERFORMANCE v5.0             ║
// ║   LEI I: Performance máxima em 3G                                           ║
// ║   Centraliza TODAS as flags de performance para uso simples nos componentes ║
// ╚══════════════════════════════════════════════════════════════════════════════╝

import { useMemo, useEffect, useState } from 'react';
import { 
  detectUltraPerformance, 
  setupPerformanceListener,
  type UltraPerformanceState,
  type UltraTier
} from '@/lib/performance/ultraPerformance3G';

/**
 * 🏛️ CONSTITUIÇÃO SYNAPSE - Hook unificado de performance
 * 
 * Retorna todas as flags e configurações de performance em um único objeto.
 * Reage automaticamente a mudanças de conexão/hardware.
 * 
 * @example
 * const { tier, shouldAnimate, shouldBlur, isLowEnd, motionProps } = useConstitutionPerformance();
 * 
 * // Em componentes com animação:
 * <motion.div {...motionProps}>
 * 
 * // Em componentes com blur:
 * className={shouldBlur ? 'backdrop-blur-xl' : 'bg-background/90'}
 * 
 * // Em partículas/efeitos pesados:
 * {!isLowEnd && <ParticlesEffect />}
 */
export function useConstitutionPerformance() {
  const [state, setState] = useState<UltraPerformanceState>(() => 
    detectUltraPerformance()
  );
  
  // Listener para mudanças de conexão
  useEffect(() => {
    const cleanup = setupPerformanceListener((newState) => {
      setState(newState);
    });
    return cleanup;
  }, []);
  
  return useMemo(() => {
    const { tier, flags, animation, image, lazy, connection, device } = state;
    
    // Flags simplificadas - usando tiers oficiais LEI I v2.0
    const isLowEnd = tier === 'critical' || tier === 'legacy' || tier === 'standard';
    const isCritical = tier === 'critical';
    const shouldAnimate = flags.enableAnimations && !flags.reduceMotion;
    const shouldBlur = flags.enableBlur;
    const shouldShowParticles = flags.enableParticles;
    const shouldShowShadows = flags.enableShadows;
    const shouldShowGradients = flags.enableGradients;
    const shouldPrefetch = flags.enablePrefetch;
    const shouldAutoplayVideo = flags.enableVideoAutoplay;
    const shouldShowHDImages = flags.enableHDImages;
    
    // Props prontas para motion.div (ease como tipo correto)
    const motionProps = shouldAnimate
      ? {
          initial: { opacity: 0, y: 10 } as const,
          animate: { opacity: 1, y: 0 } as const,
          transition: { 
            duration: animation.duration / 1000, 
            ease: [0.4, 0, 0.2, 1] as const, // cubic-bezier como array
          },
        }
      : {};
    
    // Props para motion.div com scale
    const motionScaleProps = shouldAnimate
      ? {
          initial: { opacity: 0, scale: 0.95 },
          animate: { opacity: 1, scale: 1 },
          transition: { 
            duration: animation.duration / 1000, 
            ease: animation.easing 
          },
        }
      : {};
    
    // Props para animações infinitas (partículas, orbs)
    const infiniteMotionProps = shouldAnimate
      ? { 
          animate: { scale: [1, 1.1, 1], opacity: [0.3, 0.5, 0.3] },
          transition: { duration: 5, repeat: Infinity },
        }
      : {};
    
    // Config para lazy loading
    const lazyConfig = {
      rootMargin: lazy.rootMargin,
      threshold: lazy.threshold,
    };
    
    // Config para imagens
    const imageConfig = {
      quality: image.quality,
      maxWidth: image.maxWidth,
      format: image.format,
    };
    
    // Classes CSS baseadas no tier
    const perfClasses = {
      container: isLowEnd ? 'perf-tier-low' : `perf-tier-${tier}`,
      particles: 'perf-ambient-only',
      blur: shouldBlur ? '' : 'perf-no-blur',
      shadows: shouldShowShadows ? '' : 'perf-no-shadows',
      animations: shouldAnimate ? '' : 'perf-no-animations',
    };
    
    return {
      // Estado bruto
      tier,
      state,
      
      // Flags booleanas simples
      isLowEnd,
      isCritical,
      shouldAnimate,
      shouldBlur,
      shouldShowParticles,
      shouldShowShadows,
      shouldShowGradients,
      shouldPrefetch,
      shouldAutoplayVideo,
      shouldShowHDImages,
      reducedMotion: flags.reduceMotion,
      
      // Conexão e dispositivo
      connectionType: connection.effectiveType,
      isSaveData: connection.saveData,
      isMobile: device.isMobile,
      
      // Props prontas para framer-motion
      motionProps,
      motionScaleProps,
      infiniteMotionProps,
      
      // Configs
      lazyConfig,
      imageConfig,
      animationDuration: animation.duration,
      animationEasing: animation.easing,
      
      // Classes CSS
      perfClasses,
      
      // Helpers
      getAnimationDuration: (baseDuration: number) => 
        shouldAnimate ? Math.min(baseDuration, animation.duration) : 0,
      
      getBlurClass: (blurClass: string, fallback: string = 'bg-background/90') =>
        shouldBlur ? blurClass : fallback,
        
      getParticleCount: (baseCount: number) => {
        if (isCritical) return 0;
        if (isLowEnd) return Math.floor(baseCount * 0.3);
        if (tier === 'enhanced') return Math.floor(baseCount * 0.6);
        return baseCount;
      },
    };
  }, [state]);
}

/**
 * Hook simplificado apenas para verificar se deve animar
 */
export function useShouldAnimate(): boolean {
  const { shouldAnimate } = useConstitutionPerformance();
  return shouldAnimate;
}

/**
 * Hook simplificado apenas para verificar tier
 */
export function usePerformanceTierSimple(): UltraTier {
  const { tier } = useConstitutionPerformance();
  return tier;
}

/**
 * Hook para componentes de gráfico - retorna se deve simplificar
 */
export function useChartSimplification() {
  const { isLowEnd, isCritical, tier } = useConstitutionPerformance();
  
  return useMemo(() => ({
    shouldSimplify: isLowEnd,
    showLegend: !isCritical,
    showGrid: !isCritical,
    showTooltip: !isCritical,
    animationDuration: isCritical ? 0 : isLowEnd ? 200 : 400,
    strokeWidth: isCritical ? 1 : 2,
  }), [isLowEnd, isCritical, tier]);
}

// 🏛️ LEI I: Log apenas em dev
if (import.meta.env.DEV) {
  console.log('[CONSTITUIÇÃO] ⚡ useConstitutionPerformance carregado');
}
