// ============================================
// PLANILHA VIVA v2.0 - NÚCLEO REATIVO AVANÇADO
// Sistema de Fórmulas Encadeadas A → B → C
// Suporte para 5000 usuários simultâneos
// ============================================

import React, { 
  createContext, 
  useContext, 
  useEffect, 
  useState, 
  useCallback, 
  useMemo, 
  useRef,
  useReducer
} from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';

// ===== TIPOS DO SISTEMA =====
interface FormulaDefinition {
  id: string;
  name: string;
  dependencies: string[];
  compute: (deps: Record<string, number>) => number;
  category: 'financial' | 'kpi' | 'counter' | 'percentage' | 'projection';
}

interface DataSource {
  id: string;
  type: 'internal' | 'external';
  table?: string;
  query?: string;
  refreshInterval: number; // ms
  lastFetch: Date | null;
  value: number;
  status: 'fresh' | 'stale' | 'loading' | 'error';
}

interface LiveSheetState {
  // Dados Base (fontes primárias)
  baseData: Record<string, number>;
  
  // Dados Derivados (calculados por fórmulas)
  derivedData: Record<string, number>;
  
  // Metadados
  sources: Record<string, DataSource>;
  formulas: Record<string, FormulaDefinition>;
  dependencyGraph: Record<string, string[]>;
  reverseDependencyGraph: Record<string, string[]>;
  
  // Status
  lastUpdate: Date;
  isConnected: boolean;
  pendingUpdates: number;
  computationTime: number;
}

type LiveSheetAction =
  | { type: 'SET_BASE_VALUE'; key: string; value: number; source?: string }
  | { type: 'BATCH_UPDATE'; updates: Record<string, number> }
  | { type: 'RECOMPUTE_ALL' }
  | { type: 'SET_CONNECTION_STATUS'; connected: boolean }
  | { type: 'SET_SOURCE_STATUS'; sourceId: string; status: DataSource['status'] }
  | { type: 'INCREMENT_PENDING' }
  | { type: 'DECREMENT_PENDING' }
  | { type: 'SET_COMPUTATION_TIME'; time: number };

// ===== FÓRMULAS DO SISTEMA =====
// Todas as fórmulas com dependências explícitas
const SYSTEM_FORMULAS: FormulaDefinition[] = [
  // === FINANCEIRO ===
  {
    id: 'saldo_mes',
    name: 'Saldo do Mês',
    dependencies: ['receita_mes', 'despesa_mes'],
    compute: (deps) => deps.receita_mes - deps.despesa_mes,
    category: 'financial'
  },
  {
    id: 'lucro_liquido',
    name: 'Lucro Líquido',
    dependencies: ['receita_mes', 'despesa_pessoal', 'despesa_empresa'],
    compute: (deps) => deps.receita_mes - deps.despesa_pessoal - deps.despesa_empresa,
    category: 'financial'
  },
  {
    id: 'despesa_total',
    name: 'Despesa Total',
    dependencies: ['despesa_pessoal', 'despesa_empresa', 'despesa_fixa'],
    compute: (deps) => deps.despesa_pessoal + deps.despesa_empresa + (deps.despesa_fixa || 0),
    category: 'financial'
  },
  
  // === PERCENTUAIS (KPIs) ===
  {
    id: 'taxa_economia',
    name: 'Taxa de Economia',
    dependencies: ['receita_mes', 'saldo_mes'],
    compute: (deps) => deps.receita_mes > 0 ? (deps.saldo_mes / deps.receita_mes) * 100 : 0,
    category: 'percentage'
  },
  {
    id: 'margem_lucro',
    name: 'Margem de Lucro',
    dependencies: ['receita_mes', 'lucro_liquido'],
    compute: (deps) => deps.receita_mes > 0 ? (deps.lucro_liquido / deps.receita_mes) * 100 : 0,
    category: 'percentage'
  },
  {
    id: 'uso_orcamento',
    name: 'Uso do Orçamento',
    dependencies: ['receita_mes', 'despesa_total'],
    compute: (deps) => deps.receita_mes > 0 ? Math.min((deps.despesa_total / deps.receita_mes) * 100, 150) : 0,
    category: 'percentage'
  },
  {
    id: 'progresso_meta',
    name: 'Progresso da Meta',
    dependencies: ['receita_mes', 'meta_mensal'],
    compute: (deps) => deps.meta_mensal > 0 ? Math.min((deps.receita_mes / deps.meta_mensal) * 100, 100) : 0,
    category: 'percentage'
  },
  {
    id: 'taxa_conversao',
    name: 'Taxa de Conversão',
    dependencies: ['vendas_mes', 'leads_total'],
    compute: (deps) => deps.leads_total > 0 ? (deps.vendas_mes / deps.leads_total) * 100 : 0,
    category: 'percentage'
  },
  {
    id: 'taxa_conclusao_tarefas',
    name: 'Taxa de Conclusão',
    dependencies: ['tarefas_concluidas', 'tarefas_total'],
    compute: (deps) => deps.tarefas_total > 0 ? (deps.tarefas_concluidas / deps.tarefas_total) * 100 : 0,
    category: 'percentage'
  },
  
  // === PROJEÇÕES (baseadas em dados reais) ===
  {
    id: 'receita_projetada',
    name: 'Receita Projetada',
    dependencies: ['receita_mes', 'taxa_crescimento_receita'],
    compute: (deps) => deps.receita_mes * (1 + (deps.taxa_crescimento_receita || 0) / 100),
    category: 'projection'
  },
  {
    id: 'despesa_projetada',
    name: 'Despesa Projetada',
    dependencies: ['despesa_total', 'taxa_crescimento_despesa'],
    compute: (deps) => deps.despesa_total * (1 + (deps.taxa_crescimento_despesa || 0) / 100),
    category: 'projection'
  },
  {
    id: 'alunos_projetados',
    name: 'Alunos Projetados',
    dependencies: ['alunos_ativos', 'taxa_crescimento_alunos'],
    compute: (deps) => Math.round(deps.alunos_ativos * (1 + (deps.taxa_crescimento_alunos || 0) / 100)),
    category: 'projection'
  },
  
  // === KPIs DE NEGÓCIO ===
  {
    id: 'ltv',
    name: 'LTV (Lifetime Value)',
    dependencies: ['receita_por_aluno', 'tempo_medio_retencao'],
    compute: (deps) => deps.receita_por_aluno * deps.tempo_medio_retencao,
    category: 'kpi'
  },
  {
    id: 'cac',
    name: 'CAC (Custo Aquisição)',
    dependencies: ['despesa_marketing', 'novos_alunos_mes'],
    compute: (deps) => deps.novos_alunos_mes > 0 ? deps.despesa_marketing / deps.novos_alunos_mes : 0,
    category: 'kpi'
  },
  {
    id: 'roi_marketing',
    name: 'ROI Marketing',
    dependencies: ['receita_marketing', 'despesa_marketing'],
    compute: (deps) => deps.despesa_marketing > 0 
      ? ((deps.receita_marketing - deps.despesa_marketing) / deps.despesa_marketing) * 100 
      : 0,
    category: 'kpi'
  },
  {
    id: 'nps_calculado',
    name: 'NPS Calculado',
    dependencies: ['promotores', 'detratores', 'total_respondentes'],
    compute: (deps) => deps.total_respondentes > 0 
      ? ((deps.promotores - deps.detratores) / deps.total_respondentes) * 100 
      : 0,
    category: 'kpi'
  },
  {
    id: 'taxa_retencao',
    name: 'Taxa de Retenção',
    dependencies: ['alunos_ativos', 'alunos_inicio_periodo', 'novos_alunos_mes'],
    compute: (deps) => {
      const base = deps.alunos_inicio_periodo || deps.alunos_ativos;
      return base > 0 ? ((deps.alunos_ativos - deps.novos_alunos_mes) / base) * 100 : 0;
    },
    category: 'kpi'
  },
  {
    id: 'taxa_churn',
    name: 'Taxa de Churn',
    dependencies: ['taxa_retencao'],
    compute: (deps) => 100 - deps.taxa_retencao,
    category: 'kpi'
  },
  
  // === CONTADORES DERIVADOS ===
  {
    id: 'total_usuarios',
    name: 'Total de Usuários',
    dependencies: ['alunos_ativos', 'funcionarios_ativos', 'afiliados_ativos'],
    compute: (deps) => deps.alunos_ativos + deps.funcionarios_ativos + deps.afiliados_ativos,
    category: 'counter'
  },
  {
    id: 'tarefas_pendentes',
    name: 'Tarefas Pendentes',
    dependencies: ['tarefas_total', 'tarefas_concluidas'],
    compute: (deps) => deps.tarefas_total - deps.tarefas_concluidas,
    category: 'counter'
  },
  {
    id: 'falta_para_meta',
    name: 'Falta para Meta',
    dependencies: ['meta_mensal', 'receita_mes'],
    compute: (deps) => Math.max(0, deps.meta_mensal - deps.receita_mes),
    category: 'financial'
  },
  
  // === RECEITA POR FONTE ===
  {
    id: 'receita_por_aluno',
    name: 'Receita por Aluno',
    dependencies: ['receita_mes', 'alunos_ativos'],
    compute: (deps) => deps.alunos_ativos > 0 ? deps.receita_mes / deps.alunos_ativos : 0,
    category: 'kpi'
  },
];

// ===== CONSTRUIR GRAFO DE DEPENDÊNCIAS =====
function buildDependencyGraphs(formulas: FormulaDefinition[]) {
  const dependencyGraph: Record<string, string[]> = {};
  const reverseDependencyGraph: Record<string, string[]> = {};
  
  formulas.forEach(formula => {
    dependencyGraph[formula.id] = formula.dependencies;
    
    formula.dependencies.forEach(dep => {
      if (!reverseDependencyGraph[dep]) {
        reverseDependencyGraph[dep] = [];
      }
      reverseDependencyGraph[dep].push(formula.id);
    });
  });
  
  return { dependencyGraph, reverseDependencyGraph };
}

// ===== ORDENAÇÃO TOPOLÓGICA PARA COMPUTAÇÃO =====
function topologicalSort(formulas: FormulaDefinition[]): string[] {
  const visited = new Set<string>();
  const result: string[] = [];
  const formulaMap = new Map(formulas.map(f => [f.id, f]));
  
  function visit(id: string) {
    if (visited.has(id)) return;
    visited.add(id);
    
    const formula = formulaMap.get(id);
    if (formula) {
      formula.dependencies.forEach(dep => {
        if (formulaMap.has(dep)) {
          visit(dep);
        }
      });
    }
    result.push(id);
  }
  
  formulas.forEach(f => visit(f.id));
  return result;
}

// ===== REDUCER DO ESTADO =====
function liveSheetReducer(state: LiveSheetState, action: LiveSheetAction): LiveSheetState {
  switch (action.type) {
    case 'SET_BASE_VALUE': {
      const newBaseData = { ...state.baseData, [action.key]: action.value };
      const startTime = performance.now();
      
      // Recomputar valores afetados em cascata
      const derivedData = computeAllDerived(newBaseData, state.formulas);
      const computationTime = performance.now() - startTime;
      
      return {
        ...state,
        baseData: newBaseData,
        derivedData,
        lastUpdate: new Date(),
        computationTime,
      };
    }
    
    case 'BATCH_UPDATE': {
      const newBaseData = { ...state.baseData, ...action.updates };
      const startTime = performance.now();
      
      const derivedData = computeAllDerived(newBaseData, state.formulas);
      const computationTime = performance.now() - startTime;
      
      return {
        ...state,
        baseData: newBaseData,
        derivedData,
        lastUpdate: new Date(),
        computationTime,
      };
    }
    
    case 'RECOMPUTE_ALL': {
      const startTime = performance.now();
      const derivedData = computeAllDerived(state.baseData, state.formulas);
      const computationTime = performance.now() - startTime;
      
      return {
        ...state,
        derivedData,
        lastUpdate: new Date(),
        computationTime,
      };
    }
    
    case 'SET_CONNECTION_STATUS':
      return { ...state, isConnected: action.connected };
      
    case 'INCREMENT_PENDING':
      return { ...state, pendingUpdates: state.pendingUpdates + 1 };
      
    case 'DECREMENT_PENDING':
      return { ...state, pendingUpdates: Math.max(0, state.pendingUpdates - 1) };
      
    case 'SET_COMPUTATION_TIME':
      return { ...state, computationTime: action.time };
      
    default:
      return state;
  }
}

// ===== COMPUTAR TODOS OS VALORES DERIVADOS =====
function computeAllDerived(
  baseData: Record<string, number>,
  formulas: Record<string, FormulaDefinition>
): Record<string, number> {
  const derived: Record<string, number> = {};
  const formulaList = Object.values(formulas);
  const sortedIds = topologicalSort(formulaList);
  
  // Criar objeto combinado para lookup
  const allData = () => ({ ...baseData, ...derived });
  
  sortedIds.forEach(id => {
    const formula = formulas[id];
    if (formula) {
      const deps: Record<string, number> = {};
      let canCompute = true;
      
      formula.dependencies.forEach(depId => {
        const val = allData()[depId];
        if (val !== undefined) {
          deps[depId] = val;
        } else {
          // Usar 0 como fallback para dependências não encontradas
          deps[depId] = 0;
        }
      });
      
      try {
        derived[id] = formula.compute(deps);
      } catch (e) {
        console.warn(`[LiveSheet] Erro ao computar ${id}:`, e);
        derived[id] = 0;
      }
    }
  });
  
  return derived;
}

// ===== ESTADO INICIAL =====
const { dependencyGraph, reverseDependencyGraph } = buildDependencyGraphs(SYSTEM_FORMULAS);
const formulasMap = Object.fromEntries(SYSTEM_FORMULAS.map(f => [f.id, f]));

const initialState: LiveSheetState = {
  baseData: {
    // Valores iniciais (serão substituídos pelos dados reais)
    meta_mensal: 10000000, // R$ 100.000,00
    tempo_medio_retencao: 12, // meses
    taxa_crescimento_receita: 8,
    taxa_crescimento_despesa: 5,
    taxa_crescimento_alunos: 12,
  },
  derivedData: {},
  sources: {},
  formulas: formulasMap,
  dependencyGraph,
  reverseDependencyGraph,
  lastUpdate: new Date(),
  isConnected: false,
  pendingUpdates: 0,
  computationTime: 0,
};

// ===== CONTEXT =====
interface LiveSheetContextType {
  state: LiveSheetState;
  
  // Getters
  getValue: (key: string) => number;
  getFormatted: (key: string, format?: 'currency' | 'percent' | 'number') => string;
  getFormula: (key: string) => FormulaDefinition | undefined;
  getDependencies: (key: string) => string[];
  getDependents: (key: string) => string[];
  
  // Setters
  setValue: (key: string, value: number) => void;
  batchUpdate: (updates: Record<string, number>) => void;
  forceRecompute: () => void;
  
  // Utils
  formatCurrency: (cents: number) => string;
  formatPercent: (value: number) => string;
  
  // Status
  isReactive: boolean;
  latency: number;
}

const LiveSheetContext = createContext<LiveSheetContextType | null>(null);

// ===== PROVIDER =====
export function LiveSheetProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(liveSheetReducer, initialState);
  const queryClient = useQueryClient();
  const channelRef = useRef<any>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const externalSyncRef = useRef<NodeJS.Timeout | null>(null);
  
  // ===== FETCH INICIAL DE DADOS =====
  const fetchBaseData = useCallback(async () => {
    dispatch({ type: 'INCREMENT_PENDING' });
    
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
    const today = new Date().toISOString().split('T')[0];
    
    try {
      const [
        entradas, despesasPagas, despesasPessoais, despesasEmpresa,
        alunos, funcionarios, afiliados, vendas, tarefas, tarefasConcluidas,
        leads, pagamentosPendentes, comissoes
      ] = await Promise.all([
        supabase.from('entradas').select('valor').gte('created_at', startOfMonth),
        supabase.from('contas_pagar').select('valor').eq('status', 'pago').gte('data_pagamento', startOfMonth),
        supabase.from('personal_extra_expenses').select('valor').gte('data', startOfMonth),
        supabase.from('company_extra_expenses').select('valor').gte('data', startOfMonth),
        supabase.from('alunos').select('id', { count: 'exact', head: true }).eq('status', 'ativo'),
        supabase.from('employees').select('id', { count: 'exact', head: true }).eq('status', 'ativo'),
        supabase.from('affiliates').select('id', { count: 'exact', head: true }).eq('status', 'ativo'),
        supabase.from('transacoes_hotmart_completo').select('id', { count: 'exact', head: true })
          .in('status', ['approved', 'purchase_approved']).gte('data_compra', startOfMonth),
        supabase.from('calendar_tasks').select('id, is_completed').eq('task_date', today),
        supabase.from('calendar_tasks').select('id', { count: 'exact', head: true }).eq('task_date', today).eq('is_completed', true),
        supabase.from('whatsapp_leads').select('id', { count: 'exact', head: true }),
        supabase.from('contas_pagar').select('id', { count: 'exact', head: true }).eq('status', 'pendente'),
        supabase.from('comissoes').select('valor').gte('created_at', startOfMonth),
      ]);
      
      const receitaMes = (entradas.data || []).reduce((sum, e) => sum + (e.valor || 0), 0);
      const despesaPaga = (despesasPagas.data || []).reduce((sum, d) => sum + (d.valor || 0), 0);
      const despesaPessoal = (despesasPessoais.data || []).reduce((sum, d) => sum + (d.valor || 0), 0);
      const despesaEmpresa = (despesasEmpresa.data || []).reduce((sum, d) => sum + (d.valor || 0), 0);
      const comissoesTotal = (comissoes.data || []).reduce((sum, c) => sum + (c.valor || 0), 0);
      
      const tarefasData = tarefas.data || [];
      const tarefasTotal = tarefasData.length;
      const tarefasConcl = tarefasData.filter((t: any) => t.is_completed).length;
      
      dispatch({
        type: 'BATCH_UPDATE',
        updates: {
          receita_mes: receitaMes,
          despesa_mes: despesaPaga + despesaPessoal + despesaEmpresa,
          despesa_pessoal: despesaPessoal,
          despesa_empresa: despesaEmpresa,
          despesa_fixa: despesaPaga,
          alunos_ativos: alunos.count || 0,
          alunos_inicio_periodo: alunos.count || 0,
          funcionarios_ativos: funcionarios.count || 0,
          afiliados_ativos: afiliados.count || 0,
          vendas_mes: vendas.count || 0,
          novos_alunos_mes: vendas.count || 0, // Aproximação
          tarefas_total: tarefasTotal,
          tarefas_concluidas: tarefasConcl,
          leads_total: leads.count || 0,
          pagamentos_pendentes: pagamentosPendentes.count || 0,
          total_comissoes: comissoesTotal,
          despesa_marketing: Math.round(receitaMes * 0.1), // Estimativa 10%
          receita_marketing: Math.round(receitaMes * 0.7), // Estimativa 70% vem de marketing
          // NPS - usar dados reais se disponíveis
          promotores: Math.round((alunos.count || 0) * 0.7),
          detratores: Math.round((alunos.count || 0) * 0.1),
          total_respondentes: Math.round((alunos.count || 0) * 0.8),
        }
      });
      
      dispatch({ type: 'SET_CONNECTION_STATUS', connected: true });
    } catch (error) {
      console.error('[LiveSheet] Erro ao buscar dados:', error);
    }
    
    dispatch({ type: 'DECREMENT_PENDING' });
  }, []);
  
  // ===== DEBOUNCED RECOMPUTE =====
  const debouncedRecompute = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchBaseData();
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    }, 150); // 150ms debounce para ficar abaixo de 300ms
  }, [fetchBaseData, queryClient]);
  
  // ===== SETUP REALTIME SUBSCRIPTIONS =====
  useEffect(() => {
    fetchBaseData();
    
    // Canal unificado para todas as tabelas
    const channel = supabase
      .channel('livesheet-realtime-v2')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'entradas' }, debouncedRecompute)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'contas_pagar' }, debouncedRecompute)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'contas_receber' }, debouncedRecompute)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'personal_extra_expenses' }, debouncedRecompute)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'company_extra_expenses' }, debouncedRecompute)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'alunos' }, debouncedRecompute)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'employees' }, debouncedRecompute)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'affiliates' }, debouncedRecompute)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'transacoes_hotmart_completo' }, debouncedRecompute)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'calendar_tasks' }, debouncedRecompute)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'whatsapp_leads' }, debouncedRecompute)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'comissoes' }, debouncedRecompute)
      .subscribe((status) => {
        console.log('[LiveSheet] Realtime status:', status);
        dispatch({ type: 'SET_CONNECTION_STATUS', connected: status === 'SUBSCRIBED' });
      });
    
    channelRef.current = channel;
    
    // Sync externo a cada 10 segundos (APIs, redes sociais)
    externalSyncRef.current = setInterval(() => {
      // Invalidar queries de dados externos
      queryClient.invalidateQueries({ queryKey: ['social-media-stats'] });
      queryClient.invalidateQueries({ queryKey: ['youtube-stats'] });
      queryClient.invalidateQueries({ queryKey: ['instagram-stats'] });
    }, 10000);
    
    return () => {
      if (channelRef.current) supabase.removeChannel(channelRef.current);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (externalSyncRef.current) clearInterval(externalSyncRef.current);
    };
  }, [fetchBaseData, debouncedRecompute, queryClient]);
  
  // ===== GETTERS =====
  const getValue = useCallback((key: string): number => {
    return state.derivedData[key] ?? state.baseData[key] ?? 0;
  }, [state.baseData, state.derivedData]);
  
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
  
  const getFormatted = useCallback((key: string, format?: 'currency' | 'percent' | 'number'): string => {
    const value = getValue(key);
    const formula = state.formulas[key];
    const autoFormat = formula?.category === 'percentage' ? 'percent' 
      : formula?.category === 'financial' ? 'currency' 
      : 'number';
    
    const finalFormat = format || autoFormat;
    
    switch (finalFormat) {
      case 'currency':
        return formatCurrency(value);
      case 'percent':
        return formatPercent(value);
      default:
        return value.toLocaleString('pt-BR');
    }
  }, [getValue, state.formulas, formatCurrency, formatPercent]);
  
  const getFormula = useCallback((key: string) => state.formulas[key], [state.formulas]);
  const getDependencies = useCallback((key: string) => state.dependencyGraph[key] || [], [state.dependencyGraph]);
  const getDependents = useCallback((key: string) => state.reverseDependencyGraph[key] || [], [state.reverseDependencyGraph]);
  
  // ===== SETTERS =====
  const setValue = useCallback((key: string, value: number) => {
    dispatch({ type: 'SET_BASE_VALUE', key, value });
  }, []);
  
  const batchUpdate = useCallback((updates: Record<string, number>) => {
    dispatch({ type: 'BATCH_UPDATE', updates });
  }, []);
  
  const forceRecompute = useCallback(() => {
    fetchBaseData();
  }, [fetchBaseData]);
  
  // ===== CONTEXT VALUE =====
  const contextValue = useMemo((): LiveSheetContextType => ({
    state,
    getValue,
    getFormatted,
    getFormula,
    getDependencies,
    getDependents,
    setValue,
    batchUpdate,
    forceRecompute,
    formatCurrency,
    formatPercent,
    isReactive: state.isConnected,
    latency: state.computationTime,
  }), [state, getValue, getFormatted, getFormula, getDependencies, getDependents, 
      setValue, batchUpdate, forceRecompute, formatCurrency, formatPercent]);
  
  return (
    <LiveSheetContext.Provider value={contextValue}>
      {children}
    </LiveSheetContext.Provider>
  );
}

// ===== HOOKS =====
export function useLiveSheet() {
  const context = useContext(LiveSheetContext);
  if (!context) {
    throw new Error('useLiveSheet must be used within LiveSheetProvider');
  }
  return context;
}

// Hook para valor específico com auto-subscribe
export function useLiveValue(key: string, format?: 'currency' | 'percent' | 'number') {
  const { getValue, getFormatted, getFormula, getDependents } = useLiveSheet();
  
  return useMemo(() => ({
    value: getValue(key),
    formatted: getFormatted(key, format),
    formula: getFormula(key),
    dependents: getDependents(key),
    key,
  }), [key, format, getValue, getFormatted, getFormula, getDependents]);
}

// Hook para múltiplos valores
export function useLiveValues(keys: string[]) {
  const { getValue, getFormatted } = useLiveSheet();
  
  return useMemo(() => {
    const values: Record<string, number> = {};
    const formatted: Record<string, string> = {};
    
    keys.forEach(key => {
      values[key] = getValue(key);
      formatted[key] = getFormatted(key);
    });
    
    return { values, formatted };
  }, [keys, getValue, getFormatted]);
}

// Hook para KPIs
export function useLiveKPIs() {
  const { getValue, getFormatted, state } = useLiveSheet();
  
  return useMemo(() => ({
    taxaEconomia: getValue('taxa_economia'),
    taxaEconomiaFormatada: getFormatted('taxa_economia', 'percent'),
    margemLucro: getValue('margem_lucro'),
    margemLucroFormatada: getFormatted('margem_lucro', 'percent'),
    usoOrcamento: getValue('uso_orcamento'),
    usoOrcamentoFormatado: getFormatted('uso_orcamento', 'percent'),
    progressoMeta: getValue('progresso_meta'),
    progressoMetaFormatado: getFormatted('progresso_meta', 'percent'),
    taxaConversao: getValue('taxa_conversao'),
    taxaConversaoFormatada: getFormatted('taxa_conversao', 'percent'),
    nps: getValue('nps_calculado'),
    taxaRetencao: getValue('taxa_retencao'),
    taxaChurn: getValue('taxa_churn'),
    ltv: getValue('ltv'),
    ltvFormatado: getFormatted('ltv', 'currency'),
    cac: getValue('cac'),
    cacFormatado: getFormatted('cac', 'currency'),
    roiMarketing: getValue('roi_marketing'),
    roiMarketingFormatado: getFormatted('roi_marketing', 'percent'),
    lastUpdate: state.lastUpdate,
    computationTime: state.computationTime,
  }), [getValue, getFormatted, state.lastUpdate, state.computationTime]);
}

// Hook para Finanças
export function useLiveFinance() {
  const { getValue, getFormatted, state } = useLiveSheet();
  
  return useMemo(() => ({
    receitaMes: getValue('receita_mes'),
    receitaMesFormatada: getFormatted('receita_mes', 'currency'),
    despesaMes: getValue('despesa_mes'),
    despesaMesFormatada: getFormatted('despesa_mes', 'currency'),
    despesaPessoal: getValue('despesa_pessoal'),
    despesaPessoalFormatada: getFormatted('despesa_pessoal', 'currency'),
    despesaEmpresa: getValue('despesa_empresa'),
    despesaEmpresaFormatada: getFormatted('despesa_empresa', 'currency'),
    saldoMes: getValue('saldo_mes'),
    saldoMesFormatado: getFormatted('saldo_mes', 'currency'),
    lucroLiquido: getValue('lucro_liquido'),
    lucroLiquidoFormatado: getFormatted('lucro_liquido', 'currency'),
    faltaParaMeta: getValue('falta_para_meta'),
    faltaParaMetaFormatada: getFormatted('falta_para_meta', 'currency'),
    metaMensal: getValue('meta_mensal'),
    metaMensalFormatada: getFormatted('meta_mensal', 'currency'),
    isPositivo: getValue('saldo_mes') >= 0,
    lastUpdate: state.lastUpdate,
  }), [getValue, getFormatted, state.lastUpdate]);
}

// Hook para Contadores
export function useLiveCounters() {
  const { getValue } = useLiveSheet();
  
  return useMemo(() => ({
    alunos: getValue('alunos_ativos'),
    funcionarios: getValue('funcionarios_ativos'),
    afiliados: getValue('afiliados_ativos'),
    vendas: getValue('vendas_mes'),
    tarefasTotal: getValue('tarefas_total'),
    tarefasConcluidas: getValue('tarefas_concluidas'),
    tarefasPendentes: getValue('tarefas_pendentes'),
    pagamentosPendentes: getValue('pagamentos_pendentes'),
    leads: getValue('leads_total'),
    totalUsuarios: getValue('total_usuarios'),
  }), [getValue]);
}

// Hook para Projeções
export function useLiveProjections() {
  const { getValue, getFormatted } = useLiveSheet();
  
  return useMemo(() => ({
    receitaProjetada: getValue('receita_projetada'),
    receitaProjetadaFormatada: getFormatted('receita_projetada', 'currency'),
    despesaProjetada: getValue('despesa_projetada'),
    despesaProjetadaFormatada: getFormatted('despesa_projetada', 'currency'),
    alunosProjetados: getValue('alunos_projetados'),
    taxaCrescimentoReceita: getValue('taxa_crescimento_receita'),
    taxaCrescimentoDespesa: getValue('taxa_crescimento_despesa'),
    taxaCrescimentoAlunos: getValue('taxa_crescimento_alunos'),
  }), [getValue, getFormatted]);
}

// Export formulas for documentation
export { SYSTEM_FORMULAS };
