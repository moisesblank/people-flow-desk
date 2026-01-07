/**
 * 🎯 SIMULADOS — Tela INVALIDATED
 * Design: Year 2300 Cinematic
 * 
 * Estado: Tentativa invalidada (Hard Mode)
 * Visual: Danger/Warning épico
 */

import React, { useState } from "react";
import { 
  XCircle, AlertTriangle, RotateCcw, ArrowLeft,
  MessageCircle, FileQuestion, ExternalLink, Skull, Shield, Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SimuladoAttempt, Simulado } from "@/components/simulados/types";
import { SimuladoDisputeModal } from "./SimuladoDisputeModal";
import { cn } from "@/lib/utils";

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
  const [showDispute, setShowDispute] = useState(false);
  const reason = attempt.invalidation_reason || "UNKNOWN";
  const reasonInfo = getReasonInfo(reason);
  const supportEmail = "suporte@moisesmedeiros.com.br";

  return (
    <div className="relative flex flex-col items-center justify-center min-h-[70vh] text-center p-8 overflow-hidden">
      {/* Background danger effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-red-500/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-orange-500/10 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '0.5s' }} />
        
        {/* Scan lines effect */}
        <div className="absolute inset-0 bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(239,68,68,0.03)_2px,rgba(239,68,68,0.03)_4px)]" />
      </div>

      {/* Danger Icon - Epic Animation */}
      <div className="relative mb-10 animate-fade-in">
        {/* Outer danger ring */}
        <div className="absolute -inset-8 rounded-full border-2 border-red-500/30 animate-ping" style={{ animationDuration: '2s' }} />
        <div className="absolute -inset-6 rounded-full border border-red-500/20 animate-pulse" />
        <div className="absolute -inset-4 rounded-full border border-red-500/30" />
        
        {/* Core danger orb */}
        <div className="relative w-32 h-32 rounded-full bg-gradient-to-br from-red-500/20 via-red-600/10 to-orange-500/20 flex items-center justify-center backdrop-blur-sm border-2 border-red-500/50">
          <XCircle className="h-16 w-16 text-red-500" />
          
          {/* Danger pulse */}
          <div className="absolute inset-0 rounded-full bg-red-500/10 animate-ping" style={{ animationDuration: '1.5s' }} />
        </div>
      </div>

      {/* Title */}
      <h1 className="text-3xl md:text-4xl font-bold mb-3 bg-gradient-to-r from-red-400 via-orange-400 to-red-400 bg-clip-text text-transparent animate-fade-in" style={{ animationDelay: '0.1s' }}>
        Tentativa Invalidada
      </h1>
      <p className="text-muted-foreground mb-8 max-w-md animate-fade-in" style={{ animationDelay: '0.15s' }}>
        {simulado.title}
      </p>

      {/* Reason Card - Danger Style */}
      <div className="w-full max-w-lg mb-8 animate-fade-in" style={{ animationDelay: '0.2s' }}>
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-red-500/10 via-card to-red-900/10 border border-red-500/40 p-6">
          {/* Animated danger border */}
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-red-500/0 via-red-500/10 to-red-500/0 animate-pulse" />
          
          <div className="relative flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center shrink-0">
              <AlertTriangle className="h-6 w-6 text-white" />
            </div>
            <div className="text-left">
              <p className="font-bold text-red-400 text-lg mb-1">{reasonInfo.title}</p>
              <p className="text-sm text-red-400/70">{reasonInfo.description}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Attempt Details - Glass Card */}
      <div className="w-full max-w-lg mb-8 animate-fade-in" style={{ animationDelay: '0.25s' }}>
        <div className="rounded-2xl bg-card/60 backdrop-blur border border-border/50 p-6">
          <p className="text-sm text-muted-foreground mb-4 flex items-center justify-center gap-2">
            <Shield className="h-4 w-4" />
            Detalhes da Tentativa
          </p>
          <div className="grid grid-cols-2 gap-6">
            <div className="text-center p-4 rounded-xl bg-muted/30">
              <p className="text-2xl font-bold">#{attempt.attempt_number}</p>
              <p className="text-xs text-muted-foreground">Tentativa</p>
            </div>
            <div className="text-center p-4 rounded-xl bg-red-500/10 border border-red-500/30">
              <p className="text-2xl font-bold text-red-400">{attempt.tab_switches}</p>
              <p className="text-xs text-red-400/70">Trocas de Aba</p>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 mb-8 animate-fade-in" style={{ animationDelay: '0.3s' }}>
        {canRetry && onRetry && (
          <Button 
            onClick={onRetry} 
            variant="outline"
            className="min-w-[160px] border-border/50 hover:border-primary/50"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Tentar Novamente
          </Button>
        )}
        <Button 
          onClick={() => setShowDispute(true)} 
          className="min-w-[140px] bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 shadow-lg shadow-red-500/30"
        >
          <FileQuestion className="h-4 w-4 mr-2" />
          Contestar
        </Button>
        {onExit && (
          <Button onClick={onExit} variant="ghost" className="min-w-[100px]">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        )}
      </div>

      {/* Support Link */}
      <div className="mb-8 animate-fade-in" style={{ animationDelay: '0.35s' }}>
        <p className="text-xs text-muted-foreground mb-2">Precisa de ajuda?</p>
        <a
          href={`mailto:${supportEmail}?subject=Contestação Simulado: ${simulado.title}`}
          className="inline-flex items-center gap-2 text-sm text-primary hover:underline px-4 py-2 rounded-full bg-primary/10 border border-primary/30 transition-colors hover:bg-primary/20"
        >
          <MessageCircle className="h-4 w-4" />
          {supportEmail}
          <ExternalLink className="h-3 w-3" />
        </a>
      </div>

      {/* Retry Notice */}
      {canRetry && (
        <p className="text-xs text-muted-foreground max-w-md animate-fade-in" style={{ animationDelay: '0.4s' }}>
          <Zap className="h-3 w-3 inline mr-1" />
          Novas tentativas não contarão para o ranking, mas você pode praticar à vontade.
        </p>
      )}

      {/* FAQ Section */}
      <div className="mt-10 w-full max-w-lg text-left animate-fade-in" style={{ animationDelay: '0.45s' }}>
        <h3 className="text-sm font-semibold mb-4 flex items-center gap-2 text-muted-foreground">
          <FileQuestion className="h-4 w-4" />
          Perguntas Frequentes
        </h3>
        <div className="space-y-3">
          <details className="group rounded-xl bg-card/60 backdrop-blur border border-border/50 overflow-hidden">
            <summary className="cursor-pointer p-4 font-medium text-sm flex items-center justify-between hover:bg-muted/30 transition-colors">
              Por que minha tentativa foi invalidada?
              <span className="text-muted-foreground group-open:rotate-180 transition-transform">▼</span>
            </summary>
            <p className="px-4 pb-4 text-sm text-muted-foreground">
              O Modo Hard monitora trocas de aba, câmera e outras atividades. 
              Violar as regras resulta em invalidação automática para garantir 
              a integridade do simulado.
            </p>
          </details>

          <details className="group rounded-xl bg-card/60 backdrop-blur border border-border/50 overflow-hidden">
            <summary className="cursor-pointer p-4 font-medium text-sm flex items-center justify-between hover:bg-muted/30 transition-colors">
              Como funciona a contestação?
              <span className="text-muted-foreground group-open:rotate-180 transition-transform">▼</span>
            </summary>
            <p className="px-4 pb-4 text-sm text-muted-foreground">
              Ao clicar em "Contestar", você abre um chamado que será analisado 
              pela coordenação. Forneça detalhes sobre o que aconteceu.
            </p>
          </details>
        </div>
      </div>

      {/* Dispute Modal */}
      <SimuladoDisputeModal
        open={showDispute}
        onOpenChange={setShowDispute}
        simuladoId={simulado.id}
        attemptId={attempt.id}
        simuladoTitle={simulado.title}
      />
    </div>
  );
}

function getReasonInfo(reason: string): { title: string; description: string } {
  const reasons: Record<string, { title: string; description: string }> = {
    TAB_SWITCH_LIMIT_EXCEEDED: {
      title: "Limite de trocas de aba excedido",
      description: "Você trocou de aba mais vezes do que o permitido no Modo Hard.",
    },
    CAMERA_DISABLED: {
      title: "Câmera desativada",
      description: "A câmera foi desativada ou bloqueada durante o simulado.",
    },
    MANUAL_INVALIDATION: {
      title: "Invalidação manual",
      description: "Um administrador invalidou esta tentativa.",
    },
    TIMEOUT: {
      title: "Tempo esgotado",
      description: "O simulado foi encerrado por inatividade prolongada.",
    },
    UNKNOWN: {
      title: "Violação detectada",
      description: "Uma violação das regras foi detectada automaticamente.",
    },
  };

  return reasons[reason] || reasons.UNKNOWN;
}
