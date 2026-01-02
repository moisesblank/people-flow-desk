// ═══════════════════════════════════════════════════════════════════════════════
// HOOK: useLogQuestionAIIntervention
// Registra logs de intervenção de IA via Edge Function
// POLÍTICA: Question AI Intervention Audit Policy v1.0
// ═══════════════════════════════════════════════════════════════════════════════

import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface AIInterventionLog {
  question_id: string;
  source_file?: string;
  source_type: 'import' | 'edit' | 'batch_inference' | 'manual_trigger';
  field_affected: string;
  value_before: string | null;
  value_after: string;
  action_description: string;
  ai_confidence_score?: number;
  ai_model_used?: string;
}

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

  return { logInterventions };
}
