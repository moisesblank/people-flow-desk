// ============================================
// 🔥 TELEMETRY REGISTRY — MATRIZ M₇
// Auditoria padronizada + Correlation ID
// ============================================

import { supabase } from '@/integrations/supabase/client';
import type { AuditConfig, FunctionId } from './types';
import { DEFAULT_AUDIT_CONFIG } from './types';

// ============================================
// GERADOR DE CORRELATION ID
// ============================================

let currentCorrelationId: string | null = null;

export function generateCorrelationId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

export function getCorrelationId(): string {
  if (!currentCorrelationId) {
    currentCorrelationId = generateCorrelationId();
  }
  return currentCorrelationId;
}

export function resetCorrelationId(): void {
  currentCorrelationId = null;
}

// ============================================
// EVENTO DE AUDITORIA PADRONIZADO
// ============================================

export interface AuditEvent {
  functionId: FunctionId;
  action: string;
  category: 'navigation' | 'crud' | 'auth' | 'upload' | 'download' | 'export' | 'import' | 'system';
  correlationId: string;
  userId?: string;
  userEmail?: string;
  userRole?: string;
  tableName?: string;
  recordId?: string;
  oldData?: Record<string, unknown>;
  newData?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  severity: 'info' | 'warn' | 'error';
  timestamp: string;
  durationMs?: number;
  success: boolean;
  errorMessage?: string;
}

// ============================================
// LOGGER DE AUDITORIA
// ============================================

const auditConfig: AuditConfig = { ...DEFAULT_AUDIT_CONFIG };

export function configureAudit(config: Partial<AuditConfig>): void {
  Object.assign(auditConfig, config);
}

export async function logAuditEvent(event: Omit<AuditEvent, 'correlationId' | 'timestamp'>): Promise<void> {
  if (!auditConfig.enabled) return;
  
  const fullEvent: AuditEvent = {
    ...event,
    correlationId: getCorrelationId(),
    timestamp: new Date().toISOString(),
  };
  
  // Log local
  if (auditConfig.logLevel === 'debug') {
    console.debug('[AUDIT]', fullEvent);
  } else if (event.severity === 'error') {
    console.error('[AUDIT]', fullEvent);
  } else if (event.severity === 'warn') {
    console.warn('[AUDIT]', fullEvent);
  }
  
  // Persistir no banco
  if (auditConfig.persistToDb) {
    try {
      // Sanitizar dados sensíveis
      const sanitizedOld = sanitizeSensitiveData(event.oldData);
      const sanitizedNew = sanitizeSensitiveData(event.newData);
      const sanitizedMeta = sanitizeSensitiveData(event.metadata);
      
      await supabase.from('audit_logs').insert({
        action: `${event.functionId}:${event.action}`,
        table_name: event.tableName,
        record_id: event.recordId,
        old_data: (sanitizedOld ?? null) as import('@/integrations/supabase/types').Json,
        new_data: (sanitizedNew ?? null) as import('@/integrations/supabase/types').Json,
        metadata: {
          ...sanitizedMeta,
          correlation_id: fullEvent.correlationId,
          category: event.category,
          severity: event.severity,
          duration_ms: event.durationMs,
          success: event.success,
          error: event.errorMessage,
        } as import('@/integrations/supabase/types').Json,
        user_id: event.userId,
      });
    } catch (err) {
      console.error('[AUDIT] Falha ao persistir:', err);
    }
  }
}

function sanitizeSensitiveData(data?: Record<string, unknown>): Record<string, unknown> | undefined {
  if (!data) return undefined;
  
  const sanitized = { ...data };
  for (const field of auditConfig.sensitiveFields) {
    if (field in sanitized) {
      sanitized[field] = '***REDACTED***';
    }
  }
  return sanitized;
}

// ============================================
// HELPERS DE AUDITORIA
// ============================================

export async function auditNavigation(functionId: FunctionId, path: string, userId?: string): Promise<void> {
  await logAuditEvent({
    functionId,
    action: 'navigate',
    category: 'navigation',
    userId,
    metadata: { path },
    severity: 'info',
    success: true,
  });
}

export async function auditCrud(
  functionId: FunctionId,
  operation: 'create' | 'read' | 'update' | 'delete',
  tableName: string,
  recordId: string,
  options: {
    userId?: string;
    oldData?: Record<string, unknown>;
    newData?: Record<string, unknown>;
    success: boolean;
    error?: string;
    durationMs?: number;
  }
): Promise<void> {
  await logAuditEvent({
    functionId,
    action: operation,
    category: 'crud',
    tableName,
    recordId,
    userId: options.userId,
    oldData: options.oldData,
    newData: options.newData,
    success: options.success,
    errorMessage: options.error,
    durationMs: options.durationMs,
    severity: options.success ? 'info' : 'error',
  });
}

export async function auditAuth(
  action: 'login' | 'logout' | 'signup' | 'password_reset' | 'mfa_verify',
  userId: string,
  success: boolean,
  metadata?: Record<string, unknown>
): Promise<void> {
  await logAuditEvent({
    functionId: `F.AUTH.${action.toUpperCase()}` as FunctionId,
    action,
    category: 'auth',
    userId,
    metadata,
    success,
    severity: success ? 'info' : 'warn',
  });
}

export async function auditUpload(
  functionId: FunctionId,
  bucket: string,
  path: string,
  options: {
    userId?: string;
    fileSize?: number;
    mimeType?: string;
    success: boolean;
    error?: string;
  }
): Promise<void> {
  await logAuditEvent({
    functionId,
    action: 'upload',
    category: 'upload',
    userId: options.userId,
    metadata: {
      bucket,
      path,
      file_size: options.fileSize,
      mime_type: options.mimeType,
    },
    success: options.success,
    errorMessage: options.error,
    severity: options.success ? 'info' : 'error',
  });
}

// ============================================
// MÉTRICAS
// ============================================

export interface TelemetryMetrics {
  totalEvents: number;
  byCategory: Record<string, number>;
  bySeverity: Record<string, number>;
  errorRate: number;
  avgDurationMs: number;
}

export async function getTelemetryMetrics(hours: number = 24): Promise<TelemetryMetrics> {
  const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
  
  const { data, error } = await supabase
    .from('audit_logs')
    .select('action, metadata')
    .gte('created_at', since);
  
  if (error || !data) {
    return {
      totalEvents: 0,
      byCategory: {},
      bySeverity: {},
      errorRate: 0,
      avgDurationMs: 0,
    };
  }
  
  const byCategory: Record<string, number> = {};
  const bySeverity: Record<string, number> = {};
  let errors = 0;
  let totalDuration = 0;
  let durationCount = 0;
  
  for (const row of data) {
    const meta = row.metadata as Record<string, unknown> | null;
    
    if (meta?.category) {
      byCategory[meta.category as string] = (byCategory[meta.category as string] || 0) + 1;
    }
    if (meta?.severity) {
      bySeverity[meta.severity as string] = (bySeverity[meta.severity as string] || 0) + 1;
      if (meta.severity === 'error') errors++;
    }
    if (typeof meta?.duration_ms === 'number') {
      totalDuration += meta.duration_ms;
      durationCount++;
    }
  }
  
  return {
    totalEvents: data.length,
    byCategory,
    bySeverity,
    errorRate: data.length > 0 ? errors / data.length : 0,
    avgDurationMs: durationCount > 0 ? totalDuration / durationCount : 0,
  };
}
