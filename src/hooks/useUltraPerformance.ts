// ╔══════════════════════════════════════════════════════════════════════════════╗
// ║   ⚡ ULTRA PERFORMANCE HOOK v5.0 ⚡                                           ║
// ║   React hook for ultra-optimized 3G performance                              ║
// ╚══════════════════════════════════════════════════════════════════════════════╝

import { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  detectUltraPerformance, 
  setupPerformanceListener,
  getPerformanceClasses,
  type UltraPerformanceState,
  type UltraTier 
} from '@/lib/performance/ultraPerformance3G';

// ============================================
// MAIN HOOK
// ============================================

export function useUltraPerformance(): UltraPerformanceState {
  const [state, setState] = useState<UltraPerformanceState>(() => detectUltraPerformance());
  
  useEffect(() => {
    // Atualiza quando conexão/preferências mudam
    const cleanup = setupPerformanceListener((newState) => {
      setState(newState);
    });
    
    return cleanup;
  }, []);
  
  return state;
}

// ============================================
// SPECIALIZED HOOKS
// ============================================

/**
 * Retorna o tier atual de performance
 */
export function usePerformanceTier(): UltraTier {
  const state = useUltraPerformance();
  return state.tier;
}

/**
 * Verifica se deve usar experiência simplificada (3G/2G)
 */
export function useIsLowEnd(): boolean {
  const state = useUltraPerformance();
  return state.tier === 'critical' || state.tier === 'legacy' || state.tier === 'standard';
}

/**
 * Retorna se animações estão habilitadas
 */
export function useShouldAnimate(): boolean {
  const state = useUltraPerformance();
  return state.flags.enableAnimations && !state.flags.reduceMotion;
}

/**
 * Retorna se blur está habilitado
 */
export function useShouldBlur(): boolean {
  const state = useUltraPerformance();
  return state.flags.enableBlur;
}

/**
 * Retorna duração de animação ajustada ao tier
 */
export function useAnimationDuration(baseDuration: number = 300): number {
  const state = useUltraPerformance();
  if (!state.flags.enableAnimations) return 0;
  return Math.round(baseDuration * (state.animation.duration / 300));
}

/**
 * Retorna configuração de lazy loading
 */
export function useLazyConfig() {
  const state = useUltraPerformance();
  return useMemo(() => ({
    rootMargin: state.lazy.rootMargin,
    threshold: state.lazy.threshold,
  }), [state.lazy.rootMargin, state.lazy.threshold]);
}

/**
 * Retorna configuração de imagem otimizada
 */
export function useImageConfig() {
  const state = useUltraPerformance();
  return useMemo(() => ({
    quality: state.image.quality,
    maxWidth: state.image.maxWidth,
    format: state.image.format,
  }), [state.image.quality, state.image.maxWidth, state.image.format]);
}

/**
 * Retorna configuração de cache
 */
export function useCacheConfig() {
  const state = useUltraPerformance();
  return useMemo(() => ({
    staleTime: state.cache.staleTime,
    gcTime: state.cache.gcTime,
  }), [state.cache.staleTime, state.cache.gcTime]);
}

/**
 * Retorna classes CSS de performance para aplicar ao body
 */
export function usePerformanceClasses(): string {
  return useMemo(() => getPerformanceClasses(), []);
}

/**
 * Retorna objeto de flags memoizado
 */
export function usePerformanceFlags() {
  const state = useUltraPerformance();
  return useMemo(() => state.flags, [state.flags]);
}

// ============================================
// ANIMATION HELPERS
// ============================================

/**
 * Retorna props para framer-motion condicionais
 */
export function useConditionalAnimation<T extends Record<string, any>>(
  enabledProps: T,
  disabledProps: Partial<T> = {}
): T | Partial<T> {
  const shouldAnimate = useShouldAnimate();
  return shouldAnimate ? enabledProps : disabledProps;
}

/**
 * Retorna configuração de transição ajustada
 */
export function useOptimizedTransition() {
  const state = useUltraPerformance();
  
  return useMemo(() => {
    if (!state.flags.enableAnimations) {
      return { duration: 0 };
    }
    
    return {
      duration: state.animation.duration / 1000,
      ease: state.animation.easing === 'linear' 
        ? 'linear' 
        : state.animation.easing.includes('cubic') 
          ? [0.4, 0, 0.2, 1] 
          : 'easeOut',
    };
  }, [state.flags.enableAnimations, state.animation.duration, state.animation.easing]);
}

// ============================================
// CONDITIONAL RENDERING HELPERS
// ============================================

/**
 * Helper para renderização condicional baseada em tier
 */
export function useConditionalRender() {
  const state = useUltraPerformance();
  
  return useCallback((options: {
    quantum?: React.ReactNode;
    neural?: React.ReactNode;
    enhanced?: React.ReactNode;
    standard?: React.ReactNode;
    legacy?: React.ReactNode;
    critical?: React.ReactNode;
    fallback?: React.ReactNode;
  }): React.ReactNode => {
    const tierContent = options[state.tier];
    if (tierContent !== undefined) return tierContent;
    
    // Fallback hierárquico - 6 tiers oficiais
    const tierOrder: UltraTier[] = ['quantum', 'neural', 'enhanced', 'standard', 'legacy', 'critical'];
    const currentIndex = tierOrder.indexOf(state.tier);
    
    // Tenta tiers acima
    for (let i = currentIndex - 1; i >= 0; i--) {
      const content = options[tierOrder[i]];
      if (content !== undefined) return content;
    }
    
    // Tenta tiers abaixo
    for (let i = currentIndex + 1; i < tierOrder.length; i++) {
      const content = options[tierOrder[i]];
      if (content !== undefined) return content;
    }
    
    return options.fallback ?? null;
  }, [state.tier]);
}

/**
 * Retorna se feature específica está habilitada
 */
export function useFeatureEnabled(feature: keyof UltraPerformanceState['flags']): boolean {
  const state = useUltraPerformance();
  return state.flags[feature];
}

// ============================================
// PERFORMANCE MONITORING
// ============================================

/**
 * Hook para monitorar métricas de performance
 */
export function usePerformanceMonitor() {
  const state = useUltraPerformance();
  
  useEffect(() => {
    if (import.meta.env.PROD) return; // Só em dev
    
    // Log de mudança de tier
    console.log(`[ULTRA-PERF] 📊 Tier: ${state.tier}`, {
      connection: `${state.connection.effectiveType} (${state.connection.downlink}Mbps)`,
      device: `${state.device.cores} cores, ${state.device.memory}GB`,
    });
  }, [state.tier]);
  
  return state;
}

// ============================================
// EXPORTS
// ============================================

export type { UltraPerformanceState, UltraTier };
