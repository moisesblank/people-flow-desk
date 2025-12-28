// ============================================
// HOOK: Central Finanças Empresa - Estilo Softcom
// Histórico de 50+ anos, fechamento mensal/anual
// ============================================

import { useState, useEffect, useMemo, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { 
  startOfDay, endOfDay, startOfWeek, endOfWeek, 
  startOfMonth, endOfMonth, startOfYear, endOfYear,
  subDays, subWeeks, subMonths, subYears, format
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { formatCurrency as formatCurrencyCentralized } from "@/utils";

export type CompanyPeriodFilter =
  | "hoje" 
  | "semana" 
  | "mes" 
  | "ano" 
  | "10anos" 
  | "50anos"
  | "custom";

export type PaymentStatus = 'pendente' | 'pago' | 'atrasado';

export interface CompanyExpense {
  id: number;
  nome: string;
  valor: number;
  categoria: string | null;
  data?: string | null;
  ano?: number;
  mes?: number;
  semana?: number;
  dia?: number;
  fechado?: boolean;
  created_at?: string;
  updated_at?: string;
  type: 'fixed' | 'extra';
  status_pagamento?: PaymentStatus;
  data_vencimento?: string | null;
  data_pagamento?: string | null;
  observacoes_pagamento?: string | null;
  // Campos de recorrência
  recorrente?: boolean;
  is_projecao?: boolean;
  gasto_origem_id?: number | null;
  data_inicio_recorrencia?: string | null;
  data_fim_recorrencia?: string | null;
}

export interface CompanyMonthlyClosure {
  id: string;
  ano: number;
  mes: number;
  total_gastos_fixos: number;
  total_gastos_extras: number;
  total_receitas: number;
  saldo_periodo: number;
  qtd_gastos_fixos: number;
  qtd_gastos_extras: number;
  qtd_entradas: number;
  observacoes?: string;
  fechado_por?: string;
  created_at: string;
}

export interface CompanyYearlyClosure {
  id: string;
  ano: number;
  total_gastos_fixos: number;
  total_gastos_extras: number;
  total_receitas: number;
  saldo_ano: number;
  meses_fechados: number;
  qtd_total_gastos: number;
  qtd_total_entradas: number;
  melhor_mes?: number;
  pior_mes?: number;
  observacoes?: string;
  created_at: string;
}

export interface CompanyFinanceStats {
  totalGastosFixos: number;
  totalGastosExtras: number;
  totalGastos: number;
  totalReceitas: number;
  saldo: number;
  qtdGastosFixos: number;
  qtdGastosExtras: number;
  qtdEntradas: number;
  totalPago: number;
  totalPendente: number;
  totalAtrasado: number;
  qtdPago: number;
  qtdPendente: number;
  qtdAtrasado: number;
}

function getMonthName(month: number): string {
  const months = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];
  return months[month - 1] || "";
}

export function useCompanyFinanceHistory() {
  const { user } = useAuth();
  const [period, setPeriod] = useState<CompanyPeriodFilter>("mes");
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [customStartDate, setCustomStartDate] = useState<Date | null>(null);
  const [customEndDate, setCustomEndDate] = useState<Date | null>(null);
  
  const [fixedExpenses, setFixedExpenses] = useState<CompanyExpense[]>([]);
  const [extraExpenses, setExtraExpenses] = useState<CompanyExpense[]>([]);
  const [entradas, setEntradas] = useState<any[]>([]);
  const [monthlyClosures, setMonthlyClosures] = useState<CompanyMonthlyClosure[]>([]);
  const [yearlyClosures, setYearlyClosures] = useState<CompanyYearlyClosure[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);

  // Calcular range de datas baseado no período
  const dateRange = useMemo(() => {
    const now = new Date();
    let start: Date;
    let end: Date = endOfDay(now);

    switch (period) {
      case "hoje":
        start = startOfDay(now);
        break;
      case "semana":
        start = startOfWeek(now, { weekStartsOn: 0 });
        end = endOfWeek(now, { weekStartsOn: 0 });
        break;
      case "mes":
        start = startOfMonth(new Date(selectedYear, selectedMonth - 1));
        end = endOfMonth(new Date(selectedYear, selectedMonth - 1));
        break;
      case "ano":
        start = startOfYear(new Date(selectedYear, 0));
        end = endOfYear(new Date(selectedYear, 0));
        break;
      case "10anos":
        start = subYears(startOfYear(now), 10);
        break;
      case "50anos":
        start = subYears(startOfYear(now), 50);
        break;
      case "custom":
        start = customStartDate || subMonths(now, 1);
        end = customEndDate || now;
        break;
      default:
        start = startOfMonth(now);
    }

    return { start, end };
  }, [period, selectedYear, selectedMonth, customStartDate, customEndDate]);

  // Anos disponíveis (50 anos para trás e para frente)
  const availableYears = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const years: number[] = [];
    for (let y = currentYear - 50; y <= currentYear + 50; y++) {
      years.push(y);
    }
    return years;
  }, []);

  // Buscar gastos fixos COM projeção automática para meses seguintes
  const fetchFixedExpenses = useCallback(async () => {
    try {
      // Primeiro buscar todos os gastos fixos base (recorrentes)
      const { data: baseExpenses, error: baseError } = await supabase
        .from("company_fixed_expenses")
        .select("*")
        .eq("recorrente", true)
        .order("created_at", { ascending: false });

      if (baseError) throw baseError;

      // Buscar gastos específicos do período selecionado
      let query = supabase
        .from("company_fixed_expenses")
        .select("*")
        .order("created_at", { ascending: false });

      if (period === "mes") {
        query = query.eq("ano", selectedYear).eq("mes", selectedMonth);
      } else if (period === "ano") {
        query = query.eq("ano", selectedYear);
      }

      const { data: periodExpenses, error: periodError } = await query;
      if (periodError) throw periodError;

      // Gerar projeções automáticas para gastos recorrentes
      const projectedExpenses: CompanyExpense[] = [];
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth() + 1;

      // Para cada gasto recorrente base, verificar se precisa projetar
      (baseExpenses || []).forEach((base: any) => {
        // Definir range de projeção baseado no período
        let startYear = selectedYear;
        let startMonth = selectedMonth;
        let endYear = selectedYear;
        let endMonth = selectedMonth;

        if (period === "ano") {
          startMonth = 1;
          endMonth = 12;
        } else if (period === "10anos") {
          startYear = currentYear - 10;
          endYear = currentYear + 1;
          startMonth = 1;
          endMonth = 12;
        } else if (period === "50anos") {
          startYear = currentYear - 50;
          endYear = currentYear + 1;
          startMonth = 1;
          endMonth = 12;
        } else if (period === "hoje" || period === "semana") {
          startYear = currentYear;
          endYear = currentYear;
          startMonth = currentMonth;
          endMonth = currentMonth;
        }

        // Data de início da recorrência
        const recStartDate = base.data_inicio_recorrencia 
          ? new Date(base.data_inicio_recorrencia) 
          : new Date(base.ano || currentYear, (base.mes || currentMonth) - 1, 1);
        
        const recEndDate = base.data_fim_recorrencia 
          ? new Date(base.data_fim_recorrencia) 
          : null;

        // Projetar para cada mês no range
        for (let y = startYear; y <= endYear; y++) {
          const mStart = y === startYear ? startMonth : 1;
          const mEnd = y === endYear ? endMonth : 12;
          
          for (let m = mStart; m <= mEnd; m++) {
            const projDate = new Date(y, m - 1, 1);
            
            // Verificar se está dentro do período de recorrência
            if (projDate < recStartDate) continue;
            if (recEndDate && projDate > recEndDate) continue;
            
            // Verificar se já existe registro real para este mês
            const existsReal = (periodExpenses || []).some((e: any) => 
              e.nome === base.nome && 
              e.valor === base.valor && 
              e.ano === y && 
              e.mes === m
            );
            
            if (!existsReal) {
              // Criar projeção
              projectedExpenses.push({
                id: -(base.id * 10000 + y * 100 + m), // ID negativo único
                nome: base.nome,
                valor: base.valor,
                categoria: base.categoria,
                ano: y,
                mes: m,
                dia: base.dia || 1,
                semana: Math.ceil((base.dia || 1) / 7),
                status_pagamento: 'pendente',
                data_vencimento: `${y}-${String(m).padStart(2, '0')}-${String(Math.min(base.dia || 1, 28)).padStart(2, '0')}`,
                data_pagamento: null,
                type: 'fixed',
                recorrente: true,
                is_projecao: true,
                gasto_origem_id: base.id,
                created_at: base.created_at,
              });
            }
          }
        }
      });

      // Combinar gastos reais + projeções
      const allExpenses = [
        ...(periodExpenses || []).map((e: any) => ({
          ...e,
          type: 'fixed' as const,
          is_projecao: false,
        })),
        ...projectedExpenses
      ];

      // Remover duplicatas (preferir reais sobre projeções)
      const uniqueMap = new Map<string, CompanyExpense>();
      allExpenses.forEach(exp => {
        const key = `${exp.nome}-${exp.valor}-${exp.ano}-${exp.mes}`;
        const existing = uniqueMap.get(key);
        if (!existing || (existing.is_projecao && !exp.is_projecao)) {
          uniqueMap.set(key, exp);
        }
      });

      setFixedExpenses(Array.from(uniqueMap.values()));
    } catch (error) {
      console.error("Error fetching fixed expenses:", error);
    }
  }, [period, selectedYear, selectedMonth]);

  // Buscar gastos extras
  const fetchExtraExpenses = useCallback(async () => {
    try {
      let query = supabase
        .from("company_extra_expenses")
        .select("*")
        .order("data", { ascending: false });

      if (period === "mes") {
        query = query.eq("ano", selectedYear).eq("mes", selectedMonth);
      } else if (period === "ano") {
        query = query.eq("ano", selectedYear);
      } else if (period !== "50anos" && period !== "10anos") {
        query = query
          .gte("data", format(dateRange.start, "yyyy-MM-dd"))
          .lte("data", format(dateRange.end, "yyyy-MM-dd"));
      }

      const { data, error } = await query;
      if (error) throw error;

      setExtraExpenses((data || []).map((e: any) => ({
        ...e,
        type: 'extra' as const
      })));
    } catch (error) {
      console.error("Error fetching extra expenses:", error);
    }
  }, [period, selectedYear, selectedMonth, dateRange]);

  // Buscar entradas/receitas
  const fetchEntradas = useCallback(async () => {
    try {
      let query = supabase
        .from("entradas")
        .select("*")
        .order("created_at", { ascending: false });

      if (period !== "50anos" && period !== "10anos") {
        query = query
          .gte("created_at", dateRange.start.toISOString())
          .lte("created_at", dateRange.end.toISOString());
      }

      const { data, error } = await query;
      if (error) throw error;

      setEntradas(data || []);
    } catch (error) {
      console.error("Error fetching entradas:", error);
    }
  }, [period, dateRange]);

  // Buscar fechamentos mensais
  const fetchMonthlyClosures = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("company_monthly_closures")
        .select("*")
        .order("ano", { ascending: false })
        .order("mes", { ascending: false });

      if (error) throw error;
      setMonthlyClosures(data || []);
    } catch (error) {
      console.error("Error fetching monthly closures:", error);
    }
  }, []);

  // Buscar fechamentos anuais
  const fetchYearlyClosures = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("company_yearly_closures")
        .select("*")
        .order("ano", { ascending: false });

      if (error) throw error;
      setYearlyClosures(data || []);
    } catch (error) {
      console.error("Error fetching yearly closures:", error);
    }
  }, []);

  // Estatísticas do período atual
  const stats = useMemo((): CompanyFinanceStats => {
    const allExpenses = [...fixedExpenses, ...extraExpenses];
    const totalGastosFixos = fixedExpenses.reduce((acc, e) => acc + (e.valor || 0), 0);
    const totalGastosExtras = extraExpenses.reduce((acc, e) => acc + (e.valor || 0), 0);
    const totalReceitas = entradas.reduce((acc, e) => acc + (e.valor || 0), 0);
    
    // Cálculos por status de pagamento
    const pagoExpenses = allExpenses.filter(e => e.status_pagamento === 'pago');
    const pendenteExpenses = allExpenses.filter(e => e.status_pagamento === 'pendente' || !e.status_pagamento);
    const atrasadoExpenses = allExpenses.filter(e => e.status_pagamento === 'atrasado');

    return {
      totalGastosFixos,
      totalGastosExtras,
      totalGastos: totalGastosFixos + totalGastosExtras,
      totalReceitas,
      saldo: totalReceitas - (totalGastosFixos + totalGastosExtras),
      qtdGastosFixos: fixedExpenses.length,
      qtdGastosExtras: extraExpenses.length,
      qtdEntradas: entradas.length,
      totalPago: pagoExpenses.reduce((acc, e) => acc + (e.valor || 0), 0),
      totalPendente: pendenteExpenses.reduce((acc, e) => acc + (e.valor || 0), 0),
      totalAtrasado: atrasadoExpenses.reduce((acc, e) => acc + (e.valor || 0), 0),
      qtdPago: pagoExpenses.length,
      qtdPendente: pendenteExpenses.length,
      qtdAtrasado: atrasadoExpenses.length
    };
  }, [fixedExpenses, extraExpenses, entradas]);

  // Fechar mês
  const closeMonth = useCallback(async (ano: number, mes: number) => {
    try {
      // Buscar dados do mês
      const [fixedRes, extraRes, entradasRes] = await Promise.all([
        supabase.from("company_fixed_expenses").select("valor").eq("ano", ano).eq("mes", mes),
        supabase.from("company_extra_expenses").select("valor").eq("ano", ano).eq("mes", mes),
        supabase.from("entradas").select("valor")
          .gte("created_at", new Date(ano, mes - 1, 1).toISOString())
          .lt("created_at", new Date(ano, mes, 1).toISOString())
      ]);

      const totalGastosFixos = (fixedRes.data || []).reduce((acc, e: any) => acc + (e.valor || 0), 0);
      const totalGastosExtras = (extraRes.data || []).reduce((acc, e: any) => acc + (e.valor || 0), 0);
      const totalReceitas = (entradasRes.data || []).reduce((acc, e: any) => acc + (e.valor || 0), 0);

      const { error } = await supabase
        .from("company_monthly_closures")
        .upsert({
          ano,
          mes,
          total_gastos_fixos: totalGastosFixos,
          total_gastos_extras: totalGastosExtras,
          total_receitas: totalReceitas,
          saldo_periodo: totalReceitas - totalGastosFixos - totalGastosExtras,
          qtd_gastos_fixos: fixedRes.data?.length || 0,
          qtd_gastos_extras: extraRes.data?.length || 0,
          qtd_entradas: entradasRes.data?.length || 0,
          fechado_por: user?.id
        }, { onConflict: 'ano,mes' });

      if (error) throw error;

      // Marcar gastos como fechados
      await Promise.all([
        supabase.from("company_fixed_expenses")
          .update({ fechado: true, data_fechamento: new Date().toISOString(), fechado_por: user?.id })
          .eq("ano", ano).eq("mes", mes),
        supabase.from("company_extra_expenses")
          .update({ fechado: true, data_fechamento: new Date().toISOString(), fechado_por: user?.id })
          .eq("ano", ano).eq("mes", mes)
      ]);

      toast.success(`Mês ${getMonthName(mes)}/${ano} fechado com sucesso!`);
      await fetchMonthlyClosures();
    } catch (error: any) {
      console.error("Error closing month:", error);
      toast.error(error.message || "Erro ao fechar mês");
    }
  }, [user, fetchMonthlyClosures]);

  // Fechar ano
  const closeYear = useCallback(async (ano: number) => {
    try {
      // Buscar todos os fechamentos mensais do ano
      const { data: closures } = await supabase
        .from("company_monthly_closures")
        .select("*")
        .eq("ano", ano);

      if (!closures || closures.length === 0) {
        toast.error("Nenhum mês fechado neste ano. Feche os meses primeiro.");
        return;
      }

      const totalGastosFixos = closures.reduce((acc, c) => acc + (Number(c.total_gastos_fixos) || 0), 0);
      const totalGastosExtras = closures.reduce((acc, c) => acc + (Number(c.total_gastos_extras) || 0), 0);
      const totalReceitas = closures.reduce((acc, c) => acc + (Number(c.total_receitas) || 0), 0);
      const saldoAno = closures.reduce((acc, c) => acc + (Number(c.saldo_periodo) || 0), 0);

      // Encontrar melhor e pior mês
      let melhorMes = closures[0]?.mes;
      let piorMes = closures[0]?.mes;
      let melhorSaldo = Number(closures[0]?.saldo_periodo) || 0;
      let piorSaldo = Number(closures[0]?.saldo_periodo) || 0;

      closures.forEach(c => {
        const saldo = Number(c.saldo_periodo) || 0;
        if (saldo > melhorSaldo) {
          melhorSaldo = saldo;
          melhorMes = c.mes;
        }
        if (saldo < piorSaldo) {
          piorSaldo = saldo;
          piorMes = c.mes;
        }
      });

      const { error } = await supabase
        .from("company_yearly_closures")
        .upsert({
          ano,
          total_gastos_fixos: totalGastosFixos,
          total_gastos_extras: totalGastosExtras,
          total_receitas: totalReceitas,
          saldo_ano: saldoAno,
          meses_fechados: closures.length,
          qtd_total_gastos: closures.reduce((acc, c) => acc + (c.qtd_gastos_fixos || 0) + (c.qtd_gastos_extras || 0), 0),
          qtd_total_entradas: closures.reduce((acc, c) => acc + (c.qtd_entradas || 0), 0),
          melhor_mes: melhorMes,
          pior_mes: piorMes,
          fechado_por: user?.id
        }, { onConflict: 'ano' });

      if (error) throw error;

      toast.success(`Ano ${ano} consolidado com sucesso!`);
      await fetchYearlyClosures();
    } catch (error: any) {
      console.error("Error closing year:", error);
      toast.error(error.message || "Erro ao consolidar ano");
    }
  }, [user, fetchYearlyClosures]);

  // Verificar se mês está fechado
  const isMonthClosed = useCallback((ano: number, mes: number) => {
    return monthlyClosures.some(c => c.ano === ano && c.mes === mes);
  }, [monthlyClosures]);

  // Verificar se ano está fechado
  const isYearClosed = useCallback((ano: number) => {
    return yearlyClosures.some(c => c.ano === ano);
  }, [yearlyClosures]);

  // Obter fechamento do mês
  const getMonthClosure = useCallback((ano: number, mes: number) => {
    return monthlyClosures.find(c => c.ano === ano && c.mes === mes);
  }, [monthlyClosures]);

  // Obter fechamento do ano
  const getYearClosure = useCallback((ano: number) => {
    return yearlyClosures.find(c => c.ano === ano);
  }, [yearlyClosures]);

  // Anos com dados
  const yearsWithData = useMemo(() => {
    const years = new Set<number>();
    fixedExpenses.forEach(e => e.ano && years.add(e.ano));
    extraExpenses.forEach(e => e.ano && years.add(e.ano));
    monthlyClosures.forEach(c => years.add(c.ano));
    yearlyClosures.forEach(c => years.add(c.ano));
    return Array.from(years).sort((a, b) => b - a);
  }, [fixedExpenses, extraExpenses, monthlyClosures, yearlyClosures]);

  // Meses com dados para um ano
  const getMonthsWithData = useCallback((ano: number) => {
    const months = new Set<number>();
    fixedExpenses.filter(e => e.ano === ano).forEach(e => e.mes && months.add(e.mes));
    extraExpenses.filter(e => e.ano === ano).forEach(e => e.mes && months.add(e.mes));
    monthlyClosures.filter(c => c.ano === ano).forEach(c => months.add(c.mes));
    return Array.from(months).sort((a, b) => a - b);
  }, [fixedExpenses, extraExpenses, monthlyClosures]);

  // Dados para gráfico
  const chartData = useMemo(() => {
    // Usar fechamentos mensais se disponíveis
    if (monthlyClosures.length > 0) {
      return monthlyClosures
        .filter(c => {
          if (period === "ano") return c.ano === selectedYear;
          if (period === "10anos") return c.ano >= new Date().getFullYear() - 10;
          if (period === "50anos") return true;
          return true;
        })
        .slice(0, 24)
        .reverse()
        .map(c => ({
          label: `${String(c.mes).padStart(2, "0")}/${c.ano}`,
          receitas: Number(c.total_receitas) / 100,
          despesas: (Number(c.total_gastos_fixos) + Number(c.total_gastos_extras)) / 100,
          saldo: Number(c.saldo_periodo) / 100
        }));
    }

    // Fallback: calcular a partir dos dados
    const months: Record<string, { receitas: number; despesas: number }> = {};
    
    extraExpenses.forEach(e => {
      if (e.ano && e.mes) {
        const key = `${String(e.mes).padStart(2, "0")}/${e.ano}`;
        if (!months[key]) months[key] = { receitas: 0, despesas: 0 };
        months[key].despesas += e.valor / 100;
      }
    });

    fixedExpenses.forEach(e => {
      if (e.ano && e.mes) {
        const key = `${String(e.mes).padStart(2, "0")}/${e.ano}`;
        if (!months[key]) months[key] = { receitas: 0, despesas: 0 };
        months[key].despesas += e.valor / 100;
      }
    });

    entradas.forEach(e => {
      const date = new Date(e.created_at);
      const key = `${String(date.getMonth() + 1).padStart(2, "0")}/${date.getFullYear()}`;
      if (!months[key]) months[key] = { receitas: 0, despesas: 0 };
      months[key].receitas += (e.valor || 0) / 100;
    });

    return Object.entries(months)
      .map(([label, data]) => ({
        label,
        receitas: data.receitas,
        despesas: data.despesas,
        saldo: data.receitas - data.despesas
      }))
      .sort((a, b) => {
        const [mA, yA] = a.label.split("/").map(Number);
        const [mB, yB] = b.label.split("/").map(Number);
        return yA === yB ? mA - mB : yA - yB;
      })
      .slice(-12);
  }, [monthlyClosures, fixedExpenses, extraExpenses, entradas, period, selectedYear]);

  // Carregar dados
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([
        fetchFixedExpenses(),
        fetchExtraExpenses(),
        fetchEntradas(),
        fetchMonthlyClosures(),
        fetchYearlyClosures()
      ]);
      setIsLoading(false);
    };
    loadData();
  }, [fetchFixedExpenses, fetchExtraExpenses, fetchEntradas, fetchMonthlyClosures, fetchYearlyClosures]);

  // Realtime subscriptions
  useEffect(() => {
    const channel = supabase
      .channel('company-finance-history-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'company_fixed_expenses' }, () => {
        fetchFixedExpenses();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'company_extra_expenses' }, () => {
        fetchExtraExpenses();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'entradas' }, () => {
        fetchEntradas();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'company_monthly_closures' }, () => {
        fetchMonthlyClosures();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'company_yearly_closures' }, () => {
        fetchYearlyClosures();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchFixedExpenses, fetchExtraExpenses, fetchEntradas, fetchMonthlyClosures, fetchYearlyClosures]);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    await Promise.all([
      fetchFixedExpenses(),
      fetchExtraExpenses(),
      fetchEntradas(),
      fetchMonthlyClosures(),
      fetchYearlyClosures()
    ]);
    setIsLoading(false);
  }, [fetchFixedExpenses, fetchExtraExpenses, fetchEntradas, fetchMonthlyClosures, fetchYearlyClosures]);

  // Atualizar status de pagamento de um gasto
  const updatePaymentStatus = useCallback(async (
    expense: CompanyExpense, 
    newStatus: PaymentStatus
  ) => {
    const table = expense.type === 'fixed' ? 'company_fixed_expenses' : 'company_extra_expenses';
    
    try {
      const updateData: any = {
        status_pagamento: newStatus,
        updated_at: new Date().toISOString()
      };
      
      if (newStatus === 'pago') {
        updateData.data_pagamento = new Date().toISOString();
      }
      
      const { error } = await supabase
        .from(table)
        .update(updateData)
        .eq('id', expense.id);
      
      if (error) throw error;
      
      toast.success(
        newStatus === 'pago' 
          ? `✅ "${expense.nome}" marcado como PAGO!` 
          : `⏳ "${expense.nome}" marcado como ${newStatus.toUpperCase()}`
      );
      
      await refresh();
    } catch (error: any) {
      console.error('Error updating payment status:', error);
      toast.error(error.message || 'Erro ao atualizar status');
    }
  }, [refresh]);

  // Materializar projeção (criar registro real a partir de uma projeção)
  const materializeProjection = useCallback(async (expense: CompanyExpense) => {
    if (!expense.is_projecao || !expense.gasto_origem_id) {
      toast.error('Este não é um gasto projetado');
      return null;
    }

    try {
      // Buscar gasto original
      const { data: original, error: origError } = await supabase
        .from('company_fixed_expenses')
        .select('*')
        .eq('id', expense.gasto_origem_id)
        .single();

      if (origError || !original) {
        throw new Error('Gasto original não encontrado');
      }

      // Criar registro real
      const { data: newExpense, error: insertError } = await supabase
        .from('company_fixed_expenses')
        .insert({
          nome: original.nome,
          valor: original.valor,
          categoria: original.categoria,
          ano: expense.ano,
          mes: expense.mes,
          dia: original.dia || 1,
          semana: Math.ceil((original.dia || 1) / 7),
          status_pagamento: 'pendente',
          data_vencimento: expense.data_vencimento,
          recorrente: true,
          gasto_origem_id: original.id,
          is_projecao: false,
          created_by: original.created_by,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      toast.success(`✅ Gasto "${original.nome}" criado para ${expense.mes}/${expense.ano}`);
      await refresh();
      return newExpense;
    } catch (error: any) {
      console.error('Error materializing projection:', error);
      toast.error(error.message || 'Erro ao criar gasto');
      return null;
    }
  }, [refresh]);

  return {
    // Estado
    period,
    setPeriod,
    selectedYear,
    setSelectedYear,
    selectedMonth,
    setSelectedMonth,
    customStartDate,
    setCustomStartDate,
    customEndDate,
    setCustomEndDate,
    isLoading,
    
    // Dados
    fixedExpenses,
    extraExpenses,
    entradas,
    monthlyClosures,
    yearlyClosures,
    stats,
    chartData,
    dateRange,
    availableYears,
    
    // Ações
    closeMonth,
    closeYear,
    refresh,
    updatePaymentStatus,
    materializeProjection,
    
    // Helpers
    isMonthClosed,
    isYearClosed,
    getMonthClosure,
    getYearClosure,
    yearsWithData,
    getMonthsWithData,
    getMonthName
  };
}

// Re-exporta de @/utils (CONSTITUIÇÃO v10.x)
export { formatCurrencyCentralized as formatCompanyCurrency };