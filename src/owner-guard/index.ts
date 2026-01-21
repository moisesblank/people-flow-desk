// ============================================
// 🔒 OWNER GUARD — BARREL EXPORT
// P0: Centralização de redirect do Owner
// ============================================

// Constantes
export { 
  OWNER_ROLE, 
  OWNER_HOME, 
  OWNER_EMAIL,
  OWNER_ALLOWED_PREFIXES,
  PUBLIC_PATHS 
} from './constants';

// Utilidades de path
export { 
  normalizePath, 
  isOwnerAllowedPath, 
  isOwnerHomePath,
  isPublicPath,
  isStudentPath 
} from './pathUtils';

// Resolução de role
export { 
  resolveRole,
  resolveRoleFromCache,
  resolveRoleFromSession,
  resolveRoleFromDatabase,
  isOwnerSync,
  isOwnerAsync,
  type RoleResolution,
  type RoleSource 
} from './resolveRole';

// Função canônica de redirect
export { 
  enforceOwnerRedirect,
  executeOwnerRedirect,
  enforceOwnerRedirectAsync,
  createOwnerGuard,
  type EnforceOwnerRedirectParams,
  type EnforceOwnerRedirectResult 
} from './enforceOwnerRedirect';

// Bootstrap global (orquestra execução no Router)
export { OwnerGuardBootstrap } from './OwnerGuardBootstrap';
