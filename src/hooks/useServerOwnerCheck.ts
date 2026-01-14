// ============================================
// 🛡️ P0 SECURITY FIX: Server-Side Owner Check
// Verifica owner via RPC no banco, SEM email hardcoded
// Substituição segura para verificações frontend
// ============================================

import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface ServerOwnerCheckResult {
  isOwner: boolean;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

// Cache global para evitar múltiplas chamadas RPC
const ownerCache = new Map<string, { isOwner: boolean; timestamp: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutos

/**
 * Hook seguro para verificar se o usuário atual é owner
 * Usa RPC server-side (check_is_owner) - SEM email hardcoded
 */
export function useServerOwnerCheck(): ServerOwnerCheckResult {
  const { user, role } = useAuth();
  const [isOwner, setIsOwner] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Verificação rápida via role (fonte primária)
  const isOwnerByRole = useMemo(() => role === 'owner', [role]);

  const fetchOwnerStatus = useCallback(async () => {
    if (!user?.id) {
      setIsOwner(false);
      setIsLoading(false);
      return;
    }

    // Verificação rápida via role
    if (isOwnerByRole) {
      setIsOwner(true);
      setIsLoading(false);
      return;
    }

    // Verificar cache
    const cached = ownerCache.get(user.id);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      setIsOwner(cached.isOwner);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const { data, error: rpcError } = await supabase.rpc('check_is_owner');

      if (rpcError) {
        console.error('[useServerOwnerCheck] RPC error:', rpcError);
        // Fallback para verificação por role
        setIsOwner(isOwnerByRole);
        setError(rpcError.message);
      } else {
        const result = data === true;
        setIsOwner(result);
        
        // Atualizar cache
        ownerCache.set(user.id, { isOwner: result, timestamp: Date.now() });
      }
    } catch (err) {
      console.error('[useServerOwnerCheck] Error:', err);
      setIsOwner(isOwnerByRole);
      setError('Erro ao verificar status');
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, isOwnerByRole]);

  useEffect(() => {
    fetchOwnerStatus();
  }, [fetchOwnerStatus]);

  return {
    isOwner: isOwner || isOwnerByRole, // Fallback para role
    isLoading,
    error,
    refetch: fetchOwnerStatus,
  };
}

/**
 * Função standalone para verificar owner via RPC
 * Útil para uso fora de componentes React
 */
export async function checkIsOwnerServer(): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.id) return false;

    // Verificar cache
    const cached = ownerCache.get(user.id);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return cached.isOwner;
    }

    const { data, error } = await supabase.rpc('check_is_owner');
    
    if (error) {
      console.error('[checkIsOwnerServer] RPC error:', error);
      return false;
    }

    const result = data === true;
    ownerCache.set(user.id, { isOwner: result, timestamp: Date.now() });
    
    return result;
  } catch (err) {
    console.error('[checkIsOwnerServer] Error:', err);
    return false;
  }
}

/**
 * Limpar cache de owner (usar após logout ou troca de usuário)
 */
export function clearOwnerCache(): void {
  ownerCache.clear();
}
