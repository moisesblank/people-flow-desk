// ============================================
// 🔥 SECURITY REGISTRY — MATRIZ M₆
// RBAC + RLS + Deny-by-default
// ============================================

import { FUNCTION_MATRIX, type FunctionSpec } from '../functionMatrix';
import type { DataToSecurityMapping } from './types';
import { OWNER_EMAIL, IMMUNE_ROLES, GESTAO_ROLES, BETA_ROLES } from './types';

// ============================================
// CAPACIDADES POR ROLE (DENY-BY-DEFAULT)
// ============================================

export type Capability = 
  | 'view_dashboard'
  | 'manage_alunos'
  | 'manage_cursos'
  | 'manage_funcionarios'
  | 'view_financeiro'
  | 'manage_financeiro'
  | 'view_relatorios'
  | 'export_data'
  | 'import_data'
  | 'manage_marketing'
  | 'view_analytics'
  | 'manage_storage'
  | 'manage_settings'
  | 'view_logs'
  | 'manage_users'
  | 'god_mode'
  | 'access_portal_aluno'
  | 'access_comunidade'
  | 'access_gestao';

export const ROLE_CAPABILITIES: Record<string, Capability[]> = {
  owner: [
    'view_dashboard', 'manage_alunos', 'manage_cursos', 'manage_funcionarios',
    'view_financeiro', 'manage_financeiro', 'view_relatorios', 'export_data',
    'import_data', 'manage_marketing', 'view_analytics', 'manage_storage',
    'manage_settings', 'view_logs', 'manage_users', 'god_mode',
    'access_portal_aluno', 'access_comunidade', 'access_gestao'
  ],
  admin: [
    'view_dashboard', 'manage_alunos', 'manage_cursos', 'manage_funcionarios',
    'view_financeiro', 'view_relatorios', 'export_data', 'manage_marketing',
    'view_analytics', 'manage_storage', 'view_logs', 'manage_users',
    'access_portal_aluno', 'access_comunidade', 'access_gestao'
  ],
  coordenacao: [
    'view_dashboard', 'manage_alunos', 'manage_cursos', 'view_relatorios',
    'access_gestao'
  ],
  contabilidade: [
    'view_dashboard', 'view_financeiro', 'manage_financeiro', 'view_relatorios',
    'export_data', 'access_gestao'
  ],
  suporte: [
    'view_dashboard', 'manage_alunos', 'access_gestao'
  ],
  monitoria: [
    'view_dashboard', 'manage_alunos', 'access_gestao'
  ],
  marketing: [
    'view_dashboard', 'manage_marketing', 'view_analytics', 'access_gestao'
  ],
  professor: [
    'view_dashboard', 'manage_cursos', 'access_gestao'
  ],
  funcionario: [
    'view_dashboard', 'access_gestao'
  ],
  beta: [
    'access_portal_aluno', 'access_comunidade'
  ],
  aluno: [
    'access_comunidade'
  ],
  viewer: [
    'access_comunidade'
  ],
};

// ============================================
// VALIDAÇÃO DE CAPABILITY
// ============================================

export function hasCapability(role: string | null, capability: Capability): boolean {
  if (!role) return false;
  if (role === 'owner') return true; // Owner tem tudo
  
  const capabilities = ROLE_CAPABILITIES[role];
  if (!capabilities) return false;
  
  return capabilities.includes(capability);
}

export function getCapabilities(role: string | null): Capability[] {
  if (!role) return [];
  if (role === 'owner') return ROLE_CAPABILITIES.owner;
  return ROLE_CAPABILITIES[role] || [];
}

// ============================================
// VALIDAÇÃO DE ACESSO A FUNÇÃO
// ============================================

export function canAccessFunction(fn: FunctionSpec, userRole: string | null, userEmail?: string): boolean {
  // Owner MASTER
  if (userRole === 'owner' || userEmail?.toLowerCase() === OWNER_EMAIL) {
    return true;
  }
  
  // Função desabilitada
  if (fn.status === 'disabled') return false;
  
  // Verificar roles permitidas
  if (!fn.security.rolesAllowed || fn.security.rolesAllowed.length === 0) {
    return fn.security.authRequired ? Boolean(userRole) : true;
  }
  
  return userRole ? fn.security.rolesAllowed.includes(userRole) : false;
}

// ============================================
// CLASSIFICAÇÃO PII
// ============================================

export type PIILevel = 'none' | 'low' | 'medium' | 'high' | 'critical';

export const PII_TABLES: Record<string, PIILevel> = {
  'profiles': 'high',
  'alunos': 'high',
  'employees': 'high',
  'affiliates': 'medium',
  'user_sessions': 'high',
  'activity_log': 'medium',
  'security_events': 'medium',
  'two_factor_codes': 'critical',
  'transacoes_hotmart_completo': 'high',
  'comissoes': 'medium',
  'entradas': 'medium',
  'whatsapp_leads': 'high',
  'whatsapp_messages': 'medium',
  'book_access_logs': 'medium',
  // Tabelas públicas
  'courses': 'none',
  'lessons': 'none',
  'areas': 'none',
  'categories': 'none',
};

export function getTablePIILevel(tableName: string): PIILevel {
  return PII_TABLES[tableName] || 'none';
}

// ============================================
// VALIDAÇÃO RLS
// ============================================

export function validateDataSecurity(tables: string[]): DataToSecurityMapping[] {
  return tables.map(table => {
    const pii = getTablePIILevel(table);
    
    return {
      tableName: table,
      hasRls: true, // Assumimos que todas têm RLS (verificar via linter)
      policies: [], // Seria preenchido com query ao pg_policies
      piiClassification: pii,
      encryptionRequired: pii === 'critical',
      auditRequired: pii !== 'none',
    };
  });
}

// ============================================
// AUDITORIA DE SEGURANÇA
// ============================================

export interface SecurityAuditResult {
  rolesConfigured: number;
  functionsWithRbac: number;
  functionsWithoutRbac: number;
  tablesWithPii: number;
  criticalTables: string[];
  immuneRoles: readonly string[];
  ownerEmail: string;
}

export function auditSecurity(): SecurityAuditResult {
  const functionsWithRbac = FUNCTION_MATRIX.filter(
    fn => fn.security.rolesAllowed && fn.security.rolesAllowed.length > 0
  ).length;
  
  const criticalTables = Object.entries(PII_TABLES)
    .filter(([, level]) => level === 'critical' || level === 'high')
    .map(([table]) => table);
  
  return {
    rolesConfigured: Object.keys(ROLE_CAPABILITIES).length,
    functionsWithRbac,
    functionsWithoutRbac: FUNCTION_MATRIX.length - functionsWithRbac,
    tablesWithPii: Object.keys(PII_TABLES).length,
    criticalTables,
    immuneRoles: IMMUNE_ROLES,
    ownerEmail: OWNER_EMAIL,
  };
}

// ============================================
// HELPERS
// ============================================

export function isOwner(role: string | null, email?: string): boolean {
  return role === 'owner' || email?.toLowerCase() === OWNER_EMAIL;
}

export function isGestaoRole(role: string | null): boolean {
  return role ? (GESTAO_ROLES as readonly string[]).includes(role) : false;
}

export function isBetaRole(role: string | null): boolean {
  return role ? (BETA_ROLES as readonly string[]).includes(role) : false;
}

export function isImmune(role: string | null): boolean {
  return role ? (IMMUNE_ROLES as readonly string[]).includes(role) : false;
}
