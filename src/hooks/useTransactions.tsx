// ============================================
// UPGRADE v10 - FASE 5: TRANSAÇÕES UNIFICADAS
// Hook para gestão financeira completa
// ============================================

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useSubspaceQuery, SUBSPACE_CACHE_PROFILES } from './useSubspaceCommunication';
import { toast } from "sonner";

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: string;
  status: string;
  due_date: string | null;
  paid_date: string | null;
  category_id: string | null;
  account_id: string | null;
  is_personal: boolean;
  is_recurring: boolean;
  recurrence_type: string | null;
  notes: string | null;
  attachment_url: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export type TransactionType = "income" | "expense" | "transfer";

// Hook para buscar transações
export function useTransactions(filters?: {
  type?: string;
  category_id?: string;
  account_id?: string;
  is_personal?: boolean;
  dateRange?: { start: Date; end: Date };
}) {
  const { user } = useAuth();

  // 🌌 Query migrada para useSubspaceQuery - Cache localStorage
  return useSubspaceQuery(
    ["transactions", user?.id || 'anon', JSON.stringify(filters || {})],
    async () => {
      if (!user?.id) return [];

      let query = supabase
        .from("transactions")
        .select(
          `
          *,
          category:category_id(id, name, color, icon),
          account:account_id(id, name, color)
        `
        )
        .eq("created_by", user.id)
        .order("due_date", { ascending: false });

      if (filters?.type) {
        query = query.eq("type", filters.type);
      }
      if (filters?.category_id) {
        query = query.eq("category_id", filters.category_id);
      }
      if (filters?.account_id) {
        query = query.eq("account_id", filters.account_id);
      }
      if (filters?.is_personal !== undefined) {
        query = query.eq("is_personal", filters.is_personal);
      }
      if (filters?.dateRange) {
        query = query
          .gte("due_date", filters.dateRange.start.toISOString().split("T")[0])
          .lte("due_date", filters.dateRange.end.toISOString().split("T")[0]);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    {
      profile: 'user', // 5min stale, cache persistente
      persistKey: `transactions_${user?.id}`,
      enabled: !!user?.id,
    }
  );
}

// Hook para criar transação
export function useCreateTransaction() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: {
      description: string;
      amount: number;
      type: string;
      status?: string;
      due_date?: string;
      category_id?: string;
      account_id?: string;
      is_personal?: boolean;
      is_recurring?: boolean;
      recurrence_type?: string;
      notes?: string;
    }) => {
      if (!user?.id) throw new Error("Usuário não autenticado");

      const { data: result, error } = await supabase
        .from("transactions")
        .insert({
          ...data,
          status: data.status || "pending",
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["financial-stats"] });
      const typeLabel = variables.type === "income" ? "Receita" : "Despesa";
      toast.success(`${typeLabel} registrada!`);
    },
    onError: (error) => {
      toast.error("Erro ao registrar transação: " + error.message);
    },
  });
}

// Hook para atualizar transação
export function useUpdateTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      ...data
    }: {
      id: string;
      description?: string;
      amount?: number;
      type?: string;
      status?: string;
      due_date?: string;
      paid_date?: string;
      category_id?: string;
      notes?: string;
    }) => {
      const { data: result, error } = await supabase
        .from("transactions")
        .update({ ...data, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["financial-stats"] });
      toast.success("Transação atualizada!");
    },
    onError: (error) => {
      toast.error("Erro ao atualizar transação: " + error.message);
    },
  });
}

// Hook para deletar transação
export function useDeleteTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("transactions")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["financial-stats"] });
      toast.success("Transação excluída!");
    },
    onError: (error) => {
      toast.error("Erro ao excluir transação: " + error.message);
    },
  });
}

// Hook para estatísticas financeiras
export function useFinancialStats(dateRange?: { start: Date; end: Date }) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["financial-stats", user?.id, dateRange],
    queryFn: async () => {
      if (!user?.id) return null;

      let query = supabase
        .from("transactions")
        .select("*")
        .eq("created_by", user.id);

      if (dateRange) {
        query = query
          .gte("due_date", dateRange.start.toISOString().split("T")[0])
          .lte("due_date", dateRange.end.toISOString().split("T")[0]);
      }

      const { data, error } = await query;
      if (error) throw error;

      const transactions = data as Transaction[];

      const income = transactions
        .filter((t) => t.type === "income")
        .reduce((acc, t) => acc + t.amount, 0);

      const expense = transactions
        .filter((t) => t.type === "expense")
        .reduce((acc, t) => acc + t.amount, 0);

      const personalExpense = transactions
        .filter((t) => t.type === "expense" && t.is_personal)
        .reduce((acc, t) => acc + t.amount, 0);

      const businessExpense = transactions
        .filter((t) => t.type === "expense" && !t.is_personal)
        .reduce((acc, t) => acc + t.amount, 0);

      const pending = transactions
        .filter((t) => t.status === "pending")
        .reduce((acc, t) => acc + t.amount, 0);

      return {
        totalIncome: income,
        totalExpense: expense,
        balance: income - expense,
        personalExpense,
        businessExpense,
        pendingAmount: pending,
        transactionsCount: transactions.length,
        savingsRate: income > 0 ? ((income - expense) / income) * 100 : 0,
      };
    },
    enabled: !!user?.id,
  });
}

// Função auxiliar para formatar moeda
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value / 100);
}
