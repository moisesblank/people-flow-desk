// ============================================
// MOISÉS MEDEIROS v10.0 - AUTOMATION RUNNER
// Executor de automações do sistema
// ============================================

import { useState } from "react";
import { motion } from "framer-motion";
import { 
  Play, RefreshCw, Clock, CheckCircle, 
  XCircle, Cog, Zap, Calendar
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Automation {
  id: string;
  name: string;
  description: string;
  type: string;
  schedule: string;
  isActive: boolean;
  lastRun: Date | null;
  status: "idle" | "running" | "success" | "error";
}

const defaultAutomations: Automation[] = [
  {
    id: "daily_report",
    name: "Relatório Diário",
    description: "Gera resumo financeiro e de métricas",
    type: "daily_report",
    schedule: "Todos os dias às 08:00",
    isActive: true,
    lastRun: new Date(Date.now() - 12 * 60 * 60 * 1000),
    status: "idle",
  },
  {
    id: "weekly_report",
    name: "Relatório Semanal",
    description: "Análise completa da semana",
    type: "weekly_report",
    schedule: "Toda segunda às 09:00",
    isActive: true,
    lastRun: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    status: "idle",
  },
  {
    id: "sync_metrics",
    name: "Sincronizar Métricas",
    description: "Atualiza dados de todas integrações",
    type: "sync_metrics",
    schedule: "A cada 4 horas",
    isActive: true,
    lastRun: new Date(Date.now() - 2 * 60 * 60 * 1000),
    status: "idle",
  },
  {
    id: "audit_groups",
    name: "Auditoria Beta",
    description: "Verifica acessos indevidos",
    type: "audit_groups",
    schedule: "Todos os dias às 00:00",
    isActive: true,
    lastRun: new Date(Date.now() - 18 * 60 * 60 * 1000),
    status: "idle",
  },
  {
    id: "process_queue",
    name: "Processar Fila",
    description: "Executa webhooks pendentes",
    type: "process_queue",
    schedule: "A cada 5 minutos",
    isActive: true,
    lastRun: new Date(Date.now() - 5 * 60 * 1000),
    status: "idle",
  },
  {
    id: "cleanup_logs",
    name: "Limpar Logs",
    description: "Remove logs antigos (>30 dias)",
    type: "cleanup_logs",
    schedule: "Toda semana aos domingos",
    isActive: false,
    lastRun: null,
    status: "idle",
  },
];

export function AutomationRunner() {
  const [automations, setAutomations] = useState<Automation[]>(defaultAutomations);
  const { toast } = useToast();

  const runAutomation = async (automation: Automation) => {
    setAutomations(prev =>
      prev.map(a =>
        a.id === automation.id ? { ...a, status: "running" as const } : a
      )
    );

    try {
      const { error } = await supabase.functions.invoke("automacoes", {
        body: { tipo: automation.type },
      });

      if (error) throw error;

      setAutomations(prev =>
        prev.map(a =>
          a.id === automation.id
            ? { ...a, status: "success" as const, lastRun: new Date() }
            : a
        )
      );

      toast({
        title: "✅ Automação executada",
        description: `${automation.name} concluída com sucesso.`,
      });

      // Reset status after 3 seconds
      setTimeout(() => {
        setAutomations(prev =>
          prev.map(a =>
            a.id === automation.id ? { ...a, status: "idle" as const } : a
          )
        );
      }, 3000);
    } catch (error) {
      console.error("Erro na automação:", error);
      
      setAutomations(prev =>
        prev.map(a =>
          a.id === automation.id ? { ...a, status: "error" as const } : a
        )
      );

      toast({
        title: "❌ Erro na automação",
        description: `Falha ao executar ${automation.name}.`,
        variant: "destructive",
      });
    }
  };

  const toggleAutomation = (id: string) => {
    setAutomations(prev =>
      prev.map(a =>
        a.id === id ? { ...a, isActive: !a.isActive } : a
      )
    );
  };

  const runAll = async () => {
    const activeAutomations = automations.filter(a => a.isActive);
    for (const automation of activeAutomations) {
      await runAutomation(automation);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  };

  const getStatusIcon = (status: Automation["status"]) => {
    switch (status) {
      case "running": return <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />;
      case "success": return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "error": return <XCircle className="h-4 w-4 text-red-500" />;
      default: return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const activeCount = automations.filter(a => a.isActive).length;

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-base">
          <div className="flex items-center gap-2">
            <Cog className="h-5 w-5 text-primary" />
            Automações
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {activeCount} ativas
            </Badge>
            <Button variant="outline" size="sm" onClick={runAll}>
              <Play className="h-3 w-3 mr-1" />
              Executar Todas
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {automations.map((automation, index) => (
          <motion.div
            key={automation.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className={`
              flex items-center gap-3 p-3 rounded-lg border transition-all
              ${automation.isActive 
                ? "bg-muted/30 border-border" 
                : "bg-muted/10 border-border/50 opacity-60"
              }
            `}
          >
            {getStatusIcon(automation.status)}
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium">{automation.name}</p>
                {automation.status === "running" && (
                  <Badge variant="secondary" className="text-xs">
                    Executando...
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground truncate">
                {automation.description}
              </p>
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                <Calendar className="h-3 w-3" />
                {automation.schedule}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Switch
                checked={automation.isActive}
                onCheckedChange={() => toggleAutomation(automation.id)}
              />
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => runAutomation(automation)}
                disabled={automation.status === "running"}
              >
                <Zap className="h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        ))}
      </CardContent>
    </Card>
  );
}
