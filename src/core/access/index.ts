// ============================================
// 🔒 CORE/ACCESS — Controle de Acesso Desacoplado
// Import direto: import { isOwner } from "@/core/access"
// ============================================

// 🎯 RE-EXPORTAR ÁREAS DA FONTE ÚNICA
export type { SystemArea } from "../areas";
export {
  SYSTEM_AREAS,
  URL_TO_AREA,
  ROLE_AREA_PERMISSIONS,
  isValidArea,
  getAreaFromUrl,
  roleHasAccess,
  getRoleAreas,
} from "../areas";

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
} from "../urlAccessControl";
