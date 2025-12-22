// ============================================
// 🧠 GENERATE AI CONTENT - MENTE DIVINA v2.0
// Gera resumos, flashcards, quizzes e mapas mentais
// 🏛️ LEI IV COMPLIANT: Tool Calling para Structured Output
// ============================================

import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Prompts especializados para cada tipo de conteúdo
const PROMPTS: Record<string, string> = {
  summary: `Você é um professor especialista em Química para ENEM. Crie um resumo estruturado e didático do seguinte conteúdo de aula. Use títulos, subtítulos e listas quando apropriado. O resumo deve ser completo mas conciso, focando nos pontos mais cobrados em vestibulares.`,
  
  flashcards: `Você é um especialista em memorização. Crie 10 flashcards para o conteúdo fornecido, focando nos conceitos mais importantes para o ENEM.`,
  
  quiz: `Você é um elaborador de provas no estilo ENEM. Crie 5 questões de múltipla escolha sobre o conteúdo fornecido.`,
  
  mindmap: `Você é um especialista em mapas mentais. Crie um mapa mental em formato Markdown usando hierarquia de títulos (##, ###, ####) para representar os conceitos principais e suas relações.`,

  explanation: `Você é um tutor paciente e didático. Explique o conceito de forma clara e acessível, usando analogias do dia-a-dia quando possível. Inclua exemplos práticos e dicas para o ENEM.`,

  exercises: `Você é um professor que cria exercícios práticos. Crie 5 exercícios de fixação com diferentes níveis de dificuldade (fácil, médio, difícil). Inclua as resoluções passo a passo.`,
};

// ============================================
// 🛠️ TOOL DEFINITIONS - STRUCTURED OUTPUT
// ============================================

const TOOL_DEFINITIONS = {
  flashcards: {
    type: "function",
    function: {
      name: "generate_flashcards",
      description: "Gera flashcards educacionais estruturados para memorização",
      parameters: {
        type: "object",
        properties: {
          flashcards: {
            type: "array",
            description: "Lista de flashcards gerados",
            items: {
              type: "object",
              properties: {
                question: { 
                  type: "string", 
                  description: "Pergunta ou conceito a ser memorizado" 
                },
                answer: { 
                  type: "string", 
                  description: "Resposta ou explicação do conceito" 
                },
                difficulty: { 
                  type: "string", 
                  enum: ["easy", "medium", "hard"],
                  description: "Nível de dificuldade" 
                },
                topic: { 
                  type: "string", 
                  description: "Tópico relacionado" 
                }
              },
              required: ["question", "answer"],
              additionalProperties: false
            }
          }
        },
        required: ["flashcards"],
        additionalProperties: false
      }
    }
  },
  
  quiz: {
    type: "function",
    function: {
      name: "generate_quiz",
      description: "Gera questões de múltipla escolha no estilo ENEM",
      parameters: {
        type: "object",
        properties: {
          questions: {
            type: "array",
            description: "Lista de questões do quiz",
            items: {
              type: "object",
              properties: {
                question: { 
                  type: "string", 
                  description: "Enunciado da questão" 
                },
                options: { 
                  type: "array", 
                  items: { type: "string" },
                  description: "4 alternativas (A, B, C, D)" 
                },
                correct: { 
                  type: "number", 
                  description: "Índice da resposta correta (0-3)" 
                },
                explanation: { 
                  type: "string", 
                  description: "Explicação da resposta correta" 
                },
                difficulty: { 
                  type: "string", 
                  enum: ["easy", "medium", "hard"],
                  description: "Nível de dificuldade" 
                }
              },
              required: ["question", "options", "correct", "explanation"],
              additionalProperties: false
            }
          }
        },
        required: ["questions"],
        additionalProperties: false
      }
    }
  },
  
  exercises: {
    type: "function",
    function: {
      name: "generate_exercises",
      description: "Gera exercícios práticos com resolução",
      parameters: {
        type: "object",
        properties: {
          exercises: {
            type: "array",
            description: "Lista de exercícios",
            items: {
              type: "object",
              properties: {
                statement: { 
                  type: "string", 
                  description: "Enunciado do exercício" 
                },
                difficulty: { 
                  type: "string", 
                  enum: ["easy", "medium", "hard"],
                  description: "Nível de dificuldade" 
                },
                solution: { 
                  type: "string", 
                  description: "Resolução passo a passo" 
                },
                answer: { 
                  type: "string", 
                  description: "Resposta final" 
                }
              },
              required: ["statement", "difficulty", "solution", "answer"],
              additionalProperties: false
            }
          }
        },
        required: ["exercises"],
        additionalProperties: false
      }
    }
  }
};

const TOOL_CHOICES: Record<string, { type: string; function: { name: string } }> = {
  flashcards: { type: "function", function: { name: "generate_flashcards" } },
  quiz: { type: "function", function: { name: "generate_quiz" } },
  exercises: { type: "function", function: { name: "generate_exercises" } }
};

type ContentType = 'summary' | 'flashcards' | 'quiz' | 'mindmap' | 'explanation' | 'exercises';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  console.log('[generate-ai-content] 🧠 Iniciando processamento v2.0 (Tool Calling)...');

  try {
    const { lessonId, contentType, customPrompt } = await req.json();

    if (!lessonId || !contentType) {
      return new Response(
        JSON.stringify({ error: 'lessonId e contentType são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!PROMPTS[contentType] && !customPrompt) {
      return new Response(
        JSON.stringify({ error: `Tipo de conteúdo inválido: ${contentType}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verifica autenticação
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Não autorizado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error('[generate-ai-content] Erro de autenticação:', authError?.message);
      return new Response(
        JSON.stringify({ error: 'Não autorizado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[generate-ai-content] 👤 Usuário: ${user.id}, Tipo: ${contentType}, Aula: ${lessonId}`);

    // Verifica cache existente
    const { data: cached } = await supabase
      .from('ai_generated_content')
      .select('content')
      .eq('lesson_id', lessonId)
      .eq('content_type', contentType)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (cached) {
      console.log('[generate-ai-content] 📦 Cache HIT');
      return new Response(
        JSON.stringify({ content: cached.content, cached: true, latency_ms: Date.now() - startTime }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json', 'X-Cache': 'HIT' } }
      );
    }

    // Busca dados da aula
    const { data: lesson, error: lessonError } = await supabase
      .from('lessons')
      .select('title, description, transcript, content')
      .eq('id', lessonId)
      .single();

    if (lessonError || !lesson) {
      console.error('[generate-ai-content] Aula não encontrada:', lessonError?.message);
      return new Response(
        JSON.stringify({ error: 'Aula não encontrada' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Construir contexto da aula
    const lessonContent = lesson.transcript || lesson.content || lesson.description || '';
    
    if (!lessonContent || lessonContent.length < 50) {
      console.error('[generate-ai-content] Conteúdo insuficiente para gerar IA');
      return new Response(
        JSON.stringify({ error: 'Conteúdo da aula insuficiente para geração de IA' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Usar Lovable AI Gateway
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.error('[generate-ai-content] LOVABLE_API_KEY não configurada');
      return new Response(
        JSON.stringify({ error: 'Configuração do servidor incompleta' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const systemPrompt = customPrompt || PROMPTS[contentType as ContentType];
    const userPrompt = `Título da aula: ${lesson.title}\n\nConteúdo:\n${lessonContent.substring(0, 8000)}`;

    // ============================================
    // 🛠️ TOOL CALLING PARA STRUCTURED OUTPUT
    // ============================================
    
    const useToolCalling = ['flashcards', 'quiz', 'exercises'].includes(contentType);
    
    const requestBody: Record<string, unknown> = {
      model: 'google/gemini-2.5-flash',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
    };

    // Adicionar tools para tipos estruturados
    if (useToolCalling && TOOL_DEFINITIONS[contentType as keyof typeof TOOL_DEFINITIONS]) {
      requestBody.tools = [TOOL_DEFINITIONS[contentType as keyof typeof TOOL_DEFINITIONS]];
      requestBody.tool_choice = TOOL_CHOICES[contentType];
      console.log(`[generate-ai-content] 🛠️ Tool Calling ativado: ${contentType}`);
    }

    console.log('[generate-ai-content] 🚀 Chamando Lovable AI Gateway...');

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!aiResponse.ok) {
      const errorStatus = aiResponse.status;
      
      if (errorStatus === 429) {
        console.error('[generate-ai-content] ⚠️ Rate limit excedido');
        return new Response(
          JSON.stringify({ error: 'Limite de requisições excedido. Tente novamente em alguns minutos.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (errorStatus === 402) {
        console.error('[generate-ai-content] 💰 Créditos insuficientes');
        return new Response(
          JSON.stringify({ error: 'Créditos de IA esgotados. Entre em contato com o suporte.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const errorText = await aiResponse.text();
      console.error('[generate-ai-content] ❌ Erro na API:', errorStatus, errorText);
      return new Response(
        JSON.stringify({ error: 'Erro ao gerar conteúdo com IA' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const aiData = await aiResponse.json();
    
    // ============================================
    // 📦 PROCESSAR RESPOSTA (TOOL CALL OU TEXTO)
    // ============================================
    
    let processedContent: unknown;
    let usedToolCall = false;

    // Verificar se veio tool_call
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    
    if (toolCall && toolCall.function?.arguments) {
      try {
        const toolArguments = JSON.parse(toolCall.function.arguments);
        
        // Extrair o array correto baseado no tipo
        if (contentType === 'flashcards' && toolArguments.flashcards) {
          processedContent = toolArguments.flashcards;
        } else if (contentType === 'quiz' && toolArguments.questions) {
          processedContent = toolArguments.questions;
        } else if (contentType === 'exercises' && toolArguments.exercises) {
          processedContent = toolArguments.exercises;
        } else {
          processedContent = toolArguments;
        }
        
        usedToolCall = true;
        console.log(`[generate-ai-content] ✅ Tool Call parseado com sucesso: ${toolCall.function.name}`);
      } catch (parseError) {
        console.warn('[generate-ai-content] ⚠️ Erro ao parsear tool_call:', parseError);
      }
    }

    // Fallback para content normal se tool_call falhar
    if (!processedContent) {
      const generatedContent = aiData.choices?.[0]?.message?.content;

      if (!generatedContent) {
        console.error('[generate-ai-content] ❌ Resposta vazia da IA');
        return new Response(
          JSON.stringify({ error: 'Não foi possível gerar o conteúdo' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      processedContent = generatedContent;

      // Tentar extrair JSON do conteúdo texto (legacy fallback)
      if (['flashcards', 'quiz', 'exercises'].includes(contentType)) {
        try {
          const jsonMatch = generatedContent.match(/\[[\s\S]*\]/);
          if (jsonMatch) {
            processedContent = JSON.parse(jsonMatch[0]);
          }
        } catch (parseError) {
          console.warn('[generate-ai-content] ⚠️ Fallback JSON parse falhou:', parseError);
        }
      }
    }

    console.log(`[generate-ai-content] 📊 Conteúdo processado [tool_call=${usedToolCall}]`);

    // Salvar no cache
    const tokensUsed = aiData.usage?.total_tokens || 0;

    try {
      await supabase.from('ai_generated_content').insert({
        lesson_id: lessonId,
        content_type: contentType,
        content: typeof processedContent === 'string' ? { text: processedContent } : processedContent,
        model_used: 'google/gemini-2.5-flash',
        tokens_used: tokensUsed,
      });
      console.log('[generate-ai-content] 💾 Conteúdo salvo no cache');
    } catch (cacheError) {
      console.warn('[generate-ai-content] ⚠️ Erro ao salvar cache:', cacheError);
    }

    const latencyMs = Date.now() - startTime;
    console.log(`[generate-ai-content] ✅ Concluído em ${latencyMs}ms [tokens=${tokensUsed}]`);

    return new Response(
      JSON.stringify({ 
        content: processedContent, 
        cached: false,
        tool_call_used: usedToolCall,
        tokens_used: tokensUsed,
        latency_ms: latencyMs
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json', 'X-Cache': 'MISS' } }
    );

  } catch (error) {
    console.error('[generate-ai-content] ❌ Erro interno:', error);
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
