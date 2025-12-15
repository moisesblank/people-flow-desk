// ============================================
// SYNAPSE v14.0 - FINANCIAL INSIGHTS
// Insights financeiros inteligentes
// ============================================

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle2,
  Lightbulb,
  Target,
  PiggyBank,
  BarChart3
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface FinancialInsightsProps {
  totalIncome: number;
  totalExpenses: number;
  personalExpenses: number;
  companyExpenses: number;
  pendingPayments?: number;
}

interface Insight {
  id: string;
  type: 'success' | 'warning' | 'info' | 'alert';
  title: string;
  description: string;
  icon: React.ElementType;
  action?: string;
}

export function FinancialInsights({ 
  totalIncome, 
  totalExpenses, 
  personalExpenses, 
  companyExpenses,
  pendingPayments = 0
}: FinancialInsightsProps) {
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { 
      style: 'currency', 
      currency: 'BRL' 
    }).format(value / 100);
  };

  const insights = useMemo(() => {
    const result: Insight[] = [];
    const balance = totalIncome - totalExpenses;
    const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0;
    const expenseRatio = totalIncome > 0 ? (totalExpenses / totalIncome) * 100 : 0;

    // Balance insight
    if (balance > 0) {
      result.push({
        id: 'balance-positive',
        type: 'success',
        title: 'Saldo Positivo',
        description: `Você está economizando ${formatCurrency(balance)} este período.`,
        icon: TrendingUp
      });
    } else if (balance < 0) {
      result.push({
        id: 'balance-negative',
        type: 'alert',
        title: 'Atenção: Saldo Negativo',
        description: `Gastos excedem receitas em ${formatCurrency(Math.abs(balance))}.`,
        icon: TrendingDown,
        action: 'Revisar gastos'
      });
    }

    // Savings rate insight
    if (savingsRate >= 20) {
      result.push({
        id: 'savings-excellent',
        type: 'success',
        title: 'Taxa de Economia Excelente',
        description: `${savingsRate.toFixed(1)}% da receita está sendo economizada.`,
        icon: PiggyBank
      });
    } else if (savingsRate >= 10 && savingsRate < 20) {
      result.push({
        id: 'savings-good',
        type: 'info',
        title: 'Economia Moderada',
        description: `${savingsRate.toFixed(1)}% de economia. Meta ideal: 20%.`,
        icon: Target
      });
    } else if (savingsRate < 10 && savingsRate > 0) {
      result.push({
        id: 'savings-low',
        type: 'warning',
        title: 'Taxa de Economia Baixa',
        description: `Apenas ${savingsRate.toFixed(1)}% está sendo economizado.`,
        icon: AlertTriangle,
        action: 'Aumentar economia'
      });
    }

    // Expense distribution insight
    if (personalExpenses > companyExpenses * 2) {
      result.push({
        id: 'personal-high',
        type: 'info',
        title: 'Gastos Pessoais Elevados',
        description: 'Considere revisar despesas pessoais para otimização.',
        icon: Lightbulb
      });
    }

    // Pending payments
    if (pendingPayments > 0) {
      result.push({
        id: 'pending',
        type: 'warning',
        title: 'Pagamentos Pendentes',
        description: `${pendingPayments} pagamento(s) aguardando processamento.`,
        icon: AlertTriangle,
        action: 'Ver pagamentos'
      });
    }

    return result;
  }, [totalIncome, totalExpenses, personalExpenses, companyExpenses, pendingPayments]);

  const getTypeStyles = (type: string) => {
    switch (type) {
      case 'success': return 'bg-stats-green/10 border-stats-green/30 text-stats-green';
      case 'warning': return 'bg-stats-gold/10 border-stats-gold/30 text-stats-gold';
      case 'alert': return 'bg-destructive/10 border-destructive/30 text-destructive';
      default: return 'bg-stats-blue/10 border-stats-blue/30 text-stats-blue';
    }
  };

  const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <div className="p-1.5 rounded-lg bg-primary/20">
            <Lightbulb className="w-4 h-4 text-primary" />
          </div>
          Insights Financeiros
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Savings Goal Progress */}
        <div className="p-4 rounded-xl bg-muted/50 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Meta de Economia</span>
            <Badge variant="outline">{Math.max(0, savingsRate).toFixed(1)}% / 20%</Badge>
          </div>
          <Progress value={Math.min(100, (savingsRate / 20) * 100)} className="h-2" />
          <p className="text-xs text-muted-foreground">
            {savingsRate >= 20 
              ? '🎉 Parabéns! Você atingiu a meta de economia!' 
              : `Faltam ${(20 - savingsRate).toFixed(1)}% para atingir a meta ideal.`}
          </p>
        </div>

        {/* Insights List */}
        <div className="space-y-3">
          {insights.map((insight, index) => {
            const Icon = insight.icon;
            return (
              <motion.div
                key={insight.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`p-3 rounded-xl border ${getTypeStyles(insight.type)}`}
              >
                <div className="flex items-start gap-3">
                  <Icon className="w-5 h-5 mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{insight.title}</p>
                    <p className="text-xs opacity-80 mt-0.5">{insight.description}</p>
                    {insight.action && (
                      <button className="text-xs font-medium mt-2 underline underline-offset-2">
                        {insight.action} →
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <div className="p-3 rounded-lg bg-muted/30 text-center">
            <BarChart3 className="w-5 h-5 mx-auto mb-1 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">Receita</p>
            <p className="text-sm font-bold text-stats-green">{formatCurrency(totalIncome)}</p>
          </div>
          <div className="p-3 rounded-lg bg-muted/30 text-center">
            <TrendingDown className="w-5 h-5 mx-auto mb-1 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">Despesas</p>
            <p className="text-sm font-bold text-destructive">{formatCurrency(totalExpenses)}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default FinancialInsights;
