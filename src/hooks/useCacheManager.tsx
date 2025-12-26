// ============================================
// CACHE MANAGER - Limpeza de Cache Automática
// Garante dados atualizados após mudanças
// ============================================

import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect } from "react";
import { toast } from "sonner";

// Versão do app para detectar atualizações
// Incrementar para forçar limpeza de cache em todos os usuários
const APP_VERSION = "10.4.0";
const VERSION_KEY = "mm_app_version";
const LAST_CACHE_CLEAR_KEY = "mm_last_cache_clear";

export function useCacheManager() {
  const queryClient = useQueryClient();

  // Limpa todo o cache do React Query
  const clearQueryCache = useCallback(() => {
    queryClient.clear();
    queryClient.invalidateQueries();
    console.log("🧹 Cache do React Query limpo");
  }, [queryClient]);

  // Limpa cache do localStorage (exceto dados essenciais)
  const clearLocalStorageCache = useCallback(() => {
    const keysToKeep = [
      "sb-fyikfsasudgzsjmumdlw-auth-token",
      VERSION_KEY,
      LAST_CACHE_CLEAR_KEY,
    ];
    
    const allKeys = Object.keys(localStorage);
    allKeys.forEach(key => {
      if (!keysToKeep.some(k => key.includes(k))) {
        // Não remover dados de autenticação
        if (!key.includes("auth") && !key.includes("supabase")) {
          localStorage.removeItem(key);
        }
      }
    });
    console.log("🧹 Cache do localStorage limpo");
  }, []);

  // Limpa cache do sessionStorage
  const clearSessionStorageCache = useCallback(() => {
    sessionStorage.clear();
    console.log("🧹 Cache do sessionStorage limpo");
  }, []);

  // Limpeza completa de cache
  const clearAllCache = useCallback((showToast = true) => {
    clearQueryCache();
    clearLocalStorageCache();
    clearSessionStorageCache();
    
    // Registrar quando o cache foi limpo
    localStorage.setItem(LAST_CACHE_CLEAR_KEY, new Date().toISOString());
    
    if (showToast) {
      toast.success("Cache limpo com sucesso!", {
        description: "Os dados serão recarregados automaticamente."
      });
    }
    
    console.log("✅ Limpeza completa de cache realizada");
  }, [clearQueryCache, clearLocalStorageCache, clearSessionStorageCache]);

  // Força recarregamento dos dados
  const forceRefresh = useCallback(async () => {
    clearQueryCache();
    await queryClient.refetchQueries();
    toast.success("Dados atualizados!");
  }, [clearQueryCache, queryClient]);

  // Invalida queries específicas
  const invalidateQueries = useCallback((queryKeys: string[]) => {
    queryKeys.forEach(key => {
      queryClient.invalidateQueries({ queryKey: [key] });
    });
  }, [queryClient]);

  // Verificar se houve atualização do app
  useEffect(() => {
    const storedVersion = localStorage.getItem(VERSION_KEY);
    
    if (storedVersion !== APP_VERSION) {
      console.log(`🔄 Atualização detectada: ${storedVersion} → ${APP_VERSION}`);
      clearAllCache(false);
      localStorage.setItem(VERSION_KEY, APP_VERSION);
      
      // Notificar sobre atualização (apenas se não for primeira vez)
      if (storedVersion) {
        toast.info("App atualizado!", {
          description: "O cache foi limpo automaticamente para garantir a melhor experiência."
        });
      }
    }
  }, [clearAllCache]);

  return {
    clearQueryCache,
    clearLocalStorageCache,
    clearSessionStorageCache,
    clearAllCache,
    forceRefresh,
    invalidateQueries,
    appVersion: APP_VERSION,
  };
}

// Hook para usar em componentes que precisam limpar cache após ações
export function useClearCacheOnAction() {
  const { clearQueryCache, invalidateQueries } = useCacheManager();
  
  const clearAfterAction = useCallback(async (action: () => Promise<any>, queryKeys?: string[]) => {
    const result = await action();
    
    if (queryKeys && queryKeys.length > 0) {
      invalidateQueries(queryKeys);
    } else {
      clearQueryCache();
    }
    
    return result;
  }, [clearQueryCache, invalidateQueries]);
  
  return { clearAfterAction };
}

// Função utilitária global para limpar cache (pode ser chamada de qualquer lugar)
export const globalCacheClear = () => {
  // Limpar React Query cache (se disponível)
  if (typeof window !== 'undefined') {
    // Dispatch evento customizado para que o hook capture
    window.dispatchEvent(new CustomEvent('mm-clear-cache'));
    
    // Limpar localStorage cache
    const keysToKeep = ["sb-", "auth", "supabase", VERSION_KEY, LAST_CACHE_CLEAR_KEY];
    Object.keys(localStorage).forEach(key => {
      if (!keysToKeep.some(k => key.includes(k))) {
        localStorage.removeItem(key);
      }
    });
    
    // Limpar sessionStorage
    sessionStorage.clear();
    
    console.log("🧹 Cache global limpo via função utilitária");
  }
};

// Exportar versão para uso externo
export const getAppVersion = () => APP_VERSION;
