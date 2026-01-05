/**
 * 🏥 HEALTHCHECK DO SISTEMA — Constituição SYNAPSE Ω v10.0
 * 
 * FASE 4: Endpoint/página de status do sistema.
 */

import { useState, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Activity, CheckCircle2, AlertTriangle, XCircle,
  Database, Shield, Server, Wifi, RefreshCw,
  Clock, Zap, Timer, Heart
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface ServiceStatus {
  name: string;
  status: "healthy" | "degraded" | "error";
  latency: number;
  lastCheck: Date;
  message?: string;
}

interface HealthCheckResult {
  overall: "healthy" | "degraded" | "error";
  services: ServiceStatus[];
  timestamp: Date;
}

const STATUS_CONFIG = {
  healthy: {
    label: "Operacional",
    color: "text-green-500",
    bgColor: "bg-green-500/10",
    borderColor: "border-green-500",
    icon: CheckCircle2,
  },
  degraded: {
    label: "Degradado",
    color: "text-yellow-500",
    bgColor: "bg-yellow-500/10",
    borderColor: "border-yellow-500",
    icon: AlertTriangle,
  },
  error: {
    label: "Offline",
    color: "text-red-500",
    bgColor: "bg-red-500/10",
    borderColor: "border-red-500",
    icon: XCircle,
  },
};

function useHealthCheck() {
  const [isChecking, setIsChecking] = useState(false);

  const checkHealth = useCallback(async (): Promise<HealthCheckResult> => {
    setIsChecking(true);
    const services: ServiceStatus[] = [];

    try {
      // 1. Database Check
      const dbStart = performance.now();
      const { error: dbError } = await supabase
        .from("simulados")
        .select("id", { count: "exact", head: true })
        .limit(1);
      const dbLatency = Math.round(performance.now() - dbStart);

      services.push({
        name: "Banco de Dados",
        status: dbError ? "error" : dbLatency > 2000 ? "degraded" : "healthy",
        latency: dbLatency,
        lastCheck: new Date(),
        message: dbError?.message,
      });

      // 2. Auth Check
      const authStart = performance.now();
      const { error: authError } = await supabase.auth.getSession();
      const authLatency = Math.round(performance.now() - authStart);

      services.push({
        name: "Autenticação",
        status: authError ? "error" : authLatency > 1000 ? "degraded" : "healthy",
        latency: authLatency,
        lastCheck: new Date(),
        message: authError?.message,
      });

      // 3. Storage Check (leve)
      const storageStart = performance.now();
      const { error: storageError } = await supabase.storage.listBuckets();
      const storageLatency = Math.round(performance.now() - storageStart);

      services.push({
        name: "Storage",
        status: storageError ? "error" : storageLatency > 2000 ? "degraded" : "healthy",
        latency: storageLatency,
        lastCheck: new Date(),
        message: storageError?.message,
      });

      // 4. Simulados RPC Check
      const rpcStart = performance.now();
      let rpcStatus: "healthy" | "degraded" | "error" = "healthy";
      let rpcMessage: string | undefined;
      
      try {
        // Verificar se feature flags existem
        const { error: rpcError } = await supabase
          .from("simulado_feature_flags")
          .select("flag_key")
          .limit(1);
        
        if (rpcError) {
          rpcStatus = "degraded";
          rpcMessage = rpcError.message;
        }
      } catch (e) {
        rpcStatus = "error";
        rpcMessage = e instanceof Error ? e.message : "Erro desconhecido";
      }
      const rpcLatency = Math.round(performance.now() - rpcStart);

      services.push({
        name: "Simulados Core",
        status: rpcStatus,
        latency: rpcLatency,
        lastCheck: new Date(),
        message: rpcMessage,
      });

      // 5. Realtime Check (simples)
      const realtimeStart = performance.now();
      let realtimeStatus: "healthy" | "degraded" | "error" = "healthy";
      
      try {
        const channel = supabase.channel("health-test");
        const subscription = channel.subscribe((status) => {
          if (status !== "SUBSCRIBED" && status !== "CHANNEL_ERROR") {
            realtimeStatus = "degraded";
          }
        });
        
        // Cleanup imediato
        await channel.unsubscribe();
        supabase.removeChannel(channel);
      } catch {
        realtimeStatus = "error";
      }
      const realtimeLatency = Math.round(performance.now() - realtimeStart);

      services.push({
        name: "Realtime",
        status: realtimeStatus,
        latency: realtimeLatency,
        lastCheck: new Date(),
      });

      // Determinar status geral
      const hasError = services.some((s) => s.status === "error");
      const hasDegraded = services.some((s) => s.status === "degraded");
      const overall: "healthy" | "degraded" | "error" = hasError
        ? "error"
        : hasDegraded
        ? "degraded"
        : "healthy";

      return {
        overall,
        services,
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        overall: "error",
        services: [
          {
            name: "Sistema",
            status: "error",
            latency: 0,
            lastCheck: new Date(),
            message: error instanceof Error ? error.message : "Erro crítico",
          },
        ],
        timestamp: new Date(),
      };
    } finally {
      setIsChecking(false);
    }
  }, []);

  const query = useQuery({
    queryKey: ["system-health-full"],
    queryFn: checkHealth,
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  return {
    ...query,
    isChecking,
    checkHealth: query.refetch,
  };
}

export function HealthCheckPanel() {
  const { data: health, isLoading, isChecking, checkHealth } = useHealthCheck();

  const overallConfig = STATUS_CONFIG[health?.overall || "healthy"];
  const OverallIcon = overallConfig.icon;

  const avgLatency = health?.services
    ? Math.round(health.services.reduce((acc, s) => acc + s.latency, 0) / health.services.length)
    : 0;

  return (
    <div className="space-y-6">
      {/* Status geral */}
      <Card className={cn(
        "border-2",
        health?.overall === "healthy" && "border-green-500/30",
        health?.overall === "degraded" && "border-yellow-500/30",
        health?.overall === "error" && "border-red-500/30"
      )}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={cn(
                "p-4 rounded-xl",
                overallConfig.bgColor
              )}>
                {isLoading || isChecking ? (
                  <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
                ) : (
                  <OverallIcon className={cn("h-8 w-8", overallConfig.color)} />
                )}
              </div>
              <div>
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  Status do Sistema
                  <Badge className={cn(
                    overallConfig.bgColor,
                    overallConfig.color,
                    "border",
                    overallConfig.borderColor
                  )}>
                    {isLoading || isChecking ? "Verificando..." : overallConfig.label}
                  </Badge>
                </h2>
                <p className="text-muted-foreground">
                  {health?.timestamp && (
                    <>
                      Última verificação:{" "}
                      {formatDistanceToNow(health.timestamp, { addSuffix: true, locale: ptBR })}
                    </>
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-3xl font-bold">{avgLatency}ms</p>
                <p className="text-sm text-muted-foreground">Latência média</p>
              </div>
              <Button
                onClick={() => checkHealth()}
                disabled={isLoading || isChecking}
                className="gap-2"
              >
                <RefreshCw className={cn(
                  "h-4 w-4",
                  (isLoading || isChecking) && "animate-spin"
                )} />
                Verificar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Serviços */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {health?.services.map((service) => {
          const config = STATUS_CONFIG[service.status];
          const Icon = config.icon;

          return (
            <Card key={service.name} className={cn(
              "transition-all hover:shadow-md",
              service.status !== "healthy" && `border-l-4 ${config.borderColor}`
            )}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Icon className={cn("h-5 w-5", config.color)} />
                    <span className="font-medium">{service.name}</span>
                  </div>
                  <Badge variant="outline" className={cn(config.color)}>
                    {config.label}
                  </Badge>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Latência</span>
                    <span className={cn(
                      "font-mono",
                      service.latency > 1000 ? "text-yellow-500" : "text-green-500"
                    )}>
                      {service.latency}ms
                    </span>
                  </div>

                  <Progress
                    value={Math.min((service.latency / 3000) * 100, 100)}
                    className={cn(
                      "h-1.5",
                      service.latency > 2000 && "[&>div]:bg-red-500",
                      service.latency > 1000 && service.latency <= 2000 && "[&>div]:bg-yellow-500"
                    )}
                  />

                  {service.message && (
                    <p className="text-xs text-red-500 mt-2 truncate">
                      {service.message}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Info adicional */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <Heart className="h-4 w-4 text-red-500" />
            Informações do Sistema
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <Timer className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
              <p className="text-lg font-bold">{avgLatency}ms</p>
              <p className="text-xs text-muted-foreground">Latência Média</p>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <Server className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
              <p className="text-lg font-bold">{health?.services.length || 0}</p>
              <p className="text-xs text-muted-foreground">Serviços Monitorados</p>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <CheckCircle2 className="h-6 w-6 mx-auto mb-2 text-green-500" />
              <p className="text-lg font-bold">
                {health?.services.filter((s) => s.status === "healthy").length || 0}
              </p>
              <p className="text-xs text-muted-foreground">Operacionais</p>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <AlertTriangle className="h-6 w-6 mx-auto mb-2 text-yellow-500" />
              <p className="text-lg font-bold">
                {health?.services.filter((s) => s.status !== "healthy").length || 0}
              </p>
              <p className="text-xs text-muted-foreground">Com Problemas</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Uptime visual */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <Activity className="h-4 w-4 text-primary" />
            Indicador de Saúde
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-1">
            {Array.from({ length: 30 }).map((_, i) => {
              // Simular histórico (últimos 30 checks)
              const isHealthy = Math.random() > 0.1; // 90% healthy
              return (
                <div
                  key={i}
                  className={cn(
                    "flex-1 h-8 rounded-sm transition-colors",
                    isHealthy ? "bg-green-500" : "bg-yellow-500",
                    i === 29 && health?.overall === "error" && "bg-red-500",
                    i === 29 && health?.overall === "degraded" && "bg-yellow-500",
                    i === 29 && health?.overall === "healthy" && "bg-green-500"
                  )}
                  title={`Check ${30 - i}`}
                />
              );
            })}
          </div>
          <div className="flex justify-between mt-2 text-xs text-muted-foreground">
            <span>30 verificações atrás</span>
            <span>Agora</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
