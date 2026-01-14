// =====================================================
// useTimelinePerformance - Hook de Timeline por Data
// Busca attempts com taxonomia para gráfico temporal
// =====================================================

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface AttemptWithTaxonomy {
  question_id: string;
  created_at: string;
  macro: string | null;
  micro: string | null;
  is_correct: boolean;
}

export function useTimelinePerformance(userId: string | undefined) {
  return useQuery({
    queryKey: ['student-timeline-performance', userId],
    queryFn: async (): Promise<AttemptWithTaxonomy[]> => {
      if (!userId) return [];

      // 🚀 PATCH 5K: Query única com JOIN - elimina N+1 (2 queries → 1)
      // 🔒 FILTROS DE INTEGRIDADE PERMANENTES: Apenas questões válidas nas estatísticas
      const { data: attempts, error } = await supabase
        .from('question_attempts')
        .select(`
          question_id,
          created_at,
          is_correct,
          quiz_questions!inner(macro, micro, question_text, explanation, question_type)
        `)
        .eq('user_id', userId)
        .not('quiz_questions.question_text', 'is', null)
        .neq('quiz_questions.question_text', '')
        .not('quiz_questions.explanation', 'is', null)
        .neq('quiz_questions.explanation', '')
        .not('quiz_questions.question_type', 'is', null)
        .neq('quiz_questions.question_type', '')
        .order('created_at', { ascending: true });

      if (error) throw error;
      if (!attempts || attempts.length === 0) return [];

      // Mesclar dados - manter apenas PRIMEIRA tentativa por questão
      const firstAttemptByQuestion = new Map<string, AttemptWithTaxonomy>();
      
      attempts.forEach((attempt: any) => {
        const existing = firstAttemptByQuestion.get(attempt.question_id);
        
        const enrichedAttempt: AttemptWithTaxonomy = {
          question_id: attempt.question_id,
          created_at: attempt.created_at,
          is_correct: attempt.is_correct,
          macro: attempt.quiz_questions?.macro || null,
          micro: attempt.quiz_questions?.micro || null,
        };

        if (!existing) {
          firstAttemptByQuestion.set(attempt.question_id, enrichedAttempt);
        } else if (attempt.created_at && existing.created_at) {
          // Mantém a mais antiga
          if (new Date(attempt.created_at) < new Date(existing.created_at)) {
            firstAttemptByQuestion.set(attempt.question_id, enrichedAttempt);
          }
        }
      });

      return Array.from(firstAttemptByQuestion.values());
    },
    enabled: !!userId,
    staleTime: 60_000, // 60s cache
    gcTime: 5 * 60 * 1000,
  });
}
