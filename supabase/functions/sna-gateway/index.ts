// ============================================================
// 🧠 SNA GATEWAY OMEGA v5.0 — SISTEMA NERVOSO AUTÔNOMO
// Gateway de IA de nível Enterprise para 5.000+ usuários
// Recursos: Auth, Rate Limit, Budget, Cache, Fallback, Observability
// ============================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

// ============================================================
// CORS & CONSTANTS
// ============================================================

import { getCorsHeaders, handleCorsOptions } from "../_shared/corsConfig.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-correlation-id, x-idempotency-key',
};

const LOVABLE_AI_URL = 'https://ai.gateway.lovable.dev/v1/chat/completions';
const PERPLEXITY_URL = 'https://api.perplexity.ai/chat/completions';

// ============================================================
// TIPOS
// ============================================================

interface SNARequest {
  provider?: string;
  model?: string;
  action?: 'chat' | 'complete' | 'classify' | 'generate' | 'extract' | 'embed';
  messages?: Array<{ role: string; content: string }>;
  prompt?: string;
  system_prompt?: string;
  context?: {
    user_id?: string;
    lesson_id?: string;
    course_id?: string;
    thread_id?: string;
    conversation_id?: string;
    workflow?: string;
    agent?: string;
  };
  stream?: boolean;
  max_tokens?: number;
  temperature?: number;
  top_p?: number;
  async?: boolean;
  job_type?: string;
  idempotency_key?: string;
  priority?: number;
  deadline?: string;
  cache_ttl?: number;
  skip_cache?: boolean;
  fallback_providers?: string[];
}

interface ProviderConfig {
  url: string;
  models: Record<string, {
    id: string;
    maxTokens: number;
    costIn: number;
    costOut: number;
  }>;
  headers: (apiKey: string) => Record<string, string>;
}

// ============================================================
// CONFIGURAÇÃO DE PROVIDERS
// ============================================================

const PROVIDERS: Record<string, ProviderConfig> = {
  lovable: {
    url: LOVABLE_AI_URL,
    models: {
      'gemini-flash': { id: 'google/gemini-2.5-flash', maxTokens: 4096, costIn: 0.075, costOut: 0.30 },
      'gemini-pro': { id: 'google/gemini-2.5-pro', maxTokens: 8192, costIn: 1.25, costOut: 5.00 },
      'gpt5': { id: 'openai/gpt-5', maxTokens: 16384, costIn: 5.00, costOut: 15.00 },
      'gpt5-mini': { id: 'openai/gpt-5-mini', maxTokens: 8192, costIn: 0.15, costOut: 0.60 },
      'gpt5-nano': { id: 'openai/gpt-5-nano', maxTokens: 4096, costIn: 0.10, costOut: 0.40 },
    },
    headers: (key) => ({ 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' }),
  },
  perplexity: {
    url: PERPLEXITY_URL,
    models: {
      'sonar': { id: 'sonar', maxTokens: 4096, costIn: 1.00, costOut: 1.00 },
    },
    headers: (key) => ({ 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' }),
  },
};

const PROVIDER_MODEL_MAP: Record<string, { provider: string; model: string }> = {
  'gemini_flash': { provider: 'lovable', model: 'gemini-flash' },
  'gemini_pro': { provider: 'lovable', model: 'gemini-pro' },
  'gpt5': { provider: 'lovable', model: 'gpt5' },
  'gpt5_mini': { provider: 'lovable', model: 'gpt5-mini' },
  'gpt5_nano': { provider: 'lovable', model: 'gpt5-nano' },
  'perplexity': { provider: 'perplexity', model: 'sonar' },
};

const RATE_LIMITS: Record<string, number> = {
  'tutor': 30,
  'flashcards': 10,
  'mindmap': 5,
  'cronograma': 5,
  'import': 2,
  'live_summary': 10,
  'classify': 100,
  'chat': 60,
  'default': 30,
};

// ============================================================
// FUNÇÕES AUXILIARES
// ============================================================

function errorResponse(status: number, code: string, message: string, correlationId: string) {
  return new Response(JSON.stringify({
    error: code,
    message,
    correlation_id: correlationId
  }), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
      'X-Correlation-Id': correlationId
    }
  });
}

function getApiKey(provider: string): string | undefined {
  switch (provider) {
    case 'lovable':
      return Deno.env.get('LOVABLE_API_KEY');
    case 'perplexity':
      return Deno.env.get('PERPLEXITY_API_KEY');
    default:
      return Deno.env.get('LOVABLE_API_KEY');
  }
}

function buildMessages(
  messages?: Array<{ role: string; content: string }>,
  prompt?: string,
  system_prompt?: string,
  context?: Record<string, unknown>
): Array<{ role: string; content: string }> {
  const result: Array<{ role: string; content: string }> = [];

  if (system_prompt) {
    result.push({ role: 'system', content: system_prompt });
  } else {
    result.push({
      role: 'system',
      content: `Você é o TRAMON, um assistente de IA especializado em educação e química para vestibulares de medicina.
Responda de forma clara, precisa e didática. Use formatação Markdown quando apropriado.
Mantenha respostas focadas e objetivas.`
    });
  }

  if (context && Object.keys(context).length > 0) {
    result.push({
      role: 'system',
      content: `Contexto adicional: ${JSON.stringify(context)}`
    });
  }

  if (messages && messages.length > 0) {
    result.push(...messages);
  } else if (prompt) {
    result.push({ role: 'user', content: prompt });
  }

  return result;
}

function generateCacheKey(
  provider: string,
  messages?: Array<{ role: string; content: string }>,
  prompt?: string,
  system_prompt?: string
): string {
  const content = JSON.stringify({ provider, messages, prompt, system_prompt });
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return `sna_cache_${Math.abs(hash).toString(36)}`;
}

function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

// ============================================================
// HANDLER PRINCIPAL
// ============================================================

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  const correlationId = req.headers.get('x-correlation-id') || crypto.randomUUID();
  
  let supabase: SupabaseClient;
  let userId: string | null = null;
  let userRole: string | null = null;

  try {
    supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const body: SNARequest = await req.json();
    const {
      provider = 'gpt5_mini',
      action = 'chat',
      messages,
      prompt,
      system_prompt,
      context = {},
      stream = false,
      max_tokens,
      temperature = 0.7,
      async: isAsync = false,
      cache_ttl = 3600,
      skip_cache = false,
      fallback_providers = [],
    } = body;

    console.log(`🧠 SNA Gateway [${correlationId}]: ${provider}/${action} [stream=${stream}, async=${isAsync}]`);

    // AUTENTICAÇÃO
    const authHeader = req.headers.get('Authorization');
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const { data: { user } } = await supabase.auth.getUser(token);
      userId = user?.id || null;
      
      if (userId) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', userId)
          .single();
        userRole = profile?.role || null;
      }
    }

    if (!userId) {
      const apiKey = req.headers.get('apikey');
      if (apiKey !== Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')) {
        return errorResponse(401, 'AUTH_REQUIRED', 'Autenticação necessária', correlationId);
      }
      userId = context?.user_id || 'system';
      userRole = 'system';
    }

    // FEATURE FLAG CHECK
    const workflow = context?.workflow || action;
    const featureKey = `sna.${context?.agent || 'default'}.enabled`;
    
    const { data: flagResult } = await supabase.rpc('sna_check_feature', {
      p_flag_key: featureKey,
      p_user_id: userId !== 'system' ? userId : null,
      p_context: context
    });

    if (flagResult && !flagResult.enabled && flagResult.reason !== 'flag_not_found') {
      console.warn(`⚠️ Feature disabled: ${featureKey} - ${flagResult.reason}`);
      return errorResponse(403, 'FEATURE_DISABLED', `Funcionalidade desabilitada: ${flagResult.reason}`, correlationId);
    }

    // RATE LIMIT CHECK
    const { data: rateLimitResult } = await supabase.rpc('sna_check_rate_limit', {
      p_identifier: userId,
      p_endpoint: workflow,
      p_cost: 0,
      p_tokens: 0
    });

    if (rateLimitResult && !rateLimitResult.allowed) {
      console.warn(`⚠️ Rate limit: ${userId} on ${workflow}`);
      return new Response(JSON.stringify({
        error: 'RATE_LIMITED',
        message: 'Rate limit excedido',
        details: {
          current: rateLimitResult.current_requests,
          limit: rateLimitResult.max_requests,
          reset_at: rateLimitResult.reset_at,
          reason: rateLimitResult.reason
        }
      }), {
        status: 429,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          'X-Correlation-Id': correlationId,
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': rateLimitResult.reset_at,
          'Retry-After': '60'
        }
      });
    }

    // BUDGET CHECK
    const { data: budgetResult } = await supabase.rpc('sna_check_budget', {
      p_scope: 'global',
      p_scope_id: 'global',
      p_estimated_cost: 0.01
    });

    if (budgetResult && !budgetResult.allowed) {
      console.error(`💰 Budget exceeded: ${budgetResult.usage_percentage}%`);
      
      if (budgetResult.action === 'block') {
        return errorResponse(402, 'BUDGET_EXCEEDED', 'Orçamento de IA excedido', correlationId);
      }
    }

    // CACHE CHECK
    if (!stream && !skip_cache && !isAsync) {
      const cacheKey = generateCacheKey(provider, messages, prompt, system_prompt);
      const { data: cacheResult } = await supabase.rpc('sna_cache_get', {
        p_cache_key: cacheKey
      });

      if (cacheResult?.hit) {
        console.log(`📦 Cache HIT: ${cacheKey.slice(0, 20)}...`);
        
        await supabase.rpc('sna_log_tool_run', {
          p_tool_name: provider,
          p_provider: 'cache',
          p_ok: true,
          p_latency_ms: Date.now() - startTime,
          p_cache_hit: true,
          p_correlation_id: correlationId
        });

        return new Response(JSON.stringify({
          status: 'success',
          provider,
          content: cacheResult.value.content,
          usage: cacheResult.value.usage,
          cached: true,
          cache_hits: cacheResult.hit_count,
          latency_ms: Date.now() - startTime
        }), {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
            'X-Correlation-Id': correlationId,
            'X-Cache': 'HIT'
          }
        });
      }
    }

    // MODO ASSÍNCRONO
    if (isAsync && body.job_type && body.idempotency_key) {
      const { data: jobResult } = await supabase.rpc('sna_create_job', {
        p_job_type: body.job_type,
        p_idempotency_key: body.idempotency_key,
        p_input: {
          provider,
          action,
          messages,
          prompt,
          system_prompt,
          context,
          max_tokens,
          temperature
        },
        p_priority: body.priority ?? 3,
        p_deadline: body.deadline || null,
        p_tags: [workflow, provider],
        p_metadata: { correlation_id: correlationId, user_role: userRole }
      });

      console.log(`📥 Job created: ${jobResult?.job_id} [new=${jobResult?.is_new}]`);

      return new Response(JSON.stringify({
        status: 'queued',
        job_id: jobResult?.job_id,
        is_new: jobResult?.is_new,
        message: jobResult?.is_new ? 'Job criado com sucesso' : 'Job já existe (idempotente)'
      }), {
        status: 202,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          'X-Correlation-Id': correlationId,
          'X-Job-Id': jobResult?.job_id
        }
      });
    }

    // RESOLVER PROVIDER E MODELO
    const mapping = PROVIDER_MODEL_MAP[provider];
    if (!mapping) {
      return errorResponse(400, 'INVALID_PROVIDER', `Provider inválido: ${provider}`, correlationId);
    }

    const providerConfig = PROVIDERS[mapping.provider];
    const modelConfig = providerConfig.models[mapping.model];
    
    if (!modelConfig) {
      return errorResponse(400, 'INVALID_MODEL', `Modelo inválido: ${mapping.model}`, correlationId);
    }

    // CONSTRUIR MENSAGENS
    const aiMessages = buildMessages(messages, prompt, system_prompt, context);
    
    const aiRequest = {
      model: modelConfig.id,
      messages: aiMessages,
      max_tokens: max_tokens || modelConfig.maxTokens,
      temperature,
      stream,
    };

    // OBTER API KEY
    const apiKey = getApiKey(mapping.provider);
    if (!apiKey) {
      return errorResponse(500, 'CONFIG_ERROR', `API key não configurada para ${mapping.provider}`, correlationId);
    }

    // EXECUTAR CHAMADA COM RETRY E FALLBACK
    const providersToTry = [mapping.provider, ...fallback_providers.map(p => PROVIDER_MODEL_MAP[p]?.provider).filter(Boolean)];
    
    let lastError: Error | null = null;
    let response: Response | null = null;
    let usedProvider = mapping.provider;
    let usedModel = mapping.model;

    for (const tryProvider of providersToTry) {
      try {
        const tryConfig = PROVIDERS[tryProvider];
        const tryApiKey = getApiKey(tryProvider);
        
        if (!tryApiKey) continue;

        const aiStartTime = Date.now();
        
        response = await fetch(tryConfig.url, {
          method: 'POST',
          headers: tryConfig.headers(tryApiKey),
          body: JSON.stringify({
            ...aiRequest,
            model: tryConfig.models[Object.keys(tryConfig.models)[0]].id
          }),
        });

        if (response.ok) {
          usedProvider = tryProvider;
          console.log(`✅ AI call success: ${tryProvider} in ${Date.now() - aiStartTime}ms`);
          break;
        } else {
          console.warn(`⚠️ AI call failed: ${tryProvider} - ${response.status}`);
          lastError = new Error(`Provider ${tryProvider}: ${response.status}`);
        }
      } catch (err) {
        console.error(`❌ AI call error: ${tryProvider}`, err);
        lastError = err instanceof Error ? err : new Error(String(err));
      }
    }

    if (!response?.ok) {
      await supabase.rpc('sna_log_tool_run', {
        p_tool_name: provider,
        p_provider: usedProvider,
        p_model: usedModel,
        p_ok: false,
        p_latency_ms: Date.now() - startTime,
        p_error_message: lastError?.message,
        p_correlation_id: correlationId
      });

      if (response?.status === 429) {
        return errorResponse(429, 'PROVIDER_RATE_LIMITED', 'Rate limit do provider excedido', correlationId);
      }
      if (response?.status === 402) {
        return errorResponse(402, 'PROVIDER_CREDITS', 'Créditos do provider esgotados', correlationId);
      }
      return errorResponse(502, 'PROVIDER_ERROR', `Erro em todos os providers: ${lastError?.message}`, correlationId);
    }

    // STREAMING RESPONSE
    if (stream) {
      await supabase.rpc('sna_log_tool_run', {
        p_tool_name: provider,
        p_provider: usedProvider,
        p_model: usedModel,
        p_ok: true,
        p_latency_ms: Date.now() - startTime,
        p_correlation_id: correlationId
      });

      return new Response(response.body, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/event-stream',
          'X-Correlation-Id': correlationId,
          'X-Provider': usedProvider,
          'X-Model': usedModel,
          'X-Cache': 'MISS'
        }
      });
    }

    // NON-STREAMING RESPONSE
    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content || '';
    const usage = aiResponse.usage || {};
    
    const tokensIn = usage.prompt_tokens || estimateTokens(JSON.stringify(aiMessages));
    const tokensOut = usage.completion_tokens || estimateTokens(content);
    const costUsd = (tokensIn * modelConfig.costIn + tokensOut * modelConfig.costOut) / 1000000;

    // LOG COMPLETO
    await supabase.rpc('sna_log_tool_run', {
      p_tool_name: provider,
      p_provider: usedProvider,
      p_model: usedModel,
      p_ok: true,
      p_latency_ms: Date.now() - startTime,
      p_tokens_in: tokensIn,
      p_tokens_out: tokensOut,
      p_cost_usd: costUsd,
      p_correlation_id: correlationId
    });

    // CACHE RESPONSE
    if (!skip_cache && cache_ttl > 0) {
      const cacheKey = generateCacheKey(provider, messages, prompt, system_prompt);
      await supabase.rpc('sna_cache_set', {
        p_cache_key: cacheKey,
        p_value: { content, usage: { input_tokens: tokensIn, output_tokens: tokensOut, cost_usd: costUsd } },
        p_ttl_seconds: cache_ttl,
        p_original_cost_usd: costUsd
      });
    }

    const totalTime = Date.now() - startTime;
    console.log(`✅ SNA Gateway [${correlationId}]: ${provider} completed in ${totalTime}ms (cost: $${costUsd.toFixed(6)})`);

    return new Response(JSON.stringify({
      status: 'success',
      provider: usedProvider,
      model: usedModel,
      content,
      usage: {
        input_tokens: tokensIn,
        output_tokens: tokensOut,
        total_tokens: tokensIn + tokensOut,
        cost_usd: costUsd
      },
      cached: false,
      latency_ms: totalTime
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'X-Correlation-Id': correlationId,
        'X-Provider': usedProvider,
        'X-Model': usedModel,
        'X-Cache': 'MISS',
        'X-Cost-USD': costUsd.toFixed(8),
        'X-Latency-Ms': totalTime.toString()
      }
    });

  } catch (error) {
    console.error(`❌ SNA Gateway Error [${correlationId}]:`, error);
    return errorResponse(500, 'INTERNAL_ERROR', error instanceof Error ? error.message : 'Erro interno', correlationId);
  }
});
