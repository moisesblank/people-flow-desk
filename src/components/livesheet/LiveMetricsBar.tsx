// ============================================
// PLANILHA VIVA v2.0 - BARRA DE MÉTRICAS LIVE
// Barra superior com todas as métricas reativas
// ============================================

import { memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  Users, 
  CheckSquare,
  ShoppingCart,
  Zap,
  Clock,
  RefreshCw
} from "lucide-react";
import { 
  useLiveSheet, 
  useLiveFinance, 
  useLiveCounters, 
  useLiveKPIs 
} from "@/contexts/LiveSheetContext";
import { LiveValue, LiveStatus } from "./LiveValue";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface LiveMetricsBarProps {
  className?: string;
}

export const LiveMetricsBar = memo(function LiveMetricsBar({ className }: LiveMetricsBarProps) {
  const { state, forceRecompute, isReactive, latency } = useLiveSheet();
  const finance = useLiveFinance();
  const counters = useLiveCounters();
  const kpis = useLiveKPIs();

  const metrics = [
    {
      id: 'saldo_mes',
      label: 'Saldo Mês',
      icon: Wallet,
      color: finance.isPositivo ? 'green' : 'red',
      format: 'currency' as const,
    },
    {
      id: 'receita_mes',
      label: 'Receitas',
      icon: TrendingUp,
      color: 'green',
      format: 'currency' as const,
    },
    {
      id: 'despesa_mes',
      label: 'Despesas',
      icon: TrendingDown,
      color: 'red',
      format: 'currency' as const,
    },
    {
      id: 'alunos_ativos',
      label: 'Alunos',
      icon: Users,
      color: 'blue',
      format: 'number' as const,
    },
    {
      id: 'tarefas_pendentes',
      label: 'Tarefas',
      icon: CheckSquare,
      color: 'purple',
      format: 'number' as const,
    },
    {
      id: 'vendas_mes',
      label: 'Vendas',
      icon: ShoppingCart,
      color: 'gold',
      format: 'number' as const,
    },
  ];

  const colorClasses: Record<string, { text: string; bg: string; icon: string }> = {
    green: {
      text: "text-[hsl(var(--stats-green))]",
      bg: "bg-[hsl(var(--stats-green))]/10",
      icon: "text-[hsl(var(--stats-green))]",
    },
    red: {
      text: "text-destructive",
      bg: "bg-destructive/10",
      icon: "text-destructive",
    },
    blue: {
      text: "text-[hsl(var(--stats-blue))]",
      bg: "bg-[hsl(var(--stats-blue))]/10",
      icon: "text-[hsl(var(--stats-blue))]",
    },
    purple: {
      text: "text-[hsl(var(--stats-purple))]",
      bg: "bg-[hsl(var(--stats-purple))]/10",
      icon: "text-[hsl(var(--stats-purple))]",
    },
    gold: {
      text: "text-[hsl(var(--stats-gold))]",
      bg: "bg-[hsl(var(--stats-gold))]/10",
      icon: "text-[hsl(var(--stats-gold))]",
    },
  };

  return (
    <motion.div 
      className={cn(
        "relative overflow-hidden rounded-xl border border-border/50 bg-gradient-to-r from-card/80 via-card to-card/80 backdrop-blur-sm",
        className
      )}
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* Header com status */}
      <div className="absolute top-2 right-2 flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={forceRecompute}
          disabled={state.pendingUpdates > 0}
        >
          <RefreshCw className={cn(
            "h-3 w-3",
            state.pendingUpdates > 0 && "animate-spin"
          )} />
        </Button>
        <LiveStatus />
      </div>

      {/* Grid de métricas */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-px bg-border/30">
        {metrics.map((metric) => {
          const colors = colorClasses[metric.color];
          const Icon = metric.icon;

          return (
            <motion.div 
              key={metric.id}
              className="relative p-3 bg-card hover:bg-muted/50 transition-colors"
              whileHover={{ scale: 1.02 }}
            >
              <div className="flex items-center gap-2">
                <div className={cn("p-1.5 rounded-lg", colors.bg)}>
                  <Icon className={cn("h-3.5 w-3.5", colors.icon)} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] text-muted-foreground truncate">{metric.label}</p>
                  <LiveValue 
                    dataKey={metric.id}
                    format={metric.format}
                    size="sm"
                    color={metric.color as any}
                    showTooltip
                  />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Footer com timestamp */}
      <div className="px-3 py-1.5 bg-muted/30 flex items-center justify-between text-[10px] text-muted-foreground">
        <div className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          <span>Última atualização: {state.lastUpdate.toLocaleTimeString('pt-BR')}</span>
        </div>
        <div className="flex items-center gap-2">
          <span>Computação: {latency.toFixed(1)}ms</span>
          {state.pendingUpdates > 0 && (
            <span className="text-primary">
              {state.pendingUpdates} atualizações pendentes
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
});

// ===== VERSÃO COMPACTA PARA MOBILE =====
export const LiveMetricsBarCompact = memo(function LiveMetricsBarCompact({ className }: LiveMetricsBarProps) {
  const finance = useLiveFinance();
  const counters = useLiveCounters();

  return (
    <div className={cn("flex items-center justify-between gap-2 p-2 rounded-lg bg-card border", className)}>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1">
          <Wallet className={cn(
            "h-4 w-4",
            finance.isPositivo ? "text-[hsl(var(--stats-green))]" : "text-destructive"
          )} />
          <LiveValue dataKey="saldo_mes" format="currency" size="sm" color="auto" />
        </div>
        <div className="flex items-center gap-1">
          <Users className="h-4 w-4 text-[hsl(var(--stats-blue))]" />
          <LiveValue dataKey="alunos_ativos" format="number" size="sm" />
        </div>
        <div className="flex items-center gap-1">
          <CheckSquare className="h-4 w-4 text-[hsl(var(--stats-purple))]" />
          <LiveValue dataKey="tarefas_pendentes" format="number" size="sm" />
        </div>
      </div>
      <LiveStatus />
    </div>
  );
});
