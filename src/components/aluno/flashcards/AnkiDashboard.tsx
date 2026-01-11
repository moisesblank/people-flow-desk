// ============================================
// 📊 ANKI DASHBOARD - Year 2300 Cinematic
// Estatísticas completas estilo Iron Man HUD
// ============================================

import { useState } from 'react';
import { useFlashcardAnalytics } from '@/hooks/useFlashcardAnalytics';
import { AnkiStatsCard } from './AnkiStatsCard';
import { ForecastChart } from './ForecastChart';
import { StudyHeatmap } from './StudyHeatmap';
import { RetentionCard } from './RetentionCard';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChartBar, 
  ChevronUp, 
  ChevronDown,
  Zap,
  Flame,
  Target
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
      <div className={cn("space-y-4", className)}>
        <div className="flex items-center justify-between p-4 rounded-xl bg-card/50 border border-border/50">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-8 w-24" />
        </div>
      </div>
    );
  }

  if (!analytics) {
    return null;
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header colapsável - HUD Style */}
      <button 
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 rounded-xl bg-card/50 border border-border/50 hover:border-primary/30 hover:bg-card/80 transition-all group"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
              <ChartBar className="w-5 h-5 text-primary" />
            </div>
            <div className="text-left">
              <span className="font-semibold text-foreground">Estatísticas FSRS</span>
              <span className="text-xs text-muted-foreground ml-2">
                ({analytics.cardCounts.total} cards)
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isExpanded ? (
              <ChevronUp className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
            ) : (
              <ChevronDown className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
            )}
          </div>
        </div>

        {/* Preview rápido quando colapsado */}
        {!isExpanded && (
          <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t border-border/30">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-500" />
              <span className="text-blue-500 font-bold">{analytics.cardCounts.new}</span>
              <span className="text-xs text-muted-foreground">novos</span>
            </div>
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-green-500" />
              <span className="text-green-500 font-bold">{analytics.retention.overall.rate}%</span>
              <span className="text-xs text-muted-foreground">retenção</span>
            </div>
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-orange-500" />
              <span className="text-orange-500 font-bold">{analytics.streakDays}</span>
              <span className="text-xs text-muted-foreground">dias</span>
            </div>
          </div>
        )}
      </button>

      {/* Dashboard expandido */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="grid gap-4 md:grid-cols-2 overflow-hidden"
          >
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
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
