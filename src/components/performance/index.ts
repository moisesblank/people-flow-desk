// ============================================
// 🌌🔥 PERFORMANCE COMPONENTS — EXPORTS NÍVEL NASA 🔥🌌
// ANO 2300 — DESIGN FUTURISTA COM RENDIMENTO 3500
// ============================================

// Componentes principais
export { ClickToLoadVideo } from "./ClickToLoadVideo";
export { OptimizedImage } from "./OptimizedImage";
export { LazyChart } from "./LazyChart";
export { Motion, AnimatePresenceWrapper, motionPresets, fadeIn, slideUp, slideIn, scaleIn, staggerChildren } from "./LazyMotion";
export { PerformanceOverlay } from "./PerformanceOverlay";

// Componentes lazy
export { LazyMount } from "./LazyMount";
export { LazySection } from "./LazySection";
export { SacredImage } from "./SacredImage";
export { createLazyComponent } from "./SacredLazyComponent";
export { SacredLazySection } from "./SacredLazySection";
export { VirtualList } from "./VirtualList";

// Re-export do sistema de flags
export { 
  perfFlags, 
  detectDeviceCapabilities, 
  getPerformanceConfig,
  savePerformanceConfig,
  setupPerformanceListener,
  useLiteMode, 
  useMotionEnabled, 
  useChartsEnabled,
  shouldAnimate,
  shouldBlur,
  isLiteMode,
  getImageQuality,
  getAnimationDuration,
  getPrefetchMargin,
  getPerformanceClasses,
} from "@/lib/performance/performanceFlags";

export type { PerformanceConfig, DeviceCapabilities, PerformanceTier } from "@/lib/performance/performanceFlags";

// Re-export do hook
export { usePerformance, usePerformanceMode, useNetworkInfo, useReducedMotion, useViewport, useLazyLoad, useDebounce, useThrottle, useOptimizedAnimations } from "@/hooks/usePerformance";
