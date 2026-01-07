/**
 * 🎯 SIMULADOS — Tela READY
 * Constituição SYNAPSE Ω v10.0
 * 
 * Estado: Liberado para iniciar
 * Ação: Exibir regras e botão iniciar
 */

import React from "react";
import { Play, Clock, FileQuestion, Shield, AlertTriangle, Camera, Lightbulb, ListChecks } from "lucide-react";
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
  // Formatar horas
  const hours = Math.floor(simulado.duration_minutes / 60);
  const mins = simulado.duration_minutes % 60;
  const tempoFormatado = hours > 0 
    ? `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')} Hora(s)`
    : `${simulado.duration_minutes} Minuto(s)`;

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] p-6 md:p-8 overflow-y-auto">
      {/* Header */}
      <div className="text-center mb-6">
        <h1 className="text-2xl md:text-3xl font-bold mb-2">
          {simulado.title}
        </h1>
        {simulado.description && (
          <p className="text-muted-foreground max-w-md">
            {simulado.description}
          </p>
        )}
      </div>

      {/* Aviso de Retake */}
      {isRetake && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 mb-6 max-w-lg w-full">
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

      {/* Info Cards - Tempo e Questões destacados */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 max-w-2xl w-full">
        <InfoCard
          icon={<Clock className="h-5 w-5" />}
          label="Tempo do Simulado"
          value={tempoFormatado}
          highlight
          highlightColor="indigo"
        />
        <InfoCard
          icon={<FileQuestion className="h-5 w-5" />}
          label="Quantidade de Questões"
          value={`${simulado.total_questions || 0} Questões`}
          highlight
          highlightColor="violet"
        />
        <InfoCard
          icon={<Shield className="h-5 w-5" />}
          label="Modo"
          value={simulado.is_hard_mode ? "Hard" : "Normal"}
          highlight={simulado.is_hard_mode}
          highlightColor="red"
        />
        <InfoCard
          icon={<Camera className="h-5 w-5" />}
          label="Câmera"
          value={simulado.requires_camera ? "Sim" : "Não"}
          highlight={simulado.requires_camera}
          highlightColor="red"
        />
      </div>

      {/* Dicas do Moisés Medeiros */}
      <div className="bg-gradient-to-br from-indigo-500/10 to-violet-500/10 border border-indigo-500/30 rounded-lg p-5 mb-5 max-w-lg w-full">
        <div className="flex items-start gap-3">
          <Lightbulb className="h-5 w-5 text-indigo-400 shrink-0 mt-0.5" />
          <div className="space-y-3">
            <p className="font-semibold text-indigo-300">Dicas do Moisés Medeiros</p>
            <ul className="text-sm text-muted-foreground space-y-2">
              <li className="flex gap-2">
                <span className="text-indigo-400">•</span>
                <span>Faça o simulado considerando que você está na sua prova. Concentre-se e faça primeiro as questões que você domina.</span>
              </li>
              <li className="flex gap-2">
                <span className="text-indigo-400">•</span>
                <span>Controle seu tempo e ritmo de prova, levando em conta o tempo da prova e a quantidade de questões que você ainda tem que realizar.</span>
              </li>
              <li className="flex gap-2">
                <span className="text-indigo-400">•</span>
                <span>Escolha um local tranquilo evitando interrupções.</span>
              </li>
              <li className="flex gap-2">
                <span className="text-indigo-400">•</span>
                <span>Lembre-se, na prova não há consulta.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Regras do Modo Hard */}
      {simulado.is_hard_mode && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-5 max-w-lg w-full">
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

      {/* Regras do Simulado - Expandidas */}
      <div className="bg-muted/30 border border-border rounded-lg p-5 mb-6 max-w-lg w-full">
        <div className="flex items-start gap-3">
          <ListChecks className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
          <div className="space-y-3">
            <p className="font-semibold text-foreground">Regras do Simulado</p>
            <ul className="text-sm text-muted-foreground space-y-2">
              <li className="flex gap-2">
                <span className="text-primary">•</span>
                <span>O tempo total é de {simulado.duration_minutes} minutos, com {simulado.total_questions} questões. Após esse período, nenhuma pontuação será computada.</span>
              </li>
              <li className="flex gap-2">
                <span className="text-primary">•</span>
                <span>Cada questão vale 10 pontos, no final essas pontuações irão somar ao ranking geral e valerá premiações.</span>
              </li>
              <li className="flex gap-2">
                <span className="text-primary">•</span>
                <span>A pontuação será registrada apenas na primeira tentativa. No entanto, é possível refazer o simulado, embora não pontue novamente.</span>
              </li>
              <li className="flex gap-2">
                <span className="text-primary">•</span>
                <span>Caso deseje consultá-lo posteriormente, clique em "Simulados realizados".</span>
              </li>
              <li className="flex gap-2">
                <span className="text-primary">•</span>
                <span>Ao clicar em "Finalizar", será exibido o gabarito comentado, e não será possível retornar à tentativa.</span>
              </li>
              <li className="flex gap-2">
                <span className="text-primary">•</span>
                <span>Respostas são salvas automaticamente.</span>
              </li>
              <li className="flex gap-2">
                <span className="text-primary">•</span>
                <span>Você pode navegar entre as questões.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Botão Iniciar */}
      <Button
        size="lg"
        onClick={onStart}
        disabled={isLoading}
        className="min-w-[220px] bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white"
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
  highlightColor = "red",
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  highlight?: boolean;
  highlightColor?: "red" | "indigo" | "violet";
}) {
  const colorClasses = {
    red: {
      bg: "bg-red-500/10 border-red-500/30",
      text: "text-red-400",
    },
    indigo: {
      bg: "bg-indigo-500/10 border-indigo-500/30",
      text: "text-indigo-400",
    },
    violet: {
      bg: "bg-violet-500/10 border-violet-500/30",
      text: "text-violet-400",
    },
  };

  const colors = colorClasses[highlightColor];

  return (
    <div
      className={cn(
        "flex flex-col items-center gap-2 p-4 rounded-lg border transition-all",
        highlight ? colors.bg : "bg-card border-border"
      )}
    >
      <div className={cn("text-muted-foreground", highlight && colors.text)}>
        {icon}
      </div>
      <div className="text-center">
        <p className={cn("text-sm md:text-base font-bold", highlight && colors.text)}>{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}
