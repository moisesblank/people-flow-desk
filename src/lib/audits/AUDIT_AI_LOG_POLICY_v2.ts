// ═══════════════════════════════════════════════════════════════════════════════
// POLÍTICA DE AUDITORIA DE IA v2.0
// Question AI Log Mandatory Human-Readable Audit
// STATUS: VIGENTE E IMUTÁVEL
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * @policy Question AI Log Mandatory Human-Readable Audit v2.0
 * @version 2.0.0
 * @status ACTIVE
 * @enforcement ROOT_CODE
 * @scope GLOBAL - Aplicável a todos os logs de IA em /gestaofc/questoes
 */

export const AI_LOG_POLICY_V2 = {
  version: '2.0.0',
  policy_name: 'Question AI Log Mandatory Human-Readable Audit',
  status: 'ACTIVE',
  
  // ═══════════════════════════════════════════════════════════════════════════
  // REGRA SUPREMA
  // ═══════════════════════════════════════════════════════════════════════════
  supreme_rule: {
    statement: 'Any AI log that does not clearly communicate WHAT was done, WHERE it was done, and WHY it was done is INVALID and MUST NOT be rendered.',
    immutable: true,
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // REQUISITOS DE IDENTIFICAÇÃO HUMANA
  // ═══════════════════════════════════════════════════════════════════════════
  log_human_identity_requirement: {
    rules: [
      'Every log entry MUST identify the affected Question in a human-recognizable way.',
      'Each log MUST include a snippet of the Question enunciado.',
      'The snippet MUST contain up to 300 characters.',
      'The snippet MUST be extracted from the beginning of the enunciado.',
      'Logs without enunciado snippet are forbidden.',
    ],
    snippet_max_length: 300,
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // CAMPOS OBRIGATÓRIOS DO LOG
  // ═══════════════════════════════════════════════════════════════════════════
  mandatory_fields: [
    'QUESTION_ID',
    'QUESTION_ENUNCIADO_SNIPPET', // ≤ 300 chars
    'ACTION_TYPE', // AUTOFIX | INFERENCE | VALIDATION | NORMALIZATION
    'FIELD_AFFECTED',
    'BEFORE', // explicit value or explanation
    'AFTER', // explicit value or explanation
    'REASON', // human-readable
    'CONFIDENCE', // when applicable
    'TIMESTAMP',
  ],

  // ═══════════════════════════════════════════════════════════════════════════
  // TIPOS DE AÇÃO VÁLIDOS
  // ═══════════════════════════════════════════════════════════════════════════
  valid_action_types: {
    AUTOFIX: 'Preenchimento automático de campo vazio',
    INFERENCE: 'Inferência baseada em padrões ou conteúdo',
    VALIDATION: 'Verificação e correção de dados existentes',
    NORMALIZATION: 'Padronização de formato ou estrutura',
    CORRECTION: 'Correção de erro ou inconsistência',
    ADDITION: 'Adição de conteúdo novo',
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // REGRAS DE BEFORE/AFTER
  // ═══════════════════════════════════════════════════════════════════════════
  before_after_rules: {
    before_empty_fallback: 'Nenhum valor anterior existia',
    after_empty_fallback: 'Nenhum valor foi escrito; apenas análise',
    rules: [
      'BEFORE may never be shown as empty.',
      'If no previous value existed, BEFORE MUST display fallback text.',
      'AFTER may never be shown as empty.',
      'If no value was written, AFTER MUST display fallback text.',
      'Empty or blank BEFORE/AFTER blocks are forbidden.',
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // REGRAS DE RENDERIZAÇÃO
  // ═══════════════════════════════════════════════════════════════════════════
  rendering_rules: {
    default_expanded: true,
    critical_fields_collapsible: false,
    enunciado_position: 'TOP',
    before_after_visual_distinction: true,
    rules: [
      'Logs must be rendered fully expanded by default.',
      'Critical fields may not be collapsed or hidden.',
      'Enunciado snippet must appear at the top of each log entry.',
      'BEFORE and AFTER must be visually distinguishable.',
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // TRATAMENTO DE LOGS INVÁLIDOS
  // ═══════════════════════════════════════════════════════════════════════════
  invalid_log_handling: {
    flag_as_invalid: true,
    show_warning: true,
    rules: [
      'Logs that do not meet all requirements must be flagged as INVALID.',
      'INVALID logs must display a clear warning message.',
      'INVALID logs must never be silently shown as normal.',
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // APLICAÇÃO RETROATIVA
  // ═══════════════════════════════════════════════════════════════════════════
  retroactive_enforcement: {
    apply_to_existing: true,
    generate_placeholders: true,
    fabricate_missing_values: false,
    rules: [
      'Apply this enforcement to all existing logs.',
      'For legacy logs, generate mandatory explanatory placeholders.',
      'Do not fabricate values that were never present.',
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // CLÁUSULA INEGOCIÁVEL
  // ═══════════════════════════════════════════════════════════════════════════
  non_negotiable_clause: {
    description: 'This policy defines the minimum acceptable standard for AI audit logs.',
    rules: [
      'Logs below this standard are considered audit failures.',
      'Audit visibility overrides UI compactness or aesthetics.',
      'Violation constitutes a constitutional breach.',
    ],
  },
} as const;

// ═══════════════════════════════════════════════════════════════════════════════
// FUNÇÕES DE VALIDAÇÃO E NORMALIZAÇÃO
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Normaliza o valor BEFORE para exibição
 * NUNCA retorna vazio ou null
 */
export function normalizeBeforeValue(value: string | null | undefined): string {
  if (value === null || value === undefined || value.trim() === '') {
    return AI_LOG_POLICY_V2.before_after_rules.before_empty_fallback;
  }
  return value;
}

/**
 * Normaliza o valor AFTER para exibição
 * NUNCA retorna vazio ou null
 */
export function normalizeAfterValue(value: string | null | undefined): string {
  if (value === null || value === undefined || value.trim() === '') {
    return AI_LOG_POLICY_V2.before_after_rules.after_empty_fallback;
  }
  return value;
}

/**
 * Extrai snippet do enunciado com limite de caracteres
 */
export function extractEnunciadoSnippet(
  enunciado: string | null | undefined,
  maxLength: number = AI_LOG_POLICY_V2.log_human_identity_requirement.snippet_max_length
): string {
  if (!enunciado || enunciado.trim() === '') {
    return '[Enunciado não disponível]';
  }
  
  const cleaned = enunciado.trim().replace(/\s+/g, ' ');
  
  if (cleaned.length <= maxLength) {
    return cleaned;
  }
  
  // Cortar na última palavra completa
  const truncated = cleaned.slice(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');
  
  if (lastSpace > maxLength * 0.7) {
    return truncated.slice(0, lastSpace) + '...';
  }
  
  return truncated + '...';
}

/**
 * Valida se um log atende a todos os requisitos obrigatórios
 */
export interface LogValidationResult {
  isValid: boolean;
  missingFields: string[];
  warnings: string[];
}

export function validateLogEntry(log: {
  question_id?: string;
  enunciado_snippet?: string;
  intervention_type?: string;
  field_affected?: string;
  value_before?: string | null;
  value_after?: string;
  action_description?: string;
  ai_confidence_score?: number | null;
  created_at?: string;
}): LogValidationResult {
  const missingFields: string[] = [];
  const warnings: string[] = [];

  // Verificar campos obrigatórios
  if (!log.question_id) missingFields.push('QUESTION_ID');
  if (!log.enunciado_snippet) missingFields.push('QUESTION_ENUNCIADO_SNIPPET');
  if (!log.intervention_type) missingFields.push('ACTION_TYPE');
  if (!log.field_affected) missingFields.push('FIELD_AFFECTED');
  if (!log.action_description) missingFields.push('REASON');
  if (!log.created_at) missingFields.push('TIMESTAMP');

  // Verificar BEFORE/AFTER
  if (log.value_before === undefined) {
    warnings.push('BEFORE value not explicitly set - will use fallback');
  }
  if (!log.value_after && log.value_after !== '') {
    warnings.push('AFTER value not explicitly set - will use fallback');
  }

  return {
    isValid: missingFields.length === 0,
    missingFields,
    warnings,
  };
}

/**
 * Mapeia tipo de intervenção para categoria humana legível
 */
export function mapInterventionToActionType(interventionType: string): string {
  const mapping: Record<string, string> = {
    AI_AUTOFILL: 'AUTOFIX',
    AI_ADDITION: 'ADDITION',
    AI_CORRECTION: 'CORRECTION',
    AI_SUGGESTION_APPLIED: 'VALIDATION',
    AI_CLASSIFICATION_INFERENCE: 'INFERENCE',
  };
  return mapping[interventionType] || 'NORMALIZATION';
}

/**
 * Gera descrição humana legível para tipo de ação
 */
export function getActionTypeDescription(actionType: string): string {
  return AI_LOG_POLICY_V2.valid_action_types[actionType as keyof typeof AI_LOG_POLICY_V2.valid_action_types] 
    || 'Ação de IA não categorizada';
}

export default AI_LOG_POLICY_V2;
