import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import { useSubspaceQuery, useOptimisticMutation, SUBSPACE_CACHE_PROFILES } from './useSubspaceCommunication';

interface UserGamification {
  id: string;
  user_id: string;
  total_xp: number;
  current_level: number;
  current_streak: number;
  longest_streak: number;
  last_activity_date: string | null;
  courses_completed: number;
  lessons_completed: number;
  badges_earned: number;
}

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  xp_reward: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  category: string;
  requirement_type: string;
  requirement_value: number;
}

interface UserBadge {
  id: string;
  user_id: string;
  badge_id: string;
  earned_at: string;
  badge?: Badge;
}

interface XPHistoryEntry {
  id: string;
  user_id: string;
  amount: number;
  source: string;
  source_id: string | null;
  description: string | null;
  created_at: string;
}

interface LeaderboardEntry {
  user_id: string;
  total_xp: number;
  current_level: number;
  current_streak: number;
  profile?: {
    nome: string;
    avatar_url: string | null;
  };
}

// Level thresholds
const LEVEL_THRESHOLDS = [
  { level: 1, xp: 0, title: 'Iniciante' },
  { level: 2, xp: 100, title: 'Aprendiz' },
  { level: 3, xp: 250, title: 'Estudante' },
  { level: 4, xp: 500, title: 'Dedicado' },
  { level: 5, xp: 850, title: 'Conhecedor' },
  { level: 10, xp: 2000, title: 'Especialista' },
  { level: 15, xp: 4000, title: 'Avançado' },
  { level: 20, xp: 7000, title: 'Mestre' },
  { level: 30, xp: 15000, title: 'Grão-Mestre' },
  { level: 50, xp: 35000, title: 'Lenda' },
];

export function getLevelInfo(totalXP: number) {
  let currentLevelData = LEVEL_THRESHOLDS[0];
  let nextLevelData = LEVEL_THRESHOLDS[1];

  for (let i = 0; i < LEVEL_THRESHOLDS.length; i++) {
    if (totalXP >= LEVEL_THRESHOLDS[i].xp) {
      currentLevelData = LEVEL_THRESHOLDS[i];
      nextLevelData = LEVEL_THRESHOLDS[i + 1] || null;
    }
  }

  const xpInCurrentLevel = totalXP - currentLevelData.xp;
  const xpNeededForNextLevel = nextLevelData 
    ? nextLevelData.xp - currentLevelData.xp 
    : 0;
  const progressPercentage = nextLevelData 
    ? Math.min(100, (xpInCurrentLevel / xpNeededForNextLevel) * 100)
    : 100;

  return {
    level: currentLevelData.level,
    title: currentLevelData.title,
    totalXP,
    xpInCurrentLevel,
    xpNeededForNextLevel,
    progressPercentage,
    isMaxLevel: !nextLevelData,
    nextLevelXP: nextLevelData?.xp || currentLevelData.xp,
  };
}

export function useGamification() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // 🌌 Fetch user gamification data - useSubspaceQuery
  const { data: gamification, isLoading: isLoadingGamification } = useSubspaceQuery<UserGamification | null>(
    ['user-gamification', user?.id || 'anon'],
    async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from('user_gamification')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      return data as UserGamification | null;
    },
    {
      profile: 'user', // 5min stale, dados do usuário
      persistKey: `gamification_${user?.id}`,
      enabled: !!user?.id,
    }
  );

  // 🌌 Fetch all badges - useSubspaceQuery
  const { data: allBadges } = useSubspaceQuery<Badge[]>(
    ['badges'],
    async () => {
      const { data, error } = await supabase
        .from('badges')
        .select('*')
        .order('requirement_value', { ascending: true });

      if (error) throw error;
      return data as Badge[];
    },
    {
      profile: 'immutable', // Badges raramente mudam
      persistKey: 'all_badges_v1',
    }
  );

  // 🌌 Fetch user badges - useSubspaceQuery
  const { data: userBadges } = useSubspaceQuery<UserBadge[]>(
    ['user-badges', user?.id || 'anon'],
    async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('user_badges')
        .select(`
          *,
          badge:badges(*)
        `)
        .eq('user_id', user.id);

      if (error) throw error;
      return data as UserBadge[];
    },
    {
      profile: 'user',
      persistKey: `user_badges_${user?.id}`,
      enabled: !!user?.id,
    }
  );

  // 🌌 Fetch XP history - useSubspaceQuery
  const { data: xpHistory } = useSubspaceQuery<XPHistoryEntry[]>(
    ['xp-history', user?.id || 'anon'],
    async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('xp_history')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data as XPHistoryEntry[];
    },
    {
      profile: 'dashboard',
      persistKey: `xp_history_${user?.id}`,
      enabled: !!user?.id,
    }
  );

  // 🌌 Fetch leaderboard - useSubspaceQuery
  const { data: leaderboard, isLoading: isLoadingLeaderboard } = useSubspaceQuery<LeaderboardEntry[]>(
    ['leaderboard'],
    async () => {
      const { data, error } = await supabase
        .from('user_gamification')
        .select(`
          user_id,
          total_xp,
          current_level,
          current_streak,
          profile:profiles!user_gamification_user_id_fkey(nome, avatar_url)
        `)
        .order('total_xp', { ascending: false })
        .limit(100);

      if (error) throw error;
      return data as LeaderboardEntry[];
    },
    {
      profile: 'semiStatic',
      persistKey: 'leaderboard_v1',
    }
  );

  // 🚀 Add XP mutation - useOptimisticMutation (Feedback Instantâneo)
  const addXPMutation = useOptimisticMutation<UserGamification | null, { amount: number; source: string; sourceId?: string; description?: string }, number>({
    queryKey: ['user-gamification', user?.id || 'anon'],
    mutationFn: async ({ amount, source, sourceId, description }) => {
      if (!user?.id) throw new Error('User not authenticated');

      const { data, error } = await supabase.rpc('add_user_xp', {
        p_user_id: user.id,
        p_amount: amount,
        p_source: source,
        p_source_id: sourceId || null,
        p_description: description || null,
      });

      if (error) throw error;
      return data;
    },
    optimisticUpdate: (oldData, variables) => {
      if (!oldData) return oldData;
      return {
        ...oldData,
        total_xp: oldData.total_xp + variables.amount,
      };
    },
    onSuccess: (newTotalXP) => {
      queryClient.invalidateQueries({ queryKey: ['xp-history'] });
      queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
      
      toast.success(`+XP ganho!`, {
        description: `Seu novo total: ${newTotalXP} XP`,
      });
    },
  });

  // 🚀 Update streak mutation - useOptimisticMutation
  const updateStreakMutation = useOptimisticMutation<UserGamification | null, void, number>({
    queryKey: ['user-gamification', user?.id || 'anon'],
    mutationFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');

      const { data, error } = await supabase.rpc('update_user_streak', {
        p_user_id: user.id,
      });

      if (error) throw error;
      return data;
    },
    optimisticUpdate: (oldData) => {
      if (!oldData) return oldData;
      return {
        ...oldData,
        current_streak: oldData.current_streak + 1,
      };
    },
  });

  // Get level info
  const levelInfo = gamification 
    ? getLevelInfo(gamification.total_xp) 
    : getLevelInfo(0);

  // Get user rank in leaderboard
  const userRank = leaderboard?.findIndex(entry => entry.user_id === user?.id) ?? -1;

  return {
    gamification,
    levelInfo,
    allBadges: allBadges || [],
    userBadges: userBadges || [],
    unlockedBadgeIds: userBadges?.map(ub => ub.badge_id) || [],
    xpHistory: xpHistory || [],
    leaderboard: leaderboard || [],
    userRank: userRank >= 0 ? userRank + 1 : null,
    isLoading: isLoadingGamification,
    isLoadingLeaderboard,
    addXP: addXPMutation.mutate,
    updateStreak: updateStreakMutation.mutate,
  };
}

export function useLeaderboard(limit = 10) {
  return useSubspaceQuery<LeaderboardEntry[]>(
    ['leaderboard', limit.toString()],
    async () => {
      // 1. Buscar dados de gamificação
      const { data: gamificationData, error: gamError } = await supabase
        .from('user_gamification')
        .select('user_id, total_xp, current_level, current_streak')
        .order('total_xp', { ascending: false })
        .limit(limit);

      if (gamError) throw gamError;
      if (!gamificationData || gamificationData.length === 0) return [];

      // 2. Buscar perfis separadamente (evita problema de FK/RLS)
      const userIds = gamificationData.map(g => g.user_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, nome, avatar_url')
        .in('id', userIds);

      // 3. Criar mapa de perfis
      const profileMap = new Map((profiles || []).map(p => [p.id, p]));

      // 4. Combinar dados
      return gamificationData.map(g => ({
        user_id: g.user_id,
        total_xp: g.total_xp,
        current_level: g.current_level,
        current_streak: g.current_streak,
        profile: profileMap.get(g.user_id) ? {
          nome: profileMap.get(g.user_id)!.nome || 'Anônimo',
          avatar_url: profileMap.get(g.user_id)!.avatar_url,
        } : undefined,
      }));
    },
    {
      profile: 'semiStatic',
      persistKey: `leaderboard_${limit}`,
    }
  );
}

// Hook para conquistas do usuário
interface UserAchievement {
  id: string;
  user_id: string;
  badge_id: string;
  earned_at: string;
  achievement: {
    id: string;
    name: string;
    description: string;
    icon: string;
    xp_reward: number;
    rarity: string;
    category: string;
  };
}

export function useUserAchievements() {
  const { user } = useAuth();

  return useSubspaceQuery<UserAchievement[]>(
    ['user-achievements', user?.id || 'anon'],
    async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('user_badges')
        .select(`
          id,
          user_id,
          badge_id,
          earned_at,
          achievement:badges(
            id,
            name,
            description,
            icon,
            xp_reward,
            rarity,
            category
          )
        `)
        .eq('user_id', user.id)
        .order('earned_at', { ascending: false });

      if (error) throw error;
      return data as UserAchievement[];
    },
    {
      profile: 'user',
      persistKey: `user_achievements_${user?.id}`,
      enabled: !!user?.id,
    }
  );
}

// 🌌 Hook: Ranking Global (Panteão Eterno) - useSubspaceQuery
export function useGlobalRanking() {
  return useSubspaceQuery(
    ['global-ranking'],
    async () => {
      const { data, error } = await supabase
        .from('user_gamification')
        .select(`
          user_id,
          total_xp,
          current_level,
          current_streak,
          profile:profiles!user_gamification_user_id_fkey(id, nome, avatar_url)
        `)
        .order('total_xp', { ascending: false })
        .limit(100);

      if (error) throw error;

      return (data || []).map((entry, index) => ({
        id: entry.user_id,
        rank: index + 1,
        name: entry.profile?.nome || 'Anônimo',
        avatar: entry.profile?.avatar_url,
        xp: entry.total_xp || 0,
        level: entry.current_level || 1,
        streak: entry.current_streak || 0,
      }));
    },
    {
      profile: 'semiStatic',
      persistKey: 'global_ranking_v1',
    }
  );
}

// 🌌 Hook: Ranking Semanal (Arena da Semana) - useSubspaceQuery
export function useWeeklyRanking() {
  return useSubspaceQuery(
    ['weekly-ranking'],
    async () => {
      // Pegar início da semana (domingo)
      const now = new Date();
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      startOfWeek.setHours(0, 0, 0, 0);

      const { data, error } = await supabase
        .from('weekly_xp')
        .select('user_id, xp_this_week, week_start')
        .gte('week_start', startOfWeek.toISOString().split('T')[0])
        .order('xp_this_week', { ascending: false })
        .limit(100);

      if (error) throw error;

      // Se houver dados, buscar perfis separadamente
      if (data && data.length > 0) {
        const userIds = data.map(d => d.user_id);
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, nome, avatar_url')
          .in('id', userIds);

        const profileMap = new Map((profiles || []).map(p => [p.id, p]));

        return data.map((entry, index) => {
          const profile = profileMap.get(entry.user_id);
          return {
            id: entry.user_id,
            rank: index + 1,
            name: profile?.nome || 'Anônimo',
            avatar: profile?.avatar_url,
            xp: entry.xp_this_week || 0,
            level: 1,
            streak: 0,
          };
        });
      }

      // Fallback: buscar do xp_history se não houver dados em weekly_xp
      const { data: historyData } = await supabase
        .from('xp_history')
        .select('user_id, amount')
        .gte('created_at', startOfWeek.toISOString());

      if (!historyData || historyData.length === 0) {
        return [];
      }

      // Agregar XP por usuário
      const xpByUser = new Map<string, number>();
      historyData.forEach((entry) => {
        const existing = xpByUser.get(entry.user_id) || 0;
        xpByUser.set(entry.user_id, existing + (entry.amount || 0));
      });

      // Buscar perfis
      const userIds = Array.from(xpByUser.keys());
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, nome, avatar_url')
        .in('id', userIds);

      const profileMap = new Map((profiles || []).map(p => [p.id, p]));

      const sorted = Array.from(xpByUser.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 100);

      return sorted.map(([userId, xp], index) => {
        const profile = profileMap.get(userId);
        return {
          id: userId,
          rank: index + 1,
          name: profile?.nome || 'Anônimo',
          avatar: profile?.avatar_url,
          xp,
          level: 1,
          streak: 0,
        };
      });
    },
    {
      profile: 'semiStatic',
      persistKey: 'weekly_ranking_v1',
    }
  );
}
