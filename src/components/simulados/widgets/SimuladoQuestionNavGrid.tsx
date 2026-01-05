/**
 * 🎯 SIMULADOS — Question Navigation Grid (Futuristic 2300)
 * Constituição SYNAPSE Ω v10.0
 * 
 * Grid de navegação premium com visual futurístico.
 */

import React from "react";
import { cn } from "@/lib/utils";
import { Compass, Zap } from "lucide-react";

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
  const progressPercent = total > 0 ? (answeredCount / total) * 100 : 0;

  return (
    <div className="relative group">
      {/* Outer Glow Border */}
      <div className="absolute -inset-[1px] rounded-xl bg-gradient-to-br from-green-500/30 via-cyan-500/20 to-purple-500/30 opacity-60 blur-sm group-hover:opacity-80 transition-opacity" />
      
      {/* Main Container */}
      <div className="relative rounded-xl bg-zinc-950/95 backdrop-blur-xl border border-zinc-800/80 overflow-hidden">
        
        {/* Holographic Scan Line Animation */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-500/5 to-transparent h-[200%] animate-[scan_4s_linear_infinite]" />
        </div>
        
        {/* Circuit Pattern Background */}
        <div className="absolute inset-0 opacity-5">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="nav-circuit" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M0 20h15M25 20h15M20 0v15M20 25v15" stroke="currentColor" strokeWidth="0.5" fill="none" />
                <circle cx="20" cy="20" r="2" fill="currentColor" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#nav-circuit)" />
          </svg>
        </div>

        {/* Header */}
        <div className="relative px-4 py-3 border-b border-zinc-800/60">
          <div className="flex items-center justify-center gap-2">
            <Compass className="w-4 h-4 text-cyan-400" />
            <span className="text-sm font-bold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-green-400 uppercase">
              Navegação
            </span>
          </div>
          
          {/* Progress Mini Bar */}
          <div className="mt-2 h-1 rounded-full bg-zinc-800 overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-green-500 to-cyan-400 transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className="flex justify-between mt-1 text-[10px] text-zinc-500">
            <span>{answeredCount} respondidas</span>
            <span>{total - answeredCount} restantes</span>
          </div>
        </div>

        {/* Grid Content */}
        <div className="relative p-4">
          <div className="grid grid-cols-5 gap-2">
            {Array.from({ length: total }, (_, i) => {
              const isAnswered = answeredMap.get(i) ?? false;
              const isCurrent = i === current;
              
              return (
                <button
                  key={i}
                  onClick={() => onNavigate(i)}
                  className={cn(
                    "relative w-10 h-10 rounded-lg text-sm font-bold transition-all duration-200 flex items-center justify-center overflow-hidden",
                    // Atual = glow verde intenso
                    isCurrent && [
                      "bg-gradient-to-br from-green-500 to-green-600 text-white",
                      "shadow-[0_0_15px_rgba(34,197,94,0.5)]",
                      "ring-2 ring-green-400/50 ring-offset-1 ring-offset-zinc-950"
                    ],
                    // Respondida = verde sutil
                    isAnswered && !isCurrent && [
                      "bg-green-900/40 text-green-400 border border-green-500/30",
                      "hover:bg-green-800/50 hover:shadow-[0_0_10px_rgba(34,197,94,0.3)]"
                    ],
                    // Não respondida = cinza futurístico
                    !isAnswered && !isCurrent && [
                      "bg-zinc-800/80 text-zinc-400 border border-zinc-700/50",
                      "hover:bg-zinc-700 hover:border-cyan-500/30 hover:text-cyan-400",
                      "hover:shadow-[0_0_8px_rgba(34,211,238,0.2)]"
                    ]
                  )}
                >
                  {/* Inner Glow for Current */}
                  {isCurrent && (
                    <div className="absolute inset-0 bg-gradient-to-t from-transparent to-white/20" />
                  )}
                  
                  {/* Number */}
                  <span className="relative z-10">{i + 1}</span>
                  
                  {/* Answered Indicator Dot */}
                  {isAnswered && !isCurrent && (
                    <div className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer Legend */}
        <div className="relative px-4 py-2 border-t border-zinc-800/60 bg-zinc-900/50">
          <div className="flex items-center justify-center gap-4 text-[10px]">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-gradient-to-br from-green-500 to-green-600 shadow-[0_0_6px_rgba(34,197,94,0.5)]" />
              <span className="text-zinc-400">Atual</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-green-900/50 border border-green-500/30" />
              <span className="text-zinc-400">Respondida</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-zinc-800 border border-zinc-700/50" />
              <span className="text-zinc-400">Pendente</span>
            </div>
          </div>
        </div>

        {/* Energy Corner Accents */}
        <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-cyan-500/40 rounded-tl-xl" />
        <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-green-500/40 rounded-tr-xl" />
        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-purple-500/40 rounded-bl-xl" />
        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-cyan-500/40 rounded-br-xl" />
      </div>

      {/* CSS Animation */}
      <style>{`
        @keyframes scan {
          0% { transform: translateY(-50%); }
          100% { transform: translateY(0%); }
        }
      `}</style>
    </div>
  );
}
