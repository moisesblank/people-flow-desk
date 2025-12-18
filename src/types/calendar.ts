// ============================================
// MOISÉS MEDEIROS - Calendar Types
// Tipos centralizados para tarefas do calendário
// ============================================

export interface CalendarTask {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  task_date: string;
  task_time: string | null;
  is_completed: boolean;
  reminder_enabled: boolean;
  reminder_email: string | null;
  priority: 'baixa' | 'media' | 'alta' | 'low' | 'normal' | 'high' | 'urgent' | string | null;
  category: string | null;
  created_at: string;
  updated_at: string;
}

export type TaskPriority = 'baixa' | 'media' | 'alta' | 'low' | 'normal' | 'high' | 'urgent';

export interface DashboardStats {
  employees: number;
  personalExpenses: number;
  companyExpenses: number;
  income: number;
  affiliates: number;
  students: number;
  pendingTasks: number;
  pendingPayments: number;
  sitePendencias: number;
  personalExtraData: Array<{
    valor: number;
    categoria: string | null;
    nome: string;
    created_at: string | null;
  }>;
  incomeData: Array<{
    valor: number;
    fonte: string | null;
    created_at: string | null;
  }>;
  tasksData: CalendarTask[];
  paymentsData: Array<{
    id: string;
    [key: string]: unknown;
  }>;
  sitePendenciasData: Array<{
    id: string;
    [key: string]: unknown;
  }>;
}
