// ============================================
// 🔥 INTEGRITY VALIDATOR — VALIDAÇÃO TOTAL
// Gera relatório PASS/FAIL com evidências
// ============================================

import { auditRoutes } from './RouteRegistry';
import { auditFunctions, getComingSoonFunctions } from './FunctionRegistry';
import { auditNavLayout, loadNavFromSupabase, normalizeNavLayout } from './NavRegistry';
import { auditSecurity } from './SecurityRegistry';
import { auditStorage } from './StorageRegistry';
import { getTelemetryMetrics } from './TelemetryRegistry';
import type { IntegrityReport, IntegrityIssue, BacklogItem, FunctionId } from './types';

// ============================================
// VERSÃO DO VALIDADOR
// ============================================
export const INTEGRITY_VERSION = 'OMEGA-v15.0';

// ============================================
// VALIDAÇÃO COMPLETA
// ============================================

export async function runIntegrityCheck(): Promise<IntegrityReport> {
  const timestamp = new Date();
  const issues: IntegrityIssue[] = [];
  const backlog: BacklogItem[] = [];
  
  // ========== AUDITAR ROTAS ==========
  const routeAudit = auditRoutes();
  
  if (routeAudit.orphanRoutes.length > 0) {
    issues.push({
      severity: 'warning',
      matrix: 'M1',
      code: 'ORPHAN_ROUTES',
      message: `${routeAudit.orphanRoutes.length} rotas sem definição`,
      location: 'src/core/routes.ts',
      suggestion: 'Adicionar definição em ROUTE_DEFINITIONS',
    });
  }
  
  if (routeAudit.missingGuards.length > 0) {
    issues.push({
      severity: 'warning',
      matrix: 'M2',
      code: 'MISSING_GUARDS',
      message: `${routeAudit.missingGuards.length} rotas protegidas sem roles`,
      location: 'src/core/routes.ts',
      suggestion: 'Adicionar array de roles permitidas',
    });
  }
  
  // ========== AUDITAR FUNÇÕES ==========
  const fnAudit = auditFunctions();
  
  if (fnAudit.deadTriggers.length > 0) {
    issues.push({
      severity: 'error',
      matrix: 'M3',
      code: 'DEAD_TRIGGERS',
      message: `${fnAudit.deadTriggers.length} triggers sem handler (cliques mortos!)`,
      location: 'src/core/functionMatrix.ts',
      suggestion: 'Implementar handlers ou marcar como coming_soon',
    });
  }
  
  if (fnAudit.missingBackends.length > 0) {
    issues.push({
      severity: 'error',
      matrix: 'M4',
      code: 'MISSING_BACKENDS',
      message: `${fnAudit.missingBackends.length} funções ativas sem backend`,
      location: 'src/core/functionMatrix.ts',
      suggestion: 'Adicionar handlers de backend',
    });
  }
  
  // ========== AUDITAR NAV ==========
  const navLayout = await loadNavFromSupabase();
  let navAudit = { totalItems: 0, validItems: 0, orphanItems: [] as string[], statusCounts: { active: 0, disabled: 0, coming_soon: 0 }, totalGroups: 0, invalidItems: 0, duplicates: [] as string[], missingRoutes: [] as string[] };
  
  if (navLayout) {
    const normalized = normalizeNavLayout(navLayout);
    navAudit = auditNavLayout(normalized.normalized);
    
    if (normalized.issues.length > 0) {
      issues.push({
        severity: 'warning',
        matrix: 'M1',
        code: 'NAV_ISSUES',
        message: `${normalized.issues.length} problemas no menu`,
        location: 'editable_content.nav_sidebar_layout_v1',
        suggestion: 'Corrigir duplicações e itens órfãos',
      });
    }
  } else {
    issues.push({
      severity: 'warning',
      matrix: 'M1',
      code: 'NAV_NOT_FOUND',
      message: 'Menu não encontrado no Supabase',
      location: 'editable_content',
      suggestion: 'Criar nav_sidebar_layout_v1 no Supabase',
    });
  }
  
  // ========== AUDITAR SEGURANÇA ==========
  const secAudit = auditSecurity();
  
  if (secAudit.functionsWithoutRbac > 0) {
    issues.push({
      severity: 'warning',
      matrix: 'M6',
      code: 'MISSING_RBAC',
      message: `${secAudit.functionsWithoutRbac} funções sem roles definidas`,
      location: 'src/core/functionMatrix.ts',
      suggestion: 'Adicionar rolesAllowed em security',
    });
  }
  
  // ========== AUDITAR STORAGE ==========
  const storageAudit = auditStorage();
  
  if (storageAudit.orphanBuckets.length > 0) {
    issues.push({
      severity: 'warning',
      matrix: 'M5',
      code: 'ORPHAN_BUCKETS',
      message: `${storageAudit.orphanBuckets.length} buckets sem definição`,
      location: 'src/core/storage.ts',
      suggestion: 'Adicionar definição em BUCKET_DEFINITIONS',
    });
  }
  
  if (storageAudit.withoutMetadataTable > 0) {
    issues.push({
      severity: 'info',
      matrix: 'M5',
      code: 'NO_METADATA_TABLE',
      message: `${storageAudit.withoutMetadataTable} buckets sem tabela de metadados`,
      location: 'src/core/storage.ts',
      suggestion: 'Considerar adicionar metadataTable para rastreamento',
    });
  }
  
  // ========== AUDITAR TELEMETRIA ==========
  const telemetry = await getTelemetryMetrics(24);
  
  if (telemetry.errorRate > 0.1) {
    issues.push({
      severity: 'warning',
      matrix: 'M7',
      code: 'HIGH_ERROR_RATE',
      message: `Taxa de erro alta: ${(telemetry.errorRate * 100).toFixed(1)}%`,
      location: 'audit_logs',
      suggestion: 'Investigar erros recentes',
    });
  }
  
  // ========== GERAR BACKLOG ==========
  const comingSoonFns = getComingSoonFunctions();
  for (const fn of comingSoonFns) {
    backlog.push({
      functionId: fn.id as FunctionId,
      name: fn.name,
      route: fn.route?.key ? `/${fn.route.key.toLowerCase().replace(/_/g, '-')}` : '',
      status: 'coming_soon',
      priority: fn.domain === 'aluno' || fn.domain === 'gestao' ? 'high' : 'medium',
    });
  }
  
  // ========== CALCULAR COBERTURA ==========
  const coverage = {
    nav: {
      total: navAudit.totalItems || 1,
      valid: navAudit.validItems || 0,
      percent: navAudit.totalItems > 0 ? Math.round((navAudit.validItems / navAudit.totalItems) * 100) : 0,
    },
    routes: {
      total: routeAudit.total,
      valid: routeAudit.withDefinition,
      percent: Math.round((routeAudit.withDefinition / routeAudit.total) * 100),
    },
    functions: {
      total: fnAudit.total,
      valid: fnAudit.withBackend,
      percent: Math.round((fnAudit.withBackend / fnAudit.total) * 100),
    },
    storage: {
      total: storageAudit.totalBuckets,
      valid: storageAudit.withDefinition,
      percent: Math.round((storageAudit.withDefinition / storageAudit.totalBuckets) * 100),
    },
    security: {
      total: fnAudit.total,
      valid: secAudit.functionsWithRbac,
      percent: Math.round((secAudit.functionsWithRbac / fnAudit.total) * 100),
    },
  };
  
  // ========== DETERMINAR STATUS ==========
  const hasErrors = issues.some(i => i.severity === 'error');
  const hasWarnings = issues.some(i => i.severity === 'warning');
  const status: 'PASS' | 'FAIL' | 'WARN' = hasErrors ? 'FAIL' : hasWarnings ? 'WARN' : 'PASS';
  
  return {
    timestamp,
    version: INTEGRITY_VERSION,
    coverage,
    counts: {
      deadClicks: fnAudit.deadTriggers.length,
      orphanRoutes: routeAudit.orphanRoutes.length,
      missingHandlers: fnAudit.missingBackends.length,
      rlsGaps: 0, // Seria preenchido com query ao linter
      untrackedEvents: 0,
    },
    status,
    issues,
    backlog,
  };
}

// ============================================
// EXPORTAR RELATÓRIO
// ============================================

export function generateMarkdownReport(report: IntegrityReport): string {
  const lines: string[] = [
    '# 📊 INTEGRITY REPORT - MATRIZ OMEGA',
    '',
    `**Versão:** ${report.version}`,
    `**Data:** ${report.timestamp.toISOString()}`,
    `**Status:** ${report.status === 'PASS' ? '✅ PASS' : report.status === 'FAIL' ? '❌ FAIL' : '⚠️ WARN'}`,
    '',
    '---',
    '',
    '## 📈 Cobertura',
    '',
    '| Área | Total | Válidos | Cobertura |',
    '|------|-------|---------|-----------|',
    `| NAV→ROUTE | ${report.coverage.nav.total} | ${report.coverage.nav.valid} | ${report.coverage.nav.percent}% |`,
    `| ROUTES | ${report.coverage.routes.total} | ${report.coverage.routes.valid} | ${report.coverage.routes.percent}% |`,
    `| FUNCTIONS | ${report.coverage.functions.total} | ${report.coverage.functions.valid} | ${report.coverage.functions.percent}% |`,
    `| STORAGE | ${report.coverage.storage.total} | ${report.coverage.storage.valid} | ${report.coverage.storage.percent}% |`,
    `| SECURITY | ${report.coverage.security.total} | ${report.coverage.security.valid} | ${report.coverage.security.percent}% |`,
    '',
    '---',
    '',
    '## 🔢 Contagens Críticas',
    '',
    `- **Cliques Mortos:** ${report.counts.deadClicks}`,
    `- **Rotas Órfãs:** ${report.counts.orphanRoutes}`,
    `- **Handlers Faltando:** ${report.counts.missingHandlers}`,
    `- **Gaps RLS:** ${report.counts.rlsGaps}`,
    '',
    '---',
    '',
    '## ⚠️ Issues Encontradas',
    '',
  ];
  
  if (report.issues.length === 0) {
    lines.push('Nenhuma issue encontrada! 🎉');
  } else {
    lines.push('| Severidade | Matriz | Código | Mensagem |');
    lines.push('|------------|--------|--------|----------|');
    for (const issue of report.issues) {
      const icon = issue.severity === 'error' ? '🔴' : issue.severity === 'warning' ? '🟡' : '🔵';
      lines.push(`| ${icon} ${issue.severity} | ${issue.matrix} | ${issue.code} | ${issue.message} |`);
    }
  }
  
  lines.push('');
  lines.push('---');
  lines.push('');
  lines.push('## 📋 Backlog (Coming Soon)');
  lines.push('');
  
  if (report.backlog.length === 0) {
    lines.push('Nenhum item em backlog.');
  } else {
    lines.push('| Função | Nome | Rota | Prioridade |');
    lines.push('|--------|------|------|------------|');
    for (const item of report.backlog.slice(0, 20)) { // Limitar a 20
      lines.push(`| ${item.functionId} | ${item.name} | ${item.route} | ${item.priority} |`);
    }
    if (report.backlog.length > 20) {
      lines.push(`| ... | +${report.backlog.length - 20} itens | ... | ... |`);
    }
  }
  
  lines.push('');
  lines.push('---');
  lines.push('');
  lines.push('*Gerado automaticamente pela MATRIZ OMEGA*');
  
  return lines.join('\n');
}
