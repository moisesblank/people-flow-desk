/**
 * 🎯 SIMULADOS — Timer Bar (Estilo Print)
 * Constituição SYNAPSE Ω v10.0
 * 
 * Barra vermelha horizontal com tempo restante centralizado.
 */

import React, { useEffect, useRef } from "react";
import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatTime, SimuladoTimerProps } from "@/components/simulados/types";

export function SimuladoTimerBar({
  remainingSeconds,
  isWarning,
  isCritical,
  onTimeUp,
}: SimuladoTimerProps) {
  // Callback quando tempo acabar (dispara UMA vez por expiração)
  const hasFiredTimeUpRef = useRef(false);

  useEffect(() => {
    if (remainingSeconds > 0) {
      hasFiredTimeUpRef.current = false;
      return;
    }

    if (!onTimeUp) return;
    if (hasFiredTimeUpRef.current) return;

    hasFiredTimeUpRef.current = true;
    onTimeUp();
  }, [remainingSeconds, onTimeUp]);

  const displayTime = formatTime(Math.max(0, remainingSeconds));

  return (
    <div
      className={cn(
        "w-full py-2 flex items-center justify-center gap-2 font-mono text-sm font-bold transition-all duration-300",
        // Estados visuais - vermelho por padrão como no print
        isCritical && "bg-red-600 text-white",
        isWarning && !isCritical && "bg-amber-600 text-white",
        !isWarning && !isCritical && "bg-red-600 text-white"
      )}
    >
      <AlertTriangle className="h-4 w-4" />
      <span>Tempo restante: {displayTime}</span>
    </div>
  );
}
