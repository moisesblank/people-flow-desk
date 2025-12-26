// ============================================
// TIPOS FINANCEIROS
// Centralizados por domínio
// ============================================

// Status de pagamento
export type PaymentStatus = 'pendente' | 'pago' | 'atrasado' | 'cancelado';

// Categoria de despesa
export type ExpenseCategory = 
  | 'alimentacao'
  | 'transporte'
  | 'moradia'
  | 'saude'
  | 'educacao'
  | 'lazer'
  | 'vestuario'
  | 'tecnologia'
  | 'assinaturas'
  | 'investimentos'
  | 'outros';

// Transação genérica
export interface Transaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  description: string;
  category?: string;
  date: string;
  status?: PaymentStatus;
  created_at: string;
  updated_at?: string;
}

// Despesa fixa
export interface FixedExpense {
  id: number;
  nome: string;
  valor: number;
  categoria?: string;
  data_vencimento?: string;
  data_pagamento?: string;
  status_pagamento?: PaymentStatus;
  recorrente?: boolean;
  data_inicio_recorrencia?: string;
  data_fim_recorrencia?: string;
  mes?: number;
  ano?: number;
  dia?: number;
  semana?: number;
  fechado?: boolean;
  is_projecao?: boolean;
  created_at?: string;
  updated_at?: string;
}

// Despesa extra
export interface ExtraExpense {
  id: number;
  nome: string;
  valor: number;
  categoria?: string;
  data?: string;
  data_vencimento?: string;
  data_pagamento?: string;
  status_pagamento?: PaymentStatus;
  mes?: number;
  ano?: number;
  dia?: number;
  semana?: number;
  fechado?: boolean;
  observacoes_pagamento?: string;
  created_at?: string;
  updated_at?: string;
}

// Entrada/Receita
export interface Income {
  id: string;
  valor: number;
  fonte?: string;
  descricao?: string;
  data?: string;
  mes?: number;
  ano?: number;
  created_at?: string;
  updated_at?: string;
}

// Comissão de afiliado
export interface Commission {
  id: string;
  afiliado_id: number;
  aluno_id?: string;
  valor: number;
  data?: string;
  status?: 'pendente' | 'pago' | 'cancelado';
  transaction_id?: string;
  descricao?: string;
  pago_em?: string;
  created_at?: string;
}

// Conta bancária
export interface BankAccount {
  id: string;
  name: string;
  bank_name?: string;
  account_type?: 'corrente' | 'poupanca' | 'investimento';
  initial_balance?: number;
  current_balance?: number;
  color?: string;
  is_active: boolean;
  is_personal: boolean;
  created_at?: string;
}

// Fechamento mensal
export interface MonthlyClosing {
  id: string;
  mes: number;
  ano: number;
  total_entradas: number;
  total_saidas: number;
  saldo: number;
  fechado: boolean;
  fechado_por?: string;
  fechado_em?: string;
  observacoes?: string;
  created_at?: string;
}

// Fluxo de caixa
export interface CashFlow {
  date: string;
  income: number;
  expenses: number;
  balance: number;
  accumulated: number;
}

// Resultado OCR de recibo
export interface OCRResult {
  estabelecimento?: string;
  data?: string;
  valor_total?: number;
  itens?: Array<{
    descricao: string;
    quantidade?: number;
    valor_unitario?: number;
    valor_total?: number;
  }>;
  forma_pagamento?: string;
  categoria_sugerida?: ExpenseCategory;
  confianca?: number;
}

// Métricas financeiras do dashboard
export interface FinanceDashboardMetrics {
  totalIncome: number;
  totalExpenses: number;
  netBalance: number;
  pendingPayments: number;
  overduePayments: number;
  savingsRate: number;
  monthlyTrend: 'up' | 'down' | 'stable';
}
