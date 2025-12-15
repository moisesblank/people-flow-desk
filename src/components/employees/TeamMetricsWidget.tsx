// ============================================
// MOISÉS MEDEIROS v8.0 - Widget de Métricas de Equipe
// Visão geral da performance do time
// ============================================

import { motion } from "framer-motion";
import { 
  Users, 
  UserCheck, 
  UserX, 
  Briefcase,
  TrendingUp,
  Award,
  Clock,
  Target
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

interface TeamMetricsWidgetProps {
  totalEmployees: number;
  activeEmployees: number;
  onVacation: number;
  onLeave: number;
  avgPerformance?: number;
  tasksCompleted?: number;
  tasksTotal?: number;
  topPerformers?: { name: string; score: number }[];
}

export function TeamMetricsWidget({
  totalEmployees,
  activeEmployees,
  onVacation,
  onLeave,
  avgPerformance = 85,
  tasksCompleted = 42,
  tasksTotal = 50,
  topPerformers = []
}: TeamMetricsWidgetProps) {
  const activeRate = totalEmployees > 0 ? Math.round((activeEmployees / totalEmployees) * 100) : 0;
  const taskCompletionRate = tasksTotal > 0 ? Math.round((tasksCompleted / tasksTotal) * 100) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card rounded-2xl p-6"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20">
          <Users className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground">Métricas da Equipe</h3>
          <p className="text-xs text-muted-foreground">{totalEmployees} colaboradores</p>
        </div>
      </div>

      {/* Status Grid */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="p-3 rounded-xl bg-[hsl(var(--stats-green))]/5 border border-[hsl(var(--stats-green))]/20">
          <div className="flex items-center gap-2 mb-1">
            <UserCheck className="h-4 w-4 text-[hsl(var(--stats-green))]" />
            <span className="text-xs text-muted-foreground">Ativos</span>
          </div>
          <p className="text-xl font-bold text-foreground">{activeEmployees}</p>
          <p className="text-[10px] text-[hsl(var(--stats-green))]">{activeRate}% disponíveis</p>
        </div>

        <div className="p-3 rounded-xl bg-[hsl(var(--stats-blue))]/5 border border-[hsl(var(--stats-blue))]/20">
          <div className="flex items-center gap-2 mb-1">
            <Briefcase className="h-4 w-4 text-[hsl(var(--stats-blue))]" />
            <span className="text-xs text-muted-foreground">Férias</span>
          </div>
          <p className="text-xl font-bold text-foreground">{onVacation}</p>
          <p className="text-[10px] text-[hsl(var(--stats-blue))]">em descanso</p>
        </div>

        <div className="p-3 rounded-xl bg-[hsl(var(--stats-gold))]/5 border border-[hsl(var(--stats-gold))]/20">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="h-4 w-4 text-[hsl(var(--stats-gold))]" />
            <span className="text-xs text-muted-foreground">Afastados</span>
          </div>
          <p className="text-xl font-bold text-foreground">{onLeave}</p>
          <p className="text-[10px] text-[hsl(var(--stats-gold))]">temporário</p>
        </div>

        <div className="p-3 rounded-xl bg-[hsl(var(--stats-purple))]/5 border border-[hsl(var(--stats-purple))]/20">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="h-4 w-4 text-[hsl(var(--stats-purple))]" />
            <span className="text-xs text-muted-foreground">Performance</span>
          </div>
          <p className="text-xl font-bold text-foreground">{avgPerformance}%</p>
          <p className="text-[10px] text-[hsl(var(--stats-purple))]">média geral</p>
        </div>
      </div>

      {/* Task Progress */}
      <div className="mb-6 p-4 rounded-xl bg-secondary/30">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-foreground">Tarefas do Mês</span>
          </div>
          <span className="text-sm font-bold text-foreground">{taskCompletionRate}%</span>
        </div>
        <Progress value={taskCompletionRate} className="h-2" />
        <p className="text-xs text-muted-foreground mt-2">
          {tasksCompleted} de {tasksTotal} tarefas concluídas
        </p>
      </div>

      {/* Top Performers */}
      {topPerformers.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Award className="h-4 w-4 text-[hsl(var(--stats-gold))]" />
            <span className="text-sm font-medium text-foreground">Destaques</span>
          </div>
          <div className="space-y-2">
            {topPerformers.slice(0, 3).map((person, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center justify-between p-2 rounded-lg bg-secondary/20"
              >
                <div className="flex items-center gap-2">
                  <span className={`
                    w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
                    ${index === 0 ? "bg-[hsl(var(--stats-gold))]/20 text-[hsl(var(--stats-gold))]" :
                      index === 1 ? "bg-[hsl(var(--stats-blue))]/20 text-[hsl(var(--stats-blue))]" :
                      "bg-primary/20 text-primary"
                    }
                  `}>
                    {index + 1}
                  </span>
                  <span className="text-sm text-foreground">{person.name}</span>
                </div>
                <Badge variant="outline" className="text-[10px]">
                  {person.score}%
                </Badge>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}
