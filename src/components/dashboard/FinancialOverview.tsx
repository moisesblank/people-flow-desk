// ============================================
// FINANCIAL OVERVIEW - Resumo Financeiro Visual
// Visão clara da saúde financeira - CLICÁVEL
// ============================================

import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  ArrowUpRight,
  ArrowDownRight,
  AlertTriangle,
  CheckCircle2,
  ChevronRight
} from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface FinancialOverviewProps {
  income: number;
  expenses: number;
  personalExpenses: number;
  companyExpenses: number;
  pendingPayments: number;
}

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(cents / 100);
}

export function FinancialOverview({ 
  income, 
  expenses, 
  personalExpenses, 
  companyExpenses,
  pendingPayments 
}: FinancialOverviewProps) {
  const navigate = useNavigate();
  const profit = income - expenses;
  const profitMargin = income > 0 ? (profit / income) * 100 : 0;
  const expenseRatio = income > 0 ? (expenses / income) * 100 : 0;
  
  const isHealthy = profit > 0 && expenseRatio < 80;
  const isWarning = expenseRatio >= 80 && expenseRatio < 100;
  const isDanger = expenseRatio >= 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card rounded-2xl p-6"
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <Wallet className="h-5 w-5 text-primary" />
          Resumo Financeiro
        </h3>
        <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
          isHealthy ? "bg-[hsl(var(--stats-green))]/10 text-[hsl(var(--stats-green))]" :
          isWarning ? "bg-[hsl(var(--stats-gold))]/10 text-[hsl(var(--stats-gold))]" :
          "bg-destructive/10 text-destructive"
        }`}>
          {isHealthy && <CheckCircle2 className="h-4 w-4" />}
          {isWarning && <AlertTriangle className="h-4 w-4" />}
          {isDanger && <AlertTriangle className="h-4 w-4" />}
          {isHealthy ? "Saudável" : isWarning ? "Atenção" : "Crítico"}
        </div>
      </div>

      {/* Main Values - CLICÁVEIS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Income - Clicável */}
        <motion.button
          onClick={() => navigate("/entradas")}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="p-4 rounded-xl bg-[hsl(var(--stats-green))]/5 border border-[hsl(var(--stats-green))]/20 hover:border-[hsl(var(--stats-green))]/40 transition-all text-left group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Receitas</span>
            <ArrowUpRight className="h-4 w-4 text-[hsl(var(--stats-green))] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </div>
          <p className="text-2xl font-bold text-[hsl(var(--stats-green))]">
            {formatCurrency(income)}
          </p>
        </motion.button>

        {/* Expenses - Clicável */}
        <motion.button
          onClick={() => navigate("/financas-empresa")}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="p-4 rounded-xl bg-[hsl(var(--stats-purple))]/5 border border-[hsl(var(--stats-purple))]/20 hover:border-[hsl(var(--stats-purple))]/40 transition-all text-left group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Despesas</span>
            <ArrowDownRight className="h-4 w-4 text-[hsl(var(--stats-purple))] group-hover:translate-x-0.5 group-hover:translate-y-0.5 transition-transform" />
          </div>
          <p className="text-2xl font-bold text-[hsl(var(--stats-purple))]">
            {formatCurrency(expenses)}
          </p>
        </motion.button>

        {/* Profit - Clicável */}
        <motion.button
          onClick={() => navigate("/relatorios")}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className={`p-4 rounded-xl text-left group transition-all ${
            profit >= 0 
              ? "bg-[hsl(var(--stats-green))]/5 border border-[hsl(var(--stats-green))]/20 hover:border-[hsl(var(--stats-green))]/40" 
              : "bg-destructive/5 border border-destructive/20 hover:border-destructive/40"
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Lucro</span>
            {profit >= 0 
              ? <TrendingUp className="h-4 w-4 text-[hsl(var(--stats-green))] group-hover:-translate-y-0.5 transition-transform" /> 
              : <TrendingDown className="h-4 w-4 text-destructive group-hover:translate-y-0.5 transition-transform" />
            }
          </div>
          <p className={`text-2xl font-bold ${profit >= 0 ? "text-[hsl(var(--stats-green))]" : "text-destructive"}`}>
            {formatCurrency(profit)}
          </p>
        </motion.button>
      </div>

      {/* Progress Bar */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Uso do Orçamento</span>
          <span className={`font-medium ${
            expenseRatio < 80 ? "text-[hsl(var(--stats-green))]" :
            expenseRatio < 100 ? "text-[hsl(var(--stats-gold))]" :
            "text-destructive"
          }`}>
            {expenseRatio.toFixed(1)}%
          </span>
        </div>
        <Progress 
          value={Math.min(expenseRatio, 100)} 
          className="h-2"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>0%</span>
          <span className={expenseRatio >= 80 ? "text-[hsl(var(--stats-gold))]" : ""}>80% (limite ideal)</span>
          <span className={expenseRatio >= 100 ? "text-destructive" : ""}>100%</span>
        </div>
      </div>

      {/* Breakdown - CLICÁVEL */}
      <div className="mt-6 pt-6 border-t border-border/50">
        <h4 className="text-sm font-medium text-muted-foreground mb-3">Detalhamento</h4>
        <div className="grid grid-cols-2 gap-3">
          <motion.button
            onClick={() => navigate("/financas-pessoais")}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors text-left"
          >
            <span className="text-sm text-muted-foreground">Pessoal</span>
            <span className="text-sm font-medium text-foreground">{formatCurrency(personalExpenses)}</span>
          </motion.button>
          <motion.button
            onClick={() => navigate("/financas-empresa")}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors text-left"
          >
            <span className="text-sm text-muted-foreground">Empresa</span>
            <span className="text-sm font-medium text-foreground">{formatCurrency(companyExpenses)}</span>
          </motion.button>
          {pendingPayments > 0 && (
            <motion.button
              onClick={() => navigate("/pagamentos")}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="col-span-2 flex items-center justify-between p-3 rounded-lg bg-[hsl(var(--stats-gold))]/10 border border-[hsl(var(--stats-gold))]/20 hover:border-[hsl(var(--stats-gold))]/40 transition-all group"
            >
              <span className="text-sm text-[hsl(var(--stats-gold))]">Pagamentos Pendentes</span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-[hsl(var(--stats-gold))]">{pendingPayments}</span>
                <ChevronRight className="h-4 w-4 text-[hsl(var(--stats-gold))] opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </motion.button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
