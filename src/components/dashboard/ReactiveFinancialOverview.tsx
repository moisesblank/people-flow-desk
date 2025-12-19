// ============================================
// PLANILHA VIVA - FINANCIAL OVERVIEW REATIVO
// Visão geral das finanças em tempo real
// ============================================

import { motion, AnimatePresence } from "framer-motion";
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  CreditCard,
  ArrowUpRight,
  ArrowDownRight,
  Zap,
  Eye,
  EyeOff
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useState } from "react";
import { 
  useReactiveFinance, 
  useReactiveSaldo, 
  useReactiveReceitas, 
  useReactiveDespesas 
} from "@/contexts/ReactiveFinanceContext";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

export function ReactiveFinancialOverview() {
  const navigate = useNavigate();
  const { isConnected, isLoading, formatCurrency, metrics } = useReactiveFinance();
  const { saldoMes, isPositivo } = useReactiveSaldo();
  const receitas = useReactiveReceitas();
  const despesas = useReactiveDespesas();
  const [hideValues, setHideValues] = useState(false);

  const budgetUsage = receitas.mes > 0 ? Math.round((despesas.mes / receitas.mes) * 100) : 0;

  const displayValue = (value: string) => hideValues ? "••••••" : value;

  return (
    <Card className="relative overflow-hidden">
      {/* Live indicator */}
      {isConnected && (
        <div className="absolute top-3 right-3 flex items-center gap-1">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
          </span>
          <span className="text-[10px] text-green-500 font-medium">LIVE</span>
        </div>
      )}

      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Wallet className="h-5 w-5 text-primary" />
            Finanças em Tempo Real
          </CardTitle>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8"
            onClick={() => setHideValues(!hideValues)}
          >
            {hideValues ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Saldo Principal */}
        <div className="p-4 rounded-xl bg-gradient-to-br from-primary/10 to-transparent border border-primary/20">
          <p className="text-sm text-muted-foreground mb-1">Saldo do Mês</p>
          <div className="flex items-center justify-between">
            <AnimatePresence mode="wait">
              <motion.p 
                key={`${saldoMes}-${hideValues}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={cn(
                  "text-2xl font-bold",
                  isPositivo ? "text-[hsl(var(--stats-green))]" : "text-destructive"
                )}
              >
                {displayValue(formatCurrency(saldoMes))}
              </motion.p>
            </AnimatePresence>
            <div className={cn(
              "flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium",
              isPositivo ? "bg-green-500/20 text-green-500" : "bg-red-500/20 text-red-500"
            )}>
              {isPositivo ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
              {isPositivo ? "Positivo" : "Negativo"}
            </div>
          </div>
        </div>

        {/* Receitas e Despesas */}
        <div className="grid grid-cols-2 gap-3">
          <motion.div 
            className="p-3 rounded-lg bg-[hsl(var(--stats-green))]/10 border border-[hsl(var(--stats-green))]/20 cursor-pointer hover:scale-[1.02] transition-transform"
            onClick={() => navigate('/entradas')}
            whileTap={{ scale: 0.98 }}
          >
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-4 w-4 text-[hsl(var(--stats-green))]" />
              <span className="text-xs text-muted-foreground">Receitas</span>
            </div>
            <AnimatePresence mode="wait">
              <motion.p 
                key={`receita-${receitas.mes}-${hideValues}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-lg font-bold text-[hsl(var(--stats-green))]"
              >
                {displayValue(receitas.mesFormatado)}
              </motion.p>
            </AnimatePresence>
          </motion.div>

          <motion.div 
            className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 cursor-pointer hover:scale-[1.02] transition-transform"
            onClick={() => navigate('/financas-empresa')}
            whileTap={{ scale: 0.98 }}
          >
            <div className="flex items-center gap-2 mb-1">
              <TrendingDown className="h-4 w-4 text-destructive" />
              <span className="text-xs text-muted-foreground">Despesas</span>
            </div>
            <AnimatePresence mode="wait">
              <motion.p 
                key={`despesa-${despesas.mes}-${hideValues}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-lg font-bold text-destructive"
              >
                {displayValue(despesas.mesFormatado)}
              </motion.p>
            </AnimatePresence>
          </motion.div>
        </div>

        {/* Uso do Orçamento */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Uso do Orçamento</span>
            <span className={cn(
              "font-medium",
              budgetUsage > 100 ? "text-destructive" : 
              budgetUsage > 80 ? "text-[hsl(var(--stats-gold))]" : 
              "text-[hsl(var(--stats-green))]"
            )}>
              {budgetUsage}%
            </span>
          </div>
          <Progress value={Math.min(budgetUsage, 100)} className="h-2" />
        </div>

        {/* Detalhes de Despesas */}
        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border/50">
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Pessoal</p>
            <p className="text-sm font-semibold">{displayValue(despesas.pessoalFormatado)}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Empresa</p>
            <p className="text-sm font-semibold">{displayValue(despesas.empresaFormatado)}</p>
          </div>
        </div>

        {/* Pagamentos Pendentes */}
        {metrics.pagamentosPendentes > 0 && (
          <motion.div 
            className="p-3 rounded-lg bg-[hsl(var(--stats-gold))]/10 border border-[hsl(var(--stats-gold))]/20 cursor-pointer"
            onClick={() => navigate('/pagamentos')}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-[hsl(var(--stats-gold))]" />
                <span className="text-sm">Pagamentos Pendentes</span>
              </div>
              <span className="text-sm font-bold text-[hsl(var(--stats-gold))]">
                {metrics.pagamentosPendentes}
              </span>
            </div>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}
