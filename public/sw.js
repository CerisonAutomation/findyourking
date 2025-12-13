// Service Worker for FyKing Men - Offline Support
const CACHE_NAME = 'fyking-men-v1';
const STATIC_CACHE = 'fyking-static-v1';
const DYNAMIC_CACHE = 'fyking-dynamic-v1';

// Assets to cache immediately
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/favicon.ico',
  '/icon-192.png',
  '/icon-512.png',
  // Add other static assets
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing');
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('Service Worker: Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
            console.log('Service Worker: Deleting old cache', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - serve from cache or network
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip Supabase API calls (handled by IndexedDB)
  if (url.hostname.includes('supabase')) return;

  // Skip external resources
  if (!url.hostname.includes(self.location.hostname)) return;

  event.respondWith(
    caches.match(request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }

        return fetch(request)
          .then((response) => {
            // Don't cache non-successful responses
            if (!response.ok) return response;

            // Clone the response for caching
            const responseClone = response.clone();

            caches.open(DYNAMIC_CACHE)
              .then((cache) => {
                cache.put(request, responseClone);
              });

            return response;
          })
          .catch(() => {
            // Return offline fallback for navigation requests
            if (request.mode === 'navigate') {
              return caches.match('/');
            }
          });
      })
  );
});

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('Service Worker: Background sync', event.tag);

  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

// Push notifications
self.addEventListener('push', (event) => {
  console.log('Service Worker: Push received', event);

  if (!event.data) return;

  const data = event.data.json();

  const options = {
    body: data.body,
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/',
    },
    actions: [
      {
        action: 'view',
        title: 'View',
      },
      {
        action: 'dismiss',
        title: 'Dismiss',
      },
    ],
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  console.log('Service Worker: Notification click', event);

  event.notification.close();

  if (event.action === 'dismiss') return;

  const url = event.notification.data?.url || '/';

  event.waitUntil(
    clients.openWindow(url)
  );
});

// Background sync implementation
async function doBackgroundSync() {
  try {
    // Import IndexedDB utilities
    const { offlineStorage } = await import('./lib/indexeddb.js');

    // Get sync queue
    const syncQueue = await offlineStorage.getSyncQueue();

    for (const operation of syncQueue) {
      try {
        // Process sync operation
        await processSyncOperation(operation);

        // Remove from queue
        await offlineStorage.removeFromSyncQueue(operation.id);
      } catch (error) {
        console.error('Background sync failed:', error);

        // Increment retry count
        operation.retries = (operation.retries || 0) + 1;

        if (operation.retries >= 3) {
          // Remove after max retries
          await offlineStorage.removeFromSyncQueue(operation.id);
        }
      }
    }
  } catch (error) {
    console.error('Background sync error:', error);
  }
}

// Process individual sync operations
async function processSyncOperation(operation) {
  // This would integrate with your API endpoints
  // For now, just log the operation
  console.log('Processing sync operation:', operation);

  switch (operation.type) {
    case 'save_message':
      // Call API to save message
      break;
    case 'add_favorite':
      // Call API to add favorite
      break;
    case 'remove_favorite':
      // Call API to remove favorite
      break;
    default:
      console.warn('Unknown sync operation:', operation.type);
  }
}