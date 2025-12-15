// ============================================
// UPGRADE v10 - FASE 3: TIME TRACKING AVANÇADO
// Hook para gestão de tempo e produtividade
// ============================================

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

export interface TimeTracking {
  id: string;
  employee_id: number | null;
  user_id: string;
  clock_in: string;
  clock_out: string | null;
  break_start: string | null;
  break_end: string | null;
  notes: string | null;
  created_at: string;
}

// Hook para buscar time tracking do usuário
export function useMyTimeTracking(dateRange?: { start: Date; end: Date }) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["time-tracking", user?.id, dateRange],
    queryFn: async () => {
      if (!user?.id) return [];

      let query = supabase
        .from("time_tracking")
        .select("*")
        .eq("user_id", user.id)
        .order("clock_in", { ascending: false });

      if (dateRange) {
        query = query
          .gte("clock_in", dateRange.start.toISOString())
          .lte("clock_in", dateRange.end.toISOString());
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as TimeTracking[];
    },
    enabled: !!user?.id,
  });
}

// Hook para iniciar tracking (clock in)
export function useClockIn() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (notes?: string) => {
      if (!user?.id) throw new Error("Usuário não autenticado");

      const { data: result, error } = await supabase
        .from("time_tracking")
        .insert({
          user_id: user.id,
          clock_in: new Date().toISOString(),
          notes,
        })
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["time-tracking"] });
      toast.success("Ponto de entrada registrado!");
    },
    onError: (error) => {
      toast.error("Erro ao registrar entrada: " + error.message);
    },
  });
}

// Hook para parar tracking (clock out)
export function useClockOut() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (trackingId: string) => {
      const { data, error } = await supabase
        .from("time_tracking")
        .update({
          clock_out: new Date().toISOString(),
        })
        .eq("id", trackingId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["time-tracking"] });
      toast.success("Ponto de saída registrado!");
    },
    onError: (error) => {
      toast.error("Erro ao registrar saída: " + error.message);
    },
  });
}

// Hook para iniciar/finalizar intervalo
export function useBreak() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, type }: { id: string; type: "start" | "end" }) => {
      const update =
        type === "start"
          ? { break_start: new Date().toISOString() }
          : { break_end: new Date().toISOString() };

      const { data, error } = await supabase
        .from("time_tracking")
        .update(update)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["time-tracking"] });
      const msg =
        variables.type === "start"
          ? "Intervalo iniciado!"
          : "Intervalo finalizado!";
      toast.success(msg);
    },
    onError: (error) => {
      toast.error("Erro: " + error.message);
    },
  });
}

// Hook para tracking ativo
export function useActiveTimeTracking() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["time-tracking-active", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from("time_tracking")
        .select("*")
        .eq("user_id", user.id)
        .is("clock_out", null)
        .order("clock_in", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data as TimeTracking | null;
    },
    enabled: !!user?.id,
    refetchInterval: 60000,
  });
}

// Hook para estatísticas de tempo
export function useTimeTrackingStats(dateRange?: { start: Date; end: Date }) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["time-tracking-stats", user?.id, dateRange],
    queryFn: async () => {
      if (!user?.id) return null;

      let query = supabase
        .from("time_tracking")
        .select("*")
        .eq("user_id", user.id)
        .not("clock_out", "is", null);

      if (dateRange) {
        query = query
          .gte("clock_in", dateRange.start.toISOString())
          .lte("clock_in", dateRange.end.toISOString());
      }

      const { data, error } = await query;
      if (error) throw error;

      const entries = data as TimeTracking[];

      let totalMinutes = 0;
      let breakMinutes = 0;

      entries.forEach((e) => {
        if (e.clock_in && e.clock_out) {
          const start = new Date(e.clock_in);
          const end = new Date(e.clock_out);
          totalMinutes += Math.round((end.getTime() - start.getTime()) / 60000);

          if (e.break_start && e.break_end) {
            const breakStart = new Date(e.break_start);
            const breakEnd = new Date(e.break_end);
            breakMinutes += Math.round(
              (breakEnd.getTime() - breakStart.getTime()) / 60000
            );
          }
        }
      });

      const workedMinutes = totalMinutes - breakMinutes;

      return {
        totalMinutes,
        workedMinutes,
        breakMinutes,
        totalHours: Math.round((workedMinutes / 60) * 10) / 10,
        entriesCount: entries.length,
        averageMinutesPerDay:
          entries.length > 0 ? Math.round(workedMinutes / entries.length) : 0,
      };
    },
    enabled: !!user?.id,
  });
}

export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours > 0) {
    return `${hours}h ${mins}m`;
  }
  return `${mins}m`;
}

export function calculateWorkedTime(entry: TimeTracking): number {
  if (!entry.clock_in || !entry.clock_out) return 0;

  const start = new Date(entry.clock_in);
  const end = new Date(entry.clock_out);
  let totalMinutes = Math.round((end.getTime() - start.getTime()) / 60000);

  if (entry.break_start && entry.break_end) {
    const breakStart = new Date(entry.break_start);
    const breakEnd = new Date(entry.break_end);
    const breakMinutes = Math.round(
      (breakEnd.getTime() - breakStart.getTime()) / 60000
    );
    totalMinutes -= breakMinutes;
  }

  return totalMinutes;
}
