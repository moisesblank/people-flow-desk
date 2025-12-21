// ============================================
// ⚡ DOGMA VII: SERVICE WORKER SAGRADO ⚡
// Cache inteligente + Offline + Performance
// ============================================

const CACHE_VERSION = 'v2.0.0';
const STATIC_CACHE = `static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `dynamic-${CACHE_VERSION}`;
const API_CACHE = `api-${CACHE_VERSION}`;
const IMAGE_CACHE = `images-${CACHE_VERSION}`;

const STATIC_ASSETS = ['/', '/index.html', '/manifest.json', '/favicon.ico'];

// INSTALL
self.addEventListener('install', (event) => {
  console.log('[SW] ⚡ Installing DOGMA VII...');
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// ACTIVATE
self.addEventListener('activate', (event) => {
  console.log('[SW] ⚡ Activating DOGMA VII...');
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(key => !key.includes(CACHE_VERSION)).map(key => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

// FETCH - Estratégias otimizadas
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  if (url.protocol === 'ws:' || url.protocol === 'wss:' || url.protocol === 'chrome-extension:') return;
  if (request.method !== 'GET') return;

  // API: Network first com cache fallback
  if (url.hostname.includes('supabase') || url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request).then(response => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(API_CACHE).then(cache => cache.put(request, clone));
        }
        return response;
      }).catch(() => caches.match(request))
    );
    return;
  }

  // Imagens: Stale-while-revalidate
  if (request.destination === 'image') {
    event.respondWith(
      caches.match(request).then(cached => {
        const fetchPromise = fetch(request).then(response => {
          if (response.ok) caches.open(IMAGE_CACHE).then(cache => cache.put(request, response.clone()));
          return response;
        }).catch(() => cached);
        return cached || fetchPromise;
      })
    );
    return;
  }

  // Assets estáticos: Cache first
  if (['script', 'style', 'font'].includes(request.destination)) {
    event.respondWith(
      caches.match(request).then(cached => cached || fetch(request).then(response => {
        if (response.ok) caches.open(DYNAMIC_CACHE).then(cache => cache.put(request, response.clone()));
        return response;
      }))
    );
    return;
  }

  // HTML: Network first
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).then(response => {
        caches.open(DYNAMIC_CACHE).then(cache => cache.put(request, response.clone()));
        return response;
      }).catch(() => caches.match(request))
    );
  }
});

// Push notifications
self.addEventListener('push', (event) => {
  const data = event.data?.json() || {};
  event.waitUntil(
    self.registration.showNotification(data.title || 'Gestão MM', {
      body: data.body, icon: '/favicon.ico', badge: '/favicon.ico',
      data: { url: data.url || '/' }
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(self.clients.openWindow(event.notification.data.url));
});

console.log('[SW] ⚡ DOGMA VII Service Worker carregado');
