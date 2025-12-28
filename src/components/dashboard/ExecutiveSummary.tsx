// ============================================
// RESUMO EXECUTIVO - DASHBOARD
// Visão consolidada para o OWNER - CLICÁVEL
// ============================================

import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  TrendingUp, TrendingDown, DollarSign, Users, 
  GraduationCap, Target, ArrowUpRight, ArrowDownRight,
  Wallet, CreditCard, Activity, ChevronRight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/utils';

interface ExecutiveSummaryProps {
  totalIncome: number;
  totalExpenses: number;
  totalStudents: number;
  totalAffiliates: number;
  monthlyGrowth: number;
  conversionRate: number;
  pendingPayments: number;
  completedTasks: number;
  totalTasks: number;
}

export function ExecutiveSummary({
  totalIncome,
  totalExpenses,
  totalStudents,
  totalAffiliates,
  monthlyGrowth,
  conversionRate,
  pendingPayments,
  completedTasks,
  totalTasks,
}: ExecutiveSummaryProps) {
  const navigate = useNavigate();
  const netProfit = totalIncome - totalExpenses;
  const profitMargin = totalIncome > 0 ? ((netProfit / totalIncome) * 100) : 0;
  const taskProgress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  const metrics = [
    {
      label: 'Receita Total',
      value: formatCurrency(totalIncome),
      icon: DollarSign,
      trend: monthlyGrowth,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
      href: '/entradas',
    },
    {
      label: 'Despesas',
      value: formatCurrency(totalExpenses),
      icon: CreditCard,
      trend: -2.3,
      color: 'text-red-500',
      bgColor: 'bg-red-500/10',
      href: '/financas-empresa',
    },
    {
      label: 'Lucro Líquido',
      value: formatCurrency(netProfit),
      icon: Wallet,
      trend: profitMargin,
      color: netProfit >= 0 ? 'text-green-500' : 'text-red-500',
      bgColor: netProfit >= 0 ? 'bg-green-500/10' : 'bg-red-500/10',
      href: '/relatorios',
    },
    {
      label: 'Alunos Ativos',
      value: totalStudents.toString(),
      icon: GraduationCap,
      trend: 12.5,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
      href: '/alunos',
    },
    {
      label: 'Afiliados',
      value: totalAffiliates.toString(),
      icon: Users,
      trend: 8.3,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
      href: '/afiliados',
    },
    {
      label: 'Taxa Conversão',
      value: `${conversionRate.toFixed(1)}%`,
      icon: Target,
      trend: 3.2,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
      href: '/metricas',
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Resumo Executivo</h2>
          <p className="text-muted-foreground">Visão consolidada do seu negócio</p>
        </div>
        <Badge variant="outline" className="flex items-center gap-1">
          <Activity className="h-3 w-3" />
          Atualizado agora
        </Badge>
      </div>

      {/* Métricas Principais - CLICÁVEIS */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {metrics.map((metric, idx) => (
          <motion.div
            key={metric.label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 0.05 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Card 
              className="h-full cursor-pointer hover:border-primary/50 transition-all group"
              onClick={() => navigate(metric.href)}
            >
              <CardContent className="p-4">
                <div className={cn("p-2 rounded-lg w-fit mb-3", metric.bgColor)}>
                  <metric.icon className={cn("h-4 w-4", metric.color)} />
                </div>
                <p className="text-2xl font-bold">{metric.value}</p>
                <div className="flex items-center justify-between mt-1">
                  <p className="text-xs text-muted-foreground">{metric.label}</p>
                  <div className={cn(
                    "flex items-center text-xs",
                    metric.trend >= 0 ? "text-green-500" : "text-red-500"
                  )}>
                    {metric.trend >= 0 ? (
                      <ArrowUpRight className="h-3 w-3" />
                    ) : (
                      <ArrowDownRight className="h-3 w-3" />
                    )}
                    {Math.abs(metric.trend).toFixed(1)}%
                  </div>
                </div>
                {/* Indicador de clicável */}
                <ChevronRight className="h-4 w-4 text-muted-foreground absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity" />
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Cards Secundários - CLICÁVEIS */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Margem de Lucro */}
        <motion.div
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
        >
          <Card 
            className="cursor-pointer hover:border-primary/50 transition-all"
            onClick={() => navigate('/relatorios')}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Margem de Lucro
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-end justify-between">
                  <span className={cn(
                    "text-4xl font-bold",
                    profitMargin >= 30 ? "text-green-500" : 
                    profitMargin >= 15 ? "text-yellow-500" : "text-red-500"
                  )}>
                    {profitMargin.toFixed(1)}%
                  </span>
                  <span className="text-sm text-muted-foreground">
                    Meta: 30%
                  </span>
                </div>
                <Progress 
                  value={Math.min(profitMargin, 100)} 
                  className={cn(
                    "h-3",
                    profitMargin >= 30 && "[&>div]:bg-green-500"
                  )}
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Receita: {formatCurrency(totalIncome)}</span>
                  <span>Despesas: {formatCurrency(totalExpenses)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Progresso de Tarefas */}
        <motion.div
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
        >
          <Card 
            className="cursor-pointer hover:border-primary/50 transition-all"
            onClick={() => navigate('/tarefas')}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Tarefas do Mês
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-end justify-between">
                  <span className="text-4xl font-bold">
                    {completedTasks}/{totalTasks}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {taskProgress.toFixed(0)}% concluído
                  </span>
                </div>
                <Progress value={taskProgress} className="h-3" />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{completedTasks} concluídas</span>
                  <span>{totalTasks - completedTasks} pendentes</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Alertas - CLICÁVEL */}
      {pendingPayments > 0 && (
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          onClick={() => navigate('/pagamentos')}
          className="w-full p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20 hover:border-yellow-500/40 flex items-center gap-3 text-left transition-all group"
        >
          <CreditCard className="h-5 w-5 text-yellow-500" />
          <div className="flex-1">
            <p className="font-medium text-yellow-600">Atenção: Pagamentos Pendentes</p>
            <p className="text-sm text-muted-foreground">
              Você tem {pendingPayments} pagamento(s) pendente(s) este mês
            </p>
          </div>
          <ChevronRight className="h-5 w-5 text-yellow-500 opacity-0 group-hover:opacity-100 transition-opacity" />
        </motion.button>
      )}
    </motion.div>
  );
}
