/**
 * 🎯 SIMULADOS — Question Navigation Grid (Futuristic 2300 - Premium Vertical)
 * Constituição SYNAPSE Ω v10.0
 * 
 * Grid de navegação premium verticalizado com design 2300.
 */

import React from "react";
import { cn } from "@/lib/utils";
import { Compass } from "lucide-react";

interface SimuladoQuestionNavGridProps {
  total: number;
  current: number;
  answeredMap: Map<number, boolean>;
  onNavigate: (index: number) => void;
}

export function SimuladoQuestionNavGrid({
  total,
  current,
  answeredMap,
  onNavigate,
}: SimuladoQuestionNavGridProps) {
  const answeredCount = Array.from(answeredMap.values()).filter(Boolean).length;

  return (
    <div className="relative w-full">
      {/* Outer Glow Border - Aurora Effect */}
      <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-br from-cyan-500/30 via-green-500/20 to-purple-500/30 opacity-60 blur-sm" />
      
      {/* Main Container */}
      <div className="relative rounded-2xl bg-zinc-950/98 backdrop-blur-2xl border border-zinc-800/60 overflow-hidden shadow-2xl">
        
        {/* Header Premium */}
        <div className="px-4 py-3 border-b border-zinc-800/50 bg-gradient-to-r from-zinc-900/80 via-zinc-950 to-zinc-900/80">
          <div className="flex items-center justify-center gap-2">
            <div className="relative">
              <Compass className="w-4 h-4 text-cyan-400" />
              <div className="absolute inset-0 w-4 h-4 bg-cyan-400/30 blur-md rounded-full" />
            </div>
            <span className="text-sm font-bold tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-green-400 to-cyan-400 uppercase">
              Navegação
            </span>
          </div>
          
          {/* Stats Row */}
          <div className="flex justify-between mt-2 text-[11px]">
            <span className="text-green-400/80">{answeredCount} respondidas</span>
            <span className="text-zinc-500">{total - answeredCount} restantes</span>
          </div>
        </div>

        {/* Grid Content - Verticalizado */}
        <div className="p-4">
          <div className="grid grid-cols-5 gap-2">
            {Array.from({ length: total }, (_, i) => {
              const isAnswered = answeredMap.get(i) ?? false;
              const isCurrent = i === current;
              
              return (
                <button
                  key={i}
                  onClick={() => onNavigate(i)}
                  className={cn(
                    "aspect-square rounded-lg text-sm font-bold transition-all duration-200 flex items-center justify-center relative",
                    // Atual = glow verde intenso
                    isCurrent && [
                      "bg-gradient-to-br from-green-500 to-green-600 text-white",
                      "shadow-[0_0_20px_rgba(34,197,94,0.5)]",
                      "ring-2 ring-green-400/50",
                      "scale-105"
                    ],
                    // Respondida = verde escuro com borda
                    isAnswered && !isCurrent && [
                      "bg-green-900/40 text-green-400 border border-green-500/30",
                      "hover:bg-green-800/50 hover:border-green-500/50"
                    ],
                    // Não respondida = neutro
                    !isAnswered && !isCurrent && [
                      "bg-zinc-800/60 text-zinc-400 border border-zinc-700/50",
                      "hover:bg-zinc-700/70 hover:text-zinc-300 hover:border-zinc-600"
                    ]
                  )}
                >
                  {i + 1}
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer Legend - Horizontal Compacto */}
        <div className="px-4 py-3 border-t border-zinc-800/50 bg-zinc-900/50">
          <div className="flex items-center justify-center gap-4 text-[10px]">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-gradient-to-br from-green-500 to-green-600 shadow-[0_0_6px_rgba(34,197,94,0.4)]" />
              <span className="text-zinc-400">Atual</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-green-900/60 border border-green-500/40" />
              <span className="text-zinc-400">Respondida</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-zinc-800 border border-zinc-700/60" />
              <span className="text-zinc-400">Pendente</span>
            </div>
          </div>
        </div>

        {/* Corner Accents - Refined */}
        <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-cyan-500/40 rounded-tl-2xl pointer-events-none" />
        <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-green-500/40 rounded-tr-2xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-purple-500/40 rounded-bl-2xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-cyan-500/40 rounded-br-2xl pointer-events-none" />
      </div>
    </div>
  );
}
