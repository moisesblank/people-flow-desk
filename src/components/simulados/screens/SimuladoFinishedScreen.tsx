/**
 * 🎯 SIMULADOS — Tela FINISHED (Score Only)
 * Constituição SYNAPSE Ω v10.0
 * 
 * Estado: Finalizado, gabarito ainda não liberado
 * Ação: Exibir score e informar horário do gabarito
 */

import React from "react";
import { Trophy, Clock, Calendar, CheckCircle2, XCircle, Minus, Star } from "lucide-react";
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
        {result.xpAwarded > 0 && (
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-4 py-1 bg-primary rounded-full text-primary-foreground text-sm font-bold flex items-center gap-1">
            <Star className="h-4 w-4" />
            +{result.xpAwarded} XP
          </div>
        )}
      </div>

      {/* Título */}
      <h1 className="text-2xl md:text-3xl font-bold mb-2">
        {result.passed ? "Parabéns!" : "Simulado Finalizado"}
      </h1>
      <p className="text-muted-foreground mb-2">{simulado.title}</p>

      {/* Aviso Retake */}
      {isRetake && (
        <p className="text-sm text-amber-400 mb-4">
          Tentativa de prática (não pontua no ranking)
        </p>
      )}

      {/* Score Principal */}
      <div className="text-6xl font-bold mb-8">
        <span className={result.passed ? "text-green-400" : "text-amber-400"}>
          {result.percentage}%
        </span>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-3 gap-4 mb-8 max-w-sm w-full">
        <StatCard
          icon={<CheckCircle2 className="h-5 w-5 text-green-500" />}
          value={result.correctAnswers}
          label="Corretas"
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

      {/* Tempo gasto */}
      <div className="flex items-center gap-2 text-muted-foreground mb-8">
        <Clock className="h-4 w-4" />
        <span>Tempo: {formatTime(result.timeSpentSeconds)}</span>
      </div>

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
          <p className="text-green-400 font-medium">✓ Gabarito já está disponível!</p>
        </div>
      )}

      {/* Ações */}
      <div className="flex flex-col sm:flex-row gap-3">
        {isGabaritoAvailable && onReview && (
          <Button onClick={onReview}>Ver gabarito</Button>
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
}: {
  icon: React.ReactNode;
  value: number;
  label: string;
}) {
  return (
    <div className="flex flex-col items-center gap-1 p-4 rounded-lg bg-card border border-border">
      {icon}
      <span className="text-2xl font-bold">{value}</span>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  );
}
