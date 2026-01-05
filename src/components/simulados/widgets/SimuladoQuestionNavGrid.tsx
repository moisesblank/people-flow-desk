/**
 * 🎯 SIMULADOS — Question Navigation Grid (Estilo Print)
 * Constituição SYNAPSE Ω v10.0
 * 
 * Grid de navegação com 5 colunas, questão atual em verde.
 */

import React from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
  return (
    <Card className="bg-card/95 backdrop-blur border-border">
      <CardHeader className="pb-3">
        <CardTitle className="text-base text-center">Navegação</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid grid-cols-5 gap-1.5">
          {Array.from({ length: total }, (_, i) => {
            const isAnswered = answeredMap.get(i) ?? false;
            const isCurrent = i === current;
            
            return (
              <button
                key={i}
                onClick={() => onNavigate(i)}
                className={cn(
                  "w-9 h-9 rounded text-sm font-medium transition-all flex items-center justify-center",
                  // Atual = verde sólido
                  isCurrent && "bg-green-600 text-white font-bold",
                  // Respondida = fundo verde transparente
                  isAnswered && !isCurrent && "bg-green-600/20 text-green-400 hover:bg-green-600/30",
                  // Não respondida = fundo cinza escuro
                  !isAnswered && !isCurrent && "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
                )}
              >
                {i + 1}
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
