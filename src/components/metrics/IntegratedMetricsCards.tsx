// ============================================
// COMPONENTE: IntegratedMetricsCards
// Extraído de IntegratedMetricsDashboard.tsx (2013 linhas)
// Cards de métricas com animações
// ============================================

import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { useEffect } from "react";
import {
  Users,
  Eye,
  Activity,
  TrendingUp,
  TrendingDown,
  Radio,
  CheckCircle2,
  AlertCircle,
  XCircle,
  RefreshCw
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ResponsiveContainer, AreaChart, Area } from "recharts";

// ═══════════════════════════════════════════════════════════════
// ANIMATED COUNTER
// ═══════════════════════════════════════════════════════════════

interface AnimatedCounterProps {
  value: number;
  duration?: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
}

export function AnimatedCounter({ value, duration = 1.5, decimals = 0, prefix = "", suffix = "" }: AnimatedCounterProps) {
  const count = useMotionValue(0);
  const rounded = useTransform(count, (latest) => {
    if (decimals > 0) {
      return prefix + latest.toFixed(decimals) + suffix;
    }
    return prefix + Math.round(latest).toLocaleString("pt-BR") + suffix;
  });

  useEffect(() => {
    const controls = animate(count, value, { duration });
    return controls.stop;
  }, [value, duration, count]);

  return <motion.span>{rounded}</motion.span>;
}

// ═══════════════════════════════════════════════════════════════
// STATUS BADGE
// ═══════════════════════════════════════════════════════════════

interface StatusBadgeProps {
  status: "active" | "pending" | "error" | "syncing";
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const configs = {
    active: { color: "emerald", icon: CheckCircle2, label: "Ativo" },
    pending: { color: "yellow", icon: AlertCircle, label: "Pendente" },
    error: { color: "red", icon: XCircle, label: "Erro" },
    syncing: { color: "blue", icon: RefreshCw, label: "Sincronizando" }
  };

  const config = configs[status];
  const Icon = config.icon;

  return (
    <Badge 
      variant="outline" 
      className={`border-${config.color}-500/50 text-${config.color}-500 bg-${config.color}-500/10`}
    >
      <Icon className={`h-3 w-3 mr-1 ${status === "syncing" ? "animate-spin" : ""}`} />
      {config.label}
    </Badge>
  );
}

// ═══════════════════════════════════════════════════════════════
// CYBER METRIC CARD
// ═══════════════════════════════════════════════════════════════

interface CyberMetricCardProps {
  title: string;
  value: number;
  change?: number;
  icon: typeof Users;
  color: string;
  subtitle?: string;
  isLive?: boolean;
  delay?: number;
  trend?: "up" | "down" | "neutral";
  sparklineData?: number[];
}

export function CyberMetricCard({
  title,
  value,
  change,
  icon: Icon,
  color,
  subtitle,
  isLive = false,
  delay = 0,
  sparklineData
}: CyberMetricCardProps) {
  const isPositive = change !== undefined && change >= 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay, duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
      whileHover={{ y: -8, transition: { duration: 0.3 } }}
      className="relative group"
    >
      <Card className="overflow-hidden border-border/20 bg-gradient-to-br from-card/90 to-card/50 backdrop-blur-2xl hover:border-primary/40 transition-all duration-500 h-full">
        {/* Animated glow background */}
        <motion.div 
          className="absolute inset-0 opacity-0 group-hover:opacity-30 transition-all duration-700 pointer-events-none"
          style={{ 
            background: `radial-gradient(circle at 50% 50%, ${color}, transparent 70%)`,
          }}
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        />
        
        {/* Top gradient accent */}
        <div 
          className="h-1 w-full relative overflow-hidden"
          style={{ background: `linear-gradient(90deg, transparent 0%, ${color} 50%, transparent 100%)` }}
        >
          <motion.div
            className="absolute inset-0 bg-white/30"
            animate={{ x: ["-100%", "100%"] }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          />
        </div>

        <CardContent className="p-5 relative z-10">
          <div className="flex items-start justify-between">
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] font-medium">
                  {title}
                </span>
                {isLive && (
                  <motion.div
                    className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-500/20"
                    animate={{ opacity: [1, 0.5, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    <Radio className="h-2.5 w-2.5 text-emerald-500" />
                    <span className="text-[8px] text-emerald-500 font-bold tracking-wider">LIVE</span>
                  </motion.div>
                )}
              </div>
              
              <div className="text-3xl font-black text-foreground tracking-tight">
                <AnimatedCounter value={value} prefix={title.includes("Receita") || title.includes("Investimento") ? "R$ " : ""} />
              </div>
              
              {subtitle && (
                <p className="text-[11px] text-muted-foreground/80">{subtitle}</p>
              )}
              
              {change !== undefined && (
                <motion.div 
                  className={`flex items-center gap-1.5 text-xs font-semibold ${isPositive ? 'text-emerald-500' : 'text-red-500'}`}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: delay + 0.3 }}
                >
                  {isPositive ? (
                    <TrendingUp className="h-3.5 w-3.5" />
                  ) : (
                    <TrendingDown className="h-3.5 w-3.5" />
                  )}
                  <span>{isPositive ? '+' : ''}{change.toFixed(1)}%</span>
                  <span className="text-muted-foreground/60 font-normal">vs mês anterior</span>
                </motion.div>
              )}
            </div>
            
            <motion.div
              className="relative p-3 rounded-2xl"
              style={{ backgroundColor: `${color}15` }}
              whileHover={{ rotate: [0, -10, 10, 0], scale: 1.15 }}
              transition={{ duration: 0.4 }}
            >
              <Icon className="h-6 w-6" style={{ color }} />
              <motion.div
                className="absolute inset-0 rounded-2xl"
                style={{ backgroundColor: color }}
                animate={{ opacity: [0, 0.3, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </motion.div>
          </div>

          {/* Mini sparkline */}
          {sparklineData && sparklineData.length > 0 && (
            <div className="mt-3 h-8">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={sparklineData.map((v, i) => ({ v, i }))}>
                  <defs>
                    <linearGradient id={`gradient-${title}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={color} stopOpacity={0.4} />
                      <stop offset="100%" stopColor={color} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Area
                    type="monotone"
                    dataKey="v"
                    stroke={color}
                    strokeWidth={1.5}
                    fill={`url(#gradient-${title})`}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════
// PLATFORM CARD
// ═══════════════════════════════════════════════════════════════

interface PlatformCardProps {
  platform: string;
  icon: typeof Users;
  color: string;
  gradient: string;
  followers: number;
  engagement: number;
  extra?: { label: string; value: string | number; icon?: typeof Users }[];
  onSync: () => void;
  isSyncing: boolean;
  status: "active" | "pending" | "error";
  lastSync?: string;
  delay?: number;
}

export function PlatformCard({
  platform,
  icon: Icon,
  color,
  gradient,
  followers,
  engagement,
  extra,
  onSync,
  isSyncing,
  status,
  lastSync,
  delay = 0
}: PlatformCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -30, rotateY: -15 }}
      animate={{ opacity: 1, x: 0, rotateY: 0 }}
      transition={{ delay, duration: 0.7, ease: [0.23, 1, 0.32, 1] }}
      whileHover={{ scale: 1.02, y: -4 }}
      className="group perspective-1000"
    >
      <Card className="overflow-hidden border-border/20 bg-gradient-to-br from-card/95 to-card/60 backdrop-blur-2xl hover:border-primary/30 transition-all duration-500">
        <div className={`h-2 w-full bg-gradient-to-r ${gradient} relative overflow-hidden`}>
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
            animate={{ x: ["-100%", "100%"] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
          />
        </div>
        
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <motion.div
                className={`p-3 rounded-xl bg-gradient-to-br ${gradient} shadow-lg`}
                whileHover={{ scale: 1.1, rotate: 5 }}
                style={{ boxShadow: `0 8px 32px ${color}40` }}
              >
                <Icon className="h-6 w-6 text-white" />
              </motion.div>
              <div>
                <h3 className="font-bold text-foreground text-lg">{platform}</h3>
                <div className="flex items-center gap-2 mt-0.5">
                  {status === "active" ? (
                    <motion.div 
                      className="flex items-center gap-1"
                      animate={{ opacity: [1, 0.6, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      <span className="text-[10px] text-emerald-500 font-medium">Conectado</span>
                    </motion.div>
                  ) : (
                    <span className="text-[10px] text-muted-foreground">Aguardando sync</span>
                  )}
                </div>
              </div>
            </div>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={onSync}
              disabled={isSyncing}
              className="h-9 w-9 rounded-xl hover:bg-primary/10"
            >
              <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin text-primary' : ''}`} />
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <motion.div 
              className="p-4 rounded-xl bg-gradient-to-br from-secondary/60 to-secondary/30 border border-border/30"
              whileHover={{ scale: 1.02 }}
            >
              <div className="flex items-center gap-2 mb-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Seguidores</span>
              </div>
              <p className="text-2xl font-black" style={{ color }}>
                <AnimatedCounter value={followers} />
              </p>
            </motion.div>
            
            <motion.div 
              className="p-4 rounded-xl bg-gradient-to-br from-secondary/60 to-secondary/30 border border-border/30"
              whileHover={{ scale: 1.02 }}
            >
              <div className="flex items-center gap-2 mb-2">
                <Activity className="h-4 w-4 text-muted-foreground" />
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Engajamento</span>
              </div>
              <p className="text-2xl font-black text-foreground">
                <AnimatedCounter value={engagement} decimals={1} suffix="%" />
              </p>
            </motion.div>
          </div>

          {extra && extra.length > 0 && (
            <div className="space-y-2">
              {extra.map((item, i) => (
                <motion.div 
                  key={i} 
                  className="flex items-center justify-between py-2 px-3 rounded-lg bg-secondary/20 hover:bg-secondary/40 transition-colors"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: delay + 0.1 * i }}
                >
                  <div className="flex items-center gap-2">
                    {item.icon && <item.icon className="h-3.5 w-3.5 text-muted-foreground" />}
                    <span className="text-xs text-muted-foreground">{item.label}</span>
                  </div>
                  <span className="font-semibold text-foreground text-sm">{item.value}</span>
                </motion.div>
              ))}
            </div>
          )}

          {lastSync && (
            <div className="mt-4 pt-3 border-t border-border/30 flex items-center justify-between">
              <span className="text-[10px] text-muted-foreground">Última sincronização</span>
              <span className="text-[10px] text-muted-foreground font-mono">
                {new Date(lastSync).toLocaleString("pt-BR", { 
                  hour: "2-digit", 
                  minute: "2-digit",
                  day: "2-digit",
                  month: "short"
                })}
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
