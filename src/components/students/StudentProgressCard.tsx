// ============================================
// MOISÉS MEDEIROS v8.0 - Card de Progresso do Aluno
// Visualização avançada de progresso individual
// ============================================

import { motion } from "framer-motion";
import { 
  GraduationCap, 
  Trophy, 
  Flame, 
  Star, 
  BookOpen,
  Clock,
  Target,
  TrendingUp,
  Award,
  Zap
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface StudentProgressCardProps {
  student: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
    course: string;
    progress: number;
    xp: number;
    level: number;
    streak: number;
    lessonsCompleted: number;
    totalLessons: number;
    lastActivity: Date;
    badges: string[];
  };
}

export function StudentProgressCard({ student }: StudentProgressCardProps) {
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  };

  const getLevelColor = (level: number) => {
    if (level >= 10) return "stats-gold";
    if (level >= 5) return "stats-purple";
    if (level >= 3) return "stats-blue";
    return "stats-green";
  };

  const getStreakEmoji = (streak: number) => {
    if (streak >= 30) return "🔥";
    if (streak >= 14) return "⚡";
    if (streak >= 7) return "✨";
    if (streak >= 3) return "🌟";
    return "💫";
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      className="glass-card rounded-2xl p-6 hover:border-primary/30 transition-all duration-300"
    >
      {/* Header */}
      <div className="flex items-start gap-4 mb-6">
        <Avatar className="h-14 w-14 border-2 border-primary/20">
          <AvatarImage src={student.avatar} />
          <AvatarFallback className="bg-primary/10 text-primary font-bold">
            {getInitials(student.name)}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-foreground truncate">{student.name}</h3>
            <Badge 
              variant="outline" 
              className={`text-[10px] bg-[hsl(var(--${getLevelColor(student.level)}))]/10 text-[hsl(var(--${getLevelColor(student.level)}))] border-[hsl(var(--${getLevelColor(student.level)}))]`}
            >
              Nível {student.level}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground truncate">{student.email}</p>
          <p className="text-xs text-primary font-medium mt-1">{student.course}</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="text-center p-3 rounded-xl bg-[hsl(var(--stats-gold))]/5">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Zap className="h-4 w-4 text-[hsl(var(--stats-gold))]" />
          </div>
          <p className="text-lg font-bold text-foreground">{student.xp.toLocaleString()}</p>
          <p className="text-[10px] text-muted-foreground">XP Total</p>
        </div>
        <div className="text-center p-3 rounded-xl bg-[hsl(var(--stats-green))]/5">
          <div className="flex items-center justify-center gap-1 mb-1">
            <BookOpen className="h-4 w-4 text-[hsl(var(--stats-green))]" />
          </div>
          <p className="text-lg font-bold text-foreground">{student.lessonsCompleted}</p>
          <p className="text-[10px] text-muted-foreground">Aulas</p>
        </div>
        <div className="text-center p-3 rounded-xl bg-primary/5">
          <div className="flex items-center justify-center gap-1 mb-1">
            <span className="text-sm">{getStreakEmoji(student.streak)}</span>
          </div>
          <p className="text-lg font-bold text-foreground">{student.streak}</p>
          <p className="text-[10px] text-muted-foreground">Dias</p>
        </div>
      </div>

      {/* Progress */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-muted-foreground">Progresso do Curso</span>
          <span className="text-sm font-bold text-foreground">{student.progress}%</span>
        </div>
        <Progress value={student.progress} className="h-2" />
        <p className="text-xs text-muted-foreground mt-1">
          {student.lessonsCompleted} de {student.totalLessons} aulas concluídas
        </p>
      </div>

      {/* Badges */}
      {student.badges.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          {student.badges.slice(0, 4).map((badge, i) => (
            <motion.div
              key={i}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: i * 0.1 }}
              className="h-8 w-8 rounded-full bg-gradient-to-br from-[hsl(var(--stats-gold))]/20 to-[hsl(var(--stats-gold))]/5 border border-[hsl(var(--stats-gold))]/30 flex items-center justify-center"
              title={badge}
            >
              <span className="text-xs">{badge}</span>
            </motion.div>
          ))}
          {student.badges.length > 4 && (
            <span className="text-xs text-muted-foreground">
              +{student.badges.length - 4}
            </span>
          )}
        </div>
      )}

      {/* Last Activity */}
      <div className="mt-4 pt-4 border-t border-border/50 flex items-center justify-between">
        <span className="text-xs text-muted-foreground flex items-center gap-1">
          <Clock className="h-3 w-3" />
          Última atividade
        </span>
        <span className="text-xs text-foreground">
          {student.lastActivity.toLocaleDateString("pt-BR", { 
            day: "2-digit", 
            month: "short",
            hour: "2-digit",
            minute: "2-digit"
          })}
        </span>
      </div>
    </motion.div>
  );
}
