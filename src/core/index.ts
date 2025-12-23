// ============================================
// 🔥🛡️ CORE — ÍNDICE CENTRAL OMEGA 🛡️🔥
// Single Source of Truth para todo o sistema
// ZERO CLIQUES MORTOS
// ============================================

// Rotas
export * from "./routes";
export { default as ROUTES } from "./routes";

// Ações
export * from "./actions";
export { default as ACTIONS } from "./actions";

// Storage (exports seletivos para evitar conflitos)
export {
  BUCKETS,
  BUCKET_DEFINITIONS,
  getBucketDefinition,
  getUserBuckets,
  getBucket,
  validateFileForBucket,
  generateFilePath,
  requiresSanctumProtection,
  requiresWatermark,
  requiresAudit,
  getBucketsByAccessLevel,
  getPremiumBuckets,
  getSanctumProtectedBuckets,
  getFileExtension,
  sanitizeFileName,
  auditBuckets,
  SIGNED_URL_TTL_SECONDS,
  type BucketKey,
  type BucketDefinition,
  type BucketAccessLevel,
  type FileUploadResult,
  type SecureDownloadResult,
} from "./storage";
export { canAccessBucket as canAccessStorageBucket } from "./storage";

// Function Matrix
export * from "./functionMatrix";
export { default as FUNCTION_MATRIX } from "./functionMatrix";

// Safe Components
export * from "./SafeComponents";

// Navigation
export * from "./nav/navRouteMap";

// URL Access Control (MAPA DE URLs DEFINITIVO)
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
} from "./urlAccessControl";

// Dead Click Reporter
export * from "./deadClickReporter";

// UI Contracts Registry (exports seletivos)
export {
  ROUTE_CONTRACTS,
  STORAGE_CONTRACTS,
  EDGE_FUNCTION_CONTRACTS,
  validateRouteContract,
  validateAllRouteContracts,
  getRouteContract,
  canCallEdgeFunction,
} from "./uiContractsRegistry";

// Runtime Guard
export * from "./runtimeGuard";

// Storage Router
export * from "./storageRouter";

// ============================================
// VERSÃO
// ============================================
export const CORE_VERSION = "2.0-OMEGA";
export const CORE_BUILD_DATE = "2024-12-23";

// ============================================
// ESTATÍSTICAS DO CORE
// ============================================
import { ROUTES as R } from "./routes";
import { ACTIONS as A } from "./actions";
import { BUCKETS as B } from "./storage";
import { FUNCTION_MATRIX as FM } from "./functionMatrix";
import { NAV_ROUTE_MAP } from "./nav/navRouteMap";
import { PUBLIC_PATHS, GESTAO_ROLES, ALUNO_ROLES } from "./urlAccessControl";

export const CORE_STATS = {
  routes: Object.keys(R).length,
  actions: Object.keys(A).length,
  buckets: Object.keys(B).length,
  functions: FM.length,
  navItems: Object.keys(NAV_ROUTE_MAP).length,
  publicPaths: PUBLIC_PATHS.length,
  gestaoRoles: GESTAO_ROLES.length,
  alunoRoles: ALUNO_ROLES.length,
};

// ============================================
// HELPERS GLOBAIS
// ============================================

/**
 * Verifica integridade do core
 */
export function verifyCoreIntegrity(): {
  valid: boolean;
  stats: typeof CORE_STATS;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Verificar imports
  try {
    if (!R || Object.keys(R).length === 0) errors.push("ROUTES vazio");
    if (!A || Object.keys(A).length === 0) errors.push("ACTIONS vazio");
    if (!B || Object.keys(B).length === 0) errors.push("BUCKETS vazio");
    if (!FM || FM.length === 0) warnings.push("FUNCTION_MATRIX vazio");
    if (!NAV_ROUTE_MAP || Object.keys(NAV_ROUTE_MAP).length === 0) warnings.push("NAV_ROUTE_MAP vazio");
  } catch (e) {
    errors.push(`Erro ao verificar imports: ${e}`);
  }

  // Verificar consistência
  if (CORE_STATS.routes < 50) warnings.push(`Poucas rotas: ${CORE_STATS.routes}`);
  if (CORE_STATS.actions < 50) warnings.push(`Poucas ações: ${CORE_STATS.actions}`);

  return {
    valid: errors.length === 0,
    stats: CORE_STATS,
    errors,
    warnings,
  };
}

/**
 * Retorna resumo do core para logs
 */
export function getCoreInfo(): string {
  return `Core OMEGA v${CORE_VERSION} | ${CORE_STATS.routes} rotas | ${CORE_STATS.actions} ações | ${CORE_STATS.buckets} buckets | ${CORE_STATS.navItems} menu items`;
}

/**
 * Inicializa o core (deve ser chamado no App.tsx)
 */
export function initCore(): void {
  const integrity = verifyCoreIntegrity();
  
  if (!integrity.valid) {
    console.error("❌ CORE INTEGRITY FAILED:", integrity.errors);
  } else {
    console.log(`✅ ${getCoreInfo()}`);
    if (integrity.warnings.length > 0) {
      console.warn("⚠️ Core warnings:", integrity.warnings);
    }
  }
}
