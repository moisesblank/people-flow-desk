// ============================================
// 🏆 PROFILE ACHIEVEMENTS RAIL — VIRTUALIZED v2300
// Salão de Troféus com virtualização
// ============================================

import { memo, useMemo, useRef, useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useConstitutionPerformance } from '@/hooks/useConstitutionPerformance';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Trophy, Star, Medal, Crown, Flame, Zap, Shield, Target, Award, Sparkles 
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Ícones mapeados
const ACHIEVEMENT_ICONS: Record<string, React.ElementType> = {
  trophy: Trophy,
  star: Star,
  medal: Medal,
  crown: Crown,
  flame: Flame,
  zap: Zap,
  shield: Shield,
  target: Target,
  award: Award,
  sparkles: Sparkles,
};

// Cores por raridade
const RARITY_CONFIG = {
  common: { 
    label: 'Comum', 
    className: 'profile-achievement-common',
    color: 'hsl(var(--muted-foreground))'
  },
  rare: { 
    label: 'Raro', 
    className: 'profile-achievement-rare',
    color: 'hsl(200 90% 50%)'
  },
  epic: { 
    label: 'Épico', 
    className: 'profile-achievement-epic',
    color: 'hsl(280 80% 60%)'
  },
  legendary: { 
    label: 'Lendário', 
    className: 'profile-achievement-legendary',
    color: 'hsl(45 100% 50%)'
  },
};

interface Achievement {
  id: string;
  earned_at: string;
  achievement?: {
    name: string;
    description?: string;
    icon?: string;
    rarity?: string;
  } | null;
}

interface ProfileAchievementsRailProps {
  achievements: Achievement[] | undefined;
  isLoading: boolean;
}

// Componente de card individual memoizado
const AchievementCard = memo(function AchievementCard({ 
  item, 
  index,
  shouldAnimate,
  isLowEnd 
}: { 
  item: Achievement; 
  index: number;
  shouldAnimate: boolean;
  isLowEnd: boolean;
}) {
  const rarity = (item.achievement?.rarity as keyof typeof RARITY_CONFIG) || 'common';
  const config = RARITY_CONFIG[rarity] || RARITY_CONFIG.common;
  const IconComponent = ACHIEVEMENT_ICONS[item.achievement?.icon || 'trophy'] || Trophy;

  return (
    <motion.div
      {...(shouldAnimate && index < 12 ? {
        initial: { opacity: 0, scale: 0.9 },
        animate: { opacity: 1, scale: 1 },
        transition: { delay: index * 0.02 }
      } : {})}
      className={cn(
        "profile-achievement-card-2300", 
        config.className,
        isLowEnd && "profile-achievement-card-static"
      )}
    >
      <div className="flex items-start gap-3">
        <div 
          className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: `${config.color}20` }}
        >
          <IconComponent className="w-6 h-6" style={{ color: config.color }} />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-foreground truncate text-sm">
            {item.achievement?.name}
          </h4>
          <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
            {item.achievement?.description}
          </p>
          <div className="flex items-center justify-between mt-2">
            <Badge 
              variant="outline" 
              className="text-xs px-2 py-0"
              style={{ borderColor: config.color, color: config.color }}
            >
              {config.label}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {new Date(item.earned_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
});

export const ProfileAchievementsRail = memo(function ProfileAchievementsRail({
  achievements,
  isLoading,
}: ProfileAchievementsRailProps) {
  const { shouldAnimate, isLowEnd } = useConstitutionPerformance();
  const containerRef = useRef<HTMLDivElement>(null);
  const [visibleCount, setVisibleCount] = useState(12); // Renderiza 12 inicialmente

  // Renderização progressiva
  useEffect(() => {
    if (!achievements || achievements.length <= visibleCount) return;

    const timer = setTimeout(() => {
      setVisibleCount(prev => Math.min(prev + 12, achievements.length));
    }, 100);

    return () => clearTimeout(timer);
  }, [achievements, visibleCount]);

  const visibleAchievements = useMemo(() => {
    if (!achievements) return [];
    return achievements.slice(0, visibleCount);
  }, [achievements, visibleCount]);

  if (isLoading) {
    return (
      <div className="profile-rail-2300">
        <div className="profile-rail-header-2300">
          <div className="profile-rail-title-2300">
            <div className="profile-rail-icon-2300 bg-gradient-to-br from-amber-500 to-orange-500">
              <Trophy className="w-5 h-5 text-white" />
            </div>
            Salão de Troféus
          </div>
        </div>
        <div className="profile-achievements-grid-2300">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="profile-rail-2300" ref={containerRef}>
      <div className="profile-rail-header-2300">
        <div className="profile-rail-title-2300">
          <div className="profile-rail-icon-2300 bg-gradient-to-br from-amber-500 to-orange-500">
            <Trophy className="w-5 h-5 text-white" />
          </div>
          Salão de Troféus
        </div>
        
        {achievements && achievements.length > 0 && (
          <Badge variant="secondary" className="gap-1">
            {achievements.length} Conquistas
          </Badge>
        )}
      </div>

      {achievements && achievements.length > 0 ? (
        <div className="profile-achievements-grid-2300">
          {visibleAchievements.map((item, index) => (
            <AchievementCard
              key={item.id}
              item={item}
              index={index}
              shouldAnimate={shouldAnimate}
              isLowEnd={isLowEnd}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 px-4">
          <div className="w-20 h-20 mx-auto rounded-full bg-muted/50 flex items-center justify-center mb-4">
            <Trophy className="w-10 h-10 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">
            Nenhuma conquista ainda
          </h3>
          <p className="text-muted-foreground max-w-sm mx-auto">
            Continue estudando para desbloquear conquistas incríveis!
          </p>
        </div>
      )}
    </div>
  );
});
