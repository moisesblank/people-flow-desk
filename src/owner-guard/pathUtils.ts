// ============================================
// 🔒 OWNER GUARD — UTILIDADES DE PATH
// P0: Normalização e verificação de rotas
// ============================================

import { OWNER_HOME, OWNER_ALLOWED_PREFIXES, PUBLIC_PATHS } from './constants';

/**
 * Normaliza pathname removendo trailing slash e query params
 */
export function normalizePath(path: string): string {
  if (!path) return '/';
  
  // Remove query params e hash
  const cleanPath = path.split('?')[0].split('#')[0];
  
  // Remove trailing slash (exceto para root)
  if (cleanPath.length > 1 && cleanPath.endsWith('/')) {
    return cleanPath.slice(0, -1);
  }
  
  return cleanPath || '/';
}

/**
 * Verifica se o path é permitido para o Owner (não precisa redirect)
 */
export function isOwnerAllowedPath(path: string): boolean {
  const normalized = normalizePath(path);
  
  // Verifica se começa com algum prefixo permitido
  return OWNER_ALLOWED_PREFIXES.some(prefix => 
    normalized === prefix || normalized.startsWith(`${prefix}/`)
  );
}

/**
 * Verifica se o path é a home do Owner
 */
export function isOwnerHomePath(path: string): boolean {
  const normalized = normalizePath(path);
  return normalized === OWNER_HOME || normalized.startsWith(`${OWNER_HOME}/`);
}

/**
 * Verifica se é uma rota pública (sem auth necessário)
 */
export function isPublicPath(path: string): boolean {
  const normalized = normalizePath(path);
  return PUBLIC_PATHS.some(p => normalized === p || normalized.startsWith(`${p}/`));
}

/**
 * Verifica se o path é uma área de alunos (proibida para Owner)
 */
export function isStudentPath(path: string): boolean {
  const normalized = normalizePath(path);
  return normalized.startsWith('/alunos');
}
