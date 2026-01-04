/**
 * 🎯 SIMULADOS — Painel de Feature Flags (Gestão)
 * Constituição SYNAPSE Ω v10.0
 * 
 * Permite owner/admin controlar flags globais de simulados.
 * Rollback de emergência, congelamento de ranking, etc.
 */

import React from "react";
import { 
  Settings, ToggleLeft, ToggleRight, 
  AlertTriangle, Shield, Camera, 
  Trophy, Pause, RefreshCw
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
  useSimuladoFeatureFlags, 
  SIMULADO_FLAGS 
} from "@/hooks/simulados/useSimuladoFeatureFlags";

interface FlagItemProps {
  label: string;
  description: string;
  icon: React.ReactNode;
  value: boolean;
  onChange: (value: boolean) => void;
  isLoading: boolean;
  variant?: "default" | "danger";
}

function FlagItem({ label, description, icon, value, onChange, isLoading, variant = "default" }: FlagItemProps) {
  const isDanger = variant === "danger";
  
  return (
    <div className={`flex items-center justify-between p-4 rounded-lg border ${
      isDanger ? "border-red-500/20 bg-red-500/5" : "border-border bg-card"
    }`}>
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${
          isDanger ? "bg-red-500/10 text-red-500" : "bg-primary/10 text-primary"
        }`}>
          {icon}
        </div>
        <div>
          <Label className="text-sm font-medium">{label}</Label>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Badge variant={value ? "default" : "secondary"} className="text-xs">
          {value ? "ON" : "OFF"}
        </Badge>
        <Switch
          checked={value}
          onCheckedChange={onChange}
          disabled={isLoading}
        />
      </div>
    </div>
  );
}

export function SimuladoFeatureFlagsPanel() {
  const { flags, isLoading, getFlag, updateFlag, isUpdating } = useSimuladoFeatureFlags();

  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-primary" />
            <CardTitle>Feature Flags — Simulados</CardTitle>
          </div>
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
        </div>
        <CardDescription>
          Controle global de funcionalidades. Alterações têm efeito imediato.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Flags principais */}
        <FlagItem
          label="Sistema de Simulados"
          description="Habilita/desabilita todo o sistema de simulados"
          icon={<ToggleRight className="h-4 w-4" />}
          value={getFlag(SIMULADO_FLAGS.SIMULADOS_ENABLED)}
          onChange={(v) => updateFlag(SIMULADO_FLAGS.SIMULADOS_ENABLED, v)}
          isLoading={isUpdating}
        />

        <FlagItem
          label="Modo Hard"
          description="Habilita/desabilita o Modo Hard globalmente"
          icon={<Shield className="h-4 w-4" />}
          value={getFlag(SIMULADO_FLAGS.HARD_MODE_ENABLED)}
          onChange={(v) => updateFlag(SIMULADO_FLAGS.HARD_MODE_ENABLED, v)}
          isLoading={isUpdating}
        />

        <FlagItem
          label="Monitoramento de Câmera"
          description="Habilita/desabilita monitoramento de câmera no Modo Hard"
          icon={<Camera className="h-4 w-4" />}
          value={getFlag(SIMULADO_FLAGS.CAMERA_MONITORING_ENABLED)}
          onChange={(v) => updateFlag(SIMULADO_FLAGS.CAMERA_MONITORING_ENABLED, v)}
          isLoading={isUpdating}
        />

        <Separator />

        {/* Flags de contingência */}
        <div className="space-y-2">
          <h4 className="text-sm font-semibold flex items-center gap-2 text-amber-500">
            <AlertTriangle className="h-4 w-4" />
            Contingência / Rollback
          </h4>
        </div>

        <FlagItem
          label="Ranking Congelado"
          description="Congela o ranking para auditoria (novas tentativas não atualizam)"
          icon={<Trophy className="h-4 w-4" />}
          value={getFlag(SIMULADO_FLAGS.RANKING_FROZEN)}
          onChange={(v) => updateFlag(SIMULADO_FLAGS.RANKING_FROZEN, v)}
          isLoading={isUpdating}
          variant="danger"
        />

        <FlagItem
          label="Bloquear Novas Tentativas"
          description="Impede início de novas tentativas (manutenção)"
          icon={<Pause className="h-4 w-4" />}
          value={getFlag(SIMULADO_FLAGS.NEW_ATTEMPTS_BLOCKED)}
          onChange={(v) => updateFlag(SIMULADO_FLAGS.NEW_ATTEMPTS_BLOCKED, v)}
          isLoading={isUpdating}
          variant="danger"
        />

        {/* Status */}
        {isLoading && (
          <div className="text-center text-sm text-muted-foreground py-4">
            Carregando flags...
          </div>
        )}

        {/* Última atualização */}
        {flags.length > 0 && (
          <p className="text-xs text-muted-foreground text-right">
            Última atualização: {new Date(flags[0]?.updated_at || Date.now()).toLocaleString("pt-BR")}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
