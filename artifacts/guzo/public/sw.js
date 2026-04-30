const CACHE_NAME = 'guzo-v1';
const STATIC_CACHE = [
  '/',
  '/offline.html',
  '/manifest.json',
];

const DYNAMIC_CACHE_PREFIX = 'guzo-dynamic-';
const MAX_AGE = 24 * 60 * 60 * 1000; // 24 hours

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_CACHE);
    })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName.startsWith(DYNAMIC_CACHE_PREFIX)) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - network first with cache fallback
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip API requests (they should go to network)
  if (url.pathname.startsWith('/api')) return;

  // Skip external resources
  if (url.origin !== self.location.origin) return;

  event.respondWith(handleRequest(request));
});

async function handleRequest(request) {
  const url = new URL(request.url);
  const cacheKey = `${DYNAMIC_CACHE_PREFIX}${url.pathname}`;

  try {
    // Try network first
    const networkResponse = await fetch(request);

    // Cache successful responses
    if (networkResponse.ok) {
      const cache = await caches.open(cacheKey);
      const clonedResponse = networkResponse.clone();
      await cache.put(request, clonedResponse);
    }

    return networkResponse;
  } catch (error) {
    // Network failed, try cache
    const cachedResponse = await caches.match(request);

    if (cachedResponse) {
      return cachedResponse;
    }

    // If no cache, return offline page for navigation requests
    if (request.mode === 'navigate') {
      return caches.match('/offline.html') || new Response('Offline', { status: 503 });
    }

    throw error;
  }
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-mutations') {
    event.waitUntil(syncMutations());
  }
});

async function syncMutations() {
  // Implement sync logic for offline mutations
  // This would read from IndexedDB and replay mutations
  const mutations = await getPendingMutations();
  
  for (const mutation of mutations) {
    try {
      await fetch(mutation.url, {
        method: mutation.method,
        headers: mutation.headers,
        body: mutation.body,
      });
      await removeMutation(mutation.id);
    } catch (error) {
      console.error('Failed to sync mutation:', error);
    }
  }
}

async function getPendingMutations() {
  // Get mutations from IndexedDB
  return [];
}

async function removeMutation(id) {
  // Remove mutation from IndexedDB
}

// Push notifications
self.addEventListener('push', (event) => {
  const options = {
    body: event.data?.text() || 'New notification',
    icon: '/icon-192.png',
    badge: '/badge-72.png',
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1,
    },
  };

  event.waitUntil(
    self.registration.showNotification('Guzo', options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow('/')
  );
});
