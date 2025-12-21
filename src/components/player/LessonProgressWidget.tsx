// ============================================
// LESSON PROGRESS WIDGET - Progresso visual
// Mostra o progresso do aluno nas abas educacionais
// ============================================

import { motion } from 'framer-motion';
import { CheckCircle, Circle, Trophy, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface LessonProgressWidgetProps {
  lessonId: string;
  className?: string;
}

interface ProgressItem {
  id: string;
  label: string;
  completed: boolean;
  xp: number;
}

export function LessonProgressWidget({ lessonId, className }: LessonProgressWidgetProps) {
  // Em produção, isso viria do banco de dados
  const progressItems: ProgressItem[] = [
    { id: 'video', label: 'Assistir Vídeo', completed: false, xp: 50 },
    { id: 'summary', label: 'Ler Resumo IA', completed: false, xp: 10 },
    { id: 'quiz', label: 'Completar Quiz', completed: false, xp: 30 },
    { id: 'flashcards', label: 'Revisar Flashcards', completed: false, xp: 20 },
    { id: 'notes', label: 'Fazer Anotação', completed: false, xp: 15 },
  ];

  const completedCount = progressItems.filter(i => i.completed).length;
  const totalXP = progressItems.reduce((acc, i) => acc + (i.completed ? i.xp : 0), 0);
  const maxXP = progressItems.reduce((acc, i) => acc + i.xp, 0);
  const progressPercent = (completedCount / progressItems.length) * 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "p-4 rounded-xl border border-border bg-card",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-semibold flex items-center gap-2">
          <Trophy className="h-4 w-4 text-amber-500" />
          Progresso da Aula
        </h4>
        <Badge variant="outline" className="gap-1">
          <Sparkles className="h-3 w-3 text-primary" />
          {totalXP}/{maxXP} XP
        </Badge>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <Progress value={progressPercent} className="h-2" />
        <p className="text-xs text-muted-foreground mt-1">
          {completedCount} de {progressItems.length} atividades
        </p>
      </div>

      {/* Checklist */}
      <div className="space-y-2">
        {progressItems.map((item, idx) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.05 }}
            className={cn(
              "flex items-center justify-between p-2 rounded-lg transition-colors",
              item.completed 
                ? "bg-green-500/10 text-green-700 dark:text-green-400" 
                : "bg-muted/30 text-muted-foreground"
            )}
          >
            <div className="flex items-center gap-2">
              {item.completed ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <Circle className="h-4 w-4" />
              )}
              <span className="text-sm">{item.label}</span>
            </div>
            <span className="text-xs font-medium">+{item.xp} XP</span>
          </motion.div>
        ))}
      </div>

      {/* Motivational message */}
      {completedCount === progressItems.length ? (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="mt-4 p-3 rounded-lg bg-gradient-to-r from-primary/20 to-amber-500/20 text-center"
        >
          <Trophy className="h-8 w-8 text-amber-500 mx-auto mb-2" />
          <p className="text-sm font-medium">Parabéns! Aula concluída!</p>
        </motion.div>
      ) : (
        <p className="text-xs text-center text-muted-foreground mt-4">
          Complete todas as atividades para maximizar seu aprendizado!
        </p>
      )}
    </motion.div>
  );
}

export default LessonProgressWidget;
