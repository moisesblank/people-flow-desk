import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ═══════════════════════════════════════════════════════════════════════════════
// MODO AGENTE v4.0.0 — TAXONOMIA DINÂMICA + NORMALIZAÇÃO SEMÂNTICA
// BUSCA A TAXONOMIA CANÔNICA DO BANCO E DECIDE A MELHOR CLASSIFICAÇÃO
// ═══════════════════════════════════════════════════════════════════════════════

const AGENT_POLICY = `
🤖 MODO AGENTE v4.0 — CLASSIFICAÇÃO INTELIGENTE COM NORMALIZAÇÃO SEMÂNTICA

══════════════════════════════════════════════════════════════════════════════
REGRA ABSOLUTA: CLASSIFICAR POR CONCEITO QUÍMICO, NÃO POR TEXTO LITERAL
══════════════════════════════════════════════════════════════════════════════

PRINCÍPIO FUNDAMENTAL:
1. ANALISE o conceito químico subjacente na questão
2. IDENTIFIQUE equivalências semânticas (sinônimos, contextos aplicados)
3. MAPEIE para o MICRO/TEMA/SUBTEMA canônico correto
4. PREENCHA todos os campos obrigatoriamente

CAMPOS QUE DEVEM SER PREENCHIDOS SE VAZIOS:
- MACRO (obrigatório de qualquer forma)
- MICRO (inferir do conteúdo - USAR DA LISTA CANÔNICA)
- TEMA (inferir do conteúdo - USAR DA LISTA CANÔNICA)
- SUBTEMA (inferir do conteúdo - USAR DA LISTA CANÔNICA)
- DIFICULDADE (inferir: fácil, médio ou difícil)
- BANCA (inferir se possível ou usar "Autoral")
- ANO (inferir se possível ou usar ano atual)
- EXPLICAÇÃO (gerar resolução comentada completa se ausente)
`;

// ═══════════════════════════════════════════════════════════════════════════════
// GRUPOS DE EQUIVALÊNCIA SEMÂNTICA — MAPEAMENTO CONCEITUAL
// ═══════════════════════════════════════════════════════════════════════════════
const SEMANTIC_EQUIVALENCE_GROUPS: Record<string, { 
  keywords: string[], 
  canonical: { micro: string, tema: string, subtema: string } 
}> = {
  // CÁLCULOS QUÍMICOS - QUANTIDADE DE MATÉRIA
  "QUANTIDADE_DE_MATERIA": {
    keywords: [
      "constante de avogadro", "número de avogadro", "avogadro",
      "número de partículas", "número de átomos", "número de moléculas",
      "número de íons", "número de prótons", "número de nêutrons",
      "número de elétrons", "mol", "moles", "quantidade de mol",
      "conversão massa-partículas", "contagem de partículas",
      "quantidade de substância", "6,02 x 10^23", "6,02.10^23"
    ],
    canonical: { micro: "Cálculos Químicos", tema: "Cálculos", subtema: "Quantidade de Matéria" }
  },
  "MASSA": {
    keywords: [
      "massa molar", "massa molecular", "massa atômica",
      "massa de um mol", "cálculo de massa", "gramas por mol", "g/mol"
    ],
    canonical: { micro: "Cálculos Químicos", tema: "Cálculos", subtema: "Massa" }
  },
  "VOLUME": {
    keywords: [
      "volume molar", "condições normais de temperatura e pressão",
      "cntp", "22,4 litros", "22,4L", "volume de gases"
    ],
    canonical: { micro: "Cálculos Químicos", tema: "Cálculos", subtema: "Volume" }
  },
  "FORMULAS_QUIMICAS": {
    keywords: [
      "fórmula mínima", "fórmula molecular", "fórmula percentual",
      "composição centesimal", "análise elementar", "fórmula empírica"
    ],
    canonical: { micro: "Cálculos Químicos", tema: "Cálculos", subtema: "Fórmulas Químicas" }
  },
  
  // LEIS PONDERAIS
  "LEIS_PONDERAIS": {
    keywords: [
      "lavoisier", "proust", "dalton lei", "conservação de massa",
      "proporções definidas", "proporções constantes", "proporções múltiplas"
    ],
    canonical: { micro: "Cálculos Químicos", tema: "Leis Ponderais", subtema: "Leis Químicas Fundamentais" }
  },
  
  // ATOMÍSTICA
  "MODELOS_ATOMICOS": {
    keywords: [
      "dalton átomo", "thomson átomo", "rutherford", "bohr modelo",
      "modelo atômico", "evolução atômica", "pudim de passas", 
      "sistema planetário", "experimento de rutherford"
    ],
    canonical: { micro: "Atomística", tema: "Modelos Atômicos", subtema: "Evolução dos Modelos Atômicos" }
  },
  "DISTRIBUICAO_ELETRONICA": {
    keywords: [
      "diagrama de pauling", "camadas eletrônicas", "níveis de energia",
      "orbitais", "subcamadas", "configuração eletrônica",
      "regra do octeto", "elétrons de valência", "subnível"
    ],
    canonical: { micro: "Atomística", tema: "Distribuição Eletrônica", subtema: "Configurações Eletrônicas" }
  },
  "NUMEROS_QUANTICOS": {
    keywords: [
      "número quântico", "spin", "magnético", "azimutal", "principal",
      "orbital s", "orbital p", "orbital d", "orbital f"
    ],
    canonical: { micro: "Atomística", tema: "Números Quânticos", subtema: "Subníveis e Orbitais" }
  },
  
  // TABELA PERIÓDICA
  "PROPRIEDADES_PERIODICAS": {
    keywords: [
      "raio atômico", "energia de ionização", "afinidade eletrônica",
      "eletronegatividade", "eletropositividade", "volume atômico",
      "potencial de ionização"
    ],
    canonical: { micro: "Tabela Periódica", tema: "Propriedades Periódicas e Aperiódicas", subtema: "" }
  },
  
  // LIGAÇÕES QUÍMICAS
  "LIGACAO_IONICA": {
    keywords: [
      "composto iônico", "ligação iônica", "transferência de elétrons",
      "metal + não-metal", "retículo cristalino", "sal iônico"
    ],
    canonical: { micro: "Ligações Químicas", tema: "Ligação Iônica", subtema: "Formação de Ligação Iônica" }
  },
  "LIGACAO_COVALENTE": {
    keywords: [
      "compartilhamento de elétrons", "molécula", "ligação molecular",
      "ligação sigma", "ligação pi", "ligação dativa", "covalência"
    ],
    canonical: { micro: "Ligações Químicas", tema: "Ligação Covalente", subtema: "Formação de Ligação Covalente" }
  },
  "GEOMETRIA_MOLECULAR": {
    keywords: [
      "vsepr", "repulsão eletrônica", "tetraédrica", "trigonal",
      "linear", "angular", "piramidal", "octaédrica", "geometria molecular"
    ],
    canonical: { micro: "Ligações Químicas", tema: "Ligação Covalente", subtema: "Geometria Molecular" }
  },
  "HIBRIDIZACAO": {
    keywords: [
      "sp", "sp2", "sp3", "sp3d", "sp3d2", "hibridização", "hibridação"
    ],
    canonical: { micro: "Ligações Químicas", tema: "Ligação Covalente", subtema: "Hibridização" }
  },
  "POLARIDADE": {
    keywords: [
      "molécula polar", "molécula apolar", "momento dipolar",
      "diferença de eletronegatividade", "polaridade"
    ],
    canonical: { micro: "Ligações Químicas", tema: "Ligação Covalente", subtema: "Polaridade" }
  },
  "FORCAS_INTERMOLECULARES": {
    keywords: [
      "força intermolecular", "dipolo", "van der waals", "london",
      "ponte de hidrogênio", "ligação de hidrogênio", "interação dipolo"
    ],
    canonical: { micro: "Ligações Químicas", tema: "Forças Intermoleculares", subtema: "Interações Dipolo" }
  },
  
  // FUNÇÕES INORGÂNICAS
  "ACIDOS": {
    keywords: [
      "ácido", "hidrácido", "oxiácido", "ionização", "h+", "íon hidrogênio"
    ],
    canonical: { micro: "Funções Inorgânicas", tema: "Ácidos", subtema: "" }
  },
  "BASES": {
    keywords: [
      "base", "hidróxido", "dissociação", "oh-", "íon hidroxila"
    ],
    canonical: { micro: "Funções Inorgânicas", tema: "Bases", subtema: "" }
  },
  "SAIS": {
    keywords: [
      "sal", "neutralização", "reação ácido-base"
    ],
    canonical: { micro: "Funções Inorgânicas", tema: "Sais", subtema: "" }
  },
  "OXIDOS": {
    keywords: [
      "óxido", "peróxido", "superóxido", "óxido ácido", "óxido básico"
    ],
    canonical: { micro: "Funções Inorgânicas", tema: "Óxidos", subtema: "" }
  },
  
  // ESTEQUIOMETRIA
  "PUREZA_RENDIMENTO": {
    keywords: [
      "pureza", "rendimento", "eficiência", "grau de pureza"
    ],
    canonical: { micro: "Estequiometria", tema: "Pureza", subtema: "" }
  },
  "REAGENTE_LIMITANTE": {
    keywords: [
      "reagente limitante", "reagente em excesso", "limitante", "excesso"
    ],
    canonical: { micro: "Estequiometria", tema: "Reagentes Limitante e em Excesso", subtema: "" }
  },
  
  // GASES
  "LEIS_DOS_GASES": {
    keywords: [
      "boyle", "charles", "gay-lussac", "clapeyron", "pv=nrt",
      "equação geral dos gases", "gases ideais", "gases perfeitos"
    ],
    canonical: { micro: "Gases", tema: "Leis dos Gases", subtema: "" }
  },
  "MISTURAS_GASOSAS": {
    keywords: [
      "pressão parcial", "dalton pressão", "fração molar", "volume parcial"
    ],
    canonical: { micro: "Gases", tema: "Leis dos Gases", subtema: "Misturas Gasosas" }
  }
};

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
  semantic_match?: string;
}

interface TaxonomyItem {
  id: string;
  label: string;
  value: string;
  level: string;
  parent_value: string | null;
}

// ═══════════════════════════════════════════════════════════════════════════════
// FUNÇÃO: Buscar taxonomia canônica do banco de dados
// ═══════════════════════════════════════════════════════════════════════════════
async function fetchCanonicalTaxonomy(): Promise<{ 
  macros: TaxonomyItem[], 
  micros: TaxonomyItem[], 
  temas: TaxonomyItem[], 
  subtemas: TaxonomyItem[],
  formatted: string 
}> {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  const { data, error } = await supabase
    .from('question_taxonomy')
    .select('*')
    .eq('is_active', true)
    .order('position');

  if (error) {
    console.error('❌ Erro ao buscar taxonomia:', error);
    return { macros: [], micros: [], temas: [], subtemas: [], formatted: '' };
  }

  const items = data || [];
  const macros = items.filter(i => i.level === 'macro');
  const micros = items.filter(i => i.level === 'micro');
  const temas = items.filter(i => i.level === 'tema');
  const subtemas = items.filter(i => i.level === 'subtema');

  // Formatar para o prompt
  let formatted = `
═══════════════════════════════════════════════════════════════════════════════
📚 TAXONOMIA CANÔNICA OFICIAL (FONTE: BANCO DE DADOS)
═══════════════════════════════════════════════════════════════════════════════

⚠️ ATENÇÃO: USE APENAS OS VALORES ABAIXO. NÃO INVENTE NOVOS.

`;

  for (const macro of macros) {
    formatted += `\n🔹 MACRO: ${macro.label}\n`;
    const macroMicros = micros.filter(m => m.parent_value === macro.value);
    
    for (const micro of macroMicros) {
      formatted += `   ├── MICRO: ${micro.label}\n`;
      const microTemas = temas.filter(t => t.parent_value === micro.value);
      
      for (const tema of microTemas) {
        const temaSubtemas = subtemas.filter(s => s.parent_value === tema.value);
        if (temaSubtemas.length > 0) {
          formatted += `   │   ├── TEMA: ${tema.label}\n`;
          for (const subtema of temaSubtemas) {
            formatted += `   │   │   └── SUBTEMA: ${subtema.label}\n`;
          }
        } else {
          formatted += `   │   └── TEMA: ${tema.label}\n`;
        }
      }
    }
  }

  console.log(`📚 Taxonomia carregada: ${macros.length} macros, ${micros.length} micros, ${temas.length} temas, ${subtemas.length} subtemas`);

  return { macros, micros, temas, subtemas, formatted };
}

// ═══════════════════════════════════════════════════════════════════════════════
// FUNÇÃO: Detectar equivalência semântica no texto da questão
// ═══════════════════════════════════════════════════════════════════════════════
function detectSemanticEquivalence(questionText: string): { 
  match: string | null, 
  canonical: { micro: string, tema: string, subtema: string } | null 
} {
  const textLower = questionText.toLowerCase();
  
  for (const [groupName, group] of Object.entries(SEMANTIC_EQUIVALENCE_GROUPS)) {
    for (const keyword of group.keywords) {
      if (textLower.includes(keyword.toLowerCase())) {
        console.log(`🔍 Match semântico: "${keyword}" → ${groupName}`);
        return { match: groupName, canonical: group.canonical };
      }
    }
  }
  
  return { match: null, canonical: null };
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

    // ═══════════════════════════════════════════════════════════════════════════
    // PASSO 1: Buscar taxonomia canônica do banco
    // ═══════════════════════════════════════════════════════════════════════════
    console.log('📚 Buscando taxonomia canônica do banco de dados...');
    const taxonomy = await fetchCanonicalTaxonomy();

    const currentYear = new Date().getFullYear();
    console.log(`🤖 MODO AGENTE v4.0: Processando ${questions.length} questões com taxonomia dinâmica...`);

    const BATCH_SIZE = 3;
    const results: AgentResult[] = [];

    for (let i = 0; i < questions.length; i += BATCH_SIZE) {
      const batch = questions.slice(i, i + BATCH_SIZE);
      
      // ═══════════════════════════════════════════════════════════════════════
      // PASSO 2: Detectar equivalências semânticas antes de enviar à IA
      // ═══════════════════════════════════════════════════════════════════════
      const semanticHints = batch.map(q => {
        const detection = detectSemanticEquivalence(q.question_text || '');
        return { id: q.id, ...detection };
      });

      const prompt = `${AGENT_POLICY}

${taxonomy.formatted}

═══════════════════════════════════════════════════════════════════════════════
🧠 NORMALIZAÇÃO SEMÂNTICA — CLASSIFICAR POR CONCEITO
═══════════════════════════════════════════════════════════════════════════════

PRINCÍPIO: Classifique pelo CONCEITO QUÍMICO, não pelo texto literal.

REGRAS DE EQUIVALÊNCIA SEMÂNTICA:
- Qualquer menção a "constante de Avogadro", "número de partículas", "mol", 
  "número de átomos/moléculas/íons/prótons/nêutrons/elétrons" 
  → MICRO: Cálculos Químicos, TEMA: Cálculos, SUBTEMA: Quantidade de Matéria

- Menções a "Lavoisier", "Proust", "conservação de massa"
  → MICRO: Cálculos Químicos, TEMA: Leis Ponderais

- Menções a "Dalton átomo", "Thomson", "Rutherford", "Bohr", "modelo atômico"
  → MICRO: Atomística, TEMA: Modelos Atômicos

- Menções a "orbital", "subnível", "configuração eletrônica", "Pauling"
  → MICRO: Atomística, TEMA: Distribuição Eletrônica

- Menções a "VSEPR", "geometria molecular", "tetraédrica", "linear"
  → MICRO: Ligações Químicas, TEMA: Ligação Covalente, SUBTEMA: Geometria Molecular

${semanticHints.some(h => h.match) ? `
⚠️ DETECÇÕES SEMÂNTICAS ENCONTRADAS:
${semanticHints.filter(h => h.match).map(h => `- Questão ${h.id}: Match "${h.match}" → Sugestão: ${JSON.stringify(h.canonical)}`).join('\n')}
` : ''}

═══════════════════════════════════════════════════════════════════════════════
QUESTÕES PARA ANÁLISE — MODO AGENTE v4.0
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

  const hint = semanticHints.find(h => h.id === q.id);

  return `
━━━ QUESTÃO ${idx + 1} (ID: ${q.id}) ━━━
⚠️ CAMPOS VAZIOS: ${camposVazios.length > 0 ? camposVazios.join(', ') : 'Nenhum'}
${hint?.match ? `🔍 MATCH SEMÂNTICO DETECTADO: ${hint.match} → Use: ${JSON.stringify(hint.canonical)}` : ''}

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
- ANO: ${q.suggested_ano || `❌ VAZIO - INFERIR (usar ${currentYear} se não identificável)`}
`;
}).join('\n')}

═══════════════════════════════════════════════════════════════════════════════
RESPONDA COM JSON VÁLIDO (array de objetos):
═══════════════════════════════════════════════════════════════════════════════

[
  {
    "id": "id_da_questao",
    "macro": "Química Geral|Química Orgânica|Físico-Química|Química Ambiental|Bioquímica",
    "micro": "USAR EXATAMENTE DA LISTA CANÔNICA",
    "tema": "USAR EXATAMENTE DA LISTA CANÔNICA",
    "subtema": "USAR EXATAMENTE DA LISTA CANÔNICA (ou vazio se não houver)",
    "difficulty": "fácil|médio|difícil",
    "banca": "nome_da_banca_ou_Autoral",
    "ano": ${currentYear},
    "explanation": "resolução comentada completa",
    "confidence": 0.95,
    "reasoning": "breve explicação",
    "fields_inferred": ["lista dos campos preenchidos"],
    "corrections": ["correções feitas"],
    "semantic_match": "nome do grupo semântico se aplicável"
  }
]

REGRAS CRÍTICAS:
1. TODOS os campos devem ter valor - NENHUM pode ficar vazio ou null
2. USE APENAS valores da TAXONOMIA CANÔNICA (do banco de dados)
3. Se houver MATCH SEMÂNTICO detectado, USE a sugestão canônica
4. Se EXPLICAÇÃO estava vazia, GERE uma resolução comentada completa
5. confidence deve refletir sua certeza (0.0 a 1.0)`;

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
              content: `Você é um agente especialista em classificação de questões de Química.
              
MODO AGENTE v4.0:
1. Você DEVE usar APENAS os valores da taxonomia canônica fornecida
2. Você DEVE aplicar normalização semântica (classificar por conceito, não por texto)
3. Você DEVE preencher TODOS os campos vazios
4. Quando um MATCH SEMÂNTICO é detectado, você DEVE usar a classificação sugerida

Sempre responda com JSON válido.` 
            },
            { role: 'user', content: prompt }
          ],
          temperature: 0.2,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ Erro na API: ${response.status}`, errorText);
        
        // Fallback com semântica local
        for (const q of batch) {
          const fieldsInferred = [];
          const hint = semanticHints.find(h => h.id === q.id);
          
          const macro = q.suggested_macro || 'Química Geral';
          if (!q.suggested_macro) fieldsInferred.push('MACRO');
          
          // Se tem match semântico, usar sugestão
          const micro = hint?.canonical?.micro || q.suggested_micro || 'Cálculos Químicos';
          if (!q.suggested_micro || hint?.canonical?.micro) fieldsInferred.push('MICRO');
          
          const tema = hint?.canonical?.tema || q.suggested_tema || 'Cálculos';
          if (!q.suggested_tema || hint?.canonical?.tema) fieldsInferred.push('TEMA');
          
          const subtema = hint?.canonical?.subtema || q.suggested_subtema || 'Quantidade de Matéria';
          if (!q.suggested_subtema || hint?.canonical?.subtema) fieldsInferred.push('SUBTEMA');
          
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
            confidence: hint?.match ? 0.7 : 0.3,
            reasoning: hint?.match ? `Fallback com match semântico: ${hint.match}` : 'Fallback automático (erro na IA)',
            fields_inferred: fieldsInferred,
            corrections: [],
            semantic_match: hint?.match || undefined
          });
        }
        continue;
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || '';
      
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

      for (const q of batch) {
        const result = parsedResults.find(r => r.id === q.id);
        const hint = semanticHints.find(h => h.id === q.id);
        
        if (result) {
          const fieldsInferred = result.fields_inferred || [];
          
          results.push({
            id: q.id,
            macro: result.macro || q.suggested_macro || 'Química Geral',
            micro: result.micro || hint?.canonical?.micro || q.suggested_micro || 'Cálculos Químicos',
            tema: result.tema || hint?.canonical?.tema || q.suggested_tema || 'Cálculos',
            subtema: result.subtema || hint?.canonical?.subtema || q.suggested_subtema || '',
            difficulty: result.difficulty || q.suggested_difficulty || 'médio',
            banca: result.banca || q.suggested_banca || 'Autoral',
            ano: result.ano || parseInt(String(q.suggested_ano)) || currentYear,
            explanation: result.explanation || q.explanation || 'Resolução comentada não disponível.',
            confidence: result.confidence || 0.7,
            reasoning: result.reasoning || 'Classificação automática',
            fields_inferred: fieldsInferred,
            corrections: result.corrections || [],
            semantic_match: result.semantic_match || hint?.match || undefined
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
            micro: hint?.canonical?.micro || q.suggested_micro || 'Cálculos Químicos',
            tema: hint?.canonical?.tema || q.suggested_tema || 'Cálculos',
            subtema: hint?.canonical?.subtema || q.suggested_subtema || '',
            difficulty: q.suggested_difficulty || 'médio',
            banca: q.suggested_banca || 'Autoral',
            ano: parseInt(String(q.suggested_ano)) || currentYear,
            explanation: q.explanation || 'Resolução comentada não disponível.',
            confidence: 0.5,
            reasoning: hint?.match ? `Classificação por match semântico: ${hint.match}` : 'Classificação automática',
            fields_inferred: fieldsInferred,
            corrections: [],
            semantic_match: hint?.match || undefined
          });
        }
      }
    }

    console.log(`✅ Processamento concluído: ${results.length} questões classificadas`);
    console.log(`🔍 Matches semânticos: ${results.filter(r => r.semantic_match).length}`);

    return new Response(
      JSON.stringify({ results, taxonomy_loaded: taxonomy.macros.length > 0 }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Erro geral:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro desconhecido' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
