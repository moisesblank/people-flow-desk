// ============================================
// COMPONENTE: FinanceStatCards
// Extraído de FinancasEmpresa.tsx
// Cards de estatísticas financeiras
// ============================================

import { motion } from "framer-motion";
import { 
  Wallet, DollarSign, TrendingUp, TrendingDown, 
  Check, Clock, AlertCircle, CircleDollarSign 
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import type { UnifiedStats } from "@/hooks/useFinancasEmpresa";

interface FinanceStatCardsProps {
  stats: UnifiedStats;
  formatCurrency: (value: number) => string;
}

export function FinanceStatCards({ stats, formatCurrency }: FinanceStatCardsProps) {
  const statCards = [
    {
      label: "Total Receitas",
      value: stats.receitas,
      icon: TrendingUp,
      color: "text-emerald-500",
      bgColor: "bg-emerald-500/10",
      borderColor: "border-emerald-500/30",
    },
    {
      label: "Total Gastos",
      value: stats.totalGastos,
      icon: TrendingDown,
      color: "text-red-500",
      bgColor: "bg-red-500/10",
      borderColor: "border-red-500/30",
    },
    {
      label: "Saldo",
      value: stats.saldo,
      icon: Wallet,
      color: stats.saldo >= 0 ? "text-emerald-500" : "text-red-500",
      bgColor: stats.saldo >= 0 ? "bg-emerald-500/10" : "bg-red-500/10",
      borderColor: stats.saldo >= 0 ? "border-emerald-500/30" : "border-red-500/30",
    },
    {
      label: "Pendente",
      value: stats.totalPendente,
      icon: Clock,
      color: "text-yellow-500",
      bgColor: "bg-yellow-500/10",
      borderColor: "border-yellow-500/30",
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {statCards.map((stat, i) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
        >
          <Card className={cn("border", stat.borderColor, stat.bgColor)}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">
                    {stat.label}
                  </p>
                  <p className={cn("text-2xl font-bold mt-1", stat.color)}>
                    {formatCurrency(stat.value)}
                  </p>
                </div>
                <div className={cn("p-3 rounded-xl", stat.bgColor)}>
                  <stat.icon className={cn("h-6 w-6", stat.color)} />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}

// Cards de contagem menores
export function FinanceCountCards({ stats }: { stats: UnifiedStats }) {
  const countCards = [
    { label: "Gastos Fixos", count: stats.countGastosFixos, icon: CircleDollarSign, color: "text-blue-500" },
    { label: "Gastos Extras", count: stats.countGastosExtras, icon: DollarSign, color: "text-purple-500" },
    { label: "Pagamentos", count: stats.countPagamentos, icon: Wallet, color: "text-orange-500" },
    { label: "Pagos", count: stats.countPago, icon: Check, color: "text-emerald-500" },
    { label: "Pendentes", count: stats.countPendente, icon: Clock, color: "text-yellow-500" },
    { label: "Atrasados", count: stats.countAtrasado, icon: AlertCircle, color: "text-red-500" },
  ];

  return (
    <div className="grid gap-2 grid-cols-3 lg:grid-cols-6">
      {countCards.map((card) => (
        <Card key={card.label} className="border-border/50">
          <CardContent className="p-3 text-center">
            <card.icon className={cn("h-4 w-4 mx-auto mb-1", card.color)} />
            <p className="text-lg font-bold">{card.count}</p>
            <p className="text-[10px] text-muted-foreground uppercase">{card.label}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// Barra de progresso de pagamento
export function PaymentProgressBar({ percentPago }: { percentPago: number }) {
  return (
    <Card className="border-border/50">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">Progresso de Pagamentos</span>
          <span className="text-sm text-muted-foreground">{percentPago.toFixed(1)}%</span>
        </div>
        <Progress value={percentPago} className="h-2" />
        <div className="flex justify-between mt-2 text-xs text-muted-foreground">
          <span>0%</span>
          <span>100% Quitado</span>
        </div>
      </CardContent>
    </Card>
  );
}
