// ============================================
// SYNAPSE v14.0 - PREVISÃO DE FLUXO DE CAIXA
// Projeções financeiras baseadas em histórico
// ============================================

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  DollarSign,
  AlertTriangle,
  ArrowUp,
  ArrowDown,
  LineChart,
  Sparkles,
  Target,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine
} from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { format, addMonths, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ForecastData {
  month: string;
  income: number;
  expenses: number;
  balance: number;
  predicted: boolean;
}

interface ForecastSummary {
  nextMonthIncome: number;
  nextMonthExpenses: number;
  nextMonthBalance: number;
  trend: "up" | "down" | "stable";
  confidence: number;
  alerts: string[];
  recommendations: string[];
}

export function CashFlowForecast() {
  const [forecastData, setForecastData] = useState<ForecastData[]>([]);
  const [summary, setSummary] = useState<ForecastSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [forecastMonths, setForecastMonths] = useState<"3" | "6" | "12">("3");

  useEffect(() => {
    loadForecast();
  }, [forecastMonths]);

  const loadForecast = async () => {
    setIsLoading(true);
    try {
      // Get historical data (last 6 months)
      const historicalMonths = 6;
      const monthlyData: ForecastData[] = [];

      for (let i = historicalMonths - 1; i >= 0; i--) {
        const monthDate = subMonths(new Date(), i);
        const monthKey = format(monthDate, "yyyy-MM");
        const monthLabel = format(monthDate, "MMM", { locale: ptBR });

        // Get income
        const { data: incomeData } = await supabase
          .from("income")
          .select("valor")
          .ilike("mes_referencia", `${monthKey}%`);
        
        const monthIncome = incomeData?.reduce((acc, e) => acc + (e.valor || 0), 0) || 0;

        // Get expenses
        const { data: personalFixed } = await supabase
          .from("personal_fixed_expenses")
          .select("valor");
        const { data: companyFixed } = await supabase
          .from("company_fixed_expenses")
          .select("valor");
        const { data: personalExtra } = await supabase
          .from("personal_extra_expenses")
          .select("valor")
          .gte("created_at", `${monthKey}-01`)
          .lt("created_at", format(addMonths(monthDate, 1), "yyyy-MM-01"));
        const { data: companyExtra } = await supabase
          .from("company_extra_expenses")
          .select("valor")
          .gte("created_at", `${monthKey}-01`)
          .lt("created_at", format(addMonths(monthDate, 1), "yyyy-MM-01"));

        const fixedExpenses = 
          (personalFixed?.reduce((acc, e) => acc + (e.valor || 0), 0) || 0) +
          (companyFixed?.reduce((acc, e) => acc + (e.valor || 0), 0) || 0);
        const extraExpenses = 
          (personalExtra?.reduce((acc, e) => acc + (e.valor || 0), 0) || 0) +
          (companyExtra?.reduce((acc, e) => acc + (e.valor || 0), 0) || 0);
        
        const monthExpenses = fixedExpenses + extraExpenses;

        monthlyData.push({
          month: monthLabel,
          income: monthIncome,
          expenses: monthExpenses,
          balance: monthIncome - monthExpenses,
          predicted: false
        });
      }

      // Calculate trends and generate predictions
      const avgIncome = monthlyData.reduce((acc, m) => acc + m.income, 0) / monthlyData.length;
      const avgExpenses = monthlyData.reduce((acc, m) => acc + m.expenses, 0) / monthlyData.length;
      
      // Calculate growth rates
      const recentIncome = monthlyData.slice(-3).reduce((acc, m) => acc + m.income, 0) / 3;
      const olderIncome = monthlyData.slice(0, 3).reduce((acc, m) => acc + m.income, 0) / 3;
      const incomeGrowth = olderIncome > 0 ? ((recentIncome - olderIncome) / olderIncome) : 0;

      const recentExpenses = monthlyData.slice(-3).reduce((acc, m) => acc + m.expenses, 0) / 3;
      const olderExpenses = monthlyData.slice(0, 3).reduce((acc, m) => acc + m.expenses, 0) / 3;
      const expenseGrowth = olderExpenses > 0 ? ((recentExpenses - olderExpenses) / olderExpenses) : 0;

      // Generate forecasts
      const forecastCount = parseInt(forecastMonths);
      for (let i = 1; i <= forecastCount; i++) {
        const futureDate = addMonths(new Date(), i);
        const monthLabel = format(futureDate, "MMM", { locale: ptBR });
        
        // Apply growth factors with some decay
        const growthDecay = Math.pow(0.9, i);
        const predictedIncome = avgIncome * (1 + incomeGrowth * growthDecay);
        const predictedExpenses = avgExpenses * (1 + expenseGrowth * 0.5 * growthDecay);

        monthlyData.push({
          month: monthLabel,
          income: Math.round(predictedIncome),
          expenses: Math.round(predictedExpenses),
          balance: Math.round(predictedIncome - predictedExpenses),
          predicted: true
        });
      }

      setForecastData(monthlyData);

      // Generate summary
      const nextMonth = monthlyData.find(m => m.predicted);
      const trend = incomeGrowth > 0.05 ? "up" : incomeGrowth < -0.05 ? "down" : "stable";
      const confidence = Math.min(85, Math.max(50, 75 - Math.abs(incomeGrowth - expenseGrowth) * 100));

      const alerts: string[] = [];
      const recommendations: string[] = [];

      if (nextMonth && nextMonth.balance < 0) {
        alerts.push("⚠️ Previsão de saldo negativo no próximo mês");
        recommendations.push("Considere reduzir despesas variáveis");
      }

      if (expenseGrowth > 0.1) {
        alerts.push("📈 Despesas crescendo acima da média");
        recommendations.push("Revisar gastos recorrentes");
      }

      if (incomeGrowth > 0.15) {
        recommendations.push("💡 Bom momento para investir no negócio");
      }

      if (incomeGrowth < -0.1) {
        alerts.push("📉 Receita em declínio");
        recommendations.push("Focar em campanhas de marketing");
      }

      setSummary({
        nextMonthIncome: nextMonth?.income || 0,
        nextMonthExpenses: nextMonth?.expenses || 0,
        nextMonthBalance: nextMonth?.balance || 0,
        trend,
        confidence,
        alerts,
        recommendations
      });

    } catch (error) {
      console.error("Error loading forecast:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (cents: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100);

  const getTrendIcon = () => {
    if (!summary) return null;
    switch (summary.trend) {
      case "up": return <TrendingUp className="h-5 w-5 text-[hsl(var(--stats-green))]" />;
      case "down": return <TrendingDown className="h-5 w-5 text-destructive" />;
      default: return <LineChart className="h-5 w-5 text-muted-foreground" />;
    }
  };

  if (isLoading) {
    return (
      <div className="glass-card rounded-2xl p-6 flex items-center justify-center h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card rounded-2xl p-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Target className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Previsão de Fluxo de Caixa</h3>
            <p className="text-xs text-muted-foreground">
              Projeções baseadas em histórico
            </p>
          </div>
        </div>
        <Select value={forecastMonths} onValueChange={(v: any) => setForecastMonths(v)}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="3">3 meses</SelectItem>
            <SelectItem value="6">6 meses</SelectItem>
            <SelectItem value="12">12 meses</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="p-4 rounded-xl bg-[hsl(var(--stats-green))]/10">
            <div className="flex items-center gap-2 mb-2">
              <ArrowUp className="h-4 w-4 text-[hsl(var(--stats-green))]" />
              <span className="text-xs text-muted-foreground">Receita Prevista</span>
            </div>
            <p className="text-lg font-bold text-[hsl(var(--stats-green))]">
              {formatCurrency(summary.nextMonthIncome)}
            </p>
          </div>

          <div className="p-4 rounded-xl bg-destructive/10">
            <div className="flex items-center gap-2 mb-2">
              <ArrowDown className="h-4 w-4 text-destructive" />
              <span className="text-xs text-muted-foreground">Despesas Previstas</span>
            </div>
            <p className="text-lg font-bold text-destructive">
              {formatCurrency(summary.nextMonthExpenses)}
            </p>
          </div>

          <div className={`p-4 rounded-xl ${summary.nextMonthBalance >= 0 ? "bg-[hsl(var(--stats-green))]/10" : "bg-destructive/10"}`}>
            <div className="flex items-center gap-2 mb-2">
              {getTrendIcon()}
              <span className="text-xs text-muted-foreground">Saldo Previsto</span>
            </div>
            <p className={`text-lg font-bold ${summary.nextMonthBalance >= 0 ? "text-[hsl(var(--stats-green))]" : "text-destructive"}`}>
              {formatCurrency(summary.nextMonthBalance)}
            </p>
          </div>
        </div>
      )}

      {/* Chart */}
      <div className="h-[250px] mb-6">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={forecastData}>
            <defs>
              <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(152, 76%, 47%)" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="hsl(152, 76%, 47%)" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(348, 70%, 50%)" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="hsl(348, 70%, 50%)" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(240, 6%, 15%)" />
            <XAxis 
              dataKey="month" 
              stroke="#ffffff"
              tick={{ fontSize: 11, fill: "#ffffff", fontWeight: "bold" }}
            />
            <YAxis 
              stroke="#ffffff"
              tickFormatter={(value) => `${(value / 100000).toFixed(0)}k`}
              tick={{ fontSize: 11, fill: "#ffffff", fontWeight: "bold" }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(240, 6%, 8%)",
                border: "1px solid hsl(240, 6%, 15%)",
                borderRadius: "12px",
                color: "#ffffff",
                fontWeight: "bold",
              }}
              labelStyle={{ color: "#ffffff", fontWeight: "bold" }}
              formatter={(value: number) => formatCurrency(value)}
              labelFormatter={(label, payload) => {
                const item = payload?.[0]?.payload as ForecastData;
                return `${label} ${item?.predicted ? "(Previsão)" : ""}`;
              }}
            />
            <ReferenceLine 
              x={forecastData.find(d => d.predicted)?.month} 
              stroke="hsl(var(--primary))"
              strokeDasharray="5 5"
              label={{ value: "Previsão", position: "top", fill: "hsl(var(--primary))", fontSize: 10 }}
            />
            <Area
              type="monotone"
              dataKey="income"
              stroke="hsl(152, 76%, 47%)"
              fill="url(#incomeGradient)"
              strokeWidth={2}
              name="Receitas"
            />
            <Area
              type="monotone"
              dataKey="expenses"
              stroke="hsl(348, 70%, 50%)"
              fill="url(#expenseGradient)"
              strokeWidth={2}
              name="Despesas"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Alerts & Recommendations */}
      {summary && (
        <div className="space-y-4">
          {summary.alerts.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Alertas</p>
              {summary.alerts.map((alert, i) => (
                <div key={i} className="p-3 rounded-lg bg-destructive/10 border-l-2 border-destructive text-sm">
                  {alert}
                </div>
              ))}
            </div>
          )}

          {summary.recommendations.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Recomendações</p>
              {summary.recommendations.map((rec, i) => (
                <div key={i} className="p-3 rounded-lg bg-primary/10 border-l-2 border-primary text-sm">
                  {rec}
                </div>
              ))}
            </div>
          )}

          {/* Confidence */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
            <span className="text-sm text-muted-foreground">Confiança da Previsão</span>
            <div className="flex items-center gap-2">
              <Progress value={summary.confidence} className="w-20 h-2" />
              <span className="text-sm font-medium">{summary.confidence.toFixed(0)}%</span>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
