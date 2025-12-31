// ============================================
// HOOK DE ANALYTICS - Estatísticas Estilo Anki
// FSRS v5 Analytics + Previsões + Heatmap
// Lei I: Performance | Constituição v10.x
// ============================================

import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useSubspaceQuery } from './useSubspaceCommunication';

export interface CardCountByState {
  new: number;
  learning: number;
  relearning: number;
  review: number;
  total: number;
}

export interface ForecastDay {
  date: string;
  count: number;
  label: string;
}

export interface StudyDay {
  date: string;
  count: number;
  correct: number;
  incorrect: number;
}

export interface RetentionStats {
  today: { rate: number; count: number };
  yesterday: { rate: number; count: number };
  lastWeek: { rate: number; count: number };
  lastMonth: { rate: number; count: number };
  overall: { rate: number; count: number };
}

export interface FlashcardAnalytics {
  cardCounts: CardCountByState;
  forecast: ForecastDay[];
  studyHistory: StudyDay[];
  retention: RetentionStats;
  streakDays: number;
  avgCardsPerDay: number;
  bestHour: number | null;
}

// Hook principal de analytics
export function useFlashcardAnalytics() {
  const { user } = useAuth();

  return useSubspaceQuery<FlashcardAnalytics>(
    ['flashcard-analytics', user?.id || 'anon'],
    async (): Promise<FlashcardAnalytics> => {
      // 1. Buscar todos os cards para contagem por estado
      const { data: allCards } = await supabase
        .from('study_flashcards')
        .select('id, state, due_date, last_review, reps, lapses, scheduled_days')
        .eq('user_id', user!.id)
        .limit(2000);

      const cards = allCards || [];

      // 2. Contagem por estado (estilo Anki)
      const cardCounts: CardCountByState = {
        new: cards.filter(c => c.state === 'new').length,
        learning: cards.filter(c => c.state === 'learning').length,
        relearning: cards.filter(c => c.state === 'relearning').length,
        review: cards.filter(c => c.state === 'review').length,
        total: cards.length,
      };

      // 3. Previsão de revisões futuras (próximos 30 dias)
      const forecast: ForecastDay[] = [];
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      for (let i = 0; i < 30; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() + i);
        const dateStr = date.toISOString().split('T')[0];
        
        const count = cards.filter(c => {
          if (!c.due_date) return false;
          return c.due_date === dateStr;
        }).length;

        let label = '';
        if (i === 0) label = 'Hoje';
        else if (i === 1) label = 'Amanhã';
        else if (i < 7) label = `${i} dias`;
        else if (i < 14) label = '1 sem';
        else if (i < 21) label = '2 sem';
        else if (i < 28) label = '3 sem';
        else label = '4 sem';

        forecast.push({ date: dateStr, count, label });
      }

      // 4. Histórico de estudo (últimos 30 dias para heatmap)
      const studyHistory: StudyDay[] = [];
      for (let i = 29; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        const reviewedCards = cards.filter(c => {
          if (!c.last_review) return false;
          return c.last_review.split('T')[0] === dateStr;
        });

        const correct = reviewedCards.filter(c => (c.lapses || 0) === 0).length;
        const incorrect = reviewedCards.length - correct;

        studyHistory.push({
          date: dateStr,
          count: reviewedCards.length,
          correct,
          incorrect,
        });
      }

      // 5. Calcular taxa de retenção por período
      const getRetention = (daysAgo: number, daysRange = 1) => {
        const startDate = new Date(today);
        startDate.setDate(startDate.getDate() - daysAgo - daysRange + 1);
        const endDate = new Date(today);
        endDate.setDate(endDate.getDate() - daysAgo + 1);

        const reviewedInPeriod = cards.filter(c => {
          if (!c.last_review) return false;
          const reviewDate = new Date(c.last_review);
          return reviewDate >= startDate && reviewDate < endDate;
        });

        const totalReps = reviewedInPeriod.reduce((sum, c) => sum + (c.reps || 0), 0);
        const totalLapses = reviewedInPeriod.reduce((sum, c) => sum + (c.lapses || 0), 0);
        const rate = totalReps > 0 ? Math.round((1 - totalLapses / totalReps) * 100) : 0;

        return { rate, count: reviewedInPeriod.length };
      };

      const retention: RetentionStats = {
        today: getRetention(0),
        yesterday: getRetention(1),
        lastWeek: getRetention(0, 7),
        lastMonth: getRetention(0, 30),
        overall: {
          rate: cards.length > 0 
            ? Math.round((1 - cards.reduce((s, c) => s + (c.lapses || 0), 0) / 
                Math.max(1, cards.reduce((s, c) => s + (c.reps || 0), 0))) * 100)
            : 0,
          count: cards.reduce((s, c) => s + (c.reps || 0), 0),
        },
      };

      // 6. Calcular streak (dias consecutivos estudando)
      let streakDays = 0;
      for (let i = 0; i < studyHistory.length; i++) {
        if (studyHistory[studyHistory.length - 1 - i].count > 0) {
          streakDays++;
        } else {
          break;
        }
      }

      // 7. Média de cards por dia (últimos 7 dias com estudo)
      const daysWithStudy = studyHistory.filter(d => d.count > 0);
      const avgCardsPerDay = daysWithStudy.length > 0
        ? Math.round(daysWithStudy.reduce((s, d) => s + d.count, 0) / daysWithStudy.length)
        : 0;

      // 8. Melhor hora para estudar (baseado em last_review)
      const hourCounts: Record<number, number> = {};
      cards.forEach(c => {
        if (c.last_review) {
          const hour = new Date(c.last_review).getHours();
          hourCounts[hour] = (hourCounts[hour] || 0) + 1;
        }
      });
      
      const bestHour = Object.entries(hourCounts).length > 0
        ? Number(Object.entries(hourCounts).sort((a, b) => b[1] - a[1])[0][0])
        : null;

      return {
        cardCounts,
        forecast,
        studyHistory,
        retention,
        streakDays,
        avgCardsPerDay,
        bestHour,
      };
    },
    {
      profile: 'dashboard',
      persistKey: `flashcard_analytics_${user?.id}`,
      enabled: !!user?.id,
    }
  );
}
