/**
 * 🎯 SIMULADOS — Timer Display
 * Constituição SYNAPSE Ω v10.0
 * 
 * Timer derivado EXCLUSIVAMENTE do servidor.
 * UI apenas exibe, não calcula.
 */

import React, { useEffect } from "react";
import { Clock, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatTime, SimuladoTimerProps } from "@/components/simulados/types";

export function SimuladoTimer({
  remainingSeconds,
  isWarning,
  isCritical,
  onTimeUp,
}: SimuladoTimerProps) {
  // Callback quando tempo acabar
  useEffect(() => {
    if (remainingSeconds <= 0 && onTimeUp) {
      onTimeUp();
    }
  }, [remainingSeconds, onTimeUp]);

  const displayTime = formatTime(Math.max(0, remainingSeconds));

  return (
    <div
      className={cn(
        "flex items-center gap-2 px-4 py-2 rounded-lg font-mono text-lg font-bold transition-all duration-300",
        // Estados visuais
        isCritical && "bg-red-500/20 text-red-400",
        isWarning && !isCritical && "bg-amber-500/20 text-amber-400",
        !isWarning && !isCritical && "bg-secondary/50 text-foreground"
      )}
    >
      {isCritical ? (
        <AlertTriangle className="h-5 w-5" />
      ) : (
        <Clock className="h-5 w-5" />
      )}
      
      <span className="tabular-nums">{displayTime}</span>
      
      {isCritical && (
        <span className="text-xs font-normal ml-2">TEMPO ESGOTANDO!</span>
      )}
    </div>
  );
}
