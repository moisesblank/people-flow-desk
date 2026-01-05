/**
 * 🎯 SIMULADOS — Hook de Listagem
 * Constituição SYNAPSE Ω v10.0
 * 
 * Busca simulados disponíveis para o aluno.
 * Reutilizável em AlunoSimulados e Modal.
 */

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface SimuladoListItem {
  id: string;
  title: string;
  description: string | null;
  slug: string | null;
  duration_minutes: number;
  total_questions: number;
  points_per_question: number;
  passing_score: number;
  is_hard_mode: boolean;
  requires_camera: boolean;
  starts_at: string | null;
  ends_at: string | null;
  results_released_at: string | null;
  is_active: boolean;
  is_published: boolean;
  created_at: string;
  // Dados da tentativa do usuário (se existir)
  user_attempt?: {
    id: string;
    status: string;
    score: number;
    correct_answers: number;
    attempt_number: number;
    is_scored_for_ranking: boolean;
    finished_at: string | null;
  } | null;
}

export interface SimuladosListData {
  available: SimuladoListItem[];
  completed: SimuladoListItem[];
  upcoming: SimuladoListItem[];
}

interface UseSimuladosListOptions {
  enabled?: boolean;
}

export function useSimuladosList(options: UseSimuladosListOptions = {}) {
  const { enabled = true } = options;

  return useQuery({
    queryKey: ["simulados-list"],
    queryFn: async (): Promise<SimuladosListData> => {
      const now = new Date().toISOString();

      // Buscar simulados ativos e publicados
      const { data: simulados, error: simError } = await supabase
        .from("simulados")
        .select(`
          id,
          title,
          description,
          slug,
          duration_minutes,
          total_questions,
          points_per_question,
          passing_score,
          is_hard_mode,
          requires_camera,
          starts_at,
          ends_at,
          results_released_at,
          is_active,
          is_published,
          created_at
        `)
        .eq("is_active", true)
        .eq("is_published", true)
        .order("starts_at", { ascending: false, nullsFirst: false });

      if (simError) throw simError;

      // Buscar tentativas do usuário atual
      const { data: { user } } = await supabase.auth.getUser();
      
      let userAttempts: Record<string, SimuladoListItem["user_attempt"]> = {};
      
      if (user) {
        const { data: attempts } = await supabase
          .from("simulado_attempts")
          .select(`
            id,
            simulado_id,
            status,
            score,
            correct_answers,
            attempt_number,
            is_scored_for_ranking,
            finished_at
          `)
          .eq("user_id", user.id)
          .order("attempt_number", { ascending: false });

        if (attempts) {
          // Pegar a tentativa mais recente de cada simulado
          attempts.forEach((attempt) => {
            if (!userAttempts[attempt.simulado_id]) {
              userAttempts[attempt.simulado_id] = {
                id: attempt.id,
                status: attempt.status,
                score: attempt.score || 0,
                correct_answers: attempt.correct_answers || 0,
                attempt_number: attempt.attempt_number,
                is_scored_for_ranking: attempt.is_scored_for_ranking,
                finished_at: attempt.finished_at,
              };
            }
          });
        }
      }

      // Classificar simulados
      const available: SimuladoListItem[] = [];
      const completed: SimuladoListItem[] = [];
      const upcoming: SimuladoListItem[] = [];

      (simulados || []).forEach((sim) => {
        const item: SimuladoListItem = {
          ...sim,
          user_attempt: userAttempts[sim.id] || null,
        };

        const startsAt = sim.starts_at ? new Date(sim.starts_at) : null;
        const endsAt = sim.ends_at ? new Date(sim.ends_at) : null;
        const nowDate = new Date();

        // Verificar se usuário completou
        const userAttempt = userAttempts[sim.id];
        const isCompleted = userAttempt && 
          (userAttempt.status === "FINISHED" || userAttempt.status === "ABANDONED");

        if (isCompleted) {
          completed.push(item);
        } else if (startsAt && nowDate < startsAt) {
          // Ainda não começou
          upcoming.push(item);
        } else if (endsAt && nowDate > endsAt) {
          // Já encerrou e não foi feito
          // Não mostrar (expirou)
        } else {
          // Disponível
          available.push(item);
        }
      });

      return { available, completed, upcoming };
    },
    enabled,
    staleTime: 30_000, // PATCH 5K: 30s cache para evitar sobrecarga
    refetchOnWindowFocus: true,
  });
}

/**
 * Hook para buscar um simulado específico por ID ou slug
 */
export function useSimuladoDetail(idOrSlug: string | null) {
  return useQuery({
    queryKey: ["simulado-detail", idOrSlug],
    queryFn: async () => {
      if (!idOrSlug) return null;

      // Tentar buscar por ID (UUID) primeiro
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug);

      let query = supabase
        .from("simulados")
        .select("*")
        .eq("is_active", true);

      if (isUUID) {
        query = query.eq("id", idOrSlug);
      } else {
        query = query.eq("slug", idOrSlug);
      }

      const { data, error } = await query.maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!idOrSlug,
  });
}
