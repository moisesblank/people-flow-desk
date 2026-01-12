// ╔══════════════════════════════════════════════════════════════════════════════╗
// ║   🏛️ CONSTITUIÇÃO SYNAPSE - HOOK UNIFICADO DE PERFORMANCE v10.5             ║
// ║   LEI I: Performance máxima | PREMIUM GARANTIDO para todos                  ║
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
 * 🏛️ CONSTITUIÇÃO SYNAPSE v10.5 - PREMIUM GARANTIDO
 * 
 * TODOS os usuários recebem a mesma experiência visual premium.
 * O sistema detecta hardware/conexão apenas para otimizações internas,
 * mas NUNCA degrada a experiência visual.
 * 
 * @example
 * const { tier, shouldAnimate, shouldBlur, motionProps } = useConstitutionPerformance();
 * 
 * // Em componentes com animação:
 * <motion.div {...motionProps}>
 * 
 * // Em componentes com blur:
 * className={shouldBlur ? 'backdrop-blur-xl' : 'bg-background/90'}
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
    
    // 🏛️ v10.5 PREMIUM GARANTIDO: isLowEnd apenas para métricas internas
    // NÃO usar para degradar experiência visual
    const isLowEndInternal = tier === 'critical' || tier === 'legacy' || tier === 'standard';
    const isCritical = tier === 'critical';
    
    // 🏛️ PREMIUM GARANTIDO: Sempre habilitar features visuais
    // Exceção: respeitar prefers-reduced-motion do sistema
    const shouldAnimate = !flags.reduceMotion; // Sempre true, exceto se sistema pedir
    const shouldBlur = true;  // Sempre true para todos
    const shouldShowParticles = false; // Partículas desabilitadas (muito pesado)
    const shouldShowShadows = true;  // Sempre true para todos
    const shouldShowGradients = true; // Sempre true para todos
    const shouldPrefetch = flags.enablePrefetch;
    const shouldAutoplayVideo = flags.enableVideoAutoplay;
    const shouldShowHDImages = !connection.saveData; // Respeitar save-data apenas para imagens
    
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
      container: `perf-tier-${tier}`, // 🏛️ v10.5: Sem degradação visual
      particles: 'perf-ambient-only',
      blur: shouldBlur ? '' : 'perf-no-blur',
      shadows: shouldShowShadows ? '' : 'perf-no-shadows',
      animations: shouldAnimate ? '' : 'perf-no-animations',
    };
    
    return {
      // Estado bruto
      tier,
      state,
      
      // 🏛️ v10.5 PREMIUM GARANTIDO: isLowEnd sempre false para UI
      // Mantido para compatibilidade, mas sempre retorna false
      isLowEnd: false,
      isCritical: false,
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
        
      // 🏛️ v10.5: Partículas sempre 0 (muito pesado)
      getParticleCount: (_baseCount: number) => 0,
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
