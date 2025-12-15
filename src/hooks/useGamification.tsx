import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

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

  // Fetch user gamification data
  const { data: gamification, isLoading: isLoadingGamification } = useQuery({
    queryKey: ['user-gamification', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from('user_gamification')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      return data as UserGamification | null;
    },
    enabled: !!user?.id,
  });

  // Fetch all badges
  const { data: allBadges } = useQuery({
    queryKey: ['badges'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('badges')
        .select('*')
        .order('requirement_value', { ascending: true });

      if (error) throw error;
      return data as Badge[];
    },
  });

  // Fetch user badges
  const { data: userBadges } = useQuery({
    queryKey: ['user-badges', user?.id],
    queryFn: async () => {
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
    enabled: !!user?.id,
  });

  // Fetch XP history
  const { data: xpHistory } = useQuery({
    queryKey: ['xp-history', user?.id],
    queryFn: async () => {
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
    enabled: !!user?.id,
  });

  // Fetch leaderboard
  const { data: leaderboard, isLoading: isLoadingLeaderboard } = useQuery({
    queryKey: ['leaderboard'],
    queryFn: async () => {
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
  });

  // Add XP mutation
  const addXPMutation = useMutation({
    mutationFn: async ({ 
      amount, 
      source, 
      sourceId, 
      description 
    }: { 
      amount: number; 
      source: string; 
      sourceId?: string; 
      description?: string;
    }) => {
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
    onSuccess: (newTotalXP) => {
      queryClient.invalidateQueries({ queryKey: ['user-gamification'] });
      queryClient.invalidateQueries({ queryKey: ['xp-history'] });
      queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
      
      toast.success(`+XP ganho!`, {
        description: `Seu novo total: ${newTotalXP} XP`,
      });
    },
  });

  // Update streak mutation
  const updateStreakMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');

      const { data, error } = await supabase.rpc('update_user_streak', {
        p_user_id: user.id,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-gamification'] });
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
  return useQuery({
    queryKey: ['leaderboard', limit],
    queryFn: async () => {
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
        .limit(limit);

      if (error) throw error;
      return data as LeaderboardEntry[];
    },
  });
}
