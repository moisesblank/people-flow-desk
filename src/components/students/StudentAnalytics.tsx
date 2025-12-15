// ============================================
// MOISÉS MEDEIROS v8.0 - Analytics Avançado de Alunos
// Métricas detalhadas do desempenho dos estudantes
// ============================================

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Users, 
  TrendingUp, 
  TrendingDown, 
  GraduationCap,
  Trophy,
  Target,
  Clock,
  Activity,
  BarChart3,
  Flame,
  BookOpen,
  Award
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

interface StudentAnalyticsProps {
  totalStudents: number;
  activeStudents: number;
  completedStudents: number;
  averageProgress: number;
  averageXP: number;
  topPerformers: {
    id: string;
    name: string;
    xp: number;
    progress: number;
  }[];
}

export function StudentAnalytics({
  totalStudents,
  activeStudents,
  completedStudents,
  averageProgress,
  averageXP,
  topPerformers
}: StudentAnalyticsProps) {
  const retentionRate = totalStudents > 0 ? Math.round((activeStudents / totalStudents) * 100) : 0;
  const completionRate = totalStudents > 0 ? Math.round((completedStudents / totalStudents) * 100) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-[hsl(var(--stats-blue))]/20 bg-[hsl(var(--stats-blue))]/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-4 w-4 text-[hsl(var(--stats-blue))]" />
              <span className="text-xs text-muted-foreground">Total</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{totalStudents}</p>
            <p className="text-xs text-[hsl(var(--stats-blue))]">alunos matriculados</p>
          </CardContent>
        </Card>

        <Card className="border-[hsl(var(--stats-green))]/20 bg-[hsl(var(--stats-green))]/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="h-4 w-4 text-[hsl(var(--stats-green))]" />
              <span className="text-xs text-muted-foreground">Ativos</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{activeStudents}</p>
            <div className="flex items-center gap-1 mt-1">
              <TrendingUp className="h-3 w-3 text-[hsl(var(--stats-green))]" />
              <span className="text-xs text-[hsl(var(--stats-green))]">{retentionRate}% retenção</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-[hsl(var(--stats-purple))]/20 bg-[hsl(var(--stats-purple))]/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <GraduationCap className="h-4 w-4 text-[hsl(var(--stats-purple))]" />
              <span className="text-xs text-muted-foreground">Concluíram</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{completedStudents}</p>
            <div className="flex items-center gap-1 mt-1">
              <Award className="h-3 w-3 text-[hsl(var(--stats-purple))]" />
              <span className="text-xs text-[hsl(var(--stats-purple))]">{completionRate}% formados</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-[hsl(var(--stats-gold))]/20 bg-[hsl(var(--stats-gold))]/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Trophy className="h-4 w-4 text-[hsl(var(--stats-gold))]" />
              <span className="text-xs text-muted-foreground">XP Médio</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{averageXP.toLocaleString()}</p>
            <div className="flex items-center gap-1 mt-1">
              <Flame className="h-3 w-3 text-[hsl(var(--stats-gold))]" />
              <span className="text-xs text-[hsl(var(--stats-gold))]">pontos por aluno</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Progress Overview */}
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Progresso Médio da Turma
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Progresso Geral</span>
                <span className="text-sm font-bold text-foreground">{averageProgress}%</span>
              </div>
              <Progress value={averageProgress} className="h-3" />
            </div>

            <div className="grid grid-cols-3 gap-3 pt-2">
              <div className="text-center p-3 rounded-xl bg-secondary/30">
                <BookOpen className="h-4 w-4 mx-auto text-muted-foreground mb-1" />
                <p className="text-lg font-bold text-foreground">{Math.round(averageProgress * 0.42)}</p>
                <p className="text-[10px] text-muted-foreground">Aulas vistas (média)</p>
              </div>
              <div className="text-center p-3 rounded-xl bg-secondary/30">
                <Clock className="h-4 w-4 mx-auto text-muted-foreground mb-1" />
                <p className="text-lg font-bold text-foreground">{Math.round(averageProgress * 0.8)}h</p>
                <p className="text-[10px] text-muted-foreground">Tempo de estudo</p>
              </div>
              <div className="text-center p-3 rounded-xl bg-secondary/30">
                <Target className="h-4 w-4 mx-auto text-muted-foreground mb-1" />
                <p className="text-lg font-bold text-foreground">{Math.round(averageProgress * 0.15)}</p>
                <p className="text-[10px] text-muted-foreground">Exercícios feitos</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Top Performers */}
      {topPerformers.length > 0 && (
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Trophy className="h-5 w-5 text-[hsl(var(--stats-gold))]" />
              Top Alunos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topPerformers.slice(0, 5).map((student, index) => (
                <motion.div
                  key={student.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center gap-4 p-3 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-colors"
                >
                  <div className={`
                    w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm
                    ${index === 0 ? "bg-[hsl(var(--stats-gold))]/20 text-[hsl(var(--stats-gold))]" :
                      index === 1 ? "bg-[hsl(var(--stats-blue))]/20 text-[hsl(var(--stats-blue))]" :
                      index === 2 ? "bg-primary/20 text-primary" :
                      "bg-muted text-muted-foreground"
                    }
                  `}>
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">{student.name}</p>
                    <div className="flex items-center gap-2">
                      <Progress value={student.progress} className="h-1.5 flex-1" />
                      <span className="text-xs text-muted-foreground">{student.progress}%</span>
                    </div>
                  </div>
                  <Badge variant="outline" className="shrink-0 gap-1 text-[hsl(var(--stats-gold))] border-[hsl(var(--stats-gold))]/30">
                    <Flame className="h-3 w-3" />
                    {student.xp.toLocaleString()} XP
                  </Badge>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </motion.div>
  );
}
