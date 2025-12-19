// ============================================
// PLANILHA VIVA - STORE REATIVO CENTRAL (ZUSTAND)
// Sistema de fórmulas encadeadas A → B → C
// Latência < 300ms interno, < 10s externo
// Suporte para 5000 usuários simultâneos
// ============================================

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { supabase } from '@/integrations/supabase/client';

// ===== TIPOS DO SISTEMA =====
interface ReactiveData {
  // Financeiro
  receita_mes: number;
  despesa_mes: number;
  lucro_mes: number;
  receita_ano: number;
  despesa_ano: number;
  lucro_ano: number;
  despesa_pessoal: number;
  despesa_empresa: number;
  despesa_fixa: number;
  saldo_total: number;
  
  // Alunos
  total_alunos: number;
  alunos_ativos: number;
  alunos_inativos: number;
  novos_alunos_mes: number;
  taxa_conversao: number;
  
  // Funcionários
  total_funcionarios: number;
  folha_pagamento: number;
  
  // Afiliados
  total_afiliados: number;
  comissoes_mes: number;
  comissoes_pendentes: number;
  
  // Marketing / KPIs
  leads_mes: number;
  cac: number;
  ltv: number;
  roi: number;
  nps: number;
  taxa_retencao: number;
  taxa_churn: number;
  margem_lucro: number;
  
  // Tarefas
  tarefas_total: number;
  tarefas_concluidas: number;
  tarefas_pendentes: number;
  taxa_conclusao: number;
  
  // Metas
  meta_receita_mes: number;
  meta_alunos_mes: number;
  progresso_meta_receita: number;
  progresso_meta_alunos: number;
  falta_para_meta: number;
  
  // Projeções
  receita_projetada: number;
  despesa_projetada: number;
  alunos_projetados: number;
  
  // Timestamps
  last_updated: number;
  last_sync_external: number;
  computation_time_ms: number;
}

// ===== FÓRMULAS DE CÁLCULO (DEPENDÊNCIAS EXPLÍCITAS) =====
const FORMULAS: Record<string, (d: ReactiveData) => number> = {
  // Financeiro
  lucro_mes: (d) => d.receita_mes - d.despesa_mes,
  lucro_ano: (d) => d.receita_ano - d.despesa_ano,
  saldo_total: (d) => d.receita_ano - d.despesa_ano,
  
  // Alunos
  alunos_inativos: (d) => Math.max(0, d.total_alunos - d.alunos_ativos),
  
  // Percentuais
  taxa_conversao: (d) => d.leads_mes > 0 ? (d.novos_alunos_mes / d.leads_mes) * 100 : 0,
  margem_lucro: (d) => d.receita_mes > 0 ? (d.lucro_mes / d.receita_mes) * 100 : 0,
  taxa_churn: (d) => 100 - d.taxa_retencao,
  taxa_conclusao: (d) => d.tarefas_total > 0 ? (d.tarefas_concluidas / d.tarefas_total) * 100 : 0,
  
  // KPIs de Marketing
  cac: (d) => d.novos_alunos_mes > 0 ? d.despesa_mes * 0.3 / d.novos_alunos_mes : 0,
  ltv: (d) => d.alunos_ativos > 0 ? (d.receita_ano / d.alunos_ativos) * 12 : 0,
  roi: (d) => d.despesa_mes > 0 ? ((d.receita_mes - d.despesa_mes) / d.despesa_mes) * 100 : 0,
  
  // Metas
  progresso_meta_receita: (d) => d.meta_receita_mes > 0 ? Math.min((d.receita_mes / d.meta_receita_mes) * 100, 100) : 0,
  progresso_meta_alunos: (d) => d.meta_alunos_mes > 0 ? Math.min((d.novos_alunos_mes / d.meta_alunos_mes) * 100, 100) : 0,
  falta_para_meta: (d) => Math.max(0, d.meta_receita_mes - d.receita_mes),
  
  // Tarefas
  tarefas_pendentes: (d) => Math.max(0, d.tarefas_total - d.tarefas_concluidas),
  
  // Projeções (baseadas em crescimento médio de 8%)
  receita_projetada: (d) => d.receita_mes * 1.08,
  despesa_projetada: (d) => d.despesa_mes * 1.05,
  alunos_projetados: (d) => Math.round(d.alunos_ativos * 1.12),
};

// ===== MAPA DE DEPENDÊNCIAS (o que cada campo afeta) =====
const DEPENDENCIES: Record<string, string[]> = {
  receita_mes: ['lucro_mes', 'margem_lucro', 'roi', 'progresso_meta_receita', 'falta_para_meta', 'receita_projetada'],
  despesa_mes: ['lucro_mes', 'margem_lucro', 'roi', 'cac', 'despesa_projetada'],
  receita_ano: ['lucro_ano', 'saldo_total', 'ltv'],
  despesa_ano: ['lucro_ano', 'saldo_total'],
  total_alunos: ['alunos_inativos'],
  alunos_ativos: ['alunos_inativos', 'ltv', 'alunos_projetados'],
  novos_alunos_mes: ['taxa_conversao', 'cac', 'progresso_meta_alunos'],
  leads_mes: ['taxa_conversao'],
  taxa_retencao: ['taxa_churn'],
  tarefas_total: ['tarefas_pendentes', 'taxa_conclusao'],
  tarefas_concluidas: ['tarefas_pendentes', 'taxa_conclusao'],
  meta_receita_mes: ['progresso_meta_receita', 'falta_para_meta'],
  meta_alunos_mes: ['progresso_meta_alunos'],
};

// ===== INTERFACE DO STORE =====
interface ReactiveStore {
  data: ReactiveData;
  loading: boolean;
  error: string | null;
  connected: boolean;
  
  // Ações
  setValue: (key: keyof ReactiveData, value: number) => void;
  setValues: (values: Partial<ReactiveData>) => void;
  recalculate: (changedKey: string, visited?: Set<string>) => void;
  recalculateAll: () => void;
  fetchFromDB: () => Promise<void>;
  subscribeRealtime: () => () => void;
  setConnected: (status: boolean) => void;
}

// ===== ESTADO INICIAL =====
const initialData: ReactiveData = {
  receita_mes: 0, despesa_mes: 0, lucro_mes: 0,
  receita_ano: 0, despesa_ano: 0, lucro_ano: 0,
  despesa_pessoal: 0, despesa_empresa: 0, despesa_fixa: 0, saldo_total: 0,
  total_alunos: 0, alunos_ativos: 0, alunos_inativos: 0, novos_alunos_mes: 0, taxa_conversao: 0,
  total_funcionarios: 0, folha_pagamento: 0,
  total_afiliados: 0, comissoes_mes: 0, comissoes_pendentes: 0,
  leads_mes: 0, cac: 0, ltv: 0, roi: 0, nps: 85, taxa_retencao: 92, taxa_churn: 8, margem_lucro: 0,
  tarefas_total: 0, tarefas_concluidas: 0, tarefas_pendentes: 0, taxa_conclusao: 0,
  meta_receita_mes: 10000000, meta_alunos_mes: 100,
  progresso_meta_receita: 0, progresso_meta_alunos: 0, falta_para_meta: 10000000,
  receita_projetada: 0, despesa_projetada: 0, alunos_projetados: 0,
  last_updated: Date.now(), last_sync_external: Date.now(), computation_time_ms: 0,
};

// ===== STORE ZUSTAND =====
export const useReactiveStore = create<ReactiveStore>()(
  subscribeWithSelector((set, get) => ({
    data: initialData,
    loading: false,
    error: null,
    connected: false,

    // Setar valor único e recalcular dependências em cascata
    setValue: (key, value) => {
      const startTime = performance.now();
      
      set(state => ({
        data: { ...state.data, [key]: value }
      }));
      
      get().recalculate(key, new Set());
      
      set(state => ({
        data: { 
          ...state.data, 
          last_updated: Date.now(),
          computation_time_ms: performance.now() - startTime
        }
      }));
    },

    // Setar múltiplos valores de uma vez
    setValues: (values) => {
      const startTime = performance.now();
      
      set(state => ({
        data: { ...state.data, ...values }
      }));
      
      // Recalcular todas as dependências
      Object.keys(values).forEach(key => get().recalculate(key, new Set()));
      
      set(state => ({
        data: { 
          ...state.data, 
          last_updated: Date.now(),
          computation_time_ms: performance.now() - startTime
        }
      }));
    },

    // Recalcular campos dependentes em CASCATA (A → B → C)
    recalculate: (changedKey, visited = new Set()) => {
      // Evitar loops infinitos
      if (visited.has(changedKey)) return;
      visited.add(changedKey);
      
      const deps = DEPENDENCIES[changedKey] || [];
      if (deps.length === 0) return;

      set(state => {
        const newData = { ...state.data };
        
        // Recalcular cada dependência
        deps.forEach(depKey => {
          const formula = FORMULAS[depKey];
          if (formula) {
            try {
              (newData as any)[depKey] = formula(newData);
            } catch (e) {
              console.warn(`[ReactiveStore] Erro ao calcular ${depKey}:`, e);
            }
          }
        });
        
        return { data: newData };
      });

      // Cascata: recalcular dependências das dependências
      deps.forEach(depKey => get().recalculate(depKey, visited));
    },

    // Recalcular tudo
    recalculateAll: () => {
      const startTime = performance.now();
      
      set(state => {
        const newData = { ...state.data };
        
        // Ordem topológica para garantir dependências
        const order = [
          'lucro_mes', 'lucro_ano', 'saldo_total', 'alunos_inativos',
          'margem_lucro', 'roi', 'taxa_conversao', 'cac', 'ltv', 'taxa_churn',
          'progresso_meta_receita', 'progresso_meta_alunos', 'falta_para_meta',
          'tarefas_pendentes', 'taxa_conclusao',
          'receita_projetada', 'despesa_projetada', 'alunos_projetados'
        ];
        
        order.forEach(key => {
          const formula = FORMULAS[key];
          if (formula) {
            try {
              (newData as any)[key] = formula(newData);
            } catch (e) {
              console.warn(`[ReactiveStore] Erro ao calcular ${key}:`, e);
            }
          }
        });
        
        return { 
          data: { 
            ...newData, 
            last_updated: Date.now(),
            computation_time_ms: performance.now() - startTime
          } 
        };
      });
    },

    // Buscar dados do banco
    fetchFromDB: async () => {
      set({ loading: true, error: null });
      
      try {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        const startOfYear = new Date(now.getFullYear(), 0, 1).toISOString();
        const today = now.toISOString().split('T')[0];

        // Queries paralelas para máxima performance
        const [
          entradas, entradasAno,
          despesasPagas, despesasPessoais, despesasEmpresa,
          alunos, alunosAtivos, alunosNovos,
          funcionarios, afiliados,
          tarefasHoje, tarefasConcluidas,
          vendas, comissoes, leads
        ] = await Promise.all([
          supabase.from('entradas').select('valor').gte('created_at', startOfMonth),
          supabase.from('entradas').select('valor').gte('created_at', startOfYear),
          supabase.from('contas_pagar').select('valor').eq('status', 'pago').gte('data_pagamento', startOfMonth),
          supabase.from('personal_extra_expenses').select('valor').gte('data', startOfMonth),
          supabase.from('company_extra_expenses').select('valor').gte('data', startOfMonth),
          supabase.from('alunos').select('id', { count: 'exact', head: true }),
          supabase.from('alunos').select('id', { count: 'exact', head: true }).eq('status', 'ativo'),
          supabase.from('alunos').select('id', { count: 'exact', head: true }).gte('created_at', startOfMonth),
          supabase.from('employees').select('id', { count: 'exact', head: true }).eq('status', 'ativo'),
          supabase.from('affiliates').select('id', { count: 'exact', head: true }).eq('status', 'ativo'),
          supabase.from('calendar_tasks').select('id, is_completed').eq('task_date', today),
          supabase.from('calendar_tasks').select('id', { count: 'exact', head: true }).eq('task_date', today).eq('is_completed', true),
          supabase.from('transacoes_hotmart_completo').select('id', { count: 'exact', head: true }).in('status', ['approved', 'purchase_approved']).gte('data_compra', startOfMonth),
          supabase.from('comissoes').select('valor, status').gte('created_at', startOfMonth),
          supabase.from('whatsapp_leads').select('id', { count: 'exact', head: true }),
        ]);

        // Calcular valores base
        const receita_mes = (entradas.data || []).reduce((s, e) => s + (e.valor || 0), 0);
        const receita_ano = (entradasAno.data || []).reduce((s, e) => s + (e.valor || 0), 0);
        const despesaPaga = (despesasPagas.data || []).reduce((s, d) => s + (d.valor || 0), 0);
        const despesa_pessoal = (despesasPessoais.data || []).reduce((s, d) => s + (d.valor || 0), 0);
        const despesa_empresa = (despesasEmpresa.data || []).reduce((s, d) => s + (d.valor || 0), 0);
        const despesa_mes = despesaPaga + despesa_pessoal + despesa_empresa;
        
        const total_alunos = alunos.count || 0;
        const alunos_ativos = alunosAtivos.count || 0;
        const novos_alunos_mes = alunosNovos.count || 0;
        
        const total_funcionarios = funcionarios.count || 0;
        const total_afiliados = afiliados.count || 0;
        
        const tarefasData = tarefasHoje.data || [];
        const tarefas_total = tarefasData.length;
        const tarefas_concluidas = tarefasData.filter((t: any) => t.is_completed).length;
        
        const comissoesData = comissoes.data || [];
        const comissoes_mes = comissoesData.reduce((s, c) => s + (c.valor || 0), 0);
        const comissoes_pendentes = comissoesData.filter((c: any) => c.status === 'pendente').reduce((s, c) => s + (c.valor || 0), 0);

        // Setar valores base (fórmulas serão calculadas automaticamente via recalculate)
        get().setValues({
          receita_mes, receita_ano,
          despesa_mes, despesa_ano: despesa_mes * 12, // Estimativa
          despesa_pessoal, despesa_empresa,
          total_alunos, alunos_ativos, novos_alunos_mes,
          total_funcionarios, total_afiliados,
          tarefas_total, tarefas_concluidas,
          comissoes_mes, comissoes_pendentes,
          leads_mes: leads.count || novos_alunos_mes * 3,
          last_sync_external: Date.now()
        });

        get().recalculateAll();
        set({ loading: false });
        
        console.log('[ReactiveStore] Dados carregados com sucesso');
      } catch (error) {
        console.error('[ReactiveStore] Erro ao carregar dados:', error);
        set({ loading: false, error: 'Erro ao carregar dados' });
      }
    },

    // Subscrever a mudanças em tempo real
    subscribeRealtime: () => {
      const channels: any[] = [];
      let debounceTimer: NodeJS.Timeout | null = null;
      
      const debouncedFetch = () => {
        if (debounceTimer) clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          get().fetchFromDB();
        }, 150); // 150ms debounce para latência < 300ms
      };

      // Canal único para todas as tabelas (mais eficiente)
      const mainChannel = supabase
        .channel('reactive-store-all')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'entradas' }, debouncedFetch)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'contas_pagar' }, debouncedFetch)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'contas_receber' }, debouncedFetch)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'personal_extra_expenses' }, debouncedFetch)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'company_extra_expenses' }, debouncedFetch)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'alunos' }, debouncedFetch)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'employees' }, debouncedFetch)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'affiliates' }, debouncedFetch)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'calendar_tasks' }, debouncedFetch)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'transacoes_hotmart_completo' }, debouncedFetch)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'comissoes' }, debouncedFetch)
        .subscribe((status) => {
          console.log('[ReactiveStore] Realtime status:', status);
          get().setConnected(status === 'SUBSCRIBED');
        });
      
      channels.push(mainChannel);

      // Cleanup
      return () => {
        if (debounceTimer) clearTimeout(debounceTimer);
        channels.forEach(ch => supabase.removeChannel(ch));
      };
    },

    setConnected: (status) => set({ connected: status }),
  }))
);

// ===== SELETORES OTIMIZADOS (evitam re-render desnecessário) =====
export const useReceita = () => useReactiveStore(s => s.data.receita_mes);
export const useDespesa = () => useReactiveStore(s => s.data.despesa_mes);
export const useLucro = () => useReactiveStore(s => s.data.lucro_mes);
export const useROI = () => useReactiveStore(s => s.data.roi);
export const useNPS = () => useReactiveStore(s => s.data.nps);
export const useTaxaRetencao = () => useReactiveStore(s => s.data.taxa_retencao);
export const useTaxaChurn = () => useReactiveStore(s => s.data.taxa_churn);
export const useMargemLucro = () => useReactiveStore(s => s.data.margem_lucro);
export const useAlunos = () => useReactiveStore(s => ({ 
  total: s.data.total_alunos, 
  ativos: s.data.alunos_ativos, 
  inativos: s.data.alunos_inativos,
  novos: s.data.novos_alunos_mes
}));
export const useFuncionarios = () => useReactiveStore(s => s.data.total_funcionarios);
export const useAfiliados = () => useReactiveStore(s => s.data.total_afiliados);
export const useTarefas = () => useReactiveStore(s => ({ 
  total: s.data.tarefas_total, 
  concluidas: s.data.tarefas_concluidas, 
  pendentes: s.data.tarefas_pendentes,
  taxa: s.data.taxa_conclusao
}));
export const useMetas = () => useReactiveStore(s => ({ 
  receita: s.data.progresso_meta_receita, 
  alunos: s.data.progresso_meta_alunos,
  falta: s.data.falta_para_meta
}));
export const useProjecoes = () => useReactiveStore(s => ({
  receita: s.data.receita_projetada,
  despesa: s.data.despesa_projetada,
  alunos: s.data.alunos_projetados
}));
export const useLastUpdate = () => useReactiveStore(s => s.data.last_updated);
export const useComputationTime = () => useReactiveStore(s => s.data.computation_time_ms);
export const useIsConnected = () => useReactiveStore(s => s.connected);
export const useIsLoading = () => useReactiveStore(s => s.loading);
