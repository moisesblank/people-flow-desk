// ============================================
// MOISES MEDEIROS v7.0 - ACHIEVEMENT BADGE
// Spider-Man Theme - Gamificação Completa
// ============================================

import { motion } from "framer-motion";
import { Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Conquistas disponíveis
export const ACHIEVEMENTS = [
  { 
    id: "first_login", 
    name: "Primeiro Passo", 
    description: "Complete seu primeiro login",
    xp: 50, 
    icon: "🚀", 
    rarity: "common" as const
  },
  { 
    id: "streak_7", 
    name: "Semana Dedicada", 
    description: "Estude por 7 dias seguidos",
    xp: 200, 
    icon: "🔥", 
    rarity: "rare" as const
  },
  { 
    id: "streak_30", 
    name: "Mês de Foco", 
    description: "Estude por 30 dias seguidos",
    xp: 1000, 
    icon: "💎", 
    rarity: "legendary" as const
  },
  { 
    id: "simulado_100", 
    name: "Nota Máxima", 
    description: "Acerte 100% em um simulado",
    xp: 500, 
    icon: "🏆", 
    rarity: "epic" as const
  },
  { 
    id: "all_lessons", 
    name: "Maratonista", 
    description: "Complete um módulo inteiro",
    xp: 750, 
    icon: "📚", 
    rarity: "rare" as const
  },
  { 
    id: "night_owl", 
    name: "Coruja Noturna", 
    description: "Estude após as 22h",
    xp: 100, 
    icon: "🦉", 
    rarity: "common" as const
  },
  { 
    id: "early_bird", 
    name: "Madrugador", 
    description: "Estude antes das 6h",
    xp: 100, 
    icon: "🌅", 
    rarity: "common" as const
  },
  { 
    id: "flashcard_master", 
    name: "Memória de Elefante", 
    description: "Revise 500 flashcards",
    xp: 300, 
    icon: "🧠", 
    rarity: "rare" as const
  },
];

const rarityStyles = {
  common: {
    bg: "bg-secondary/50",
    border: "border-border/50",
    glow: "",
    label: "Comum",
    labelColor: "text-muted-foreground",
  },
  rare: {
    bg: "bg-stats-blue/10",
    border: "border-stats-blue/30",
    glow: "shadow-stats-blue/20",
    label: "Raro",
    labelColor: "text-stats-blue",
  },
  epic: {
    bg: "bg-stats-purple/10",
    border: "border-stats-purple/30",
    glow: "shadow-stats-purple/20",
    label: "Épico",
    labelColor: "text-stats-purple",
  },
  legendary: {
    bg: "bg-stats-gold/10",
    border: "border-stats-gold/30",
    glow: "shadow-lg shadow-stats-gold/20",
    label: "Lendário",
    labelColor: "text-stats-gold",
  },
};

interface AchievementBadgeProps {
  achievement: typeof ACHIEVEMENTS[0];
  unlocked: boolean;
  unlockedAt?: Date;
  size?: "sm" | "md" | "lg";
  showTooltip?: boolean;
}

export function AchievementBadge({
  achievement,
  unlocked,
  unlockedAt,
  size = "md",
  showTooltip = true,
}: AchievementBadgeProps) {
  const rarity = rarityStyles[achievement.rarity];
  
  const sizeClasses = {
    sm: "w-12 h-12 text-xl",
    md: "w-16 h-16 text-2xl",
    lg: "w-20 h-20 text-3xl",
  };

  const badge = (
    <motion.div
      whileHover={unlocked ? { scale: 1.1 } : undefined}
      className={cn(
        "relative rounded-2xl border flex items-center justify-center transition-all",
        sizeClasses[size],
        unlocked 
          ? cn(rarity.bg, rarity.border, rarity.glow)
          : "bg-muted/30 border-border/30"
      )}
    >
      {unlocked ? (
        <span className="select-none">{achievement.icon}</span>
      ) : (
        <Lock className={cn(
          "text-muted-foreground",
          size === "sm" ? "h-4 w-4" : size === "md" ? "h-5 w-5" : "h-6 w-6"
        )} />
      )}
      
      {/* XP Badge */}
      {unlocked && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -bottom-1 -right-1 px-1.5 py-0.5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold"
        >
          +{achievement.xp}
        </motion.div>
      )}
    </motion.div>
  );

  if (!showTooltip) return badge;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        {badge}
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-[200px]">
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="font-semibold">{achievement.name}</span>
            <span className={cn("text-xs", rarity.labelColor)}>
              {rarity.label}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            {achievement.description}
          </p>
          {unlocked && unlockedAt && (
            <p className="text-xs text-stats-green">
              Desbloqueado em {unlockedAt.toLocaleDateString("pt-BR")}
            </p>
          )}
          {!unlocked && (
            <p className="text-xs text-muted-foreground">
              🔒 Bloqueado • +{achievement.xp} XP
            </p>
          )}
        </div>
      </TooltipContent>
    </Tooltip>
  );
}

// Grid de conquistas
interface AchievementGridProps {
  unlockedIds: string[];
  showLocked?: boolean;
}

export function AchievementGrid({ 
  unlockedIds, 
  showLocked = true 
}: AchievementGridProps) {
  const achievements = showLocked 
    ? ACHIEVEMENTS 
    : ACHIEVEMENTS.filter(a => unlockedIds.includes(a.id));

  return (
    <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3">
      {achievements.map((achievement) => (
        <AchievementBadge
          key={achievement.id}
          achievement={achievement}
          unlocked={unlockedIds.includes(achievement.id)}
          size="md"
        />
      ))}
    </div>
  );
}
