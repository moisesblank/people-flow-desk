// ============================================
// HOOK: TAXONOMIA HIERÁRQUICA DE QUESTÕES
// MACRO → MICRO → TEMA → SUBTEMA
// OWNER pode gerenciar via UI
// ============================================

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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
  getByParentId: (parentId: string) => TaxonomyItem[];
}

// Buscar toda a taxonomia
export function useQuestionTaxonomy() {
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

      // Construir árvore hierárquica
      const tree: TaxonomyTree = {
        macros: items.filter((i) => i.level === "macro"),
        getMicros: (macroValue: string) => {
          const macro = items.find((i) => i.value === macroValue && i.level === "macro");
          if (!macro) return [];
          return items.filter((i) => i.parent_id === macro.id && i.level === "micro");
        },
        getTemas: (microValue: string) => {
          const micro = items.find((i) => i.value === microValue && i.level === "micro");
          if (!micro) return [];
          return items.filter((i) => i.parent_id === micro.id && i.level === "tema");
        },
        getSubtemas: (temaValue: string) => {
          const tema = items.find((i) => i.value === temaValue && i.level === "tema");
          if (!tema) return [];
          return items.filter((i) => i.parent_id === tema.id && i.level === "subtema");
        },
        getByValue: (value: string) => items.find((i) => i.value === value),
        getByParentId: (parentId: string) => items.filter((i) => i.parent_id === parentId),
      };

      return { items, tree };
    },
    staleTime: 1000 * 60 * 10, // 10 minutos - taxonomia é estável
  });
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
      const { data, error } = await supabase
        .from("question_taxonomy")
        .insert({
          parent_id: input.parent_id || null,
          level: input.level,
          value: input.value.toLowerCase().replace(/\s+/g, "_").normalize("NFD").replace(/[\u0300-\u036f]/g, ""),
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
