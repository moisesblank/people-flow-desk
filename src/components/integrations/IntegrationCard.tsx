// ============================================
// MOISES MEDEIROS v5.0 - INTEGRATION CARD
// Pilar 6: Integrações e APIs
// ============================================

import { useState } from "react";
import { motion } from "framer-motion";
import { 
  Check, 
  X, 
  Loader2, 
  RefreshCw, 
  Settings, 
  ExternalLink,
  Zap,
  Clock,
  AlertCircle
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";

export interface Integration {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: "payment" | "marketing" | "analytics" | "communication" | "storage";
  isActive: boolean;
  isConnected: boolean;
  lastSync?: string;
  syncStatus?: "success" | "error" | "pending";
  configUrl?: string;
  features: string[];
}

interface IntegrationCardProps {
  integration: Integration;
  onToggle: (id: string, active: boolean) => Promise<void>;
  onSync: (id: string) => Promise<void>;
  onConfigure: (id: string) => void;
}

const categoryColors = {
  payment: "bg-green-500/10 text-green-600 border-green-500/20",
  marketing: "bg-purple-500/10 text-purple-600 border-purple-500/20",
  analytics: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  communication: "bg-orange-500/10 text-orange-600 border-orange-500/20",
  storage: "bg-cyan-500/10 text-cyan-600 border-cyan-500/20",
};

const categoryLabels = {
  payment: "Pagamento",
  marketing: "Marketing",
  analytics: "Analytics",
  communication: "Comunicação",
  storage: "Armazenamento",
};

const statusConfig = {
  success: { icon: Check, color: "text-green-500", label: "Sincronizado" },
  error: { icon: AlertCircle, color: "text-red-500", label: "Erro" },
  pending: { icon: Clock, color: "text-yellow-500", label: "Pendente" },
};

export function IntegrationCard({ 
  integration, 
  onToggle, 
  onSync,
  onConfigure 
}: IntegrationCardProps) {
  const [isToggling, setIsToggling] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const handleToggle = async (checked: boolean) => {
    setIsToggling(true);
    try {
      await onToggle(integration.id, checked);
      toast({
        title: checked ? "Integração ativada" : "Integração desativada",
        description: `${integration.name} foi ${checked ? "ativada" : "desativada"} com sucesso.`,
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível alterar o status da integração.",
        variant: "destructive",
      });
    } finally {
      setIsToggling(false);
    }
  };

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      await onSync(integration.id);
      toast({
        title: "Sincronização iniciada",
        description: `Sincronizando dados de ${integration.name}...`,
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível iniciar a sincronização.",
        variant: "destructive",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const StatusIcon = integration.syncStatus ? statusConfig[integration.syncStatus].icon : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
    >
      <Card className={`relative overflow-hidden transition-all ${
        integration.isActive ? "ring-2 ring-primary/20" : "opacity-75"
      }`}>
        {/* Status indicator */}
        {integration.isActive && (
          <motion.div
            className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary to-purple-500"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
          />
        )}

        <CardHeader className="pb-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              {/* Icon */}
              <div className="text-3xl">{integration.icon}</div>
              
              <div>
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  {integration.name}
                  {integration.isConnected && (
                    <Badge variant="outline" className="text-xs gap-1 bg-green-500/10 text-green-600 border-green-500/20">
                      <Check className="h-3 w-3" />
                      Conectado
                    </Badge>
                  )}
                </h3>
                <Badge 
                  variant="outline" 
                  className={`text-xs mt-1 ${categoryColors[integration.category]}`}
                >
                  {categoryLabels[integration.category]}
                </Badge>
              </div>
            </div>

            {/* Toggle */}
            <div className="flex items-center gap-2">
              {isToggling && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
              <Switch
                checked={integration.isActive}
                onCheckedChange={handleToggle}
                disabled={isToggling || !integration.isConnected}
              />
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {integration.description}
          </p>

          {/* Features */}
          <div className="flex flex-wrap gap-1">
            {integration.features.slice(0, 3).map((feature, idx) => (
              <Badge key={idx} variant="secondary" className="text-xs">
                {feature}
              </Badge>
            ))}
            {integration.features.length > 3 && (
              <Badge variant="secondary" className="text-xs">
                +{integration.features.length - 3}
              </Badge>
            )}
          </div>

          {/* Sync Status */}
          {integration.isActive && integration.lastSync && (
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                {StatusIcon && (
                  <StatusIcon className={`h-3 w-3 ${statusConfig[integration.syncStatus!].color}`} />
                )}
                <span>Última sincronização: {integration.lastSync}</span>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2 pt-2">
            {integration.isConnected ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1 flex-1"
                  onClick={handleSync}
                  disabled={isSyncing || !integration.isActive}
                >
                  {isSyncing ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <RefreshCw className="h-3 w-3" />
                  )}
                  Sincronizar
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1"
                  onClick={() => onConfigure(integration.id)}
                >
                  <Settings className="h-3 w-3" />
                </Button>
              </>
            ) : (
              <Dialog>
                <DialogTrigger asChild>
                  <Button size="sm" className="gap-1 flex-1">
                    <Zap className="h-3 w-3" />
                    Conectar
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Conectar {integration.name}</DialogTitle>
                    <DialogDescription>
                      Siga as instruções abaixo para conectar sua conta.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <p className="text-sm text-muted-foreground">
                      Para conectar o {integration.name}, você precisará:
                    </p>
                    <ol className="list-decimal list-inside space-y-2 text-sm">
                      <li>Acessar o painel do {integration.name}</li>
                      <li>Gerar uma chave de API ou webhook</li>
                      <li>Configurar o webhook URL abaixo</li>
                    </ol>
                    <div className="p-3 rounded-lg bg-muted font-mono text-xs break-all">
                      {`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/webhook-curso-quimica?source=${integration.id}`}
                    </div>
                    {integration.configUrl && (
                      <Button variant="outline" className="w-full gap-2" asChild>
                        <a href={integration.configUrl} target="_blank" rel="noopener noreferrer">
                          Acessar {integration.name}
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
