/**
 * 🎯 SIMULADOS — Question Navigation Grid (Futuristic 2300 - Compact)
 * Constituição SYNAPSE Ω v10.0
 * 
 * Grid de navegação premium compacto e adaptativo.
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
    <div className="relative">
      {/* Outer Glow Border */}
      <div className="absolute -inset-[1px] rounded-xl bg-gradient-to-br from-green-500/20 via-cyan-500/15 to-purple-500/20 opacity-50" />
      
      {/* Main Container */}
      <div className="relative rounded-xl bg-zinc-950/95 backdrop-blur-xl border border-zinc-800/80 overflow-hidden">
        
        {/* Header Compacto */}
        <div className="px-3 py-2 border-b border-zinc-800/60">
          <div className="flex items-center justify-center gap-2">
            <Compass className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-xs font-bold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-green-400 uppercase">
              Navegação
            </span>
          </div>
          
          {/* Stats inline */}
          <div className="flex justify-between mt-1.5 text-[10px] text-zinc-500">
            <span>{answeredCount} respondidas</span>
            <span>{total - answeredCount} restantes</span>
          </div>
        </div>

        {/* Grid Content - Compacto e Adaptativo */}
        <div className="p-3">
          <div className="grid grid-cols-5 gap-1.5">
            {Array.from({ length: total }, (_, i) => {
              const isAnswered = answeredMap.get(i) ?? false;
              const isCurrent = i === current;
              
              return (
                <button
                  key={i}
                  onClick={() => onNavigate(i)}
                  className={cn(
                    "w-9 h-9 rounded-lg text-xs font-bold transition-colors flex items-center justify-center",
                    // Atual = glow verde
                    isCurrent && [
                      "bg-gradient-to-br from-green-500 to-green-600 text-white",
                      "shadow-[0_0_12px_rgba(34,197,94,0.4)]",
                      "ring-1 ring-green-400/40"
                    ],
                    // Respondida = verde sutil
                    isAnswered && !isCurrent && [
                      "bg-green-900/30 text-green-400 border border-green-500/25",
                      "hover:bg-green-800/40"
                    ],
                    // Não respondida = cinza
                    !isAnswered && !isCurrent && [
                      "bg-zinc-800/70 text-zinc-400 border border-zinc-700/40",
                      "hover:bg-zinc-700 hover:text-zinc-300"
                    ]
                  )}
                >
                  {i + 1}
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer Legend Compacto */}
        <div className="px-3 py-2 border-t border-zinc-800/60 bg-zinc-900/40">
          <div className="flex items-center justify-center gap-3 text-[9px]">
            <div className="flex items-center gap-1">
              <div className="w-2.5 h-2.5 rounded bg-gradient-to-br from-green-500 to-green-600" />
              <span className="text-zinc-500">Atual</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2.5 h-2.5 rounded bg-green-900/50 border border-green-500/30" />
              <span className="text-zinc-500">Respondida</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2.5 h-2.5 rounded bg-zinc-800 border border-zinc-700/50" />
              <span className="text-zinc-500">Pendente</span>
            </div>
          </div>
        </div>

        {/* Corner Accents */}
        <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-cyan-500/30 rounded-tl-xl pointer-events-none" />
        <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-green-500/30 rounded-tr-xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-purple-500/30 rounded-bl-xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-cyan-500/30 rounded-br-xl pointer-events-none" />
      </div>
    </div>
  );
}
