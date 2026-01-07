/**
 * 🎯 SIMULADOS — Tela de Consentimento (Modo Hard)
 * Design: Year 2300 Cinematic
 * 
 * OBRIGATÓRIO antes de iniciar Modo Hard.
 * Estilo: Warning épico com visual de alerta crítico.
 */

import React, { useState } from "react";
import { 
  Shield, Camera, Eye, AlertTriangle, 
  CheckCircle2, XCircle, ArrowRight, Zap, Lock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Simulado } from "@/components/simulados/types";
import { cn } from "@/lib/utils";

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
  const [acceptedRules, setAcceptedRules] = useState(false);
  const [acceptedCamera, setAcceptedCamera] = useState(!simulado.requires_camera);

  const canProceed = acceptedRules && (simulado.requires_camera ? acceptedCamera : true);

  return (
    <div className="relative flex flex-col items-center justify-center min-h-[70vh] p-8 overflow-hidden">
      {/* Background danger effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-red-500/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-orange-500/10 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '0.5s' }} />
      </div>

      {/* Warning Icon - Epic Animation */}
      <div className="relative mb-10 animate-fade-in">
        {/* Pulsing danger rings */}
        <div className="absolute -inset-8 rounded-full border-2 border-red-500/20 animate-ping" style={{ animationDuration: '2s' }} />
        <div className="absolute -inset-4 rounded-full border border-red-500/30 animate-pulse" />
        
        {/* Core shield */}
        <div className="relative w-28 h-28 rounded-full bg-gradient-to-br from-red-500/20 via-red-600/10 to-orange-500/20 flex items-center justify-center backdrop-blur-sm border-2 border-red-500/50">
          <Shield className="h-14 w-14 text-red-500" />
          
          {/* Inner danger glow */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-t from-red-500/20 to-transparent animate-pulse" />
        </div>
        
        {/* Badge */}
        <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 px-6 py-2 bg-gradient-to-r from-red-600 to-red-500 rounded-full text-white text-sm font-bold shadow-lg shadow-red-500/50 flex items-center gap-2">
          <Lock className="h-4 w-4" />
          MODO HARD
        </div>
      </div>

      {/* Title */}
      <h1 className="text-3xl md:text-4xl font-bold mb-3 text-center bg-gradient-to-r from-red-400 via-orange-400 to-red-400 bg-clip-text text-transparent animate-fade-in" style={{ animationDelay: '0.1s' }}>
        Consentimento Obrigatório
      </h1>
      <p className="text-muted-foreground mb-10 text-center max-w-md animate-fade-in" style={{ animationDelay: '0.15s' }}>
        Este simulado utiliza o <span className="text-red-400 font-medium">Modo Hard</span> com regras especiais de monitoramento.
      </p>

      {/* Rules Card - Danger Style */}
      <div className="w-full max-w-lg mb-8 animate-fade-in" style={{ animationDelay: '0.2s' }}>
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-red-500/10 via-card to-orange-500/10 border border-red-500/30 p-6">
          {/* Animated border effect */}
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-red-500/0 via-red-500/10 to-red-500/0 animate-pulse" />
          
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

      {/* Consent Checkboxes - Glass Style */}
      <div className="w-full max-w-lg space-y-4 mb-10 animate-fade-in" style={{ animationDelay: '0.25s' }}>
        <label className="flex items-start gap-4 p-4 rounded-xl bg-card/60 backdrop-blur border border-border/50 cursor-pointer hover:border-red-500/30 transition-colors">
          <Checkbox
            checked={acceptedRules}
            onCheckedChange={(checked) => setAcceptedRules(checked === true)}
            className="mt-1 border-red-500/50 data-[state=checked]:bg-red-500"
          />
          <span className="text-sm text-muted-foreground">
            Li e entendo as regras do Modo Hard. Aceito que minha tentativa pode ser <span className="text-red-400">invalidada permanentemente</span> caso eu viole qualquer uma das regras acima.
          </span>
        </label>

        {simulado.requires_camera && (
          <label className="flex items-start gap-4 p-4 rounded-xl bg-card/60 backdrop-blur border border-border/50 cursor-pointer hover:border-red-500/30 transition-colors">
            <Checkbox
              checked={acceptedCamera}
              onCheckedChange={(checked) => setAcceptedCamera(checked === true)}
              className="mt-1 border-red-500/50 data-[state=checked]:bg-red-500"
            />
            <span className="text-sm text-muted-foreground">
              Autorizo o acesso à minha <span className="text-red-400">câmera</span> durante o simulado. Entendo que serve como deterrente e não será gravada.
            </span>
          </label>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 animate-fade-in" style={{ animationDelay: '0.3s' }}>
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
            "shadow-lg shadow-red-500/30 hover:shadow-red-500/50",
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
      <div className="mt-10 px-6 py-3 rounded-full bg-amber-500/10 border border-amber-500/30 animate-fade-in" style={{ animationDelay: '0.35s' }}>
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
