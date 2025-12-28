// ============================================
// HOOK DE INICIALIZAÇÃO DO SISTEMA REATIVO
// Conecta o store ao ciclo de vida do React
// ============================================

import { useEffect, useCallback } from 'react';
import { formatCurrency as formatCurrencyCentralized, formatPercent as formatPercentCentralized, formatNumber as formatNumberCentralized, formatNumberCompact } from '@/utils';
import { 
  useReactiveStore, 
  useLastUpdate, 
  useComputationTime, 
  useIsConnected, 
  useIsLoading 
} from '@/stores/reactiveStore';

// ===== HOOK PRINCIPAL =====
export function useReactiveData() {
  const { 
    data, 
    loading, 
    error, 
    fetchFromDB, 
    subscribeRealtime, 
    recalculateAll 
  } = useReactiveStore();

  useEffect(() => {
    // Carregar dados iniciais
    fetchFromDB();

    // Subscrever a mudanças em tempo real
    const unsubscribe = subscribeRealtime();

    // Refresh para dados externos a cada 30s (otimizado para 3G)
    // 🏛️ LEI I: Reduzido de 10s para 30s para economizar requisições
    // PATCH-015: jitter anti-herd (0-5s)
    const jitter = Math.floor(Math.random() * 5000);
    const externalInterval = setInterval(() => {
      // Sem console.log em produção
      fetchFromDB();
    }, 30000 + jitter);

    return () => {
      unsubscribe();
      clearInterval(externalInterval);
    };
  }, [fetchFromDB, subscribeRealtime]);

  // Force refresh manual
  const forceRefresh = useCallback(async () => {
    await fetchFromDB();
    recalculateAll();
  }, [fetchFromDB, recalculateAll]);

  return { 
    data, 
    loading, 
    error, 
    forceRefresh,
    lastUpdate: data.last_updated,
    computationTime: data.computation_time_ms,
    isConnected: useReactiveStore.getState().connected
  };
}

// ===== HOOKS DE STATUS =====
export function useReactiveStatus() {
  const lastUpdate = useLastUpdate();
  const computationTime = useComputationTime();
  const isConnected = useIsConnected();
  const isLoading = useIsLoading();

  return {
    lastUpdate,
    computationTime,
    isConnected,
    isLoading,
    isRecent: Date.now() - lastUpdate < 5000, // Atualizado nos últimos 5s
    latency: computationTime,
    status: isConnected ? 'online' : isLoading ? 'syncing' : 'offline',
  };
}

// ===== HOOK PARA FORMATAÇÃO =====
// Usa funções centralizadas de @/utils (CONSTITUIÇÃO v10.x)
export function useReactiveFormat() {
  const formatCurrency = useCallback((cents: number) => formatCurrencyCentralized(cents), []);
  const formatPercent = useCallback((value: number) => formatPercentCentralized(value), []);
  const formatNumber = useCallback((value: number) => formatNumberCentralized(value), []);
  const formatCompact = useCallback((value: number) => formatNumberCompact(value), []);

  return { formatCurrency, formatPercent, formatNumber, formatCompact };
}

// ===== RE-EXPORT DOS SELETORES =====
export { 
  useReceita, 
  useDespesa, 
  useLucro, 
  useROI,
  useNPS,
  useTaxaRetencao,
  useTaxaChurn,
  useMargemLucro,
  useAlunos, 
  useFuncionarios,
  useAfiliados,
  useTarefas,
  useMetas,
  useProjecoes
} from '@/stores/reactiveStore';
