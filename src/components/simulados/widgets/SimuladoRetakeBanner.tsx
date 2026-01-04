/**
 * 🎯 SIMULADOS — Retake Banner
 * Constituição SYNAPSE Ω v10.0
 * 
 * Aviso CLARO de que tentativa não pontua.
 */

import React from "react";
import { Info, Trophy, TrophyIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface SimuladoRetakeBannerProps {
  attemptNumber: number;
  className?: string;
}

export function SimuladoRetakeBanner({
  attemptNumber,
  className,
}: SimuladoRetakeBannerProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 px-4 py-3 rounded-lg",
        "bg-amber-500/10 border border-amber-500/30",
        className
      )}
    >
      <div className="relative">
        <Trophy className="h-5 w-5 text-amber-500" />
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full flex items-center justify-center">
          <span className="text-[8px] text-white font-bold">✕</span>
        </div>
      </div>
      
      <div className="flex-1">
        <p className="text-sm font-medium text-amber-400">
          Tentativa #{attemptNumber} — Modo Prática
        </p>
        <p className="text-xs text-amber-400/70">
          Esta tentativa NÃO conta para o ranking nem gera XP.
          Sua pontuação oficial foi registrada na primeira tentativa.
        </p>
      </div>
      
      <Info className="h-5 w-5 text-amber-500/50" />
    </div>
  );
}

/**
 * Badge compacto para header
 */
export function SimuladoRetakeBadge({ attemptNumber }: { attemptNumber: number }) {
  return (
    <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-amber-500/20 text-amber-400 text-xs font-medium">
      <TrophyIcon className="h-3 w-3" />
      <span>Tentativa #{attemptNumber}</span>
      <span className="text-amber-400/60">• Sem pontuação</span>
    </div>
  );
}
