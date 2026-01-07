// =====================================================
// StudentPerformanceCharts - Lazy Loaded Charts
// Performance: Carrega apenas quando visível
// =====================================================

import { memo } from "react";
import { cn } from "@/lib/utils";
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend, RadarChart, Radar, PolarGrid, 
  PolarAngleAxis, PolarRadiusAxis
} from "recharts";
import { BarChart3, Target, Activity } from "lucide-react";

// =====================================================
// CONSTANTES
// =====================================================
const CHART_COLORS = [
  "#06b6d4", "#8b5cf6", "#10b981", "#f59e0b", "#ec4899", "#3b82f6"
];

interface ProcessedItem {
  name: string;
  total: number;
  correct: number;
  errors: number;
  accuracy: number;
}

interface ChartsProps {
  macros: ProcessedItem[];
  micros: ProcessedItem[];
  isLowEnd?: boolean;
}

// =====================================================
// HUD Header para seções
// =====================================================
const HUDHeader = memo(function HUDHeader({ 
  title, subtitle, icon: Icon 
}: { 
  title: string; 
  subtitle?: string; 
  icon: typeof BarChart3 
}) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className="p-2 bg-primary/10 rounded-lg border border-primary/20">
        <Icon className="w-4 h-4 text-primary" />
      </div>
      <div className="flex-1">
        <h4 className="text-sm font-semibold">{title}</h4>
        {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
      </div>
    </div>
  );
});

// =====================================================
// HoloCard Container
// =====================================================
const HoloCard = memo(function HoloCard({ 
  children, className 
}: { 
  children: React.ReactNode; 
  className?: string 
}) {
  return (
    <div className={cn(
      "rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm p-4",
      className
    )}>
      {children}
    </div>
  );
});

// =====================================================
// RADAR CHART
// =====================================================
const RadarChartSection = memo(function RadarChartSection({ 
  data, isLowEnd 
}: { 
  data: ProcessedItem[]; 
  isLowEnd: boolean 
}) {
  if (data.length === 0) {
    return (
      <HoloCard>
        <HUDHeader title="Radar de Desempenho" icon={Activity} subtitle="Por Macro" />
        <div className="h-[250px] flex items-center justify-center text-muted-foreground text-sm">
          Complete questões para visualizar
        </div>
      </HoloCard>
    );
  }

  const radarData = data.slice(0, 6).map(d => ({
    subject: d.name.length > 10 ? d.name.slice(0, 10) + '...' : d.name,
    A: d.accuracy,
    fullMark: 100,
  }));

  return (
    <HoloCard>
      <HUDHeader title="Radar de Desempenho" icon={Activity} subtitle="Por Macro" />
      <ResponsiveContainer width="100%" height={250}>
        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
          <PolarGrid stroke="hsl(var(--border))" strokeOpacity={0.3} />
          <PolarAngleAxis 
            dataKey="subject" 
            tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }}
          />
          <PolarRadiusAxis 
            angle={30} 
            domain={[0, 100]} 
            tick={{ fontSize: 8, fill: 'hsl(var(--muted-foreground))' }}
          />
          <Radar
            name="Acurácia"
            dataKey="A"
            stroke="#06b6d4"
            fill="#06b6d4"
            fillOpacity={0.35}
            strokeWidth={2}
            isAnimationActive={!isLowEnd}
          />
          <Tooltip
            contentStyle={{ 
              backgroundColor: 'hsl(var(--card))', 
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px',
              fontSize: '12px',
            }}
            formatter={(value) => [`${Number(value).toFixed(1)}%`, 'Acurácia']}
          />
        </RadarChart>
      </ResponsiveContainer>
    </HoloCard>
  );
});

// =====================================================
// BAR CHART - Total vs Acertos
// =====================================================
const BarChartSection = memo(function BarChartSection({ 
  data, isLowEnd 
}: { 
  data: ProcessedItem[]; 
  isLowEnd: boolean 
}) {
  if (data.length === 0) {
    return (
      <HoloCard>
        <HUDHeader title="Total vs Acertos" icon={BarChart3} subtitle="Por Macro" />
        <div className="h-[250px] flex items-center justify-center text-muted-foreground text-sm">
          Nenhum dado disponível
        </div>
      </HoloCard>
    );
  }

  const chartData = data.slice(0, 5).map(d => ({
    name: d.name.length > 8 ? d.name.slice(0, 8) + '...' : d.name,
    Total: d.total,
    Acertos: d.correct,
  }));

  return (
    <HoloCard>
      <HUDHeader title="Total vs Acertos" icon={BarChart3} subtitle="Por Macro" />
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 40 }}>
          <defs>
            <linearGradient id="barBlue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity={1} />
              <stop offset="100%" stopColor="#1d4ed8" stopOpacity={0.7} />
            </linearGradient>
            <linearGradient id="barGreen" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity={1} />
              <stop offset="100%" stopColor="#059669" stopOpacity={0.7} />
            </linearGradient>
          </defs>
          <XAxis 
            dataKey="name" 
            tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }}
            angle={-30}
            textAnchor="end"
            interval={0}
          />
          <YAxis tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'hsl(var(--card))', 
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px',
              fontSize: '12px',
            }} 
          />
          <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '8px' }} />
          <Bar 
            dataKey="Total" 
            fill="url(#barBlue)" 
            radius={[4, 4, 0, 0]} 
            isAnimationActive={!isLowEnd}
          />
          <Bar 
            dataKey="Acertos" 
            fill="url(#barGreen)" 
            radius={[4, 4, 0, 0]} 
            isAnimationActive={!isLowEnd}
          />
        </BarChart>
      </ResponsiveContainer>
    </HoloCard>
  );
});

// =====================================================
// PIE CHART - Distribuição de Erros
// =====================================================
const PieChartSection = memo(function PieChartSection({ 
  data, isLowEnd 
}: { 
  data: ProcessedItem[]; 
  isLowEnd: boolean 
}) {
  const pieData = data
    .filter(d => d.errors > 0)
    .slice(0, 5)
    .map(d => ({
      name: d.name.length > 12 ? d.name.slice(0, 12) + '...' : d.name,
      value: d.errors,
    }));

  if (pieData.length === 0) {
    return (
      <HoloCard>
        <HUDHeader title="Distribuição de Erros" icon={Target} subtitle="Onde focar" />
        <div className="h-[250px] flex flex-col items-center justify-center text-emerald-400">
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mb-3">
            ✓
          </div>
          <p className="text-sm font-medium">Nenhum erro!</p>
        </div>
      </HoloCard>
    );
  }

  return (
    <HoloCard>
      <HUDHeader title="Distribuição de Erros" icon={Target} subtitle="Onde focar" />
      <ResponsiveContainer width="100%" height={250}>
        <PieChart>
          <Pie
            data={pieData}
            cx="50%"
            cy="50%"
            innerRadius={45}
            outerRadius={75}
            paddingAngle={3}
            dataKey="value"
            isAnimationActive={!isLowEnd}
          >
            {pieData.map((_, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={CHART_COLORS[index % CHART_COLORS.length]}
                stroke="hsl(var(--background))"
                strokeWidth={2}
              />
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
          <Legend 
            wrapperStyle={{ fontSize: '9px' }}
            formatter={(value) => <span className="text-muted-foreground">{value}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
    </HoloCard>
  );
});

// =====================================================
// EXPORT PRINCIPAL
// =====================================================
function StudentPerformanceCharts({ macros, micros, isLowEnd = false }: ChartsProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <RadarChartSection data={macros} isLowEnd={isLowEnd} />
      <BarChartSection data={macros} isLowEnd={isLowEnd} />
      <PieChartSection data={macros} isLowEnd={isLowEnd} />
    </div>
  );
}

export default StudentPerformanceCharts;
