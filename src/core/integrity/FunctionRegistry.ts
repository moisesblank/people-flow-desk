// ============================================
// 🔥 FUNCTION REGISTRY — MATRIZ M₃ + M₄
// Registry centralizado de todas as funções
// ============================================

import { FUNCTION_MATRIX, type FunctionSpec } from '../functionMatrix';
import type { 
  FunctionId, 
  UIToFunctionMapping, 
  FunctionToBackendMapping,
  FunctionToTelemetryMapping,
  FunctionToTestMapping 
} from './types';

// ============================================
// LOOKUP POR ID
// ============================================

const FUNCTION_MAP = new Map<FunctionId, FunctionSpec>();

// Inicializar mapa
FUNCTION_MATRIX.forEach(fn => {
  FUNCTION_MAP.set(fn.id, fn);
});

/**
 * Busca função por ID
 */
export function getFunctionById(id: FunctionId): FunctionSpec | undefined {
  return FUNCTION_MAP.get(id);
}

/**
 * Verifica se função existe
 */
export function functionExists(id: FunctionId): boolean {
  return FUNCTION_MAP.has(id);
}

/**
 * Assertiva de função
 * @throws Error se função não existir
 */
export function assertFunctionExists(id: FunctionId): FunctionSpec {
  const fn = FUNCTION_MAP.get(id);
  if (!fn) {
    throw new Error(`[INTEGRITY] Função inexistente: ${id}`);
  }
  return fn;
}

// ============================================
// VALIDAÇÃO M₃ — UI → FUNCTION
// ============================================

export function validateUITriggers(): UIToFunctionMapping[] {
  const mappings: UIToFunctionMapping[] = [];
  
  for (const fn of FUNCTION_MATRIX) {
    for (const trigger of fn.ui.triggers) {
      mappings.push({
        triggerId: `${fn.id}:${trigger.type}`,
        triggerType: trigger.type as UIToFunctionMapping['triggerType'],
        functionId: fn.id,
        component: trigger.component || 'unknown',
        hasValidHandler: fn.status !== 'disabled' && fn.backend.handlers.length > 0,
      });
    }
  }
  
  return mappings;
}

// ============================================
// VALIDAÇÃO M₄ — FUNCTION → BACKEND
// ============================================

export function validateFunctionBackends(): FunctionToBackendMapping[] {
  return FUNCTION_MATRIX.map(fn => ({
    functionId: fn.id,
    backendMode: fn.backend.mode,
    handlers: fn.backend.handlers.map(h => h.name),
    slaMs: 3000, // Default SLA
    hasValidBackend: fn.backend.handlers.length > 0,
  }));
}

// ============================================
// VALIDAÇÃO M₇ — FUNCTION → TELEMETRY
// ============================================

export function validateFunctionTelemetry(): FunctionToTelemetryMapping[] {
  return FUNCTION_MATRIX.map(fn => ({
    functionId: fn.id,
    eventNames: fn.observability.auditEventNames,
    metricsEnabled: fn.observability.metrics.length > 0,
    logsEnabled: fn.observability.logs.length > 0,
    correlationTracking: true, // Sempre habilitado
  }));
}

// ============================================
// VALIDAÇÃO M₈ — FUNCTION → TESTS
// ============================================

export function validateFunctionTests(): FunctionToTestMapping[] {
  return FUNCTION_MATRIX.map(fn => ({
    functionId: fn.id,
    hasUnitTest: fn.tests.unit,
    hasIntegrationTest: fn.tests.integration,
    hasE2ETest: fn.tests.e2e,
    hasSmokeTest: fn.tests.smoke,
    coveragePercent: calculateCoverage(fn.tests),
  }));
}

function calculateCoverage(tests: FunctionSpec['tests']): number {
  const total = 4;
  let covered = 0;
  if (tests.unit) covered++;
  if (tests.integration) covered++;
  if (tests.e2e) covered++;
  if (tests.smoke) covered++;
  return Math.round((covered / total) * 100);
}

// ============================================
// AUDITORIA DE FUNÇÕES
// ============================================

export interface FunctionAuditResult {
  total: number;
  active: number;
  disabled: number;
  comingSoon: number;
  deprecated: number;
  withBackend: number;
  withoutBackend: number;
  withTests: number;
  withoutTests: number;
  deadTriggers: string[];
  missingBackends: string[];
  byDomain: Record<string, number>;
}

export function auditFunctions(): FunctionAuditResult {
  const deadTriggers: string[] = [];
  const missingBackends: string[] = [];
  const byDomain: Record<string, number> = {};
  
  let active = 0;
  let disabled = 0;
  let comingSoon = 0;
  let deprecated = 0;
  let withBackend = 0;
  let withTests = 0;
  
  for (const fn of FUNCTION_MATRIX) {
    // Contar por status
    if (fn.status === 'active') active++;
    else if (fn.status === 'disabled') disabled++;
    else if (fn.status === 'coming_soon') comingSoon++;
    else if (fn.status === 'deprecated') deprecated++;
    
    // Contar por domínio
    byDomain[fn.domain] = (byDomain[fn.domain] || 0) + 1;
    
    // Verificar backend
    if (fn.backend.handlers.length > 0) {
      withBackend++;
    } else if (fn.status === 'active') {
      missingBackends.push(fn.id);
    }
    
    // Verificar testes
    if (fn.tests.unit || fn.tests.e2e || fn.tests.smoke) {
      withTests++;
    }
    
    // Verificar triggers mortos (status active mas sem handler)
    if (fn.status === 'active' && fn.backend.handlers.length === 0) {
      fn.ui.triggers.forEach(t => {
        deadTriggers.push(`${fn.id}:${t.type}`);
      });
    }
  }
  
  return {
    total: FUNCTION_MATRIX.length,
    active,
    disabled,
    comingSoon,
    deprecated,
    withBackend,
    withoutBackend: FUNCTION_MATRIX.length - withBackend,
    withTests,
    withoutTests: FUNCTION_MATRIX.length - withTests,
    deadTriggers,
    missingBackends,
    byDomain,
  };
}

// ============================================
// HELPERS
// ============================================

export function getFunctionsByDomain(domain: string): FunctionSpec[] {
  return FUNCTION_MATRIX.filter(fn => fn.domain === domain);
}

export function getFunctionsByStatus(status: FunctionSpec['status']): FunctionSpec[] {
  return FUNCTION_MATRIX.filter(fn => fn.status === status);
}

export function getActiveFunction(): FunctionSpec[] {
  return FUNCTION_MATRIX.filter(fn => fn.status === 'active');
}

export function getComingSoonFunctions(): FunctionSpec[] {
  return FUNCTION_MATRIX.filter(fn => fn.status === 'coming_soon');
}

export function getAllFunctionIds(): FunctionId[] {
  return FUNCTION_MATRIX.map(fn => fn.id);
}
