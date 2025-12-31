// =====================================================
// ComparisonWidget - Comparação com Média Global
// =====================================================

import { TrendingUp, TrendingDown, Minus, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { ComparisonResult } from "@/hooks/student-performance";

interface ComparisonWidgetProps {
  comparison: ComparisonResult | null | undefined;
  isLoading: boolean;
  className?: string;
}

export function ComparisonWidget({ comparison, isLoading, className }: ComparisonWidgetProps) {
  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader className="pb-3">
          <Skeleton className="h-5 w-40" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!comparison) {
    return (
      <Card className={className}>
        <CardContent className="p-6 text-center text-muted-foreground">
          Dados globais não disponíveis
        </CardContent>
      </Card>
    );
  }

  const { overallComparison } = comparison;
  const diff = overallComparison.userOverall - overallComparison.globalOverall;

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-primary" />
          <CardTitle className="text-base">Comparação Global</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Comparação principal */}
        <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
          <div className="text-center">
            <p className="text-2xl font-bold">{overallComparison.userOverall}%</p>
            <p className="text-xs text-muted-foreground">Você</p>
          </div>
          
          <div className="flex items-center gap-2">
            {overallComparison.isAboveAverage ? (
              <TrendingUp className="w-6 h-6 text-emerald-500" />
            ) : diff === 0 ? (
              <Minus className="w-6 h-6 text-muted-foreground" />
            ) : (
              <TrendingDown className="w-6 h-6 text-rose-500" />
            )}
            <span className={cn(
              "text-lg font-bold",
              diff > 0 ? "text-emerald-500" : diff < 0 ? "text-rose-500" : "text-muted-foreground"
            )}>
              {diff > 0 ? '+' : ''}{diff.toFixed(1)}%
            </span>
          </div>

          <div className="text-center">
            <p className="text-2xl font-bold text-muted-foreground">{overallComparison.globalOverall}%</p>
            <p className="text-xs text-muted-foreground">Média Geral</p>
          </div>
        </div>

        {/* Percentil estimado */}
        <div className="text-center p-3 rounded-lg bg-primary/5 border border-primary/20">
          <p className="text-sm">
            Você está no <span className="font-bold text-primary">top {100 - overallComparison.percentile}%</span> dos estudantes
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
