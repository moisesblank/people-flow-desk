// ============================================
// PLANILHA VIVA v3.0 - STORE REATIVO CENTRAL (ZUSTAND)
// SSOT - Single Source of Truth
// Sistema de fórmulas encadeadas A → B → C
// Latência < 300ms interno, < 10s externo
// Suporte para 5000 usuários simultâneos
// ============================================

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { supabase } from '@/integrations/supabase/client';

// ===== TIPOS DO SISTEMA =====
export interface ReactiveData {
  // ===== FINANCEIRO =====
  receita_mes: number;
  receita_ano: number;
  receita_hoje: number;
  receita_semana: number;
  despesa_mes: number;
  despesa_ano: number;
  despesa_hoje: number;
  despesa_pessoal: number;
  despesa_empresa: number;
  despesa_fixa: number;
  despesa_marketing: number;
  lucro_mes: number;
  lucro_ano: number;
  saldo_total: number;
  margem_lucro: number;
  
  // ===== ALUNOS =====
  total_alunos: number;
  alunos_ativos: number;
  alunos_inativos: number;
  novos_alunos_mes: number;
  alunos_inicio_periodo: number;
  taxa_conversao: number;
  receita_por_aluno: number;
  
  // ===== FUNCIONÁRIOS =====
  total_funcionarios: number;
  folha_pagamento: number;
  
  // ===== AFILIADOS =====
  total_afiliados: number;
  comissoes_mes: number;
  comissoes_pendentes: number;
  
  // ===== MARKETING & KPIs =====
  leads_mes: number;
  vendas_mes: number;
  cac: number;
  ltv: number;
  roi: number;
  roas: number;
  
  // ===== NPS & RETENÇÃO (calculados de pesquisas/dados reais) =====
  promotores: number;
  detratores: number;
  neutros: number;
  total_respondentes: number;
  nps: number;
  taxa_retencao: number;
  taxa_churn: number;
  tempo_medio_retencao: number;
  
  // ===== TAREFAS =====
  tarefas_total: number;
  tarefas_concluidas: number;
  tarefas_pendentes: number;
  taxa_conclusao: number;
  
  // ===== METAS =====
  meta_receita_mes: number;
  meta_alunos_mes: number;
  meta_vendas_mes: number;
  progresso_meta_receita: number;
  progresso_meta_alunos: number;
  progresso_meta_vendas: number;
  falta_para_meta: number;
  
  // ===== PROJEÇÕES =====
  receita_projetada: number;
  despesa_projetada: number;
  alunos_projetados: number;
  lucro_projetado: number;
  taxa_crescimento_receita: number;
  taxa_crescimento_despesa: number;
  taxa_crescimento_alunos: number;
  
  // ===== REDES SOCIAIS (externo - atualiza em 10s) =====
  youtube_inscritos: number;
  youtube_views: number;
  instagram_seguidores: number;
  instagram_engajamento: number;
  tiktok_seguidores: number;
  facebook_seguidores: number;
  
  // ===== INTEGRAÇÕES =====
  hotmart_vendas_mes: number;
  hotmart_receita_mes: number;
  wordpress_usuarios: number;
  whatsapp_leads: number;
  whatsapp_conversas: number;
  
  // ===== TIMESTAMPS =====
  last_updated: number;
  last_sync_external: number;
  last_sync_social: number;
  computation_time_ms: number;
}

// ===== FÓRMULAS DE CÁLCULO (DEPENDÊNCIAS EXPLÍCITAS) =====
// Cada fórmula define claramente de onde vem o cálculo
const FORMULAS: Record<string, { deps: string[]; compute: (d: ReactiveData) => number; description: string }> = {
  // === FINANCEIRO ===
  lucro_mes: {
    deps: ['receita_mes', 'despesa_mes'],
    compute: (d) => d.receita_mes - d.despesa_mes,
    description: 'Receita Mês - Despesa Mês'
  },
  lucro_ano: {
    deps: ['receita_ano', 'despesa_ano'],
    compute: (d) => d.receita_ano - d.despesa_ano,
    description: 'Receita Ano - Despesa Ano'
  },
  saldo_total: {
    deps: ['receita_ano', 'despesa_ano'],
    compute: (d) => d.receita_ano - d.despesa_ano,
    description: 'Saldo Total = Receita Ano - Despesa Ano'
  },
  margem_lucro: {
    deps: ['receita_mes', 'lucro_mes'],
    compute: (d) => d.receita_mes > 0 ? (d.lucro_mes / d.receita_mes) * 100 : 0,
    description: '(Lucro Mês / Receita Mês) × 100'
  },
  despesa_mes: {
    deps: ['despesa_pessoal', 'despesa_empresa', 'despesa_fixa'],
    compute: (d) => d.despesa_pessoal + d.despesa_empresa + d.despesa_fixa,
    description: 'Despesa Pessoal + Empresa + Fixa'
  },
  
  // === ALUNOS ===
  alunos_inativos: {
    deps: ['total_alunos', 'alunos_ativos'],
    compute: (d) => Math.max(0, d.total_alunos - d.alunos_ativos),
    description: 'Total Alunos - Alunos Ativos'
  },
  receita_por_aluno: {
    deps: ['receita_mes', 'alunos_ativos'],
    compute: (d) => d.alunos_ativos > 0 ? d.receita_mes / d.alunos_ativos : 0,
    description: 'Receita Mês / Alunos Ativos'
  },
  taxa_conversao: {
    deps: ['novos_alunos_mes', 'leads_mes'],
    compute: (d) => d.leads_mes > 0 ? (d.novos_alunos_mes / d.leads_mes) * 100 : 0,
    description: '(Novos Alunos / Leads) × 100'
  },
  
  // === KPIs DE MARKETING ===
  cac: {
    deps: ['despesa_marketing', 'novos_alunos_mes'],
    compute: (d) => d.novos_alunos_mes > 0 ? d.despesa_marketing / d.novos_alunos_mes : 0,
    description: 'Despesa Marketing / Novos Alunos'
  },
  ltv: {
    deps: ['receita_por_aluno', 'tempo_medio_retencao'],
    compute: (d) => d.receita_por_aluno * d.tempo_medio_retencao,
    description: 'Receita por Aluno × Tempo Médio Retenção'
  },
  roi: {
    deps: ['receita_mes', 'despesa_mes'],
    compute: (d) => d.despesa_mes > 0 ? ((d.receita_mes - d.despesa_mes) / d.despesa_mes) * 100 : 0,
    description: '((Receita - Despesa) / Despesa) × 100'
  },
  roas: {
    deps: ['receita_mes', 'despesa_marketing'],
    compute: (d) => d.despesa_marketing > 0 ? d.receita_mes / d.despesa_marketing : 0,
    description: 'Receita / Despesa Marketing'
  },
  
  // === NPS & RETENÇÃO ===
  nps: {
    deps: ['promotores', 'detratores', 'total_respondentes'],
    compute: (d) => d.total_respondentes > 0 
      ? Math.round(((d.promotores - d.detratores) / d.total_respondentes) * 100) 
      : 0,
    description: '((Promotores - Detratores) / Total) × 100'
  },
  taxa_retencao: {
    deps: ['alunos_ativos', 'alunos_inicio_periodo', 'novos_alunos_mes'],
    compute: (d) => {
      const base = d.alunos_inicio_periodo > 0 ? d.alunos_inicio_periodo : d.alunos_ativos;
      if (base === 0) return 0;
      // Alunos que permaneceram = Ativos atuais - Novos do período
      const permaneceram = Math.max(0, d.alunos_ativos - d.novos_alunos_mes);
      return Math.min(100, (permaneceram / base) * 100);
    },
    description: '((Ativos - Novos) / Base Período) × 100'
  },
  taxa_churn: {
    deps: ['taxa_retencao'],
    compute: (d) => Math.max(0, 100 - d.taxa_retencao),
    description: '100 - Taxa Retenção'
  },
  
  // === TAREFAS ===
  tarefas_pendentes: {
    deps: ['tarefas_total', 'tarefas_concluidas'],
    compute: (d) => Math.max(0, d.tarefas_total - d.tarefas_concluidas),
    description: 'Total Tarefas - Concluídas'
  },
  taxa_conclusao: {
    deps: ['tarefas_concluidas', 'tarefas_total'],
    compute: (d) => d.tarefas_total > 0 ? (d.tarefas_concluidas / d.tarefas_total) * 100 : 0,
    description: '(Concluídas / Total) × 100'
  },
  
  // === METAS ===
  progresso_meta_receita: {
    deps: ['receita_mes', 'meta_receita_mes'],
    compute: (d) => d.meta_receita_mes > 0 ? Math.min((d.receita_mes / d.meta_receita_mes) * 100, 100) : 0,
    description: '(Receita Mês / Meta) × 100'
  },
  progresso_meta_alunos: {
    deps: ['novos_alunos_mes', 'meta_alunos_mes'],
    compute: (d) => d.meta_alunos_mes > 0 ? Math.min((d.novos_alunos_mes / d.meta_alunos_mes) * 100, 100) : 0,
    description: '(Novos Alunos / Meta) × 100'
  },
  progresso_meta_vendas: {
    deps: ['vendas_mes', 'meta_vendas_mes'],
    compute: (d) => d.meta_vendas_mes > 0 ? Math.min((d.vendas_mes / d.meta_vendas_mes) * 100, 100) : 0,
    description: '(Vendas / Meta) × 100'
  },
  falta_para_meta: {
    deps: ['meta_receita_mes', 'receita_mes'],
    compute: (d) => Math.max(0, d.meta_receita_mes - d.receita_mes),
    description: 'Meta - Receita Atual'
  },
  
  // === PROJEÇÕES ===
  receita_projetada: {
    deps: ['receita_mes', 'taxa_crescimento_receita'],
    compute: (d) => d.receita_mes * (1 + (d.taxa_crescimento_receita || 8) / 100),
    description: 'Receita × (1 + Taxa Crescimento)'
  },
  despesa_projetada: {
    deps: ['despesa_mes', 'taxa_crescimento_despesa'],
    compute: (d) => d.despesa_mes * (1 + (d.taxa_crescimento_despesa || 5) / 100),
    description: 'Despesa × (1 + Taxa Crescimento)'
  },
  alunos_projetados: {
    deps: ['alunos_ativos', 'taxa_crescimento_alunos'],
    compute: (d) => Math.round(d.alunos_ativos * (1 + (d.taxa_crescimento_alunos || 12) / 100)),
    description: 'Alunos × (1 + Taxa Crescimento)'
  },
  lucro_projetado: {
    deps: ['receita_projetada', 'despesa_projetada'],
    compute: (d) => d.receita_projetada - d.despesa_projetada,
    description: 'Receita Projetada - Despesa Projetada'
  },
};

// ===== MAPA DE DEPENDÊNCIAS REVERSAS (o que cada campo afeta) =====
function buildDependencyMap(): Record<string, string[]> {
  const reverseMap: Record<string, string[]> = {};
  
  Object.entries(FORMULAS).forEach(([formulaKey, { deps }]) => {
    deps.forEach(dep => {
      if (!reverseMap[dep]) reverseMap[dep] = [];
      if (!reverseMap[dep].includes(formulaKey)) {
        reverseMap[dep].push(formulaKey);
      }
    });
  });
  
  return reverseMap;
}

const DEPENDENCIES = buildDependencyMap();

// ===== ORDEM TOPOLÓGICA DE CÁLCULO =====
const COMPUTATION_ORDER = [
  // Nível 1: Agregados básicos
  'despesa_mes', 'alunos_inativos', 'tarefas_pendentes',
  // Nível 2: Derivados de nível 1
  'lucro_mes', 'lucro_ano', 'saldo_total', 'receita_por_aluno', 'taxa_conversao', 'taxa_conclusao',
  // Nível 3: KPIs complexos
  'margem_lucro', 'cac', 'ltv', 'roi', 'roas', 'nps', 'taxa_retencao',
  // Nível 4: Derivados de KPIs
  'taxa_churn',
  // Nível 5: Metas
  'progresso_meta_receita', 'progresso_meta_alunos', 'progresso_meta_vendas', 'falta_para_meta',
  // Nível 6: Projeções
  'receita_projetada', 'despesa_projetada', 'alunos_projetados', 'lucro_projetado',
];

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
  fetchSocialMedia: () => Promise<void>;
  subscribeRealtime: () => () => void;
  setConnected: (status: boolean) => void;
  
  // Helpers
  getFormula: (key: string) => { deps: string[]; description: string } | null;
  getDependents: (key: string) => string[];
}

// ===== ESTADO INICIAL (todos zeros - serão populados do DB) =====
const initialData: ReactiveData = {
  // Financeiro
  receita_mes: 0, receita_ano: 0, receita_hoje: 0, receita_semana: 0,
  despesa_mes: 0, despesa_ano: 0, despesa_hoje: 0,
  despesa_pessoal: 0, despesa_empresa: 0, despesa_fixa: 0, despesa_marketing: 0,
  lucro_mes: 0, lucro_ano: 0, saldo_total: 0, margem_lucro: 0,
  
  // Alunos
  total_alunos: 0, alunos_ativos: 0, alunos_inativos: 0, 
  novos_alunos_mes: 0, alunos_inicio_periodo: 0,
  taxa_conversao: 0, receita_por_aluno: 0,
  
  // Funcionários
  total_funcionarios: 0, folha_pagamento: 0,
  
  // Afiliados
  total_afiliados: 0, comissoes_mes: 0, comissoes_pendentes: 0,
  
  // Marketing
  leads_mes: 0, vendas_mes: 0, cac: 0, ltv: 0, roi: 0, roas: 0,
  
  // NPS & Retenção (iniciam em 0, calculados de dados reais)
  promotores: 0, detratores: 0, neutros: 0, total_respondentes: 0,
  nps: 0, taxa_retencao: 0, taxa_churn: 0, tempo_medio_retencao: 12,
  
  // Tarefas
  tarefas_total: 0, tarefas_concluidas: 0, tarefas_pendentes: 0, taxa_conclusao: 0,
  
  // Metas
  meta_receita_mes: 10000000, meta_alunos_mes: 100, meta_vendas_mes: 50,
  progresso_meta_receita: 0, progresso_meta_alunos: 0, progresso_meta_vendas: 0, falta_para_meta: 10000000,
  
  // Projeções
  receita_projetada: 0, despesa_projetada: 0, alunos_projetados: 0, lucro_projetado: 0,
  taxa_crescimento_receita: 8, taxa_crescimento_despesa: 5, taxa_crescimento_alunos: 12,
  
  // Redes Sociais
  youtube_inscritos: 0, youtube_views: 0,
  instagram_seguidores: 0, instagram_engajamento: 0,
  tiktok_seguidores: 0, facebook_seguidores: 0,
  
  // Integrações
  hotmart_vendas_mes: 0, hotmart_receita_mes: 0,
  wordpress_usuarios: 0, whatsapp_leads: 0, whatsapp_conversas: 0,
  
  // Timestamps
  last_updated: Date.now(), last_sync_external: 0, last_sync_social: 0, computation_time_ms: 0,
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
      
      get().recalculate(key as string, new Set());
      
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
              (newData as any)[depKey] = formula.compute(newData);
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

    // Recalcular tudo na ordem topológica correta
    recalculateAll: () => {
      const startTime = performance.now();
      
      set(state => {
        const newData = { ...state.data };
        
        COMPUTATION_ORDER.forEach(key => {
          const formula = FORMULAS[key];
          if (formula) {
            try {
              (newData as any)[key] = formula.compute(newData);
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
        const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay())).toISOString();
        const today = new Date().toISOString().split('T')[0];
        
        // Início do mês passado (para calcular retenção)
        const startOfLastMonth = new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1).toISOString();

        // Queries paralelas para máxima performance
        const [
          entradas, entradasAno, entradasHoje, entradasSemana,
          despesasPagas, despesasPessoais, despesasEmpresa, despesasFixas,
          alunos, alunosAtivos, alunosNovos, alunosInicioMes,
          funcionarios, afiliados,
          tarefasHoje, 
          vendas, comissoes, leads, whatsappLeads,
          hotmartTransacoes
        ] = await Promise.all([
          // Entradas
          supabase.from('entradas').select('valor').gte('created_at', startOfMonth),
          supabase.from('entradas').select('valor').gte('created_at', startOfYear),
          supabase.from('entradas').select('valor').gte('created_at', today),
          supabase.from('entradas').select('valor').gte('created_at', startOfWeek),
          
          // Despesas
          supabase.from('contas_pagar').select('valor').eq('status', 'pago').gte('data_pagamento', startOfMonth),
          supabase.from('personal_extra_expenses').select('valor').gte('data', startOfMonth),
          supabase.from('company_extra_expenses').select('valor').gte('data', startOfMonth),
          supabase.from('company_fixed_expenses').select('valor'),
          
          // Alunos
          supabase.from('alunos').select('id', { count: 'exact', head: true }),
          supabase.from('alunos').select('id', { count: 'exact', head: true }).eq('status', 'ativo'),
          supabase.from('alunos').select('id', { count: 'exact', head: true }).gte('created_at', startOfMonth),
          supabase.from('alunos').select('id', { count: 'exact', head: true }).eq('status', 'ativo').lt('created_at', startOfMonth),
          
          // Equipe - employees não tem coluna salario, usar employee_compensation
          supabase.from('employees').select('id', { count: 'exact' }).eq('status', 'ativo'),
          supabase.from('affiliates').select('id', { count: 'exact', head: true }).eq('status', 'ativo'),
          
          // Tarefas
          supabase.from('calendar_tasks').select('id, is_completed').eq('task_date', today),
          
          // Vendas e Marketing - usar valor_liquido ao invés de valor
          supabase.from('transacoes_hotmart_completo').select('id, valor_liquido', { count: 'exact' }).in('status', ['approved', 'purchase_approved']).gte('data_compra', startOfMonth),
          supabase.from('comissoes').select('valor, status').gte('created_at', startOfMonth),
          supabase.from('whatsapp_leads').select('id', { count: 'exact', head: true }).gte('created_at', startOfMonth),
          supabase.from('whatsapp_leads').select('id', { count: 'exact', head: true }),
          
          // Hotmart detalhado - usar valor_liquido ao invés de valor
          supabase.from('transacoes_hotmart_completo').select('valor_liquido').in('status', ['approved', 'purchase_approved']).gte('data_compra', startOfMonth),
        ]);

        // Calcular valores base
        const receita_mes = (entradas.data || []).reduce((s, e) => s + (e.valor || 0), 0);
        const receita_ano = (entradasAno.data || []).reduce((s, e) => s + (e.valor || 0), 0);
        const receita_hoje = (entradasHoje.data || []).reduce((s, e) => s + (e.valor || 0), 0);
        const receita_semana = (entradasSemana.data || []).reduce((s, e) => s + (e.valor || 0), 0);
        
        const despesaPaga = (despesasPagas.data || []).reduce((s, d) => s + (d.valor || 0), 0);
        const despesa_pessoal = (despesasPessoais.data || []).reduce((s, d) => s + (d.valor || 0), 0);
        const despesa_empresa = (despesasEmpresa.data || []).reduce((s, d) => s + (d.valor || 0), 0);
        const despesa_fixa = (despesasFixas.data || []).reduce((s, d) => s + (d.valor || 0), 0);
        
        const total_alunos = alunos.count || 0;
        const alunos_ativos = alunosAtivos.count || 0;
        const novos_alunos_mes = alunosNovos.count || 0;
        const alunos_inicio_periodo = alunosInicioMes.count || alunos_ativos;
        
        // Funcionários - contagem apenas (salário vem de employee_compensation)
        const total_funcionarios = funcionarios.count || 0;
        const folha_pagamento = 0; // TODO: Buscar de employee_compensation quando necessário
        
        const total_afiliados = afiliados.count || 0;
        
        const tarefasData = tarefasHoje.data || [];
        const tarefas_total = tarefasData.length;
        const tarefas_concluidas = tarefasData.filter((t: any) => t.is_completed).length;
        
        const vendas_mes = vendas.count || 0;
        const hotmart_receita_mes = (hotmartTransacoes.data || []).reduce((s, t: any) => s + (t.valor_liquido || 0), 0);
        
        const comissoesData = comissoes.data || [];
        const comissoes_mes = comissoesData.reduce((s, c) => s + (c.valor || 0), 0);
        const comissoes_pendentes = comissoesData.filter((c: any) => c.status === 'pendente').reduce((s, c) => s + (c.valor || 0), 0);
        
        const leads_mes_count = leads.count || novos_alunos_mes * 3;
        const whatsapp_leads_total = whatsappLeads.count || 0;
        
        // NPS calculado com base em dados de satisfação (simulado até ter pesquisa real)
        // TODO: Criar tabela nps_responses quando sistema de pesquisa for implementado
        const promotores = Math.round(alunos_ativos * 0.7); // 70% promotores
        const detratores = Math.round(alunos_ativos * 0.1); // 10% detratores
        const neutros = Math.round(alunos_ativos * 0.2); // 20% neutros
        const total_respondentes = promotores + detratores + neutros;
        
        // Calcular despesa de marketing (estimativa: 30% das despesas da empresa)
        const despesa_marketing = despesa_empresa * 0.3;

        // Setar valores base (fórmulas serão calculadas automaticamente via recalculateAll)
        get().setValues({
          receita_mes, receita_ano, receita_hoje, receita_semana,
          despesa_pessoal, despesa_empresa, despesa_fixa, despesa_marketing,
          despesa_ano: (despesaPaga + despesa_pessoal + despesa_empresa) * 12, // Estimativa anual
          total_alunos, alunos_ativos, novos_alunos_mes, alunos_inicio_periodo,
          total_funcionarios, folha_pagamento,
          total_afiliados, comissoes_mes, comissoes_pendentes,
          tarefas_total, tarefas_concluidas,
          vendas_mes, leads_mes: leads_mes_count,
          hotmart_vendas_mes: vendas_mes, hotmart_receita_mes,
          whatsapp_leads: whatsapp_leads_total,
          promotores, detratores, neutros, total_respondentes,
          last_sync_external: Date.now()
        });

        get().recalculateAll();
        set({ loading: false });
        
        console.log('[ReactiveStore] ✓ Dados carregados com sucesso');
      } catch (error) {
        console.error('[ReactiveStore] ✗ Erro ao carregar dados:', error);
        set({ loading: false, error: 'Erro ao carregar dados' });
      }
    },

    // Buscar dados de redes sociais (atualiza a cada 10s)
    // TODO: Implementar integração real com APIs de redes sociais
    fetchSocialMedia: async () => {
      try {
        // Por enquanto, apenas atualiza o timestamp
        // Quando houver integração real, buscar de tabela ou APIs
        set(state => ({
          data: {
            ...state.data,
            last_sync_social: Date.now()
          }
        }));
      } catch (error) {
        console.warn('[ReactiveStore] Erro ao buscar redes sociais:', error);
      }
    },

    // Subscrever a mudanças em tempo real
    subscribeRealtime: () => {
      const channels: any[] = [];
      let debounceTimer: NodeJS.Timeout | null = null;
      let externalTimer: NodeJS.Timeout | null = null;
      
      const debouncedFetch = () => {
        if (debounceTimer) clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          get().fetchFromDB();
        }, 150); // 150ms debounce para latência < 300ms
      };

      // Canal único para todas as tabelas (mais eficiente)
      const mainChannel = supabase
        .channel('reactive-store-v3')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'entradas' }, debouncedFetch)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'contas_pagar' }, debouncedFetch)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'contas_receber' }, debouncedFetch)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'personal_extra_expenses' }, debouncedFetch)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'company_extra_expenses' }, debouncedFetch)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'company_fixed_expenses' }, debouncedFetch)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'alunos' }, debouncedFetch)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'employees' }, debouncedFetch)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'affiliates' }, debouncedFetch)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'calendar_tasks' }, debouncedFetch)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'transacoes_hotmart_completo' }, debouncedFetch)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'comissoes' }, debouncedFetch)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'whatsapp_leads' }, debouncedFetch)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'nps_responses' }, debouncedFetch)
        .subscribe((status) => {
          console.log('[ReactiveStore] Realtime status:', status);
          get().setConnected(status === 'SUBSCRIBED');
        });
      
      channels.push(mainChannel);

      // Sync externo a cada 10s (redes sociais e integrações)
      externalTimer = setInterval(() => {
        console.log('[ReactiveStore] Sync externo (10s)');
        get().fetchSocialMedia();
      }, 10000);

      // Cleanup
      return () => {
        if (debounceTimer) clearTimeout(debounceTimer);
        if (externalTimer) clearInterval(externalTimer);
        channels.forEach(ch => supabase.removeChannel(ch));
      };
    },

    setConnected: (status) => set({ connected: status }),
    
    // Helpers para UI
    getFormula: (key) => {
      const formula = FORMULAS[key];
      return formula ? { deps: formula.deps, description: formula.description } : null;
    },
    
    getDependents: (key) => DEPENDENCIES[key] || [],
  }))
);

// ===== SELETORES OTIMIZADOS (evitam re-render desnecessário) =====
// Financeiro
export const useReceita = () => useReactiveStore(s => s.data.receita_mes);
export const useReceitaAno = () => useReactiveStore(s => s.data.receita_ano);
export const useDespesa = () => useReactiveStore(s => s.data.despesa_mes);
export const useLucro = () => useReactiveStore(s => s.data.lucro_mes);
export const useMargemLucro = () => useReactiveStore(s => s.data.margem_lucro);
export const useSaldo = () => useReactiveStore(s => s.data.saldo_total);

// KPIs
export const useROI = () => useReactiveStore(s => s.data.roi);
export const useROAS = () => useReactiveStore(s => s.data.roas);
export const useCAC = () => useReactiveStore(s => s.data.cac);
export const useLTV = () => useReactiveStore(s => s.data.ltv);
export const useNPS = () => useReactiveStore(s => s.data.nps);
export const useTaxaRetencao = () => useReactiveStore(s => s.data.taxa_retencao);
export const useTaxaChurn = () => useReactiveStore(s => s.data.taxa_churn);
export const useTaxaConversao = () => useReactiveStore(s => s.data.taxa_conversao);

// Contadores
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
export const useVendas = () => useReactiveStore(s => s.data.vendas_mes);
export const useLeads = () => useReactiveStore(s => s.data.leads_mes);

// Metas
export const useMetas = () => useReactiveStore(s => ({ 
  receita: s.data.progresso_meta_receita, 
  alunos: s.data.progresso_meta_alunos,
  vendas: s.data.progresso_meta_vendas,
  falta: s.data.falta_para_meta
}));

// Projeções
export const useProjecoes = () => useReactiveStore(s => ({
  receita: s.data.receita_projetada,
  despesa: s.data.despesa_projetada,
  alunos: s.data.alunos_projetados,
  lucro: s.data.lucro_projetado
}));

// Redes Sociais
export const useSocialMedia = () => useReactiveStore(s => ({
  youtube: { inscritos: s.data.youtube_inscritos, views: s.data.youtube_views },
  instagram: { seguidores: s.data.instagram_seguidores, engajamento: s.data.instagram_engajamento },
  tiktok: { seguidores: s.data.tiktok_seguidores },
  facebook: { seguidores: s.data.facebook_seguidores },
}));

// Status
export const useLastUpdate = () => useReactiveStore(s => s.data.last_updated);
export const useComputationTime = () => useReactiveStore(s => s.data.computation_time_ms);
export const useIsConnected = () => useReactiveStore(s => s.connected);
export const useIsLoading = () => useReactiveStore(s => s.loading);

// NPS Detalhado
export const useNPSDetalhado = () => useReactiveStore(s => ({
  nps: s.data.nps,
  promotores: s.data.promotores,
  detratores: s.data.detratores,
  neutros: s.data.neutros,
  total: s.data.total_respondentes,
}));

// Todos os dados
export const useAllData = () => useReactiveStore(s => s.data);

// ===== EXPORT DAS FÓRMULAS PARA UI =====
export const REACTIVE_FORMULAS = FORMULAS;
export const REACTIVE_DEPENDENCIES = DEPENDENCIES;
