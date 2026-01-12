/**
 * 🎯 SIMULADO MODE SELECTOR
 * Constituição SYNAPSE Ω v10.4
 * 
 * Modal Year 2300 Cinematic para escolher entre:
 * - MODO TREINO (0 XP, sem penalidades, relaxado)
 * - MODO HARD (10 XP/questão, câmera, anti-cheat, ranking)
 * 
 * ⚡ Performance: CSS-only animations, GPU-accelerated
 */

import { memo, useMemo } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { 
  Flame, Shield, Clock, Camera, Eye, 
  Trophy, Zap, BookOpen, Target, X,
  AlertTriangle, CheckCircle2, Sparkles
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useConstitutionPerformance } from "@/hooks/useConstitutionPerformance";
import "@/styles/simulado-ready-animations.css";

// Capas
import capaHardMode from "@/assets/simulados/capa-hard.png";
import capaNormalMode from "@/assets/simulados/capa-normal.png";

interface SimuladoModeSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectMode: (mode: 'treino' | 'hard') => void;
  simuladoTitle: string;
  durationMinutes: number;
  questionCount: number;
  requiresCamera?: boolean;
}

interface ModeCardProps {
  mode: 'treino' | 'hard';
  isSelected?: boolean;
  onClick: () => void;
  durationMinutes: number;
  questionCount: number;
  requiresCamera?: boolean;
  isHighEnd: boolean;
}

const ModeCard = memo(function ModeCard({ 
  mode, 
  isSelected,
  onClick, 
  durationMinutes,
  questionCount,
  requiresCamera,
  isHighEnd
}: ModeCardProps) {
  const isHard = mode === 'hard';
  const coverImage = isHard ? capaHardMode : capaNormalMode;
  
  const features = useMemo(() => {
    if (isHard) {
      return [
        { icon: Zap, text: "+10 XP por acerto", highlight: true },
        { icon: Trophy, text: "Conta no ranking", highlight: true },
        { icon: Clock, text: "Tempo cronometrado", highlight: false },
        { icon: Eye, text: "Anti-cheat ativo", highlight: false },
        ...(requiresCamera ? [{ icon: Camera, text: "Câmera obrigatória", highlight: false }] : []),
        { icon: AlertTriangle, text: "Sem pausas permitidas", highlight: false },
      ];
    }
    return [
      { icon: BookOpen, text: "Foco no aprendizado", highlight: true },
      { icon: Shield, text: "Sem pressão", highlight: true },
      { icon: Clock, text: "Tempo flexível", highlight: false },
      { icon: Target, text: "Pratique à vontade", highlight: false },
      { icon: CheckCircle2, text: "XP: 0 (treino)", highlight: false },
    ];
  }, [isHard, requiresCamera]);

  return (
    <div
      onClick={onClick}
      className={cn(
        "relative flex flex-col rounded-2xl overflow-hidden cursor-pointer",
        "border-2 transition-all duration-300 ease-out transform",
        "hover:scale-[1.02] hover:-translate-y-1",
        isHard
          ? "bg-gradient-to-br from-red-950/90 via-black/95 to-red-950/80"
          : "bg-gradient-to-br from-emerald-950/90 via-black/95 to-emerald-950/80",
        isHard
          ? "border-red-500/30 hover:border-red-500/70 hover:shadow-[0_20px_50px_-15px_rgba(239,68,68,0.4)]"
          : "border-emerald-500/30 hover:border-emerald-500/70 hover:shadow-[0_20px_50px_-15px_rgba(16,185,129,0.4)]",
        isSelected && (isHard 
          ? "ring-2 ring-red-500 ring-offset-2 ring-offset-black"
          : "ring-2 ring-emerald-500 ring-offset-2 ring-offset-black"
        )
      )}
    >
      {/* Background Effects */}
      {isHighEnd && (
        <div className={cn(
          "absolute inset-0 opacity-30",
          isHard 
            ? "bg-[radial-gradient(circle_at_30%_20%,rgba(239,68,68,0.3),transparent_50%)]"
            : "bg-[radial-gradient(circle_at_30%_20%,rgba(16,185,129,0.3),transparent_50%)]"
        )} />
      )}

      {/* Cover Image */}
      <div className="relative h-32 md:h-40 overflow-hidden">
        <img 
          src={coverImage} 
          alt=""
          className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
          loading="eager"
        />
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
        
        {/* Mode Badge */}
        <div className={cn(
          "absolute top-3 left-3 px-3 py-1.5 rounded-full",
          "text-xs font-bold uppercase tracking-wider",
          "backdrop-blur-sm border",
          isHard
            ? "bg-red-500/30 text-red-200 border-red-500/50"
            : "bg-emerald-500/30 text-emerald-200 border-emerald-500/50"
        )}>
          <div className="flex items-center gap-1.5">
            {isHard ? <Flame className="w-3.5 h-3.5" /> : <Shield className="w-3.5 h-3.5" />}
            {isHard ? "MODO HARD" : "MODO TREINO"}
          </div>
        </div>

        {/* XP Badge */}
        <div className={cn(
          "absolute top-3 right-3 px-2.5 py-1 rounded-lg",
          "text-sm font-bold",
          isHard
            ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-orange-500/30"
            : "bg-muted/80 text-muted-foreground"
        )}>
          {isHard ? "+10 XP" : "0 XP"}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-4 md:p-5 space-y-4">
        {/* Title */}
        <div>
          <h3 className={cn(
            "text-lg md:text-xl font-bold mb-1",
            isHard ? "text-red-100" : "text-emerald-100"
          )}>
            {isHard ? "Desafio Competitivo" : "Prática Livre"}
          </h3>
          <p className="text-xs md:text-sm text-muted-foreground">
            {isHard 
              ? "Enfrente o simulado em condições reais de prova"
              : "Estude sem pressão, foque no aprendizado"
            }
          </p>
        </div>

        {/* Features */}
        <div className="space-y-2">
          {features.map((feature, i) => (
            <div 
              key={i}
              className={cn(
                "flex items-center gap-2 text-xs md:text-sm",
                feature.highlight
                  ? (isHard ? "text-red-200" : "text-emerald-200")
                  : "text-muted-foreground"
              )}
            >
              <feature.icon className={cn(
                "w-3.5 h-3.5 flex-shrink-0",
                feature.highlight && (isHard ? "text-red-400" : "text-emerald-400")
              )} />
              <span>{feature.text}</span>
            </div>
          ))}
        </div>

        {/* Stats Row */}
        <div className="flex items-center gap-3 pt-2 border-t border-white/10">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="w-3.5 h-3.5" />
            <span>{durationMinutes}min</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Target className="w-3.5 h-3.5" />
            <span>{questionCount} questões</span>
          </div>
        </div>

        {/* Select Button - P0 FIX: onClick explícito no botão */}
        <Button
          onClick={(e) => {
            e.stopPropagation();
            console.log('[ModeCard Button] Direct click, mode:', mode);
            onClick();
          }}
          className={cn(
            "w-full font-bold uppercase tracking-wider transition-all duration-300",
            isHard
              ? "bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white shadow-lg shadow-red-500/25"
              : "bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white shadow-lg shadow-emerald-500/25"
          )}
          size="lg"
        >
          {isHard ? (
            <>
              <Flame className="w-4 h-4 mr-2" />
              Aceitar Desafio
            </>
          ) : (
            <>
              <BookOpen className="w-4 h-4 mr-2" />
              Iniciar Treino
            </>
          )}
        </Button>
      </div>
    </div>
  );
});

export const SimuladoModeSelector = memo(function SimuladoModeSelector({
  isOpen,
  onClose,
  onSelectMode,
  simuladoTitle,
  durationMinutes,
  questionCount,
  requiresCamera = false,
}: SimuladoModeSelectorProps) {
  const { isLowEnd } = useConstitutionPerformance();
  const isHighEnd = !isLowEnd;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className={cn(
        "w-[95vw] max-w-4xl p-0 overflow-hidden border-0",
        "bg-gradient-to-br from-black via-background to-black"
      )}>
        {/* Cinematic Background */}
        {isHighEnd && (
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {/* Grid Pattern */}
            <div 
              className="absolute inset-0 opacity-[0.03]"
              style={{
                backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                                  linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
                backgroundSize: '40px 40px'
              }}
            />
            {/* Radial Glow */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(139,92,246,0.15),transparent_60%)]" />
          </div>
        )}

        <div className="relative z-10 p-6 md:p-8">
          {/* Header */}
          <div className="text-center mb-6 md:mb-8">
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5 text-muted-foreground" />
            </button>

            {/* Title Section */}
            <div className="flex items-center justify-center gap-2 mb-2">
              <Sparkles className="w-5 h-5 text-purple-400" />
              <span className="text-xs uppercase tracking-widest text-purple-400 font-medium">
                Escolha seu modo
              </span>
              <Sparkles className="w-5 h-5 text-purple-400" />
            </div>
            
            <DialogTitle className="text-2xl md:text-3xl font-bold text-white mb-2">
              {simuladoTitle}
            </DialogTitle>
            
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Como você quer realizar este simulado? Escolha o modo que melhor se adapta ao seu objetivo.
            </p>
          </div>

          {/* Mode Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            <ModeCard
              mode="treino"
              onClick={() => {
                console.log('[ModeCard] Treino clicked, calling onSelectMode');
                onSelectMode('treino');
              }}
              durationMinutes={durationMinutes}
              questionCount={questionCount}
              isHighEnd={isHighEnd}
            />
            <ModeCard
              mode="hard"
              onClick={() => {
                console.log('[ModeCard] Hard clicked, calling onSelectMode');
                onSelectMode('hard');
              }}
              durationMinutes={durationMinutes}
              questionCount={questionCount}
              requiresCamera={requiresCamera}
              isHighEnd={isHighEnd}
            />
          </div>

          {/* Footer Info */}
          <div className="mt-6 text-center">
            <p className="text-xs text-muted-foreground">
              💡 <span className="text-cyan-400">Dica:</span> Se está estudando um assunto novo, comece pelo Modo Treino.
              Quando se sentir preparado, enfrente o Modo Hard para valer XP e ranking!
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
});

export default SimuladoModeSelector;
