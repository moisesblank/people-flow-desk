/**
 * 🎯 SIMULADOS — Tela WAITING
 * Design: Year 2300 Cinematic + Performance Optimized
 * Layout: Compacto e preenchido
 * 
 * Estado: Antes de starts_at
 * Ação: Aguardar liberação com countdown épico
 */

import React from "react";
import { Clock, Calendar, Timer, Sparkles, Zap, FileQuestion, Trophy, Target, Lightbulb, ListChecks } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Simulado, formatTime } from "@/components/simulados/types";
import { cn } from "@/lib/utils";
import { useConstitutionPerformance } from "@/hooks/useConstitutionPerformance";

interface SimuladoWaitingScreenProps {
  simulado: Simulado;
  startsIn: number;
}

export function SimuladoWaitingScreen({
  simulado,
  startsIn,
}: SimuladoWaitingScreenProps) {
  const { shouldAnimate, shouldBlur } = useConstitutionPerformance();
  const isLowEnd = false; // 🏛️ PREMIUM GARANTIDO: nunca degradar UI por hardware
  const startsAt = simulado.starts_at ? new Date(simulado.starts_at) : null;

  // Parse time for epic display
  const hours = Math.floor(startsIn / 3600);
  const minutes = Math.floor((startsIn % 3600) / 60);
  const seconds = startsIn % 60;

  // Calculate tempo formatado
  const durationHours = Math.floor(simulado.duration_minutes / 60);
  const durationMins = simulado.duration_minutes % 60;
  const tempoFormatado = durationHours > 0 
    ? `${durationHours.toString().padStart(2, '0')}:${durationMins.toString().padStart(2, '0')} Hora(s)`
    : `${simulado.duration_minutes} Minuto(s)`;

  return (
    <div className="relative flex flex-col items-center min-h-[80vh] p-6 md:p-8 overflow-y-auto">
      {/* Background glow effects - 🏛️ PREMIUM GARANTIDO */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[120px] animate-pulse transform-gpu" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-violet-500/10 rounded-full blur-[100px] animate-pulse transform-gpu" style={{ animationDelay: '1s' }} />
      </div>

      {/* Header with Status Badge */}
      <div className={cn("relative text-center mb-6", shouldAnimate && "animate-fade-in")}>
        <div className={cn(
          "inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/40 text-amber-400 text-sm font-medium mb-4",
          shouldAnimate && "animate-pulse"
        )}>
          <Sparkles className="h-4 w-4" />
          Aguardando Liberação
        </div>
        
        <h1 className="text-3xl md:text-4xl font-bold mb-3 bg-gradient-to-r from-foreground via-primary to-violet-400 bg-clip-text text-transparent">
          {simulado.title}
        </h1>
        {simulado.description && (
          <p className="text-muted-foreground max-w-lg mx-auto">
            {simulado.description}
          </p>
        )}
      </div>

      {/* Stats Orbs - 4 Cards */}
      <div className={cn("grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 w-full max-w-3xl", shouldAnimate && "animate-fade-in")}>
        <StatOrb
          icon={<Clock className="h-6 w-6" />}
          value={tempoFormatado}
          label="Tempo"
          gradient="from-indigo-500 to-blue-500"
          isLowEnd={isLowEnd}
          shouldBlur={shouldBlur}
        />
        <StatOrb
          icon={<FileQuestion className="h-6 w-6" />}
          value={`${simulado.total_questions || 0}`}
          label="Questões"
          gradient="from-violet-500 to-purple-500"
          isLowEnd={isLowEnd}
          shouldBlur={shouldBlur}
        />
        <StatOrb
          icon={<Trophy className="h-6 w-6" />}
          value={`${(simulado.total_questions || 0) * 10}`}
          label="XP Máximo"
          gradient="from-amber-500 to-orange-500"
          isLowEnd={isLowEnd}
          shouldBlur={shouldBlur}
        />
        <StatOrb
          icon={<Target className="h-6 w-6" />}
          value={`${simulado.passing_score || 60}%`}
          label="Mínimo"
          gradient="from-emerald-500 to-green-500"
          isLowEnd={isLowEnd}
          shouldBlur={shouldBlur}
        />
      </div>

      {/* Epic Countdown Display */}
      <div className={cn("relative mb-6 w-full max-w-2xl", shouldAnimate && "animate-fade-in")}>
        {/* Glowing background — 🏛️ PREMIUM GARANTIDO */}
        <div className="absolute inset-0 bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-amber-500/20 rounded-2xl blur-xl transform-gpu" />
        <div className={cn(
          "relative bg-card/80 border border-amber-500/30 rounded-2xl p-6 shadow-2xl",
          shouldBlur && "backdrop-blur-xl"
        )}>
          <p className="text-sm text-amber-400 mb-4 flex items-center justify-center gap-2 font-medium">
            <Zap className="h-4 w-4" />
            LIBERAÇÃO EM
          </p>
          
          <div className="flex items-center justify-center gap-4">
            {/* Hours */}
            <TimeUnit value={hours} label="HORAS" shouldAnimate={shouldAnimate} />
            <Separator />
            {/* Minutes */}
            <TimeUnit value={minutes} label="MIN" shouldAnimate={shouldAnimate} />
            <Separator />
            {/* Seconds */}
            <TimeUnit value={seconds} label="SEG" isLive shouldAnimate={shouldAnimate} />
          </div>
          
          {/* Date info */}
          {startsAt && (
            <div className="mt-4 pt-4 border-t border-border/30 flex items-center justify-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-amber-400" />
                <span>{format(startsAt, "dd/MM/yyyy", { locale: ptBR })}</span>
              </div>
              <div className="flex items-center gap-2">
                <Timer className="h-4 w-4 text-amber-400" />
                <span>{format(startsAt, "HH:mm", { locale: ptBR })}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Dicas do Professor - Glass Card */}
      <div className={cn("w-full max-w-2xl mb-6", shouldAnimate && "animate-fade-in")}>
        <div className={cn(
          "relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-500/10 via-violet-500/5 to-indigo-500/10 border border-indigo-500/30 p-6",
          shouldBlur && "backdrop-blur-sm"
        )}>
          {/* 🏛️ PREMIUM GARANTIDO: Glow sempre visível */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl transform-gpu" />
          
          <div className="relative">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center">
                <Lightbulb className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="font-bold text-indigo-300">Dicas do Professor</p>
                <p className="text-xs text-indigo-400/70">Moisés Medeiros</p>
              </div>
            </div>
            
            <ul className="space-y-3">
              {[
                "Prepare seu ambiente de estudo com antecedência.",
                "Separe água e papel para anotações.",
                "Desligue notificações do celular.",
                "Revise as regras do simulado antes de começar."
              ].map((tip, i) => (
                <li key={i} className="flex gap-3 text-sm text-muted-foreground">
                  <Zap className="h-4 w-4 text-indigo-400 shrink-0 mt-0.5" />
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Regras Gerais - Compact Glass Card */}
      <div className={cn("w-full max-w-2xl mb-6", shouldAnimate && "animate-fade-in")}>
        <div className={cn(
          "rounded-2xl bg-card/60 border border-border/50 p-6",
          shouldBlur && "backdrop-blur"
        )}>
          <div className="flex items-center gap-3 mb-4">
            <ListChecks className="h-5 w-5 text-muted-foreground" />
            <p className="font-semibold">Regras do Simulado</p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-3 text-sm text-muted-foreground">
            {[
              `Tempo total: ${simulado.duration_minutes} minutos`,
              "Cada questão vale 10 pontos",
              "Apenas a 1ª tentativa pontua no ranking",
              "Respostas salvas automaticamente",
              "Navegue livremente entre questões",
              "Gabarito após finalização"
            ].map((rule, i) => (
              <div key={i} className="flex gap-2">
                <span className="text-primary">•</span>
                <span>{rule}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom hint */}
      <div className={cn("px-6 py-3 rounded-full bg-emerald-500/10 border border-emerald-500/30", shouldAnimate && "animate-fade-in")}>
        <p className="text-xs text-emerald-400 flex items-center gap-2">
          <div className={cn("w-2 h-2 rounded-full bg-emerald-500", shouldAnimate && "animate-pulse")} />
          Atualização automática quando liberado
        </p>
      </div>
    </div>
  );
}

function TimeUnit({ value, label, isLive = false, shouldAnimate = true }: { value: number; label: string; isLive?: boolean; shouldAnimate?: boolean }) {
  return (
    <div className="flex flex-col items-center">
      <div className={cn(
        "relative w-20 h-20 rounded-xl flex items-center justify-center text-4xl font-mono font-bold",
        "bg-gradient-to-b from-background to-card border border-border/50",
        isLive && "border-amber-500/50"
      )}>
        <span className={cn(
          "bg-gradient-to-b from-foreground to-foreground/70 bg-clip-text text-transparent",
          isLive && "text-amber-400"
        )}>
          {value.toString().padStart(2, '0')}
        </span>
        {isLive && shouldAnimate && (
          <div className="absolute inset-0 rounded-xl bg-amber-500/5 animate-pulse" />
        )}
      </div>
      <span className="text-xs text-muted-foreground mt-2 font-medium tracking-wider">{label}</span>
    </div>
  );
}

function Separator() {
  return (
    <div className="flex flex-col gap-2 pb-6">
      <div className="w-2 h-2 rounded-full bg-amber-500/50" />
      <div className="w-2 h-2 rounded-full bg-amber-500/50" />
    </div>
  );
}

function StatOrb({ 
  icon, 
  value, 
  label, 
  gradient,
  isLowEnd = false,
  shouldBlur = true
}: { 
  icon: React.ReactNode; 
  value: string; 
  label: string;
  gradient: string;
  isLowEnd?: boolean;
  shouldBlur?: boolean;
}) {
  return (
    <div className="group relative">
      {/* Glow effect on hover - only on high-end */}
      {!isLowEnd && (
        <div className={cn(
          "absolute inset-0 rounded-2xl bg-gradient-to-r opacity-0 group-hover:opacity-20 blur-xl transition-opacity",
          gradient
        )} />
      )}
      
      <div className={cn(
        "relative flex flex-col items-center gap-3 p-5 rounded-2xl bg-card/80 border border-border/50 group-hover:border-primary/30 transition-colors",
        shouldBlur && "backdrop-blur",
        !isLowEnd && "transition-all duration-300 group-hover:-translate-y-1"
      )}>
        <div className={cn(
          "w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br text-white",
          gradient
        )}>
          {icon}
        </div>
        <div className="text-center">
          <p className="text-xl font-bold">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </div>
    </div>
  );
}