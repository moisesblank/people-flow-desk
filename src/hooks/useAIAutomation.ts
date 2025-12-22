// ============================================================
// 🧠 useAIAutomation — Hook para Automação com IA ULTRA v3.0
// Integração completa com o Sistema Nervoso Autônomo (SNA)
// ============================================================

import { useState, useCallback, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

// ============================================================
// TIPOS
// ============================================================

export type AIProvider = 'gemini_flash' | 'gemini_pro' | 'gpt5' | 'gpt5_mini' | 'gpt5_nano' | 'perplexity';
export type AIAction = 'chat' | 'classify' | 'generate' | 'extract';

export interface AIMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface AIRequestOptions {
  provider?: AIProvider;
  action?: AIAction;
  messages?: AIMessage[];
  prompt?: string;
  context?: {
    lesson_id?: string;
    thread_id?: string;
    workflow?: string;
  };
  stream?: boolean;
  max_tokens?: number;
  temperature?: number;
  
  // Modo assíncrono
  async?: boolean;
  job_type?: string;
  idempotency_key?: string;
  priority?: 0 | 1 | 2 | 3;
}

export interface AIResponse {
  content: string;
  provider: string;
  usage?: {
    input_tokens: number;
    output_tokens: number;
    cost_usd: number;
  };
  latency_ms: number;
}

export interface AIJob {
  id: string;
  status: 'pending' | 'running' | 'succeeded' | 'failed' | 'dead';
  job_type: string;
  output?: Record<string, unknown>;
  error?: Record<string, unknown>;
  created_at: string;
}

export interface AIMetrics {
  jobs: Record<string, { count: number; avg_time_ms: number; cost_usd: number }>;
  tools: Record<string, { calls: number; success_rate: number; avg_latency_ms: number; cost_usd: number }>;
  queue_depth: Record<string, number>;
  health: Record<string, { ok: boolean; latency_ms: number; checked_at: string }>;
  budgets: Array<{ scope: string; scope_id: string; limit_usd: number; spent_usd: number; percentage: number }>;
}

// ============================================================
// HOOK PRINCIPAL
// ============================================================

export function useAIAutomation() {
  const { session } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Cancelar requisições pendentes ao desmontar
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  // ============================================================
  // CHAMADA SÍNCRONA À IA
  // ============================================================
  const callAI = useCallback(async (options: AIRequestOptions): Promise<AIResponse | null> => {
    if (!session?.access_token) {
      setError('Autenticação necessária');
      return null;
    }

    setIsLoading(true);
    setError(null);
    abortControllerRef.current = new AbortController();

    try {
      const response = await supabase.functions.invoke('ai-gateway-ultra', {
        body: {
          provider: options.provider || 'gpt5_mini',
          action: options.action || 'chat',
          messages: options.messages,
          prompt: options.prompt,
          context: options.context,
          stream: false,
          max_tokens: options.max_tokens,
          temperature: options.temperature,
        },
      });

      if (response.error) {
        throw new Error(response.error.message || 'Erro na chamada de IA');
      }

      return response.data as AIResponse;

    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(message);
      
      // Rate limit
      if (message.includes('Rate limit')) {
        toast.error('Muitas requisições. Aguarde um momento.');
      }
      // Budget
      else if (message.includes('Orçamento')) {
        toast.error('Limite de uso de IA atingido.');
      }
      
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [session?.access_token]);

  // ============================================================
  // CHAMADA COM STREAMING
  // ============================================================
  const streamAI = useCallback(async function* (options: AIRequestOptions): AsyncGenerator<string> {
    if (!session?.access_token) {
      throw new Error('Autenticação necessária');
    }

    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-gateway-ultra`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          provider: options.provider || 'gpt5_mini',
          action: options.action || 'chat',
          messages: options.messages,
          prompt: options.prompt,
          context: options.context,
          stream: true,
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Erro ${response.status}`);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error('Stream não disponível');

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') return;
          
          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) yield content;
          } catch {
            // Ignore parse errors
          }
        }
      }
    }
  }, [session?.access_token]);

  // ============================================================
  // CRIAR JOB ASSÍNCRONO
  // ============================================================
  const createJob = useCallback(async (
    jobType: string,
    input: Record<string, unknown>,
    options?: { priority?: 0 | 1 | 2 | 3; idempotencyKey?: string }
  ): Promise<string | null> => {
    if (!session?.access_token) {
      setError('Autenticação necessária');
      return null;
    }

    try {
      const idempotencyKey = options?.idempotencyKey || 
        `${jobType}-${Date.now()}-${Math.random().toString(36).slice(2)}`;

      const { data, error: rpcError } = await supabase.rpc('create_ai_job', {
        p_job_type: jobType,
        p_idempotency_key: idempotencyKey,
        p_input: input,
        p_priority: options?.priority ?? 2,
      });

      if (rpcError) throw rpcError;

      toast.success('Job criado com sucesso');
      return data as string;

    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao criar job';
      setError(message);
      toast.error(message);
      return null;
    }
  }, [session?.access_token]);

  // ============================================================
  // BUSCAR STATUS DO JOB
  // ============================================================
  const getJobStatus = useCallback(async (jobId: string): Promise<AIJob | null> => {
    try {
      const { data, error: queryError } = await supabase
        .from('ai_jobs')
        .select('id, status, job_type, output, error, created_at')
        .eq('id', jobId)
        .single();

      if (queryError) throw queryError;
      return data as AIJob;

    } catch (err) {
      console.error('Error fetching job status:', err);
      return null;
    }
  }, []);

  // ============================================================
  // AGUARDAR JOB COMPLETAR
  // ============================================================
  const waitForJob = useCallback(async (
    jobId: string,
    options?: { timeoutMs?: number; pollIntervalMs?: number }
  ): Promise<AIJob | null> => {
    const timeout = options?.timeoutMs || 120000;
    const interval = options?.pollIntervalMs || 2000;
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      const job = await getJobStatus(jobId);
      
      if (!job) return null;
      
      if (job.status === 'succeeded' || job.status === 'failed' || job.status === 'dead') {
        return job;
      }

      await new Promise(resolve => setTimeout(resolve, interval));
    }

    return null; // Timeout
  }, [getJobStatus]);

  // ============================================================
  // BUSCAR MÉTRICAS
  // ============================================================
  const getMetrics = useCallback(async (hours: number = 24): Promise<AIMetrics | null> => {
    try {
      const { data, error: rpcError } = await supabase.rpc('get_ai_metrics', {
        p_hours: hours
      });

      if (rpcError) throw rpcError;
      return data as AIMetrics;

    } catch (err) {
      console.error('Error fetching metrics:', err);
      return null;
    }
  }, []);

  // ============================================================
  // VERIFICAR FEATURE FLAG
  // ============================================================
  const checkFeatureFlag = useCallback(async (flagKey: string): Promise<boolean> => {
    try {
      const { data, error: rpcError } = await supabase.rpc('check_ai_feature_flag', {
        p_flag_key: flagKey,
        p_user_id: session?.user?.id || null
      });

      if (rpcError) throw rpcError;
      return data as boolean;

    } catch (err) {
      console.error('Error checking feature flag:', err);
      return false;
    }
  }, [session?.user?.id]);

  // ============================================================
  // EXECUTAR HEALTHCHECK
  // ============================================================
  const runHealthcheck = useCallback(async (
    services: AIProvider[] = ['gemini_flash', 'gpt5_mini']
  ): Promise<Record<string, { ok: boolean; latency_ms: number }> | null> => {
    try {
      const jobId = await createJob('WF-HEALTHCHECK-01', { services });
      if (!jobId) return null;

      const result = await waitForJob(jobId, { timeoutMs: 60000 });
      if (result?.status === 'succeeded' && result.output) {
        return result.output.healthchecks as Record<string, { ok: boolean; latency_ms: number }>;
      }

      return null;

    } catch (err) {
      console.error('Error running healthcheck:', err);
      return null;
    }
  }, [createJob, waitForJob]);

  return {
    // Estado
    isLoading,
    error,
    
    // Chamadas síncronas
    callAI,
    streamAI,
    
    // Jobs assíncronos
    createJob,
    getJobStatus,
    waitForJob,
    
    // Métricas e config
    getMetrics,
    checkFeatureFlag,
    runHealthcheck,
  };
}

// ============================================================
// HOOKS ESPECIALIZADOS
// ============================================================

/**
 * Hook para o Tutor IA
 */
export function useAITutor(lessonId?: string, threadId?: string) {
  const { callAI, streamAI, isLoading, error } = useAIAutomation();
  const [messages, setMessages] = useState<AIMessage[]>([]);

  const sendMessage = useCallback(async (content: string, useStream = true) => {
    const userMessage: AIMessage = { role: 'user', content };
    setMessages(prev => [...prev, userMessage]);

    if (useStream) {
      let assistantContent = '';
      setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

      for await (const chunk of streamAI({
        provider: 'gpt5_mini',
        action: 'chat',
        messages: [...messages, userMessage],
        context: { lesson_id: lessonId, thread_id: threadId, workflow: 'WF-TUTOR-01' },
      })) {
        assistantContent += chunk;
        setMessages(prev => [
          ...prev.slice(0, -1),
          { role: 'assistant', content: assistantContent }
        ]);
      }

      return assistantContent;
    } else {
      const response = await callAI({
        provider: 'gpt5_mini',
        action: 'chat',
        messages: [...messages, userMessage],
        context: { lesson_id: lessonId, thread_id: threadId, workflow: 'WF-TUTOR-01' },
      });

      if (response) {
        setMessages(prev => [...prev, { role: 'assistant', content: response.content }]);
        return response.content;
      }
    }

    return null;
  }, [callAI, streamAI, messages, lessonId, threadId]);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  return {
    messages,
    sendMessage,
    clearMessages,
    isLoading,
    error,
  };
}

/**
 * Hook para geração de flashcards
 */
export function useFlashcardGenerator() {
  const { createJob, waitForJob, isLoading, error } = useAIAutomation();

  const generateFlashcards = useCallback(async (
    topic: string,
    lessonId?: string,
    count: number = 10
  ): Promise<number | null> => {
    const jobId = await createJob('WF-FC-01', {
      topic,
      lesson_id: lessonId,
      count,
    });

    if (!jobId) return null;

    toast.info('Gerando flashcards...', { duration: 5000 });

    const result = await waitForJob(jobId, { timeoutMs: 60000 });
    
    if (result?.status === 'succeeded') {
      const count = (result.output as { flashcards_created: number })?.flashcards_created || 0;
      toast.success(`${count} flashcards criados!`);
      return count;
    }

    if (result?.status === 'failed' || result?.status === 'dead') {
      toast.error('Falha ao gerar flashcards');
    }

    return null;
  }, [createJob, waitForJob]);

  return { generateFlashcards, isLoading, error };
}

/**
 * Hook para geração de mapa mental
 */
export function useMindmapGenerator() {
  const { createJob, waitForJob, isLoading, error } = useAIAutomation();

  const generateMindmap = useCallback(async (
    topic: string,
    lessonId?: string
  ): Promise<Record<string, unknown> | null> => {
    const jobId = await createJob('WF-MM-01', {
      topic,
      lesson_id: lessonId,
    });

    if (!jobId) return null;

    toast.info('Gerando mapa mental...', { duration: 5000 });

    const result = await waitForJob(jobId, { timeoutMs: 90000 });
    
    if (result?.status === 'succeeded') {
      toast.success('Mapa mental gerado!');
      return (result.output as { mindmap: Record<string, unknown> })?.mindmap || null;
    }

    if (result?.status === 'failed' || result?.status === 'dead') {
      toast.error('Falha ao gerar mapa mental');
    }

    return null;
  }, [createJob, waitForJob]);

  return { generateMindmap, isLoading, error };
}

/**
 * Hook para métricas de IA (Admin)
 */
export function useAIMetrics() {
  const { getMetrics } = useAIAutomation();
  const [metrics, setMetrics] = useState<AIMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const refresh = useCallback(async (hours: number = 24) => {
    setIsLoading(true);
    try {
      const data = await getMetrics(hours);
      setMetrics(data);
    } finally {
      setIsLoading(false);
    }
  }, [getMetrics]);

  useEffect(() => {
    refresh();
    // Refresh a cada 30 segundos
    const interval = setInterval(() => refresh(), 30000);
    return () => clearInterval(interval);
  }, [refresh]);

  return { metrics, isLoading, refresh };
}
