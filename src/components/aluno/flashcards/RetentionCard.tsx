// ============================================
// CARD DE RETENÇÃO - Taxa de Acertos
// Estilo Anki - Retenção Verdadeira
// ============================================

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Target, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { RetentionStats } from '@/hooks/useFlashcardAnalytics';

interface RetentionCardProps {
  retention: RetentionStats;
  avgCardsPerDay: number;
  bestHour: number | null;
}

export function RetentionCard({ retention, avgCardsPerDay, bestHour }: RetentionCardProps) {
  const getRetentionColor = (rate: number) => {
    if (rate >= 90) return 'text-green-500';
    if (rate >= 80) return 'text-lime-500';
    if (rate >= 70) return 'text-yellow-500';
    if (rate >= 60) return 'text-orange-500';
    return 'text-red-500';
  };

  const getTrend = (current: number, previous: number) => {
    if (current > previous) return { icon: TrendingUp, color: 'text-green-500' };
    if (current < previous) return { icon: TrendingDown, color: 'text-red-500' };
    return { icon: Minus, color: 'text-muted-foreground' };
  };

  const weekTrend = getTrend(retention.lastWeek.rate, retention.lastMonth.rate);
  const formatHour = (hour: number) => `${hour.toString().padStart(2, '0')}:00`;

  const periods = [
    { label: 'Hoje', ...retention.today },
    { label: 'Ontem', ...retention.yesterday },
    { label: 'Semana', ...retention.lastWeek },
    { label: 'Mês', ...retention.lastMonth },
  ];

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Target className="w-4 h-4" />
          Retenção Verdadeira
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Taxa geral grande */}
        <div className="text-center mb-4 p-4 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5">
          <div className={cn(
            'text-5xl font-bold',
            getRetentionColor(retention.overall.rate)
          )}>
            {retention.overall.rate}%
          </div>
          <div className="text-sm text-muted-foreground mt-1">
            Taxa geral ({retention.overall.count} revisões)
          </div>
          <div className="flex items-center justify-center gap-1 mt-2">
            <weekTrend.icon className={cn('w-4 h-4', weekTrend.color)} />
            <span className={cn('text-xs', weekTrend.color)}>
              vs mês anterior
            </span>
          </div>
        </div>

        {/* Grid por período */}
        <div className="grid grid-cols-4 gap-2 mb-4">
          {periods.map((period) => (
            <div
              key={period.label}
              className="text-center p-2 rounded-lg bg-muted/30"
            >
              <div className={cn(
                'text-lg font-bold',
                period.count > 0 ? getRetentionColor(period.rate) : 'text-muted-foreground'
              )}>
                {period.count > 0 ? `${period.rate}%` : 'N/A'}
              </div>
              <div className="text-[10px] text-muted-foreground">{period.label}</div>
              <div className="text-[9px] text-muted-foreground/70">
                {period.count} rev
              </div>
            </div>
          ))}
        </div>

        {/* Estatísticas extras */}
        <div className="grid grid-cols-2 gap-2 pt-3 border-t">
          <div className="text-center p-2 rounded-lg bg-blue-500/10">
            <div className="text-lg font-bold text-blue-500">{avgCardsPerDay}</div>
            <div className="text-[10px] text-muted-foreground">Cards/dia (média)</div>
          </div>
          <div className="text-center p-2 rounded-lg bg-purple-500/10">
            <div className="text-lg font-bold text-purple-500">
              {bestHour !== null ? formatHour(bestHour) : '--:--'}
            </div>
            <div className="text-[10px] text-muted-foreground">Melhor hora</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
