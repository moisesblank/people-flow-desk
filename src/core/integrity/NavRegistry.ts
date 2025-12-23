// ============================================
// 🔥 NAV REGISTRY — MATRIZ M₁ NORMALIZADA
// Menu normalizado + validação contra rotas
// ============================================

import { supabase } from '@/integrations/supabase/client';
import { ROUTES, ROUTE_DEFINITIONS, type RouteKey } from '../routes';
import type { NavToRouteMapping } from './types';

// ============================================
// TIPOS DO MENU
// ============================================

export interface NavItem {
  key: string;
  label: string;
  icon?: string;
  route?: string;
  path?: string;
  roles?: string[];
  status?: 'active' | 'disabled' | 'coming_soon';
  children?: NavItem[];
}

export interface NavGroup {
  key: string;
  label: string;
  icon?: string;
  items: NavItem[];
  roles?: string[];
}

export interface NavLayout {
  version: string;
  groups: NavGroup[];
  lastUpdated: string;
}

// ============================================
// CARREGAR MENU DO SUPABASE
// ============================================

export async function loadNavFromSupabase(): Promise<NavLayout | null> {
  try {
    const { data, error } = await supabase
      .from('editable_content')
      .select('content_value')
      .eq('content_key', 'nav_sidebar_layout_v1')
      .single();
    
    if (error || !data?.content_value) {
      console.warn('[NavRegistry] Menu não encontrado no Supabase');
      return null;
    }
    
    return typeof data.content_value === 'string' 
      ? JSON.parse(data.content_value) 
      : data.content_value;
  } catch (err) {
    console.error('[NavRegistry] Erro ao carregar menu:', err);
    return null;
  }
}

// ============================================
// NORMALIZAR E VALIDAR MENU
// ============================================

export function normalizeNavLayout(layout: NavLayout): {
  normalized: NavLayout;
  issues: string[];
  mappings: NavToRouteMapping[];
} {
  const issues: string[] = [];
  const mappings: NavToRouteMapping[] = [];
  const seenKeys = new Set<string>();
  
  const normalizedGroups = layout.groups.map(group => {
    const normalizedItems = group.items.map(item => {
      // Verificar duplicação
      if (seenKeys.has(item.key)) {
        issues.push(`Duplicação: ${item.key}`);
      }
      seenKeys.add(item.key);
      
      // Buscar rota correspondente
      const routeKey = (item.route || item.key.toUpperCase().replace(/-/g, '_')) as RouteKey;
      const routePath = ROUTES[routeKey] || item.path;
      const routeDef = ROUTE_DEFINITIONS[routeKey];
      
      // Criar mapping
      mappings.push({
        navItemKey: item.key,
        routeKey: routeKey,
        routePath: routePath || '',
        status: routeDef?.status || item.status || 'coming_soon',
        hasValidRoute: Boolean(routePath && routeDef),
      });
      
      // Registrar issues
      if (!routePath) {
        issues.push(`Sem rota: ${item.key}`);
      }
      if (!routeDef) {
        issues.push(`Sem definição: ${item.key}`);
      }
      
      return {
        ...item,
        path: routePath,
        status: routeDef?.status || item.status || 'coming_soon',
      };
    });
    
    return {
      ...group,
      items: normalizedItems,
    };
  });
  
  return {
    normalized: {
      ...layout,
      version: `${layout.version || '1.0'}-normalized`,
      groups: normalizedGroups,
      lastUpdated: new Date().toISOString(),
    },
    issues,
    mappings,
  };
}

// ============================================
// AUDITORIA DO MENU
// ============================================

export interface NavAuditResult {
  totalGroups: number;
  totalItems: number;
  validItems: number;
  invalidItems: number;
  duplicates: string[];
  orphanItems: string[];
  missingRoutes: string[];
  statusCounts: {
    active: number;
    disabled: number;
    coming_soon: number;
  };
}

export function auditNavLayout(layout: NavLayout): NavAuditResult {
  const duplicates: string[] = [];
  const orphanItems: string[] = [];
  const missingRoutes: string[] = [];
  const seenKeys = new Set<string>();
  
  let totalItems = 0;
  let validItems = 0;
  let active = 0;
  let disabled = 0;
  let coming_soon = 0;
  
  for (const group of layout.groups) {
    for (const item of group.items) {
      totalItems++;
      
      // Duplicação
      if (seenKeys.has(item.key)) {
        duplicates.push(item.key);
      }
      seenKeys.add(item.key);
      
      // Verificar rota
      const routeKey = (item.route || item.key.toUpperCase().replace(/-/g, '_')) as RouteKey;
      const routePath = ROUTES[routeKey] || item.path;
      const routeDef = ROUTE_DEFINITIONS[routeKey];
      
      if (routePath && routeDef) {
        validItems++;
        
        if (routeDef.status === 'active') active++;
        else if (routeDef.status === 'disabled') disabled++;
        else coming_soon++;
      } else {
        if (!routePath) missingRoutes.push(item.key);
        if (!routeDef) orphanItems.push(item.key);
      }
      
      // Processar filhos recursivamente
      if (item.children) {
        for (const child of item.children) {
          totalItems++;
          if (seenKeys.has(child.key)) {
            duplicates.push(child.key);
          }
          seenKeys.add(child.key);
        }
      }
    }
  }
  
  return {
    totalGroups: layout.groups.length,
    totalItems,
    validItems,
    invalidItems: totalItems - validItems,
    duplicates,
    orphanItems,
    missingRoutes,
    statusCounts: { active, disabled, coming_soon },
  };
}

// ============================================
// RBAC DO MENU
// ============================================

export function filterNavByRole(layout: NavLayout, userRole: string | null): NavLayout {
  if (userRole === 'owner') return layout; // Owner vê tudo
  
  return {
    ...layout,
    groups: layout.groups
      .filter(group => {
        if (!group.roles || group.roles.length === 0) return true;
        return userRole && group.roles.includes(userRole);
      })
      .map(group => ({
        ...group,
        items: group.items.filter(item => {
          if (!item.roles || item.roles.length === 0) return true;
          return userRole && item.roles.includes(userRole);
        }),
      }))
      .filter(group => group.items.length > 0),
  };
}
