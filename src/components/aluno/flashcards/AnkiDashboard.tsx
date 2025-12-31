// ============================================
// DASHBOARD ANKI - Estatísticas Completas
// Agregador de todos os componentes estilo Anki
// ============================================

import { useState } from 'react';
import { useFlashcardAnalytics } from '@/hooks/useFlashcardAnalytics';
import { AnkiStatsCard } from './AnkiStatsCard';
import { ForecastChart } from './ForecastChart';
import { StudyHeatmap } from './StudyHeatmap';
import { RetentionCard } from './RetentionCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  ChartBar, 
  ChevronUp, 
  ChevronDown,
  Sparkles 
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AnkiDashboardProps {
  className?: string;
  defaultExpanded?: boolean;
}

export function AnkiDashboard({ className, defaultExpanded = false }: AnkiDashboardProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const { data: analytics, isLoading } = useFlashcardAnalytics();

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-4">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-8 w-24" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="h-20" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!analytics) {
    return null;
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header colapsável */}
      <Card 
        className="cursor-pointer hover:bg-muted/30 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ChartBar className="w-5 h-5 text-primary" />
              <span className="font-medium">Estatísticas Anki</span>
              <span className="text-xs text-muted-foreground">
                ({analytics.cardCounts.total} cards)
              </span>
            </div>
            <Button variant="ghost" size="sm">
              {isExpanded ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </Button>
          </div>

          {/* Preview rápido quando colapsado */}
          {!isExpanded && (
            <div className="flex items-center gap-4 mt-3 text-sm">
              <div className="flex items-center gap-1">
                <span className="text-blue-500 font-bold">{analytics.cardCounts.new}</span>
                <span className="text-muted-foreground">novos</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-green-500 font-bold">{analytics.retention.overall.rate}%</span>
                <span className="text-muted-foreground">retenção</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-orange-500 font-bold">{analytics.streakDays}</span>
                <span className="text-muted-foreground">dias streak</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dashboard expandido */}
      {isExpanded && (
        <div className="grid gap-4 md:grid-cols-2">
          {/* Contagem de Cartões */}
          <AnkiStatsCard counts={analytics.cardCounts} />

          {/* Taxa de Retenção */}
          <RetentionCard 
            retention={analytics.retention}
            avgCardsPerDay={analytics.avgCardsPerDay}
            bestHour={analytics.bestHour}
          />

          {/* Previsão de Revisões */}
          <ForecastChart forecast={analytics.forecast} />

          {/* Calendário/Heatmap */}
          <StudyHeatmap 
            history={analytics.studyHistory}
            streakDays={analytics.streakDays}
          />
        </div>
      )}
    </div>
  );
}
