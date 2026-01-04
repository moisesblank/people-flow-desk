/**
 * 🎯 SIMULADOS — Hook de Feature Flags
 * Constituição SYNAPSE Ω v10.0
 * 
 * Gerencia flags globais e por simulado para:
 * - Rollback de emergência
 * - Desativar Hard Mode
 * - Congelar ranking
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface SimuladoFeatureFlag {
  id: string;
  flag_key: string;
  flag_value: boolean;
  description: string | null;
  updated_at: string;
  updated_by: string | null;
}

interface UseSimuladoFeatureFlagsReturn {
  flags: SimuladoFeatureFlag[];
  isLoading: boolean;
  error: Error | null;
  getFlag: (key: string) => boolean;
  updateFlag: (key: string, value: boolean) => Promise<void>;
  isUpdating: boolean;
}

// Cache key
const FLAGS_QUERY_KEY = ["simulado-feature-flags"];

/**
 * Hook para gerenciar feature flags de simulados
 */
export function useSimuladoFeatureFlags(): UseSimuladoFeatureFlagsReturn {
  const queryClient = useQueryClient();

  // Query para buscar flags
  const { data: flags = [], isLoading, error } = useQuery({
    queryKey: FLAGS_QUERY_KEY,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("simulado_feature_flags")
        .select("*")
        .order("flag_key");

      if (error) throw error;
      return data as SimuladoFeatureFlag[];
    },
    staleTime: 30_000, // 30 segundos
    gcTime: 60_000, // 1 minuto
  });

  // Mutation para atualizar flag
  const { mutateAsync: updateFlagMutation, isPending: isUpdating } = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: boolean }) => {
      const { error } = await supabase
        .from("simulado_feature_flags")
        .update({
          flag_value: value,
          updated_at: new Date().toISOString(),
        })
        .eq("flag_key", key);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FLAGS_QUERY_KEY });
    },
    onError: (err) => {
      toast.error("Erro ao atualizar flag", {
        description: err instanceof Error ? err.message : "Erro desconhecido",
      });
    },
  });

  // Helper para obter valor de flag
  const getFlag = (key: string): boolean => {
    const flag = flags.find((f) => f.flag_key === key);
    return flag?.flag_value ?? true; // Default true
  };

  // Wrapper para mutation
  const updateFlag = async (key: string, value: boolean): Promise<void> => {
    await updateFlagMutation({ key, value });
    toast.success(`Flag "${key}" atualizada`, {
      description: value ? "Ativada" : "Desativada",
    });
  };

  return {
    flags,
    isLoading,
    error: error as Error | null,
    getFlag,
    updateFlag,
    isUpdating,
  };
}

/**
 * Hook simples para verificar uma única flag
 */
export function useSimuladoFlag(flagKey: string): { value: boolean; isLoading: boolean } {
  const { data, isLoading } = useQuery({
    queryKey: ["simulado-flag", flagKey],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_simulado_feature_flag", {
        p_flag_key: flagKey,
      });

      if (error) {
        console.error("[FLAG] Erro ao buscar flag:", error);
        return true; // Default true em caso de erro
      }

      return data as boolean;
    },
    staleTime: 30_000,
    gcTime: 60_000,
  });

  return {
    value: data ?? true,
    isLoading,
  };
}

/**
 * Flags pré-definidas para uso no sistema
 */
export const SIMULADO_FLAGS = {
  SIMULADOS_ENABLED: "simulados_enabled",
  HARD_MODE_ENABLED: "hard_mode_enabled",
  CAMERA_MONITORING_ENABLED: "camera_monitoring_enabled",
  RANKING_FROZEN: "ranking_frozen",
  NEW_ATTEMPTS_BLOCKED: "new_attempts_blocked",
} as const;
