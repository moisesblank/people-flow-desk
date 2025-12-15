// ============================================
// TODAY AGENDA - Agenda do Dia
// Visão clara do que precisa ser feito hoje
// ============================================

import { motion } from "framer-motion";
import { format, isToday, isBefore, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Calendar,
  Clock,
  CheckCircle2,
  Circle,
  AlertTriangle,
  ChevronRight,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

interface Task {
  id: string;
  title: string;
  task_date: string;
  task_time?: string | null;
  is_completed: boolean;
  priority: string;
  category?: string;
}

interface TodayAgendaProps {
  tasks: Task[];
  onToggleComplete?: (taskId: string) => void;
}

export function TodayAgenda({ tasks, onToggleComplete }: TodayAgendaProps) {
  const navigate = useNavigate();
  const today = new Date();
  
  // Filter and sort tasks
  const todayTasks = tasks
    .filter(task => {
      const taskDate = new Date(task.task_date);
      return isToday(taskDate) || (isBefore(taskDate, startOfDay(today)) && !task.is_completed);
    })
    .sort((a, b) => {
      // Overdue first, then by time
      const aOverdue = isBefore(new Date(a.task_date), startOfDay(today));
      const bOverdue = isBefore(new Date(b.task_date), startOfDay(today));
      if (aOverdue && !bOverdue) return -1;
      if (!aOverdue && bOverdue) return 1;
      
      // Then by priority
      const priorityOrder = { urgent: 0, high: 1, normal: 2, low: 3 };
      const aPriority = priorityOrder[a.priority as keyof typeof priorityOrder] ?? 2;
      const bPriority = priorityOrder[b.priority as keyof typeof priorityOrder] ?? 2;
      if (aPriority !== bPriority) return aPriority - bPriority;
      
      // Then by time
      if (a.task_time && b.task_time) return a.task_time.localeCompare(b.task_time);
      return 0;
    });

  const completedCount = todayTasks.filter(t => t.is_completed).length;
  const pendingCount = todayTasks.length - completedCount;
  const overdueCount = todayTasks.filter(t => 
    !t.is_completed && isBefore(new Date(t.task_date), startOfDay(today))
  ).length;

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent": return "text-destructive border-destructive";
      case "high": return "text-[hsl(var(--stats-gold))] border-[hsl(var(--stats-gold))]";
      case "normal": return "text-[hsl(var(--stats-blue))] border-[hsl(var(--stats-blue))]";
      default: return "text-muted-foreground border-muted";
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card rounded-2xl p-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Agenda de Hoje
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            {format(today, "EEEE, d 'de' MMMM", { locale: ptBR })}
          </p>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => navigate("/tarefas")}
          className="gap-1"
        >
          <Plus className="h-4 w-4" />
          Nova
        </Button>
      </div>

      {/* Stats Pills */}
      <div className="flex flex-wrap gap-2 mb-4">
        <div className="px-3 py-1 rounded-full bg-[hsl(var(--stats-green))]/10 text-[hsl(var(--stats-green))] text-xs font-medium">
          {completedCount} concluídas
        </div>
        <div className="px-3 py-1 rounded-full bg-[hsl(var(--stats-blue))]/10 text-[hsl(var(--stats-blue))] text-xs font-medium">
          {pendingCount} pendentes
        </div>
        {overdueCount > 0 && (
          <div className="px-3 py-1 rounded-full bg-destructive/10 text-destructive text-xs font-medium flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" />
            {overdueCount} atrasadas
          </div>
        )}
      </div>

      {/* Tasks List */}
      <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
        {todayTasks.length === 0 ? (
          <div className="text-center py-8">
            <CheckCircle2 className="h-12 w-12 text-[hsl(var(--stats-green))] mx-auto mb-3 opacity-50" />
            <p className="text-muted-foreground">Nenhuma tarefa para hoje!</p>
            <Button 
              variant="link" 
              onClick={() => navigate("/tarefas")}
              className="mt-2"
            >
              Criar uma tarefa
            </Button>
          </div>
        ) : (
          todayTasks.map((task, index) => {
            const isOverdue = !task.is_completed && isBefore(new Date(task.task_date), startOfDay(today));
            
            return (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className={cn(
                  "group flex items-center gap-3 p-3 rounded-xl border transition-all",
                  task.is_completed 
                    ? "bg-muted/30 border-border/30 opacity-60" 
                    : isOverdue
                    ? "bg-destructive/5 border-destructive/30"
                    : "bg-card/50 border-border/50 hover:border-primary/30"
                )}
              >
                <Checkbox
                  checked={task.is_completed}
                  onCheckedChange={() => onToggleComplete?.(task.id)}
                  className={cn(
                    "shrink-0",
                    getPriorityColor(task.priority)
                  )}
                />
                
                <div className="flex-1 min-w-0">
                  <p className={cn(
                    "text-sm font-medium truncate",
                    task.is_completed ? "line-through text-muted-foreground" : "text-foreground"
                  )}>
                    {task.title}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    {task.task_time && (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {task.task_time}
                      </span>
                    )}
                    {isOverdue && (
                      <span className="text-xs text-destructive font-medium">
                        Atrasada
                      </span>
                    )}
                    {task.category && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                        {task.category}
                      </span>
                    )}
                  </div>
                </div>

                <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </motion.div>
            );
          })
        )}
      </div>

      {/* Footer */}
      {todayTasks.length > 0 && (
        <div className="mt-4 pt-4 border-t border-border/50">
          <Button 
            variant="ghost" 
            className="w-full justify-center gap-2 text-muted-foreground hover:text-foreground"
            onClick={() => navigate("/calendario")}
          >
            Ver calendário completo
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </motion.div>
  );
}
