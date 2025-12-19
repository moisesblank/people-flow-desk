// ============================================
// PLANILHA VIVA - CONTEXT DE FINANÇAS REATIVAS
// Sistema 100% reativo como Excel em tempo real
// ============================================

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';

// ===== TIPOS =====
interface FinancialMetrics {
  // Receitas
  receitaTotal: number;
  receitaMes: number;
  receitaHoje: number;
  receitaSemana: number;
  
  // Despesas
  despesaTotal: number;
  despesaMes: number;
  despesaHoje: number;
  despesaPessoal: number;
  despesaEmpresa: number;
  
  // Saldos
  saldoMes: number;
  saldoTotal: number;
  lucroLiquido: number;
  
  // Contadores
  alunosAtivos: number;
  funcionariosAtivos: number;
  afiliadosAtivos: number;
  vendasMes: number;
  tarefasHoje: number;
  tarefasPendentes: number;
  pagamentosPendentes: number;
  
  // Percentuais
  taxaEconomia: number;
  taxaCrescimento: number;
  margemLucro: number;
  
  // Meta
  metaMensal: number;
  progressoMeta: number;
  
  // Timestamp
  lastUpdate: Date;
}

interface ReactiveFinanceContextType {
  metrics: FinancialMetrics;
  isLoading: boolean;
  isConnected: boolean;
  error: string | null;
  
  // Ações
  forceRefresh: () => Promise<void>;
  setMetaMensal: (valor: number) => void;
  
  // Formatação
  formatCurrency: (cents: number) => string;
  formatPercent: (value: number) => string;
}

// ===== VALORES PADRÃO =====
const defaultMetrics: FinancialMetrics = {
  receitaTotal: 0,
  receitaMes: 0,
  receitaHoje: 0,
  receitaSemana: 0,
  despesaTotal: 0,
  despesaMes: 0,
  despesaHoje: 0,
  despesaPessoal: 0,
  despesaEmpresa: 0,
  saldoMes: 0,
  saldoTotal: 0,
  lucroLiquido: 0,
  alunosAtivos: 0,
  funcionariosAtivos: 0,
  afiliadosAtivos: 0,
  vendasMes: 0,
  tarefasHoje: 0,
  tarefasPendentes: 0,
  pagamentosPendentes: 0,
  taxaEconomia: 0,
  taxaCrescimento: 0,
  margemLucro: 0,
  metaMensal: 10000000, // R$ 100.000,00 em centavos
  progressoMeta: 0,
  lastUpdate: new Date(),
};

const ReactiveFinanceContext = createContext<ReactiveFinanceContextType | null>(null);

// ===== FUNÇÕES AUXILIARES =====
const getStartOfMonth = () => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
};

const getStartOfWeek = () => {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day;
  return new Date(now.setDate(diff)).toISOString().split('T')[0];
};

const getToday = () => new Date().toISOString().split('T')[0];

// ===== PROVIDER =====
export function ReactiveFinanceProvider({ children }: { children: React.ReactNode }) {
  const [metrics, setMetrics] = useState<FinancialMetrics>(defaultMetrics);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [metaMensal, setMetaMensal] = useState(10000000);
  const queryClient = useQueryClient();
  const channelRef = useRef<any>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // ===== CÁLCULO REATIVO DE MÉTRICAS =====
  const calculateMetrics = useCallback(async () => {
    const startOfMonth = getStartOfMonth();
    const today = getToday();
    const startOfWeek = getStartOfWeek();

    try {
      // Buscar todos os dados em paralelo
      const [
        entradasMes,
        entradasHoje,
        entradasSemana,
        despesasMes,
        despesasHoje,
        despesasPessoais,
        despesasEmpresa,
        alunos,
        funcionarios,
        afiliados,
        vendasHotmart,
        tarefasHoje,
        pagamentosPendentes,
        entradasTotal,
        despesasTotal
      ] = await Promise.all([
        // Entradas do mês
        supabase.from('entradas').select('valor').gte('created_at', startOfMonth),
        // Entradas de hoje
        supabase.from('entradas').select('valor').gte('created_at', today),
        // Entradas da semana
        supabase.from('entradas').select('valor').gte('created_at', startOfWeek),
        // Despesas do mês (contas pagas)
        supabase.from('contas_pagar').select('valor').eq('status', 'pago').gte('data_pagamento', startOfMonth),
        // Despesas de hoje
        supabase.from('contas_pagar').select('valor').eq('status', 'pago').eq('data_pagamento', today),
        // Despesas pessoais do mês
        supabase.from('personal_extra_expenses').select('valor').gte('data', startOfMonth),
        // Despesas empresa do mês
        supabase.from('company_extra_expenses').select('valor').gte('data', startOfMonth),
        // Alunos ativos
        supabase.from('alunos').select('id', { count: 'exact', head: true }).eq('status', 'ativo'),
        // Funcionários ativos
        supabase.from('employees').select('id', { count: 'exact', head: true }).eq('status', 'ativo'),
        // Afiliados ativos
        supabase.from('affiliates').select('id', { count: 'exact', head: true }).eq('status', 'ativo'),
        // Vendas Hotmart do mês
        supabase.from('transacoes_hotmart_completo').select('id', { count: 'exact', head: true }).in('status', ['approved', 'purchase_approved']).gte('data_compra', startOfMonth),
        // Tarefas de hoje
        supabase.from('calendar_tasks').select('id, is_completed', { count: 'exact' }).eq('task_date', today),
        // Pagamentos pendentes
        supabase.from('contas_pagar').select('id', { count: 'exact', head: true }).eq('status', 'pendente'),
        // Total de entradas (histórico)
        supabase.from('entradas').select('valor'),
        // Total de despesas (histórico)
        supabase.from('contas_pagar').select('valor').eq('status', 'pago'),
      ]);

      // Calcular valores
      const receitaMes = (entradasMes.data || []).reduce((sum, e) => sum + (e.valor || 0), 0);
      const receitaHoje = (entradasHoje.data || []).reduce((sum, e) => sum + (e.valor || 0), 0);
      const receitaSemana = (entradasSemana.data || []).reduce((sum, e) => sum + (e.valor || 0), 0);
      const receitaTotal = (entradasTotal.data || []).reduce((sum, e) => sum + (e.valor || 0), 0);
      
      const despesaMesBase = (despesasMes.data || []).reduce((sum, d) => sum + (d.valor || 0), 0);
      const despesaPessoal = (despesasPessoais.data || []).reduce((sum, d) => sum + (d.valor || 0), 0);
      const despesaEmpresa = (despesasEmpresa.data || []).reduce((sum, d) => sum + (d.valor || 0), 0);
      const despesaMes = despesaMesBase + despesaPessoal + despesaEmpresa;
      const despesaHoje = (despesasHoje.data || []).reduce((sum, d) => sum + (d.valor || 0), 0);
      const despesaTotal = (despesasTotal.data || []).reduce((sum, d) => sum + (d.valor || 0), 0);
      
      // Saldos
      const saldoMes = receitaMes - despesaMes;
      const saldoTotal = receitaTotal - despesaTotal;
      const lucroLiquido = saldoMes;
      
      // Tarefas
      const tarefasData = tarefasHoje.data || [];
      const tarefasPendentes = tarefasData.filter((t: any) => !t.is_completed).length;
      
      // Percentuais reativos
      const taxaEconomia = receitaMes > 0 ? ((receitaMes - despesaMes) / receitaMes) * 100 : 0;
      const margemLucro = receitaMes > 0 ? (lucroLiquido / receitaMes) * 100 : 0;
      const progressoMeta = metaMensal > 0 ? Math.min((receitaMes / metaMensal) * 100, 100) : 0;

      // Atualizar state com novos valores
      setMetrics({
        receitaTotal,
        receitaMes,
        receitaHoje,
        receitaSemana,
        despesaTotal,
        despesaMes,
        despesaHoje,
        despesaPessoal,
        despesaEmpresa,
        saldoMes,
        saldoTotal,
        lucroLiquido,
        alunosAtivos: alunos.count || 0,
        funcionariosAtivos: funcionarios.count || 0,
        afiliadosAtivos: afiliados.count || 0,
        vendasMes: vendasHotmart.count || 0,
        tarefasHoje: tarefasHoje.count || 0,
        tarefasPendentes,
        pagamentosPendentes: pagamentosPendentes.count || 0,
        taxaEconomia,
        taxaCrescimento: 0, // Calculado posteriormente
        margemLucro,
        metaMensal,
        progressoMeta,
        lastUpdate: new Date(),
      });

      setError(null);
    } catch (err) {
      console.error('[ReactiveFinance] Erro ao calcular métricas:', err);
      setError('Erro ao calcular métricas financeiras');
    }
  }, [metaMensal]);

  // ===== DEBOUNCE PARA UPDATES =====
  const debouncedRecalculate = useCallback(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      calculateMetrics();
      // Invalidar queries do React Query para sincronizar
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['financial-stats'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    }, 300);
  }, [calculateMetrics, queryClient]);

  // ===== SETUP REALTIME SUBSCRIPTIONS =====
  useEffect(() => {
    const setupRealtimeSubscriptions = async () => {
      setIsLoading(true);
      
      // Calcular métricas iniciais
      await calculateMetrics();
      
      // Criar channel para todas as tabelas financeiras
      const channel = supabase
        .channel('reactive-finance-live')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'entradas' },
          () => {
            console.log('[ReactiveFinance] Entradas alteradas - recalculando...');
            debouncedRecalculate();
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'contas_pagar' },
          () => {
            console.log('[ReactiveFinance] Contas a pagar alteradas - recalculando...');
            debouncedRecalculate();
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'contas_receber' },
          () => {
            console.log('[ReactiveFinance] Contas a receber alteradas - recalculando...');
            debouncedRecalculate();
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'personal_extra_expenses' },
          () => {
            console.log('[ReactiveFinance] Despesas pessoais alteradas - recalculando...');
            debouncedRecalculate();
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'company_extra_expenses' },
          () => {
            console.log('[ReactiveFinance] Despesas empresa alteradas - recalculando...');
            debouncedRecalculate();
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'alunos' },
          () => {
            console.log('[ReactiveFinance] Alunos alterados - recalculando...');
            debouncedRecalculate();
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'transacoes_hotmart_completo' },
          () => {
            console.log('[ReactiveFinance] Vendas Hotmart alteradas - recalculando...');
            debouncedRecalculate();
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'calendar_tasks' },
          () => {
            console.log('[ReactiveFinance] Tarefas alteradas - recalculando...');
            debouncedRecalculate();
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'employees' },
          () => {
            console.log('[ReactiveFinance] Funcionários alterados - recalculando...');
            debouncedRecalculate();
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'affiliates' },
          () => {
            console.log('[ReactiveFinance] Afiliados alterados - recalculando...');
            debouncedRecalculate();
          }
        )
        .subscribe((status) => {
          console.log('[ReactiveFinance] Status da conexão:', status);
          setIsConnected(status === 'SUBSCRIBED');
          setIsLoading(false);
        });

      channelRef.current = channel;
    };

    setupRealtimeSubscriptions();

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [calculateMetrics, debouncedRecalculate]);

  // ===== FORCE REFRESH =====
  const forceRefresh = useCallback(async () => {
    setIsLoading(true);
    await calculateMetrics();
    queryClient.invalidateQueries();
    setIsLoading(false);
  }, [calculateMetrics, queryClient]);

  // ===== FORMATAÇÃO =====
  const formatCurrency = useCallback((cents: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(cents / 100);
  }, []);

  const formatPercent = useCallback((value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'percent',
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    }).format(value / 100);
  }, []);

  // ===== VALOR DO CONTEXT =====
  const value = useMemo(() => ({
    metrics,
    isLoading,
    isConnected,
    error,
    forceRefresh,
    setMetaMensal,
    formatCurrency,
    formatPercent,
  }), [metrics, isLoading, isConnected, error, forceRefresh, formatCurrency, formatPercent]);

  return (
    <ReactiveFinanceContext.Provider value={value}>
      {children}
    </ReactiveFinanceContext.Provider>
  );
}

// ===== HOOK PARA CONSUMIR =====
export function useReactiveFinance() {
  const context = useContext(ReactiveFinanceContext);
  if (!context) {
    throw new Error('useReactiveFinance must be used within ReactiveFinanceProvider');
  }
  return context;
}

// ===== HOOK ESPECÍFICO PARA SALDOS =====
export function useReactiveSaldo() {
  const { metrics, formatCurrency } = useReactiveFinance();
  
  return useMemo(() => ({
    saldoMes: metrics.saldoMes,
    saldoMesFormatado: formatCurrency(metrics.saldoMes),
    saldoTotal: metrics.saldoTotal,
    saldoTotalFormatado: formatCurrency(metrics.saldoTotal),
    lucroLiquido: metrics.lucroLiquido,
    lucroLiquidoFormatado: formatCurrency(metrics.lucroLiquido),
    isPositivo: metrics.saldoMes >= 0,
  }), [metrics, formatCurrency]);
}

// ===== HOOK ESPECÍFICO PARA RECEITAS =====
export function useReactiveReceitas() {
  const { metrics, formatCurrency } = useReactiveFinance();
  
  return useMemo(() => ({
    total: metrics.receitaTotal,
    totalFormatado: formatCurrency(metrics.receitaTotal),
    mes: metrics.receitaMes,
    mesFormatado: formatCurrency(metrics.receitaMes),
    hoje: metrics.receitaHoje,
    hojeFormatado: formatCurrency(metrics.receitaHoje),
    semana: metrics.receitaSemana,
    semanaFormatado: formatCurrency(metrics.receitaSemana),
  }), [metrics, formatCurrency]);
}

// ===== HOOK ESPECÍFICO PARA DESPESAS =====
export function useReactiveDespesas() {
  const { metrics, formatCurrency } = useReactiveFinance();
  
  return useMemo(() => ({
    total: metrics.despesaTotal,
    totalFormatado: formatCurrency(metrics.despesaTotal),
    mes: metrics.despesaMes,
    mesFormatado: formatCurrency(metrics.despesaMes),
    hoje: metrics.despesaHoje,
    hojeFormatado: formatCurrency(metrics.despesaHoje),
    pessoal: metrics.despesaPessoal,
    pessoalFormatado: formatCurrency(metrics.despesaPessoal),
    empresa: metrics.despesaEmpresa,
    empresaFormatado: formatCurrency(metrics.despesaEmpresa),
  }), [metrics, formatCurrency]);
}

// ===== HOOK ESPECÍFICO PARA CONTADORES =====
export function useReactiveContadores() {
  const { metrics } = useReactiveFinance();
  
  return useMemo(() => ({
    alunos: metrics.alunosAtivos,
    funcionarios: metrics.funcionariosAtivos,
    afiliados: metrics.afiliadosAtivos,
    vendas: metrics.vendasMes,
    tarefasHoje: metrics.tarefasHoje,
    tarefasPendentes: metrics.tarefasPendentes,
    pagamentosPendentes: metrics.pagamentosPendentes,
  }), [metrics]);
}

// ===== HOOK ESPECÍFICO PARA KPIs =====
export function useReactiveKPIs() {
  const { metrics, formatPercent, formatCurrency } = useReactiveFinance();
  
  return useMemo(() => ({
    taxaEconomia: metrics.taxaEconomia,
    taxaEconomiaFormatada: formatPercent(metrics.taxaEconomia),
    margemLucro: metrics.margemLucro,
    margemLucroFormatada: formatPercent(metrics.margemLucro),
    progressoMeta: metrics.progressoMeta,
    progressoMetaFormatado: formatPercent(metrics.progressoMeta),
    metaMensal: metrics.metaMensal,
    metaMensalFormatada: formatCurrency(metrics.metaMensal),
    faltaParaMeta: Math.max(0, metrics.metaMensal - metrics.receitaMes),
    faltaParaMetaFormatada: formatCurrency(Math.max(0, metrics.metaMensal - metrics.receitaMes)),
  }), [metrics, formatPercent, formatCurrency]);
}
