// =====================================================
// StudentPerformanceAnalytics - Métricas de Desempenho do Aluno
// Design: YEAR 2300 CINEMATIC HUD - Iron Man Style
// Performance: Otimizado para 5000+ usuários
// =====================================================

import { useMemo, memo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { 
  useStudentTaxonomyPerformance, 
  useStudentPerformanceStats 
} from "@/hooks/student-performance";
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend, RadarChart, Radar, PolarGrid, 
  PolarAngleAxis, PolarRadiusAxis, AreaChart, Area
} from "recharts";
import { 
  BarChart3, Target, TrendingUp, Award, Zap, BookOpen, 
  FlaskConical, Activity, Sparkles, ChevronRight, Atom,
  Brain, Beaker, Leaf, Dna
} from "lucide-react";

// Cores holográficas futuristas
const HOLOGRAPHIC_COLORS = {
  blue: "from-blue-500 via-cyan-400 to-blue-600",
  emerald: "from-emerald-500 via-teal-400 to-emerald-600",
  violet: "from-violet-500 via-purple-400 to-violet-600",
  amber: "from-amber-500 via-orange-400 to-amber-600",
  rose: "from-rose-500 via-pink-400 to-rose-600",
  cyan: "from-cyan-500 via-sky-400 to-cyan-600",
};

const CHART_COLORS = [
  "#06b6d4", // cyan
  "#8b5cf6", // violet
  "#10b981", // emerald
  "#f59e0b", // amber
  "#ec4899", // pink
  "#3b82f6", // blue
  "#ef4444", // red
  "#6366f1", // indigo
];

const MACRO_ICONS: Record<string, typeof FlaskConical> = {
  "Química Geral": Atom,
  "Físico-Química": Zap,
  "Química Orgânica": Beaker,
  "Química Ambiental": Leaf,
  "Bioquímica": Dna,
};

// =====================================================
// Holographic Stat Orb - Estilo Iron Man HUD
// =====================================================
interface StatOrbProps {
  label: string;
  value: string | number;
  subValue?: string;
  icon: typeof BookOpen;
  gradient: string;
  delay?: number;
}

const StatOrb = memo(function StatOrb({ label, value, subValue, icon: Icon, gradient, delay = 0 }: StatOrbProps) {
  return (
    <div 
      className="relative group animate-fade-in"
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Glow backdrop */}
      <div className={cn(
        "absolute inset-0 rounded-2xl blur-xl opacity-30 group-hover:opacity-50 transition-opacity duration-500",
        `bg-gradient-to-br ${gradient}`
      )} />
      
      {/* Main orb */}
      <div className={cn(
        "relative overflow-hidden rounded-2xl p-4 sm:p-5",
        "bg-gradient-to-br",
        gradient,
        "border border-white/20",
        "shadow-[0_0_30px_rgba(0,0,0,0.3)]",
        "backdrop-blur-xl"
      )}>
        {/* Holographic scan line */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/10 via-transparent to-transparent opacity-50" />
        
        {/* Floating icon */}
        <div className="absolute top-3 right-3 opacity-30">
          <Icon className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
        </div>
        
        {/* Arc reactor ring */}
        <div className="absolute -bottom-8 -right-8 w-24 h-24 rounded-full border border-white/10 opacity-30" />
        <div className="absolute -bottom-6 -right-6 w-20 h-20 rounded-full border border-white/20 opacity-20" />
        
        {/* Content */}
        <div className="relative z-10">
          <div className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            {typeof value === 'number' ? value.toLocaleString('pt-BR') : value}
          </div>
          {subValue && (
            <div className="text-xs text-white/70 mt-0.5">{subValue}</div>
          )}
          <div className="text-xs sm:text-sm font-medium text-white/90 mt-1.5 uppercase tracking-wider">
            {label}
          </div>
        </div>
        
        {/* Energy pulse */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-white/50 to-transparent animate-pulse" />
      </div>
    </div>
  );
});

// =====================================================
// HUD Section Header
// =====================================================
interface HUDHeaderProps {
  title: string;
  icon: typeof BarChart3;
  subtitle?: string;
}

const HUDHeader = memo(function HUDHeader({ title, icon: Icon, subtitle }: HUDHeaderProps) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className="relative">
        <div className="absolute inset-0 bg-primary/30 rounded-lg blur-md" />
        <div className="relative p-2 bg-gradient-to-br from-primary/20 to-primary/5 rounded-lg border border-primary/30">
          <Icon className="w-5 h-5 text-primary" />
        </div>
      </div>
      <div>
        <h3 className="text-base font-bold text-foreground tracking-tight">{title}</h3>
        {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
      </div>
      <div className="flex-1 h-px bg-gradient-to-r from-primary/30 via-primary/10 to-transparent ml-2" />
    </div>
  );
});

// =====================================================
// Holographic Card Container
// =====================================================
interface HoloCardProps {
  children: React.ReactNode;
  className?: string;
}

const HoloCard = memo(function HoloCard({ children, className }: HoloCardProps) {
  return (
    <div className={cn(
      "relative overflow-hidden rounded-2xl",
      "bg-gradient-to-br from-card/80 via-card/60 to-card/40",
      "backdrop-blur-xl border border-border/50",
      "shadow-[0_8px_32px_rgba(0,0,0,0.2)]",
      className
    )}>
      {/* Corner accents */}
      <div className="absolute top-0 left-0 w-8 h-8 border-l-2 border-t-2 border-primary/40 rounded-tl-2xl" />
      <div className="absolute top-0 right-0 w-8 h-8 border-r-2 border-t-2 border-primary/40 rounded-tr-2xl" />
      <div className="absolute bottom-0 left-0 w-8 h-8 border-l-2 border-b-2 border-primary/40 rounded-bl-2xl" />
      <div className="absolute bottom-0 right-0 w-8 h-8 border-r-2 border-b-2 border-primary/40 rounded-br-2xl" />
      
      {/* Content */}
      <div className="relative z-10 p-4 sm:p-5">
        {children}
      </div>
    </div>
  );
});

// =====================================================
// Performance Table - Futuristic Design
// =====================================================
interface PerformanceTableProps {
  title: string;
  icon: typeof BarChart3;
  data: Array<{
    name: string;
    total: number;
    correct: number;
    errors: number;
    accuracy: number;
  }>;
  isLoading: boolean;
  showMacroIcons?: boolean;
}

const PerformanceTable = memo(function PerformanceTable({ 
  title, icon, data, isLoading, showMacroIcons = false 
}: PerformanceTableProps) {
  if (isLoading) {
    return (
      <HoloCard>
        <Skeleton className="h-5 w-32 mb-4" />
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-12 w-full mb-2 rounded-lg" />
        ))}
      </HoloCard>
    );
  }

  if (data.length === 0) {
    return (
      <HoloCard>
        <HUDHeader title={title} icon={icon} />
        <div className="text-center py-8 text-muted-foreground">
          <Sparkles className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Nenhum dado disponível</p>
        </div>
      </HoloCard>
    );
  }

  return (
    <HoloCard>
      <HUDHeader title={title} icon={icon} subtitle={`${data.length} ${data.length === 1 ? 'item' : 'itens'}`} />
      
      {/* Header Row */}
      <div className="grid grid-cols-[1fr_50px_50px_65px] gap-2 px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b border-border/30 bg-muted/20 rounded-t-lg">
        <span>Área</span>
        <span className="text-center">Total</span>
        <span className="text-center">Erros</span>
        <span className="text-right">%</span>
      </div>
      
      {/* Data Rows */}
      <div className="max-h-[280px] overflow-y-auto scrollbar-thin scrollbar-thumb-primary/20">
        {data.map((row, i) => {
          const MacroIcon = showMacroIcons ? MACRO_ICONS[row.name] || FlaskConical : null;
          const accuracyColor = row.accuracy >= 70 
            ? "text-emerald-400" 
            : row.accuracy >= 50 
              ? "text-amber-400" 
              : "text-rose-400";
          const accuracyBg = row.accuracy >= 70 
            ? "bg-emerald-500" 
            : row.accuracy >= 50 
              ? "bg-amber-500" 
              : "bg-rose-500";
          
          return (
            <div
              key={i}
              className={cn(
                "grid grid-cols-[1fr_50px_50px_65px] gap-2 px-3 py-3",
                "border-b border-border/20 last:border-0",
                "hover:bg-primary/5 transition-colors duration-200",
                "group"
              )}
            >
              <div className="flex items-center gap-2 min-w-0">
                {MacroIcon && (
                  <MacroIcon className="w-4 h-4 text-primary flex-shrink-0" />
                )}
                <span className="truncate text-sm font-medium group-hover:text-primary transition-colors">
                  {row.name}
                </span>
              </div>
              <div className="flex items-center justify-center">
                <span className="inline-flex items-center justify-center min-w-[28px] px-1.5 py-0.5 bg-blue-500/20 text-blue-400 rounded text-xs font-bold">
                  {row.total}
                </span>
              </div>
              <div className="flex items-center justify-center">
                <span className="inline-flex items-center justify-center min-w-[28px] px-1.5 py-0.5 bg-rose-500/20 text-rose-400 rounded text-xs font-bold">
                  {row.errors}
                </span>
              </div>
              <div className="flex items-center justify-end gap-1.5">
                <span className={cn("font-bold text-sm", accuracyColor)}>
                  {row.accuracy.toFixed(0)}%
                </span>
                <div className={cn("w-1.5 h-5 rounded-full", accuracyBg, "shadow-[0_0_6px_currentColor]")} />
              </div>
            </div>
          );
        })}
      </div>
    </HoloCard>
  );
});

// =====================================================
// Radar Chart - Holographic Style
// =====================================================
interface RadarChartCardProps {
  data: Array<{ name: string; accuracy: number; total: number }>;
  isLoading: boolean;
}

const RadarChartCard = memo(function RadarChartCard({ data, isLoading }: RadarChartCardProps) {
  if (isLoading) {
    return (
      <HoloCard>
        <Skeleton className="h-5 w-48 mb-4" />
        <Skeleton className="h-[250px] w-full rounded-lg" />
      </HoloCard>
    );
  }

  if (data.length === 0) {
    return (
      <HoloCard>
        <HUDHeader title="Radar de Desempenho" icon={Activity} subtitle="Performance por Macro" />
        <div className="text-center py-12 text-muted-foreground">
          <Activity className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Complete questões para ver seu radar</p>
        </div>
      </HoloCard>
    );
  }

  const radarData = data.slice(0, 6).map(d => ({
    subject: d.name.length > 12 ? d.name.slice(0, 12) + '...' : d.name,
    A: d.accuracy,
    fullMark: 100,
  }));

  return (
    <HoloCard>
      <HUDHeader title="Radar de Desempenho" icon={Activity} subtitle="Performance por Macro" />
      <div className="relative">
        <ResponsiveContainer width="100%" height={280}>
          <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
            <PolarGrid stroke="hsl(var(--border))" strokeOpacity={0.3} />
            <PolarAngleAxis 
              dataKey="subject" 
              tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
            />
            <PolarRadiusAxis 
              angle={30} 
              domain={[0, 100]} 
              tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }}
            />
            <Radar
              name="Acurácia"
              dataKey="A"
              stroke="#06b6d4"
              fill="#06b6d4"
              fillOpacity={0.4}
              strokeWidth={2}
            />
            <Tooltip
              contentStyle={{ 
                backgroundColor: 'hsl(var(--card))', 
                border: '1px solid hsl(var(--border))',
                borderRadius: '12px',
                boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
              }}
              formatter={(value) => [`${Number(value).toFixed(1)}%`, 'Acurácia']}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </HoloCard>
  );
});

// =====================================================
// Bar Chart - Holographic
// =====================================================
interface BarChartCardProps {
  data: Array<{ name: string; total: number; correct: number }>;
  isLoading: boolean;
}

const BarChartCard = memo(function BarChartCard({ data, isLoading }: BarChartCardProps) {
  if (isLoading) {
    return (
      <HoloCard>
        <Skeleton className="h-5 w-48 mb-4" />
        <Skeleton className="h-[250px] w-full rounded-lg" />
      </HoloCard>
    );
  }

  if (data.length === 0) {
    return (
      <HoloCard>
        <HUDHeader title="Total vs Acertos" icon={BarChart3} subtitle="Comparativo por Macro" />
        <div className="text-center py-12 text-muted-foreground">
          <BarChart3 className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Nenhum dado disponível</p>
        </div>
      </HoloCard>
    );
  }

  const chartData = data.slice(0, 5).map(d => ({
    name: d.name.length > 10 ? d.name.slice(0, 10) + '...' : d.name,
    Total: d.total,
    Acertos: d.correct,
  }));

  return (
    <HoloCard>
      <HUDHeader title="Total vs Acertos" icon={BarChart3} subtitle="Comparativo por Macro" />
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={chartData} margin={{ top: 10, right: 10, left: -15, bottom: 50 }}>
          <defs>
            <linearGradient id="barGradientBlue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity={1} />
              <stop offset="100%" stopColor="#1d4ed8" stopOpacity={0.8} />
            </linearGradient>
            <linearGradient id="barGradientGreen" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity={1} />
              <stop offset="100%" stopColor="#059669" stopOpacity={0.8} />
            </linearGradient>
          </defs>
          <XAxis 
            dataKey="name" 
            tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
            angle={-35}
            textAnchor="end"
            interval={0}
          />
          <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'hsl(var(--card))', 
              border: '1px solid hsl(var(--border))',
              borderRadius: '12px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
            }} 
          />
          <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
          <Bar dataKey="Total" fill="url(#barGradientBlue)" radius={[6, 6, 0, 0]} />
          <Bar dataKey="Acertos" fill="url(#barGradientGreen)" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </HoloCard>
  );
});

// =====================================================
// Pie Chart - Holographic Donut
// =====================================================
interface PieChartCardProps {
  data: Array<{ name: string; errors: number }>;
  isLoading: boolean;
}

const PieChartCard = memo(function PieChartCard({ data, isLoading }: PieChartCardProps) {
  if (isLoading) {
    return (
      <HoloCard>
        <Skeleton className="h-5 w-40 mb-4" />
        <Skeleton className="h-[250px] w-full rounded-lg" />
      </HoloCard>
    );
  }

  const pieData = data
    .filter(d => d.errors > 0)
    .slice(0, 6)
    .map(d => ({
      name: d.name.length > 12 ? d.name.slice(0, 12) + '...' : d.name,
      value: d.errors,
    }));

  if (pieData.length === 0) {
    return (
      <HoloCard>
        <HUDHeader title="Distribuição de Erros" icon={Target} subtitle="Onde focar" />
        <div className="text-center py-12">
          <div className="relative w-20 h-20 mx-auto mb-4">
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-emerald-500/30 to-emerald-600/10 animate-pulse" />
            <div className="absolute inset-2 rounded-full bg-card flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-emerald-400" />
            </div>
          </div>
          <p className="text-sm font-medium text-emerald-400">Nenhum erro registrado!</p>
          <p className="text-xs text-muted-foreground mt-1">Continue assim 🎉</p>
        </div>
      </HoloCard>
    );
  }

  return (
    <HoloCard>
      <HUDHeader title="Distribuição de Erros" icon={Target} subtitle="Onde focar" />
      <ResponsiveContainer width="100%" height={260}>
        <PieChart>
          <defs>
            {CHART_COLORS.map((color, i) => (
              <linearGradient key={i} id={`pieGradient${i}`} x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={1} />
                <stop offset="100%" stopColor={color} stopOpacity={0.6} />
              </linearGradient>
            ))}
          </defs>
          <Pie
            data={pieData}
            cx="50%"
            cy="50%"
            innerRadius={50}
            outerRadius={85}
            paddingAngle={3}
            dataKey="value"
            label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
            labelLine={false}
          >
            {pieData.map((_, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={`url(#pieGradient${index % CHART_COLORS.length})`}
                stroke="hsl(var(--background))"
                strokeWidth={2}
              />
            ))}
          </Pie>
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'hsl(var(--card))', 
              border: '1px solid hsl(var(--border))',
              borderRadius: '12px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
            }} 
          />
          <Legend 
            wrapperStyle={{ fontSize: '10px' }}
            formatter={(value) => <span className="text-muted-foreground text-xs">{value}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
    </HoloCard>
  );
});

// =====================================================
// Area Chart - Evolution Trend
// =====================================================
interface TrendChartCardProps {
  data: Array<{ name: string; accuracy: number }>;
  isLoading: boolean;
}

const TrendChartCard = memo(function TrendChartCard({ data, isLoading }: TrendChartCardProps) {
  if (isLoading) {
    return (
      <HoloCard className="col-span-full">
        <Skeleton className="h-5 w-48 mb-4" />
        <Skeleton className="h-[200px] w-full rounded-lg" />
      </HoloCard>
    );
  }

  if (data.length < 2) {
    return (
      <HoloCard className="col-span-full">
        <HUDHeader title="Evolução do Rendimento" icon={TrendingUp} subtitle="Top 10 categorias" />
        <div className="text-center py-8 text-muted-foreground">
          <TrendingUp className="w-8 h-8 mx-auto mb-2 opacity-30" />
          <p className="text-sm">Complete mais questões para ver a evolução</p>
        </div>
      </HoloCard>
    );
  }

  const chartData = data.slice(0, 10).map((d, i) => ({
    name: d.name.length > 15 ? d.name.slice(0, 15) + '...' : d.name,
    Rendimento: d.accuracy,
    index: i + 1,
  }));

  return (
    <HoloCard className="col-span-full">
      <HUDHeader title="Ranking de Rendimento" icon={TrendingUp} subtitle="Top 10 categorias por acurácia" />
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 50 }}>
          <defs>
            <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.6} />
              <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <XAxis 
            dataKey="name" 
            tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }}
            angle={-45}
            textAnchor="end"
            interval={0}
          />
          <YAxis 
            domain={[0, 100]} 
            tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} 
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'hsl(var(--card))', 
              border: '1px solid hsl(var(--border))',
              borderRadius: '12px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
            }}
            formatter={(value) => [`${Number(value).toFixed(1)}%`, 'Rendimento']}
          />
          <Area 
            type="monotone" 
            dataKey="Rendimento" 
            stroke="#8b5cf6" 
            strokeWidth={3}
            fill="url(#areaGradient)" 
          />
        </AreaChart>
      </ResponsiveContainer>
    </HoloCard>
  );
});

// =====================================================
// Componente Principal
// =====================================================
export function StudentPerformanceAnalytics() {
  const { user } = useAuth();
  
  const { data: taxonomyData, isLoading: taxonomyLoading } = useStudentTaxonomyPerformance(user?.id);
  const { data: stats, isLoading: statsLoading } = useStudentPerformanceStats(user?.id);

  const isLoading = taxonomyLoading || statsLoading;

  // Processar dados para tabelas e gráficos
  const processedData = useMemo(() => {
    if (!taxonomyData?.array) {
      return {
        macroData: [],
        microData: [],
        temaData: [],
        totalQuestions: 0,
        totalCorrect: 0,
        totalErrors: 0,
        overallAccuracy: 0,
      };
    }

    const macroData: Array<{ name: string; total: number; correct: number; errors: number; accuracy: number }> = [];
    const microData: Array<{ name: string; total: number; correct: number; errors: number; accuracy: number }> = [];
    const temaData: Array<{ name: string; total: number; correct: number; errors: number; accuracy: number }> = [];

    let totalQuestions = 0;
    let totalCorrect = 0;

    // Processar hierarquia - TaxonomyNode tem: name, totalAttempts, correctAttempts, accuracyPercent, children (Map)
    taxonomyData.array.forEach((macro) => {
      totalQuestions += macro.totalAttempts;
      totalCorrect += macro.correctAttempts;

      macroData.push({
        name: macro.name,
        total: macro.totalAttempts,
        correct: macro.correctAttempts,
        errors: macro.totalAttempts - macro.correctAttempts,
        accuracy: macro.accuracyPercent,
      });

      // Processar micros (children é um Map)
      if (macro.children && macro.children.size > 0) {
        macro.children.forEach((micro) => {
          microData.push({
            name: micro.name,
            total: micro.totalAttempts,
            correct: micro.correctAttempts,
            errors: micro.totalAttempts - micro.correctAttempts,
            accuracy: micro.accuracyPercent,
          });

          // Processar temas
          if (micro.children && micro.children.size > 0) {
            micro.children.forEach((tema) => {
              temaData.push({
                name: tema.name,
                total: tema.totalAttempts,
                correct: tema.correctAttempts,
                errors: tema.totalAttempts - tema.correctAttempts,
                accuracy: tema.accuracyPercent,
              });
            });
          }
        });
      }
    });

    const totalErrors = totalQuestions - totalCorrect;
    const overallAccuracy = totalQuestions > 0 ? (totalCorrect / totalQuestions) * 100 : 0;

    // Ordenar por rendimento (accuracy) decrescente
    const sortedMicro = [...microData].sort((a, b) => b.accuracy - a.accuracy);
    const sortedTema = [...temaData].sort((a, b) => b.accuracy - a.accuracy);

    return {
      macroData,
      microData: sortedMicro,
      temaData: sortedTema,
      totalQuestions,
      totalCorrect,
      totalErrors,
      overallAccuracy,
    };
  }, [taxonomyData]);

  // Usar stats se disponível, senão usar dados calculados
  const displayStats = {
    totalQuestions: stats?.totalQuestions ?? processedData.totalQuestions,
    totalCorrect: stats?.totalCorrect ?? processedData.totalCorrect,
    totalErrors: (stats?.totalQuestions ?? processedData.totalQuestions) - (stats?.totalCorrect ?? processedData.totalCorrect),
    overallAccuracy: stats?.overallAccuracy ?? processedData.overallAccuracy,
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Section Header */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-transparent rounded-2xl blur-2xl" />
        <div className="relative flex items-center gap-4 p-4 rounded-2xl border border-border/50 bg-card/30 backdrop-blur">
          <div className="relative">
            <div className="absolute inset-0 bg-primary/30 rounded-xl blur-lg animate-pulse" />
            <div className="relative p-3 bg-gradient-to-br from-primary/20 to-primary/5 rounded-xl border border-primary/30">
              <Brain className="w-7 h-7 text-primary" />
            </div>
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-foreground tracking-tight">
              Análise de Desempenho
            </h2>
            <p className="text-sm text-muted-foreground">
              Métricas em tempo real • Atualiza automaticamente
            </p>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Sincronizado</span>
          </div>
        </div>
      </div>

      {/* Stats Orbs - 4 principais */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatOrb
          label="Total de Questões"
          value={displayStats.totalQuestions}
          icon={BookOpen}
          gradient={HOLOGRAPHIC_COLORS.blue}
          delay={0}
        />
        <StatOrb
          label="Acertos"
          value={displayStats.totalCorrect}
          subValue={displayStats.totalQuestions > 0 ? `de ${displayStats.totalQuestions}` : undefined}
          icon={Target}
          gradient={HOLOGRAPHIC_COLORS.emerald}
          delay={100}
        />
        <StatOrb
          label="Erros"
          value={displayStats.totalErrors}
          icon={TrendingUp}
          gradient={HOLOGRAPHIC_COLORS.rose}
          delay={200}
        />
        <StatOrb
          label="Acurácia Geral"
          value={`${displayStats.overallAccuracy.toFixed(1)}%`}
          icon={Award}
          gradient={HOLOGRAPHIC_COLORS.violet}
          delay={300}
        />
      </div>

      {/* Charts Row 1: Radar + Bar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <RadarChartCard 
          data={processedData.macroData.map(d => ({ name: d.name, accuracy: d.accuracy, total: d.total }))} 
          isLoading={isLoading} 
        />
        <BarChartCard 
          data={processedData.macroData} 
          isLoading={isLoading} 
        />
      </div>

      {/* Charts Row 2: Pie + Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <PieChartCard 
          data={processedData.macroData.map(d => ({ name: d.name, errors: d.errors }))} 
          isLoading={isLoading} 
        />
        <TrendChartCard 
          data={processedData.microData.slice(0, 10).map(d => ({ name: d.name, accuracy: d.accuracy }))} 
          isLoading={isLoading} 
        />
      </div>

      {/* Tables - 3 níveis */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <PerformanceTable
          title="Por Macro"
          icon={FlaskConical}
          data={processedData.macroData}
          isLoading={isLoading}
          showMacroIcons
        />
        <PerformanceTable
          title="Por Micro"
          icon={Beaker}
          data={processedData.microData}
          isLoading={isLoading}
        />
        <PerformanceTable
          title="Por Tema"
          icon={BookOpen}
          data={processedData.temaData}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}

export default StudentPerformanceAnalytics;
