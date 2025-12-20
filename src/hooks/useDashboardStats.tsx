// ============================================
// MASTER PRO ULTRA v4.0 - DASHBOARD REALTIME HOOK
// Dados do dashboard com cruzamento automático
// ============================================

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

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
  return useQuery({
    queryKey: ['dashboard-stats-realtime'],
    queryFn: async (): Promise<DashboardStats> => {
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
    staleTime: 60 * 1000, // 1 minuto
    refetchInterval: 60 * 1000, // Refetch a cada 1 minuto
    refetchOnWindowFocus: true,
  });
}

// Hook para métricas em tempo real (mais frequente)
export function useRealtimeMetrics() {
  return useQuery({
    queryKey: ['realtime-metrics'],
    queryFn: async () => {
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
    staleTime: 30 * 1000, // 30 segundos
    refetchInterval: 30 * 1000, // Refetch a cada 30 segundos
  });
}

// Hook para view consolidada
export function useDashboardConsolidado() {
  return useQuery({
    queryKey: ['dashboard-consolidado'],
    queryFn: async () => {
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
    staleTime: 30 * 1000,
    refetchInterval: 30 * 1000,
  });
}
