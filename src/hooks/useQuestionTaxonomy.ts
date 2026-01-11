// ============================================
// HOOK: TAXONOMIA HIERÁRQUICA DE QUESTÕES
// MACRO → MICRO → TEMA → SUBTEMA
// COM SUPABASE REALTIME - ATUALIZAÇÃO INSTANTÂNEA
// ============================================

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useEffect } from "react";

export interface TaxonomyItem {
  id: string;
  parent_id: string | null;
  level: "macro" | "micro" | "tema" | "subtema";
  value: string;
  label: string;
  icon?: string | null;
  position: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  children?: TaxonomyItem[];
}

export interface TaxonomyTree {
  macros: TaxonomyItem[];
  getMicros: (macroValue: string) => TaxonomyItem[];
  getTemas: (microValue: string) => TaxonomyItem[];
  getSubtemas: (temaValue: string) => TaxonomyItem[];
  getByValue: (value: string) => TaxonomyItem | undefined;
  getById: (id: string) => TaxonomyItem | undefined;
  getByParentId: (parentId: string) => TaxonomyItem[];
  allItems: TaxonomyItem[];
}

// Hook principal com Realtime
export function useQuestionTaxonomy() {
  const queryClient = useQueryClient();

  // Setup Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('question-taxonomy-realtime')
      .on(
        'postgres_changes',
        {
          event: '*', // INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'question_taxonomy'
        },
        (payload) => {
          console.log('[Taxonomy Realtime] Change detected:', payload.eventType);
          // Invalidar cache imediatamente
          queryClient.invalidateQueries({ queryKey: ["question-taxonomy"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return useQuery({
    queryKey: ["question-taxonomy"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("question_taxonomy")
        .select("*")
        .eq("is_active", true)
        .order("position", { ascending: true });

      if (error) throw error;

      const items = (data || []) as TaxonomyItem[];

      // Normalizador: aceita value/label (com acento/hífen) e também slug (quimica_geral)
      // Importante: converte QUALQUER separador (espaço, hífen, pontuação) em "_" para evitar mismatch
      // Ex: "Físico-Química" -> "fisico_quimica"
      const slugify = (input: string) => input
        .toLowerCase()
        .trim()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "_")
        .replace(/^_+|_+$/g, "");

      const matchesTaxonomyKey = (item: TaxonomyItem, key: string) => {
        if (!key) return false;
        const keySlug = slugify(key);
        const itemValueSlug = slugify(item.value);
        const itemLabelSlug = slugify(item.label);
        // Match bidirecional: aceita qualquer combinação de value/label/slug de ambos os lados
        return (
          item.value === key ||
          item.label === key ||
          itemValueSlug === key ||
          itemLabelSlug === key ||
          item.value === keySlug ||
          item.label === keySlug ||
          itemValueSlug === keySlug ||
          itemLabelSlug === keySlug
        );
      };

      // Construir árvore hierárquica com funções utilitárias
      const tree: TaxonomyTree = {
        macros: items.filter((i) => i.level === "macro"),
        getMicros: (macroValue: string) => {
          const macro = items.find((i) => i.level === "macro" && matchesTaxonomyKey(i, macroValue));
          if (!macro) return [];
          return items.filter((i) => i.parent_id === macro.id && i.level === "micro");
        },
        getTemas: (microValue: string) => {
          const micro = items.find((i) => i.level === "micro" && matchesTaxonomyKey(i, microValue));
          if (!micro) return [];
          return items.filter((i) => i.parent_id === micro.id && i.level === "tema");
        },
        getSubtemas: (temaValue: string) => {
          const tema = items.find((i) => i.level === "tema" && matchesTaxonomyKey(i, temaValue));
          if (!tema) return [];
          return items.filter((i) => i.parent_id === tema.id && i.level === "subtema");
        },
        getByValue: (value: string) => items.find((i) => i.value === value),
        getById: (id: string) => items.find((i) => i.id === id),
        getByParentId: (parentId: string) => items.filter((i) => i.parent_id === parentId),
        allItems: items,
      };

      return { items, tree };
    },
    staleTime: 1000 * 60 * 5, // 5 minutos - mas Realtime atualiza instantaneamente
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });
}

// Hook para obter arrays formatados para Select components
// HÍBRIDO: MICRO filtrado por MACRO, TEMA/SUBTEMA = busca livre global
export function useTaxonomyForSelects() {
  const { data, isLoading, error } = useQuestionTaxonomy();
  
  const macros = data?.tree.macros.map(m => ({ value: m.value, label: m.icon ? `${m.icon} ${m.label}` : m.label })) || [];
  
  // MICRO: Filtrado pelo MACRO selecionado (comportamento normal)
  const getMicrosForSelect = (macroValue: string) => {
    if (!data || !macroValue) return [];
    return data.tree.getMicros(macroValue).map(m => ({ value: m.value, label: m.icon ? `${m.icon} ${m.label}` : m.label }));
  };
  
  // TEMA: Busca livre - retorna TODOS os temas de todos os micros
  const getAllTemasForSelect = () => {
    if (!data) return [];
    return data.items
      .filter(i => i.level === 'tema')
      .map(t => ({ value: t.value, label: t.icon ? `${t.icon} ${t.label}` : t.label }));
  };
  
  // SUBTEMA: Busca livre - retorna TODOS os subtemas de todos os temas
  const getAllSubtemasForSelect = () => {
    if (!data) return [];
    return data.items
      .filter(i => i.level === 'subtema')
      .map(s => ({ value: s.value, label: s.icon ? `${s.icon} ${s.label}` : s.label }));
  };
  
  // Manter funções antigas para compatibilidade (caso algum componente use)
  const getTemasForSelect = (microValue: string) => {
    if (!data || !microValue) return [];
    return data.tree.getTemas(microValue).map(m => ({ value: m.value, label: m.icon ? `${m.icon} ${m.label}` : m.label }));
  };
  
  const getSubtemasForSelect = (temaValue: string) => {
    if (!data || !temaValue) return [];
    return data.tree.getSubtemas(temaValue).map(m => ({ value: m.value, label: m.icon ? `${m.icon} ${m.label}` : m.label }));
  };

  return {
    isLoading,
    error,
    macros,
    getMicrosForSelect,
    getTemasForSelect,
    getSubtemasForSelect,
    // Novas funções para busca livre
    getAllTemasForSelect,
    getAllSubtemasForSelect,
    tree: data?.tree,
    allItems: data?.items || [],
  };
}

// Buscar apenas MACROs para select
export function useTaxonomyMacros() {
  const { data, isLoading } = useQuestionTaxonomy();
  return {
    macros: data?.tree.macros || [],
    isLoading,
  };
}

// Buscar MICROs de um MACRO
export function useTaxonomyMicros(macroValue: string | null) {
  const { data, isLoading } = useQuestionTaxonomy();
  return {
    micros: macroValue ? data?.tree.getMicros(macroValue) || [] : [],
    isLoading,
  };
}

// Buscar TEMAs de um MICRO
export function useTaxonomyTemas(microValue: string | null) {
  const { data, isLoading } = useQuestionTaxonomy();
  return {
    temas: microValue ? data?.tree.getTemas(microValue) || [] : [],
    isLoading,
  };
}

// Buscar SUBTEMAs de um TEMA
export function useTaxonomySubtemas(temaValue: string | null) {
  const { data, isLoading } = useQuestionTaxonomy();
  return {
    subtemas: temaValue ? data?.tree.getSubtemas(temaValue) || [] : [],
    isLoading,
  };
}

// ============================================
// MUTATIONS - APENAS OWNER
// ============================================

interface CreateTaxonomyInput {
  parent_id?: string | null;
  level: "macro" | "micro" | "tema" | "subtema";
  value?: string; // opcional - será gerado automaticamente do label
  label: string;
  icon?: string;
  position?: number;
}

interface UpdateTaxonomyInput {
  id: string;
  label?: string;
  value?: string;
  icon?: string;
  position?: number;
  is_active?: boolean;
}

// Criar item na taxonomia
export function useCreateTaxonomy() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateTaxonomyInput) => {
      // Gerar value do label se não fornecido
      const value = input.value || input.label.toLowerCase().replace(/\s+/g, "_").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      
      const { data, error } = await supabase
        .from("question_taxonomy")
        .insert({
          parent_id: input.parent_id || null,
          level: input.level,
          value,
          label: input.label,
          icon: input.icon,
          position: input.position || 0,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["question-taxonomy"] });
      toast.success(`${data.label} adicionado com sucesso!`);
    },
    onError: (error: any) => {
      console.error("Erro ao criar taxonomia:", error);
      toast.error("Erro ao adicionar item");
    },
  });
}

// Atualizar item na taxonomia
export function useUpdateTaxonomy() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateTaxonomyInput) => {
      const { id, ...updates } = input;
      
      // Se mudar o label, atualizar o value também
      if (updates.label && !updates.value) {
        updates.value = updates.label.toLowerCase().replace(/\s+/g, "_").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      }

      const { data, error } = await supabase
        .from("question_taxonomy")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["question-taxonomy"] });
      toast.success(`${data.label} atualizado!`);
    },
    onError: (error: any) => {
      console.error("Erro ao atualizar taxonomia:", error);
      toast.error("Erro ao atualizar item");
    },
  });
}

// Deletar item na taxonomia
export function useDeleteTaxonomy() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("question_taxonomy")
        .delete()
        .eq("id", id);

      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["question-taxonomy"] });
      toast.success("Item removido com sucesso!");
    },
    onError: (error: any) => {
      console.error("Erro ao deletar taxonomia:", error);
      toast.error("Erro ao remover item. Verifique se não há itens filhos.");
    },
  });
}

// Reordenar itens
export function useReorderTaxonomy() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (items: { id: string; position: number }[]) => {
      const promises = items.map(({ id, position }) =>
        supabase.from("question_taxonomy").update({ position }).eq("id", id)
      );
      await Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["question-taxonomy"] });
    },
  });
}
