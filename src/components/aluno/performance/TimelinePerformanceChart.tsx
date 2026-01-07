// ============================================
// TIMELINE PERFORMANCE CHART
// Gráfico de evolução temporal: questões por data × Macro/Micro
// Year 2300 Cinematic HUD Design
// ============================================

import { useMemo, useState, Suspense } from 'react';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, TrendingUp, Zap, Activity, Target } from 'lucide-react';
import { format, startOfDay, eachDayOfInterval, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { ChartSkeleton } from '@/components/performance/LazyRecharts';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';

// Cores para os 5 macros (ordem canônica) - HSL based
const MACRO_COLORS: Record<string, { color: string; glow: string }> = {
  'Química Geral': { color: 'hsl(38, 92%, 50%)', glow: 'hsl(38, 92%, 50%)' },
  'Físico-Química': { color: 'hsl(187, 85%, 53%)', glow: 'hsl(187, 85%, 53%)' },
  'Química Orgânica': { color: 'hsl(271, 91%, 65%)', glow: 'hsl(271, 91%, 65%)' },
  'Química Ambiental': { color: 'hsl(142, 71%, 45%)', glow: 'hsl(142, 71%, 45%)' },
  'Bioquímica': { color: 'hsl(330, 81%, 60%)', glow: 'hsl(330, 81%, 60%)' },
};

interface AttemptWithTaxonomy {
  question_id: string;
  created_at: string;
  macro?: string | null;
  micro?: string | null;
  is_correct: boolean;
}

interface TimelinePerformanceChartProps {
  attempts: AttemptWithTaxonomy[];
  isLoading?: boolean;
  className?: string;
}

interface DayData {
  date: string;
  dateLabel: string;
  total: number;
  [key: string]: string | number;
}

// Stat Orb Component
const StatOrb = ({ 
  icon: Icon, 
  label, 
  value, 
  color = 'cyan' 
}: { 
  icon: React.ElementType; 
  label: string; 
  value: string | number; 
  color?: string;
}) => (
  <div className="relative group">
    <div className={cn(
      "flex items-center gap-2 px-3 py-1.5 rounded-full",
      "bg-gradient-to-r from-slate-800/80 to-slate-900/60",
      "border border-white/10 hover:border-white/20 transition-all duration-300",
      "hover:shadow-[0_0_15px_rgba(6,182,212,0.15)]"
    )}>
      <Icon className={cn(
        "h-3 w-3",
        color === 'cyan' && "text-cyan-400",
        color === 'amber' && "text-amber-400",
        color === 'emerald' && "text-emerald-400",
        color === 'purple' && "text-purple-400"
      )} />
      <span className="text-[10px] text-muted-foreground/70">{label}</span>
      <span className={cn(
        "text-xs font-semibold",
        color === 'cyan' && "text-cyan-300",
        color === 'amber' && "text-amber-300",
        color === 'emerald' && "text-emerald-300",
        color === 'purple' && "text-purple-300"
      )}>{value}</span>
    </div>
  </div>
);

export function TimelinePerformanceChart({ 
  attempts, 
  isLoading = false,
  className 
}: TimelinePerformanceChartProps) {
  const [dateRange, setDateRange] = useState<'7d' | '14d' | '30d' | 'all'>('14d');
  const [groupBy, setGroupBy] = useState<'macro' | 'total'>('macro');

  // Processar dados para o gráfico
  const chartData = useMemo(() => {
    if (!attempts || attempts.length === 0) return [];

    const validAttempts = attempts.filter(a => a.created_at);
    if (validAttempts.length === 0) return [];

    const now = new Date();
    let startDate: Date;
    
    if (dateRange === 'all') {
      const dates = validAttempts.map(a => new Date(a.created_at));
      startDate = new Date(Math.min(...dates.map(d => d.getTime())));
    } else {
      const days = dateRange === '7d' ? 7 : dateRange === '14d' ? 14 : 30;
      startDate = subDays(now, days);
    }

    const allDays = eachDayOfInterval({ start: startDate, end: now });
    const dataByDay = new Map<string, DayData>();
    
    allDays.forEach(day => {
      const dayKey = format(day, 'yyyy-MM-dd');
      dataByDay.set(dayKey, {
        date: dayKey,
        dateLabel: format(day, 'dd/MM', { locale: ptBR }),
        total: 0,
        'Química Geral': 0,
        'Físico-Química': 0,
        'Química Orgânica': 0,
        'Química Ambiental': 0,
        'Bioquímica': 0,
      });
    });

    validAttempts.forEach(attempt => {
      const dayKey = format(startOfDay(new Date(attempt.created_at)), 'yyyy-MM-dd');
      const dayData = dataByDay.get(dayKey);
      
      if (dayData) {
        dayData.total += 1;
        const macro = attempt.macro || 'Sem Macro';
        if (macro in MACRO_COLORS) {
          (dayData[macro] as number) += 1;
        }
      }
    });

    return Array.from(dataByDay.values()).sort((a, b) => a.date.localeCompare(b.date));
  }, [attempts, dateRange]);

  // Estatísticas resumidas
  const stats = useMemo(() => {
    if (!attempts || attempts.length === 0) {
      return { total: 0, days: 0, avgPerDay: 0, mostActiveDay: '-' };
    }

    const validAttempts = attempts.filter(a => a.created_at);
    const uniqueDays = new Set(validAttempts.map(a => format(new Date(a.created_at), 'yyyy-MM-dd')));
    const dayCount = uniqueDays.size;
    
    const countByDay = new Map<string, number>();
    validAttempts.forEach(a => {
      const day = format(new Date(a.created_at), 'dd/MM');
      countByDay.set(day, (countByDay.get(day) || 0) + 1);
    });
    
    let mostActiveDay = '-';
    let maxCount = 0;
    countByDay.forEach((count, day) => {
      if (count > maxCount) {
        maxCount = count;
        mostActiveDay = day;
      }
    });

    return {
      total: validAttempts.length,
      days: dayCount,
      avgPerDay: dayCount > 0 ? Math.round(validAttempts.length / dayCount) : 0,
      mostActiveDay: mostActiveDay !== '-' ? `${mostActiveDay} (${maxCount})` : '-',
    };
  }, [attempts]);

  // Loading state
  if (isLoading) {
    return (
      <div className={cn("relative rounded-xl overflow-hidden", className)}>
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-purple-500/5" />
        <div className="relative border border-white/10 rounded-xl bg-slate-900/60 backdrop-blur-sm p-6">
          <ChartSkeleton height={280} />
        </div>
      </div>
    );
  }

  // Empty state
  if (!attempts || attempts.length === 0) {
    return (
      <div className={cn("relative rounded-xl overflow-hidden", className)}>
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-purple-500/5" />
        <div className="relative border border-white/10 rounded-xl bg-slate-900/60 backdrop-blur-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
              <TrendingUp className="h-4 w-4 text-cyan-400" />
            </div>
            <h3 className="text-sm font-semibold text-white">Evolução Temporal</h3>
          </div>
          <div className="h-[200px] flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-gradient-to-br from-slate-800 to-slate-900 border border-white/5 flex items-center justify-center">
                <Calendar className="h-7 w-7 text-muted-foreground/30" />
              </div>
              <p className="text-sm text-muted-foreground">
                Nenhuma questão resolvida ainda
              </p>
              <p className="text-xs text-muted-foreground/50 mt-1">
                Comece a praticar para ver sua evolução
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("relative rounded-xl overflow-hidden group", className)}>
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-purple-500/5" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-cyan-500/10 via-transparent to-transparent opacity-50" />
      
      {/* Corner Accents */}
      <div className="absolute top-0 left-0 w-12 h-12 border-l-2 border-t-2 border-cyan-500/30 rounded-tl-xl" />
      <div className="absolute bottom-0 right-0 w-12 h-12 border-r-2 border-b-2 border-purple-500/30 rounded-br-xl" />
      
      {/* Main Content */}
      <div className="relative border border-white/10 rounded-xl bg-slate-900/70 backdrop-blur-sm">
        {/* Header */}
        <div className="p-4 pb-3 border-b border-white/5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="absolute inset-0 bg-cyan-500/20 blur-lg rounded-lg" />
                <div className="relative p-2 rounded-lg bg-gradient-to-br from-cyan-500/20 to-cyan-600/10 border border-cyan-500/30">
                  <TrendingUp className="h-4 w-4 text-cyan-400" />
                </div>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  Evolução Temporal
                  <Badge className="text-[9px] font-normal bg-cyan-500/10 text-cyan-400 border-cyan-500/20 hover:bg-cyan-500/20">
                    ANALYTICS
                  </Badge>
                </h3>
                <p className="text-[10px] text-muted-foreground/60">Questões resolvidas ao longo do tempo</p>
              </div>
            </div>
            
            {/* Filters */}
            <div className="flex items-center gap-2">
              <Select value={dateRange} onValueChange={(v) => setDateRange(v as any)}>
                <SelectTrigger className="h-7 text-xs w-[90px] bg-slate-800/70 border-white/10 hover:border-cyan-500/30 transition-colors">
                  <Calendar className="h-3 w-3 mr-1 text-muted-foreground" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-white/10">
                  <SelectItem value="7d">7 dias</SelectItem>
                  <SelectItem value="14d">14 dias</SelectItem>
                  <SelectItem value="30d">30 dias</SelectItem>
                  <SelectItem value="all">Tudo</SelectItem>
                </SelectContent>
              </Select>

              <Select value={groupBy} onValueChange={(v) => setGroupBy(v as any)}>
                <SelectTrigger className="h-7 text-xs w-[100px] bg-slate-800/70 border-white/10 hover:border-purple-500/30 transition-colors">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-white/10">
                  <SelectItem value="macro">Por Macro</SelectItem>
                  <SelectItem value="total">Total</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Stat Orbs */}
          <div className="flex flex-wrap gap-2 mt-3">
            <StatOrb icon={Target} label="Total" value={stats.total} color="cyan" />
            <StatOrb icon={Calendar} label="Dias" value={stats.days} color="emerald" />
            <StatOrb icon={Activity} label="Média/dia" value={stats.avgPerDay} color="purple" />
            <StatOrb icon={Zap} label="Pico" value={stats.mostActiveDay} color="amber" />
          </div>
        </div>

        {/* Chart Area */}
        <div className="p-4 pt-3">
          <Suspense fallback={<ChartSkeleton height={220} />}>
            <ChartContent 
              chartData={chartData} 
              groupBy={groupBy}
            />
          </Suspense>
          
          {/* Legend */}
          {groupBy === 'macro' && (
            <div className="flex flex-wrap justify-center gap-3 mt-3 pt-3 border-t border-white/5">
              {Object.entries(MACRO_COLORS).map(([macro, { color }]) => (
                <div key={macro} className="flex items-center gap-1.5">
                  <div 
                    className="w-2 h-2 rounded-full ring-1 ring-white/10"
                    style={{ backgroundColor: color }}
                  />
                  <span className="text-[10px] text-muted-foreground/70">{macro}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Separated Chart Content for better organization
function ChartContent({ chartData, groupBy }: { chartData: DayData[]; groupBy: 'macro' | 'total' }) {
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || payload.length === 0) return null;
    const total = payload.reduce((sum: number, item: any) => sum + (item.value || 0), 0);

    return (
      <div className="bg-slate-900/95 backdrop-blur-md border border-cyan-500/20 rounded-lg p-3 shadow-2xl shadow-cyan-500/10">
        <div className="flex items-center gap-2 mb-2 pb-2 border-b border-white/10">
          <Calendar className="h-3 w-3 text-cyan-400" />
          <span className="text-xs text-slate-300">{label}</span>
        </div>
        <p className="text-sm font-bold text-white mb-2">
          {total} {total === 1 ? 'questão' : 'questões'}
        </p>
        <div className="space-y-1">
          {payload.map((item: any) => (
            item.value > 0 && (
              <div key={item.dataKey} className="flex items-center gap-2 text-[10px]">
                <div 
                  className="w-1.5 h-1.5 rounded-full" 
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-slate-400 flex-1">{item.dataKey}</span>
                <span className="text-white font-medium">{item.value}</span>
              </div>
            )
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="h-[220px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
          <defs>
            {Object.entries(MACRO_COLORS).map(([macro, { color }]) => (
              <linearGradient key={macro} id={`grad-${macro.replace(/\s/g, '')}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.4}/>
                <stop offset="100%" stopColor={color} stopOpacity={0.02}/>
              </linearGradient>
            ))}
            <linearGradient id="grad-total" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(187, 85%, 53%)" stopOpacity={0.5}/>
              <stop offset="100%" stopColor="hsl(187, 85%, 53%)" stopOpacity={0.02}/>
            </linearGradient>
          </defs>
          
          <CartesianGrid 
            strokeDasharray="3 3" 
            stroke="rgba(255,255,255,0.03)" 
            vertical={false}
          />
          
          <XAxis 
            dataKey="dateLabel" 
            tick={{ fontSize: 9, fill: 'hsl(215, 16%, 47%)' }}
            axisLine={{ stroke: 'rgba(255,255,255,0.05)' }}
            tickLine={false}
            dy={5}
          />
          
          <YAxis 
            tick={{ fontSize: 9, fill: 'hsl(215, 16%, 47%)' }}
            axisLine={false}
            tickLine={false}
            allowDecimals={false}
          />
          
          <Tooltip content={<CustomTooltip />} />
          
          {groupBy === 'macro' ? (
            Object.entries(MACRO_COLORS).map(([macro, { color }]) => (
              <Area
                key={macro}
                type="monotone"
                dataKey={macro}
                stackId="1"
                stroke={color}
                fill={`url(#grad-${macro.replace(/\s/g, '')})`}
                strokeWidth={1.5}
              />
            ))
          ) : (
            <Area
              type="monotone"
              dataKey="total"
              stroke="hsl(187, 85%, 53%)"
              fill="url(#grad-total)"
              strokeWidth={2}
            />
          )}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export default TimelinePerformanceChart;
