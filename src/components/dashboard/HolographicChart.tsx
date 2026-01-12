// ============================================
// HOLOGRAPHIC CHART v2.0 - OPTIMIZED
// Gráficos Futuristas - SEM ANIMAÇÕES PESADAS
// Mantém visual, remove overhead
// ============================================

import { useState } from "react";
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
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Activity, BarChart3, TrendingUp, Zap } from "lucide-react";
import { formatCurrency } from "@/utils/format";

interface DataPoint {
  name: string;
  value: number;
  value2?: number;
}

interface HolographicChartProps {
  data: DataPoint[];
  title: string;
  subtitle?: string;
  type?: "area" | "bar";
  color?: "primary" | "green" | "blue" | "purple";
  showComparison?: boolean;
}

// Custom Tooltip - STATIC (no motion)
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload || !payload.length) return null;

  return (
    <div
      className="bg-background/95 backdrop-blur-xl border border-primary/30 rounded-xl p-4 shadow-2xl"
      style={{
        boxShadow: "0 0 30px rgba(139, 0, 0, 0.3)",
      }}
    >
      <p className="text-xs text-muted-foreground mb-2">{label}</p>
      {payload.map((entry: any, index: number) => (
        <div key={index} className="flex items-center gap-2">
          <div 
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-sm font-medium text-foreground">
            {entry.name}: {formatCurrency(entry.value)}
          </span>
        </div>
      ))}
    </div>
  );
}

export function HolographicChart({
  data,
  title,
  subtitle,
  type = "area",
  color = "primary",
  showComparison = false,
}: HolographicChartProps) {
  const [chartType, setChartType] = useState<"area" | "bar">(type);

  const colorConfig = {
    primary: {
      main: "#8B0000",
      gradient: ["#8B0000", "#DC143C"],
      stroke: "hsl(var(--primary))",
    },
    green: {
      main: "#22c55e",
      gradient: ["#22c55e", "#4ade80"],
      stroke: "#22c55e",
    },
    blue: {
      main: "#3b82f6",
      gradient: ["#3b82f6", "#60a5fa"],
      stroke: "#3b82f6",
    },
    purple: {
      main: "#a855f7",
      gradient: ["#a855f7", "#c084fc"],
      stroke: "#a855f7",
    },
  };

  const config = colorConfig[color];

  // Calculate total and trend
  const total = data.reduce((acc, item) => acc + item.value, 0);
  const lastTwo = data.slice(-2);
  const trend = lastTwo.length === 2 
    ? ((lastTwo[1].value - lastTwo[0].value) / lastTwo[0].value * 100).toFixed(1)
    : 0;

  return (
    <Card className="relative overflow-hidden bg-gradient-to-br from-background via-background to-muted/20 border-primary/20">
      {/* Background Effects - STATIC */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute -top-20 -right-20 w-60 h-60 rounded-full opacity-40"
          style={{
            background: `radial-gradient(circle, ${config.main}20 0%, transparent 70%)`,
          }}
        />
        <div 
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `
              linear-gradient(${config.main}30 1px, transparent 1px),
              linear-gradient(90deg, ${config.main}30 1px, transparent 1px)
            `,
            backgroundSize: '30px 30px',
          }}
        />
      </div>

      <CardHeader className="relative z-10 pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Activity className="h-5 w-5 text-primary" />
              {title}
            </CardTitle>
            {subtitle && (
              <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
            )}
          </div>
          
          {/* Chart Type Toggle */}
          <Tabs value={chartType} onValueChange={(v) => setChartType(v as "area" | "bar")}>
            <TabsList className="bg-muted/50">
              <TabsTrigger value="area" className="data-[state=active]:bg-primary/20">
                <TrendingUp className="h-4 w-4" />
              </TabsTrigger>
              <TabsTrigger value="bar" className="data-[state=active]:bg-primary/20">
                <BarChart3 className="h-4 w-4" />
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Stats Bar */}
        <div className="flex items-center gap-4 mt-4">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/50 border border-border/50">
            <Zap className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">
              Total: {formatCurrency(total)}
            </span>
          </div>
          <div className={`flex items-center gap-1 px-3 py-1.5 rounded-lg ${
            Number(trend) >= 0 ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
          }`}>
            <span className="text-sm font-medium">
              {Number(trend) >= 0 ? '↑' : '↓'} {Math.abs(Number(trend))}%
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="relative z-10 pt-4">
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            {chartType === "area" ? (
              <AreaChart data={data}>
                <defs>
                  <linearGradient id={`colorGradient-${color}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={config.main} stopOpacity={0.4}/>
                    <stop offset="95%" stopColor={config.main} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid 
                  strokeDasharray="3 3" 
                  stroke="hsl(var(--border))" 
                  opacity={0.3}
                />
                <XAxis 
                  dataKey="name" 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `R$ ${(value / 100).toLocaleString()}`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="value"
                  name="Valor"
                  stroke={config.stroke}
                  strokeWidth={3}
                  fill={`url(#colorGradient-${color})`}
                  dot={{ fill: config.main, strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, fill: config.main, stroke: "white", strokeWidth: 2 }}
                />
                {showComparison && (
                  <Area
                    type="monotone"
                    dataKey="value2"
                    name="Anterior"
                    stroke="hsl(var(--muted-foreground))"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    fill="transparent"
                  />
                )}
              </AreaChart>
            ) : (
              <BarChart data={data}>
                <defs>
                  <linearGradient id={`barGradient-${color}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={config.main} stopOpacity={0.9}/>
                    <stop offset="95%" stopColor={config.main} stopOpacity={0.4}/>
                  </linearGradient>
                </defs>
                <CartesianGrid 
                  strokeDasharray="3 3" 
                  stroke="hsl(var(--border))" 
                  opacity={0.3}
                  vertical={false}
                />
                <XAxis 
                  dataKey="name" 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `R$ ${(value / 100).toLocaleString()}`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar
                  dataKey="value"
                  name="Valor"
                  fill={`url(#barGradient-${color})`}
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
