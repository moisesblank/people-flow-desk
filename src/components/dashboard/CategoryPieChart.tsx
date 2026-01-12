// ============================================
// CATEGORY PIE CHART - OPTIMIZED
// 🏛️ CONSTITUIÇÃO: Performance para 3G
// ============================================

import { memo, Suspense, lazy } from "react";
import { motion } from "framer-motion";
import { useConstitutionPerformance, useChartSimplification } from "@/hooks/useConstitutionPerformance";
import { ChartSkeleton } from "@/components/performance/LazyRecharts";
import { formatCurrency } from "@/utils";

// Lazy load Recharts
const LazyPieChart = lazy(() => 
  import("recharts").then(m => ({ default: m.PieChart }))
);
const LazyPie = lazy(() => 
  import("recharts").then(m => ({ default: m.Pie }))
);
const LazyCell = lazy(() => 
  import("recharts").then(m => ({ default: m.Cell }))
);
const LazyResponsiveContainer = lazy(() => 
  import("recharts").then(m => ({ default: m.ResponsiveContainer }))
);
const LazyTooltip = lazy(() => 
  import("recharts").then(m => ({ default: m.Tooltip }))
);

interface CategoryPieChartProps {
  data: {
    name: string;
    value: number;
    color: string;
  }[];
  title: string;
}

// Versão simplificada para conexões lentas
const SimplifiedPieChart = memo(function SimplifiedPieChart({ 
  data, 
  title 
}: CategoryPieChartProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  
  return (
    <div className="glass-card rounded-2xl p-6">
      <h3 className="text-lg font-semibold text-foreground mb-4">{title}</h3>
      <div className="space-y-3">
        {data.map((entry, index) => {
          const percentage = total > 0 ? ((entry.value / total) * 100).toFixed(1) : '0';
          return (
            <div key={index} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-sm text-foreground">{entry.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-foreground">
                  {formatCurrency(entry.value)}
                </span>
                <span className="text-xs text-muted-foreground">
                  ({percentage}%)
                </span>
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-4 pt-4 border-t border-border">
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Total</span>
          <span className="text-lg font-bold text-foreground">
            {formatCurrency(total)}
          </span>
        </div>
      </div>
    </div>
  );
});

// Componente principal
export const CategoryPieChart = memo(function CategoryPieChart({ 
  data, 
  title 
}: CategoryPieChartProps) {
  const { motionProps } = useConstitutionPerformance();
  const chartConfig = useChartSimplification();
  
  // 🏛️ PREMIUM GARANTIDO: Sempre versão completa (sem simplificação)
  
  return (
    <motion.div
      {...motionProps}
      className="glass-card rounded-2xl p-6 perf-lazy-section"
    >
      <h3 className="text-lg font-semibold text-foreground mb-6">{title}</h3>
      <div className="h-[280px]">
        <Suspense fallback={<ChartSkeleton height={280} />}>
          <LazyResponsiveContainer width="100%" height="100%">
            <LazyPieChart>
              <LazyPie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
                dataKey="value"
                animationDuration={chartConfig.animationDuration}
              >
                {data.map((entry, index) => (
                  <LazyCell key={`cell-${index}`} fill={entry.color} />
                ))}
              </LazyPie>
              {chartConfig.showTooltip && (
                <LazyTooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--background))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "12px",
                    boxShadow: "0 10px 40px rgba(0,0,0,0.3)",
                    color: "hsl(var(--foreground))",
                    fontWeight: "bold",
                  }}
                  labelStyle={{ color: "hsl(var(--foreground))", fontWeight: "bold" }}
                  formatter={(value: number) => formatCurrency(value)}
                />
              )}
            </LazyPieChart>
          </LazyResponsiveContainer>
        </Suspense>
      </div>
      <div className="flex flex-wrap justify-center gap-3 mt-2">
        {data.map((entry, index) => (
          <div key={index} className="flex items-center gap-2">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-xs text-foreground font-medium">{entry.name}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
});

export default CategoryPieChart;
