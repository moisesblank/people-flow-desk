// ============================================
// TIMELINE PERFORMANCE CHART
// Gráfico de evolução temporal: questões por data × Macro/Micro
// Year 2300 Cinematic Design
// ============================================

import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, Legend 
} from 'recharts';
import { Calendar, TrendingUp, Layers } from 'lucide-react';
import { format, parseISO, startOfDay, eachDayOfInterval, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

// Cores para os 5 macros (ordem canônica)
const MACRO_COLORS: Record<string, string> = {
  'Química Geral': '#f59e0b',      // amber-500
  'Físico-Química': '#06b6d4',     // cyan-500
  'Química Orgânica': '#a855f7',   // purple-500
  'Química Ambiental': '#22c55e',  // green-500
  'Bioquímica': '#ec4899',         // pink-500
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
  [key: string]: string | number; // Dynamic macro keys
}

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

    // Filtrar tentativas com created_at válido
    const validAttempts = attempts.filter(a => a.created_at);
    if (validAttempts.length === 0) return [];

    // Determinar range de datas
    const now = new Date();
    let startDate: Date;
    
    if (dateRange === 'all') {
      const dates = validAttempts.map(a => new Date(a.created_at));
      startDate = new Date(Math.min(...dates.map(d => d.getTime())));
    } else {
      const days = dateRange === '7d' ? 7 : dateRange === '14d' ? 14 : 30;
      startDate = subDays(now, days);
    }

    // Gerar array de todos os dias no intervalo
    const allDays = eachDayOfInterval({ start: startDate, end: now });

    // Agrupar tentativas por dia e macro
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

    // Preencher com dados reais
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
    
    // Encontrar dia mais ativo
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

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || payload.length === 0) return null;

    const total = payload.reduce((sum: number, item: any) => sum + (item.value || 0), 0);

    return (
      <div className="bg-slate-900/95 backdrop-blur-sm border border-white/10 rounded-lg p-3 shadow-xl">
        <p className="text-xs text-slate-400 mb-2 flex items-center gap-1">
          <Calendar className="h-3 w-3" />
          {label}
        </p>
        <p className="text-sm font-semibold text-white mb-2">
          Total: {total} {total === 1 ? 'questão' : 'questões'}
        </p>
        <div className="space-y-1">
          {payload.map((item: any) => (
            item.value > 0 && (
              <div key={item.dataKey} className="flex items-center gap-2 text-xs">
                <div 
                  className="w-2 h-2 rounded-full" 
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-slate-300">{item.dataKey}:</span>
                <span className="text-white font-medium">{item.value}</span>
              </div>
            )
          ))}
        </div>
      </div>
    );
  };

  // Loading state
  if (isLoading) {
    return (
      <Card className={cn("border-white/5 bg-slate-900/50", className)}>
        <CardHeader className="pb-2">
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[250px] w-full" />
        </CardContent>
      </Card>
    );
  }

  // Empty state
  if (!attempts || attempts.length === 0) {
    return (
      <Card className={cn("border-white/5 bg-slate-900/50", className)}>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-cyan-400" />
            Evolução Temporal
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[200px] flex items-center justify-center">
            <div className="text-center">
              <Calendar className="h-10 w-10 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                Nenhuma questão resolvida ainda
              </p>
              <p className="text-xs text-muted-foreground/60 mt-1">
                Comece a praticar para ver sua evolução
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn(
      "border-white/5 bg-gradient-to-br from-slate-900/80 to-slate-800/50 backdrop-blur-sm",
      className
    )}>
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-cyan-400" />
            Evolução Temporal
            <Badge variant="outline" className="text-[10px] font-normal border-cyan-500/30 text-cyan-400">
              Beta
            </Badge>
          </CardTitle>
          
          <div className="flex items-center gap-2">
            <Select value={dateRange} onValueChange={(v) => setDateRange(v as any)}>
              <SelectTrigger className="h-7 text-xs w-[100px] bg-slate-800/50 border-white/10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">7 dias</SelectItem>
                <SelectItem value="14d">14 dias</SelectItem>
                <SelectItem value="30d">30 dias</SelectItem>
                <SelectItem value="all">Tudo</SelectItem>
              </SelectContent>
            </Select>

            <Select value={groupBy} onValueChange={(v) => setGroupBy(v as any)}>
              <SelectTrigger className="h-7 text-xs w-[100px] bg-slate-800/50 border-white/10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="macro">Por Macro</SelectItem>
                <SelectItem value="total">Total</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Mini Stats */}
        <div className="flex flex-wrap gap-4 mt-3 pt-3 border-t border-white/5">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-muted-foreground">Total:</span>
            <span className="text-xs font-medium text-white">{stats.total}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-muted-foreground">Dias ativos:</span>
            <span className="text-xs font-medium text-white">{stats.days}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-muted-foreground">Média/dia:</span>
            <span className="text-xs font-medium text-white">{stats.avgPerDay}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-muted-foreground">Mais ativo:</span>
            <span className="text-xs font-medium text-cyan-400">{stats.mostActiveDay}</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                {Object.entries(MACRO_COLORS).map(([macro, color]) => (
                  <linearGradient key={macro} id={`gradient-${macro.replace(/\s/g, '')}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={color} stopOpacity={0.4}/>
                    <stop offset="95%" stopColor={color} stopOpacity={0.05}/>
                  </linearGradient>
                ))}
              </defs>
              
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              
              <XAxis 
                dataKey="dateLabel" 
                tick={{ fontSize: 10, fill: '#94a3b8' }}
                axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                tickLine={false}
              />
              
              <YAxis 
                tick={{ fontSize: 10, fill: '#94a3b8' }}
                axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                tickLine={false}
                allowDecimals={false}
              />
              
              <Tooltip content={<CustomTooltip />} />
              
              {groupBy === 'macro' ? (
                <>
                  {Object.entries(MACRO_COLORS).map(([macro, color]) => (
                    <Area
                      key={macro}
                      type="monotone"
                      dataKey={macro}
                      stackId="1"
                      stroke={color}
                      fill={`url(#gradient-${macro.replace(/\s/g, '')})`}
                      strokeWidth={1.5}
                    />
                  ))}
                </>
              ) : (
                <Area
                  type="monotone"
                  dataKey="total"
                  stroke="#06b6d4"
                  fill="url(#gradient-total)"
                  strokeWidth={2}
                />
              )}
              
              <Legend 
                wrapperStyle={{ 
                  fontSize: '10px', 
                  paddingTop: '10px' 
                }}
                iconSize={8}
                iconType="circle"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

export default TimelinePerformanceChart;
