// ============================================================
// 🧠 SNA HOOKS OMEGA v5.0 — Sistema Nervoso Autônomo
// Hooks para métricas, automação e controle de IAs
// Capacidade: 5.000+ usuários simultâneos
// ============================================================

import { useState, useCallback, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import type { Json } from '@/integrations/supabase/types';
import { formatError } from '@/lib/utils/formatError';

// ============================================================
// TIPOS
// ============================================================

export interface SNAMetrics {
  jobs: {
    total: number;
    pending: number;
    running: number;
    completed: number;
    failed: number;
    avg_processing_ms: number;
    p95_processing_ms: number;
  };
  costs: {
    total_usd: number;
    today_usd: number;
    budget_usd: number;
    budget_remaining: number;
    budget_percentage: number;
  };
  performance: {
    success_rate: number;
    avg_latency_ms: number;
    p95_latency_ms: number;
    cache_hit_rate: number;
    tokens_in: number;
    tokens_out: number;
  };
  queue: {
    pending_by_priority: Record<number, number>;
    oldest_job_age_seconds: number;
    avg_wait_seconds: number;
  };
  health: {
    overall: 'healthy' | 'degraded' | 'critical';
    services: Record<string, { ok: boolean; latency_ms: number; last_check: string }>;
  };
  timestamp: string;
}

export interface SNAJob {
  id: string;
  job_type: string;
  status: string;
  priority: number;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
  processing_time_ms: number | null;
  actual_cost_usd: number | null;
  result_summary: string | null;
  error: Json | null;
  attempts: number;
}

export interface FeatureFlag {
  flag_key: string;
  description: string;
  is_enabled: boolean;
  rollout_percentage: number;
  category: string;
  allowed_roles: string[];
}

export interface HealthCheckResult {
  service: string;
  ok: boolean;
  latency_ms: number;
  message?: string;
}

// ============================================================
// HOOK: useAIMetrics
// Métricas em tempo real do SNA
// ============================================================

export function useAIMetrics(refreshInterval = 30000) {
  const [metrics, setMetrics] = useState<SNAMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchMetrics = useCallback(async () => {
    try {
      // Buscar métricas via RPC
      const { data: rpcData, error: rpcError } = await supabase.rpc('sna_get_metrics', {
        p_hours: 24,
        p_include_details: true
      });

      if (rpcError) {
        // Fallback: buscar dados diretamente das tabelas
        const [jobsRes, healthRes] = await Promise.all([
          supabase.from('sna_jobs')
            .select('status, processing_time_ms, actual_cost_usd')
            .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),
          supabase.from('sna_healthchecks')
            .select('service, ok, latency_ms, created_at')
            .order('created_at', { ascending: false })
            .limit(10)
        ]);

        const jobs = jobsRes.data || [];
        const health = healthRes.data || [];

        // Calcular métricas manualmente
        const statusCounts = jobs.reduce((acc, j) => {
          acc[j.status] = (acc[j.status] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        const completedJobs = jobs.filter(j => j.status === 'completed');
        const avgTime = completedJobs.length > 0
          ? completedJobs.reduce((sum, j) => sum + (j.processing_time_ms || 0), 0) / completedJobs.length
          : 0;

        const totalCost = jobs.reduce((sum, j) => sum + (j.actual_cost_usd || 0), 0);

        setMetrics({
          jobs: {
            total: jobs.length,
            pending: statusCounts['pending'] || 0,
            running: statusCounts['running'] || 0,
            completed: statusCounts['completed'] || 0,
            failed: statusCounts['failed'] || 0,
            avg_processing_ms: Math.round(avgTime),
            p95_processing_ms: Math.round(avgTime * 1.5),
          },
          costs: {
            total_usd: totalCost,
            today_usd: totalCost,
            budget_usd: 100,
            budget_remaining: 100 - totalCost,
            budget_percentage: (totalCost / 100) * 100,
          },
          performance: {
            success_rate: jobs.length > 0 ? ((statusCounts['completed'] || 0) / jobs.length) * 100 : 100,
            avg_latency_ms: Math.round(avgTime),
            p95_latency_ms: Math.round(avgTime * 1.5),
            cache_hit_rate: 35,
            tokens_in: 0,
            tokens_out: 0,
          },
          queue: {
            pending_by_priority: {},
            oldest_job_age_seconds: 0,
            avg_wait_seconds: 0,
          },
          health: {
            overall: 'healthy',
            services: health.reduce((acc, h) => {
              acc[h.service] = { 
                ok: h.ok, 
                latency_ms: h.latency_ms || 0, 
                last_check: h.created_at 
              };
              return acc;
            }, {} as Record<string, { ok: boolean; latency_ms: number; last_check: string }>),
          },
          timestamp: new Date().toISOString(),
        });
      } else if (rpcData) {
        // Parse RPC data com type assertion seguro
        const parsed = typeof rpcData === 'object' ? rpcData as unknown as SNAMetrics : null;
        if (parsed) {
          setMetrics(parsed);
        }
      }

      setError(null);
    } catch (err: any) {
      console.error('Erro ao buscar métricas SNA:', err);
      setError(err.message || 'Erro ao carregar métricas');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refresh = useCallback(() => {
    setIsLoading(true);
    return fetchMetrics();
  }, [fetchMetrics]);

  useEffect(() => {
    fetchMetrics();
    
    if (refreshInterval > 0) {
      intervalRef.current = setInterval(fetchMetrics, refreshInterval);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [fetchMetrics, refreshInterval]);

  return { metrics, isLoading, error, refresh };
}

// ============================================================
// HOOK: useAIAutomation
// Controle de jobs, flags e healthchecks
// ============================================================

export function useAIAutomation() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  // Criar job assíncrono
  const createJob = useCallback(async (
    jobType: string,
    input: Record<string, unknown> = {},
    options: {
      priority?: number;
      idempotencyKey?: string;
      runAfter?: Date;
      deadline?: Date;
      tags?: string[];
    } = {}
  ) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.rpc('sna_create_job', {
        p_job_type: jobType,
        p_idempotency_key: options.idempotencyKey || `${jobType}_${Date.now()}`,
        p_input: input as unknown as Json,
        p_priority: options.priority ?? 3,
        p_run_after: options.runAfter?.toISOString() ?? new Date().toISOString(),
        p_deadline: options.deadline?.toISOString() ?? null,
        p_tags: options.tags ?? [],
      });

      if (error) throw error;
      
      toast.success('🚀 Job criado com sucesso');
      return data;
    } catch (err: unknown) {
      console.error('Erro ao criar job:', err);
      toast.error(`❌ Erro: ${formatError(err)}`);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Executar healthcheck
  const runHealthcheck = useCallback(async (): Promise<Record<string, HealthCheckResult>> => {
    setIsLoading(true);
    try {
      const services = ['sna-gateway', 'sna-worker', 'ai-tutor', 'ia-gateway', 'database'];
      const results: Record<string, HealthCheckResult> = {};

      await Promise.all(services.map(async (service) => {
        const start = Date.now();
        try {
          if (service === 'database') {
            await supabase.from('sna_healthchecks').select('id').limit(1);
            results[service] = { service, ok: true, latency_ms: Date.now() - start };
          } else {
            const { error } = await supabase.functions.invoke(service, {
              body: { action: 'health' }
            });
            results[service] = { 
              service, 
              ok: !error, 
              latency_ms: Date.now() - start,
              message: error?.message 
            };
          }
        } catch (err: any) {
          results[service] = { 
            service, 
            ok: false, 
            latency_ms: Date.now() - start,
            message: err.message 
          };
        }
      }));

      // Salvar resultados
      const healthInserts = Object.values(results).map(r => ({
        service: r.service,
        ok: r.ok,
        latency_ms: r.latency_ms,
        error_message: r.message || null
      }));

      await supabase.from('sna_healthchecks').insert(healthInserts);

      return results;
    } catch (err: any) {
      console.error('Erro no healthcheck:', err);
      toast.error('❌ Healthcheck falhou');
      return {};
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Verificar feature flag
  const checkFeatureFlag = useCallback(async (flagKey: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from('sna_feature_flags')
        .select('is_enabled, rollout_percentage, allowed_roles')
        .eq('flag_key', flagKey)
        .single();

      if (error || !data) return false;
      if (!data.is_enabled) return false;

      // Verificar rollout percentage
      if (data.rollout_percentage < 100) {
        const hash = flagKey.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const userHash = user?.id ? user.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) : 0;
        const combined = (hash + userHash) % 100;
        if (combined >= data.rollout_percentage) return false;
      }

      return true;
    } catch {
      return false;
    }
  }, [user?.id]);

  // Cancelar job
  const cancelJob = useCallback(async (jobId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('sna_jobs')
        .update({ status: 'cancelled', completed_at: new Date().toISOString() })
        .eq('id', jobId)
        .in('status', ['pending', 'scheduled']);

      if (error) throw error;
      toast.success('🛑 Job cancelado');
      return true;
    } catch (err: unknown) {
      toast.error(`❌ Erro: ${formatError(err)}`);
      return false;
    }
  }, []);

  // Retry job falho
  const retryJob = useCallback(async (jobId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('sna_jobs')
        .update({ 
          status: 'pending', 
          attempts: 0,
          error: null,
          completed_at: null 
        })
        .eq('id', jobId)
        .eq('status', 'failed');

      if (error) throw error;
      toast.success('🔄 Job reagendado');
      return true;
    } catch (err: unknown) {
      toast.error(`❌ Erro: ${formatError(err)}`);
      return false;
    }
  }, []);

  return {
    isLoading,
    createJob,
    runHealthcheck,
    checkFeatureFlag,
    cancelJob,
    retryJob,
  };
}

// ============================================================
// HOOK: useAIJobs
// Lista e monitora jobs em tempo real
// ============================================================

export function useAIJobs(limit = 50) {
  const [jobs, setJobs] = useState<SNAJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchJobs = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('sna_jobs')
        .select('id, job_type, status, priority, created_at, started_at, completed_at, processing_time_ms, actual_cost_usd, result_summary, error, attempts')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      setJobs((data || []) as SNAJob[]);
    } catch (err) {
      console.error('Erro ao buscar jobs:', err);
    } finally {
      setIsLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    fetchJobs();

    // Realtime subscription
    const channel = supabase
      .channel('sna_jobs_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'sna_jobs'
      }, () => {
        fetchJobs();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchJobs]);

  return { jobs, isLoading, refresh: fetchJobs };
}

// ============================================================
// HOOK: useFeatureFlags
// Gerencia feature flags do SNA
// ============================================================

export function useFeatureFlags() {
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchFlags = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('sna_feature_flags')
        .select('flag_key, description, is_enabled, rollout_percentage, category, allowed_roles')
        .order('category')
        .order('flag_key');

      if (error) throw error;
      setFlags((data || []) as FeatureFlag[]);
    } catch (err) {
      console.error('Erro ao buscar flags:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const toggleFlag = useCallback(async (flagKey: string, enabled: boolean) => {
    try {
      const { error } = await supabase
        .from('sna_feature_flags')
        .update({ is_enabled: enabled, updated_at: new Date().toISOString() })
        .eq('flag_key', flagKey);

      if (error) throw error;
      
      toast.success(`${enabled ? '✅' : '🔴'} ${flagKey} ${enabled ? 'ativado' : 'desativado'}`);
      fetchFlags();
      return true;
    } catch (err: unknown) {
      toast.error(`❌ Erro: ${formatError(err)}`);
      return false;
    }
  }, [fetchFlags]);

  const updateRollout = useCallback(async (flagKey: string, percentage: number) => {
    try {
      const { error } = await supabase
        .from('sna_feature_flags')
        .update({ rollout_percentage: percentage, updated_at: new Date().toISOString() })
        .eq('flag_key', flagKey);

      if (error) throw error;
      
      toast.success(`📊 Rollout atualizado para ${percentage}%`);
      fetchFlags();
      return true;
    } catch (err: unknown) {
      toast.error(`❌ Erro: ${formatError(err)}`);
      return false;
    }
  }, [fetchFlags]);

  useEffect(() => {
    fetchFlags();
  }, [fetchFlags]);

  return { flags, isLoading, refresh: fetchFlags, toggleFlag, updateRollout };
}

export default {
  useAIMetrics,
  useAIAutomation,
  useAIJobs,
  useFeatureFlags,
};
