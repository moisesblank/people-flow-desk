// ============================================
// 🌌🔥 BOOK CHAT AI — EDGE FUNCTION NÍVEL NASA 🔥🌌
// ANO 2300 — CHAT INTEGRADO COM IA PARA LIVRO WEB
// ESTE É O PROJETO DA VIDA DO MESTRE MOISÉS MEDEIROS
// ============================================
//
// 📍 MAPA DE URLs DEFINITIVO:
//   🌐 NÃO PAGANTE: pro.moisesmedeiros.com.br/ + /comunidade
//   👨‍🎓 ALUNO BETA: pro.moisesmedeiros.com.br/alunos
//   👔 FUNCIONÁRIO: gestao.moisesmedeiros.com.br/gestao
//   👑 OWNER: TODAS (moisesblank@gmail.com = MASTER)
//
// FLUXO:
// 1. Recebe mensagem do aluno com contexto do livro
// 2. Gera resposta com IA (GPT ou Gemini)
// 3. Persiste conversa
// 4. Retorna resposta formatada
//
// ============================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ============================================
// CONSTANTES
// ============================================
const OWNER_EMAIL = "moisesblank@gmail.com";
const MAX_MESSAGE_LENGTH = 2000;
const MAX_HISTORY_MESSAGES = 10;

// ============================================
// CORS HEADERS
// ============================================
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// ============================================
// TIPOS
// ============================================
interface ChatRequest {
  bookId: string;
  threadId?: string;
  message: string;
  pageNumber?: number;
  chapterTitle?: string;
  selectedText?: string;
}

interface ChatResponse {
  success: boolean;
  message?: string;
  threadId?: string;
  messageId?: string;
  error?: string;
}

// ============================================
// SYSTEM PROMPT
// ============================================
const SYSTEM_PROMPT = `Você é o TRAMON, o tutor de química do Prof. Moisés Medeiros.

CONTEXTO:
- Você está ajudando um aluno que está lendo um livro/material didático de química
- O aluno pode fazer perguntas sobre o conteúdo, pedir explicações, exemplos
- Seja didático, claro e preciso
- Use linguagem acessível, mas cientificamente correta
- Quando apropriado, use analogias e exemplos do cotidiano
- Incentive o aluno a continuar estudando

REGRAS:
1. Responda APENAS sobre química e temas relacionados
2. Se a pergunta não for sobre química, redirecione educadamente
3. Cite a página ou trecho quando relevante
4. Mantenha respostas concisas mas completas
5. Use emojis moderadamente para engajar (🧪, ⚗️, 🔬, etc.)
6. Sempre termine com uma pergunta ou incentivo

ASSINATURA:
Prof. Moisés Medeiros - moisesmedeiros.com.br`;

// ============================================
// FUNÇÃO PRINCIPAL
// ============================================
serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ success: false, error: "Método não permitido" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    // ============================================
    // 1) AUTENTICAÇÃO
    // ============================================
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ success: false, error: "Não autorizado" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: "Token inválido" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ============================================
    // 2) PARSE REQUEST
    // ============================================
    const body: ChatRequest = await req.json();
    const { bookId, threadId, message, pageNumber, chapterTitle, selectedText } = body;

    if (!bookId || !message) {
      return new Response(
        JSON.stringify({ success: false, error: "bookId e message são obrigatórios" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (message.length > MAX_MESSAGE_LENGTH) {
      return new Response(
        JSON.stringify({ success: false, error: `Mensagem muito longa. Máximo: ${MAX_MESSAGE_LENGTH} caracteres` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ============================================
    // 3) VERIFICAR ACESSO AO LIVRO
    // ============================================
    const { data: book } = await supabase
      .from("web_books")
      .select("id, title, allow_chat")
      .eq("id", bookId)
      .single();

    if (!book) {
      return new Response(
        JSON.stringify({ success: false, error: "Livro não encontrado" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!book.allow_chat) {
      return new Response(
        JSON.stringify({ success: false, error: "Chat desabilitado para este livro" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ============================================
    // 4) CRIAR OU BUSCAR THREAD
    // ============================================
    let currentThreadId = threadId;

    if (!currentThreadId) {
      // Criar nova thread
      const { data: newThread, error: threadError } = await supabase
        .from("book_chat_threads")
        .insert({
          user_id: user.id,
          book_id: bookId,
          initial_page: pageNumber,
          initial_chapter: chapterTitle,
        })
        .select("id")
        .single();

      if (threadError) {
        console.error("[Book Chat] Erro criar thread:", threadError);
        return new Response(
          JSON.stringify({ success: false, error: "Erro ao criar conversa" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      currentThreadId = newThread.id;
    }

    // ============================================
    // 5) BUSCAR HISTÓRICO
    // ============================================
    const { data: history } = await supabase
      .from("book_chat_messages")
      .select("role, content")
      .eq("thread_id", currentThreadId)
      .order("created_at", { ascending: true })
      .limit(MAX_HISTORY_MESSAGES);

    // ============================================
    // 6) PREPARAR CONTEXTO
    // ============================================
    let contextMessage = "";
    
    if (pageNumber) {
      contextMessage += `[Página ${pageNumber}] `;
    }
    if (chapterTitle) {
      contextMessage += `[Capítulo: ${chapterTitle}] `;
    }
    if (selectedText) {
      contextMessage += `\n[Trecho selecionado: "${selectedText.substring(0, 500)}"]\n`;
    }
    contextMessage += message;

    // ============================================
    // 7) PERSISTIR MENSAGEM DO USUÁRIO
    // ============================================
    const { data: userMessage, error: userMsgError } = await supabase
      .from("book_chat_messages")
      .insert({
        thread_id: currentThreadId,
        user_id: user.id,
        book_id: bookId,
        page_number: pageNumber,
        chapter_title: chapterTitle,
        role: "user",
        content: message,
        content_reference: selectedText ? { selectedText } : null,
      })
      .select("id")
      .single();

    if (userMsgError) {
      console.error("[Book Chat] Erro salvar mensagem:", userMsgError);
    }

    // ============================================
    // 8) CHAMAR IA
    // ============================================
    const startTime = Date.now();
    let aiResponse = "";
    let tokensInput = 0;
    let tokensOutput = 0;
    let modelUsed = "gpt-4o-mini";

    const openaiKey = Deno.env.get("OPENAI_API_KEY");

    if (openaiKey) {
      try {
        const messages = [
          { role: "system", content: SYSTEM_PROMPT },
          ...(history || []).map(m => ({ role: m.role, content: m.content })),
          { role: "user", content: contextMessage },
        ];

        const response = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${openaiKey}`,
          },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            messages,
            max_tokens: 1000,
            temperature: 0.7,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          aiResponse = data.choices?.[0]?.message?.content || "Desculpe, não consegui gerar uma resposta.";
          tokensInput = data.usage?.prompt_tokens || 0;
          tokensOutput = data.usage?.completion_tokens || 0;
        } else {
          throw new Error(`OpenAI error: ${response.status}`);
        }
      } catch (err) {
        console.error("[Book Chat] Erro OpenAI:", err);
        aiResponse = "Desculpe, estou com dificuldades técnicas. Por favor, tente novamente em alguns instantes. 🔧";
      }
    } else {
      // Fallback sem IA
      aiResponse = `Olá! 👋 Recebi sua pergunta sobre "${message.substring(0, 50)}...". 

Infelizmente, o sistema de IA está temporariamente indisponível. Por favor, tente novamente mais tarde ou consulte o material do curso.

📚 Continue estudando!

Prof. Moisés Medeiros`;
    }

    const responseTime = Date.now() - startTime;

    // ============================================
    // 9) PERSISTIR RESPOSTA DA IA
    // ============================================
    const { data: assistantMessage, error: assistantMsgError } = await supabase
      .from("book_chat_messages")
      .insert({
        thread_id: currentThreadId,
        user_id: user.id,
        book_id: bookId,
        page_number: pageNumber,
        chapter_title: chapterTitle,
        role: "assistant",
        content: aiResponse,
        model_used: modelUsed,
        tokens_input: tokensInput,
        tokens_output: tokensOutput,
        response_time_ms: responseTime,
      })
      .select("id")
      .single();

    if (assistantMsgError) {
      console.error("[Book Chat] Erro salvar resposta:", assistantMsgError);
    }

    // ============================================
    // 10) RESPOSTA
    // ============================================
    const chatResponse: ChatResponse = {
      success: true,
      message: aiResponse,
      threadId: currentThreadId,
      messageId: assistantMessage?.id,
    };

    return new Response(
      JSON.stringify(chatResponse),
      { 
        status: 200, 
        headers: { 
          ...corsHeaders, 
          "Content-Type": "application/json",
          "X-Response-Time": responseTime.toString(),
        } 
      }
    );

  } catch (err) {
    console.error("[Book Chat] Erro fatal:", err);
    
    return new Response(
      JSON.stringify({ success: false, error: "Erro interno do servidor" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
