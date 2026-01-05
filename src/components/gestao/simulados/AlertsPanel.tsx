/**
 * 🚨 PAINEL DE ALERTAS OPERACIONAIS — Constituição SYNAPSE Ω v10.0
 * 
 * FASE 4: Notificações de anomalias (muitas invalidações, etc.)
 */

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, formatDistanceToNow, subHours } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import {
  AlertTriangle, Bell, BellOff, CheckCircle2, XCircle,
  Activity, Users, Shield, Clock, TrendingUp, TrendingDown,
  RefreshCw, AlertCircle, Eye, Zap, Timer
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface Alert {
  id: string;
  type: "warning" | "error" | "info";
  title: string;
  message: string;
  metric?: number;
  threshold?: number;
  source: string;
  timestamp: Date;
  acknowledged: boolean;
}

interface SimuladoMetrics {
  simulado_id: string;
  simulado_title: string;
  total_attempts: number;
  finished_count: number;
  invalidated_count: number;
  disqualified_count: number;
  invalidation_rate: number;
  avg_time_seconds: number;
  avg_score: number;
}

// Thresholds para alertas
const ALERT_THRESHOLDS = {
  invalidation_rate_warning: 10, // % de invalidações
  invalidation_rate_critical: 25,
  low_completion_rate: 50, // % de completions
  high_attempt_volume: 100, // tentativas/hora
};

function useSimuladoMetrics() {
  return useQuery({
    queryKey: ["simulado-operational-metrics"],
    queryFn: async () => {
      // Buscar tentativas das últimas 24h
      const since = subHours(new Date(), 24).toISOString();

      const { data: attempts, error } = await supabase
        .from("simulado_attempts")
        .select(`
          id,
          simulado_id,
          status,
          score,
          time_spent_seconds,
          started_at,
          simulados!simulado_attempts_simulado_id_fkey(title)
        `)
        .gte("started_at", since);

      if (error) {
        console.error("[Metrics] Erro:", error);
        return [];
      }

      // Agrupar por simulado
      const metricsMap = new Map<string, SimuladoMetrics>();

      (attempts || []).forEach((attempt: Record<string, unknown>) => {
        const simId = attempt.simulado_id as string;
        if (!simId) return;

        if (!metricsMap.has(simId)) {
          metricsMap.set(simId, {
            simulado_id: simId,
            simulado_title: (attempt.simulados as Record<string, unknown>)?.title as string || "N/A",
            total_attempts: 0,
            finished_count: 0,
            invalidated_count: 0,
            disqualified_count: 0,
            invalidation_rate: 0,
            avg_time_seconds: 0,
            avg_score: 0,
          });
        }

        const m = metricsMap.get(simId)!;
        m.total_attempts++;

        if (attempt.status === "FINISHED") {
          m.finished_count++;
          m.avg_score = (m.avg_score * (m.finished_count - 1) + ((attempt.score as number) || 0)) / m.finished_count;
          m.avg_time_seconds = (m.avg_time_seconds * (m.finished_count - 1) + ((attempt.time_spent_seconds as number) || 0)) / m.finished_count;
        }
        if (attempt.status === "INVALIDATED") m.invalidated_count++;
        if (attempt.status === "DISQUALIFIED") m.disqualified_count++;
      });

      // Calcular taxas
      metricsMap.forEach((m) => {
        if (m.total_attempts > 0) {
          m.invalidation_rate = ((m.invalidated_count + m.disqualified_count) / m.total_attempts) * 100;
        }
      });

      return Array.from(metricsMap.values());
    },
    staleTime: 60_000, // 1 minuto
    refetchInterval: 60_000,
  });
}

function useSystemHealth() {
  return useQuery({
    queryKey: ["system-health-simulados"],
    queryFn: async () => {
      const start = performance.now();

      // Teste de database
      const { error: dbError } = await supabase
        .from("simulados")
        .select("id", { count: "exact", head: true })
        .limit(1);

      // Teste de auth
      const { error: authError } = await supabase.auth.getSession();

      const latency = Math.round(performance.now() - start);

      return {
        database: dbError ? "error" : latency > 2000 ? "degraded" : "healthy",
        auth: authError ? "error" : "healthy",
        latency,
        timestamp: new Date(),
      };
    },
    staleTime: 30_000,
    refetchInterval: 30_000,
  });
}

export function AlertsPanel() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [acknowledgedIds, setAcknowledgedIds] = useState<Set<string>>(new Set());

  const { data: metrics, isLoading: isLoadingMetrics, refetch: refetchMetrics } = useSimuladoMetrics();
  const { data: health, refetch: refetchHealth } = useSystemHealth();

  // Gerar alertas baseado nas métricas
  useEffect(() => {
    if (!metrics) return;

    const newAlerts: Alert[] = [];

    metrics.forEach((m) => {
      // Alerta de taxa de invalidação
      if (m.invalidation_rate >= ALERT_THRESHOLDS.invalidation_rate_critical && m.total_attempts >= 5) {
        newAlerts.push({
          id: `invalidation-critical-${m.simulado_id}`,
          type: "error",
          title: "Taxa de Invalidação Crítica",
          message: `${m.simulado_title}: ${m.invalidation_rate.toFixed(1)}% das tentativas foram invalidadas.`,
          metric: m.invalidation_rate,
          threshold: ALERT_THRESHOLDS.invalidation_rate_critical,
          source: m.simulado_title,
          timestamp: new Date(),
          acknowledged: acknowledgedIds.has(`invalidation-critical-${m.simulado_id}`),
        });
      } else if (m.invalidation_rate >= ALERT_THRESHOLDS.invalidation_rate_warning && m.total_attempts >= 5) {
        newAlerts.push({
          id: `invalidation-warning-${m.simulado_id}`,
          type: "warning",
          title: "Taxa de Invalidação Elevada",
          message: `${m.simulado_title}: ${m.invalidation_rate.toFixed(1)}% de invalidações.`,
          metric: m.invalidation_rate,
          threshold: ALERT_THRESHOLDS.invalidation_rate_warning,
          source: m.simulado_title,
          timestamp: new Date(),
          acknowledged: acknowledgedIds.has(`invalidation-warning-${m.simulado_id}`),
        });
      }

      // Alerta de baixa taxa de conclusão
      const completionRate = m.total_attempts > 0 ? (m.finished_count / m.total_attempts) * 100 : 0;
      if (completionRate < ALERT_THRESHOLDS.low_completion_rate && m.total_attempts >= 10) {
        newAlerts.push({
          id: `completion-${m.simulado_id}`,
          type: "warning",
          title: "Baixa Taxa de Conclusão",
          message: `${m.simulado_title}: Apenas ${completionRate.toFixed(1)}% concluíram.`,
          metric: completionRate,
          threshold: ALERT_THRESHOLDS.low_completion_rate,
          source: m.simulado_title,
          timestamp: new Date(),
          acknowledged: acknowledgedIds.has(`completion-${m.simulado_id}`),
        });
      }

      // Alerta de alto volume
      if (m.total_attempts >= ALERT_THRESHOLDS.high_attempt_volume) {
        newAlerts.push({
          id: `volume-${m.simulado_id}`,
          type: "info",
          title: "Alto Volume de Tentativas",
          message: `${m.simulado_title}: ${m.total_attempts} tentativas nas últimas 24h.`,
          metric: m.total_attempts,
          threshold: ALERT_THRESHOLDS.high_attempt_volume,
          source: m.simulado_title,
          timestamp: new Date(),
          acknowledged: acknowledgedIds.has(`volume-${m.simulado_id}`),
        });
      }
    });

    // Alertas de saúde do sistema
    if (health?.database === "error") {
      newAlerts.push({
        id: "system-db-error",
        type: "error",
        title: "Erro no Banco de Dados",
        message: "Conexão com o banco de dados está com problemas.",
        source: "Sistema",
        timestamp: new Date(),
        acknowledged: acknowledgedIds.has("system-db-error"),
      });
    } else if (health?.database === "degraded") {
      newAlerts.push({
        id: "system-db-degraded",
        type: "warning",
        title: "Banco de Dados Lento",
        message: `Latência elevada: ${health.latency}ms.`,
        metric: health.latency,
        threshold: 2000,
        source: "Sistema",
        timestamp: new Date(),
        acknowledged: acknowledgedIds.has("system-db-degraded"),
      });
    }

    setAlerts(newAlerts);
  }, [metrics, health, acknowledgedIds]);

  const acknowledgeAlert = (alertId: string) => {
    setAcknowledgedIds((prev) => new Set([...prev, alertId]));
    toast.success("Alerta reconhecido");
  };

  const activeAlerts = alerts.filter((a) => !a.acknowledged);
  const acknowledgedAlerts = alerts.filter((a) => a.acknowledged);

  // Métricas agregadas
  const totalAttempts = metrics?.reduce((acc, m) => acc + m.total_attempts, 0) || 0;
  const totalFinished = metrics?.reduce((acc, m) => acc + m.finished_count, 0) || 0;
  const totalInvalidated = metrics?.reduce((acc, m) => acc + m.invalidated_count + m.disqualified_count, 0) || 0;
  const overallCompletionRate = totalAttempts > 0 ? (totalFinished / totalAttempts) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Stats rápidos */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalAttempts}</p>
              <p className="text-xs text-muted-foreground">Tentativas (24h)</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-500/10 text-green-500">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold">{overallCompletionRate.toFixed(0)}%</p>
              <p className="text-xs text-muted-foreground">Taxa Conclusão</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-500/10 text-red-500">
              <XCircle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalInvalidated}</p>
              <p className="text-xs text-muted-foreground">Invalidações</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className={cn(
              "p-2 rounded-lg",
              health?.database === "healthy" 
                ? "bg-green-500/10 text-green-500" 
                : health?.database === "degraded" 
                  ? "bg-yellow-500/10 text-yellow-500"
                  : "bg-red-500/10 text-red-500"
            )}>
              <Activity className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold">{health?.latency || 0}ms</p>
              <p className="text-xs text-muted-foreground">Latência DB</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Alertas ativos */}
        <Card className={cn(
          activeAlerts.length > 0 && "border-yellow-500/50"
        )}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Bell className={cn(
                  "h-5 w-5",
                  activeAlerts.length > 0 ? "text-yellow-500" : "text-muted-foreground"
                )} />
                Alertas Ativos
                {activeAlerts.length > 0 && (
                  <Badge variant="destructive" className="ml-2">
                    {activeAlerts.length}
                  </Badge>
                )}
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={() => {
                refetchMetrics();
                refetchHealth();
              }}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px]">
              {activeAlerts.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <CheckCircle2 className="h-12 w-12 mx-auto mb-4 opacity-50 text-green-500" />
                  <p>Nenhum alerta ativo.</p>
                  <p className="text-sm">Sistema operando normalmente.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {activeAlerts.map((alert) => (
                    <Card
                      key={alert.id}
                      className={cn(
                        "p-4 border-l-4",
                        alert.type === "error" && "border-l-red-500 bg-red-500/5",
                        alert.type === "warning" && "border-l-yellow-500 bg-yellow-500/5",
                        alert.type === "info" && "border-l-blue-500 bg-blue-500/5"
                      )}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            {alert.type === "error" && <AlertCircle className="h-4 w-4 text-red-500" />}
                            {alert.type === "warning" && <AlertTriangle className="h-4 w-4 text-yellow-500" />}
                            {alert.type === "info" && <Bell className="h-4 w-4 text-blue-500" />}
                            <span className="font-medium text-sm">{alert.title}</span>
                          </div>
                          <p className="text-sm text-muted-foreground">{alert.message}</p>
                          {alert.metric !== undefined && alert.threshold !== undefined && (
                            <div className="mt-2">
                              <Progress 
                                value={Math.min((alert.metric / alert.threshold) * 100, 100)} 
                                className="h-1.5"
                              />
                            </div>
                          )}
                          <p className="text-xs text-muted-foreground mt-2">
                            {formatDistanceToNow(alert.timestamp, { addSuffix: true, locale: ptBR })}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => acknowledgeAlert(alert.id)}
                        >
                          <Eye className="h-3 w-3" />
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Métricas por simulado */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Métricas por Simulado (24h)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px]">
              {isLoadingMetrics ? (
                <div className="text-center py-12 text-muted-foreground">
                  <RefreshCw className="h-8 w-8 mx-auto mb-4 animate-spin" />
                  <p>Carregando métricas...</p>
                </div>
              ) : !metrics || metrics.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhuma atividade nas últimas 24h.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {metrics.map((m) => (
                    <Card key={m.simulado_id} className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium text-sm truncate max-w-[200px]">
                          {m.simulado_title}
                        </h4>
                        <Badge variant="outline">
                          {m.total_attempts} tentativas
                        </Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                          <p className="text-lg font-bold text-green-500">
                            {m.finished_count}
                          </p>
                          <p className="text-xs text-muted-foreground">Concluídas</p>
                        </div>
                        <div>
                          <p className={cn(
                            "text-lg font-bold",
                            m.invalidation_rate > 20 ? "text-red-500" : "text-yellow-500"
                          )}>
                            {m.invalidated_count + m.disqualified_count}
                          </p>
                          <p className="text-xs text-muted-foreground">Invalidadas</p>
                        </div>
                        <div>
                          <p className="text-lg font-bold text-blue-500">
                            {m.avg_score.toFixed(0)}%
                          </p>
                          <p className="text-xs text-muted-foreground">Média</p>
                        </div>
                      </div>
                      {m.invalidation_rate > 0 && (
                        <div className="mt-3">
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-muted-foreground">Taxa Invalidação</span>
                            <span className={cn(
                              m.invalidation_rate > 20 ? "text-red-500" : "text-yellow-500"
                            )}>
                              {m.invalidation_rate.toFixed(1)}%
                            </span>
                          </div>
                          <Progress
                            value={Math.min(m.invalidation_rate, 100)}
                            className={cn(
                              "h-1.5",
                              m.invalidation_rate > 20 && "[&>div]:bg-red-500"
                            )}
                          />
                        </div>
                      )}
                    </Card>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Alertas reconhecidos */}
      {acknowledgedAlerts.length > 0 && (
        <Card className="opacity-75">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <BellOff className="h-4 w-4 text-muted-foreground" />
              Alertas Reconhecidos ({acknowledgedAlerts.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {acknowledgedAlerts.map((alert) => (
                <Badge key={alert.id} variant="outline" className="gap-1">
                  {alert.type === "error" && <XCircle className="h-3 w-3 text-red-500" />}
                  {alert.type === "warning" && <AlertTriangle className="h-3 w-3 text-yellow-500" />}
                  {alert.title}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
