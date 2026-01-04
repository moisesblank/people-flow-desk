/**
 * 🎯 SIMULADOS — Tela READY
 * Constituição SYNAPSE Ω v10.0
 * 
 * Estado: Liberado para iniciar
 * Ação: Exibir regras e botão iniciar
 */

import React from "react";
import { Play, Clock, FileQuestion, Shield, AlertTriangle, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Simulado } from "@/components/simulados/types";
import { cn } from "@/lib/utils";

interface SimuladoReadyScreenProps {
  simulado: Simulado;
  isRetake: boolean;
  attemptNumber: number;
  onStart: () => void;
  isLoading?: boolean;
}

export function SimuladoReadyScreen({
  simulado,
  isRetake,
  attemptNumber,
  onStart,
  isLoading = false,
}: SimuladoReadyScreenProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-2xl md:text-3xl font-bold mb-2">
          {simulado.title}
        </h1>
        <p className="text-muted-foreground max-w-md">
          {simulado.description}
        </p>
      </div>

      {/* Aviso de Retake */}
      {isRetake && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 mb-6 max-w-md">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-amber-400">Tentativa #{attemptNumber}</p>
              <p className="text-sm text-amber-400/70">
                Esta tentativa NÃO contará para o ranking nem gerará XP.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Info Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 max-w-2xl w-full">
        <InfoCard
          icon={<FileQuestion className="h-5 w-5" />}
          label="Questões"
          value={simulado.total_questions?.toString() || "—"}
        />
        <InfoCard
          icon={<Clock className="h-5 w-5" />}
          label="Duração"
          value={`${simulado.duration_minutes} min`}
        />
        <InfoCard
          icon={<Shield className="h-5 w-5" />}
          label="Modo"
          value={simulado.is_hard_mode ? "Hard" : "Normal"}
          highlight={simulado.is_hard_mode}
        />
        <InfoCard
          icon={<Camera className="h-5 w-5" />}
          label="Câmera"
          value={simulado.requires_camera ? "Sim" : "Não"}
          highlight={simulado.requires_camera}
        />
      </div>

      {/* Regras do Modo Hard */}
      {simulado.is_hard_mode && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-6 max-w-md">
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
            <div className="space-y-2">
              <p className="font-medium text-red-400">Modo Hard Ativado</p>
              <ul className="text-sm text-red-400/70 space-y-1">
                <li>• Máximo de {simulado.max_tab_switches} trocas de aba</li>
                {simulado.requires_camera && <li>• Câmera será ativada durante o simulado</li>}
                <li>• Violações resultam em desclassificação</li>
                <li>• Tentativa inválida não pode ser retomada</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Regras Gerais */}
      <div className="bg-muted/30 rounded-lg p-4 mb-8 max-w-md">
        <p className="text-sm text-muted-foreground mb-2">Regras do Simulado:</p>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>• Respostas são salvas automaticamente</li>
          <li>• Você pode navegar entre as questões</li>
          <li>• Ao finalizar o tempo, o simulado é encerrado automaticamente</li>
          <li>• Apenas a primeira tentativa válida conta para o ranking</li>
        </ul>
      </div>

      {/* Botão Iniciar */}
      <Button
        size="lg"
        onClick={onStart}
        disabled={isLoading}
        className="min-w-[200px]"
      >
        {isLoading ? (
          <>
            <div className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin mr-2" />
            Iniciando...
          </>
        ) : (
          <>
            <Play className="h-5 w-5 mr-2" />
            {isRetake ? "Iniciar Prática" : "Iniciar Simulado"}
          </>
        )}
      </Button>
    </div>
  );
}

function InfoCard({
  icon,
  label,
  value,
  highlight = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-2 p-4 rounded-lg border",
        highlight ? "bg-red-500/10 border-red-500/30" : "bg-card border-border"
      )}
    >
      <div className={cn("text-muted-foreground", highlight && "text-red-400")}>
        {icon}
      </div>
      <div className="text-center">
        <p className={cn("text-lg font-bold", highlight && "text-red-400")}>{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}
