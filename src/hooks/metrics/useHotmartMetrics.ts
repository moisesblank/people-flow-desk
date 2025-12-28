// ============================================
// 🎓 useHotmartMetrics — Métricas Hotmart
// Extraído do useIntegratedMetrics (Single Responsibility)
// ============================================

import { supabase } from "@/integrations/supabase/client";
import { useSubspaceQuery } from '../useSubspaceCommunication';

export interface HotmartMetricsData {
  totalVendas: number;
  totalReceita: number;
  totalAlunos: number;
  totalComissoes: number;
  vendasHoje: number;
  receitaHoje: number;
}

export function useHotmartMetrics() {
  return useSubspaceQuery<HotmartMetricsData>(
    ["hotmart-metrics"],
    async (): Promise<HotmartMetricsData> => {
      const today = new Date().toISOString().split('T')[0];
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

      const [alunosResult, entradasResult, comissoesResult] = await Promise.all([
        supabase
          .from("alunos")
          .select("id, valor_pago, data_matricula, status")
          .eq("status", "ativo"),
        supabase
          .from("entradas")
          .select("valor, data, fonte")
          .gte("data", thirtyDaysAgo),
        supabase
          .from("comissoes")
          .select("valor, status"),
      ]);

      const alunos = alunosResult.data || [];
      const entradas = entradasResult.data || [];
      const comissoes = comissoesResult.data || [];

      const totalAlunos = alunos.length;
      const totalVendas = entradas.length;
      const totalReceita = entradas.reduce((sum, e) => sum + (e.valor || 0), 0);
      const totalComissoes = comissoes
        .filter(c => c.status === 'pago')
        .reduce((sum, c) => sum + (c.valor || 0), 0);

      const vendasHoje = entradas.filter(e => e.data === today).length;
      const receitaHoje = entradas
        .filter(e => e.data === today)
        .reduce((sum, e) => sum + (e.valor || 0), 0);

      return {
        totalVendas,
        totalReceita,
        totalAlunos,
        totalComissoes,
        vendasHoje,
        receitaHoje,
      };
    },
    { profile: 'user', persistKey: 'hotmart_metrics' }
  );
}
