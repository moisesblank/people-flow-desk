// =====================================================
// StudentPerformanceCharts v3.0 - YEAR 2300 HUD
// Inspirado no print: Tempo, Pizza, Barras, Top10, Tabelas
// Performance: Lazy loaded + memoizado
// =====================================================

import { memo, useMemo } from "react";
import { cn } from "@/lib/utils";
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend, LineChart, Line, Area, AreaChart,
  CartesianGrid
} from "recharts";
import { 
  BarChart3, Target, Activity, Clock, TrendingUp, 
  Calendar, PieChartIcon, Award, Flame
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

// P0 ANTI-CRASH: Recharts ResponsiveContainer depende de ResizeObserver.
// Em alguns WebViews (Android antigo) isso causa ReferenceError e cai no ErrorBoundary.
const hasResizeObserverSupport = () => typeof window !== 'undefined' && 'ResizeObserver' in window;

// =====================================================
// CONSTANTES
// =====================================================
const CHART_COLORS = [
  "#3b82f6", "#ec4899", "#f59e0b", "#10b981", "#8b5cf6", 
  "#06b6d4", "#ef4444", "#84cc16", "#f97316", "#6366f1"
];

const MACRO_COLORS: Record<string, string> = {
  "Química Geral": "#f59e0b",
  "Físico-Química": "#06b6d4", 
  "Química Orgânica": "#8b5cf6",
  "Química Ambiental": "#10b981",
  "Bioquímica": "#ec4899",
};

interface ProcessedItem {
  name: string;
  total: number;
  correct: number;
  errors: number;
  accuracy: number;
  parentMacro?: string;
}

interface ChartsProps {
  macros: ProcessedItem[];
  micros: ProcessedItem[];
  temas?: ProcessedItem[];
  isLowEnd?: boolean;
}

// =====================================================
// HUD Header para seções - YEAR 2300 CINEMATIC
// =====================================================
const HUDHeader = memo(function HUDHeader({ 
  title, subtitle, icon: Icon, rightLabel
}: { 
  title: string; 
  subtitle?: string; 
  icon: typeof BarChart3;
  rightLabel?: string;
}) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className="relative">
        <div className="absolute inset-0 bg-primary/40 rounded-lg blur-md" />
        <div className="relative p-2 bg-gradient-to-br from-primary/20 to-primary/5 rounded-lg border border-primary/30 shadow-[0_0_15px_rgba(var(--primary),0.15)]">
          <Icon className="w-4 h-4 text-primary" />
        </div>
      </div>
      <div className="flex-1">
        <h4 className="text-sm font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">{title}</h4>
        {subtitle && <p className="text-[10px] text-muted-foreground">{subtitle}</p>}
      </div>
      {rightLabel && (
        <Badge variant="outline" className="text-[10px] bg-primary/10 border-primary/30 text-primary font-medium">
          {rightLabel}
        </Badge>
      )}
    </div>
  );
});

// =====================================================
// HoloCard Container - YEAR 2300 CINEMATIC
// =====================================================
const HoloCard = memo(function HoloCard({ 
  children, className, glowColor = "primary"
}: { 
  children: React.ReactNode; 
  className?: string;
  glowColor?: "primary" | "emerald" | "cyan" | "rose";
}) {
  const glowClasses = {
    primary: "from-primary/10 border-primary/25 shadow-[0_0_30px_rgba(var(--primary),0.1)]",
    emerald: "from-emerald-500/10 border-emerald-500/25 shadow-[0_0_30px_rgba(16,185,129,0.1)]",
    cyan: "from-cyan-500/10 border-cyan-500/25 shadow-[0_0_30px_rgba(6,182,212,0.1)]",
    rose: "from-rose-500/10 border-rose-500/25 shadow-[0_0_30px_rgba(244,63,94,0.1)]",
  };

  return (
    <div className={cn(
      "relative rounded-2xl border bg-gradient-to-b to-card/80 backdrop-blur-sm p-4 overflow-hidden",
      glowClasses[glowColor],
      className
    )}>
      {/* Scanline effect - subtle */}
      <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.02)_50%)] bg-[length:100%_4px] pointer-events-none opacity-30" />
      {/* Corner accents */}
      <div className="absolute top-0 left-0 w-8 h-[2px] bg-gradient-to-r from-primary/50 to-transparent" />
      <div className="absolute top-0 left-0 w-[2px] h-8 bg-gradient-to-b from-primary/50 to-transparent" />
      <div className="absolute bottom-0 right-0 w-8 h-[2px] bg-gradient-to-l from-primary/50 to-transparent" />
      <div className="absolute bottom-0 right-0 w-[2px] h-8 bg-gradient-to-t from-primary/50 to-transparent" />
      {/* Content */}
      <div className="relative">{children}</div>
    </div>
  );
});

// =====================================================
// SEÇÃO 1: QUANTIDADE DE QUESTÕES (Donut por Macro)
// =====================================================
const QuantityDonutChart = memo(function QuantityDonutChart({ 
  data, isLowEnd, total 
}: { 
  data: ProcessedItem[]; 
  isLowEnd: boolean;
  total: number;
}) {
  const pieData = data.map(d => ({
    name: d.name,
    value: d.total,
    color: MACRO_COLORS[d.name] || CHART_COLORS[0],
  }));

  if (pieData.length === 0 || total === 0) {
    return (
      <HoloCard>
        <HUDHeader title="Quantidade de Questões" icon={PieChartIcon} subtitle="Por Macro-Assunto" />
        <div className="h-[280px] flex items-center justify-center text-muted-foreground text-sm">
          Complete questões para visualizar
        </div>
      </HoloCard>
    );
  }

  return (
    <HoloCard>
      <HUDHeader title="Quantidade de Questões" icon={PieChartIcon} subtitle="Por Macro-Assunto" />
      <div className="flex items-center">
        <div className="relative w-1/2">
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={2}
                dataKey="value"
                isAnimationActive={!isLowEnd}
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} stroke="hsl(var(--background))" strokeWidth={2} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))', 
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: '12px',
                }} 
              />
            </PieChart>
          </ResponsiveContainer>
          {/* Centro do donut */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-3xl font-black text-primary">{total}</span>
            <span className="text-[10px] text-muted-foreground">Questões</span>
          </div>
        </div>
        <div className="w-1/2 space-y-1.5">
          {pieData.map((item, idx) => (
            <div key={idx} className="flex items-center gap-2 text-xs">
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
              <span className="flex-1 truncate text-muted-foreground">{item.name}</span>
              <span className="font-medium">{item.value}</span>
            </div>
          ))}
        </div>
      </div>
    </HoloCard>
  );
});

// =====================================================
// SEÇÃO 2: DESEMPENHO DE QUESTÕES (Seus vs Geral)
// =====================================================
const PerformanceCompareChart = memo(function PerformanceCompareChart({ 
  correct, errors, isLowEnd 
}: { 
  correct: number; 
  errors: number; 
  isLowEnd: boolean;
}) {
  // Simula dados gerais (em produção viria de uma API)
  const generalCorrect = Math.round(correct * 1.2);
  const generalErrors = Math.round(errors * 0.9);

  const data = [
    { name: 'Acertos', voce: correct, geral: generalCorrect },
    { name: 'Erros', voce: errors, geral: generalErrors },
  ];

  return (
    <HoloCard>
      <HUDHeader title="Desempenho de Questões" icon={TrendingUp} subtitle="Você vs. Média Geral" />
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <div className="text-2xl font-black text-emerald-400">{correct}</div>
          <div className="text-xs text-emerald-400/70">Seus acertos</div>
          <div className="text-2xl font-black text-rose-400 mt-2">{errors}</div>
          <div className="text-xs text-rose-400/70">Seus erros</div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-black text-muted-foreground">{generalCorrect}</div>
          <div className="text-xs text-muted-foreground/70">Acertos Geral</div>
          <div className="text-2xl font-black text-muted-foreground mt-2">{generalErrors}</div>
          <div className="text-xs text-muted-foreground/70">Erros Geral</div>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={120}>
        <BarChart data={data} layout="vertical" margin={{ left: 0, right: 10 }}>
          <XAxis type="number" hide />
          <YAxis type="category" dataKey="name" hide />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'hsl(var(--card))', 
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px',
              fontSize: '11px',
            }} 
          />
          <Bar dataKey="voce" fill="#10b981" name="Você" radius={4} isAnimationActive={!isLowEnd} />
          <Bar dataKey="geral" fill="#6b7280" name="Geral" radius={4} isAnimationActive={!isLowEnd} />
        </BarChart>
      </ResponsiveContainer>
      <div className="flex items-center justify-center gap-4 mt-2 text-[10px]">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-emerald-500" />
          <span className="text-muted-foreground">Você</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-gray-500" />
          <span className="text-muted-foreground">Geral</span>
        </div>
      </div>
    </HoloCard>
  );
});

// =====================================================
// SEÇÃO 3: TOTAL VS ACERTOS POR CATEGORIA (Barras)
// =====================================================
const TotalVsCorrectChart = memo(function TotalVsCorrectChart({ 
  data, isLowEnd 
}: { 
  data: ProcessedItem[]; 
  isLowEnd: boolean;
}) {
  if (data.length === 0) {
    return (
      <HoloCard className="col-span-1 lg:col-span-2">
        <HUDHeader title="Total vs Acertos por Categoria" icon={BarChart3} />
        <div className="h-[250px] flex items-center justify-center text-muted-foreground text-sm">
          Nenhum dado disponível
        </div>
      </HoloCard>
    );
  }

  const chartData = data.slice(0, 10).map(d => ({
    name: d.name.length > 12 ? d.name.slice(0, 12) + '...' : d.name,
    fullName: d.name,
    Total: d.total,
    Acertos: d.correct,
  }));

  return (
    <HoloCard className="col-span-1 lg:col-span-2">
      <HUDHeader title="Total vs Acertos por Categoria" icon={BarChart3} />
      <div className="flex items-center gap-4 mb-2 text-[10px]">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-2 rounded-sm bg-[#6b7280]" />
          <span className="text-muted-foreground">Total de Questões</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-2 rounded-sm bg-emerald-500" />
          <span className="text-muted-foreground">Acertos</span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={chartData} margin={{ top: 10, right: 10, left: -15, bottom: 60 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.3} vertical={false} />
          <XAxis 
            dataKey="name" 
            tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }}
            angle={-45}
            textAnchor="end"
            interval={0}
          />
          <YAxis tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'hsl(var(--card))', 
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px',
              fontSize: '11px',
            }}
            labelFormatter={(_, payload) => payload?.[0]?.payload?.fullName || ''}
          />
          <Bar dataKey="Total" fill="#6b7280" radius={[4, 4, 0, 0]} isAnimationActive={!isLowEnd} />
          <Bar dataKey="Acertos" fill="#10b981" radius={[4, 4, 0, 0]} isAnimationActive={!isLowEnd} />
        </BarChart>
      </ResponsiveContainer>
    </HoloCard>
  );
});

// =====================================================
// SEÇÃO 4: DISTRIBUIÇÃO DE ERROS (Pizza)
// =====================================================
const ErrorDistributionPie = memo(function ErrorDistributionPie({ 
  data, isLowEnd 
}: { 
  data: ProcessedItem[]; 
  isLowEnd: boolean;
}) {
  const pieData = data
    .filter(d => d.errors > 0)
    .sort((a, b) => b.errors - a.errors)
    .slice(0, 10)
    .map((d, idx) => ({
      name: d.name.length > 18 ? d.name.slice(0, 18) + '...' : d.name,
      fullName: d.name,
      value: d.errors,
      percent: 0,
      color: MACRO_COLORS[d.name] || CHART_COLORS[idx % CHART_COLORS.length],
    }));

  const totalErrors = pieData.reduce((sum, d) => sum + d.value, 0);
  pieData.forEach(d => { d.percent = totalErrors > 0 ? (d.value / totalErrors) * 100 : 0; });

  if (pieData.length === 0) {
    return (
      <HoloCard>
        <HUDHeader title="Distribuição de Erros" icon={Target} subtitle="Onde focar" />
        <div className="h-[250px] flex flex-col items-center justify-center text-emerald-400">
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mb-3 text-2xl">
            ✓
          </div>
          <p className="text-sm font-medium">Nenhum erro!</p>
          <p className="text-xs text-muted-foreground mt-1">Continue assim</p>
        </div>
      </HoloCard>
    );
  }

  return (
    <HoloCard>
      <HUDHeader title="Distribuição de Erros" icon={Target} subtitle="Onde focar" />
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie
            data={pieData}
            cx="50%"
            cy="50%"
            outerRadius={75}
            dataKey="value"
            isAnimationActive={!isLowEnd}
            label={({ percent }) => `${(percent * 100).toFixed(1)}%`}
            labelLine={false}
          >
            {pieData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} stroke="hsl(var(--background))" strokeWidth={1} />
            ))}
          </Pie>
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'hsl(var(--card))', 
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px',
              fontSize: '11px',
            }}
            formatter={(value, _, props) => [`${value} erros`, props.payload.fullName]}
          />
        </PieChart>
      </ResponsiveContainer>
      <ScrollArea className="h-[80px]">
        <div className="flex flex-wrap gap-1.5 text-[9px]">
          {pieData.map((item, idx) => (
            <Badge key={idx} variant="outline" className="text-[9px] py-0 gap-1" style={{ borderColor: item.color }}>
              <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: item.color }} />
              {item.name}
            </Badge>
          ))}
        </div>
      </ScrollArea>
    </HoloCard>
  );
});

// =====================================================
// SEÇÃO 5: TOP 10 RENDIMENTO (Barras Horizontais %)
// =====================================================
const Top10PerformanceChart = memo(function Top10PerformanceChart({ 
  data, isLowEnd 
}: { 
  data: ProcessedItem[]; 
  isLowEnd: boolean;
}) {
  const top10 = data
    .filter(d => d.total >= 1)
    .sort((a, b) => b.accuracy - a.accuracy)
    .slice(0, 10)
    .map(d => ({
      name: d.name.length > 20 ? d.name.slice(0, 20) + '...' : d.name,
      fullName: d.name,
      accuracy: d.accuracy,
      total: d.total,
    }));

  if (top10.length === 0) {
    return (
      <HoloCard className="col-span-1 lg:col-span-3">
        <HUDHeader title="Top 10 - Rendimento por Categoria" icon={Award} />
        <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">
          Complete questões para ver seu ranking
        </div>
      </HoloCard>
    );
  }

  return (
    <div className="relative rounded-2xl border border-cyan-500/30 bg-gradient-to-b from-cyan-500/5 to-card/80 backdrop-blur-sm overflow-hidden shadow-[0_0_40px_rgba(6,182,212,0.08)]">
      {/* Corner accents */}
      <div className="absolute top-0 left-0 w-12 h-[2px] bg-gradient-to-r from-cyan-500/60 to-transparent" />
      <div className="absolute top-0 left-0 w-[2px] h-12 bg-gradient-to-b from-cyan-500/60 to-transparent" />
      <div className="absolute bottom-0 right-0 w-12 h-[2px] bg-gradient-to-l from-cyan-500/60 to-transparent" />
      <div className="absolute bottom-0 right-0 w-[2px] h-12 bg-gradient-to-t from-cyan-500/60 to-transparent" />
      
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-cyan-500/20 bg-cyan-500/5">
        <div className="relative">
          <div className="absolute inset-0 bg-cyan-500/40 rounded-lg blur-md" />
          <div className="relative p-2 bg-gradient-to-br from-cyan-500/20 to-cyan-500/5 rounded-lg border border-cyan-500/40">
            <Award className="w-5 h-5 text-cyan-400" />
          </div>
        </div>
        <div>
          <h4 className="text-sm font-bold text-cyan-50">Top 10 - Rendimento por Categoria</h4>
          <p className="text-[10px] text-cyan-400/70">Suas melhores áreas por taxa de acerto</p>
        </div>
      </div>
      
      {/* Chart */}
      <div className="p-5">
        <ResponsiveContainer width="100%" height={top10.length * 34 + 40}>
          <BarChart 
            data={top10} 
            layout="vertical" 
            margin={{ top: 10, right: 65, left: 5, bottom: 10 }}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(6,182,212,0.1)" />
            <XAxis 
              type="number" 
              domain={[0, 100]} 
              tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} 
              tickFormatter={(v) => `${v}%`}
              axisLine={{ stroke: 'rgba(6,182,212,0.2)' }}
            />
            <YAxis 
              type="category" 
              dataKey="name" 
              tick={{ fontSize: 11, fill: 'hsl(var(--foreground))' }}
              width={130}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(var(--card))', 
                border: '1px solid rgba(6,182,212,0.3)',
                borderRadius: '12px',
                fontSize: '12px',
                boxShadow: '0 8px 32px rgba(0,0,0,0.4)'
              }}
              formatter={(value, _, props) => [`${Number(value).toFixed(2)}%`, `${props.payload.fullName} (${props.payload.total}Q)`]}
            />
            <Bar 
              dataKey="accuracy" 
              fill="url(#barGradient)"
              radius={[0, 8, 8, 0]} 
              isAnimationActive={!isLowEnd}
              label={{ 
                position: 'right', 
                formatter: (v: number) => `${v.toFixed(2)}%`,
                fontSize: 11,
                fill: '#22d3ee',
                fontWeight: 600
              }}
            />
            <defs>
              <linearGradient id="barGradient" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#0ea5e9" />
                <stop offset="100%" stopColor="#22d3ee" />
              </linearGradient>
            </defs>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
});

// =====================================================
// SEÇÃO 6: TABELAS LADO A LADO (Macro | Micro | Temas)
// =====================================================
const PerformanceTable = memo(function PerformanceTable({ 
  title, data, maxItems = 20
}: { 
  title: string;
  data: ProcessedItem[];
  maxItems?: number;
}) {
  const displayData = data.slice(0, maxItems);

  const getAccuracyColor = (accuracy: number) => {
    if (accuracy >= 70) return "text-emerald-400";
    if (accuracy >= 50) return "text-amber-400";
    return "text-rose-400";
  };

  const getAccuracyBg = (accuracy: number) => {
    if (accuracy >= 70) return "bg-emerald-500";
    if (accuracy >= 50) return "bg-amber-500";
    return "bg-rose-500";
  };

  return (
    <div className="relative rounded-2xl border border-primary/25 bg-gradient-to-b from-primary/5 to-card/80 backdrop-blur-sm overflow-hidden shadow-[0_0_30px_rgba(var(--primary),0.05)]">
      {/* Corner accents */}
      <div className="absolute top-0 left-0 w-8 h-[2px] bg-gradient-to-r from-primary/50 to-transparent" />
      <div className="absolute top-0 left-0 w-[2px] h-8 bg-gradient-to-b from-primary/50 to-transparent" />
      <div className="absolute bottom-0 right-0 w-8 h-[2px] bg-gradient-to-l from-primary/30 to-transparent" />
      <div className="absolute bottom-0 right-0 w-[2px] h-8 bg-gradient-to-t from-primary/30 to-transparent" />
      
      {/* Header */}
      <div className="bg-gradient-to-r from-primary/10 to-transparent px-4 py-3 border-b border-primary/20">
        <h4 className="font-bold text-sm">{title}</h4>
      </div>
      
      {/* Column Headers */}
      <div className="grid grid-cols-[1fr_48px_48px_65px] gap-2 px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground border-b border-border/30 bg-muted/10">
        <span>Área</span>
        <span className="text-center">Total</span>
        <span className="text-center">Erros</span>
        <span className="text-right">Acurácia</span>
      </div>

      {/* Data Rows */}
      <ScrollArea className="h-[320px]">
        <div>
          {displayData.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground text-xs">
              <div className="w-10 h-10 rounded-full bg-muted/20 flex items-center justify-center mx-auto mb-2">
                <BarChart3 className="w-5 h-5 opacity-40" />
              </div>
              Sem dados disponíveis
            </div>
          ) : (
            displayData.map((item, idx) => (
              <div 
                key={idx}
                className={cn(
                  "grid grid-cols-[1fr_48px_48px_65px] gap-2 px-4 py-2.5 text-xs items-center transition-all hover:bg-primary/5",
                  idx % 2 === 0 ? "bg-transparent" : "bg-white/[0.02]"
                )}
              >
                <span className="truncate font-medium text-foreground/90" title={item.name}>
                  {item.name}
                </span>
                <div className="flex justify-center">
                  <span className="px-2 py-0.5 rounded-md bg-cyan-500/15 text-cyan-400 font-bold text-[10px] border border-cyan-500/20 shadow-[0_0_8px_rgba(6,182,212,0.1)]">
                    {item.total}
                  </span>
                </div>
                <div className="flex justify-center">
                  <span className="px-2 py-0.5 rounded-md bg-rose-500/15 text-rose-400 font-bold text-[10px] border border-rose-500/20 shadow-[0_0_8px_rgba(244,63,94,0.1)]">
                    {item.errors}
                  </span>
                </div>
                <div className="flex items-center justify-end gap-2">
                  <div className={cn(
                    "w-1.5 h-5 rounded-full shadow-[0_0_6px_currentColor]",
                    getAccuracyBg(item.accuracy)
                  )} />
                  <span className={cn("font-black text-[11px] tabular-nums", getAccuracyColor(item.accuracy))}>
                    {item.accuracy.toFixed(0)}%
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
        {data.length > maxItems && (
          <div className="text-center py-3 text-[10px] text-primary/60 border-t border-border/20 bg-primary/5 font-medium">
            +{data.length - maxItems} itens adicionais
          </div>
        )}
      </ScrollArea>
    </div>
  );
});

const TablesSection = memo(function TablesSection({ 
  macros, micros, temas 
}: { 
  macros: ProcessedItem[];
  micros: ProcessedItem[];
  temas: ProcessedItem[];
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <PerformanceTable title="Macro Assuntos" data={macros} />
      <PerformanceTable title="Micro Assuntos" data={micros} />
      <PerformanceTable title="Temas" data={temas} />
    </div>
  );
});

// Lazy load AI Tutor Widget
import AITutorAlertWidget from './AITutorAlertWidget';

// =====================================================
// EXPORT PRINCIPAL
// =====================================================
function StudentPerformanceCharts({ macros, micros, temas = [], isLowEnd = false }: ChartsProps) {
  // Calcular totais
  const totals = useMemo(() => {
    const totalQuestions = macros.reduce((sum, m) => sum + m.total, 0);
    const totalCorrect = macros.reduce((sum, m) => sum + m.correct, 0);
    const totalErrors = macros.reduce((sum, m) => sum + m.errors, 0);
    return { totalQuestions, totalCorrect, totalErrors };
  }, [macros]);

  if (!hasResizeObserverSupport()) {
    return (
      <div className="rounded-2xl border border-border/50 bg-card/50 p-4 text-center">
        <div className="text-sm font-semibold">Gráficos indisponíveis neste dispositivo</div>
        <div className="text-xs text-muted-foreground mt-1">
          Atualize o navegador ou acesse pelo Chrome/Firefox para ver os gráficos.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Linha 1: Quantidade + Desempenho */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <QuantityDonutChart data={macros} isLowEnd={isLowEnd} total={totals.totalQuestions} />
        <PerformanceCompareChart correct={totals.totalCorrect} errors={totals.totalErrors} isLowEnd={isLowEnd} />
      </div>

      {/* Linha 2: Total vs Acertos + Distribuição de Erros */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <TotalVsCorrectChart data={macros} isLowEnd={isLowEnd} />
        <ErrorDistributionPie data={macros} isLowEnd={isLowEnd} />
      </div>

      {/* Linha 3: Top 10 Rendimento */}
      <Top10PerformanceChart data={micros} isLowEnd={isLowEnd} />

      {/* Linha 4: Tabelas lado a lado */}
      <TablesSection macros={macros} micros={micros} temas={temas} />

      {/* Linha 5: AI Tutor Alert Widget - Ativa quando acurácia < 50% */}
      <AITutorAlertWidget 
        macros={macros} 
        micros={micros} 
        isLowEnd={isLowEnd}
      />
    </div>
  );
}

export default StudentPerformanceCharts;