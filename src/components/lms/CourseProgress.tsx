// ============================================
// MOISÉS MEDEIROS v7.0 - COURSE PROGRESS
// Spider-Man Theme - Progresso do Curso
// ============================================

import { motion } from "framer-motion";
import { CheckCircle2, Circle, Lock, Play, Clock, Award, Zap } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface Lesson {
  id: string;
  title: string;
  duration: string;
  isCompleted: boolean;
  isLocked: boolean;
  isCurrent?: boolean;
}

interface Module {
  id: string;
  title: string;
  lessons: Lesson[];
}

interface CourseProgressProps {
  courseName: string;
  modules: Module[];
  overallProgress: number;
  onLessonClick?: (lessonId: string) => void;
  onCertificateClick?: () => void;
}

export function CourseProgress({
  courseName,
  modules,
  overallProgress,
  onLessonClick,
  onCertificateClick,
}: CourseProgressProps) {
  const totalLessons = modules.reduce((acc, m) => acc + m.lessons.length, 0);
  const completedLessons = modules.reduce(
    (acc, m) => acc + m.lessons.filter((l) => l.isCompleted).length,
    0
  );

  return (
    <div className="space-y-6">
      {/* Header com progresso geral */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-2xl p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-foreground">{courseName}</h2>
            <p className="text-sm text-muted-foreground">
              {completedLessons} de {totalLessons} aulas concluídas
            </p>
          </div>
          {overallProgress === 100 && (
            <Button
              onClick={onCertificateClick}
              className="gap-2 bg-gradient-to-r from-primary to-purple-600"
            >
              <Award className="h-4 w-4" />
              Certificado
            </Button>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Progresso</span>
            <span className="font-medium text-primary">{overallProgress}%</span>
          </div>
          <Progress value={overallProgress} className="h-3" />
        </div>

        {overallProgress === 100 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="mt-4 p-4 rounded-xl bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-green-500/20">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="font-semibold text-green-600">Parabéns! 🎉</p>
                <p className="text-sm text-muted-foreground">
                  Você concluiu este curso. Seu certificado está disponível.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* Módulos e Aulas */}
      <div className="space-y-4">
        {modules.map((module, moduleIdx) => {
          const moduleProgress =
            (module.lessons.filter((l) => l.isCompleted).length /
              module.lessons.length) *
            100;

          return (
            <motion.div
              key={module.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: moduleIdx * 0.1 }}
              className="glass-card rounded-2xl overflow-hidden"
            >
              {/* Módulo Header */}
              <div className="p-4 border-b border-border bg-secondary/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        moduleProgress === 100
                          ? "bg-green-500 text-white"
                          : "bg-primary/10 text-primary"
                      }`}
                    >
                      {moduleProgress === 100 ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : (
                        moduleIdx + 1
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">
                        {module.title}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        {module.lessons.length} aulas
                      </p>
                    </div>
                  </div>
                  <Badge variant={moduleProgress === 100 ? "default" : "secondary"}>
                    {Math.round(moduleProgress)}%
                  </Badge>
                </div>
              </div>

              {/* Aulas */}
              <div className="divide-y divide-border">
                {module.lessons.map((lesson, lessonIdx) => (
                  <motion.button
                    key={lesson.id}
                    whileHover={{ x: lesson.isLocked ? 0 : 4 }}
                    onClick={() => !lesson.isLocked && onLessonClick?.(lesson.id)}
                    disabled={lesson.isLocked}
                    className={`w-full p-4 flex items-center gap-4 text-left transition-colors ${
                      lesson.isLocked
                        ? "opacity-50 cursor-not-allowed"
                        : lesson.isCurrent
                        ? "bg-primary/5"
                        : "hover:bg-secondary/30"
                    }`}
                  >
                    {/* Status Icon */}
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        lesson.isCompleted
                          ? "bg-green-500 text-white"
                          : lesson.isLocked
                          ? "bg-muted text-muted-foreground"
                          : lesson.isCurrent
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary text-muted-foreground"
                      }`}
                    >
                      {lesson.isCompleted ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : lesson.isLocked ? (
                        <Lock className="h-4 w-4" />
                      ) : lesson.isCurrent ? (
                        <Play className="h-4 w-4" />
                      ) : (
                        <Circle className="h-4 w-4" />
                      )}
                    </div>

                    {/* Lesson Info */}
                    <div className="flex-1">
                      <p
                        className={`font-medium ${
                          lesson.isCompleted
                            ? "text-muted-foreground line-through"
                            : lesson.isCurrent
                            ? "text-primary"
                            : "text-foreground"
                        }`}
                      >
                        {lesson.title}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">
                          {lesson.duration}
                        </span>
                      </div>
                    </div>

                    {/* Current Badge */}
                    {lesson.isCurrent && (
                      <Badge variant="default" className="animate-pulse">
                        Em andamento
                      </Badge>
                    )}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
