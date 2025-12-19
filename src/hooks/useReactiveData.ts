// ============================================
// HOOK DE INICIALIZAÇÃO DO SISTEMA REATIVO
// Conecta o store ao ciclo de vida do React
// ============================================

import { useEffect, useCallback } from 'react';
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

    // Refresh para dados externos a cada 10s (conforme requisito)
    const externalInterval = setInterval(() => {
      console.log('[useReactiveData] Sync externo (10s)');
      fetchFromDB();
    }, 10000);

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
export function useReactiveFormat() {
  const formatCurrency = useCallback((cents: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(cents / 100);
  }, []);

  const formatPercent = useCallback((value: number) => {
    return `${value.toFixed(1)}%`;
  }, []);

  const formatNumber = useCallback((value: number) => {
    return new Intl.NumberFormat('pt-BR').format(value);
  }, []);

  const formatCompact = useCallback((value: number) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
    return value.toString();
  }, []);

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
