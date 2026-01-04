/**
 * 🎯 SIMULADOS — Tela WAITING
 * Constituição SYNAPSE Ω v10.0
 * 
 * Estado: Antes de starts_at
 * Ação: Aguardar liberação
 */

import React from "react";
import { Clock, Calendar, Timer } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Simulado, formatTime } from "@/components/simulados/types";

interface SimuladoWaitingScreenProps {
  simulado: Simulado;
  startsIn: number; // segundos até starts_at
}

export function SimuladoWaitingScreen({
  simulado,
  startsIn,
}: SimuladoWaitingScreenProps) {
  const startsAt = simulado.starts_at ? new Date(simulado.starts_at) : null;

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8">
      {/* Ícone animado */}
      <div className="relative mb-8">
        <div className="w-32 h-32 rounded-full bg-primary/10 flex items-center justify-center animate-pulse">
          <Clock className="h-16 w-16 text-primary" />
        </div>
        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-4 py-1 bg-primary rounded-full text-primary-foreground text-sm font-medium">
          Em breve
        </div>
      </div>

      {/* Título */}
      <h1 className="text-2xl md:text-3xl font-bold mb-2">
        {simulado.title}
      </h1>
      <p className="text-muted-foreground mb-8 max-w-md">
        {simulado.description || "Este simulado ainda não foi liberado."}
      </p>

      {/* Countdown */}
      <div className="bg-card border border-border rounded-xl p-6 mb-8">
        <p className="text-sm text-muted-foreground mb-2">Liberação em:</p>
        <div className="text-4xl font-mono font-bold text-primary">
          {formatTime(startsIn)}
        </div>
      </div>

      {/* Info */}
      <div className="grid grid-cols-2 gap-4 text-sm">
        {startsAt && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>{format(startsAt, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</span>
          </div>
        )}
        <div className="flex items-center gap-2 text-muted-foreground">
          <Timer className="h-4 w-4" />
          <span>{simulado.duration_minutes} minutos</span>
        </div>
      </div>

      {/* Dica */}
      <p className="text-xs text-muted-foreground mt-8">
        A página será atualizada automaticamente quando o simulado for liberado.
      </p>
    </div>
  );
}
