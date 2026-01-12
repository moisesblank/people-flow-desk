// ============================================
// 🎬 OPTIMIZED ANIMATION SYSTEM v1.0
// ============================================
// Strategy:
// 1. KEEP: Button feedback, loaders, page fade, toasts
// 2. CONDITIONAL: Glow, particles, parallax (high-end only)
// 3. REMOVE: Stagger, scroll animations, long animations
// 4. CSS-FIRST: Simple transitions use CSS, not framer-motion
// ============================================

import { useMemo, useCallback } from 'react';
import { useConstitutionPerformance } from './useConstitutionPerformance';

// ============================================
// TYPES
// ============================================

export interface AnimationConfig {
  // Device state
  isHighEnd: boolean;
  isLowEnd: boolean;
  isCritical: boolean;
  reducedMotion: boolean;
  
  // Animation categories
  canUseEssential: boolean;      // Button press, loaders, toasts
  canUseDecorative: boolean;     // Glow, particles, parallax
  canUsePageTransitions: boolean; // Fade between pages
  
  // Durations (ms)
  instant: number;   // 0ms
  fast: number;      // 100ms
  normal: number;    // 150ms  
  
  // CSS classes for essential animations
  cssClasses: {
    fadeIn: string;
    fadeOut: string;
    scalePress: string;
    spin: string;
  };
  
  // Framer motion props - ONLY for essential animations
  fadeProps: object;
  pressProps: object;
  toastProps: object;
  
  // Helpers
  getTransitionClass: () => string;
  
  // Decorative (conditional)
  glowClass: string;
  particlesEnabled: boolean;
  parallaxEnabled: boolean;
  scanlineEnabled: boolean;
}

// ============================================
// CONSTANTS
// ============================================

// Max animation duration allowed (per strategy)
const MAX_DURATION_MS = 300;

// Essential durations
const DURATION = {
  INSTANT: 0,
  FAST: 100,
  NORMAL: 150, // Page transitions
} as const;

// ============================================
// MAIN HOOK
// ============================================

export function useOptimizedAnimation(): AnimationConfig {
  const { 
    tier, 
    isLowEnd, 
    isCritical,
    reducedMotion,
    shouldAnimate,
    shouldShowParticles,
    isSaveData,
    connectionType,
  } = useConstitutionPerformance();
  
  return useMemo(() => {
    // Device detection
    const isHighEnd = tier === 'quantum' || tier === 'neural';
    const memoryLow = typeof navigator !== 'undefined' && 
      ((navigator as any).deviceMemory || 8) < 4;
    const slowConnection = connectionType === '2g' || connectionType === 'slow-2g';
    
    // Force disable ALL decorative if: <4GB RAM, slow connection, or save data
    const forceMinimal = memoryLow || slowConnection || isSaveData || reducedMotion;
    
    // Category flags
    const canUseEssential = !reducedMotion; // Always allow unless reduced motion
    const canUseDecorative = isHighEnd && !forceMinimal;
    const canUsePageTransitions = shouldAnimate && !isCritical;
    
    // Durations
    const instant = DURATION.INSTANT;
    const fast = canUseEssential ? DURATION.FAST : 0;
    const normal = canUsePageTransitions ? DURATION.NORMAL : 0;
    
    // CSS classes for essential animations (CSS-only, no framer-motion)
    const cssClasses = {
      fadeIn: canUseEssential ? 'animate-optimized-fade-in' : '',
      fadeOut: canUseEssential ? 'animate-optimized-fade-out' : '',
      scalePress: canUseEssential ? 'active:scale-[0.98]' : '',
      spin: 'animate-spin', // Loaders always work
    };
    
    // Framer motion props - MINIMAL, only for what CSS can't do
    const fadeProps = canUsePageTransitions 
      ? {
          initial: { opacity: 0 },
          animate: { opacity: 1 },
          exit: { opacity: 0 },
          transition: { duration: 0.15 },
        }
      : {};
    
    const pressProps = canUseEssential
      ? {
          whileTap: { scale: 0.98 },
          transition: { duration: 0.1 },
        }
      : {};
    
    const toastProps = canUseEssential
      ? {
          initial: { opacity: 0, y: -10 },
          animate: { opacity: 1, y: 0 },
          exit: { opacity: 0, y: -10 },
          transition: { duration: 0.15 },
        }
      : {};
    
    // Helper for transition classes
    const getTransitionClass = () => 
      canUseEssential 
        ? 'transition-all duration-150 ease-out' 
        : '';
    
    // Decorative elements (high-end only)
    const glowClass = canUseDecorative ? 'shadow-glow-sm' : '';
    const particlesEnabled = canUseDecorative && shouldShowParticles;
    const parallaxEnabled = canUseDecorative;
    const scanlineEnabled = canUseDecorative;
    
    return {
      // Device state
      isHighEnd,
      isLowEnd,
      isCritical,
      reducedMotion,
      
      // Categories
      canUseEssential,
      canUseDecorative,
      canUsePageTransitions,
      
      // Durations
      instant,
      fast,
      normal,
      
      // CSS classes
      cssClasses,
      
      // Framer props
      fadeProps,
      pressProps,
      toastProps,
      
      // Helpers
      getTransitionClass,
      
      // Decorative
      glowClass,
      particlesEnabled,
      parallaxEnabled,
      scanlineEnabled,
    };
  }, [
    tier, 
    isLowEnd, 
    isCritical, 
    reducedMotion, 
    shouldAnimate, 
    shouldShowParticles,
    isSaveData,
    connectionType,
  ]);
}

// ============================================
// HELPER HOOKS
// ============================================

/**
 * Check if decorative animations should render
 */
export function useCanDecorate(): boolean {
  const { canUseDecorative } = useOptimizedAnimation();
  return canUseDecorative;
}

/**
 * Get press animation props for buttons
 */
export function usePressAnimation() {
  const { pressProps, cssClasses } = useOptimizedAnimation();
  return {
    motionProps: pressProps,
    className: cssClasses.scalePress,
  };
}

/**
 * Get page transition props
 */
export function usePageTransition() {
  const { fadeProps, canUsePageTransitions } = useOptimizedAnimation();
  return {
    enabled: canUsePageTransitions,
    props: fadeProps,
  };
}

// ============================================
// CSS CLASS GENERATOR
// For components that need conditional classes
// ============================================

export function useAnimationClasses() {
  const config = useOptimizedAnimation();
  
  return useCallback((options: {
    fade?: boolean;
    glow?: boolean;
    transition?: boolean;
  }) => {
    const classes: string[] = [];
    
    if (options.fade && config.cssClasses.fadeIn) {
      classes.push(config.cssClasses.fadeIn);
    }
    
    if (options.glow && config.glowClass) {
      classes.push(config.glowClass);
    }
    
    if (options.transition) {
      classes.push(config.getTransitionClass());
    }
    
    return classes.join(' ');
  }, [config]);
}

// ============================================
// NO-OP STAGGER (removes stagger animations)
// Use this to replace existing stagger logic
// ============================================

export const STAGGER_DISABLED = {
  container: {},
  item: {},
};

// ============================================
// STATIC VARIANTS (no animation)
// For components that had complex animations
// ============================================

export const STATIC_VARIANTS = {
  initial: {},
  animate: {},
  exit: {},
};

export default useOptimizedAnimation;
