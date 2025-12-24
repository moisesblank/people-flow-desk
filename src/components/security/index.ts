// ============================================
// 🛡️ FORTALEZA SUPREME v4.0 FINAL
// SISTEMA DE SEGURANÇA PHD-LEVEL 2300
// Exportações Centralizadas
// ============================================

// ============================================
// COMPONENTES DE GUARDA
// ============================================

// DOGMA I - Sessão Única
export { SessionGuard } from './SessionGuard';

// DOGMA XI - Controle de Dispositivos
export { DeviceGuard } from './DeviceGuard';
export { DeviceLimitModal } from './DeviceLimitModal';
export { TrustedDevicesManager } from './TrustedDevicesManager';

// DOGMA III - Proteção de Conteúdo
export { ProtectedPDFViewer } from './ProtectedPDFViewer';

// Beta Access Guard
export { BetaAccessGuard } from './BetaAccessGuard';

// C021 - MFA Guard (Admin MFA Enforcement)
export { MFAGuard } from './MFAGuard';

// ============================================
// COMPONENTES DE DASHBOARD
// ============================================

export { SecurityDashboard } from './SecurityDashboard';
export { SecurityStatusWidget } from './SecurityStatusWidget';

// ============================================
// 🛡️ FORTALEZA SUPREME v4.0 (API Principal)
// ============================================

export {
  // Funções principais
  checkUrlAccess,
  checkRateLimit,
  checkRateLimitExtended,
  logSecurityEvent as logSecuritySupreme,
  logAudit,
  getSecurityDashboard,
  cleanupSecurityData,
  
  // Rate limiting client-side
  checkClientRateLimit,
  resetClientRateLimit,
  
  // Detecção de ameaças
  detectSuspiciousActivity,
  detectScreenCapture,
  
  // Sanitização e validação
  sanitizeInput,
  sanitizeHtml,
  isValidUUID,
  isValidEmail,
  isValidPhone,
  maskEmail,
  maskPhone,
  maskCPF,
  
  // Utils
  debounce,
  throttle,
  
  // Configurações
  URL_MAP,
  SECURITY_CONFIG as FORTALEZA_CONFIG,
  
  // Tipos
  type ThreatLevel,
  type SecurityAction,
  type AttackType,
  type UrlAccessResult,
  type RateLimitResult,
  type RateLimitResultExtended,
  type SecurityDashboard as SecurityDashboardType,
  type ThreatIntelligence,
  type SecurityEvent,
} from '@/lib/security/fortalezaSupreme';

// ============================================
// HOOKS DE SEGURANÇA
// ============================================

export {
  useUrlAccessGuard,
  useRateLimiter,
  useRateLimiterExtended,
  useSecurityDashboard,
  useThreatDetection,
  useSecurityLogger,
  useAuditLogger,
  useSessionSecurity,
  useSecurityStatus,
  useScreenCaptureProtection,
} from '@/hooks/useFortalezaSupreme';

// ============================================
// FINGERPRINTING
// ============================================

export { 
  generateDeviceFingerprint, 
  generateDeviceName, 
  detectDeviceType,
  clearFingerprintCache,
  isFingerprintCached 
} from '@/lib/deviceFingerprint';

// ============================================
// RE-EXPORTS PARA COMPATIBILIDADE
// ============================================

export { 
  logSecurityEvent as logSecurityEvent,
  SECURITY_CONFIG,
  type RateLimitEndpoint,
} from '@/lib/security/fortalezaSupreme';

// ============================================
// CONTENT PROTECTION (NOVO v4.1)
// ============================================

export {
  useContentProtection,
  useContentLogger,
  logContentAccess,
  type ContentType,
  type ContentAction,
} from '@/hooks/useContentProtection';

// ============================================
// ROLE PERMISSIONS
// ============================================

export {
  useRolePermissions,
  OWNER_EMAIL,
  URL_TO_AREA,
  ROLE_LABELS,
  FULL_ROLE_LABELS,
  ROLE_DESCRIPTIONS,
  ROLE_PERMISSIONS,
  isGestaoHost,
  isProHost,
  isPublicHost,
  type UserRole,
  type FullAppRole,
  type SystemArea,
} from '@/hooks/useRolePermissions';

// ============================================
// 🏛️ LEI VII - PROTEÇÃO DE CONTEÚDO SOBERANA
// ============================================

export {
  // Funções de status
  isOwner as isOwnerLeiVII,
  getLeiVIIStatus,
  logLeiVIIStatus,
  
  // Configurações
  THREAT_THRESHOLDS,
  EVENT_SEVERITIES,
  BLOCKED_SHORTCUTS,
  BLOCKED_MOUSE_EVENTS,
  BLOCKED_TOUCH_EVENTS,
  SUPPORTED_PLATFORMS,
  WATERMARK_REQUIREMENTS,
  VIDEO_PROTECTION_REQUIREMENTS,
  PDF_PROTECTION_REQUIREMENTS,
  WEB_BOOK_PROTECTION_REQUIREMENTS,
  FINGERPRINT_COMPONENTS,
  AUTOMATION_SIGNALS,
  OWNER_BYPASS,
  
  // Constantes
  LEI_VII_VERSION,
  LEI_VII_CODENAME,
  LEI_VII_ARTICLES,
  LEI_VII_ACTIVE,
  OWNER_EMAIL as OWNER_EMAIL_LEI_VII,
  
  // Tipos
  type ThreatLevel as SanctumThreatLevel,
  type ViolationType as SanctumViolationType,
  type ProtectionLevel,
  type ProtectedContentType,
} from '@/lib/constitution/LEI_VII_PROTECAO_CONTEUDO';

// ============================================
// SANCTUM ENFORCER (LEI VII Compliance)
// ============================================

export {
  checkLeiVIICompliance,
  logComplianceReport,
} from '@/lib/security/sanctumEnforcer';

// ============================================
// SANCTUM INTEGRATED HOOK
// ============================================

export {
  useSanctumIntegrated,
  type SanctumIntegratedConfig,
  type SanctumIntegratedReturn,
} from '@/hooks/useSanctumIntegrated';

// ============================================
// LEI VII ENFORCER COMPONENT (NOVO)
// ============================================

export { LeiVIIEnforcer } from './LeiVIIEnforcer';

// ============================================
// LEI VII EXECUTOR
// ============================================

export {
  executeLeiVII,
  updateLeiVIIUser,
  getLeiVIIExecutionStatus,
  type LeiVIIExecutionReport,
} from '@/lib/constitution/executeLeiVII';

// ============================================
// useLeiVII Hook
// ============================================

export {
  useLeiVII,
  useLeiVIIProtection,
} from '@/hooks/useLeiVII';
