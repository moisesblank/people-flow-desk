// ============================================
// MOISÉS MEDEIROS v8.0 - WEEKLY INSIGHTS
// Insights Semanais com IA e Análise Preditiva
// ============================================

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { formatCurrency } from "@/utils";
import { 
  Brain, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle,
  Lightbulb,
  Target,
  Calendar,
  DollarSign,
  Users,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  BarChart3,
  PieChart
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { format, subDays, startOfWeek, endOfWeek } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Insight {
  id: string;
  type: "success" | "warning" | "info" | "action";
  title: string;
  description: string;
  metric?: string;
  change?: number;
  actionLabel?: string;
  actionUrl?: string;
  priority: number;
}

interface WeeklyStats {
  revenue: number;
  revenueChange: number;
  expenses: number;
  expensesChange: number;
  tasksCompleted: number;
  tasksPending: number;
  newStudents: number;
  studentsChange: number;
}

export function WeeklyInsights() {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [stats, setStats] = useState<WeeklyStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchWeeklyData();
  }, []);

  const fetchWeeklyData = async () => {
    try {
      const today = new Date();
      const weekStart = startOfWeek(today, { locale: ptBR });
      const weekEnd = endOfWeek(today, { locale: ptBR });
      const lastWeekStart = subDays(weekStart, 7);
      const lastWeekEnd = subDays(weekEnd, 7);

      // Fetch income data
      const { data: incomeData } = await supabase
        .from("income")
        .select("valor, created_at")
        .gte("created_at", lastWeekStart.toISOString());

      // Fetch expenses
      const { data: expenseData } = await supabase
        .from("personal_extra_expenses")
        .select("valor, created_at")
        .gte("created_at", lastWeekStart.toISOString());

      // Fetch tasks
      const { data: tasksData } = await supabase
        .from("calendar_tasks")
        .select("is_completed, task_date")
        .gte("task_date", format(weekStart, "yyyy-MM-dd"))
        .lte("task_date", format(weekEnd, "yyyy-MM-dd"));

      // Fetch students
      const { data: studentsData } = await supabase
        .from("students")
        .select("created_at")
        .gte("created_at", lastWeekStart.toISOString());

      // Calculate stats
      const thisWeekRevenue = incomeData?.filter(i => 
        new Date(i.created_at!) >= weekStart
      ).reduce((acc, i) => acc + (i.valor || 0), 0) || 0;

      const lastWeekRevenue = incomeData?.filter(i => {
        const date = new Date(i.created_at!);
        return date >= lastWeekStart && date < weekStart;
      }).reduce((acc, i) => acc + (i.valor || 0), 0) || 0;

      const thisWeekExpenses = expenseData?.filter(i => 
        new Date(i.created_at!) >= weekStart
      ).reduce((acc, i) => acc + (i.valor || 0), 0) || 0;

      const lastWeekExpenses = expenseData?.filter(i => {
        const date = new Date(i.created_at!);
        return date >= lastWeekStart && date < weekStart;
      }).reduce((acc, i) => acc + (i.valor || 0), 0) || 0;

      const tasksCompleted = tasksData?.filter(t => t.is_completed).length || 0;
      const tasksPending = tasksData?.filter(t => !t.is_completed).length || 0;

      const thisWeekStudents = studentsData?.filter(s => 
        new Date(s.created_at!) >= weekStart
      ).length || 0;

      const lastWeekStudents = studentsData?.filter(s => {
        const date = new Date(s.created_at!);
        return date >= lastWeekStart && date < weekStart;
      }).length || 0;

      const calculatedStats: WeeklyStats = {
        revenue: thisWeekRevenue,
        revenueChange: lastWeekRevenue > 0 ? ((thisWeekRevenue - lastWeekRevenue) / lastWeekRevenue) * 100 : 0,
        expenses: thisWeekExpenses,
        expensesChange: lastWeekExpenses > 0 ? ((thisWeekExpenses - lastWeekExpenses) / lastWeekExpenses) * 100 : 0,
        tasksCompleted,
        tasksPending,
        newStudents: thisWeekStudents,
        studentsChange: lastWeekStudents > 0 ? ((thisWeekStudents - lastWeekStudents) / lastWeekStudents) * 100 : 0,
      };

      setStats(calculatedStats);

      // Generate insights based on data
      const generatedInsights: Insight[] = [];

      // Revenue insight
      if (calculatedStats.revenueChange > 10) {
        generatedInsights.push({
          id: "revenue-up",
          type: "success",
          title: "Receita em Alta",
          description: `Suas receitas aumentaram ${calculatedStats.revenueChange.toFixed(0)}% esta semana. Continue com as estratégias atuais!`,
          metric: formatCurrency(calculatedStats.revenue),
          change: calculatedStats.revenueChange,
          priority: 1,
        });
      } else if (calculatedStats.revenueChange < -10) {
        generatedInsights.push({
          id: "revenue-down",
          type: "warning",
          title: "Queda na Receita",
          description: `Receitas diminuíram ${Math.abs(calculatedStats.revenueChange).toFixed(0)}% esta semana. Considere revisar suas campanhas.`,
          metric: formatCurrency(calculatedStats.revenue),
          change: calculatedStats.revenueChange,
          actionLabel: "Ver Marketing",
          actionUrl: "/marketing",
          priority: 1,
        });
      }

      // Expenses insight
      if (calculatedStats.expensesChange > 20) {
        generatedInsights.push({
          id: "expenses-warning",
          type: "warning",
          title: "Gastos Elevados",
          description: `Seus gastos aumentaram ${calculatedStats.expensesChange.toFixed(0)}% em relação à semana passada.`,
          metric: formatCurrency(calculatedStats.expenses),
          change: calculatedStats.expensesChange,
          actionLabel: "Revisar Finanças",
          actionUrl: "/financas-pessoais",
          priority: 2,
        });
      }

      // Tasks insight
      if (calculatedStats.tasksPending > 5) {
        generatedInsights.push({
          id: "tasks-pending",
          type: "action",
          title: "Tarefas Pendentes",
          description: `Você tem ${calculatedStats.tasksPending} tarefas pendentes esta semana. Priorize as mais importantes!`,
          actionLabel: "Ver Calendário",
          actionUrl: "/calendario",
          priority: 3,
        });
      }

      // Productivity insight
      const productivity = tasksCompleted + tasksPending > 0 
        ? (tasksCompleted / (tasksCompleted + tasksPending)) * 100 
        : 0;

      if (productivity >= 80) {
        generatedInsights.push({
          id: "productivity-high",
          type: "success",
          title: "Produtividade Excelente",
          description: `Você completou ${productivity.toFixed(0)}% das suas tarefas esta semana. Parabéns!`,
          metric: `${tasksCompleted}/${tasksCompleted + tasksPending}`,
          priority: 4,
        });
      }

      // Students insight
      if (calculatedStats.newStudents > 0) {
        generatedInsights.push({
          id: "new-students",
          type: "info",
          title: "Novos Alunos",
          description: `${calculatedStats.newStudents} novos alunos se matricularam esta semana.`,
          change: calculatedStats.studentsChange,
          actionLabel: "Ver Alunos",
          actionUrl: "/alunos",
          priority: 5,
        });
      }

      // Tip insight
      generatedInsights.push({
        id: "weekly-tip",
        type: "info",
        title: "Dica da Semana",
        description: "Revise suas metas financeiras no início de cada mês para manter o foco nos objetivos.",
        priority: 10,
      });

      setInsights(generatedInsights.sort((a, b) => a.priority - b.priority));
    } catch (error) {
      console.error("Error fetching weekly data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // formatCurrency importado de @/utils

  const getInsightIcon = (type: Insight["type"]) => {
    switch (type) {
      case "success": return CheckCircle2;
      case "warning": return AlertTriangle;
      case "action": return Target;
      default: return Lightbulb;
    }
  };

  const getInsightStyle = (type: Insight["type"]) => {
    switch (type) {
      case "success": return "border-l-[hsl(var(--stats-green))] bg-[hsl(var(--stats-green))]/5";
      case "warning": return "border-l-[hsl(var(--stats-gold))] bg-[hsl(var(--stats-gold))]/5";
      case "action": return "border-l-primary bg-primary/5";
      default: return "border-l-[hsl(var(--stats-blue))] bg-[hsl(var(--stats-blue))]/5";
    }
  };

  if (isLoading) {
    return (
      <Card className="border-border/50">
        <CardContent className="p-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-muted animate-pulse" />
            <div className="space-y-2 flex-1">
              <div className="h-4 w-32 bg-muted animate-pulse rounded" />
              <div className="h-3 w-48 bg-muted animate-pulse rounded" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <motion.div 
            className="p-2.5 rounded-xl bg-gradient-to-br from-primary to-primary/50"
            animate={{ 
              boxShadow: [
                "0 0 15px hsl(var(--primary) / 0.2)",
                "0 0 25px hsl(var(--primary) / 0.4)",
                "0 0 15px hsl(var(--primary) / 0.2)"
              ]
            }}
            transition={{ repeat: Infinity, duration: 3 }}
          >
            <Brain className="h-5 w-5 text-primary-foreground" />
          </motion.div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">Insights da Semana</h3>
            <p className="text-xs text-muted-foreground">
              {format(startOfWeek(new Date(), { locale: ptBR }), "dd", { locale: ptBR })} - {format(endOfWeek(new Date(), { locale: ptBR }), "dd 'de' MMMM", { locale: ptBR })}
            </p>
          </div>
        </div>
        <Badge variant="outline" className="gap-1.5">
          <Sparkles className="h-3 w-3" />
          IA Ativa
        </Badge>
      </div>

      {/* Stats Summary */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="border-border/30">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <DollarSign className="h-4 w-4 text-[hsl(var(--stats-green))]" />
                <span className="text-xs text-muted-foreground">Receita</span>
              </div>
              <p className="text-lg font-bold text-foreground">{formatCurrency(stats.revenue)}</p>
              {stats.revenueChange !== 0 && (
                <div className={`flex items-center gap-1 text-xs ${stats.revenueChange > 0 ? 'text-[hsl(var(--stats-green))]' : 'text-destructive'}`}>
                  {stats.revenueChange > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  {Math.abs(stats.revenueChange).toFixed(0)}%
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-border/30">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <BarChart3 className="h-4 w-4 text-[hsl(var(--stats-purple))]" />
                <span className="text-xs text-muted-foreground">Gastos</span>
              </div>
              <p className="text-lg font-bold text-foreground">{formatCurrency(stats.expenses)}</p>
              {stats.expensesChange !== 0 && (
                <div className={`flex items-center gap-1 text-xs ${stats.expensesChange < 0 ? 'text-[hsl(var(--stats-green))]' : 'text-destructive'}`}>
                  {stats.expensesChange > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  {Math.abs(stats.expensesChange).toFixed(0)}%
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-border/30">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <Calendar className="h-4 w-4 text-[hsl(var(--stats-blue))]" />
                <span className="text-xs text-muted-foreground">Tarefas</span>
              </div>
              <p className="text-lg font-bold text-foreground">{stats.tasksCompleted}/{stats.tasksCompleted + stats.tasksPending}</p>
              <Progress 
                value={stats.tasksCompleted + stats.tasksPending > 0 ? (stats.tasksCompleted / (stats.tasksCompleted + stats.tasksPending)) * 100 : 0} 
                className="h-1.5 mt-1" 
              />
            </CardContent>
          </Card>

          <Card className="border-border/30">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <Users className="h-4 w-4 text-primary" />
                <span className="text-xs text-muted-foreground">Novos Alunos</span>
              </div>
              <p className="text-lg font-bold text-foreground">{stats.newStudents}</p>
              {stats.studentsChange !== 0 && (
                <div className={`flex items-center gap-1 text-xs ${stats.studentsChange > 0 ? 'text-[hsl(var(--stats-green))]' : 'text-destructive'}`}>
                  {stats.studentsChange > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  {Math.abs(stats.studentsChange).toFixed(0)}%
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Insights List */}
      <div className="space-y-3">
        {insights.map((insight, index) => {
          const Icon = getInsightIcon(insight.type);
          return (
            <motion.div
              key={insight.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`p-4 rounded-xl border-l-4 ${getInsightStyle(insight.type)}`}
            >
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${
                  insight.type === "success" ? "bg-[hsl(var(--stats-green))]/10" :
                  insight.type === "warning" ? "bg-[hsl(var(--stats-gold))]/10" :
                  insight.type === "action" ? "bg-primary/10" :
                  "bg-[hsl(var(--stats-blue))]/10"
                }`}>
                  <Icon className={`h-4 w-4 ${
                    insight.type === "success" ? "text-[hsl(var(--stats-green))]" :
                    insight.type === "warning" ? "text-[hsl(var(--stats-gold))]" :
                    insight.type === "action" ? "text-primary" :
                    "text-[hsl(var(--stats-blue))]"
                  }`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium text-foreground">{insight.title}</h4>
                    {insight.metric && (
                      <Badge variant="secondary" className="text-xs">{insight.metric}</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{insight.description}</p>
                  {insight.actionLabel && insight.actionUrl && (
                    <Button variant="link" size="sm" className="px-0 h-auto mt-2 text-primary" asChild>
                      <a href={insight.actionUrl}>
                        {insight.actionLabel}
                        <ArrowRight className="h-3 w-3 ml-1" />
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
