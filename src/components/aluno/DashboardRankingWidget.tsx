// ============================================
// 🏆 DASHBOARD RANKING WIDGET - YEAR 2300 CINEMATIC
// Panteão dos Campeões - Performance Optimized
// NO ANIMATIONS - Pure CSS Static Design
// ============================================

import { useState, useMemo } from 'react';
import { useGlobalRanking, useWeeklyRanking, useGamification } from '@/hooks/useGamification';
import { useSimuladoRanking } from '@/hooks/useSimuladoRanking';
import { useAuth } from '@/hooks/useAuth';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { 
  Trophy, Medal, Award, Flame, Crown,
  TrendingUp, Zap, Target, Users, Sparkles,
  ChevronUp, ChevronDown, Minus, Activity,
  Swords, Shield
} from 'lucide-react';

// Import 2300 ranking styles (optimized)
import "@/styles/ranking-2300.css";

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
  { id: 'xp', label: 'XP Total', icon: Zap, color: 'amber', gradient: 'from-amber-500 to-orange-600' },
  { id: 'simulados', label: 'Simulados', icon: Target, color: 'purple', gradient: 'from-purple-500 to-pink-600' },
  { id: 'weekly', label: 'Semanal', icon: Flame, color: 'red', gradient: 'from-red-500 to-orange-500' },
  { id: 'streak', label: 'Streak', icon: Activity, color: 'green', gradient: 'from-green-500 to-emerald-600' },
] as const;

type ArenaTab = typeof ARENA_TABS[number]['id'];

// Títulos épicos baseados no rank
const getEpicTitle = (rank: number): { title: string; color: string; glow: string } => {
  if (rank === 1) return { title: 'ULTRAMAN SUPREMO', color: 'text-yellow-400', glow: 'drop-shadow(0 0 8px hsl(43 80% 50%))' };
  if (rank === 2) return { title: 'Guardião de Prata', color: 'text-slate-300', glow: 'drop-shadow(0 0 6px hsl(220 20% 70%))' };
  if (rank === 3) return { title: 'Cavaleiro de Bronze', color: 'text-amber-600', glow: 'drop-shadow(0 0 6px hsl(25 70% 50%))' };
  if (rank <= 10) return { title: 'Elite dos Campeões', color: 'text-purple-400', glow: '' };
  if (rank <= 50) return { title: 'Guerreiro Veterano', color: 'text-blue-400', glow: '' };
  if (rank <= 100) return { title: 'Aspirante', color: 'text-green-400', glow: '' };
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
    <div className="ranking-arena-2300 ranking-no-animations">
      {/* ============================================ */}
      {/* HOLOGRAPHIC HEADER */}
      {/* ============================================ */}
      <div className="ranking-header-2300">
        <div className="flex items-center gap-2 sm:gap-4 min-w-0">
          <div className="trophy-icon flex-shrink-0">
            <Trophy className="w-5 h-5 sm:w-7 sm:h-7 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-lg sm:text-2xl font-black text-white flex items-center gap-2 flex-wrap">
              <span className="bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-500 bg-clip-text text-transparent truncate">
                PANTEÃO DOS CAMPEÕES
              </span>
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400 flex-shrink-0" />
            </h2>
            <p className="text-xs sm:text-sm text-white/60 flex items-center gap-2 mt-0.5 truncate">
              <Swords className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
              <span className="truncate">Arena de competição intelectual</span>
            </p>
          </div>
        </div>
        
        {/* Live indicator */}
        <div className="absolute top-3 right-3 sm:top-4 sm:right-4">
          <Badge className="bg-green-500/20 text-green-400 border border-green-500/40 text-[10px] sm:text-xs">
            <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-400 rounded-full mr-1 sm:mr-2" />
            LIVE
          </Badge>
        </div>
      </div>

      <div className="p-4 space-y-5">
        {/* ============================================ */}
        {/* USER HERO CARD - FEATURED PLAYER */}
        {/* ============================================ */}
        {gamification && currentUserEntry && (
          <div className="ranking-user-hero-2300">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 relative z-10">
              {/* Avatar & Info */}
              <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                <div className="ranking-avatar-2300 flex-shrink-0">
                  <Avatar className="w-12 h-12 sm:w-16 sm:h-16 border-2 border-transparent">
                    <AvatarFallback className="bg-gradient-to-br from-purple-600 via-pink-500 to-cyan-400 text-white text-lg sm:text-xl font-bold">
                      {user?.email?.[0]?.toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <div className="min-w-0 flex-1">
                  <p className={cn(
                    "font-black text-base sm:text-lg truncate",
                    getEpicTitle(currentUserEntry.rank).color
                  )} style={{ filter: getEpicTitle(currentUserEntry.rank).glow }}>
                    {getEpicTitle(currentUserEntry.rank).title}
                  </p>
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-1">
                    <Badge className="bg-gradient-to-r from-purple-600 to-pink-600 text-white border-0 px-2 sm:px-2.5 py-0.5 sm:py-1 text-xs">
                      <Shield className="w-3 h-3 mr-1" />
                      Lv {levelInfo.level}
                    </Badge>
                    <div className="flex items-center gap-1 text-xs sm:text-sm text-white/70">
                      <Flame className="w-3 h-3 sm:w-4 sm:h-4 text-orange-500" />
                      <span className="font-semibold">{gamification.current_streak}</span>
                      <span className="text-[10px] sm:text-xs">dias</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="flex items-center justify-between sm:justify-end gap-4 sm:gap-6">
                <div className={cn(
                  "ranking-position-badge-2300",
                  currentUserEntry.rank <= 3 && "top-3"
                )}>
                  <div className={cn(
                    "text-2xl sm:text-3xl font-black",
                    currentUserEntry.rank <= 3 ? "text-yellow-400" : "text-white"
                  )} style={currentUserEntry.rank <= 3 ? { filter: 'drop-shadow(0 0 8px hsl(43 80% 50%))' } : {}}>
                    #{currentUserEntry.rank}
                  </div>
                  <p className="text-[9px] sm:text-[10px] uppercase tracking-widest text-white/50 font-medium text-center">
                    POSIÇÃO
                  </p>
                </div>
                <div className="text-center">
                  <div className="text-xl sm:text-2xl font-black bg-gradient-to-r from-amber-400 to-yellow-500 bg-clip-text text-transparent">
                    {gamification.total_xp.toLocaleString()}
                  </div>
                  <p className="text-[9px] sm:text-[10px] uppercase tracking-widest text-white/50 font-medium">XP TOTAL</p>
                </div>
              </div>
            </div>

            {/* Progress to next rank */}
            {currentUserEntry.rank > 1 && ranking && ranking[currentUserEntry.rank - 2] && (
              <div className="mt-4 pt-4 border-t border-white/10 relative z-10">
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="text-white/60 flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    Para ultrapassar #{currentUserEntry.rank - 1}
                  </span>
                  <span className="font-bold text-cyan-400">
                    +{(ranking[currentUserEntry.rank - 2].xp - currentUserEntry.xp).toLocaleString()} XP
                  </span>
                </div>
                <div className="ranking-progress-2300">
                  <div 
                    className="fill"
                    style={{ width: `${Math.min((currentUserEntry.xp / ranking[currentUserEntry.rank - 2].xp) * 100, 100)}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* ============================================ */}
        {/* ARENA TABS */}
        {/* ============================================ */}
        <div className="ranking-tabs-2300">
          {ARENA_TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn('ranking-tab-2300', isActive && 'active')}
              >
                <div className="relative z-10 flex flex-col items-center gap-1">
                  <div className={cn(
                    'p-1.5 rounded-lg transition-colors',
                    isActive 
                      ? `bg-gradient-to-br ${tab.gradient}`
                      : 'bg-muted/30'
                  )}>
                    <Icon className={cn('w-4 h-4', isActive ? 'text-white' : 'text-muted-foreground')} />
                  </div>
                  <span className={cn(
                    'font-semibold text-[10px] uppercase tracking-wide',
                    isActive ? 'text-white' : 'text-muted-foreground'
                  )}>
                    {tab.label}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* ============================================ */}
        {/* 3D PODIUM - CHAMPIONS */}
        {/* ============================================ */}
        {!isLoading && podium && (
          <div className="ranking-podium-2300">
            {/* 2nd Place - Silver */}
            <PodiumChampion entry={podium.second} position={2} activeTab={activeTab} />
            
            {/* 1st Place - Gold (center, tallest) */}
            <PodiumChampion entry={podium.first} position={1} activeTab={activeTab} />
            
            {/* 3rd Place - Bronze */}
            <PodiumChampion entry={podium.third} position={3} activeTab={activeTab} />
          </div>
        )}

        {/* ============================================ */}
        {/* TOP 10 LIST - WARRIORS ROSTER */}
        {/* ============================================ */}
        <div className="ranking-list-2300">
          <div className="ranking-list-header-2300">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-gradient-to-br from-purple-600 to-pink-600">
                <Users className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-white text-sm">Top 10 Guerreiros</span>
            </div>
            <Badge className="bg-white/10 text-white/80 border-white/20 text-xs">
              {ranking?.length || 0} competidores
            </Badge>
          </div>
          
          <ScrollArea className="h-[280px]">
            {isLoading ? (
              <div className="space-y-2 p-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-14 w-full rounded-lg bg-white/5" />
                ))}
              </div>
            ) : ranking && ranking.length > 0 ? (
              <div>
                {ranking.slice(0, 10).map((entry) => (
                  <RankingRow 
                    key={entry.id} 
                    entry={entry} 
                    isCurrentUser={entry.id === user?.id}
                    activeTab={activeTab}
                  />
                ))}
              </div>
            ) : (
              <div className="ranking-empty-2300">
                <div className="icon-wrapper">
                  <Trophy className="w-10 h-10 text-muted-foreground/30" />
                </div>
                <p className="text-white/60 font-medium">A arena está vazia...</p>
                <p className="text-white/40 text-sm mt-1">Seja o primeiro a conquistar pontos!</p>
              </div>
            )}
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}

// ============================================
// PODIUM CHAMPION COMPONENT
// ============================================
function PodiumChampion({ 
  entry, 
  position, 
  activeTab 
}: { 
  entry: RankingEntry; 
  position: 1 | 2 | 3; 
  activeTab: ArenaTab;
}) {
  const positionClass = position === 1 ? 'gold' : position === 2 ? 'silver' : 'bronze';
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

  const displayLabel = useMemo(() => {
    switch (activeTab) {
      case 'streak':
        return 'dias';
      default:
        return 'XP';
    }
  }, [activeTab]);

  const CrownIcon = position === 1 ? Crown : position === 2 ? Medal : Award;

  return (
    <div className={cn('ranking-champion-2300', positionClass)}>
      {/* Crown/Medal Icon */}
      <div className="crown-container">
        <CrownIcon className={cn(
          'w-7 h-7',
          position === 1 ? 'text-yellow-400' : position === 2 ? 'text-slate-300' : 'text-amber-600'
        )} />
      </div>

      {/* Avatar */}
      <div className="avatar-wrapper">
        <Avatar className={cn(
          'border-0',
          position === 1 ? 'w-14 h-14' : 'w-11 h-11'
        )}>
          {entry.avatar && <AvatarImage src={entry.avatar} />}
          <AvatarFallback className={cn(
            'text-white font-bold',
            position === 1 
              ? 'bg-gradient-to-br from-yellow-500 to-amber-600 text-lg' 
              : position === 2
                ? 'bg-gradient-to-br from-slate-400 to-slate-500 text-base'
                : 'bg-gradient-to-br from-amber-600 to-orange-700 text-base'
          )}>
            {entry.name.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      </div>

      {/* Name */}
      <p className={cn(
        'font-bold text-xs truncate max-w-[80px] text-center',
        epicTitle.color
      )}>
        {entry.name.split(' ')[0]}
      </p>

      {/* Score */}
      <p className="text-sm font-black text-white flex items-center gap-1">
        {displayValue.toLocaleString()}
        <span className="text-[10px] text-white/50 font-medium">{displayLabel}</span>
      </p>

      {/* Podium Base */}
      <div className="podium-base">
        <span style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }}>
          {position}
        </span>
      </div>
    </div>
  );
}

// ============================================
// RANKING ROW COMPONENT
// ============================================
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
    <div className={cn('ranking-row-2300', isCurrentUser && 'is-user')}>
      {/* Rank Badge */}
      <div className={cn(
        'ranking-rank-badge-2300',
        entry.rank <= 3 && 'top-3'
      )}>
        {entry.rank}
      </div>

      {/* Avatar */}
      <Avatar className="w-10 h-10 border-2 border-white/10">
        {entry.avatar && <AvatarImage src={entry.avatar} />}
        <AvatarFallback className="bg-gradient-to-br from-purple-600/50 to-pink-600/50 text-white font-bold text-sm">
          {entry.name.charAt(0).toUpperCase()}
        </AvatarFallback>
      </Avatar>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={cn('font-semibold text-sm truncate', epicTitle.color)}>
            {entry.name}
          </span>
          {isCurrentUser && (
            <Badge className="bg-gradient-to-r from-purple-600 to-pink-600 text-white text-[9px] px-1.5 py-0 border-0">
              VOCÊ
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs text-white/50">Lv {entry.level}</span>
          <div className="flex items-center gap-0.5">
            <Flame className="w-3 h-3 text-orange-500" />
            <span className="text-xs text-white/50">{entry.streak}d</span>
          </div>
        </div>
      </div>

      {/* XP Score */}
      <div className="ranking-xp-display-2300">
        <div className="value">
          {displayValue.value.toLocaleString()}
        </div>
        <p className="label">{displayValue.label}</p>
      </div>
    </div>
  );
}

export default DashboardRankingWidget;
