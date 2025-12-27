// ============================================
// HOOK: Global Sidebar Width (OWNER-CONTROLLED)
// Lê do banco, permite escrita apenas para OWNER
// Sincronização via Realtime
// ============================================

import { useState, useEffect, useCallback, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

// Constantes
const SIDEBAR_MIN_WIDTH = 56;
const SIDEBAR_DEFAULT_WIDTH = 240;
const SIDEBAR_MAX_WIDTH = 360;

interface UiSettings {
  id: string;
  sidebar_width: number;
  updated_at: string;
  updated_by: string | null;
}

interface GlobalSidebarWidthConfig {
  width: number;
  setWidth: (width: number) => void;
  isLoading: boolean;
  isOwner: boolean;
  canResize: boolean;
  minWidth: number;
  maxWidth: number;
  defaultWidth: number;
}

// Verificar se é owner
async function checkIsOwner(userId: string | undefined): Promise<boolean> {
  if (!userId) return false;
  
  const { data } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "owner")
    .maybeSingle();
  
  return !!data;
}

// Buscar configuração global
async function fetchGlobalSettings(): Promise<UiSettings | null> {
  const { data, error } = await supabase
    .from("ui_settings")
    .select("*")
    .eq("id", "global")
    .maybeSingle();
  
  if (error) {
    console.error("[GlobalSidebarWidth] Erro ao buscar settings:", error);
    return null;
  }
  
  return data;
}

// Atualizar configuração global (apenas owner)
async function updateGlobalSettings(width: number, userId: string): Promise<boolean> {
  const clampedWidth = Math.max(SIDEBAR_MIN_WIDTH, Math.min(SIDEBAR_MAX_WIDTH, width));
  
  const { error } = await supabase
    .from("ui_settings")
    .update({ 
      sidebar_width: clampedWidth, 
      updated_at: new Date().toISOString(),
      updated_by: userId 
    })
    .eq("id", "global");
  
  if (error) {
    console.error("[GlobalSidebarWidth] Erro ao atualizar:", error);
    return false;
  }
  
  return true;
}

export function useGlobalSidebarWidth(): GlobalSidebarWidthConfig {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isOwner, setIsOwner] = useState(false);

  // Verificar se é owner
  useEffect(() => {
    if (user?.id) {
      checkIsOwner(user.id).then(setIsOwner);
    } else {
      setIsOwner(false);
    }
  }, [user?.id]);

  // Query para buscar configuração
  const { data: settings, isLoading } = useQuery({
    queryKey: ["ui-settings", "global"],
    queryFn: fetchGlobalSettings,
    staleTime: 1000 * 60 * 5, // 5 minutos
    refetchOnWindowFocus: false,
  });

  // Mutation para atualizar (apenas owner)
  const mutation = useMutation({
    mutationFn: async (width: number) => {
      if (!user?.id || !isOwner) {
        throw new Error("Apenas o owner pode alterar a largura da sidebar");
      }
      return updateGlobalSettings(width, user.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ui-settings", "global"] });
    },
  });

  // Configurar Realtime para sincronização
  useEffect(() => {
    const channel = supabase
      .channel("ui-settings-changes")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "ui_settings",
          filter: "id=eq.global",
        },
        (payload) => {
          // Atualizar cache quando houver mudança
          queryClient.setQueryData(["ui-settings", "global"], payload.new);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  // Função para setar width (só funciona para owner)
  const setWidth = useCallback((width: number) => {
    if (!isOwner) {
      console.warn("[GlobalSidebarWidth] Apenas o owner pode alterar a largura");
      return;
    }
    mutation.mutate(width);
  }, [isOwner, mutation]);

  // Valores calculados
  const width = settings?.sidebar_width ?? SIDEBAR_DEFAULT_WIDTH;
  const canResize = isOwner;

  return useMemo(() => ({
    width,
    setWidth,
    isLoading,
    isOwner,
    canResize,
    minWidth: SIDEBAR_MIN_WIDTH,
    maxWidth: SIDEBAR_MAX_WIDTH,
    defaultWidth: SIDEBAR_DEFAULT_WIDTH,
  }), [width, setWidth, isLoading, isOwner, canResize]);
}

// Exportar constantes
export { SIDEBAR_MIN_WIDTH, SIDEBAR_DEFAULT_WIDTH, SIDEBAR_MAX_WIDTH };
