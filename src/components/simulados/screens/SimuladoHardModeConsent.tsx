/**
 * 🎯 SIMULADOS — Tela de Consentimento (Modo Hard)
 * Design: Year 2300 Cinematic + Performance Optimized
 * Layout: Compacto e preenchido
 * 
 * OBRIGATÓRIO antes de iniciar Modo Hard.
 * Estilo: Warning épico com visual de alerta crítico.
 */

import React, { useState } from "react";
import { 
  Shield, Camera, Eye, AlertTriangle, 
  XCircle, ArrowRight, Zap, Lock, Clock, FileQuestion, Trophy, Target, Lightbulb, ListChecks
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Simulado } from "@/components/simulados/types";
import { cn } from "@/lib/utils";
import { useConstitutionPerformance } from "@/hooks/useConstitutionPerformance";

interface SimuladoHardModeConsentProps {
  simulado: Simulado;
  onAccept: () => void;
  onDecline: () => void;
  isLoading?: boolean;
}

export function SimuladoHardModeConsent({
  simulado,
  onAccept,
  onDecline,
  isLoading = false,
}: SimuladoHardModeConsentProps) {
  const { shouldAnimate, shouldBlur, isLowEnd } = useConstitutionPerformance();
  const [acceptedRules, setAcceptedRules] = useState(false);
  const [acceptedCamera, setAcceptedCamera] = useState(!simulado.requires_camera);

  const canProceed = acceptedRules && (simulado.requires_camera ? acceptedCamera : true);

  // Calculate tempo formatado
  const hours = Math.floor(simulado.duration_minutes / 60);
  const mins = simulado.duration_minutes % 60;
  const tempoFormatado = hours > 0 
    ? `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')} Hora(s)`
    : `${simulado.duration_minutes} Minuto(s)`;

  return (
    <div className="relative flex flex-col items-center min-h-[80vh] p-6 md:p-8 overflow-y-auto">
      {/* Background danger effects - only on high-end */}
      {!isLowEnd && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-red-500/10 rounded-full blur-[120px] animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-orange-500/10 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '0.5s' }} />
        </div>
      )}

      {/* Header with Danger Badge */}
      <div className={cn("relative text-center mb-6", shouldAnimate && "animate-fade-in")}>
        <div className={cn(
          "inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-red-600 to-red-500 text-white text-sm font-bold mb-4",
          !isLowEnd && "shadow-lg shadow-red-500/50"
        )}>
          <Lock className="h-4 w-4" />
          MODO HARD
        </div>
        
        <h1 className="text-3xl md:text-4xl font-bold mb-3 bg-gradient-to-r from-red-400 via-orange-400 to-red-400 bg-clip-text text-transparent">
          {simulado.title}
        </h1>
        {simulado.description && (
          <p className="text-muted-foreground max-w-lg mx-auto">
            {simulado.description}
          </p>
        )}
      </div>

      {/* Stats Orbs - 4 Cards */}
      <div className={cn("grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 w-full max-w-3xl", shouldAnimate && "animate-fade-in")}>
        <StatOrb
          icon={<Clock className="h-6 w-6" />}
          value={tempoFormatado}
          label="Tempo"
          gradient="from-indigo-500 to-blue-500"
          isLowEnd={isLowEnd}
          shouldBlur={shouldBlur}
        />
        <StatOrb
          icon={<FileQuestion className="h-6 w-6" />}
          value={`${simulado.total_questions || 0}`}
          label="Questões"
          gradient="from-violet-500 to-purple-500"
          isLowEnd={isLowEnd}
          shouldBlur={shouldBlur}
        />
        <StatOrb
          icon={<Trophy className="h-6 w-6" />}
          value={`${(simulado.total_questions || 0) * 10}`}
          label="XP Máximo"
          gradient="from-amber-500 to-orange-500"
          isLowEnd={isLowEnd}
          shouldBlur={shouldBlur}
        />
        <StatOrb
          icon={<Target className="h-6 w-6" />}
          value={`${simulado.passing_score || 60}%`}
          label="Mínimo"
          gradient="from-emerald-500 to-green-500"
          isLowEnd={isLowEnd}
          shouldBlur={shouldBlur}
        />
      </div>

      {/* Hard Mode Rules Card - Danger Style */}
      <div className={cn("w-full max-w-2xl mb-6", shouldAnimate && "animate-fade-in")}>
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-red-500/10 via-card to-orange-500/10 border border-red-500/30 p-6">
          {/* Animated border effect - only on high-end */}
          {!isLowEnd && <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-red-500/0 via-red-500/10 to-red-500/0 animate-pulse" />}
          
          <div className="relative">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-white" />
              </div>
              <p className="font-bold text-red-400 text-lg">Regras do Modo Hard</p>
            </div>
            
            <ul className="space-y-4">
              <RuleItem
                icon={<Eye className="h-5 w-5" />}
                title={`Limite de ${simulado.max_tab_switches} trocas de aba`}
                description="Trocar de aba mais vezes resultará em invalidação."
              />
              
              {simulado.requires_camera && (
                <RuleItem
                  icon={<Camera className="h-5 w-5" />}
                  title="Câmera obrigatória"
                  description="Sua câmera ficará ativa durante todo o simulado."
                />
              )}
              
              <RuleItem
                icon={<XCircle className="h-5 w-5" />}
                title="Invalidação irreversível"
                description="Tentativas invalidadas não podem ser revertidas."
              />
              
              <RuleItem
                icon={<AlertTriangle className="h-5 w-5" />}
                title="Sem segunda chance"
                description="Após invalidação, novas tentativas não pontuam."
              />
            </ul>
          </div>
        </div>
      </div>

      {/* Dicas do Professor - Glass Card */}
      <div className={cn("w-full max-w-2xl mb-6", shouldAnimate && "animate-fade-in")}>
        <div className={cn(
          "relative overflow-hidden rounded-2xl bg-gradient-to-br from-red-500/10 via-card to-orange-500/10 border border-red-500/30 p-6",
          shouldBlur && "backdrop-blur-sm"
        )}>
          {!isLowEnd && <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 rounded-full blur-3xl" />}
          
          <div className="relative">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center">
                <Lightbulb className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="font-bold text-red-300">Dicas do Professor</p>
                <p className="text-xs text-red-400/70">Moisés Medeiros</p>
              </div>
            </div>
            
            <ul className="space-y-3">
              {[
                "Feche outras abas e aplicativos antes de iniciar.",
                "Certifique-se de que sua internet está estável.",
                "Encontre um local silencioso e bem iluminado.",
                "Mantenha o foco total durante todo o simulado."
              ].map((tip, i) => (
                <li key={i} className="flex gap-3 text-sm text-muted-foreground">
                  <Zap className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Consent Checkboxes - Glass Style */}
      <div className={cn("w-full max-w-2xl space-y-4 mb-6", shouldAnimate && "animate-fade-in")}>
        <label className={cn(
          "flex items-start gap-4 p-4 rounded-xl bg-card/60 border border-border/50 cursor-pointer hover:border-red-500/30 transition-colors",
          shouldBlur && "backdrop-blur"
        )}>
          <Checkbox
            checked={acceptedRules}
            onCheckedChange={(checked) => setAcceptedRules(checked === true)}
            className="mt-1 h-5 w-5 border-2 border-red-500/50 data-[state=checked]:bg-red-500 data-[state=checked]:text-white data-[state=checked]:border-red-500"
          />
          <span className="text-sm text-muted-foreground">
            Li e entendo as regras do Modo Hard. Aceito que minha tentativa pode ser <span className="text-red-400">invalidada permanentemente</span> caso eu viole qualquer uma das regras acima.
          </span>
        </label>

        {simulado.requires_camera && (
          <label className={cn(
            "flex items-start gap-4 p-4 rounded-xl bg-card/60 border border-border/50 cursor-pointer hover:border-red-500/30 transition-colors",
            shouldBlur && "backdrop-blur"
          )}>
            <Checkbox
              checked={acceptedCamera}
              onCheckedChange={(checked) => setAcceptedCamera(checked === true)}
              className="mt-1 h-5 w-5 border-2 border-red-500/50 data-[state=checked]:bg-red-500 data-[state=checked]:text-white data-[state=checked]:border-red-500"
            />
            <span className="text-sm text-muted-foreground">
              Autorizo o acesso à minha <span className="text-red-400">câmera</span> durante o simulado. Entendo que serve como deterrente e não será gravada.
            </span>
          </label>
        )}
      </div>

      {/* Action Buttons */}
      <div className={cn("flex flex-col sm:flex-row gap-4 mb-6", shouldAnimate && "animate-fade-in")}>
        <Button
          variant="outline"
          onClick={onDecline}
          disabled={isLoading}
          className="min-w-[140px] border-border/50 hover:border-muted-foreground/50"
        >
          Voltar
        </Button>
        
        <Button
          onClick={onAccept}
          disabled={!canProceed || isLoading}
          className={cn(
            "min-w-[220px] relative overflow-hidden",
            "bg-gradient-to-r from-red-600 via-red-500 to-orange-500",
            "hover:from-red-500 hover:via-red-400 hover:to-orange-400",
            !isLowEnd && "shadow-lg shadow-red-500/30 hover:shadow-red-500/50",
            "disabled:opacity-50 disabled:shadow-none"
          )}
        >
          {isLoading ? (
            <>
              <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
              Iniciando...
            </>
          ) : (
            <>
              <Zap className="h-5 w-5 mr-2" />
              Aceitar e Iniciar
              <ArrowRight className="h-5 w-5 ml-2" />
            </>
          )}
        </Button>
      </div>

      {/* Pro Tip */}
      <div className={cn("px-6 py-3 rounded-full bg-amber-500/10 border border-amber-500/30", shouldAnimate && "animate-fade-in")}>
        <p className="text-xs text-amber-400 flex items-center gap-2">
          <Zap className="h-4 w-4" />
          Dica: Feche outras abas e notificações antes de iniciar
        </p>
      </div>
    </div>
  );
}

function RuleItem({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <li className="flex items-start gap-4">
      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500/20 to-orange-500/20 flex items-center justify-center text-red-400 shrink-0 border border-red-500/20">
        {icon}
      </div>
      <div>
        <p className="font-medium text-foreground">{title}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </li>
  );
}

function StatOrb({ 
  icon, 
  value, 
  label, 
  gradient,
  isLowEnd = false,
  shouldBlur = true
}: { 
  icon: React.ReactNode; 
  value: string; 
  label: string;
  gradient: string;
  isLowEnd?: boolean;
  shouldBlur?: boolean;
}) {
  return (
    <div className="group relative">
      {/* Glow effect on hover - only on high-end */}
      {!isLowEnd && (
        <div className={cn(
          "absolute inset-0 rounded-2xl bg-gradient-to-r opacity-0 group-hover:opacity-20 blur-xl transition-opacity",
          gradient
        )} />
      )}
      
      <div className={cn(
        "relative flex flex-col items-center gap-3 p-5 rounded-2xl bg-card/80 border border-border/50 group-hover:border-primary/30 transition-colors",
        shouldBlur && "backdrop-blur",
        !isLowEnd && "transition-all duration-300 group-hover:-translate-y-1"
      )}>
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