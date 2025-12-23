// ============================================
// ⚡ EVANGELHO DA VELOCIDADE v3500 ⚡
// DOGMA V: CACHE QUÂNTICO ABSOLUTO
// Performance ANO 3500 em dispositivo 3G
// ============================================

import { QueryClient } from "@tanstack/react-query";

/**
 * DOGMA V.3500 - Cache Estratificado por Conexão
 * Otimizado para funcionar FULL em 3G
 */
export const CACHE_CONFIG_3500 = {
  // 🔴 CONEXÃO 2G/3G - Cache agressivo
  slow: {
    staleTime: 10 * 60 * 1000,      // 10 minutos fresh (evita requests)
    gcTime: 60 * 60 * 1000,          // 1 hora em memória
    refetchOnWindowFocus: false,     // NUNCA refetch em focus
    refetchOnMount: false,           // NUNCA refetch em mount
    refetchOnReconnect: false,       // NUNCA refetch em reconnect
    retry: 1,                        // 1 retry apenas
    retryDelay: 5000,                // 5s delay (rede lenta)
  },
  
  // 🟡 CONEXÃO 4G - Cache balanceado
  medium: {
    staleTime: 2 * 60 * 1000,       // 2 minutos fresh
    gcTime: 15 * 60 * 1000,         // 15 minutos cache
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    retry: 2,
    retryDelay: 2000,
  },
  
  // 🟢 CONEXÃO WiFi/Fibra - Performance máxima
  fast: {
    staleTime: 30 * 1000,           // 30 segundos fresh
    gcTime: 10 * 60 * 1000,         // 10 minutos cache
    refetchOnWindowFocus: false,
    refetchOnMount: 'always' as const,
    refetchOnReconnect: true,
    retry: 2,
    retryDelay: 1000,
  },
} as const;

/**
 * Detecta velocidade de conexão
 */
export function detectConnectionSpeed(): 'slow' | 'medium' | 'fast' {
  if (typeof navigator === 'undefined') return 'medium';
  
  const connection = (navigator as any).connection;
  if (!connection) return 'medium';
  
  const effectiveType = connection.effectiveType;
  const saveData = connection.saveData;
  
  // Data saver = sempre slow
  if (saveData) return 'slow';
  
  // Mapeamento de tipo de conexão
  switch (effectiveType) {
    case 'slow-2g':
    case '2g':
    case '3g':
      return 'slow';
    case '4g':
      return connection.downlink < 5 ? 'medium' : 'fast';
    default:
      return 'fast';
  }
}

/**
 * DOGMA V.3500 - QueryClient Quântico
 * Adapta-se automaticamente à velocidade da conexão
 */
export function createSacredQueryClient(): QueryClient {
  const speed = detectConnectionSpeed();
  const config = CACHE_CONFIG_3500[speed];
  
  console.log(`[DOGMA V.3500] 🚀 Cache mode: ${speed.toUpperCase()}`);
  
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: config.staleTime,
        gcTime: config.gcTime,
        refetchOnWindowFocus: config.refetchOnWindowFocus,
        refetchOnMount: config.refetchOnMount,
        refetchOnReconnect: config.refetchOnReconnect,
        
        // 🔥 OTIMIZAÇÕES 3500
        networkMode: 'offlineFirst',  // Prioriza cache SEMPRE
        
        // Retry inteligente com backoff
        retry: config.retry,
        retryDelay: (attemptIndex) => 
          Math.min(config.retryDelay * (2 ** attemptIndex), 30000),
        
        // Placeholder enquanto carrega (evita loading flash)
        placeholderData: (previousData: any) => previousData,
        
        // Estrutura de erro otimizada
        throwOnError: false,
      },
      mutations: {
        retry: 1,
        retryDelay: config.retryDelay,
        networkMode: 'offlineFirst',
        onError: (error) => {
          console.error('[DOGMA V.3500] Mutation error:', error);
        },
      },
    },
  });
}

/**
 * DOGMA V.3500 - Configuração de Cache por Tipo de Dados
 */
export const CACHE_PROFILES = {
  // Dados que NUNCA mudam (cursos, estrutura)
  immutable: {
    staleTime: Infinity,
    gcTime: Infinity,
  },
  
  // Dados de configuração (10 minutos)
  config: {
    staleTime: 10 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
  },
  
  // Dados de dashboard (2-5 minutos dependendo da conexão)
  dashboard: {
    staleTime: 2 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
  },
  
  // Listas paginadas (30 segundos - 2 minutos)
  list: {
    staleTime: 30 * 1000,
    gcTime: 10 * 60 * 1000,
  },
  
  // Dados de usuário (1 minuto)
  user: {
    staleTime: 60 * 1000,
    gcTime: 10 * 60 * 1000,
  },
  
  // Dados em tempo real (sem cache)
  realtime: {
    staleTime: 0,
    gcTime: 0,
    refetchInterval: 5000,
  },
} as const;

/**
 * DOGMA V.3500 - Headers de Cache CDN
 */
export const CDN_CACHE_HEADERS_3500 = {
  // Assets estáticos com hash - IMUTÁVEL (1 ano)
  immutable: {
    'Cache-Control': 'public, max-age=31536000, immutable',
    'CDN-Cache-Control': 'public, max-age=31536000, immutable',
    'Vercel-CDN-Cache-Control': 'public, max-age=31536000, immutable',
  },
  
  // HTML - Stale-while-revalidate (1h cache, 24h stale)
  html: {
    'Cache-Control': 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400',
    'CDN-Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
  },
  
  // API Pública - 1 minuto com stale
  apiPublic: {
    'Cache-Control': 'public, max-age=60, s-maxage=300, stale-while-revalidate=600',
    'CDN-Cache-Control': 'public, max-age=300',
  },
  
  // API Privada - NO CACHE
  apiPrivate: {
    'Cache-Control': 'private, no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
  },
  
  // Imagens - 1 semana + stale
  images: {
    'Cache-Control': 'public, max-age=604800, stale-while-revalidate=2592000',
    'CDN-Cache-Control': 'public, max-age=604800',
  },
  
  // Fontes - 1 ano (nunca mudam)
  fonts: {
    'Cache-Control': 'public, max-age=31536000, immutable',
  },
} as const;

/**
 * DOGMA V.3500 - Chaves de Invalidação Inteligente
 */
export const INVALIDATION_KEYS = {
  students: ['alunos', 'students', 'dashboardStats'],
  financial: ['entradas', 'contas_pagar', 'comissoes', 'dashboardStats', 'contabilidade'],
  employees: ['employees', 'employees_safe', 'dashboardStats'],
  dashboard: ['dashboardStats', 'metricas'],
  affiliates: ['affiliates', 'comissoes', 'dashboardStats'],
  tasks: ['calendarTasks', 'calendar_tasks', 'dashboardStats'],
  hotmart: ['transacoes', 'transacoes_hotmart', 'alunos', 'entradas', 'dashboardStats'],
  all: ['*'], // Nuclear option
} as const;

/**
 * DOGMA V.3500 - Prefetch de Queries Críticas
 */
export async function prefetchCriticalQueries(queryClient: QueryClient): Promise<void> {
  const speed = detectConnectionSpeed();
  
  // Em conexão lenta, NÃO prefetch (economiza dados)
  if (speed === 'slow') {
    console.log('[DOGMA V.3500] ⏸️ Prefetch desabilitado (conexão lenta)');
    return;
  }
  
  const criticalQueries = [
    { key: ['dashboardStats'], profile: CACHE_PROFILES.dashboard },
    { key: ['profiles', 'current'], profile: CACHE_PROFILES.user },
  ];

  await Promise.allSettled(
    criticalQueries.map(({ key, profile }) => 
      queryClient.prefetchQuery({
        queryKey: key,
        staleTime: profile.staleTime,
      })
    )
  );
  
  console.log('[DOGMA V.3500] ✅ Queries críticas prefetched');
}

/**
 * DOGMA V.3500 - Limpeza Automática de Cache
 */
export function setupCacheCleanup(queryClient: QueryClient): () => void {
  const speed = detectConnectionSpeed();
  
  // Em conexão lenta, limpeza menos frequente (mantém cache)
  const cleanupInterval = speed === 'slow' ? 30 * 60 * 1000 : 5 * 60 * 1000;
  const maxAge = speed === 'slow' ? 60 * 60 * 1000 : 30 * 60 * 1000;
  
  const interval = setInterval(() => {
    const now = Date.now();
    let cleaned = 0;
    
    queryClient.getQueryCache().findAll().forEach(query => {
      if (query.state.dataUpdatedAt < now - maxAge) {
        queryClient.removeQueries({ queryKey: query.queryKey });
        cleaned++;
      }
    });
    
    if (cleaned > 0) {
      console.log(`[DOGMA V.3500] 🧹 ${cleaned} queries removidas do cache`);
    }
  }, cleanupInterval);

  return () => clearInterval(interval);
}

/**
 * DOGMA V.3500 - LocalStorage Cache Layer
 * Persiste dados críticos para acesso offline/3G
 */
export const persistentCache = {
  set: <T>(key: string, data: T, ttlMs: number = 30 * 60 * 1000) => {
    try {
      const item = {
        data,
        expiry: Date.now() + ttlMs,
        version: '3500',
      };
      localStorage.setItem(`cache_${key}`, JSON.stringify(item));
    } catch (e) {
      console.warn('[DOGMA V.3500] LocalStorage cheio, limpando...');
      // Limpa itens expirados
      Object.keys(localStorage)
        .filter(k => k.startsWith('cache_'))
        .forEach(k => {
          try {
            const item = JSON.parse(localStorage.getItem(k) || '{}');
            if (item.expiry && item.expiry < Date.now()) {
              localStorage.removeItem(k);
            }
          } catch {}
        });
    }
  },
  
  get: <T>(key: string): T | null => {
    try {
      const item = localStorage.getItem(`cache_${key}`);
      if (!item) return null;
      
      const parsed = JSON.parse(item);
      if (parsed.expiry < Date.now()) {
        localStorage.removeItem(`cache_${key}`);
        return null;
      }
      
      return parsed.data as T;
    } catch {
      return null;
    }
  },
  
  remove: (key: string) => {
    localStorage.removeItem(`cache_${key}`);
  },
  
  clear: () => {
    Object.keys(localStorage)
      .filter(k => k.startsWith('cache_'))
      .forEach(k => localStorage.removeItem(k));
  },
};

console.log('[DOGMA V.3500] ⚡ Cache Quântico inicializado');
