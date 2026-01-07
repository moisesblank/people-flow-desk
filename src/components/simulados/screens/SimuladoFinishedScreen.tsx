/**
 * 🎯 SIMULADOS — Tela FINISHED
 * Design: Year 2300 Cinematic + Performance Optimized
 * 
 * Estado: Simulado finalizado
 * Exibição: Score do SERVIDOR com visual épico
 */

import React from "react";
import { 
  Trophy, Clock, Calendar, CheckCircle2, XCircle, Minus, Star, 
  Award, Target, TrendingUp, Info, Zap, Sparkles, Crown
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Simulado, SimuladoResult, formatTime } from "@/components/simulados/types";
import { cn } from "@/lib/utils";
import { useConstitutionPerformance } from "@/hooks/useConstitutionPerformance";

interface SimuladoFinishedScreenProps {
  simulado: Simulado;
  result: SimuladoResult;
  isRetake: boolean;
  gabaritoReleasedAt?: string;
  gabaritoIn?: number;
  onReview?: () => void;
  onExit?: () => void;
}

export function SimuladoFinishedScreen({
  simulado,
  result,
  isRetake,
  gabaritoReleasedAt,
  gabaritoIn,
  onReview,
  onExit,
}: SimuladoFinishedScreenProps) {
  const { shouldAnimate, shouldBlur, isLowEnd } = useConstitutionPerformance();
  const gabaritoDate = gabaritoReleasedAt ? new Date(gabaritoReleasedAt) : null;
  const isGabaritoAvailable = !gabaritoIn || gabaritoIn <= 0;

  const getPerformanceLevel = (percentage: number) => {
    if (percentage >= 90) return { 
      label: "Lendário!", 
      icon: Crown,
      gradient: "from-amber-400 via-yellow-400 to-amber-400",
      glow: "shadow-amber-500/50",
      bg: "from-amber-500/20 to-yellow-500/20"
    };
    if (percentage >= 70) return { 
      label: "Excelente!", 
      icon: Trophy,
      gradient: "from-emerald-400 to-green-400",
      glow: "shadow-emerald-500/50",
      bg: "from-emerald-500/20 to-green-500/20"
    };
    if (percentage >= 50) return { 
      label: "Bom Trabalho!", 
      icon: Star,
      gradient: "from-blue-400 to-cyan-400",
      glow: "shadow-blue-500/50",
      bg: "from-blue-500/20 to-cyan-500/20"
    };
    return { 
      label: "Continue Praticando", 
      icon: Target,
      gradient: "from-orange-400 to-amber-400",
      glow: "shadow-orange-500/50",
      bg: "from-orange-500/20 to-amber-500/20"
    };
  };

  const performance = getPerformanceLevel(result.percentage);
  const PerformanceIcon = performance.icon;

  return (
    <div className="relative flex flex-col items-center justify-start p-4 md:p-6 overflow-hidden">
      {/* Background celebration effects - only on high-end */}
      {!isLowEnd && (
        <div className="absolute inset-0 pointer-events-none">
          <div className={cn(
            "absolute top-1/4 left-1/4 w-64 h-64 rounded-full blur-[100px] animate-pulse",
            result.passed ? "bg-emerald-500/15" : "bg-amber-500/15"
          )} />
          <div className={cn(
            "absolute bottom-1/4 right-1/4 w-48 h-48 rounded-full blur-[80px] animate-pulse",
            result.passed ? "bg-green-500/10" : "bg-orange-500/10"
          )} style={{ animationDelay: '1s' }} />
        </div>
      )}

      {/* Main Content Grid - Compact Layout */}
      <div className="relative w-full max-w-2xl space-y-4">
        
        {/* Header Row: Trophy + Score Side by Side */}
        <div className={cn(
          "flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8 p-4 rounded-2xl",
          "bg-card/60 border border-border/50",
          shouldBlur && "backdrop-blur-sm",
          shouldAnimate && "animate-fade-in"
        )}>
          {/* Trophy Icon - Compact */}
          <div className="relative">
            {/* Pulsing ring */}
            <div className={cn(
              "absolute -inset-3 rounded-full border",
              shouldAnimate && "animate-pulse",
              result.passed ? "border-emerald-500/30" : "border-amber-500/30"
            )} />
            
            {/* Core trophy container */}
            <div className={cn(
              "relative w-24 h-24 rounded-full flex items-center justify-center border-2",
              "bg-gradient-to-br",
              performance.bg,
              result.passed ? "border-emerald-500/50" : "border-amber-500/50"
            )}>
              <PerformanceIcon className={cn(
                "h-12 w-12",
                result.passed ? "text-emerald-400" : "text-amber-400"
              )} />
            </div>
            
            {/* XP Badge - Only if scored */}
            {result.xpAwarded > 0 && result.isScoredForRanking && (
              <div className={cn(
                "absolute -bottom-2 left-1/2 -translate-x-1/2 px-3 py-1 bg-gradient-to-r from-primary via-violet-500 to-primary rounded-full text-white text-xs font-bold flex items-center gap-1",
                !isLowEnd && "shadow-lg shadow-primary/40"
              )}>
                <Zap className="h-3 w-3" />
                +{result.xpAwarded} XP
              </div>
            )}
          </div>

          {/* Score Display - Compact */}
          <div className="text-center">
            <h1 className={cn(
              "text-2xl md:text-3xl font-bold bg-gradient-to-r bg-clip-text text-transparent mb-1",
              performance.gradient
            )}>
              {performance.label}
            </h1>
            <p className="text-sm text-muted-foreground mb-2">{simulado.title}</p>
            <div className={cn(
              "text-5xl md:text-6xl font-bold bg-gradient-to-b bg-clip-text text-transparent",
              result.passed ? "from-emerald-300 to-emerald-500" : "from-amber-300 to-amber-500"
            )}>
              {result.percentage}%
            </div>
            <p className="text-sm text-muted-foreground">
              {result.score} de {simulado.total_questions * (simulado.points_per_question || 10)} pts
            </p>
          </div>
        </div>

        {/* Retake Badge */}
        {isRetake && (
          <div className={cn(
            "flex items-center justify-center gap-2 text-sm text-amber-400 px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30",
            shouldAnimate && "animate-fade-in"
          )}>
            <Info className="h-4 w-4" />
            <span>Modo Prática — Não pontua no ranking</span>
          </div>
        )}

        {/* Stats Grid + Info Row */}
        <div className={cn("grid grid-cols-1 md:grid-cols-2 gap-4", shouldAnimate && "animate-fade-in")}>
          {/* Stats Grid - Holographic Cards */}
          <div className="grid grid-cols-3 gap-2">
            <StatCard
              icon={<CheckCircle2 className="h-5 w-5 text-emerald-400" />}
              value={result.correctAnswers}
              label="Corretas"
              color="emerald"
              shouldBlur={shouldBlur}
            />
            <StatCard
              icon={<XCircle className="h-5 w-5 text-red-400" />}
              value={result.wrongAnswers}
              label="Erradas"
              color="red"
              shouldBlur={shouldBlur}
            />
            <StatCard
              icon={<Minus className="h-5 w-5 text-muted-foreground" />}
              value={result.unanswered}
              label="Em Branco"
              color="muted"
              shouldBlur={shouldBlur}
            />
          </div>

          {/* Additional Info - Vertical Stack */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-card/60 border border-border/50">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Tempo: <strong>{formatTime(result.timeSpentSeconds)}</strong></span>
            </div>
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-card/60 border border-border/50">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{result.isScoredForRanking ? "✓ Ranking atualizado" : "Modo prática"}</span>
            </div>
            {/* Passing Score Info - Inline */}
            {simulado.passing_score && (
              <div className={cn(
                "flex items-center gap-2 px-4 py-3 rounded-xl",
                result.passed 
                  ? "bg-emerald-500/10 border border-emerald-500/30" 
                  : "bg-amber-500/10 border border-amber-500/30"
              )}>
                <Target className={cn("h-4 w-4", result.passed ? "text-emerald-400" : "text-amber-400")} />
                <span className={cn("text-sm", result.passed ? "text-emerald-400" : "text-amber-400")}>
                  {result.passed 
                    ? `Aprovado! (mín. ${simulado.passing_score}%)`
                    : `Mínimo: ${simulado.passing_score}%`
                  }
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Gabarito Section */}
        {gabaritoDate && gabaritoIn && gabaritoIn > 0 ? (
          <div className={cn(
            "rounded-xl bg-gradient-to-r from-primary/10 via-violet-500/10 to-primary/10 border border-primary/30 p-4 text-center",
            shouldAnimate && "animate-fade-in"
          )}>
            <div className="flex items-center justify-center gap-2 text-primary mb-1">
              <Calendar className="h-4 w-4" />
              <span className="text-sm font-medium">Gabarito será liberado em:</span>
            </div>
            <div className="text-2xl font-mono font-bold text-primary mb-1">
              {formatTime(gabaritoIn)}
            </div>
            <p className="text-xs text-muted-foreground">
              {format(gabaritoDate, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
            </p>
          </div>
        ) : isGabaritoAvailable ? (
          <div className={cn(
            "px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30",
            shouldAnimate && "animate-fade-in"
          )}>
            <p className="text-emerald-400 font-medium flex items-center justify-center gap-2 text-sm">
              <CheckCircle2 className="h-4 w-4" />
              Gabarito comentado disponível!
            </p>
          </div>
        ) : null}

        {/* Action Buttons */}
        <div className={cn("flex flex-col sm:flex-row gap-3 pt-2", shouldAnimate && "animate-fade-in")}>
          {isGabaritoAvailable && onReview && (
            <Button 
              onClick={onReview} 
              className={cn(
                "flex-1 bg-gradient-to-r from-primary to-violet-500 hover:from-primary/90 hover:to-violet-500/90",
                !isLowEnd && "shadow-lg shadow-primary/30"
              )}
            >
              <Award className="h-5 w-5 mr-2" />
              Ver Gabarito Comentado
            </Button>
          )}
          {onExit && (
            <Button onClick={onExit} variant="outline" className="flex-1 sm:flex-none sm:min-w-[160px]">
              Voltar aos Simulados
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  value,
  label,
  color,
  shouldBlur = true,
}: {
  icon: React.ReactNode;
  value: number;
  label: string;
  color: "emerald" | "red" | "muted";
  shouldBlur?: boolean;
}) {
  const colorClasses = {
    emerald: "border-emerald-500/30 hover:border-emerald-500/50",
    red: "border-red-500/30 hover:border-red-500/50",
    muted: "border-border/50 hover:border-border",
  };

  return (
    <div className={cn(
      "flex flex-col items-center gap-1 p-3 rounded-xl bg-card/80 border transition-colors",
      colorClasses[color],
      shouldBlur && "backdrop-blur"
    )}>
      {icon}
      <span className="text-2xl font-bold">{value}</span>
      <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</span>
    </div>
  );
}
