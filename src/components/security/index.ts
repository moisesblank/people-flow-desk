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
export { ProtectedPDFViewerV2 } from './ProtectedPDFViewerV2';

// Beta Access Guard
export { BetaAccessGuard } from './BetaAccessGuard';

// C021 - MFA Guard (Admin MFA Enforcement) - LEGADO
export { MFAGuard } from './MFAGuard';

// 🆕 MFA ACTION GUARD v2.0 — 2FA Isolado por Ação Sensível
// Totalmente desacoplado de login/sessão/dispositivo
export { MFAActionGuard, MFAProtectedButton } from './MFAActionGuard';
export { MFAActionModal } from './MFAActionModal';
// MFAPageGuard REMOVIDO - DeviceMFAGuard já cobre proteção por dispositivo

// 🆕 DEVICE MFA GUARD — 2FA por Dispositivo (Gate de Entrada)
// Exige verificação uma vez por dispositivo novo, cache 24h
export { DeviceMFAGuard } from './DeviceMFAGuard';

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

// 🎯 RE-EXPORTAR ÁREAS DA FONTE ÚNICA
export type { SystemArea } from '@/core/areas';
export { SYSTEM_AREAS, URL_TO_AREA as CANONICAL_URL_TO_AREA, ROLE_AREA_PERMISSIONS } from '@/core/areas';

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

// ⚡ CONSOLIDADO v11.0: useSanctumIntegrated foi removido (redundante)
// Use useSanctumCore ou useSanctumOmega diretamente

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

// ============================================
// 🛡️ SANCTUM GATE v1.0 (PORTEIRO BANCÁRIO)
// ============================================

export {
  // Função principal
  sanctumGuard,
  useSanctumGuard,
  
  // Constantes e tipos
  OWNER_EMAIL as SANCTUM_OWNER_EMAIL,
  ROLES,
  ROLE_HIERARCHY,
  LOCKDOWN_FLAGS,
  
  // Rate Limit
  checkRateLimit as checkSanctumRateLimit,
  
  // Lockout progressivo
  checkLockout,
  recordFailedAttempt,
  clearLockout,
  LOCKOUT_POLICY,
  
  // Utilitários
  generateCorrelationId,
  hashValue,
  hasRoleAccess,
  isOwnerEmail as isOwnerSanctum,
  writeAuditLog as writeSanctumAuditLog,
  
  // Tipos
  type AppRole,
  type SanctumPrincipal,
  type SanctumGuardOptions,
  type SanctumGuardResult,
} from '@/lib/security/sanctumGate';

// ============================================
// 🛡️ WEBHOOK GUARD v1.0 (PROTEÇÃO ANTI-FALSIFICAÇÃO)
// ============================================

export {
  // Função principal
  webhookGuard,
  useWebhookGuard,
  
  // Verificações
  verifyHmacSignature,
  verifyTimestamp,
  verifyNonce,
  checkIdempotency,
  markAsProcessed,
  checkWebhookRateLimit,
  
  // Verificadores específicos por provider
  verifyHotmartWebhook,
  verifyStripeWebhook,
  verifyWhatsAppWebhook,
  verifyWordPressWebhook,
  verifyPandaWebhook,
  
  // Configuração
  WEBHOOK_CONFIG,
  
  // Tipos
  type WebhookSource,
  type WebhookVerifyOptions,
  type WebhookVerifyResult,
  type IdempotencyCheckResult,
} from '@/lib/security/webhookGuard';

// ============================================
// 🛡️ CONTENT SHIELD v1.0 (PROTEÇÃO DE CONTEÚDO)
// ============================================

export {
  // Função principal
  requestContentAccess,
  verifyContentAccess,
  contentHeartbeat,
  
  // Validação
  validateContentToken,
  generateContentToken,
  decodeContentToken,
  
  // Watermark
  generateWatermarkText,
  
  // Sessões
  countActiveSessions,
  registerContentSession,
  heartbeatContentSession,
  revokeContentSession,
  revokeAllSessions,
  
  // Rate limit
  checkContentRateLimit,
  
  // Configuração
  CONTENT_SHIELD_CONFIG,
  
  // Tipos
  type ContentToken,
  type ContentAccessOptions,
  type ContentAccessResult,
  type WatermarkConfig,
} from '@/lib/security/contentShield';

// ============================================
// 🛡️ AUTH GUARD v1.0 (AUTENTICAÇÃO SEGURA)
// ============================================

export {
  // Funções principais
  secureLogin,
  secureSignup,
  secureRecovery,
  secureLogout,
  checkAuth,
  
  // Sessões
  validateSession,
  revokeAllUserSessions,
  
  // Step-up auth
  requiresStepUpAuth,
  requestStepUpAuth,
  
  // Configuração
  AUTH_GUARD_CONFIG,
  
  // Tipos
  type AuthAttemptResult,
  type LoginOptions,
  type SignupOptions,
  type RecoveryOptions,
} from '@/lib/security/authGuard';

// ============================================
// ☁️ CLOUDFLARE INTEGRATION v1.0 (WAF + CDN + BOT PROTECTION)
// ============================================

export {
  // Funções principais
  extractCloudflareContext,
  validateCloudflareRequest,
  checkCloudflareRateLimit,
  cleanupCloudflareRateLimits,
  generateSecurityHeaders,
  getSecureResponseHeaders,
  
  // Helpers
  useCloudflareContext,
  isCloudflareBypass,
  getCloudflareConfigForRoute,
  
  // Configurações
  DEFAULT_CLOUDFLARE_CONFIG,
  ROUTE_CLOUDFLARE_CONFIGS,
  SECURITY_HEADERS,
  RECOMMENDED_WAF_RULES,
  RECOMMENDED_PAGE_RULES,
  
  // Tipos
  type CloudflareHeaders,
  type CloudflareContext,
  type CloudflareSecurityConfig,
  type CloudflareValidationResult,
  type WafRule,
  type PageRule,
} from '@/lib/security/cloudflareIntegration';
