// ============================================
// HOOK: useWeeklyRanking - Ranking Semanal
// SANTUÁRIO v9.0 - Lei I: Performance Máxima
// ============================================

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

// Tipos
export interface WeeklyRankingEntry {
  user_id: string;
  xp_this_week: number;
  week_start: string;
  last_updated: string;
  rank: number;
  profile?: {
    nome: string | null;
    avatar_url: string | null;
  };
  isCurrentUser?: boolean;
}

export interface WeeklyRankingStats {
  userRank: number | null;
  userXP: number;
  topXP: number;
  totalParticipants: number;
  percentile: number;
  weekStart: string;
  daysRemaining: number;
}

export interface UseWeeklyRankingOptions {
  limit?: number;
  includeCurrentUser?: boolean;
}

/**
 * Hook para gerenciar o Ranking Semanal da Arena
 * - Top N jogadores da semana
 * - Posição do usuário atual
 * - Estatísticas de competição
 * - Cache otimizado
 */
export function useWeeklyRanking(options: UseWeeklyRankingOptions = {}) {
  const { user } = useAuth();
  const { limit = 10, includeCurrentUser = true } = options;

  // Calcular início da semana atual
  const getWeekStart = () => {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // Segunda-feira
    const weekStart = new Date(now.setDate(diff));
    weekStart.setHours(0, 0, 0, 0);
    return weekStart.toISOString().split('T')[0];
  };

  const currentWeekStart = getWeekStart();

  // Query principal: ranking semanal
  const {
    data: ranking,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['weekly-ranking', limit, currentWeekStart],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('weekly_xp')
        .select(`
          user_id,
          xp_this_week,
          week_start,
          last_updated,
          profile:profiles!weekly_xp_user_id_fkey(nome, avatar_url)
        `)
        .eq('week_start', currentWeekStart)
        .gt('xp_this_week', 0)
        .order('xp_this_week', { ascending: false })
        .limit(limit);

      if (error) throw error;

      // Adicionar rank e marcar usuário atual
      const rankedData: WeeklyRankingEntry[] = (data || []).map((entry, index) => ({
        ...entry,
        rank: index + 1,
        isCurrentUser: entry.user_id === user?.id,
        profile: entry.profile as { nome: string | null; avatar_url: string | null } | undefined
      }));

      return rankedData;
    },
    staleTime: 1000 * 60, // 1 minuto (ranking muda frequentemente)
  });

  // Query: posição do usuário atual (se não está no top)
  const { data: userRankData } = useQuery({
    queryKey: ['weekly-ranking-user', user?.id, currentWeekStart],
    queryFn: async () => {
      if (!user?.id) return null;

      // Buscar XP do usuário
      const { data: userXP, error: userError } = await supabase
        .from('weekly_xp')
        .select('xp_this_week, week_start, last_updated')
        .eq('user_id', user.id)
        .eq('week_start', currentWeekStart)
        .single();

      if (userError && userError.code !== 'PGRST116') throw userError;

      if (!userXP || userXP.xp_this_week === 0) {
        return {
          rank: null,
          xp: 0,
          weekStart: currentWeekStart
        };
      }

      // Contar quantos têm mais XP (para calcular rank)
      const { count, error: countError } = await supabase
        .from('weekly_xp')
        .select('*', { count: 'exact', head: true })
        .eq('week_start', currentWeekStart)
        .gt('xp_this_week', userXP.xp_this_week);

      if (countError) throw countError;

      return {
        rank: (count || 0) + 1,
        xp: userXP.xp_this_week,
        weekStart: currentWeekStart,
        lastUpdated: userXP.last_updated
      };
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60, // 1 minuto
  });

  // Query: estatísticas do ranking
  const { data: stats } = useQuery({
    queryKey: ['weekly-ranking-stats', user?.id, currentWeekStart],
    queryFn: async (): Promise<WeeklyRankingStats> => {
      // Total de participantes
      const { count: totalParticipants, error: countError } = await supabase
        .from('weekly_xp')
        .select('*', { count: 'exact', head: true })
        .eq('week_start', currentWeekStart)
        .gt('xp_this_week', 0);

      if (countError) throw countError;

      // Top XP da semana
      const { data: topData } = await supabase
        .from('weekly_xp')
        .select('xp_this_week')
        .eq('week_start', currentWeekStart)
        .order('xp_this_week', { ascending: false })
        .limit(1)
        .single();

      // Calcular dias restantes na semana
      const now = new Date();
      const weekEnd = new Date(currentWeekStart);
      weekEnd.setDate(weekEnd.getDate() + 7);
      const daysRemaining = Math.ceil((weekEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      // Calcular percentile do usuário
      const userRank = userRankData?.rank || null;
      const total = totalParticipants || 1;
      const percentile = userRank ? Math.round(((total - userRank + 1) / total) * 100) : 0;

      return {
        userRank,
        userXP: userRankData?.xp || 0,
        topXP: topData?.xp_this_week || 0,
        totalParticipants: totalParticipants || 0,
        percentile,
        weekStart: currentWeekStart,
        daysRemaining: Math.max(0, daysRemaining)
      };
    },
    enabled: !!userRankData,
    staleTime: 1000 * 60 * 2, // 2 minutos
  });

  // Helpers
  const isInTop = (n: number) => {
    const rank = userRankData?.rank;
    return rank !== null && rank <= n;
  };

  const getTop3 = () => ranking?.slice(0, 3) || [];
  
  const getUserEntry = (): WeeklyRankingEntry | null => {
    if (!user?.id || !userRankData) return null;
    
    // Verificar se está no ranking carregado
    const inRanking = ranking?.find(r => r.user_id === user.id);
    if (inRanking) return inRanking;
    
    // Criar entrada para usuário fora do top
    if (userRankData.rank) {
      return {
        user_id: user.id,
        xp_this_week: userRankData.xp,
        week_start: currentWeekStart,
        last_updated: userRankData.lastUpdated || new Date().toISOString(),
        rank: userRankData.rank,
        isCurrentUser: true
      };
    }
    
    return null;
  };

  const getPositionText = () => {
    const rank = userRankData?.rank;
    if (!rank) return 'Não rankeado';
    if (rank === 1) return '🥇 1º Lugar';
    if (rank === 2) return '🥈 2º Lugar';
    if (rank === 3) return '🥉 3º Lugar';
    return `${rank}º Lugar`;
  };

  return {
    // Dados
    ranking: ranking || [],
    stats,
    userRank: userRankData?.rank || null,
    userXP: userRankData?.xp || 0,
    
    // Estados
    isLoading,
    error,
    
    // Helpers
    isInTop,
    getTop3,
    getUserEntry,
    getPositionText,
    refetch,
    
    // Computed
    isRanked: userRankData?.rank !== null,
    isTop10: isInTop(10),
    isTop3: isInTop(3),
    isPodium: isInTop(3),
    weekStart: currentWeekStart,
    daysRemaining: stats?.daysRemaining || 7,
  };
}

/**
 * Hook simplificado para apenas posição do usuário
 * Útil para badges e indicadores
 */
export function useUserWeeklyRank() {
  const { user } = useAuth();
  
  const getWeekStart = () => {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    const weekStart = new Date(now.setDate(diff));
    weekStart.setHours(0, 0, 0, 0);
    return weekStart.toISOString().split('T')[0];
  };

  return useQuery({
    queryKey: ['user-weekly-rank', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const weekStart = getWeekStart();

      // Buscar XP do usuário
      const { data: userXP } = await supabase
        .from('weekly_xp')
        .select('xp_this_week')
        .eq('user_id', user.id)
        .eq('week_start', weekStart)
        .single();

      if (!userXP || userXP.xp_this_week === 0) return null;

      // Contar posição
      const { count } = await supabase
        .from('weekly_xp')
        .select('*', { count: 'exact', head: true })
        .eq('week_start', weekStart)
        .gt('xp_this_week', userXP.xp_this_week);

      return {
        rank: (count || 0) + 1,
        xp: userXP.xp_this_week
      };
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60,
  });
}
