// ============================================
// SEÇÃO GAMIFICAÇÃO COMPLETA DO ALUNO
// ============================================

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { FuturisticCard } from "@/components/ui/futuristic-card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Trophy, Star, Flame, Medal, Crown, Zap, 
  Target, Calendar, Award, TrendingUp
} from "lucide-react";
import { PresetEmptyState } from "@/components/ui/empty-state";

interface AlunoGamificacaoProps {
  userId: string | null;
  profile: any;
}

export function AlunoPerfilGamificacao({ userId, profile }: AlunoGamificacaoProps) {
  // Buscar badges conquistadas
  const { data: userBadges } = useQuery({
    queryKey: ['aluno-badges', userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data } = await supabase
        .from('user_badges')
        .select('*, badges(*)')
        .eq('user_id', userId);
      return data || [];
    },
    enabled: !!userId
  });

  // Buscar achievements
  const { data: userAchievements } = useQuery({
    queryKey: ['aluno-achievements', userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data } = await supabase
        .from('user_achievements')
        .select('*, achievements(*)')
        .eq('user_id', userId);
      return data || [];
    },
    enabled: !!userId
  });

  // Buscar XP mensal
  const { data: monthlyXp } = useQuery({
    queryKey: ['aluno-monthly-xp', userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data } = await supabase
        .from('monthly_xp')
        .select('*')
        .eq('user_id', userId)
        .order('year', { ascending: false })
        .order('month', { ascending: false })
        .limit(6);
      return data || [];
    },
    enabled: !!userId
  });

  // Dados do perfil de gamificação
  const xpTotal = profile?.xp_total || 0;
  const level = profile?.level || 1;
  const streakDays = profile?.streak_days || 0;
  const xpToNextLevel = (level * 1000) - (xpTotal % 1000);
  const levelProgress = ((xpTotal % 1000) / 1000) * 100;

  const hasData = xpTotal > 0 || (userBadges && userBadges.length > 0);

  // Função para determinar cor do nível
  const getLevelColor = (lvl: number) => {
    if (lvl >= 50) return 'text-yellow-400';
    if (lvl >= 30) return 'text-purple-400';
    if (lvl >= 20) return 'text-blue-400';
    if (lvl >= 10) return 'text-green-400';
    return 'text-muted-foreground';
  };

  return (
    <FuturisticCard className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-yellow-500/20">
          <Trophy className="h-5 w-5 text-yellow-400" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-foreground">Gamificação</h3>
          <p className="text-sm text-muted-foreground">XP, nível, badges, conquistas e streaks</p>
        </div>
      </div>

      {!profile ? (
        <PresetEmptyState preset="noData" />
      ) : (
        <div className="space-y-6">
          {/* Cards Principais */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Nível */}
            <div className="p-4 rounded-lg bg-gradient-to-br from-yellow-500/20 to-orange-500/10 border border-yellow-500/30">
              <div className="flex items-center gap-2 mb-2">
                <Crown className={`h-5 w-5 ${getLevelColor(level)}`} />
                <span className="text-sm text-muted-foreground">Nível</span>
              </div>
              <p className={`text-3xl font-bold ${getLevelColor(level)}`}>{level}</p>
            </div>
            
            {/* XP Total */}
            <div className="p-4 rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/10 border border-blue-500/30">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="h-5 w-5 text-blue-400" />
                <span className="text-sm text-muted-foreground">XP Total</span>
              </div>
              <p className="text-3xl font-bold text-blue-400">{xpTotal.toLocaleString()}</p>
            </div>
            
            {/* Streak */}
            <div className="p-4 rounded-lg bg-gradient-to-br from-orange-500/20 to-red-500/10 border border-orange-500/30">
              <div className="flex items-center gap-2 mb-2">
                <Flame className="h-5 w-5 text-orange-400" />
                <span className="text-sm text-muted-foreground">Streak</span>
              </div>
              <p className="text-3xl font-bold text-orange-400">{streakDays} dias</p>
            </div>
            
            {/* Badges */}
            <div className="p-4 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/10 border border-purple-500/30">
              <div className="flex items-center gap-2 mb-2">
                <Medal className="h-5 w-5 text-purple-400" />
                <span className="text-sm text-muted-foreground">Badges</span>
              </div>
              <p className="text-3xl font-bold text-purple-400">{userBadges?.length || 0}</p>
            </div>
          </div>

          {/* Progresso para Próximo Nível */}
          <div className="p-4 rounded-lg bg-background/50 border border-border/50">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-foreground">Progresso para Nível {level + 1}</span>
              <span className="text-sm text-muted-foreground">{xpToNextLevel} XP restantes</span>
            </div>
            <Progress value={levelProgress} className="h-3" />
          </div>

          {/* Badges Conquistadas */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
              <Award className="h-4 w-4 text-yellow-400" />
              Badges Conquistadas
            </h4>
            {userBadges && userBadges.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {userBadges.map((ub: any) => (
                  <Badge 
                    key={ub.id}
                    variant="outline"
                    className="px-3 py-1.5 bg-yellow-500/10 border-yellow-500/30 text-yellow-400"
                  >
                    <Star className="h-3 w-3 mr-1" />
                    {ub.badges?.name || 'Badge'}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Nenhuma badge conquistada ainda</p>
            )}
          </div>

          {/* Conquistas */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
              <Target className="h-4 w-4 text-green-400" />
              Conquistas
            </h4>
            {userAchievements && userAchievements.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {userAchievements.map((ua: any) => (
                  <div 
                    key={ua.id}
                    className="p-3 rounded-lg bg-green-500/10 border border-green-500/20"
                  >
                    <p className="text-sm font-medium text-green-400">{ua.achievements?.name || 'Conquista'}</p>
                    <p className="text-xs text-muted-foreground">{ua.achievements?.description}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Nenhuma conquista desbloqueada ainda</p>
            )}
          </div>

          {/* XP Mensal */}
          {monthlyXp && monthlyXp.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
                <Calendar className="h-4 w-4 text-blue-400" />
                XP por Mês (Últimos 6 meses)
              </h4>
              <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                {monthlyXp.map((mx: any) => (
                  <div 
                    key={`${mx.year}-${mx.month}`}
                    className="p-3 rounded-lg bg-background/50 border border-border/50 text-center"
                  >
                    <p className="text-xs text-muted-foreground">{mx.month}/{mx.year}</p>
                    <p className="text-lg font-bold text-blue-400">{mx.xp_earned || 0}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </FuturisticCard>
  );
}
