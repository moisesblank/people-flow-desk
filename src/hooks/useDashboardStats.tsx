// ============================================
// MASTER PRO ULTRA v3.0 - DASHBOARD CACHE HOOK
// Dados do dashboard com cache inteligente
// ============================================

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface DashboardStats {
  alunos_ativos: number;
  funcionarios_ativos: number;
  afiliados_ativos: number;
  receita_mes: number;
  despesa_mes: number;
  vendas_mes: number;
  tarefas_hoje: number;
  usuarios_online: number;
  updated_at: string;
}

export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async (): Promise<DashboardStats> => {
      // Tentar usar a função de cache do banco
      const { data, error } = await supabase.rpc('get_cached_dashboard_stats');
      
      if (error) {
        console.error('Erro ao buscar stats:', error);
        // Fallback para queries diretas
        const [alunos, funcionarios, afiliados, entradas, despesas, vendas, tarefas, online] = await Promise.all([
          supabase.from('alunos').select('id', { count: 'exact' }).eq('status', 'ativo'),
          supabase.from('employees').select('id', { count: 'exact' }).eq('status', 'ativo'),
          supabase.from('affiliates').select('id', { count: 'exact' }).eq('status', 'ativo'),
          supabase.from('entradas').select('valor').gte('created_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()),
          supabase.from('contas_pagar').select('valor').eq('status', 'pago').gte('data_pagamento', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()),
          supabase.from('transacoes_hotmart_completo').select('id', { count: 'exact' }).in('status', ['approved', 'purchase_approved']).gte('data_compra', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()),
          supabase.from('calendar_tasks').select('id', { count: 'exact' }).eq('task_date', new Date().toISOString().split('T')[0]).eq('is_completed', false),
          supabase.from('profiles').select('id', { count: 'exact' }).eq('is_online', true),
        ]);

        const receita = (entradas.data || []).reduce((sum, e) => sum + (e.valor || 0), 0);
        const despesa = (despesas.data || []).reduce((sum, d) => sum + (d.valor || 0), 0);

        return {
          alunos_ativos: alunos.count || 0,
          funcionarios_ativos: funcionarios.count || 0,
          afiliados_ativos: afiliados.count || 0,
          receita_mes: receita,
          despesa_mes: despesa,
          vendas_mes: vendas.count || 0,
          tarefas_hoje: tarefas.count || 0,
          usuarios_online: online.count || 0,
          updated_at: new Date().toISOString()
        };
      }
      
      return data as unknown as DashboardStats;
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
    refetchInterval: 5 * 60 * 1000, // Refetch a cada 5 minutos
    refetchOnWindowFocus: false,
  });
}

// Hook para métricas em tempo real (mais frequente)
export function useRealtimeMetrics() {
  return useQuery({
    queryKey: ['realtime-metrics'],
    queryFn: async () => {
      const [online, tarefas, webhooks] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact' }).eq('is_online', true),
        supabase.from('calendar_tasks').select('id', { count: 'exact' }).eq('task_date', new Date().toISOString().split('T')[0]).eq('is_completed', false),
        supabase.from('webhooks_queue').select('id', { count: 'exact' }).eq('status', 'pending'),
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
