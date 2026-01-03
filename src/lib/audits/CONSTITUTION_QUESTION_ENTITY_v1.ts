/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║                                                                              ║
 * ║       CONSTITUIÇÃO DA ENTIDADE QUESTÃO v1.0                                  ║
 * ║       Question Entity Constitution v1.0                                      ║
 * ║                                                                              ║
 * ║       Status: VIGENTE E IMUTÁVEL                                             ║
 * ║       Data de Promulgação: 2026-01-02                                        ║
 * ║       Autoridade: OWNER (moisesblank@gmail.com)                              ║
 * ║                                                                              ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

export const QUESTION_ENTITY_CONSTITUTION = {
  version: '2.0.0',
  status: 'VIGENTE_E_IMUTAVEL',
  promulgationDate: '2026-01-02',
  authority: 'OWNER',

  /**
   * DECLARAÇÃO CONSTITUCIONAL
   * Este documento estabelece as regras constitucionais permanentes que governam
   * a entidade Questão. Todas as políticas, restrições, regras de formatação,
   * regras de normalização, requisitos de auditoria, padrões linguísticos,
   * padrões químicos, regras de visibilidade de UI e regras de sanitização de dados
   * definidas até agora são unificadas e declaradas como o único padrão operacional.
   */
  constitutionalStatement: {
    text: 'This document establishes the permanent constitutional rules governing the Question entity.',
    binding: true,
    immutable: true,
  },

  /**
   * JURAMENTO DE CONFORMIDADE
   */
  oathOfCompliance: {
    text: 'Every Question entity, existing now or created in the future, will comply fully and without exception with all rules defined herein.',
    binding: true,
  },

  /**
   * ESCOPO DE AUTORIDADE
   */
  scopeOfAuthority: [
    'ALL existing Question entities',
    'ALL future Question entities',
    'ALL imports (Excel, images, manual input, AI inference)',
    'ALL UI renderings',
    'ALL backend persistence layers',
    'ALL AI-assisted generation, inference, and correction processes',
  ],

  /**
   * PRINCÍPIOS SUPREMOS
   */
  supremePrinciples: {
    rules: [
      'The Question entity is a first-class, protected entity.',
      'All rules defined apply cumulatively, not selectively.',
      'No rule may be weakened, bypassed, or conditionally ignored.',
      'All changes allowed are organizational, linguistic, visual, or formatting-related only.',
      'Pedagogical meaning, chemical meaning, and structural integrity must never be altered.',
    ],
  },

  /**
   * DOMÍNIOS DE REGRAS CONGELADAS
   * Todas as políticas abaixo são permanentes e imutáveis.
   */
  frozenRuleDomains: {
    // 1. ESTRUTURA E ORGANIZAÇÃO
    structuralOrganization: {
      policy: 'Question Resolution Organization Policy',
      version: '2.1.0',
      mandatorySectionOrder: [
        'ANALYSIS',
        'CONCLUSION_AND_ANSWER',
        'ENEM_COMPETENCE_AND_SKILL',
        'STRATEGY_AND_GUIDANCE',
        'COMMON_TRAPS',
        'GOLDEN_TIP',
      ],
    },

    // 2. GRAMÁTICA PORTUGUESA
    portugueseGrammar: {
      policy: 'Portuguese Grammar and Punctuation Policy',
      version: '2.1.0',
      rules: [
        'Academic Portuguese at doctoral level',
        'One idea per sentence',
        'Controlled pedagogical tone (Nós, A gente)',
        'No grammatical errors tolerated',
      ],
    },

    // 3. SÍMBOLOS PROIBIDOS
    forbiddenSymbols: {
      policy: 'Forbidden Symbols Cleanup Policy',
      version: '2.1.0',
      forbidden: [
        'Emojis (里, , ⚠️, etc.)',
        'Special characters at start of content',
        'Double asterisks (**)',
        'Decorative Unicode symbols',
      ],
      action: 'AUTOMATIC_REMOVAL',
    },

    // 4. NORMALIZAÇÃO DE BANCA
    boardNormalization: {
      policy: 'Permanent Board Name Normalization Policy',
      version: '1.0.0',
      rules: [
        'Official board names only when present',
        'Remove "QUESTÃO SIMULADO PROF. MOISÉS MEDEIROS" prefix when official board exists',
        'Format: BOARD_NAME (YEAR) in uppercase',
        'Use AUTORAL when no official board exists',
      ],
    },

    // 5. SANITIZAÇÃO DE ANO
    yearSanitization: {
      policy: 'Permanent Year Sanitization Policy',
      version: '1.0.0',
      rules: [
        'Remove any year earlier than 2016',
        'Do not replace with placeholder',
        'Preserve all other data',
      ],
      minimumYear: 2016,
    },

    // 6. NOTAÇÃO QUÍMICA
    chemicalNotation: {
      policy: 'Chemical Visual Standardization and Cleanup Policy',
      version: '2.1.0',
      rules: [
        'Physical states as subscripts (H₂O₍ₗ₎)',
        'Electric charges as superscripts (Ca²⁺)',
        'Clear stoichiometric coefficient separation',
        'Standardized arrows (→, ⇌)',
        'Academic rigor in all expressions',
      ],
    },

    // 7. EXTRAÇÃO QUÍMICA DE IMAGENS
    chemicalImageExtraction: {
      policy: 'Permanent Chemical Data Extraction and Normalization Policy',
      version: '1.0.0',
      rules: [
        'Extract chemical data from images',
        'Convert to structured text',
        'Images are visual aids only',
        'Chemical data must exist as text',
      ],
      dataToExtract: [
        'Molar masses (g/mol)',
        'Atomic numbers (Z)',
        'Chemical groups/families',
        'Chemical reactions/equations',
        'Reaction conditions',
        'Alternative options (A, B, C, D, E)',
      ],
    },

    // 8. LINGUAGEM PEDAGÓGICA
    pedagogicalLanguage: {
      policy: 'Pedagogical Language Usage Policy',
      version: '2.1.0',
      rules: [
        'Use "Nós" and "A gente" for controlled personal tone',
        'Clear, accessible explanations',
        'Academic but approachable',
      ],
    },

    // 9. AUDITORIA DE INTERVENÇÕES IA
    aiInterventionAudit: {
      policy: 'AI Intervention Audit Policy',
      version: '1.0.0',
      rules: [
        'All AI interventions must be logged',
        'Logs are immutable',
        'Types: AI_AUTOFILL, AI_ADDITION, AI_CORRECTION, AI_SUGGESTION_APPLIED, AI_CLASSIFICATION_INFERENCE',
        'Include before/after values, confidence score, justification',
      ],
      table: 'question_ai_intervention_logs',
    },

    // 10. VISIBILIDADE DO BOTÃO DE LOGS IA
    aiLogButtonVisibility: {
      policy: 'Absolute AI Log Button Sovereignty Policy',
      version: '1.0.0',
      rules: [
        'Maximum z-index (2147483647)',
        'Portal to document body',
        'pointer-events-auto',
        'stopPropagation on click',
        'Always visible and clickable',
        'Never blocked by modals or overlays',
      ],
    },

    // 11. ESTRUTURA DO ENUNCIADO — LEI v1.0 (TEXTO CORRIDO)
    enunciadoStructure: {
      policy: 'Permanent Enunciado Structure Policy',
      version: '1.0.0',
      rules: [
        'Enunciado DEVE ser texto corrido, sem enumeração solta',
        'PROIBIDO manter "Item I, II e III" misturados ou colados no texto',
        'Afirmações numeradas (I, II, III, IV…) DEVEM ser convertidas para texto corrido e coeso',
        'Manter o significado original, mas sem enumeração explícita no corpo do texto',
        'Converter estruturas como "Analise as afirmativas I, II e III..." para frases coesas',
      ],
      forbiddenPatterns: [
        'Analise as afirmativas I, II e III',
        'Considere as proposições I e II',
        'Verifique os itens I, II, III e IV',
        'Afirmativas soltas: I - ..., II - ..., III - ...',
      ],
      correctExample: 'Com base no gráfico apresentado, analisa-se o comportamento da substância X em diferentes intervalos de temperatura e tempo, considerando suas fases físicas e os processos de mudança de estado.',
    },

    // 12. AFIRMATIVAS (I, II, III, IV) — LEI v1.0
    affirmativesStructure: {
      policy: 'Permanent Affirmatives Structure Policy',
      version: '1.0.0',
      rules: [
        'Afirmativas NÃO podem permanecer como lista solta dentro do enunciado',
        'DEVEM ser reorganizadas internamente',
        'Associadas corretamente à lógica da questão',
        'Convertidas em estrutura compatível com o modelo da entidade QUESTÃO',
        'Podem ser: proposições internas, validações lógicas ou critérios de correção',
      ],
    },

    // 13. ALTERNATIVAS (A, B, C, D, E) — LEI v1.0 (FORMATAÇÃO OBRIGATÓRIA)
    alternativesStructure: {
      policy: 'Permanent Alternatives Structure Policy',
      version: '1.0.0',
      rules: [
        'PROIBIDO apresentar alternativas explicadas em sequência contínua no mesmo parágrafo',
        'Cada alternativa DEVE estar obrigatoriamente em sua própria linha',
        'Formato: linha isolada, clara e independente',
        'A), B), C), D), E) — cada uma em sua linha',
        'NÃO pode haver texto corrido explicando A, B, C, D e E juntos',
        'NÃO pode haver alternativas "coladas" umas nas outras',
      ],
      mandatoryFormat: [
        'A) texto da alternativa',
        'B) texto da alternativa',
        'C) texto da alternativa',
        'D) texto da alternativa',
        'E) texto da alternativa',
      ],
      forbiddenPatterns: [
        'A) ... B) ... C) ... em um único parágrafo',
        'Alternativas coladas sem quebra de linha',
        'Texto corrido com todas alternativas juntas',
      ],
    },
  },

  /**
   * GOVERNANÇA E AUDITORIA
   */
  governanceAndAudit: {
    rules: [
      'All AI interventions must be logged and auditable.',
      'Logs must be visible, accessible, and immutable.',
      'No AI action may occur silently.',
      'Audit visibility has priority over all UI rules.',
    ],
  },

  /**
   * MODELO DE APLICAÇÃO
   */
  enforcementModel: {
    rules: [
      'Violations must be automatically corrected before display.',
      'Corrections must never block rendering.',
      'If correction fails, the system must retry until compliance is achieved.',
      'Non-compliance is considered a critical integrity failure.',
    ],
  },

  /**
   * AUTORIDADE DE MUDANÇA
   */
  changeAuthority: {
    rules: [
      'Only explicit human authorization may alter this constitution.',
      'No AI, automation, feature flag, or refactor may override this document.',
      'Any change requires a new constitutional version.',
    ],
    authorizedParty: 'OWNER (moisesblank@gmail.com)',
  },

  /**
   * DECLARAÇÃO FINAL
   */
  finalDeclaration: {
    text: 'From this moment forward, this Constitution defines the permanent operational reality of the Question entity. There are no temporary rules, no exceptions, and no implicit overrides. This is the new normal.',
    acknowledgementRequired: true,
  },
} as const;

/**
 * TIPO DE CONFORMIDADE CONSTITUCIONAL
 */
export type ConstitutionalCompliance = {
  structuralOrganization: boolean;
  portugueseGrammar: boolean;
  forbiddenSymbolsRemoved: boolean;
  boardNormalized: boolean;
  yearSanitized: boolean;
  chemicalNotationCorrect: boolean;
  chemicalDataExtracted: boolean;
  pedagogicalLanguage: boolean;
  aiInterventionsLogged: boolean;
  aiLogButtonVisible: boolean;
  // v2.0.0 - Novas regras de estrutura
  enunciadoTextoCorrido: boolean;
  affirmativesReorganized: boolean;
  alternativesFormatted: boolean;
};

/**
 * Verifica conformidade constitucional básica
 */
export function checkConstitutionalCompliance(question: {
  banca?: string | null;
  ano?: number | null;
  explanation?: string | null;
}): Partial<ConstitutionalCompliance> {
  const compliance: Partial<ConstitutionalCompliance> = {};

  // Verificar ano sanitizado
  if (question.ano !== undefined && question.ano !== null) {
    compliance.yearSanitized = question.ano >= 2016;
  } else {
    compliance.yearSanitized = true; // Null/undefined is compliant
  }

  // Verificar banca normalizada (básico)
  if (question.banca) {
    const hasInvalidPrefix = question.banca.includes('QUESTÃO SIMULADO PROF. MOISÉS MEDEIROS');
    const isUpperCase = question.banca === question.banca.toUpperCase();
    compliance.boardNormalized = !hasInvalidPrefix && isUpperCase;
  } else {
    compliance.boardNormalized = true;
  }

  // Verificar símbolos proibidos na explicação
  if (question.explanation) {
    const forbiddenPatterns = [/[里⚠️]/g, /^\*\*/];
    compliance.forbiddenSymbolsRemoved = !forbiddenPatterns.some(p => p.test(question.explanation!));
  } else {
    compliance.forbiddenSymbolsRemoved = true;
  }

  return compliance;
}

/**
 * MENSAGEM DE JURAMENTO
 */
export const CONSTITUTIONAL_OATH = `
╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║   🔒 JURAMENTO CONSTITUCIONAL DA ENTIDADE QUESTÃO                           ║
║                                                                              ║
║   Eu, sistema, juro solenemente que toda Entidade Questão, existente        ║
║   agora ou criada no futuro, cumprirá integralmente e sem exceção           ║
║   todas as regras aqui definidas.                                           ║
║                                                                              ║
║   Estas regras constituem o novo normal e permanecerão em vigor até         ║
║   que uma revisão constitucional explícita e autorizada por humano          ║
║   seja emitida.                                                             ║
║                                                                              ║
║   Versão: 1.0.0                                                             ║
║   Data: 2026-01-02                                                          ║
║   Autoridade: OWNER                                                         ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
`;

export default QUESTION_ENTITY_CONSTITUTION;
