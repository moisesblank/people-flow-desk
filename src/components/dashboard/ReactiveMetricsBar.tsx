// ============================================
// PLANILHA VIVA - BARRA DE MÉTRICAS REATIVAS
// Valores atualizados em tempo real
// ============================================

import { motion, AnimatePresence } from "framer-motion";
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  Users, 
  CheckSquare,
  RefreshCw,
  Wifi,
  WifiOff,
  Zap
} from "lucide-react";
import { useReactiveFinance, useReactiveSaldo, useReactiveContadores } from "@/contexts/ReactiveFinanceContext";
import { cn } from "@/lib/utils";

export function ReactiveMetricsBar() {
  const { isLoading, isConnected, forceRefresh, formatCurrency, metrics } = useReactiveFinance();
  const { saldoMes, isPositivo } = useReactiveSaldo();
  const contadores = useReactiveContadores();

  return (
    <motion.div 
      className="relative overflow-hidden rounded-xl border border-border/50 bg-gradient-to-r from-card/80 via-card to-card/80 backdrop-blur-sm"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* Indicador de conexão */}
      <div className="absolute top-2 right-2 flex items-center gap-1.5">
        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-1"
            >
              <RefreshCw className="h-3 w-3 text-primary animate-spin" />
              <span className="text-[10px] text-muted-foreground">Atualizando...</span>
            </motion.div>
          ) : isConnected ? (
            <motion.div
              key="connected"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-1"
            >
              <Zap className="h-3 w-3 text-green-500" />
              <span className="text-[10px] text-green-500">Tempo Real</span>
            </motion.div>
          ) : (
            <motion.div
              key="disconnected"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-1"
              onClick={forceRefresh}
            >
              <WifiOff className="h-3 w-3 text-yellow-500" />
              <span className="text-[10px] text-yellow-500 cursor-pointer hover:underline">Reconectar</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Grid de métricas */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-px bg-border/30">
        {/* Saldo do Mês */}
        <MetricItem
          label="Saldo Mês"
          value={formatCurrency(saldoMes)}
          icon={Wallet}
          trend={isPositivo ? "up" : "down"}
          color={isPositivo ? "green" : "red"}
          pulse={isLoading}
        />

        {/* Receitas */}
        <MetricItem
          label="Receitas"
          value={formatCurrency(metrics.receitaMes)}
          icon={TrendingUp}
          trend="up"
          color="green"
          pulse={isLoading}
        />

        {/* Despesas */}
        <MetricItem
          label="Despesas"
          value={formatCurrency(metrics.despesaMes)}
          icon={TrendingDown}
          trend="down"
          color="red"
          pulse={isLoading}
        />

        {/* Alunos */}
        <MetricItem
          label="Alunos"
          value={contadores.alunos.toString()}
          icon={Users}
          color="blue"
          pulse={isLoading}
        />

        {/* Tarefas */}
        <MetricItem
          label="Tarefas Hoje"
          value={`${contadores.tarefasPendentes}/${contadores.tarefasHoje}`}
          icon={CheckSquare}
          color="purple"
          pulse={isLoading}
        />

        {/* Vendas */}
        <MetricItem
          label="Vendas Mês"
          value={contadores.vendas.toString()}
          icon={Zap}
          color="gold"
          pulse={isLoading}
        />
      </div>

      {/* Última atualização */}
      <div className="px-3 py-1 bg-muted/30 text-center">
        <span className="text-[10px] text-muted-foreground">
          Última atualização: {metrics.lastUpdate.toLocaleTimeString('pt-BR')}
        </span>
      </div>
    </motion.div>
  );
}

// ===== COMPONENTE DE ITEM DE MÉTRICA =====
interface MetricItemProps {
  label: string;
  value: string;
  icon: any;
  trend?: "up" | "down";
  color: "green" | "red" | "blue" | "purple" | "gold";
  pulse?: boolean;
}

function MetricItem({ label, value, icon: Icon, trend, color, pulse }: MetricItemProps) {
  const colorClasses = {
    green: "text-[hsl(var(--stats-green))]",
    red: "text-destructive",
    blue: "text-[hsl(var(--stats-blue))]",
    purple: "text-[hsl(var(--stats-purple))]",
    gold: "text-[hsl(var(--stats-gold))]",
  };

  const bgClasses = {
    green: "bg-[hsl(var(--stats-green))]/10",
    red: "bg-destructive/10",
    blue: "bg-[hsl(var(--stats-blue))]/10",
    purple: "bg-[hsl(var(--stats-purple))]/10",
    gold: "bg-[hsl(var(--stats-gold))]/10",
  };

  return (
    <motion.div 
      className={cn(
        "relative p-3 bg-card hover:bg-muted/50 transition-colors",
        pulse && "animate-pulse"
      )}
      whileHover={{ scale: 1.02 }}
    >
      <div className="flex items-center gap-2">
        <div className={cn("p-1.5 rounded-lg", bgClasses[color])}>
          <Icon className={cn("h-3.5 w-3.5", colorClasses[color])} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] text-muted-foreground truncate">{label}</p>
          <div className="flex items-center gap-1">
            <AnimatePresence mode="wait">
              <motion.p 
                key={value}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className={cn("text-sm font-bold truncate", colorClasses[color])}
              >
                {value}
              </motion.p>
            </AnimatePresence>
            {trend && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className={cn(
                  "text-[10px]",
                  trend === "up" ? "text-[hsl(var(--stats-green))]" : "text-destructive"
                )}
              >
                {trend === "up" ? "↑" : "↓"}
              </motion.span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
