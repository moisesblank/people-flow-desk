// ============================================
// LIVE METRICS BAR v1.0
// Barra de métricas em tempo real
// Animações e atualizações automáticas
// ============================================

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Activity, 
  Users, 
  DollarSign, 
  TrendingUp, 
  Clock,
  Zap,
  Eye,
  MessageCircle
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
  { id: "visitors", icon: Eye, label: "Visitantes Hoje", value: 247, trend: "up", pulse: true },
  { id: "active", icon: Users, label: "Usuários Ativos", value: 12, trend: "up", color: "text-[hsl(var(--stats-green))]" },
  { id: "revenue", icon: DollarSign, label: "Receita Hoje", value: "R$ 2.450", trend: "up", color: "text-[hsl(var(--stats-green))]" },
  { id: "growth", icon: TrendingUp, label: "Crescimento", value: "+15%", trend: "up" },
  { id: "messages", icon: MessageCircle, label: "Mensagens", value: 34, trend: "neutral" },
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
  const [visibleMetrics, setVisibleMetrics] = useState<MetricItem[]>(metrics.slice(0, 4));
  const [activeIndex, setActiveIndex] = useState(0);

  // Atualizar relógio
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Rotação de métricas em mobile
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % metrics.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [metrics.length]);

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "relative overflow-hidden rounded-xl bg-gradient-to-r from-card via-card to-primary/5 border border-border/50 px-4 py-3",
        className
      )}
    >
      {/* Background Pulse Effect */}
      <motion.div
        className="absolute inset-0 bg-primary/5"
        animate={{ opacity: [0, 0.3, 0] }}
        transition={{ duration: 3, repeat: Infinity }}
      />

      <div className="relative z-10 flex items-center justify-between gap-4">
        {/* Live Indicator */}
        <div className="flex items-center gap-2">
          <motion.div
            className="relative flex items-center gap-1.5"
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <motion.div
              className="w-2 h-2 rounded-full bg-[hsl(var(--stats-green))]"
              animate={{ opacity: [1, 0.5, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
            />
            <span className="text-xs font-medium text-[hsl(var(--stats-green))] uppercase tracking-wider">
              Live
            </span>
          </motion.div>
          
          <div className="hidden sm:flex items-center gap-1.5 px-2 py-1 rounded-lg bg-muted/50">
            <Clock className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs font-mono text-foreground">
              {formatTime(currentTime)}
            </span>
          </div>
        </div>

        {/* Desktop: All Metrics */}
        <div className="hidden md:flex items-center gap-6">
          {visibleMetrics.map((metric, index) => (
            <motion.div
              key={metric.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center gap-2"
            >
              <div className={cn(
                "p-1.5 rounded-lg bg-muted/50",
                metric.color || "text-primary"
              )}>
                <metric.icon className="h-3.5 w-3.5" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] text-muted-foreground leading-tight">
                  {metric.label}
                </span>
                <div className="flex items-center gap-1">
                  <span className={cn(
                    "text-sm font-semibold",
                    metric.color || "text-foreground"
                  )}>
                    {metric.value}
                  </span>
                  {metric.trend === "up" && (
                    <TrendingUp className="h-3 w-3 text-[hsl(var(--stats-green))]" />
                  )}
                  {metric.pulse && (
                    <motion.div
                      className="w-1.5 h-1.5 rounded-full bg-[hsl(var(--stats-green))]"
                      animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    />
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Mobile: Single Rotating Metric */}
        <div className="md:hidden flex-1">
          <AnimatePresence mode="wait">
            <motion.div
              key={metrics[activeIndex].id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex items-center justify-center gap-2"
            >
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
              <div className="flex items-center gap-2">
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
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Activity Indicator */}
        <div className="flex items-center gap-1.5">
          <Zap className="h-4 w-4 text-primary" />
          <motion.div
            className="flex gap-0.5"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            {[1, 2, 3].map((i) => (
              <motion.div
                key={`bar-${i}`}
                className="w-1 bg-primary rounded-full"
                animate={{ height: [8, 16, 8] }}
                transition={{ 
                  duration: 0.8, 
                  repeat: Infinity, 
                  delay: i * 0.15 
                }}
              />
            ))}
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
