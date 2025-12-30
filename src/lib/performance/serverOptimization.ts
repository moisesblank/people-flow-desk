// ============================================
// ⚡ DOGMA VII: A RESSURREIÇÃO NO SERVIDOR ⚡
// ============================================
// O cliente é fraco e lento.
// O servidor é forte e rápido.
// Faça o trabalho pesado no servidor.

// ============================================
// STATIC GENERATION SIMULATION (SPA Context)
// ============================================

// In a Vite SPA, we simulate SSG/ISR with:
// 1. Service Worker caching for "static" pages
// 2. Edge Function pre-rendering for critical paths
// 3. Aggressive prefetching and caching

export interface StaticPageConfig {
  path: string;
  revalidate?: number; // seconds - 0 for SSG, >0 for ISR
  tags?: string[];
}

export const STATIC_PAGES: StaticPageConfig[] = [
  // SSG - Never change, generated at build
  { path: '/', revalidate: 0, tags: ['landing'] },
  { path: '/login', revalidate: 0, tags: ['auth'] },
  { path: '/404', revalidate: 0, tags: ['error'] },
  
  // ISR - Regenerate periodically
  { path: '/cursos', revalidate: 300, tags: ['courses'] }, // 5 min
  { path: '/blog', revalidate: 600, tags: ['blog'] }, // 10 min
];

export const DYNAMIC_PAGES = [
  '/dashboard',
  '/admin',
  '/perfil',
];

// ============================================
// SERVICE WORKER REGISTRATION
// ⚠️ DESABILITADO - Causava problemas de MIME type em produção
// Cache é gerenciado via CDN/Cloudflare + hash de arquivos
// ============================================

/**
 * @deprecated Service Worker desabilitado para evitar problemas de cache
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  console.warn('[DOGMA VII] ⚠️ Service Worker DESABILITADO - usando cache via CDN');
  
  // 🧹 CLEANUP: Remove qualquer SW existente
  if ('serviceWorker' in navigator) {
    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const registration of registrations) {
        await registration.unregister();
        console.log('[DOGMA VII] 🧹 Service Worker removido:', registration.scope);
      }
    } catch (error) {
      console.warn('[DOGMA VII] Erro ao remover SW:', error);
    }
  }
  
  return null;
}

// ============================================
// PRERENDER HINTS FOR NAVIGATION
// ============================================

export function prerenderPage(url: string): void {
  // Use Speculation Rules API if available (Chrome 109+)
  if ('HTMLScriptElement' in window) {
    const existing = document.querySelector('script[type="speculationrules"]');
    if (existing) {
      try {
        const rules = JSON.parse(existing.textContent || '{}');
        if (!rules.prerender?.some((r: any) => r.urls?.includes(url))) {
          rules.prerender = rules.prerender || [];
          rules.prerender.push({ urls: [url] });
          existing.textContent = JSON.stringify(rules);
        }
      } catch (e) {
        console.warn('[DOGMA VII] Failed to update speculation rules');
      }
    }
  }

  // Fallback: Prefetch link
  if (!document.querySelector(`link[rel="prefetch"][href="${url}"]`)) {
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = url;
    document.head.appendChild(link);
  }
}

// ============================================
// CRITICAL DATA PRELOADING
// ============================================

interface PreloadConfig {
  key: string;
  loader: () => Promise<unknown>;
  priority: 'critical' | 'high' | 'normal';
  cache?: boolean;
}

const preloadCache = new Map<string, unknown>();
const preloadPromises = new Map<string, Promise<unknown>>();

export async function preloadData(config: PreloadConfig): Promise<unknown> {
  const { key, loader, cache = true } = config;

  // Return cached data if available
  if (cache && preloadCache.has(key)) {
    return preloadCache.get(key);
  }

  // Return existing promise if in-flight
  if (preloadPromises.has(key)) {
    return preloadPromises.get(key);
  }

  // Create new preload
  const promise = loader()
    .then(data => {
      if (cache) preloadCache.set(key, data);
      return data;
    })
    .finally(() => {
      preloadPromises.delete(key);
    });

  preloadPromises.set(key, promise);
  return promise;
}

export function getPreloadedData<T>(key: string): T | undefined {
  return preloadCache.get(key) as T | undefined;
}

export function invalidatePreloadedData(key: string): void {
  preloadCache.delete(key);
}

// ============================================
// RENDER MODE DETECTION
// ============================================

export type RenderMode = 'ssg' | 'isr' | 'ssr' | 'csr';

export function detectOptimalRenderMode(path: string): RenderMode {
  // Check static pages
  const staticPage = STATIC_PAGES.find(p => p.path === path);
  if (staticPage) {
    return staticPage.revalidate === 0 ? 'ssg' : 'isr';
  }

  // Dynamic pages need SSR
  if (DYNAMIC_PAGES.some(p => path.startsWith(p))) {
    return 'ssr';
  }

  // Default to CSR
  return 'csr';
}

// ============================================
// HYDRATION OPTIMIZATION
// ============================================

export function deferHydration(callback: () => void): void {
  if ('requestIdleCallback' in window) {
    requestIdleCallback(callback, { timeout: 2000 });
  } else {
    setTimeout(callback, 100);
  }
}

export function prioritizeHydration(callback: () => void): void {
  if ('scheduler' in window && 'postTask' in (window as any).scheduler) {
    (window as any).scheduler.postTask(callback, { priority: 'user-blocking' });
  } else {
    queueMicrotask(callback);
  }
}

// ============================================
// STREAMING HTML SIMULATION
// ============================================

export function createStreamingContainer(containerId: string): {
  append: (html: string) => void;
  complete: () => void;
} {
  const container = document.getElementById(containerId);
  if (!container) {
    console.warn(`[DOGMA VII] Container ${containerId} not found`);
    return {
      append: () => {},
      complete: () => {},
    };
  }

  const fragment = document.createDocumentFragment();
  let isComplete = false;

  return {
    append: (html: string) => {
      if (isComplete) return;
      
      const temp = document.createElement('div');
      temp.innerHTML = html;
      while (temp.firstChild) {
        fragment.appendChild(temp.firstChild);
      }
      
      // Batch DOM updates
      requestAnimationFrame(() => {
        container.appendChild(fragment);
      });
    },
    complete: () => {
      isComplete = true;
      container.appendChild(fragment);
    },
  };
}

// ============================================
// EDGE CACHE HEADERS
// ============================================

export const EDGE_CACHE_CONFIG = {
  // Static assets - cache forever (versioned by hash)
  static: {
    'Cache-Control': 'public, max-age=31536000, immutable',
    'CDN-Cache-Control': 'public, max-age=31536000, immutable',
  },
  
  // ISR pages - stale-while-revalidate
  isr: (revalidate: number) => ({
    'Cache-Control': `public, s-maxage=${revalidate}, stale-while-revalidate=${revalidate * 2}`,
    'CDN-Cache-Control': `public, max-age=${revalidate}`,
  }),
  
  // Dynamic pages - no cache
  dynamic: {
    'Cache-Control': 'private, no-cache, no-store, must-revalidate',
    'CDN-Cache-Control': 'private, no-cache',
  },
  
  // API responses - short cache
  api: {
    'Cache-Control': 'private, max-age=60, stale-while-revalidate=300',
  },
};

// ============================================
// INIT
// ============================================

export function initServerOptimization(): void {
  // 🧹 Service Worker cleanup (não registra mais, apenas limpa)
  registerServiceWorker();

  // Add speculation rules for common navigation
  if (typeof document !== 'undefined') {
    const script = document.createElement('script');
    script.type = 'speculationrules';
    script.textContent = JSON.stringify({
      prerender: [
        {
          where: {
            href_matches: '/*',
            not: {
              href_matches: ['/api/*', '/admin/*', '/_*'],
            },
          },
          eagerness: 'moderate',
        },
      ],
      prefetch: [
        {
          where: {
            selector_matches: 'a[href^="/"]',
          },
          eagerness: 'conservative',
        },
      ],
    });
    document.head.appendChild(script);
  }

  console.log('[DOGMA VII] ⚡ Otimizações de servidor inicializadas (SW desabilitado)');
}

console.log('[DOGMA VII] ⚡ Módulo de ressurreição no servidor carregado');
