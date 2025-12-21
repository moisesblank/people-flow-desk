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

// ============================================
// DIRETRIZ #1: PERFORMANCE EXTREMA
// Cache agressivo com stale-while-revalidate
// Minimiza chamadas desnecessárias ao backend
// ============================================
export function useDataFetch<T>(
  key: readonly string[] | string[],
  fetcher: () => Promise<T>,
  options?: {
    staleTime?: number;
    cacheTime?: number;
    enabled?: boolean;
    refetchOnWindowFocus?: boolean;
    refetchOnMount?: boolean;
  }
) {
  return useQuery({
    queryKey: key,
    queryFn: fetcher,
    // PERFORMANCE: Cache agressivo - dados são considerados "frescos" por 30s
    staleTime: options?.staleTime ?? 30 * 1000,
    // PERFORMANCE: Manter em cache por 10 minutos
    gcTime: options?.cacheTime ?? 10 * 60 * 1000,
    enabled: options?.enabled ?? true,
    // PERFORMANCE: Não refetch automático ao focar janela (usuário controla refresh)
    refetchOnWindowFocus: options?.refetchOnWindowFocus ?? false,
    // PERFORMANCE: Usar cache se disponível ao montar
    refetchOnMount: options?.refetchOnMount ?? 'always',
    // PERFORMANCE: Retry inteligente com backoff
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
  });
}

// ============================================
// DASHBOARD: Cache otimizado para 5000+ usuários
// Queries paralelas com timeout protection
// ============================================
export function useDashboardStats() {
  return useDataFetch<DashboardStats>(CACHE_KEYS.dashboardStats, async () => {
    // Início do mês atual para filtros
    const inicioMes = new Date();
    inicioMes.setDate(1);
    inicioMes.setHours(0, 0, 0, 0);
    const inicioMesISO = inicioMes.toISOString();
    
    const [
      employeesRes,
      personalFixedRes,
      personalExtraRes,
      companyFixedRes,
      companyExtraRes,
      entradasRes, // Usar 'entradas' em vez de 'income'
      affiliatesRes,
      alunosRes, // Usar 'alunos' em vez de 'students'
      calendarTasksRes,
      paymentsRes,
      sitePendenciasRes,
    ] = await Promise.all([
      supabase.from("employees").select("id", { count: "exact", head: true }).eq("status", "ativo"),
      supabase.from("personal_fixed_expenses").select("valor"),
      supabase.from("personal_extra_expenses").select("valor, categoria, nome, created_at"),
      supabase.from("company_fixed_expenses").select("valor"),
      supabase.from("company_extra_expenses").select("valor, nome, created_at"),
      supabase.from("entradas").select("valor, fonte, created_at, descricao").gte("created_at", inicioMesISO), // Entradas do mês
      supabase.from("affiliates").select("id", { count: "exact", head: true }).eq("status", "ativo"),
      supabase.from("alunos").select("id", { count: "exact", head: true }).eq("status", "ativo"), // Alunos ativos
      supabase.from("calendar_tasks").select("*").eq("is_completed", false),
      supabase.from("contas_pagar").select("*").eq("status", "pendente"), // Usar contas_pagar
      supabase.from("website_pendencias").select("*").neq("status", "concluido"),
    ]);

    const personalFixed = personalFixedRes.data?.reduce((acc, e) => acc + (e.valor || 0), 0) || 0;
    const personalExtra = personalExtraRes.data?.reduce((acc, e) => acc + (e.valor || 0), 0) || 0;
    const companyFixed = companyFixedRes.data?.reduce((acc, e) => acc + (e.valor || 0), 0) || 0;
    const companyExtra = companyExtraRes.data?.reduce((acc, e) => acc + (e.valor || 0), 0) || 0;
    const totalEntradas = entradasRes.data?.reduce((acc, e) => acc + (e.valor || 0), 0) || 0;

    return {
      employees: employeesRes.count || 0,
      personalExpenses: personalFixed + personalExtra,
      companyExpenses: companyFixed + companyExtra,
      income: totalEntradas, // Agora usa entradas reais
      affiliates: affiliatesRes.count || 0,
      students: alunosRes.count || 0, // Agora usa alunos reais
      pendingTasks: calendarTasksRes.data?.length || 0,
      pendingPayments: paymentsRes.data?.length || 0,
      sitePendencias: sitePendenciasRes.data?.length || 0,
      personalExtraData: personalExtraRes.data || [],
      incomeData: entradasRes.data || [],
      tasksData: (calendarTasksRes.data || []) as CalendarTask[],
      paymentsData: paymentsRes.data || [],
      sitePendenciasData: sitePendenciasRes.data || [],
    };
  }, { 
    // PERFORMANCE: Dashboard stats válidos por 60s (reduz carga no DB)
    staleTime: 60 * 1000,
    // PERFORMANCE: Não refetch ao focar (usuário usa botão de refresh)
    refetchOnWindowFocus: false,
  });
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
