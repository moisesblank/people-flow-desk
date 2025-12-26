// ============================================
// CHAT TRAMON - Assistente de Estudos com IA
// Edge Function para chat contextual
// ============================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

import { getCorsHeaders, handleCorsOptions } from "../_shared/corsConfig.ts";

// System prompt especializado para TRAMON
const SYSTEM_PROMPT = `Você é o TRAMON, um assistente de estudos especializado em química e ciências, criado pelo Professor Moisés Medeiros.

🎯 SUA MISSÃO:
- Ajudar alunos a entenderem o conteúdo das aulas
- Responder dúvidas de forma clara e didática
- Usar exemplos práticos do dia-a-dia
- Motivar e encorajar os estudantes

📚 REGRAS FUNDAMENTAIS:
1. SEMPRE baseie suas respostas no conteúdo da aula fornecido
2. Se a pergunta não estiver relacionada, gentilmente redirecione para o tema
3. Use analogias e exemplos práticos
4. Seja conciso mas completo
5. Encoraje o aluno a continuar estudando
6. Use emojis moderadamente para tornar a conversa mais amigável
7. Se não souber algo, admita e sugira que o aluno pergunte ao professor

💡 ESTILO DE COMUNICAÇÃO:
- Amigável e acessível
- Didático e paciente
- Entusiasmado com o conhecimento
- Respostas estruturadas quando apropriado`;

// Prompt para quando não há transcrição
const GENERAL_PROMPT = `Você é o TRAMON, um assistente de estudos especializado em química e ciências.
Ajude o aluno com suas dúvidas gerais, mas encoraje-o a assistir às aulas para conteúdo específico.`;

serve(async (req) => {
  // LEI VI: CORS dinâmico via allowlist centralizado
  const corsHeaders = getCorsHeaders(req);
  
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return handleCorsOptions(req);
  }

  try {
    const { 
      messages, 
      lessonId, 
      lessonTranscript, 
      lessonTitle,
      stream = false,
      context = {} 
    } = await req.json();

    console.log('📩 TRAMON Chat Request:', { 
      lessonId, 
      lessonTitle,
      hasTranscript: !!lessonTranscript,
      messageCount: messages?.length,
      streaming: stream
    });

    // Validar mensagens
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Mensagens são obrigatórias' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Construir contexto da aula
    let contextBlock = '';
    if (lessonTranscript) {
      contextBlock = `
📖 CONTEXTO DA AULA:
Título: ${lessonTitle || 'Aula sem título'}
Transcrição:
${lessonTranscript.substring(0, 8000)}
${lessonTranscript.length > 8000 ? '\n[Transcrição truncada por limite de tokens]' : ''}
`;
    }

    // Adicionar contexto extra se fornecido
    if (context.courseName) {
      contextBlock += `\n📚 Curso: ${context.courseName}`;
    }
    if (context.moduleTitle) {
      contextBlock += `\n📁 Módulo: ${context.moduleTitle}`;
    }

    // Selecionar prompt apropriado
    const systemContent = lessonTranscript 
      ? `${SYSTEM_PROMPT}\n\n${contextBlock}`
      : GENERAL_PROMPT;

    // Preparar mensagens para a API
    const apiMessages = [
      { role: 'system', content: systemContent },
      ...messages.map((msg: any) => ({
        role: msg.role,
        content: msg.content
      }))
    ];

    // Usar Lovable AI Gateway
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.error('❌ LOVABLE_API_KEY não configurada');
      return new Response(
        JSON.stringify({ error: 'Configuração de IA não encontrada' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: apiMessages,
        stream: stream,
        max_tokens: 1024,
      }),
    });

    // Verificar erros da API
    if (!aiResponse.ok) {
      const errorStatus = aiResponse.status;
      console.error(`❌ AI Gateway error: ${errorStatus}`);

      if (errorStatus === 429) {
        return new Response(
          JSON.stringify({ 
            error: 'Muitas requisições. Aguarde um momento e tente novamente.',
            code: 'RATE_LIMIT'
          }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (errorStatus === 402) {
        return new Response(
          JSON.stringify({ 
            error: 'Créditos de IA esgotados. Entre em contato com o suporte.',
            code: 'CREDITS_EXHAUSTED'
          }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const errorText = await aiResponse.text();
      console.error('AI Error details:', errorText);
      throw new Error(`AI Gateway error: ${errorStatus}`);
    }

    // Se streaming, retornar stream diretamente
    if (stream) {
      console.log('📡 Retornando stream...');
      return new Response(aiResponse.body, {
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive'
        },
      });
    }

    // Resposta não-streaming
    const data = await aiResponse.json();
    const response = data.choices?.[0]?.message?.content;

    if (!response) {
      throw new Error('Resposta vazia da IA');
    }

    console.log('✅ TRAMON response gerada:', response.substring(0, 100) + '...');

    // Opcional: Salvar conversa no banco para análise
    try {
      const authHeader = req.headers.get('Authorization');
      if (authHeader) {
        const supabase = createClient(
          Deno.env.get('SUPABASE_URL')!,
          Deno.env.get('SUPABASE_ANON_KEY')!,
          { global: { headers: { Authorization: authHeader } } }
        );

        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          // Salvar na tabela de conversas (opcional - para analytics)
          await supabase.from('conversas_tramon').insert({
            user_id: user.id,
            mensagem_usuario: messages[messages.length - 1]?.content || '',
            resposta_tramon: response,
            contexto: {
              lesson_id: lessonId,
              lesson_title: lessonTitle,
              has_transcript: !!lessonTranscript
            },
            intencao_detectada: null // Pode ser enriquecido futuramente
          }).select().single();
        }
      }
    } catch (logError) {
      // Não falhar se o log não funcionar
      console.warn('⚠️ Erro ao salvar conversa:', logError);
    }

    return new Response(
      JSON.stringify({ 
        response,
        usage: data.usage || null
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ TRAMON Chat Error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        response: 'Desculpe, não consegui processar sua pergunta. Tente novamente em alguns segundos! 🙏'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
