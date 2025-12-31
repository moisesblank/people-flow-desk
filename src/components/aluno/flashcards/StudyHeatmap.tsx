// ============================================
// CALENDÁRIO HEATMAP - Histórico de Estudos
// Estilo GitHub/Anki - Últimos 30 dias
// ============================================

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Flame, Calendar } from 'lucide-react';
import type { StudyDay } from '@/hooks/useFlashcardAnalytics';

interface StudyHeatmapProps {
  history: StudyDay[];
  streakDays: number;
}

export function StudyHeatmap({ history, streakDays }: StudyHeatmapProps) {
  const maxCount = Math.max(...history.map(d => d.count), 1);

  const getIntensity = (count: number): string => {
    if (count === 0) return 'bg-muted/30';
    const ratio = count / maxCount;
    if (ratio < 0.25) return 'bg-green-500/30';
    if (ratio < 0.5) return 'bg-green-500/50';
    if (ratio < 0.75) return 'bg-green-500/70';
    return 'bg-green-500';
  };

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
  };

  const totalReviews = history.reduce((s, d) => s + d.count, 0);
  const daysStudied = history.filter(d => d.count > 0).length;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Calendário de Estudos
          </CardTitle>
          {streakDays > 0 && (
            <div className="flex items-center gap-1 text-orange-500">
              <Flame className="w-4 h-4" />
              <span className="text-sm font-bold">{streakDays} dias</span>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {/* Resumo */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="text-center p-2 rounded-lg bg-green-500/10">
            <div className="text-xl font-bold text-green-500">{totalReviews}</div>
            <div className="text-[10px] text-muted-foreground">Revisões</div>
          </div>
          <div className="text-center p-2 rounded-lg bg-blue-500/10">
            <div className="text-xl font-bold text-blue-500">{daysStudied}</div>
            <div className="text-[10px] text-muted-foreground">Dias</div>
          </div>
          <div className="text-center p-2 rounded-lg bg-orange-500/10">
            <div className="text-xl font-bold text-orange-500">{streakDays}</div>
            <div className="text-[10px] text-muted-foreground">Streak</div>
          </div>
        </div>

        {/* Grid do Heatmap */}
        <div className="grid grid-cols-10 gap-1">
          {history.map((day) => (
            <div
              key={day.date}
              className={cn(
                'aspect-square rounded-sm transition-all hover:ring-2 hover:ring-primary/50 cursor-pointer',
                getIntensity(day.count)
              )}
              title={`${formatDate(day.date)}: ${day.count} revisões`}
            />
          ))}
        </div>

        {/* Legenda */}
        <div className="flex items-center justify-between mt-3">
          <span className="text-[10px] text-muted-foreground">Menos</span>
          <div className="flex gap-1">
            <div className="w-3 h-3 rounded-sm bg-muted/30" />
            <div className="w-3 h-3 rounded-sm bg-green-500/30" />
            <div className="w-3 h-3 rounded-sm bg-green-500/50" />
            <div className="w-3 h-3 rounded-sm bg-green-500/70" />
            <div className="w-3 h-3 rounded-sm bg-green-500" />
          </div>
          <span className="text-[10px] text-muted-foreground">Mais</span>
        </div>
      </CardContent>
    </Card>
  );
}
