import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuantumReactivity } from "@/hooks/useQuantumReactivity";
import { 
  Brain, 
  Cpu, 
  Database, 
  Cloud,
  Shield,
  Activity,
  Layers,
  Network,
  Server,
  Terminal
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { ForceRefreshButton } from "@/components/admin/ForceRefreshButton";

interface SystemMetric {
  name: string;
  value: number;
  max: number;
  unit: string;
  status: "healthy" | "warning" | "critical";
  icon: any;
}

export function CommandCenter() {
  const [isExpanded, setIsExpanded] = useState(false);
  const { gpuAnimationProps, shouldAnimate } = useQuantumReactivity();

  const systemMetrics: SystemMetric[] = [
    { name: "Banco de Dados", value: 19, max: 50, unit: "tabelas", status: "healthy", icon: Database },
    { name: "Módulos Ativos", value: 17, max: 20, unit: "módulos", status: "healthy", icon: Layers },
    { name: "Integrações", value: 6, max: 10, unit: "conexões", status: "healthy", icon: Network },
    { name: "Segurança RLS", value: 100, max: 100, unit: "%", status: "healthy", icon: Shield },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "healthy": return "text-[hsl(var(--stats-green))]";
      case "warning": return "text-[hsl(var(--stats-gold))]";
      case "critical": return "text-destructive";
      default: return "text-muted-foreground";
    }
  };

  const getProgressColor = (status: string) => {
    switch (status) {
      case "healthy": return "bg-[hsl(var(--stats-green))]";
      case "warning": return "bg-[hsl(var(--stats-gold))]";
      case "critical": return "bg-destructive";
      default: return "bg-muted";
    }
  };

  return (
    <motion.div
      {...gpuAnimationProps.fadeUp}
      className="glass-card rounded-2xl p-6 relative overflow-hidden will-change-transform transform-gpu"
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5 pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(30deg,transparent_49.5%,hsl(var(--primary))_49.5%,hsl(var(--primary))_50.5%,transparent_50.5%)] bg-[length:8px_8px]" />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-6 relative">
        <div className="flex items-center gap-3">
          <motion.div 
            className="p-3 rounded-xl bg-gradient-to-br from-primary to-primary/50"
            animate={{ 
              boxShadow: [
                "0 0 20px hsl(var(--primary) / 0.3)",
                "0 0 40px hsl(var(--primary) / 0.5)",
                "0 0 20px hsl(var(--primary) / 0.3)"
              ]
            }}
            transition={{ repeat: Infinity, duration: 2 }}
          >
            <Brain className="h-6 w-6 text-primary-foreground" />
          </motion.div>
          <div>
            <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
              Moisés Medeiros
              <span className="text-xs font-normal px-2 py-0.5 rounded-full bg-[hsl(var(--stats-green))]/20 text-[hsl(var(--stats-green))]">
                v5.0
              </span>
            </h3>
            <p className="text-xs text-muted-foreground">Curso de Química</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <motion.div
            className="flex items-center gap-2"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
          >
            <Activity className="h-4 w-4 text-[hsl(var(--stats-green))]" />
            <span className="text-xs text-[hsl(var(--stats-green))]">ONLINE</span>
          </motion.div>
          
          {/* 🔄 FORCE REFRESH: Atualizar todos os alunos */}
          <ForceRefreshButton 
            variant="ghost" 
            size="sm" 
            showLabel={false}
          />
        </div>
      </div>

      {/* System Metrics Grid */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        {systemMetrics.map((metric, index) => (
          <motion.div
            key={metric.name}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
            className="p-4 rounded-xl bg-secondary/30 border border-border/50"
          >
            <div className="flex items-center gap-2 mb-3">
              <metric.icon className={`h-4 w-4 ${getStatusColor(metric.status)}`} />
              <span className="text-xs text-muted-foreground">{metric.name}</span>
            </div>
            <div className="flex items-end justify-between mb-2">
              <span className="text-2xl font-bold text-foreground">{metric.value}</span>
              <span className="text-xs text-muted-foreground">/ {metric.max} {metric.unit}</span>
            </div>
            <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
              <motion.div
                className={`h-full rounded-full ${getProgressColor(metric.status)}`}
                initial={{ width: 0 }}
                animate={{ width: `${(metric.value / metric.max) * 100}%` }}
                transition={{ delay: 0.5 + index * 0.1, duration: 0.8 }}
              />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Architecture Overview */}
      <motion.div
        className="p-4 rounded-xl bg-gradient-to-r from-secondary/50 to-secondary/20 border border-border/50"
        whileHover={{ scale: 1.01 }}
      >
        <div className="flex items-center gap-3 mb-3">
          <Terminal className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium text-foreground">Arquitetura do Sistema</span>
        </div>
        
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="p-3 rounded-lg bg-background/50">
            <Cloud className="h-6 w-6 mx-auto mb-2 text-[hsl(var(--stats-blue))]" />
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Frontend</p>
            <p className="text-xs font-medium text-foreground">React + Vite</p>
          </div>
          
          <div className="p-3 rounded-lg bg-background/50">
            <Server className="h-6 w-6 mx-auto mb-2 text-[hsl(var(--stats-purple))]" />
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Backend</p>
            <p className="text-xs font-medium text-foreground">Edge Functions</p>
          </div>
          
          <div className="p-3 rounded-lg bg-background/50">
            <Cpu className="h-6 w-6 mx-auto mb-2 text-[hsl(var(--stats-green))]" />
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Database</p>
            <p className="text-xs font-medium text-foreground">PostgreSQL</p>
          </div>
        </div>
      </motion.div>

      {/* Companies */}
      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="p-3 rounded-lg bg-secondary/30 border border-border/30">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">CNPJ 1</p>
          <p className="text-xs font-medium text-foreground">MM CURSO DE QUÍMICA LTDA</p>
          <p className="text-[10px] text-muted-foreground">53.829.761/0001-17</p>
        </div>
        <div className="p-3 rounded-lg bg-secondary/30 border border-border/30">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">CNPJ 2</p>
          <p className="text-xs font-medium text-foreground">CURSO QUÍMICA MOISES MEDEIROS</p>
          <p className="text-[10px] text-muted-foreground">44.979.308/0001-04</p>
        </div>
      </div>
    </motion.div>
  );
}
