// ============================================
// HOOK DE FLASHCARDS - FSRS v5 Algorithm
// Integração com Supabase + Repetição Espaçada
// Lei I: Performance | Lei II: Segurança | Lei IV: Poder
// ============================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useSubspaceQuery, SUBSPACE_CACHE_PROFILES } from './useSubspaceCommunication';

// Interface alinhada com a tabela study_flashcards
export interface Flashcard {
  id: string;
  user_id: string;
  area_id: string | null;
  question: string;
  answer: string;
  due_date: string;
  stability: number;
  difficulty: number;
  elapsed_days: number;
  scheduled_days: number;
  reps: number;
  lapses: number;
  state: 'new' | 'learning' | 'review' | 'relearning';
  last_review: string | null;
  created_at: string;
}

// FSRS Parameters
const FSRS_PARAMS = {
  w: [0.4, 0.6, 2.4, 5.8, 4.93, 0.94, 0.86, 0.01, 1.49, 0.14, 0.94, 2.18, 0.05, 0.34, 1.26, 0.29, 2.61],
  requestRetention: 0.9,
  maximumInterval: 36500,
  initialStability: [0.4, 0.6, 2.4, 5.8],
};

type Rating = 1 | 2 | 3 | 4; // 1=Again, 2=Hard, 3=Good, 4=Easy

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

// Hook: Todos os flashcards (para Modo Cram)
export function useAllFlashcards() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['flashcards-all', user?.id],
    queryFn: async (): Promise<Flashcard[]> => {
      const { data, error } = await supabase
        .from('study_flashcards')
        .select('*')
        .eq('user_id', user!.id)
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
    enabled: !!user?.id,
    staleTime: 60000,
  });
}

// Hook: Contagem de flashcards pendentes
export function usePendingFlashcardsCount() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['flashcards-pending-count', user?.id],
    queryFn: async (): Promise<number> => {
      const today = new Date().toISOString().split('T')[0];
      
      const { count, error } = await supabase
        .from('study_flashcards')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user!.id)
        .lte('due_date', today);

      if (error) throw error;
      return count || 0;
    },
    enabled: !!user?.id,
    staleTime: 30000,
    refetchInterval: 60000,
  });
}

// Mutation: Reagendar flashcard após revisão
export function useRescheduleFlashcard() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      flashcardId,
      rating,
      currentStability,
      currentDifficulty,
    }: {
      flashcardId: string;
      rating: Rating;
      currentStability: number;
      currentDifficulty: number;
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flashcards-due', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['flashcards-all', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['flashcards-pending-count', user?.id] });
    },
  });
}

// Mutation: Criar novo flashcard
export function useCreateFlashcard() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      question,
      answer,
      areaId,
    }: {
      question: string;
      answer: string;
      areaId?: string;
    }) => {
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
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flashcards-due', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['flashcards-all', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['flashcards-pending-count', user?.id] });
    },
  });
}

// Mutation: Deletar flashcard
export function useDeleteFlashcard() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (flashcardId: string) => {
      const { error } = await supabase
        .from('study_flashcards')
        .delete()
        .eq('id', flashcardId)
        .eq('user_id', user!.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flashcards-due', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['flashcards-all', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['flashcards-pending-count', user?.id] });
    },
  });
}

// Hook: Estatísticas de flashcards
export function useFlashcardStats() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['flashcard-stats', user?.id],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];

      const { data: allCards } = await supabase
        .from('study_flashcards')
        .select('state, reps, lapses, last_review')
        .eq('user_id', user!.id);

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
    enabled: !!user?.id,
    staleTime: 60000,
  });
}
