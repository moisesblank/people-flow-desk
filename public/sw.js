// ============================================
// MASTER PRO ULTRA v3.0 - SERVICE WORKER
// Cache inteligente + Offline + Push
// ============================================

const CACHE_VERSION = 'v1.0.0';
const STATIC_CACHE = `static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `dynamic-${CACHE_VERSION}`;
const API_CACHE = `api-${CACHE_VERSION}`;

// Assets para cache estático
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
  '/offline.html'
];

// Instalar
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Ativar
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys
          .filter(key => !key.includes(CACHE_VERSION))
          .map(key => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

// Fetch
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignorar WebSocket, extensões e chrome-extension
  if (url.protocol === 'ws:' || url.protocol === 'wss:') return;
  if (url.protocol === 'chrome-extension:') return;
  if (url.pathname.includes('extension')) return;

  // API: Network first, fallback to cache
  if (url.pathname.startsWith('/api/') || url.hostname.includes('supabase')) {
    event.respondWith(
      fetch(request)
        .then(response => {
          // Cache apenas GET bem-sucedidos
          if (request.method === 'GET' && response.ok) {
            const clone = response.clone();
            caches.open(API_CACHE).then(cache => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // Assets estáticos: Cache first
  if (request.destination === 'image' ||
      request.destination === 'script' ||
      request.destination === 'style' ||
      request.destination === 'font') {
    event.respondWith(
      caches.match(request)
        .then(cached => {
          if (cached) return cached;

          return fetch(request).then(response => {
            if (response.ok) {
              const clone = response.clone();
              caches.open(DYNAMIC_CACHE).then(cache => cache.put(request, clone));
            }
            return response;
          });
        })
    );
    return;
  }

  // HTML: Network first, fallback to cache, then offline page
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then(response => {
          const clone = response.clone();
          caches.open(DYNAMIC_CACHE).then(cache => cache.put(request, clone));
          return response;
        })
        .catch(() => caches.match(request).then(cached => cached || caches.match('/offline.html')))
    );
    return;
  }
});

// Push notifications
self.addEventListener('push', (event) => {
  const data = event.data?.json() || {};

  event.waitUntil(
    self.registration.showNotification(data.title || 'Gestão MM', {
      body: data.body,
      icon: '/icon-192.png',
      badge: '/favicon.ico',
      vibrate: [100, 50, 100],
      data: { url: data.url || '/' },
      actions: [
        { action: 'open', title: 'Abrir' },
        { action: 'close', title: 'Fechar' }
      ]
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action !== 'close') {
    event.waitUntil(self.clients.openWindow(event.notification.data.url));
  }
});
