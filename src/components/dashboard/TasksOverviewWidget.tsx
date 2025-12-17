// ============================================
// UPGRADE v10 - WIDGET DE TAREFAS v2.0
// Overview de tarefas - TODOS CLICÁVEIS
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
  ChevronRight,
  ListTodo,
  Loader2,
  Target,
} from "lucide-react";
import { useTasksStats, TASK_STATUSES, TASK_PRIORITIES } from "@/hooks/useTasks";
import { Link, useNavigate } from "react-router-dom";

export function TasksOverviewWidget() {
  const stats = useTasksStats();
  const navigate = useNavigate();

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
      hoverBg: "hover:bg-destructive/20",
      borderHover: "hover:border-destructive/40",
      href: "/tarefas?priority=urgent"
    },
    {
      label: "Alta",
      value: stats.byPriority.high,
      color: "text-stats-gold",
      bg: "bg-stats-gold/10",
      hoverBg: "hover:bg-stats-gold/20",
      borderHover: "hover:border-stats-gold/40",
      href: "/tarefas?priority=high"
    },
    {
      label: "Média",
      value: stats.byPriority.medium,
      color: "text-stats-blue",
      bg: "bg-stats-blue/10",
      hoverBg: "hover:bg-stats-blue/20",
      borderHover: "hover:border-stats-blue/40",
      href: "/tarefas?priority=medium"
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
            <CardTitle 
              className="text-lg flex items-center gap-2 cursor-pointer hover:text-primary transition-colors"
              onClick={() => navigate("/tarefas")}
            >
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
          {/* Progresso geral - CLICÁVEL */}
          <div 
            className="space-y-2 p-2 -m-2 rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
            onClick={() => navigate("/tarefas")}
          >
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Conclusão</span>
              <span className="font-semibold">{completionRate}%</span>
            </div>
            <Progress value={completionRate} className="h-2" />
          </div>

          {/* Stats rápidos - TODOS CLICÁVEIS */}
          <div className="grid grid-cols-3 gap-2">
            {/* Total */}
            <div 
              className="text-center p-2 rounded-lg bg-muted/50 cursor-pointer hover:bg-muted transition-colors group"
              onClick={() => navigate("/tarefas")}
            >
              <div className="text-2xl font-bold group-hover:text-primary transition-colors">{stats.total}</div>
              <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                Total
                <ChevronRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
            
            {/* Concluídas */}
            <div 
              className="text-center p-2 rounded-lg bg-stats-green/10 cursor-pointer hover:bg-stats-green/20 transition-colors group"
              onClick={() => navigate("/tarefas?status=done")}
            >
              <div className="text-2xl font-bold text-stats-green">
                {stats.byStatus.done}
              </div>
              <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                Concluídas
                <ChevronRight className="h-3 w-3 text-stats-green opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
            
            {/* Em progresso */}
            <div 
              className="text-center p-2 rounded-lg bg-stats-gold/10 cursor-pointer hover:bg-stats-gold/20 transition-colors group"
              onClick={() => navigate("/tarefas?status=in_progress")}
            >
              <div className="text-2xl font-bold text-stats-gold">
                {stats.byStatus.in_progress}
              </div>
              <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                Em progresso
                <ChevronRight className="h-3 w-3 text-stats-gold opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
          </div>

          {/* Alertas - CLICÁVEIS */}
          {(stats.overdue > 0 || stats.byPriority.urgent > 0) && (
            <div 
              className="flex items-center gap-2 p-2 rounded-lg bg-destructive/10 border border-destructive/20 cursor-pointer hover:bg-destructive/20 transition-colors"
              onClick={() => navigate("/tarefas?status=overdue")}
            >
              <AlertTriangle className="h-4 w-4 text-destructive" />
              <span className="text-sm text-destructive flex-1">
                {stats.overdue > 0 && `${stats.overdue} atrasada(s)`}
                {stats.overdue > 0 && stats.byPriority.urgent > 0 && " • "}
                {stats.byPriority.urgent > 0 &&
                  `${stats.byPriority.urgent} urgente(s)`}
              </span>
              <ChevronRight className="h-4 w-4 text-destructive" />
            </div>
          )}

          {/* Prioridades - CLICÁVEIS */}
          <div className="flex gap-2 flex-wrap">
            {priorityStats.map((p) => (
              <Badge
                key={p.label}
                variant="outline"
                className={`${p.bg} ${p.color} border-0 text-xs cursor-pointer ${p.hoverBg} transition-colors`}
                onClick={() => navigate(p.href)}
              >
                {p.value} {p.label}
              </Badge>
            ))}
          </div>

          {/* Produtividade semanal - CLICÁVEL */}
          {stats.completedThisWeek > 0 && (
            <div 
              className="flex items-center gap-2 text-sm text-stats-green cursor-pointer hover:bg-stats-green/10 p-2 -m-2 rounded-lg transition-colors"
              onClick={() => navigate("/tarefas?status=done")}
            >
              <TrendingUp className="h-4 w-4" />
              <span>{stats.completedThisWeek} concluídas esta semana</span>
              <ChevronRight className="h-4 w-4 ml-auto" />
            </div>
          )}

          {/* Ação rápida para criar tarefa */}
          <div className="pt-2 border-t border-border/50">
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full gap-2 text-xs"
              onClick={() => navigate("/tarefas")}
            >
              <Plus className="h-3 w-3" />
              Criar Nova Tarefa
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
