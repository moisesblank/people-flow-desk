// ============================================
// 📚 PROFILE STUDY PROGRESS — LAZY v2300
// Métricas e progressão de nível
// ============================================

import { memo } from 'react';
import { motion } from 'framer-motion';
import { useConstitutionPerformance } from '@/hooks/useConstitutionPerformance';
import { Progress } from '@/components/ui/progress';
import { 
  BookOpen, TrendingUp, CheckCircle2, Target, Sparkles, Star 
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProfileStudyProgressRailProps {
  studyStats: {
    lessonsCompleted: number;
    coursesCompleted: number;
    flashcardsCreated: number;
  };
  currentLevel: number;
  levelInfo: {
    title: string;
    progressPercentage: number;
    isMaxLevel: boolean;
  };
}

export const ProfileStudyProgressRail = memo(function ProfileStudyProgressRail({
  studyStats,
  currentLevel,
  levelInfo,
}: ProfileStudyProgressRailProps) {
  const { shouldAnimate, isLowEnd, motionProps } = useConstitutionPerformance();

  const metrics = [
    { 
      label: 'Aulas Concluídas', 
      value: studyStats.lessonsCompleted, 
      icon: CheckCircle2, 
      color: 'text-green-400' 
    },
    { 
      label: 'Cursos Completados', 
      value: studyStats.coursesCompleted, 
      icon: Target, 
      color: 'text-blue-400' 
    },
    { 
      label: 'Flashcards Criados', 
      value: studyStats.flashcardsCreated, 
      icon: Sparkles, 
      color: 'text-purple-400' 
    },
  ];

  return (
    <div className="profile-rail-2300">
      <div className="profile-rail-header-2300">
        <div className="profile-rail-title-2300">
          <div className="profile-rail-icon-2300">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          Progresso de Estudos
        </div>
      </div>

      <div className="profile-two-col-grid-2300">
        {/* Métricas Card */}
        <motion.div 
          className="profile-study-card-2300"
          {...(shouldAnimate ? motionProps : {})}
        >
          <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            Métricas
          </h3>
          <div className="space-y-3">
            {metrics.map((item) => (
              <div 
                key={item.label} 
                className="flex items-center justify-between p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <item.icon className={cn("w-5 h-5", item.color)} />
                  <span className="text-sm text-foreground">{item.label}</span>
                </div>
                <span className="text-lg font-bold text-foreground">{item.value}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Level Progress Card */}
        <motion.div 
          className="profile-study-card-2300"
          {...(shouldAnimate ? motionProps : {})}
        >
          <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <Star className="w-5 h-5 text-amber-500" />
            Progressão de Nível
          </h3>

          <div className="text-center p-6 rounded-xl bg-gradient-to-br from-primary/10 via-transparent to-secondary/10 mb-4">
            <div 
              className={cn(
                "w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center mb-3 shadow-lg",
                !isLowEnd && "profile-level-orb-glow"
              )}
            >
              <span className="text-4xl font-bold text-primary-foreground">{currentLevel}</span>
            </div>
            <h4 className="text-xl font-bold text-foreground">{levelInfo.title}</h4>
            <p className="text-sm text-muted-foreground mt-1">
              {levelInfo.isMaxLevel ? 'Nível Máximo Alcançado! 🏆' : `Próximo: Nível ${currentLevel + 1}`}
            </p>
          </div>

          {!levelInfo.isMaxLevel && (
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted-foreground">Progresso</span>
                <span className="font-semibold text-foreground">{Math.round(levelInfo.progressPercentage)}%</span>
              </div>
              <Progress value={levelInfo.progressPercentage} className="h-3" />
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
});
