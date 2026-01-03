/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║                                                                              ║
 * ║   🏛️ QUESTION ENTITY NEW NORMAL CONSTITUTION v1.0                           ║
 * ║                                                                              ║
 * ║   Status: PERMANENT | Immutable: TRUE | Authority: OWNER ONLY               ║
 * ║   Effective Date: 2025-01-03                                                 ║
 * ║                                                                              ║
 * ║   This constitution consolidates ALL rules, constraints, behaviors,          ║
 * ║   validations, auto-fix layers, audit mechanisms, performance safeguards,   ║
 * ║   and governance principles for the Question entity.                         ║
 * ║                                                                              ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

export const QUESTION_NEW_NORMAL_CONSTITUTION = {
  version: '1.0.0',
  status: 'PERMANENT',
  immutable: true,
  effectiveDate: '2025-01-03',
  authority: 'OWNER_ONLY',

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION I: SCOPE OF APPLICATION
  // ═══════════════════════════════════════════════════════════════════════════
  scopeOfApplication: {
    appliesTo: [
      'ALL existing Question entities',
      'ALL future Question entities',
      'ALL imports (Excel, images, manual input)',
      'ALL AI-assisted processing',
      'ALL UI rendering paths',
      'ALL backend persistence layers'
    ],
    enforcement: 'AUTOMATIC_AND_MANDATORY'
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION II: MANDATORY ENFORCEMENT LAYERS
  // ═══════════════════════════════════════════════════════════════════════════
  enforcementLayers: {
    // Layer 1: Chemical and Linguistic Auto-Fix
    chemicalLinguisticAutoFix: {
      id: 'LAYER_001',
      name: 'Objective Chemical and Linguistic Auto-Fix Layer',
      status: 'ACTIVE',
      description: 'Automatically applies objective, mechanical corrections',
      actions: [
        'Chemical formula formatting (subscripts, superscripts)',
        'Physical state notation (₍s₎, ₍l₎, ₍g₎, ₍aq₎)',
        'Reaction arrow standardization (→, ⇌)',
        'Charge notation (Ca²⁺, Cl⁻)',
        'Grammar and spelling corrections',
        'Symbol cleanup (remove decorative emojis from chemical expressions)'
      ],
      reference: 'src/lib/chemicalFormatter.ts'
    },

    // Layer 2: Chemical Silent Validation
    chemicalSilentValidation: {
      id: 'LAYER_002',
      name: 'Chemical Silent Validation Layer (Laboratory-Grade)',
      status: 'ACTIVE',
      description: 'Validates chemical content without altering meaning',
      rules: [
        'Validate stoichiometric balance',
        'Verify element symbols',
        'Check charge conservation',
        'Never modify semantic meaning',
        'Never alter difficulty or intent'
      ]
    },

    // Layer 3: Image-to-Text Extraction
    imageToTextExtraction: {
      id: 'LAYER_003',
      name: 'Confidence-Gated Image-to-Text Extraction',
      status: 'ACTIVE',
      confidenceThreshold: 0.80,
      description: 'Extract chemical data from images with confidence gating',
      rules: [
        'Only accept extractions with ≥80% confidence',
        'Never fabricate data not present in image',
        'Log all extraction attempts',
        'Preserve original image as fallback'
      ],
      reference: 'supabase/functions/extract-chemical-from-image/index.ts'
    },

    // Layer 4: Analysis Section Behavior
    analysisSectionBehavior: {
      id: 'LAYER_004',
      name: 'Strict Analysis Section Behavior',
      status: 'ACTIVE',
      description: 'Organization only, no content modification',
      principle: 'ORGANIZE_NOT_REWRITE',
      rules: [
        'Preserve original text integrally',
        'Apply only structural organization',
        'Apply visual cleanup (HTML/CSS noise removal)',
        'Never add pedagogical explanations',
        'Never interpret or enrich content'
      ],
      reference: 'src/components/shared/QuestionResolution.tsx'
    },

    // Layer 5: Board Name and Year Normalization
    boardNameYearNormalization: {
      id: 'LAYER_005',
      name: 'Board Name Normalization and Year Sanitation',
      status: 'ACTIVE',
      description: 'Normalize board names and remove years < 2016',
      rules: [
        'Format: "BANCA (YEAR)" uppercase',
        'Strip redundant prefixes',
        'Default to "AUTORAL (YEAR)" if no official board',
        'Silently remove any year < 2016',
        'Never replace with placeholders or inferences'
      ],
      reference: 'src/lib/normalizeBanca.ts'
    },

    // Layer 6: Image Display Standards
    imageDisplayStandards: {
      id: 'LAYER_006',
      name: 'Image Display and Readability Standards',
      status: 'ACTIVE',
      description: 'Ensure pedagogical image visibility',
      sizes: {
        enunciado: { min: 600, max: 1200, unit: 'px' },
        alternatives: { min: 300, max: 800, unit: 'px' },
        resolution: { min: 400, max: 1000, unit: 'px' }
      },
      principle: 'READABILITY_OVER_COMPACTNESS',
      reference: 'src/lib/audits/AUDIT_QUESTION_IMAGE_STANDARD.ts'
    },

    // Layer 7: AI Intervention Logging
    aiInterventionLogging: {
      id: 'LAYER_007',
      name: 'AI Intervention Logging and Visibility',
      status: 'ACTIVE',
      description: 'Log all AI actions with full transparency',
      mandatoryFields: [
        'QUESTION_ID',
        'QUESTION_ENUNCIADO_SNIPPET (≤ 300 chars)',
        'ACTION_TYPE',
        'FIELD_AFFECTED',
        'BEFORE (never empty)',
        'AFTER (never empty)',
        'REASON (human-readable)',
        'CONFIDENCE (when applicable)',
        'TIMESTAMP'
      ],
      rules: [
        'Logs must be expanded by default',
        'BEFORE must show "No previous value existed" if empty',
        'AFTER must show "No value was written; analysis only" if empty',
        'Invalid logs must be flagged'
      ],
      reference: 'src/lib/audits/AUDIT_AI_LOG_POLICY_v2.ts'
    },

    // Layer 8: AI Log Button Sovereignty
    aiLogButtonSovereignty: {
      id: 'LAYER_008',
      name: 'Absolute AI Log Button Accessibility',
      status: 'ACTIVE',
      description: 'AI Log button must always be clickable and visible',
      rules: [
        'z-index: 2147483647 (maximum)',
        'pointer-events: auto (always)',
        'Event propagation blocking',
        'Accessible over any overlay or loading state'
      ],
      reference: 'src/components/gestao/questoes/QuestionAILogButton.tsx'
    },

    // Layer 9: Structure Normalization
    structureNormalization: {
      id: 'LAYER_009',
      name: 'Question Structure Normalization',
      status: 'ACTIVE',
      description: 'Enforce structural standards for all question parts',
      rules: {
        enunciado: [
          'Must be continuous text (texto corrido)',
          'No loose enumeration (I, II, III)',
          'Roman numerals converted to cohesive text'
        ],
        alternatives: [
          'Each on its own line',
          'Format: A) text, B) text, etc.',
          'No concatenated alternatives'
        ],
        auxiliaryBlocks: [
          'Competência/Habilidade: separated in distinct lines',
          'Direcionamento: continuous text, no emojis/symbols',
          'Pegadinhas: continuous text, no redundancies',
          'Dica de Ouro: single paragraph'
        ]
      },
      reference: 'src/lib/questionStructureNormalizer.ts'
    },

    // Layer 10: Performance Safeguards
    performanceSafeguards: {
      id: 'LAYER_010',
      name: 'Performance Safeguards with Human Authority',
      status: 'ACTIVE',
      description: 'Ensure system performance without compromising data integrity',
      rules: [
        'React Query: staleTime 0, gcTime 5min',
        'Automatic cache invalidation on mutations',
        'CSS-only animations (no framer-motion in critical paths)',
        'Lazy loading for heavy components',
        'Database queries with LIMIT clauses'
      ]
    }
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION III: EXECUTION RULES
  // ═══════════════════════════════════════════════════════════════════════════
  executionRules: {
    automaticActions: [
      'Apply all objective, mechanical corrections automatically',
      'Silently validate all chemical content',
      'Log all AI interventions with full context',
      'Normalize structure on render and save'
    ],
    prohibitedActions: [
      'NEVER generate pedagogical explanations unless OWNER requests',
      'NEVER modify semantic logic, difficulty, or intent',
      'NEVER disable logs, audits, or visibility mechanisms',
      'NEVER bypass confidence thresholds',
      'NEVER weaken constitutional safeguards'
    ]
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION IV: RETROACTIVE APPLICATION
  // ═══════════════════════════════════════════════════════════════════════════
  retroactiveApplication: {
    enabled: true,
    rules: [
      'Apply all enforcement layers to existing entities',
      'Normalize stored data to comply with New Normal',
      'Do not replace or invent content',
      'Preserve original meaning and intent'
    ]
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION V: IMMUTABILITY CLAUSE
  // ═══════════════════════════════════════════════════════════════════════════
  immutabilityClause: {
    statement: 'This New Normal is PERMANENT until explicitly changed by the OWNER.',
    rules: [
      'No AI decision may weaken this standard',
      'No feature flag may bypass enforcement',
      'No optimization may compromise data integrity',
      'No refactor may remove audit capabilities',
      'Any deviation is a CONSTITUTIONAL BREACH'
    ],
    changeAuthority: 'OWNER_ONLY'
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION VI: AUDIT AND COMPLIANCE
  // ═══════════════════════════════════════════════════════════════════════════
  auditAndCompliance: {
    logging: {
      enabled: true,
      location: 'question_ai_intervention_logs',
      visibility: 'MANAGEMENT_INTERFACE_ONLY',
      retention: 'PERMANENT'
    },
    verification: {
      enabled: true,
      methods: [
        'Global AI Log Button',
        'Question-specific AI Log Button',
        'Export capabilities (TXT)'
      ]
    }
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION VII: REFERENCED FILES (SOURCE OF TRUTH)
  // ═══════════════════════════════════════════════════════════════════════════
  referencedFiles: {
    constitutions: [
      'src/lib/audits/CONSTITUTION_QUESTION_ENTITY_v1.ts',
      'src/lib/audits/CONSTITUTION_QUESTION_DOMAIN.ts',
      'src/lib/audits/CONSTITUTION_QUESTION_NEW_NORMAL_v1.ts'
    ],
    laws: [
      'src/lib/audits/AUDIT_QUESTION_STRUCTURE_LAW.ts',
      'src/lib/audits/AUDIT_QUESTION_IMAGE_STANDARD.ts',
      'src/lib/audits/AUDIT_AI_LOG_POLICY_v2.ts'
    ],
    enforcers: [
      'src/lib/chemicalFormatter.ts',
      'src/lib/normalizeBanca.ts',
      'src/lib/questionStructureNormalizer.ts'
    ],
    components: [
      'src/components/shared/QuestionEnunciado.tsx',
      'src/components/shared/QuestionResolution.tsx',
      'src/components/gestao/questoes/QuestionAILogButton.tsx',
      'src/components/gestao/questoes/GlobalAILogButton.tsx',
      'src/components/gestao/questoes/QuestionAILogViewer.tsx'
    ],
    hooks: [
      'src/hooks/useQuestionAILogs.ts',
      'src/hooks/useLogQuestionAIIntervention.ts'
    ],
    edgeFunctions: [
      'supabase/functions/extract-chemical-from-image/index.ts',
      'supabase/functions/log-question-ai-intervention/index.ts',
      'supabase/functions/infer-question-taxonomy/index.ts'
    ]
  }
} as const;

// ═══════════════════════════════════════════════════════════════════════════════
// TYPE EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════
export type QuestionNewNormalConstitution = typeof QUESTION_NEW_NORMAL_CONSTITUTION;
export type EnforcementLayer = keyof typeof QUESTION_NEW_NORMAL_CONSTITUTION.enforcementLayers;

// ═══════════════════════════════════════════════════════════════════════════════
// COMPLIANCE VERIFICATION
// ═══════════════════════════════════════════════════════════════════════════════
export function isConstitutionActive(): boolean {
  return QUESTION_NEW_NORMAL_CONSTITUTION.status === 'PERMANENT';
}

export function getActiveEnforcementLayers(): string[] {
  return Object.values(QUESTION_NEW_NORMAL_CONSTITUTION.enforcementLayers)
    .filter(layer => layer.status === 'ACTIVE')
    .map(layer => layer.name);
}

export function getConstitutionVersion(): string {
  return QUESTION_NEW_NORMAL_CONSTITUTION.version;
}

/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║                                                                              ║
 * ║   FINAL DECLARATION                                                          ║
 * ║                                                                              ║
 * ║   This constitution establishes the PERMANENT operational standard           ║
 * ║   (NEW NORMAL) for all Question entities in the system.                      ║
 * ║                                                                              ║
 * ║   All 10 enforcement layers are ACTIVE and MANDATORY.                        ║
 * ║   Retroactive application is ENABLED.                                        ║
 * ║   This standard is IMMUTABLE until OWNER authorization.                      ║
 * ║                                                                              ║
 * ║   Any violation constitutes a CONSTITUTIONAL BREACH.                         ║
 * ║                                                                              ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */
