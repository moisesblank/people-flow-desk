// ═══════════════════════════════════════════════════════════════════════════════
// HOOK: useLogQuestionAIIntervention
// Registra logs de intervenção de IA via Edge Function
// POLÍTICA: Global AI Question Intervention Visibility Policy v1.0
// ═══════════════════════════════════════════════════════════════════════════════

import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { AIInterventionType } from './useQuestionAILogs';

// ═══════════════════════════════════════════════════════════════════════════════
// INTERFACE DO LOG DE INTERVENÇÃO
// ═══════════════════════════════════════════════════════════════════════════════

export interface AIInterventionLog {
  question_id: string;
  source_file?: string;
  source_type: 'import' | 'edit' | 'batch_inference' | 'manual_trigger';
  intervention_type: AIInterventionType;
  field_affected: string;
  value_before: string | null;
  value_after: string;
  action_description: string;
  ai_confidence_score?: number;
  ai_model_used?: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// HOOK PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════════

export function useLogQuestionAIIntervention() {
  const logInterventions = useCallback(async (logs: AIInterventionLog[]) => {
    if (!logs || logs.length === 0) return { success: true, inserted: 0 };

    try {
      const { data, error } = await supabase.functions.invoke('log-question-ai-intervention', {
        body: { logs }
      });

      if (error) {
        console.error('[useLogQuestionAIIntervention] Erro:', error);
        return { success: false, error: error.message };
      }

      console.log(`[useLogQuestionAIIntervention] ${data?.inserted || 0} logs registrados`);
      return { success: true, inserted: data?.inserted || 0 };
    } catch (err) {
      console.error('[useLogQuestionAIIntervention] Erro:', err);
      return { success: false, error: String(err) };
    }
  }, []);

  // Função auxiliar para criar log de preenchimento automático
  const logAutofill = useCallback((
    questionId: string,
    field: string,
    valueBefore: string | null,
    valueAfter: string,
    reason: string,
    options?: { sourceFile?: string; confidence?: number; model?: string }
  ) => {
    return logInterventions([{
      question_id: questionId,
      intervention_type: 'AI_AUTOFILL',
      field_affected: field,
      value_before: valueBefore,
      value_after: valueAfter,
      action_description: reason,
      source_type: options?.sourceFile ? 'import' : 'manual_trigger',
      source_file: options?.sourceFile,
      ai_confidence_score: options?.confidence,
      ai_model_used: options?.model,
    }]);
  }, [logInterventions]);

  // Função auxiliar para criar log de correção
  const logCorrection = useCallback((
    questionId: string,
    field: string,
    valueBefore: string | null,
    valueAfter: string,
    reason: string,
    options?: { sourceFile?: string; confidence?: number; model?: string }
  ) => {
    return logInterventions([{
      question_id: questionId,
      intervention_type: 'AI_CORRECTION',
      field_affected: field,
      value_before: valueBefore,
      value_after: valueAfter,
      action_description: reason,
      source_type: options?.sourceFile ? 'import' : 'manual_trigger',
      source_file: options?.sourceFile,
      ai_confidence_score: options?.confidence,
      ai_model_used: options?.model,
    }]);
  }, [logInterventions]);

  // Função auxiliar para criar log de inferência de taxonomia
  const logTaxonomyInference = useCallback((
    questionId: string,
    field: string,
    valueBefore: string | null,
    valueAfter: string,
    reason: string,
    options?: { sourceFile?: string; confidence?: number; model?: string }
  ) => {
    return logInterventions([{
      question_id: questionId,
      intervention_type: 'AI_CLASSIFICATION_INFERENCE',
      field_affected: field,
      value_before: valueBefore,
      value_after: valueAfter,
      action_description: reason,
      source_type: options?.sourceFile ? 'import' : 'batch_inference',
      source_file: options?.sourceFile,
      ai_confidence_score: options?.confidence,
      ai_model_used: options?.model,
    }]);
  }, [logInterventions]);

  // Função auxiliar para criar log de adição de conteúdo
  const logAddition = useCallback((
    questionId: string,
    field: string,
    valueAfter: string,
    reason: string,
    options?: { sourceFile?: string; confidence?: number; model?: string }
  ) => {
    return logInterventions([{
      question_id: questionId,
      intervention_type: 'AI_ADDITION',
      field_affected: field,
      value_before: null,
      value_after: valueAfter,
      action_description: reason,
      source_type: options?.sourceFile ? 'import' : 'manual_trigger',
      source_file: options?.sourceFile,
      ai_confidence_score: options?.confidence,
      ai_model_used: options?.model,
    }]);
  }, [logInterventions]);

  return { 
    logInterventions,
    logAutofill,
    logCorrection,
    logTaxonomyInference,
    logAddition,
  };
}
