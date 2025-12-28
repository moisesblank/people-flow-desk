// ============================================
// SERVICE: dashboardService
// Centraliza transformações de dados para gráficos
// Separado da UI para testabilidade e manutenção
// ============================================

import { format, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";

// ============================================
// TIPOS
// ============================================
export interface CategoryData {
  name: string;
  value: number;
  color: string;
}

export interface MonthlyChartData {
  month: string;
  receitas: number;
  despesas: number;
}

export interface TransactionData {
  id: string;
  type: "income" | "expense";
  description: string;
  amount: number;
  date: Date;
}

export interface BudgetAlert {
  id: string;
  type: "info" | "warning" | "danger";
  title: string;
  message: string;
  timestamp: Date;
}

export interface UpcomingTask {
  id: string;
  title: string;
  date: string;
  priority: string;
}

export interface DashboardStats {
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

export interface ProcessedDashboardData {
  categoryData: CategoryData[];
  monthlyData: MonthlyChartData[];
  recentTransactions: TransactionData[];
  budgetAlerts: BudgetAlert[];
  upcomingTasks: UpcomingTask[];
  lucroLiquido: number;
  totalExpenses: number;
  taskStats: { totalTasks: number; completedTasks: number };
}

// ============================================
// CONSTANTES - Cores e Labels por categoria
// ============================================
export const CATEGORY_COLORS: Record<string, string> = {
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

export const CATEGORY_LABELS: Record<string, string> = {
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

// ============================================
// FUNÇÕES DE TRANSFORMAÇÃO
// ============================================

/**
 * Processa dados de despesas por categoria para gráfico de pizza
 */
export function processarCategorias(expenses: { categoria?: string; valor?: number }[]): CategoryData[] {
  const categoryMap: Record<string, number> = {};
  
  expenses.forEach((expense) => {
    const cat = expense.categoria || "outros";
    categoryMap[cat] = (categoryMap[cat] || 0) + (expense.valor || 0);
  });
  
  return Object.entries(categoryMap).map(([key, value]) => ({
    name: CATEGORY_LABELS[key] || key,
    value,
    color: CATEGORY_COLORS[key] || CATEGORY_COLORS.outros,
  }));
}

/**
 * Gera dados mensais para gráfico de evolução
 */
export function gerarDadosMensais(
  currentIncome: number,
  currentExpenses: number,
  mesesPassados: number = 6
): MonthlyChartData[] {
  const months: MonthlyChartData[] = [];
  
  for (let i = mesesPassados - 1; i >= 0; i--) {
    const date = subMonths(new Date(), i);
    
    if (i === 0) {
      // Mês atual com dados reais
      months.push({
        month: format(date, "MMM", { locale: ptBR }),
        receitas: currentIncome,
        despesas: currentExpenses,
      });
    } else {
      // Meses anteriores - placeholder (idealmente buscar do banco)
      months.push({
        month: format(date, "MMM", { locale: ptBR }),
        receitas: 0,
        despesas: 0,
      });
    }
  }
  
  return months;
}

/**
 * Processa transações recentes (receitas + despesas)
 */
export function processarTransacoesRecentes(
  incomeData: { fonte?: string; valor?: number; created_at?: string }[],
  expenseData: { nome?: string; valor?: number; created_at?: string }[],
  limite: number = 5
): TransactionData[] {
  const transactions: TransactionData[] = [];
  
  // Adicionar receitas
  incomeData.slice(0, limite).forEach((inc, index) => {
    transactions.push({
      id: `inc-${index}-${Date.now()}`,
      type: "income",
      description: inc.fonte || "Receita",
      amount: inc.valor || 0,
      date: new Date(inc.created_at || new Date()),
    });
  });
  
  // Adicionar despesas
  expenseData.slice(0, limite).forEach((exp, index) => {
    transactions.push({
      id: `exp-${index}-${Date.now()}`,
      type: "expense",
      description: exp.nome || "Despesa",
      amount: exp.valor || 0,
      date: new Date(exp.created_at || new Date()),
    });
  });
  
  // Ordenar por data (mais recente primeiro)
  transactions.sort((a, b) => b.date.getTime() - a.date.getTime());
  
  return transactions.slice(0, limite);
}

/**
 * Gera alertas de orçamento baseados em receitas/despesas
 */
export function gerarAlertasOrcamento(
  income: number,
  totalExpenses: number,
  pendingPayments: number,
  sitePendencias: number
): BudgetAlert[] {
  const alerts: BudgetAlert[] = [];
  const now = new Date();
  
  // Alerta de gastos elevados (>80%)
  if (totalExpenses > income * 0.8 && totalExpenses <= income) {
    alerts.push({
      id: "alert-warning-80",
      type: "warning",
      title: "Gastos elevados",
      message: "Seus gastos estão acima de 80% das receitas deste mês.",
      timestamp: now,
    });
  }
  
  // Alerta de orçamento estourado
  if (totalExpenses > income) {
    alerts.push({
      id: "alert-danger-over",
      type: "danger",
      title: "Orçamento estourado!",
      message: "Você gastou mais do que recebeu neste mês.",
      timestamp: now,
    });
  }
  
  // Alerta de pagamentos pendentes
  if (pendingPayments > 0) {
    alerts.push({
      id: "alert-info-payments",
      type: "info",
      title: `${pendingPayments} pagamentos pendentes`,
      message: "Confira seus pagamentos na área de Pagamentos.",
      timestamp: now,
    });
  }
  
  // Alerta de pendências do site
  if (sitePendencias > 0) {
    alerts.push({
      id: "alert-warning-site",
      type: "warning",
      title: `${sitePendencias} pendências do site`,
      message: "Há tarefas pendentes na Gestão do Site.",
      timestamp: now,
    });
  }
  
  return alerts;
}

/**
 * Processa tarefas para exibição
 */
export function processarTarefas(
  tasksData: { id: string; title: string; task_date: string; priority: string; is_completed?: boolean }[],
  limite: number = 5
): { upcomingTasks: UpcomingTask[]; totalTasks: number; completedTasks: number } {
  const upcomingTasks = tasksData.slice(0, limite).map((task) => ({
    id: task.id,
    title: task.title,
    date: task.task_date,
    priority: task.priority,
  }));
  
  const completedTasks = tasksData.filter((t) => t.is_completed).length;
  
  return {
    upcomingTasks,
    totalTasks: tasksData.length,
    completedTasks,
  };
}

/**
 * Processa todos os dados do dashboard de uma vez
 * Função principal que substitui o useMemo de 138 linhas no Dashboard.tsx
 */
export function processarDadosDashboard(stats: DashboardStats): ProcessedDashboardData {
  // Processar categorias para gráfico de pizza
  const categoryData = processarCategorias(stats.personalExtraData || []);
  
  // Gerar dados mensais
  const totalExpenses = stats.personalExpenses + stats.companyExpenses;
  const monthlyData = gerarDadosMensais(stats.income, totalExpenses);
  
  // Processar transações recentes
  const recentTransactions = processarTransacoesRecentes(
    stats.incomeData || [],
    stats.personalExtraData || [],
    5
  );
  
  // Gerar alertas
  const budgetAlerts = gerarAlertasOrcamento(
    stats.income,
    totalExpenses,
    stats.pendingPayments,
    stats.sitePendencias
  );
  
  // Processar tarefas
  const { upcomingTasks, totalTasks, completedTasks } = processarTarefas(
    stats.tasksData || [],
    5
  );
  
  // Calcular lucro líquido
  const lucroLiquido = stats.income - totalExpenses;
  
  return {
    categoryData,
    monthlyData,
    recentTransactions,
    budgetAlerts,
    upcomingTasks,
    lucroLiquido,
    totalExpenses,
    taskStats: { totalTasks, completedTasks },
  };
}
