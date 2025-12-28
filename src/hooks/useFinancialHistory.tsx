// ============================================
// HOOK: HISTÓRICO FINANCEIRO DE LONGO PRAZO
// Controle diário, semanal, mensal e 10 anos
// ============================================

import { useState, useEffect, useMemo, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, subYears, addMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { formatCurrency as formatCurrencyCentralized } from "@/utils";

export type PeriodFilter = "diario" | "semanal" | "mensal" | "anual" | "10anos" | "custom";

interface MonthlySnapshot {
  id: string;
  ano: number;
  mes: number;
  receitas_total: number;
  despesas_fixas_total: number;
  despesas_extras_total: number;
  despesas_total: number;
  saldo_periodo: number;
  despesas_por_categoria: Record<string, number>;
  is_fechado: boolean;
}

interface YearlySummary {
  id: string;
  ano: number;
  receitas_total: number;
  despesas_total: number;
  saldo_anual: number;
  media_receitas_mensal: number;
  media_despesas_mensal: number;
  melhor_mes: number;
  melhor_mes_valor: number;
  pior_mes: number;
  pior_mes_valor: number;
  meses_fechados: number;
}

interface ExpenseData {
  id: number;
  nome: string;
  valor: number;
  categoria: string;
  data: string;
  created_at: string;
}

interface HistoryStats {
  totalReceitas: number;
  totalDespesas: number;
  saldo: number;
  mediaMensal: number;
  tendencia: "up" | "down" | "stable";
  variacaoPercent: number;
}

export function useFinancialHistory() {
  const { user } = useAuth();
  const [period, setPeriod] = useState<PeriodFilter>("mensal");
  const [customRange, setCustomRange] = useState<{ start: Date; end: Date }>({
    start: startOfMonth(new Date()),
    end: endOfMonth(new Date()),
  });
  const [isLoading, setIsLoading] = useState(true);
  const [snapshots, setSnapshots] = useState<MonthlySnapshot[]>([]);
  const [yearlySummaries, setYearlySummaries] = useState<YearlySummary[]>([]);
  const [currentPeriodExpenses, setCurrentPeriodExpenses] = useState<ExpenseData[]>([]);

  // Calcular range de datas baseado no período
  const dateRange = useMemo(() => {
    const now = new Date();
    switch (period) {
      case "diario":
        return { start: startOfDay(now), end: endOfDay(now) };
      case "semanal":
        return { start: startOfWeek(now, { locale: ptBR }), end: endOfWeek(now, { locale: ptBR }) };
      case "mensal":
        return { start: startOfMonth(now), end: endOfMonth(now) };
      case "anual":
        return { start: startOfYear(now), end: endOfYear(now) };
      case "10anos":
        return { start: subYears(startOfYear(now), 9), end: endOfYear(now) };
      case "custom":
        return customRange;
      default:
        return { start: startOfMonth(now), end: endOfMonth(now) };
    }
  }, [period, customRange]);

  // Buscar despesas do período atual
  const fetchCurrentPeriodExpenses = useCallback(async () => {
    if (!user?.id) return;

    try {
      const { data: fixedData } = await supabase
        .from("personal_fixed_expenses")
        .select("*")
        .order("nome");

      const { data: extraData } = await supabase
        .from("personal_extra_expenses")
        .select("*")
        .gte("data", format(dateRange.start, "yyyy-MM-dd"))
        .lte("data", format(dateRange.end, "yyyy-MM-dd"))
        .order("data", { ascending: false });

      const allExpenses: ExpenseData[] = [
        ...(fixedData || []).map((e: any) => ({
          id: e.id,
          nome: e.nome,
          valor: e.valor,
          categoria: e.categoria || "outros",
          data: format(new Date(), "yyyy-MM-dd"),
          created_at: e.created_at,
        })),
        ...(extraData || []).map((e: any) => ({
          id: e.id,
          nome: e.nome,
          valor: e.valor,
          categoria: e.categoria || "outros",
          data: e.data || format(new Date(e.created_at), "yyyy-MM-dd"),
          created_at: e.created_at,
        })),
      ];

      setCurrentPeriodExpenses(allExpenses);
    } catch (error) {
      console.error("Error fetching period expenses:", error);
    }
  }, [user?.id, dateRange]);

  // Buscar snapshots mensais (calculado localmente até tipos serem gerados)
  const fetchSnapshots = useCallback(async () => {
    if (!user?.id) return;

    try {
      // Calcular snapshots dos últimos meses baseado em dados existentes
      const now = new Date();
      const generatedSnapshots: MonthlySnapshot[] = [];
      
      for (let i = 0; i < 12; i++) {
        const targetDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const ano = targetDate.getFullYear();
        const mes = targetDate.getMonth() + 1;
        const periodStart = startOfMonth(targetDate);
        const periodEnd = endOfMonth(targetDate);

        const [fixedRes, extraRes, entradasRes] = await Promise.all([
          supabase.from("personal_fixed_expenses").select("valor, categoria"),
          supabase
            .from("personal_extra_expenses")
            .select("valor, categoria")
            .gte("data", format(periodStart, "yyyy-MM-dd"))
            .lte("data", format(periodEnd, "yyyy-MM-dd")),
          supabase
            .from("entradas")
            .select("valor")
            .gte("created_at", periodStart.toISOString())
            .lt("created_at", addMonths(periodStart, 1).toISOString()),
        ]);

        const despesasFixas = (fixedRes.data || []).reduce((acc, e: any) => acc + (e.valor || 0), 0);
        const despesasExtras = (extraRes.data || []).reduce((acc, e: any) => acc + (e.valor || 0), 0);
        const receitas = (entradasRes.data || []).reduce((acc, e: any) => acc + (e.valor || 0), 0);

        if (despesasFixas > 0 || despesasExtras > 0 || receitas > 0) {
          generatedSnapshots.push({
            id: `${ano}-${mes}`,
            ano,
            mes,
            receitas_total: receitas,
            despesas_fixas_total: despesasFixas,
            despesas_extras_total: despesasExtras,
            despesas_total: despesasFixas + despesasExtras,
            saldo_periodo: receitas - (despesasFixas + despesasExtras),
            despesas_por_categoria: {},
            is_fechado: i > 0, // Meses anteriores são "fechados"
          });
        }
      }

      setSnapshots(generatedSnapshots.reverse());
    } catch (error) {
      console.error("Error fetching snapshots:", error);
      setSnapshots([]);
    }
  }, [user?.id, dateRange]);

  // Buscar resumos anuais
  const fetchYearlySummaries = useCallback(async () => {
    if (!user?.id) return;

    try {
      // Fallback simples - em produção a tabela existirá
      setYearlySummaries([]);
    } catch (error) {
      console.error("Error fetching yearly summaries:", error);
    }
  }, [user?.id]);

  // Criar snapshot do mês atual baseado em dados existentes
  const createCurrentMonthSnapshot = useCallback(async () => {
    if (!user?.id) return;

    const now = new Date();
    const ano = now.getFullYear();
    const mes = now.getMonth() + 1;

    try {
      const periodStart = startOfMonth(now);
      const periodEnd = endOfMonth(now);

      const [fixedRes, extraRes, entradasRes] = await Promise.all([
        supabase.from("personal_fixed_expenses").select("valor, categoria"),
        supabase
          .from("personal_extra_expenses")
          .select("valor, categoria")
          .gte("data", format(periodStart, "yyyy-MM-dd"))
          .lte("data", format(periodEnd, "yyyy-MM-dd")),
        supabase
          .from("entradas")
          .select("valor")
          .gte("created_at", periodStart.toISOString())
          .lt("created_at", addMonths(periodStart, 1).toISOString()),
      ]);

      const despesasFixas = (fixedRes.data || []).reduce((acc, e: any) => acc + (e.valor || 0), 0);
      const despesasExtras = (extraRes.data || []).reduce((acc, e: any) => acc + (e.valor || 0), 0);
      const receitas = (entradasRes.data || []).reduce((acc, e: any) => acc + (e.valor || 0), 0);

      // Agregar por categoria
      const categoryMap: Record<string, number> = {};
      [...(fixedRes.data || []), ...(extraRes.data || [])].forEach((e: any) => {
        const cat = e.categoria || "outros";
        categoryMap[cat] = (categoryMap[cat] || 0) + (e.valor || 0);
      });

      // Criar snapshot local
      const newSnapshot: MonthlySnapshot = {
        id: `${ano}-${mes}`,
        ano,
        mes,
        receitas_total: receitas,
        despesas_fixas_total: despesasFixas,
        despesas_extras_total: despesasExtras,
        despesas_total: despesasFixas + despesasExtras,
        saldo_periodo: receitas - (despesasFixas + despesasExtras),
        despesas_por_categoria: categoryMap,
        is_fechado: false,
      };

      setSnapshots(prev => {
        const existing = prev.findIndex(s => s.ano === ano && s.mes === mes);
        if (existing >= 0) {
          const updated = [...prev];
          updated[existing] = newSnapshot;
          return updated;
        }
        return [...prev, newSnapshot];
      });

    } catch (error) {
      console.error("Error creating snapshot:", error);
    }
  }, [user?.id]);

  // Fechar mês
  const closeMonth = useCallback(async (ano: number, mes: number) => {
    setSnapshots(prev => 
      prev.map(s => 
        s.ano === ano && s.mes === mes 
          ? { ...s, is_fechado: true }
          : s
      )
    );
    toast.success(`Mês ${mes}/${ano} fechado com sucesso!`);
  }, []);

  // Consolidar ano
  const consolidateYear = useCallback(async (ano: number) => {
    const yearSnapshots = snapshots.filter(s => s.ano === ano);
    
    if (yearSnapshots.length === 0) {
      toast.error("Nenhum snapshot encontrado para este ano");
      return;
    }

    const receitas = yearSnapshots.reduce((acc, s) => acc + (s.receitas_total || 0), 0);
    const despesas = yearSnapshots.reduce((acc, s) => acc + (s.despesas_total || 0), 0);
    const mesesCount = yearSnapshots.length;

    const sortedByBalance = [...yearSnapshots].sort((a, b) => (b.saldo_periodo || 0) - (a.saldo_periodo || 0));
    const melhor = sortedByBalance[0];
    const pior = sortedByBalance[sortedByBalance.length - 1];

    const newSummary: YearlySummary = {
      id: String(ano),
      ano,
      receitas_total: receitas,
      despesas_total: despesas,
      saldo_anual: receitas - despesas,
      media_receitas_mensal: mesesCount > 0 ? Math.round(receitas / mesesCount) : 0,
      media_despesas_mensal: mesesCount > 0 ? Math.round(despesas / mesesCount) : 0,
      melhor_mes: melhor?.mes || 0,
      melhor_mes_valor: melhor?.saldo_periodo || 0,
      pior_mes: pior?.mes || 0,
      pior_mes_valor: pior?.saldo_periodo || 0,
      meses_fechados: mesesCount,
    };

    setYearlySummaries(prev => {
      const existing = prev.findIndex(s => s.ano === ano);
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = newSummary;
        return updated;
      }
      return [...prev, newSummary];
    });

    toast.success(`Ano ${ano} consolidado com sucesso!`);
  }, [snapshots]);

  // Estatísticas calculadas
  const stats = useMemo((): HistoryStats => {
    const totalDespesas = currentPeriodExpenses.reduce((acc, e) => acc + e.valor, 0);
    
    const totalReceitas = snapshots.length > 0 
      ? snapshots.reduce((acc, s) => acc + (s.receitas_total || 0), 0)
      : 0;

    const saldo = totalReceitas - totalDespesas;
    const mediaMensal = snapshots.length > 0 
      ? totalDespesas / Math.max(snapshots.length, 1) 
      : totalDespesas;

    let tendencia: "up" | "down" | "stable" = "stable";
    let variacaoPercent = 0;

    if (snapshots.length >= 2) {
      const sorted = [...snapshots].sort((a, b) => {
        if (a.ano !== b.ano) return b.ano - a.ano;
        return b.mes - a.mes;
      });
      
      const current = sorted[0]?.despesas_total || 0;
      const previous = sorted[1]?.despesas_total || 0;
      
      if (previous > 0) {
        variacaoPercent = ((current - previous) / previous) * 100;
        tendencia = variacaoPercent > 5 ? "up" : variacaoPercent < -5 ? "down" : "stable";
      }
    }

    return { totalReceitas, totalDespesas, saldo, mediaMensal, tendencia, variacaoPercent };
  }, [currentPeriodExpenses, snapshots]);

  // Dados para gráfico de evolução
  const chartData = useMemo(() => {
    if (period === "10anos" || period === "anual") {
      return yearlySummaries.map(s => ({
        label: String(s.ano),
        receitas: s.receitas_total / 100,
        despesas: s.despesas_total / 100,
        saldo: s.saldo_anual / 100,
      }));
    } else {
      return snapshots.map(s => ({
        label: `${String(s.mes).padStart(2, "0")}/${s.ano}`,
        receitas: (s.receitas_total || 0) / 100,
        despesas: (s.despesas_total || 0) / 100,
        saldo: (s.saldo_periodo || 0) / 100,
      }));
    }
  }, [period, snapshots, yearlySummaries]);

  // Carregar dados iniciais
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([
        fetchCurrentPeriodExpenses(),
        fetchSnapshots(),
        fetchYearlySummaries(),
      ]);
      setIsLoading(false);
    };

    if (user?.id) {
      loadData();
    }
  }, [user?.id, fetchCurrentPeriodExpenses, fetchSnapshots, fetchYearlySummaries]);

  // Auto-criar snapshot do mês atual ao montar
  useEffect(() => {
    if (user?.id && !isLoading) {
      createCurrentMonthSnapshot();
    }
  }, [user?.id, isLoading, createCurrentMonthSnapshot]);

  return {
    period,
    setPeriod,
    customRange,
    setCustomRange,
    dateRange,
    isLoading,
    snapshots,
    yearlySummaries,
    currentPeriodExpenses,
    stats,
    chartData,
    createCurrentMonthSnapshot,
    closeMonth,
    consolidateYear,
    refresh: async () => {
      setIsLoading(true);
      await Promise.all([
        fetchCurrentPeriodExpenses(),
        fetchSnapshots(),
        fetchYearlySummaries(),
      ]);
      await createCurrentMonthSnapshot();
      setIsLoading(false);
    },
  };
}

// Hook para formatar valores (usa @/utils centralizado)
export function useFormatCurrency() {
  return useCallback((cents: number) => formatCurrencyCentralized(cents), []);
}

// Nome do mês em português
export function getMonthName(month: number): string {
  const months = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];
  return months[month - 1] || "";
}
