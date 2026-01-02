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
🤖 MODO AGENTE v5.0 — INFERÊNCIA CONDICIONAL + NORMALIZAÇÃO SEMÂNTICA

══════════════════════════════════════════════════════════════════════════════
REGRA ABSOLUTA: RESPEITAR DADOS DO USUÁRIO — INFERIR APENAS SE NECESSÁRIO
══════════════════════════════════════════════════════════════════════════════

PRINCÍPIO FUNDAMENTAL:
1. Se os campos de taxonomia JÁ ESTÃO PREENCHIDOS → RESPEITAR (não alterar)
2. Se os campos estão TODOS VAZIOS → INFERIR a partir do conteúdo
3. Se há DISCORDÂNCIA EXTREMA (erro conceitual grave) → CORRIGIR e avisar

QUANDO INFERIR (apenas um desses casos):
✅ CASO 1: Todos os campos de taxonomia estão vazios (macro, micro, tema, subtema)
✅ CASO 2: Há discordância EXTREMA entre o conteúdo e a classificação sugerida
   - Exemplo: Questão fala de "ligações químicas" mas está classificada como "Estequiometria"

QUANDO NÃO INFERIR:
❌ Se o usuário já preencheu os campos e fazem sentido conceitual → RESPEITAR
❌ Se a classificação é apenas "menos precisa" mas não errada → MANTER

CAMPOS QUE PODEM SER INFERIDOS (quando aplicável):
- MACRO, MICRO, TEMA, SUBTEMA (apenas se vazios OU erro extremo)
- DIFICULDADE (inferir se vazio)
- BANCA (inferir se vazio ou usar "Autoral")
- ANO (inferir se vazio ou usar ano atual)
- EXPLICAÇÃO (gerar resolução comentada se ausente)
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

// ═══════════════════════════════════════════════════════════════════════════════
// FUNÇÃO: Verificar se há discordância extrema (erro conceitual grave)
// ═══════════════════════════════════════════════════════════════════════════════
function detectExtremeDiscordance(
  questionText: string, 
  suggestedMicro: string | undefined,
  semanticMatch: { micro: string, tema: string, subtema: string } | null
): { hasDiscordance: boolean, reason: string } {
  // Se não tem sugestão ou não tem match semântico, não há discordância a verificar
  if (!suggestedMicro || !semanticMatch) {
    return { hasDiscordance: false, reason: '' };
  }
  
  // Normalizar para comparação
  const suggestedNormalized = suggestedMicro.toLowerCase().trim();
  const semanticNormalized = semanticMatch.micro.toLowerCase().trim();
  
  // Se são iguais ou similares, não há discordância
  if (suggestedNormalized === semanticNormalized || 
      suggestedNormalized.includes(semanticNormalized) ||
      semanticNormalized.includes(suggestedNormalized)) {
    return { hasDiscordance: false, reason: '' };
  }
  
  // Verificar discordância EXTREMA (MICROs completamente diferentes)
  // Ex: Questão fala de "ligação covalente" mas está classificada como "Estequiometria"
  const incompatiblePairs: Record<string, string[]> = {
    'ligações químicas': ['estequiometria', 'gases', 'cálculos químicos'],
    'estequiometria': ['atomística', 'ligações químicas', 'tabela periódica'],
    'atomística': ['estequiometria', 'gases', 'funções inorgânicas'],
    'funções inorgânicas': ['atomística', 'gases'],
    'gases': ['ligações químicas', 'atomística', 'funções inorgânicas'],
    'cálculos químicos': ['ligações químicas', 'atomística'],
    'tabela periódica': ['estequiometria', 'gases'],
  };
  
  for (const [semantic, incompatible] of Object.entries(incompatiblePairs)) {
    if (semanticNormalized.includes(semantic)) {
      for (const incompat of incompatible) {
        if (suggestedNormalized.includes(incompat)) {
          const reason = `DISCORDÂNCIA EXTREMA: Conteúdo é "${semanticMatch.micro}" mas está classificado como "${suggestedMicro}"`;
          console.log(`⚠️ ${reason}`);
          return { hasDiscordance: true, reason };
        }
      }
    }
  }
  
  return { hasDiscordance: false, reason: '' };
}

// ═══════════════════════════════════════════════════════════════════════════════
// FUNÇÃO: Verificar se os campos de taxonomia estão todos vazios
// ═══════════════════════════════════════════════════════════════════════════════
function isTaxonomyEmpty(question: QuestionInput): boolean {
  return !question.suggested_macro && 
         !question.suggested_micro && 
         !question.suggested_tema && 
         !question.suggested_subtema;
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
    console.log(`🤖 MODO AGENTE v5.0: Processando ${questions.length} questões com inferência condicional...`);

    const BATCH_SIZE = 3;
    const results: AgentResult[] = [];

    for (let i = 0; i < questions.length; i += BATCH_SIZE) {
      const batch = questions.slice(i, i + BATCH_SIZE);
      
      // ═══════════════════════════════════════════════════════════════════════
      // PASSO 2: Detectar equivalências semânticas e verificar condições de inferência
      // ═══════════════════════════════════════════════════════════════════════
      const analysisResults = batch.map(q => {
        const detection = detectSemanticEquivalence(q.question_text || '');
        const isEmpty = isTaxonomyEmpty(q);
        const discordance = detectExtremeDiscordance(q.question_text || '', q.suggested_micro, detection.canonical);
        
        // DECIDIR: Inferir ou Respeitar
        const shouldInfer = isEmpty || discordance.hasDiscordance;
        
        return { 
          id: q.id, 
          ...detection, 
          isEmpty,
          discordance,
          shouldInfer,
          action: isEmpty ? 'INFERIR_TUDO' : (discordance.hasDiscordance ? 'CORRIGIR_ERRO' : 'MANTER_ORIGINAL')
        };
      });
      
      // Log das decisões
      analysisResults.forEach(a => {
        console.log(`📋 Questão ${a.id}: Ação=${a.action}, Match=${a.match || 'nenhum'}, Vazio=${a.isEmpty}, Discordância=${a.discordance.hasDiscordance}`);
      });

      // ═══════════════════════════════════════════════════════════════════════
      // SEPARAR: Questões que precisam de IA vs. que devem manter original
      // ═══════════════════════════════════════════════════════════════════════
      const questionsToInfer = batch.filter((q, idx) => analysisResults[idx].shouldInfer);
      const questionsToKeep = batch.filter((q, idx) => !analysisResults[idx].shouldInfer);
      
      // Processar questões que devem MANTER ORIGINAL (sem chamar IA)
      for (const q of questionsToKeep) {
        const analysis = analysisResults.find(a => a.id === q.id);
        console.log(`✅ Questão ${q.id}: MANTENDO classificação original do usuário`);
        
        results.push({
          id: q.id,
          macro: q.suggested_macro || 'Química Geral',
          micro: q.suggested_micro || '',
          tema: q.suggested_tema || '',
          subtema: q.suggested_subtema || '',
          difficulty: q.suggested_difficulty || 'médio',
          banca: q.suggested_banca || 'Autoral',
          ano: parseInt(String(q.suggested_ano)) || currentYear,
          explanation: q.explanation || 'Resolução não disponível.',
          confidence: 1.0, // Alta confiança pois respeitou o usuário
          reasoning: 'Classificação do usuário mantida (campos preenchidos sem discordância extrema)',
          fields_inferred: [],
          corrections: [],
          semantic_match: analysis?.match || undefined
        });
      }
      
      // Se não há questões para inferir, pular para próximo batch
      if (questionsToInfer.length === 0) {
        console.log(`⏭️ Batch ${i / BATCH_SIZE + 1}: Nenhuma questão precisa de inferência`);
        continue;
      }
      
      console.log(`🧠 Batch ${i / BATCH_SIZE + 1}: ${questionsToInfer.length} questões para inferir via IA`);

      const semanticHints = questionsToInfer.map(q => analysisResults.find(a => a.id === q.id)!);

      const prompt = `${AGENT_POLICY}

${taxonomy.formatted}

═══════════════════════════════════════════════════════════════════════════════
🧠 MODO AGENTE v5.0 — INFERÊNCIA CONDICIONAL
═══════════════════════════════════════════════════════════════════════════════

CONTEXTO: Estas questões foram selecionadas para inferência porque:
- Campos de taxonomia estão VAZIOS, OU
- Há DISCORDÂNCIA EXTREMA entre conteúdo e classificação

SUA TAREFA:
1. ANALISAR o conceito químico de cada questão
2. CLASSIFICAR usando a taxonomia canônica
3. GERAR resolução se não existir

REGRAS DE EQUIVALÊNCIA SEMÂNTICA:
- "constante de Avogadro", "número de partículas", "mol" → Cálculos Químicos > Cálculos > Quantidade de Matéria
- "Lavoisier", "Proust", "conservação de massa" → Cálculos Químicos > Leis Ponderais
- "modelo atômico", "Dalton", "Thomson", "Rutherford", "Bohr" → Atomística > Modelos Atômicos
- "VSEPR", "geometria molecular" → Ligações Químicas > Ligação Covalente > Geometria Molecular

${semanticHints.some(h => h.match) ? `
⚠️ DETECÇÕES SEMÂNTICAS:
${semanticHints.filter(h => h.match).map(h => `- Questão ${h.id}: "${h.match}" → ${JSON.stringify(h.canonical)}`).join('\n')}
` : ''}

═══════════════════════════════════════════════════════════════════════════════
QUESTÕES PARA INFERÊNCIA — MODO AGENTE v5.0
═══════════════════════════════════════════════════════════════════════════════

${questionsToInfer.map((q, idx) => {
  const analysis = semanticHints[idx];
  
  return `
━━━ QUESTÃO ${idx + 1} (ID: ${q.id}) ━━━
📌 MOTIVO DA INFERÊNCIA: ${analysis.action === 'INFERIR_TUDO' ? 'Campos vazios' : `Discordância: ${analysis.discordance.reason}`}
${analysis.match ? `🔍 MATCH SEMÂNTICO: ${analysis.match} → ${JSON.stringify(analysis.canonical)}` : ''}

ENUNCIADO:
${q.question_text?.substring(0, 2000) || 'N/A'}

${q.options ? `ALTERNATIVAS: ${JSON.stringify(q.options)}` : ''}
${q.correct_answer ? `GABARITO: ${q.correct_answer}` : ''}
${q.explanation ? `RESOLUÇÃO EXISTENTE: ${q.explanation.substring(0, 800)}` : '⚠️ SEM RESOLUÇÃO - GERAR COMPLETA'}
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
              
MODO AGENTE v5.0:
1. Você DEVE usar APENAS os valores da taxonomia canônica fornecida
2. Você está analisando questões que PRECISAM de inferência (campos vazios ou erro grave)
3. Quando um MATCH SEMÂNTICO é detectado, use a classificação sugerida
4. Gere resolução comentada quando ausente

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
        
        // Fallback com semântica local para questões que precisam inferência
        for (const q of questionsToInfer) {
          const fieldsInferred = [];
          const hint = semanticHints.find(h => h.id === q.id);
          
          const macro = hint?.canonical ? 'Química Geral' : (q.suggested_macro || 'Química Geral');
          fieldsInferred.push('MACRO');
          
          const micro = hint?.canonical?.micro || 'Cálculos Químicos';
          fieldsInferred.push('MICRO');
          
          const tema = hint?.canonical?.tema || 'Cálculos';
          fieldsInferred.push('TEMA');
          
          const subtema = hint?.canonical?.subtema || '';
          if (subtema) fieldsInferred.push('SUBTEMA');
          
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

      for (const q of questionsToInfer) {
        const result = parsedResults.find(r => r.id === q.id);
        const hint = semanticHints.find(h => h.id === q.id);
        
        if (result) {
          const fieldsInferred = result.fields_inferred || [];
          
          results.push({
            id: q.id,
            macro: result.macro || 'Química Geral',
            micro: result.micro || hint?.canonical?.micro || 'Cálculos Químicos',
            tema: result.tema || hint?.canonical?.tema || 'Cálculos',
            subtema: result.subtema || hint?.canonical?.subtema || '',
            difficulty: result.difficulty || 'médio',
            banca: result.banca || 'Autoral',
            ano: result.ano || currentYear,
            explanation: result.explanation || q.explanation || 'Resolução comentada não disponível.',
            confidence: result.confidence || 0.7,
            reasoning: result.reasoning || 'Classificação por inferência (campos vazios ou discordância)',
            fields_inferred: fieldsInferred,
            corrections: result.corrections || [],
            semantic_match: result.semantic_match || hint?.match || undefined
          });
        } else {
          // Fallback se a IA não retornou este ID
          results.push({
            id: q.id,
            macro: 'Química Geral',
            micro: hint?.canonical?.micro || 'Cálculos Químicos',
            tema: hint?.canonical?.tema || 'Cálculos',
            subtema: hint?.canonical?.subtema || '',
            difficulty: 'médio',
            banca: 'Autoral',
            ano: currentYear,
            explanation: q.explanation || 'Resolução comentada não disponível.',
            confidence: 0.5,
            reasoning: hint?.match ? `Fallback com match semântico: ${hint.match}` : 'Fallback automático',
            fields_inferred: ['MACRO', 'MICRO', 'TEMA'],
            corrections: [],
            semantic_match: hint?.match || undefined
          });
        }
      }
    }

    // Log final com estatísticas
    const inferredCount = results.filter(r => r.fields_inferred.length > 0).length;
    const keptCount = results.filter(r => r.fields_inferred.length === 0).length;
    
    console.log(`✅ Processamento concluído: ${results.length} questões`);
    console.log(`   📝 Inferidas: ${inferredCount} | Mantidas: ${keptCount}`);
    console.log(`   🔍 Matches semânticos: ${results.filter(r => r.semantic_match).length}`);

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
