// ============================================
// ⚡ EVANGELHO DA VELOCIDADE v2.0 ⚡
// DOGMA IV: Query Analysis Helper
// Utilitários para análise e otimização de queries
// ============================================

import { supabase } from "@/integrations/supabase/client";

/**
 * DOGMA IV.2 - Wrapper para queries com timing
 * Loga queries que excedem 50ms (threshold sagrado)
 */
export async function timedQuery<T>(
  queryName: string,
  queryFn: () => Promise<T>,
  options?: {
    threshold?: number;
    logAlways?: boolean;
  }
): Promise<{ data: T; durationMs: number }> {
  const start = performance.now();
  
  try {
    const data = await queryFn();
    const durationMs = performance.now() - start;
    
    // DOGMA IV: Threshold sagrado de 50ms
    const threshold = options?.threshold ?? 50;
    
    if (durationMs > threshold || options?.logAlways) {
      const status = durationMs > threshold ? '⚠️ SLOW' : '✅ FAST';
      console.log(
        `[DOGMA IV] ${status} Query "${queryName}": ${durationMs.toFixed(0)}ms`,
        durationMs > threshold ? `(threshold: ${threshold}ms)` : ''
      );
    }
    
    return { data, durationMs };
  } catch (error) {
    const durationMs = performance.now() - start;
    console.error(`[DOGMA IV] ❌ FAILED Query "${queryName}": ${durationMs.toFixed(0)}ms`, error);
    throw error;
  }
}

/**
 * DOGMA IV.1 - Sugestões de índices baseadas em padrões de query
 */
export const INDEX_RECOMMENDATIONS = {
  alunos: [
    { columns: ['status', 'created_at'], type: 'btree', reason: 'Listagem por status ordenada por data' },
    { columns: ['email', 'status'], type: 'btree', reason: 'Busca por email com filtro de status' },
    { columns: ['curso_id', 'status'], type: 'btree', reason: 'Alunos por curso' },
  ],
  transacoes_hotmart_completo: [
    { columns: ['status', 'data_compra'], type: 'btree', reason: 'Transações por status e data' },
    { columns: ['buyer_email', 'status'], type: 'btree', reason: 'Busca por comprador' },
  ],
  calendar_tasks: [
    { columns: ['user_id', 'task_date', 'is_completed'], type: 'btree', reason: 'Tarefas do usuário por data' },
  ],
  entradas: [
    { columns: ['created_at', 'categoria'], type: 'btree', reason: 'Entradas por período e categoria' },
  ],
} as const;

/**
 * DOGMA IV.3 - Verificação de saúde do connection pool
 */
export async function checkConnectionHealth(): Promise<{
  isHealthy: boolean;
  latencyMs: number;
  message: string;
}> {
  const start = performance.now();
  
  try {
    // Query simples para testar conexão
    const { error } = await supabase.from('profiles').select('id').limit(1);
    
    const latencyMs = performance.now() - start;
    
    if (error) {
      return {
        isHealthy: false,
        latencyMs,
        message: `Connection error: ${error.message}`,
      };
    }
    
    // Thresholds de saúde
    if (latencyMs < 50) {
      return { isHealthy: true, latencyMs, message: 'Excellent - Sub-50ms' };
    } else if (latencyMs < 100) {
      return { isHealthy: true, latencyMs, message: 'Good - Sub-100ms' };
    } else if (latencyMs < 300) {
      return { isHealthy: true, latencyMs, message: 'Acceptable - Sub-300ms' };
    } else {
      return { isHealthy: false, latencyMs, message: `Warning - ${latencyMs.toFixed(0)}ms is slow` };
    }
  } catch (error) {
    return {
      isHealthy: false,
      latencyMs: performance.now() - start,
      message: `Critical error: ${error}`,
    };
  }
}

/**
 * Batch queries para reduzir roundtrips
 */
export async function batchQueries<T extends Record<string, () => Promise<any>>>(
  queries: T
): Promise<{ [K in keyof T]: Awaited<ReturnType<T[K]>> }> {
  const start = performance.now();
  const entries = Object.entries(queries);
  
  const results = await Promise.all(
    entries.map(async ([key, queryFn]) => {
      try {
        const result = await queryFn();
        return [key, result] as const;
      } catch (error) {
        console.error(`[DOGMA IV] Batch query "${key}" failed:`, error);
        return [key, null] as const;
      }
    })
  );
  
  const durationMs = performance.now() - start;
  console.log(`[DOGMA IV] Batch of ${entries.length} queries completed in ${durationMs.toFixed(0)}ms`);
  
  return Object.fromEntries(results) as any;
}

/**
 * Query com retry automático e backoff
 */
export async function resilientQuery<T>(
  queryFn: () => Promise<T>,
  options?: {
    maxRetries?: number;
    baseDelay?: number;
    maxDelay?: number;
  }
): Promise<T> {
  const { maxRetries = 3, baseDelay = 100, maxDelay = 5000 } = options || {};
  
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await queryFn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      if (attempt < maxRetries - 1) {
        const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
        console.log(`[DOGMA IV] Retry ${attempt + 1}/${maxRetries} in ${delay}ms`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError;
}

/**
 * Monitor de performance de queries
 */
class QueryPerformanceMonitor {
  private metrics: Map<string, { count: number; totalMs: number; maxMs: number }> = new Map();
  
  record(queryName: string, durationMs: number): void {
    const existing = this.metrics.get(queryName) || { count: 0, totalMs: 0, maxMs: 0 };
    this.metrics.set(queryName, {
      count: existing.count + 1,
      totalMs: existing.totalMs + durationMs,
      maxMs: Math.max(existing.maxMs, durationMs),
    });
  }
  
  getStats(queryName?: string): Record<string, { count: number; avgMs: number; maxMs: number }> {
    const result: Record<string, { count: number; avgMs: number; maxMs: number }> = {};
    
    for (const [name, { count, totalMs, maxMs }] of this.metrics.entries()) {
      if (!queryName || name === queryName) {
        result[name] = { count, avgMs: totalMs / count, maxMs };
      }
    }
    
    return result;
  }
  
  getSlowestQueries(limit: number = 5): Array<{ name: string; avgMs: number; count: number }> {
    return Array.from(this.metrics.entries())
      .map(([name, { count, totalMs }]) => ({ name, avgMs: totalMs / count, count }))
      .sort((a, b) => b.avgMs - a.avgMs)
      .slice(0, limit);
  }
  
  reset(): void {
    this.metrics.clear();
  }
}

export const queryMonitor = new QueryPerformanceMonitor();
