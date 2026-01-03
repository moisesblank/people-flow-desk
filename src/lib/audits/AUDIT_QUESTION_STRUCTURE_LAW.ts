/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║                                                                              ║
 * ║   📜 LEI PERMANENTE — ESTRUTURA DA ENTIDADE QUESTÃO v2.0                     ║
 * ║                                                                              ║
 * ║   Status: VIGENTE E IMUTÁVEL                                                 ║
 * ║   Data: 2026-01-03                                                           ║
 * ║   Autoridade: OWNER (moisesblank@gmail.com)                                  ║
 * ║                                                                              ║
 * ║   Esta lei define as regras permanentes de estrutura para a Entidade         ║
 * ║   Questão. Aplica-se a TODAS as questões existentes e futuras.               ║
 * ║                                                                              ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

export const QUESTION_STRUCTURE_LAW = {
  version: '2.0.0',
  status: 'IMMUTABLE',
  effectiveDate: '2026-01-03',
  authority: 'OWNER',

  // ═══════════════════════════════════════════════════════════════════════════
  // PARTE I — ESTRUTURA PRINCIPAL
  // ═══════════════════════════════════════════════════════════════════════════

  // 1️⃣ ENUNCIADO — TEXTO CORRIDO (OBRIGATÓRIO)
  enunciado: {
    rule: 'O enunciado DEVE ser sempre texto corrido, sem enumeração solta',
    forbidden: [
      '"Item I, II e III" misturados ou colados no texto',
      'Afirmações numeradas (I, II, III, IV…) soltas no corpo do texto',
      'Estruturas como "Analise as afirmativas I, II e III a seguir…"',
    ],
    required: [
      'Converter afirmações numeradas para texto corrido e coeso',
      'Manter o significado original',
      'Remover enumeração explícita do corpo do texto',
    ],
    example: {
      incorrect: 'Analise as afirmativas I, II e III a seguir…',
      correct: 'Com base no gráfico apresentado, analisa-se o comportamento da substância X em diferentes intervalos de temperatura e tempo, considerando suas fases físicas e os processos de mudança de estado.',
    },
    implementation: 'src/lib/questionStructureNormalizer.ts → normalizeEnunciado()',
  },

  // 2️⃣ AFIRMATIVAS (I, II, III, IV…)
  affirmatives: {
    rule: 'Afirmativas NÃO podem permanecer como lista solta dentro do enunciado',
    required: [
      'Reorganizar internamente',
      'Associar corretamente à lógica da questão',
      'Converter em estrutura compatível com o modelo da entidade QUESTÃO',
      'Podem ser: proposições internas, validações lógicas ou critérios de correção',
    ],
    implementation: 'src/lib/questionStructureNormalizer.ts → normalizeEnunciado()',
  },

  // 3️⃣ ALTERNATIVAS (A, B, C, D, E) — FORMATAÇÃO OBRIGATÓRIA
  alternatives: {
    rule: 'Cada alternativa DEVE estar obrigatoriamente em sua própria linha',
    forbidden: [
      'Alternativas explicadas em sequência contínua no mesmo parágrafo',
      'Alternativas "coladas" umas nas outras',
      'Texto corrido explicando A, B, C, D e E juntos',
    ],
    required: [
      'Formato: linha isolada, clara e independente',
      'A), B), C), D), E) — cada uma em sua linha',
    ],
    mandatoryFormat: `A) texto da alternativa
B) texto da alternativa
C) texto da alternativa
D) texto da alternativa
E) texto da alternativa`,
    implementation: 'src/lib/questionStructureNormalizer.ts → normalizeAlternatives()',
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // PARTE II — ORGANIZAÇÃO DOS BLOCOS AUXILIARES
  // ═══════════════════════════════════════════════════════════════════════════

  // REGRA SUPREMA
  organizationPrinciple: {
    rule: 'Organizar NÃO é reescrever, explicar ou interpretar',
    allowed: ['Estruturar', 'Separar', 'Padronizar', 'Limpar visualmente'],
    forbidden: ['Alterar conteúdo', 'Alterar significado', 'Alterar profundidade', 'Adicionar informações'],
    exception: 'Se o campo vier VAZIO, a IA pode preencher conforme adaptado à área',
  },

  // 1️⃣ COMPETÊNCIA E HABILIDADE — ORGANIZAÇÃO
  competenciaHabilidade: {
    rule: 'Competência e Habilidade não podem ficar misturadas em texto corrido',
    required: [
      'Separar em campos distintos',
      'Cada uma em sua própria linha',
      'NÃO adicionar explicações, comentários ou exemplos',
      'Apenas separar, identificar e normalizar',
    ],
    mandatoryFormat: `Competência de área: texto original da competência.
Habilidade: texto original da habilidade.`,
    implementation: 'src/lib/questionStructureNormalizer.ts → normalizeCompetenciaHabilidade()',
  },

  // 2️⃣ DIRECIONAMENTO / ESTRATÉGIA — ORGANIZAÇÃO
  direcionamento: {
    rule: 'O conteúdo existente NÃO deve ser reescrito nem expandido',
    required: [
      'Remover numeração visual',
      'Remover emojis ou símbolos',
      'Transformar listas ou passos em texto corrido contínuo',
      'Manter exatamente as mesmas ideias',
    ],
    forbidden: ['Criar orientações novas'],
    implementation: 'src/lib/questionStructureNormalizer.ts → normalizeDirecionamento()',
  },

  // 3️⃣ PEGADINHAS COMUNS — ORGANIZAÇÃO
  pegadinhas: {
    rule: 'Manter o texto original',
    required: [
      'Ajustar para texto corrido',
      'Remover redundâncias visuais',
      'Garantir clareza estrutural',
    ],
    forbidden: ['Acrescentar novas pegadinhas', 'Adicionar comentários'],
    implementation: 'src/lib/questionStructureNormalizer.ts → normalizePegadinhas()',
  },

  // 4️⃣ DICA DE OURO — ORGANIZAÇÃO
  dicaDeOuro: {
    rule: 'Manter exatamente o conteúdo existente',
    required: [
      'Garantir que esteja em um único parágrafo',
      'Sem listas, emojis ou quebras desnecessárias',
    ],
    implementation: 'src/lib/questionStructureNormalizer.ts → normalizeDicaDeOuro()',
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // PARTE III — APLICAÇÃO E ENFORCEMENT
  // ═══════════════════════════════════════════════════════════════════════════

  application: {
    scope: [
      'TODAS as questões existentes',
      'TODAS as questões futuras',
      'Importação via Excel/CSV',
      'Criação manual',
      'Geração por IA',
    ],
    enforcement: [
      'Automático na renderização (QuestionEnunciado.tsx, QuestionResolution.tsx)',
      'Automático na importação (QuestionImportDialog.tsx)',
      'Automático na edição (GestaoQuestaoDetalhe.tsx)',
    ],
    files: [
      'src/lib/questionStructureNormalizer.ts',
      'src/lib/audits/CONSTITUTION_QUESTION_ENTITY_v1.ts',
      'src/lib/audits/AUDIT_QUESTION_STRUCTURE_LAW.ts',
      'src/components/shared/QuestionEnunciado.tsx',
      'src/components/shared/QuestionResolution.tsx',
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // DECLARAÇÃO FINAL
  // ═══════════════════════════════════════════════════════════════════════════

  finalDeclaration: {
    text: 'Esta lei é permanente e aplica-se a TODAS as questões do sistema, sem exceção. A organização deve manter fidelidade conceitual absoluta, padronização total de estrutura e máxima legibilidade. Organizar não é reescrever, explicar ou interpretar — somente estruturar, separar, padronizar e limpar visualmente.',
    commandPhrase: 'Aplique exclusivamente organização estrutural nos blocos da questão, sem alterar conteúdo, significado ou profundidade, apenas separando, padronizando e normalizando os textos.',
    binding: true,
  },
} as const;

export default QUESTION_STRUCTURE_LAW;
