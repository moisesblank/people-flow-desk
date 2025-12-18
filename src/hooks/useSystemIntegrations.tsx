// ============================================
// MOISÉS MEDEIROS v10.0 - SYSTEM INTEGRATIONS HOOK
// Hook para gerenciar integrações do sistema
// ============================================

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface WebhookStats {
  total: number;
  pending: number;
  processing: number;
  completed: number;
  failed: number;
  bySource: Record<string, number>;
}

interface IAStats {
  total: number;
  byIA: Record<string, { count: number; avgTime: number; errors: number }>;
  lastCommand: Date | null;
}

interface IntegrationHealth {
  status: "healthy" | "warning" | "critical";
  webhooks: WebhookStats;
  ias: IAStats;
  lastUpdate: Date;
}

export function useSystemIntegrations() {
  const [health, setHealth] = useState<IntegrationHealth | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchIntegrationHealth = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const today = new Date().toISOString().split("T")[0];

      // Fetch webhook queue stats
      const { data: queueData } = await supabase
        .from("webhooks_queue")
        .select("status, source")
        .gte("created_at", today);

      // Fetch IA commands
      const { data: iaData } = await supabase
        .from("comandos_ia_central")
        .select("ia_destino, status, tempo_execucao_ms, created_at")
        .gte("created_at", today)
        .order("created_at", { ascending: false });

      // Calculate webhook stats
      const webhookStats: WebhookStats = {
        total: queueData?.length || 0,
        pending: queueData?.filter(w => w.status === "pending").length || 0,
        processing: queueData?.filter(w => w.status === "processing").length || 0,
        completed: queueData?.filter(w => w.status === "completed").length || 0,
        failed: queueData?.filter(w => w.status === "failed").length || 0,
        bySource: {},
      };

      queueData?.forEach(w => {
        const source = w.source || "unknown";
        webhookStats.bySource[source] = (webhookStats.bySource[source] || 0) + 1;
      });

      // Calculate IA stats
      const iaStats: IAStats = {
        total: iaData?.length || 0,
        byIA: {},
        lastCommand: iaData?.[0] ? new Date(iaData[0].created_at) : null,
      };

      const iaNames = ["manus", "lovable", "chatgpt", "tramon"];
      iaNames.forEach(ia => {
        const iaCommands = iaData?.filter(c => c.ia_destino === ia) || [];
        const avgTime = iaCommands.length > 0
          ? iaCommands.reduce((acc, c) => acc + (c.tempo_execucao_ms || 0), 0) / iaCommands.length
          : 0;

        iaStats.byIA[ia] = {
          count: iaCommands.length,
          avgTime: Math.round(avgTime),
          errors: iaCommands.filter(c => c.status === "failed").length,
        };
      });

      // Determine overall health
      const errorRate = webhookStats.total > 0 
        ? (webhookStats.failed / webhookStats.total) * 100 
        : 0;
      
      let status: IntegrationHealth["status"] = "healthy";
      if (errorRate > 20 || webhookStats.pending > 100) {
        status = "critical";
      } else if (errorRate > 10 || webhookStats.pending > 50) {
        status = "warning";
      }

      setHealth({
        status,
        webhooks: webhookStats,
        ias: iaStats,
        lastUpdate: new Date(),
      });
    } catch (err) {
      console.error("Error fetching integration health:", err);
      setError("Failed to fetch integration health");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchIntegrationHealth();

    // Subscribe to realtime updates
    const channel = supabase
      .channel("integration_health")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "webhooks_queue" },
        () => fetchIntegrationHealth()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "comandos_ia_central" },
        () => fetchIntegrationHealth()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchIntegrationHealth]);

  const triggerIA = async (ia: string, action: string, params: Record<string, unknown> = {}) => {
    try {
      const { data, error } = await supabase.functions.invoke("ia-gateway", {
        body: { ia, action, params },
      });

      if (error) throw error;
      
      // Refresh stats after trigger
      setTimeout(fetchIntegrationHealth, 1000);
      
      return { success: true, data };
    } catch (err) {
      console.error("Error triggering IA:", err);
      return { success: false, error: err };
    }
  };

  const retryFailedWebhooks = async () => {
    try {
      const { data, error } = await supabase
        .from("webhooks_queue")
        .update({ status: "pending", retry_count: 0 })
        .eq("status", "failed")
        .lt("retry_count", 3)
        .select();

      if (error) throw error;

      // Trigger queue worker
      await supabase.functions.invoke("queue-worker", {});
      
      fetchIntegrationHealth();
      
      return { success: true, count: data?.length || 0 };
    } catch (err) {
      console.error("Error retrying webhooks:", err);
      return { success: false, error: err };
    }
  };

  return {
    health,
    isLoading,
    error,
    refresh: fetchIntegrationHealth,
    triggerIA,
    retryFailedWebhooks,
  };
}

// Hook específico para status de uma IA
export function useIAStatus(iaName: string) {
  const [status, setStatus] = useState<{
    isOnline: boolean;
    commandsToday: number;
    lastActivity: Date | null;
    avgResponseTime: number;
  }>({
    isOnline: true,
    commandsToday: 0,
    lastActivity: null,
    avgResponseTime: 0,
  });

  useEffect(() => {
    const fetchStatus = async () => {
      const today = new Date().toISOString().split("T")[0];
      
      const { data } = await supabase
        .from("comandos_ia_central")
        .select("status, tempo_execucao_ms, created_at")
        .eq("ia_destino", iaName)
        .gte("created_at", today)
        .order("created_at", { ascending: false });

      if (data) {
        const avgTime = data.length > 0
          ? data.reduce((acc, c) => acc + (c.tempo_execucao_ms || 0), 0) / data.length
          : 0;

        setStatus({
          isOnline: !data.slice(0, 5).some(c => c.status === "failed"),
          commandsToday: data.length,
          lastActivity: data[0] ? new Date(data[0].created_at) : null,
          avgResponseTime: Math.round(avgTime),
        });
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, [iaName]);

  return status;
}
