/**
 * 🎯 SIMULADOS — Tela de Consentimento (Modo Hard)
 * Constituição SYNAPSE Ω v10.0
 * 
 * OBRIGATÓRIO antes de iniciar Modo Hard.
 * Usuário deve aceitar explicitamente as regras.
 */

import React, { useState } from "react";
import { 
  Shield, Camera, Eye, AlertTriangle, 
  CheckCircle2, XCircle, ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Simulado } from "@/components/simulados/types";

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
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-8">
      {/* Ícone */}
      <div className="relative mb-8">
        <div className="w-24 h-24 rounded-full bg-red-500/10 flex items-center justify-center">
          <Shield className="h-12 w-12 text-red-500" />
        </div>
        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-3 py-1 bg-red-500 rounded-full text-white text-xs font-bold">
          MODO HARD
        </div>
      </div>

      {/* Título */}
      <h1 className="text-2xl md:text-3xl font-bold mb-2 text-center">
        Consentimento Obrigatório
      </h1>
      <p className="text-muted-foreground mb-8 text-center max-w-md">
        Este simulado utiliza o Modo Hard com regras especiais de monitoramento.
      </p>

      {/* Regras */}
      <div className="bg-card border border-border rounded-xl p-6 mb-6 max-w-lg w-full">
        <h3 className="font-semibold text-red-400 mb-4 flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          Regras do Modo Hard
        </h3>
        
        <ul className="space-y-3">
          <RuleItem
            icon={<Eye className="h-4 w-4" />}
            title={`Limite de ${simulado.max_tab_switches} trocas de aba`}
            description="Trocar de aba ou janela mais vezes resultará em invalidação."
          />
          
          {simulado.requires_camera && (
            <RuleItem
              icon={<Camera className="h-4 w-4" />}
              title="Câmera obrigatória"
              description="Sua câmera ficará ativa durante todo o simulado."
            />
          )}
          
          <RuleItem
            icon={<XCircle className="h-4 w-4" />}
            title="Invalidação irreversível"
            description="Tentativas invalidadas não podem ser revertidas."
          />
          
          <RuleItem
            icon={<AlertTriangle className="h-4 w-4" />}
            title="Sem segunda chance"
            description="Após invalidação, novas tentativas não contarão para o ranking."
          />
        </ul>
      </div>

      {/* Checkboxes de aceite */}
      <div className="space-y-4 mb-8 max-w-lg w-full">
        <label className="flex items-start gap-3 cursor-pointer">
          <Checkbox
            checked={acceptedRules}
            onCheckedChange={(checked) => setAcceptedRules(checked === true)}
          />
          <span className="text-sm">
            Li e entendo as regras do Modo Hard. Aceito que minha tentativa pode
            ser invalidada caso eu viole qualquer uma das regras acima.
          </span>
        </label>

        {simulado.requires_camera && (
          <label className="flex items-start gap-3 cursor-pointer">
            <Checkbox
              checked={acceptedCamera}
              onCheckedChange={(checked) => setAcceptedCamera(checked === true)}
            />
            <span className="text-sm">
              Autorizo o acesso à minha câmera durante o simulado. Entendo que
              a imagem serve apenas como deterrente e não será gravada.
            </span>
          </label>
        )}
      </div>

      {/* Ações */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Button
          variant="outline"
          onClick={onDecline}
          disabled={isLoading}
        >
          Voltar
        </Button>
        
        <Button
          onClick={onAccept}
          disabled={!canProceed || isLoading}
          className="min-w-[200px]"
        >
          {isLoading ? (
            <>
              <div className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin mr-2" />
              Iniciando...
            </>
          ) : (
            <>
              Aceitar e Iniciar
              <ArrowRight className="h-4 w-4 ml-2" />
            </>
          )}
        </Button>
      </div>

      {/* Dica */}
      <p className="text-xs text-muted-foreground mt-8 max-w-md text-center">
        Dica: Feche outras abas e notificações antes de iniciar para evitar
        invalidações acidentais.
      </p>
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
    <li className="flex items-start gap-3">
      <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center text-red-400 shrink-0">
        {icon}
      </div>
      <div>
        <p className="font-medium text-sm">{title}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </li>
  );
}
