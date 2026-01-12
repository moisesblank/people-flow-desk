// ============================================
// SYSTEM PULSE WIDGET v1.1 - OPTIMIZED
// Monitoramento em tempo real - SEM motion.div
// Visual cyberpunk com performance otimizada
// ============================================

import { useState, useEffect, useMemo } from "react";
import {
  Activity,
  Cpu,
  Database,
  Globe,
  Lock,
  Server,
  Shield,
  Wifi,
  Zap,
  Eye,
  Users,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Radio
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SystemMetric {
  id: string;
  label: string;
  value: number;
  maxValue: number;
  unit: string;
  status: "optimal" | "warning" | "critical";
  icon: typeof Activity;
}

interface SystemPulseWidgetProps {
  className?: string;
}

// Static Wave Background - CSS only
function WaveBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div 
        className="absolute inset-0 opacity-10"
        style={{
          background: `linear-gradient(180deg, hsl(var(--primary) / 0.1) 0%, transparent 50%, hsl(var(--primary) / 0.05) 100%)`,
        }}
      />
    </div>
  );
}

// Static Ring Meter - CSS-based progress
function RingMeter({ value, maxValue, status, size = 60 }: { value: number; maxValue: number; status: string; size?: number }) {
  const percentage = (value / maxValue) * 100;
  const circumference = 2 * Math.PI * 20;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;
  
  const statusColors = {
    optimal: "stroke-emerald-500",
    warning: "stroke-amber-500",
    critical: "stroke-red-500",
  };

  return (
    <svg width={size} height={size} viewBox="0 0 50 50" className="transform -rotate-90">
      <circle
        cx="25"
        cy="25"
        r="20"
        fill="none"
        stroke="hsl(var(--border))"
        strokeWidth="3"
      />
      <circle
        cx="25"
        cy="25"
        r="20"
        fill="none"
        className={cn(statusColors[status as keyof typeof statusColors], "transition-all duration-500")}
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={strokeDashoffset}
        style={{
          filter: `drop-shadow(0 0 6px ${status === 'optimal' ? 'rgba(16,185,129,0.5)' : status === 'warning' ? 'rgba(245,158,11,0.5)' : 'rgba(239,68,68,0.5)'})`,
        }}
      />
    </svg>
  );
}

// Static Pulse Indicator
function PulseIndicator({ active }: { active: boolean }) {
  return (
    <div className="relative">
      <div
        className={cn(
          "w-3 h-3 rounded-full",
          active ? "bg-emerald-500" : "bg-red-500"
        )}
      />
    </div>
  );
}

export function SystemPulseWidget({ className }: SystemPulseWidgetProps) {
  const [metrics, setMetrics] = useState<SystemMetric[]>([
    { id: "cpu", label: "CPU", value: 45, maxValue: 100, unit: "%", status: "optimal", icon: Cpu },
    { id: "memory", label: "Memória", value: 67, maxValue: 100, unit: "%", status: "optimal", icon: Server },
    { id: "network", label: "Rede", value: 89, maxValue: 100, unit: "ms", status: "optimal", icon: Wifi },
    { id: "security", label: "Segurança", value: 100, maxValue: 100, unit: "%", status: "optimal", icon: Shield },
  ]);
  
  const [activeConnections, setActiveConnections] = useState(42);
  const [requestsPerSecond, setRequestsPerSecond] = useState(127);
  const [uptime, setUptime] = useState("99.97%");
  const [currentTime, setCurrentTime] = useState(new Date());

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(prev => prev.map(metric => {
        const variance = Math.random() * 10 - 5;
        const newValue = Math.max(10, Math.min(metric.maxValue, metric.value + variance));
        const newStatus = newValue > 90 ? "critical" : newValue > 70 ? "warning" : "optimal";
        return { ...metric, value: Math.round(newValue), status: metric.id === "security" ? "optimal" : newStatus };
      }));
      
      setActiveConnections(prev => Math.max(20, Math.min(100, prev + Math.floor(Math.random() * 10 - 5))));
      setRequestsPerSecond(prev => Math.max(50, Math.min(300, prev + Math.floor(Math.random() * 30 - 15))));
      setCurrentTime(new Date());
    }, 2000);
    
    return () => clearInterval(interval);
  }, []);

  const overallStatus = useMemo(() => {
    const hasWarning = metrics.some(m => m.status === "warning");
    const hasCritical = metrics.some(m => m.status === "critical");
    if (hasCritical) return "critical";
    if (hasWarning) return "warning";
    return "optimal";
  }, [metrics]);

  const statusConfig = {
    optimal: { color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/30", label: "Todos os Sistemas Operacionais" },
    warning: { color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/30", label: "Atenção Recomendada" },
    critical: { color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/30", label: "Ação Necessária" },
  };

  const config = statusConfig[overallStatus];

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-border/50 backdrop-blur-xl bg-card/50",
        className
      )}
    >
      <WaveBackground />
      
      <div className="relative z-10 p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/20">
              <Activity className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">System Pulse</h3>
              <p className="text-xs text-muted-foreground">Monitoramento em tempo real</p>
            </div>
          </div>
          
          <div className={cn("flex items-center gap-2 px-3 py-1.5 rounded-full", config.bg, config.border, "border")}>
            <PulseIndicator active={overallStatus === "optimal"} />
            <span className={cn("text-xs font-medium", config.color)}>{config.label}</span>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {metrics.map((metric) => (
            <div
              key={metric.id}
              className="relative flex flex-col items-center p-4 rounded-xl bg-background/50 border border-border/30 group hover:border-primary/30 transition-all"
            >
              <div className="relative">
                <RingMeter value={metric.value} maxValue={metric.maxValue} status={metric.status} />
                <div className="absolute inset-0 flex items-center justify-center">
                  <metric.icon className={cn(
                    "h-5 w-5",
                    metric.status === "optimal" ? "text-emerald-400" :
                    metric.status === "warning" ? "text-amber-400" : "text-red-400"
                  )} />
                </div>
              </div>
              <span className="mt-2 text-xs text-muted-foreground">{metric.label}</span>
              <span className={cn(
                "text-lg font-bold font-mono",
                metric.status === "optimal" ? "text-emerald-400" :
                metric.status === "warning" ? "text-amber-400" : "text-red-400"
              )}>
                {metric.value}{metric.unit}
              </span>
            </div>
          ))}
        </div>

        {/* Live Stats */}
        <div className="grid grid-cols-3 gap-4 p-4 rounded-xl bg-background/30 border border-border/20">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10">
              <Users className="h-4 w-4 text-blue-400" />
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Conexões</p>
              <p className="text-lg font-bold text-blue-400 font-mono">
                {activeConnections}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-500/10">
              <Zap className="h-4 w-4 text-purple-400" />
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Req/s</p>
              <p className="text-lg font-bold text-purple-400 font-mono">
                {requestsPerSecond}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10">
              <TrendingUp className="h-4 w-4 text-emerald-400" />
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Uptime</p>
              <p className="text-lg font-bold text-emerald-400 font-mono">{uptime}</p>
            </div>
          </div>
        </div>

        {/* Footer with timestamp */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-border/20">
          <div className="flex items-center gap-2">
            <Radio className="h-3 w-3 text-emerald-400" />
            <span className="text-[10px] text-muted-foreground">Dados atualizados em tempo real</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span className="font-mono">
              {currentTime.toLocaleTimeString("pt-BR")}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
