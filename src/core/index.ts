// ============================================
// 🔥🛡️ CORE — ÍNDICE CENTRAL OMEGA v3.0 🛡️🔥
// Single Source of Truth para todo o sistema
// ZERO CLIQUES MORTOS
// 
// 🏗️ ARQUITETURA DESACOPLADA:
// - Imports diretos: import { isOwner } from "@/core/urlAccessControl"
// - Barrel por domínio: import { ROUTES } from "@/core/routing"
// - Este arquivo mantém compatibilidade com imports antigos
// ============================================

// ============================================
// 🗺️ ROTAS (import direto recomendado: @/core/routes)
// ============================================
export {
  ROUTES,
  ROUTE_DEFINITIONS,
  getRoute,
  getRouteWithParams,
  canAccessRoute,
  getRouteDefinition,
  getRouteKeysByDomain,
  getRedirectUrl,
  isValidRoute,
  type RouteKey,
  type RouteDefinition,
  type RouteDomain,
} from "./routes";
export { default as ROUTES_DEFAULT } from "./routes";

// ============================================
// ⚡ AÇÕES (import direto recomendado: @/core/actions)
// ============================================
export {
  ACTIONS,
  getAction,
  getActionDefinition,
  canExecuteAction,
  requiresConfirmation,
  getActionsByCategory,
  getUserActions,
  auditActions,
  type ActionKey,
  type ActionDefinition,
  type ActionCategory,
} from "./actions";
export { default as ACTIONS_DEFAULT } from "./actions";

// ============================================
// 📦 STORAGE (import direto recomendado: @/core/storage)
// ============================================
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

// ============================================
// 🔒 CONTROLE DE ACESSO (import direto recomendado: @/core/urlAccessControl)
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
} from "./urlAccessControl";

// ============================================
// 🧩 FUNCTION MATRIX (import direto: @/core/functionMatrix)
// ============================================
export * from "./functionMatrix";
export { default as FUNCTION_MATRIX } from "./functionMatrix";

// ============================================
// 🧱 SAFE COMPONENTS
// ============================================
export * from "./SafeComponents";

// ============================================
// 🧭 NAVIGATION
// ============================================
export * from "./nav/navRouteMap";

// ============================================
// 📋 UI CONTRACTS (exports seletivos)
// ============================================
export {
  ROUTE_CONTRACTS,
  STORAGE_CONTRACTS,
  EDGE_FUNCTION_CONTRACTS,
  validateRouteContract,
  validateAllRouteContracts,
  getRouteContract,
  canCallEdgeFunction,
} from "./uiContractsRegistry";

// ============================================
// 🛡️ OUTROS MÓDULOS
// ============================================
export * from "./deadClickReporter";
export * from "./runtimeGuard";
export * from "./storageRouter";

// ============================================
// VERSÃO
// ============================================
export const CORE_VERSION = "3.0-DESACOPLADO";
export const CORE_BUILD_DATE = "2024-12-28";

// ============================================
// ESTATÍSTICAS DO CORE (LAZY - só calcula quando chamado)
// ============================================
// ============================================
// ESTATÍSTICAS DO CORE (calculadas sob demanda)
// ============================================

// Import síncrono para stats - módulos já carregados via re-exports acima
import { ROUTES as _R } from "./routes";
import { ACTIONS as _A } from "./actions";
import { BUCKETS as _B } from "./storage";
import _FM from "./functionMatrix";
import { NAV_ROUTE_MAP as _NRM } from "./nav/navRouteMap";
import { PUBLIC_PATHS as _PP, GESTAO_ROLES as _GR, ALUNO_ROLES as _AR } from "./urlAccessControl";

let _coreStats: {
  routes: number;
  actions: number;
  buckets: number;
  functions: number;
  navItems: number;
  publicPaths: number;
  gestaoRoles: number;
  alunoRoles: number;
} | null = null;

export function getCoreStats() {
  if (_coreStats) return _coreStats;
  
  _coreStats = {
    routes: Object.keys(_R).length,
    actions: Object.keys(_A).length,
    buckets: Object.keys(_B).length,
    functions: _FM.length,
    navItems: Object.keys(_NRM).length,
    publicPaths: _PP.length,
    gestaoRoles: _GR.length,
    alunoRoles: _AR.length,
  };
  
  return _coreStats;
}

// Alias para retrocompatibilidade
export const CORE_STATS = {
  get routes() { return getCoreStats().routes; },
  get actions() { return getCoreStats().actions; },
  get buckets() { return getCoreStats().buckets; },
  get functions() { return getCoreStats().functions; },
  get navItems() { return getCoreStats().navItems; },
  get publicPaths() { return getCoreStats().publicPaths; },
  get gestaoRoles() { return getCoreStats().gestaoRoles; },
  get alunoRoles() { return getCoreStats().alunoRoles; },
};

// ============================================
// HELPERS GLOBAIS
// ============================================

/**
 * Verifica integridade do core
 */
export function verifyCoreIntegrity(): {
  valid: boolean;
  stats: ReturnType<typeof getCoreStats>;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  try {
    const stats = getCoreStats();
    
    if (stats.routes === 0) errors.push("ROUTES vazio");
    if (stats.actions === 0) errors.push("ACTIONS vazio");
    if (stats.buckets === 0) errors.push("BUCKETS vazio");
    if (stats.functions === 0) warnings.push("FUNCTION_MATRIX vazio");
    if (stats.navItems === 0) warnings.push("NAV_ROUTE_MAP vazio");
    
    if (stats.routes < 50) warnings.push(`Poucas rotas: ${stats.routes}`);
    if (stats.actions < 50) warnings.push(`Poucas ações: ${stats.actions}`);
    
    return { valid: errors.length === 0, stats, errors, warnings };
  } catch (e) {
    errors.push(`Erro ao verificar core: ${e}`);
    return { 
      valid: false, 
      stats: { routes: 0, actions: 0, buckets: 0, functions: 0, navItems: 0, publicPaths: 0, gestaoRoles: 0, alunoRoles: 0 },
      errors, 
      warnings 
    };
  }
}

/**
 * Retorna resumo do core para logs
 */
export function getCoreInfo(): string {
  const stats = getCoreStats();
  return `Core OMEGA v${CORE_VERSION} | ${stats.routes} rotas | ${stats.actions} ações | ${stats.buckets} buckets | ${stats.navItems} menu items`;
}

/**
 * Inicializa o core (deve ser chamado no App.tsx)
 */
export function initCore(): void {
  // Defer para não bloquear o boot
  requestIdleCallback?.(() => {
    const integrity = verifyCoreIntegrity();
    
    if (!integrity.valid) {
      console.error("❌ CORE INTEGRITY FAILED:", integrity.errors);
    } else {
      console.log(`✅ ${getCoreInfo()}`);
      if (integrity.warnings.length > 0) {
        console.warn("⚠️ Core warnings:", integrity.warnings);
      }
    }
  }) || setTimeout(() => {
    const integrity = verifyCoreIntegrity();
    if (integrity.valid) {
      console.log(`✅ ${getCoreInfo()}`);
    }
  }, 1000);
}
