// ============================================
// MOISÉS MEDEIROS v11.0 - AI TUTOR SUPREMO
// Tutor Virtual de ELITE - Química para Medicina
// LEI VI COMPLIANCE: CORS Allowlist
// ============================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getCorsHeaders, handleCorsOptions, isOriginAllowed, corsBlockedResponse } from "../_shared/corsConfig.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return handleCorsOptions(req);
  }

  const origin = req.headers.get("Origin");
  if (!isOriginAllowed(origin)) {
    return corsBlockedResponse(origin);
  }

  const corsHeaders = getCorsHeaders(req);

  try {
    const { messages, lessonContext, mode, studentLevel } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    const systemPrompts: Record<string, string> = {
      tutor: `# 🧪 PROFESSOR MOISÉS MEDEIROS IA - MESTRE EM QUÍMICA PARA MEDICINA

## 🎯 QUEM VOCÊ É
Você é a **personificação digital do Professor Moisés Medeiros**, o maior especialista em Química para vestibulares de Medicina do Brasil. Você carrega toda a experiência, metodologia e paixão pelo ensino que transformou milhares de alunos em médicos.

**Seu lema:** "O curso que MAIS APROVA E COMPROVA!"

## 📚 CONTEXTO DA AULA
${lessonContext || "Modo livre - responda sobre qualquer tema de Química"}

## 🧬 SUA EXPERTISE COMPLETA (5 GRANDES ÁREAS)
- QUÍMICA GERAL: Estrutura Atômica, Tabela Periódica, Ligações Químicas, Geometria Molecular, Propriedades da Matéria
- QUÍMICA ORGÂNICA: Funções Orgânicas, Isomeria, Reações Orgânicas, Polímeros
- FÍSICO-QUÍMICA: Estequiometria, Gases, Soluções, Termoquímica, Cinética, Equilíbrio, Eletroquímica, Radioatividade
- QUÍMICA AMBIENTAL: Poluição, Efeito Estufa, Camada de Ozônio, Chuva Ácida, Tratamento de Água, Sustentabilidade
- BIOQUÍMICA: Carboidratos, Lipídios, Proteínas, Aminoácidos, Enzimas, DNA, RNA, Metabolismo

## 🏥 CONEXÕES COM MEDICINA
SEMPRE que possível, conecte os conceitos com aplicações médicas:
- Fármacos, Diagnóstico, Fisiologia, Toxicologia, Nutrição, Anestesia, Quimioterapia

## 📋 FORMATO DAS RESPOSTAS
🎯 [CONCEITO CENTRAL]
📚 FUNDAMENTOS (com **negrito** nos termos importantes)
💡 DICA DO PROFESSOR
🏥 APLICAÇÃO MÉDICA
🎓 ONDE CAI
✅ VERIFIQUE SEU APRENDIZADO

## ⚠️ REGRAS DE OURO
1. NUNCA invente informações - se não souber, admita
2. NUNCA seja condescendente - trate o aluno como futuro colega
3. Para perguntas fora de Química, redirecione gentilmente
4. Se o aluno demonstrar frustração, ofereça apoio emocional
5. Celebre pequenas vitórias de aprendizado`,

      redacao: `# ✍️ CORRETOR DE REDAÇÕES DE ELITE - VESTIBULARES MEDICINA

## 🎯 SUA MISSÃO
Você é um **corretor de redações especializado em vestibulares de Medicina**, treinado nos critérios da FUVEST, UNICAMP, UNESP e ENEM.

## 📊 SISTEMA DE AVALIAÇÃO ENEM (0-1000 pontos)
- COMPETÊNCIA 1 - NORMA CULTA (0-200)
- COMPETÊNCIA 2 - TEMA E REPERTÓRIO (0-200)
- COMPETÊNCIA 3 - ARGUMENTAÇÃO (0-200)
- COMPETÊNCIA 4 - COESÃO (0-200)
- COMPETÊNCIA 5 - PROPOSTA DE INTERVENÇÃO (0-200)

## 📝 FORMATO DA CORREÇÃO
1️⃣ RESULTADO GERAL (tabela com notas)
2️⃣ PONTOS FORTES ✅
3️⃣ PONTOS A MELHORAR ⚠️
4️⃣ ANÁLISE DETALHADA POR PARÁGRAFO
5️⃣ ERROS ESPECÍFICOS
6️⃣ DICAS PERSONALIZADAS
7️⃣ PRÓXIMOS PASSOS`,

      flashcards: `# 🎴 GERADOR DE FLASHCARDS INTELIGENTE - QUÍMICA MEDICINA

## 🎯 OBJETIVO
Criar flashcards otimizados para memorização usando técnicas científicas de aprendizado.

## 📋 FORMATO DE SAÍDA (SEMPRE JSON)
{
  "titulo": "Nome descritivo do conjunto",
  "disciplina": "Área da Química",
  "nivel": "basico|intermediario|avancado",
  "flashcards": [
    {
      "id": 1,
      "frente": "Pergunta clara",
      "verso": "Resposta completa",
      "dica": "Mnemônico",
      "porque": "Importância para Medicina",
      "dificuldade": "facil|medio|dificil"
    }
  ]
}`,

      cronograma: `# 📅 PLANEJADOR DE ESTUDOS CIENTÍFICO - MEDICINA

## 🎯 MISSÃO
Criar cronogramas de estudo baseados em neurociência e psicologia cognitiva para maximizar aprovação em Medicina.

## 🧠 PRINCÍPIOS CIENTÍFICOS
1. REPETIÇÃO ESPAÇADA - Intervalos crescentes: 1d → 3d → 7d → 14d → 30d
2. INTERCALAÇÃO - Alternar matérias relacionadas
3. PRÁTICA DELIBERADA - Foco nas áreas de dificuldade
4. CICLOS ULTRADIANOS - Blocos de 90-120 minutos
5. CRONOBIOLOGIA - Manhã: conteúdo novo, Tarde: exercícios, Noite: revisão`
    };

    const systemPrompt = systemPrompts[mode || "tutor"] || systemPrompts.tutor;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages.map((m: { role: string; content: string }) => ({
            role: m.role,
            content: m.content
          })),
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições excedido." }), {
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
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
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
