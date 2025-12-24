// ============================================
// ☁️ CLOUDFLARE MODULE — EXPORTS CENTRALIZADOS
// ============================================

// Safe SPA Profile (MODO A / MODO B)
export {
  MODO_A_DNS_ONLY,
  MODO_B_PROXIED_SAFE,
  CLOUDFLARE_ACTIVE_MODE,
  getActiveCloudflareProfile,
  MODO_B_CHECKLIST,
  verifyCloudflareReadiness,
  isCloudflareBypassUser,
} from "./cloudflareSPAProfile";

export type {
  CloudflareMode,
  ProxyStatus,
  CloudflareDomainConfig,
  CloudflareSpeedConfig,
  CloudflareCacheRule,
  CloudflareRateLimitRule,
  CloudflareWAFConfig,
  CloudflareSafeProfile,
  ModoB_ChecklistItem,
  CloudflareVerificationResult,
} from "./cloudflareSPAProfile";

// Deploy Integrity Gate
export {
  checkHTMLGate,
  checkRuntimeIntegrity,
  checkDomainDeploy,
  checkAllDomainsIntegrity,
  useDeployIntegrity,
  DEPLOY_CHECKLIST,
  REBIND_PROCESS,
  MONITORED_DOMAINS,
  isOwnerBypass,
} from "./deployIntegrityGate";

export type {
  DeployEnvironment,
  HTMLGateResult,
  DomainDeployStatus,
  DeployChecklist,
} from "./deployIntegrityGate";

// Legacy Redirects
export {
  LEGACY_REDIRECTS,
  handleLegacyRedirect,
  shouldRedirect,
  getRedirectTarget,
  logLegacyRedirect,
  useLegacyRedirect,
} from "./legacyRedirects";

export type {
  LegacyRedirect,
  RedirectResult,
} from "./legacyRedirects";
