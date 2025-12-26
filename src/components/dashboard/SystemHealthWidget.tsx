// ============================================
// TRAMON v9.0 - SYSTEM HEALTH WIDGET
// Widget para exibir saúde do sistema via reports-api
// ============================================

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Activity, Server, AlertTriangle, CheckCircle, Clock, 
  Zap, DollarSign, RefreshCw, Shield, Database
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface SystemHealth {
  tipo: string;
  timestamp: string;
  integracoes: {
    hotmart: { status: string; ultima_verificacao: string };
    wordpress: { status: string; ultima_verificacao: string };
    whatsapp: { status: string; ultima_verificacao: string };
  };
  metricas: {
    latencia_media_ms: number;
    webhooks_na_dlq: number;
    eventos_seguranca_24h: number;
    custo_ia_24h_usd: string;
    comandos_ia_24h: number;
  };
  ultimos_erros: Array<{
    id: string;
    event_type: string;
    severity: string;
    description: string;
    created_at: string;
  }>;
  dead_letter_queue: Array<{
    id: string;
    source: string;
    event_type: string;
    last_error: string;
    retry_count: number;
    created_at: string;
  }>;
}

interface DashboardMetrics {
  alunos_ativos: number;
  receita_periodo: number;
  despesa_periodo: number;
  lucro_periodo: number;
  margem_lucro: string;
  tarefas_total: number;
  tarefas_concluidas: number;
  webhooks_pendentes: number;
}

export function SystemHealthWidget() {
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async (showToast = false) => {
    try {
      if (showToast) setRefreshing(true);

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      
      // Buscar saúde do sistema
      const healthResponse = await fetch(
        `${supabaseUrl}/functions/v1/reports-api?type=system_health`
      );
      
      if (healthResponse.ok) {
        const healthData = await healthResponse.json();
        setHealth(healthData.report);
      }

      // Buscar métricas do dashboard
      const dashResponse = await fetch(
        `${supabaseUrl}/functions/v1/reports-api?type=dashboard`
      );
      
      if (dashResponse.ok) {
        const dashData = await dashResponse.json();
        setMetrics(dashData.report.metricas);
      }

      if (showToast) {
        toast.success("Dados atualizados!");
      }
    } catch (error) {
      console.error("Erro ao buscar saúde do sistema:", error);
      if (showToast) {
        toast.error("Erro ao atualizar dados");
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // PATCH-017: jitter anti-herd (0-10s)
  useEffect(() => {
    fetchData();
    const jitter = Math.floor(Math.random() * 10000);
    const interval = setInterval(() => fetchData(), 60000 + jitter);
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "online": return "text-green-500";
      case "offline": return "text-red-500";
      default: return "text-yellow-500";
    }
  };

  const getLatencyColor = (latency: number) => {
    if (latency < 500) return "text-green-500";
    if (latency < 1000) return "text-yellow-500";
    return "text-red-500";
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-8 w-8 animate-spin text-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header com botão de refresh */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Server className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Saúde do Sistema</h3>
          <Badge variant="outline" className="text-xs">
            TRAMON v9.0
          </Badge>
        </div>
        <Button 
          size="sm" 
          variant="ghost" 
          onClick={() => fetchData(true)}
          disabled={refreshing}
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
        </Button>
      </div>

      {/* Métricas rápidas */}
      {metrics && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <Card className="border-green-500/20 bg-green-500/5">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-green-500" />
                  <span className="text-xs text-muted-foreground">Receita</span>
                </div>
                <p className="text-lg font-bold text-green-500">
                  R$ {metrics.receita_periodo.toLocaleString("pt-BR")}
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="border-blue-500/20 bg-blue-500/5">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-blue-500" />
                  <span className="text-xs text-muted-foreground">Alunos</span>
                </div>
                <p className="text-lg font-bold text-blue-500">
                  {metrics.alunos_ativos}
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="border-purple-500/20 bg-purple-500/5">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-purple-500" />
                  <span className="text-xs text-muted-foreground">Margem</span>
                </div>
                <p className="text-lg font-bold text-purple-500">
                  {metrics.margem_lucro}%
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
          >
            <Card className={`border-${health?.metricas.webhooks_na_dlq ? 'red' : 'green'}-500/20`}>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Database className="h-4 w-4 text-primary" />
                  <span className="text-xs text-muted-foreground">DLQ</span>
                </div>
                <p className={`text-lg font-bold ${health?.metricas.webhooks_na_dlq ? 'text-red-500' : 'text-green-500'}`}>
                  {health?.metricas.webhooks_na_dlq || 0}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      )}

      {/* Status das Integrações */}
      {health && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Integrações
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              {Object.entries(health.integracoes).map(([key, value]) => (
                <div key={key} className="flex items-center gap-2">
                  {value.status === "online" ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                  )}
                  <span className="text-sm capitalize">{key}</span>
                </div>
              ))}
            </div>

            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
              <div className="text-center">
                <p className={`text-lg font-bold ${getLatencyColor(health.metricas.latencia_media_ms)}`}>
                  {health.metricas.latencia_media_ms}ms
                </p>
                <p className="text-xs text-muted-foreground">Latência Média</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-primary">
                  {health.metricas.comandos_ia_24h}
                </p>
                <p className="text-xs text-muted-foreground">Comandos IA</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-amber-500">
                  ${health.metricas.custo_ia_24h_usd}
                </p>
                <p className="text-xs text-muted-foreground">Custo IA 24h</p>
              </div>
              <div className="text-center">
                <p className={`text-lg font-bold ${health.metricas.eventos_seguranca_24h > 0 ? 'text-red-500' : 'text-green-500'}`}>
                  {health.metricas.eventos_seguranca_24h}
                </p>
                <p className="text-xs text-muted-foreground">Eventos Seg.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Erros Recentes */}
      {health && health.ultimos_erros && health.ultimos_erros.length > 0 && (
        <Card className="border-red-500/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2 text-red-500">
              <AlertTriangle className="h-4 w-4" />
              Erros Recentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {health.ultimos_erros.map((error, idx) => (
                <div 
                  key={error.id || idx}
                  className="p-2 rounded-lg bg-red-500/10 text-sm"
                >
                  <div className="flex items-center justify-between">
                    <Badge variant="destructive" className="text-xs">
                      {error.severity}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {new Date(error.created_at).toLocaleString("pt-BR")}
                    </span>
                  </div>
                  <p className="mt-1 text-muted-foreground">{error.description}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dead Letter Queue */}
      {health && health.dead_letter_queue && health.dead_letter_queue.length > 0 && (
        <Card className="border-amber-500/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2 text-amber-500">
              <Database className="h-4 w-4" />
              Dead Letter Queue ({health.dead_letter_queue.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {health.dead_letter_queue.map((item, idx) => (
                <div 
                  key={item.id || idx}
                  className="p-2 rounded-lg bg-amber-500/10 text-sm"
                >
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-xs">
                      {item.source}: {item.event_type}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      Tentativas: {item.retry_count}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground truncate">
                    {item.last_error}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Timestamp */}
      {health && (
        <p className="text-xs text-muted-foreground text-center">
          Última atualização: {new Date(health.timestamp).toLocaleString("pt-BR")}
        </p>
      )}
    </div>
  );
}

export default SystemHealthWidget;
