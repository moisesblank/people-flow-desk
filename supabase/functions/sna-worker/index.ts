// ============================================================
// 🔧 SNA WORKER OMEGA v5.0 — PROCESSADOR DE JOBS ENTERPRISE
// Worker assíncrono com 15+ workflows, retry inteligente, DLQ
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
  attempts: number;
  max_attempts: number;
  created_by: string | null;
  priority: number;
  correlation_id: string;
  metadata: Record<string, unknown>;
}

interface WorkflowResult {
  success: boolean;
  output?: Record<string, unknown>;
  error?: string;
  cost_usd?: number;
  tokens_in?: number;
  tokens_out?: number;
  result_summary?: string;
}

// ============================================================
// CONFIGURAÇÃO
// ============================================================

const WORKER_ID = `sna-worker-${crypto.randomUUID().slice(0, 8)}`;
const MAX_BATCH_SIZE = 10;
const JOB_TIMEOUT_MS = 180000; // 3 minutos

const LOVABLE_AI_URL = 'https://ai.gateway.lovable.dev/v1/chat/completions';

// ============================================================
// HANDLER PRINCIPAL
// ============================================================

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  const results: Array<{ job_id: string; job_type: string; status: string; time_ms: number; cost_usd?: number }> = [];

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const body = await req.json().catch(() => ({}));
    const jobTypes: string[] | null = body.job_types || null;
    const batchSize = Math.min(body.batch_size || 5, MAX_BATCH_SIZE);
    const maxPriority = body.max_priority ?? 5;

    console.log(`🔧 SNA Worker ${WORKER_ID} starting [batch=${batchSize}, maxPriority=${maxPriority}]`);

    // 1. CLEANUP AUTOMÁTICO
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

    // 2. CLAIM JOBS
    const { data: jobs, error: claimError } = await supabase.rpc('sna_claim_jobs', {
      p_worker_id: WORKER_ID,
      p_job_types: jobTypes,
      p_max_priority: maxPriority,
      p_limit: batchSize
    });

    if (claimError) {
      console.error('❌ Error claiming jobs:', claimError);
      return errorResponse(500, 'Erro ao obter jobs');
    }

    if (!jobs || jobs.length === 0) {
      console.log('📭 No jobs to process');
      return new Response(JSON.stringify({
        status: 'idle',
        message: 'Nenhum job na fila',
        worker_id: WORKER_ID,
        cleanup: cleanupResult
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`📥 Claimed ${jobs.length} jobs`);

    // 3. PROCESSAR JOBS EM PARALELO (respeitando limites)
    const jobPromises = (jobs as SNAJob[]).map(job => processJobWithTimeout(supabase, job));
    const jobResults = await Promise.allSettled(jobPromises);

    // 4. REGISTRAR RESULTADOS
    for (let i = 0; i < jobs.length; i++) {
      const job = jobs[i] as SNAJob;
      const result = jobResults[i];
      const jobTime = Date.now() - startTime;

      if (result.status === 'fulfilled') {
        const { success, output, cost_usd, tokens_in, tokens_out, result_summary, error } = result.value;

        if (success) {
          await supabase.rpc('sna_complete_job', {
            p_job_id: job.id,
            p_output: output || {},
            p_cost_usd: cost_usd || 0,
            p_tokens_in: tokens_in || 0,
            p_tokens_out: tokens_out || 0,
            p_result_summary: result_summary
          });

          results.push({
            job_id: job.id,
            job_type: job.job_type,
            status: 'succeeded',
            time_ms: jobTime,
            cost_usd
          });
          console.log(`✅ Job ${job.id} (${job.job_type}) completed`);
        } else {
          await supabase.rpc('sna_fail_job', {
            p_job_id: job.id,
            p_error: { message: error || 'Unknown error', attempt: job.attempts }
          });

          results.push({
            job_id: job.id,
            job_type: job.job_type,
            status: job.attempts >= job.max_attempts - 1 ? 'dead' : 'retry',
            time_ms: jobTime
          });
          console.log(`❌ Job ${job.id} (${job.job_type}) failed: ${error}`);
        }
      } else {
        // Promise rejeitada
        await supabase.rpc('sna_fail_job', {
          p_job_id: job.id,
          p_error: { message: result.reason?.message || 'Promise rejected' }
        });

        results.push({
          job_id: job.id,
          job_type: job.job_type,
          status: 'error',
          time_ms: jobTime
        });
        console.error(`❌ Job ${job.id} rejected:`, result.reason);
      }
    }

    const totalTime = Date.now() - startTime;
    const successCount = results.filter(r => r.status === 'succeeded').length;
    const totalCost = results.reduce((sum, r) => sum + (r.cost_usd || 0), 0);

    console.log(`🏁 SNA Worker completed: ${successCount}/${results.length} jobs in ${totalTime}ms (cost: $${totalCost.toFixed(6)})`);

    return new Response(JSON.stringify({
      status: 'completed',
      worker_id: WORKER_ID,
      jobs_processed: results.length,
      jobs_succeeded: successCount,
      total_cost_usd: totalCost,
      results,
      total_time_ms: totalTime
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ SNA Worker Error:', error);
    return errorResponse(500, error instanceof Error ? error.message : 'Erro interno');
  }
});

// ============================================================
// PROCESSAMENTO COM TIMEOUT
// ============================================================

async function processJobWithTimeout(
  supabase: SupabaseClient,
  job: SNAJob
): Promise<WorkflowResult> {
  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      resolve({ success: false, error: 'Job timeout exceeded' });
    }, JOB_TIMEOUT_MS);

    processJob(supabase, job)
      .then(resolve)
      .catch(err => resolve({ success: false, error: err.message }))
      .finally(() => clearTimeout(timeout));
  });
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

    default:
      return { success: false, error: `Workflow não suportado: ${job_type}` };
  }
}

// ============================================================
// WORKFLOWS IMPLEMENTADOS
// ============================================================

// WF-TUTOR-01: Resposta do tutor básica
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

// WF-TUTOR-CONTEXT: Tutor com contexto do aluno
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

// WF-FLASHCARDS: Geração de flashcards
async function wfFlashcards(
  supabase: SupabaseClient,
  input: Record<string, unknown>
): Promise<WorkflowResult> {
  const { topic, lesson_id, user_id, count = 10 } = input as {
    topic: string;
    lesson_id?: string;
    user_id: string;
    count?: number;
  };

  const prompt = `Gere ${count} flashcards de alta qualidade sobre: "${topic}"

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
  ]);

  // Parse JSON
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

  // Salvar
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
        source: 'sna_generated',
        metadata: { why_important: fc.why_important }
      }))
    );

    if (error) {
      return { success: false, error: `Erro ao salvar: ${error.message}` };
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

// WF-MINDMAP: Mapa mental
async function wfMindmap(
  supabase: SupabaseClient,
  input: Record<string, unknown>
): Promise<WorkflowResult> {
  const { topic, depth = 3 } = input as { topic: string; depth?: number };

  const prompt = `Crie um mapa mental completo sobre: "${topic}"

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
  ]);

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

// WF-CRONOGRAMA: Cronograma de estudos
async function wfCronograma(
  supabase: SupabaseClient,
  input: Record<string, unknown>
): Promise<WorkflowResult> {
  const { exam_date, subjects, hours_per_day, user_id } = input as {
    exam_date: string;
    subjects: string[];
    hours_per_day: number;
    user_id: string;
  };

  // Calcular dias até a prova
  const daysUntilExam = Math.ceil((new Date(exam_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));

  const prompt = `Crie um cronograma de estudos científico para vestibular de Medicina.

Dados:
- Dias até a prova: ${daysUntilExam}
- Matérias: ${subjects.join(', ')}
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
    output: { cronograma, days_until_exam: daysUntilExam },
    cost_usd: response.cost_usd,
    tokens_in: response.tokens_in,
    tokens_out: response.tokens_out,
    result_summary: `Cronograma: ${cronograma?.meta?.weeks || 0} semanas`
  };
}

// WF-RESUMO: Resumo de conteúdo
async function wfResumo(
  supabase: SupabaseClient,
  input: Record<string, unknown>
): Promise<WorkflowResult> {
  const { content, format = 'bullet' } = input as { content: string; format?: 'bullet' | 'paragraph' | 'outline' };

  const prompt = `Resuma o seguinte conteúdo no formato ${format}:

${content.slice(0, 10000)}

Formato de saída:
- bullet: lista com bullets
- paragraph: 2-3 parágrafos
- outline: estrutura hierárquica

Inclua:
- Conceitos-chave em **negrito**
- Conexões com vestibular
- Dica de memorização`;

  const response = await callAI('gemini_flash', [
    { role: 'system', content: 'Crie resumos concisos e didáticos.' },
    { role: 'user', content: prompt }
  ]);

  return {
    success: true,
    output: { summary: response.content, format },
    cost_usd: response.cost_usd,
    tokens_in: response.tokens_in,
    tokens_out: response.tokens_out,
    result_summary: `Resumo ${format} gerado`
  };
}

// WF-EXERCICIOS: Geração de exercícios
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

  return {
    success: true,
    output: { questions, count: questions.length },
    cost_usd: response.cost_usd,
    tokens_in: response.tokens_in,
    tokens_out: response.tokens_out,
    result_summary: `${questions.length} questões geradas`
  };
}

// WF-IMPORT-URL: Importar de URL
async function wfImportUrl(
  supabase: SupabaseClient,
  input: Record<string, unknown>
): Promise<WorkflowResult> {
  const { url, admin_id } = input as { url: string; admin_id: string };

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

  let questions = [];
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

// WF-IMPORT-PDF: Importar de PDF
async function wfImportPdf(
  supabase: SupabaseClient,
  input: Record<string, unknown>
): Promise<WorkflowResult> {
  const { file_path, admin_id } = input as { file_path: string; admin_id: string };

  // TODO: Implementar extração de PDF via storage
  return {
    success: false,
    error: 'WF-IMPORT-PDF: Implementação pendente'
  };
}

// WF-TRANSCRIBE: Transcrever áudio/vídeo
async function wfTranscribe(
  supabase: SupabaseClient,
  input: Record<string, unknown>
): Promise<WorkflowResult> {
  const { audio_url } = input as { audio_url: string };

  // TODO: Implementar via Whisper API
  return {
    success: false,
    error: 'WF-TRANSCRIBE: Implementação pendente'
  };
}

// WF-LIVE-SUMMARY: Resumo de chat da live
async function wfLiveSummary(
  supabase: SupabaseClient,
  input: Record<string, unknown>
): Promise<WorkflowResult> {
  const { live_id, window_minutes = 5 } = input as { live_id: string; window_minutes?: number };

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

  const chatLog = messages.map(m => `${m.user_name}: ${m.content}`).join('\n');

  const response = await callAI('gemini_flash', [
    { role: 'system', content: 'Analise chat de aula ao vivo. Retorne JSON.' },
    { role: 'user', content: `Analise e retorne JSON com top_questions, hot_topics, alerts:\n\n${chatLog}` }
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
    cost_usd: response.cost_usd,
    tokens_in: response.tokens_in,
    tokens_out: response.tokens_out,
    result_summary: `${messages.length} mensagens analisadas`
  };
}

// WF-LIVE-HIGHLIGHT: Destacar perguntas importantes
async function wfLiveHighlight(
  supabase: SupabaseClient,
  input: Record<string, unknown>
): Promise<WorkflowResult> {
  const { live_id, message_ids } = input as { live_id: string; message_ids: string[] };

  // Marcar mensagens como destacadas
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

// WF-EMAIL: Enviar email
async function wfEmail(
  supabase: SupabaseClient,
  input: Record<string, unknown>
): Promise<WorkflowResult> {
  const { to, template, context } = input as {
    to: string;
    template: string;
    context: Record<string, unknown>;
  };

  const response = await callAI('gpt5_mini', [
    { role: 'system', content: 'Gere email profissional. Retorne JSON com subject e body_html.' },
    { role: 'user', content: `Template: ${template}\nContexto: ${JSON.stringify(context)}` }
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

  // Enviar
  const { error } = await supabase.functions.invoke('send-email', {
    body: { to, subject: email.subject, html: email.body_html }
  });

  if (error) {
    return { success: false, error: `Erro ao enviar: ${error.message}` };
  }

  return {
    success: true,
    output: { email_sent: true, to, subject: email.subject },
    cost_usd: response.cost_usd,
    result_summary: `Email enviado para ${to}`
  };
}

// WF-WHATSAPP: Responder WhatsApp
async function wfWhatsApp(
  supabase: SupabaseClient,
  input: Record<string, unknown>
): Promise<WorkflowResult> {
  const { phone, message, lead_id } = input as {
    phone: string;
    message: string;
    lead_id?: string;
  };

  const response = await callAI('gpt5_nano', [
    { role: 'system', content: 'Você é TRAMON, assistente do Prof. Moisés. Máximo 280 caracteres.' },
    { role: 'user', content: message }
  ]);

  const reply = response.content.slice(0, 280);

  // Enviar via WhatsApp
  const waToken = Deno.env.get('WHATSAPP_ACCESS_TOKEN');
  const waPhoneId = Deno.env.get('WHATSAPP_PHONE_NUMBER_ID');

  if (waToken && waPhoneId) {
    await fetch(`https://graph.facebook.com/v18.0/${waPhoneId}/messages`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${waToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: phone,
        type: 'text',
        text: { body: reply }
      })
    });
  }

  return {
    success: true,
    output: { response: reply, sent: !!waToken },
    cost_usd: response.cost_usd,
    result_summary: `WhatsApp: ${reply.slice(0, 50)}...`
  };
}

// WF-NOTIFICATION: Criar notificação
async function wfNotification(
  supabase: SupabaseClient,
  input: Record<string, unknown>
): Promise<WorkflowResult> {
  const { user_id, title, message, type = 'info' } = input as {
    user_id: string;
    title: string;
    message: string;
    type?: string;
  };

  const { error } = await supabase.from('notifications').insert({
    user_id,
    title,
    message,
    type,
    is_read: false
  });

  if (error) {
    return { success: false, error: error.message };
  }

  return {
    success: true,
    output: { notification_created: true },
    result_summary: `Notificação criada: ${title}`
  };
}

// WF-ANALYZE-CHURN: Análise de churn
async function wfAnalyzeChurn(
  supabase: SupabaseClient,
  input: Record<string, unknown>
): Promise<WorkflowResult> {
  // Buscar alunos inativos
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  
  const { data: inactiveStudents } = await supabase
    .from('alunos')
    .select('id, nome, email, ultimo_acesso')
    .lt('ultimo_acesso', thirtyDaysAgo)
    .eq('status', 'ativo')
    .limit(100);

  const response = await callAI('gemini_pro', [
    { role: 'system', content: 'Analise risco de churn. Retorne JSON com recommendations.' },
    { role: 'user', content: `Alunos inativos: ${JSON.stringify(inactiveStudents)}` }
  ]);

  let analysis = null;
  try {
    const jsonMatch = response.content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      analysis = JSON.parse(jsonMatch[0]);
    }
  } catch {
    analysis = { raw: response.content };
  }

  return {
    success: true,
    output: { analysis, students_analyzed: inactiveStudents?.length || 0 },
    cost_usd: response.cost_usd,
    result_summary: `${inactiveStudents?.length || 0} alunos analisados`
  };
}

// WF-REPORT-WEEKLY: Relatório semanal
async function wfWeeklyReport(
  supabase: SupabaseClient,
  input: Record<string, unknown>
): Promise<WorkflowResult> {
  // Coletar métricas
  const { data: metrics } = await supabase.rpc('sna_get_metrics', { p_hours: 168 }); // 7 dias

  const response = await callAI('gpt5', [
    { role: 'system', content: 'Gere relatório executivo semanal. Inclua insights e recomendações.' },
    { role: 'user', content: `Métricas da semana: ${JSON.stringify(metrics)}` }
  ]);

  return {
    success: true,
    output: { report: response.content, metrics },
    cost_usd: response.cost_usd,
    result_summary: 'Relatório semanal gerado'
  };
}

// WF-HEALTHCHECK: Verificar saúde dos serviços
async function wfHealthcheck(
  supabase: SupabaseClient,
  input: Record<string, unknown>
): Promise<WorkflowResult> {
  const { services = ['gemini_flash', 'gpt5_mini'] } = input as { services?: string[] };
  const results: Record<string, { ok: boolean; latency_ms: number; error?: string }> = {};

  for (const service of services) {
    const start = Date.now();
    try {
      const response = await callAI(service, [
        { role: 'user', content: 'Responda apenas: OK' }
      ]);

      results[service] = {
        ok: response.content.toLowerCase().includes('ok'),
        latency_ms: Date.now() - start
      };

      // Registrar healthcheck
      await supabase.from('sna_healthchecks').insert({
        service,
        ok: results[service].ok,
        latency_ms: results[service].latency_ms,
        response_preview: response.content.slice(0, 100)
      });
    } catch (error) {
      results[service] = {
        ok: false,
        latency_ms: Date.now() - start,
        error: error instanceof Error ? error.message : 'Unknown'
      };

      await supabase.from('sna_healthchecks').insert({
        service,
        ok: false,
        latency_ms: results[service].latency_ms,
        error_message: results[service].error
      });
    }
  }

  const allOk = Object.values(results).every(r => r.ok);

  return {
    success: true,
    output: { healthchecks: results, all_ok: allOk },
    result_summary: allOk ? 'Todos serviços OK' : 'Alguns serviços com problemas'
  };
}

// WF-EMBED-CONTENT: Gerar embeddings
async function wfEmbedContent(
  supabase: SupabaseClient,
  input: Record<string, unknown>
): Promise<WorkflowResult> {
  const { content, source_type, source_id } = input as {
    content: string;
    source_type: string;
    source_id: string;
  };

  // TODO: Implementar via OpenAI embeddings API
  return {
    success: false,
    error: 'WF-EMBED-CONTENT: Implementação pendente'
  };
}

// ============================================================
// FUNÇÃO DE CHAMADA À IA
// ============================================================

const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

const MODEL_MAP: Record<string, { model: string; costIn: number; costOut: number }> = {
  'gemini_flash': { model: 'google/gemini-2.0-flash-exp', costIn: 0.075, costOut: 0.30 },
  'gemini_pro': { model: 'google/gemini-pro-1.5', costIn: 1.25, costOut: 5.00 },
  'gpt5': { model: 'openai/gpt-5', costIn: 5.00, costOut: 15.00 },
  'gpt5_mini': { model: 'openai/gpt-5-mini', costIn: 0.15, costOut: 0.60 },
  'gpt5_nano': { model: 'openai/gpt-5-nano', costIn: 0.10, costOut: 0.40 },
};

async function callAI(
  provider: string,
  messages: Array<{ role: string; content: string }>
): Promise<{ content: string; cost_usd: number; tokens_in: number; tokens_out: number }> {
  const config = MODEL_MAP[provider] || MODEL_MAP['gpt5_mini'];

  const response = await fetch(LOVABLE_AI_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${LOVABLE_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ model: config.model, messages })
  });

  if (!response.ok) {
    throw new Error(`AI call failed: ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || '';
  const usage = data.usage || {};

  const tokens_in = usage.prompt_tokens || Math.ceil(JSON.stringify(messages).length / 4);
  const tokens_out = usage.completion_tokens || Math.ceil(content.length / 4);
  const cost_usd = (tokens_in * config.costIn + tokens_out * config.costOut) / 1000000;

  return { content, cost_usd, tokens_in, tokens_out };
}

function errorResponse(status: number, message: string) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}
