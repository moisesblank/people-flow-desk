import { motion } from 'framer-motion';
import { Zap, Flame, Trophy, Star, Target } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useGamification, getLevelInfo } from '@/hooks/useGamification';
import { cn } from '@/lib/utils';

interface XPProgressCardProps {
  variant?: 'full' | 'compact' | 'minimal';
  showStreak?: boolean;
  className?: string;
}

const levelColors = {
  1: 'from-slate-400 to-slate-600',
  5: 'from-stats-green to-emerald-600',
  10: 'from-stats-blue to-blue-700',
  15: 'from-stats-purple to-purple-700',
  20: 'from-stats-gold to-amber-600',
  30: 'from-primary to-primary-hover',
  50: 'from-primary via-primary-hover to-secondary',
};

function getLevelColor(level: number): string {
  const thresholds = Object.keys(levelColors).map(Number).sort((a, b) => b - a);
  for (const threshold of thresholds) {
    if (level >= threshold) {
      return levelColors[threshold as keyof typeof levelColors];
    }
  }
  return levelColors[1];
}

export function XPProgressCard({ variant = 'full', showStreak = true, className }: XPProgressCardProps) {
  const { gamification, levelInfo, isLoading } = useGamification();

  if (isLoading) {
    return (
      <Card className={cn('animate-pulse', className)}>
        <CardContent className="p-6">
          <div className="h-20 bg-muted rounded-lg" />
        </CardContent>
      </Card>
    );
  }

  const levelColor = getLevelColor(levelInfo.level);

  if (variant === 'minimal') {
    return (
      <div className={cn('flex items-center gap-3', className)}>
        <div className={cn(
          'flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br font-bold text-white text-sm',
          levelColor
        )}>
          {levelInfo.level}
        </div>
        <div className="flex-1">
          <Progress value={levelInfo.progressPercentage} className="h-2" />
        </div>
        <Badge variant="outline" className="gap-1">
          <Zap className="h-3 w-3 text-amber-500" />
          {levelInfo.totalXP}
        </Badge>
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <Card className={cn('overflow-hidden', className)}>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            {/* Level Badge */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className={cn(
                'flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-br font-bold text-white text-xl shadow-lg',
                levelColor
              )}
            >
              {levelInfo.level}
            </motion.div>

            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium">{levelInfo.title}</span>
                <span className="text-sm text-muted-foreground">
                  {levelInfo.totalXP} XP
                </span>
              </div>
              <Progress value={levelInfo.progressPercentage} className="h-2" />
              {!levelInfo.isMaxLevel && (
                <p className="text-xs text-muted-foreground mt-1">
                  {levelInfo.xpNeededForNextLevel - levelInfo.xpInCurrentLevel} XP para o próximo nível
                </p>
              )}
            </div>

            {showStreak && gamification?.current_streak > 0 && (
              <div className="flex flex-col items-center text-orange-500">
                <Flame className="h-6 w-6" />
                <span className="text-sm font-bold">{gamification.current_streak}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Full variant
  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Star className="h-5 w-5 text-amber-500" />
          Seu Progresso
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Level Section */}
        <div className="flex items-center gap-6">
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 200 }}
            className={cn(
              'relative flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br font-bold text-white text-2xl shadow-xl',
              levelColor
            )}
          >
            {levelInfo.level}
            <div className="absolute inset-0 rounded-full bg-white/20 animate-pulse" />
          </motion.div>

          <div className="flex-1">
            <h3 className="text-xl font-bold">{levelInfo.title}</h3>
            <p className="text-muted-foreground">Nível {levelInfo.level}</p>
            
            <div className="mt-3">
              <div className="flex justify-between text-sm mb-1">
                <span>{levelInfo.xpInCurrentLevel} XP</span>
                {!levelInfo.isMaxLevel && (
                  <span className="text-muted-foreground">
                    {levelInfo.xpNeededForNextLevel} XP
                  </span>
                )}
              </div>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: '100%' }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <Progress value={levelInfo.progressPercentage} className="h-3" />
              </motion.div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <Zap className="h-5 w-5 mx-auto mb-1 text-amber-500" />
            <p className="text-2xl font-bold">{levelInfo.totalXP}</p>
            <p className="text-xs text-muted-foreground">XP Total</p>
          </div>

          {showStreak && (
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <Flame className="h-5 w-5 mx-auto mb-1 text-orange-500" />
              <p className="text-2xl font-bold">{gamification?.current_streak || 0}</p>
              <p className="text-xs text-muted-foreground">Dias seguidos</p>
            </div>
          )}

          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <Trophy className="h-5 w-5 mx-auto mb-1 text-purple-500" />
            <p className="text-2xl font-bold">{gamification?.badges_earned || 0}</p>
            <p className="text-xs text-muted-foreground">Conquistas</p>
          </div>

          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <Target className="h-5 w-5 mx-auto mb-1 text-blue-500" />
            <p className="text-2xl font-bold">{gamification?.lessons_completed || 0}</p>
            <p className="text-xs text-muted-foreground">Aulas</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default XPProgressCard;
