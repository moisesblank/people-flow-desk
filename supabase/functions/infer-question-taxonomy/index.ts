import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ═══════════════════════════════════════════════════════════════════════════════
// MODO AGENTE v3.0.0 — PREENCHIMENTO OBRIGATÓRIO DE TODOS OS CAMPOS
// POLÍTICA DEFINITIVA E PERMANENTE
// ═══════════════════════════════════════════════════════════════════════════════
const AGENT_POLICY = `
🤖 MODO AGENTE ATIVADO — PREENCHIMENTO OBRIGATÓRIO

══════════════════════════════════════════════════════════════════════════════
REGRA ABSOLUTA: NENHUM CAMPO PODE FICAR VAZIO NA ENTIDADE QUESTÃO FINAL
══════════════════════════════════════════════════════════════════════════════

Se qualquer campo vier vazio no Excel, você DEVE:
1. Analisar o conteúdo da questão (enunciado, alternativas, resolução)
2. INFERIR e PREENCHER obrigatoriamente com o valor mais adequado
3. Registrar a inferência com confidence score
4. O sistema NÃO aceita questão incompleta

CAMPOS QUE DEVEM SER PREENCHIDOS SE VAZIOS:
- MACRO (obrigatório de qualquer forma)
- MICRO (inferir do conteúdo)
- TEMA (inferir do conteúdo)
- SUBTEMA (inferir do conteúdo)
- DIFICULDADE (inferir: fácil, médio ou difícil)
- BANCA (inferir se possível ou usar "Autoral")
- ANO (inferir se possível ou usar ano atual)
- EXPLICAÇÃO (gerar resolução comentada completa se ausente)
`;

// ═══════════════════════════════════════════════════════════════════════════════
// NORMALIZAÇÃO SEMÂNTICA v1.0.0 — MAPEAMENTO POR CONCEITO, NÃO POR TEXTO
// ═══════════════════════════════════════════════════════════════════════════════
const SEMANTIC_EQUIVALENCE_GROUPS = {
  // QUÍMICA GERAL - CÁLCULOS QUÍMICOS
  "QUANTIDADE_DE_MATERIA": [
    "constante de avogadro", "número de avogadro", "avogadro",
    "número de partículas", "número de átomos", "número de moléculas",
    "número de íons", "número de prótons", "número de nêutrons",
    "número de elétrons", "mol", "moles", "quantidade de mol",
    "conversão massa-partículas", "contagem de partículas",
    "quantidade de substância", "amount of substance"
  ],
  "MASSA": [
    "massa molar", "massa molecular", "massa atômica",
    "massa de um mol", "cálculo de massa", "gramas por mol"
  ],
  "VOLUME": [
    "volume molar", "condições normais de temperatura e pressão",
    "cntp", "22,4 litros", "volume de gases"
  ],
  "FORMULAS_QUIMICAS": [
    "fórmula mínima", "fórmula molecular", "fórmula percentual",
    "composição centesimal", "análise elementar"
  ],
  
  // ATOMÍSTICA
  "MODELOS_ATOMICOS": [
    "dalton", "thomson", "rutherford", "bohr", "modelo atômico",
    "evolução atômica", "pudim de passas", "sistema planetário"
  ],
  "DISTRIBUICAO_ELETRONICA": [
    "diagrama de pauling", "camadas eletrônicas", "níveis de energia",
    "orbitais", "subcamadas", "configuração eletrônica",
    "regra do octeto", "elétrons de valência"
  ],
  
  // LIGAÇÕES QUÍMICAS
  "LIGACAO_IONICA": [
    "composto iônico", "sal", "transferência de elétrons",
    "metal + não-metal", "retículo cristalino"
  ],
  "LIGACAO_COVALENTE": [
    "compartilhamento de elétrons", "molécula", "ligação molecular",
    "ligação sigma", "ligação pi", "ligação dativa"
  ],
  "GEOMETRIA_MOLECULAR": [
    "vsepr", "repulsão eletrônica", "tetraédrica", "trigonal",
    "linear", "angular", "piramidal", "octaédrica"
  ],
  "POLARIDADE": [
    "molécula polar", "molécula apolar", "momento dipolar",
    "eletronegatividade", "diferença de eletronegatividade"
  ],
  
  // ESTEQUIOMETRIA
  "LEIS_PONDERAIS": [
    "lavoisier", "proust", "dalton", "conservação de massa",
    "proporções definidas", "proporções múltiplas"
  ],
  "REAGENTE_LIMITANTE": [
    "reagente em excesso", "limitante", "excesso",
    "rendimento", "pureza", "eficiência de reação"
  ],
  
  // GASES
  "LEIS_DOS_GASES": [
    "boyle", "charles", "gay-lussac", "clapeyron", "pv=nrt",
    "equação geral dos gases", "gases ideais", "gases perfeitos"
  ],
  "MISTURAS_GASOSAS": [
    "pressão parcial", "dalton gases", "fração molar gases",
    "volume parcial"
  ],
  
  // TABELA PERIÓDICA
  "PROPRIEDADES_PERIODICAS": [
    "raio atômico", "energia de ionização", "afinidade eletrônica",
    "eletronegatividade", "eletropositividade", "volume atômico"
  ],
  
  // FUNÇÕES INORGÂNICAS
  "ACIDOS": [
    "ácido forte", "ácido fraco", "hidrácido", "oxiácido",
    "ionização", "liberação de h+"
  ],
  "BASES": [
    "base forte", "base fraca", "hidróxido", "dissociação",
    "liberação de oh-"
  ],
  "SAIS": [
    "neutralização", "reação ácido-base", "precipitação",
    "sal solúvel", "sal insolúvel"
  ],
  "OXIDOS": [
    "óxido ácido", "óxido básico", "óxido anfótero",
    "óxido neutro", "peróxido", "superóxido"
  ]
};

const SEMANTIC_NORMALIZATION_POLICY = `
═══════════════════════════════════════════════════════════════════════════════
🧠 POLÍTICA DE NORMALIZAÇÃO SEMÂNTICA v1.0.0 — CLASSIFICAÇÃO POR CONCEITO
═══════════════════════════════════════════════════════════════════════════════

PRINCÍPIO FUNDAMENTAL:
Classifique questões pelo CONCEITO QUÍMICO subjacente, não pelo texto literal.
Sinônimos, contextos aplicados e expressões equivalentes DEVEM resolver para
o subtema canônico correspondente.

REGRA DE OURO: SEMÂNTICA > LITERAL
- "Cálculo do número de prótons usando constante de Avogadro" → Quantidade de Matéria
- "Mol" → Quantidade de Matéria
- "Número de partículas" → Quantidade de Matéria
- "Constante de Avogadro" → Quantidade de Matéria

GRUPOS DE EQUIVALÊNCIA SEMÂNTICA:

QUANTIDADE_DE_MATERIA (Química Geral > Cálculos Químicos > Cálculos > Quantidade de Matéria):
→ constante de avogadro, número de avogadro, número de partículas
→ número de átomos, número de moléculas, número de íons
→ número de prótons, número de nêutrons, número de elétrons
→ mol, moles, quantidade de mol, conversão massa-partículas

LEIS_PONDERAIS (Química Geral > Cálculos Químicos > Leis Ponderais):
→ Lavoisier, Proust, Dalton
→ conservação de massa, proporções definidas, proporções múltiplas

MODELOS_ATOMICOS (Química Geral > Atomística > Modelos Atômicos):
→ Dalton, Thomson, Rutherford, Bohr
→ evolução atômica, pudim de passas, sistema planetário

DISTRIBUICAO_ELETRONICA (Química Geral > Atomística > Distribuição Eletrônica):
→ Pauling, camadas, níveis, orbitais, configuração eletrônica

LIGACAO_IONICA / COVALENTE / METALICA (Química Geral > Ligações Químicas):
→ Classificar pelo tipo de ligação presente

GEOMETRIA_MOLECULAR (Química Geral > Ligações Químicas > Ligação Covalente):
→ VSEPR, formas moleculares, repulsão eletrônica

LEIS_DOS_GASES (Química Geral > Gases > Leis dos Gases):
→ Boyle, Charles, Gay-Lussac, Clapeyron, PV=nRT

APLICAÇÃO OBRIGATÓRIA:
1. Analise o CONCEITO QUÍMICO central da questão
2. Identifique se pertence a um grupo de equivalência
3. Mapeie para o MICRO/TEMA/SUBTEMA canônico
4. IGNORE diferenças superficiais de redação

PROIBIDO:
- Criar novos subtemas para sinônimos
- Duplicar tópicos existentes
- Classificar por texto literal ignorando o conceito

═══════════════════════════════════════════════════════════════════════════════
`;

const TAXONOMY_KNOWLEDGE = `
🏛️ CONSTITUIÇÃO DO MODELO TRANSVERSAL — REGRA DE OURO

▸ MACRO = IDENTIDADE ÚNICA E OBRIGATÓRIA
  → Cada questão possui EXATAMENTE 1 MACRO
  → Define a grande área de conhecimento (conceito principal)
  → NÃO pode ser múltiplo ou array
  → MACRO é o eixo primário de classificação

▸ MICRO, TEMA, SUBTEMA = CAMADAS TRANSVERSAIS (100% compartilháveis)
  → Podem vir de QUALQUER MACRO
  → São compartilháveis entre questões
  → Permitem interdisciplinaridade

${SEMANTIC_NORMALIZATION_POLICY}

MACROS CANÔNICOS DE QUÍMICA (5 grandes áreas):

1. QUÍMICA GERAL (Química Geral) ⚗️
   MICROs CANÔNICOS:
   - Introdução à Química Inorgânica (Propriedades da Matéria, Substâncias/Misturas, Alotropia, Separação, Tratamento de Água, Combustíveis)
   - Atomística (Modelos Atômicos, Distribuição Eletrônica, Propriedades Magnéticas, Números Quânticos)
   - Tabela Periódica (Características, Propriedades Periódicas/Aperiódicas)
   - Número de Oxidação NOX
   - Ligações Químicas (Iônica, Covalente, Metálica, Forças Intermoleculares)
   - Funções Inorgânicas (Ácidos, Bases, Sais, Óxidos)
   - Teorias Ácido-Base
   - Reações Inorgânicas (Adição, Decomposição, Substituição, Dupla Troca)
   - Cálculos Químicos (Leis Ponderais, Cálculos: Quantidade de Matéria, Massa, Volume, Fórmulas)
   - Estequiometria (Regra de Três, Pureza, Rendimento, Reagente Limitante, Reações Consecutivas)
   - Gases (Características, Leis dos Gases, Difusão/Efusão)

2. QUÍMICA ORGÂNICA (Química Orgânica) 🧪
   - Funções Orgânicas, Hidrocarbonetos, Nomenclatura
   - Isomeria Plana, Espacial, Óptica, Geométrica
   - Reações Orgânicas
   - Polímeros

3. FÍSICO-QUÍMICA (Físico-Química) 📊
   - Termoquímica, Cinética, Equilíbrio
   - Eletroquímica, Soluções
   - Radioatividade

4. QUÍMICA AMBIENTAL (Química Ambiental) 🌍
   - Poluição, Ciclos Biogeoquímicos
   - Efeito Estufa, Camada de Ozônio
   - Química Verde

5. BIOQUÍMICA (Bioquímica) 🧬
   - Carboidratos, Lipídios, Proteínas
   - Ácidos Nucleicos, Enzimas

═══════════════════════════════════════════════════════════════════════════════
CRITÉRIOS PARA INFERIR DIFICULDADE:
═══════════════════════════════════════════════════════════════════════════════

FÁCIL:
- Conceitos básicos, definições diretas
- Cálculos simples (regra de três, conversões)
- Questões de memorização
- Identificação direta de funções/elementos

MÉDIO:
- Aplicação de conceitos em contextos novos
- Cálculos com 2-3 etapas
- Análise de gráficos/tabelas simples
- Questões interdisciplinares simples

DIFÍCIL:
- Problemas complexos com múltiplas etapas
- Integração de vários conceitos
- Análise crítica e interpretação avançada
- Questões do ENEM ou vestibulares difíceis
- Cálculos extensos ou raciocínio não-trivial

═══════════════════════════════════════════════════════════════════════════════
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
  suggested_difficulty?: string;
  suggested_banca?: string;
  suggested_ano?: number | string;
}

interface AgentResult {
  id: string;
  macro: string;
  micro: string;
  tema: string;
  subtema: string;
  difficulty: string;
  banca: string;
  ano: number;
  explanation: string;
  confidence: number;
  reasoning: string;
  fields_inferred: string[];
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

    const currentYear = new Date().getFullYear();
    console.log(`🤖 MODO AGENTE: Processando ${questions.length} questões com preenchimento obrigatório...`);

    // Processar em lotes de 3 para dar mais contexto à IA
    const BATCH_SIZE = 3;
    const results: AgentResult[] = [];

    for (let i = 0; i < questions.length; i += BATCH_SIZE) {
      const batch = questions.slice(i, i + BATCH_SIZE);
      
      const prompt = `${AGENT_POLICY}

${TAXONOMY_KNOWLEDGE}

═══════════════════════════════════════════════════════════════════════════════
QUESTÕES PARA ANÁLISE — MODO AGENTE ATIVADO
═══════════════════════════════════════════════════════════════════════════════

${batch.map((q, idx) => {
  const camposVazios = [];
  if (!q.suggested_macro) camposVazios.push('MACRO');
  if (!q.suggested_micro) camposVazios.push('MICRO');
  if (!q.suggested_tema) camposVazios.push('TEMA');
  if (!q.suggested_subtema) camposVazios.push('SUBTEMA');
  if (!q.suggested_difficulty) camposVazios.push('DIFICULDADE');
  if (!q.suggested_banca) camposVazios.push('BANCA');
  if (!q.suggested_ano) camposVazios.push('ANO');
  if (!q.explanation) camposVazios.push('EXPLICAÇÃO');

  return `
━━━ QUESTÃO ${idx + 1} (ID: ${q.id}) ━━━
⚠️ CAMPOS VAZIOS QUE VOCÊ DEVE PREENCHER: ${camposVazios.length > 0 ? camposVazios.join(', ') : 'Nenhum'}

ENUNCIADO:
${q.question_text?.substring(0, 2000) || 'N/A'}

${q.options ? `ALTERNATIVAS: ${JSON.stringify(q.options)}` : ''}
${q.correct_answer ? `GABARITO: ${q.correct_answer}` : ''}
${q.explanation ? `RESOLUÇÃO EXISTENTE: ${q.explanation.substring(0, 800)}` : '⚠️ SEM RESOLUÇÃO - GERAR COMPLETA'}

DADOS DO EXCEL (podem estar vazios ou errados):
- MACRO: ${q.suggested_macro || '❌ VAZIO - INFERIR'}
- MICRO: ${q.suggested_micro || '❌ VAZIO - INFERIR'}
- TEMA: ${q.suggested_tema || '❌ VAZIO - INFERIR'}
- SUBTEMA: ${q.suggested_subtema || '❌ VAZIO - INFERIR'}
- DIFICULDADE: ${q.suggested_difficulty || '❌ VAZIO - INFERIR'}
- BANCA: ${q.suggested_banca || '❌ VAZIO - INFERIR (usar "Autoral" se não identificável)'}
- ANO: ${q.suggested_ano || '❌ VAZIO - INFERIR (usar ${currentYear} se não identificável)'}
`;
}).join('\n')}

═══════════════════════════════════════════════════════════════════════════════
RESPONDA COM JSON VÁLIDO (array de objetos):
═══════════════════════════════════════════════════════════════════════════════

[
  {
    "id": "id_da_questao",
    "macro": "Química Geral|Química Orgânica|Físico-Química|Química Ambiental|Bioquímica",
    "micro": "valor_inferido_ou_corrigido",
    "tema": "valor_inferido_ou_corrigido",
    "subtema": "valor_inferido_ou_corrigido",
    "difficulty": "fácil|médio|difícil",
    "banca": "nome_da_banca_ou_Autoral",
    "ano": ${currentYear},
    "explanation": "resolução comentada completa se estava vazia, ou a existente",
    "confidence": 0.95,
    "reasoning": "breve explicação das inferências",
    "fields_inferred": ["lista dos campos que você preencheu"],
    "corrections": ["lista de correções em dados existentes"]
  }
]

REGRAS CRÍTICAS:
1. TODOS os campos devem ter valor - NENHUM pode ficar vazio ou null
2. Se EXPLICAÇÃO estava vazia, GERE uma resolução comentada completa
3. Use os MICROs listados acima como referência
4. confidence deve refletir sua certeza (0.0 a 1.0)
5. fields_inferred deve listar TODOS os campos que você preencheu`;

      const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [
            { 
              role: 'system', 
              content: 'Você é um agente especialista em classificação e completude de questões de Química. MODO AGENTE: você DEVE preencher TODOS os campos vazios. Sempre responda com JSON válido.' 
            },
            { role: 'user', content: prompt }
          ],
          temperature: 0.2,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ Erro na API: ${response.status}`, errorText);
        
        // Fallback com preenchimento padrão
        for (const q of batch) {
          const fieldsInferred = [];
          const macro = q.suggested_macro || 'Química Geral';
          if (!q.suggested_macro) fieldsInferred.push('MACRO');
          
          const micro = q.suggested_micro || 'Conceitos Gerais';
          if (!q.suggested_micro) fieldsInferred.push('MICRO');
          
          const tema = q.suggested_tema || 'Fundamentos';
          if (!q.suggested_tema) fieldsInferred.push('TEMA');
          
          const subtema = q.suggested_subtema || 'Básico';
          if (!q.suggested_subtema) fieldsInferred.push('SUBTEMA');
          
          const difficulty = q.suggested_difficulty || 'médio';
          if (!q.suggested_difficulty) fieldsInferred.push('DIFICULDADE');
          
          const banca = q.suggested_banca || 'Autoral';
          if (!q.suggested_banca) fieldsInferred.push('BANCA');
          
          const ano = parseInt(String(q.suggested_ano)) || currentYear;
          if (!q.suggested_ano) fieldsInferred.push('ANO');
          
          const explanation = q.explanation || 'Resolução não disponível. Consulte o material de apoio.';
          if (!q.explanation) fieldsInferred.push('EXPLICAÇÃO');

          results.push({
            id: q.id,
            macro,
            micro,
            tema,
            subtema,
            difficulty,
            banca,
            ano,
            explanation,
            confidence: 0.3,
            reasoning: 'Fallback automático (erro na IA)',
            fields_inferred: fieldsInferred,
            corrections: []
          });
        }
        continue;
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || '';
      
      // Extrair JSON da resposta
      let parsedResults: AgentResult[] = [];
      try {
        const jsonMatch = content.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          parsedResults = JSON.parse(jsonMatch[0]);
        }
      } catch (parseError) {
        console.error('❌ Erro ao parsear JSON:', parseError);
        console.log('Conteúdo recebido:', content.substring(0, 500));
      }

      // Mapear resultados com garantia de preenchimento
      for (const q of batch) {
        const result = parsedResults.find(r => r.id === q.id);
        
        if (result) {
          // Garantir que TODOS os campos estão preenchidos
          const fieldsInferred = result.fields_inferred || [];
          
          results.push({
            id: q.id,
            macro: result.macro || q.suggested_macro || 'Química Geral',
            micro: result.micro || q.suggested_micro || 'Conceitos Gerais',
            tema: result.tema || q.suggested_tema || 'Fundamentos',
            subtema: result.subtema || q.suggested_subtema || 'Básico',
            difficulty: result.difficulty || q.suggested_difficulty || 'médio',
            banca: result.banca || q.suggested_banca || 'Autoral',
            ano: result.ano || parseInt(String(q.suggested_ano)) || currentYear,
            explanation: result.explanation || q.explanation || 'Resolução comentada não disponível.',
            confidence: result.confidence || 0.7,
            reasoning: result.reasoning || 'Classificação automática',
            fields_inferred: fieldsInferred,
            corrections: result.corrections || []
          });
        } else {
          // Fallback se a IA não retornou este ID
          const fieldsInferred = [];
          if (!q.suggested_macro) fieldsInferred.push('MACRO');
          if (!q.suggested_micro) fieldsInferred.push('MICRO');
          if (!q.suggested_tema) fieldsInferred.push('TEMA');
          if (!q.suggested_subtema) fieldsInferred.push('SUBTEMA');
          if (!q.suggested_difficulty) fieldsInferred.push('DIFICULDADE');
          if (!q.suggested_banca) fieldsInferred.push('BANCA');
          if (!q.suggested_ano) fieldsInferred.push('ANO');
          if (!q.explanation) fieldsInferred.push('EXPLICAÇÃO');

          results.push({
            id: q.id,
            macro: q.suggested_macro || 'Química Geral',
            micro: q.suggested_micro || 'Conceitos Gerais',
            tema: q.suggested_tema || 'Fundamentos',
            subtema: q.suggested_subtema || 'Básico',
            difficulty: q.suggested_difficulty || 'médio',
            banca: q.suggested_banca || 'Autoral',
            ano: parseInt(String(q.suggested_ano)) || currentYear,
            explanation: q.explanation || 'Resolução comentada não disponível.',
            confidence: 0.5,
            reasoning: 'Fallback: ID não encontrado na resposta',
            fields_inferred: fieldsInferred,
            corrections: []
          });
        }
      }

      console.log(`✅ Lote ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(questions.length / BATCH_SIZE)} processado`);
    }

    // Estatísticas finais
    const totalFieldsInferred = results.reduce((acc, r) => acc + r.fields_inferred.length, 0);
    const questionsWithInference = results.filter(r => r.fields_inferred.length > 0).length;
    const avgConfidence = results.reduce((acc, r) => acc + r.confidence, 0) / results.length;

    console.log(`
🤖 MODO AGENTE — RELATÓRIO FINAL
════════════════════════════════════════
📊 Total de questões: ${results.length}
🔧 Questões com campos inferidos: ${questionsWithInference}
📝 Total de campos inferidos: ${totalFieldsInferred}
🎯 Confidence média: ${(avgConfidence * 100).toFixed(1)}%
✅ Correções aplicadas: ${results.filter(r => r.corrections.length > 0).length}
════════════════════════════════════════
    `);

    return new Response(
      JSON.stringify({ 
        success: true, 
        results,
        stats: {
          processed: results.length,
          questions_with_inference: questionsWithInference,
          total_fields_inferred: totalFieldsInferred,
          average_confidence: avgConfidence,
          corrections_made: results.filter(r => r.corrections.length > 0).length
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Erro no MODO AGENTE:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro desconhecido' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
