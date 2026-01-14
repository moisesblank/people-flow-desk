// ============================================
// 🌌🔥 SANCTUM OMEGA ULTRA - INDEX 🔥🌌
// Exportações centralizadas do sistema de proteção
// ============================================

// Hook principal
export { useSanctumOmega, SANCTUM_OMEGA_CONFIG } from "@/hooks/useSanctumOmega";
export type { 
  SanctumAssetPage, 
  SanctumManifest, 
  SanctumState, 
  UseSanctumOmegaReturn 
} from "@/hooks/useSanctumOmega";

// Utilitários
export {
  // OWNER_EMAIL removido - P1-2 FIX: usar role='owner'
  SANCTUM_BUCKETS,
  VIOLATION_TYPES,
  SEVERITY_LEVELS,
  isOwnerEmail, // deprecated - retorna false
  isOwnerByRole,
  checkUserLock,
  getUserRiskScore,
  getSanctumStats,
  detectDevTools,
  sha256Hash,
  generateDeviceFingerprint,
  setupContentProtection,
  formatLockTime,
  antiScreenshotCSS,
} from "./sanctumUtils";
export type { SanctumStats } from "./sanctumUtils";

// Componente visualizador
export { SanctumAssetViewer } from "@/components/security/SanctumAssetViewer";
