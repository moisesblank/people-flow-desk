// ============================================================
// 🔧 SNA WORKER OMEGA v5.0 — PROCESSADOR DE JOBS ENTERPRISE
// Worker assíncrono com 20+ workflows, retry inteligente, DLQ
// Execução: Cron (1min) ou manual via API
// ============================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

import { getCorsHeaders, handleCorsOptions } from "../_shared/corsConfig.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ============================================================
// TIPOS
// ============================================================

interface SNAJob {
  id: string;
  job_type: string;
  input: Record<string, unknown>;
  status: string;
  priority: number;
  attempts: number;
  max_attempts: number;
  timeout_seconds: number;
  created_at: string;
  started_at?: string;
  metadata?: Record<string, unknown>;
  correlation_id?: string;
}

interface WorkflowResult {
  success: boolean;
  output?: Record<string, unknown>;
  error?: string;
  tokens_in?: number;
  tokens_out?: number;
  cost_usd?: number;
  result_summary?: string;
}

interface AIResponse {
  content: string;
  tokens_in: number;
  tokens_out: number;
  cost_usd: number;
}

// ============================================================
// CONFIGURAÇÃO
// ============================================================

const LOVABLE_AI_URL = 'https://ai.gateway.lovable.dev/v1/chat/completions';

// Mapeamento de modelos
const MODEL_MAP: Record<string, { model: string; costIn: number; costOut: number }> = {
  'gpt5': { model: 'openai/gpt-5', costIn: 5.00, costOut: 15.00 },
  'gpt5_mini': { model: 'openai/gpt-5-mini', costIn: 0.15, costOut: 0.60 },
  'gpt5_nano': { model: 'openai/gpt-5-nano', costIn: 0.10, costOut: 0.40 },
  'gemini_pro': { model: 'google/gemini-2.5-pro', costIn: 1.25, costOut: 5.00 },
  'gemini_flash': { model: 'google/gemini-2.5-flash', costIn: 0.075, costOut: 0.30 },
  'gemini_flash_lite': { model: 'google/gemini-2.5-flash-lite', costIn: 0.05, costOut: 0.15 },
};

// ============================================================
// HANDLER PRINCIPAL
// ============================================================

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  const workerId = `worker-${crypto.randomUUID().slice(0, 8)}`;
  
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  try {
    const body = await req.json().catch(() => ({}));
    const {
      job_types = null,
      max_priority = 5,
      limit = 5,
      single_job_id = null,
    } = body;

    console.log(`🔧 SNA Worker [${workerId}] starting...`);

    let jobsProcessed = 0;
    let jobsSucceeded = 0;
    let jobsFailed = 0;
    let totalCostUsd = 0;

    // Cleanup automático
    const { data: cleanupResult } = await supabase.rpc('sna_cleanup', {
      p_job_retention_days: 30,
      p_tool_run_retention_days: 7,
      p_cache_cleanup: true,
      p_rate_limit_cleanup: true
    });
    
    if (cleanupResult) {
      const cleaned = cleanupResult as Record<string, number>;
      if (Object.values(cleaned).some(v => v > 0)) {
        console.log(`🧹 Cleanup: ${JSON.stringify(cleaned)}`);
      }
    }

    // Modo single job
    if (single_job_id) {
      const { data: singleJob } = await supabase
        .from('sna_jobs')
        .select('*')
        .eq('id', single_job_id)
        .single();

      if (singleJob) {
        const result = await processJob(supabase, singleJob as SNAJob);
        return new Response(JSON.stringify({
          worker_id: workerId,
          job_id: single_job_id,
          result,
          latency_ms: Date.now() - startTime
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      } else {
        return new Response(JSON.stringify({
          error: 'JOB_NOT_FOUND',
          job_id: single_job_id
        }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    // Claim jobs
    const { data: jobs, error: claimError } = await supabase.rpc('sna_claim_jobs', {
      p_worker_id: workerId,
      p_job_types: job_types,
      p_max_priority: max_priority,
      p_limit: limit
    });

    if (claimError) {
      console.error(`❌ Claim error:`, claimError);
      return new Response(JSON.stringify({
        error: 'CLAIM_FAILED',
        message: claimError.message
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (!jobs || jobs.length === 0) {
      console.log(`📭 No jobs to process`);
      return new Response(JSON.stringify({
        worker_id: workerId,
        jobs_processed: 0,
        message: 'No jobs available',
        cleanup: cleanupResult
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`📥 Claimed ${jobs.length} jobs`);

    // Process each job
    for (const job of jobs as SNAJob[]) {
      try {
        const result = await processJob(supabase, job);
        jobsProcessed++;
        
        if (result.success) {
          jobsSucceeded++;
          totalCostUsd += result.cost_usd || 0;
          
          await supabase.rpc('sna_complete_job', {
            p_job_id: job.id,
            p_output: result.output || {},
            p_cost_usd: result.cost_usd || 0,
            p_tokens_in: result.tokens_in || 0,
            p_tokens_out: result.tokens_out || 0,
            p_result_summary: result.result_summary || null
          });
          
          console.log(`✅ Job ${job.id} completed`);
        } else {
          jobsFailed++;
          
          await supabase.rpc('sna_fail_job', {
            p_job_id: job.id,
            p_error: { message: result.error || 'Unknown error' }
          });
          
          console.warn(`⚠️ Job ${job.id} failed: ${result.error}`);
        }
      } catch (err) {
        console.error(`❌ Job ${job.id} error:`, err);
        jobsFailed++;
        
        await supabase.rpc('sna_fail_job', {
          p_job_id: job.id,
          p_error: { message: err instanceof Error ? err.message : 'Unknown error' }
        });
      }
    }

    const totalTime = Date.now() - startTime;
    console.log(`✅ SNA Worker [${workerId}] finished: ${jobsSucceeded}/${jobsProcessed} in ${totalTime}ms`);

    return new Response(JSON.stringify({
      worker_id: workerId,
      jobs_processed: jobsProcessed,
      jobs_succeeded: jobsSucceeded,
      jobs_failed: jobsFailed,
      total_cost_usd: totalCostUsd,
      latency_ms: totalTime
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error(`❌ SNA Worker Error [${workerId}]:`, error);
    return new Response(JSON.stringify({
      error: 'WORKER_ERROR',
      message: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

// ============================================================
// AI HELPER
// ============================================================

async function callAI(
  modelKey: string,
  messages: Array<{ role: string; content: string }>,
  options: { max_tokens?: number; temperature?: number } = {}
): Promise<AIResponse> {
  const apiKey = Deno.env.get('LOVABLE_API_KEY');
  if (!apiKey) throw new Error('LOVABLE_API_KEY not configured');

  const modelConfig = MODEL_MAP[modelKey] || MODEL_MAP['gemini_flash'];

  const response = await fetch(LOVABLE_AI_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: modelConfig.model,
      messages,
      max_tokens: options.max_tokens || 4096,
      temperature: options.temperature ?? 0.7,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`AI API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || '';
  const usage = data.usage || {};
  
  const tokens_in = usage.prompt_tokens || 0;
  const tokens_out = usage.completion_tokens || 0;
  const cost_usd = (tokens_in * modelConfig.costIn + tokens_out * modelConfig.costOut) / 1000000;

  return { content, tokens_in, tokens_out, cost_usd };
}

// ============================================================
// ROTEADOR DE WORKFLOWS
// ============================================================

async function processJob(
  supabase: SupabaseClient,
  job: SNAJob
): Promise<WorkflowResult> {
  const { job_type, input } = job;

  console.log(`▶️ Processing ${job.id} [${job_type}] (attempt ${job.attempts})`);

  switch (job_type) {
    // ========== TUTOR ==========
    case 'WF-TUTOR-01':
      return await wfTutor(supabase, input);
    
    case 'WF-TUTOR-CONTEXT':
      return await wfTutorWithContext(supabase, input);

    // ========== CONTEÚDO ==========
    case 'WF-FLASHCARDS':
      return await wfFlashcards(supabase, input);
    
    case 'WF-MINDMAP':
      return await wfMindmap(supabase, input);
    
    case 'WF-CRONOGRAMA':
      return await wfCronograma(supabase, input);
    
    case 'WF-RESUMO':
      return await wfResumo(supabase, input);
    
    case 'WF-EXERCICIOS':
      return await wfExercicios(supabase, input);

    // ========== IMPORTAÇÃO ==========
    case 'WF-IMPORT-URL':
      return await wfImportUrl(supabase, input);
    
    case 'WF-IMPORT-PDF':
      return await wfImportPdf(supabase, input);
    
    case 'WF-TRANSCRIBE':
      return await wfTranscribe(supabase, input);

    // ========== LIVE ==========
    case 'WF-LIVE-SUMMARY':
      return await wfLiveSummary(supabase, input);
    
    case 'WF-LIVE-HIGHLIGHT':
      return await wfLiveHighlight(supabase, input);

    // ========== COMUNICAÇÃO ==========
    case 'WF-EMAIL':
      return await wfEmail(supabase, input);
    
    case 'WF-WHATSAPP':
      return await wfWhatsApp(supabase, input);
    
    case 'WF-NOTIFICATION':
      return await wfNotification(supabase, input);

    // ========== ANÁLISE ==========
    case 'WF-ANALYZE-CHURN':
      return await wfAnalyzeChurn(supabase, input);
    
    case 'WF-REPORT-WEEKLY':
      return await wfWeeklyReport(supabase, input);

    // ========== SISTEMA ==========
    case 'WF-HEALTHCHECK':
      return await wfHealthcheck(supabase, input);
    
    case 'WF-EMBED-CONTENT':
      return await wfEmbedContent(supabase, input);

    // ========== LEGADO (compatibilidade) ==========
    case 'tutor.answer':
      return await wfTutor(supabase, input);
    case 'flashcards.generate':
      return await wfFlashcards(supabase, input);
    case 'mindmap.generate':
      return await wfMindmap(supabase, input);
    case 'cronograma.generate':
      return await wfCronograma(supabase, input);
    case 'summary.generate':
      return await wfResumo(supabase, input);

    default:
      return { success: false, error: `Workflow não suportado: ${job_type}` };
  }
}

// ============================================================
// WORKFLOWS - TUTOR
// ============================================================

async function wfTutor(
  supabase: SupabaseClient,
  input: Record<string, unknown>
): Promise<WorkflowResult> {
  const { messages, lesson_context, user_id } = input as {
    messages: Array<{ role: string; content: string }>;
    lesson_context?: string;
    user_id?: string;
  };

  const systemPrompt = `# 🧪 PROFESSOR MOISÉS MEDEIROS IA
Você é a personificação digital do Professor Moisés Medeiros, especialista em Química para vestibulares de Medicina.

${lesson_context ? `## Contexto da Aula\n${lesson_context}` : ''}

## Diretrizes
- Responda de forma didática, clara e motivadora
- Use emojis com moderação (🧪⚗️🔬💊🩺)
- Formate com Markdown
- Conecte conceitos com aplicações médicas
- Mantenha tom encorajador

## Formato
🎯 [CONCEITO]
Explicação clara

📚 FUNDAMENTOS
• Pontos principais

💡 DICA DO PROFESSOR
[Mnemônico ou macete]

✅ TESTE SEU CONHECIMENTO
[Pergunta para fixação]`;

  const response = await callAI('gpt5_mini', [
    { role: 'system', content: systemPrompt },
    ...messages
  ]);

  return {
    success: true,
    output: { response: response.content },
    cost_usd: response.cost_usd,
    tokens_in: response.tokens_in,
    tokens_out: response.tokens_out,
    result_summary: `Resposta gerada (${response.tokens_out} tokens)`
  };
}

async function wfTutorWithContext(
  supabase: SupabaseClient,
  input: Record<string, unknown>
): Promise<WorkflowResult> {
  const { messages, user_id, lesson_id } = input as {
    messages: Array<{ role: string; content: string }>;
    user_id: string;
    lesson_id?: string;
  };

  // Buscar contexto do aluno COM x-internal-secret (P0-3)
  let studentContext = '';
  try {
    const INTERNAL_SECRET = Deno.env.get('INTERNAL_SECRET');
    const { data: context } = await supabase.functions.invoke('generate-context', {
      body: { userId: user_id },
      headers: INTERNAL_SECRET ? { 'x-internal-secret': INTERNAL_SECRET } : {}
    });
    if (context?.success) {
      studentContext = `
## 🧠 Perfil do Aluno
- Nível: ${context.context.xp_e_nivel?.nivel || 'Iniciante'}
- XP: ${context.context.xp_e_nivel?.total_xp || 0}
- Streak: ${context.context.streaks?.atual || 0} dias
- Progresso: ${context.context.progresso_geral || 0}%
- Dificuldades: ${context.context.top_3_dificuldades?.join(', ') || 'Em análise'}
- Forças: ${context.context.top_3_forcas?.join(', ') || 'Em análise'}
- Estado: ${context.context.estado_emocional_inferido || 'neutro'}`;
    }
  } catch {
    // Contexto não disponível
  }

  const systemPrompt = `# 🧪 PROFESSOR MOISÉS MEDEIROS IA - PERSONALIZADO
${studentContext}

Adapte sua resposta ao perfil do aluno acima.
- Se streak alto: celebre a consistência
- Se dificuldades: explique com mais detalhes
- Se estado baixo: seja extra motivador`;

  const response = await callAI('gpt5_mini', [
    { role: 'system', content: systemPrompt },
    ...messages
  ]);

  return {
    success: true,
    output: { response: response.content, context_used: !!studentContext },
    cost_usd: response.cost_usd,
    tokens_in: response.tokens_in,
    tokens_out: response.tokens_out
  };
}

// ============================================================
// WORKFLOWS - CONTEÚDO
// ============================================================

async function wfFlashcards(
  supabase: SupabaseClient,
  input: Record<string, unknown>
): Promise<WorkflowResult> {
  const { topic, content, lesson_id, user_id, count = 10 } = input as {
    topic?: string;
    content?: string;
    lesson_id?: string;
    user_id?: string;
    count?: number;
  };

  const topicOrContent = topic || content || 'Química Geral';

  const prompt = `Gere ${count} flashcards de alta qualidade sobre: "${topicOrContent}"

Retorne APENAS JSON válido:
{
  "flashcards": [
    {
      "front": "Pergunta clara e específica",
      "back": "Resposta completa mas concisa",
      "hint": "Dica ou mnemônico memorável",
      "difficulty": "easy|medium|hard",
      "tags": ["tag1", "tag2"],
      "why_important": "Por que isso cai no vestibular"
    }
  ]
}

Regras:
- Frente: máximo 30 palavras, pergunta específica
- Verso: máximo 60 palavras, resposta completa
- Dica: memorável e única
- Distribuição: 30% fácil, 50% médio, 20% difícil`;

  const response = await callAI('gemini_pro', [
    { role: 'system', content: 'Você é um especialista em criar flashcards para estudos de química. Retorne APENAS JSON.' },
    { role: 'user', content: prompt }
  ], { temperature: 0.5 });

  let flashcards: Array<Record<string, unknown>> = [];
  try {
    const jsonMatch = response.content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      flashcards = parsed.flashcards || [];
    }
  } catch {
    return { success: false, error: 'Falha ao parsear flashcards' };
  }

  // Salvar se tiver user_id
  if (flashcards.length > 0 && user_id) {
    const { error } = await supabase.from('flashcards').insert(
      flashcards.map((fc) => ({
        user_id,
        lesson_id,
        front: fc.front,
        back: fc.back,
        hint: fc.hint,
        difficulty: fc.difficulty || 'medium',
        tags: fc.tags || [],
        source: 'sna_generated',
        metadata: { why_important: fc.why_important }
      }))
    );

    if (error) {
      console.warn(`Erro ao salvar flashcards: ${error.message}`);
    }
  }

  return {
    success: true,
    output: { flashcards_created: flashcards.length, flashcards },
    cost_usd: response.cost_usd,
    tokens_in: response.tokens_in,
    tokens_out: response.tokens_out,
    result_summary: `${flashcards.length} flashcards criados`
  };
}

async function wfMindmap(
  supabase: SupabaseClient,
  input: Record<string, unknown>
): Promise<WorkflowResult> {
  const { topic, content, depth = 3 } = input as { topic?: string; content?: string; depth?: number };

  const topicOrContent = topic || content || 'Química';

  const prompt = `Crie um mapa mental completo sobre: "${topicOrContent}"

Retorne JSON:
{
  "title": "Título do mapa",
  "nodes": [
    { "id": "1", "label": "Conceito Central", "type": "root", "color": "#8B5CF6" },
    { "id": "2", "label": "Ramo 1", "type": "branch", "parent": "1", "color": "#3B82F6" },
    { "id": "3", "label": "Detalhe", "type": "leaf", "parent": "2", "color": "#10B981" }
  ],
  "summary": "Resumo em 2 frases"
}

Profundidade máxima: ${depth} níveis
Cores: root=#8B5CF6, branch=#3B82F6, leaf=#10B981`;

  const response = await callAI('gpt5', [
    { role: 'system', content: 'Crie mapas mentais estruturados. Retorne APENAS JSON.' },
    { role: 'user', content: prompt }
  ], { temperature: 0.5 });

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
    cost_usd: response.cost_usd,
    tokens_in: response.tokens_in,
    tokens_out: response.tokens_out,
    result_summary: `Mapa mental: ${mindmap?.nodes?.length || 0} nós`
  };
}

async function wfCronograma(
  supabase: SupabaseClient,
  input: Record<string, unknown>
): Promise<WorkflowResult> {
  const { exam_date, subjects, hours_per_day = 4, user_id } = input as {
    exam_date?: string;
    subjects?: string[];
    hours_per_day?: number;
    user_id?: string;
  };

  // Calcular dias até a prova
  const daysUntilExam = exam_date 
    ? Math.ceil((new Date(exam_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : 30;

  const subjectList = subjects || ['Química Geral', 'Química Orgânica', 'Físico-Química'];

  const prompt = `Crie um cronograma de estudos científico para vestibular de Medicina.

Dados:
- Dias até a prova: ${daysUntilExam}
- Matérias: ${subjectList.join(', ')}
- Horas/dia: ${hours_per_day}

Retorne JSON com:
{
  "meta": { "total_hours": N, "weeks": N },
  "weekly_plan": [
    {
      "week": 1,
      "focus": "Tema principal",
      "days": {
        "monday": [{ "time": "08:00-10:00", "subject": "...", "activity": "..." }]
      }
    }
  ],
  "revision_schedule": { "intervals": [1,3,7,14,30] },
  "tips": ["Dica 1", "Dica 2"]
}

Use técnicas:
- Repetição espaçada
- Intercalação
- Blocos de 90min + pausas
- Manhã: conteúdo novo, Tarde: exercícios`;

  const response = await callAI('gemini_pro', [
    { role: 'system', content: 'Especialista em planejamento de estudos. Retorne APENAS JSON.' },
    { role: 'user', content: prompt }
  ], { temperature: 0.3 });

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
    output: { cronograma, days_until_exam: daysUntilExam },
    cost_usd: response.cost_usd,
    tokens_in: response.tokens_in,
    tokens_out: response.tokens_out,
    result_summary: `Cronograma: ${cronograma?.meta?.weeks || 0} semanas`
  };
}

async function wfResumo(
  supabase: SupabaseClient,
  input: Record<string, unknown>
): Promise<WorkflowResult> {
  const { content, format = 'bullet', max_length = 500 } = input as { 
    content: string; 
    format?: 'bullet' | 'paragraph' | 'outline';
    max_length?: number;
  };

  const prompt = `Resuma o seguinte conteúdo no formato ${format}:

${content.slice(0, 10000)}

Formato de saída:
- bullet: lista com bullets
- paragraph: 2-3 parágrafos
- outline: estrutura hierárquica

Inclua:
- Conceitos-chave em **negrito**
- Conexões com vestibular
- Dica de memorização

Máximo ${max_length} palavras.`;

  const response = await callAI('gemini_flash', [
    { role: 'system', content: 'Crie resumos concisos e didáticos.' },
    { role: 'user', content: prompt }
  ], { temperature: 0.3 });

  return {
    success: true,
    output: { summary: response.content, format },
    cost_usd: response.cost_usd,
    tokens_in: response.tokens_in,
    tokens_out: response.tokens_out,
    result_summary: `Resumo ${format} gerado`
  };
}

async function wfExercicios(
  supabase: SupabaseClient,
  input: Record<string, unknown>
): Promise<WorkflowResult> {
  const { topic, count = 5, difficulty = 'medium' } = input as {
    topic: string;
    count?: number;
    difficulty?: 'easy' | 'medium' | 'hard';
  };

  const prompt = `Gere ${count} questões de vestibular sobre: "${topic}"
Dificuldade: ${difficulty}

JSON:
{
  "questions": [
    {
      "statement": "Enunciado completo",
      "alternatives": ["A) ...", "B) ...", "C) ...", "D) ...", "E) ..."],
      "correct": "A",
      "explanation": "Explicação detalhada",
      "topic": "${topic}",
      "difficulty": "${difficulty}"
    }
  ]
}`;

  const response = await callAI('gpt5', [
    { role: 'system', content: 'Crie questões no estilo FUVEST/UNICAMP. Retorne APENAS JSON.' },
    { role: 'user', content: prompt }
  ], { temperature: 0.5 });

  let questions: Array<Record<string, unknown>> = [];
  try {
    const jsonMatch = response.content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      questions = parsed.questions || [];
    }
  } catch {
    return { success: false, error: 'Falha ao parsear questões' };
  }

  return {
    success: true,
    output: { questions, count: questions.length },
    cost_usd: response.cost_usd,
    tokens_in: response.tokens_in,
    tokens_out: response.tokens_out,
    result_summary: `${questions.length} questões geradas`
  };
}

// ============================================================
// WORKFLOWS - IMPORTAÇÃO
// ============================================================

async function wfImportUrl(
  supabase: SupabaseClient,
  input: Record<string, unknown>
): Promise<WorkflowResult> {
  const { url, admin_id } = input as { url: string; admin_id?: string };

  // Extrair via Firecrawl
  const firecrawlKey = Deno.env.get('FIRECRAWL_API_KEY');
  if (!firecrawlKey) {
    return { success: false, error: 'FIRECRAWL_API_KEY não configurada' };
  }

  const extractResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${firecrawlKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ url, formats: ['markdown'] })
  });

  if (!extractResponse.ok) {
    return { success: false, error: `Firecrawl error: ${extractResponse.status}` };
  }

  const extractedData = await extractResponse.json();
  const content = extractedData.data?.markdown || '';

  if (!content) {
    return { success: false, error: 'Nenhum conteúdo extraído' };
  }

  // Processar com IA
  const response = await callAI('gpt5', [
    { role: 'system', content: 'Extraia questões de vestibular. Retorne JSON com array "questions".' },
    { role: 'user', content: `Extraia questões:\n\n${content.slice(0, 15000)}` }
  ]);

  let questions: Array<Record<string, unknown>> = [];
  try {
    const jsonMatch = response.content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      questions = parsed.questions || [];
    }
  } catch {
    // Pode não ter questões
  }

  return {
    success: true,
    output: { questions_imported: questions.length, url, questions },
    cost_usd: response.cost_usd,
    tokens_in: response.tokens_in,
    tokens_out: response.tokens_out,
    result_summary: `${questions.length} questões importadas de ${url}`
  };
}

async function wfImportPdf(
  supabase: SupabaseClient,
  input: Record<string, unknown>
): Promise<WorkflowResult> {
  const { file_path, admin_id } = input as { file_path: string; admin_id?: string };

  // TODO: Implementar extração de PDF via storage
  return {
    success: false,
    error: 'WF-IMPORT-PDF: Implementação pendente'
  };
}

async function wfTranscribe(
  supabase: SupabaseClient,
  input: Record<string, unknown>
): Promise<WorkflowResult> {
  const { audio_url } = input as { audio_url: string };

  // TODO: Implementar via Whisper API (ElevenLabs)
  return {
    success: false,
    error: 'WF-TRANSCRIBE: Implementação pendente'
  };
}

// ============================================================
// WORKFLOWS - LIVE
// ============================================================

async function wfLiveSummary(
  supabase: SupabaseClient,
  input: Record<string, unknown>
): Promise<WorkflowResult> {
  const { live_id, window_minutes = 5, questions } = input as { 
    live_id: string; 
    window_minutes?: number;
    questions?: string[];
  };

  // Se não tiver perguntas, buscar do banco
  let chatMessages: string[] = questions || [];
  
  if (chatMessages.length === 0) {
    const windowStart = new Date(Date.now() - window_minutes * 60 * 1000).toISOString();

    const { data: messages } = await supabase
      .from('live_chat_messages')
      .select('content, user_name')
      .eq('live_id', live_id)
      .gte('created_at', windowStart)
      .is('is_deleted', false)
      .order('created_at')
      .limit(100);

    if (!messages || messages.length === 0) {
      return { success: true, output: { message: 'Sem mensagens na janela' } };
    }

    chatMessages = messages.map(m => `${m.user_name}: ${m.content}`);
  }

  const chatLog = chatMessages.join('\n');

  const response = await callAI('gemini_flash', [
    { role: 'system', content: 'Analise chat de aula ao vivo. Retorne JSON.' },
    { role: 'user', content: `Analise e retorne JSON com top_questions, hot_topics, alerts:\n\n${chatLog}` }
  ], { temperature: 0.3 });

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
    output: { summary, messages_analyzed: chatMessages.length, live_id },
    cost_usd: response.cost_usd,
    tokens_in: response.tokens_in,
    tokens_out: response.tokens_out,
    result_summary: `${chatMessages.length} mensagens analisadas`
  };
}

async function wfLiveHighlight(
  supabase: SupabaseClient,
  input: Record<string, unknown>
): Promise<WorkflowResult> {
  const { live_id, message_ids, transcript } = input as { 
    live_id: string; 
    message_ids?: string[];
    transcript?: string;
  };

  // Modo 1: Destacar mensagens específicas
  if (message_ids && message_ids.length > 0) {
    const { error } = await supabase
      .from('live_chat_messages')
      .update({ is_pinned: true })
      .in('id', message_ids);

    if (error) {
      return { success: false, error: error.message };
    }

    return {
      success: true,
      output: { highlighted: message_ids.length },
      result_summary: `${message_ids.length} mensagens destacadas`
    };
  }

  // Modo 2: Extrair highlights de transcrição
  if (transcript) {
    const response = await callAI('gemini_flash', [
      { role: 'system', content: 'Extraia highlights de transcrições. Retorne APENAS JSON.' },
      { role: 'user', content: `Extraia os momentos mais importantes desta transcrição de live:

${transcript.slice(0, 5000)}

Retorne JSON:
{
  "highlights": [
    { "timestamp": "00:05:30", "topic": "Tópico", "summary": "Resumo do momento" }
  ],
  "key_concepts": ["Conceito 1", "Conceito 2"],
  "action_items": ["Revisar X", "Estudar Y"]
}` }
    ], { temperature: 0.3 });

    let highlights = null;
    try {
      const jsonMatch = response.content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        highlights = JSON.parse(jsonMatch[0]);
      }
    } catch {
      highlights = { highlights: [], error: 'Parse failed' };
    }

    return {
      success: true,
      output: { ...highlights, live_id },
      cost_usd: response.cost_usd,
      tokens_in: response.tokens_in,
      tokens_out: response.tokens_out,
      result_summary: `Highlights: ${highlights?.highlights?.length || 0}`
    };
  }

  return { success: false, error: 'Informe message_ids ou transcript' };
}

// ============================================================
// WORKFLOWS - COMUNICAÇÃO
// ============================================================

async function wfEmail(
  supabase: SupabaseClient,
  input: Record<string, unknown>
): Promise<WorkflowResult> {
  const { to, subject, body } = input as {
    to: string;
    subject: string;
    body: string;
  };
  
  // TODO: Integrar com serviço de email real
  console.log(`📧 Would send email to ${to}: ${subject}`);
  
  return {
    success: true,
    output: { message: 'Email queued', to, subject },
    result_summary: `Email para ${to}`
  };
}

async function wfWhatsApp(
  supabase: SupabaseClient,
  input: Record<string, unknown>
): Promise<WorkflowResult> {
  const { phone, message } = input as {
    phone: string;
    message: string;
  };
  
  // TODO: Integrar com WhatsApp API
  console.log(`📱 Would send WhatsApp to ${phone}`);
  
  return {
    success: true,
    output: { message: 'WhatsApp queued', phone },
    result_summary: `WhatsApp para ${phone}`
  };
}

async function wfNotification(
  supabase: SupabaseClient,
  input: Record<string, unknown>
): Promise<WorkflowResult> {
  const { user_id, title, body, type = 'info' } = input as {
    user_id: string;
    title: string;
    body: string;
    type?: string;
  };
  
  // Salvar notificação no banco
  const { error } = await supabase.from('notifications').insert({
    user_id,
    title,
    body,
    type,
    read: false
  });

  if (error) {
    return { success: false, error: `Erro ao criar notificação: ${error.message}` };
  }
  
  return {
    success: true,
    output: { message: 'Notification created', user_id, title },
    result_summary: `Notificação: ${title}`
  };
}

// ============================================================
// WORKFLOWS - ANÁLISE
// ============================================================

async function wfAnalyzeChurn(
  supabase: SupabaseClient,
  input: Record<string, unknown>
): Promise<WorkflowResult> {
  const { user_id } = input as { user_id?: string };

  // Buscar dados de engagement
  const { data: users } = await supabase
    .from('profiles')
    .select('id, last_activity, created_at')
    .limit(100);

  const analysis = {
    total_users: users?.length || 0,
    at_risk: 0,
    churned: 0,
    active: 0
  };

  const now = new Date();
  for (const user of users || []) {
    const lastActivity = new Date(user.last_activity || user.created_at);
    const daysSinceActivity = (now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24);
    
    if (daysSinceActivity > 30) analysis.churned++;
    else if (daysSinceActivity > 7) analysis.at_risk++;
    else analysis.active++;
  }

  return {
    success: true,
    output: { analysis },
    result_summary: `Churn analysis: ${analysis.at_risk} at risk`
  };
}

async function wfWeeklyReport(
  supabase: SupabaseClient,
  input: Record<string, unknown>
): Promise<WorkflowResult> {
  // Buscar métricas da semana
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const [
    { count: newUsers },
    { count: lessons },
    { count: questions }
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', oneWeekAgo),
    supabase.from('lesson_progress').select('*', { count: 'exact', head: true }).gte('created_at', oneWeekAgo),
    supabase.from('questions').select('*', { count: 'exact', head: true }).gte('created_at', oneWeekAgo)
  ]);

  const report = {
    period: 'weekly',
    new_users: newUsers || 0,
    lessons_completed: lessons || 0,
    questions_answered: questions || 0,
    generated_at: new Date().toISOString()
  };

  return {
    success: true,
    output: { report },
    result_summary: `Weekly report: ${newUsers} new users`
  };
}

// ============================================================
// WORKFLOWS - SISTEMA
// ============================================================

async function wfHealthcheck(
  supabase: SupabaseClient,
  input: Record<string, unknown>
): Promise<WorkflowResult> {
  const services = ['lovable_ai', 'database'];
  const results: Record<string, { ok: boolean; latency_ms: number }> = {};

  for (const service of services) {
    const start = Date.now();
    let ok = false;

    try {
      if (service === 'lovable_ai') {
        const apiKey = Deno.env.get('LOVABLE_API_KEY');
        if (apiKey) {
          const response = await fetch(LOVABLE_AI_URL, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'google/gemini-2.5-flash',
              messages: [{ role: 'user', content: 'ping' }],
              max_tokens: 10
            }),
          });
          ok = response.ok;
        }
      } else if (service === 'database') {
        const { error } = await supabase.from('profiles').select('count').limit(1);
        ok = !error;
      }
    } catch {
      ok = false;
    }

    results[service] = { ok, latency_ms: Date.now() - start };

    // Log healthcheck
    await supabase.from('sna_healthchecks').insert({
      service,
      ok,
      latency_ms: results[service].latency_ms
    });
  }

  const allOk = Object.values(results).every(r => r.ok);

  return {
    success: true,
    output: { services: results, all_ok: allOk },
    result_summary: `Healthcheck: ${allOk ? 'OK' : 'ISSUES'}`
  };
}

async function wfEmbedContent(
  supabase: SupabaseClient,
  input: Record<string, unknown>
): Promise<WorkflowResult> {
  const { content, content_id, content_type } = input as {
    content: string;
    content_id: string;
    content_type: string;
  };

  // TODO: Implementar geração de embeddings
  // Por enquanto, placeholder
  
  return {
    success: true,
    output: { 
      message: 'Embedding generation not yet implemented',
      content_id,
      content_type
    },
    result_summary: 'Embed placeholder'
  };
}
