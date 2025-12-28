// ============================================
// FINANCE STATS - Componente extraído de FinancasEmpresa
// Cards de estatísticas unificadas
// ============================================

import { motion } from "framer-motion";
import { 
  TrendingUp, TrendingDown, Wallet, CreditCard, 
  CheckCircle2, Clock, AlertTriangle, DollarSign,
  Building2, Receipt, Landmark, Users
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/utils/format";

export interface FinanceStatsData {
  gastosFixos: number;
  gastosExtras: number;
  totalGastos: number;
  receitas: number;
  pagamentosTotal: number;
  pagamentosPagos: number;
  pagamentosPendentes: number;
  pagamentosAtrasados: number;
  totalPago: number;
  totalPendente: number;
  totalAtrasado: number;
  totalGeral: number;
  percentPago: number;
  saldo: number;
  countGastosFixos: number;
  countGastosExtras: number;
  countPagamentos: number;
  countReceitas: number;
  countPago: number;
  countPendente: number;
  countAtrasado: number;
}

interface FinanceStatsProps {
  stats: FinanceStatsData;
  dadosComplementares?: {
    funcionarios: number;
    alunos: number;
  };
  className?: string;
}

export function FinanceStats({ stats, dadosComplementares, className }: FinanceStatsProps) {
  const statCards = [
    {
      title: "Total de Gastos",
      value: formatCurrency(stats.totalGastos),
      subtitle: `${stats.countGastosFixos + stats.countGastosExtras} itens`,
      icon: Wallet,
      color: "text-red-500",
      bgColor: "bg-red-500/10",
      borderColor: "border-red-500/20",
    },
    {
      title: "Receitas",
      value: formatCurrency(stats.receitas),
      subtitle: `${stats.countReceitas} entradas`,
      icon: TrendingUp,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
      borderColor: "border-green-500/20",
    },
    {
      title: "Saldo",
      value: formatCurrency(stats.saldo),
      subtitle: stats.saldo >= 0 ? "Positivo" : "Negativo",
      icon: stats.saldo >= 0 ? TrendingUp : TrendingDown,
      color: stats.saldo >= 0 ? "text-green-500" : "text-red-500",
      bgColor: stats.saldo >= 0 ? "bg-green-500/10" : "bg-red-500/10",
      borderColor: stats.saldo >= 0 ? "border-green-500/20" : "border-red-500/20",
    },
    {
      title: "Pagos",
      value: formatCurrency(stats.totalPago),
      subtitle: `${stats.countPago} itens (${stats.percentPago.toFixed(0)}%)`,
      icon: CheckCircle2,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
      borderColor: "border-green-500/20",
    },
    {
      title: "Pendentes",
      value: formatCurrency(stats.totalPendente),
      subtitle: `${stats.countPendente} itens`,
      icon: Clock,
      color: "text-yellow-500",
      bgColor: "bg-yellow-500/10",
      borderColor: "border-yellow-500/20",
    },
    {
      title: "Atrasados",
      value: formatCurrency(stats.totalAtrasado),
      subtitle: `${stats.countAtrasado} itens`,
      icon: AlertTriangle,
      color: "text-red-500",
      bgColor: "bg-red-500/10",
      borderColor: "border-red-500/20",
      highlight: stats.countAtrasado > 0,
    },
  ];

  return (
    <div className={cn("grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4", className)}>
      {statCards.map((card, index) => (
        <motion.div
          key={card.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
        >
          <Card className={cn(
            "border transition-all hover:shadow-lg",
            card.borderColor,
            card.highlight && "animate-pulse"
          )}>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-2">
                <div className={cn("p-1.5 rounded-md", card.bgColor)}>
                  <card.icon className={cn("h-3.5 w-3.5", card.color)} />
                </div>
                {card.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={cn("text-lg font-bold", card.color)}>
                {card.value}
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">
                {card.subtitle}
              </p>
            </CardContent>
          </Card>
        </motion.div>
      ))}

      {/* Barra de progresso de pagamento */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="col-span-full"
      >
        <Card className="border-border/50">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Progresso de Pagamento</span>
              <span className="text-sm font-medium">{stats.percentPago.toFixed(1)}%</span>
            </div>
            <Progress value={stats.percentPago} className="h-2" />
            <div className="flex justify-between mt-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3 text-green-500" />
                Pago: {formatCurrency(stats.totalPago)}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3 text-yellow-500" />
                Pendente: {formatCurrency(stats.totalPendente)}
              </span>
              <span className="flex items-center gap-1">
                <AlertTriangle className="h-3 w-3 text-red-500" />
                Atrasado: {formatCurrency(stats.totalAtrasado)}
              </span>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Dados complementares */}
      {dadosComplementares && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="col-span-full grid grid-cols-2 gap-4"
        >
          <Card className="border-border/50">
            <CardContent className="pt-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Users className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{dadosComplementares.funcionarios}</p>
                <p className="text-xs text-muted-foreground">Funcionários Ativos</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="pt-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/10">
                <Users className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{dadosComplementares.alunos}</p>
                <p className="text-xs text-muted-foreground">Alunos Ativos</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
