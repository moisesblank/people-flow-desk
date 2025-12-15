// ============================================
// MOISÉS MEDEIROS v7.0 - LEADERBOARD
// Spider-Man Theme - Ranking de XP
// ============================================

import { motion } from 'framer-motion';
import { Trophy, Medal, Crown, Flame, User, Zap } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useLeaderboard } from '@/hooks/useGamification';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

interface LeaderboardProps {
  limit?: number;
  showTitle?: boolean;
  compact?: boolean;
}

// Spider-Man themed rank styles
const rankStyles = {
  1: {
    icon: Crown,
    bg: 'bg-gradient-to-r from-stats-gold/20 to-amber-500/20',
    border: 'border-stats-gold/50',
    text: 'text-stats-gold',
    badge: 'bg-gradient-to-r from-stats-gold to-amber-500 text-black',
  },
  2: {
    icon: Medal,
    bg: 'bg-gradient-to-r from-slate-400/20 to-gray-400/20',
    border: 'border-slate-400/50',
    text: 'text-slate-400',
    badge: 'bg-slate-400 text-slate-950',
  },
  3: {
    icon: Trophy,
    bg: 'bg-gradient-to-r from-primary/20 to-spider-blue/20',
    border: 'border-primary/50',
    text: 'text-primary',
    badge: 'bg-gradient-spider text-white',
  },
};

export function Leaderboard({ limit = 10, showTitle = true, compact = false }: LeaderboardProps) {
  const { data: leaderboard, isLoading } = useLeaderboard(limit);
  const { user } = useAuth();

  if (isLoading) {
    return (
      <Card>
        {showTitle && (
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-amber-500" />
              Ranking
            </CardTitle>
          </CardHeader>
        )}
        <CardContent>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-14 bg-muted/50 animate-pulse rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      {showTitle && (
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-amber-500" />
            Ranking de XP
          </CardTitle>
        </CardHeader>
      )}
      <CardContent className={compact ? 'p-3' : ''}>
        <div className="space-y-2">
          {leaderboard?.map((entry, index) => {
            const rank = index + 1;
            const isCurrentUser = entry.user_id === user?.id;
            const rankStyle = rankStyles[rank as keyof typeof rankStyles];
            const RankIcon = rankStyle?.icon;

            return (
              <motion.div
                key={entry.user_id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className={cn(
                  'flex items-center gap-3 p-3 rounded-lg transition-all',
                  rankStyle?.bg || 'bg-muted/30',
                  rankStyle?.border ? `border ${rankStyle.border}` : 'border border-transparent',
                  isCurrentUser && 'ring-2 ring-primary ring-offset-2 ring-offset-background'
                )}
              >
                {/* Rank */}
                <div className={cn(
                  'flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm',
                  rankStyle?.badge || 'bg-muted text-muted-foreground'
                )}>
                  {RankIcon ? (
                    <RankIcon className="h-4 w-4" />
                  ) : (
                    rank
                  )}
                </div>

                {/* Avatar */}
                <Avatar className="h-10 w-10">
                  <AvatarImage src={entry.profile?.avatar_url || undefined} />
                  <AvatarFallback>
                    <User className="h-5 w-5" />
                  </AvatarFallback>
                </Avatar>

                {/* Name and Level */}
                <div className="flex-1 min-w-0">
                  <p className={cn(
                    'font-medium truncate',
                    isCurrentUser && 'text-primary'
                  )}>
                    {entry.profile?.nome || 'Usuário'}
                    {isCurrentUser && (
                      <Badge variant="outline" className="ml-2 text-xs">
                        Você
                      </Badge>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Nível {entry.current_level}
                  </p>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-3 text-sm">
                  {entry.current_streak > 0 && (
                    <div className="flex items-center gap-1 text-orange-500">
                      <Flame className="h-4 w-4" />
                      <span>{entry.current_streak}</span>
                    </div>
                  )}
                  <div className={cn(
                    'font-bold',
                    rankStyle?.text || 'text-foreground'
                  )}>
                    {entry.total_xp.toLocaleString()} XP
                  </div>
                </div>
              </motion.div>
            );
          })}

          {(!leaderboard || leaderboard.length === 0) && (
            <div className="text-center py-8 text-muted-foreground">
              <Trophy className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Nenhum participante ainda</p>
              <p className="text-sm">Complete aulas para aparecer no ranking!</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default Leaderboard;
