// ============================================
// HOOK: useAlunosData
// Versão LIMPA - WordPress removido em 2025-12-28
// Centraliza lógica de dados de alunos (apenas Supabase)
// ============================================

import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Student {
  id: string;
  nome: string;
  email: string;
  curso: string;
  status: string;
  fonte?: string;
  role?: 'beta' | 'aluno_gratuito' | null;
}

export interface AlunoFormData {
  nome: string;
  email: string;
  curso: string;
  status: string;
}

interface UseAlunosDataReturn {
  isLoading: boolean;
  saveStudent: (formData: AlunoFormData, editingItem: Student | null) => Promise<boolean>;
  deleteStudent: (id: string) => Promise<boolean>;
}

export function useAlunosData(refetchPaginated: () => void): UseAlunosDataReturn {
  const [isLoading, setIsLoading] = useState(false);

  const saveStudent = useCallback(async (formData: AlunoFormData, editingItem: Student | null): Promise<boolean> => {
    if (!formData.nome.trim()) {
      toast.error("Preencha o nome");
      return false;
    }

    if (!formData.email.trim()) {
      toast.error("Preencha o email");
      return false;
    }

    setIsLoading(true);
    try {
      if (editingItem) {
        const { error } = await supabase
          .from("alunos")
          .update({ nome: formData.nome, email: formData.email, status: formData.status })
          .eq("id", editingItem.id);
        if (error) throw error;
        toast.success("Aluno atualizado!");
      } else {
        const { data: alunoData, error: alunoError } = await supabase.from("alunos").insert({
          nome: formData.nome,
          email: formData.email,
          status: formData.status,
        }).select().single();
        
        if (alunoError) throw alunoError;

        // Check profile for role assignment
        const { data: profileData } = await supabase
          .from("profiles")
          .select("id")
          .eq("email", formData.email.toLowerCase())
          .maybeSingle();

        if (profileData?.id) {
          const { error: roleError } = await supabase.from("user_roles").upsert({
            user_id: profileData.id,
            role: "beta" as any,
          }, { onConflict: "user_id" });

          if (roleError) {
            console.warn("Não foi possível atribuir role beta:", roleError);
          } else {
            toast.success("🎓 Aluno adicionado com acesso BETA!");
            return true;
          }
        } else {
          toast.success("Aluno adicionado! (Role será atribuído quando fizer login)");
        }
      }

      refetchPaginated();
      return true;
    } catch (error: any) {
      console.error("Error saving student:", error);
      toast.error(error.message || "Erro ao salvar");
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [refetchPaginated]);

  // ============================================
  // DELETE - RLS garante que só ADMIN/OWNER podem excluir
  // ============================================
  const deleteStudent = useCallback(async (id: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const { error } = await supabase.from("alunos").delete().eq("id", id);
      if (error) {
        // RLS bloqueou - usuário não tem permissão
        if (error.code === '42501' || error.message.includes('policy')) {
          toast.error("Sem permissão para excluir", {
            description: "Apenas Admin ou Owner podem excluir alunos"
          });
          return false;
        }
        throw error;
      }
      toast.success("Aluno removido com sucesso!");
      refetchPaginated();
      return true;
    } catch (error: any) {
      console.error("Error deleting student:", error);
      toast.error("Erro ao remover aluno", {
        description: error.message || "Tente novamente"
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [refetchPaginated]);

  // Realtime subscription for alunos changes
  useEffect(() => {
    const channel = supabase
      .channel('gestao-alunos-realtime-hook')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'alunos' }, () => {
        refetchPaginated();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
        refetchPaginated();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_roles' }, () => {
        refetchPaginated();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refetchPaginated]);

  return {
    isLoading,
    saveStudent,
    deleteStudent,
  };
}

// Hook para filtragem de alunos por universo (sem WordPress)
export function useAlunosFiltering(
  students: Student[],
  universeFilters: { filterFn: (s: any) => boolean } | null,
  expectedRole: 'beta' | 'aluno_gratuito' | null
) {
  const filteredStudents = useMemo(() => {
    if (!universeFilters) return students;
    
    return students.filter(s => {
      const passesUniverseFilter = universeFilters.filterFn(s);
      if (!passesUniverseFilter) return false;
      
      if (expectedRole) {
        return s.role === expectedRole;
      }
      return true;
    });
  }, [students, universeFilters, expectedRole]);

  return { filteredStudents };
}