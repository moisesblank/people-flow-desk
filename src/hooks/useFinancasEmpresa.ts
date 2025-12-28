// ============================================
// HOOK: useFinancasEmpresa
// Extraído de FinancasEmpresa.tsx (2137 linhas)
// Centraliza toda lógica de dados financeiros
// ============================================

import { useState, useMemo, useCallback, useEffect } from "react";
import { useCompanyFinanceHistory, type PaymentStatus } from "@/hooks/useCompanyFinanceHistory";
import { usePaymentsHistory } from "@/hooks/usePaymentsHistory";
import { supabase } from "@/integrations/supabase/client";
import { parseISO, subMonths, format } from "date-fns";
import { ptBR } from "date-fns/locale";

// ═══════════════════════════════════════════════════════════════
// TIPOS
// ═══════════════════════════════════════════════════════════════

export type ViewMode = "dashboard" | "gastos" | "pagamentos" | "relatorios" | "meses" | "anos";
export type ExpenseType = "fixed" | "extra";
export type ItemType = "gasto_fixo" | "gasto_extra" | "pagamento";

export interface FinanceFormData {
  nome: string;
  descricao: string;
  valor: string;
  categoria: string;
  data: string;
  data_vencimento: string;
  status_pagamento: PaymentStatus;
  tipo: string;
  metodo_pagamento: string;
  observacoes: string;
  recorrente: boolean;
}

export interface UnifiedStats {
  gastosFixos: number;
  gastosExtras: number;
  totalGastos: number;
  receitas: number;
  pagamentosTotal: number;
  pagamentosPagos: number;
  pagamentosPendentes: number;
  pagamentosAtrasados: number;
  totalPago: number;
  totalPendente: number;
  totalAtrasado: number;
  totalGeral: number;
  percentPago: number;
  saldo: number;
  countGastosFixos: number;
  countGastosExtras: number;
  countPagamentos: number;
  countReceitas: number;
  countPago: number;
  countPendente: number;
  countAtrasado: number;
}

export interface ChartDataSet {
  categoryData: { name: string; value: number }[];
  typeData: { name: string; value: number; color: string }[];
  statusData: { name: string; value: number; color: string }[];
  monthlyData: { month: string; gastos: number; receitas: number; pagamentos: number }[];
}

export interface DadosComplementares {
  funcionarios: number;
  alunos: number;
}

// ═══════════════════════════════════════════════════════════════
// CONSTANTES
// ═══════════════════════════════════════════════════════════════

export const CATEGORIAS = [
  "Folha de Pagamento", "Aluguel", "Energia", "Internet", "Telefone",
  "Marketing", "Software/SaaS", "Impostos", "Contador", "Material de Escritório",
  "Equipamentos", "Manutenção", "Viagens", "Alimentação", "Transporte",
  "Funcionário", "Site", "NOTA FISCAL", "Outros"
];

export const CHART_COLORS = ['#EC4899', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#6366F1', '#14B8A6', '#F97316'];

// ═══════════════════════════════════════════════════════════════
// HOOK PRINCIPAL
// ═══════════════════════════════════════════════════════════════

export function useFinancasEmpresa() {
  const companyFinance = useCompanyFinanceHistory();
  const paymentsHistory = usePaymentsHistory();

  // Dados complementares (funcionários, alunos)
  const [dadosComplementares, setDadosComplementares] = useState<DadosComplementares>({
    funcionarios: 0,
    alunos: 0,
  });

  useEffect(() => {
    const fetchComplementares = async () => {
      const [funcRes, alunosRes] = await Promise.all([
        supabase.from("employees").select("*", { count: "exact", head: true }).eq("status", "ativo"),
        supabase.from("alunos").select("*", { count: "exact", head: true }).eq("status", "ativo"),
      ]);
      setDadosComplementares({
        funcionarios: funcRes.count || 0,
        alunos: alunosRes.count || 0,
      });
    };
    fetchComplementares();
  }, []);

  // Combinar todos os itens
  const getAllItems = useCallback((
    activeTab: string,
    searchTerm: string,
    sortBy: "vencimento" | "data" | "valor" | "nome",
    sortOrder: "asc" | "desc"
  ) => {
    const gastos = [
      ...companyFinance.fixedExpenses.map(e => ({ 
        ...e, 
        itemType: 'gasto_fixo' as ItemType,
        label: e.nome,
        statusKey: e.status_pagamento || 'pendente',
        isProjecao: e.is_projecao || false,
        gastoOrigemId: e.gasto_origem_id,
      })),
      ...companyFinance.extraExpenses.map(e => ({ 
        ...e, 
        itemType: 'gasto_extra' as ItemType,
        label: e.nome,
        statusKey: e.status_pagamento || 'pendente',
        isProjecao: false,
      })),
    ];

    const pagamentos = paymentsHistory.payments.map(p => ({
      ...p,
      itemType: 'pagamento' as ItemType,
      label: p.descricao,
      nome: p.descricao,
      statusKey: p.status,
      data: p.data_vencimento,
      isProjecao: false,
      gastoOrigemId: null as number | null,
    }));

    let combined = [...gastos, ...pagamentos];

    // Filtro por tab
    if (activeTab === "fixos") {
      combined = combined.filter(i => i.itemType === 'gasto_fixo');
    } else if (activeTab === "extras") {
      combined = combined.filter(i => i.itemType === 'gasto_extra');
    } else if (activeTab === "pagamentos") {
      combined = combined.filter(i => i.itemType === 'pagamento');
    }

    // Filtro por busca
    if (searchTerm) {
      combined = combined.filter(i =>
        i.label?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        i.categoria?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Ordenação
    return combined.sort((a, b) => {
      let comparison = 0;
      const today = new Date();
      
      if (sortBy === "vencimento") {
        const dateA = a.data_vencimento || a.data || a.created_at || '9999-12-31';
        const dateB = b.data_vencimento || b.data || b.created_at || '9999-12-31';
        const dA = new Date(dateA);
        const dB = new Date(dateB);
        
        const isPendingA = a.statusKey === 'pendente' || a.statusKey === 'atrasado';
        const isPendingB = b.statusKey === 'pendente' || b.statusKey === 'atrasado';
        
        if (isPendingA && !isPendingB) return -1;
        if (!isPendingA && isPendingB) return 1;
        
        const diffA = Math.abs(dA.getTime() - today.getTime());
        const diffB = Math.abs(dB.getTime() - today.getTime());
        comparison = diffA - diffB;
      } else if (sortBy === "data") {
        const dateA = a.data || a.created_at || '';
        const dateB = b.data || b.created_at || '';
        comparison = dateA.localeCompare(dateB);
      } else if (sortBy === "valor") {
        comparison = (a.valor || 0) - (b.valor || 0);
      } else if (sortBy === "nome") {
        comparison = (a.label || '').localeCompare(b.label || '');
      }
      return sortOrder === "desc" ? -comparison : comparison;
    });
  }, [companyFinance.fixedExpenses, companyFinance.extraExpenses, paymentsHistory.payments]);

  // Estatísticas unificadas
  const calculateUnifiedStats = useCallback((allItems: ReturnType<typeof getAllItems>): UnifiedStats => {
    const gastosFixos = companyFinance.fixedExpenses.reduce((sum, e) => sum + e.valor, 0);
    const gastosExtras = companyFinance.extraExpenses.reduce((sum, e) => sum + e.valor, 0);
    const totalGastos = gastosFixos + gastosExtras;
    const receitas = companyFinance.entradas.reduce((sum, e) => sum + (e.valor || 0), 0);

    const pagamentosTotal = paymentsHistory.payments.reduce((sum, p) => sum + p.valor, 0);
    const pagamentosPagos = paymentsHistory.payments.filter(p => p.status === 'pago').reduce((sum, p) => sum + p.valor, 0);
    const pagamentosPendentes = paymentsHistory.payments.filter(p => p.status === 'pendente').reduce((sum, p) => sum + p.valor, 0);
    const pagamentosAtrasados = paymentsHistory.payments.filter(p => p.status === 'atrasado').reduce((sum, p) => sum + p.valor, 0);

    const gastosPagos = allItems.filter(i => i.itemType !== 'pagamento' && i.statusKey === 'pago').reduce((sum, i) => sum + i.valor, 0);
    const gastosPendentes = allItems.filter(i => i.itemType !== 'pagamento' && i.statusKey === 'pendente').reduce((sum, i) => sum + i.valor, 0);
    const gastosAtrasados = allItems.filter(i => i.itemType !== 'pagamento' && i.statusKey === 'atrasado').reduce((sum, i) => sum + i.valor, 0);

    const totalPago = gastosPagos + pagamentosPagos;
    const totalPendente = gastosPendentes + pagamentosPendentes;
    const totalAtrasado = gastosAtrasados + pagamentosAtrasados;
    const totalGeral = totalGastos + pagamentosTotal;

    const percentPago = totalGeral > 0 ? (totalPago / totalGeral) * 100 : 0;
    const saldo = receitas - totalGastos;

    return {
      gastosFixos,
      gastosExtras,
      totalGastos,
      receitas,
      pagamentosTotal,
      pagamentosPagos,
      pagamentosPendentes,
      pagamentosAtrasados,
      totalPago,
      totalPendente,
      totalAtrasado,
      totalGeral,
      percentPago,
      saldo,
      countGastosFixos: companyFinance.fixedExpenses.length,
      countGastosExtras: companyFinance.extraExpenses.length,
      countPagamentos: paymentsHistory.payments.length,
      countReceitas: companyFinance.entradas.length,
      countPago: allItems.filter(i => i.statusKey === 'pago').length,
      countPendente: allItems.filter(i => i.statusKey === 'pendente').length,
      countAtrasado: allItems.filter(i => i.statusKey === 'atrasado').length,
    };
  }, [companyFinance, paymentsHistory]);

  // Dados para gráficos
  const calculateChartData = useCallback((allItems: ReturnType<typeof getAllItems>, unifiedStats: UnifiedStats): ChartDataSet => {
    // Dados por categoria
    const byCategory: Record<string, number> = {};
    allItems.forEach(item => {
      const cat = item.categoria || 'Outros';
      byCategory[cat] = (byCategory[cat] || 0) + item.valor;
    });
    const categoryData = Object.entries(byCategory)
      .map(([name, value]) => ({ name, value: value / 100 }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);

    // Dados por tipo
    const typeData = [
      { name: 'Gastos Fixos', value: unifiedStats.gastosFixos / 100, color: '#EF4444' },
      { name: 'Gastos Extras', value: unifiedStats.gastosExtras / 100, color: '#3B82F6' },
      { name: 'Pagamentos', value: unifiedStats.pagamentosTotal / 100, color: '#8B5CF6' },
    ];

    // Dados por status
    const statusData = [
      { name: 'Pagos', value: unifiedStats.totalPago / 100, color: '#10B981' },
      { name: 'Pendentes', value: unifiedStats.totalPendente / 100, color: '#F59E0B' },
      { name: 'Atrasados', value: unifiedStats.totalAtrasado / 100, color: '#EF4444' },
    ];

    // Últimos 6 meses
    const monthlyData: ChartDataSet['monthlyData'] = [];
    for (let i = 5; i >= 0; i--) {
      const date = subMonths(new Date(), i);
      const monthNum = date.getMonth() + 1;
      const yearNum = date.getFullYear();
      
      const gastosMes = [...companyFinance.fixedExpenses, ...companyFinance.extraExpenses]
        .filter(e => e.mes === monthNum && e.ano === yearNum)
        .reduce((sum, e) => sum + e.valor, 0);

      const pagamentosMes = paymentsHistory.payments
        .filter(p => {
          const d = parseISO(p.data_vencimento);
          return d.getMonth() + 1 === monthNum && d.getFullYear() === yearNum;
        })
        .reduce((sum, p) => sum + p.valor, 0);

      const receitasMes = companyFinance.entradas
        .filter(e => {
          const d = e.created_at ? parseISO(e.created_at) : new Date();
          return d.getMonth() + 1 === monthNum && d.getFullYear() === yearNum;
        })
        .reduce((sum, e) => sum + (e.valor || 0), 0);

      monthlyData.push({
        month: format(date, 'MMM', { locale: ptBR }),
        gastos: gastosMes / 100,
        pagamentos: pagamentosMes / 100,
        receitas: receitasMes / 100,
      });
    }

    return { categoryData, typeData, statusData, monthlyData };
  }, [companyFinance, paymentsHistory]);

  return {
    companyFinance,
    paymentsHistory,
    dadosComplementares,
    getAllItems,
    calculateUnifiedStats,
    calculateChartData,
    CATEGORIAS,
    CHART_COLORS,
  };
}
