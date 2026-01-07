/**
 * 🎯 SIMULADOS — Tela READY
 * Design: Year 2300 Cinematic
 * 
 * Estado: Liberado para iniciar
 * Ação: Exibir regras épicas e botão iniciar
 */

import React from "react";
import { 
  Play, Clock, FileQuestion, Shield, AlertTriangle, Camera, 
  Lightbulb, ListChecks, Zap, Rocket, Trophy, Target
} from "lucide-react";
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
  const hours = Math.floor(simulado.duration_minutes / 60);
  const mins = simulado.duration_minutes % 60;
  const tempoFormatado = hours > 0 
    ? `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')} Hora(s)`
    : `${simulado.duration_minutes} Minuto(s)`;

  return (
    <div className="relative flex flex-col items-center justify-start min-h-[80vh] p-6 md:p-8 overflow-y-auto">
      {/* Background effects */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-gradient-to-b from-primary/10 to-transparent rounded-full blur-[80px]" />
      </div>

      {/* Header with holographic effect */}
      <div className="relative text-center mb-8 animate-fade-in">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/30 text-primary text-sm font-medium mb-4">
          <Rocket className="h-4 w-4" />
          {isRetake ? `Tentativa #${attemptNumber}` : "Pronto para começar"}
        </div>
        
        <h1 className="text-3xl md:text-4xl font-bold mb-3 bg-gradient-to-r from-foreground via-primary to-violet-400 bg-clip-text text-transparent">
          {simulado.title}
        </h1>
        {simulado.description && (
          <p className="text-muted-foreground max-w-lg mx-auto">
            {simulado.description}
          </p>
        )}
      </div>

      {/* Retake Warning */}
      {isRetake && (
        <div className="w-full max-w-2xl mb-6 animate-fade-in" style={{ animationDelay: '0.1s' }}>
          <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-amber-500/10 border border-amber-500/30 p-4">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml,...')] opacity-5" />
            <div className="relative flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center shrink-0">
                <AlertTriangle className="h-6 w-6 text-amber-400" />
              </div>
              <div>
                <p className="font-semibold text-amber-300">Modo Prática</p>
                <p className="text-sm text-amber-400/70">
                  Esta tentativa NÃO contará para o ranking nem gerará XP.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stats Orbs - Holographic Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 w-full max-w-3xl animate-fade-in" style={{ animationDelay: '0.15s' }}>
        <StatOrb
          icon={<Clock className="h-6 w-6" />}
          value={tempoFormatado}
          label="Tempo"
          gradient="from-indigo-500 to-blue-500"
        />
        <StatOrb
          icon={<FileQuestion className="h-6 w-6" />}
          value={`${simulado.total_questions || 0}`}
          label="Questões"
          gradient="from-violet-500 to-purple-500"
        />
        <StatOrb
          icon={<Trophy className="h-6 w-6" />}
          value={`${(simulado.total_questions || 0) * 10}`}
          label="XP Máximo"
          gradient="from-amber-500 to-orange-500"
        />
        <StatOrb
          icon={<Target className="h-6 w-6" />}
          value={`${simulado.passing_score || 60}%`}
          label="Mínimo"
          gradient="from-emerald-500 to-green-500"
        />
      </div>

      {/* Hard Mode & Camera Indicators */}
      {(simulado.is_hard_mode || simulado.requires_camera) && (
        <div className="flex gap-3 mb-6 animate-fade-in" style={{ animationDelay: '0.2s' }}>
          {simulado.is_hard_mode && (
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-red-500/10 border border-red-500/30">
              <Shield className="h-4 w-4 text-red-400" />
              <span className="text-sm font-medium text-red-400">Modo Hard</span>
            </div>
          )}
          {simulado.requires_camera && (
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-red-500/10 border border-red-500/30">
              <Camera className="h-4 w-4 text-red-400" />
              <span className="text-sm font-medium text-red-400">Câmera Ativa</span>
            </div>
          )}
        </div>
      )}

      {/* Dicas do Professor - Glass Card */}
      <div className="w-full max-w-2xl mb-6 animate-fade-in" style={{ animationDelay: '0.25s' }}>
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-500/10 via-violet-500/5 to-indigo-500/10 border border-indigo-500/30 p-6 backdrop-blur-sm">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl" />
          
          <div className="relative">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center">
                <Lightbulb className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="font-bold text-indigo-300">Dicas do Professor</p>
                <p className="text-xs text-indigo-400/70">Moisés Medeiros</p>
              </div>
            </div>
            
            <ul className="space-y-3">
              {[
                "Concentre-se e faça primeiro as questões que você domina.",
                "Controle seu tempo considerando a quantidade de questões.",
                "Escolha um local tranquilo evitando interrupções.",
                "Lembre-se: na prova real não há consulta."
              ].map((tip, i) => (
                <li key={i} className="flex gap-3 text-sm text-muted-foreground">
                  <Zap className="h-4 w-4 text-indigo-400 shrink-0 mt-0.5" />
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Hard Mode Rules */}
      {simulado.is_hard_mode && (
        <div className="w-full max-w-2xl mb-6 animate-fade-in" style={{ animationDelay: '0.3s' }}>
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-red-500/10 to-red-900/10 border border-red-500/30 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center">
                <Shield className="h-5 w-5 text-white" />
              </div>
              <p className="font-bold text-red-400">Regras do Modo Hard</p>
            </div>
            
            <ul className="space-y-2 text-sm text-red-400/80">
              <li className="flex gap-2">
                <span className="text-red-500">•</span>
                <span>Máximo de {simulado.max_tab_switches} trocas de aba</span>
              </li>
              {simulado.requires_camera && (
                <li className="flex gap-2">
                  <span className="text-red-500">•</span>
                  <span>Câmera será ativada durante o simulado</span>
                </li>
              )}
              <li className="flex gap-2">
                <span className="text-red-500">•</span>
                <span>Violações resultam em desclassificação</span>
              </li>
            </ul>
          </div>
        </div>
      )}

      {/* Regras Gerais - Compact Glass Card */}
      <div className="w-full max-w-2xl mb-8 animate-fade-in" style={{ animationDelay: '0.35s' }}>
        <div className="rounded-2xl bg-card/60 backdrop-blur border border-border/50 p-6">
          <div className="flex items-center gap-3 mb-4">
            <ListChecks className="h-5 w-5 text-muted-foreground" />
            <p className="font-semibold">Regras do Simulado</p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-3 text-sm text-muted-foreground">
            {[
              `Tempo total: ${simulado.duration_minutes} minutos`,
              "Cada questão vale 10 pontos",
              "Apenas a 1ª tentativa pontua no ranking",
              "Respostas salvas automaticamente",
              "Navegue livremente entre questões",
              "Gabarito após finalização"
            ].map((rule, i) => (
              <div key={i} className="flex gap-2">
                <span className="text-primary">•</span>
                <span>{rule}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Epic Start Button */}
      <div className="animate-fade-in" style={{ animationDelay: '0.4s' }}>
        <Button
          size="lg"
          onClick={onStart}
          disabled={isLoading}
          className={cn(
            "relative min-w-[280px] h-14 text-lg font-bold overflow-hidden",
            "bg-gradient-to-r from-red-600 via-red-500 to-orange-500",
            "hover:from-red-500 hover:via-red-400 hover:to-orange-400",
            "shadow-lg shadow-red-500/30 hover:shadow-red-500/50",
            "transition-all duration-300 hover:scale-105"
          )}
        >
          {isLoading ? (
            <>
              <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-3" />
              Preparando...
            </>
          ) : (
            <>
              <Play className="h-6 w-6 mr-3" />
              {isRetake ? "Iniciar Prática" : "INICIAR SIMULADO"}
              <Rocket className="h-5 w-5 ml-3" />
            </>
          )}
          
          {/* Shine effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
        </Button>
      </div>
    </div>
  );
}

function StatOrb({ 
  icon, 
  value, 
  label, 
  gradient 
}: { 
  icon: React.ReactNode; 
  value: string; 
  label: string;
  gradient: string;
}) {
  return (
    <div className="group relative">
      {/* Glow effect on hover */}
      <div className={cn(
        "absolute inset-0 rounded-2xl bg-gradient-to-r opacity-0 group-hover:opacity-20 blur-xl transition-opacity",
        gradient
      )} />
      
      <div className="relative flex flex-col items-center gap-3 p-5 rounded-2xl bg-card/80 backdrop-blur border border-border/50 group-hover:border-primary/30 transition-all duration-300 group-hover:-translate-y-1">
        <div className={cn(
          "w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br text-white",
          gradient
        )}>
          {icon}
        </div>
        <div className="text-center">
          <p className="text-xl font-bold">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </div>
    </div>
  );
}
