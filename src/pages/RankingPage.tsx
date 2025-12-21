// ============================================
// PANTEÃO DOS HERÓIS - Ranking de Gamificação
// Os guerreiros mais dedicados da plataforma
// Lei I: Performance | Lei IV: Competição Saudável
// ============================================

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGlobalRanking, useWeeklyRanking, useGamification } from '@/hooks/useGamification';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { 
  Trophy, Medal, Award, Flame, Crown, Star,
  ChevronLeft, TrendingUp, Zap, Target, Users
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface RankingEntry {
  id: string;
  rank: number;
  name: string;
  avatar?: string | null;
  xp: number;
  level: number;
  streak: number;
}

const TABS = [
  { id: 'global', label: 'Panteão Eterno', icon: Trophy, description: 'Ranking de todos os tempos' },
  { id: 'weekly', label: 'Arena da Semana', icon: Flame, description: 'Quem brilhou esta semana' },
] as const;

type TabId = typeof TABS[number]['id'];

export default function RankingPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabId>('global');
  const { user } = useAuth();
  const { gamification, levelInfo, userRank } = useGamification();

  const { data: globalRanking, isLoading: isLoadingGlobal } = useGlobalRanking();
  const { data: weeklyRanking, isLoading: isLoadingWeekly } = useWeeklyRanking();

  const ranking = activeTab === 'global' ? globalRanking : weeklyRanking;
  const isLoading = activeTab === 'global' ? isLoadingGlobal : isLoadingWeekly;

  // Top 3 do ranking
  const podium = useMemo(() => {
    if (!ranking || ranking.length < 3) return null;
    return {
      first: ranking[0],
      second: ranking[1],
      third: ranking[2],
    };
  }, [ranking]);

  // Encontrar posição do usuário atual
  const currentUserRank = useMemo(() => {
    if (!ranking || !user?.id) return null;
    const entry = ranking.find(r => r.id === user.id);
    return entry || null;
  }, [ranking, user?.id]);

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="w-6 h-6 text-yellow-400" />;
    if (rank === 2) return <Medal className="w-5 h-5 text-slate-300" />;
    if (rank === 3) return <Award className="w-5 h-5 text-amber-600" />;
    return null;
  };

  const getRankColor = (rank: number) => {
    if (rank === 1) return 'from-yellow-500/20 to-amber-500/10 border-yellow-500/30';
    if (rank === 2) return 'from-slate-400/20 to-slate-500/10 border-slate-400/30';
    if (rank === 3) return 'from-amber-600/20 to-orange-500/10 border-amber-600/30';
    return 'from-background to-muted border-border';
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/alunos')}>
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
                <Trophy className="w-7 h-7 text-yellow-500" />
                Panteão dos Heróis
              </h1>
              <p className="text-muted-foreground text-sm">
                Os guerreiros mais dedicados da plataforma
              </p>
            </div>
          </div>
        </div>

        {/* User Stats Card */}
        {gamification && (
          <Card className="bg-gradient-to-r from-primary/10 to-purple-500/10 border-primary/20">
            <CardContent className="p-4 md:p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <Avatar className="w-16 h-16 border-2 border-primary">
                      <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                        {user?.email?.[0]?.toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <Badge className="absolute -bottom-1 -right-1 bg-primary">
                      Lv {levelInfo.level}
                    </Badge>
                  </div>
                  <div>
                    <p className="font-semibold text-lg">{levelInfo.title}</p>
                    <p className="text-muted-foreground text-sm">
                      {gamification.total_xp.toLocaleString()} XP total
                    </p>
                  </div>
                </div>
                <div className="flex gap-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">
                      #{currentUserRank?.rank || userRank || '-'}
                    </div>
                    <div className="text-xs text-muted-foreground">Sua posição</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-amber-500 flex items-center justify-center gap-1">
                      <Flame className="w-5 h-5" />
                      {gamification.current_streak}
                    </div>
                    <div className="text-xs text-muted-foreground">Streak</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tabs */}
        <div className="flex gap-2 p-1 bg-muted/50 rounded-lg">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-md font-medium transition-all',
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:bg-background/50'
                )}
              >
                <Icon className="w-5 h-5" />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Podium (Top 3) */}
        <AnimatePresence mode="wait">
          {!isLoading && podium && (
            <motion.div
              key={activeTab + '-podium'}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid grid-cols-3 gap-2 md:gap-4 items-end"
            >
              {/* 2nd Place */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
                className="flex flex-col items-center"
              >
                <PodiumCard entry={podium.second} position={2} />
              </motion.div>

              {/* 1st Place */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0 }}
                className="flex flex-col items-center"
              >
                <PodiumCard entry={podium.first} position={1} />
              </motion.div>

              {/* 3rd Place */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                className="flex flex-col items-center"
              >
                <PodiumCard entry={podium.third} position={3} />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Full Ranking List */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Users className="w-5 h-5 text-primary" />
              Classificação Completa
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[400px]">
              {isLoading ? (
                <div className="space-y-2 p-4">
                  {Array.from({ length: 10 }).map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full rounded-lg" />
                  ))}
                </div>
              ) : ranking && ranking.length > 3 ? (
                <div className="divide-y divide-border">
                  {ranking.slice(3).map((entry) => {
                    const isCurrentUser = entry.id === user?.id;

                    return (
                      <motion.div
                        key={entry.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className={cn(
                          'flex items-center gap-4 p-4 transition-colors',
                          isCurrentUser && 'bg-primary/5'
                        )}
                      >
                        <div className={cn(
                          'w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm',
                          entry.rank <= 10 ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'
                        )}>
                          {entry.rank}
                        </div>

                        <Avatar className="w-10 h-10">
                          {entry.avatar && <AvatarImage src={entry.avatar} />}
                          <AvatarFallback className="bg-muted">
                            {entry.name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium truncate">{entry.name}</span>
                            {isCurrentUser && (
                              <Badge variant="secondary" className="text-xs">
                                Você
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Nível {entry.level}
                          </p>
                        </div>

                        <div className="text-right">
                          <div className="font-bold text-primary flex items-center gap-1">
                            <Zap className="w-4 h-4" />
                            {entry.xp.toLocaleString()}
                          </div>
                          <p className="text-xs text-muted-foreground">XP</p>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-8 text-center text-muted-foreground">
                  <Trophy className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>Nenhum dado de ranking disponível.</p>
                  <p className="text-sm mt-1">Continue estudando para aparecer aqui!</p>
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Componente do Pódio
function PodiumCard({ entry, position }: { entry: RankingEntry; position: 1 | 2 | 3 }) {
  const heights = { 1: 'h-32 md:h-40', 2: 'h-24 md:h-32', 3: 'h-20 md:h-28' };
  const avatarSizes = { 1: 'w-16 h-16 md:w-20 md:h-20', 2: 'w-12 h-12 md:w-16 md:h-16', 3: 'w-12 h-12 md:w-14 md:h-14' };
  const colors = {
    1: 'bg-gradient-to-t from-yellow-500 to-amber-400',
    2: 'bg-gradient-to-t from-slate-400 to-slate-300',
    3: 'bg-gradient-to-t from-amber-600 to-orange-500',
  };
  const icons = {
    1: <Crown className="w-6 h-6 md:w-8 md:h-8 text-yellow-400" />,
    2: <Medal className="w-5 h-5 md:w-6 md:h-6 text-slate-300" />,
    3: <Award className="w-5 h-5 md:w-6 md:h-6 text-amber-600" />,
  };

  return (
    <div className="flex flex-col items-center w-full">
      {/* Avatar e Info */}
      <div className="mb-2 text-center">
        {icons[position]}
        <Avatar className={cn('mx-auto mt-2 border-2 border-background shadow-lg', avatarSizes[position])}>
          {entry.avatar && <AvatarImage src={entry.avatar} />}
          <AvatarFallback className="bg-primary text-primary-foreground font-bold">
            {entry.name.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <p className="mt-2 font-semibold text-sm md:text-base truncate max-w-[100px] md:max-w-[120px]">
          {entry.name}
        </p>
        <p className="text-xs md:text-sm text-muted-foreground">
          {entry.xp.toLocaleString()} XP
        </p>
      </div>

      {/* Podium Base */}
      <div className={cn(
        'w-full rounded-t-lg flex items-center justify-center text-white font-bold text-xl md:text-2xl',
        colors[position],
        heights[position]
      )}>
        {position}
      </div>
    </div>
  );
}
