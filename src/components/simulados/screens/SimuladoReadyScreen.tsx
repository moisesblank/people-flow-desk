/**
 * 🎯 SIMULADOS — Modal READY (Year 2300 Cinematic)
 * Design: Premium Enterprise Modal + Holographic HUD
 * Layout: Dialog profissional com máxima elegância
 * 
 * Estado: Liberado para iniciar
 * Ação: Exibir regras épicas e botão iniciar
 */

import React from "react";
import { 
  Play, Clock, FileQuestion, Shield, AlertTriangle, Camera, 
  Lightbulb, ListChecks, Zap, Rocket, Trophy, Target, Sparkles,
  ChevronRight, Star
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Simulado } from "@/components/simulados/types";
import { cn } from "@/lib/utils";
import { useConstitutionPerformance } from "@/hooks/useConstitutionPerformance";
import { ScrollArea } from "@/components/ui/scroll-area";

interface SimuladoReadyScreenProps {
  simulado: Simulado;
  isRetake: boolean;
  attemptNumber: number;
  onStart: () => void;
  isLoading?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function SimuladoReadyScreen({
  simulado,
  isRetake,
  attemptNumber,
  onStart,
  isLoading = false,
  open = true,
  onOpenChange,
}: SimuladoReadyScreenProps) {
  const { shouldBlur, isLowEnd } = useConstitutionPerformance();
  const isHardMode = simulado.is_hard_mode;
  
  const hours = Math.floor(simulado.duration_minutes / 60);
  const mins = simulado.duration_minutes % 60;
  const tempoFormatado = hours > 0 
    ? `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}h`
    : `${simulado.duration_minutes}min`;

  const content = (
    <div className="relative flex flex-col h-full">
      {/* 🌌 Background Layers - Cinematic Depth */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-xl">
        {/* Primary gradient */}
        <div className={cn(
          "absolute inset-0",
          isHardMode 
            ? "bg-gradient-to-br from-red-950/40 via-black to-orange-950/30" 
            : "bg-gradient-to-br from-emerald-950/40 via-black to-cyan-950/30"
        )} />
        
        {/* Radial spotlight */}
        <div className={cn(
          "absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full blur-[120px]",
          isHardMode ? "bg-red-500/8" : "bg-emerald-500/8"
        )} />
        
        {/* Bottom vignette */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        
        {/* Scanlines - ultra subtle */}
        {!isLowEnd && (
          <div className="absolute inset-0 opacity-[0.015] bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(255,255,255,0.03)_2px,rgba(255,255,255,0.03)_4px)]" />
        )}
        
        {/* Corner accents */}
        <div className={cn(
          "absolute top-0 left-0 w-24 h-24 pointer-events-none",
          "border-l-2 border-t-2 rounded-tl-xl opacity-30",
          isHardMode ? "border-red-500/50" : "border-emerald-500/50"
        )} />
        <div className={cn(
          "absolute bottom-0 right-0 w-24 h-24 pointer-events-none",
          "border-r-2 border-b-2 rounded-br-xl opacity-30",
          isHardMode ? "border-red-500/50" : "border-emerald-500/50"
        )} />
      </div>

      {/* 📜 Scrollable Content */}
      <ScrollArea className="flex-1 relative z-10">
        <div className="p-6 md:p-8 space-y-6">
          
          {/* 🏷️ Status Badge + Title */}
          <div className="text-center space-y-4">
            {/* Status Chip */}
            <div className="inline-flex items-center justify-center">
              <div className={cn(
                "inline-flex items-center gap-2 px-5 py-2 rounded-full text-sm font-semibold",
                "border shadow-lg",
                isHardMode 
                  ? "bg-gradient-to-r from-red-500/20 to-orange-500/20 border-red-500/40 text-red-300 shadow-red-500/20" 
                  : "bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 border-emerald-500/40 text-emerald-300 shadow-emerald-500/20"
              )}>
                <Sparkles className="h-4 w-4" />
                {isRetake ? `Tentativa #${attemptNumber}` : "SIMULADO LIBERADO"}
                <ChevronRight className="h-4 w-4" />
              </div>
            </div>
            
            {/* Title - Holographic */}
            <h1 className={cn(
              "text-2xl md:text-3xl lg:text-4xl font-black tracking-tight",
              "bg-clip-text text-transparent drop-shadow-2xl",
              isHardMode 
                ? "bg-gradient-to-r from-red-300 via-orange-200 to-red-300" 
                : "bg-gradient-to-r from-emerald-300 via-cyan-200 to-emerald-300"
            )}>
              {simulado.title}
            </h1>
            
            {simulado.description && (
              <p className="text-sm md:text-base text-muted-foreground/80 max-w-xl mx-auto leading-relaxed">
                {simulado.description}
              </p>
            )}
          </div>

          {/* 📊 Stats Grid - Premium Orbs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
            <StatOrb
              icon={<Clock className="h-5 w-5" />}
              value={tempoFormatado}
              label="Duração"
              gradient="from-indigo-500 to-blue-600"
              glowColor="indigo"
              isLowEnd={isLowEnd}
            />
            <StatOrb
              icon={<FileQuestion className="h-5 w-5" />}
              value={`${simulado.total_questions || 0}`}
              label="Questões"
              gradient="from-violet-500 to-purple-600"
              glowColor="violet"
              isLowEnd={isLowEnd}
            />
            <StatOrb
              icon={<Trophy className="h-5 w-5" />}
              value={`${(simulado.total_questions || 0) * 10}`}
              label="XP Máximo"
              gradient="from-amber-500 to-orange-600"
              glowColor="amber"
              isLowEnd={isLowEnd}
            />
            <StatOrb
              icon={<Target className="h-5 w-5" />}
              value={`${simulado.passing_score || 60}%`}
              label="Aprovação"
              gradient="from-emerald-500 to-green-600"
              glowColor="emerald"
              isLowEnd={isLowEnd}
            />
          </div>

          {/* ⚠️ Retake Warning OR Hard Mode Badges */}
          {isRetake ? (
            <div className={cn(
              "relative overflow-hidden rounded-xl p-4",
              "bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-amber-500/10",
              "border border-amber-500/30",
              "shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]"
            )}>
              <div className="flex items-center gap-4">
                <div className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center shrink-0",
                  "bg-gradient-to-br from-amber-500/30 to-amber-600/20",
                  "border border-amber-500/40"
                )}>
                  <AlertTriangle className="h-6 w-6 text-amber-400" />
                </div>
                <div>
                  <p className="font-bold text-amber-200">Modo Prática Ativo</p>
                  <p className="text-sm text-amber-400/70">
                    Esta tentativa <strong>NÃO</strong> contará para o ranking nem gerará XP.
                  </p>
                </div>
              </div>
            </div>
          ) : (simulado.is_hard_mode || simulado.requires_camera) && (
            <div className="flex flex-wrap justify-center gap-3">
              {simulado.is_hard_mode && (
                <div className={cn(
                  "inline-flex items-center gap-2 px-5 py-2.5 rounded-full",
                  "bg-gradient-to-r from-red-500/20 to-red-600/10",
                  "border border-red-500/40",
                  "shadow-lg shadow-red-500/10"
                )}>
                  <Shield className="h-4 w-4 text-red-400" />
                  <span className="text-sm font-semibold text-red-300">MODO HARD</span>
                </div>
              )}
              {simulado.requires_camera && (
                <div className={cn(
                  "inline-flex items-center gap-2 px-5 py-2.5 rounded-full",
                  "bg-gradient-to-r from-red-500/20 to-orange-500/10",
                  "border border-red-500/40",
                  "shadow-lg shadow-red-500/10"
                )}>
                  <Camera className="h-4 w-4 text-red-400" />
                  <span className="text-sm font-semibold text-red-300">CÂMERA ATIVA</span>
                </div>
              )}
            </div>
          )}

          {/* 💡 Dicas do Professor - Premium Glass Card */}
          <div className={cn(
            "relative overflow-hidden rounded-2xl p-5 md:p-6",
            "border",
            isHardMode 
              ? "bg-gradient-to-br from-red-500/10 via-card/80 to-orange-500/5 border-red-500/25"
              : "bg-gradient-to-br from-indigo-500/10 via-card/80 to-violet-500/5 border-indigo-500/25",
            shouldBlur && "backdrop-blur-sm"
          )}>
            {/* Card glow */}
            {!isLowEnd && (
              <div className={cn(
                "absolute top-0 right-0 w-40 h-40 rounded-full blur-3xl opacity-20",
                isHardMode ? "bg-red-500" : "bg-indigo-500"
              )} />
            )}
            
            <div className="relative">
              {/* Header */}
              <div className="flex items-center gap-3 mb-4">
                <div className={cn(
                  "w-11 h-11 rounded-xl flex items-center justify-center",
                  "bg-gradient-to-br shadow-lg",
                  isHardMode 
                    ? "from-red-500 to-orange-600 shadow-red-500/30" 
                    : "from-indigo-500 to-violet-600 shadow-indigo-500/30"
                )}>
                  <Lightbulb className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className={cn(
                    "font-bold text-base",
                    isHardMode ? "text-red-200" : "text-indigo-200"
                  )}>Dicas do Professor</p>
                  <p className={cn(
                    "text-xs",
                    isHardMode ? "text-red-400/60" : "text-indigo-400/60"
                  )}>Moisés Medeiros</p>
                </div>
              </div>
              
              {/* Tips List */}
              <ul className="space-y-2.5">
                {[
                  "Concentre-se e faça primeiro as questões que você domina.",
                  "Controle seu tempo considerando a quantidade de questões.",
                  "Escolha um local tranquilo evitando interrupções.",
                  "Lembre-se: na prova real não há consulta."
                ].map((tip, i) => (
                  <li key={i} className="flex gap-3 text-sm text-muted-foreground/90">
                    <Star className={cn(
                      "h-4 w-4 shrink-0 mt-0.5",
                      isHardMode ? "text-red-400/70" : "text-indigo-400/70"
                    )} />
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* 🛡️ Hard Mode Rules */}
          {simulado.is_hard_mode && (
            <div className={cn(
              "relative overflow-hidden rounded-2xl p-5",
              "bg-gradient-to-br from-red-500/15 via-red-900/10 to-red-500/5",
              "border border-red-500/30",
              "shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]"
            )}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center shadow-lg shadow-red-500/30">
                  <Shield className="h-5 w-5 text-white" />
                </div>
                <p className="font-bold text-red-300">Regras do Modo Hard</p>
              </div>
              
              <ul className="space-y-2 text-sm text-red-300/80">
                <li className="flex gap-3 items-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                  <span>Máximo de <strong>{simulado.max_tab_switches}</strong> trocas de aba permitidas</span>
                </li>
                {simulado.requires_camera && (
                  <li className="flex gap-3 items-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                    <span>Câmera será ativada durante todo o simulado</span>
                  </li>
                )}
                <li className="flex gap-3 items-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                  <span>Violações resultam em <strong>desclassificação imediata</strong></span>
                </li>
              </ul>
            </div>
          )}

          {/* 📋 Regras Gerais - Minimal Glass */}
          <div className={cn(
            "rounded-xl p-5",
            "bg-card/40 border border-border/40",
            shouldBlur && "backdrop-blur-sm"
          )}>
            <div className="flex items-center gap-3 mb-4">
              <ListChecks className={cn(
                "h-5 w-5",
                isHardMode ? "text-red-400/70" : "text-emerald-400/70"
              )} />
              <p className="font-semibold text-foreground/90">Regras do Simulado</p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-2.5 text-sm text-muted-foreground/80">
              {[
                `Tempo total: ${simulado.duration_minutes} minutos`,
                "Cada questão vale 10 pontos de XP",
                "Apenas a 1ª tentativa pontua no ranking",
                "Respostas salvas automaticamente",
                "Navegue livremente entre questões",
                "Gabarito disponível após finalização"
              ].map((rule, i) => (
                <div key={i} className="flex gap-2.5 items-center">
                  <div className={cn(
                    "w-1.5 h-1.5 rounded-full shrink-0",
                    isHardMode ? "bg-red-500/70" : "bg-emerald-500/70"
                  )} />
                  <span>{rule}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </ScrollArea>

      {/* 🚀 Footer with Epic Button */}
      <div className={cn(
        "relative z-10 p-6 border-t",
        "bg-gradient-to-t from-black/80 via-black/60 to-transparent",
        isHardMode ? "border-red-500/20" : "border-emerald-500/20"
      )}>
        <Button
          size="lg"
          onClick={onStart}
          disabled={isLoading}
          className={cn(
            "relative w-full h-14 text-base md:text-lg font-bold overflow-hidden",
            "transition-all duration-300",
            isHardMode 
              ? "bg-gradient-to-r from-red-600 via-red-500 to-orange-500 hover:from-red-500 hover:via-red-400 hover:to-orange-400"
              : "bg-gradient-to-r from-emerald-600 via-emerald-500 to-cyan-500 hover:from-emerald-500 hover:via-emerald-400 hover:to-cyan-400",
            !isLowEnd && (isHardMode 
              ? "shadow-[0_0_30px_rgba(239,68,68,0.4)] hover:shadow-[0_0_50px_rgba(239,68,68,0.6)]" 
              : "shadow-[0_0_30px_rgba(16,185,129,0.4)] hover:shadow-[0_0_50px_rgba(16,185,129,0.6)]"
            ),
            !isLowEnd && "hover:scale-[1.02]"
          )}
        >
          {isLoading ? (
            <>
              <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-3" />
              Preparando Simulado...
            </>
          ) : (
            <>
              <Play className="h-6 w-6 mr-3 fill-current" />
              {isRetake ? "INICIAR MODO PRÁTICA" : "INICIAR SIMULADO"}
              <Rocket className="h-5 w-5 ml-3" />
            </>
          )}
          
          {/* Shine effect */}
          {!isLowEnd && (
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-[shimmer_2.5s_infinite]" />
          )}
        </Button>
        
        {/* Subtle hint */}
        <p className="text-center text-xs text-muted-foreground/50 mt-3">
          Ao iniciar, o cronômetro será ativado automaticamente
        </p>
      </div>
    </div>
  );

  // Se open/onOpenChange forem fornecidos, renderiza como Dialog
  if (onOpenChange !== undefined) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent 
          className={cn(
            "p-0 gap-0 overflow-hidden",
            "border-2",
            isHardMode ? "border-red-500/30" : "border-emerald-500/30",
            "bg-gradient-to-br from-background via-card to-background",
            "shadow-2xl",
            isHardMode 
              ? "shadow-red-500/10" 
              : "shadow-emerald-500/10"
          )}
          showMaximize
        >
          <DialogHeader className="sr-only">
            <DialogTitle>{simulado.title}</DialogTitle>
          </DialogHeader>
          {content}
        </DialogContent>
      </Dialog>
    );
  }

  // Fallback: renderiza inline (para compatibilidade)
  return (
    <div className={cn(
      "relative rounded-2xl overflow-hidden",
      "border-2",
      isHardMode ? "border-red-500/30" : "border-emerald-500/30",
      "bg-gradient-to-br from-background via-card to-background",
      "shadow-2xl min-h-[80vh]",
      isHardMode ? "shadow-red-500/10" : "shadow-emerald-500/10"
    )}>
      {content}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   📊 STAT ORB — Premium Holographic Card
   ═══════════════════════════════════════════════════════════════ */
function StatOrb({ 
  icon, 
  value, 
  label, 
  gradient,
  glowColor,
  isLowEnd = false,
}: { 
  icon: React.ReactNode; 
  value: string; 
  label: string;
  gradient: string;
  glowColor: string;
  isLowEnd?: boolean;
}) {
  const glowClasses: Record<string, string> = {
    indigo: "group-hover:shadow-indigo-500/30",
    violet: "group-hover:shadow-violet-500/30",
    amber: "group-hover:shadow-amber-500/30",
    emerald: "group-hover:shadow-emerald-500/30",
  };

  return (
    <div className="group relative">
      {/* Outer glow on hover */}
      {!isLowEnd && (
        <div className={cn(
          "absolute -inset-1 rounded-2xl bg-gradient-to-r opacity-0 group-hover:opacity-30 blur-xl transition-opacity duration-500",
          gradient
        )} />
      )}
      
      <div className={cn(
        "relative flex flex-col items-center gap-2.5 p-4 md:p-5 rounded-xl",
        "bg-gradient-to-br from-card/90 via-card/70 to-card/50",
        "border border-border/50 group-hover:border-white/20",
        "shadow-lg",
        !isLowEnd && "transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-xl",
        !isLowEnd && glowClasses[glowColor]
      )}>
        {/* Icon container */}
        <div className={cn(
          "w-11 h-11 rounded-xl flex items-center justify-center",
          "bg-gradient-to-br text-white shadow-lg",
          gradient
        )}>
          {icon}
        </div>
        
        {/* Value & Label */}
        <div className="text-center">
          <p className="text-lg md:text-xl font-bold text-foreground">{value}</p>
          <p className="text-[11px] md:text-xs text-muted-foreground/70 uppercase tracking-wider">{label}</p>
        </div>
      </div>
    </div>
  );
}
