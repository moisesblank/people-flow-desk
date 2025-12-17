// ============================================
// EMPRESARIAL 2.0 - MÉTRICAS PREDITIVAS
// Análise preditiva com tendências e projeções
// ============================================

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  TrendingUp,
  TrendingDown,
  Target,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  Brain,
  ChartLine,
  Zap,
  DollarSign,
  Users,
  Calendar,
  AlertTriangle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface PredictiveMetric {
  id: string;
  label: string;
  currentValue: number;
  previousValue: number;
  predictedValue: number;
  predictedChange: number;
  confidence: number;
  trend: "up" | "down" | "stable";
  unit: "currency" | "number" | "percentage";
  icon: typeof TrendingUp;
  color: string;
}

interface PredictiveMetricsWidgetProps {
  income: number;
  expenses: number;
  students: number;
  tasks: number;
  completedTasks: number;
}

export function PredictiveMetricsWidget({
  income,
  expenses,
  students,
  tasks,
  completedTasks,
}: PredictiveMetricsWidgetProps) {
  const [activeTab, setActiveTab] = useState("overview");

  const metrics = useMemo<PredictiveMetric[]>(() => {
    const profit = income - expenses;
    const profitMargin = income > 0 ? (profit / income) * 100 : 0;
    const completionRate = tasks > 0 ? (completedTasks / tasks) * 100 : 0;

    // Simulated predictions based on current data
    const predictedIncome = income * 1.08; // 8% growth projection
    const predictedExpenses = expenses * 1.05; // 5% expense growth
    const predictedStudents = Math.round(students * 1.12); // 12% student growth

    return [
      {
        id: "revenue",
        label: "Receita Projetada",
        currentValue: income,
        previousValue: income * 0.92,
        predictedValue: predictedIncome,
        predictedChange: 8,
        confidence: 78,
        trend: "up",
        unit: "currency",
        icon: DollarSign,
        color: "hsl(var(--stats-green))",
      },
      {
        id: "profit",
        label: "Margem de Lucro",
        currentValue: profitMargin,
        previousValue: profitMargin * 0.95,
        predictedValue: profitMargin * 1.05,
        predictedChange: 5,
        confidence: 72,
        trend: profit >= 0 ? "up" : "down",
        unit: "percentage",
        icon: TrendingUp,
        color: profit >= 0 ? "hsl(var(--stats-green))" : "hsl(var(--destructive))",
      },
      {
        id: "students",
        label: "Crescimento Alunos",
        currentValue: students,
        previousValue: Math.round(students * 0.88),
        predictedValue: predictedStudents,
        predictedChange: 12,
        confidence: 85,
        trend: "up",
        unit: "number",
        icon: Users,
        color: "hsl(var(--stats-blue))",
      },
      {
        id: "productivity",
        label: "Taxa de Conclusão",
        currentValue: completionRate,
        previousValue: completionRate * 0.9,
        predictedValue: Math.min(100, completionRate * 1.1),
        predictedChange: 10,
        confidence: 68,
        trend: completionRate >= 50 ? "up" : "stable",
        unit: "percentage",
        icon: Calendar,
        color: "hsl(var(--stats-gold))",
      },
    ];
  }, [income, expenses, students, tasks, completedTasks]);

  const formatValue = (value: number, unit: string) => {
    switch (unit) {
      case "currency":
        return `R$ ${(value / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
      case "percentage":
        return `${value.toFixed(1)}%`;
      default:
        return value.toLocaleString("pt-BR");
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return "bg-[hsl(var(--stats-green))]";
    if (confidence >= 60) return "bg-[hsl(var(--stats-gold))]";
    return "bg-[hsl(var(--stats-blue))]";
  };

  const calculateGrowth = (current: number, previous: number) => {
    if (previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  };

  // AI Insights
  const insights = useMemo(() => {
    const insightsList: string[] = [];
    
    const profit = income - expenses;
    const profitMargin = income > 0 ? (profit / income) * 100 : 0;
    
    if (profitMargin < 20) {
      insightsList.push("⚠️ Margem de lucro abaixo do ideal. Considere revisar custos operacionais.");
    }
    if (profitMargin > 40) {
      insightsList.push("✅ Excelente margem! Considere reinvestir em marketing para crescimento.");
    }
    if (expenses > income * 0.8) {
      insightsList.push("🔴 Gastos elevados! Recomendamos análise de despesas não essenciais.");
    }
    if (completedTasks / tasks < 0.5) {
      insightsList.push("📋 Taxa de conclusão baixa. Priorize tarefas críticas ou delegue.");
    }
    
    return insightsList;
  }, [income, expenses, tasks, completedTasks]);

  return (
    <Card className="glass-card overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-to-br from-primary/20 to-purple-500/20">
              <Brain className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                Análise Preditiva
                <Badge variant="outline" className="text-[10px] bg-primary/10">
                  <Sparkles className="h-3 w-3 mr-1" />
                  IA
                </Badge>
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                Projeções baseadas em tendências
              </p>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 h-8">
            <TabsTrigger value="overview" className="text-xs">Métricas</TabsTrigger>
            <TabsTrigger value="insights" className="text-xs">
              Insights
              {insights.length > 0 && (
                <Badge className="ml-1 h-4 w-4 p-0 text-[8px] bg-primary">
                  {insights.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-4 space-y-3">
            {metrics.map((metric, index) => {
              const growth = calculateGrowth(metric.currentValue, metric.previousValue);
              const Icon = metric.icon;

              return (
                <motion.div
                  key={metric.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="p-3 rounded-xl bg-muted/30 border border-border/50"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div 
                        className="p-1.5 rounded-lg"
                        style={{ backgroundColor: `${metric.color}20` }}
                      >
                        <Icon className="h-4 w-4" style={{ color: metric.color }} />
                      </div>
                      <span className="text-sm font-medium">{metric.label}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      {growth >= 0 ? (
                        <ArrowUpRight className="h-4 w-4 text-[hsl(var(--stats-green))]" />
                      ) : (
                        <ArrowDownRight className="h-4 w-4 text-destructive" />
                      )}
                      <span className={`text-xs font-medium ${
                        growth >= 0 ? "text-[hsl(var(--stats-green))]" : "text-destructive"
                      }`}>
                        {growth >= 0 ? "+" : ""}{growth.toFixed(1)}%
                      </span>
                    </div>
                  </div>

                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-lg font-bold">
                        {formatValue(metric.currentValue, metric.unit)}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        Projeção: {formatValue(metric.predictedValue, metric.unit)}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] text-muted-foreground">Confiança</span>
                        <Badge variant="outline" className="text-[10px] h-4 px-1">
                          {metric.confidence}%
                        </Badge>
                      </div>
                      <Progress 
                        value={metric.confidence} 
                        className="h-1 w-16 mt-1"
                      />
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </TabsContent>

          <TabsContent value="insights" className="mt-4">
            {insights.length === 0 ? (
              <div className="text-center py-6">
                <Sparkles className="h-10 w-10 mx-auto mb-2 text-primary/50" />
                <p className="text-sm text-muted-foreground">
                  Parabéns! Seus indicadores estão ótimos.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {insights.map((insight, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="p-3 rounded-xl bg-muted/30 border border-border/50"
                  >
                    <p className="text-sm">{insight}</p>
                  </motion.div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Quick Projection Summary */}
        <div className="pt-3 border-t border-border/50">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground flex items-center gap-1">
              <ChartLine className="h-3 w-3" />
              Próximo mês
            </span>
            <span className="font-medium text-primary flex items-center gap-1">
              <Zap className="h-3 w-3" />
              Crescimento projetado: +8.5%
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
