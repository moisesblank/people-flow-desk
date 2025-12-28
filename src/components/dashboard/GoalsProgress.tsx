// ============================================
// GOALS PROGRESS - Metas e Objetivos
// Acompanhamento visual de metas - CLICÁVEL
// ============================================

import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { 
  Target, 
  DollarSign, 
  GraduationCap,
  Trophy,
  ChevronRight,
  Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProgressRing } from "./ProgressRing";
import { formatCurrency } from "@/utils";

interface Goal {
  id: string;
  title: string;
  current: number;
  target: number;
  icon: React.ElementType;
  color: string;
  unit?: string;
  href: string;
}

interface GoalsProgressProps {
  income: number;
  incomeTarget?: number;
  students: number;
  studentsTarget?: number;
  completedTasks: number;
  totalTasks: number;
}

export function GoalsProgress({
  income,
  incomeTarget = income * 1.2,
  students,
  studentsTarget = Math.max(students + 10, 50),
  completedTasks,
  totalTasks,
}: GoalsProgressProps) {
  const navigate = useNavigate();
  
  const goals: Goal[] = [
    {
      id: "income",
      title: "Receita Mensal",
      current: income,
      target: incomeTarget,
      icon: DollarSign,
      color: "hsl(var(--stats-green))",
      unit: "currency",
      href: "/entradas",
    },
    {
      id: "students",
      title: "Alunos Ativos",
      current: students,
      target: studentsTarget,
      icon: GraduationCap,
      color: "hsl(var(--stats-blue))",
      href: "/alunos",
    },
    {
      id: "tasks",
      title: "Tarefas do Mês",
      current: completedTasks,
      target: totalTasks,
      icon: Target,
      color: "hsl(var(--stats-purple))",
      href: "/tarefas",
    },
  ];

  const overallProgress = goals.reduce((acc, goal) => {
    const progress = goal.target > 0 ? (goal.current / goal.target) * 100 : 0;
    return acc + Math.min(progress, 100);
  }, 0) / goals.length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card rounded-2xl p-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <Trophy className="h-5 w-5 text-[hsl(var(--stats-gold))]" />
          Suas Metas
        </h3>
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-[hsl(var(--stats-gold))]" />
          <span className="text-sm font-medium text-muted-foreground">
            {overallProgress.toFixed(0)}% geral
          </span>
        </div>
      </div>

      {/* Main Progress Ring */}
      <div className="flex justify-center mb-6">
        <ProgressRing 
          progress={overallProgress} 
          size={140} 
          strokeWidth={10}
          color="hsl(var(--stats-gold))"
        >
          <div className="text-center">
            <span className="text-3xl font-bold text-foreground">
              {overallProgress.toFixed(0)}%
            </span>
            <p className="text-xs text-muted-foreground">Progresso</p>
          </div>
        </ProgressRing>
      </div>

      {/* Individual Goals - CLICÁVEIS */}
      <div className="space-y-4">
        {goals.map((goal, index) => {
          const Icon = goal.icon;
          const progress = goal.target > 0 ? (goal.current / goal.target) * 100 : 0;
          const displayValue = goal.unit === "currency" 
            ? formatCurrency(goal.current) 
            : goal.current;
          const displayTarget = goal.unit === "currency" 
            ? formatCurrency(goal.target) 
            : goal.target;

          return (
            <motion.button
              key={goal.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => navigate(goal.href)}
              className="w-full p-4 rounded-xl bg-muted/30 border border-border/50 hover:border-primary/30 transition-all text-left group"
            >
              <div className="flex items-center gap-3 mb-2">
                <div 
                  className="p-2 rounded-lg"
                  style={{ backgroundColor: `${goal.color}20` }}
                >
                  <Icon className="h-4 w-4" style={{ color: goal.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium text-foreground">{goal.title}</h4>
                  <p className="text-xs text-muted-foreground">
                    {displayValue} / {displayTarget}
                  </p>
                </div>
                <span 
                  className="text-sm font-bold"
                  style={{ color: progress >= 100 ? "hsl(var(--stats-green))" : goal.color }}
                >
                  {Math.min(progress, 100).toFixed(0)}%
                </span>
                <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              
              {/* Progress bar */}
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(progress, 100)}%` }}
                  transition={{ duration: 0.8, delay: 0.2 + index * 0.1 }}
                  className="h-full rounded-full"
                  style={{ backgroundColor: goal.color }}
                />
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Footer */}
      <div className="mt-6 pt-4 border-t border-border/50">
        <Button 
          variant="ghost" 
          className="w-full justify-center gap-2 text-muted-foreground hover:text-foreground"
          onClick={() => navigate("/dashboard-executivo")}
        >
          Ver dashboard executivo
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </motion.div>
  );
}
