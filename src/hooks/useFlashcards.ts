// ============================================
// HOOK DE FLASHCARDS - FSRS v5 Algorithm
// Integração com Supabase + Repetição Espaçada
// Lei I: Performance | Lei II: Segurança | Lei IV: Poder
// ============================================

import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useSubspaceQuery, useOptimisticMutation } from './useSubspaceCommunication';

// ============================================
// IMPORTAR TIPOS UNIFICADOS
// ============================================
import type { 
  Flashcard, 
  FlashcardRating as Rating,
  FlashcardStats,
  CreateFlashcardInput,
  RescheduleFlashcardInput,
  RescheduleFlashcardResult
} from '@/types/flashcards';
import { FSRS_PARAMS } from '@/types/flashcards';

// Re-exportar tipos para compatibilidade
export type { Flashcard, Rating };

// Calcula próximo intervalo usando FSRS
function calculateFSRS(
  stability: number,
  difficulty: number,
  elapsedDays: number,
  rating: Rating,
  state: string
): { newStability: number; newDifficulty: number; interval: number } {
  let newStability = stability;
  let newDifficulty = difficulty;

  if (state === 'new') {
    newStability = FSRS_PARAMS.initialStability[rating - 1];
    newDifficulty = Math.min(10, Math.max(1, 5 - (rating - 3)));
  } else {
    const retrievability = Math.exp(-elapsedDays / stability);
    const stabilityFactor =
      Math.exp(FSRS_PARAMS.w[8]) *
      (11 - newDifficulty) *
      Math.pow(stability, -FSRS_PARAMS.w[9]) *
      (Math.exp(FSRS_PARAMS.w[10] * (1 - retrievability)) - 1);

    if (rating === 1) {
      newStability = Math.min(
        stability,
        FSRS_PARAMS.w[11] *
          Math.pow(newDifficulty, -FSRS_PARAMS.w[12]) *
          (Math.pow(stability + 1, FSRS_PARAMS.w[13]) - 1)
      );
    } else {
      const hardPenalty = rating === 2 ? FSRS_PARAMS.w[15] : 1;
      const easyBonus = rating === 4 ? FSRS_PARAMS.w[16] : 1;
      newStability = stability * (1 + stabilityFactor * hardPenalty * easyBonus);
    }

    const difficultyDelta = FSRS_PARAMS.w[6] * (rating - 3);
    newDifficulty = Math.min(10, Math.max(1, newDifficulty - difficultyDelta));
  }

  const desiredRetention = FSRS_PARAMS.requestRetention;
  let interval = Math.round(newStability * Math.log(desiredRetention) / Math.log(0.9));
  interval = Math.min(FSRS_PARAMS.maximumInterval, Math.max(1, interval));

  return { newStability, newDifficulty, interval };
}

// 🌌 Hook migrado para useSubspaceQuery - Cache localStorage
export function useDueFlashcards() {
  const { user } = useAuth();

  return useSubspaceQuery<Flashcard[]>(
    ['flashcards-due', user?.id || 'anon'],
    async (): Promise<Flashcard[]> => {
      const today = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('study_flashcards')
        .select('*')
        .eq('user_id', user!.id)
        // Filtra placeholders de exportação do Anki (evita travar a revisão)
        .not('question', 'ilike', '%atualize para a versão%')
        .lte('due_date', today)
        .order('due_date', { ascending: true });

      if (error) throw error;

      return (data || []).map(card => ({
        ...card,
        stability: card.stability ?? 1.0,
        difficulty: card.difficulty ?? 0.3,
        elapsed_days: card.elapsed_days ?? 0,
        scheduled_days: card.scheduled_days ?? 0,
        reps: card.reps ?? 0,
        lapses: card.lapses ?? 0,
        state: (card.state as Flashcard['state']) ?? 'new',
      }));
    },
    {
      profile: 'dashboard', // 2min stale, atualiza frequente
      persistKey: `flashcards_due_${user?.id}`,
      enabled: !!user?.id,
    }
  );
}

// 🌌 Hook: Todos os flashcards (para Modo Cram) - useSubspaceQuery
export function useAllFlashcards() {
  const { user } = useAuth();

  return useSubspaceQuery<Flashcard[]>(
    ['flashcards-all', user?.id || 'anon'],
    async (): Promise<Flashcard[]> => {
      const { data, error } = await supabase
        .from('study_flashcards')
        .select('*')
        .eq('user_id', user!.id)
        // Filtra placeholders de exportação do Anki (evita cards “fantasma” no Cram)
        .not('question', 'ilike', '%atualize para a versão%')
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map(card => ({
        ...card,
        stability: card.stability ?? 1.0,
        difficulty: card.difficulty ?? 0.3,
        elapsed_days: card.elapsed_days ?? 0,
        scheduled_days: card.scheduled_days ?? 0,
        reps: card.reps ?? 0,
        lapses: card.lapses ?? 0,
        state: (card.state as Flashcard['state']) ?? 'new',
      }));
    },
    {
      profile: 'user',
      persistKey: `flashcards_all_${user?.id}`,
      enabled: !!user?.id,
    }
  );
}

// 🌌 Hook: Contagem de flashcards pendentes - useSubspaceQuery
export function usePendingFlashcardsCount() {
  const { user } = useAuth();

  return useSubspaceQuery<number>(
    ['flashcards-pending-count', user?.id || 'anon'],
    async (): Promise<number> => {
      const today = new Date().toISOString().split('T')[0];
      
      const { count, error } = await supabase
        .from('study_flashcards')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user!.id)
        .lte('due_date', today);

      if (error) throw error;
      return count || 0;
    },
    {
      profile: 'dashboard',
      persistKey: `flashcards_pending_${user?.id}`,
      enabled: !!user?.id,
    }
  );
}

// 🚀 Mutation: Reagendar flashcard após revisão - useOptimisticMutation
export function useRescheduleFlashcard() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useOptimisticMutation<Flashcard[], { flashcardId: string; rating: Rating; currentStability: number; currentDifficulty: number }, { interval: number; newState: string }>({
    queryKey: ['flashcards-due', user?.id || 'anon'],
    mutationFn: async ({
      flashcardId,
      rating,
      currentStability,
      currentDifficulty,
    }) => {
      // Buscar estado atual do card
      const { data: card } = await supabase
        .from('study_flashcards')
        .select('*')
        .eq('id', flashcardId)
        .single();

      if (!card) throw new Error('Flashcard não encontrado');

      const elapsedDays = card.last_review
        ? Math.floor((Date.now() - new Date(card.last_review).getTime()) / (1000 * 60 * 60 * 24))
        : 0;

      const { newStability, newDifficulty, interval } = calculateFSRS(
        currentStability,
        currentDifficulty,
        elapsedDays,
        rating,
        card.state ?? 'new'
      );

      const newDueDate = new Date();
      newDueDate.setDate(newDueDate.getDate() + interval);

      const newState = rating === 1 ? 'relearning' : 'review';

      const { error } = await supabase
        .from('study_flashcards')
        .update({
          stability: newStability,
          difficulty: newDifficulty,
          elapsed_days: elapsedDays,
          scheduled_days: interval,
          reps: (card.reps ?? 0) + 1,
          lapses: rating === 1 ? (card.lapses ?? 0) + 1 : card.lapses,
          state: newState,
          last_review: new Date().toISOString(),
          due_date: newDueDate.toISOString().split('T')[0],
        })
        .eq('id', flashcardId);

      if (error) throw error;

      return { interval, newState };
    },
    optimisticUpdate: (oldData, { flashcardId }) => {
      if (!oldData) return [];
      // Remove o flashcard da lista de pendentes (UI instantânea)
      return oldData.filter(card => card.id !== flashcardId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flashcards-all', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['flashcards-pending-count', user?.id] });
    },
  });
}

// 🚀 Mutation: Criar novo flashcard - useOptimisticMutation
export function useCreateFlashcard() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useOptimisticMutation<Flashcard[], { question: string; answer: string; areaId?: string; question_image_url?: string; answer_image_url?: string }, Flashcard>({
    queryKey: ['flashcards-all', user?.id || 'anon'],
    mutationFn: async ({ question, answer, areaId, question_image_url, answer_image_url }) => {
      const { data, error } = await supabase
        .from('study_flashcards')
        .insert({
          user_id: user!.id,
          question,
          answer,
          area_id: areaId || null,
          due_date: new Date().toISOString().split('T')[0],
          stability: 1.0,
          difficulty: 0.3,
          elapsed_days: 0,
          scheduled_days: 0,
          reps: 0,
          lapses: 0,
          state: 'new',
          question_image_url: question_image_url || null,
          answer_image_url: answer_image_url || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data as Flashcard;
    },
    optimisticUpdate: (oldData, { question, answer }) => {
      const tempCard: Flashcard = {
        id: `temp-${Date.now()}`,
        user_id: user?.id || '',
        area_id: null,
        question,
        answer,
        due_date: new Date().toISOString().split('T')[0],
        stability: 1.0,
        difficulty: 0.3,
        elapsed_days: 0,
        scheduled_days: 0,
        reps: 0,
        lapses: 0,
        state: 'new',
        last_review: null,
        created_at: new Date().toISOString(),
      };
      return [tempCard, ...(oldData || [])];
    },
    successMessage: 'Flashcard criado!',
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flashcards-due', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['flashcards-pending-count', user?.id] });
    },
  });
}

// 🚀 Mutation: Deletar flashcard - useOptimisticMutation
export function useDeleteFlashcard() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useOptimisticMutation<Flashcard[], string, void>({
    queryKey: ['flashcards-all', user?.id || 'anon'],
    mutationFn: async (flashcardId) => {
      const { error } = await supabase
        .from('study_flashcards')
        .delete()
        .eq('id', flashcardId)
        .eq('user_id', user!.id);

      if (error) throw error;
    },
    optimisticUpdate: (oldData, flashcardId) => {
      if (!oldData) return [];
      return oldData.filter(card => card.id !== flashcardId);
    },
    successMessage: 'Flashcard excluído!',
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flashcards-due', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['flashcards-pending-count', user?.id] });
    },
  });
}

// 🌌 Hook: Flashcards Prontos (públicos) - para todos os alunos
export function useReadyFlashcards() {
  const { user } = useAuth();

  return useSubspaceQuery<Flashcard[]>(
    ['flashcards-ready'],
    async (): Promise<Flashcard[]> => {
      const { data, error } = await supabase
        .from('study_flashcards')
        .select('*')
        .eq('is_public', true)
        .not('question', 'ilike', '%atualize para a versão%')
        .order('created_at', { ascending: false })
        .limit(1000);

      if (error) throw error;

      return (data || []).map(card => ({
        ...card,
        stability: card.stability ?? 1.0,
        difficulty: card.difficulty ?? 0.3,
        elapsed_days: card.elapsed_days ?? 0,
        scheduled_days: card.scheduled_days ?? 0,
        reps: card.reps ?? 0,
        lapses: card.lapses ?? 0,
        state: (card.state as Flashcard['state']) ?? 'new',
      }));
    },
    {
      profile: 'user',
      persistKey: 'flashcards_ready',
      enabled: !!user?.id,
    }
  );
}

// 🌌 Hook: Contagem de Flashcards Prontos
export function useReadyFlashcardsCount() {
  const { user } = useAuth();

  return useSubspaceQuery<number>(
    ['flashcards-ready-count'],
    async (): Promise<number> => {
      const { count, error } = await supabase
        .from('study_flashcards')
        .select('id', { count: 'exact', head: true })
        .eq('is_public', true);

      if (error) throw error;
      return count || 0;
    },
    {
      profile: 'dashboard',
      persistKey: 'flashcards_ready_count',
      enabled: !!user?.id,
    }
  );
}

// 🌌 Hook: Estatísticas de flashcards - useSubspaceQuery
export function useFlashcardStats() {
  const { user } = useAuth();

  return useSubspaceQuery(
    ['flashcard-stats', user?.id || 'anon'],
    async () => {
      const today = new Date().toISOString().split('T')[0];

      // ⚡ ESCALA 45K: Limite aumentado para suportar alta escala
      const { data: allCards } = await supabase
        .from('study_flashcards')
        .select('state, reps, lapses, last_review')
        .eq('user_id', user!.id)
        .limit(45000);

      const { data: dueCards } = await supabase
        .from('study_flashcards')
        .select('id')
        .eq('user_id', user!.id)
        .lte('due_date', today);

      const cards = allCards || [];
      
      const newCards = cards.filter(c => c.state === 'new').length;
      const learningCards = cards.filter(c => c.state === 'learning' || c.state === 'relearning').length;
      const reviewCards = cards.filter(c => c.state === 'review').length;
      
      const totalReps = cards.reduce((sum, c) => sum + (c.reps || 0), 0);
      const totalLapses = cards.reduce((sum, c) => sum + (c.lapses || 0), 0);
      
      // Revisões nos últimos 7 dias
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const recentReviews = cards.filter(c => 
        c.last_review && new Date(c.last_review) >= weekAgo
      ).length;

      return {
        total: cards.length,
        due: dueCards?.length || 0,
        newCards,
        learningCards,
        reviewCards,
        totalReps,
        totalLapses,
        recentReviews,
        retention: totalReps > 0 ? Math.round((1 - totalLapses / totalReps) * 100) : 100,
      };
    },
    {
      profile: 'dashboard',
      persistKey: `flashcard_stats_${user?.id}`,
      enabled: !!user?.id,
    }
  );
}
