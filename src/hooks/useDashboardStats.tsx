// ============================================
// MASTER PRO ULTRA v5.0 - DASHBOARD REALTIME HOOK
// 🌌 TESE 3: Cache localStorage = 0ms segunda visita
// ============================================

import { supabase } from '@/integrations/supabase/client';
import { useSubspaceQuery, SUBSPACE_CACHE_PROFILES } from './useSubspaceCommunication';

interface DashboardStats {
  alunos_ativos: number;
  alunos_novos_mes: number;
  funcionarios_ativos: number;
  afiliados_ativos: number;
  receita_mes: number;
  despesas_mes: number;
  vendas_mes: number;
  tarefas_hoje: number;
  comissoes_pendentes: number;
  updated_at: string;
}

export function useDashboardStats() {
  return useSubspaceQuery<DashboardStats>(
    ['dashboard-stats-realtime'],
    async (): Promise<DashboardStats> => {
      // Tentar usar a nova função RPC otimizada
      const { data, error } = await supabase.rpc('get_dashboard_stats_realtime');
      
      if (!error && data && typeof data === 'object') {
        const stats = data as Record<string, unknown>;
        return {
          alunos_ativos: Number(stats.alunos_ativos) || 0,
          alunos_novos_mes: Number(stats.alunos_novos_mes) || 0,
          funcionarios_ativos: Number(stats.funcionarios_ativos) || 0,
          afiliados_ativos: Number(stats.afiliados_ativos) || 0,
          receita_mes: Number(stats.receita_mes) || 0,
          despesas_mes: Number(stats.despesas_mes) || 0,
          vendas_mes: Number(stats.vendas_mes) || 0,
          tarefas_hoje: Number(stats.tarefas_hoje) || 0,
          comissoes_pendentes: Number(stats.comissoes_pendentes) || 0,
          updated_at: String(stats.updated_at) || new Date().toISOString()
        };
      }
      
      console.warn('Fallback para queries diretas:', error?.message);
      
      // Fallback para queries diretas se RPC falhar
      const inicioMes = new Date();
      inicioMes.setDate(1);
      inicioMes.setHours(0, 0, 0, 0);
      const inicioMesISO = inicioMes.toISOString();
      
      const [alunos, alunosNovos, funcionarios, afiliados, entradas, tarefas, comissoes] = await Promise.all([
        supabase.from('alunos').select('id', { count: 'exact', head: true }).eq('status', 'ativo'),
        supabase.from('alunos').select('id', { count: 'exact', head: true }).gte('created_at', inicioMesISO),
        supabase.from('employees').select('id', { count: 'exact', head: true }).eq('status', 'ativo'),
        supabase.from('affiliates').select('id', { count: 'exact', head: true }).eq('status', 'ativo'),
        supabase.from('entradas').select('valor').gte('created_at', inicioMesISO),
        supabase.from('calendar_tasks').select('id', { count: 'exact', head: true })
          .eq('task_date', new Date().toISOString().split('T')[0])
          .eq('is_completed', false),
        supabase.from('comissoes').select('valor').eq('status', 'pendente'),
      ]);

      const receita = (entradas.data || []).reduce((sum, e) => sum + (e.valor || 0), 0);
      const comissoesPendentes = (comissoes.data || []).reduce((sum, c) => sum + (c.valor || 0), 0);

      return {
        alunos_ativos: alunos.count || 0,
        alunos_novos_mes: alunosNovos.count || 0,
        funcionarios_ativos: funcionarios.count || 0,
        afiliados_ativos: afiliados.count || 0,
        receita_mes: receita,
        despesas_mes: 0,
        vendas_mes: 0,
        tarefas_hoje: tarefas.count || 0,
        comissoes_pendentes: comissoesPendentes,
        updated_at: new Date().toISOString()
      };
    },
    { 
      profile: 'dashboard', // 2 min staleTime, sem persistência (dados muito dinâmicos)
      persistKey: 'dashboard_stats_realtime'
    }
  );
}

// Hook para métricas em tempo real (mais frequente)
export function useRealtimeMetrics() {
  return useSubspaceQuery(
    ['realtime-metrics'],
    async () => {
      const [online, tarefas, webhooks] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('is_online', true),
        supabase.from('calendar_tasks').select('id', { count: 'exact', head: true })
          .eq('task_date', new Date().toISOString().split('T')[0])
          .eq('is_completed', false),
        supabase.from('webhooks_queue').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
      ]);

      return {
        usuarios_online: online.count || 0,
        tarefas_pendentes: tarefas.count || 0,
        webhooks_pendentes: webhooks.count || 0,
        timestamp: new Date().toISOString()
      };
    },
    { profile: 'realtime' } // Sem cache, dados super dinâmicos
  );
}

// Hook para view consolidada
export function useDashboardConsolidado() {
  return useSubspaceQuery(
    ['dashboard-consolidado'],
    async () => {
      const { data, error } = await supabase
        .from('v_dashboard_consolidado')
        .select('*')
        .single();
      
      if (error) {
        console.error('Erro ao buscar view consolidada:', error);
        return null;
      }
      
      return data;
    },
    { 
      profile: 'dashboard',
      persistKey: 'dashboard_consolidado'
    }
  );
}

console.log('[TESE 3] 📊 useDashboardStats migrado para cache localStorage');
