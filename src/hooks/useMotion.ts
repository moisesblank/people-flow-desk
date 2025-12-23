// ============================================
// SYNAPSE v15.0 - Motion Kernel Hook
// GPU-only animations (transform/opacity)
// Respects prefers-reduced-motion
// ============================================

import { useMemo, useCallback } from "react";
import { usePerformance } from "@/hooks/usePerformance";

export interface MotionConfig {
  // States
  canAnimate: boolean;
  isLiteMode: boolean;
  
  // Durations (ms)
  instant: number;
  fast: number;
  normal: number;
  slow: number;
  
  // Easing
  easeOut: string;
  easeInOut: string;
  spring: string;
  
  // Helpers
  getDuration: (base: number) => number;
  getDelay: (index: number, stagger?: number) => number;
  
  // Framer Motion presets (GPU-only)
  fadeIn: object;
  fadeUp: object;
  fadeDown: object;
  scaleIn: object;
  slideInRight: object;
  slideInLeft: object;
  
  // State animations
  successPop: object;
  errorShake: object;
  
  // Hover/Press (inline styles)
  hoverScale: object;
  pressScale: object;
  hoverGlow: object;
}

export function useMotion(): MotionConfig {
  const { 
    shouldReduceMotion, 
    isSlowConnection, 
    isLowEndDevice 
  } = usePerformance();
  
  return useMemo(() => {
    const isLiteMode = isLowEndDevice || isSlowConnection;
    const canAnimate = !shouldReduceMotion && !isLiteMode;
    
    // Duration multipliers based on device
    const durationMultiplier = shouldReduceMotion ? 0 : isLiteMode ? 0.5 : 1;
    
    // Base durations (ms)
    const instant = 100 * durationMultiplier;
    const fast = 150 * durationMultiplier;
    const normal = 250 * durationMultiplier;
    const slow = 400 * durationMultiplier;
    
    // Easing curves
    const easeOut = "cubic-bezier(0.16, 1, 0.3, 1)";
    const easeInOut = "cubic-bezier(0.4, 0, 0.2, 1)";
    const spring = "cubic-bezier(0.34, 1.56, 0.64, 1)";
    
    // Helper: scale duration
    const getDuration = (base: number): number => {
      if (shouldReduceMotion) return 0;
      return base * durationMultiplier;
    };
    
    // Helper: stagger delay
    const getDelay = (index: number, stagger = 0.05): number => {
      if (shouldReduceMotion) return 0;
      return index * stagger;
    };
    
    // Empty animation for reduced motion
    const noAnimation = {};
    
    // Framer Motion presets - GPU ONLY (transform + opacity)
    const fadeIn = canAnimate ? {
      initial: { opacity: 0, y: 10 },
      animate: { opacity: 1, y: 0 },
      exit: { opacity: 0, y: 10 },
      transition: { duration: normal / 1000, ease: [0.16, 1, 0.3, 1] },
    } : noAnimation;
    
    const fadeUp = canAnimate ? {
      initial: { opacity: 0, y: 20 },
      animate: { opacity: 1, y: 0 },
      exit: { opacity: 0, y: 20 },
      transition: { duration: normal / 1000, ease: [0.16, 1, 0.3, 1] },
    } : noAnimation;
    
    const fadeDown = canAnimate ? {
      initial: { opacity: 0, y: -10 },
      animate: { opacity: 1, y: 0 },
      exit: { opacity: 0, y: -10 },
      transition: { duration: fast / 1000, ease: [0.16, 1, 0.3, 1] },
    } : noAnimation;
    
    const scaleIn = canAnimate ? {
      initial: { opacity: 0, scale: 0.95 },
      animate: { opacity: 1, scale: 1 },
      exit: { opacity: 0, scale: 0.95 },
      transition: { duration: fast / 1000, ease: [0.16, 1, 0.3, 1] },
    } : noAnimation;
    
    const slideInRight = canAnimate ? {
      initial: { opacity: 0, x: 20 },
      animate: { opacity: 1, x: 0 },
      exit: { opacity: 0, x: 20 },
      transition: { duration: normal / 1000, ease: [0.16, 1, 0.3, 1] },
    } : noAnimation;
    
    const slideInLeft = canAnimate ? {
      initial: { opacity: 0, x: -20 },
      animate: { opacity: 1, x: 0 },
      exit: { opacity: 0, x: -20 },
      transition: { duration: normal / 1000, ease: [0.16, 1, 0.3, 1] },
    } : noAnimation;
    
    // State animations
    const successPop = canAnimate ? {
      initial: { opacity: 0, scale: 0.8 },
      animate: { opacity: 1, scale: [0.8, 1.05, 1] },
      transition: { duration: slow / 1000, ease: [0.34, 1.56, 0.64, 1] },
    } : noAnimation;
    
    const errorShake = canAnimate ? {
      animate: { x: [0, -4, 4, -4, 4, 0] },
      transition: { duration: slow / 1000, ease: "easeOut" },
    } : noAnimation;
    
    // Hover/Press - whileHover/whileTap for framer-motion
    const hoverScale = canAnimate ? {
      whileHover: { scale: 1.02 },
      whileTap: { scale: 0.98 },
      transition: { duration: instant / 1000 },
    } : noAnimation;
    
    const pressScale = canAnimate ? {
      whileTap: { scale: 0.98 },
      transition: { duration: instant / 1000 },
    } : noAnimation;
    
    const hoverGlow = canAnimate ? {
      whileHover: { 
        boxShadow: "0 0 25px hsl(var(--holo-cyan) / 0.25)",
      },
      transition: { duration: fast / 1000 },
    } : noAnimation;
    
    return {
      canAnimate,
      isLiteMode,
      instant,
      fast,
      normal,
      slow,
      easeOut,
      easeInOut,
      spring,
      getDuration,
      getDelay,
      fadeIn,
      fadeUp,
      fadeDown,
      scaleIn,
      slideInRight,
      slideInLeft,
      successPop,
      errorShake,
      hoverScale,
      pressScale,
      hoverGlow,
    };
  }, [shouldReduceMotion, isSlowConnection, isLowEndDevice]);
}

// Stagger children helper for lists
export function useStaggerChildren(itemCount: number, staggerMs = 50) {
  const { canAnimate } = useMotion();
  
  return useMemo(() => {
    if (!canAnimate) return { container: {}, item: {} };
    
    return {
      container: {
        initial: "hidden",
        animate: "visible",
        variants: {
          hidden: { opacity: 0 },
          visible: {
            opacity: 1,
            transition: {
              staggerChildren: staggerMs / 1000,
              delayChildren: 0.1,
            },
          },
        },
      },
      item: {
        variants: {
          hidden: { opacity: 0, y: 10 },
          visible: { opacity: 1, y: 0 },
        },
      },
    };
  }, [canAnimate, staggerMs]);
}
