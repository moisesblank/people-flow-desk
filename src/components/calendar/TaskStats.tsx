// ============================================
// ESTATÍSTICAS DE TAREFAS
// Métricas e produtividade do calendário
// ============================================

import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  TrendingUp,
  Calendar,
  Target,
  Flame,
  Trophy
} from "lucide-react";

interface Task {
  id: string;
  title: string;
  is_completed: boolean;
  priority: string;
  task_date: string;
}

interface TaskStatsProps {
  tasks: Task[];
}

export function TaskStats({ tasks }: TaskStatsProps) {
  // Calcular estatísticas
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.is_completed).length;
  const pendingTasks = totalTasks - completedTasks;
  const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
  
  const urgentPending = tasks.filter(t => !t.is_completed && t.priority === 'urgent').length;
  const highPending = tasks.filter(t => !t.is_completed && t.priority === 'high').length;

  // Streak simulado (em produção viria do banco)
  const streak = 7;
  const weeklyGoal = 20;
  const weeklyCompleted = Math.min(completedTasks, weeklyGoal);

  const stats = [
    {
      label: "Concluídas",
      value: completedTasks,
      icon: CheckCircle2,
      color: "text-emerald-600",
      bgColor: "bg-emerald-500/10"
    },
    {
      label: "Pendentes",
      value: pendingTasks,
      icon: Clock,
      color: "text-blue-600",
      bgColor: "bg-blue-500/10"
    },
    {
      label: "Urgentes",
      value: urgentPending,
      icon: AlertCircle,
      color: "text-destructive",
      bgColor: "bg-destructive/10"
    },
    {
      label: "Alta Prioridade",
      value: highPending,
      icon: TrendingUp,
      color: "text-amber-600",
      bgColor: "bg-amber-500/10"
    },
  ];

  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary" />
          Produtividade
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Grid de Stats */}
        <div className="grid grid-cols-2 gap-3">
          {stats.map((stat, idx) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.05 }}
              className="p-3 rounded-xl border border-border/50"
            >
              <div className={`p-2 rounded-lg ${stat.bgColor} w-fit mb-2`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
              <p className="text-2xl font-bold text-foreground">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Taxa de Conclusão */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Taxa de Conclusão</span>
            <Badge 
              variant="secondary" 
              className={`${
                completionRate >= 80 
                  ? 'bg-emerald-500/10 text-emerald-600' 
                  : completionRate >= 50 
                    ? 'bg-amber-500/10 text-amber-600' 
                    : 'bg-destructive/10 text-destructive'
              }`}
            >
              {completionRate.toFixed(0)}%
            </Badge>
          </div>
          <Progress value={completionRate} className="h-2" />
        </div>

        {/* Streak */}
        <div className="p-4 rounded-xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/20">
                <Flame className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Sequência Ativa</p>
                <p className="text-xs text-muted-foreground">Dias consecutivos</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-amber-600">{streak}</p>
              <p className="text-xs text-muted-foreground">dias</p>
            </div>
          </div>
        </div>

        {/* Meta Semanal */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Trophy className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-foreground">Meta Semanal</span>
            </div>
            <span className="text-sm text-muted-foreground">
              {weeklyCompleted}/{weeklyGoal} tarefas
            </span>
          </div>
          <Progress value={(weeklyCompleted / weeklyGoal) * 100} className="h-2" />
          {weeklyCompleted >= weeklyGoal && (
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-xs text-emerald-600 text-center"
            >
              🎉 Parabéns! Meta atingida!
            </motion.p>
          )}
        </div>

        {/* Dica */}
        <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
          <p className="text-xs text-muted-foreground">
            💡 <span className="text-foreground font-medium">Dica:</span> Complete tarefas urgentes primeiro coisa pela manhã para maior produtividade.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
