/**
 * 🎯 SIMULADOS — Timer Bar (Estilo Print)
 * Constituição SYNAPSE Ω v10.0
 * 
 * Barra vermelha horizontal com tempo restante centralizado.
 */

import React, { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatTime, SimuladoTimerProps } from "@/components/simulados/types";

export function SimuladoTimerBar({
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
        "w-full py-2 flex items-center justify-center gap-2 font-mono text-sm font-bold transition-all duration-300",
        // Estados visuais - vermelho por padrão como no print
        isCritical && "bg-red-600 text-white animate-pulse",
        isWarning && !isCritical && "bg-amber-600 text-white",
        !isWarning && !isCritical && "bg-red-600 text-white"
      )}
    >
      <AlertTriangle className={cn("h-4 w-4", isCritical && "animate-bounce")} />
      <span>Tempo restante: {displayTime}</span>
    </div>
  );
}
