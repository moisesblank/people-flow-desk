// ============================================
// HOOK: HISTÓRICO DE PAGAMENTOS COMPLETO
// Sistema estilo Softcom com fechamento de mês/ano
// Suporte a 50 anos de histórico
// ============================================

import { useState, useEffect, useMemo, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { formatCurrency as formatCurrencyCentralized } from "@/utils";
import { 
  format, 
  startOfDay, 
  endOfDay, 
  startOfWeek, 
  endOfWeek, 
  startOfMonth, 
  endOfMonth, 
  startOfYear, 
  endOfYear,
  subYears, 
  addYears,
  parseISO,
  isPast,
  isToday
} from "date-fns";
import { ptBR } from "date-fns/locale";

export type PaymentPeriodFilter = "diario" | "semanal" | "mensal" | "anual" | "10anos" | "50anos" | "custom";

export interface Payment {
  id: string;
  tipo: string;
  descricao: string;
  valor: number;
  data_vencimento: string;
  data_pagamento: string | null;
  status: string;
  metodo_pagamento: string | null;
  comprovante_url: string | null;
  observacoes: string | null;
  recorrente: boolean;
  created_at: string;
  categoria: string | null;
  ano?: number;
  mes?: number;
  semana?: number;
  dia?: number;
  fechado?: boolean;
}

export interface MonthlyPaymentClosure {
  id: string;
  ano: number;
  mes: number;
  tipo: string;
  total_pagamentos: number;
  total_valor_pago: number;
  total_valor_pendente: number;
  total_valor_atrasado: number;
  total_pago: number;
  total_pendente: number;
  total_atrasado: number;
  total_cancelado: number;
  resumo_por_tipo: Record<string, number>;
  resumo_por_metodo: Record<string, number>;
  is_fechado: boolean;
  fechado_em: string | null;
  observacoes: string | null;
}

export interface YearlyPaymentClosure {
  id: string;
  ano: number;
  total_meses_fechados: number;
  total_pagamentos: number;
  total_valor_pago: number;
  total_valor_geral: number;
  media_mensal: number;
  melhor_mes: number | null;
  melhor_mes_valor: number;
  pior_mes: number | null;
  pior_mes_valor: number;
  resumo_por_tipo: Record<string, number>;
  resumo_por_metodo: Record<string, number>;
  is_fechado: boolean;
}

export interface PaymentStats {
  totalPendente: number;
  totalPago: number;
  totalAtrasado: number;
  totalCancelado: number;
  valorPendente: number;
  valorPago: number;
  valorAtrasado: number;
  countTotal: number;
}

const MONTH_NAMES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

export function getMonthName(month: number): string {
  return MONTH_NAMES[month - 1] || "";
}

export function usePaymentsHistory() {
  const { user } = useAuth();
  const [period, setPeriod] = useState<PaymentPeriodFilter>("mensal");
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [customRange, setCustomRange] = useState<{ start: Date; end: Date }>({
    start: startOfMonth(new Date()),
    end: endOfMonth(new Date()),
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [monthlyClosures, setMonthlyClosures] = useState<MonthlyPaymentClosure[]>([]);
  const [yearlyClosures, setYearlyClosures] = useState<YearlyPaymentClosure[]>([]);

  // Calcular range de datas baseado no período
  const dateRange = useMemo(() => {
    const now = new Date();
    switch (period) {
      case "diario":
        return { start: startOfDay(now), end: endOfDay(now) };
      case "semanal":
        return { start: startOfWeek(now, { locale: ptBR }), end: endOfWeek(now, { locale: ptBR }) };
      case "mensal":
        const monthDate = new Date(selectedYear, selectedMonth - 1, 1);
        return { start: startOfMonth(monthDate), end: endOfMonth(monthDate) };
      case "anual":
        const yearDate = new Date(selectedYear, 0, 1);
        return { start: startOfYear(yearDate), end: endOfYear(yearDate) };
      case "10anos":
        return { start: subYears(startOfYear(now), 9), end: endOfYear(now) };
      case "50anos":
        return { start: subYears(startOfYear(now), 49), end: addYears(endOfYear(now), 0) };
      case "custom":
        return customRange;
      default:
        return { start: startOfMonth(now), end: endOfMonth(now) };
    }
  }, [period, selectedYear, selectedMonth, customRange]);

  // Anos disponíveis (50 anos pra frente e pra trás)
  const availableYears = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const years: number[] = [];
    for (let i = currentYear - 10; i <= currentYear + 50; i++) {
      years.push(i);
    }
    return years;
  }, []);

  // Buscar pagamentos do período
  const fetchPayments = useCallback(async () => {
    if (!user?.id) return;

    try {
      let query = supabase
        .from("payments")
        .select("*")
        .gte("data_vencimento", format(dateRange.start, "yyyy-MM-dd"))
        .lte("data_vencimento", format(dateRange.end, "yyyy-MM-dd"))
        .order("data_vencimento", { ascending: false });

      const { data, error } = await query;
      if (error) throw error;

      // Auto-update status de atrasados
      const updated = (data || []).map(p => {
        if (p.status === "pendente" && isPast(new Date(p.data_vencimento)) && !isToday(new Date(p.data_vencimento))) {
          return { ...p, status: "atrasado" };
        }
        return p;
      }) as Payment[];

      setPayments(updated);
    } catch (error) {
      console.error("Error fetching payments:", error);
    }
  }, [user?.id, dateRange]);

  // Buscar fechamentos mensais
  const fetchMonthlyClosures = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("payments_monthly_closures")
        .select("*")
        .order("ano", { ascending: false })
        .order("mes", { ascending: false });

      if (error) throw error;
      setMonthlyClosures((data || []) as MonthlyPaymentClosure[]);
    } catch (error) {
      console.error("Error fetching monthly closures:", error);
    }
  }, []);

  // Buscar fechamentos anuais
  const fetchYearlyClosures = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("payments_yearly_closures")
        .select("*")
        .order("ano", { ascending: false });

      if (error) throw error;
      setYearlyClosures((data || []) as YearlyPaymentClosure[]);
    } catch (error) {
      console.error("Error fetching yearly closures:", error);
    }
  }, []);

  // Estatísticas do período
  const stats = useMemo((): PaymentStats => {
    const pendentes = payments.filter(p => p.status === "pendente");
    const pagos = payments.filter(p => p.status === "pago");
    const atrasados = payments.filter(p => p.status === "atrasado");
    const cancelados = payments.filter(p => p.status === "cancelado");

    return {
      totalPendente: pendentes.length,
      totalPago: pagos.length,
      totalAtrasado: atrasados.length,
      totalCancelado: cancelados.length,
      valorPendente: pendentes.reduce((acc, p) => acc + p.valor, 0),
      valorPago: pagos.reduce((acc, p) => acc + p.valor, 0),
      valorAtrasado: atrasados.reduce((acc, p) => acc + p.valor, 0),
      countTotal: payments.length,
    };
  }, [payments]);

  // Fechar mês
  const closeMonth = useCallback(async (ano: number, mes: number) => {
    if (!user?.id) return;

    try {
      // Buscar pagamentos do mês
      const monthStart = new Date(ano, mes - 1, 1);
      const monthEnd = endOfMonth(monthStart);

      const { data: monthPayments } = await supabase
        .from("payments")
        .select("*")
        .gte("data_vencimento", format(monthStart, "yyyy-MM-dd"))
        .lte("data_vencimento", format(monthEnd, "yyyy-MM-dd"));

      if (!monthPayments || monthPayments.length === 0) {
        toast.error("Nenhum pagamento encontrado neste mês");
        return;
      }

      const pagos = monthPayments.filter(p => p.status === "pago");
      const pendentes = monthPayments.filter(p => p.status === "pendente");
      const atrasados = monthPayments.filter(p => p.status === "atrasado");
      const cancelados = monthPayments.filter(p => p.status === "cancelado");

      // Resumo por tipo
      const resumoPorTipo: Record<string, number> = {};
      monthPayments.forEach(p => {
        resumoPorTipo[p.tipo] = (resumoPorTipo[p.tipo] || 0) + p.valor;
      });

      // Resumo por método
      const resumoPorMetodo: Record<string, number> = {};
      pagos.forEach(p => {
        if (p.metodo_pagamento) {
          resumoPorMetodo[p.metodo_pagamento] = (resumoPorMetodo[p.metodo_pagamento] || 0) + p.valor;
        }
      });

      const closureData = {
        ano,
        mes,
        tipo: 'all',
        total_pagamentos: monthPayments.length,
        total_valor_pago: pagos.reduce((acc, p) => acc + p.valor, 0),
        total_valor_pendente: pendentes.reduce((acc, p) => acc + p.valor, 0),
        total_valor_atrasado: atrasados.reduce((acc, p) => acc + p.valor, 0),
        total_pago: pagos.length,
        total_pendente: pendentes.length,
        total_atrasado: atrasados.length,
        total_cancelado: cancelados.length,
        resumo_por_tipo: resumoPorTipo,
        resumo_por_metodo: resumoPorMetodo,
        is_fechado: true,
        fechado_em: new Date().toISOString(),
        fechado_por: user.id,
      };

      const { error } = await supabase
        .from("payments_monthly_closures")
        .upsert(closureData, { onConflict: "ano,mes,tipo" });

      if (error) throw error;

      // Marcar pagamentos como fechados
      await supabase
        .from("payments")
        .update({ fechado: true, data_fechamento: new Date().toISOString(), fechado_por: user.id })
        .gte("data_vencimento", format(monthStart, "yyyy-MM-dd"))
        .lte("data_vencimento", format(monthEnd, "yyyy-MM-dd"));

      toast.success(`Mês ${getMonthName(mes)}/${ano} fechado com sucesso!`);
      await fetchMonthlyClosures();
      await fetchPayments();
    } catch (error: any) {
      console.error("Error closing month:", error);
      toast.error("Erro ao fechar mês: " + error.message);
    }
  }, [user?.id, fetchMonthlyClosures, fetchPayments]);

  // Consolidar ano
  const closeYear = useCallback(async (ano: number) => {
    if (!user?.id) return;

    try {
      // Buscar todos os fechamentos mensais do ano
      const yearClosures = monthlyClosures.filter(c => c.ano === ano);

      if (yearClosures.length === 0) {
        toast.error("Nenhum mês fechado neste ano");
        return;
      }

      const totalValorPago = yearClosures.reduce((acc, c) => acc + (c.total_valor_pago || 0), 0);
      const totalValorGeral = yearClosures.reduce((acc, c) => 
        acc + (c.total_valor_pago || 0) + (c.total_valor_pendente || 0) + (c.total_valor_atrasado || 0), 0);
      const totalPagamentos = yearClosures.reduce((acc, c) => acc + (c.total_pagamentos || 0), 0);

      // Encontrar melhor e pior mês
      const sorted = [...yearClosures].sort((a, b) => (b.total_valor_pago || 0) - (a.total_valor_pago || 0));
      const melhor = sorted[0];
      const pior = sorted[sorted.length - 1];

      // Agregar resumos
      const resumoPorTipo: Record<string, number> = {};
      const resumoPorMetodo: Record<string, number> = {};
      yearClosures.forEach(c => {
        Object.entries(c.resumo_por_tipo || {}).forEach(([key, val]) => {
          resumoPorTipo[key] = (resumoPorTipo[key] || 0) + (val as number);
        });
        Object.entries(c.resumo_por_metodo || {}).forEach(([key, val]) => {
          resumoPorMetodo[key] = (resumoPorMetodo[key] || 0) + (val as number);
        });
      });

      const yearData = {
        ano,
        total_meses_fechados: yearClosures.length,
        total_pagamentos: totalPagamentos,
        total_valor_pago: totalValorPago,
        total_valor_geral: totalValorGeral,
        media_mensal: yearClosures.length > 0 ? Math.round(totalValorPago / yearClosures.length) : 0,
        melhor_mes: melhor?.mes || null,
        melhor_mes_valor: melhor?.total_valor_pago || 0,
        pior_mes: pior?.mes || null,
        pior_mes_valor: pior?.total_valor_pago || 0,
        resumo_por_tipo: resumoPorTipo,
        resumo_por_metodo: resumoPorMetodo,
        is_fechado: true,
        fechado_em: new Date().toISOString(),
        fechado_por: user.id,
      };

      const { error } = await supabase
        .from("payments_yearly_closures")
        .upsert(yearData, { onConflict: "ano" });

      if (error) throw error;

      toast.success(`Ano ${ano} consolidado com sucesso!`);
      await fetchYearlyClosures();
    } catch (error: any) {
      console.error("Error closing year:", error);
      toast.error("Erro ao consolidar ano: " + error.message);
    }
  }, [user?.id, monthlyClosures, fetchYearlyClosures]);

  // Verificar se mês está fechado
  const isMonthClosed = useCallback((ano: number, mes: number): boolean => {
    return monthlyClosures.some(c => c.ano === ano && c.mes === mes && c.is_fechado);
  }, [monthlyClosures]);

  // Verificar se ano está fechado
  const isYearClosed = useCallback((ano: number): boolean => {
    return yearlyClosures.some(c => c.ano === ano && c.is_fechado);
  }, [yearlyClosures]);

  // Obter closure de um mês específico
  const getMonthClosure = useCallback((ano: number, mes: number): MonthlyPaymentClosure | undefined => {
    return monthlyClosures.find(c => c.ano === ano && c.mes === mes);
  }, [monthlyClosures]);

  // Obter closure de um ano específico
  const getYearClosure = useCallback((ano: number): YearlyPaymentClosure | undefined => {
    return yearlyClosures.find(c => c.ano === ano);
  }, [yearlyClosures]);

  // Anos com dados
  const yearsWithData = useMemo(() => {
    const years = new Set<number>();
    payments.forEach(p => {
      const year = new Date(p.data_vencimento).getFullYear();
      years.add(year);
    });
    monthlyClosures.forEach(c => years.add(c.ano));
    yearlyClosures.forEach(c => years.add(c.ano));
    return Array.from(years).sort((a, b) => b - a);
  }, [payments, monthlyClosures, yearlyClosures]);

  // Meses com dados para um ano específico
  const getMonthsWithData = useCallback((ano: number) => {
    const months = new Set<number>();
    payments
      .filter(p => new Date(p.data_vencimento).getFullYear() === ano)
      .forEach(p => months.add(new Date(p.data_vencimento).getMonth() + 1));
    monthlyClosures
      .filter(c => c.ano === ano)
      .forEach(c => months.add(c.mes));
    return Array.from(months).sort((a, b) => b - a);
  }, [payments, monthlyClosures]);

  // Carregar dados
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([
        fetchPayments(),
        fetchMonthlyClosures(),
        fetchYearlyClosures(),
      ]);
      setIsLoading(false);
    };

    if (user?.id) {
      loadData();
    }
  }, [user?.id, fetchPayments, fetchMonthlyClosures, fetchYearlyClosures]);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('payments-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'payments' }, () => {
        fetchPayments();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'payments_monthly_closures' }, () => {
        fetchMonthlyClosures();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'payments_yearly_closures' }, () => {
        fetchYearlyClosures();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchPayments, fetchMonthlyClosures, fetchYearlyClosures]);

  return {
    // Estado
    period,
    setPeriod,
    selectedYear,
    setSelectedYear,
    selectedMonth,
    setSelectedMonth,
    customRange,
    setCustomRange,
    dateRange,
    isLoading,
    
    // Dados
    payments,
    monthlyClosures,
    yearlyClosures,
    stats,
    
    // Listas
    availableYears,
    yearsWithData,
    getMonthsWithData,
    
    // Ações
    closeMonth,
    closeYear,
    isMonthClosed,
    isYearClosed,
    getMonthClosure,
    getYearClosure,
    
    // Refresh
    refresh: async () => {
      setIsLoading(true);
      await Promise.all([
        fetchPayments(),
        fetchMonthlyClosures(),
        fetchYearlyClosures(),
      ]);
      setIsLoading(false);
    },
  };
}

// Re-exporta de @/utils (CONSTITUIÇÃO v10.x)
export { formatCurrencyCentralized as formatPaymentCurrency };
