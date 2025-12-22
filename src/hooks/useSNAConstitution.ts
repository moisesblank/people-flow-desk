/**
 * 🏛️ useSNAConstitution Hook - WRAPPER COMPLETO
 * Hook React para acessar e utilizar a LEI IV - CONSTITUIÇÃO DO SNA OMEGA v5.0
 * 
 * @author MOISESBLANK@GMAIL.COM (OWNER SOBERANO)
 */

import { useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { 
  SNA_CONFIG, 
  EVENT_HANDLERS,
  useSNAConstitution as useSNABase 
} from '@/lib/constitution/LEI_IV_SNA_OMEGA';
import type { Json } from '@/integrations/supabase/types';

// ═══════════════════════════════════════════════════════════════════════════
// TIPOS
// ═══════════════════════════════════════════════════════════════════════════

interface SNAJobInput {
  type: string;
  idempotencyKey: string;
  input: Record<string, unknown>;
  priority?: number;
}

interface SNAJobResult {
  success: boolean;
  jobId?: string;
  existingJobId?: string;
  error?: string;
}

interface SNABudgetCheck {
  allowed: boolean;
  remaining: number;
  limit: number;
  used: number;
}

interface SNAFeatureCheck {
  enabled: boolean;
  rolloutPercentage?: number;
}

interface SNAMetrics {
  jobs: {
    pending: number;
    processing: number;
    completed: number;
    failed: number;
  };
  cache: {
    hits: number;
    misses: number;
    hitRate: number;
  };
  budget: {
    used: number;
    limit: number;
    remaining: number;
  };
  rateLimits: {
    blocked: number;
    allowed: number;
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// 5 PRINCÍPIOS IMUTÁVEIS
// ═══════════════════════════════════════════════════════════════════════════

export const PRINCIPIOS_IMUTAVEIS = {
  SOBERANIA: {
    codigo: 'P001',
    nome: 'Soberania',
    descricao: 'SNA é a única autoridade. Nenhuma IA pode ser chamada diretamente.',
    regra: 'Toda chamada de IA DEVE passar pelo sna-gateway',
    violacao: 'CRITICAL' as const,
  },
  OBEDIENCIA: {
    codigo: 'P002',
    nome: 'Obediência',
    descricao: 'Funcionar não é suficiente. Obedecer é obrigatório.',
    regra: 'Toda função DEVE seguir a Constituição, mesmo que funcione sem ela',
    violacao: 'CRITICAL' as const,
  },
  RASTREABILIDADE: {
    codigo: 'P003',
    nome: 'Rastreabilidade',
    descricao: 'Nenhuma ação sem registro em sna_audit_log/sna_tool_runs.',
    regra: 'Toda execução DEVE gerar log auditável',
    violacao: 'HIGH' as const,
  },
  EFICIENCIA: {
    codigo: 'P004',
    nome: 'Eficiência',
    descricao: 'Nenhum recurso sem orçamento (sna_budgets controla custos).',
    regra: 'Toda execução DEVE verificar budget antes de consumir recursos',
    violacao: 'HIGH' as const,
  },
  SEGURANCA: {
    codigo: 'P005',
    nome: 'Segurança',
    descricao: 'Nenhuma decisão sem auditoria.',
    regra: 'Toda decisão crítica DEVE ser auditada e rastreável',
    violacao: 'CRITICAL' as const,
  },
} as const;

// ═══════════════════════════════════════════════════════════════════════════
// GOVERNANÇA FINAL
// ═══════════════════════════════════════════════════════════════════════════

export const GOVERNANCA_FINAL = {
  artigo_43: {
    titulo: 'Execução Exclusiva',
    regra: 'Nenhuma função pode executar fora do SNA',
    consequencia: 'Bloqueio automático + registro em sna_audit_log',
  },
  artigo_44: {
    titulo: 'Acesso Exclusivo',
    regra: 'Nenhuma IA pode ser chamada diretamente (só via sna-gateway)',
    consequencia: 'Requisição rejeitada + log de violação',
  },
  artigo_45: {
    titulo: 'Consumo Controlado',
    regra: 'Nenhum fluxo pode consumir recursos sem orçamento',
    consequencia: 'Execução negada + alerta ao admin',
  },
  artigo_46: {
    titulo: 'Registro Obrigatório',
    regra: 'Nenhuma ação pode ocorrer sem registro',
    consequencia: 'Rollback automático + log de violação',
  },
  artigo_47: {
    titulo: 'Obediência Universal',
    regra: 'Toda função presente ou futura deve obedecer à LEI IV',
    consequencia: 'Função desabilitada até conformidade',
  },
  artigo_48: {
    titulo: 'Bloqueio Automático',
    regra: 'Violações são bloqueadas e registradas automaticamente',
    consequencia: 'Zero tolerância a exceções',
  },
} as const;

// ═══════════════════════════════════════════════════════════════════════════
// HOOK PRINCIPAL ESTENDIDO
// ═══════════════════════════════════════════════════════════════════════════

export function useSNAConstitutionExtended() {
  // Base do hook original
  const base = useSNABase();
  
  // Princípios
  const principios = useMemo(() => PRINCIPIOS_IMUTAVEIS, []);
  const governanca = useMemo(() => GOVERNANCA_FINAL, []);

  // ─────────────────────────────────────────────────────────────────────────
  // JOBS (via RPC)
  // ─────────────────────────────────────────────────────────────────────────
  
  const createJob = useCallback(async (input: SNAJobInput): Promise<SNAJobResult> => {
    try {
      const { data, error } = await supabase.rpc('sna_create_job', {
        p_job_type: input.type,
        p_idempotency_key: input.idempotencyKey,
        p_input: input.input as unknown as Json,
        p_priority: input.priority ?? 0,
      });

      if (error) {
        console.error('[SNA] Erro ao criar job:', error);
        return { success: false, error: error.message };
      }

      const result = data as Record<string, unknown> | null;
      return {
        success: true,
        jobId: result?.job_id as string | undefined,
        existingJobId: result?.existing_job_id as string | undefined,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      console.error('[SNA] Exceção ao criar job:', message);
      return { success: false, error: message };
    }
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  // BUDGET CHECK
  // ─────────────────────────────────────────────────────────────────────────
  
  const checkBudget = useCallback(async (
    scope: string,
    estimatedCost: number
  ): Promise<SNABudgetCheck> => {
    try {
      const { data, error } = await supabase.rpc('sna_check_budget', {
        p_scope: scope,
        p_estimated_cost: estimatedCost,
      });

      if (error) {
        console.error('[SNA] Erro ao verificar budget:', error);
        return { allowed: false, remaining: 0, limit: 0, used: 0 };
      }

      const result = data as Record<string, unknown> | null;
      return {
        allowed: (result?.allowed as boolean) ?? false,
        remaining: (result?.remaining as number) ?? 0,
        limit: (result?.limit as number) ?? 0,
        used: (result?.used as number) ?? 0,
      };
    } catch (err) {
      console.error('[SNA] Exceção ao verificar budget:', err);
      return { allowed: false, remaining: 0, limit: 0, used: 0 };
    }
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  // FEATURE FLAGS
  // ─────────────────────────────────────────────────────────────────────────
  
  const checkFeature = useCallback(async (
    flagKey: string,
    userId?: string
  ): Promise<SNAFeatureCheck> => {
    try {
      const { data, error } = await supabase.rpc('sna_check_feature', {
        p_flag_key: flagKey,
        p_user_id: userId ?? null,
      });

      if (error) {
        console.error('[SNA] Erro ao verificar feature:', error);
        return { enabled: false };
      }

      const result = data as Record<string, unknown> | null;
      return {
        enabled: (result?.enabled as boolean) ?? false,
        rolloutPercentage: result?.rollout_percentage as number | undefined,
      };
    } catch (err) {
      console.error('[SNA] Exceção ao verificar feature:', err);
      return { enabled: false };
    }
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  // CACHE
  // ─────────────────────────────────────────────────────────────────────────
  
  const cacheGet = useCallback(async <T>(key: string): Promise<T | null> => {
    try {
      const { data, error } = await supabase.rpc('sna_cache_get', {
        p_cache_key: key,
      });

      if (error || !data) return null;
      const result = data as Record<string, unknown>;
      return result?.cached_value as T;
    } catch {
      return null;
    }
  }, []);

  const cacheSet = useCallback(async (
    key: string,
    value: unknown,
    ttlSeconds: number = 3600
  ): Promise<boolean> => {
    try {
      const { error } = await supabase.rpc('sna_cache_set', {
        p_cache_key: key,
        p_value: value as Json,
        p_ttl_seconds: ttlSeconds,
      });

      return !error;
    } catch {
      return false;
    }
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  // MÉTRICAS
  // ─────────────────────────────────────────────────────────────────────────
  
  const getMetrics = useCallback(async (): Promise<SNAMetrics | null> => {
    try {
      const { data, error } = await supabase.rpc('sna_get_metrics', {
        p_hours: 24,
      });

      if (error) {
        console.error('[SNA] Erro ao obter métricas:', error);
        return null;
      }

      return data as unknown as SNAMetrics;
    } catch (err) {
      console.error('[SNA] Exceção ao obter métricas:', err);
      return null;
    }
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  // RATE LIMIT CHECK
  // ─────────────────────────────────────────────────────────────────────────
  
  const checkRateLimit = useCallback(async (
    identifier: string,
    endpoint: string
  ): Promise<{ allowed: boolean; retryAfter?: number }> => {
    try {
      const { data, error } = await supabase.rpc('sna_check_rate_limit', {
        p_identifier: identifier,
        p_endpoint: endpoint,
      });

      if (error) {
        console.error('[SNA] Erro ao verificar rate limit:', error);
        return { allowed: true }; // Fail open
      }

      const result = data as Record<string, unknown> | null;
      return {
        allowed: (result?.allowed as boolean) ?? true,
        retryAfter: result?.retry_after as number | undefined,
      };
    } catch {
      return { allowed: true }; // Fail open
    }
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  // LOGGING
  // ─────────────────────────────────────────────────────────────────────────
  
  const logStatus = useCallback(() => {
    console.log('╔════════════════════════════════════════════════════════════════╗');
    console.log('║  🏛️ LEI IV - CONSTITUIÇÃO DO SNA OMEGA v5.0                    ║');
    console.log('╠════════════════════════════════════════════════════════════════╣');
    console.log('║  📋 Status: ✅ ATIVO                                           ║');
    console.log('║  📊 Artigos: 48 | Tabelas: 10 | RPCs: 15 | Workflows: 19       ║');
    console.log('║  👑 Owner: MOISESBLANK@GMAIL.COM                               ║');
    console.log('╠════════════════════════════════════════════════════════════════╣');
    console.log('║  ⚖️  5 PRINCÍPIOS IMUTÁVEIS:                                    ║');
    Object.values(principios).forEach((p, i) => {
      const desc = p.descricao.length > 40 ? p.descricao.substring(0, 40) + '...' : p.descricao;
      console.log(`║     ${i + 1}. ${p.nome.toUpperCase().padEnd(15)}: ${desc.padEnd(40)}║`);
    });
    console.log('╚════════════════════════════════════════════════════════════════╝');
  }, [principios]);

  // ─────────────────────────────────────────────────────────────────────────
  // RETORNO
  // ─────────────────────────────────────────────────────────────────────────
  
  return {
    // Base
    ...base,
    
    // Princípios e Governança
    principios,
    governanca,
    
    // Config
    snaConfig: SNA_CONFIG,
    eventHandlers: EVENT_HANDLERS,
    
    // Jobs
    createJob,
    
    // Budget
    checkBudget,
    
    // Features
    checkFeature,
    
    // Cache
    cacheGet,
    cacheSet,
    
    // Rate Limits
    checkRateLimit,
    
    // Métricas
    getMetrics,
    
    // Logging
    logStatus,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// HOOKS AUXILIARES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Hook para verificar feature flags
 */
export function useSNAFeature(flagKey: string, userId?: string) {
  const { checkFeature } = useSNAConstitutionExtended();
  
  const check = useCallback(async () => {
    return checkFeature(flagKey, userId);
  }, [checkFeature, flagKey, userId]);
  
  return { check };
}

/**
 * Hook para controle de budget
 */
export function useSNABudget(scope: string) {
  const { checkBudget } = useSNAConstitutionExtended();
  
  const check = useCallback(async (estimatedCost: number) => {
    return checkBudget(scope, estimatedCost);
  }, [checkBudget, scope]);
  
  return { check };
}

/**
 * Hook para rate limiting
 */
export function useSNARateLimit(identifier: string, endpoint: string) {
  const { checkRateLimit } = useSNAConstitutionExtended();
  
  const check = useCallback(async () => {
    return checkRateLimit(identifier, endpoint);
  }, [checkRateLimit, identifier, endpoint]);
  
  return { check };
}

// Re-export do hook original
export { useSNAConstitution } from '@/lib/constitution/LEI_IV_SNA_OMEGA';
export default useSNAConstitutionExtended;
