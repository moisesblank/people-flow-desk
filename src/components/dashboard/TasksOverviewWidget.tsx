// ============================================
// UPGRADE v10 - FASE 7: WIDGET DE TAREFAS
// Overview de tarefas no Dashboard
// ============================================

import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  CheckSquare,
  Clock,
  AlertTriangle,
  ArrowRight,
  Plus,
  TrendingUp,
} from "lucide-react";
import { useTasksStats, TASK_STATUSES, TASK_PRIORITIES } from "@/hooks/useTasks";
import { Link } from "react-router-dom";

export function TasksOverviewWidget() {
  const stats = useTasksStats();

  const completionRate =
    stats.total > 0
      ? Math.round((stats.byStatus.done / stats.total) * 100)
      : 0;

  const priorityStats = [
    {
      label: "Urgentes",
      value: stats.byPriority.urgent,
      color: "text-destructive",
      bg: "bg-destructive/10",
    },
    {
      label: "Alta",
      value: stats.byPriority.high,
      color: "text-stats-gold",
      bg: "bg-stats-gold/10",
    },
    {
      label: "Média",
      value: stats.byPriority.medium,
      color: "text-stats-blue",
      bg: "bg-stats-blue/10",
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="glass-card border-border/50 hover:border-primary/30 transition-all">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <CheckSquare className="h-5 w-5 text-primary" />
              Tarefas
            </CardTitle>
            <Link to="/tarefas">
              <Button variant="ghost" size="sm" className="text-xs">
                Ver todas
                <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Progresso geral */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Conclusão</span>
              <span className="font-semibold">{completionRate}%</span>
            </div>
            <Progress value={completionRate} className="h-2" />
          </div>

          {/* Stats rápidos */}
          <div className="grid grid-cols-3 gap-2">
            <div className="text-center p-2 rounded-lg bg-muted/50">
              <div className="text-2xl font-bold">{stats.total}</div>
              <div className="text-xs text-muted-foreground">Total</div>
            </div>
            <div className="text-center p-2 rounded-lg bg-stats-green/10">
              <div className="text-2xl font-bold text-stats-green">
                {stats.byStatus.done}
              </div>
              <div className="text-xs text-muted-foreground">Concluídas</div>
            </div>
            <div className="text-center p-2 rounded-lg bg-stats-gold/10">
              <div className="text-2xl font-bold text-stats-gold">
                {stats.byStatus.in_progress}
              </div>
              <div className="text-xs text-muted-foreground">Em progresso</div>
            </div>
          </div>

          {/* Alertas */}
          {(stats.overdue > 0 || stats.byPriority.urgent > 0) && (
            <div className="flex items-center gap-2 p-2 rounded-lg bg-destructive/10 border border-destructive/20">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              <span className="text-sm text-destructive">
                {stats.overdue > 0 && `${stats.overdue} atrasada(s)`}
                {stats.overdue > 0 && stats.byPriority.urgent > 0 && " • "}
                {stats.byPriority.urgent > 0 &&
                  `${stats.byPriority.urgent} urgente(s)`}
              </span>
            </div>
          )}

          {/* Prioridades */}
          <div className="flex gap-2">
            {priorityStats.map((p) => (
              <Badge
                key={p.label}
                variant="outline"
                className={`${p.bg} ${p.color} border-0 text-xs`}
              >
                {p.value} {p.label}
              </Badge>
            ))}
          </div>

          {/* Produtividade semanal */}
          {stats.completedThisWeek > 0 && (
            <div className="flex items-center gap-2 text-sm text-stats-green">
              <TrendingUp className="h-4 w-4" />
              <span>{stats.completedThisWeek} concluídas esta semana</span>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
