/**
 * 🎯 SIMULADOS — Progress Bar
 * Constituição SYNAPSE Ω v10.0
 * 
 * Exibe progresso de questões respondidas.
 */

import React from "react";
import { CheckCircle2, Circle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { SimuladoProgressProps } from "@/components/simulados/types";

export function SimuladoProgress({
  current,
  total,
  answered,
}: SimuladoProgressProps) {
  const percentage = total > 0 ? Math.round((answered / total) * 100) : 0;

  return (
    <div className="space-y-2">
      {/* Barra de progresso */}
      <Progress value={percentage} className="h-2" />
      
      {/* Info */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <span>Questão {current + 1} de {total}</span>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <span>{answered}</span>
          </div>
          <div className="flex items-center gap-1">
            <Circle className="h-4 w-4 text-muted" />
            <span>{total - answered}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Mini navegação por questões
 */
export function SimuladoQuestionNav({
  total,
  current,
  answeredMap,
  onNavigate,
}: {
  total: number;
  current: number;
  answeredMap: Map<number, boolean>;
  onNavigate: (index: number) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1 max-w-md">
      {Array.from({ length: total }, (_, i) => {
        const isAnswered = answeredMap.get(i) ?? false;
        const isCurrent = i === current;
        
        return (
          <button
            key={i}
            onClick={() => onNavigate(i)}
            className={cn(
              "w-8 h-8 rounded text-xs font-medium transition-all",
              isCurrent && "ring-2 ring-primary ring-offset-2 ring-offset-background",
              isAnswered && "bg-green-500/20 text-green-400 border border-green-500/30",
              !isAnswered && !isCurrent && "bg-muted/50 text-muted-foreground hover:bg-muted"
            )}
          >
            {i + 1}
          </button>
        );
      })}
    </div>
  );
}
