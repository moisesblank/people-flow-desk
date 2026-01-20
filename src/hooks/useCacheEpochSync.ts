// ============================================
// 🔄 CACHE EPOCH SYNC - Limpeza Automática 24h
// Detecta mudança de cache_epoch e limpa localStorage
// Funciona silenciosamente sem reload/logout
// ============================================

import { useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

const CACHE_EPOCH_LOCAL_KEY = "mm_cache_epoch";
const CACHE_EPOCH_CHECK_INTERVAL = 5 * 60 * 1000; // 5 minutos

// Prefixos de cache que PODEM ser removidos
const CACHE_PREFIXES = ["cache_"] as const;

// Chaves que NUNCA podem ser removidas
const PROTECTED_PREFIXES = [
  "sb-",
  "supabase.",
  "matriz_",
  "mm_",
  "app_version",
] as const;

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
 * Verifica se uma chave é protegida (NÃO pode ser removida)
 */
const isProtectedKey = (key: string): boolean => {
  for (const prefix of PROTECTED_PREFIXES) {
    if (key.startsWith(prefix)) {
      return true;
    }
  }
  return false;
};

/**
 * Limpa apenas chaves de cache do localStorage
 * Preserva sessão, tokens, e dados de segurança
 */
const clearCacheKeysOnly = (): number => {
  const allKeys = Object.keys(localStorage);
  let removedCount = 0;

  allKeys.forEach((key) => {
    // Só remove se for cache E NÃO for protegido
    if (isCacheKey(key) && !isProtectedKey(key)) {
      localStorage.removeItem(key);
      removedCount++;
    }
  });

  return removedCount;
};

/**
 * Hook que sincroniza com cache_epoch do servidor
 * e limpa cache local quando detecta mudança
 */
export function useCacheEpochSync() {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastCheckRef = useRef<number>(0);

  const checkAndSyncEpoch = useCallback(async () => {
    try {
      // Throttle: não verificar mais que 1x por minuto
      const now = Date.now();
      if (now - lastCheckRef.current < 60_000) {
        return;
      }
      lastCheckRef.current = now;

      // Buscar epoch atual do servidor
      const { data, error } = await supabase
        .from("system_guard")
        .select("cache_epoch")
        .single();

      if (error) {
        console.warn("[CacheEpochSync] Erro ao buscar epoch:", error.message);
        return;
      }

      const serverEpoch = data?.cache_epoch || 1;
      const localEpoch = parseInt(localStorage.getItem(CACHE_EPOCH_LOCAL_KEY) || "0", 10);

      // Se epoch do servidor é maior, limpar cache
      if (serverEpoch > localEpoch) {
        console.log(`[CacheEpochSync] 🔄 Epoch mudou: ${localEpoch} → ${serverEpoch}`);

        // Limpar apenas cache (preserva sessão)
        const removedCount = clearCacheKeysOnly();
        console.log(`[CacheEpochSync] 🧹 ${removedCount} cache keys removidas`);

        // Atualizar epoch local
        localStorage.setItem(CACHE_EPOCH_LOCAL_KEY, String(serverEpoch));

        console.log("[CacheEpochSync] ✅ Sincronização concluída (sem reload)");
      }
    } catch (err) {
      console.warn("[CacheEpochSync] Erro:", err);
    }
  }, []);

  useEffect(() => {
    // Verificar imediatamente ao montar
    checkAndSyncEpoch();

    // Configurar verificação periódica
    intervalRef.current = setInterval(checkAndSyncEpoch, CACHE_EPOCH_CHECK_INTERVAL);

    // Também verificar quando a janela volta a ter foco
    const handleFocus = () => {
      checkAndSyncEpoch();
    };
    window.addEventListener("focus", handleFocus);

    // Cleanup
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      window.removeEventListener("focus", handleFocus);
    };
  }, [checkAndSyncEpoch]);

  return {
    forceSync: checkAndSyncEpoch,
  };
}

export default useCacheEpochSync;
