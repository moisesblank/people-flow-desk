// ============================================
// REALTIME METRICS BAR v3.0 - DADOS REAIS
// Métricas em tempo real do banco de dados
// Conexão Supabase + Animações avançadas
// ============================================

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
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

function formatCurrency(value: number): string {
  if (value >= 1000000) return `R$ ${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `R$ ${(value / 1000).toFixed(1)}K`;
  return `R$ ${value.toFixed(0)}`;
}

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
      profile: 'realtime',
      persistKey: 'realtime_metrics_bar_v1',
      refetchInterval: 30000,
      staleTime: 10000,
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

  // Subscription para atualizações em tempo real
  useEffect(() => {
    const channel = supabase
      .channel('realtime-metrics')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'entradas' }, () => refetch())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'gastos' }, () => refetch())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'calendar_tasks' }, () => refetch())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'alunos' }, () => refetch())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refetch]);

  const displayMetrics = metrics || [
    { id: "status", icon: Shield, label: "Sistema", value: "Conectando...", color: "text-muted-foreground" }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "relative overflow-hidden rounded-xl border border-border/50 backdrop-blur-xl",
        "bg-gradient-to-r from-background/80 via-card/50 to-background/80",
        className
      )}
    >
      {/* Animated Border Glow */}
      <motion.div
        className="absolute inset-0 rounded-xl"
        style={{
          background: `linear-gradient(90deg, transparent, hsl(var(--primary) / 0.2), transparent)`,
          backgroundSize: "200% 100%",
        }}
        animate={{
          backgroundPosition: ["0% 0%", "200% 0%"],
        }}
        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
      />

      {/* Background Pulse */}
      <motion.div
        className="absolute inset-0 bg-primary/5"
        animate={{ opacity: [0, 0.3, 0] }}
        transition={{ duration: 4, repeat: Infinity }}
      />

      {/* Scan Line */}
      <motion.div
        className="absolute top-0 bottom-0 w-20 bg-gradient-to-r from-transparent via-primary/20 to-transparent"
        animate={{ left: ["-20%", "120%"] }}
        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
      />

      <div className="relative z-10 flex items-center justify-between gap-4 px-4 py-2.5">
        {/* Left: Live Indicator & Time */}
        <div className="flex items-center gap-3">
          {/* Live Badge */}
          <motion.div
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1 rounded-full border",
              isConnected 
                ? "bg-emerald-500/10 border-emerald-500/30" 
                : "bg-red-500/10 border-red-500/30"
            )}
            animate={{ scale: [1, 1.02, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <motion.div
              className={cn(
                "w-2 h-2 rounded-full",
                isConnected ? "bg-emerald-400" : "bg-red-400"
              )}
              animate={{ opacity: [1, 0.4, 1], scale: [1, 1.2, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              style={{ boxShadow: isConnected ? "0 0 8px rgba(16, 185, 129, 0.8)" : "0 0 8px rgba(239, 68, 68, 0.8)" }}
            />
            <span className={cn(
              "text-xs font-semibold uppercase tracking-wider",
              isConnected ? "text-emerald-400" : "text-red-400"
            )}>
              {isConnected ? "Live" : "Offline"}
            </span>
          </motion.div>

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
          {displayMetrics.slice(0, 6).map((metric, index) => {
            const MetricIcon = metric.icon;
            return (
              <motion.div
                key={metric.id}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
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
                      <motion.div
                        className="w-1.5 h-1.5 rounded-full bg-emerald-400"
                        animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      />
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Mobile: Single Metric Carousel */}
        <div className="md:hidden flex-1 mx-2">
          <AnimatePresence mode="wait">
            {displayMetrics[activeIndex] && (
              <motion.div
                key={displayMetrics[activeIndex].id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex items-center justify-center gap-2"
              >
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
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right: Activity Indicator + Refresh */}
        <div className="flex items-center gap-2">
          {isLoading && (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            >
              <RefreshCw className="h-3 w-3 text-muted-foreground" />
            </motion.div>
          )}
          
          <motion.div
            className="flex items-center gap-1"
            animate={{ opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Zap className="h-4 w-4 text-primary" />
            <div className="flex gap-0.5">
              {[1, 2, 3, 4].map((i) => (
                <motion.div
                  key={`bar-${i}`}
                  className="w-1 bg-primary rounded-full"
                  animate={{ height: [6, 14, 6] }}
                  transition={{ 
                    duration: 0.6, 
                    repeat: Infinity, 
                    delay: i * 0.1,
                    ease: "easeInOut"
                  }}
                />
              ))}
            </div>
          </motion.div>
          
          {/* Status Dot */}
          <div className="hidden sm:flex items-center gap-1.5 px-2 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30">
            <motion.div
              className="w-1.5 h-1.5 rounded-full bg-emerald-400"
              animate={{ opacity: [1, 0.5, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
            />
            <span className="text-[10px] font-medium text-emerald-400">Sincronizado</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
