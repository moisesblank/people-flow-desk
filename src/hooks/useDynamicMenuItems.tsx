import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface DynamicMenuItem {
  id: string;
  group_id: string;
  title: string;
  url: string;
  icon: string;
  area: string;
  badge?: string | null;
  order_index: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateMenuItemInput {
  group_id: string;
  title: string;
  url: string;
  icon: string;
  area: string;
  badge?: string;
  order_index?: number;
}

export function useDynamicMenuItems() {
  const [items, setItems] = useState<DynamicMenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchItems = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('dynamic_menu_items')
        .select('*')
        .order('order_index', { ascending: true });

      if (error) throw error;
      setItems((data as DynamicMenuItem[]) || []);
    } catch (error) {
      console.error('Erro ao buscar itens de menu:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchItems();

    // Realtime subscription
    const channel = supabase
      .channel('dynamic_menu_items_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'dynamic_menu_items' },
        () => {
          fetchItems();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchItems]);

  const createItem = useCallback(async (input: CreateMenuItemInput): Promise<boolean> => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('dynamic_menu_items')
        .insert({
          ...input,
          created_by: userData.user?.id,
          order_index: input.order_index ?? items.length
        });

      if (error) throw error;

      toast({
        title: 'Menu criado!',
        description: `Item "${input.title}" adicionado ao menu.`,
      });

      await fetchItems();
      return true;
    } catch (error: any) {
      console.error('Erro ao criar item de menu:', error);
      toast({
        title: 'Erro ao criar menu',
        description: error.message || 'Tente novamente.',
        variant: 'destructive',
      });
      return false;
    }
  }, [items.length, toast, fetchItems]);

  const updateItem = useCallback(async (id: string, updates: Partial<DynamicMenuItem>): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('dynamic_menu_items')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Menu atualizado!',
        description: 'Alterações salvas com sucesso.',
      });

      await fetchItems();
      return true;
    } catch (error: any) {
      console.error('Erro ao atualizar item de menu:', error);
      toast({
        title: 'Erro ao atualizar',
        description: error.message || 'Tente novamente.',
        variant: 'destructive',
      });
      return false;
    }
  }, [toast, fetchItems]);

  const deleteItem = useCallback(async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('dynamic_menu_items')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Menu removido!',
        description: 'Item excluído com sucesso.',
      });

      await fetchItems();
      return true;
    } catch (error: any) {
      console.error('Erro ao excluir item de menu:', error);
      toast({
        title: 'Erro ao excluir',
        description: error.message || 'Tente novamente.',
        variant: 'destructive',
      });
      return false;
    }
  }, [toast, fetchItems]);

  const toggleActive = useCallback(async (id: string, isActive: boolean): Promise<boolean> => {
    return updateItem(id, { is_active: isActive });
  }, [updateItem]);

  const getItemsByGroup = useCallback((groupId: string) => {
    return items.filter(item => item.group_id === groupId && item.is_active);
  }, [items]);

  return {
    items,
    isLoading,
    createItem,
    updateItem,
    deleteItem,
    toggleActive,
    getItemsByGroup,
    refetch: fetchItems
  };
}
