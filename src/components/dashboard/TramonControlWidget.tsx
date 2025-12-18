// 🧠 TRAMON v8 - Widget de Controle das 4 IAs
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Brain, Zap, MessageSquare, Code, Activity, Play, Pause, 
  RefreshCw, CheckCircle2, AlertTriangle, Clock, Sparkles 
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface IAStatus {
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  status: 'online' | 'processing' | 'offline';
  lastAction: string;
  successRate: number;
  color: string;
}

const IAS: IAStatus[] = [
  { name: "MANUS", icon: Brain, status: "online", lastAction: "Análise LTV", successRate: 98, color: "from-purple-500 to-pink-500" },
  { name: "LOVABLE", icon: Code, status: "online", lastAction: "Build deploy", successRate: 100, color: "from-blue-500 to-cyan-500" },
  { name: "ChatGPT", icon: MessageSquare, status: "online", lastAction: "Email gerado", successRate: 95, color: "from-green-500 to-emerald-500" },
  { name: "TRAMON", icon: Zap, status: "online", lastAction: "Notificação", successRate: 99, color: "from-orange-500 to-red-500" },
];

const ACOES_RAPIDAS = [
  { id: 'sync_metrics', label: 'Sincronizar Métricas', icon: RefreshCw, ia: 'tramon' },
  { id: 'daily_report', label: 'Relatório Diário', icon: Activity, ia: 'manus' },
  { id: 'audit_groups', label: 'Auditoria WP', icon: CheckCircle2, ia: 'lovable' },
  { id: 'process_queue', label: 'Processar Fila', icon: Play, ia: 'tramon' },
];

export function TramonControlWidget() {
  const { toast } = useToast();
  const [executing, setExecuting] = useState<string | null>(null);
  const [iaStatuses] = useState<IAStatus[]>(IAS);

  const executeAction = async (actionId: string, ia: string) => {
    setExecuting(actionId);
    try {
      const { data, error } = await supabase.functions.invoke('automacoes', {
        body: { tipo: actionId }
      });

      if (error) throw error;

      toast({
        title: "✅ Ação executada",
        description: `${actionId} completado via ${ia.toUpperCase()}`,
      });
    } catch (error) {
      toast({
        title: "❌ Erro na execução",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive"
      });
    } finally {
      setExecuting(null);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online': return <CheckCircle2 className="w-3 h-3 text-green-500" />;
      case 'processing': return <RefreshCw className="w-3 h-3 text-yellow-500 animate-spin" />;
      default: return <AlertTriangle className="w-3 h-3 text-red-500" />;
    }
  };

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-background to-primary/5">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <div className="p-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          TRAMON v8 - Central de IAs
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="status" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="status">Status IAs</TabsTrigger>
            <TabsTrigger value="actions">Ações Rápidas</TabsTrigger>
          </TabsList>

          <TabsContent value="status" className="space-y-3">
            <AnimatePresence>
              {iaStatuses.map((ia, index) => (
                <motion.div
                  key={ia.name}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center justify-between p-3 rounded-lg bg-card/50 border border-border/50"
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg bg-gradient-to-r ${ia.color}`}>
                      <ia.icon className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{ia.name}</span>
                        {getStatusIcon(ia.status)}
                      </div>
                      <span className="text-xs text-muted-foreground">{ia.lastAction}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold text-green-500">{ia.successRate}%</span>
                    <Progress value={ia.successRate} className="w-16 h-1 mt-1" />
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </TabsContent>

          <TabsContent value="actions" className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              {ACOES_RAPIDAS.map((acao) => (
                <Button
                  key={acao.id}
                  variant="outline"
                  size="sm"
                  className="h-auto py-3 flex flex-col gap-1 hover:bg-primary/10"
                  disabled={executing !== null}
                  onClick={() => executeAction(acao.id, acao.ia)}
                >
                  {executing === acao.id ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <acao.icon className="w-4 h-4" />
                  )}
                  <span className="text-xs">{acao.label}</span>
                  <Badge variant="secondary" className="text-[10px] px-1">
                    {acao.ia.toUpperCase()}
                  </Badge>
                </Button>
              ))}
            </div>

            <div className="mt-4 p-3 rounded-lg bg-primary/5 border border-primary/20">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Clock className="w-3 h-3" />
                <span>Última sincronização: há 5 minutos</span>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
