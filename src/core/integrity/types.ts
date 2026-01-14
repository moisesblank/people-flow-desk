// ============================================
// 🔥 TIPOS DA MATRIZ OMEGA (Ω)
// Definições tipadas para integridade total
// ============================================

import type { FunctionSpec } from '../functionMatrix';

// ============================================
// CHAVE ÚNICA — O ELO QUE CONECTA TUDO
// ============================================
export type FunctionId = string; // Formato: "F.DOMAIN.ACTION" (ex: "F.NAV.DASHBOARD")

// ============================================
// MATRIZ M₁ — NAV → ROUTE
// ============================================
export interface NavToRouteMapping {
  navItemKey: string;
  routeKey: string;
  routePath: string;
  status: 'active' | 'disabled' | 'coming_soon';
  hasValidRoute: boolean;
}

// ============================================
// MATRIZ M₂ — ROUTE → GUARD
// ============================================
export interface RouteToGuardMapping {
  routeKey: string;
  path: string;
  authRequired: boolean;
  rolesAllowed: string[];
  mfaRequired: boolean;
  fallbackPath: string;
  hasValidGuard: boolean;
}

// ============================================
// MATRIZ M₃ — UI → FUNCTION
// ============================================
export interface UIToFunctionMapping {
  triggerId: string;
  triggerType: 'button' | 'link' | 'nav' | 'menu' | 'row' | 'upload' | 'form';
  functionId: FunctionId;
  component: string;
  hasValidHandler: boolean;
}

// ============================================
// MATRIZ M₄ — FUNCTION → BACKEND
// ============================================
export interface FunctionToBackendMapping {
  functionId: FunctionId;
  backendMode: 'supabase-client' | 'rpc' | 'edge-function' | 'third-party' | 'hybrid';
  handlers: string[];
  slaMs: number;
  hasValidBackend: boolean;
}

// ============================================
// MATRIZ M₅ — BACKEND → DATA
// ============================================
export interface BackendToDataMapping {
  handlerName: string;
  tables: string[];
  views: string[];
  rpcs: string[];
  operations: ('select' | 'insert' | 'update' | 'delete')[];
  hasValidSchema: boolean;
}

// ============================================
// MATRIZ M₆ — DATA → SECURITY
// ============================================
export interface DataToSecurityMapping {
  tableName: string;
  hasRls: boolean;
  policies: string[];
  piiClassification: 'none' | 'low' | 'medium' | 'high' | 'critical';
  encryptionRequired: boolean;
  auditRequired: boolean;
}

// ============================================
// MATRIZ M₇ — FUNCTION → TELEMETRY
// ============================================
export interface FunctionToTelemetryMapping {
  functionId: FunctionId;
  eventNames: string[];
  metricsEnabled: boolean;
  logsEnabled: boolean;
  correlationTracking: boolean;
}

// ============================================
// MATRIZ M₈ — FUNCTION → TESTS
// ============================================
export interface FunctionToTestMapping {
  functionId: FunctionId;
  hasUnitTest: boolean;
  hasIntegrationTest: boolean;
  hasE2ETest: boolean;
  hasSmokeTest: boolean;
  coveragePercent: number;
}

// ============================================
// RELATÓRIO DE INTEGRIDADE
// ============================================
export interface IntegrityReport {
  timestamp: Date;
  version: string;
  
  // Métricas de cobertura
  coverage: {
    nav: { total: number; valid: number; percent: number };
    routes: { total: number; valid: number; percent: number };
    functions: { total: number; valid: number; percent: number };
    storage: { total: number; valid: number; percent: number };
    security: { total: number; valid: number; percent: number };
  };
  
  // Contagens
  counts: {
    deadClicks: number;
    orphanRoutes: number;
    missingHandlers: number;
    rlsGaps: number;
    untrackedEvents: number;
  };
  
  // Status geral
  status: 'PASS' | 'FAIL' | 'WARN';
  
  // Detalhes
  issues: IntegrityIssue[];
  
  // Backlog de coming_soon
  backlog: BacklogItem[];
}

export interface IntegrityIssue {
  severity: 'error' | 'warning' | 'info';
  matrix: 'M1' | 'M2' | 'M3' | 'M4' | 'M5' | 'M6' | 'M7' | 'M8';
  code: string;
  message: string;
  location: string;
  suggestion: string;
}

export interface BacklogItem {
  functionId: FunctionId;
  name: string;
  route: string;
  status: 'coming_soon' | 'disabled';
  priority: 'high' | 'medium' | 'low';
  estimatedHours?: number;
}

// ============================================
// CONFIGURAÇÃO DE AUDITORIA
// ============================================
export interface AuditConfig {
  enabled: boolean;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  persistToDb: boolean;
  correlationIdHeader: string;
  sensitiveFields: string[];
  retentionDays: number;
}

export const DEFAULT_AUDIT_CONFIG: AuditConfig = {
  enabled: true,
  logLevel: 'info',
  persistToDb: true,
  correlationIdHeader: 'X-Correlation-ID',
  sensitiveFields: ['password', 'token', 'cpf', 'credit_card'],
  retentionDays: 90,
};

// ============================================
// OWNER E PERMISSÕES ESPECIAIS
// ============================================
/**
 * @deprecated OWNER_EMAIL - Apenas para auditoria/logs
 * ⚠️ NUNCA usar para controle de acesso!
 * Fonte da verdade: user_roles.role = 'owner'
 */
export const OWNER_EMAIL = 'moisesblank@gmail.com'; // Legacy: apenas audit
export const IMMUNE_ROLES = ['owner'] as const;
// 🎯 CONSTITUIÇÃO ROLES v1.0.0 - "employee" é CATEGORIA, não role
export const GESTAO_ROLES = ['owner', 'admin', 'coordenacao', 'contabilidade', 'suporte', 'monitoria', 'marketing', 'afiliado'] as const;
// 🛡️ CONSTITUIÇÃO v10.4.2: admin REMOVIDO de BETA_ROLES - funcionários são GESTAO, não ALUNO
export const BETA_ROLES = ['owner', 'beta', 'aluno_presencial', 'beta_expira'] as const;
export const ALUNO_ROLES = ['beta', 'aluno_gratuito', 'aluno_presencial', 'beta_expira'] as const;
