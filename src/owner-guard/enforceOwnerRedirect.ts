// ============================================
// 🔒 OWNER GUARD — FUNÇÃO CANÔNICA DE REDIRECT
// P0: Se owner e fora de /gestaofc → REDIRECT IMEDIATO
// ============================================

import { OWNER_ROLE, OWNER_HOME } from './constants';
import { normalizePath, isOwnerAllowedPath } from './pathUtils';
import { isOwnerSync, resolveRole } from './resolveRole';

export interface EnforceOwnerRedirectParams {
  role?: string | null;
  pathname?: string;
  forceCheck?: boolean;
}

export interface EnforceOwnerRedirectResult {
  shouldRedirect: boolean;
  targetPath: string | null;
  reason: string | null;
}

/**
 * 🔒 FUNÇÃO CANÔNICA — Enforce Owner Redirect
 * 
 * REGRA ABSOLUTA: Se role === "owner" e pathname não está em OWNER_ALLOWED_PREFIXES,
 * redireciona IMEDIATAMENTE para /gestaofc.
 * 
 * @param params.role - Role do usuário (opcional, usa cache se não fornecido)
 * @param params.pathname - Pathname atual (usa window.location se não fornecido)
 * @param params.forceCheck - Se true, força verificação mesmo se role não for owner
 * @returns Resultado indicando se deve redirecionar e para onde
 */
export function enforceOwnerRedirect(
  params: EnforceOwnerRedirectParams = {}
): EnforceOwnerRedirectResult {
  const { 
    role, 
    pathname = typeof window !== 'undefined' ? window.location.pathname : '/',
    forceCheck = false 
  } = params;
  
  // Normaliza o path
  const normalizedPath = normalizePath(pathname);
  
  // Determina se é owner
  const isOwner = role === OWNER_ROLE || (!role && isOwnerSync());
  
  // Se não é owner e não está forçando check, não faz nada
  if (!isOwner && !forceCheck) {
    return { shouldRedirect: false, targetPath: null, reason: null };
  }
  
  // Se é owner e está em path permitido, não precisa redirect
  if (isOwner && isOwnerAllowedPath(normalizedPath)) {
    return { shouldRedirect: false, targetPath: null, reason: 'already_in_allowed_path' };
  }
  
  // Se é owner e NÃO está em path permitido → REDIRECT OBRIGATÓRIO
  if (isOwner) {
    return { 
      shouldRedirect: true, 
      targetPath: OWNER_HOME, 
      reason: `owner_outside_allowed_path: ${normalizedPath}` 
    };
  }
  
  return { shouldRedirect: false, targetPath: null, reason: null };
}

/**
 * 🔒 Executa o redirect IMEDIATO se necessário
 * 
 * Usa window.location.replace para evitar histórico de navegação
 */
export function executeOwnerRedirect(
  params: EnforceOwnerRedirectParams = {}
): boolean {
  const result = enforceOwnerRedirect(params);
  
  if (result.shouldRedirect && result.targetPath) {
    console.log(`[OWNER-GUARD] 🔒 Redirect forçado: ${result.reason}`);
    
    if (typeof window !== 'undefined') {
      // Usa replace para não deixar histórico
      window.location.replace(result.targetPath);
      return true;
    }
  }
  
  return false;
}

/**
 * 🔒 Versão assíncrona que resolve role do banco antes de redirecionar
 */
export async function enforceOwnerRedirectAsync(
  pathname?: string
): Promise<EnforceOwnerRedirectResult> {
  const resolution = await resolveRole();
  
  return enforceOwnerRedirect({
    role: resolution.role,
    pathname: pathname || (typeof window !== 'undefined' ? window.location.pathname : '/'),
  });
}

/**
 * 🔒 Hook-friendly: Retorna função para usar em useEffect
 */
export function createOwnerGuard(role: string | null | undefined) {
  return (pathname: string): boolean => {
    const result = enforceOwnerRedirect({ role, pathname });
    
    if (result.shouldRedirect && result.targetPath && typeof window !== 'undefined') {
      window.location.replace(result.targetPath);
      return true;
    }
    
    return false;
  };
}
