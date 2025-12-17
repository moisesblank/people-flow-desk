// ============================================
// LIVE METRICS BAR v2.0 - CYBERPUNK EDITION
// Barra de métricas em tempo real com neon
// Animações avançadas e visual futurista
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
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30"
            animate={{ scale: [1, 1.02, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <motion.div
              className="w-2 h-2 rounded-full bg-emerald-400"
              animate={{ opacity: [1, 0.4, 1], scale: [1, 1.2, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              style={{ boxShadow: "0 0 8px rgba(16, 185, 129, 0.8)" }}
            />
            <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
              Live
            </span>
          </motion.div>

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
          {metrics.slice(0, 5).map((metric, index) => (
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
                    <motion.div
                      className="w-1.5 h-1.5 rounded-full bg-emerald-400"
                      animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    />
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Mobile: Single Metric Carousel */}
        <div className="md:hidden flex-1 mx-2">
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
              <span className="text-xs text-muted-foreground">
                {metrics[activeIndex].label}:
              </span>
              <span className={cn(
                "text-sm font-semibold",
                metrics[activeIndex].color || "text-foreground"
              )}>
                {metrics[activeIndex].value}
              </span>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Right: Activity Indicator */}
        <div className="flex items-center gap-2">
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
            <span className="text-[10px] font-medium text-emerald-400">Operacional</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
