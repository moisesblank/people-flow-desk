// ============================================
// HOOK: useMonthlyFinancials
// Centraliza queries de receitas e gastos mensais
// Elimina duplicação de código em 5+ locais
// ============================================

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMemo } from "react";

// ============================================
// TIPOS
// ============================================
export interface MonthlyFinancialData {
  // Receitas
  totalReceita: number;
  entradas: { valor: number; fonte?: string; created_at?: string }[];
  
  // Gastos Empresa
  gastosFixosEmpresa: number;
  gastosExtrasEmpresa: number;
  totalGastosEmpresa: number;
  
  // Gastos Pessoais
  gastosFixosPessoais: number;
  gastosExtrasPessoais: number;
  totalGastosPessoais: number;
  
  // Totais
  totalGastos: number;
  lucro: number;
  margem: number;
  saldo: number;
  
  // Contagens
  alunosAtivos: number;
  afiliadosAtivos: number;
  
  // Metadata
  mes: number;
  ano: number;
  inicioMes: Date;
}

export interface MonthlyFinancialsOptions {
  /** Mês a consultar (1-12). Default: mês atual */
  mes?: number;
  /** Ano a consultar. Default: ano atual */
  ano?: number;
  /** Incluir dados detalhados de entradas. Default: false */
  includeEntradasDetails?: boolean;
  /** Stale time em ms. Default: 5 minutos */
  staleTime?: number;
  /** Refetch interval em ms. Default: 60 segundos */
  refetchInterval?: number;
  /** Habilitar query. Default: true */
  enabled?: boolean;
}

// ============================================
// FUNÇÕES DE QUERY REUTILIZÁVEIS
// ============================================

/**
 * Busca receitas (entradas) do mês
 */
async function fetchEntradasMes(inicioMes: string, includeDetails: boolean) {
  const { data, error } = await supabase
    .from("entradas")
    .select("valor, fonte, created_at, descricao")
    .gte("created_at", inicioMes)
    .order("created_at", { ascending: false })
    .limit(includeDetails ? 100 : 1000);
  
  if (error) {
    console.error("[useMonthlyFinancials] Erro ao buscar entradas:", error);
    return [];
  }
  
  return (data || []).map(e => ({
    valor: e.valor || 0,
    fonte: e.fonte || undefined,
    created_at: e.created_at || undefined,
  }));
}

/**
 * Busca gastos fixos e extras da empresa
 */
async function fetchGastosEmpresa(mes: number, ano: number) {
  const [fixosRes, extrasRes] = await Promise.all([
    supabase.from("company_fixed_expenses").select("valor").eq("mes", mes).eq("ano", ano),
    supabase.from("company_extra_expenses").select("valor").eq("mes", mes).eq("ano", ano),
  ]);
  
  const fixos = (fixosRes.data || []).reduce((acc, g) => acc + (g.valor || 0), 0);
  const extras = (extrasRes.data || []).reduce((acc, g) => acc + (g.valor || 0), 0);
  
  return { fixos, extras, total: fixos + extras };
}

/**
 * Busca gastos fixos e extras pessoais
 */
async function fetchGastosPessoais() {
  const [fixosRes, extrasRes] = await Promise.all([
    supabase.from("personal_fixed_expenses").select("valor"),
    supabase.from("personal_extra_expenses").select("valor"),
  ]);
  
  const fixos = (fixosRes.data || []).reduce((acc, g) => acc + (g.valor || 0), 0);
  const extras = (extrasRes.data || []).reduce((acc, g) => acc + (g.valor || 0), 0);
  
  return { fixos, extras, total: fixos + extras };
}

/**
 * Busca contagens de alunos e afiliados ativos
 */
async function fetchContagens() {
  const [alunosRes, afiliadosRes] = await Promise.all([
    supabase.from("alunos").select("*", { count: "exact", head: true }).eq("status", "ativo"),
    supabase.from("affiliates").select("*", { count: "exact", head: true }).eq("status", "ativo"),
  ]);
  
  return {
    alunos: alunosRes.count || 0,
    afiliados: afiliadosRes.count || 0,
  };
}

// ============================================
// HOOK PRINCIPAL
// ============================================

/**
 * Hook unificado para dados financeiros mensais
 * Substitui queries duplicadas em 5+ locais do código
 * 
 * @example
 * const { data, isLoading, refetch } = useMonthlyFinancials();
 * console.log(data?.lucro, data?.totalReceita);
 * 
 * @example Com opções
 * const { data } = useMonthlyFinancials({ 
 *   mes: 11, 
 *   ano: 2024, 
 *   includeEntradasDetails: true 
 * });
 */
export function useMonthlyFinancials(options: MonthlyFinancialsOptions = {}) {
  const {
    mes = new Date().getMonth() + 1,
    ano = new Date().getFullYear(),
    includeEntradasDetails = false,
    staleTime = 5 * 60 * 1000, // 5 minutos
    refetchInterval = 60 * 1000, // 60 segundos
    enabled = true,
  } = options;

  // Calcular início do mês uma vez
  const inicioMes = useMemo(() => {
    const date = new Date(ano, mes - 1, 1);
    date.setHours(0, 0, 0, 0);
    return date;
  }, [mes, ano]);

  const query = useQuery({
    queryKey: ["monthly-financials", mes, ano, includeEntradasDetails],
    queryFn: async (): Promise<MonthlyFinancialData> => {
      const startTime = performance.now();
      const inicioMesISO = inicioMes.toISOString();

      // Executar todas as queries em paralelo
      const [entradas, gastosEmpresa, gastosPessoais, contagens] = await Promise.all([
        fetchEntradasMes(inicioMesISO, includeEntradasDetails),
        fetchGastosEmpresa(mes, ano),
        fetchGastosPessoais(),
        fetchContagens(),
      ]);

      // Calcular totais
      const totalReceita = entradas.reduce((acc, e) => acc + (e.valor || 0), 0);
      const totalGastos = gastosEmpresa.total + gastosPessoais.total;
      const lucro = totalReceita - totalGastos;
      const margem = totalReceita > 0 ? (lucro / totalReceita) * 100 : 0;

      const endTime = performance.now();
      console.log(`[useMonthlyFinancials] Query executada em ${(endTime - startTime).toFixed(0)}ms`);

      return {
        // Receitas
        totalReceita,
        entradas: includeEntradasDetails ? entradas : [],
        
        // Gastos Empresa
        gastosFixosEmpresa: gastosEmpresa.fixos,
        gastosExtrasEmpresa: gastosEmpresa.extras,
        totalGastosEmpresa: gastosEmpresa.total,
        
        // Gastos Pessoais
        gastosFixosPessoais: gastosPessoais.fixos,
        gastosExtrasPessoais: gastosPessoais.extras,
        totalGastosPessoais: gastosPessoais.total,
        
        // Totais
        totalGastos,
        lucro,
        margem,
        saldo: lucro,
        
        // Contagens
        alunosAtivos: contagens.alunos,
        afiliadosAtivos: contagens.afiliados,
        
        // Metadata
        mes,
        ano,
        inicioMes,
      };
    },
    staleTime,
    refetchInterval,
    enabled,
  });

  return query;
}

// ============================================
// HOOK SIMPLIFICADO PARA CASOS COMUNS
// ============================================

/**
 * Hook simplificado que retorna apenas receita, despesa e saldo
 * Para uso em componentes que só precisam do resumo
 */
export function useFinancialSummary() {
  const { data, isLoading, error, refetch } = useMonthlyFinancials({
    includeEntradasDetails: false,
  });

  const summary = useMemo(() => {
    if (!data) return null;
    return {
      receita: data.totalReceita,
      despesa: data.totalGastos,
      saldo: data.saldo,
      lucro: data.lucro,
      margem: data.margem,
    };
  }, [data]);

  return { data: summary, isLoading, error, refetch };
}

/**
 * Hook para dados do dashboard executivo
 * Inclui alunos ativos e gastos separados
 */
export function useExecutiveFinancials() {
  const { data, isLoading, error, refetch } = useMonthlyFinancials({
    includeEntradasDetails: false,
    staleTime: 60 * 1000, // 1 minuto para dashboard executivo
  });

  return {
    data: data ? {
      totalReceita: data.totalReceita,
      totalGastos: data.totalGastosEmpresa,
      lucro: data.totalReceita - data.totalGastosEmpresa,
      margem: data.totalReceita > 0 
        ? ((data.totalReceita - data.totalGastosEmpresa) / data.totalReceita) * 100 
        : 0,
      alunosAtivos: data.alunosAtivos,
    } : null,
    isLoading,
    error,
    refetch,
  };
}
