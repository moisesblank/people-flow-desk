/**
 * 🎯 SIMULADOS — Tela WAITING
 * Design: Year 2300 Cinematic
 * 
 * Estado: Antes de starts_at
 * Ação: Aguardar liberação com countdown épico
 */

import React from "react";
import { Clock, Calendar, Timer, Sparkles, Zap } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Simulado, formatTime } from "@/components/simulados/types";
import { cn } from "@/lib/utils";

interface SimuladoWaitingScreenProps {
  simulado: Simulado;
  startsIn: number;
}

export function SimuladoWaitingScreen({
  simulado,
  startsIn,
}: SimuladoWaitingScreenProps) {
  const startsAt = simulado.starts_at ? new Date(simulado.starts_at) : null;

  // Parse time for epic display
  const hours = Math.floor(startsIn / 3600);
  const minutes = Math.floor((startsIn % 3600) / 60);
  const seconds = startsIn % 60;

  return (
    <div className="relative flex flex-col items-center justify-center min-h-[70vh] text-center p-8 overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-violet-500/10 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      {/* Holographic Icon Container */}
      <div className="relative mb-10 animate-fade-in">
        {/* Outer rotating ring */}
        <div className="absolute -inset-6 rounded-full border border-primary/20 animate-[spin_20s_linear_infinite]">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-primary rounded-full" />
        </div>
        
        {/* Middle pulsing ring */}
        <div className="absolute -inset-4 rounded-full border-2 border-primary/30 animate-pulse" />
        
        {/* Core orb */}
        <div className="relative w-32 h-32 rounded-full bg-gradient-to-br from-primary/20 via-primary/10 to-violet-500/20 flex items-center justify-center backdrop-blur-sm border border-primary/30">
          <Clock className="h-14 w-14 text-primary animate-pulse" />
          
          {/* Inner glow */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-t from-primary/20 to-transparent" />
        </div>
        
        {/* Status badge */}
        <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 px-6 py-1.5 bg-gradient-to-r from-primary via-violet-500 to-primary rounded-full text-white text-sm font-bold shadow-lg shadow-primary/30 flex items-center gap-2">
          <Sparkles className="h-4 w-4" />
          EM BREVE
        </div>
      </div>

      {/* Title */}
      <h1 className="text-3xl md:text-4xl font-bold mb-3 bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent animate-fade-in" style={{ animationDelay: '0.1s' }}>
        {simulado.title}
      </h1>
      <p className="text-muted-foreground mb-10 max-w-md animate-fade-in" style={{ animationDelay: '0.2s' }}>
        {simulado.description || "Este simulado será liberado em breve. Prepare-se!"}
      </p>

      {/* Epic Countdown Display */}
      <div className="relative mb-10 animate-fade-in" style={{ animationDelay: '0.3s' }}>
        {/* Glowing background */}
        <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-violet-500/20 to-primary/20 rounded-2xl blur-xl" />
        
        <div className="relative bg-card/80 backdrop-blur-xl border border-primary/30 rounded-2xl p-8 shadow-2xl">
          <p className="text-sm text-muted-foreground mb-4 flex items-center justify-center gap-2">
            <Zap className="h-4 w-4 text-primary" />
            LIBERAÇÃO EM
          </p>
          
          <div className="flex items-center justify-center gap-4">
            {/* Hours */}
            <TimeUnit value={hours} label="HORAS" />
            <Separator />
            {/* Minutes */}
            <TimeUnit value={minutes} label="MIN" />
            <Separator />
            {/* Seconds */}
            <TimeUnit value={seconds} label="SEG" isLive />
          </div>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-2 gap-4 text-sm animate-fade-in max-w-sm" style={{ animationDelay: '0.4s' }}>
        {startsAt && (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-card/60 backdrop-blur border border-border/50 hover:border-primary/30 transition-colors">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Calendar className="h-5 w-5 text-primary" />
            </div>
            <div className="text-left">
              <p className="text-xs text-muted-foreground">Data</p>
              <p className="font-medium">{format(startsAt, "dd/MM/yyyy", { locale: ptBR })}</p>
            </div>
          </div>
        )}
        <div className="flex items-center gap-3 p-4 rounded-xl bg-card/60 backdrop-blur border border-border/50 hover:border-primary/30 transition-colors">
          <div className="w-10 h-10 rounded-full bg-violet-500/10 flex items-center justify-center">
            <Timer className="h-5 w-5 text-violet-400" />
          </div>
          <div className="text-left">
            <p className="text-xs text-muted-foreground">Duração</p>
            <p className="font-medium">{simulado.duration_minutes} min</p>
          </div>
        </div>
      </div>

      {/* Bottom hint */}
      <p className="text-xs text-muted-foreground mt-10 animate-fade-in flex items-center gap-2" style={{ animationDelay: '0.5s' }}>
        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
        Atualização automática quando liberado
      </p>
    </div>
  );
}

function TimeUnit({ value, label, isLive = false }: { value: number; label: string; isLive?: boolean }) {
  return (
    <div className="flex flex-col items-center">
      <div className={cn(
        "relative w-20 h-20 rounded-xl flex items-center justify-center text-4xl font-mono font-bold",
        "bg-gradient-to-b from-background to-card border border-border/50",
        isLive && "border-primary/50"
      )}>
        <span className={cn(
          "bg-gradient-to-b from-foreground to-foreground/70 bg-clip-text text-transparent",
          isLive && "text-primary"
        )}>
          {value.toString().padStart(2, '0')}
        </span>
        {isLive && (
          <div className="absolute inset-0 rounded-xl bg-primary/5 animate-pulse" />
        )}
      </div>
      <span className="text-xs text-muted-foreground mt-2 font-medium tracking-wider">{label}</span>
    </div>
  );
}

function Separator() {
  return (
    <div className="flex flex-col gap-2 pb-6">
      <div className="w-2 h-2 rounded-full bg-primary/50" />
      <div className="w-2 h-2 rounded-full bg-primary/50" />
    </div>
  );
}
