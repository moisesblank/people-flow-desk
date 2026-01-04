/**
 * 🎯 SIMULADOS — Tela INVALIDATED
 * Constituição SYNAPSE Ω v10.0
 * 
 * Estado: Tentativa invalidada (Hard Mode)
 * Ação: Exibir motivo e opções
 */

import React from "react";
import { XCircle, AlertTriangle, RotateCcw, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SimuladoAttempt, Simulado } from "@/components/simulados/types";

interface SimuladoInvalidatedScreenProps {
  simulado: Simulado;
  attempt: SimuladoAttempt;
  onRetry?: () => void;
  onExit?: () => void;
  canRetry?: boolean;
}

export function SimuladoInvalidatedScreen({
  simulado,
  attempt,
  onRetry,
  onExit,
  canRetry = true,
}: SimuladoInvalidatedScreenProps) {
  const reason = attempt.invalidation_reason || "UNKNOWN";
  const reasonInfo = getReasonInfo(reason);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8">
      {/* Ícone */}
      <div className="relative mb-8">
        <div className="w-32 h-32 rounded-full bg-red-500/10 flex items-center justify-center">
          <XCircle className="h-16 w-16 text-red-500" />
        </div>
      </div>

      {/* Título */}
      <h1 className="text-2xl md:text-3xl font-bold text-red-400 mb-2">
        Tentativa Invalidada
      </h1>
      <p className="text-muted-foreground mb-8 max-w-md">
        {simulado.title}
      </p>

      {/* Motivo */}
      <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 mb-8 max-w-md">
        <div className="flex items-start gap-4">
          <AlertTriangle className="h-6 w-6 text-red-500 shrink-0 mt-1" />
          <div className="text-left">
            <p className="font-semibold text-red-400 mb-1">{reasonInfo.title}</p>
            <p className="text-sm text-red-400/70">{reasonInfo.description}</p>
          </div>
        </div>
      </div>

      {/* Estatísticas da tentativa */}
      <div className="bg-muted/30 rounded-lg p-4 mb-8 max-w-md">
        <p className="text-sm text-muted-foreground mb-2">Detalhes da tentativa:</p>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Tentativa</p>
            <p className="font-medium">#{attempt.attempt_number}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Trocas de aba</p>
            <p className="font-medium text-red-400">{attempt.tab_switches}</p>
          </div>
        </div>
      </div>

      {/* Ações */}
      <div className="flex flex-col sm:flex-row gap-4">
        {canRetry && onRetry && (
          <Button onClick={onRetry} variant="outline">
            <RotateCcw className="h-4 w-4 mr-2" />
            Tentar Novamente
          </Button>
        )}
        {onExit && (
          <Button onClick={onExit} variant="ghost">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar aos Simulados
          </Button>
        )}
      </div>

      {/* Aviso */}
      {canRetry && (
        <p className="text-xs text-muted-foreground mt-8 max-w-md">
          Novas tentativas não contarão para o ranking, mas você pode praticar à vontade.
        </p>
      )}
    </div>
  );
}

function getReasonInfo(reason: string): { title: string; description: string } {
  const reasons: Record<string, { title: string; description: string }> = {
    TAB_SWITCH_LIMIT_EXCEEDED: {
      title: "Limite de trocas de aba excedido",
      description: "Você trocou de aba mais vezes do que o permitido no Modo Hard. Isso é considerado uma violação das regras do simulado.",
    },
    CAMERA_DISABLED: {
      title: "Câmera desativada",
      description: "A câmera foi desativada ou bloqueada durante o simulado, o que viola as regras do Modo Hard.",
    },
    MANUAL_INVALIDATION: {
      title: "Invalidação manual",
      description: "Um administrador invalidou esta tentativa. Entre em contato com o suporte para mais informações.",
    },
    TIMEOUT: {
      title: "Tempo esgotado sem resposta",
      description: "O simulado foi encerrado por inatividade prolongada.",
    },
    UNKNOWN: {
      title: "Violação detectada",
      description: "Uma violação das regras do simulado foi detectada. Esta tentativa foi invalidada automaticamente.",
    },
  };

  return reasons[reason] || reasons.UNKNOWN;
}
