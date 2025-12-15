// ============================================
// MOISÉS MEDEIROS v8.0 - Card de Resumo Financeiro
// Visão consolidada das finanças
// ============================================

import { motion } from "framer-motion";
import { 
  Wallet, 
  TrendingUp, 
  TrendingDown, 
  DollarSign,
  PiggyBank,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
  CircleDollarSign
} from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface FinancialSummaryCardProps {
  income: number;
  expenses: number;
  savings: number;
  investments: number;
  incomeChange?: number;
  expenseChange?: number;
  currency?: string;
}

export function FinancialSummaryCard({
  income,
  expenses,
  savings,
  investments,
  incomeChange = 0,
  expenseChange = 0,
  currency = "BRL"
}: FinancialSummaryCardProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency
    }).format(value / 100);
  };

  const balance = income - expenses;
  const savingsRate = income > 0 ? Math.round((savings / income) * 100) : 0;
  const expenseRate = income > 0 ? Math.round((expenses / income) * 100) : 0;

  const getBalanceColor = () => {
    if (balance > 0) return "stats-green";
    if (balance < 0) return "destructive";
    return "muted-foreground";
  };

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
              <p className="text-sm text-muted-foreground">Saldo do Mês</p>
              <p className={`text-3xl font-bold text-[hsl(var(--${getBalanceColor()}))]`}>
                {formatCurrency(balance)}
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className={`flex items-center gap-1 text-sm ${
              balance >= 0 ? "text-[hsl(var(--stats-green))]" : "text-destructive"
            }`}>
              {balance >= 0 ? (
                <ArrowUpRight className="h-4 w-4" />
              ) : (
                <ArrowDownRight className="h-4 w-4" />
              )}
              {balance >= 0 ? "Positivo" : "Negativo"}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Taxa de economia: {savingsRate}%
            </p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="p-6 grid grid-cols-2 gap-4">
        {/* Receitas */}
        <div className="p-4 rounded-xl bg-[hsl(var(--stats-green))]/5 border border-[hsl(var(--stats-green))]/20">
          <div className="flex items-center justify-between mb-2">
            <TrendingUp className="h-5 w-5 text-[hsl(var(--stats-green))]" />
            {incomeChange !== 0 && (
              <span className={`text-xs font-medium ${
                incomeChange > 0 ? "text-[hsl(var(--stats-green))]" : "text-destructive"
              }`}>
                {incomeChange > 0 ? "+" : ""}{incomeChange}%
              </span>
            )}
          </div>
          <p className="text-xl font-bold text-foreground">{formatCurrency(income)}</p>
          <p className="text-xs text-muted-foreground">Receitas</p>
        </div>

        {/* Despesas */}
        <div className="p-4 rounded-xl bg-destructive/5 border border-destructive/20">
          <div className="flex items-center justify-between mb-2">
            <TrendingDown className="h-5 w-5 text-destructive" />
            {expenseChange !== 0 && (
              <span className={`text-xs font-medium ${
                expenseChange < 0 ? "text-[hsl(var(--stats-green))]" : "text-destructive"
              }`}>
                {expenseChange > 0 ? "+" : ""}{expenseChange}%
              </span>
            )}
          </div>
          <p className="text-xl font-bold text-foreground">{formatCurrency(expenses)}</p>
          <p className="text-xs text-muted-foreground">Despesas</p>
        </div>

        {/* Poupança */}
        <div className="p-4 rounded-xl bg-[hsl(var(--stats-blue))]/5 border border-[hsl(var(--stats-blue))]/20">
          <div className="flex items-center justify-between mb-2">
            <PiggyBank className="h-5 w-5 text-[hsl(var(--stats-blue))]" />
          </div>
          <p className="text-xl font-bold text-foreground">{formatCurrency(savings)}</p>
          <p className="text-xs text-muted-foreground">Poupança</p>
        </div>

        {/* Investimentos */}
        <div className="p-4 rounded-xl bg-[hsl(var(--stats-purple))]/5 border border-[hsl(var(--stats-purple))]/20">
          <div className="flex items-center justify-between mb-2">
            <BarChart3 className="h-5 w-5 text-[hsl(var(--stats-purple))]" />
          </div>
          <p className="text-xl font-bold text-foreground">{formatCurrency(investments)}</p>
          <p className="text-xs text-muted-foreground">Investimentos</p>
        </div>
      </div>

      {/* Budget Progress */}
      <div className="px-6 pb-6">
        <div className="p-4 rounded-xl bg-secondary/30">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-foreground">Uso do Orçamento</span>
            <span className={`text-sm font-bold ${
              expenseRate > 100 ? "text-destructive" : 
              expenseRate > 80 ? "text-[hsl(var(--stats-gold))]" : 
              "text-[hsl(var(--stats-green))]"
            }`}>
              {expenseRate}%
            </span>
          </div>
          <Progress 
            value={Math.min(expenseRate, 100)} 
            className="h-2"
          />
          <div className="flex justify-between mt-2 text-xs text-muted-foreground">
            <span>R$ 0</span>
            <span>{formatCurrency(income)}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
