// ============================================
// 📊 PROFILE STATS ORBS — LAZY PERFORMANT v2300
// Grid de estatísticas com performance tiering
// ============================================

import { memo } from 'react';
import { motion } from 'framer-motion';
import { useConstitutionPerformance } from '@/hooks/useConstitutionPerformance';
import { Zap, Star, Award, Flame, LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatItem {
  icon: LucideIcon;
  label: string;
  value: string | number;
  gradient: string;
}

interface ProfileStatsOrbsProps {
  currentXP: number;
  currentLevel: number;
  achievementsCount: number;
  currentStreak: number;
}

export const ProfileStatsOrbs = memo(function ProfileStatsOrbs({
  currentXP,
  currentLevel,
  achievementsCount,
  currentStreak,
}: ProfileStatsOrbsProps) {
  const { shouldAnimate, isLowEnd, motionProps } = useConstitutionPerformance();

  const stats: StatItem[] = [
    { 
      icon: Zap, 
      label: 'XP Total', 
      value: currentXP.toLocaleString(), 
      gradient: 'from-amber-500 to-orange-500' 
    },
    { 
      icon: Star, 
      label: 'Nível', 
      value: currentLevel, 
      gradient: 'from-primary to-secondary' 
    },
    { 
      icon: Award, 
      label: 'Conquistas', 
      value: achievementsCount, 
      gradient: 'from-purple-500 to-pink-500' 
    },
    { 
      icon: Flame, 
      label: 'Sequência', 
      value: `${currentStreak}d`, 
      gradient: 'from-red-500 to-orange-500' 
    },
  ];

  return (
    <div className="profile-stats-grid-2300">
      {stats.map((stat, index) => (
        <motion.div
          key={stat.label}
          {...(shouldAnimate ? {
            initial: { opacity: 0, y: 20 },
            animate: { opacity: 1, y: 0 },
            transition: { delay: index * 0.05 }
          } : {})}
          className={cn(
            "profile-stat-orb-2300",
            isLowEnd && "profile-stat-orb-static"
          )}
        >
          {/* Glow Effect - só em high-end */}
          {!isLowEnd && (
            <div className={cn(
              "profile-stat-orb-glow absolute inset-0 rounded-xl",
              `bg-gradient-to-br ${stat.gradient} opacity-10`
            )} />
          )}

          <div className="relative z-10 flex flex-col items-center text-center">
            <div className={cn(
              "w-12 h-12 rounded-xl flex items-center justify-center mb-3",
              `bg-gradient-to-br ${stat.gradient}`
            )}>
              <stat.icon className="w-6 h-6 text-white" />
            </div>
            <p className="text-2xl md:text-3xl font-bold text-foreground">{stat.value}</p>
            <p className="text-sm text-muted-foreground">{stat.label}</p>
          </div>
        </motion.div>
      ))}
    </div>
  );
});
