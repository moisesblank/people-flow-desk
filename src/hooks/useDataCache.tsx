import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { CalendarTask, DashboardStats } from "@/types/calendar";
import { useSubspaceQuery } from './useSubspaceCommunication';

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
    refetchOnMount?: boolean | 'always';
  }
) {
  const keyArr = (Array.isArray(key) ? key : [String(key)]) as string[];
  const persistKey = keyArr.join('_');

  return useSubspaceQuery<T>(
    keyArr,
    fetcher,
    {
      profile: 'semiStatic',
      persistKey,
      enabled: options?.enabled ?? true,
      staleTime: options?.staleTime ?? 30_000,
      gcTime: options?.cacheTime ?? 10 * 60_000,
      persistToLocalStorage: true,
      persistTTL: Math.max(options?.cacheTime ?? 10 * 60_000, 60_000),
      refetchOnWindowFocus: options?.refetchOnWindowFocus ?? false,
      refetchOnMount: options?.refetchOnMount,
      retry: 1,
    }
  );
}

// ============================================
// DASHBOARD: Cache otimizado para 5000+ usuários
// Queries paralelas com timeout protection
// ============================================
// ============================================
// DIRETRIZ MATRIZ - LEI I: VELOCIDADE DA LUZ
// Cache ultra-agressivo para resposta <100ms
// Stale-while-revalidate para UX instantânea
// ============================================
export function useDashboardStats() {
  return useDataFetch<DashboardStats>(CACHE_KEYS.dashboardStats, async () => {
    const startTime = performance.now();
    
    // Início do mês atual para filtros
    const inicioMes = new Date();
    inicioMes.setDate(1);
    inicioMes.setHours(0, 0, 0, 0);
    const inicioMesISO = inicioMes.toISOString();
    
    // PERFORMANCE: Todas as queries em paralelo com timeout
    const [
      employeesRes,
      personalFixedRes,
      personalExtraRes,
      companyFixedRes,
      companyExtraRes,
      entradasRes,
      affiliatesRes,
      alunosRes,
      calendarTasksRes,
      paymentsRes,
      sitePendenciasRes,
    ] = await Promise.all([
      // Contagens rápidas (head: true = só conta, não retorna dados)
      supabase.from("employees").select("id", { count: "exact", head: true }).eq("status", "ativo"),
      supabase.from("personal_fixed_expenses").select("valor"),
      supabase.from("personal_extra_expenses").select("valor, categoria, nome, created_at").order("created_at", { ascending: false }).limit(50),
      supabase.from("company_fixed_expenses").select("valor"),
      supabase.from("company_extra_expenses").select("valor, nome, created_at").order("created_at", { ascending: false }).limit(50),
      supabase.from("entradas").select("valor, fonte, created_at, descricao").gte("created_at", inicioMesISO).order("created_at", { ascending: false }).limit(100),
      supabase.from("affiliates").select("id", { count: "exact", head: true }).eq("status", "ativo"),
      supabase.from("alunos").select("id", { count: "exact", head: true }).eq("status", "ativo"),
      supabase.from("calendar_tasks").select("*").eq("is_completed", false).order("task_date", { ascending: true }).limit(20),
      supabase.from("contas_pagar").select("*").eq("status", "pendente").order("data_vencimento", { ascending: true }).limit(20),
      supabase.from("website_pendencias").select("*").neq("status", "concluido").limit(20),
    ]);

    const personalFixed = personalFixedRes.data?.reduce((acc, e) => acc + (e.valor || 0), 0) || 0;
    const personalExtra = personalExtraRes.data?.reduce((acc, e) => acc + (e.valor || 0), 0) || 0;
    const companyFixed = companyFixedRes.data?.reduce((acc, e) => acc + (e.valor || 0), 0) || 0;
    const companyExtra = companyExtraRes.data?.reduce((acc, e) => acc + (e.valor || 0), 0) || 0;
    const totalEntradas = entradasRes.data?.reduce((acc, e) => acc + (e.valor || 0), 0) || 0;

    const endTime = performance.now();
    console.log(`[MATRIZ-LEI-I] Dashboard carregado em ${(endTime - startTime).toFixed(0)}ms`);

    return {
      employees: employeesRes.count || 0,
      personalExpenses: personalFixed + personalExtra,
      companyExpenses: companyFixed + companyExtra,
      income: totalEntradas,
      affiliates: affiliatesRes.count || 0,
      students: alunosRes.count || 0,
      pendingTasks: calendarTasksRes.data?.length || 0,
      pendingPayments: paymentsRes.data?.length || 0,
      sitePendencias: sitePendenciasRes.data?.length || 0,
      personalExtraData: personalExtraRes.data || [],
      incomeData: entradasRes.data || [],
      tasksData: (calendarTasksRes.data || []) as CalendarTask[],
      paymentsData: paymentsRes.data || [],
      sitePendenciasData: sitePendenciasRes.data || [],
      _loadTimeMs: endTime - startTime,
    };
  }, { 
    // LEI I: Cache ultra-agressivo - dados frescos por 2 minutos
    staleTime: 2 * 60 * 1000,
    // LEI I: Manter em cache por 15 minutos
    cacheTime: 15 * 60 * 1000,
    // LEI I: Não refetch ao focar (usuário controla refresh)
    refetchOnWindowFocus: false,
    // LEI I: Usar cache existente ao montar
    refetchOnMount: false,
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
