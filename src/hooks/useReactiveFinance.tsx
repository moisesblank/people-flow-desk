// ============================================
// PLANILHA VIVA - HOOKS DE ACESSO RÁPIDO
// Hooks para diferentes contextos financeiros
// ============================================

// Re-export all hooks from ReactiveFinanceContext
export { 
  useReactiveFinance,
  useReactiveSaldo,
  useReactiveReceitas,
  useReactiveDespesas,
  useReactiveContadores,
  useReactiveKPIs,
  ReactiveFinanceProvider
} from '@/contexts/ReactiveFinanceContext';

// ===== HOOK PARA COMPONENTES LEGADOS =====
// Este hook permite que componentes antigos usem dados reativos
// sem necessidade de refatoração completa

import { useMemo } from 'react';
import { useReactiveFinance } from '@/contexts/ReactiveFinanceContext';

export function useLegacyFinanceData() {
  const { metrics, formatCurrency } = useReactiveFinance();
  
  return useMemo(() => ({
    // Formato antigo para compatibilidade
    income: metrics.receitaMes,
    personalExpenses: metrics.despesaPessoal,
    companyExpenses: metrics.despesaEmpresa,
    totalExpenses: metrics.despesaMes,
    balance: metrics.saldoMes,
    students: metrics.alunosAtivos,
    employees: metrics.funcionariosAtivos,
    affiliates: metrics.afiliadosAtivos,
    pendingTasks: metrics.tarefasPendentes,
    pendingPayments: metrics.pagamentosPendentes,
    salesMonth: metrics.vendasMes,
    
    // Helpers
    formatCurrency,
    
    // Calculated
    lucroLiquido: metrics.lucroLiquido,
    savingsRate: metrics.taxaEconomia,
  }), [metrics, formatCurrency]);
}

// ===== HOOK PARA ALERTAS FINANCEIROS =====
export function useFinancialAlerts() {
  const { metrics } = useReactiveFinance();
  
  return useMemo(() => {
    const alerts: Array<{
      id: string;
      type: 'warning' | 'danger' | 'info' | 'success';
      title: string;
      message: string;
    }> = [];
    
    const totalExpenses = metrics.despesaMes;
    const income = metrics.receitaMes;
    
    // Alerta de gastos elevados
    if (totalExpenses > income * 0.8 && totalExpenses <= income) {
      alerts.push({
        id: 'high-expenses',
        type: 'warning',
        title: 'Gastos elevados',
        message: 'Seus gastos estão acima de 80% das receitas deste mês.',
      });
    }
    
    // Alerta de orçamento estourado
    if (totalExpenses > income) {
      alerts.push({
        id: 'budget-exceeded',
        type: 'danger',
        title: 'Orçamento estourado!',
        message: 'Você gastou mais do que recebeu neste mês.',
      });
    }
    
    // Alerta de pagamentos pendentes
    if (metrics.pagamentosPendentes > 0) {
      alerts.push({
        id: 'pending-payments',
        type: 'info',
        title: `${metrics.pagamentosPendentes} pagamentos pendentes`,
        message: 'Confira seus pagamentos na área de Pagamentos.',
      });
    }
    
    // Alerta positivo de economia
    if (metrics.taxaEconomia > 30) {
      alerts.push({
        id: 'good-savings',
        type: 'success',
        title: 'Ótima economia!',
        message: `Você está economizando ${metrics.taxaEconomia.toFixed(1)}% das suas receitas.`,
      });
    }
    
    return alerts;
  }, [metrics]);
}

// ===== HOOK PARA TENDÊNCIAS =====
export function useFinancialTrends() {
  const { metrics } = useReactiveFinance();
  
  return useMemo(() => {
    const receitaTotal = metrics.receitaMes;
    const despesaTotal = metrics.despesaMes;
    
    // Determinar tendência baseada no saldo
    const saldo = metrics.saldoMes;
    
    let trend: 'up' | 'down' | 'stable' = 'stable';
    if (saldo > 0) trend = 'up';
    else if (saldo < 0) trend = 'down';
    
    // Velocidade de gasto (quanto falta do orçamento)
    const budgetRemaining = Math.max(0, receitaTotal - despesaTotal);
    const budgetUsedPercent = receitaTotal > 0 ? (despesaTotal / receitaTotal) * 100 : 0;
    
    // Projeção simples (se continuar nesse ritmo)
    const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
    const currentDay = new Date().getDate();
    const dailyExpenseRate = despesaTotal / currentDay;
    const projectedMonthlyExpense = dailyExpenseRate * daysInMonth;
    
    return {
      trend,
      budgetRemaining,
      budgetUsedPercent,
      projectedMonthlyExpense,
      isOnTrack: projectedMonthlyExpense <= receitaTotal,
      daysRemaining: daysInMonth - currentDay,
      dailyBudget: budgetRemaining / (daysInMonth - currentDay),
    };
  }, [metrics]);
}
