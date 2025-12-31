// =====================================================
// PerformanceStatsCards - 4 Cards Principais de Performance
// Animações CSS-only para máxima performance
// =====================================================

import { 
  Target, 
  CheckCircle2, 
  TrendingUp, 
  TrendingDown, 
  Clock,
  Flame,
  Zap
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { PerformanceStats } from "@/hooks/student-performance";

interface PerformanceStatsCardsProps {
  stats: PerformanceStats | null | undefined;
  isLoading: boolean;
  className?: string;
}

function getAccuracyColor(accuracy: number): string {
  if (accuracy >= 80) return "text-emerald-500";
  if (accuracy >= 60) return "text-amber-500";
  return "text-rose-500";
}

function getAccuracyBg(accuracy: number): string {
  if (accuracy >= 80) return "bg-emerald-500/10";
  if (accuracy >= 60) return "bg-amber-500/10";
  return "bg-rose-500/10";
}

export function PerformanceStatsCards({ stats, isLoading, className }: PerformanceStatsCardsProps) {
  if (isLoading) {
    return (
      <div className={cn("grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4", className)}>
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <Skeleton className="h-4 w-20 mb-2" />
              <Skeleton className="h-8 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!stats) {
    return (
      <div className={cn("grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4", className)}>
        <Card className="col-span-2 lg:col-span-4">
          <CardContent className="p-6 text-center text-muted-foreground">
            Responda questões para ver suas estatísticas
          </CardContent>
        </Card>
      </div>
    );
  }

  const cards = [
    {
      id: 'total',
      label: 'Questões Respondidas',
      value: stats.totalQuestions.toLocaleString('pt-BR'),
      subValue: `${stats.totalCorrect.toLocaleString('pt-BR')} corretas`,
      icon: Target,
      iconColor: 'text-primary',
      iconBg: 'bg-primary/10',
    },
    {
      id: 'accuracy',
      label: 'Aproveitamento Geral',
      value: `${stats.overallAccuracy}%`,
      subValue: stats.overallAccuracy >= 70 ? 'Bom desempenho!' : 'Continue praticando',
      icon: CheckCircle2,
      iconColor: getAccuracyColor(stats.overallAccuracy),
      iconBg: getAccuracyBg(stats.overallAccuracy),
    },
    {
      id: 'best',
      label: 'Melhor Área',
      value: stats.bestMacro,
      subValue: stats.bestMacro !== 'N/A' ? `${stats.bestMacroAccuracy}% de acerto` : 'Mínimo 5 questões',
      icon: TrendingUp,
      iconColor: 'text-emerald-500',
      iconBg: 'bg-emerald-500/10',
    },
    {
      id: 'worst',
      label: 'Área para Melhorar',
      value: stats.worstMacro,
      subValue: stats.worstMacro !== 'N/A' ? `${stats.worstMacroAccuracy}% de acerto` : 'Mínimo 5 questões',
      icon: TrendingDown,
      iconColor: 'text-amber-500',
      iconBg: 'bg-amber-500/10',
    },
  ];

  return (
    <div className={cn("space-y-4", className)}>
      {/* Grid de 4 cards principais */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {cards.map((card, index) => (
          <Card 
            key={card.id}
            className={cn(
              "relative overflow-hidden transition-all duration-300",
              "hover:shadow-md hover:scale-[1.02]",
              "animate-fade-in"
            )}
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-2">
                <span className="text-xs text-muted-foreground font-medium truncate pr-2">
                  {card.label}
                </span>
                <div className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
                  card.iconBg
                )}>
                  <card.icon className={cn("w-4 h-4", card.iconColor)} />
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-xl md:text-2xl font-bold truncate">
                  {card.value}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {card.subValue}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Cards secundários: XP, Streak, Tempo */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="animate-fade-in" style={{ animationDelay: '200ms' }}>
          <CardContent className="p-3 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center">
              <Zap className="w-5 h-5 text-purple-500" />
            </div>
            <div>
              <p className="text-lg font-bold">{stats.totalXp.toLocaleString('pt-BR')}</p>
              <p className="text-xs text-muted-foreground">XP Total</p>
            </div>
          </CardContent>
        </Card>

        <Card className="animate-fade-in" style={{ animationDelay: '250ms' }}>
          <CardContent className="p-3 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center">
              <Flame className="w-5 h-5 text-orange-500" />
            </div>
            <div>
              <p className="text-lg font-bold">{stats.currentStreak}</p>
              <p className="text-xs text-muted-foreground">Dias de Streak</p>
            </div>
          </CardContent>
        </Card>

        <Card className="animate-fade-in" style={{ animationDelay: '300ms' }}>
          <CardContent className="p-3 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
              <Clock className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <p className="text-lg font-bold">{Math.round(stats.avgTimeSeconds)}s</p>
              <p className="text-xs text-muted-foreground">Tempo Médio</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
