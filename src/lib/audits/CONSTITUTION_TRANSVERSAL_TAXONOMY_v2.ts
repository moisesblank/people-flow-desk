// ╔══════════════════════════════════════════════════════════════════════════════╗
// ║                                                                              ║
// ║   🏛️ CONSTITUIÇÃO DO MODELO TRANSVERSAL DE TAXONOMIA — v2.0.0               ║
// ║                                                                              ║
// ║   Status: VIGENTE E IMUTÁVEL                                                ║
// ║   Versão: 2.0.0                                                             ║
// ║   Data: 2026-01-02                                                          ║
// ║   Autoridade: OWNER (moisesblank@gmail.com)                                 ║
// ║                                                                              ║
// ║   ⚠️  ESTA POLÍTICA É DEFINITIVA E PERMANENTE                               ║
// ║   • MACRO = Identidade única e obrigatória da questão                       ║
// ║   • MICRO, TEMA, SUBTEMA, TAGS = Camadas transversais compartilháveis       ║
// ║   • Interdisciplinaridade ocorre pelas camadas, não pelo MACRO              ║
// ║                                                                              ║
// ╚══════════════════════════════════════════════════════════════════════════════╝

export const TRANSVERSAL_TAXONOMY_CONSTITUTION = {
  version: '2.0.0',
  status: 'IMMUTABLE',
  lastUpdated: '2026-01-02',
  authority: 'OWNER_ONLY',
  ownerEmail: 'moisesblank@gmail.com',
  policyLock: true,

  // ═══════════════════════════════════════════════════════════════════════════
  // POLÍTICA OFICIAL — IDENTIDADE DA QUESTÃO
  // ═══════════════════════════════════════════════════════════════════════════
  macroIdentity: {
    description: 'O MACRO define a identidade única e obrigatória de cada questão.',
    rules: [
      'Cada questão DEVE possuir exatamente 1 MACRO',
      'MACRO é campo obrigatório (NOT NULL)',
      'MACRO é individual por questão',
      'MACRO NÃO pode ser múltiplo (array)',
      'MACRO define a identidade pedagógica principal da questão',
    ],
    databaseRequirements: {
      type: 'TEXT',
      required: true,
      singleValue: true,
      nullable: false,
    },
    validation: {
      frontend: 'Campo obrigatório no formulário, bloqueio de submit sem MACRO',
      backend: 'Bloquear salvamento de questão sem MACRO',
      import: 'Se MACRO vazio → ERRO e bloqueio da importação',
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // MODELO 100% TRANSVERSAL — CAMADAS COMPARTILHÁVEIS
  // ═══════════════════════════════════════════════════════════════════════════
  transversalModel: {
    description: 'MICRO, TEMA, SUBTEMA e TAGS podem ser compartilhados entre questões, independentemente do MACRO.',
    rules: [
      'MICRO pode ser reutilizado entre diferentes MACROs',
      'TEMA pode ser reutilizado entre diferentes MACROs',
      'SUBTEMA pode ser reutilizado entre diferentes MACROs',
      'TAGS são livres, múltiplas e compartilháveis',
      'MICRO, TEMA, SUBTEMA e TAGS NÃO definem identidade principal',
    ],
    layers: {
      micro: {
        type: 'TEXT',
        required: false,
        shared: true,
        description: 'Assunto específico, transversal a qualquer MACRO',
      },
      tema: {
        type: 'TEXT',
        required: false,
        shared: true,
        description: 'Tema específico, transversal a qualquer MACRO',
      },
      subtema: {
        type: 'TEXT',
        required: false,
        shared: true,
        description: 'Subtema específico, transversal a qualquer MACRO',
      },
      tags: {
        type: 'TEXT[]',
        required: false,
        shared: true,
        description: 'Tags livres, múltiplas e compartilháveis',
      },
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // INTERDISCIPLINARIDADE — REGRA DE OURO
  // ═══════════════════════════════════════════════════════════════════════════
  interdisciplinarityRule: {
    description: 'Interdisciplinaridade ocorre por camadas transversais, sem alterar o MACRO.',
    examples: [
      {
        scenario: 'Questão sobre biocombustíveis e efeito estufa',
        macro: 'quimica_ambiental',
        micro: 'fisico_quimica',
        tema: 'quimica_geral',
        subtema: 'quimica_organica',
        reasoning: 'MACRO = Ambiental (tema central), camadas de outras áreas relacionadas',
      },
      {
        scenario: 'Questão sobre pH da chuva ácida',
        macro: 'quimica_ambiental',
        micro: 'equilibrio_quimico',
        tema: 'ph_e_poh',
        subtema: 'ionizacao',
        reasoning: 'MACRO = Ambiental, MICRO = Físico-Química (equilíbrio/pH)',
      },
      {
        scenario: 'Questão sobre combustão de etanol',
        macro: 'quimica_organica',
        micro: 'termoquimica',
        tema: 'entalpia',
        subtema: 'combustao',
        reasoning: 'MACRO = Orgânica (etanol), MICRO = Físico-Química (termoquímica)',
      },
    ],
    rules: [
      'Uma questão pode ter MACRO = Química Ambiental',
      'Essa mesma questão pode ter MICRO de Físico-Química',
      'Essa mesma questão pode ter TEMA de Química Geral',
      'Essa mesma questão pode ter SUBTEMA de Química Orgânica',
      'A IA deve compreender e classificar corretamente essa transversalidade',
      'O MACRO permanece fixo e imutável após definido',
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // MACROS CANÔNICOS — 5 GRANDES ÁREAS
  // ═══════════════════════════════════════════════════════════════════════════
  canonicalMacros: {
    quimica_geral: {
      value: 'quimica_geral',
      label: 'Química Geral',
      icon: '⚗️',
      color: 'amber',
    },
    quimica_organica: {
      value: 'quimica_organica',
      label: 'Química Orgânica',
      icon: '🧪',
      color: 'purple',
    },
    fisico_quimica: {
      value: 'fisico_quimica',
      label: 'Físico-Química',
      icon: '📊',
      color: 'cyan',
    },
    quimica_ambiental: {
      value: 'quimica_ambiental',
      label: 'Química Ambiental',
      icon: '🌍',
      color: 'green',
    },
    bioquimica: {
      value: 'bioquimica',
      label: 'Bioquímica',
      icon: '🧬',
      color: 'pink',
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // VALIDAÇÕES — REGRAS DE ENFORCEMENT
  // ═══════════════════════════════════════════════════════════════════════════
  validation: {
    backend: {
      rules: [
        'Bloquear salvamento de questão sem MACRO',
        'Impedir múltiplos MACRO por questão',
        'Permitir reutilização de MICRO entre diferentes MACROs',
        'Permitir reutilização de TEMA e SUBTEMA entre diferentes MACROs',
        'Permitir múltiplas TAGS',
      ],
    },
    frontend: {
      rules: [
        'Campo MACRO deve ser obrigatório no formulário',
        'Formulário não pode ser submetido sem MACRO',
        'MICRO, TEMA, SUBTEMA e TAGS devem ser campos reutilizáveis',
        'Exibir MACRO como identidade principal da questão',
        'Exibir MICRO, TEMA e SUBTEMA como camadas transversais',
      ],
    },
    import: {
      excelRules: [
        'Se MACRO estiver vazio: ERRO e bloqueio da importação',
        'MICRO ausente: permitido',
        'TEMA ausente: permitido',
        'SUBTEMA ausente: permitido',
        'TAGS ausentes: permitido',
      ],
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // COMPORTAMENTO DA IA — INFERÊNCIA INTELIGENTE
  // ═══════════════════════════════════════════════════════════════════════════
  aiInferenceBehavior: {
    description: 'A IA analisa o conteúdo da questão e classifica corretamente, podendo corrigir sugestões do Excel.',
    primaryAxis: 'MACRO',
    secondaryAxes: ['MICRO', 'TEMA', 'SUBTEMA', 'TAGS'],
    rules: [
      'A IA deve identificar o CONCEITO PRINCIPAL para definir o MACRO',
      'A IA deve interpretar a classificação como transversal',
      'A IA pode corrigir MACRO se o Excel estiver errado',
      'A IA deve correlacionar conteúdos de diferentes áreas nas camadas',
      'A IA sempre fornece confidence score e reasoning',
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // FILTROS E RELATÓRIOS
  // ═══════════════════════════════════════════════════════════════════════════
  filteringBehavior: {
    primaryFilter: 'MACRO',
    secondaryFilters: ['MICRO', 'TEMA', 'SUBTEMA', 'ANO', 'BANCA', 'DIFICULDADE', 'TAGS'],
    uiModel: {
      macro: 'Select obrigatório',
      micro: 'Autocomplete livre (busca global, qualquer MACRO)',
      tema: 'Autocomplete livre (busca global)',
      subtema: 'Autocomplete livre (busca global)',
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // CLÁUSULA DE IMUTABILIDADE
  // ═══════════════════════════════════════════════════════════════════════════
  immutabilityClause: {
    description: 'Esta política é definitiva e permanente.',
    prohibitions: [
      'Não permitir múltiplos MACRO por questão',
      'Não converter MACRO para ARRAY',
      'Não transformar MICRO em identidade principal',
      'Toda nova funcionalidade deve respeitar este modelo transversal',
      'Qualquer exceção exige refatoração estrutural explícita',
    ],
  },
} as const;

// ═══════════════════════════════════════════════════════════════════════════
// REGRA DE OURO — MODELO TRANSVERSAL
// ═══════════════════════════════════════════════════════════════════════════
export const TRANSVERSAL_GOLDEN_RULE = `
╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║   🏛️ CONSTITUIÇÃO DO MODELO TRANSVERSAL — REGRA DE OURO                     ║
║                                                                              ║
║   ▸ MACRO = IDENTIDADE ÚNICA E OBRIGATÓRIA                                  ║
║     → Cada questão possui EXATAMENTE 1 MACRO                                ║
║     → Define a grande área de conhecimento                                  ║
║     → NÃO pode ser múltiplo ou array                                        ║
║                                                                              ║
║   ▸ MICRO, TEMA, SUBTEMA, TAGS = CAMADAS TRANSVERSAIS                       ║
║     → Podem vir de QUALQUER MACRO                                           ║
║     → Compartilháveis entre questões                                        ║
║     → Permitem interdisciplinaridade                                        ║
║                                                                              ║
║   ▸ EXEMPLO:                                                                ║
║     MACRO: Química Ambiental                                                ║
║     MICRO: Físico-Química (Termoquímica)                                    ║
║     TEMA: Química Geral (Reações)                                           ║
║     SUBTEMA: Orgânica (Biocombustíveis)                                     ║
║                                                                              ║
║   ESTA POLÍTICA É DEFINITIVA E PERMANENTE.                                  ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
`;

// ═══════════════════════════════════════════════════════════════════════════
// VALIDAÇÃO DE QUESTÃO — EXPORT PARA USO NO SISTEMA
// ═══════════════════════════════════════════════════════════════════════════
export function validateQuestionTaxonomy(question: {
  macro?: string | null;
  micro?: string | null;
  tema?: string | null;
  subtema?: string | null;
}): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // MACRO é obrigatório
  if (!question.macro || question.macro.trim() === '') {
    errors.push('MACRO é obrigatório. Cada questão deve ter exatamente 1 MACRO.');
  }

  // Validar que MACRO não é array (caso venha como string "[]" ou similar)
  if (question.macro && (question.macro.startsWith('[') || question.macro.includes(','))) {
    errors.push('MACRO deve ser único. Não é permitido múltiplos valores.');
  }

  // Warnings para campos opcionais
  if (!question.micro) {
    warnings.push('MICRO não informado. A IA tentará inferir.');
  }
  if (!question.tema) {
    warnings.push('TEMA não informado. A IA tentará inferir.');
  }
  if (!question.subtema) {
    warnings.push('SUBTEMA não informado. A IA tentará inferir.');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

export default TRANSVERSAL_TAXONOMY_CONSTITUTION;
