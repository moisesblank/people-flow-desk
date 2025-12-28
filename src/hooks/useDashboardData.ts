// ============================================
// HOOK: useDashboardData
// Extraído de Dashboard.tsx (962 linhas)
// Agora usa dashboardService para processamento
// ============================================

import { useMemo } from "react";
import { 
  processarDadosDashboard, 
  DashboardStats, 
  ProcessedDashboardData 
} from "@/services/dashboardService";

// Re-exportar tipos do serviço para compatibilidade
export type { DashboardStats, ProcessedDashboardData } from "@/services/dashboardService";

/**
 * Hook que processa dados do dashboard usando o serviço centralizado
 * Mantido para retrocompatibilidade com componentes existentes
 */
export function useDashboardData(stats: DashboardStats | null | undefined): ProcessedDashboardData | null {
  return useMemo(() => {
    if (!stats) return null;
    return processarDadosDashboard(stats);
  }, [stats]);
}

// Props memoizadas para widgets
export function useDashboardWidgetProps(stats: DashboardStats | null | undefined, processedData: ProcessedDashboardData | null) {
  const totalExpensesValue = useMemo(() => 
    (stats?.personalExpenses || 0) + (stats?.companyExpenses || 0),
    [stats?.personalExpenses, stats?.companyExpenses]
  );

  const financialInsightsProps = useMemo(() => ({
    totalIncome: stats?.income || 0,
    totalExpenses: totalExpensesValue,
    personalExpenses: stats?.personalExpenses || 0,
    companyExpenses: stats?.companyExpenses || 0,
    pendingPayments: stats?.pendingPayments || 0,
  }), [stats?.income, totalExpensesValue, stats?.personalExpenses, stats?.companyExpenses, stats?.pendingPayments]);

  const financialHealthProps = useMemo(() => ({
    income: stats?.income || 0,
    expenses: totalExpensesValue,
    savings: Math.max(0, (stats?.income || 0) - totalExpensesValue),
    debts: 0,
    emergencyFund: (stats?.income || 0) * 3,
    monthlyGoal: (stats?.income || 0) * 0.2,
  }), [stats?.income, totalExpensesValue]);

  const predictiveMetricsProps = useMemo(() => ({
    income: stats?.income || 0,
    expenses: totalExpensesValue,
    students: stats?.students || 0,
    tasks: processedData?.taskStats.totalTasks || 0,
    completedTasks: processedData?.taskStats.completedTasks || 0,
  }), [stats?.income, totalExpensesValue, stats?.students, processedData?.taskStats]);

  return {
    totalExpensesValue,
    financialInsightsProps,
    financialHealthProps,
    predictiveMetricsProps,
  };
}
