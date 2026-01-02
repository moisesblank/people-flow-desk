import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Taxonomia canônica de Química
const TAXONOMY_KNOWLEDGE = `
MACROS CANÔNICOS DE QUÍMICA:

1. QUÍMICA GERAL (quimica_geral)
   - Propriedades da Matéria, Substâncias e Misturas, Alotropia
   - Separação de Misturas, Tratamento de Água
   - Combustíveis e Energia, Atomística
   - Distribuição Eletrônica, Tabela Periódica
   - Propriedades Periódicas, Ligações Químicas, Estequiometria
   - Gases, Soluções básicas, Reações inorgânicas

2. QUÍMICA ORGÂNICA (quimica_organica)
   - Funções Orgânicas (álcoois, aldeídos, cetonas, ácidos, ésteres, éteres, aminas, amidas)
   - Hidrocarbonetos (alcanos, alcenos, alcinos, aromáticos)
   - Isomeria (plana, espacial, óptica, geométrica)
   - Reações Orgânicas (substituição, adição, eliminação, oxidação, redução)
   - Polímeros (adição, condensação, naturais, sintéticos)
   - Bioquímica (carboidratos, lipídios, proteínas, ácidos nucleicos)

3. FÍSICO-QUÍMICA (fisico_quimica)
   - Termoquímica (entalpia, lei de Hess, energia de ligação)
   - Cinética Química (velocidade, fatores, catálise)
   - Equilíbrio Químico (constante, Le Chatelier, pH, pOH, hidrólise)
   - Eletroquímica (pilhas, eletrólise, corrosão)
   - Propriedades Coligativas (tonoscopia, ebulioscopia, crioscopia, osmose)
   - Radioatividade (decaimento, meia-vida, fissão, fusão)

4. QUÍMICA AMBIENTAL (quimica_ambiental)
   - Poluição (ar, água, solo)
   - Ciclos biogeoquímicos (carbono, nitrogênio, água)
   - Efeito Estufa, Camada de Ozônio
   - Chuva Ácida, Tratamento de resíduos
   - Química Verde, Sustentabilidade
   - Biocombustíveis, Energia limpa

REGRAS DE CLASSIFICAÇÃO:
- Uma questão pertence ao MACRO que melhor representa seu CONCEITO PRINCIPAL
- MICRO, TEMA e SUBTEMA podem ser TRANSVERSAIS (de qualquer MACRO)
- Exemplo: Questão sobre "combustão de etanol" → MACRO: Orgânica (etanol), MICRO: Termoquímica (combustão)
- Exemplo: Questão sobre "pH de chuva ácida" → MACRO: Ambiental, MICRO: Equilíbrio (pH)
`;

interface QuestionInput {
  id: string;
  question_text: string;
  options?: any;
  correct_answer?: string;
  explanation?: string;
  suggested_macro?: string;
  suggested_micro?: string;
  suggested_tema?: string;
  suggested_subtema?: string;
}

interface TaxonomyResult {
  id: string;
  macro: string;
  micro: string;
  tema: string;
  subtema: string;
  confidence: number;
  reasoning: string;
  corrections: string[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { questions } = await req.json() as { questions: QuestionInput[] };
    
    if (!questions || !Array.isArray(questions) || questions.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Array de questões é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY não configurada');
    }

    console.log(`🧠 Inferindo taxonomia para ${questions.length} questões...`);

    // Processar em lotes de 5 para evitar timeout
    const BATCH_SIZE = 5;
    const results: TaxonomyResult[] = [];

    for (let i = 0; i < questions.length; i += BATCH_SIZE) {
      const batch = questions.slice(i, i + BATCH_SIZE);
      
      const prompt = `Você é um especialista em classificação de questões de Química para vestibulares e ENEM.

${TAXONOMY_KNOWLEDGE}

Analise as seguintes questões e determine a taxonomia correta para cada uma.
Para cada questão, retorne EXATAMENTE no formato JSON especificado.

QUESTÕES PARA ANÁLISE:
${batch.map((q, idx) => `
--- QUESTÃO ${idx + 1} (ID: ${q.id}) ---
ENUNCIADO: ${q.question_text?.substring(0, 1500) || 'N/A'}
${q.options ? `ALTERNATIVAS: ${JSON.stringify(q.options)}` : ''}
${q.explanation ? `RESOLUÇÃO: ${q.explanation.substring(0, 500)}` : ''}

SUGESTÕES DO EXCEL (podem estar erradas):
- MACRO sugerido: ${q.suggested_macro || 'não informado'}
- MICRO sugerido: ${q.suggested_micro || 'não informado'}
- TEMA sugerido: ${q.suggested_tema || 'não informado'}
- SUBTEMA sugerido: ${q.suggested_subtema || 'não informado'}
`).join('\n')}

RESPONDA COM JSON VÁLIDO (array de objetos):
[
  {
    "id": "id_da_questao",
    "macro": "valor_correto",
    "micro": "valor_correto", 
    "tema": "valor_correto",
    "subtema": "valor_correto",
    "confidence": 0.95,
    "reasoning": "breve explicação da classificação",
    "corrections": ["lista de correções feitas em relação às sugestões"]
  }
]

IMPORTANTE:
- Se a sugestão do Excel estiver correta, mantenha
- Se estiver errada, CORRIJA baseado no conteúdo real
- confidence: 0.0 a 1.0 indicando certeza da classificação
- corrections: liste as mudanças feitas (ex: "MACRO alterado de X para Y")`;

      const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [
            { role: 'system', content: 'Você é um classificador de questões de Química. Sempre responda com JSON válido.' },
            { role: 'user', content: prompt }
          ],
          temperature: 0.1,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Erro na API: ${response.status}`, errorText);
        
        // Fallback: usar sugestões originais
        for (const q of batch) {
          results.push({
            id: q.id,
            macro: q.suggested_macro || 'Química Geral',
            micro: q.suggested_micro || '',
            tema: q.suggested_tema || '',
            subtema: q.suggested_subtema || '',
            confidence: 0.3,
            reasoning: 'Fallback: usando sugestões originais (erro na IA)',
            corrections: []
          });
        }
        continue;
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || '';
      
      // Extrair JSON da resposta
      let parsedResults: TaxonomyResult[] = [];
      try {
        // Tentar encontrar JSON na resposta
        const jsonMatch = content.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          parsedResults = JSON.parse(jsonMatch[0]);
        }
      } catch (parseError) {
        console.error('Erro ao parsear JSON:', parseError, content);
      }

      // Mapear resultados ou usar fallback
      for (const q of batch) {
        const result = parsedResults.find(r => r.id === q.id);
        if (result) {
          results.push(result);
        } else {
          results.push({
            id: q.id,
            macro: q.suggested_macro || 'Química Geral',
            micro: q.suggested_micro || '',
            tema: q.suggested_tema || '',
            subtema: q.suggested_subtema || '',
            confidence: 0.5,
            reasoning: 'Usando sugestões originais',
            corrections: []
          });
        }
      }

      console.log(`✅ Lote ${Math.floor(i / BATCH_SIZE) + 1} processado`);
    }

    console.log(`🎯 Taxonomia inferida para ${results.length} questões`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        results,
        processed: results.length,
        corrections_made: results.filter(r => r.corrections.length > 0).length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Erro na inferência:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro desconhecido' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
