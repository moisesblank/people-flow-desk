// ============================================
// REALTIME METRICS BAR v3.1 - OPTIMIZED
// Métricas em tempo real - SEM ANIMAÇÕES PESADAS
// Conexão Supabase + Performance Otimizada
// ============================================

import { useState, useEffect, useCallback, useRef } from "react";
import { 
  Activity, 
  Users, 
  DollarSign, 
  TrendingUp, 
  Clock,
  Zap,
  Eye,
  MessageCircle,
  Wifi,
  Shield,
  Cpu,
  GraduationCap,
  CheckSquare,
  AlertTriangle,
  RefreshCw
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useSubspaceQuery, SUBSPACE_CACHE_PROFILES } from "@/hooks/useSubspaceCommunication";
import { formatCurrencyCompact } from "@/utils";
import type { LucideIcon } from "lucide-react";

interface MetricItem {
  id: string;
  icon: LucideIcon;
  label: string;
  value: string | number;
  trend?: "up" | "down" | "neutral";
  color?: string;
  pulse?: boolean;
}

interface RealTimeMetricsBarProps {
  className?: string;
}

// Usa formatação compacta centralizada
const formatCurrency = formatCurrencyCompact;

function formatTime(date: Date): string {
  return date.toLocaleTimeString("pt-BR", { 
    hour: "2-digit", 
    minute: "2-digit", 
    second: "2-digit" 
  });
}

export function RealTimeMetricsBar({ className }: RealTimeMetricsBarProps) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [activeIndex, setActiveIndex] = useState(0);
  const [latency, setLatency] = useState(0);
  const [isConnected, setIsConnected] = useState(true);

  // Query para métricas em tempo real - MIGRADO PARA useSubspaceQuery
  const { data: metrics, refetch, isLoading } = useSubspaceQuery<MetricItem[]>(
    ["realtime-metrics-bar"],
    async () => {
      const startTime = Date.now();
      const hoje = new Date();
      const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1).toISOString();

      const entradasRes = await supabase.from('entradas').select('valor').gte('data', inicioMes);
      const gastosRes = await supabase.from('gastos').select('valor').gte('data', inicioMes);
      const tarefasRes = await supabase.from('calendar_tasks').select('id, is_completed').eq('task_date', hoje.toISOString().split('T')[0]);
      const alunosRes = await supabase.from('alunos').select('id', { count: 'exact', head: true });

      const endTime = Date.now();
      setLatency(endTime - startTime);
      setIsConnected(true);

      const receita = (entradasRes.data || []).reduce((s: number, e: any) => s + (e.valor || 0), 0);
      const despesas = (gastosRes.data || []).reduce((s: number, g: any) => s + (g.valor || 0), 0);
      const saldo = receita - despesas;
      const tarefasTotal = tarefasRes.data?.length || 0;
      const tarefasPendentes = (tarefasRes.data || []).filter((t: any) => !t.is_completed).length;
      const tarefasConcluidas = tarefasTotal - tarefasPendentes;
      const totalAlunos = alunosRes.count || 0;
      const usuariosOnline = 1;
      const alertasPendentes = 0;

      const metricsArray: MetricItem[] = [];
      
      metricsArray.push({ 
        id: "status", 
        icon: Shield, 
        label: "Sistema", 
        value: "Online", 
        color: "text-emerald-400", 
        pulse: true 
      });
      
      metricsArray.push({ 
        id: "saldo", 
        icon: DollarSign, 
        label: "Saldo Mês", 
        value: formatCurrency(saldo), 
        trend: saldo >= 0 ? "up" : "down",
        color: saldo >= 0 ? "text-emerald-400" : "text-red-400"
      });
      
      metricsArray.push({ 
        id: "receita", 
        icon: TrendingUp, 
        label: "Receita", 
        value: formatCurrency(receita), 
        trend: "up",
        color: "text-emerald-400"
      });
      
      metricsArray.push({ 
        id: "tarefas", 
        icon: CheckSquare, 
        label: "Tarefas Hoje", 
        value: `${tarefasConcluidas}/${tarefasTotal}`, 
        trend: tarefasPendentes === 0 ? "up" : "neutral",
        color: tarefasPendentes === 0 ? "text-emerald-400" : "text-amber-400"
      });
      
      metricsArray.push({ 
        id: "alunos", 
        icon: GraduationCap, 
        label: "Alunos", 
        value: totalAlunos, 
        trend: "up",
        color: "text-blue-400"
      });
      
      metricsArray.push({ 
        id: "online", 
        icon: Users, 
        label: "Online", 
        value: usuariosOnline, 
        trend: "up",
        color: "text-emerald-400"
      });
      
      if (alertasPendentes > 0) {
        metricsArray.push({
          id: "alertas",
          icon: AlertTriangle,
          label: "Alertas",
          value: alertasPendentes,
          trend: "down",
          color: "text-amber-400"
        });
      }

      return metricsArray;
    },
    {
      profile: 'dashboard',
      persistKey: 'realtime_metrics_bar_v1',
      staleTime: 120_000,
    }
  );

  // Atualizar relógio a cada segundo
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Rotação de métricas em mobile
  useEffect(() => {
    if (metrics && metrics.length > 1) {
      const interval = setInterval(() => {
        setActiveIndex((prev) => (prev + 1) % metrics.length);
      }, 4000);
      return () => clearInterval(interval);
    }
  }, [metrics?.length]);

  // Subscription para atualizações em tempo real com debounce 10s
  const metricsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const debouncedRefetch = useCallback(() => {
    if (metricsTimeoutRef.current) clearTimeout(metricsTimeoutRef.current);
    metricsTimeoutRef.current = setTimeout(() => {
      refetch();
    }, 10000);
  }, [refetch]);

  useEffect(() => {
    const channel = supabase
      .channel('realtime-metrics')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'entradas' }, debouncedRefetch)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'gastos' }, debouncedRefetch)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'calendar_tasks' }, debouncedRefetch)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'alunos' }, debouncedRefetch)
      .subscribe();

    return () => {
      if (metricsTimeoutRef.current) clearTimeout(metricsTimeoutRef.current);
      supabase.removeChannel(channel);
    };
  }, [debouncedRefetch]);

  const displayMetrics = metrics || [
    { id: "status", icon: Shield, label: "Sistema", value: "Conectando...", color: "text-muted-foreground" }
  ];

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border border-border/50 backdrop-blur-xl",
        "bg-gradient-to-r from-background/80 via-card/50 to-background/80",
        className
      )}
    >
      <div className="relative z-10 flex items-center justify-between gap-4 px-4 py-2.5">
        {/* Left: Live Indicator & Time */}
        <div className="flex items-center gap-3">
          {/* Live Badge */}
          <div
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1 rounded-full border",
              isConnected 
                ? "bg-emerald-500/10 border-emerald-500/30" 
                : "bg-red-500/10 border-red-500/30"
            )}
          >
            <div
              className={cn(
                "w-2 h-2 rounded-full",
                isConnected ? "bg-emerald-400" : "bg-red-400"
              )}
              style={{ boxShadow: isConnected ? "0 0 8px rgba(16, 185, 129, 0.8)" : "0 0 8px rgba(239, 68, 68, 0.8)" }}
            />
            <span className={cn(
              "text-xs font-semibold uppercase tracking-wider",
              isConnected ? "text-emerald-400" : "text-red-400"
            )}>
              {isConnected ? "Live" : "Offline"}
            </span>
          </div>

          {/* Connection Status */}
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-background/50 border border-border/50">
            <Wifi className={cn("h-3 w-3", latency < 300 ? "text-emerald-400" : "text-amber-400")} />
            <span className="text-xs font-mono text-muted-foreground">
              {latency}ms
            </span>
          </div>

          {/* Clock */}
          <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-background/50 border border-border/50">
            <Clock className="h-3 w-3 text-primary" />
            <span className="text-xs font-mono text-foreground font-medium">
              {formatTime(currentTime)}
            </span>
          </div>
        </div>

        {/* Center/Right: Real Metrics */}
        <div className="hidden md:flex items-center gap-4">
          {displayMetrics.slice(0, 6).map((metric) => {
            const MetricIcon = metric.icon;
            return (
              <div
                key={metric.id}
                className="flex items-center gap-2 group"
              >
                <div className={cn(
                  "p-1.5 rounded-lg bg-muted/50 group-hover:bg-primary/20 transition-colors",
                  metric.color || "text-primary"
                )}>
                  <MetricIcon className="h-3.5 w-3.5" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] text-muted-foreground leading-none">
                    {metric.label}
                  </span>
                  <div className="flex items-center gap-1">
                    <span className={cn(
                      "text-sm font-semibold leading-none",
                      metric.color || "text-foreground"
                    )}>
                      {metric.value}
                    </span>
                    {metric.trend === "up" && (
                      <TrendingUp className="h-3 w-3 text-emerald-400" />
                    )}
                    {metric.pulse && (
                      <div
                        className="w-1.5 h-1.5 rounded-full bg-emerald-400"
                      />
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Mobile: Single Metric Display */}
        <div className="md:hidden flex-1 mx-2">
          {displayMetrics[activeIndex] && (
            <div className="flex items-center justify-center gap-2">
              {(() => {
                const CurrentIcon = displayMetrics[activeIndex].icon;
                return (
                  <div className={cn(
                    "p-1.5 rounded-lg bg-muted/50",
                    displayMetrics[activeIndex].color || "text-primary"
                  )}>
                    <CurrentIcon className="h-3.5 w-3.5" />
                  </div>
                );
              })()}
              <span className="text-xs text-muted-foreground">
                {displayMetrics[activeIndex].label}:
              </span>
              <span className={cn(
                "text-sm font-semibold",
                displayMetrics[activeIndex].color || "text-foreground"
              )}>
                {displayMetrics[activeIndex].value}
              </span>
            </div>
          )}
        </div>

        {/* Right: Activity Indicator + Refresh */}
        <div className="flex items-center gap-2">
          {isLoading && (
            <RefreshCw className="h-3 w-3 text-muted-foreground animate-spin" />
          )}
          
          <div className="flex items-center gap-1">
            <Zap className="h-4 w-4 text-primary" />
            <div className="flex gap-0.5">
              {[6, 10, 14, 8].map((h, i) => (
                <div
                  key={`bar-${i}`}
                  className="w-1 bg-primary rounded-full"
                  style={{ height: `${h}px` }}
                />
              ))}
            </div>
          </div>
          
          {/* Status Dot */}
          <div className="hidden sm:flex items-center gap-1.5 px-2 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span className="text-[10px] font-medium text-emerald-400">Sincronizado</span>
          </div>
        </div>
      </div>
    </div>
  );
}
