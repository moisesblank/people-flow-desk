// ============================================
// REVENUE CHART - OPTIMIZED
// 🏛️ CONSTITUIÇÃO: Performance para 3G
// ============================================

import { memo, Suspense, lazy, useMemo } from "react";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown } from "lucide-react";
import { useConstitutionPerformance, useChartSimplification } from "@/hooks/useConstitutionPerformance";
import { ChartSkeleton } from "@/components/performance/LazyRecharts";
import { formatCurrency } from "@/utils";

// Lazy load Recharts
const LazyAreaChart = lazy(() => 
  import("recharts").then(m => ({ default: m.AreaChart }))
);
const LazyArea = lazy(() => 
  import("recharts").then(m => ({ default: m.Area }))
);
const LazyXAxis = lazy(() => 
  import("recharts").then(m => ({ default: m.XAxis }))
);
const LazyYAxis = lazy(() => 
  import("recharts").then(m => ({ default: m.YAxis }))
);
const LazyCartesianGrid = lazy(() => 
  import("recharts").then(m => ({ default: m.CartesianGrid }))
);
const LazyTooltip = lazy(() => 
  import("recharts").then(m => ({ default: m.Tooltip }))
);
const LazyResponsiveContainer = lazy(() => 
  import("recharts").then(m => ({ default: m.ResponsiveContainer }))
);

interface RevenueChartProps {
  data: {
    month: string;
    receitas: number;
    despesas: number;
  }[];
}

// Versão simplificada para conexões lentas
const SimplifiedRevenueChart = memo(function SimplifiedRevenueChart({ 
  data 
}: RevenueChartProps) {
  const totals = useMemo(() => {
    const totalReceitas = data.reduce((sum, item) => sum + item.receitas, 0);
    const totalDespesas = data.reduce((sum, item) => sum + item.despesas, 0);
    const saldo = totalReceitas - totalDespesas;
    const isPositive = saldo >= 0;
    return { totalReceitas, totalDespesas, saldo, isPositive };
  }, [data]);
  
  return (
    <div className="glass-card rounded-2xl p-6">
      <h3 className="text-lg font-semibold text-foreground mb-4">Evolução Mensal</h3>
      
      {/* Resumo */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="text-center">
          <p className="text-xs text-muted-foreground mb-1">Receitas</p>
          <p className="text-sm font-bold text-emerald-500">
            {formatCurrency(totals.totalReceitas)}
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs text-muted-foreground mb-1">Despesas</p>
          <p className="text-sm font-bold text-red-500">
            {formatCurrency(totals.totalDespesas)}
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs text-muted-foreground mb-1">Saldo</p>
          <div className="flex items-center justify-center gap-1">
            {totals.isPositive ? (
              <TrendingUp className="h-3 w-3 text-emerald-500" />
            ) : (
              <TrendingDown className="h-3 w-3 text-red-500" />
            )}
            <p className={`text-sm font-bold ${totals.isPositive ? 'text-emerald-500' : 'text-red-500'}`}>
              {formatCurrency(Math.abs(totals.saldo))}
            </p>
          </div>
        </div>
      </div>
      
      {/* Lista simplificada */}
      <div className="space-y-2 max-h-48 overflow-y-auto">
        {data.map((item, index) => (
          <div key={index} className="flex items-center justify-between py-1 border-b border-border/30 last:border-0">
            <span className="text-sm text-muted-foreground">{item.month}</span>
            <div className="flex gap-4">
              <span className="text-xs text-emerald-500">{formatCurrency(item.receitas)}</span>
              <span className="text-xs text-red-500">{formatCurrency(item.despesas)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});

// Componente principal
export const RevenueChart = memo(function RevenueChart({ data }: RevenueChartProps) {
  const { motionProps } = useConstitutionPerformance();
  const chartConfig = useChartSimplification();
  
  // 🏛️ PREMIUM GARANTIDO: Sempre versão completa
  
  return (
    <motion.div
      {...motionProps}
      className="glass-card rounded-2xl p-6 perf-lazy-section"
    >
      <h3 className="text-lg font-semibold text-foreground mb-6">Evolução Mensal</h3>
      <div className="h-[300px]">
        <Suspense fallback={<ChartSkeleton height={300} />}>
          <LazyResponsiveContainer width="100%" height="100%">
            <LazyAreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorReceitas" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(152, 76%, 47%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(152, 76%, 47%)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorDespesas" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(348, 70%, 35%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(348, 70%, 35%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              {chartConfig.showGrid && (
                <LazyCartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              )}
              <LazyXAxis 
                dataKey="month" 
                stroke="hsl(var(--foreground))" 
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tick={{ fill: "hsl(var(--foreground))" }}
              />
              <LazyYAxis 
                stroke="hsl(var(--foreground))" 
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => formatCurrency(value)}
                tick={{ fill: "hsl(var(--foreground))" }}
              />
              {chartConfig.showTooltip && (
                <LazyTooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--background))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "12px",
                    boxShadow: "0 10px 40px rgba(0,0,0,0.3)",
                  }}
                  itemStyle={{ color: "hsl(var(--foreground))" }}
                  labelStyle={{ color: "hsl(var(--foreground))" }}
                  formatter={(value: number) => [formatCurrency(value), ""]}
                />
              )}
              <LazyArea
                type="monotone"
                dataKey="receitas"
                stroke="hsl(152, 76%, 47%)"
                strokeWidth={chartConfig.strokeWidth}
                fillOpacity={1}
                fill="url(#colorReceitas)"
                name="Receitas"
                animationDuration={chartConfig.animationDuration}
              />
              <LazyArea
                type="monotone"
                dataKey="despesas"
                stroke="hsl(348, 70%, 35%)"
                strokeWidth={chartConfig.strokeWidth}
                fillOpacity={1}
                fill="url(#colorDespesas)"
                name="Despesas"
                animationDuration={chartConfig.animationDuration}
              />
            </LazyAreaChart>
          </LazyResponsiveContainer>
        </Suspense>
      </div>
      <div className="flex justify-center gap-6 mt-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-[hsl(152,76%,47%)]" />
          <span className="text-sm text-muted-foreground">Receitas</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-[hsl(348,70%,35%)]" />
          <span className="text-sm text-muted-foreground">Despesas</span>
        </div>
      </div>
    </motion.div>
  );
});

export default RevenueChart;
