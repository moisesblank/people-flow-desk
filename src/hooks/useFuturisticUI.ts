// ============================================
// SYNAPSE v15.0 - Futuristic UI Feature Flags
// Performance-first: respects reduced motion, lite mode
// ============================================

import { useMemo } from "react";
import { usePerformance } from "@/hooks/usePerformance";

// Feature flags - can be controlled via sna_feature_flags or local
const UI_FLAGS = {
  ui_futuristic_core: true,      // Base tokens and styles
  ui_futuristic_motion: true,    // Microanimations
  ui_ambient_fx: true,           // Ambient holographic effects
  ui_particles: false,           // Heavy particles (off by default)
  ui_ultra: false,               // Ultra effects (hardware dependent)
} as const;

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
  const { 
    shouldReduceMotion, 
    isSlowConnection, 
    isLowEndDevice 
  } = usePerformance();
  
  return useMemo(() => {
    // Respect user preferences and device capabilities
    const isLiteMode = isLowEndDevice || isSlowConnection;
    const canAnimate = !shouldReduceMotion && !isLiteMode;
    
    // Flag states (respect lite mode)
    const enableCore = UI_FLAGS.ui_futuristic_core;
    const enableMotion = UI_FLAGS.ui_futuristic_motion && canAnimate;
    const enableAmbient = UI_FLAGS.ui_ambient_fx && canAnimate && !isLiteMode;
    const enableParticles = UI_FLAGS.ui_particles && canAnimate && !isLiteMode;
    const enableUltra = UI_FLAGS.ui_ultra && canAnimate && !isLiteMode && !isSlowConnection;
    
    // Computed values
    const shouldAnimate = enableMotion && canAnimate;
    const shouldUseBlur = !isLiteMode; // Blur is expensive on low-end
    
    // Animation duration multiplier based on device
    const animationDuration = (base: number): number => {
      if (shouldReduceMotion) return 0;
      if (isLiteMode) return base * 0.5;
      return base;
    };
    
    // Dynamic CSS classes
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
  }, [shouldReduceMotion, isSlowConnection, isLowEndDevice]);
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
