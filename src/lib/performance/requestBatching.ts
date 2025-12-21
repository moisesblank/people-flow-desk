// ============================================
// ⚡ DOGMA VI: O VOTO DE SILÊNCIO DAS REQUISIÇÕES ⚡
// ============================================
// Cada requisição HTTP é uma jornada perigosa.
// Faça o mínimo de jornadas possível.

import { supabase } from '@/integrations/supabase/client';

// ============================================
// BATCH REQUEST MANAGER
// ============================================

interface BatchRequest<T = unknown> {
  id: string;
  table: string;
  query: string;
  select?: string;
  filters?: Record<string, unknown>;
  resolve: (data: T) => void;
  reject: (error: Error) => void;
}

class RequestBatcher {
  private queue: BatchRequest[] = [];
  private timeout: ReturnType<typeof setTimeout> | null = null;
  private batchDelay = 10; // ms - aggregate requests within this window
  private maxBatchSize = 20;

  async add<T>(
    table: string,
    select: string = '*',
    filters?: Record<string, unknown>
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const request: BatchRequest<T> = {
        id: crypto.randomUUID(),
        table,
        query: select,
        select,
        filters,
        resolve: resolve as (data: unknown) => void,
        reject,
      };

      this.queue.push(request);

      if (this.queue.length >= this.maxBatchSize) {
        this.flush();
      } else if (!this.timeout) {
        this.timeout = setTimeout(() => this.flush(), this.batchDelay);
      }
    });
  }

  private async flush(): Promise<void> {
    if (this.timeout) {
      clearTimeout(this.timeout);
      this.timeout = null;
    }

    const requests = [...this.queue];
    this.queue = [];

    if (requests.length === 0) return;

    // Group requests by table for efficient batching
    const grouped = requests.reduce((acc, req) => {
      if (!acc[req.table]) acc[req.table] = [];
      acc[req.table].push(req);
      return acc;
    }, {} as Record<string, BatchRequest[]>);

    // Execute all table queries in parallel
    const promises = Object.entries(grouped).map(async ([table, reqs]) => {
      try {
        // For same table, we can often combine into a single query
        const uniqueSelects = [...new Set(reqs.map(r => r.select || '*'))];
        const combinedSelect = uniqueSelects.join(', ');

        let query = supabase.from(table as any).select(combinedSelect);

        // Apply common filters if all requests have the same filter
        const { data, error } = await query;

        if (error) {
          reqs.forEach(req => req.reject(new Error(error.message)));
        } else {
          reqs.forEach(req => req.resolve(data));
        }
      } catch (err) {
        reqs.forEach(req => req.reject(err instanceof Error ? err : new Error(String(err))));
      }
    });

    await Promise.all(promises);
  }
}

export const requestBatcher = new RequestBatcher();

// ============================================
// MULTI-QUERY EXECUTOR
// ============================================

interface QueryDefinition {
  table: string;
  select?: string;
  filters?: Array<{ column: string; operator: string; value: unknown }>;
  order?: { column: string; ascending?: boolean };
  limit?: number;
  single?: boolean;
}

interface MultiQueryResult<T extends Record<string, QueryDefinition>> {
  data: { [K in keyof T]: unknown[] | unknown | null };
  errors: { [K in keyof T]?: string };
  timing: number;
}

export async function executeMultiQuery<T extends Record<string, QueryDefinition>>(
  queries: T
): Promise<MultiQueryResult<T>> {
  const startTime = performance.now();
  const results: Record<string, unknown> = {};
  const errors: Record<string, string> = {};

  // Execute all queries in parallel
  const promises = Object.entries(queries).map(async ([key, def]) => {
    try {
      let query: any = supabase.from(def.table as any).select(def.select || '*');

      // Apply filters
      if (def.filters) {
        for (const filter of def.filters) {
          query = query.filter(filter.column, filter.operator as any, filter.value);
        }
      }

      // Apply ordering
      if (def.order) {
        query = query.order(def.order.column, { ascending: def.order.ascending ?? true });
      }

      // Apply limit
      if (def.limit) {
        query = query.limit(def.limit);
      }

      // Single vs multiple
      if (def.single) {
        query = query.single();
      }

      const { data, error } = await query;

      if (error) {
        errors[key] = error.message;
        results[key] = null;
      } else {
        results[key] = data;
      }
    } catch (err) {
      errors[key] = err instanceof Error ? err.message : String(err);
      results[key] = null;
    }
  });

  await Promise.all(promises);

  return {
    data: results as MultiQueryResult<T>['data'],
    errors: errors as MultiQueryResult<T>['errors'],
    timing: performance.now() - startTime,
  };
}

// ============================================
// PREFETCH MANAGER
// ============================================

interface PrefetchConfig {
  key: string;
  fetcher: () => Promise<unknown>;
  priority: 'high' | 'medium' | 'low';
  ttl?: number;
}

class PrefetchManager {
  private cache = new Map<string, { data: unknown; expires: number }>();
  private inFlight = new Map<string, Promise<unknown>>();
  private queue: PrefetchConfig[] = [];
  private isProcessing = false;

  async prefetch(config: PrefetchConfig): Promise<void> {
    // Check if already cached and valid
    const cached = this.cache.get(config.key);
    if (cached && cached.expires > Date.now()) return;

    // Check if already in flight
    if (this.inFlight.has(config.key)) return;

    // Add to queue based on priority
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    const insertIndex = this.queue.findIndex(
      q => priorityOrder[q.priority] > priorityOrder[config.priority]
    );
    
    if (insertIndex === -1) {
      this.queue.push(config);
    } else {
      this.queue.splice(insertIndex, 0, config);
    }

    this.processQueue();
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.queue.length === 0) return;

    this.isProcessing = true;

    while (this.queue.length > 0) {
      const config = this.queue.shift()!;
      
      const promise = config.fetcher();
      this.inFlight.set(config.key, promise);

      try {
        const data = await promise;
        this.cache.set(config.key, {
          data,
          expires: Date.now() + (config.ttl || 5 * 60 * 1000),
        });
      } catch (error) {
        console.warn(`[Prefetch] Failed to prefetch ${config.key}:`, error);
      } finally {
        this.inFlight.delete(config.key);
      }

      // Small delay between prefetches to not overwhelm
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    this.isProcessing = false;
  }

  get<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (cached && cached.expires > Date.now()) {
      return cached.data as T;
    }
    return null;
  }

  invalidate(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
    this.queue = [];
  }
}

export const prefetchManager = new PrefetchManager();

// ============================================
// HTTP/3 & CONNECTION OPTIMIZATION
// ============================================

export const CONNECTION_HINTS = {
  // Preconnect to critical origins
  preconnect: [
    'https://fyikfsasudgzsjmumdlw.supabase.co',
    'https://fonts.googleapis.com',
    'https://fonts.gstatic.com',
  ],
  
  // DNS prefetch for less critical origins
  dnsPrefetch: [
    'https://api.openai.com',
    'https://www.google-analytics.com',
  ],
};

export function injectConnectionHints(): void {
  const head = document.head;
  
  // Preconnect hints
  CONNECTION_HINTS.preconnect.forEach(origin => {
    if (!document.querySelector(`link[rel="preconnect"][href="${origin}"]`)) {
      const link = document.createElement('link');
      link.rel = 'preconnect';
      link.href = origin;
      link.crossOrigin = 'anonymous';
      head.appendChild(link);
    }
  });
  
  // DNS prefetch hints
  CONNECTION_HINTS.dnsPrefetch.forEach(origin => {
    if (!document.querySelector(`link[rel="dns-prefetch"][href="${origin}"]`)) {
      const link = document.createElement('link');
      link.rel = 'dns-prefetch';
      link.href = origin;
      head.appendChild(link);
    }
  });
}

// ============================================
// FETCH DEDUPLICATION
// ============================================

const inflightRequests = new Map<string, Promise<unknown>>();

export async function deduplicatedFetch<T>(
  key: string,
  fetcher: () => Promise<T>
): Promise<T> {
  // If there's already an in-flight request with this key, return that promise
  const existing = inflightRequests.get(key);
  if (existing) {
    return existing as Promise<T>;
  }

  // Create the new request
  const promise = fetcher().finally(() => {
    inflightRequests.delete(key);
  });

  inflightRequests.set(key, promise);
  return promise;
}

// ============================================
// REQUEST COALESCING FOR RAPID FIRE
// ============================================

export function createCoalescedFetcher<T, Args extends unknown[]>(
  fetcher: (...args: Args) => Promise<T>,
  options: {
    delay?: number;
    maxWait?: number;
  } = {}
): (...args: Args) => Promise<T> {
  const { delay = 50, maxWait = 200 } = options;
  
  let timeout: ReturnType<typeof setTimeout> | null = null;
  let maxWaitTimeout: ReturnType<typeof setTimeout> | null = null;
  let pending: Array<{
    args: Args;
    resolve: (value: T) => void;
    reject: (error: Error) => void;
  }> = [];
  let firstCallTime: number | null = null;

  const execute = async () => {
    if (timeout) clearTimeout(timeout);
    if (maxWaitTimeout) clearTimeout(maxWaitTimeout);
    timeout = null;
    maxWaitTimeout = null;
    firstCallTime = null;

    const batch = [...pending];
    pending = [];

    // Execute with the last args (most recent request)
    const lastRequest = batch[batch.length - 1];
    
    try {
      const result = await fetcher(...lastRequest.args);
      batch.forEach(req => req.resolve(result));
    } catch (error) {
      batch.forEach(req => req.reject(error instanceof Error ? error : new Error(String(error))));
    }
  };

  return (...args: Args): Promise<T> => {
    return new Promise((resolve, reject) => {
      pending.push({ args, resolve, reject });

      if (!firstCallTime) {
        firstCallTime = Date.now();
        maxWaitTimeout = setTimeout(execute, maxWait);
      }

      if (timeout) clearTimeout(timeout);
      timeout = setTimeout(execute, delay);
    });
  };
}

console.log('[DOGMA VI] ⚡ Sistema de Batching de Requisições inicializado');
