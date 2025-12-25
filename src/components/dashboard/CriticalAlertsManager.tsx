// ============================================
// MOISÉS MEDEIROS v10.0 - CRITICAL ALERTS MANAGER
// Gerenciador de alertas críticos do sistema
// ============================================

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  AlertTriangle, Bell, X, CheckCircle, 
  ExternalLink, RefreshCw, Shield
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface CriticalAlert {
  id: string;
  type: "error" | "warning" | "info" | "security";
  title: string;
  message: string;
  source: string;
  created_at: string;
  resolved: boolean;
  action_url?: string;
}

export function CriticalAlertsManager() {
  const [alerts, setAlerts] = useState<CriticalAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchAlerts();
    
    // Subscribe to realtime
    const channel = supabase
      .channel("critical_alerts")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "webhooks_queue" },
        (payload: any) => {
          if (payload.new?.status === "failed") {
            addAlert({
              id: payload.new.id,
              type: "error",
              title: "Webhook Falhou",
              message: `Erro no webhook ${payload.new.source}: ${payload.new.error_message || "Erro desconhecido"}`,
              source: payload.new.source,
              created_at: new Date().toISOString(),
              resolved: false,
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchAlerts = async () => {
    setIsLoading(true);
    try {
      // Buscar webhooks com falha
      const { data: failedWebhooks } = await supabase
        .from("webhooks_queue")
        .select("id, source, status, error_message, created_at")
        .eq("status", "failed")
        .order("created_at", { ascending: false })
        .limit(10);

      // Buscar discrepâncias de auditoria
      const { data: auditData } = await supabase
        .from("auditoria_grupo_beta")
        .select("id, email, nome, tipo_discrepancia, data_deteccao, acao_tomada")
        .is("acao_tomada", null)
        .order("data_deteccao", { ascending: false })
        .limit(10);

      const alertList: CriticalAlert[] = [];

      // Converter webhooks falhos em alertas
      failedWebhooks?.forEach(wh => {
        alertList.push({
          id: wh.id,
          type: "error",
          title: `Webhook ${wh.source} Falhou`,
          message: wh.error_message || "Erro ao processar webhook",
          source: wh.source,
          created_at: wh.created_at,
          resolved: false,
          action_url: "/central-monitoramento",
        });
      });

      // Converter discrepâncias em alertas
      auditData?.forEach(audit => {
        alertList.push({
          id: audit.id,
          type: "security",
          title: "Acesso Indevido Detectado",
          message: `Usuário ${audit.email} sem pagamento confirmado no grupo beta`,
          source: "auditoria",
          created_at: audit.data_deteccao,
          resolved: false,
          action_url: "/auditoria-acessos",
        });
      });

      setAlerts(alertList.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      ));
    } catch (error) {
      console.error("Erro ao buscar alertas:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const addAlert = (alert: CriticalAlert) => {
    setAlerts(prev => [alert, ...prev]);
    toast({
      title: `⚠️ ${alert.title}`,
      description: alert.message,
      variant: "destructive",
    });
  };

  const dismissAlert = (alertId: string) => {
    setAlerts(prev => prev.filter(a => a.id !== alertId));
  };

  const getAlertIcon = (type: CriticalAlert["type"]) => {
    switch (type) {
      case "error": return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case "warning": return <Bell className="h-4 w-4 text-amber-500" />;
      case "security": return <Shield className="h-4 w-4 text-purple-500" />;
      default: return <Bell className="h-4 w-4 text-blue-500" />;
    }
  };

  const getAlertBgColor = (type: CriticalAlert["type"]) => {
    switch (type) {
      case "error": return "bg-red-500/10 border-red-500/30";
      case "warning": return "bg-amber-500/10 border-amber-500/30";
      case "security": return "bg-purple-500/10 border-purple-500/30";
      default: return "bg-blue-500/10 border-blue-500/30";
    }
  };

  const unresolvedCount = alerts.filter(a => !a.resolved).length;

  return (
    <Card className="border-destructive/20">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-base">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Alertas Críticos
            {unresolvedCount > 0 && (
              <Badge variant="destructive" className="text-xs">
                {unresolvedCount}
              </Badge>
            )}
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={fetchAlerts}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {alerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <CheckCircle className="h-8 w-8 text-green-500 mb-2" />
            <p className="text-sm">Nenhum alerta crítico</p>
          </div>
        ) : (
          <ScrollArea className="h-[300px]">
            <AnimatePresence mode="popLayout">
              {alerts.map((alert, index) => (
                <motion.div
                  key={alert.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: index * 0.05 }}
                  className={`flex items-start gap-3 p-3 mb-2 rounded-lg border ${getAlertBgColor(alert.type)}`}
                >
                  {getAlertIcon(alert.type)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{alert.title}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {alert.message}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(alert.created_at), {
                        addSuffix: true,
                        locale: ptBR,
                      })}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    {alert.action_url && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={() => window.location.href = alert.action_url!}
                      >
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0"
                      onClick={() => dismissAlert(alert.id)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
