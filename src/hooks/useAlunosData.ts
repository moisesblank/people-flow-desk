// ============================================
// HOOK: useAlunosData
// Extraído de Alunos.tsx (881 linhas)
// Centraliza lógica de dados de alunos
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

export interface WordPressUser {
  id: string;
  wp_user_id: number;
  email: string;
  nome: string;
  grupos: string[];
  status_acesso: string;
  tem_pagamento_confirmado: boolean;
  data_cadastro_wp: string | null;
  ultimo_login: string | null;
  updated_at: string;
  role?: 'beta' | 'aluno_gratuito' | null;
}

export interface WpStats {
  total: number;
  ativos: number;
  comPagamento: number;
  semPagamento: number;
}

export interface AlunoFormData {
  nome: string;
  email: string;
  curso: string;
  status: string;
}

interface UseAlunosDataReturn {
  wpUsers: WordPressUser[];
  wpStats: WpStats;
  isLoading: boolean;
  isSyncing: boolean;
  fetchWpData: () => Promise<void>;
  syncWordPress: () => Promise<void>;
  saveStudent: (formData: AlunoFormData, editingItem: Student | null) => Promise<boolean>;
  deleteStudent: (id: string) => Promise<boolean>;
}

export function useAlunosData(refetchPaginated: () => void): UseAlunosDataReturn {
  const [wpUsers, setWpUsers] = useState<WordPressUser[]>([]);
  const [wpStats, setWpStats] = useState<WpStats>({
    total: 0,
    ativos: 0,
    comPagamento: 0,
    semPagamento: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  const fetchWpData = useCallback(async () => {
    try {
      const { data: wpData, error: wpError } = await supabase
        .from("usuarios_wordpress_sync")
        .select("id, wp_user_id, email, nome, status_acesso, grupos, tem_pagamento_confirmado, data_cadastro_wp, ultimo_login, updated_at")
        .order("updated_at", { ascending: false })
        .limit(100);
      
      if (wpError) {
        console.error("Error fetching WP users:", wpError);
        return;
      }
      
      const wpUsersMapped: WordPressUser[] = (wpData || []).map(u => ({
        id: u.id,
        wp_user_id: u.wp_user_id,
        email: u.email,
        nome: u.nome || '',
        grupos: Array.isArray(u.grupos) ? (u.grupos as unknown as string[]) : [],
        status_acesso: u.status_acesso || 'aguardando_pagamento',
        tem_pagamento_confirmado: u.tem_pagamento_confirmado || false,
        data_cadastro_wp: u.data_cadastro_wp,
        ultimo_login: u.ultimo_login,
        updated_at: u.updated_at,
        role: null,
      }));
      setWpUsers(wpUsersMapped);

      // Calculate stats via count queries
      const [totalRes, ativosRes, comPagRes] = await Promise.all([
        supabase.from("usuarios_wordpress_sync").select('*', { count: 'exact', head: true }),
        supabase.from("usuarios_wordpress_sync").select('*', { count: 'exact', head: true }).eq('status_acesso', 'ativo'),
        supabase.from("usuarios_wordpress_sync").select('*', { count: 'exact', head: true }).eq('tem_pagamento_confirmado', true),
      ]);

      setWpStats({
        total: totalRes.count || 0,
        ativos: ativosRes.count || 0,
        comPagamento: comPagRes.count || 0,
        semPagamento: (totalRes.count || 0) - (comPagRes.count || 0)
      });
    } catch (error) {
      console.error("Error fetching WP data:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const syncWordPress = useCallback(async () => {
    setIsSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke('sync-wordpress-users');
      
      if (error) throw error;
      
      toast.success(`✅ Sincronização concluída!`, {
        description: `${data?.total_synced || 0} usuários sincronizados`
      });
      
      await fetchWpData();
      refetchPaginated();
    } catch (error) {
      console.error("Sync error:", error);
      toast.error("Erro ao sincronizar com WordPress");
    } finally {
      setIsSyncing(false);
    }
  }, [fetchWpData, refetchPaginated]);

  const saveStudent = useCallback(async (formData: AlunoFormData, editingItem: Student | null): Promise<boolean> => {
    if (!formData.nome.trim()) {
      toast.error("Preencha o nome");
      return false;
    }

    if (!formData.email.trim()) {
      toast.error("Preencha o email");
      return false;
    }

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
      await fetchWpData();
      return true;
    } catch (error: any) {
      console.error("Error saving student:", error);
      toast.error(error.message || "Erro ao salvar");
      return false;
    }
  }, [fetchWpData, refetchPaginated]);

  const deleteStudent = useCallback(async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase.from("alunos").delete().eq("id", id);
      if (error) throw error;
      toast.success("Aluno removido!");
      refetchPaginated();
      await fetchWpData();
      return true;
    } catch (error) {
      console.error("Error deleting student:", error);
      toast.error("Erro ao remover");
      return false;
    }
  }, [fetchWpData, refetchPaginated]);

  // Initial fetch
  useEffect(() => {
    fetchWpData();
  }, [fetchWpData]);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('gestao-alunos-realtime-hook')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'usuarios_wordpress_sync' }, () => {
        fetchWpData();
      })
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
  }, [fetchWpData, refetchPaginated]);

  return {
    wpUsers,
    wpStats,
    isLoading,
    isSyncing,
    fetchWpData,
    syncWordPress,
    saveStudent,
    deleteStudent,
  };
}

// Hook para filtragem de alunos por universo
export function useAlunosFiltering(
  students: Student[],
  wpUsers: WordPressUser[],
  universeFilters: { filterFn: (s: any) => boolean; wpFilterFn?: (u: any) => boolean } | null,
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

  const filteredWpUsers = useMemo(() => {
    if (!universeFilters || !universeFilters.wpFilterFn) return wpUsers;
    
    return wpUsers.filter(u => {
      const passesUniverseFilter = universeFilters.wpFilterFn!(u);
      if (!passesUniverseFilter) return false;
      
      if (expectedRole) {
        return u.role === expectedRole;
      }
      return true;
    });
  }, [wpUsers, universeFilters, expectedRole]);

  const filteredWpStats = useMemo(() => {
    const ativos = filteredWpUsers.filter(u => u.status_acesso === 'ativo').length;
    const comPagamento = filteredWpUsers.filter(u => u.tem_pagamento_confirmado).length;
    const semPagamento = filteredWpUsers.filter(u => !u.tem_pagamento_confirmado && u.grupos.length > 0).length;
    return {
      total: filteredWpUsers.length,
      ativos,
      comPagamento,
      semPagamento
    };
  }, [filteredWpUsers]);

  return { filteredStudents, filteredWpUsers, filteredWpStats };
}
