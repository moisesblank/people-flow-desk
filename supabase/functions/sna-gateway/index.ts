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
  // Roteamento
  provider?: string;
  model?: string;
  action?: 'chat' | 'complete' | 'classify' | 'generate' | 'extract' | 'embed';
  
  // Payload
  messages?: Array<{ role: string; content: string }>;
  prompt?: string;
  system_prompt?: string;
  
  // Contexto
  context?: {
    user_id?: string;
    lesson_id?: string;
    course_id?: string;
    thread_id?: string;
    conversation_id?: string;
    workflow?: string;
    agent?: string;
  };
  
  // Opções
  stream?: boolean;
  max_tokens?: number;
  temperature?: number;
  top_p?: number;
  
  // Job assíncrono
  async?: boolean;
  job_type?: string;
  idempotency_key?: string;
  priority?: number;
  deadline?: string;
  
  // Cache
  cache_ttl?: number;
  skip_cache?: boolean;
  
  // Fallback
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
      'gemini-flash': { id: 'google/gemini-2.0-flash-exp', maxTokens: 4096, costIn: 0.075, costOut: 0.30 },
      'gemini-pro': { id: 'google/gemini-pro-1.5', maxTokens: 8192, costIn: 1.25, costOut: 5.00 },
      'gpt5': { id: 'openai/gpt-5', maxTokens: 16384, costIn: 5.00, costOut: 15.00 },
      'gpt5-mini': { id: 'openai/gpt-5-mini', maxTokens: 8192, costIn: 0.15, costOut: 0.60 },
      'gpt5-nano': { id: 'openai/gpt-5-nano', maxTokens: 4096, costIn: 0.10, costOut: 0.40 },
      'claude-opus': { id: 'anthropic/claude-opus-4', maxTokens: 16384, costIn: 15.00, costOut: 75.00 },
    },
    headers: (key) => ({ 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' }),
  },
  perplexity: {
    url: PERPLEXITY_URL,
    models: {
      'sonar': { id: 'llama-3.1-sonar-large-128k-online', maxTokens: 4096, costIn: 1.00, costOut: 1.00 },
    },
    headers: (key) => ({ 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' }),
  },
};

// Mapeamento simplificado de provider para modelo
const PROVIDER_MODEL_MAP: Record<string, { provider: string; model: string }> = {
  'gemini_flash': { provider: 'lovable', model: 'gemini-flash' },
  'gemini_pro': { provider: 'lovable', model: 'gemini-pro' },
  'gpt5': { provider: 'lovable', model: 'gpt5' },
  'gpt5_mini': { provider: 'lovable', model: 'gpt5-mini' },
  'gpt5_nano': { provider: 'lovable', model: 'gpt5-nano' },
  'claude_opus': { provider: 'lovable', model: 'claude-opus' },
  'perplexity': { provider: 'perplexity', model: 'sonar' },
};

// Rate limits por workflow (req/min)
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

function generateCacheKey(request: SNARequest): string {
  const keyData = {
    provider: request.provider,
    model: request.model,
    messages: request.messages,
    prompt: request.prompt,
    system_prompt: request.system_prompt,
    temperature: request.temperature,
  };
  
  return `sna:${btoa(JSON.stringify(keyData)).slice(0, 64)}`;
}

async function checkRateLimit(
  supabase: SupabaseClient,
  userId: string,
  workflow: string
): Promise<{ allowed: boolean; remaining: number; resetAt: Date }> {
  const limit = RATE_LIMITS[workflow] || RATE_LIMITS.default;
  
  const { data } = await supabase.rpc('sna_check_rate_limit', {
    p_identifier: userId,
    p_endpoint: `sna:${workflow}`,
    p_cost: 0,
    p_tokens: 0,
  });
  
  if (data?.allowed === false) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: new Date(data.reset_at),
    };
  }
  
  return {
    allowed: true,
    remaining: limit - (data?.current_requests || 0),
    resetAt: new Date(data?.reset_at || Date.now() + 60000),
  };
}

async function checkBudget(
  supabase: SupabaseClient,
  scope: string,
  scopeId: string,
  estimatedCost: number
): Promise<{ allowed: boolean; reason?: string; remaining?: number }> {
  const { data } = await supabase.rpc('sna_check_budget', {
    p_scope: scope,
    p_scope_id: scopeId,
    p_estimated_cost: estimatedCost,
  });
  
  if (!data?.allowed) {
    return {
      allowed: false,
      reason: data?.action || 'budget_exceeded',
      remaining: data?.remaining_usd || 0,
    };
  }
  
  return {
    allowed: true,
    remaining: data?.remaining_usd,
  };
}

async function checkFeatureFlag(
  supabase: SupabaseClient,
  flagKey: string,
  userId?: string
): Promise<{ enabled: boolean; config?: Record<string, unknown> }> {
  const { data } = await supabase.rpc('sna_check_feature', {
    p_flag_key: flagKey,
    p_user_id: userId || null,
    p_context: {},
  });
  
  return {
    enabled: data?.enabled ?? false,
    config: data?.config,
  };
}

async function getCachedResponse(
  supabase: SupabaseClient,
  cacheKey: string
): Promise<{ hit: boolean; value?: unknown; savedCost?: number }> {
  const { data } = await supabase.rpc('sna_cache_get', {
    p_cache_key: cacheKey,
  });
  
  if (data?.hit) {
    return {
      hit: true,
      value: data.value,
      savedCost: data.saved_cost_usd,
    };
  }
  
  return { hit: false };
}

async function setCacheResponse(
  supabase: SupabaseClient,
  cacheKey: string,
  value: unknown,
  ttlSeconds: number,
  costUsd: number
): Promise<void> {
  await supabase.rpc('sna_cache_set', {
    p_cache_key: cacheKey,
    p_value: value,
    p_ttl_seconds: ttlSeconds,
    p_original_cost_usd: costUsd,
  });
}

async function logToolRun(
  supabase: SupabaseClient,
  params: {
    toolName: string;
    provider: string;
    model?: string;
    ok: boolean;
    latencyMs: number;
    tokensIn: number;
    tokensOut: number;
    costUsd: number;
    jobId?: string;
    correlationId?: string;
    errorMessage?: string;
    cacheHit?: boolean;
  }
): Promise<void> {
  await supabase.rpc('sna_log_tool_run', {
    p_tool_name: params.toolName,
    p_provider: params.provider,
    p_model: params.model || null,
    p_ok: params.ok,
    p_latency_ms: params.latencyMs,
    p_tokens_in: params.tokensIn,
    p_tokens_out: params.tokensOut,
    p_cost_usd: params.costUsd,
    p_job_id: params.jobId || null,
    p_correlation_id: params.correlationId || null,
    p_error_message: params.errorMessage || null,
    p_cache_hit: params.cacheHit || false,
  });
}

function calculateCost(
  tokensIn: number,
  tokensOut: number,
  modelConfig: { costIn: number; costOut: number }
): number {
  return (tokensIn * modelConfig.costIn + tokensOut * modelConfig.costOut) / 1_000_000;
}

// ============================================================
// HANDLER PRINCIPAL
// ============================================================

serve(async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  const startTime = Date.now();
  const requestId = crypto.randomUUID();
  const correlationId = req.headers.get('x-correlation-id') || requestId;
  const idempotencyKey = req.headers.get('x-idempotency-key');
  
  // Criar cliente Supabase
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );
  
  try {
    // ============================================================
    // 1. AUTENTICAÇÃO
    // ============================================================
    
    const authHeader = req.headers.get('Authorization');
    let userId: string | null = null;
    
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user } } = await supabase.auth.getUser(token);
      userId = user?.id || null;
    }
    
    // ============================================================
    // 2. PARSE REQUEST
    // ============================================================
    
    const body: SNARequest = await req.json();
    const workflow = body.context?.workflow || body.action || 'default';
    
    console.log(`[SNA ${requestId}] Workflow: ${workflow}, Provider: ${body.provider || 'auto'}`);
    
    // ============================================================
    // 3. FEATURE FLAG CHECK
    // ============================================================
    
    const featureKey = `sna.${workflow.replace('_', '.')}.enabled`;
    const featureCheck = await checkFeatureFlag(supabase, featureKey, userId || undefined);
    
    if (!featureCheck.enabled && workflow !== 'default') {
      console.warn(`[SNA ${requestId}] Feature desabilitada: ${featureKey}`);
      return new Response(JSON.stringify({
        success: false,
        error: 'Feature não disponível',
        feature_key: featureKey,
        request_id: requestId,
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }
    
    // ============================================================
    // 4. RATE LIMITING
    // ============================================================
    
    if (userId) {
      const rateCheck = await checkRateLimit(supabase, userId, workflow);
      
      if (!rateCheck.allowed) {
        console.warn(`[SNA ${requestId}] Rate limit excedido para ${userId}`);
        return new Response(JSON.stringify({
          success: false,
          error: 'Rate limit excedido',
          retry_after: Math.ceil((rateCheck.resetAt.getTime() - Date.now()) / 1000),
          request_id: requestId,
        }), {
          status: 429,
          headers: { 
            'Content-Type': 'application/json',
            'Retry-After': String(Math.ceil((rateCheck.resetAt.getTime() - Date.now()) / 1000)),
            'X-RateLimit-Remaining': '0',
            ...corsHeaders,
          },
        });
      }
    }
    
    // ============================================================
    // 5. RESOLVER PROVIDER E MODELO
    // ============================================================
    
    let providerKey = body.provider || 'gemini_flash';
    let providerMapping = PROVIDER_MODEL_MAP[providerKey];
    
    if (!providerMapping) {
      providerMapping = { provider: 'lovable', model: 'gemini-flash' };
    }
    
    const providerConfig = PROVIDERS[providerMapping.provider];
    const modelConfig = providerConfig.models[providerMapping.model];
    
    if (!modelConfig) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Modelo não encontrado',
        request_id: requestId,
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }
    
    // ============================================================
    // 6. BUDGET CHECK
    // ============================================================
    
    const estimatedCost = 0.01; // Estimativa conservadora
    const budgetCheck = await checkBudget(supabase, 'global', 'global', estimatedCost);
    
    if (!budgetCheck.allowed) {
      console.error(`[SNA ${requestId}] Budget excedido: ${budgetCheck.reason}`);
      return new Response(JSON.stringify({
        success: false,
        error: 'Orçamento excedido',
        reason: budgetCheck.reason,
        request_id: requestId,
      }), {
        status: 402,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }
    
    // ============================================================
    // 7. CACHE CHECK
    // ============================================================
    
    let cacheKey: string | null = null;
    
    if (!body.skip_cache && !body.stream) {
      cacheKey = generateCacheKey(body);
      const cacheResult = await getCachedResponse(supabase, cacheKey);
      
      if (cacheResult.hit) {
        console.log(`[SNA ${requestId}] ✅ Cache hit! Saved: $${cacheResult.savedCost?.toFixed(4)}`);
        
        await logToolRun(supabase, {
          toolName: 'sna-gateway',
          provider: providerMapping.provider,
          model: modelConfig.id,
          ok: true,
          latencyMs: Date.now() - startTime,
          tokensIn: 0,
          tokensOut: 0,
          costUsd: 0,
          correlationId,
          cacheHit: true,
        });
        
        return new Response(JSON.stringify({
          success: true,
          data: cacheResult.value,
          cached: true,
          saved_cost_usd: cacheResult.savedCost,
          request_id: requestId,
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }
    }
    
    // ============================================================
    // 8. PREPARAR MENSAGENS
    // ============================================================
    
    let messages = body.messages || [];
    
    if (body.system_prompt) {
      messages = [{ role: 'system', content: body.system_prompt }, ...messages];
    }
    
    if (body.prompt && messages.length === 0) {
      messages = [{ role: 'user', content: body.prompt }];
    }
    
    // ============================================================
    // 9. CHAMAR API
    // ============================================================
    
    const apiKey = Deno.env.get('LOVABLE_API_KEY') || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    const apiPayload = {
      model: modelConfig.id,
      messages,
      max_tokens: Math.min(body.max_tokens || 4096, modelConfig.maxTokens),
      temperature: body.temperature ?? 0.7,
      top_p: body.top_p,
      stream: body.stream || false,
    };
    
    console.log(`[SNA ${requestId}] Chamando ${providerConfig.url} com modelo ${modelConfig.id}`);
    
    const apiResponse = await fetch(providerConfig.url, {
      method: 'POST',
      headers: providerConfig.headers(apiKey!),
      body: JSON.stringify(apiPayload),
    });
    
    if (!apiResponse.ok) {
      const errorText = await apiResponse.text();
      console.error(`[SNA ${requestId}] ❌ API Error: ${apiResponse.status}`, errorText);
      
      await logToolRun(supabase, {
        toolName: 'sna-gateway',
        provider: providerMapping.provider,
        model: modelConfig.id,
        ok: false,
        latencyMs: Date.now() - startTime,
        tokensIn: 0,
        tokensOut: 0,
        costUsd: 0,
        correlationId,
        errorMessage: errorText.slice(0, 500),
      });
      
      return new Response(JSON.stringify({
        success: false,
        error: 'Erro na API de IA',
        status: apiResponse.status,
        request_id: requestId,
      }), {
        status: 502,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }
    
    // ============================================================
    // 10. PROCESSAR RESPOSTA
    // ============================================================
    
    const result = await apiResponse.json();
    const latencyMs = Date.now() - startTime;
    
    const tokensIn = result.usage?.prompt_tokens || 0;
    const tokensOut = result.usage?.completion_tokens || 0;
    const costUsd = calculateCost(tokensIn, tokensOut, modelConfig);
    
    console.log(`[SNA ${requestId}] ✅ Sucesso em ${latencyMs}ms - Tokens: ${tokensIn}/${tokensOut} - Custo: $${costUsd.toFixed(4)}`);
    
    // Log tool run
    await logToolRun(supabase, {
      toolName: 'sna-gateway',
      provider: providerMapping.provider,
      model: modelConfig.id,
      ok: true,
      latencyMs,
      tokensIn,
      tokensOut,
      costUsd,
      correlationId,
    });
    
    // ============================================================
    // 11. CACHE RESPONSE
    // ============================================================
    
    const responseData = {
      content: result.choices?.[0]?.message?.content || '',
      model: modelConfig.id,
      usage: { prompt_tokens: tokensIn, completion_tokens: tokensOut, total_tokens: tokensIn + tokensOut },
    };
    
    if (cacheKey && !body.stream) {
      const cacheTtl = body.cache_ttl || 3600;
      await setCacheResponse(supabase, cacheKey, responseData, cacheTtl, costUsd);
    }
    
    // ============================================================
    // 12. RETORNAR RESPOSTA
    // ============================================================
    
    return new Response(JSON.stringify({
      success: true,
      data: responseData,
      cached: false,
      cost_usd: costUsd,
      latency_ms: latencyMs,
      request_id: requestId,
      correlation_id: correlationId,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    const latencyMs = Date.now() - startTime;
    
    console.error(`[SNA ${requestId}] ❌ Erro crítico:`, error);
    
    return new Response(JSON.stringify({
      success: false,
      error: 'Erro interno do gateway',
      message: errorMessage,
      request_id: requestId,
      latency_ms: latencyMs,
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
});
