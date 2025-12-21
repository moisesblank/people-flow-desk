// ============================================
// ⚡ EVANGELHO DA VELOCIDADE v2.0 ⚡
// DOGMA V: A ONIPRESENÇA DO CACHE
// Configuração ultra-otimizada do TanStack Query
// ============================================

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode } from "react";

/**
 * DOGMA V.2 - Configuração de Cache do TanStack Query
 * 
 * staleTime: Quanto tempo dados são considerados "frescos"
 * gcTime: Quanto tempo dados ficam em memória após não serem usados
 */
export const CACHE_CONFIG = {
  // Dados que mudam frequentemente (1 minuto fresh, 5 minutos cache)
  realtime: {
    staleTime: 1 * 60 * 1000,      // 1 minuto
    gcTime: 5 * 60 * 1000,         // 5 minutos
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  },
  
  // Dados de dashboard (2 minutos fresh, 15 minutos cache)
  dashboard: {
    staleTime: 2 * 60 * 1000,      // 2 minutos
    gcTime: 15 * 60 * 1000,        // 15 minutos
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  },
  
  // Dados de listagem (30 segundos fresh, 10 minutos cache)
  list: {
    staleTime: 30 * 1000,          // 30 segundos
    gcTime: 10 * 60 * 1000,        // 10 minutos
    refetchOnWindowFocus: false,
    refetchOnMount: 'always' as const,
  },
  
  // Dados estáticos (5 minutos fresh, 30 minutos cache)
  static: {
    staleTime: 5 * 60 * 1000,      // 5 minutos
    gcTime: 30 * 60 * 1000,        // 30 minutos
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  },
  
  // Dados de usuário (1 minuto fresh, 10 minutos cache)
  user: {
    staleTime: 1 * 60 * 1000,      // 1 minuto
    gcTime: 10 * 60 * 1000,        // 10 minutos
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  },
  
  // Dados de configuração (10 minutos fresh, 1 hora cache)
  config: {
    staleTime: 10 * 60 * 1000,     // 10 minutos
    gcTime: 60 * 60 * 1000,        // 1 hora
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  },
} as const;

/**
 * DOGMA V.2 - QueryClient otimizado
 */
export function createSacredQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Default: Dados frescos por 30 segundos
        staleTime: 30 * 1000,
        // Default: Cache por 10 minutos
        gcTime: 10 * 60 * 1000,
        // Retry inteligente com backoff exponencial
        retry: 2,
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
        // Refetch on focus para dados críticos
        refetchOnWindowFocus: false,
        // Usar cache ao montar
        refetchOnMount: 'always',
        // Não refetch em reconexão (usuário pode estar em 3G)
        refetchOnReconnect: false,
        // Network mode para otimizar requests
        networkMode: 'offlineFirst',
      },
      mutations: {
        // Retry mutations com backoff
        retry: 1,
        retryDelay: 1000,
        // Log de erros
        onError: (error) => {
          console.error('[DOGMA V] Mutation error:', error);
        },
      },
    },
  });
}

/**
 * DOGMA V.1 - Headers de Cache para CDN
 * Usar em Edge Functions para assets
 */
export const CDN_CACHE_HEADERS = {
  // Assets estáticos (imagens, fontes) - 1 ano
  static: {
    'Cache-Control': 'public, max-age=31536000, s-maxage=31536000, immutable',
    'CDN-Cache-Control': 'public, max-age=31536000',
    'Vercel-CDN-Cache-Control': 'public, max-age=31536000',
  },
  
  // CSS e JS com hash - 1 ano
  hashedAssets: {
    'Cache-Control': 'public, max-age=31536000, s-maxage=31536000, immutable',
    'CDN-Cache-Control': 'public, max-age=31536000',
  },
  
  // HTML - revalidar sempre
  html: {
    'Cache-Control': 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400',
    'CDN-Cache-Control': 'public, max-age=3600',
  },
  
  // API pública - 1 minuto
  api: {
    'Cache-Control': 'public, max-age=60, s-maxage=60, stale-while-revalidate=300',
    'CDN-Cache-Control': 'public, max-age=60',
  },
  
  // API privada - não cachear
  privateApi: {
    'Cache-Control': 'private, no-cache, no-store, must-revalidate',
    'CDN-Cache-Control': 'private, no-cache',
  },
  
  // Imagens dinâmicas - 1 hora
  dynamicImages: {
    'Cache-Control': 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400',
    'CDN-Cache-Control': 'public, max-age=86400',
  },
} as const;

/**
 * Utilitário para aplicar headers de cache
 */
export function applyCacheHeaders(
  type: keyof typeof CDN_CACHE_HEADERS
): Record<string, string> {
  return CDN_CACHE_HEADERS[type];
}

/**
 * DOGMA V.2 - Hook para invalidação inteligente de cache
 */
export const INVALIDATION_KEYS = {
  // Invalidar tudo relacionado a alunos
  students: ['alunos', 'students', 'dashboardStats'],
  // Invalidar tudo relacionado a finanças
  financial: ['entradas', 'contas_pagar', 'comissoes', 'dashboardStats', 'contabilidade'],
  // Invalidar tudo relacionado a funcionários
  employees: ['employees', 'employees_safe', 'dashboardStats'],
  // Invalidar dashboard
  dashboard: ['dashboardStats', 'metricas'],
  // Invalidar afiliados
  affiliates: ['affiliates', 'comissoes', 'dashboardStats'],
  // Invalidar tarefas
  tasks: ['calendarTasks', 'calendar_tasks', 'dashboardStats'],
  // Invalidar transações Hotmart
  hotmart: ['transacoes', 'transacoes_hotmart', 'alunos', 'entradas', 'dashboardStats'],
} as const;

/**
 * Prefetch de queries críticas
 */
export async function prefetchCriticalQueries(queryClient: QueryClient): Promise<void> {
  // Lista de queries a serem pré-carregadas
  const criticalQueries = [
    ['dashboardStats'],
    ['profiles', 'current'],
  ];

  await Promise.allSettled(
    criticalQueries.map(queryKey => 
      queryClient.prefetchQuery({
        queryKey,
        staleTime: CACHE_CONFIG.dashboard.staleTime,
      })
    )
  );
}

/**
 * Limpar cache antigo periodicamente
 */
export function setupCacheCleanup(queryClient: QueryClient): () => void {
  const interval = setInterval(() => {
    // Remover queries não usadas há mais de 30 minutos
    queryClient.getQueryCache().findAll().forEach(query => {
      if (query.state.dataUpdatedAt < Date.now() - 30 * 60 * 1000) {
        queryClient.removeQueries({ queryKey: query.queryKey });
      }
    });
  }, 5 * 60 * 1000); // A cada 5 minutos

  return () => clearInterval(interval);
}
