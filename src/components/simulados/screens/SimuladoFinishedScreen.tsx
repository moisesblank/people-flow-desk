/**
 * 🎯 SIMULADOS — Tela FINISHED (Pós-Finalização)
 * Constituição SYNAPSE Ω v10.4 | AGENT_EXECUTION
 * 
 * Estado: Simulado finalizado
 * Exibição: Score do SERVIDOR (nunca calculado no frontend)
 * 
 * REGRAS OBRIGATÓRIAS:
 * - Todos os valores vêm do resultado retornado pelo RPC finish_simulado_attempt
 * - NÃO há recalculação de score no frontend
 * - XP é exibido apenas se isScoredForRanking = true (primeira tentativa)
 * - Gabarito liberado conforme results_released_at do servidor
 */

import React from "react";
import { 
  Trophy, Clock, Calendar, CheckCircle2, XCircle, Minus, Star, 
  Award, Target, TrendingUp, Info 
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
  gabaritoIn?: number; // segundos até liberação
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

  // Determinar nível de performance
  const getPerformanceLevel = (percentage: number) => {
    if (percentage >= 90) return { label: "Excelente!", color: "text-green-400", bg: "bg-green-500/10" };
    if (percentage >= 70) return { label: "Muito Bom!", color: "text-emerald-400", bg: "bg-emerald-500/10" };
    if (percentage >= 50) return { label: "Bom!", color: "text-amber-400", bg: "bg-amber-500/10" };
    return { label: "Continue Praticando", color: "text-orange-400", bg: "bg-orange-500/10" };
  };

  const performance = getPerformanceLevel(result.percentage);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-8">
      {/* Ícone de resultado */}
      <div className="relative mb-8">
        <div
          className={cn(
            "w-32 h-32 rounded-full flex items-center justify-center",
            result.passed ? "bg-green-500/10" : "bg-amber-500/10"
          )}
        >
          <Trophy
            className={cn(
              "h-16 w-16",
              result.passed ? "text-green-500" : "text-amber-500"
            )}
          />
        </div>
        {/* XP Badge - Apenas se pontuou para ranking */}
        {result.xpAwarded > 0 && result.isScoredForRanking && (
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-4 py-1 bg-primary rounded-full text-primary-foreground text-sm font-bold flex items-center gap-1">
            <Star className="h-4 w-4" />
            +{result.xpAwarded} XP
          </div>
        )}
      </div>

      {/* Título e Performance */}
      <h1 className={cn("text-2xl md:text-3xl font-bold mb-2", performance.color)}>
        {result.passed ? performance.label : "Simulado Finalizado"}
      </h1>
      <p className="text-muted-foreground mb-2">{simulado.title}</p>

      {/* Aviso Retake */}
      {isRetake && (
        <div className="flex items-center gap-2 text-sm text-amber-400 mb-4 px-3 py-1 rounded-full bg-amber-500/10">
          <Info className="h-4 w-4" />
          <span>Tentativa de prática (não pontua no ranking)</span>
        </div>
      )}

      {/* Score Principal (do SERVIDOR) */}
      <div className="text-6xl font-bold mb-2">
        <span className={result.passed ? "text-green-400" : "text-amber-400"}>
          {result.percentage}%
        </span>
      </div>
      
      {/* Pontuação absoluta */}
      <p className="text-muted-foreground mb-6">
        {result.score} de {simulado.total_questions * (simulado.points_per_question || 10)} pontos
      </p>

      {/* Estatísticas detalhadas (do SERVIDOR) */}
      <div className="grid grid-cols-3 gap-4 mb-6 max-w-sm w-full">
        <StatCard
          icon={<CheckCircle2 className="h-5 w-5 text-green-500" />}
          value={result.correctAnswers}
          label="Corretas"
          sublabel={`${simulado.points_per_question || 10}pts cada`}
        />
        <StatCard
          icon={<XCircle className="h-5 w-5 text-red-500" />}
          value={result.wrongAnswers}
          label="Erradas"
        />
        <StatCard
          icon={<Minus className="h-5 w-5 text-muted-foreground" />}
          value={result.unanswered}
          label="Em branco"
        />
      </div>

      {/* Informações adicionais */}
      <div className="flex items-center gap-6 text-sm text-muted-foreground mb-8">
        {/* Tempo gasto */}
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4" />
          <span>Tempo: {formatTime(result.timeSpentSeconds)}</span>
        </div>
        
        {/* Status de ranking */}
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4" />
          <span>
            {result.isScoredForRanking ? "Pontuação registrada" : "Sem pontuação (prática)"}
          </span>
        </div>
      </div>

      {/* Nota de aprovação */}
      {simulado.passing_score && (
        <div className={cn(
          "flex items-center gap-2 px-4 py-2 rounded-lg mb-6",
          result.passed ? "bg-green-500/10 text-green-400" : "bg-amber-500/10 text-amber-400"
        )}>
          <Target className="h-4 w-4" />
          <span className="text-sm">
            {result.passed 
              ? `Aprovado! Mínimo de ${simulado.passing_score}% atingido.`
              : `Nota mínima: ${simulado.passing_score}%. Continue praticando!`
            }
          </span>
        </div>
      )}

      {/* Info do Gabarito */}
      {gabaritoDate && gabaritoIn && gabaritoIn > 0 && (
        <div className="bg-primary/10 border border-primary/30 rounded-xl p-6 mb-8 max-w-md text-center">
          <div className="flex items-center justify-center gap-2 text-primary mb-2">
            <Calendar className="h-5 w-5" />
            <span className="font-medium">Gabarito será liberado em:</span>
          </div>
          <div className="text-2xl font-mono font-bold text-primary mb-2">
            {formatTime(gabaritoIn)}
          </div>
          <p className="text-sm text-muted-foreground">
            {format(gabaritoDate, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
          </p>
        </div>
      )}

      {/* Gabarito disponível agora */}
      {isGabaritoAvailable && (
        <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 mb-6 text-center w-full max-w-md">
          <p className="text-green-400 font-medium flex items-center justify-center gap-2">
            <CheckCircle2 className="h-5 w-5" />
            Gabarito comentado já está disponível!
          </p>
        </div>
      )}

      {/* Ações */}
      <div className="flex flex-col sm:flex-row gap-3">
        {isGabaritoAvailable && onReview && (
          <Button onClick={onReview} className="gap-2">
            <Award className="h-4 w-4" />
            Ver Gabarito Comentado
          </Button>
        )}
        {onExit && (
          <Button onClick={onExit} variant="outline">
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
  sublabel,
}: {
  icon: React.ReactNode;
  value: number;
  label: string;
  sublabel?: string;
}) {
  return (
    <div className="flex flex-col items-center gap-1 p-4 rounded-lg bg-card border border-border">
      {icon}
      <span className="text-2xl font-bold">{value}</span>
      <span className="text-xs text-muted-foreground">{label}</span>
      {sublabel && (
        <span className="text-[10px] text-muted-foreground/70">{sublabel}</span>
      )}
    </div>
  );
}