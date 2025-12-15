// ============================================
// MOISES MEDEIROS v5.0 - XP PROGRESS
// Pilar 8: Gamificação Completa
// ============================================

import { motion } from "framer-motion";
import { Star, Trophy, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

// Tabela de níveis
const LEVEL_THRESHOLDS = [
  { level: 1, xp: 0, title: "Novato" },
  { level: 2, xp: 100, title: "Iniciante" },
  { level: 3, xp: 250, title: "Estudante" },
  { level: 4, xp: 500, title: "Dedicado" },
  { level: 5, xp: 1000, title: "Persistente" },
  { level: 6, xp: 1750, title: "Focado" },
  { level: 7, xp: 2750, title: "Avançado" },
  { level: 8, xp: 4000, title: "Expert" },
  { level: 9, xp: 5500, title: "Mestre" },
  { level: 10, xp: 7500, title: "Lenda" },
];

interface XPProgressProps {
  currentXP: number;
  variant?: "compact" | "full";
  showStreak?: boolean;
  streakDays?: number;
}

export function getLevel(xp: number) {
  let currentLevel = LEVEL_THRESHOLDS[0];
  let nextLevel = LEVEL_THRESHOLDS[1];

  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (xp >= LEVEL_THRESHOLDS[i].xp) {
      currentLevel = LEVEL_THRESHOLDS[i];
      nextLevel = LEVEL_THRESHOLDS[i + 1] || LEVEL_THRESHOLDS[i];
      break;
    }
  }

  const xpInLevel = xp - currentLevel.xp;
  const xpForNextLevel = nextLevel.xp - currentLevel.xp;
  const progress = xpForNextLevel > 0 ? (xpInLevel / xpForNextLevel) * 100 : 100;

  return {
    level: currentLevel.level,
    title: currentLevel.title,
    xpInLevel,
    xpForNextLevel,
    progress: Math.min(progress, 100),
    isMaxLevel: currentLevel.level === 10,
  };
}

export function XPProgress({ 
  currentXP, 
  variant = "full",
  showStreak = false,
  streakDays = 0,
}: XPProgressProps) {
  const levelInfo = getLevel(currentXP);

  if (variant === "compact") {
    return (
      <div className="flex items-center gap-3">
        {/* Level Badge */}
        <div className="relative">
          <div className="w-10 h-10 rounded-full bg-primary/10 border-2 border-primary flex items-center justify-center">
            <span className="text-sm font-bold text-primary">{levelInfo.level}</span>
          </div>
          <motion.div
            className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-stats-gold flex items-center justify-center"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
          >
            <Star className="h-3 w-3 text-background" />
          </motion.div>
        </div>

        {/* XP Bar */}
        <div className="flex-1">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="font-medium text-foreground">{levelInfo.title}</span>
            <span className="text-muted-foreground">
              {currentXP.toLocaleString()} XP
            </span>
          </div>
          <div className="h-2 rounded-full bg-secondary overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-primary"
              initial={{ width: 0 }}
              animate={{ width: `${levelInfo.progress}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="premium-card p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <Trophy className="h-5 w-5 text-stats-gold" />
          Seu Progresso
        </h3>
        
        {showStreak && streakDays > 0 && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-stats-gold/10 border border-stats-gold/20">
            <Zap className="h-4 w-4 text-stats-gold" />
            <span className="text-sm font-medium text-stats-gold">
              {streakDays} dias
            </span>
          </div>
        )}
      </div>

      {/* Level Display */}
      <div className="flex items-center gap-6 mb-6">
        {/* Level Badge */}
        <motion.div
          className="relative"
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
        >
          <div className={cn(
            "w-20 h-20 rounded-2xl flex items-center justify-center",
            "bg-gradient-to-br from-primary to-primary/50",
            "shadow-lg shadow-primary/25"
          )}>
            <span className="text-3xl font-bold text-primary-foreground">
              {levelInfo.level}
            </span>
          </div>
          <motion.div
            className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-stats-gold flex items-center justify-center shadow-lg"
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ repeat: Infinity, duration: 2 }}
          >
            <Star className="h-4 w-4 text-background" />
          </motion.div>
        </motion.div>

        {/* Level Info */}
        <div className="flex-1">
          <h4 className="text-xl font-bold text-foreground mb-1">
            {levelInfo.title}
          </h4>
          <p className="text-muted-foreground text-sm mb-3">
            Nível {levelInfo.level} de 10
          </p>
          
          {/* XP Progress */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Progresso</span>
              <span className="font-medium text-foreground">
                {levelInfo.xpInLevel.toLocaleString()} / {levelInfo.xpForNextLevel.toLocaleString()} XP
              </span>
            </div>
            <div className="h-3 rounded-full bg-secondary overflow-hidden">
              <motion.div
                className="h-full rounded-full brand-gradient"
                initial={{ width: 0 }}
                animate={{ width: `${levelInfo.progress}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-4 pt-4 border-t border-border/30">
        <div className="text-center">
          <p className="text-2xl font-bold text-primary">
            {currentXP.toLocaleString()}
          </p>
          <p className="text-xs text-muted-foreground">XP Total</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-stats-blue">
            {levelInfo.level}
          </p>
          <p className="text-xs text-muted-foreground">Nível Atual</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-stats-gold">
            {showStreak ? streakDays : "--"}
          </p>
          <p className="text-xs text-muted-foreground">Dias Seguidos</p>
        </div>
      </div>
    </div>
  );
}
