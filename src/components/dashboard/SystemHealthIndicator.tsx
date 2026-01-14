// ============================================
// SYNAPSE v14.1 - SYSTEM HEALTH INDICATOR
// Indicador rápido de saúde do sistema
// ============================================

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Activity, CheckCircle, AlertTriangle, XCircle, Wifi, Database, Server } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

/**
 * @deprecated P1-2: OWNER_EMAIL mantido apenas como fallback.
 * Verificação primária é via role === 'owner'.
 */
const OWNER_EMAIL = "moisesblank@gmail.com";

interface HealthStatus {
  database: "healthy" | "degraded" | "down";
  auth: "healthy" | "degraded" | "down";
  api: "healthy" | "degraded" | "down";
  latency: number;
}

export function SystemHealthIndicator() {
  const { user, role } = useAuth();
  
  // P1-2: VERIFICAÇÃO OWNER VIA ROLE (não email)
  const isOwner = role === 'owner' || user?.email?.toLowerCase() === OWNER_EMAIL;
  
  const [health, setHealth] = useState<HealthStatus>({
    database: "healthy",
    auth: "healthy",
    api: "healthy",
    latency: 0,
  });
  const [isChecking, setIsChecking] = useState(false);

  // 🏛️ CONSTITUIÇÃO: NÃO RENDERIZA SE NÃO FOR OWNER
  if (!isOwner) {
    return null;
  }

  const checkHealth = async () => {
    setIsChecking(true);
    const startTime = performance.now();
    
    try {
      // Check database
      const { error: dbError } = await supabase
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .limit(1);
      
      // Check auth
      const { error: authError } = await supabase.auth.getSession();
      
      const endTime = performance.now();
      const latency = Math.round(endTime - startTime);

      setHealth({
        database: dbError ? "degraded" : "healthy",
        auth: authError ? "degraded" : "healthy",
        api: latency < 1000 ? "healthy" : latency < 3000 ? "degraded" : "down",
        latency,
      });
    } catch {
      setHealth({
        database: "down",
        auth: "down",
        api: "down",
        latency: 9999,
      });
    } finally {
      setIsChecking(false);
    }
  };

  // PATCH-016: jitter anti-herd (0-10s)
  useEffect(() => {
    checkHealth();
    const jitter = Math.floor(Math.random() * 10000);
    const interval = setInterval(checkHealth, 60000 + jitter);
    return () => clearInterval(interval);
  }, []);

  const overallStatus = 
    health.database === "down" || health.auth === "down" || health.api === "down"
      ? "down"
      : health.database === "degraded" || health.auth === "degraded" || health.api === "degraded"
      ? "degraded"
      : "healthy";

  const statusConfig = {
    healthy: {
      icon: CheckCircle,
      color: "text-[hsl(var(--stats-green))]",
      bgColor: "bg-[hsl(var(--stats-green))]/10",
      label: "Operacional",
      badgeVariant: "status-online" as const,
    },
    degraded: {
      icon: AlertTriangle,
      color: "text-yellow-500",
      bgColor: "bg-yellow-500/10",
      label: "Degradado",
      badgeVariant: "status-syncing" as const,
    },
    down: {
      icon: XCircle,
      color: "text-red-500",
      bgColor: "bg-red-500/10",
      label: "Offline",
      badgeVariant: "destructive" as const,
    },
  };

  const config = statusConfig[overallStatus];
  const StatusIcon = config.icon;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <motion.button
          onClick={checkHealth}
          disabled={isChecking}
          className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all",
            config.bgColor,
            "border-border/50 hover:border-border"
          )}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <motion.div
            animate={isChecking ? { rotate: 360 } : {}}
            transition={{ repeat: isChecking ? Infinity : 0, duration: 1, ease: "linear" }}
          >
            {isChecking ? (
              <Activity className="h-4 w-4 text-muted-foreground" />
            ) : (
              <StatusIcon className={cn("h-4 w-4", config.color)} />
            )}
          </motion.div>
          <span className={cn("text-xs font-medium", config.color)}>
            {isChecking ? "Verificando..." : config.label}
          </span>
          {!isChecking && overallStatus === "healthy" && (
            <span className="relative flex items-center gap-1 text-[10px] text-muted-foreground">
              <span className="absolute -left-1 w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
              <span className="pl-2">{health.latency}ms</span>
            </span>
          )}
        </motion.button>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="p-3 max-w-xs">
        <div className="space-y-2">
          <p className="font-semibold text-sm">Status do Sistema</p>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Database className="h-3 w-3" /> Database
              </span>
              <span className={cn("text-xs font-medium", statusConfig[health.database].color)}>
                {health.database === "healthy" ? "OK" : health.database}
              </span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Server className="h-3 w-3" /> Auth
              </span>
              <span className={cn("text-xs font-medium", statusConfig[health.auth].color)}>
                {health.auth === "healthy" ? "OK" : health.auth}
              </span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Wifi className="h-3 w-3" /> Latência
              </span>
              <span className={cn("text-xs font-medium", statusConfig[health.api].color)}>
                {health.latency}ms
              </span>
            </div>
          </div>
          <p className="text-[10px] text-muted-foreground pt-1 border-t border-border/50">
            Clique para verificar novamente
          </p>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}
