// ============================================
// 🏆 DASHBOARD RANKING WIDGET
// Integração do Panteão dos Campeões no Dashboard
// Versão compacta para embedding
// ============================================

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGlobalRanking, useWeeklyRanking, useGamification } from '@/hooks/useGamification';
import { useSimuladoRanking } from '@/hooks/useSimuladoRanking';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { 
  Trophy, Medal, Award, Flame, Crown, Star,
  TrendingUp, Zap, Target, Users, Sparkles,
  ChevronUp, ChevronDown, Minus, Activity
} from 'lucide-react';

interface RankingEntry {
  id: string;
  rank: number;
  previousRank?: number;
  name: string;
  avatar?: string | null;
  xp: number;
  level: number;
  streak: number;
  simuladoScore?: number;
  questionsCorrect?: number;
  accuracy?: number;
}

const ARENA_TABS = [
  { id: 'xp', label: 'XP Total', icon: Zap, color: 'from-amber-500 to-orange-600' },
  { id: 'simulados', label: 'Simulados', icon: Target, color: 'from-purple-500 to-pink-600' },
  { id: 'weekly', label: 'Semanal', icon: Flame, color: 'from-red-500 to-orange-500' },
  { id: 'streak', label: 'Streak', icon: Activity, color: 'from-green-500 to-emerald-600' },
] as const;

type ArenaTab = typeof ARENA_TABS[number]['id'];

// Títulos épicos baseados no rank
const getEpicTitle = (rank: number): { title: string; color: string } => {
  if (rank === 1) return { title: 'ULTRAMAN SUPREMO', color: 'text-yellow-400' };
  if (rank === 2) return { title: 'Guardião de Prata', color: 'text-slate-300' };
  if (rank === 3) return { title: 'Cavaleiro de Bronze', color: 'text-amber-600' };
  if (rank <= 10) return { title: 'Elite dos Campeões', color: 'text-purple-400' };
  if (rank <= 50) return { title: 'Guerreiro Veterano', color: 'text-blue-400' };
  if (rank <= 100) return { title: 'Aspirante', color: 'text-green-400' };
  return { title: 'Iniciante', color: 'text-muted-foreground' };
};

// Ícone de mudança de rank
const RankChangeIndicator = ({ current, previous }: { current: number; previous?: number }) => {
  if (!previous || current === previous) {
    return <Minus className="w-3 h-3 text-muted-foreground" />;
  }
  if (current < previous) {
    return (
      <span className="flex items-center text-green-500 text-xs font-bold">
        <ChevronUp className="w-3 h-3" />
        {previous - current}
      </span>
    );
  }
  return (
    <span className="flex items-center text-red-500 text-xs font-bold">
      <ChevronDown className="w-3 h-3" />
      {current - previous}
    </span>
  );
};

export function DashboardRankingWidget() {
  const [activeTab, setActiveTab] = useState<ArenaTab>('xp');
  const { user } = useAuth();
  const { gamification, levelInfo } = useGamification();

  const { data: globalRanking, isLoading: isLoadingGlobal } = useGlobalRanking();
  const { data: weeklyRanking, isLoading: isLoadingWeekly } = useWeeklyRanking();
  const { data: simuladoRanking, isLoading: isLoadingSimulado } = useSimuladoRanking();

  // Determinar ranking atual baseado na tab
  const { ranking, isLoading } = useMemo((): { ranking: RankingEntry[] | undefined; isLoading: boolean } => {
    switch (activeTab) {
      case 'simulados':
        return { ranking: simuladoRanking as RankingEntry[] | undefined, isLoading: isLoadingSimulado };
      case 'weekly':
        return { ranking: weeklyRanking as RankingEntry[] | undefined, isLoading: isLoadingWeekly };
      case 'streak':
        const streakSorted = [...(globalRanking || [])].sort((a, b) => b.streak - a.streak);
        return { 
          ranking: streakSorted.map((e, i) => ({ ...e, rank: i + 1 })) as RankingEntry[], 
          isLoading: isLoadingGlobal 
        };
      default:
        return { ranking: globalRanking as RankingEntry[] | undefined, isLoading: isLoadingGlobal };
    }
  }, [activeTab, globalRanking, weeklyRanking, simuladoRanking, isLoadingGlobal, isLoadingWeekly, isLoadingSimulado]);

  // Top 3 do ranking
  const podium = useMemo(() => {
    if (!ranking || ranking.length < 3) return null;
    return { first: ranking[0], second: ranking[1], third: ranking[2] };
  }, [ranking]);

  // Posição do usuário atual
  const currentUserEntry = useMemo(() => {
    if (!ranking || !user?.id) return null;
    return ranking.find(r => r.id === user.id) || null;
  }, [ranking, user?.id]);

  return (
    <Card className="border-2 border-amber-500/20 bg-gradient-to-br from-amber-500/5 via-transparent to-yellow-500/5 overflow-hidden">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-xl">
          <div className="p-2 rounded-xl bg-gradient-to-br from-amber-500 to-yellow-600">
            <Trophy className="w-5 h-5 text-white" />
          </div>
          🏆 Panteão dos Campeões
        </CardTitle>
        <CardDescription>
          Arena de competição intelectual — Prove seu valor!
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* User Hero Card - Compacto */}
        {gamification && currentUserEntry && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative p-4 rounded-xl bg-gradient-to-r from-primary/10 via-purple-500/5 to-pink-500/10 border border-primary/20"
          >
            <div className="flex items-center justify-between gap-4">
              {/* Avatar & Info */}
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Avatar className="w-14 h-14 border-2 border-primary/50">
                    <AvatarFallback className="bg-gradient-to-br from-primary to-purple-600 text-white text-lg font-bold">
                      {user?.email?.[0]?.toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <Badge className="absolute -bottom-1 -right-1 bg-gradient-to-r from-primary to-purple-600 text-white px-2 py-0.5 text-xs">
                    Lv {levelInfo.level}
                  </Badge>
                </div>
                <div>
                  <p className={cn("font-bold text-sm", getEpicTitle(currentUserEntry.rank).color)}>
                    {getEpicTitle(currentUserEntry.rank).title}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <Flame className="w-3 h-3 text-orange-500" />
                    <span className="text-xs text-muted-foreground">{gamification.current_streak} dias de streak</span>
                  </div>
                </div>
              </div>

              {/* Stats Compactos */}
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <div className={cn(
                    "text-2xl font-black",
                    currentUserEntry.rank <= 3 ? "text-yellow-400" : "text-primary"
                  )}>
                    #{currentUserEntry.rank}
                  </div>
                  <p className="text-xs text-muted-foreground">POSIÇÃO</p>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-amber-500">
                    {gamification.total_xp.toLocaleString()}
                  </div>
                  <p className="text-xs text-muted-foreground">XP</p>
                </div>
              </div>
            </div>

            {/* Progress to next rank */}
            {currentUserEntry.rank > 1 && ranking && ranking[currentUserEntry.rank - 2] && (
              <div className="mt-3 pt-3 border-t border-border/30">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-muted-foreground">Para ultrapassar #{currentUserEntry.rank - 1}</span>
                  <span className="font-bold text-primary">
                    +{(ranking[currentUserEntry.rank - 2].xp - currentUserEntry.xp).toLocaleString()} XP
                  </span>
                </div>
                <Progress 
                  value={(currentUserEntry.xp / ranking[currentUserEntry.rank - 2].xp) * 100} 
                  className="h-1.5" 
                />
              </div>
            )}
          </motion.div>
        )}

        {/* Arena Tabs */}
        <div className="grid grid-cols-4 gap-1">
          {ARENA_TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <motion.button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={cn(
                  'relative p-2 rounded-lg transition-all duration-300 overflow-hidden',
                  isActive
                    ? 'bg-gradient-to-br ' + tab.color + ' text-white shadow-md'
                    : 'bg-muted/50 hover:bg-muted'
                )}
              >
                <Icon className={cn('w-4 h-4 mx-auto mb-0.5', !isActive && 'text-muted-foreground')} />
                <p className={cn('font-medium text-[10px]', !isActive && 'text-muted-foreground')}>{tab.label}</p>
              </motion.button>
            );
          })}
        </div>

        {/* Mini Podium */}
        <AnimatePresence mode="wait">
          {!isLoading && podium && (
            <motion.div
              key={activeTab + '-podium'}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="grid grid-cols-3 gap-2 items-end"
            >
              <MiniPodiumHero entry={podium.second} position={2} activeTab={activeTab} />
              <MiniPodiumHero entry={podium.first} position={1} activeTab={activeTab} />
              <MiniPodiumHero entry={podium.third} position={3} activeTab={activeTab} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Top 10 List */}
        <Card className="border border-border/50 bg-background/50">
          <CardHeader className="py-2 px-3 border-b border-border/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" />
                <span className="font-medium text-sm">Top 10</span>
              </div>
              <Badge variant="outline" className="text-xs">
                {ranking?.length || 0} guerreiros
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[240px]">
              {isLoading ? (
                <div className="space-y-2 p-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full rounded-lg" />
                  ))}
                </div>
              ) : ranking && ranking.length > 0 ? (
                <div className="divide-y divide-border/30">
                  {ranking.slice(0, 10).map((entry) => (
                    <MiniRankingRow 
                      key={entry.id} 
                      entry={entry} 
                      isCurrentUser={entry.id === user?.id}
                      activeTab={activeTab}
                    />
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center">
                  <Trophy className="w-10 h-10 mx-auto mb-2 text-muted-foreground/30" />
                  <p className="text-sm text-muted-foreground">A arena está vazia...</p>
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </CardContent>
    </Card>
  );
}

// Mini Podium Hero Component
function MiniPodiumHero({ 
  entry, 
  position, 
  activeTab 
}: { 
  entry: RankingEntry; 
  position: 1 | 2 | 3; 
  activeTab: ArenaTab;
}) {
  const configs = {
    1: {
      height: 'h-16',
      avatarSize: 'w-10 h-10',
      gradient: 'from-yellow-500 via-amber-500 to-yellow-600',
      icon: <Crown className="w-5 h-5 text-yellow-400" />,
    },
    2: {
      height: 'h-12',
      avatarSize: 'w-8 h-8',
      gradient: 'from-slate-400 via-slate-300 to-slate-400',
      icon: <Medal className="w-4 h-4 text-slate-300" />,
    },
    3: {
      height: 'h-10',
      avatarSize: 'w-7 h-7',
      gradient: 'from-amber-600 via-orange-500 to-amber-600',
      icon: <Award className="w-4 h-4 text-amber-600" />,
    },
  };

  const config = configs[position];
  const epicTitle = getEpicTitle(position);

  const displayValue = useMemo(() => {
    switch (activeTab) {
      case 'simulados':
        return entry.simuladoScore || entry.xp;
      case 'streak':
        return entry.streak;
      default:
        return entry.xp;
    }
  }, [activeTab, entry]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className="flex flex-col items-center"
    >
      {config.icon}
      <Avatar className={cn(config.avatarSize, 'border-2 border-background mt-1')}>
        {entry.avatar && <AvatarImage src={entry.avatar} />}
        <AvatarFallback className={cn('bg-gradient-to-br text-white font-bold text-xs', config.gradient)}>
          {entry.name.charAt(0).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <p className={cn('font-bold text-[10px] truncate max-w-[60px] mt-1', epicTitle.color)}>
        {entry.name.split(' ')[0]}
      </p>
      <p className="text-xs font-bold">{displayValue.toLocaleString()}</p>
      <div className={cn(
        'w-full mt-1 rounded-t-md flex items-center justify-center text-white font-bold text-sm',
        'bg-gradient-to-t',
        config.gradient,
        config.height
      )}>
        {position}
      </div>
    </motion.div>
  );
}

// Mini Ranking Row Component
function MiniRankingRow({ 
  entry, 
  isCurrentUser, 
  activeTab 
}: { 
  entry: RankingEntry; 
  isCurrentUser: boolean; 
  activeTab: ArenaTab;
}) {
  const epicTitle = getEpicTitle(entry.rank);

  const displayValue = useMemo(() => {
    switch (activeTab) {
      case 'simulados':
        return { value: entry.simuladoScore || entry.xp, label: 'pts' };
      case 'streak':
        return { value: entry.streak, label: 'd' };
      default:
        return { value: entry.xp, label: 'xp' };
    }
  }, [activeTab, entry]);

  return (
    <div className={cn(
      'flex items-center gap-2 p-2 transition-all hover:bg-muted/30',
      isCurrentUser && 'bg-primary/5 border-l-2 border-primary'
    )}>
      {/* Rank */}
      <div className={cn(
        'w-7 h-7 rounded-md flex items-center justify-center font-bold text-xs',
        entry.rank <= 3 
          ? 'bg-gradient-to-br from-yellow-500/20 to-amber-500/20 text-yellow-500'
          : 'bg-muted text-muted-foreground'
      )}>
        {entry.rank}
      </div>

      {/* Avatar */}
      <Avatar className="w-7 h-7">
        {entry.avatar && <AvatarImage src={entry.avatar} />}
        <AvatarFallback className="bg-gradient-to-br from-primary/50 to-purple-500/50 text-white font-bold text-xs">
          {entry.name.charAt(0).toUpperCase()}
        </AvatarFallback>
      </Avatar>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1">
          <span className={cn('font-medium text-xs truncate', epicTitle.color)}>{entry.name}</span>
          {isCurrentUser && (
            <Badge className="bg-primary/20 text-primary text-[8px] px-1 py-0">Você</Badge>
          )}
        </div>
        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
          <span>Lv {entry.level}</span>
          <Flame className="w-2.5 h-2.5 text-orange-500" />
          <span>{entry.streak}d</span>
        </div>
      </div>

      {/* Score */}
      <div className="text-right">
        <div className="text-sm font-bold text-primary">
          {displayValue.value.toLocaleString()}
        </div>
        <p className="text-[9px] text-muted-foreground uppercase">{displayValue.label}</p>
      </div>
    </div>
  );
}

export default DashboardRankingWidget;
