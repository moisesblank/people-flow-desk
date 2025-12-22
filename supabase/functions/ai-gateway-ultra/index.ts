// ============================================================
// 🧠 AI GATEWAY ULTRA v3.0 — SISTEMA NERVOSO AUTÔNOMO
// Entrada única para TODAS as chamadas de IA
// Responsabilidades: Auth, Rate Limit, Budget, Routing, Logging
// ============================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ============================================================
// TIPOS
// ============================================================

interface GatewayRequest {
  // Roteamento
  provider: 'gemini_flash' | 'gemini_pro' | 'gpt5' | 'gpt5_mini' | 'gpt5_nano' | 'perplexity';
  action: 'chat' | 'classify' | 'generate' | 'extract';
  
  // Payload
  messages?: Array<{ role: string; content: string }>;
  prompt?: string;
  input?: Record<string, unknown>;
  
  // Contexto
  context?: {
    user_id?: string;
    lesson_id?: string;
    thread_id?: string;
    workflow?: string;
  };
  
  // Opções
  stream?: boolean;
  max_tokens?: number;
  temperature?: number;
  
  // Job (para assíncrono)
  async?: boolean;
  job_type?: string;
  idempotency_key?: string;
  priority?: number;
}

interface ProviderConfig {
  url: string;
  model: string;
  maxTokens: number;
  costPerInputToken: number;
  costPerOutputToken: number;
}

// ============================================================
// CONFIGURAÇÃO DE PROVIDERS
// ============================================================

const LOVABLE_AI_URL = 'https://ai.gateway.lovable.dev/v1/chat/completions';

const PROVIDERS: Record<string, ProviderConfig> = {
  gemini_flash: {
    url: LOVABLE_AI_URL,
    model: 'google/gemini-2.0-flash-exp',
    maxTokens: 4096,
    costPerInputToken: 0.000000075,   // $0.075/1M
    costPerOutputToken: 0.0000003,     // $0.30/1M
  },
  gemini_pro: {
    url: LOVABLE_AI_URL,
    model: 'google/gemini-pro-1.5',
    maxTokens: 8192,
    costPerInputToken: 0.00000125,    // $1.25/1M
    costPerOutputToken: 0.000005,      // $5.00/1M
  },
  gpt5: {
    url: LOVABLE_AI_URL,
    model: 'openai/gpt-5',
    maxTokens: 16384,
    costPerInputToken: 0.000005,       // $5.00/1M (estimado)
    costPerOutputToken: 0.000015,      // $15.00/1M (estimado)
  },
  gpt5_mini: {
    url: LOVABLE_AI_URL,
    model: 'openai/gpt-5-mini',
    maxTokens: 8192,
    costPerInputToken: 0.00000015,     // $0.15/1M
    costPerOutputToken: 0.0000006,     // $0.60/1M
  },
  gpt5_nano: {
    url: LOVABLE_AI_URL,
    model: 'openai/gpt-5-nano',
    maxTokens: 4096,
    costPerInputToken: 0.0000001,      // $0.10/1M
    costPerOutputToken: 0.0000004,     // $0.40/1M
  },
  perplexity: {
    url: 'https://api.perplexity.ai/chat/completions',
    model: 'llama-3.1-sonar-large-128k-online',
    maxTokens: 4096,
    costPerInputToken: 0.000001,       // $1.00/1M
    costPerOutputToken: 0.000001,      // $1.00/1M
  },
};

// Rate limits por endpoint (requests/minuto)
const RATE_LIMITS: Record<string, number> = {
  'tutor': 30,
  'flashcards': 10,
  'mindmap': 5,
  'cronograma': 5,
  'import': 2,
  'classify': 60,
  'default': 20,
};

// ============================================================
// HANDLER PRINCIPAL
// ============================================================

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  let userId: string | null = null;
  let supabase: ReturnType<typeof createClient>;

  try {
    // 1. INICIALIZAÇÃO
    supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const body: GatewayRequest = await req.json();
    const { provider, action, messages, prompt, context, stream = false, async: isAsync = false } = body;

    console.log(`🧠 AI Gateway: ${provider}/${action} [async=${isAsync}]`);

    // 2. AUTENTICAÇÃO
    const authHeader = req.headers.get('Authorization');
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const { data: { user } } = await supabase.auth.getUser(token);
      userId = user?.id || null;
    }

    if (!userId) {
      // Verificar se é chamada interna (service role)
      const apiKey = req.headers.get('apikey');
      if (apiKey !== Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')) {
        return errorResponse(401, 'Autenticação necessária');
      }
      // Chamada interna permitida
      userId = context?.user_id || 'system';
    }

    // 3. VERIFICAR FEATURE FLAG
    const featureKey = getFeatureKeyForAction(action, context?.workflow);
    const { data: flagCheck } = await supabase.rpc('check_ai_feature_flag', {
      p_flag_key: featureKey,
      p_user_id: userId !== 'system' ? userId : null
    });

    if (flagCheck === false) {
      return errorResponse(403, `Funcionalidade "${featureKey}" desabilitada`);
    }

    // 4. RATE LIMIT
    const endpoint = context?.workflow || action;
    const rateLimit = RATE_LIMITS[endpoint] || RATE_LIMITS['default'];
    
    const { data: rateLimitCheck } = await supabase.rpc('check_ai_rate_limit', {
      p_identifier: userId,
      p_endpoint: endpoint,
      p_limit_per_minute: rateLimit
    });

    if (rateLimitCheck && !rateLimitCheck.allowed) {
      console.warn(`⚠️ Rate limit exceeded: ${userId} on ${endpoint}`);
      return new Response(JSON.stringify({
        error: 'Rate limit excedido',
        retry_after: rateLimitCheck.reset_at,
        current: rateLimitCheck.current,
        limit: rateLimitCheck.limit
      }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Retry-After': '60' }
      });
    }

    // 5. VERIFICAR BUDGET
    const { data: budgetCheck } = await supabase.rpc('check_ai_budget', {
      p_scope: 'global',
      p_scope_id: 'global'
    });

    if (budgetCheck && !budgetCheck.allowed && !budgetCheck.no_budget) {
      console.error(`💰 Budget exceeded: ${budgetCheck.percentage}%`);
      return errorResponse(402, 'Orçamento de IA excedido para o período');
    }

    // 6. MODO ASSÍNCRONO (criar job)
    if (isAsync && body.job_type && body.idempotency_key) {
      const { data: jobId } = await supabase.rpc('create_ai_job', {
        p_job_type: body.job_type,
        p_idempotency_key: body.idempotency_key,
        p_input: { provider, action, messages, prompt, context },
        p_priority: body.priority || 2,
        p_created_by: userId !== 'system' ? userId : null
      });

      return new Response(JSON.stringify({
        status: 'queued',
        job_id: jobId,
        message: 'Job criado com sucesso'
      }), {
        status: 202,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // 7. EXECUTAR CHAMADA SÍNCRONA
    const config = PROVIDERS[provider];
    if (!config) {
      return errorResponse(400, `Provider inválido: ${provider}`);
    }

    const aiMessages = buildMessages(action, messages, prompt, context);
    
    const aiRequest = {
      model: config.model,
      messages: aiMessages,
      max_tokens: body.max_tokens || config.maxTokens,
      temperature: body.temperature || 0.7,
      stream: stream,
    };

    const apiKey = getApiKeyForProvider(provider);
    if (!apiKey) {
      return errorResponse(500, `API key não configurada para ${provider}`);
    }

    const aiStartTime = Date.now();
    const response = await fetch(config.url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(aiRequest),
    });

    const latencyMs = Date.now() - aiStartTime;

    // 8. PROCESSAR RESPOSTA
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ AI Error: ${response.status} - ${errorText}`);
      
      // Log da falha
      await supabase.rpc('log_ai_tool_run', {
        p_tool_name: provider,
        p_request: aiRequest,
        p_response: null,
        p_ok: false,
        p_latency_ms: latencyMs,
        p_error: { status: response.status, message: errorText }
      });

      if (response.status === 429) {
        return errorResponse(429, 'Rate limit do provider excedido');
      }
      if (response.status === 402) {
        return errorResponse(402, 'Créditos do provider esgotados');
      }
      return errorResponse(502, 'Erro no provider de IA');
    }

    // 9. STREAMING
    if (stream) {
      // Log parcial (sem response completa)
      await supabase.rpc('log_ai_tool_run', {
        p_tool_name: provider,
        p_request: aiRequest,
        p_response: { streaming: true },
        p_ok: true,
        p_latency_ms: latencyMs
      });

      return new Response(response.body, {
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'text/event-stream',
          'X-AI-Latency-Ms': latencyMs.toString(),
          'X-AI-Provider': provider
        }
      });
    }

    // 10. RESPOSTA NÃO-STREAMING
    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content;
    const usage = aiResponse.usage || {};
    
    // Calcular custo
    const inputTokens = usage.prompt_tokens || estimateTokens(JSON.stringify(aiMessages));
    const outputTokens = usage.completion_tokens || estimateTokens(content || '');
    const costUsd = (inputTokens * config.costPerInputToken) + (outputTokens * config.costPerOutputToken);

    // Log completo
    await supabase.rpc('log_ai_tool_run', {
      p_tool_name: provider,
      p_request: aiRequest,
      p_response: aiResponse,
      p_ok: true,
      p_latency_ms: latencyMs,
      p_cost_usd: costUsd,
      p_tokens_in: inputTokens,
      p_tokens_out: outputTokens
    });

    const totalTime = Date.now() - startTime;
    console.log(`✅ AI Gateway complete: ${provider}/${action} in ${totalTime}ms (AI: ${latencyMs}ms, cost: $${costUsd.toFixed(6)})`);

    return new Response(JSON.stringify({
      status: 'success',
      provider,
      content,
      usage: {
        input_tokens: inputTokens,
        output_tokens: outputTokens,
        cost_usd: costUsd
      },
      latency_ms: latencyMs,
      total_time_ms: totalTime
    }), {
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json',
        'X-AI-Latency-Ms': latencyMs.toString(),
        'X-AI-Cost-USD': costUsd.toFixed(6)
      }
    });

  } catch (error) {
    console.error('❌ AI Gateway Error:', error);
    return errorResponse(500, error instanceof Error ? error.message : 'Erro interno');
  }
});

// ============================================================
// FUNÇÕES AUXILIARES
// ============================================================

function errorResponse(status: number, message: string) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

function getFeatureKeyForAction(action: string, workflow?: string): string {
  if (workflow) {
    const workflowMap: Record<string, string> = {
      'WF-TUTOR-01': 'enable_tutor',
      'WF-FC-01': 'enable_flashcards_generation',
      'WF-MM-01': 'enable_mindmap_generation',
      'WF-CRONO-01': 'enable_cronograma_generation',
      'WF-IMPORT-URL-01': 'enable_question_importer',
      'WF-IMPORT-PDF-01': 'enable_question_importer',
      'WF-LIVE-Q-01': 'enable_live_summary',
    };
    return workflowMap[workflow] || 'enable_tutor';
  }
  return 'enable_tutor';
}

function getApiKeyForProvider(provider: string): string | undefined {
  if (provider === 'perplexity') {
    return Deno.env.get('PERPLEXITY_API_KEY');
  }
  // Todos os outros usam Lovable Gateway
  return Deno.env.get('LOVABLE_API_KEY');
}

function buildMessages(
  action: string,
  messages?: Array<{ role: string; content: string }>,
  prompt?: string,
  context?: Record<string, unknown>
): Array<{ role: string; content: string }> {
  const systemPrompts: Record<string, string> = {
    chat: `Você é um assistente de IA especializado em educação e química para vestibulares de medicina.
Responda de forma clara, precisa e didática. Use formatação Markdown quando apropriado.`,
    
    classify: `Você é um classificador de texto. Analise o input e retorne uma classificação estruturada em JSON.
Campos possíveis: intent, category, sentiment, priority, entities.`,
    
    generate: `Você é um gerador de conteúdo educacional. Gere conteúdo de alta qualidade baseado nas instruções.
Retorne sempre em formato estruturado (JSON quando solicitado).`,
    
    extract: `Você é um extrator de informações. Analise o texto e extraia as entidades solicitadas.
Retorne sempre em formato JSON estruturado.`,
  };

  const result: Array<{ role: string; content: string }> = [
    { role: 'system', content: systemPrompts[action] || systemPrompts.chat }
  ];

  if (context) {
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

function estimateTokens(text: string): number {
  // Estimativa simples: ~4 caracteres por token
  return Math.ceil(text.length / 4);
}
