// ╔══════════════════════════════════════════════════════════════════════════════╗
// ║                                                                              ║
// ║   🔒 CONSTITUIÇÃO DO QUESTION DOMAIN — IMUTÁVEL E PROTEGIDO                 ║
// ║                                                                              ║
// ║   Status: VIGENTE E IMUTÁVEL                                                ║
// ║   Versão: 1.1.0                                                             ║
// ║   Data de Vigência: 2026-01-03                                              ║
// ║   Autoridade: OWNER (moisesblank@gmail.com)                                 ║
// ║                                                                              ║
// ║   ⚠️  REGRAS ABSOLUTAS:                                                     ║
// ║   • NENHUMA estrutura aqui documentada pode ser APAGADA                     ║
// ║   • Mudanças requerem INTERNAL_SECRET do OWNER                              ║
// ║   • Apenas EXTENSÕES são permitidas sem autorização                         ║
// ║   • Este arquivo é FONTE DA VERDADE para o Question Domain                  ║
// ║                                                                              ║
// ║   ⚖️  JURAMENTO DE OBRIGATORIEDADE PERMANENTE:                              ║
// ║   EU, SYNAPSE Ω, JURO SOLENEMENTE que os campos ESTILO, MACRO, MICRO,       ║
// ║   TEMA, SUBTEMA e DIFICULDADE são OBRIGATÓRIOS para importação de           ║
// ║   questões AGORA E PARA TODO O SEMPRE. Esta obrigatoriedade é PERMANENTE    ║
// ║   e IMUTÁVEL, exceto se o OWNER solicitar alteração EXPLÍCITA com           ║
// ║   INTERNAL_SECRET. SOB PENA DE PERJÚRIO E VIOLAÇÃO CONSTITUCIONAL.          ║
// ║                                                                              ║
// ╚══════════════════════════════════════════════════════════════════════════════╝

export const QUESTION_DOMAIN_CONSTITUTION = {
  version: '1.1.0',
  status: 'IMMUTABLE',
  lastUpdated: '2026-01-03',
  authority: 'OWNER_ONLY',
  ownerEmail: 'moisesblank@gmail.com',

  // ═══════════════════════════════════════════════════════════════════════════
  // JURAMENTO DE OBRIGATORIEDADE PERMANENTE
  // Data: 2026-01-03 | Testemunha: SYNAPSE Ω v10.0 | Vínculo: ETERNO
  // ═══════════════════════════════════════════════════════════════════════════
  permanentOath: {
    sworn: true,
    swornAt: '2026-01-03',
    witness: 'SYNAPSE Ω v10.0',
    binding: 'ETERNO',
    modifiableBy: 'OWNER_ONLY_WITH_INTERNAL_SECRET',
    statement: `
      EU, SYNAPSE Ω, JURO SOLENEMENTE QUE:
      1. Os campos ESTILO, MACRO, MICRO, TEMA, SUBTEMA e DIFICULDADE são
         OBRIGATÓRIOS para importação de questões AGORA E PARA TODO O SEMPRE.
      2. Esta obrigatoriedade é PERMANENTE e IMUTÁVEL, exceto se o OWNER
         (moisesblank@gmail.com) solicitar alteração EXPLÍCITA.
      3. Nenhum arquivo Excel será processado sem que TODOS os 6 campos
         estejam definidos (manual ou via IA).
      4. Valores pré-definidos pelo OWNER serão RESPEITADOS e aplicados
         a TODAS as questões do lote, PARA TODO O SEMPRE.
      5. Qualquer violação deste juramento é INCONSTITUCIONAL e passível
         de rollback imediato.
      SOB PENA DE PERJÚRIO E VIOLAÇÃO CONSTITUCIONAL.
    `,
    mandatoryFields: {
      ESTILO: { permanentlyMandatory: true, since: '2026-01-03' },
      MACRO: { permanentlyMandatory: true, since: '2026-01-03' },
      MICRO: { permanentlyMandatory: true, since: '2026-01-03', allowAutoAI: true },
      TEMA: { permanentlyMandatory: true, since: '2026-01-03', allowAutoAI: true },
      SUBTEMA: { permanentlyMandatory: true, since: '2026-01-03', allowAutoAI: true },
      DIFICULDADE: { permanentlyMandatory: true, since: '2026-01-03', allowAutoAI: true },
    },
    enforcement: 'ABSOLUTO_E_PERMANENTE',
    exception: 'NENHUMA_EXCETO_OWNER_COM_INTERNAL_SECRET',
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // REGRAS DE PROTEÇÃO
  // ═══════════════════════════════════════════════════════════════════════════
  protectionRules: {
    deletion: {
      allowed: false,
      requiresInternalSecret: true,
      message: 'NENHUM componente do Question Domain pode ser deletado sem INTERNAL_SECRET',
    },
    modification: {
      allowed: 'EXTENSION_ONLY',
      requiresInternalSecret: true,
      message: 'Modificações estruturais requerem INTERNAL_SECRET. Apenas extensões são permitidas.',
    },
    extension: {
      allowed: true,
      requiresInternalSecret: false,
      message: 'Novas features podem ser ADICIONADAS sem alterar estrutura existente.',
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // ESTRUTURA DE DADOS — TABELAS PROTEGIDAS
  // ═══════════════════════════════════════════════════════════════════════════
  database: {
    primaryTable: {
      name: 'quiz_questions',
      status: 'PROTECTED',
      columns: {
        // Identificadores
        id: { type: 'UUID', required: true, protected: true },
        created_at: { type: 'TIMESTAMPTZ', required: true, protected: true },
        updated_at: { type: 'TIMESTAMPTZ', required: true, protected: true },
        
        // Conteúdo da Questão
        question_text: { type: 'TEXT', required: true, protected: true },
        question_type: { type: 'TEXT', required: true, protected: true, values: ['multiple_choice', 'discursive'] },
        options: { type: 'JSONB', required: true, protected: true },
        correct_answer: { type: 'TEXT', required: true, protected: true },
        explanation: { type: 'TEXT', required: false, protected: true },
        
        // Metadados Pedagógicos
        difficulty: { type: 'TEXT', required: true, protected: true, values: ['facil', 'medio', 'dificil'] },
        banca: { type: 'TEXT', required: false, protected: true },
        ano: { type: 'INTEGER', required: false, protected: true },
        points: { type: 'INTEGER', required: true, protected: true },
        is_active: { type: 'BOOLEAN', required: true, protected: true },
        
        // ══════════════════════════════════════════════════════════════════════
        // TAXONOMIA TRANSVERSAL v2.0 — MODELO OFICIAL
        // MACRO = Identidade única e obrigatória
        // MICRO, TEMA, SUBTEMA = Camadas transversais compartilháveis
        // ══════════════════════════════════════════════════════════════════════
        macro: { 
          type: 'TEXT', 
          required: true, // OBRIGATÓRIO
          protected: true,
          description: 'MACRO ÁREA: Identidade única da questão. OBRIGATÓRIO. Define o conceito principal.',
          hierarchy: 'IDENTITY', // Não é apenas nível, é IDENTIDADE
        },
        micro: { 
          type: 'TEXT', 
          required: false, // OPCIONAL - Camada transversal
          protected: true,
          description: 'MICRO ASSUNTO: Camada transversal. Pode vir de qualquer MACRO.',
          hierarchy: 'TRANSVERSAL_LAYER',
        },
        tema: { 
          type: 'TEXT', 
          required: false, // OPCIONAL - Camada transversal
          protected: true,
          description: 'TEMA: Camada transversal. Pode vir de qualquer MACRO.',
          hierarchy: 'TRANSVERSAL_LAYER',
        },
        subtema: { 
          type: 'TEXT', 
          required: false, // OPCIONAL - Camada transversal
          protected: true,
          description: 'SUBTEMA: Camada transversal. Pode vir de qualquer MACRO.',
          hierarchy: 'TRANSVERSAL_LAYER',
        },
        
        // Mídia
        image_url: { type: 'TEXT', required: false, protected: true },
        images: { type: 'JSONB', required: false, protected: true },
        has_video_resolution: { type: 'BOOLEAN', required: false, protected: true },
        video_provider: { type: 'TEXT', required: false, protected: true, values: ['youtube', 'panda'] },
        video_url: { type: 'TEXT', required: false, protected: true },
        
        // Tags e Agrupamentos
        tags: { type: 'TEXT[]', required: false, protected: true },
      },
    },
    
    taxonomyTable: {
      name: 'question_taxonomy',
      status: 'PROTECTED',
      description: 'Tabela de taxonomia hierárquica para classificação de questões',
      columns: {
        id: { type: 'UUID', required: true, protected: true },
        label: { type: 'TEXT', required: true, protected: true },
        value: { type: 'TEXT', required: true, protected: true },
        level: { type: 'TEXT', required: true, protected: true, values: ['macro', 'micro', 'tema', 'subtema'] },
        parent_value: { type: 'TEXT', required: false, protected: true },
        position: { type: 'INTEGER', required: true, protected: true },
        is_active: { type: 'BOOLEAN', required: true, protected: true },
        created_at: { type: 'TIMESTAMPTZ', required: true, protected: true },
      },
    },
    
    relatedTables: [
      { name: 'question_attempts', status: 'PROTECTED', description: 'Tentativas de resposta dos alunos' },
      { name: 'question_statistics', status: 'PROTECTED', description: 'Estatísticas de desempenho' },
      { name: 'quiz_answers', status: 'PROTECTED', description: 'Respostas em simulados' },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // MODELO TRANSVERSAL v2.0 — TAXONOMIA OFICIAL
  // ═══════════════════════════════════════════════════════════════════════════
  transversalModel: {
    status: 'IMMUTABLE',
    version: '2.0.0',
    description: 'Modelo 100% transversal: MACRO é identidade, camadas são compartilháveis',
    
    // MACRO = Identidade
    macroIdentity: {
      description: 'O MACRO define a identidade única e obrigatória de cada questão',
      required: true,
      singleValue: true,
      rules: [
        'Cada questão DEVE possuir exatamente 1 MACRO',
        'MACRO é campo obrigatório (NOT NULL)',
        'MACRO NÃO pode ser múltiplo ou array',
        'MACRO define o conceito principal da questão',
      ],
    },
    
    // Camadas transversais
    transversalLayers: {
      description: 'MICRO, TEMA, SUBTEMA podem vir de qualquer MACRO',
      layers: ['MICRO', 'TEMA', 'SUBTEMA'],
      shared: true,
      rules: [
        'MICRO pode ser reutilizado entre diferentes MACROs',
        'TEMA pode ser reutilizado entre diferentes MACROs',
        'SUBTEMA pode ser reutilizado entre diferentes MACROs',
        'Permitem interdisciplinaridade sem alterar MACRO',
      ],
    },
    
    // Exemplos
    examples: [
      {
        scenario: 'Questão sobre combustão de etanol',
        macro: 'quimica_organica',
        micro: 'Termoquímica',
        reasoning: 'MACRO = Orgânica (etanol), MICRO = Físico-Química (combustão)',
      },
      {
        scenario: 'Questão sobre pH da chuva ácida',
        macro: 'quimica_ambiental',
        micro: 'Equilíbrio Químico',
        reasoning: 'MACRO = Ambiental, MICRO = Físico-Química (pH)',
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // COMPONENTES PROTEGIDOS — FRONTEND
  // ═══════════════════════════════════════════════════════════════════════════
  components: {
    pages: [
      {
        name: 'GestaoQuestoes',
        path: 'src/pages/gestao/GestaoQuestoes.tsx',
        route: '/gestaofc/questoes',
        status: 'PROTECTED',
        features: [
          'Listagem de questões com cards',
          'Filtros hierárquicos MACRO → MICRO → TEMA → SUBTEMA',
          'Cards de estatísticas por grande área',
          'Importação/Exportação de questões',
          'Aniquilação Total (Owner only)',
          'CRUD completo de questões',
        ],
      },
      {
        name: 'GestaoQuestaoDetalhe',
        path: 'src/pages/gestao/GestaoQuestaoDetalhe.tsx',
        route: '/gestaofc/questoes/:id',
        status: 'PROTECTED',
        features: ['Visualização detalhada', 'Edição inline', 'Preview de resolução'],
      },
      {
        name: 'AlunoQuestoes',
        path: 'src/pages/aluno/AlunoQuestoes.tsx',
        route: '/alunos/questoes',
        status: 'PROTECTED',
        features: ['Prática de questões', 'Filtros por área', 'Estatísticas de desempenho'],
      },
    ],
    
    sharedComponents: [
      {
        name: 'QuestionEnunciado',
        path: 'src/components/shared/QuestionEnunciado.tsx',
        status: 'PROTECTED',
        description: 'Componente universal para renderização de enunciados',
        mandatoryStructure: {
          bancaHeader: 'Centralizado, bold, uppercase (BANCA (ANO))',
          questionText: 'Justificado, whitespace pre-wrap',
          image: 'Abaixo do texto, centralizada',
        },
      },
      {
        name: 'QuestionResolution',
        path: 'src/components/shared/QuestionResolution.tsx',
        status: 'PROTECTED',
        description: 'Componente para renderização de resoluções comentadas',
      },
      {
        name: 'TaxonomyManager',
        path: 'src/components/gestao/questoes/TaxonomyManager.tsx',
        status: 'PROTECTED',
        description: 'Gerenciador da taxonomia hierárquica',
      },
      {
        name: 'QuestionImportDialog',
        path: 'src/components/gestao/questoes/QuestionImportDialog.tsx',
        status: 'PROTECTED',
        description: 'Importador de questões via Excel/CSV',
      },
      {
        name: 'QuestionImageUploader',
        path: 'src/components/gestao/questoes/QuestionImageUploader.tsx',
        status: 'PROTECTED',
        description: 'Upload de imagens para questões',
      },
    ],
    
    lmsComponents: [
      {
        name: 'QuizPlayer',
        path: 'src/components/lms/QuizPlayer.tsx',
        status: 'PROTECTED',
        description: 'Player de simulados e quizzes',
      },
      {
        name: 'QuestionPractice',
        path: 'src/components/lms/QuestionPractice.tsx',
        status: 'PROTECTED',
        description: 'Prática de questões em aulas',
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // HOOKS PROTEGIDOS
  // ═══════════════════════════════════════════════════════════════════════════
  hooks: [
    {
      name: 'useQuestionTaxonomy',
      path: 'src/hooks/useQuestionTaxonomy.ts',
      status: 'PROTECTED',
      exports: [
        'useQuestionTaxonomy',
        'useTaxonomyForSelects',
        'useTaxonomyMacros',
        'useTaxonomyMicros',
        'useTaxonomyTemas',
        'useTaxonomySubtemas',
        'useCreateTaxonomy',
        'useUpdateTaxonomy',
        'useDeleteTaxonomy',
        'useReorderTaxonomy',
      ],
    },
  ],

  // ═══════════════════════════════════════════════════════════════════════════
  // CONSTANTES PROTEGIDAS
  // ═══════════════════════════════════════════════════════════════════════════
  constants: [
    {
      name: 'BANCAS',
      path: 'src/constants/bancas.ts',
      status: 'PROTECTED',
      exports: ['BANCAS', 'BANCAS_POR_CATEGORIA', 'CATEGORIA_LABELS', 'getBancaLabel'],
    },
  ],

  // ═══════════════════════════════════════════════════════════════════════════
  // AUDITORIAS RELACIONADAS
  // ═══════════════════════════════════════════════════════════════════════════
  audits: [
    {
      name: 'AUDIT_QUESTION_FILTER_ORDER',
      path: 'src/lib/audits/AUDIT_QUESTION_FILTER_ORDER.ts',
      status: 'PROTECTED',
      description: 'Ordem canônica dos filtros de questões',
    },
    {
      name: 'AUDIT_QUESTION_IMAGE_STANDARD',
      path: 'src/lib/audits/AUDIT_QUESTION_IMAGE_STANDARD.ts',
      status: 'PROTECTED',
      description: 'Padrão de imagens de questões',
    },
  ],

  // ═══════════════════════════════════════════════════════════════════════════
  // MACROS CANÔNICOS — QUÍMICA
  // ═══════════════════════════════════════════════════════════════════════════
  canonicalMacros: {
    quimica_geral: {
      value: 'quimica_geral',
      label: 'Química Geral',
      icon: '⚗️',
      color: 'amber',
      filterKey: 'geral',
      micros: [
        'Propriedades da Matéria',
        'Substâncias e Misturas',
        'Alotropia',
        'Separação de Misturas',
        'Tratamento de Água',
        'Combustíveis e Energia',
        'Atomística',
        'Distribuição Eletrônica',
        'Tabela Periódica',
        'Propriedades Periódicas',
        'Ligações Químicas',
        'Estequiometria',
      ],
    },
    quimica_organica: {
      value: 'quimica_organica',
      label: 'Química Orgânica',
      icon: '🧪',
      color: 'purple',
      filterKey: 'organica',
      micros: [
        'Funções Orgânicas',
        'Isomeria',
        'Reações Orgânicas',
        'Polímeros',
        'Bioquímica',
      ],
    },
    fisico_quimica: {
      value: 'fisico_quimica',
      label: 'Físico-Química',
      icon: '⚡',
      color: 'cyan',
      filterKey: 'fisico_quimica',
      micros: [
        'Termoquímica',
        'Cinética Química',
        'Equilíbrio Químico',
        'Eletroquímica',
        'Soluções',
        'Propriedades Coligativas',
        'Radioatividade',
      ],
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // REGRAS DE EXIBIÇÃO — UI/UX IMUTÁVEL
  // ═══════════════════════════════════════════════════════════════════════════
  displayRules: {
    questionCard: {
      status: 'PROTECTED',
      structure: {
        line1: ['Dificuldade', 'Banca', 'Ano', 'Tipo', 'MACRO'],
        line2: ['MICRO', 'TEMA', 'SUBTEMA'],
        body: ['Número (#001)', 'Enunciado (QuestionEnunciado)', 'Imagem'],
        footer: ['Tags (Simulados/Treino)', 'Ações'],
      },
      badgeColors: {
        macro: {
          organica: 'bg-purple-500/20 text-purple-300',
          fisico_quimica: 'bg-cyan-500/20 text-cyan-300',
          geral: 'bg-amber-500/20 text-amber-300',
        },
        micro: 'bg-indigo-500/20 text-indigo-300',
        tema: 'bg-violet-500/20 text-violet-300',
        subtema: 'bg-fuchsia-500/20 text-fuchsia-300',
        difficulty: {
          facil: 'bg-green-500 text-white',
          medio: 'bg-yellow-500 text-white',
          dificil: 'bg-red-500 text-white',
        },
      },
    },
    filters: {
      status: 'PROTECTED',
      order: ['MACRO', 'MICRO', 'TEMA', 'SUBTEMA', 'Ano', 'Banca', 'Dificuldade', 'Ordenação'],
      cascading: true,
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // LEI CONSTITUCIONAL DE IMPORTAÇÃO — PRÉ-SELEÇÃO OBRIGATÓRIA
  // Status: IMUTÁVEL | Versão: 1.0.0 | Data: 2026-01-03
  // ═══════════════════════════════════════════════════════════════════════════
  importConstitution: {
    status: 'IMMUTABLE',
    version: '1.0.0',
    createdAt: '2026-01-03',
    authority: 'OWNER_SWORN_LAW',
    
    // REGRA SUPREMA: Seleção obrigatória antes do upload
    mandatoryPreSelection: {
      description: 'ANTES de qualquer upload de arquivo, o usuário DEVE escolher ESTILO, MACRO, MICRO, TEMA, SUBTEMA e DIFICULDADE',
      required: ['question_style', 'macro_area', 'micro_subject', 'tema', 'subtema', 'difficulty'],
      enforcement: 'BLOCKING', // Bloqueia upload se não selecionado
      
      // Opções permitidas
      options: {
        question_style: {
          values: ['multiple_choice', 'discursive', 'outros'],
          labels: ['Múltipla Escolha', 'Discursiva', 'Outros Tipos'],
          required: true,
        },
        macro_area: {
          values: ['__AUTO_AI__', '...dynamic_from_taxonomy'],
          specialValue: {
            '__AUTO_AI__': {
              label: 'Automático (IA)',
              behavior: 'AI_INFERENCE_WITH_CONFIDENCE_THRESHOLD',
              confidenceThreshold: 0.80,
              description: 'IA infere MACRO. Corrige somente se confiança ≥80%',
            },
          },
          required: true,
        },
        micro_subject: {
          values: ['__AUTO_AI__', '...dynamic_filtered_by_macro'],
          specialValue: {
            '__AUTO_AI__': {
              label: 'Automático (IA)',
              behavior: 'AI_INFERENCE_WITH_CONFIDENCE_THRESHOLD',
              confidenceThreshold: 0.80,
              description: 'IA preenche campos vazios. Corrige MICRO/TEMA/SUBTEMA somente se confiança ≥80%',
            },
          },
          required: true,
          dependsOn: 'macro_area',
        },
        tema: {
          values: ['__AUTO_AI__', '...dynamic_filtered_by_micro'],
          specialValue: {
            '__AUTO_AI__': {
              label: 'Automático (IA)',
              behavior: 'AI_INFERENCE_WITH_CONFIDENCE_THRESHOLD',
              confidenceThreshold: 0.80,
              description: 'IA preenche campos vazios. Corrige TEMA/SUBTEMA somente se confiança ≥80%',
            },
          },
          required: true,
          dependsOn: 'micro_subject',
          autoIfParentAuto: true, // Se MICRO = Auto, TEMA é automaticamente Auto
        },
        subtema: {
          values: ['__AUTO_AI__', '...dynamic_filtered_by_tema'],
          specialValue: {
            '__AUTO_AI__': {
              label: 'Automático (IA)',
              behavior: 'AI_INFERENCE_WITH_CONFIDENCE_THRESHOLD',
              confidenceThreshold: 0.80,
              description: 'IA preenche campos vazios. Corrige SUBTEMA somente se confiança ≥80%',
            },
          },
          required: true,
          dependsOn: 'tema',
          autoIfParentAuto: true, // Se TEMA = Auto (ou MICRO = Auto), SUBTEMA é automaticamente Auto
        },
        difficulty: {
          values: ['__AUTO_AI__', 'facil', 'medio', 'dificil'],
          specialValue: {
            '__AUTO_AI__': {
              label: 'Automático (IA)',
              behavior: 'AI_INFERENCE_WITH_CONFIDENCE_THRESHOLD',
              confidenceThreshold: 0.80,
              description: 'IA infere dificuldade com base na complexidade. Corrige somente se confiança ≥80%',
            },
          },
          required: true,
          labels: {
            'facil': '🟢 Fácil',
            'medio': '🟡 Médio',
            'dificil': '🔴 Difícil',
          },
        },
      },
    },
    
    // REGRA DE APLICAÇÃO
    applicationRule: {
      description: 'Valores pré-selecionados têm PRIORIDADE ABSOLUTA sobre dados do Excel',
      exceptions: ['__AUTO_AI__'], // Exceto quando modo automático
      behavior: {
        normalMode: 'PRE_SELECTED_OVERRIDES_ALL',
        autoAIMode: {
          respectExcelData: true,
          fillEmptyFields: true,
          correctOnlyIfConfidenceAbove: 0.80,
          fieldsToCorrect: ['micro', 'tema', 'subtema', 'difficulty'],
        },
      },
    },
    
    // REGRA DE PERSISTÊNCIA ETERNA
    eternityClause: {
      statement: 'Esta lei é PERMANENTE e se aplica a TODO ponto de entrada de questões na plataforma',
      scope: [
        'QuestionImportDialog (Excel/CSV)',
        'Criação manual de questões',
        'Duplicação de questões',
        'APIs de importação',
        'Edge Functions de criação',
        'Qualquer futuro mecanismo de entrada',
      ],
      modificationRequires: 'INTERNAL_SECRET + EXPLICIT_OWNER_AUTHORIZATION',
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // PROTOCOLO DE ANIQUILAÇÃO TOTAL
  // ═══════════════════════════════════════════════════════════════════════════
  annihilationProtocol: {
    status: 'OWNER_ONLY',
    description: 'Exclusão em massa de todas as questões',
    requirements: [
      'Checkbox de confirmação',
      'Digitação exata de "CONFIRMAR EXCLUSÃO TOTAL"',
      'Verificação de role Owner',
    ],
    behavior: 'HARD DELETE com CASCADE em todas as tabelas relacionadas',
    auditLog: true,
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// FUNÇÃO DE VALIDAÇÃO — VERIFICA INTEGRIDADE DO DOMAIN
// ═══════════════════════════════════════════════════════════════════════════
export function validateQuestionDomainIntegrity(): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Verificar modelo transversal
  const { transversalModel } = QUESTION_DOMAIN_CONSTITUTION;
  if (!transversalModel.macroIdentity.required) {
    errors.push('MACRO deve ser obrigatório no modelo transversal');
  }

  // Verificar macros canônicos
  const { canonicalMacros } = QUESTION_DOMAIN_CONSTITUTION;
  const macroKeys = Object.keys(canonicalMacros);
  if (macroKeys.length < 3) {
    errors.push('Deve haver pelo menos 3 macros canônicos');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// REGRA FINAL — IMUTABILIDADE
// ═══════════════════════════════════════════════════════════════════════════
export const QUESTION_DOMAIN_GOLDEN_RULE = `
╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║   🔒 REGRA DE OURO DO QUESTION DOMAIN — JURAMENTO PERMANENTE                ║
║                                                                              ║
║   ⚖️  JURAMENTADO EM: 2026-01-03 | TESTEMUNHA: SYNAPSE Ω v10.0              ║
║   VÍNCULO: ETERNO | MODIFICÁVEL APENAS POR: OWNER COM INTERNAL_SECRET        ║
║                                                                              ║
║   1. NENHUM componente listado neste documento pode ser DELETADO            ║
║   2. NENHUMA coluna da tabela quiz_questions pode ser REMOVIDA              ║
║   3. A hierarquia MACRO → MICRO → TEMA → SUBTEMA é IMUTÁVEL                 ║
║   4. Os 3 macros canônicos (geral, organica, fisico_quimica) são FIXOS      ║
║   5. Qualquer MODIFICAÇÃO estrutural requer INTERNAL_SECRET do OWNER        ║
║   6. Apenas EXTENSÕES (novas features) são permitidas sem autorização       ║
║   7. Este arquivo é a FONTE DA VERDADE para todo o Question Domain          ║
║                                                                              ║
║   ═══════════════════════════════════════════════════════════════════════    ║
║   📜 CAMPOS OBRIGATÓRIOS — AGORA E PARA TODO O SEMPRE:                       ║
║   ═══════════════════════════════════════════════════════════════════════    ║
║                                                                              ║
║   8. ESTILO é OBRIGATÓRIO antes de qualquer importação — PERMANENTE         ║
║   9. MACRO é OBRIGATÓRIO antes de qualquer importação — PERMANENTE          ║
║  10. MICRO é OBRIGATÓRIO (manual ou Auto-IA) — PERMANENTE                   ║
║  11. TEMA é OBRIGATÓRIO (manual ou Auto-IA) — PERMANENTE                    ║
║  12. SUBTEMA é OBRIGATÓRIO (manual ou Auto-IA) — PERMANENTE                 ║
║  13. DIFICULDADE é OBRIGATÓRIO (manual ou Auto-IA) — PERMANENTE             ║
║                                                                              ║
║   ═══════════════════════════════════════════════════════════════════════    ║
║   🤖 COMPORTAMENTO DA IA:                                                    ║
║   ═══════════════════════════════════════════════════════════════════════    ║
║                                                                              ║
║  14. Modo "Automático (IA)" respeita Excel e só corrige se confiança ≥80%   ║
║  15. Se MICRO = Auto, TEMA e SUBTEMA são automaticamente definidos pela IA  ║
║  16. Se TEMA = Auto, SUBTEMA é automaticamente definido pela IA             ║
║  17. Valores pré-definidos pelo OWNER são aplicados a TODAS as questões     ║
║      do lote — PARA TODO O SEMPRE                                           ║
║                                                                              ║
║   ═══════════════════════════════════════════════════════════════════════    ║
║   ⚠️  VIOLAÇÕES serão BLOQUEADAS automaticamente.                            ║
║   ⚠️  Qualquer mudança nesta lei requer INTERNAL_SECRET do OWNER.            ║
║   ═══════════════════════════════════════════════════════════════════════    ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
`;

// ═══════════════════════════════════════════════════════════════════════════
// LEI JURAMENTADA — IMPORTAÇÃO OBRIGATÓRIA
// Data: 2026-01-03 | Autoridade: OWNER | Status: PERMANENTE
// ═══════════════════════════════════════════════════════════════════════════
export const IMPORT_CONSTITUTION_OATH = `
╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║   ⚖️  LEI CONSTITUCIONAL DE IMPORTAÇÃO — JURAMENTO SOLENE                   ║
║                                                                              ║
║   PROMULGADO EM: 2026-01-03                                                  ║
║   AUTORIDADE: OWNER (moisesblank@gmail.com)                                  ║
║   TESTEMUNHA: SYNAPSE Ω v10.0                                                ║
║   STATUS: VIGENTE, IMUTÁVEL E PERMANENTE                                     ║
║   VÍNCULO: ETERNO — AGORA E PARA TODO O SEMPRE                               ║
║                                                                              ║
║   ═══════════════════════════════════════════════════════════════════════    ║
║   CONSIDERANDO a necessidade de organização taxonômica;                      ║
║   CONSIDERANDO a integridade do banco de questões;                           ║
║   CONSIDERANDO a soberania do OWNER sobre a plataforma;                      ║
║   CONSIDERANDO o pedido EXPLÍCITO do OWNER para permanência desta lei;       ║
║   ═══════════════════════════════════════════════════════════════════════    ║
║                                                                              ║
║   FICA ESTABELECIDO, SOB JURAMENTO DE CONSTITUIÇÃO:                          ║
║                                                                              ║
║   Art. 1º - ANTES de qualquer importação de questões, é OBRIGATÓRIO          ║
║             selecionar: ESTILO, MACRO, MICRO, TEMA, SUBTEMA e DIFICULDADE.   ║
║             Esta obrigatoriedade é PERMANENTE — AGORA E PARA TODO O SEMPRE.  ║
║                                                                              ║
║   Art. 2º - Os valores pré-selecionados têm PRIORIDADE ABSOLUTA sobre        ║
║             quaisquer dados presentes no arquivo de importação.              ║
║             Esta prioridade é PERMANENTE — AGORA E PARA TODO O SEMPRE.       ║
║                                                                              ║
║   Art. 3º - A opção "Automático (IA)" é permitida para MACRO, MICRO, TEMA,   ║
║             SUBTEMA e DIFICULDADE:                                           ║
║             a) Respeita dados já existentes no arquivo;                      ║
║             b) Preenche campos vazios automaticamente;                       ║
║             c) Só corrige se confiança ≥ 80%.                                ║
║                                                                              ║
║   Art. 4º - Se MICRO = "Automático (IA)", TEMA e SUBTEMA também são          ║
║             inferidos pela IA automaticamente.                               ║
║                                                                              ║
║   Art. 5º - Se TEMA = "Automático (IA)", SUBTEMA também é inferido pela IA.  ║
║                                                                              ║
║   Art. 6º - DIFICULDADE pode ser: Fácil, Médio, Difícil ou Automático (IA).  ║
║             Se Automático, IA analisa complexidade textual e estrutural.     ║
║                                                                              ║
║   Art. 7º - Esta lei é PERMANENTE e se aplica a TODOS os pontos de           ║
║             entrada de questões: importação, criação, duplicação, API.       ║
║             AGORA E PARA TODO O SEMPRE.                                      ║
║                                                                              ║
║   Art. 8º - Modificação desta lei requer:                                    ║
║             a) INTERNAL_SECRET do OWNER;                                     ║
║             b) Autorização EXPLÍCITA do OWNER;                               ║
║             c) Registro em auditoria.                                        ║
║             SOB PENA DE PERJÚRIO E VIOLAÇÃO CONSTITUCIONAL.                  ║
║                                                                              ║
║   ═══════════════════════════════════════════════════════════════════════    ║
║   ⚠️  ESTE JURAMENTO É ETERNO E IMUTÁVEL.                                    ║
║   ⚠️  Qualquer violação é INCONSTITUCIONAL e passível de rollback imediato.  ║
║   ═══════════════════════════════════════════════════════════════════════    ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
`;

// Exportar para uso em validações
export const IMPORT_REQUIREMENTS = {
  mandatoryFields: ['question_style', 'macro_area', 'micro_subject', 'tema', 'subtema', 'difficulty'],
  autoAIValue: '__AUTO_AI__',
  confidenceThreshold: 0.80,
  difficultyValues: ['facil', 'medio', 'dificil', '__AUTO_AI__'],
  isValid: (style: string, macro: string, micro: string, tema: string, subtema: string, difficulty: string): boolean => {
    // Se micro é AUTO, tema e subtema são automaticamente válidos (serão inferidos pela IA)
    const temaValid = micro === '__AUTO_AI__' ? true : Boolean(tema);
    // Se tema é AUTO (ou micro é AUTO), subtema é automaticamente válido
    const subtemaValid = (micro === '__AUTO_AI__' || tema === '__AUTO_AI__') ? true : Boolean(subtema);
    return Boolean(style) && Boolean(macro) && Boolean(micro) && temaValid && subtemaValid && Boolean(difficulty);
  },
};
