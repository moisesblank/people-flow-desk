// ============================================
// 🔥 CORE INDEX — EXPORTS CENTRALIZADOS
// PROJETO DA VIDA DO MESTRE MOISÉS MEDEIROS
// ============================================

// === ROTAS ===
export * from "./routes";

// === CONTROLE DE ACESSO ===
export { 
  OWNER_EMAIL, isOwner, isImmune, isGestaoRole, isAlunoRole,
  canAccessArea, getUrlArea, isPublicPath, canAccessUrl, validateAccess,
  getPostLoginRedirect, IMMUNE_ROLES, GESTAO_ROLES, ALUNO_ROLES, COMUNIDADE_ROLES,
  ROLE_TO_CATEGORY, ROLE_PERMISSIONS, OWNER_ONLY_PATHS, PUBLIC_PATHS,
  type AppRole, type SystemDomain, type AccessCategory, type RolePermissions, type AccessValidationResult
} from "./urlAccessControl";

// === NAVEGAÇÃO ===
export * from "./nav/navRouteMap";

// === AÇÕES ===
export { ACTIONS, canExecuteAction, getActionDefinition, getUserActions, getActionsByCategory, auditActions } from "./actions";
export type { ActionKey, ActionDefinition, ActionCategory } from "./actions";

// === STORAGE ===
export { 
  BUCKETS, BUCKET_DEFINITIONS, getBucketDefinition, getUserBuckets, 
  canAccessBucket, validateFileForBucket, generateFilePath,
  isSanctumProtected, isPremiumBucket, getBucketName, getBucketsByAccessLevel,
  auditBuckets, OWNER_EMAIL as STORAGE_OWNER_EMAIL, SIGNED_URL_TTL_SECONDS
} from "./storage";
export type { BucketKey, BucketDefinition, BucketAccessLevel, FileUploadResult, SecureDownloadResult } from "./storage";

// === MATRIX DE FUNÇÕES ===
export * from "./functionMatrix";

// === SAFE COMPONENTS ===
export { SafeLink, SafeButton, SafeNavItem } from "./SafeComponents";

// === UI CONTRACTS ===
export { ROUTE_CONTRACTS, STORAGE_CONTRACTS, EDGE_FUNCTION_CONTRACTS, validateRouteContract, validateAllRouteContracts, getRouteContract, canCallEdgeFunction } from "./uiContractsRegistry";

// === RUNTIME GUARD ===
export * from "./runtimeGuard";

// === STORAGE ROUTER ===
export * from "./storageRouter";
