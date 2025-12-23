// ============================================
// 🔥 ROUTE REGISTRY — MATRIZ M₁ + M₂
// Garante que toda rota existe e tem guard válido
// ============================================

import { ROUTES, ROUTE_DEFINITIONS, type RouteKey } from '../routes';
import type { RouteToGuardMapping, NavToRouteMapping } from './types';

// ============================================
// ASSERTIVAS DE ROTA
// ============================================

/**
 * Verifica se uma RouteKey existe
 * @throws Error se a rota não existir
 */
export function assertRouteExists(key: RouteKey): string {
  const route = ROUTES[key];
  if (!route) {
    throw new Error(`[INTEGRITY] Rota inexistente: ${key}`);
  }
  return route;
}

/**
 * Verifica se uma rota tem definição válida
 */
export function hasValidDefinition(key: RouteKey): boolean {
  return Boolean(ROUTE_DEFINITIONS[key]);
}

/**
 * Retorna o path de uma rota de forma segura
 */
export function getRoutePath(key: RouteKey): string | null {
  return ROUTES[key] || null;
}

// ============================================
// VALIDAÇÃO M₁ — NAV → ROUTE
// ============================================

export function validateNavToRoute(navItems: Array<{ key: string; route?: string; path?: string }>): NavToRouteMapping[] {
  return navItems.map(item => {
    const routeKey = item.route || item.key;
    const routePath = item.path || ROUTES[routeKey as RouteKey];
    const definition = ROUTE_DEFINITIONS[routeKey as RouteKey];
    
    return {
      navItemKey: item.key,
      routeKey,
      routePath: routePath || '',
      status: definition?.status || 'coming_soon',
      hasValidRoute: Boolean(routePath && definition),
    };
  });
}

// ============================================
// VALIDAÇÃO M₂ — ROUTE → GUARD
// ============================================

export function validateRouteGuards(): RouteToGuardMapping[] {
  const mappings: RouteToGuardMapping[] = [];
  
  for (const [key, path] of Object.entries(ROUTES)) {
    const def = ROUTE_DEFINITIONS[key as RouteKey];
    
    mappings.push({
      routeKey: key,
      path,
      authRequired: def?.authRequired ?? true,
      rolesAllowed: def?.roles || [],
      mfaRequired: false, // Expandir quando implementar MFA
      fallbackPath: '/auth',
      hasValidGuard: Boolean(def),
    });
  }
  
  return mappings;
}

// ============================================
// AUDITORIA DE ROTAS
// ============================================

export interface RouteAuditResult {
  total: number;
  withDefinition: number;
  withoutDefinition: number;
  active: number;
  disabled: number;
  comingSoon: number;
  orphanRoutes: string[];
  missingGuards: string[];
}

export function auditRoutes(): RouteAuditResult {
  const routeKeys = Object.keys(ROUTES) as RouteKey[];
  const orphanRoutes: string[] = [];
  const missingGuards: string[] = [];
  
  let active = 0;
  let disabled = 0;
  let comingSoon = 0;
  let withDefinition = 0;
  
  for (const key of routeKeys) {
    const def = ROUTE_DEFINITIONS[key];
    
    if (def) {
      withDefinition++;
      if (def.status === 'active') active++;
      else if (def.status === 'disabled') disabled++;
      else if (def.status === 'coming_soon') comingSoon++;
    } else {
      orphanRoutes.push(key);
    }
    
    // Verificar se rota protegida tem roles
    if (def?.authRequired && (!def.roles || def.roles.length === 0)) {
      missingGuards.push(key);
    }
  }
  
  return {
    total: routeKeys.length,
    withDefinition,
    withoutDefinition: routeKeys.length - withDefinition,
    active,
    disabled,
    comingSoon,
    orphanRoutes,
    missingGuards,
  };
}

// ============================================
// HELPERS
// ============================================

export function getRoutesByStatus(status: 'active' | 'disabled' | 'coming_soon'): RouteKey[] {
  return (Object.keys(ROUTE_DEFINITIONS) as RouteKey[]).filter(
    key => ROUTE_DEFINITIONS[key]?.status === status
  );
}

export function getRoutesByDomain(domain: string): RouteKey[] {
  return (Object.keys(ROUTE_DEFINITIONS) as RouteKey[]).filter(
    key => ROUTE_DEFINITIONS[key]?.domain === domain
  );
}

export function isRouteAccessible(key: RouteKey, userRole: string | null): boolean {
  const def = ROUTE_DEFINITIONS[key];
  
  // Owner tem acesso a tudo
  if (userRole === 'owner') return true;
  
  // Rota não existe ou está desabilitada
  if (!def || def.status === 'disabled') return false;
  
  // Rota pública
  if (!def.authRequired) return true;
  
  // Verificar role
  if (!userRole) return false;
  if (!def.roles || def.roles.length === 0) return true;
  
  return def.roles.includes(userRole);
}
