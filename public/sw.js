// ============================================
// ⚡ DOGMA VII v3500: SERVICE WORKER QUÂNTICO ⚡
// Cache inteligente + Offline + Performance 3G
// Performance ANO 3500 em qualquer dispositivo
// ============================================

const CACHE_VERSION = 'v3500.1';
const STATIC_CACHE = `static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `dynamic-${CACHE_VERSION}`;
const API_CACHE = `api-${CACHE_VERSION}`;
const IMAGE_CACHE = `images-${CACHE_VERSION}`;
const FONT_CACHE = `fonts-${CACHE_VERSION}`;

// Assets críticos para offline
const CRITICAL_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
];

// Padrões de URL para cada cache
const CACHE_PATTERNS = {
  api: /supabase\.co|\/api\//,
  images: /\.(png|jpg|jpeg|gif|webp|avif|svg|ico)(\?|$)/i,
  fonts: /\.(woff2?|ttf|otf|eot)(\?|$)|fonts\.(googleapis|gstatic)\.com|fontshare\.com/i,
  scripts: /\.(js|mjs)(\?|$)/i,
  styles: /\.css(\?|$)/i,
};

// INSTALL - Cache crítico
self.addEventListener('install', (event) => {
  console.log('[SW v3500] ⚡ Instalando Service Worker Quântico...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => {
        console.log('[SW v3500] 📦 Cacheando assets críticos...');
        return cache.addAll(CRITICAL_ASSETS);
      })
      .then(() => self.skipWaiting())
      .catch(err => console.error('[SW v3500] ❌ Erro no install:', err))
  );
});

// ACTIVATE - Limpar caches antigos
self.addEventListener('activate', (event) => {
  console.log('[SW v3500] ⚡ Ativando Service Worker Quântico...');
  
  event.waitUntil(
    caches.keys()
      .then(keys => {
        const oldCaches = keys.filter(key => !key.includes(CACHE_VERSION));
        console.log(`[SW v3500] 🧹 Removendo ${oldCaches.length} caches antigos`);
        return Promise.all(oldCaches.map(key => caches.delete(key)));
      })
      .then(() => self.clients.claim())
  );
});

// FETCH - Estratégias otimizadas para 3G
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Ignorar requests não-GET e protocolos especiais
  if (request.method !== 'GET') return;
  if (url.protocol === 'ws:' || url.protocol === 'wss:') return;
  if (url.protocol === 'chrome-extension:') return;
  if (url.hostname === 'localhost') return;

  // 🔥 ESTRATÉGIA 1: FONTES - Cache Forever (Imutável)
  if (CACHE_PATTERNS.fonts.test(url.href)) {
    event.respondWith(cacheFirst(request, FONT_CACHE, { maxAge: 31536000 }));
    return;
  }

  // 🔥 ESTRATÉGIA 2: IMAGENS - Stale While Revalidate
  if (CACHE_PATTERNS.images.test(url.href) || request.destination === 'image') {
    event.respondWith(staleWhileRevalidate(request, IMAGE_CACHE));
    return;
  }

  // 🔥 ESTRATÉGIA 3: SCRIPTS/STYLES com hash - Cache Forever
  if ((CACHE_PATTERNS.scripts.test(url.href) || CACHE_PATTERNS.styles.test(url.href)) && 
      (url.href.includes('-') && /[a-f0-9]{8}/i.test(url.href))) {
    event.respondWith(cacheFirst(request, STATIC_CACHE, { maxAge: 31536000 }));
    return;
  }

  // 🔥 ESTRATÉGIA 4: SCRIPTS/STYLES sem hash - Stale While Revalidate
  if (CACHE_PATTERNS.scripts.test(url.href) || CACHE_PATTERNS.styles.test(url.href) ||
      request.destination === 'script' || request.destination === 'style') {
    event.respondWith(staleWhileRevalidate(request, DYNAMIC_CACHE));
    return;
  }

  // 🔥 ESTRATÉGIA 5: API Supabase - Network First com Cache Fallback (5min TTL)
  if (CACHE_PATTERNS.api.test(url.href)) {
    event.respondWith(networkFirstWithCache(request, API_CACHE, { maxAge: 300 }));
    return;
  }

  // 🔥 ESTRATÉGIA 6: HTML/Navegação - Network First
  if (request.mode === 'navigate' || request.destination === 'document') {
    event.respondWith(networkFirstWithFallback(request, DYNAMIC_CACHE));
    return;
  }

  // 🔥 DEFAULT: Stale While Revalidate
  event.respondWith(staleWhileRevalidate(request, DYNAMIC_CACHE));
});

// ============================================
// ESTRATÉGIAS DE CACHE v3500
// ============================================

/**
 * Cache First - Busca no cache, fallback para network
 * Ideal para: assets imutáveis (fontes, scripts com hash)
 */
async function cacheFirst(request, cacheName, options = {}) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  
  if (cached) {
    // Verificar idade do cache
    const dateHeader = cached.headers.get('date');
    if (dateHeader && options.maxAge) {
      const age = (Date.now() - new Date(dateHeader).getTime()) / 1000;
      if (age < options.maxAge) {
        return cached;
      }
    } else {
      return cached;
    }
  }
  
  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    // Se falhar e tiver cache expirado, usa mesmo assim
    if (cached) return cached;
    throw error;
  }
}

/**
 * Stale While Revalidate - Retorna cache imediatamente, atualiza em background
 * Ideal para: imagens, scripts sem hash
 */
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  
  // Atualiza em background (não bloqueia)
  const fetchPromise = fetch(request)
    .then(response => {
      if (response.ok) {
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => cached);
  
  // Retorna cache imediatamente se existir
  return cached || fetchPromise;
}

/**
 * Network First com Cache - Tenta rede, fallback para cache
 * Ideal para: APIs que precisam de dados frescos
 */
async function networkFirstWithCache(request, cacheName, options = {}) {
  const cache = await caches.open(cacheName);
  
  try {
    const response = await fetch(request);
    
    if (response.ok) {
      // Clonar e adicionar timestamp para TTL
      const headers = new Headers(response.headers);
      headers.set('sw-cached-at', Date.now().toString());
      
      const cachedResponse = new Response(await response.clone().blob(), {
        status: response.status,
        statusText: response.statusText,
        headers,
      });
      
      cache.put(request, cachedResponse);
    }
    
    return response;
  } catch (error) {
    const cached = await cache.match(request);
    
    if (cached) {
      // Verificar TTL
      const cachedAt = cached.headers.get('sw-cached-at');
      if (cachedAt && options.maxAge) {
        const age = (Date.now() - parseInt(cachedAt)) / 1000;
        if (age > options.maxAge) {
          console.log('[SW v3500] ⚠️ Cache expirado, mas usando como fallback');
        }
      }
      return cached;
    }
    
    throw error;
  }
}

/**
 * Network First com Fallback para HTML offline
 * Ideal para: navegação
 */
async function networkFirstWithFallback(request, cacheName) {
  const cache = await caches.open(cacheName);
  
  try {
    const response = await fetch(request);
    
    if (response.ok) {
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    const cached = await cache.match(request);
    
    if (cached) {
      return cached;
    }
    
    // Fallback para página offline
    const offlinePage = await cache.match('/index.html');
    if (offlinePage) {
      return offlinePage;
    }
    
    // Última opção: erro genérico
    return new Response('Offline', { 
      status: 503, 
      statusText: 'Service Unavailable',
      headers: { 'Content-Type': 'text/plain' }
    });
  }
}

// ============================================
// FEATURES AVANÇADAS v3500
// ============================================

// Limpar caches antigos periodicamente
self.addEventListener('message', (event) => {
  if (event.data === 'CLEAR_OLD_CACHES') {
    caches.keys().then(keys => {
      keys.filter(k => !k.includes(CACHE_VERSION)).forEach(k => caches.delete(k));
    });
  }
  
  if (event.data === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data === 'GET_CACHE_SIZE') {
    getCacheSize().then(size => {
      event.source.postMessage({ type: 'CACHE_SIZE', size });
    });
  }
});

// Calcular tamanho do cache
async function getCacheSize() {
  const cacheNames = await caches.keys();
  let totalSize = 0;
  
  for (const name of cacheNames) {
    const cache = await caches.open(name);
    const keys = await cache.keys();
    
    for (const request of keys) {
      const response = await cache.match(request);
      if (response) {
        const blob = await response.clone().blob();
        totalSize += blob.size;
      }
    }
  }
  
  return totalSize;
}

// Push notifications
self.addEventListener('push', (event) => {
  const data = event.data?.json() || {};
  
  event.waitUntil(
    self.registration.showNotification(data.title || 'Prof. Moisés Medeiros', {
      body: data.body || 'Nova notificação',
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      vibrate: [200, 100, 200],
      tag: data.tag || 'default',
      data: { url: data.url || '/' },
      actions: data.actions || [],
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  const url = event.notification.data?.url || '/';
  
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(clients => {
        // Tenta focar janela existente
        for (const client of clients) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            client.navigate(url);
            return client.focus();
          }
        }
        // Abre nova janela
        return self.clients.openWindow(url);
      })
  );
});

// Background Sync para operações offline
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-data') {
    event.waitUntil(syncOfflineData());
  }
});

async function syncOfflineData() {
  // Implementar sincronização de dados offline
  console.log('[SW v3500] 🔄 Sincronizando dados offline...');
}

console.log('[SW v3500] ⚡ Service Worker Quântico carregado - Performance 3500');
