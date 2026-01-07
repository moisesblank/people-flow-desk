/**
 * 🎯 SIMULADOS — Tela FINISHED
 * Design: Year 2300 Cinematic
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
    <div className="relative flex flex-col items-center justify-center min-h-[70vh] p-8 overflow-hidden">
      {/* Background celebration effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className={cn(
          "absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-[120px] animate-pulse",
          result.passed ? "bg-emerald-500/15" : "bg-amber-500/15"
        )} />
        <div className={cn(
          "absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full blur-[100px] animate-pulse",
          result.passed ? "bg-green-500/10" : "bg-orange-500/10"
        )} style={{ animationDelay: '1s' }} />
      </div>

      {/* Trophy Icon - Epic Presentation */}
      <div className="relative mb-8 animate-fade-in">
        {/* Outer celebration ring */}
        <div className={cn(
          "absolute -inset-8 rounded-full border-2 animate-[spin_10s_linear_infinite]",
          result.passed ? "border-emerald-500/20" : "border-amber-500/20"
        )}>
          <Sparkles className={cn(
            "absolute -top-2 left-1/2 -translate-x-1/2 h-4 w-4",
            result.passed ? "text-emerald-400" : "text-amber-400"
          )} />
        </div>
        
        {/* Middle pulsing ring */}
        <div className={cn(
          "absolute -inset-4 rounded-full border animate-pulse",
          result.passed ? "border-emerald-500/30" : "border-amber-500/30"
        )} />
        
        {/* Core trophy container */}
        <div className={cn(
          "relative w-36 h-36 rounded-full flex items-center justify-center backdrop-blur-sm border-2",
          "bg-gradient-to-br",
          performance.bg,
          result.passed ? "border-emerald-500/50" : "border-amber-500/50"
        )}>
          <PerformanceIcon className={cn(
            "h-16 w-16",
            result.passed ? "text-emerald-400" : "text-amber-400"
          )} />
        </div>
        
        {/* XP Badge - Only if scored */}
        {result.xpAwarded > 0 && result.isScoredForRanking && (
          <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 px-6 py-2 bg-gradient-to-r from-primary via-violet-500 to-primary rounded-full text-white text-sm font-bold shadow-lg shadow-primary/40 flex items-center gap-2">
            <Zap className="h-4 w-4" />
            +{result.xpAwarded} XP
          </div>
        )}
      </div>

      {/* Performance Label */}
      <h1 className={cn(
        "text-3xl md:text-4xl font-bold mb-2 bg-gradient-to-r bg-clip-text text-transparent animate-fade-in",
        performance.gradient
      )} style={{ animationDelay: '0.1s' }}>
        {performance.label}
      </h1>
      <p className="text-muted-foreground mb-2 animate-fade-in" style={{ animationDelay: '0.15s' }}>{simulado.title}</p>

      {/* Retake Badge */}
      {isRetake && (
        <div className="flex items-center gap-2 text-sm text-amber-400 mb-6 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/30 animate-fade-in" style={{ animationDelay: '0.2s' }}>
          <Info className="h-4 w-4" />
          <span>Modo Prática — Não pontua no ranking</span>
        </div>
      )}

      {/* Epic Score Display */}
      <div className="relative mb-8 animate-fade-in" style={{ animationDelay: '0.25s' }}>
        <div className={cn(
          "absolute inset-0 rounded-3xl blur-2xl opacity-30",
          result.passed ? "bg-emerald-500" : "bg-amber-500"
        )} />
        <div className="relative px-12 py-6 rounded-3xl bg-card/80 backdrop-blur border border-border/50">
          <div className={cn(
            "text-7xl md:text-8xl font-bold bg-gradient-to-b bg-clip-text text-transparent",
            result.passed ? "from-emerald-300 to-emerald-500" : "from-amber-300 to-amber-500"
          )}>
            {result.percentage}%
          </div>
          <p className="text-center text-muted-foreground mt-2">
            {result.score} de {simulado.total_questions * (simulado.points_per_question || 10)} pontos
          </p>
        </div>
      </div>

      {/* Stats Grid - Holographic Cards */}
      <div className="grid grid-cols-3 gap-4 mb-8 w-full max-w-md animate-fade-in" style={{ animationDelay: '0.3s' }}>
        <StatCard
          icon={<CheckCircle2 className="h-6 w-6 text-emerald-400" />}
          value={result.correctAnswers}
          label="Corretas"
          color="emerald"
        />
        <StatCard
          icon={<XCircle className="h-6 w-6 text-red-400" />}
          value={result.wrongAnswers}
          label="Erradas"
          color="red"
        />
        <StatCard
          icon={<Minus className="h-6 w-6 text-muted-foreground" />}
          value={result.unanswered}
          label="Em Branco"
          color="muted"
        />
      </div>

      {/* Additional Info */}
      <div className="flex items-center gap-6 text-sm text-muted-foreground mb-8 animate-fade-in" style={{ animationDelay: '0.35s' }}>
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-card/60 border border-border/50">
          <Clock className="h-4 w-4" />
          <span>{formatTime(result.timeSpentSeconds)}</span>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-card/60 border border-border/50">
          <TrendingUp className="h-4 w-4" />
          <span>{result.isScoredForRanking ? "Ranking atualizado" : "Prática"}</span>
        </div>
      </div>

      {/* Passing Score Info */}
      {simulado.passing_score && (
        <div className={cn(
          "flex items-center gap-3 px-6 py-3 rounded-xl mb-8 animate-fade-in",
          result.passed 
            ? "bg-emerald-500/10 border border-emerald-500/30" 
            : "bg-amber-500/10 border border-amber-500/30"
        )} style={{ animationDelay: '0.4s' }}>
          <Target className={cn("h-5 w-5", result.passed ? "text-emerald-400" : "text-amber-400")} />
          <span className={cn("text-sm", result.passed ? "text-emerald-400" : "text-amber-400")}>
            {result.passed 
              ? `Aprovado! Mínimo de ${simulado.passing_score}% atingido.`
              : `Mínimo: ${simulado.passing_score}%. Continue praticando!`
            }
          </span>
        </div>
      )}

      {/* Gabarito Countdown */}
      {gabaritoDate && gabaritoIn && gabaritoIn > 0 && (
        <div className="mb-8 animate-fade-in" style={{ animationDelay: '0.45s' }}>
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary/10 via-violet-500/10 to-primary/10 border border-primary/30 p-6 text-center">
            <div className="flex items-center justify-center gap-2 text-primary mb-2">
              <Calendar className="h-5 w-5" />
              <span className="font-medium">Gabarito será liberado em:</span>
            </div>
            <div className="text-3xl font-mono font-bold text-primary mb-2">
              {formatTime(gabaritoIn)}
            </div>
            <p className="text-sm text-muted-foreground">
              {format(gabaritoDate, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
            </p>
          </div>
        </div>
      )}

      {/* Gabarito Available Now */}
      {isGabaritoAvailable && (
        <div className="mb-8 px-6 py-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 animate-fade-in" style={{ animationDelay: '0.45s' }}>
          <p className="text-emerald-400 font-medium flex items-center justify-center gap-2">
            <CheckCircle2 className="h-5 w-5" />
            Gabarito comentado disponível!
          </p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 animate-fade-in" style={{ animationDelay: '0.5s' }}>
        {isGabaritoAvailable && onReview && (
          <Button 
            onClick={onReview} 
            className="min-w-[200px] bg-gradient-to-r from-primary to-violet-500 hover:from-primary/90 hover:to-violet-500/90 shadow-lg shadow-primary/30"
          >
            <Award className="h-5 w-5 mr-2" />
            Ver Gabarito Comentado
          </Button>
        )}
        {onExit && (
          <Button onClick={onExit} variant="outline" className="min-w-[160px]">
            Voltar aos Simulados
          </Button>
        )}
      </div>
    </div>
  );
}

function StatCard({
  icon,
  value,
  label,
  color,
}: {
  icon: React.ReactNode;
  value: number;
  label: string;
  color: "emerald" | "red" | "muted";
}) {
  const colorClasses = {
    emerald: "border-emerald-500/30 hover:border-emerald-500/50",
    red: "border-red-500/30 hover:border-red-500/50",
    muted: "border-border/50 hover:border-border",
  };

  return (
    <div className={cn(
      "flex flex-col items-center gap-2 p-5 rounded-2xl bg-card/80 backdrop-blur border transition-colors",
      colorClasses[color]
    )}>
      {icon}
      <span className="text-3xl font-bold">{value}</span>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  );
}
