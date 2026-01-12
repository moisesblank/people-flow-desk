// ============================================
// 🛡️🔥 SECURITY OMEGA — EXPORTS CENTRALIZADOS 🔥🛡️
// ANO 2300 — SEGURANÇA NÍVEL NASA + BRADESCO
// ESTE É O PROJETO DA VIDA DO MESTRE MOISÉS MEDEIROS
// ============================================

// ============================================
// SANCTUM GATE — O PORTEIRO BANCÁRIO
// ============================================
export {
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
  OWNER_EMAIL,
  ROLES,
  ROLE_HIERARCHY,
  LOCKDOWN_FLAGS,
  LOCKOUT_POLICY,
} from "./sanctumGate";

export type {
  SanctumPrincipal,
  SanctumGuardOptions,
  SanctumGuardResult,
  AppRole,
} from "./sanctumGate";

// ============================================
// WEBHOOK GUARD — PROTEÇÃO ANTI-FALSIFICAÇÃO
// ============================================
export {
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
} from "./webhookGuard";

export type {
  WebhookVerifyOptions,
  WebhookVerifyResult,
  IdempotencyCheckResult,
} from "./webhookGuard";

// ============================================
// CONTENT SHIELD — PROTEÇÃO DE CONTEÚDO
// ============================================
export {
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
  revokeAllSessions as revokeAllContentSessions,
  checkContentRateLimit,
} from "./contentShield";

export type {
  ContentToken,
  ContentAccessOptions,
  ContentAccessResult,
  WatermarkConfig,
} from "./contentShield";

// ============================================
// AUTH GUARD — AUTENTICAÇÃO NÍVEL BRADESCO
// ============================================
export {
  secureLogin,
  secureSignup,
  secureRecovery,
  validateSession,
  revokeAllUserSessions,
  requiresStepUpAuth,
  requestStepUpAuth,
} from "./authGuard";

export type {
  AuthAttemptResult,
  LoginOptions,
  SignupOptions,
  RecoveryOptions,
} from "./authGuard";

// ============================================
// CLOUDFLARE PRO INTEGRATION — NÍVEL PENTAGON
// ============================================
export {
  validateCloudflareRequest,
  extractCloudflareContext,
  checkCloudflareRateLimit,
  getSecureResponseHeaders,
  DEFAULT_CLOUDFLARE_CONFIG,
  SECURITY_HEADERS,
  RECOMMENDED_WAF_RULES,
  RECOMMENDED_PAGE_RULES,
  // v2.0 - SPA Profile + Deploy Integrity
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
} from "./cloudflareIntegration";

export type {
  CloudflareHeaders,
  CloudflareContext,
  CloudflareSecurityConfig,
} from "./cloudflareIntegration";

// ============================================
// ANTI-DEBUGGER LAYER v2.0
// ============================================
export {
  antiDebugger,
  initAntiDebugger,
  setOwnerMode as setAntiDebuggerOwnerMode,
  enableAggressiveMode,
} from "./antiDebugger";

// ============================================
// CLOUDFLARE MODULE (STANDALONE)
// ============================================
export * from "@/lib/cloudflare";
