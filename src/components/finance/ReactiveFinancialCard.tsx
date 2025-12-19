// ============================================
// PLANILHA VIVA - CARD FINANCEIRO REATIVO
// Valores 100% em tempo real
// ============================================

import { motion, AnimatePresence } from "framer-motion";
import { 
  Wallet, 
  TrendingUp, 
  TrendingDown, 
  PiggyBank,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Zap
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { 
  useReactiveFinance, 
  useReactiveSaldo, 
  useReactiveReceitas, 
  useReactiveDespesas,
  useReactiveKPIs 
} from "@/contexts/ReactiveFinanceContext";
import { cn } from "@/lib/utils";

interface ReactiveFinancialCardProps {
  showSavings?: boolean;
  showInvestments?: boolean;
  compact?: boolean;
}

export function ReactiveFinancialCard({ 
  showSavings = true, 
  showInvestments = true,
  compact = false 
}: ReactiveFinancialCardProps) {
  const { isConnected, isLoading, formatCurrency } = useReactiveFinance();
  const { saldoMes, isPositivo } = useReactiveSaldo();
  const receitas = useReactiveReceitas();
  const despesas = useReactiveDespesas();
  const kpis = useReactiveKPIs();

  const expenseRate = receitas.mes > 0 ? Math.round((despesas.mes / receitas.mes) * 100) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card rounded-2xl overflow-hidden"
    >
      {/* Header - Saldo Principal */}
      <div className="p-6 bg-gradient-to-br from-primary/10 to-transparent">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-primary/20 border border-primary/30">
              <Wallet className="h-6 w-6 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-sm text-muted-foreground">Saldo do Mês</p>
                {isConnected && (
                  <span className="flex items-center gap-1 text-[10px] text-green-500">
                    <Zap className="h-2.5 w-2.5" />
                    LIVE
                  </span>
                )}
              </div>
              <AnimatePresence mode="wait">
                <motion.p 
                  key={saldoMes}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.1 }}
                  className={cn(
                    "text-3xl font-bold transition-colors",
                    isPositivo ? "text-[hsl(var(--stats-green))]" : "text-destructive"
                  )}
                >
                  {formatCurrency(saldoMes)}
                </motion.p>
              </AnimatePresence>
            </div>
          </div>
          <div className="text-right">
            <div className={cn(
              "flex items-center gap-1 text-sm",
              isPositivo ? "text-[hsl(var(--stats-green))]" : "text-destructive"
            )}>
              {isPositivo ? (
                <ArrowUpRight className="h-4 w-4" />
              ) : (
                <ArrowDownRight className="h-4 w-4" />
              )}
              {isPositivo ? "Positivo" : "Negativo"}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Taxa de economia: {kpis.taxaEconomiaFormatada}
            </p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className={cn("p-6 grid gap-4", compact ? "grid-cols-2" : "grid-cols-2")}>
        {/* Receitas */}
        <ReactiveStatBox
          icon={TrendingUp}
          label="Receitas"
          value={receitas.mes}
          formattedValue={receitas.mesFormatado}
          color="green"
          isLoading={isLoading}
        />

        {/* Despesas */}
        <ReactiveStatBox
          icon={TrendingDown}
          label="Despesas"
          value={despesas.mes}
          formattedValue={despesas.mesFormatado}
          color="red"
          isLoading={isLoading}
        />

        {showSavings && (
          <ReactiveStatBox
            icon={PiggyBank}
            label="Pessoal"
            value={despesas.pessoal}
            formattedValue={despesas.pessoalFormatado}
            color="blue"
            isLoading={isLoading}
          />
        )}

        {showInvestments && (
          <ReactiveStatBox
            icon={BarChart3}
            label="Empresa"
            value={despesas.empresa}
            formattedValue={despesas.empresaFormatado}
            color="purple"
            isLoading={isLoading}
          />
        )}
      </div>

      {/* Budget Progress */}
      <div className="px-6 pb-6">
        <div className="p-4 rounded-xl bg-secondary/30">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-foreground">Uso do Orçamento</span>
            <AnimatePresence mode="wait">
              <motion.span 
                key={expenseRate}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={cn(
                  "text-sm font-bold",
                  expenseRate > 100 ? "text-destructive" : 
                  expenseRate > 80 ? "text-[hsl(var(--stats-gold))]" : 
                  "text-[hsl(var(--stats-green))]"
                )}
              >
                {expenseRate}%
              </motion.span>
            </AnimatePresence>
          </div>
          <Progress 
            value={Math.min(expenseRate, 100)} 
            className="h-2"
          />
          <div className="flex justify-between mt-2 text-xs text-muted-foreground">
            <span>R$ 0</span>
            <span>{receitas.mesFormatado}</span>
          </div>
        </div>
      </div>

      {/* Meta Progress */}
      <div className="px-6 pb-6">
        <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-foreground">Progresso da Meta</span>
            <span className="text-sm font-bold text-primary">
              {kpis.progressoMetaFormatado}
            </span>
          </div>
          <Progress 
            value={kpis.progressoMeta} 
            className="h-2"
          />
          <div className="flex justify-between mt-2 text-xs text-muted-foreground">
            <span>{receitas.mesFormatado}</span>
            <span>{kpis.metaMensalFormatada}</span>
          </div>
          {kpis.faltaParaMeta > 0 && (
            <p className="text-xs text-muted-foreground mt-2 text-center">
              Faltam {kpis.faltaParaMetaFormatada} para a meta
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ===== COMPONENTE DE STAT BOX REATIVO =====
interface ReactiveStatBoxProps {
  icon: any;
  label: string;
  value: number;
  formattedValue: string;
  color: "green" | "red" | "blue" | "purple";
  change?: number;
  isLoading?: boolean;
}

function ReactiveStatBox({ 
  icon: Icon, 
  label, 
  value, 
  formattedValue, 
  color, 
  change,
  isLoading 
}: ReactiveStatBoxProps) {
  const colorClasses = {
    green: {
      bg: "bg-[hsl(var(--stats-green))]/5",
      border: "border-[hsl(var(--stats-green))]/20",
      icon: "text-[hsl(var(--stats-green))]",
    },
    red: {
      bg: "bg-destructive/5",
      border: "border-destructive/20",
      icon: "text-destructive",
    },
    blue: {
      bg: "bg-[hsl(var(--stats-blue))]/5",
      border: "border-[hsl(var(--stats-blue))]/20",
      icon: "text-[hsl(var(--stats-blue))]",
    },
    purple: {
      bg: "bg-[hsl(var(--stats-purple))]/5",
      border: "border-[hsl(var(--stats-purple))]/20",
      icon: "text-[hsl(var(--stats-purple))]",
    },
  };

  const styles = colorClasses[color];

  return (
    <motion.div 
      className={cn(
        "p-4 rounded-xl border transition-all",
        styles.bg,
        styles.border,
        isLoading && "animate-pulse"
      )}
      whileHover={{ scale: 1.02 }}
    >
      <div className="flex items-center justify-between mb-2">
        <Icon className={cn("h-5 w-5", styles.icon)} />
        {change !== undefined && change !== 0 && (
          <span className={cn(
            "text-xs font-medium",
            change > 0 ? "text-[hsl(var(--stats-green))]" : "text-destructive"
          )}>
            {change > 0 ? "+" : ""}{change}%
          </span>
        )}
      </div>
      <AnimatePresence mode="wait">
        <motion.p 
          key={value}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -5 }}
          className="text-xl font-bold text-foreground"
        >
          {formattedValue}
        </motion.p>
      </AnimatePresence>
      <p className="text-xs text-muted-foreground">{label}</p>
    </motion.div>
  );
}
