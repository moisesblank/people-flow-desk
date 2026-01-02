// ═══════════════════════════════════════════════════════════════════════════════
// 📜 CONSTITUIÇÃO DE COMPLETUDE FINAL DA QUESTÃO v1.0.0
// ═══════════════════════════════════════════════════════════════════════════════
// Status: VIGENTE, IMUTÁVEL E PERMANENTE
// Autoridade: OWNER (moisesblank@gmail.com)
// Data: 2026-01-02
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * 🏛️ PRINCÍPIO FUNDAMENTAL
 * 
 * "O arquivo Excel pode ser incompleto.
 *  A entidade Questão final NUNCA pode ser incompleta."
 * 
 * Este princípio é IMUTÁVEL e governa toda a lógica de importação de questões.
 */

export const CONSTITUTION_FINAL_QUESTION_COMPLETENESS = {
  version: '1.0.0',
  status: 'ACTIVE_AND_IMMUTABLE',
  authority: 'OWNER',
  
  // ═══════════════════════════════════════════════════════════════════════════════
  // REGRA DE IDENTIDADE
  // ═══════════════════════════════════════════════════════════════════════════════
  identity_rule: {
    description: 'MACRO define a identidade única de uma questão.',
    rules: [
      'Cada questão DEVE ter exatamente 1 MACRO.',
      'MACRO é obrigatório e não pode ser null.',
      'MACRO nunca é alterado automaticamente pela IA.',
      'MACRO só pode ser alterado por ação humana explícita.',
    ],
  },
  
  // ═══════════════════════════════════════════════════════════════════════════════
  // REGRA DE COMPLETUDE
  // ═══════════════════════════════════════════════════════════════════════════════
  completeness_rule: {
    description: 'Todas as camadas de classificação e metadados devem existir na entidade Questão final.',
    mandatory_fields: [
      'macro',      // OBRIGATÓRIO - Identidade
      'micro',      // A IA deve inferir se vazio
      'tema',       // A IA deve inferir se vazio
      'subtema',    // A IA deve inferir se vazio
      'difficulty', // A IA deve inferir se vazio
      'explanation',// A IA deve gerar se vazio
      'banca',      // A IA deve inferir ou usar 'Autoral' se vazio
      'ano',        // A IA deve inferir ou usar ano atual se vazio
    ],
    optional_fields: [
      'image_url',  // A IA avalia e associa quando aplicável
      'tags',       // Podem ser múltiplas e livres
    ],
  },
  
  // ═══════════════════════════════════════════════════════════════════════════════
  // REGRA EXCEL vs ENTIDADE
  // ═══════════════════════════════════════════════════════════════════════════════
  excel_vs_entity_rule: {
    description: 'Opcional no Excel NÃO significa opcional no sistema.',
    rules: [
      'Campos podem estar vazios no arquivo Excel.',
      'Campos DEVEM estar preenchidos na entidade Questão final.',
      'Nenhuma questão pode ser salva com metadados obrigatórios ausentes.',
    ],
  },
  
  // ═══════════════════════════════════════════════════════════════════════════════
  // COMPORTAMENTO DA IA
  // ═══════════════════════════════════════════════════════════════════════════════
  ai_behavior: {
    mode: 'AGENT',
    authority: 'ASSISTIVE_ONLY',
    rules: [
      'IA DEVE inferir campos ausentes baseado na análise de conteúdo real.',
      'IA DEVE usar a realidade pedagógica da plataforma ao inferir.',
      'IA DEVE atribuir a classificação mais equivalente quando match exato não é explícito.',
      'IA NÃO PODE deixar nenhum campo inferível vazio.',
      'IA DEVE gerar explicações compatíveis com o conteúdo quando ausentes.',
    ],
    
    // Mapeamento de campos e fallbacks
    inference_mapping: {
      macro: { 
        required: true, 
        fallback: 'Química Geral',
        ai_can_change: false, // IA nunca altera MACRO
      },
      micro: { 
        required: true, 
        fallback: 'Conceitos Gerais',
        ai_can_change: true,
      },
      tema: { 
        required: true, 
        fallback: 'Fundamentos',
        ai_can_change: true,
      },
      subtema: { 
        required: true, 
        fallback: 'Básico',
        ai_can_change: true,
      },
      difficulty: { 
        required: true, 
        fallback: 'médio',
        ai_can_change: true,
      },
      banca: { 
        required: true, 
        fallback: 'Autoral',
        ai_can_change: true,
      },
      ano: { 
        required: true, 
        fallback: new Date().getFullYear(),
        ai_can_change: true,
      },
      explanation: { 
        required: true, 
        fallback: 'Resolução comentada não disponível. Consulte o material de apoio.',
        ai_can_change: true,
        ai_should_generate: true,
      },
    },
  },
  
  // ═══════════════════════════════════════════════════════════════════════════════
  // VALIDAÇÃO E BLOQUEIO
  // ═══════════════════════════════════════════════════════════════════════════════
  validation_and_blocking: {
    rules: [
      'Bloquear persistência de qualquer entidade Questão com campos obrigatórios ausentes.',
      'Bloquear conclusão de importação se inferência da IA falhar.',
      'Exigir completude da IA antes de marcar importação como bem-sucedida.',
    ],
  },
  
  // ═══════════════════════════════════════════════════════════════════════════════
  // AUDITORIA E LOGGING
  // ═══════════════════════════════════════════════════════════════════════════════
  audit_and_logging: {
    rules: [
      'Registrar todos os campos inferidos pela IA.',
      'Armazenar confidence score para cada campo inferido.',
      'Registrar valor original do Excel vs valor final inferido.',
      'Manter trilha de auditoria completa para revisão futura.',
    ],
    storage: {
      field: 'campos_inferidos',
      format: 'campo:metodo',
      examples: [
        'micro:ai_inference',
        'tema:ai_inference',
        'difficulty:ai_inference',
        'explanation:ai_generated',
        'banca:fallback_autoral',
        'ano:fallback_current_year',
      ],
    },
  },
  
  // ═══════════════════════════════════════════════════════════════════════════════
  // CLÁUSULA DE IMUTABILIDADE
  // ═══════════════════════════════════════════════════════════════════════════════
  immutability_clause: {
    description: 'Esta política é permanente e não pode ser contornada.',
    rules: [
      'Nenhuma feature pode contornar esta regra de completude.',
      'Nenhuma atualização futura pode permitir entidades Questão incompletas.',
      'Qualquer violação é considerada erro crítico do sistema.',
      'Mudanças requerem revisão arquitetural explícita.',
    ],
  },
} as const;

/**
 * Tipo para validar completude de uma questão
 */
export interface CompleteQuestion {
  // Campos de identificação
  id: string;
  question_text: string;
  options: { id: string; text: string; image_url?: string }[];
  correct_answer: string;
  
  // Campos OBRIGATÓRIOS (não podem ser null/undefined)
  macro: string;           // Identidade única
  micro: string;           // Camada transversal
  tema: string;            // Camada transversal
  subtema: string;         // Camada transversal
  difficulty: string;      // fácil | médio | difícil
  explanation: string;     // Resolução comentada
  banca: string;           // Banca ou "Autoral"
  ano: number;             // Ano da questão
  
  // Campos opcionais
  image_url?: string;
  image_urls?: string[];
  tags?: string[];
  competencia_enem?: string;
  habilidade_enem?: string;
  nivel_cognitivo?: string;
  tempo_medio_segundos?: number;
  origem?: string;
  
  // Metadados de rastreabilidade
  campos_inferidos: string[];
}

/**
 * Valida se uma questão está completa segundo a política
 */
export function validateQuestionCompleteness(question: any): { 
  isComplete: boolean; 
  missingFields: string[]; 
  warnings: string[] 
} {
  const missingFields: string[] = [];
  const warnings: string[] = [];
  
  const requiredFields = CONSTITUTION_FINAL_QUESTION_COMPLETENESS.ai_behavior.inference_mapping;
  
  for (const [field, config] of Object.entries(requiredFields)) {
    if (config.required) {
      const value = question[field];
      if (value === null || value === undefined || (typeof value === 'string' && !value.trim())) {
        missingFields.push(field);
      }
    }
  }
  
  // Validações adicionais
  if (!question.question_text?.trim()) {
    missingFields.push('question_text');
  }
  
  const filledOptions = question.options?.filter((o: any) => o.text?.trim())?.length || 0;
  if (filledOptions < 2) {
    missingFields.push('options (mínimo 2)');
  }
  
  // Warnings informativos
  if (question.campos_inferidos?.length > 0) {
    warnings.push(`${question.campos_inferidos.length} campos foram inferidos pela IA`);
  }
  
  return {
    isComplete: missingFields.length === 0,
    missingFields,
    warnings,
  };
}

/**
 * Aplica fallbacks para campos ausentes
 */
export function applyCompletenessFallbacks(question: any): any {
  const updated = { ...question };
  const currentYear = new Date().getFullYear();
  const mapping = CONSTITUTION_FINAL_QUESTION_COMPLETENESS.ai_behavior.inference_mapping;
  
  const camposInferidos = [...(question.campos_inferidos || [])];
  
  if (!updated.macro?.trim()) {
    updated.macro = mapping.macro.fallback;
    camposInferidos.push('macro:fallback_default');
  }
  
  if (!updated.micro?.trim()) {
    updated.micro = mapping.micro.fallback;
    camposInferidos.push('micro:fallback_default');
  }
  
  if (!updated.tema?.trim()) {
    updated.tema = mapping.tema.fallback;
    camposInferidos.push('tema:fallback_default');
  }
  
  if (!updated.subtema?.trim()) {
    updated.subtema = mapping.subtema.fallback;
    camposInferidos.push('subtema:fallback_default');
  }
  
  if (!updated.difficulty?.trim()) {
    updated.difficulty = mapping.difficulty.fallback;
    camposInferidos.push('difficulty:fallback_default');
  }
  
  if (!updated.banca?.trim()) {
    updated.banca = mapping.banca.fallback;
    camposInferidos.push('banca:fallback_autoral');
  }
  
  if (!updated.ano || isNaN(updated.ano)) {
    updated.ano = currentYear;
    camposInferidos.push('ano:fallback_current_year');
  }
  
  if (!updated.explanation?.trim()) {
    updated.explanation = mapping.explanation.fallback as string;
    camposInferidos.push('explanation:fallback_default');
  }
  
  updated.campos_inferidos = camposInferidos;
  
  return updated;
}

export default CONSTITUTION_FINAL_QUESTION_COMPLETENESS;
