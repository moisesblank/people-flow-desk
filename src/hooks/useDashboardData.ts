// ============================================
// HOOK: useDashboardData
// Extraído de Dashboard.tsx (962 linhas)
// Centraliza processamento de dados do dashboard
// ============================================

import { useMemo } from "react";
import { format, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";

interface DashboardStats {
  income: number;
  personalExpenses: number;
  companyExpenses: number;
  pendingPayments: number;
  sitePendencias: number;
  students: number;
  affiliates: number;
  pendingTasks: number;
  tasksData?: any[];
  incomeData?: any[];
  personalExtraData?: any[];
}

interface ProcessedDashboardData {
  categoryData: { name: string; value: number; color: string }[];
  monthlyData: { month: string; receitas: number; despesas: number }[];
  recentTransactions: any[];
  budgetAlerts: any[];
  upcomingTasks: any[];
  lucroLiquido: number;
  totalExpenses: number;
  taskStats: { totalTasks: number; completedTasks: number };
}

const categoryColors: Record<string, string> = {
  feira: "hsl(152, 76%, 47%)",
  compras_casa: "hsl(212, 96%, 60%)",
  compras_bruna: "hsl(348, 70%, 50%)",
  compras_moises: "hsl(262, 83%, 58%)",
  cachorro: "hsl(45, 93%, 47%)",
  carro: "hsl(200, 80%, 50%)",
  gasolina: "hsl(30, 90%, 50%)",
  lanches: "hsl(320, 70%, 50%)",
  comida: "hsl(100, 70%, 45%)",
  casa: "hsl(180, 70%, 45%)",
  pessoal: "hsl(280, 70%, 50%)",
  transporte: "hsl(220, 80%, 55%)",
  lazer: "hsl(350, 80%, 55%)",
  outros: "hsl(240, 5%, 45%)",
};

const categoryLabels: Record<string, string> = {
  feira: "Feira",
  compras_casa: "Casa",
  compras_bruna: "Bruna",
  compras_moises: "Moisés",
  cachorro: "Cachorro",
  carro: "Carro",
  gasolina: "Gasolina",
  lanches: "Lanches",
  comida: "Comida",
  casa: "Casa",
  pessoal: "Pessoal",
  transporte: "Transporte",
  lazer: "Lazer",
  outros: "Outros",
};

export function useDashboardData(stats: DashboardStats | null | undefined): ProcessedDashboardData | null {
  return useMemo(() => {
    if (!stats) return null;

    // Process category data for pie chart
    const categoryMap: Record<string, number> = {};
    stats.personalExtraData?.forEach((expense: any) => {
      const cat = expense.categoria || "outros";
      categoryMap[cat] = (categoryMap[cat] || 0) + (expense.valor || 0);
    });

    const categoryData = Object.entries(categoryMap).map(([key, value]) => ({
      name: categoryLabels[key] || key,
      value,
      color: categoryColors[key] || "hsl(240, 5%, 45%)",
    }));

    // Generate monthly data for chart
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const date = subMonths(new Date(), i);
      months.push({
        month: format(date, "MMM", { locale: ptBR }),
        receitas: Math.floor(Math.random() * 5000000) + 1000000,
        despesas: Math.floor(Math.random() * 3000000) + 500000,
      });
    }
    months[5] = {
      month: format(new Date(), "MMM", { locale: ptBR }),
      receitas: stats.income,
      despesas: stats.personalExpenses + stats.companyExpenses,
    };

    // Recent transactions
    const transactions: any[] = [];
    stats.incomeData?.slice(0, 3).forEach((inc: any) => {
      transactions.push({
        id: `inc-${Math.random()}`,
        type: "income",
        description: inc.fonte,
        amount: inc.valor,
        date: new Date(inc.created_at || new Date()),
      });
    });
    stats.personalExtraData?.slice(0, 3).forEach((exp: any) => {
      transactions.push({
        id: `exp-${Math.random()}`,
        type: "expense",
        description: exp.nome,
        amount: exp.valor,
        date: new Date(exp.created_at || new Date()),
      });
    });
    transactions.sort((a, b) => b.date.getTime() - a.date.getTime());

    // Budget alerts
    const totalExpenses = stats.personalExpenses + stats.companyExpenses;
    const alerts: any[] = [];
    
    if (totalExpenses > stats.income * 0.8) {
      alerts.push({
        id: "1",
        type: "warning",
        title: "Gastos elevados",
        message: "Seus gastos estão acima de 80% das receitas deste mês.",
      });
    }
    
    if (totalExpenses > stats.income) {
      alerts.push({
        id: "2",
        type: "danger",
        title: "Orçamento estourado!",
        message: "Você gastou mais do que recebeu neste mês.",
      });
    }

    if (stats.pendingPayments > 0) {
      alerts.push({
        id: "3",
        type: "info",
        title: `${stats.pendingPayments} pagamentos pendentes`,
        message: "Confira seus pagamentos na área de Pagamentos.",
      });
    }

    if (stats.sitePendencias > 0) {
      alerts.push({
        id: "4",
        type: "warning",
        title: `${stats.sitePendencias} pendências do site`,
        message: "Há tarefas pendentes na Gestão do Site.",
      });
    }

    const upcomingTasks = stats.tasksData?.slice(0, 5).map((task: any) => ({
      id: task.id,
      title: task.title,
      date: task.task_date,
      priority: task.priority,
    })) || [];

    // Task stats
    const taskStats = {
      totalTasks: stats.tasksData?.length || 0,
      completedTasks: stats.tasksData?.filter((t: any) => t.is_completed).length || 0,
    };

    const lucroLiquido = stats.income - stats.personalExpenses - stats.companyExpenses;

    return {
      categoryData,
      monthlyData: months,
      recentTransactions: transactions.slice(0, 5),
      budgetAlerts: alerts,
      upcomingTasks,
      lucroLiquido,
      totalExpenses,
      taskStats,
    };
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
