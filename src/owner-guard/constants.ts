// ============================================
// 🔒 OWNER GUARD — CONSTANTES IMUTÁVEIS
// P0: Centralização de redirect do Owner
// ============================================

/** Role canônica do Owner no sistema */
export const OWNER_ROLE = 'owner' as const;

/** Rota HOME obrigatória do Owner */
export const OWNER_HOME = '/gestaofc' as const;

/** Email do Owner (fallback de emergência) */
export const OWNER_EMAIL = 'moisesblank@gmail.com' as const;

/** Prefixos de rota permitidos para Owner */
export const OWNER_ALLOWED_PREFIXES = [
  '/gestaofc',
  '/auth',
  '/security',
  '/primeiro-acesso',
] as const;

/** Rotas públicas que não exigem redirect */
export const PUBLIC_PATHS = [
  '/',
  '/auth',
  '/login',
  '/cadastro',
  '/registro',
  '/recuperar-senha',
  '/termos',
  '/privacidade',
  '/security/device-limit',
  '/security/same-type-replacement',
] as const;
