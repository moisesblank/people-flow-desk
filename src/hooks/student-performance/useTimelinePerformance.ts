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

      // Buscar attempts do usuário
      const { data: attempts, error: attemptsError } = await supabase
        .from('question_attempts')
        .select('question_id, created_at, is_correct')
        .eq('user_id', userId)
        .order('created_at', { ascending: true });

      if (attemptsError) throw attemptsError;
      if (!attempts || attempts.length === 0) return [];

      // Buscar questões únicas para obter taxonomia
      const questionIds = [...new Set(attempts.map(a => a.question_id))];
      
      const { data: questions, error: questionsError } = await supabase
        .from('quiz_questions')
        .select('id, macro, micro')
        .in('id', questionIds);

      if (questionsError) throw questionsError;

      // Criar mapa de taxonomia
      const taxonomyMap = new Map<string, { macro: string | null; micro: string | null }>();
      questions?.forEach(q => {
        taxonomyMap.set(q.id, { macro: q.macro, micro: q.micro });
      });

      // Mesclar dados - manter apenas PRIMEIRA tentativa por questão
      const firstAttemptByQuestion = new Map<string, AttemptWithTaxonomy>();
      
      attempts.forEach(attempt => {
        const existing = firstAttemptByQuestion.get(attempt.question_id);
        const taxonomy = taxonomyMap.get(attempt.question_id) || { macro: null, micro: null };
        
        const enrichedAttempt: AttemptWithTaxonomy = {
          question_id: attempt.question_id,
          created_at: attempt.created_at,
          is_correct: attempt.is_correct,
          macro: taxonomy.macro,
          micro: taxonomy.micro,
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
