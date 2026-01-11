// ============================================
// 🏆 PANTEÃO DOS CAMPEÕES - RANKING ULTRAMAN 🏆
// Arena Épica de Competição Intelectual
// PERFORMANCE OPTIMIZED - NO ANIMATIONS
// ============================================

import { useState, useMemo } from 'react';
import { useGlobalRanking, useWeeklyRanking, useGamification } from '@/hooks/useGamification';
import { useSimuladoRanking } from '@/hooks/useSimuladoRanking';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { 
  Trophy, Medal, Award, Flame, Crown,
  ChevronLeft, TrendingUp, Zap, Target, Users,
  Sword, Sparkles,
  ChevronUp, ChevronDown, Minus, Activity
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

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
  { 
    id: 'xp', 
    label: 'XP Total', 
    icon: Zap, 
    color: 'from-amber-500 to-orange-600',
    description: 'Ranking por experiência acumulada'
  },
  { 
    id: 'simulados', 
    label: 'Simulados', 
    icon: Target, 
    color: 'from-purple-500 to-pink-600',
    description: 'Pontuação em simulados (10pts/questão)'
  },
  { 
    id: 'weekly', 
    label: 'Semanal', 
    icon: Flame, 
    color: 'from-red-500 to-orange-500',
    description: 'Os mais dedicados da semana'
  },
  { 
    id: 'streak', 
    label: 'Streak', 
    icon: Activity, 
    color: 'from-green-500 to-emerald-600',
    description: 'Dias consecutivos de estudo'
  },
] as const;

type ArenaTab = typeof ARENA_TABS[number]['id'];

// Títulos épicos baseados no rank
const getEpicTitle = (rank: number): { title: string; color: string; glow: string } => {
  if (rank === 1) return { title: 'ULTRAMAN SUPREMO', color: 'text-yellow-400', glow: 'shadow-yellow-500/50' };
  if (rank === 2) return { title: 'Guardião de Prata', color: 'text-slate-300', glow: 'shadow-slate-400/50' };
  if (rank === 3) return { title: 'Cavaleiro de Bronze', color: 'text-amber-600', glow: 'shadow-amber-600/50' };
  if (rank <= 10) return { title: 'Elite dos Campeões', color: 'text-purple-400', glow: 'shadow-purple-500/50' };
  if (rank <= 50) return { title: 'Guerreiro Veterano', color: 'text-blue-400', glow: 'shadow-blue-500/50' };
  if (rank <= 100) return { title: 'Aspirante', color: 'text-green-400', glow: 'shadow-green-500/50' };
  return { title: 'Iniciante', color: 'text-muted-foreground', glow: '' };
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

export default function RankingPage() {
  const navigate = useNavigate();
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
        // Ordenar por streak
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

  const activeTabConfig = ARENA_TABS.find(t => t.id === activeTab)!;

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background Effects (static) */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-purple-500/5" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" />
      
      {/* Static Grid */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: 'linear-gradient(hsl(var(--primary)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary)) 1px, transparent 1px)',
          backgroundSize: '50px 50px'
        }} />
      </div>

      <div className="relative z-10 p-4 md:p-8 max-w-6xl mx-auto space-y-6">
        {/* Epic Header */}
        <div className="text-center space-y-4">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/alunos/dashboard')}
            className="absolute left-4 top-4"
          >
            <ChevronLeft className="w-5 h-5 mr-1" />
            Voltar
          </Button>

          <div className="inline-block">
            <div className="relative">
              <Trophy className="w-16 h-16 md:w-20 md:h-20 text-yellow-500 mx-auto drop-shadow-lg" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-24 h-24 md:w-28 md:h-28 border-2 border-dashed border-yellow-500/30 rounded-full" />
              </div>
            </div>
          </div>

          <h1 className="text-3xl md:text-5xl font-black bg-gradient-to-r from-yellow-400 via-amber-500 to-orange-500 bg-clip-text text-transparent">
            PANTEÃO DOS CAMPEÕES
          </h1>
          <p className="text-muted-foreground text-lg">
            ⚔️ Arena onde lendas são forjadas ⚔️
          </p>
        </div>

        {/* User Hero Card */}
        {gamification && currentUserEntry && (
          <Card className={cn(
            "relative overflow-hidden border-2",
            currentUserEntry.rank <= 3 
              ? "border-yellow-500/50 bg-gradient-to-r from-yellow-500/10 via-amber-500/5 to-orange-500/10" 
              : "border-primary/30 bg-gradient-to-r from-primary/10 via-purple-500/5 to-pink-500/10"
          )}>
            {/* Glow Effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-transparent to-purple-500/20 blur-xl" />
            
            <CardContent className="relative p-6">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                {/* Avatar & Info */}
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="absolute -inset-2 bg-gradient-to-r from-primary via-purple-500 to-pink-500 rounded-full opacity-50 blur-sm" />
                    <Avatar className="w-20 h-20 border-4 border-background relative">
                      <AvatarFallback className="bg-gradient-to-br from-primary to-purple-600 text-white text-2xl font-bold">
                        {user?.email?.[0]?.toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <Badge className="absolute -bottom-2 -right-2 bg-gradient-to-r from-primary to-purple-600 text-white px-3 py-1">
                      Lv {levelInfo.level}
                    </Badge>
                  </div>
                  <div>
                    <p className={cn("font-black text-xl", getEpicTitle(currentUserEntry.rank).color)}>
                      {getEpicTitle(currentUserEntry.rank).title}
                    </p>
                    <p className="text-muted-foreground">{levelInfo.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Flame className="w-4 h-4 text-orange-500" />
                      <span className="text-sm font-medium">{gamification.current_streak} dias de streak</span>
                    </div>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-6 text-center">
                  <div>
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <RankChangeIndicator current={currentUserEntry.rank} previous={'previousRank' in currentUserEntry ? currentUserEntry.previousRank : undefined} />
                    </div>
                    <div className={cn(
                      "text-4xl font-black",
                      currentUserEntry.rank <= 3 ? "text-yellow-400" : "text-primary"
                    )}>
                      #{currentUserEntry.rank}
                    </div>
                    <p className="text-xs text-muted-foreground">POSIÇÃO</p>
                  </div>
                  <div>
                    <Zap className="w-5 h-5 text-amber-500 mx-auto mb-1" />
                    <div className="text-3xl font-bold text-amber-500">
                      {gamification.total_xp.toLocaleString()}
                    </div>
                    <p className="text-xs text-muted-foreground">XP TOTAL</p>
                  </div>
                  <div>
                    <Target className="w-5 h-5 text-purple-500 mx-auto mb-1" />
                    <div className="text-3xl font-bold text-purple-500">
                      {'simuladoScore' in currentUserEntry ? currentUserEntry.simuladoScore?.toLocaleString() : 0}
                    </div>
                    <p className="text-xs text-muted-foreground">PTS SIMULADO</p>
                  </div>
                </div>
              </div>

              {/* Progress to next rank */}
              {currentUserEntry.rank > 1 && ranking && ranking[currentUserEntry.rank - 2] && (
                <div className="mt-4 pt-4 border-t border-border/50">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Para ultrapassar #{currentUserEntry.rank - 1}</span>
                    <span className="font-bold text-primary">
                      +{(ranking[currentUserEntry.rank - 2].xp - currentUserEntry.xp).toLocaleString()} XP
                    </span>
                  </div>
                  <Progress 
                    value={(currentUserEntry.xp / ranking[currentUserEntry.rank - 2].xp) * 100} 
                    className="h-2" 
                  />
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Arena Tabs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {ARENA_TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'relative p-4 rounded-xl transition-all duration-150 overflow-hidden',
                  isActive
                    ? 'bg-gradient-to-br ' + tab.color + ' text-white shadow-lg'
                    : 'bg-card border border-border hover:border-primary/50'
                )}
              >
                {isActive && (
                  <div className="absolute inset-0 bg-white/10" />
                )}
                <Icon className={cn('w-6 h-6 mx-auto mb-2', !isActive && 'text-muted-foreground')} />
                <p className={cn('font-bold text-sm', !isActive && 'text-foreground')}>{tab.label}</p>
                <p className={cn('text-xs mt-1 opacity-80', !isActive && 'text-muted-foreground')}>
                  {tab.description}
                </p>
              </button>
            );
          })}
        </div>

        {/* Epic Podium */}
        {!isLoading && podium && (
          <div className="relative">
            {/* Podium Glow */}
            <div className="absolute inset-0 flex justify-center">
              <div className="w-96 h-40 bg-gradient-to-t from-yellow-500/20 via-amber-500/10 to-transparent blur-3xl" />
            </div>

            <div className="grid grid-cols-3 gap-2 md:gap-4 items-end relative z-10">
              {/* 2nd Place */}
              <PodiumHero entry={podium.second} position={2} activeTab={activeTab} />
              {/* 1st Place */}
              <PodiumHero entry={podium.first} position={1} activeTab={activeTab} />
              {/* 3rd Place */}
              <PodiumHero entry={podium.third} position={3} activeTab={activeTab} />
            </div>
          </div>
        )}

        {/* Full Ranking List */}
        <Card className="border-2 border-border/50 bg-card/80 backdrop-blur-sm">
          <CardHeader className="border-b border-border/50">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                <span>Classificação Completa</span>
              </div>
              <Badge variant="outline" className="font-mono">
                {ranking?.length || 0} guerreiros
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[500px]">
              {isLoading ? (
                <div className="space-y-2 p-4">
                  {Array.from({ length: 10 }).map((_, i) => (
                    <Skeleton key={i} className="h-20 w-full rounded-lg" />
                  ))}
                </div>
              ) : ranking && ranking.length > 0 ? (
                <div className="divide-y divide-border/50">
                  {ranking.map((entry) => (
                    <RankingRow 
                      key={entry.id} 
                      entry={entry} 
                      isCurrentUser={entry.id === user?.id}
                      activeTab={activeTab}
                    />
                  ))}
                </div>
              ) : (
                <div className="p-12 text-center">
                  <Sword className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
                  <p className="text-lg font-medium text-muted-foreground">
                    A arena está vazia...
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Seja o primeiro a conquistar sua posição!
                  </p>
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Componente do Herói no Pódio
function PodiumHero({ 
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
      height: 'h-44 md:h-56',
      avatarSize: 'w-20 h-20 md:w-24 md:h-24',
      gradient: 'from-yellow-500 via-amber-500 to-yellow-600',
      icon: <Crown className="w-8 h-8 md:w-10 md:h-10 text-yellow-400 drop-shadow-lg" />,
      ring: 'ring-4 ring-yellow-400/50',
      glow: 'shadow-[0_0_60px_rgba(234,179,8,0.4)]',
    },
    2: {
      height: 'h-32 md:h-44',
      avatarSize: 'w-16 h-16 md:w-20 md:h-20',
      gradient: 'from-slate-400 via-slate-300 to-slate-400',
      icon: <Medal className="w-6 h-6 md:w-8 md:h-8 text-slate-300 drop-shadow-lg" />,
      ring: 'ring-2 ring-slate-300/50',
      glow: 'shadow-[0_0_40px_rgba(148,163,184,0.3)]',
    },
    3: {
      height: 'h-24 md:h-36',
      avatarSize: 'w-14 h-14 md:w-18 md:h-18',
      gradient: 'from-amber-600 via-orange-500 to-amber-600',
      icon: <Award className="w-5 h-5 md:w-7 md:h-7 text-amber-600 drop-shadow-lg" />,
      ring: 'ring-2 ring-amber-500/50',
      glow: 'shadow-[0_0_30px_rgba(217,119,6,0.3)]',
    },
  };

  const config = configs[position];
  const epicTitle = getEpicTitle(position);

  const displayValue = useMemo(() => {
    switch (activeTab) {
      case 'simulados':
        return { value: entry.simuladoScore || entry.xp, label: 'PTS' };
      case 'streak':
        return { value: entry.streak, label: 'DIAS' };
      default:
        return { value: entry.xp, label: 'XP' };
    }
  }, [activeTab, entry]);

  return (
    <div className="flex flex-col items-center">
      {/* Champion Icon */}
      <div>
        {config.icon}
      </div>

      {/* Avatar */}
      <div className={cn('relative mt-2', config.glow)}>
        <Avatar className={cn(config.avatarSize, config.ring, 'border-4 border-background')}>
          {entry.avatar && <AvatarImage src={entry.avatar} />}
          <AvatarFallback className={cn('bg-gradient-to-br text-white font-bold text-xl', config.gradient)}>
            {entry.name.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        {position === 1 && (
          <div className="absolute -inset-3 border-2 border-dashed border-yellow-400/30 rounded-full" />
        )}
      </div>

      {/* Name & Stats */}
      <div className="mt-3 text-center">
        <p className={cn('font-bold text-sm md:text-base truncate max-w-[90px] md:max-w-[120px]', epicTitle.color)}>
          {entry.name}
        </p>
        <p className="text-xs text-muted-foreground">{epicTitle.title}</p>
        <p className="text-lg md:text-xl font-black mt-1">
          {displayValue.value.toLocaleString()}
          <span className="text-xs ml-1 text-muted-foreground">{displayValue.label}</span>
        </p>
      </div>

      {/* Podium Base */}
      <div className={cn(
        'w-full mt-3 rounded-t-xl flex items-center justify-center text-white font-black text-2xl md:text-3xl',
        'bg-gradient-to-t',
        config.gradient,
        config.height
      )}>
        <span className="drop-shadow-lg">{position}</span>
      </div>
    </div>
  );
}

// Componente de Linha do Ranking
function RankingRow({ 
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
        return { value: entry.streak, label: 'dias' };
      default:
        return { value: entry.xp, label: 'xp' };
    }
  }, [activeTab, entry]);

  return (
    <div className={cn(
      'flex items-center gap-4 p-4 transition-colors hover:bg-muted/50',
      isCurrentUser && 'bg-primary/5 border-l-4 border-primary'
    )}>
      {/* Rank */}
      <div className={cn(
        'w-12 h-12 rounded-xl flex flex-col items-center justify-center font-bold',
        entry.rank <= 3 
          ? 'bg-gradient-to-br from-yellow-500/20 to-amber-500/20 text-yellow-500'
          : entry.rank <= 10
          ? 'bg-gradient-to-br from-purple-500/20 to-pink-500/20 text-purple-400'
          : 'bg-muted text-muted-foreground'
      )}>
        <span className="text-lg">{entry.rank}</span>
        <RankChangeIndicator current={entry.rank} previous={entry.previousRank} />
      </div>

      {/* Avatar */}
      <Avatar className="w-12 h-12">
        {entry.avatar && <AvatarImage src={entry.avatar} />}
        <AvatarFallback className="bg-gradient-to-br from-primary/50 to-purple-500/50 text-white font-bold">
          {entry.name.charAt(0).toUpperCase()}
        </AvatarFallback>
      </Avatar>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={cn('font-bold truncate', epicTitle.color)}>{entry.name}</span>
          {isCurrentUser && (
            <Badge className="bg-primary/20 text-primary text-xs">Você</Badge>
          )}
          {entry.rank <= 10 && (
            <Sparkles className="w-4 h-4 text-yellow-500" />
          )}
        </div>
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <span>Nível {entry.level}</span>
          <span className="flex items-center gap-1">
            <Flame className="w-3 h-3 text-orange-500" />
            {entry.streak}d
          </span>
          {entry.accuracy !== undefined && (
            <span className="flex items-center gap-1">
              <Target className="w-3 h-3 text-green-500" />
              {entry.accuracy}%
            </span>
          )}
        </div>
      </div>

      {/* Score */}
      <div className="text-right">
        <div className="text-xl font-black text-primary">
          {displayValue.value.toLocaleString()}
        </div>
        <p className="text-xs text-muted-foreground uppercase">{displayValue.label}</p>
      </div>
    </div>
  );
}
