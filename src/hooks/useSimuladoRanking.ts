// ============================================
// HOOK DE RANKING DE SIMULADOS
// Pontuação: 10 pontos por questão correta
// Lei I: Performance | Lei IV: Competição Justa
// ============================================

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface SimuladoRankingEntry {
  id: string;
  rank: number;
  previousRank?: number;
  name: string;
  avatar?: string | null;
  xp: number;
  level: number;
  streak: number;
  simuladoScore: number;
  questionsCorrect: number;
  accuracy: number;
}

const POINTS_PER_QUESTION = 10;

export function useSimuladoRanking() {
  return useQuery({
    queryKey: ['simulado-ranking'],
    queryFn: async (): Promise<SimuladoRankingEntry[]> => {
      // Buscar todas as tentativas de questões
      const { data: attempts, error } = await supabase
        .from('question_attempts')
        .select('user_id, is_correct');

      if (error) throw error;

      // Agregar por usuário
      const userStats = new Map<string, { correct: number; total: number }>();
      
      (attempts || []).forEach((attempt) => {
        const existing = userStats.get(attempt.user_id) || { correct: 0, total: 0 };
        userStats.set(attempt.user_id, {
          correct: existing.correct + (attempt.is_correct ? 1 : 0),
          total: existing.total + 1,
        });
      });

      // Buscar perfis e dados de gamificação
      const userIds = Array.from(userStats.keys());
      
      if (userIds.length === 0) {
        return [];
      }

      const [profilesResult, gamificationResult] = await Promise.all([
        supabase
          .from('profiles')
          .select('id, nome, avatar_url')
          .in('id', userIds),
        supabase
          .from('user_gamification')
          .select('user_id, total_xp, current_level, current_streak')
          .in('user_id', userIds),
      ]);

      const profileMap = new Map((profilesResult.data || []).map(p => [p.id, p]));
      const gamificationMap = new Map((gamificationResult.data || []).map(g => [g.user_id, g]));

      // Criar ranking ordenado por pontuação de simulado
      const rankingData = Array.from(userStats.entries())
        .map(([userId, stats]) => {
          const profile = profileMap.get(userId);
          const gamification = gamificationMap.get(userId);
          
          return {
            id: userId,
            name: profile?.nome || 'Anônimo',
            avatar: profile?.avatar_url,
            xp: gamification?.total_xp || 0,
            level: gamification?.current_level || 1,
            streak: gamification?.current_streak || 0,
            simuladoScore: stats.correct * POINTS_PER_QUESTION,
            questionsCorrect: stats.correct,
            accuracy: stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0,
          };
        })
        .sort((a, b) => b.simuladoScore - a.simuladoScore)
        .map((entry, index) => ({
          ...entry,
          rank: index + 1,
        }));

      return rankingData;
    },
    staleTime: 60000,
    refetchInterval: 120000,
  });
}

// Hook para estatísticas pessoais de simulado
export function useMySimuladoStats() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['my-simulado-stats', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('question_attempts')
        .select('is_correct, created_at')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const attempts = data || [];
      const correct = attempts.filter(a => a.is_correct).length;
      const total = attempts.length;

      // Estatísticas dos últimos 7 dias
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      
      const recentAttempts = attempts.filter(a => new Date(a.created_at) >= weekAgo);
      const recentCorrect = recentAttempts.filter(a => a.is_correct).length;

      // Estatísticas de hoje
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const todayAttempts = attempts.filter(a => new Date(a.created_at) >= today);
      const todayCorrect = todayAttempts.filter(a => a.is_correct).length;

      return {
        totalScore: correct * POINTS_PER_QUESTION,
        questionsCorrect: correct,
        questionsTotal: total,
        accuracy: total > 0 ? Math.round((correct / total) * 100) : 0,
        weeklyScore: recentCorrect * POINTS_PER_QUESTION,
        weeklyQuestions: recentAttempts.length,
        todayScore: todayCorrect * POINTS_PER_QUESTION,
        todayQuestions: todayAttempts.length,
      };
    },
    enabled: !!user?.id,
    staleTime: 30000,
  });
}
