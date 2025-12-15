// ============================================
// UPGRADE v10 - FASE 4: TASKS COM KANBAN
// Hook para gestão de tarefas avançada
// ============================================

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  due_date: string | null;
  assigned_to: number | null;
  assigned_to_user: string | null;
  created_by: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export type TaskStatus = "backlog" | "todo" | "in_progress" | "review" | "done";
export type TaskPriority = "low" | "medium" | "high" | "urgent";

export const TASK_STATUSES: { value: TaskStatus; label: string; color: string }[] = [
  { value: "backlog", label: "Backlog", color: "bg-muted" },
  { value: "todo", label: "A Fazer", color: "bg-stats-blue/20" },
  { value: "in_progress", label: "Em Progresso", color: "bg-stats-gold/20" },
  { value: "review", label: "Revisão", color: "bg-stats-purple/20" },
  { value: "done", label: "Concluído", color: "bg-stats-green/20" },
];

export const TASK_PRIORITIES: { value: TaskPriority; label: string; color: string }[] = [
  { value: "low", label: "Baixa", color: "text-muted-foreground" },
  { value: "medium", label: "Média", color: "text-stats-blue" },
  { value: "high", label: "Alta", color: "text-stats-gold" },
  { value: "urgent", label: "Urgente", color: "text-destructive" },
];

// Hook para buscar tarefas
export function useTasks(filters?: {
  status?: TaskStatus;
  priority?: TaskPriority;
}) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["tasks", user?.id, filters],
    queryFn: async () => {
      if (!user?.id) return [];

      let query = supabase
        .from("tasks")
        .select("*")
        .or(`created_by.eq.${user.id},assigned_to_user.eq.${user.id}`)
        .order("created_at", { ascending: false });

      if (filters?.status) {
        query = query.eq("status", filters.status);
      }
      if (filters?.priority) {
        query = query.eq("priority", filters.priority);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Task[];
    },
    enabled: !!user?.id,
  });
}

// Hook para tarefas agrupadas por status (Kanban)
export function useTasksKanban() {
  const { data: tasks = [], isLoading } = useTasks();

  const columns = TASK_STATUSES.map((status) => ({
    ...status,
    tasks: tasks.filter((t) => t.status === status.value),
  }));

  return { columns, isLoading };
}

// Hook para criar tarefa
export function useCreateTask() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: {
      title: string;
      description?: string;
      status?: string;
      priority?: string;
      due_date?: string;
      assigned_to_user?: string;
    }) => {
      if (!user?.id) throw new Error("Usuário não autenticado");

      const { data: result, error } = await supabase
        .from("tasks")
        .insert({
          title: data.title,
          description: data.description,
          status: data.status || "todo",
          priority: data.priority || "medium",
          due_date: data.due_date,
          assigned_to_user: data.assigned_to_user,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      toast.success("Tarefa criada!");
    },
    onError: (error) => {
      toast.error("Erro ao criar tarefa: " + error.message);
    },
  });
}

// Hook para atualizar tarefa
export function useUpdateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      ...data
    }: {
      id: string;
      title?: string;
      description?: string;
      status?: string;
      priority?: string;
      due_date?: string;
      completed_at?: string;
    }) => {
      const { data: result, error } = await supabase
        .from("tasks")
        .update({ ...data, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      toast.success("Tarefa atualizada!");
    },
    onError: (error) => {
      toast.error("Erro ao atualizar tarefa: " + error.message);
    },
  });
}

// Hook para deletar tarefa
export function useDeleteTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("tasks").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      toast.success("Tarefa excluída!");
    },
    onError: (error) => {
      toast.error("Erro ao excluir tarefa: " + error.message);
    },
  });
}

// Hook para mover tarefa (Kanban drag & drop)
export function useMoveTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: TaskStatus }) => {
      const update: Record<string, string> = {
        status,
        updated_at: new Date().toISOString(),
      };

      if (status === "done") {
        update.completed_at = new Date().toISOString();
      }

      const { data, error } = await supabase
        .from("tasks")
        .update(update)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
    onError: (error) => {
      toast.error("Erro ao mover tarefa: " + error.message);
    },
  });
}

// Hook para estatísticas de tarefas
export function useTasksStats() {
  const { data: tasks = [] } = useTasks();

  const stats = {
    total: tasks.length,
    byStatus: TASK_STATUSES.reduce((acc, s) => {
      acc[s.value] = tasks.filter((t) => t.status === s.value).length;
      return acc;
    }, {} as Record<TaskStatus, number>),
    byPriority: TASK_PRIORITIES.reduce((acc, p) => {
      acc[p.value] = tasks.filter((t) => t.priority === p.value).length;
      return acc;
    }, {} as Record<TaskPriority, number>),
    overdue: tasks.filter(
      (t) =>
        t.due_date && new Date(t.due_date) < new Date() && t.status !== "done"
    ).length,
    completedThisWeek: tasks.filter((t) => {
      if (t.status !== "done" || !t.completed_at) return false;
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return new Date(t.completed_at) > weekAgo;
    }).length,
  };

  return stats;
}
