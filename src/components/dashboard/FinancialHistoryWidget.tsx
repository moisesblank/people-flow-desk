// ============================================
// WIDGET DE HISTÓRICO FINANCEIRO PARA DASHBOARD
// Mini gráfico de evolução mensal
// ============================================

import { useMemo } from "react";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Minus, Calendar, History } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AreaChart, Area, ResponsiveContainer, Tooltip } from "recharts";
import { useFinancialHistory } from "@/hooks/useFinancialHistory";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function FinancialHistoryWidget() {
  const navigate = useNavigate();
  const { snapshots, stats, chartData, isLoading } = useFinancialHistory();

  const TrendIcon = stats.tendencia === "up" ? TrendingUp : stats.tendencia === "down" ? TrendingDown : Minus;
  const trendColor = stats.tendencia === "up" ? "text-destructive" : stats.tendencia === "down" ? "text-green-500" : "text-muted-foreground";

  // Dados simplificados para mini gráfico
  const miniChartData = useMemo(() => {
    return chartData.slice(-6).map(d => ({
      ...d,
      value: d.saldo,
    }));
  }, [chartData]);

  if (isLoading) {
    return (
      <Card className="glass-card animate-pulse">
        <CardHeader className="pb-2">
          <div className="h-4 bg-muted rounded w-1/2" />
        </CardHeader>
        <CardContent>
          <div className="h-20 bg-muted rounded" />
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="glass-card cursor-pointer hover:border-primary/50 transition-all" onClick={() => navigate("/financas-pessoais")}>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <History className="h-4 w-4 text-primary" />
              Histórico Financeiro
            </CardTitle>
            <div className={`flex items-center gap-1 ${trendColor}`}>
              <TrendIcon className="h-3 w-3" />
              <span className="text-xs font-medium">
                {stats.variacaoPercent > 0 ? "+" : ""}{stats.variacaoPercent.toFixed(0)}%
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {/* Mini gráfico */}
          <div className="h-16 mb-3">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={miniChartData}>
                <defs>
                  <linearGradient id="colorSaldo" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                  formatter={(value: number) => [formatCurrency(value), "Saldo"]}
                  labelFormatter={(label) => label}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  fill="url(#colorSaldo)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Resumo */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="text-center p-2 rounded bg-muted/50">
              <p className="text-muted-foreground">Receitas</p>
              <p className="font-semibold text-green-500">{formatCurrency(stats.totalReceitas / 100)}</p>
            </div>
            <div className="text-center p-2 rounded bg-muted/50">
              <p className="text-muted-foreground">Despesas</p>
              <p className="font-semibold text-destructive">{formatCurrency(stats.totalDespesas / 100)}</p>
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              {snapshots.length} meses registrados
            </span>
            <Button variant="ghost" size="sm" className="h-6 text-xs">
              Ver Histórico →
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
