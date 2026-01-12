// ============================================
// LIVE METRICS BAR v2.1 - OPTIMIZED
// Barra de métricas - SEM ANIMAÇÕES PESADAS
// Visual futurista com performance otimizada
// ============================================

import { useState, useEffect } from "react";
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
  Cpu
} from "lucide-react";
import { cn } from "@/lib/utils";

interface MetricItem {
  id: string;
  icon: typeof Activity;
  label: string;
  value: string | number;
  trend?: "up" | "down" | "neutral";
  color?: string;
  pulse?: boolean;
}

interface LiveMetricsBarProps {
  metrics?: MetricItem[];
  className?: string;
}

const defaultMetrics: MetricItem[] = [
  { id: "status", icon: Shield, label: "Sistema", value: "Operacional", color: "text-emerald-400", pulse: true },
  { id: "visitors", icon: Eye, label: "Visitantes", value: 247, trend: "up" },
  { id: "active", icon: Users, label: "Ativos", value: 12, trend: "up", color: "text-emerald-400" },
  { id: "messages", icon: MessageCircle, label: "Mensagens", value: 34, trend: "neutral" },
  { id: "cpu", icon: Cpu, label: "Performance", value: "98%", color: "text-emerald-400" },
];

function formatTime(date: Date): string {
  return date.toLocaleTimeString("pt-BR", { 
    hour: "2-digit", 
    minute: "2-digit", 
    second: "2-digit" 
  });
}

export function LiveMetricsBar({ metrics = defaultMetrics, className }: LiveMetricsBarProps) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [activeIndex, setActiveIndex] = useState(0);
  const [latency, setLatency] = useState(238);

  // Atualizar relógio
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
      setLatency(Math.floor(Math.random() * 100) + 180);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Rotação de métricas em mobile
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % metrics.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [metrics.length]);

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
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30">
            <div
              className="w-2 h-2 rounded-full bg-emerald-400"
              style={{ boxShadow: "0 0 8px rgba(16, 185, 129, 0.8)" }}
            />
            <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
              Live
            </span>
          </div>

          {/* Connection Status */}
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-background/50 border border-border/50">
            <Wifi className="h-3 w-3 text-emerald-400" />
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

        {/* Center/Right: Metrics */}
        <div className="hidden md:flex items-center gap-4">
          {metrics.slice(0, 5).map((metric) => (
            <div
              key={metric.id}
              className="flex items-center gap-2 group"
            >
              <div className={cn(
                "p-1.5 rounded-lg bg-muted/50 group-hover:bg-primary/20 transition-colors",
                metric.color || "text-primary"
              )}>
                <metric.icon className="h-3.5 w-3.5" />
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
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Mobile: Single Metric Display */}
        <div className="md:hidden flex-1 mx-2">
          <div className="flex items-center justify-center gap-2">
            {(() => {
              const CurrentIcon = metrics[activeIndex].icon;
              return (
                <div className={cn(
                  "p-1.5 rounded-lg bg-muted/50",
                  metrics[activeIndex].color || "text-primary"
                )}>
                  <CurrentIcon className="h-3.5 w-3.5" />
                </div>
              );
            })()}
            <span className="text-xs text-muted-foreground">
              {metrics[activeIndex].label}:
            </span>
            <span className={cn(
              "text-sm font-semibold",
              metrics[activeIndex].color || "text-foreground"
            )}>
              {metrics[activeIndex].value}
            </span>
          </div>
        </div>

        {/* Right: Activity Indicator */}
        <div className="flex items-center gap-2">
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
            <span className="text-[10px] font-medium text-emerald-400">Operacional</span>
          </div>
        </div>
      </div>
    </div>
  );
}
