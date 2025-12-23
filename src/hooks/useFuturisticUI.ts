// ============================================
// SYNAPSE v15.0 - Futuristic UI Feature Flags
// Performance-first: respects reduced motion, lite mode
// 🏛️ LEI I: Usa flags centralizados
// ============================================

import { useMemo } from "react";
import { usePerformanceFlags } from "@/hooks/usePerformanceFlags";

export interface FuturisticUIConfig {
  // Flags
  enableCore: boolean;
  enableMotion: boolean;
  enableAmbient: boolean;
  enableParticles: boolean;
  enableUltra: boolean;
  
  // Computed
  shouldAnimate: boolean;
  shouldUseBlur: boolean;
  animationDuration: (base: number) => number;
  
  // CSS classes
  glassClass: string;
  glowClass: string;
  holoGradientClass: string;
}

export function useFuturisticUI(): FuturisticUIConfig {
  // 🏛️ LEI I: Usa flags centralizados
  const flags = usePerformanceFlags();
  
  return useMemo(() => {
    // Flag states from centralized governance
    const enableCore = true;
    const enableMotion = flags.ui_futuristic_motion;
    const enableAmbient = flags.ui_ambient_fx;
    const enableParticles = false; // Sempre off (pesado)
    const enableUltra = flags.ui_ultra;
    
    // Computed values
    const shouldAnimate = enableMotion;
    const shouldUseBlur = !flags.perf_mode_lite;
    
    // Animation duration multiplier based on lite mode
    const animationDuration = (base: number): number => {
      if (!enableMotion) return 0;
      if (flags.perf_mode_lite) return base * 0.5;
      return base;
    };
    
    // Dynamic CSS classes - NO BLUR in lite mode
    const glassClass = shouldUseBlur 
      ? "bg-ai-surface/80 backdrop-blur-xl border border-ai-border/50" 
      : "bg-ai-surface/95 border border-ai-border/50";
    
    const glowClass = enableAmbient 
      ? "shadow-[0_0_30px_hsl(var(--holo-cyan)/0.2)]" 
      : "";
    
    const holoGradientClass = enableAmbient
      ? "bg-gradient-to-br from-holo-cyan/5 via-holo-purple/5 to-holo-pink/5"
      : "";
    
    return {
      enableCore,
      enableMotion,
      enableAmbient,
      enableParticles,
      enableUltra,
      shouldAnimate,
      shouldUseBlur,
      animationDuration,
      glassClass,
      glowClass,
      holoGradientClass,
    };
  }, [flags]);
}

// Utility hook for animation props
export function useAnimationProps(config: FuturisticUIConfig) {
  return useMemo(() => {
    if (!config.shouldAnimate) {
      return {
        initial: undefined,
        animate: undefined,
        transition: undefined,
      };
    }
    
    return {
      initial: { opacity: 0, y: 10 },
      animate: { opacity: 1, y: 0 },
      transition: { duration: config.animationDuration(0.3) },
    };
  }, [config]);
}
