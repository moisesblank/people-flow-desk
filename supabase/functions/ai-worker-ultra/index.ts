// ============================================================
// 🔧 AI WORKER ULTRA v3.0 — PROCESSADOR DE JOBS ASSÍNCRONOS
// Processa jobs da fila ai_jobs com lock, retry e DLQ
// Executar via cron (ex: a cada 1 min) ou manualmente
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

interface AIJob {
  id: string;
  job_type: string;
  input: Record<string, unknown>;
  attempts: number;
  max_attempts: number;
  created_by: string | null;
}

interface WorkflowResult {
  success: boolean;
  output?: Record<string, unknown>;
  error?: string;
  cost_usd?: number;
}

// ============================================================
// CONFIGURAÇÃO
// ============================================================

const WORKER_ID = `worker-${crypto.randomUUID().slice(0, 8)}`;
const BATCH_SIZE = 5;
const JOB_TIMEOUT_MS = 120000; // 2 minutos

const LOVABLE_AI_URL = 'https://ai.gateway.lovable.dev/v1/chat/completions';

// ============================================================
// HANDLER PRINCIPAL
// ============================================================

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  const results: Array<{ job_id: string; status: string; time_ms: number }> = [];

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Parâmetros opcionais
    const body = await req.json().catch(() => ({}));
    const jobTypes: string[] | null = body.job_types || null;
    const batchSize = body.batch_size || BATCH_SIZE;

    console.log(`🔧 AI Worker ${WORKER_ID} starting (batch=${batchSize})`);

    // 1. LIBERAR JOBS TRAVADOS
    const { data: released } = await supabase.rpc('release_stuck_ai_jobs', {
      p_timeout_minutes: 30
    });
    if (released && released > 0) {
      console.log(`♻️ Released ${released} stuck jobs`);
    }

    // 2. PEGAR JOBS
    const { data: jobs, error: claimError } = await supabase.rpc('claim_ai_job', {
      p_worker_id: WORKER_ID,
      p_job_types: jobTypes,
      p_limit: batchSize
    });

    if (claimError) {
      console.error('❌ Error claiming jobs:', claimError);
      return errorResponse(500, 'Erro ao pegar jobs');
    }

    if (!jobs || jobs.length === 0) {
      console.log('📭 No jobs to process');
      return new Response(JSON.stringify({
        status: 'idle',
        message: 'Nenhum job na fila',
        worker_id: WORKER_ID
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`📥 Claimed ${jobs.length} jobs`);

    // 3. PROCESSAR JOBS
    for (const job of jobs as AIJob[]) {
      const jobStartTime = Date.now();
      
      try {
        console.log(`▶️ Processing job ${job.id} (${job.job_type})`);
        
        const result = await processJob(supabase, job);
        
        if (result.success) {
          await supabase.rpc('complete_ai_job', {
            p_job_id: job.id,
            p_output: result.output || {},
            p_cost_usd: result.cost_usd || 0
          });
          
          results.push({
            job_id: job.id,
            status: 'succeeded',
            time_ms: Date.now() - jobStartTime
          });
          console.log(`✅ Job ${job.id} completed`);
        } else {
          throw new Error(result.error || 'Unknown error');
        }
        
      } catch (jobError) {
        console.error(`❌ Job ${job.id} failed:`, jobError);
        
        await supabase.rpc('fail_ai_job', {
          p_job_id: job.id,
          p_error: { message: jobError instanceof Error ? jobError.message : 'Unknown error' },
          p_retry_delay_seconds: 60
        });
        
        results.push({
          job_id: job.id,
          status: job.attempts >= job.max_attempts - 1 ? 'dead' : 'retry',
          time_ms: Date.now() - jobStartTime
        });
      }
    }

    const totalTime = Date.now() - startTime;
    console.log(`🏁 AI Worker finished: ${results.length} jobs in ${totalTime}ms`);

    return new Response(JSON.stringify({
      status: 'completed',
      worker_id: WORKER_ID,
      jobs_processed: results.length,
      results,
      total_time_ms: totalTime
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ AI Worker Error:', error);
    return errorResponse(500, error instanceof Error ? error.message : 'Erro interno');
  }
});

// ============================================================
// PROCESSADOR DE JOBS POR TIPO
// ============================================================

async function processJob(
  supabase: ReturnType<typeof createClient>,
  job: AIJob
): Promise<WorkflowResult> {
  
  const { job_type, input } = job;
  
  // Timeout wrapper
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), JOB_TIMEOUT_MS);
  
  try {
    switch (job_type) {
      case 'WF-TUTOR-01':
        return await processTutorJob(supabase, input);
      
      case 'WF-FC-01':
        return await processFlashcardsJob(supabase, input);
      
      case 'WF-MM-01':
        return await processMindmapJob(supabase, input);
      
      case 'WF-CRONO-01':
        return await processCronogramaJob(supabase, input);
      
      case 'WF-IMPORT-URL-01':
        return await processImportUrlJob(supabase, input);
      
      case 'WF-LIVE-Q-01':
        return await processLiveSummaryJob(supabase, input);
      
      case 'WF-EMAIL-01':
        return await processEmailJob(supabase, input);
      
      case 'WF-WHATSAPP-01':
        return await processWhatsAppJob(supabase, input);
      
      case 'WF-HEALTHCHECK-01':
        return await processHealthcheckJob(supabase, input);
      
      default:
        return { success: false, error: `Job type não suportado: ${job_type}` };
    }
  } finally {
    clearTimeout(timeout);
  }
}

// ============================================================
// WORKFLOWS IMPLEMENTADOS
// ============================================================

// WF-TUTOR-01: Resposta do tutor IA
async function processTutorJob(
  supabase: ReturnType<typeof createClient>,
  input: Record<string, unknown>
): Promise<WorkflowResult> {
  const { messages, lesson_context, user_id } = input as {
    messages: Array<{ role: string; content: string }>;
    lesson_context?: string;
    user_id: string;
  };
  
  // 1. Buscar contexto do aluno (opcional)
  let studentContext = '';
  try {
    const { data: context } = await supabase.functions.invoke('generate-context', {
      body: { userId: user_id }
    });
    if (context?.success) {
      studentContext = `\n\nContexto do aluno: ${JSON.stringify(context.context)}`;
    }
  } catch {
    // Contexto não disponível, continuar sem
  }
  
  // 2. Chamar IA
  const systemPrompt = `Você é o Professor Moisés Medeiros IA, especialista em Química para vestibulares de Medicina.
Responda de forma didática, clara e motivadora.
${lesson_context ? `Contexto da aula: ${lesson_context}` : ''}${studentContext}`;

  const response = await callAI('gpt5_mini', [
    { role: 'system', content: systemPrompt },
    ...messages
  ]);
  
  return {
    success: true,
    output: { response: response.content },
    cost_usd: response.cost_usd
  };
}

// WF-FC-01: Geração de flashcards
async function processFlashcardsJob(
  supabase: ReturnType<typeof createClient>,
  input: Record<string, unknown>
): Promise<WorkflowResult> {
  const { topic, lesson_id, user_id, count = 10 } = input as {
    topic: string;
    lesson_id?: string;
    user_id: string;
    count?: number;
  };
  
  const prompt = `Gere ${count} flashcards sobre: "${topic}"

Retorne em JSON com o formato:
{
  "flashcards": [
    {
      "front": "Pergunta clara",
      "back": "Resposta completa mas concisa",
      "hint": "Dica ou mnemônico",
      "difficulty": "easy|medium|hard",
      "tags": ["tag1", "tag2"]
    }
  ]
}`;

  const response = await callAI('gemini_pro', [
    { role: 'system', content: 'Você é um especialista em criação de flashcards para estudos de química.' },
    { role: 'user', content: prompt }
  ]);
  
  // Parse JSON da resposta
  let flashcards = [];
  try {
    const jsonMatch = response.content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      flashcards = parsed.flashcards || [];
    }
  } catch {
    return { success: false, error: 'Falha ao parsear flashcards' };
  }
  
  // Salvar flashcards
  if (flashcards.length > 0) {
    const { error } = await supabase.from('flashcards').insert(
      flashcards.map((fc: Record<string, unknown>) => ({
        user_id,
        lesson_id,
        front: fc.front,
        back: fc.back,
        hint: fc.hint,
        difficulty: fc.difficulty || 'medium',
        tags: fc.tags || [],
        source: 'ai_generated'
      }))
    );
    
    if (error) {
      return { success: false, error: `Erro ao salvar: ${error.message}` };
    }
  }
  
  return {
    success: true,
    output: { flashcards_created: flashcards.length },
    cost_usd: response.cost_usd
  };
}

// WF-MM-01: Geração de mapa mental
async function processMindmapJob(
  supabase: ReturnType<typeof createClient>,
  input: Record<string, unknown>
): Promise<WorkflowResult> {
  const { topic, lesson_id, user_id } = input as {
    topic: string;
    lesson_id?: string;
    user_id: string;
  };
  
  const prompt = `Gere um mapa mental sobre: "${topic}"

Retorne em JSON com o formato:
{
  "title": "Título do mapa",
  "nodes": [
    { "id": "1", "label": "Conceito Central", "type": "root" },
    { "id": "2", "label": "Subcategoría", "type": "branch", "parent": "1" },
    { "id": "3", "label": "Detalhe", "type": "leaf", "parent": "2" }
  ],
  "edges": [
    { "from": "1", "to": "2" },
    { "from": "2", "to": "3" }
  ]
}`;

  const response = await callAI('gpt5', [
    { role: 'system', content: 'Você é um especialista em criar mapas mentais estruturados para estudo.' },
    { role: 'user', content: prompt }
  ]);
  
  // Parse JSON
  let mindmap = null;
  try {
    const jsonMatch = response.content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      mindmap = JSON.parse(jsonMatch[0]);
    }
  } catch {
    return { success: false, error: 'Falha ao parsear mapa mental' };
  }
  
  return {
    success: true,
    output: { mindmap },
    cost_usd: response.cost_usd
  };
}

// WF-CRONO-01: Geração de cronograma
async function processCronogramaJob(
  supabase: ReturnType<typeof createClient>,
  input: Record<string, unknown>
): Promise<WorkflowResult> {
  const { exam_date, subjects, hours_per_day, user_id } = input as {
    exam_date: string;
    subjects: string[];
    hours_per_day: number;
    user_id: string;
  };
  
  const prompt = `Crie um cronograma de estudos para vestibular de Medicina.

Data da prova: ${exam_date}
Matérias: ${subjects.join(', ')}
Horas disponíveis por dia: ${hours_per_day}

Retorne em JSON com o formato:
{
  "weeks": [
    {
      "week": 1,
      "focus": "Fundamentos",
      "days": {
        "monday": [{ "time": "08:00-10:00", "subject": "Química", "topic": "Estequiometria" }]
      }
    }
  ],
  "tips": ["Dica 1", "Dica 2"]
}`;

  const response = await callAI('gemini_pro', [
    { role: 'system', content: 'Você é um especialista em planejamento de estudos para vestibulandos de medicina.' },
    { role: 'user', content: prompt }
  ]);
  
  let cronograma = null;
  try {
    const jsonMatch = response.content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      cronograma = JSON.parse(jsonMatch[0]);
    }
  } catch {
    return { success: false, error: 'Falha ao parsear cronograma' };
  }
  
  return {
    success: true,
    output: { cronograma },
    cost_usd: response.cost_usd
  };
}

// WF-IMPORT-URL-01: Importar questões de URL
async function processImportUrlJob(
  supabase: ReturnType<typeof createClient>,
  input: Record<string, unknown>
): Promise<WorkflowResult> {
  const { url, admin_id } = input as { url: string; admin_id: string };
  
  // 1. Extrair conteúdo via Firecrawl
  const firecrawlKey = Deno.env.get('FIRECRAWL_API_KEY');
  if (!firecrawlKey) {
    return { success: false, error: 'FIRECRAWL_API_KEY não configurada' };
  }
  
  const extractResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${firecrawlKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      url,
      formats: ['markdown']
    })
  });
  
  if (!extractResponse.ok) {
    return { success: false, error: 'Falha na extração do conteúdo' };
  }
  
  const extractedData = await extractResponse.json();
  const content = extractedData.data?.markdown || '';
  
  if (!content) {
    return { success: false, error: 'Nenhum conteúdo extraído' };
  }
  
  // 2. Processar com IA para extrair questões
  const prompt = `Analise o conteúdo abaixo e extraia todas as questões de vestibular.

Conteúdo:
${content.slice(0, 8000)}

Retorne em JSON:
{
  "questions": [
    {
      "statement": "Enunciado da questão",
      "alternatives": ["A) ...", "B) ...", "C) ...", "D) ...", "E) ..."],
      "correct_answer": "A",
      "explanation": "Explicação da resposta",
      "topic": "Tópico",
      "difficulty": "easy|medium|hard",
      "source": "Vestibular/Ano"
    }
  ]
}`;

  const response = await callAI('gpt5', [
    { role: 'system', content: 'Você é um especialista em extrair e estruturar questões de vestibular.' },
    { role: 'user', content: prompt }
  ]);
  
  let questions = [];
  try {
    const jsonMatch = response.content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      questions = parsed.questions || [];
    }
  } catch {
    return { success: false, error: 'Falha ao parsear questões' };
  }
  
  // 3. Salvar questões
  if (questions.length > 0) {
    const { error } = await supabase.from('questions').insert(
      questions.map((q: Record<string, unknown>) => ({
        statement: q.statement,
        alternatives: q.alternatives,
        correct_answer: q.correct_answer,
        explanation: q.explanation,
        topic: q.topic,
        difficulty: q.difficulty,
        source: q.source,
        imported_by: admin_id,
        import_url: url
      }))
    );
    
    if (error) {
      console.error('Error saving questions:', error);
    }
  }
  
  return {
    success: true,
    output: { questions_imported: questions.length, url },
    cost_usd: response.cost_usd
  };
}

// WF-LIVE-Q-01: Resumo de perguntas da live
async function processLiveSummaryJob(
  supabase: ReturnType<typeof createClient>,
  input: Record<string, unknown>
): Promise<WorkflowResult> {
  const { live_id, window_start, window_end } = input as {
    live_id: string;
    window_start: string;
    window_end: string;
  };
  
  // 1. Buscar mensagens da janela
  const { data: messages } = await supabase
    .from('live_chat_messages')
    .select('content, user_name')
    .eq('live_id', live_id)
    .gte('created_at', window_start)
    .lte('created_at', window_end)
    .is('is_deleted', false)
    .order('created_at', { ascending: true })
    .limit(100);
  
  if (!messages || messages.length === 0) {
    return { success: true, output: { message: 'Sem mensagens na janela' } };
  }
  
  // 2. Analisar com IA
  const chatLog = messages.map(m => `${m.user_name}: ${m.content}`).join('\n');
  
  const prompt = `Analise as mensagens do chat de uma aula ao vivo e identifique:

1. Top 5 perguntas mais relevantes (agrupe similares)
2. Temas quentes (o que está gerando mais discussão)
3. Alertas (confusão generalizada, reclamações técnicas, etc.)

Chat:
${chatLog}

Retorne em JSON:
{
  "top_questions": ["Pergunta 1", "Pergunta 2", ...],
  "hot_topics": ["Tópico 1", "Tópico 2", ...],
  "alerts": ["Alerta 1", ...]
}`;

  const response = await callAI('gemini_flash', [
    { role: 'system', content: 'Você é um moderador de chat experiente.' },
    { role: 'user', content: prompt }
  ]);
  
  let summary = null;
  try {
    const jsonMatch = response.content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      summary = JSON.parse(jsonMatch[0]);
    }
  } catch {
    summary = { raw: response.content };
  }
  
  return {
    success: true,
    output: { summary, messages_analyzed: messages.length },
    cost_usd: response.cost_usd
  };
}

// WF-EMAIL-01: Enviar email com IA
async function processEmailJob(
  supabase: ReturnType<typeof createClient>,
  input: Record<string, unknown>
): Promise<WorkflowResult> {
  const { to, template, context } = input as {
    to: string;
    template: string;
    context: Record<string, unknown>;
  };
  
  // Gerar conteúdo do email
  const prompt = `Gere um email ${template} com o seguinte contexto:
${JSON.stringify(context)}

Retorne em JSON:
{
  "subject": "Assunto do email",
  "body_html": "<html>...</html>"
}`;

  const response = await callAI('gpt5_mini', [
    { role: 'system', content: 'Você é um redator de emails profissionais.' },
    { role: 'user', content: prompt }
  ]);
  
  let email = null;
  try {
    const jsonMatch = response.content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      email = JSON.parse(jsonMatch[0]);
    }
  } catch {
    return { success: false, error: 'Falha ao gerar email' };
  }
  
  // Enviar via Resend
  const { error } = await supabase.functions.invoke('send-email', {
    body: { to, subject: email.subject, html: email.body_html }
  });
  
  if (error) {
    return { success: false, error: `Falha ao enviar: ${error.message}` };
  }
  
  return {
    success: true,
    output: { email_sent: true, to, subject: email.subject },
    cost_usd: response.cost_usd
  };
}

// WF-WHATSAPP-01: Responder WhatsApp com IA
async function processWhatsAppJob(
  supabase: ReturnType<typeof createClient>,
  input: Record<string, unknown>
): Promise<WorkflowResult> {
  const { phone, message, lead_id } = input as {
    phone: string;
    message: string;
    lead_id?: string;
  };
  
  const response = await callAI('gpt5_nano', [
    { role: 'system', content: `Você é o TRAMON, assistente do Prof. Moisés Medeiros.
Responda de forma amigável e objetiva. Máximo 300 caracteres.` },
    { role: 'user', content: message }
  ]);
  
  // Enviar via WhatsApp API
  const waToken = Deno.env.get('WHATSAPP_ACCESS_TOKEN');
  const waPhoneId = Deno.env.get('WHATSAPP_PHONE_NUMBER_ID');
  
  if (waToken && waPhoneId) {
    await fetch(`https://graph.facebook.com/v18.0/${waPhoneId}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${waToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: phone,
        type: 'text',
        text: { body: response.content.slice(0, 300) }
      })
    });
  }
  
  // Salvar histórico
  if (lead_id) {
    await supabase.from('whatsapp_conversation_history').insert({
      lead_id,
      user_message: message,
      ai_response: response.content
    });
  }
  
  return {
    success: true,
    output: { response: response.content, sent: !!waToken },
    cost_usd: response.cost_usd
  };
}

// WF-HEALTHCHECK-01: Verificar saúde dos serviços
async function processHealthcheckJob(
  supabase: ReturnType<typeof createClient>,
  input: Record<string, unknown>
): Promise<WorkflowResult> {
  const { services } = input as { services: string[] };
  const results: Record<string, { ok: boolean; latency_ms: number; error?: string }> = {};
  
  for (const service of services) {
    const start = Date.now();
    try {
      const response = await callAI(service as Parameters<typeof callAI>[0], [
        { role: 'user', content: 'Responda apenas "OK".' }
      ]);
      
      results[service] = {
        ok: response.content.toLowerCase().includes('ok'),
        latency_ms: Date.now() - start
      };
      
      // Registrar healthcheck
      await supabase.rpc('record_ai_healthcheck', {
        p_service: service,
        p_ok: results[service].ok,
        p_latency_ms: results[service].latency_ms,
        p_response_preview: response.content.slice(0, 200)
      });
      
    } catch (error) {
      results[service] = {
        ok: false,
        latency_ms: Date.now() - start,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
      
      await supabase.rpc('record_ai_healthcheck', {
        p_service: service,
        p_ok: false,
        p_latency_ms: results[service].latency_ms,
        p_error: results[service].error
      });
    }
  }
  
  return {
    success: true,
    output: { healthchecks: results },
    cost_usd: 0.001 // Custo mínimo
  };
}

// ============================================================
// FUNÇÕES AUXILIARES
// ============================================================

async function callAI(
  provider: 'gemini_flash' | 'gemini_pro' | 'gpt5' | 'gpt5_mini' | 'gpt5_nano' | 'perplexity',
  messages: Array<{ role: string; content: string }>
): Promise<{ content: string; cost_usd: number }> {
  const PROVIDERS: Record<string, { model: string; costIn: number; costOut: number }> = {
    gemini_flash: { model: 'google/gemini-2.0-flash-exp', costIn: 0.000000075, costOut: 0.0000003 },
    gemini_pro: { model: 'google/gemini-pro-1.5', costIn: 0.00000125, costOut: 0.000005 },
    gpt5: { model: 'openai/gpt-5', costIn: 0.000005, costOut: 0.000015 },
    gpt5_mini: { model: 'openai/gpt-5-mini', costIn: 0.00000015, costOut: 0.0000006 },
    gpt5_nano: { model: 'openai/gpt-5-nano', costIn: 0.0000001, costOut: 0.0000004 },
    perplexity: { model: 'llama-3.1-sonar-large-128k-online', costIn: 0.000001, costOut: 0.000001 },
  };
  
  const config = PROVIDERS[provider];
  const apiKey = provider === 'perplexity' 
    ? Deno.env.get('PERPLEXITY_API_KEY')
    : Deno.env.get('LOVABLE_API_KEY');
  
  const url = provider === 'perplexity'
    ? 'https://api.perplexity.ai/chat/completions'
    : LOVABLE_AI_URL;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: config.model,
      messages
    })
  });
  
  if (!response.ok) {
    throw new Error(`AI call failed: ${response.status}`);
  }
  
  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || '';
  const usage = data.usage || {};
  
  const cost_usd = 
    (usage.prompt_tokens || 0) * config.costIn +
    (usage.completion_tokens || 0) * config.costOut;
  
  return { content, cost_usd };
}

function errorResponse(status: number, message: string) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}
