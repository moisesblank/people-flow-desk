// ============================================
// HOOK: useMenuConfig
// Gerencia grupos e itens do menu visual
// Persistência no Supabase com React Query
// ============================================

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// ============================================
// TIPOS
// ============================================
export interface MenuGroup {
  id: string;
  group_key: string;
  group_label: string;
  group_icon: string | null;
  group_color: string | null;
  sort_order: number;
  is_active: boolean;
  is_system: boolean;
  created_at: string;
  updated_at: string;
}

export interface MenuItem {
  id: string;
  group_id: string;
  item_key: string;
  item_label: string;
  item_url: string;
  item_icon: string;
  item_area: string | null;
  item_badge: string | null;
  item_badge_variant: string | null;
  allowed_roles: string[];
  sort_order: number;
  is_active: boolean;
  is_system: boolean;
  opens_in_new_tab: boolean;
  created_at: string;
  updated_at: string;
}

export interface MenuGroupWithItems extends MenuGroup {
  items: MenuItem[];
}

export interface CreateGroupInput {
  group_key: string;
  group_label: string;
  group_icon?: string;
  group_color?: string;
  sort_order?: number;
  is_system?: boolean;
}

export interface UpdateGroupInput {
  group_label?: string;
  group_icon?: string;
  group_color?: string;
  sort_order?: number;
  is_active?: boolean;
}

export interface CreateItemInput {
  group_id: string;
  item_key: string;
  item_label: string;
  item_url: string;
  item_icon: string;
  item_area?: string;
  item_badge?: string;
  item_badge_variant?: string;
  allowed_roles?: string[];
  sort_order?: number;
  is_system?: boolean;
  opens_in_new_tab?: boolean;
}

export interface UpdateItemInput {
  group_id?: string;
  item_label?: string;
  item_url?: string;
  item_icon?: string;
  item_area?: string;
  item_badge?: string | null;
  item_badge_variant?: string | null;
  allowed_roles?: string[];
  sort_order?: number;
  is_active?: boolean;
  opens_in_new_tab?: boolean;
}

export interface BulkOrderUpdate {
  type: "group" | "item";
  id: string;
  sort_order: number;
  group_id?: string; // Para itens que mudaram de grupo
}

// ============================================
// QUERY KEYS
// ============================================
const QUERY_KEYS = {
  menuGroups: ["menu-groups"] as const,
  menuItems: ["menu-items"] as const,
  menuConfig: ["menu-config"] as const,
};

// ============================================
// FUNÇÕES DE FETCH
// ============================================
async function fetchMenuGroups(): Promise<MenuGroup[]> {
  const { data, error } = await supabase
    .from("menu_groups")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error) throw error;
  return (data || []) as MenuGroup[];
}

async function fetchMenuItems(): Promise<MenuItem[]> {
  const { data, error } = await supabase
    .from("menu_items")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error) throw error;
  return (data || []) as MenuItem[];
}

// ============================================
// HOOK PRINCIPAL
// ============================================
export function useMenuConfig() {
  const queryClient = useQueryClient();

  // ============================================
  // QUERIES
  // ============================================
  const groupsQuery = useQuery({
    queryKey: QUERY_KEYS.menuGroups,
    queryFn: fetchMenuGroups,
    staleTime: 5 * 60 * 1000, // 5 minutos
    retry: 2,
  });

  const itemsQuery = useQuery({
    queryKey: QUERY_KEYS.menuItems,
    queryFn: fetchMenuItems,
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });

  // Combinar grupos com itens
  const groupsWithItems: MenuGroupWithItems[] = (groupsQuery.data || []).map(group => ({
    ...group,
    items: (itemsQuery.data || [])
      .filter(item => item.group_id === group.id)
      .sort((a, b) => a.sort_order - b.sort_order),
  }));

  // ============================================
  // MUTATIONS - GRUPOS
  // ============================================
  const createGroupMutation = useMutation({
    mutationFn: async (input: CreateGroupInput) => {
      const { data, error } = await supabase
        .from("menu_groups")
        .insert({
          group_key: input.group_key,
          group_label: input.group_label,
          group_icon: input.group_icon || null,
          group_color: input.group_color || null,
          sort_order: input.sort_order ?? 999,
          is_system: input.is_system ?? false,
        })
        .select()
        .single();

      if (error) throw error;
      return data as MenuGroup;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.menuGroups });
      toast.success("Grupo criado com sucesso");
    },
    onError: (error: Error) => {
      toast.error(`Erro ao criar grupo: ${error.message}`);
    },
  });

  const updateGroupMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateGroupInput }) => {
      const { data: result, error } = await supabase
        .from("menu_groups")
        .update(data)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return result as MenuGroup;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.menuGroups });
      toast.success("Grupo atualizado");
    },
    onError: (error: Error) => {
      toast.error(`Erro ao atualizar grupo: ${error.message}`);
    },
  });

  const deleteGroupMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("menu_groups")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.menuGroups });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.menuItems });
      toast.success("Grupo excluído");
    },
    onError: (error: Error) => {
      toast.error(`Erro ao excluir grupo: ${error.message}`);
    },
  });

  // ============================================
  // MUTATIONS - ITENS
  // ============================================
  const createItemMutation = useMutation({
    mutationFn: async (input: CreateItemInput) => {
      const { data, error } = await supabase
        .from("menu_items")
        .insert({
          group_id: input.group_id,
          item_key: input.item_key,
          item_label: input.item_label,
          item_url: input.item_url,
          item_icon: input.item_icon,
          item_area: input.item_area || null,
          item_badge: input.item_badge || null,
          item_badge_variant: input.item_badge_variant || null,
          allowed_roles: input.allowed_roles || ["owner", "admin"],
          sort_order: input.sort_order ?? 999,
          is_system: input.is_system ?? false,
          opens_in_new_tab: input.opens_in_new_tab ?? false,
        })
        .select()
        .single();

      if (error) throw error;
      return data as MenuItem;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.menuItems });
      toast.success("Item criado com sucesso");
    },
    onError: (error: Error) => {
      toast.error(`Erro ao criar item: ${error.message}`);
    },
  });

  const updateItemMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateItemInput }) => {
      const { data: result, error } = await supabase
        .from("menu_items")
        .update(data)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return result as MenuItem;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.menuItems });
      toast.success("Item atualizado");
    },
    onError: (error: Error) => {
      toast.error(`Erro ao atualizar item: ${error.message}`);
    },
  });

  const deleteItemMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("menu_items")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.menuItems });
      toast.success("Item excluído");
    },
    onError: (error: Error) => {
      toast.error(`Erro ao excluir item: ${error.message}`);
    },
  });

  // ============================================
  // BULK UPDATE - PARA DRAG AND DROP
  // ============================================
  const bulkUpdateOrderMutation = useMutation({
    mutationFn: async (updates: BulkOrderUpdate[]) => {
      const groupUpdates = updates.filter(u => u.type === "group");
      const itemUpdates = updates.filter(u => u.type === "item");

      // Atualizar grupos
      for (const update of groupUpdates) {
        const { error } = await supabase
          .from("menu_groups")
          .update({ sort_order: update.sort_order })
          .eq("id", update.id);
        if (error) throw error;
      }

      // Atualizar itens (pode incluir mudança de grupo)
      for (const update of itemUpdates) {
        const updateData: Record<string, unknown> = { sort_order: update.sort_order };
        if (update.group_id) {
          updateData.group_id = update.group_id;
        }
        
        const { error } = await supabase
          .from("menu_items")
          .update(updateData)
          .eq("id", update.id);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.menuGroups });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.menuItems });
      toast.success("Ordem atualizada");
    },
    onError: (error: Error) => {
      toast.error(`Erro ao atualizar ordem: ${error.message}`);
    },
  });

  // ============================================
  // HELPERS
  // ============================================
  const refetchAll = () => {
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.menuGroups });
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.menuItems });
  };

  const isLoading = groupsQuery.isLoading || itemsQuery.isLoading;
  const isError = groupsQuery.isError || itemsQuery.isError;
  const error = groupsQuery.error || itemsQuery.error;
  const hasData = (groupsQuery.data?.length ?? 0) > 0;

  // ============================================
  // RETURN
  // ============================================
  return {
    // Data
    groups: groupsQuery.data || [],
    items: itemsQuery.data || [],
    groupsWithItems,
    hasData,

    // Status
    isLoading,
    isError,
    error,

    // Mutations
    createGroup: createGroupMutation.mutateAsync,
    updateGroup: (id: string, data: UpdateGroupInput) => 
      updateGroupMutation.mutateAsync({ id, data }),
    deleteGroup: deleteGroupMutation.mutateAsync,

    createItem: createItemMutation.mutateAsync,
    updateItem: (id: string, data: UpdateItemInput) => 
      updateItemMutation.mutateAsync({ id, data }),
    deleteItem: deleteItemMutation.mutateAsync,

    bulkUpdateOrder: bulkUpdateOrderMutation.mutateAsync,

    // Helpers
    refetchAll,

    // Mutation states
    isMutating: 
      createGroupMutation.isPending ||
      updateGroupMutation.isPending ||
      deleteGroupMutation.isPending ||
      createItemMutation.isPending ||
      updateItemMutation.isPending ||
      deleteItemMutation.isPending ||
      bulkUpdateOrderMutation.isPending,
  };
}
