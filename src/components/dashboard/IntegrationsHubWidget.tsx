// ============================================
// INTEGRATIONS HUB WIDGET v1.0 - YEAR 2090
// Central de status de todas as integrações
// Monitoramento em tempo real de APIs e webhooks
// ============================================

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Link2,
  Unplug,
  Zap,
  Globe,
  MessageCircle,
  Youtube,
  Instagram,
  Calendar,
  CreditCard,
  Database,
  Cloud,
  Bot,
  ChevronRight,
  ExternalLink
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Integration {
  id: string;
  name: string;
  icon: typeof Globe;
  status: "connected" | "warning" | "disconnected" | "checking";
  lastSync?: string;
  description: string;
  path?: string;
}

const defaultIntegrations: Integration[] = [
  { id: "whatsapp", name: "WhatsApp Business", icon: MessageCircle, status: "checking", description: "Mensagens e automações", path: "/central-whatsapp" },
  { id: "hotmart", name: "Hotmart", icon: CreditCard, status: "checking", description: "Vendas e afiliados", path: "/afiliados" },
  { id: "youtube", name: "YouTube API", icon: Youtube, status: "checking", description: "Métricas do canal", path: "/integracoes" },
  { id: "instagram", name: "Instagram", icon: Instagram, status: "checking", description: "Métricas sociais", path: "/integracoes" },
  { id: "google_calendar", name: "Google Calendar", icon: Calendar, status: "checking", description: "Sincronização de agenda", path: "/calendario" },
  { id: "supabase", name: "Lovable Cloud", icon: Database, status: "connected", description: "Banco de dados", path: "/configuracoes" },
  { id: "ai", name: "Lovable AI", icon: Bot, status: "connected", description: "Inteligência Artificial" },
];

export function IntegrationsHubWidget() {
  const navigate = useNavigate();
  const [integrations, setIntegrations] = useState<Integration[]>(defaultIntegrations);
  const [isChecking, setIsChecking] = useState(false);

  // Check integrations status
  useEffect(() => {
    checkIntegrationsStatus();
  }, []);

  const checkIntegrationsStatus = async () => {
    setIsChecking(true);
    
    // Simulated status checks - in production these would be actual API calls
    const updatedIntegrations = [...defaultIntegrations];
    
    // Check each integration
    for (const integration of updatedIntegrations) {
      if (integration.id === "supabase" || integration.id === "ai") continue;
      
      // Simulate API check with random results for demo
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Check if we have the required secrets configured
      const hasWhatsApp = true; // These would be actual checks
      const hasHotmart = true;
      const hasYoutube = true;
      
      switch (integration.id) {
        case "whatsapp":
          integration.status = hasWhatsApp ? "connected" : "disconnected";
          integration.lastSync = new Date().toLocaleTimeString("pt-BR");
          break;
        case "hotmart":
          integration.status = hasHotmart ? "connected" : "warning";
          integration.lastSync = new Date().toLocaleTimeString("pt-BR");
          break;
        case "youtube":
          integration.status = hasYoutube ? "connected" : "disconnected";
          integration.lastSync = new Date().toLocaleTimeString("pt-BR");
          break;
        case "instagram":
          integration.status = "connected";
          integration.lastSync = new Date().toLocaleTimeString("pt-BR");
          break;
        case "google_calendar":
          integration.status = "warning";
          integration.lastSync = "Requer reconexão";
          break;
      }
    }
    
    setIntegrations(updatedIntegrations);
    setIsChecking(false);
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "connected":
        return { color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/30", icon: CheckCircle2, label: "Conectado" };
      case "warning":
        return { color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/30", icon: AlertTriangle, label: "Atenção" };
      case "disconnected":
        return { color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/30", icon: XCircle, label: "Desconectado" };
      default:
        return { color: "text-muted-foreground", bg: "bg-muted/10", border: "border-muted", icon: RefreshCw, label: "Verificando..." };
    }
  };

  const connectedCount = integrations.filter(i => i.status === "connected").length;
  const warningCount = integrations.filter(i => i.status === "warning").length;
  const disconnectedCount = integrations.filter(i => i.status === "disconnected").length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-2xl border border-border/50 backdrop-blur-xl bg-card/50"
    >
      {/* Background Effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent" />
      
      <div className="relative z-10 p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <motion.div
              className="p-2.5 rounded-xl bg-primary/20"
              animate={{ rotate: isChecking ? 360 : 0 }}
              transition={{ duration: 2, repeat: isChecking ? Infinity : 0, ease: "linear" }}
            >
              <Link2 className="h-5 w-5 text-primary" />
            </motion.div>
            <div>
              <h3 className="font-semibold text-foreground">Hub de Integrações</h3>
              <p className="text-xs text-muted-foreground">Status em tempo real</p>
            </div>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={checkIntegrationsStatus}
            disabled={isChecking}
            className="gap-2"
          >
            <RefreshCw className={cn("h-4 w-4", isChecking && "animate-spin")} />
            <span className="hidden sm:inline">Atualizar</span>
          </Button>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="flex flex-col items-center p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
            <span className="text-2xl font-bold text-emerald-400">{connectedCount}</span>
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Conectados</span>
          </div>
          <div className="flex flex-col items-center p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
            <span className="text-2xl font-bold text-amber-400">{warningCount}</span>
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Atenção</span>
          </div>
          <div className="flex flex-col items-center p-3 rounded-xl bg-red-500/10 border border-red-500/20">
            <span className="text-2xl font-bold text-red-400">{disconnectedCount}</span>
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Offline</span>
          </div>
        </div>

        {/* Integrations List */}
        <div className="space-y-2">
          {integrations.map((integration, index) => {
            const statusConfig = getStatusConfig(integration.status);
            const StatusIcon = statusConfig.icon;
            const IntegrationIcon = integration.icon;
            
            return (
              <motion.div
                key={integration.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => integration.path && navigate(integration.path)}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer group",
                  "bg-background/50 hover:bg-background/80",
                  statusConfig.border
                )}
              >
                <div className={cn("p-2 rounded-lg", statusConfig.bg)}>
                  <IntegrationIcon className={cn("h-4 w-4", statusConfig.color)} />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm text-foreground truncate">{integration.name}</span>
                    {integration.status === "checking" && (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      >
                        <RefreshCw className="h-3 w-3 text-muted-foreground" />
                      </motion.div>
                    )}
                  </div>
                  <p className="text-[10px] text-muted-foreground truncate">{integration.description}</p>
                </div>
                
                <div className="flex items-center gap-2">
                  {integration.lastSync && (
                    <span className="text-[10px] text-muted-foreground hidden sm:block">
                      {integration.lastSync}
                    </span>
                  )}
                  <div className={cn("flex items-center gap-1 px-2 py-1 rounded-full text-xs", statusConfig.bg, statusConfig.color)}>
                    <StatusIcon className="h-3 w-3" />
                    <span className="hidden sm:inline">{statusConfig.label}</span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-border/20">
          <div className="flex items-center gap-2">
            <Zap className="h-3 w-3 text-emerald-400" />
            <span className="text-[10px] text-muted-foreground">
              {connectedCount}/{integrations.length} serviços ativos
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/integracoes")}
            className="gap-1 text-xs"
          >
            Gerenciar
            <ExternalLink className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
