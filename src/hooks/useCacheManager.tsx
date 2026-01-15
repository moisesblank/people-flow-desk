// ============================================
// CACHE MANAGER v2.0 - P0 FIX
// Limpeza SELETIVA de Cache (preserva segurança)
// Build ID automático + Force Refresh integrado
// ============================================

import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect } from "react";
import { toast } from "sonner";

// ============================================
// 🔐 SECURITY KEYS - NUNCA LIMPAR
// ============================================

// Chaves exatas que NUNCA podem ser removidas do localStorage
const SECURITY_KEYS = [
  // Sessão única (Nuclear Lockdown)
  "matriz_session_token",
  "matriz_last_heartbeat",
  
  // Device fingerprint (2FA/MFA)
  "matriz_device_fingerprint",
  "matriz_device_fingerprint_expiry",
  "matriz_device_server_hash",
  "matriz_trusted_device",
  
  // MFA trust cache
  "mfa_trust_cache",
  
  // Force refresh control
  "app_version_current",
  
  // Cache manager internal
  "mm_app_version",
  "mm_last_cache_clear",
] as const;

// Prefixos que NUNCA podem ser removidos do localStorage
const SECURITY_PREFIXES = [
  "sb-",           // Supabase auth tokens
  "supabase.",     // Supabase internal
  "matriz_",       // Nosso sistema de segurança (fallback)
] as const;

// Chaves de sessionStorage que NUNCA podem ser removidas
const SESSION_SECURITY_KEYS = [
  "matriz_2fa_pending",
  "matriz_2fa_user",
  "matriz_password_change_pending",
  "mm_session_token",
] as const;

// ============================================
// 🗑️ CACHE PREFIXES - PODE LIMPAR
// ============================================

// Prefixos de cache que PODEM ser removidos com segurança
// ESCOPO P0: Apenas cache_* (persistentCache do SubspaceQuery)
const CACHE_PREFIXES = [
  "cache_",           // persistentCache do SubspaceQuery - ÚNICO ativo
] as const;

// ============================================
// 🔧 VERSÃO EFETIVA
// ============================================

const VERSION_KEY = "mm_app_version";
const LAST_CACHE_CLEAR_KEY = "mm_last_cache_clear";
const FORCE_REFRESH_KEY = "app_version_current";

// Build ID injetado pelo Vite (muda a cada deploy)
const BUILD_ID = typeof __APP_BUILD_ID__ !== "undefined" ? __APP_BUILD_ID__ : "dev";

/**
 * Calcula a versão efetiva combinando:
 * - BUILD_ID: muda a cada deploy
 * - forceId: muda quando admin clica "Atualizar Alunos"
 */
const getEffectiveVersion = (): string => {
  const forceId = localStorage.getItem(FORCE_REFRESH_KEY) || "0";
  return `${BUILD_ID}.${forceId}`;
};

// ============================================
// 🛡️ HELPERS DE SEGURANÇA
// ============================================

/**
 * Verifica se uma chave é protegida (não pode ser removida)
 */
const isProtectedKey = (key: string): boolean => {
  // Chave exata na lista de segurança
  if (SECURITY_KEYS.includes(key as any)) {
    return true;
  }
  
  // Prefixo protegido
  for (const prefix of SECURITY_PREFIXES) {
    if (key.startsWith(prefix)) {
      return true;
    }
  }
  
  return false;
};

/**
 * Verifica se uma chave é de cache (pode ser removida)
 */
const isCacheKey = (key: string): boolean => {
  for (const prefix of CACHE_PREFIXES) {
    if (key.startsWith(prefix)) {
      return true;
    }
  }
  return false;
};

/**
 * Verifica se uma chave de sessionStorage é protegida
 */
const isProtectedSessionKey = (key: string): boolean => {
  return SESSION_SECURITY_KEYS.includes(key as any);
};

// ============================================
// 🪝 HOOK PRINCIPAL
// ============================================

export function useCacheManager() {
  const queryClient = useQueryClient();

  // Limpa todo o cache do React Query
  const clearQueryCache = useCallback(() => {
    queryClient.clear();
    queryClient.invalidateQueries();
    console.log("🧹 Cache do React Query limpo");
  }, [queryClient]);

  // ============================================
  // 🔒 LIMPEZA SELETIVA DE LOCALSTORAGE
  // Remove APENAS chaves de cache, preserva segurança
  // ============================================
  const clearLocalStorageCache = useCallback(() => {
    const allKeys = Object.keys(localStorage);
    let removedCount = 0;
    let skippedCount = 0;
    
    allKeys.forEach(key => {
      // REGRA 1: Se é chave protegida, NUNCA remover
      if (isProtectedKey(key)) {
        skippedCount++;
        return;
      }
      
      // REGRA 2: Se é chave de cache, PODE remover
      if (isCacheKey(key)) {
        localStorage.removeItem(key);
        removedCount++;
        return;
      }
      
      // REGRA 3: Qualquer outra chave - NÃO remover (safe by default)
      skippedCount++;
    });
    
    console.log(`🧹 localStorage: ${removedCount} cache keys removidas, ${skippedCount} protegidas`);
  }, []);

  // ============================================
  // 🔒 LIMPEZA SELETIVA DE SESSIONSTORAGE
  // Remove APENAS dados de fluxo, preserva 2FA/auth
  // ============================================
  const clearSessionStorageCache = useCallback(() => {
    const allKeys = Object.keys(sessionStorage);
    let removedCount = 0;
    let skippedCount = 0;
    
    allKeys.forEach(key => {
      // Se é chave protegida de sessão, NÃO remover
      if (isProtectedSessionKey(key)) {
        skippedCount++;
        return;
      }
      
      // Outras chaves de sessionStorage podem ser limpas
      // (geralmente são dados de UI temporários)
      sessionStorage.removeItem(key);
      removedCount++;
    });
    
    console.log(`🧹 sessionStorage: ${removedCount} keys removidas, ${skippedCount} protegidas`);
  }, []);

  // Limpeza completa de cache (SELETIVA)
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
    
    console.log("✅ Limpeza SELETIVA de cache realizada (segurança preservada)");
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

  // ============================================
  // 🔄 VERIFICAÇÃO DE VERSÃO (AUTOMÁTICA)
  // Detecta: novo deploy OU force refresh do admin
  // ============================================
  useEffect(() => {
    const storedVersion = localStorage.getItem(VERSION_KEY);
    const effectiveVersion = getEffectiveVersion();
    
    if (storedVersion !== effectiveVersion) {
      console.log(`🔄 Atualização detectada: ${storedVersion || "(primeira vez)"} → ${effectiveVersion}`);
      
      // Limpar cache de dados (SELETIVO - preserva segurança)
      clearAllCache(false);
      
      // Salvar nova versão
      localStorage.setItem(VERSION_KEY, effectiveVersion);
      
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
    appVersion: getEffectiveVersion(),
    buildId: BUILD_ID,
  };
}

// ============================================
// 🪝 HOOK AUXILIAR
// ============================================

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

// ============================================
// 🌐 FUNÇÃO GLOBAL (SELETIVA)
// ============================================

export const globalCacheClear = () => {
  if (typeof window === 'undefined') return;
  
  // Dispatch evento customizado
  window.dispatchEvent(new CustomEvent('mm-clear-cache'));
  
  // Limpar APENAS cache_* (segurança preservada)
  const allKeys = Object.keys(localStorage);
  let removedCount = 0;
  
  allKeys.forEach(key => {
    // Só remove se for cache E NÃO for protegido
    if (isCacheKey(key) && !isProtectedKey(key)) {
      localStorage.removeItem(key);
      removedCount++;
    }
  });
  
  console.log(`🧹 Global cache clear: ${removedCount} cache keys removidas (segurança preservada)`);
};

// Exportar versão para uso externo
export const getAppVersion = () => getEffectiveVersion();
export const getBuildId = () => BUILD_ID;
