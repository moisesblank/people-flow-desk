// =====================================================
// AITutorAlertWidget v1.0 - YEAR 2300 HUD
// Tutor IA Humanóide com Alarme de Performance
// Ativa automaticamente quando acurácia < 50%
// =====================================================

import { memo, useMemo, useState, useCallback, useEffect } from "react";
import { cn } from "@/lib/utils";
import { 
  Bot, Sparkles, AlertTriangle, Zap, ArrowRight, 
  BookOpen, Target, Brain, MessageCircle, Play
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface ProcessedItem {
  name: string;
  total: number;
  correct: number;
  errors: number;
  accuracy: number;
  parentMacro?: string;
}

interface AITutorAlertWidgetProps {
  macros: ProcessedItem[];
  micros: ProcessedItem[];
  onStartTraining?: (macroName: string, microName?: string) => void;
  isLowEnd?: boolean;
}

// =====================================================
// COMPONENT PRINCIPAL
// =====================================================
function AITutorAlertWidget({ 
  macros, 
  micros, 
  onStartTraining,
  isLowEnd = false 
}: AITutorAlertWidgetProps) {
  const [isActivated, setIsActivated] = useState(false);
  const [selectedProblem, setSelectedProblem] = useState<ProcessedItem | null>(null);

  // Detectar áreas com acurácia < 50%
  const problemAreas = useMemo(() => {
    const allItems = [...macros, ...micros];
    return allItems
      .filter(item => item.total >= 3 && item.accuracy < 50)
      .sort((a, b) => a.accuracy - b.accuracy)
      .slice(0, 5);
  }, [macros, micros]);

  // Ativar automaticamente quando há problemas
  useEffect(() => {
    if (problemAreas.length > 0 && !selectedProblem) {
      setIsActivated(true);
      setSelectedProblem(problemAreas[0]);
    } else if (problemAreas.length === 0) {
      setIsActivated(false);
      setSelectedProblem(null);
    }
  }, [problemAreas, selectedProblem]);

  // Handler para iniciar treino
  const handleStartTraining = useCallback(() => {
    if (!selectedProblem) return;
    
    if (onStartTraining) {
      onStartTraining(selectedProblem.name, selectedProblem.parentMacro);
    } else {
      toast.info(`🧠 Gerando 20 questões de "${selectedProblem.name}"...`, {
        description: "Funcionalidade em desenvolvimento"
      });
    }
  }, [selectedProblem, onStartTraining]);

  // Se não há problemas, mostrar estado neutro
  if (problemAreas.length === 0) {
    return (
      <div className="relative overflow-hidden rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 via-background to-background p-6">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_40%,rgba(16,185,129,0.08),transparent_50%)]" />
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl" />
        
        {/* Content */}
        <div className="relative flex items-center gap-6">
          {/* Avatar Humanóide */}
          <div className="relative shrink-0">
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 border border-emerald-500/30 flex items-center justify-center shadow-lg shadow-emerald-500/10">
              <div className="relative">
                {/* Cabeça */}
                <div className="w-12 h-14 rounded-t-full bg-gradient-to-b from-emerald-400/80 to-teal-500/80 relative">
                  {/* Olhos */}
                  <div className="absolute top-4 left-2 w-2.5 h-2.5 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
                  <div className="absolute top-4 right-2 w-2.5 h-2.5 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
                  {/* Sorriso */}
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 w-4 h-1.5 border-b-2 border-white/80 rounded-full" />
                </div>
                {/* Corpo */}
                <div className="w-10 h-6 mx-auto bg-gradient-to-b from-teal-500/80 to-cyan-600/80 rounded-b-lg" />
              </div>
            </div>
            {/* Glow Ring */}
            <div className="absolute -inset-1 rounded-2xl bg-emerald-500/20 blur-md -z-10" />
          </div>

          {/* Text Content */}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-lg font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                Oi, sou a TRAMON... sua TUTORIA IA
              </h3>
              <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[10px]">
                <Sparkles className="w-3 h-3 mr-1" />
                ONLINE
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              🎉 Excelente! Todas as suas áreas estão acima de 50% de acurácia.
              Continue praticando para melhorar ainda mais!
            </p>
          </div>

          {/* Status Icon */}
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
            <Target className="w-6 h-6 text-emerald-400" />
          </div>
        </div>
      </div>
    );
  }

  // Estado de ALERTA - Acurácia < 50%
  return (
    <div 
      className={cn(
        "relative overflow-hidden rounded-2xl border p-6 transition-all duration-500",
        isActivated 
          ? "border-rose-500/50 bg-gradient-to-br from-rose-500/15 via-background to-orange-500/5" 
          : "border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-background to-background"
      )}
    >
      {/* Animated Alert Background */}
      {isActivated && !isLowEnd && (
        <>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(244,63,94,0.12),transparent_50%)] animate-pulse" />
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-rose-500/50 via-orange-500/50 to-rose-500/50 animate-pulse" />
          <div className="absolute -top-20 -right-20 w-40 h-40 bg-rose-500/10 rounded-full blur-3xl animate-pulse" />
        </>
      )}

      {/* Corner Accents */}
      <div className="absolute top-0 left-0 w-6 h-6 border-l-2 border-t-2 border-rose-500/50" />
      <div className="absolute top-0 right-0 w-6 h-6 border-r-2 border-t-2 border-rose-500/50" />
      <div className="absolute bottom-0 left-0 w-6 h-6 border-l-2 border-b-2 border-rose-500/50" />
      <div className="absolute bottom-0 right-0 w-6 h-6 border-r-2 border-b-2 border-rose-500/50" />

      <div className="relative">
        {/* Header Row */}
        <div className="flex items-start gap-6 mb-5">
          {/* Avatar Humanóide com Alarme */}
          <div className="relative shrink-0">
            {/* Pulsing Ring */}
            {isActivated && !isLowEnd && (
              <div className="absolute -inset-3 rounded-2xl border-2 border-rose-500/40 animate-ping opacity-30" />
            )}
            <div className={cn(
              "w-28 h-28 rounded-2xl bg-gradient-to-br border flex items-center justify-center shadow-lg transition-all",
              isActivated 
                ? "from-rose-500/20 to-orange-500/10 border-rose-500/40 shadow-rose-500/20" 
                : "from-amber-500/20 to-orange-500/10 border-amber-500/30 shadow-amber-500/10",
              isActivated && !isLowEnd && "animate-pulse"
            )}>
              <div className="relative">
                {/* Cabeça */}
                <div className={cn(
                  "w-14 h-16 rounded-t-full relative transition-colors",
                  isActivated 
                    ? "bg-gradient-to-b from-rose-400/90 to-orange-500/90" 
                    : "bg-gradient-to-b from-amber-400/80 to-orange-500/80"
                )}>
                  {/* Antenas/Cabelo */}
                  <div className="absolute -top-2 left-3 w-1.5 h-3 bg-current rounded-full opacity-60" />
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-1 h-4 bg-current rounded-full opacity-60" />
                  <div className="absolute -top-2 right-3 w-1.5 h-3 bg-current rounded-full opacity-60" />
                  
                  {/* Olhos - Expressivos */}
                  <div className={cn(
                    "absolute top-5 left-2 w-3 h-3 rounded-full bg-white shadow-lg",
                    isActivated && "animate-pulse"
                  )}>
                    <div className="absolute top-0.5 left-0.5 w-1.5 h-1.5 rounded-full bg-slate-800" />
                  </div>
                  <div className={cn(
                    "absolute top-5 right-2 w-3 h-3 rounded-full bg-white shadow-lg",
                    isActivated && "animate-pulse"
                  )}>
                    <div className="absolute top-0.5 left-0.5 w-1.5 h-1.5 rounded-full bg-slate-800" />
                  </div>
                  
                  {/* Boca - Preocupada */}
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2">
                    <div className="w-5 h-2 border-t-2 border-white/80 rounded-full" />
                  </div>
                </div>
                
                {/* Pescoço e Corpo */}
                <div className={cn(
                  "w-12 h-7 mx-auto rounded-b-xl transition-colors",
                  isActivated 
                    ? "bg-gradient-to-b from-orange-500/90 to-rose-600/90" 
                    : "bg-gradient-to-b from-orange-500/80 to-amber-600/80"
                )}>
                  {/* Detalhe do peito */}
                  <div className="w-4 h-2 mx-auto mt-1 rounded bg-white/20" />
                </div>
              </div>
            </div>
            
            {/* Alert Badge */}
            {isActivated && (
              <div className="absolute -top-2 -right-2 p-1.5 rounded-full bg-rose-500 shadow-lg shadow-rose-500/50 animate-bounce">
                <AlertTriangle className="w-4 h-4 text-white" />
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <h3 className={cn(
                "text-lg font-bold bg-clip-text text-transparent",
                isActivated 
                  ? "bg-gradient-to-r from-rose-400 to-orange-400" 
                  : "bg-gradient-to-r from-amber-400 to-orange-400"
              )}>
                Oi, sou a TRAMON... sua TUTORIA IA
              </h3>
              <Badge className={cn(
                "text-[10px]",
                isActivated 
                  ? "bg-rose-500/20 text-rose-400 border-rose-500/30 animate-pulse" 
                  : "bg-amber-500/20 text-amber-400 border-amber-500/30"
              )}>
                <AlertTriangle className="w-3 h-3 mr-1" />
                ALERTA
              </Badge>
            </div>

            {/* Message Bubble */}
            <div className={cn(
              "relative p-4 rounded-xl border mb-4",
              isActivated 
                ? "bg-rose-500/10 border-rose-500/30" 
                : "bg-amber-500/10 border-amber-500/30"
            )}>
              {/* Speech bubble pointer */}
              <div className={cn(
                "absolute -left-2 top-4 w-4 h-4 rotate-45 border-l border-b",
                isActivated 
                  ? "bg-rose-500/10 border-rose-500/30" 
                  : "bg-amber-500/10 border-amber-500/30"
              )} />
              
              <p className="text-sm text-foreground/90 relative">
                <span className="font-semibold text-rose-400">⚠️ Atenção!</span> Detectei que você está com dificuldades em{" "}
                <span className="font-bold text-rose-300">{problemAreas.length}</span> área(s) importantes.
                {selectedProblem && (
                  <>
                    {" "}A área mais crítica é <span className="font-bold text-rose-300">"{selectedProblem.name}"</span> com apenas{" "}
                    <span className="font-bold text-rose-300">{selectedProblem.accuracy.toFixed(0)}%</span> de acurácia.
                  </>
                )}
              </p>
            </div>

            {/* Problem Areas Tags */}
            <div className="flex flex-wrap gap-2 mb-4">
              {problemAreas.map((area, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedProblem(area)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-medium transition-all border",
                    selectedProblem?.name === area.name
                      ? "bg-rose-500/20 border-rose-500/50 text-rose-300 shadow-[0_0_10px_rgba(244,63,94,0.2)]"
                      : "bg-background/50 border-border/50 text-muted-foreground hover:border-rose-500/30"
                  )}
                >
                  <span className="mr-1.5">{area.accuracy.toFixed(0)}%</span>
                  {area.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Action Area */}
        <div className={cn(
          "flex items-center gap-4 p-4 rounded-xl border",
          isActivated 
            ? "bg-gradient-to-r from-rose-500/10 to-orange-500/10 border-rose-500/30" 
            : "bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-amber-500/30"
        )}>
          <div className="flex-1">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground mb-1">
              <Brain className="w-4 h-4 text-rose-400" />
              Treino Personalizado
            </div>
            <p className="text-xs text-muted-foreground">
              {selectedProblem 
                ? `20 questões focadas em "${selectedProblem.name}" para melhorar sua performance`
                : "Selecione uma área acima para iniciar o treino"
              }
            </p>
          </div>
          
          <Button
            onClick={handleStartTraining}
            disabled={!selectedProblem}
            className={cn(
              "relative overflow-hidden group",
              isActivated 
                ? "bg-gradient-to-r from-rose-500 to-orange-500 hover:from-rose-600 hover:to-orange-600" 
                : "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600",
              "text-white font-semibold px-6 py-3 shadow-lg",
              isActivated && "shadow-rose-500/30"
            )}
          >
            {!isLowEnd && (
              <span className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            )}
            <Play className="w-4 h-4 mr-2" />
            Iniciar Treino
            <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>

        {/* Stats Footer */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-border/30">
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <BookOpen className="w-3.5 h-3.5" />
              <span>20 questões</span>
            </div>
            <div className="flex items-center gap-1">
              <Target className="w-3.5 h-3.5" />
              <span>Foco em dificuldades</span>
            </div>
            <div className="flex items-center gap-1">
              <Zap className="w-3.5 h-3.5" />
              <span>Modo Treino (0 XP)</span>
            </div>
          </div>
          <Badge variant="outline" className="text-[10px] text-muted-foreground">
            <MessageCircle className="w-3 h-3 mr-1" />
            Powered by TRAMON
          </Badge>
        </div>
      </div>
    </div>
  );
}

export default memo(AITutorAlertWidget);
