// ============================================
// UPGRADE v11 - FASE 4: TASKS COM KANBAN
// 🌌 TESE 3: Cache localStorage = 0ms segunda visita
// ============================================

import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";
import { useSubspaceQuery, useOptimisticMutation } from "./useSubspaceCommunication";

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

// Hook para buscar tarefas - Com Cache localStorage
export function useTasks(filters?: {
  status?: TaskStatus;
  priority?: TaskPriority;
}) {
  const { user } = useAuth();

  return useSubspaceQuery<Task[]>(
    ["tasks", user?.id || '', filters?.status || '', filters?.priority || ''],
    async () => {
      if (!user?.id) return [];

      // ⚡ DOGMA V.5K: Query otimizada com limite
      let query = supabase
        .from("tasks")
        .select("*")
        .or(`created_by.eq.${user.id},assigned_to_user.eq.${user.id}`)
        .order("created_at", { ascending: false })
        .limit(200);

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
    {
      profile: 'user', // 5 min staleTime, persiste 1h
      persistKey: `tasks_${user?.id}_${filters?.status || 'all'}_${filters?.priority || 'all'}`,
      enabled: !!user?.id,
    }
  );
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

// Hook para criar tarefa - MIGRADO PARA useOptimisticMutation
export function useCreateTask() {
  const { user } = useAuth();

  return useOptimisticMutation<Task[], { title: string; description?: string; status?: string; priority?: string; due_date?: string; assigned_to_user?: string }, Task>({
    queryKey: ["tasks", user?.id || '', '', ''],
    mutationFn: async (data) => {
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
      return result as Task;
    },
    optimisticUpdate: (old: any, newTask) => {
      const optimisticTask: Task = {
        id: `temp-${Date.now()}`,
        title: newTask.title,
        description: newTask.description || null,
        status: newTask.status || "todo",
        priority: newTask.priority || "medium",
        due_date: newTask.due_date || null,
        assigned_to: null,
        assigned_to_user: newTask.assigned_to_user || null,
        created_by: null,
        completed_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      return [optimisticTask, ...(old || [])];
    },
    successMessage: "Tarefa criada!",
    errorMessage: "Erro ao criar tarefa",
  });
}

// Hook para atualizar tarefa - MIGRADO PARA useOptimisticMutation
export function useUpdateTask() {
  const { user } = useAuth();

  return useOptimisticMutation<Task[], { id: string; title?: string; description?: string; status?: string; priority?: string; due_date?: string; completed_at?: string }, Task>({
    queryKey: ["tasks", user?.id || '', '', ''],
    mutationFn: async ({ id, ...data }) => {
      const { data: result, error } = await supabase
        .from("tasks")
        .update({ ...data, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return result as Task;
    },
    optimisticUpdate: (old: any, { id, ...updates }) => {
      return (old || []).map((task: Task) =>
        task.id === id ? { ...task, ...updates, updated_at: new Date().toISOString() } : task
      );
    },
    successMessage: "Tarefa atualizada!",
    errorMessage: "Erro ao atualizar tarefa",
  });
}

// Hook para deletar tarefa - MIGRADO PARA useOptimisticMutation
export function useDeleteTask() {
  const { user } = useAuth();

  return useOptimisticMutation<Task[], string, void>({
    queryKey: ["tasks", user?.id || '', '', ''],
    mutationFn: async (id) => {
      const { error } = await supabase.from("tasks").delete().eq("id", id);
      if (error) throw error;
    },
    optimisticUpdate: (old: any, id) => {
      return (old || []).filter((task: Task) => task.id !== id);
    },
    successMessage: "Tarefa excluída!",
    errorMessage: "Erro ao excluir tarefa",
  });
}

// Hook para mover tarefa (Kanban drag & drop) - MIGRADO PARA useOptimisticMutation
export function useMoveTask() {
  const { user } = useAuth();

  return useOptimisticMutation<Task[], { id: string; status: TaskStatus }, Task>({
    queryKey: ["tasks", user?.id || '', '', ''],
    mutationFn: async ({ id, status }) => {
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
      return data as Task;
    },
    optimisticUpdate: (old: any, { id, status }) => {
      return (old || []).map((task: Task) =>
        task.id === id 
          ? { 
              ...task, 
              status, 
              updated_at: new Date().toISOString(),
              completed_at: status === "done" ? new Date().toISOString() : task.completed_at
            } 
          : task
      );
    },
    errorMessage: "Erro ao mover tarefa",
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
