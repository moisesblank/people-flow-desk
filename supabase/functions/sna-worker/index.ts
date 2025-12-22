// ============================================================
// 🔧 SNA WORKER OMEGA v5.0 — PROCESSADOR DE JOBS ENTERPRISE
// Worker assíncrono com 20+ workflows, retry inteligente, DLQ
// Execução: Cron (1min) ou manual via API
// ============================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

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

  // Buscar contexto do aluno
  let studentContext = '';
  try {
    const { data: context } = await supabase.functions.invoke('generate-context', {
      body: { userId: user_id }
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
  const { subjects, hours_per_day = 4, days = 7, exam_date } = input as {
    subjects?: string[];
    hours_per_day?: number;
    days?: number;
    exam_date?: string;
  };

  const subjectList = subjects || ['Química Geral', 'Química Orgânica', 'Físico-Química'];

  const prompt = `Crie um cronograma de estudos otimizado.
Considere: ${hours_per_day}h/dia, ${days} dias, matérias: ${subjectList.join(', ')}.
${exam_date ? `Data do exame: ${exam_date}` : ''}

Retorne em formato JSON:
{
  "schedule": [
    {
      "day": 1,
      "date": "2024-01-15",
      "tasks": [
        { "subject": "Química Orgânica", "duration": 60, "topic": "Nomenclatura", "priority": "high" }
      ]
    }
  ],
  "summary": "Resumo do cronograma",
  "tips": ["Dica 1", "Dica 2"]
}`;

  const response = await callAI('gpt5_mini', [
    { role: 'system', content: 'Crie cronogramas de estudo otimizados. Retorne APENAS JSON.' },
    { role: 'user', content: prompt }
  ], { temperature: 0.3 });

  let schedule = null;
  try {
    const jsonMatch = response.content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      schedule = JSON.parse(jsonMatch[0]);
    }
  } catch {
    return { success: false, error: 'Falha ao parsear cronograma' };
  }

  return {
    success: true,
    output: schedule || { schedule: [] },
    cost_usd: response.cost_usd,
    tokens_in: response.tokens_in,
    tokens_out: response.tokens_out,
    result_summary: `Cronograma: ${schedule?.schedule?.length || 0} dias`
  };
}

async function wfResumo(
  supabase: SupabaseClient,
  input: Record<string, unknown>
): Promise<WorkflowResult> {
  const { content, max_length = 500 } = input as {
    content: string;
    max_length?: number;
  };

  const prompt = `Resuma o seguinte conteúdo em no máximo ${max_length} palavras.
Seja claro, objetivo e mantenha os pontos principais.

Conteúdo:
${content}`;

  const response = await callAI('gemini_flash', [
    { role: 'system', content: 'Você é um especialista em criar resumos educativos claros e concisos.' },
    { role: 'user', content: prompt }
  ], { temperature: 0.3 });

  return {
    success: true,
    output: { summary: response.content },
    cost_usd: response.cost_usd,
    tokens_in: response.tokens_in,
    tokens_out: response.tokens_out,
    result_summary: `Resumo gerado (${response.content.split(' ').length} palavras)`
  };
}

async function wfExercicios(
  supabase: SupabaseClient,
  input: Record<string, unknown>
): Promise<WorkflowResult> {
  const { topic, count = 5, difficulty = 'medium' } = input as {
    topic: string;
    count?: number;
    difficulty?: string;
  };

  const prompt = `Crie ${count} exercícios de ${difficulty} dificuldade sobre: "${topic}"

Retorne JSON:
{
  "exercises": [
    {
      "question": "Enunciado da questão",
      "options": ["A) ...", "B) ...", "C) ...", "D) ...", "E) ..."],
      "correct": "A",
      "explanation": "Explicação detalhada",
      "difficulty": "${difficulty}",
      "topic": "${topic}"
    }
  ]
}`;

  const response = await callAI('gpt5_mini', [
    { role: 'system', content: 'Crie exercícios no estilo de vestibulares de medicina. Retorne APENAS JSON.' },
    { role: 'user', content: prompt }
  ], { temperature: 0.5 });

  let exercises = [];
  try {
    const jsonMatch = response.content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      exercises = parsed.exercises || [];
    }
  } catch {
    return { success: false, error: 'Falha ao parsear exercícios' };
  }

  return {
    success: true,
    output: { exercises_created: exercises.length, exercises },
    cost_usd: response.cost_usd,
    tokens_in: response.tokens_in,
    tokens_out: response.tokens_out,
    result_summary: `${exercises.length} exercícios criados`
  };
}

// ============================================================
// WORKFLOWS - IMPORTAÇÃO
// ============================================================

async function wfImportUrl(
  supabase: SupabaseClient,
  input: Record<string, unknown>
): Promise<WorkflowResult> {
  const { url } = input as { url: string };
  
  // TODO: Implementar scraping real
  return {
    success: true,
    output: { message: 'URL import not yet implemented', url },
    result_summary: 'Import URL placeholder'
  };
}

async function wfImportPdf(
  supabase: SupabaseClient,
  input: Record<string, unknown>
): Promise<WorkflowResult> {
  const { file_url } = input as { file_url: string };
  
  // TODO: Implementar parsing real
  return {
    success: true,
    output: { message: 'PDF import not yet implemented', file_url },
    result_summary: 'Import PDF placeholder'
  };
}

async function wfTranscribe(
  supabase: SupabaseClient,
  input: Record<string, unknown>
): Promise<WorkflowResult> {
  const { audio_url } = input as { audio_url: string };
  
  // TODO: Implementar transcrição real
  return {
    success: true,
    output: { message: 'Transcription not yet implemented', audio_url },
    result_summary: 'Transcribe placeholder'
  };
}

// ============================================================
// WORKFLOWS - LIVE
// ============================================================

async function wfLiveSummary(
  supabase: SupabaseClient,
  input: Record<string, unknown>
): Promise<WorkflowResult> {
  const { questions, live_id } = input as {
    questions: string[];
    live_id: string;
  };

  const prompt = `Analise as perguntas da live e agrupe por tema.
Identifique as dúvidas mais comuns.

Perguntas:
${questions.join('\n')}

Retorne JSON:
{
  "themes": [
    { "name": "Tema", "questions": ["q1", "q2"], "summary": "Resumo" }
  ],
  "most_common": ["Dúvida mais comum 1", "Dúvida 2"],
  "suggestions": ["Sugestão para próxima aula"]
}`;

  const response = await callAI('gemini_flash', [
    { role: 'system', content: 'Analise perguntas de lives educacionais. Retorne APENAS JSON.' },
    { role: 'user', content: prompt }
  ], { temperature: 0.3 });

  let analysis = null;
  try {
    const jsonMatch = response.content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      analysis = JSON.parse(jsonMatch[0]);
    }
  } catch {
    analysis = { themes: [], error: 'Parse failed' };
  }

  return {
    success: true,
    output: { ...analysis, live_id },
    cost_usd: response.cost_usd,
    tokens_in: response.tokens_in,
    tokens_out: response.tokens_out,
    result_summary: `Live summary: ${analysis?.themes?.length || 0} temas`
  };
}

async function wfLiveHighlight(
  supabase: SupabaseClient,
  input: Record<string, unknown>
): Promise<WorkflowResult> {
  const { transcript, live_id } = input as {
    transcript: string;
    live_id: string;
  };

  const prompt = `Extraia os momentos mais importantes desta transcrição de live:

${transcript.slice(0, 5000)}

Retorne JSON:
{
  "highlights": [
    { "timestamp": "00:05:30", "topic": "Tópico", "summary": "Resumo do momento" }
  ],
  "key_concepts": ["Conceito 1", "Conceito 2"],
  "action_items": ["Revisar X", "Estudar Y"]
}`;

  const response = await callAI('gemini_flash', [
    { role: 'system', content: 'Extraia highlights de transcrições. Retorne APENAS JSON.' },
    { role: 'user', content: prompt }
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
