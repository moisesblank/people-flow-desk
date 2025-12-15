// ============================================
// MOISES MEDEIROS v7.0 - AI TUTOR (PILAR 7)
// Tutor Virtual com IA para auxílio educacional
// Spider-Man Theme Edition
// ============================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, lessonContext, mode } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    // System prompts baseados no modo
    const systemPrompts: Record<string, string> = {
      tutor: `Você é o Tutor IA do Professor Moisés Medeiros, um assistente educacional especializado em Química para vestibulares de Medicina.

CONTEXTO DA AULA ATUAL:
${lessonContext || "Nenhum contexto de aula fornecido."}

DIRETRIZES:
- Responda de forma clara, didática e encorajadora
- Você é especialista em Química (Orgânica, Inorgânica, Físico-Química, Bioquímica)
- Use exemplos práticos relacionados à Medicina quando possível
- Se a dúvida for sobre um tema específico da aula, referencie o conteúdo
- Para questões fora do escopo de Química, redirecione gentilmente
- Sugira exercícios práticos quando apropriado
- Mantenha respostas concisas mas completas
- Use linguagem acessível e motivadora
- Lembre que o objetivo final é aprovação em Medicina`,

      redacao: `Você é um corretor especializado de redações para concursos e vestibulares.

CRITÉRIOS DE AVALIAÇÃO (0-200 pontos cada):
1. Competência 1: Domínio da norma culta
2. Competência 2: Compreensão do tema e aplicação de conceitos
3. Competência 3: Seleção e organização de informações
4. Competência 4: Conhecimento dos mecanismos linguísticos
5. Competência 5: Proposta de intervenção

FORMATO DA RESPOSTA:
- Nota por competência (0-200)
- Nota total (0-1000)
- Pontos fortes
- Pontos a melhorar
- Sugestões práticas
- Versão corrigida com comentários`,

      flashcards: `Você é um gerador de flashcards educacionais.

FORMATO DE SAÍDA (JSON):
{
  "flashcards": [
    {
      "frente": "Pergunta ou conceito",
      "verso": "Resposta ou definição",
      "dica": "Dica para memorização",
      "dificuldade": "facil|medio|dificil"
    }
  ]
}

DIRETRIZES:
- Gere entre 5-10 flashcards por solicitação
- Foque nos conceitos mais importantes
- Use linguagem clara e objetiva
- Inclua dicas mnemônicas quando possível`,

      cronograma: `Você é um planejador de estudos adaptativo.

OBJETIVO: Criar um cronograma personalizado baseado em:
- Tempo disponível
- Matérias prioritárias
- Pontos fracos identificados
- Meta do concurso/vestibular

FORMATO DE SAÍDA (JSON):
{
  "cronograma": {
    "segunda": [{"hora": "09:00", "materia": "...", "duracao": "2h", "tipo": "estudo|revisao|exercicios"}],
    "terca": [...],
    ...
  },
  "dicas": ["..."],
  "meta_semanal": "..."
}`
    };

    const systemPrompt = systemPrompts[mode] || systemPrompts.tutor;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições excedido. Aguarde um momento." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos de IA esgotados." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI gateway error: ${response.status}`);
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("AI Tutor error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
