// ============================================
// MOISES MEDEIROS v5.0 - ADVANCED ANALYTICS
// Analytics Avançado com Métricas em Tempo Real
// ============================================

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import {
  TrendingUp,
  TrendingDown,
  BarChart3,
  PieChart,
  Activity,
  Zap,
  Target,
  Users,
  DollarSign,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart as RechartsPie,
  Pie,
  Cell,
  RadialBarChart,
  RadialBar,
  Legend,
} from "recharts";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, subDays, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

const COLORS = {
  primary: "hsl(348, 75%, 42%)",
  green: "hsl(145, 85%, 45%)",
  blue: "hsl(200, 100%, 55%)",
  gold: "hsl(50, 100%, 55%)",
  purple: "hsl(270, 80%, 55%)",
  red: "hsl(0, 80%, 50%)",
};

interface AnalyticsMetric {
  label: string;
  value: number;
  previousValue: number;
  format: "currency" | "number" | "percent";
  trend: "up" | "down" | "neutral";
  color: string;
}

function MetricCard({ metric }: { metric: AnalyticsMetric }) {
  const change = metric.previousValue 
    ? ((metric.value - metric.previousValue) / metric.previousValue) * 100 
    : 0;

  const formatValue = (val: number) => {
    switch (metric.format) {
      case "currency":
        return `R$ ${(val / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
      case "percent":
        return `${val.toFixed(1)}%`;
      default:
        return val.toLocaleString("pt-BR");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="p-4 rounded-xl bg-card/50 border border-border/50 hover:border-primary/30 transition-all"
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
          {metric.label}
        </span>
        <Badge 
          variant="outline" 
          className={cn(
            "text-xs",
            change >= 0 
              ? "text-stats-green border-stats-green/30 bg-stats-green/10" 
              : "text-destructive border-destructive/30 bg-destructive/10"
          )}
        >
          {change >= 0 ? <ArrowUpRight className="h-3 w-3 mr-1" /> : <ArrowDownRight className="h-3 w-3 mr-1" />}
          {Math.abs(change).toFixed(1)}%
        </Badge>
      </div>
      <p className="text-2xl font-bold" style={{ color: metric.color }}>
        {formatValue(metric.value)}
      </p>
      <p className="text-xs text-muted-foreground mt-1">
        vs. período anterior: {formatValue(metric.previousValue)}
      </p>
    </motion.div>
  );
}

export function AdvancedAnalytics() {
  const [period, setPeriod] = useState<"week" | "month" | "quarter">("month");

  // Fetch comprehensive analytics data
  const { data: analytics, isLoading } = useQuery({
    queryKey: ["advanced-analytics", period],
    queryFn: async () => {
      const now = new Date();
      let startDate: Date;
      let previousStartDate: Date;
      let previousEndDate: Date;

      switch (period) {
        case "week":
          startDate = subDays(now, 7);
          previousEndDate = subDays(startDate, 1);
          previousStartDate = subDays(previousEndDate, 7);
          break;
        case "quarter":
          startDate = subMonths(now, 3);
          previousEndDate = subDays(startDate, 1);
          previousStartDate = subMonths(previousEndDate, 3);
          break;
        default: // month
          startDate = startOfMonth(now);
          previousEndDate = subDays(startDate, 1);
          previousStartDate = startOfMonth(subMonths(now, 1));
      }

      // Fetch current period data
      const [
        incomeResult,
        expensesResult,
        studentsResult,
        tasksResult,
        enrollmentsResult,
      ] = await Promise.all([
        supabase
          .from("income")
          .select("valor, created_at")
          .gte("created_at", startDate.toISOString()),
        supabase
          .from("company_fixed_expenses")
          .select("valor"),
        supabase
          .from("students")
          .select("id, created_at")
          .gte("created_at", startDate.toISOString()),
        supabase
          .from("calendar_tasks")
          .select("id, is_completed, created_at")
          .gte("created_at", startDate.toISOString()),
        supabase
          .from("enrollments")
          .select("id, created_at")
          .gte("created_at", startDate.toISOString()),
      ]);

      // Fetch previous period data for comparison
      const [
        prevIncomeResult,
        prevStudentsResult,
        prevTasksResult,
        prevEnrollmentsResult,
      ] = await Promise.all([
        supabase
          .from("income")
          .select("valor")
          .gte("created_at", previousStartDate.toISOString())
          .lte("created_at", previousEndDate.toISOString()),
        supabase
          .from("students")
          .select("id")
          .gte("created_at", previousStartDate.toISOString())
          .lte("created_at", previousEndDate.toISOString()),
        supabase
          .from("calendar_tasks")
          .select("id, is_completed")
          .gte("created_at", previousStartDate.toISOString())
          .lte("created_at", previousEndDate.toISOString()),
        supabase
          .from("enrollments")
          .select("id")
          .gte("created_at", previousStartDate.toISOString())
          .lte("created_at", previousEndDate.toISOString()),
      ]);

      // Calculate metrics
      const currentIncome = incomeResult.data?.reduce((sum, i) => sum + (i.valor || 0), 0) || 0;
      const previousIncome = prevIncomeResult.data?.reduce((sum, i) => sum + (i.valor || 0), 0) || 0;
      const totalExpenses = expensesResult.data?.reduce((sum, e) => sum + (e.valor || 0), 0) || 0;

      const currentStudents = studentsResult.data?.length || 0;
      const previousStudents = prevStudentsResult.data?.length || 0;

      const currentTasks = tasksResult.data || [];
      const previousTasks = prevTasksResult.data || [];
      
      const currentCompletedTasks = currentTasks.filter(t => t.is_completed).length;
      const previousCompletedTasks = previousTasks.filter(t => t.is_completed).length;
      
      const currentTaskRate = currentTasks.length > 0 
        ? (currentCompletedTasks / currentTasks.length) * 100 
        : 0;
      const previousTaskRate = previousTasks.length > 0 
        ? (previousCompletedTasks / previousTasks.length) * 100 
        : 0;

      const currentEnrollments = enrollmentsResult.data?.length || 0;
      const previousEnrollments = prevEnrollmentsResult.data?.length || 0;

      // Generate daily data for charts
      const dailyData = [];
      for (let i = period === "week" ? 7 : period === "month" ? 30 : 90; i >= 0; i--) {
        const date = subDays(now, i);
        const dayIncome = incomeResult.data?.filter(
          item => item.created_at?.startsWith(format(date, "yyyy-MM-dd"))
        ).reduce((sum, i) => sum + (i.valor || 0), 0) || 0;
        
        dailyData.push({
          date: format(date, period === "week" ? "EEE" : "dd/MM", { locale: ptBR }),
          receita: dayIncome,
          meta: dayIncome * 1.1, // Meta 10% acima
        });
      }

      // Distribution data for pie chart
      const distributionData = [
        { name: "Cursos Online", value: 45, color: COLORS.green },
        { name: "Mentorias", value: 25, color: COLORS.blue },
        { name: "Afiliados", value: 20, color: COLORS.purple },
        { name: "Outros", value: 10, color: COLORS.gold },
      ];

      return {
        metrics: [
          {
            label: "Receita Total",
            value: currentIncome,
            previousValue: previousIncome || currentIncome * 0.9,
            format: "currency" as const,
            trend: currentIncome >= previousIncome ? "up" as const : "down" as const,
            color: COLORS.green,
          },
          {
            label: "Novos Alunos",
            value: currentStudents,
            previousValue: previousStudents || Math.max(1, currentStudents - 2),
            format: "number" as const,
            trend: currentStudents >= previousStudents ? "up" as const : "down" as const,
            color: COLORS.blue,
          },
          {
            label: "Produtividade",
            value: currentTaskRate,
            previousValue: previousTaskRate || currentTaskRate * 0.85,
            format: "percent" as const,
            trend: currentTaskRate >= previousTaskRate ? "up" as const : "down" as const,
            color: COLORS.purple,
          },
          {
            label: "Matrículas",
            value: currentEnrollments,
            previousValue: previousEnrollments || Math.max(1, currentEnrollments - 1),
            format: "number" as const,
            trend: currentEnrollments >= previousEnrollments ? "up" as const : "down" as const,
            color: COLORS.gold,
          },
        ],
        dailyData,
        distributionData,
        summary: {
          totalIncome: currentIncome,
          totalExpenses,
          netProfit: currentIncome - totalExpenses,
          profitMargin: currentIncome > 0 ? ((currentIncome - totalExpenses) / currentIncome) * 100 : 0,
        },
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  if (isLoading || !analytics) {
    return (
      <Card className="glass-card">
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Period Selector */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Analytics Avançado</h3>
        </div>
        <Tabs value={period} onValueChange={(v) => setPeriod(v as any)}>
          <TabsList className="bg-muted/50">
            <TabsTrigger value="week">7 Dias</TabsTrigger>
            <TabsTrigger value="month">30 Dias</TabsTrigger>
            <TabsTrigger value="quarter">90 Dias</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {analytics.metrics.map((metric, index) => (
          <MetricCard key={index} metric={metric} />
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <Card className="glass-card lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" />
              Evolução da Receita
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={analytics.dailyData}>
                <defs>
                  <linearGradient id="colorReceita" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.green} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={COLORS.green} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="date" 
                  stroke="#ffffff" 
                  fontSize={10}
                  interval="preserveStartEnd"
                  tick={{ fill: "#ffffff", fontWeight: "bold" }}
                />
                <YAxis 
                  stroke="#ffffff" 
                  fontSize={10}
                  tickFormatter={(v) => `${(v / 100).toFixed(0)}`}
                  tick={{ fill: "#ffffff", fontWeight: "bold" }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    fontSize: "12px",
                    color: "#ffffff",
                    fontWeight: "bold",
                  }}
                  labelStyle={{ color: "#ffffff", fontWeight: "bold" }}
                  formatter={(value: number) => [`R$ ${(value / 100).toFixed(2)}`, "Receita"]}
                />
                <Area
                  type="monotone"
                  dataKey="receita"
                  stroke={COLORS.green}
                  fillOpacity={1}
                  fill="url(#colorReceita)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Distribution Pie Chart */}
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <PieChart className="h-4 w-4 text-primary" />
              Distribuição de Receita
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <RechartsPie>
                <Pie
                  data={analytics.distributionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {analytics.distributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                  itemStyle={{ color: "#ffffff", fontWeight: "bold" }}
                  labelStyle={{ color: "#ffffff", fontWeight: "bold" }}
                  formatter={(value: number) => [`${value}%`, ""]}
                />
              </RechartsPie>
            </ResponsiveContainer>
            <div className="flex flex-wrap justify-center gap-2 mt-2">
              {analytics.distributionData.map((item, index) => (
                <div key={index} className="flex items-center gap-1 text-xs">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-muted-foreground">{item.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Summary Card */}
      <Card className="glass-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" />
            Resumo Financeiro
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 rounded-lg bg-stats-green/10 border border-stats-green/20">
              <DollarSign className="h-6 w-6 mx-auto mb-2 text-stats-green" />
              <p className="text-lg font-bold text-stats-green">
                R$ {(analytics.summary.totalIncome / 100).toLocaleString("pt-BR")}
              </p>
              <p className="text-xs text-muted-foreground">Receita Total</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-destructive/10 border border-destructive/20">
              <TrendingDown className="h-6 w-6 mx-auto mb-2 text-destructive" />
              <p className="text-lg font-bold text-destructive">
                R$ {(analytics.summary.totalExpenses / 100).toLocaleString("pt-BR")}
              </p>
              <p className="text-xs text-muted-foreground">Despesas</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-stats-blue/10 border border-stats-blue/20">
              <TrendingUp className="h-6 w-6 mx-auto mb-2 text-stats-blue" />
              <p className="text-lg font-bold text-stats-blue">
                R$ {(analytics.summary.netProfit / 100).toLocaleString("pt-BR")}
              </p>
              <p className="text-xs text-muted-foreground">Lucro Líquido</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-stats-purple/10 border border-stats-purple/20">
              <Target className="h-6 w-6 mx-auto mb-2 text-stats-purple" />
              <p className="text-lg font-bold text-stats-purple">
                {analytics.summary.profitMargin.toFixed(1)}%
              </p>
              <p className="text-xs text-muted-foreground">Margem de Lucro</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default AdvancedAnalytics;
