// ============================================
// 🔒 SECURITY — BARREL EXPORT UNIFICADO
// ============================================
// Centraliza todas as funcionalidades de segurança do sistema
// Importação única: import { ... } from "@/security"
// ============================================

// ============================================
// 1️⃣ CONTROLE DE ACESSO (core/access)
// ============================================
export {
  OWNER_EMAIL,
  isOwner,
  isImmune,
  isGestaoRole,
  isAlunoRole,
  canAccessArea,
  getUrlArea,
  isPublicPath,
  canAccessUrl,
  validateAccess,
  getPostLoginRedirect,
  IMMUNE_ROLES,
  GESTAO_ROLES,
  ALUNO_ROLES,
  COMUNIDADE_ROLES,
  ROLE_TO_CATEGORY,
  ROLE_PERMISSIONS,
  OWNER_ONLY_PATHS,
  PUBLIC_PATHS,
  type AppRole,
  type SystemDomain,
  type AccessCategory,
  type RolePermissions,
  type AccessValidationResult,
} from "@/core/access";

// ============================================
// 2️⃣ INTEGRIDADE DO SISTEMA (core/integrity)
// Funções de validação de rotas, funções e navegação
// ============================================
export {
  // Route Registry
  assertRouteExists,
  hasValidDefinition,
  getRoutePath,
  validateNavToRoute,
  validateRouteGuards,
  getRoutesByStatus,
  
  // Function Registry
  functionExists,
  getFunctionById,
  assertFunctionExists,
  validateUITriggers,
  validateFunctionBackends,
  validateFunctionTelemetry,
  validateFunctionTests,
  auditFunctions,
  getFunctionsByDomain,
  getFunctionsByStatus,
  getActiveFunction,
  getComingSoonFunctions,
  getAllFunctionIds,
  
  // Nav Registry
  loadNavFromSupabase,
  normalizeNavLayout,
  auditNavLayout,
  filterNavByRole,
  
  // Security Registry
  hasCapability,
  getCapabilities,
  canAccessFunction,
  getTablePIILevel,
  validateDataSecurity,
  auditSecurity,
  isOwner as isOwnerIntegrity,
  isGestaoRole as isGestaoRoleIntegrity,
  isBetaRole,
  isImmune as isImmuneIntegrity,
  ROLE_CAPABILITIES,
  PII_TABLES,
  
  // Storage Registry
  validateStorageBuckets,
  auditStorage,
  validateUpload,
  getBucketsByAccess,
  requiresWatermark,
  requiresEncryption,
  
  // Telemetry Registry
  generateCorrelationId as generateIntegrityCorrelationId,
  getCorrelationId,
  resetCorrelationId,
  configureAudit,
  logAuditEvent,
  auditNavigation,
  auditCrud,
  auditAuth,
  auditUpload,
  getTelemetryMetrics,
  
  // Integrity Validator
  runIntegrityCheck,
  generateMarkdownReport,
  INTEGRITY_VERSION,
  
  // Omega Wrappers
  OmegaProvider,
  FnLink,
  FnButton,
  FnMenuItem,
  FnUpload,
  FnDownload,
  FnForm,
  
  // Dead Click Interlock
  useDeadClickInterlock,
  DeadClickInterlockProvider,
  
  // Types
  type FunctionId,
  type NavToRouteMapping,
  type RouteToGuardMapping,
  type IntegrityReport,
  type IntegrityIssue,
  type AuditConfig,
  type Capability,
} from "@/core/integrity";

// ============================================
// 3️⃣ SEGURANÇA RUNTIME (lib/security)
// ============================================
export {
  // Sanctum Gate
  sanctumGuard,
  useSanctumGuard,
  generateCorrelationId,
  hashValue,
  hasRoleAccess,
  isOwnerEmail,
  checkRateLimit,
  checkLockout,
  recordFailedAttempt,
  clearLockout,
  writeAuditLog,
  ROLES,
  ROLE_HIERARCHY,
  LOCKDOWN_FLAGS,
  LOCKOUT_POLICY,
  
  // Webhook Guard
  webhookGuard,
  verifyHmacSignature,
  verifyTimestamp,
  verifyNonce,
  checkIdempotency,
  markAsProcessed,
  checkWebhookRateLimit,
  verifyHotmartWebhook,
  verifyWhatsAppWebhook,
  verifyStripeWebhook,
  
  // Content Shield
  requestContentAccess,
  verifyContentAccess,
  contentHeartbeat,
  generateWatermarkText,
  generateContentToken,
  decodeContentToken,
  validateContentToken,
  countActiveSessions,
  registerContentSession,
  heartbeatContentSession,
  revokeContentSession,
  revokeAllContentSessions,
  checkContentRateLimit,
  
  // Auth Guard
  secureLogin,
  secureSignup,
  secureRecovery,
  validateSession,
  revokeAllUserSessions,
  requiresStepUpAuth,
  requestStepUpAuth,
  
  // Cloudflare
  validateCloudflareRequest,
  extractCloudflareContext,
  checkCloudflareRateLimit,
  getSecureResponseHeaders,
  DEFAULT_CLOUDFLARE_CONFIG,
  SECURITY_HEADERS,
  RECOMMENDED_WAF_RULES,
  RECOMMENDED_PAGE_RULES,
  MODO_A_DNS_ONLY,
  MODO_B_PROXIED_SAFE,
  getActiveCloudflareProfile,
  verifyCloudflareReadiness,
  checkHTMLGate,
  checkRuntimeIntegrity,
  DEPLOY_CHECKLIST,
  LEGACY_REDIRECTS,
  shouldRedirect,
  handleLegacyRedirect,
} from "@/lib/security";

export type {
  SanctumPrincipal,
  SanctumGuardOptions,
  SanctumGuardResult,
  WebhookVerifyOptions,
  WebhookVerifyResult,
  IdempotencyCheckResult,
  ContentToken,
  ContentAccessOptions,
  ContentAccessResult,
  WatermarkConfig,
  AuthAttemptResult,
  LoginOptions,
  SignupOptions,
  RecoveryOptions,
  CloudflareHeaders,
  CloudflareContext,
  CloudflareSecurityConfig,
} from "@/lib/security";

// ============================================
// 4️⃣ CONSTITUIÇÃO — LEIS (lib/constitution)
// Re-export seletivo para evitar conflitos
// ============================================
export {
  // LEI I
  LEI_I,
  
  // LEI II
  LEI_II,
  
  // LEI III
  LEI_III,
  useSecurityConstitution,
  logLeiIIIStatus,
  LEI_III_VERSION,
  LEI_III_ARTICLES,
  LEI_III_ACTIVE,
  checkUrlAccessFast,
  isOwnerBypass,
  sanitizeInput,
  sanitizeForDisplay,
  isValidUUID,
  isValidEmail,
  isValidPhone,
  isValidCPF,
  maskEmail,
  maskPhone,
  maskCPF,
  logSecurityEvent,
  detectSuspiciousActivity,
  blockDangerousActions,
  
  // LEI IV
  LEI_IV,
  SNA_CONFIG,
  EVENT_HANDLERS,
  useSNAConstitution,
  
  // LEI VII
  LEI_VII,
  LEI_VII_VERSION,
  LEI_VII_ARTICLES,
  LEI_VII_ACTIVE,
  getLeiVIIStatus,
  logLeiVIIStatus,
  THREAT_THRESHOLDS,
  EVENT_SEVERITIES,
  BLOCKED_SHORTCUTS,
  
  // Constitution status
  checkConstitutionStatus,
  logConstitutionStatus,
  validateUrlAccess,
  URL_MAP,
  
  // Executor
  executeLeiVII,
  updateLeiVIIUser,
  getLeiVIIExecutionStatus,
} from "@/lib/constitution";

// ============================================
// 5️⃣ SANCTUM UTILS (lib/sanctum)
// ============================================
export * from "@/lib/sanctum";
