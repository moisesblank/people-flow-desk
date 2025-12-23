// ============================================
// 🌌🔥 PERFORMANCE COMPONENTS — EXPORTS NÍVEL NASA 🔥🌌
// ANO 2300 — DESIGN FUTURISTA COM RENDIMENTO 3500
// ESTE É O PROJETO DA VIDA DO MESTRE MOISÉS MEDEIROS
// ============================================

// Componentes principais
export { ClickToLoadVideo } from "./ClickToLoadVideo";
export { OptimizedImage } from "./OptimizedImage";
export { LazyChart } from "./LazyChart";
export { Motion, AnimatePresenceWrapper, fadeIn, slideUp, slideIn, scaleIn, staggerChildren } from "./LazyMotion";
export { PerformanceOverlay } from "./PerformanceOverlay";

// Re-export do sistema de flags
export { perfFlags, detectDeviceCapabilities, useLiteMode, useMotionEnabled, useChartsEnabled } from "@/lib/performance/performanceFlags";
export type { PerformanceConfig, DeviceCapabilities } from "@/lib/performance/performanceFlags";

// Re-export do hook
export { usePerformance } from "@/hooks/usePerformance";
export type { PerformanceMetrics } from "@/hooks/usePerformance";
