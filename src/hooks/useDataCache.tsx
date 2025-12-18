import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { CalendarTask, DashboardStats } from "@/types/calendar";

// Cache keys
export const CACHE_KEYS = {
  employees: ["employees"] as const,
  affiliates: ["affiliates"] as const,
  students: ["students"] as const,
  personalExpenses: ["personalExpenses"] as const,
  companyExpenses: ["companyExpenses"] as const,
  income: ["income"] as const,
  payments: ["payments"] as const,
  calendarTasks: ["calendarTasks"] as const,
  sitePendencias: ["sitePendencias"] as const,
  contabilidade: ["contabilidade"] as const,
  dashboardStats: ["dashboardStats"] as const,
};

// Generic fetch hook
export function useDataFetch<T>(
  key: readonly string[] | string[],
  fetcher: () => Promise<T>,
  options?: {
    staleTime?: number;
    cacheTime?: number;
    enabled?: boolean;
    refetchOnWindowFocus?: boolean;
  }
) {
  return useQuery({
    queryKey: key,
    queryFn: fetcher,
    staleTime: options?.staleTime ?? 5 * 60 * 1000, // 5 minutes default
    gcTime: options?.cacheTime ?? 10 * 60 * 1000, // 10 minutes default
    enabled: options?.enabled ?? true,
    refetchOnWindowFocus: options?.refetchOnWindowFocus ?? false,
  });
}

// Dashboard stats hook with caching
export function useDashboardStats() {
  return useDataFetch<DashboardStats>(CACHE_KEYS.dashboardStats, async () => {
    const [
      employeesRes,
      personalFixedRes,
      personalExtraRes,
      companyFixedRes,
      companyExtraRes,
      incomeRes,
      affiliatesRes,
      studentsRes,
      calendarTasksRes,
      paymentsRes,
      sitePendenciasRes,
    ] = await Promise.all([
      supabase.from("employees").select("id", { count: "exact", head: true }),
      supabase.from("personal_fixed_expenses").select("valor"),
      supabase.from("personal_extra_expenses").select("valor, categoria, nome, created_at"),
      supabase.from("company_fixed_expenses").select("valor"),
      supabase.from("company_extra_expenses").select("valor, nome, created_at"),
      supabase.from("income").select("valor, fonte, created_at"),
      supabase.from("affiliates").select("id", { count: "exact", head: true }),
      supabase.from("students").select("id", { count: "exact", head: true }),
      supabase.from("calendar_tasks").select("*").eq("is_completed", false),
      supabase.from("payments").select("*").eq("status", "pendente"),
      supabase.from("website_pendencias").select("*").neq("status", "concluido"),
    ]);

    const personalFixed = personalFixedRes.data?.reduce((acc, e) => acc + (e.valor || 0), 0) || 0;
    const personalExtra = personalExtraRes.data?.reduce((acc, e) => acc + (e.valor || 0), 0) || 0;
    const companyFixed = companyFixedRes.data?.reduce((acc, e) => acc + (e.valor || 0), 0) || 0;
    const companyExtra = companyExtraRes.data?.reduce((acc, e) => acc + (e.valor || 0), 0) || 0;
    const totalIncome = incomeRes.data?.reduce((acc, e) => acc + (e.valor || 0), 0) || 0;

    return {
      employees: employeesRes.count || 0,
      personalExpenses: personalFixed + personalExtra,
      companyExpenses: companyFixed + companyExtra,
      income: totalIncome,
      affiliates: affiliatesRes.count || 0,
      students: studentsRes.count || 0,
      pendingTasks: calendarTasksRes.data?.length || 0,
      pendingPayments: paymentsRes.data?.length || 0,
      sitePendencias: sitePendenciasRes.data?.length || 0,
      personalExtraData: personalExtraRes.data || [],
      incomeData: incomeRes.data || [],
      tasksData: (calendarTasksRes.data || []) as CalendarTask[],
      paymentsData: paymentsRes.data || [],
      sitePendenciasData: sitePendenciasRes.data || [],
    };
  }, { staleTime: 2 * 60 * 1000 }); // 2 minutes
}

// Employees hook with caching (usa view segura que mascara salários)
export function useEmployees() {
  return useDataFetch(CACHE_KEYS.employees, async () => {
    const { data, error } = await supabase
      .from("employees_safe")
      .select("*")
      .order("created_at", { ascending: false });
    
    if (error) throw error;
    return data;
  });
}

// Affiliates hook with caching
export function useAffiliates() {
  return useDataFetch(CACHE_KEYS.affiliates, async () => {
    const { data, error } = await supabase
      .from("affiliates")
      .select("*")
      .order("created_at", { ascending: false });
    
    if (error) throw error;
    return data;
  });
}

// Students hook with caching
export function useStudents() {
  return useDataFetch(CACHE_KEYS.students, async () => {
    const { data, error } = await supabase
      .from("students")
      .select("*")
      .order("created_at", { ascending: false });
    
    if (error) throw error;
    return data;
  });
}

// Calendar tasks hook with caching
export function useCalendarTasks(userId?: string) {
  return useDataFetch(
    [...CACHE_KEYS.calendarTasks, userId || "all"],
    async () => {
      let query = supabase.from("calendar_tasks").select("*");
      
      if (userId) {
        query = query.eq("user_id", userId);
      }
      
      const { data, error } = await query.order("task_date", { ascending: true });
      
      if (error) throw error;
      return data;
    },
    { enabled: !!userId }
  );
}

// Invalidate cache hook
export function useInvalidateCache() {
  const queryClient = useQueryClient();

  return {
    invalidate: (key: keyof typeof CACHE_KEYS) => {
      queryClient.invalidateQueries({ queryKey: CACHE_KEYS[key] });
    },
    invalidateAll: () => {
      Object.values(CACHE_KEYS).forEach((key) => {
        queryClient.invalidateQueries({ queryKey: key });
      });
    },
  };
}
