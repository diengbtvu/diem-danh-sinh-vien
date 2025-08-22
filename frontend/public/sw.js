const CACHE_NAME = 'attendance-v2.1.0';
const STATIC_CACHE = 'attendance-static-v2.1.0';
const DYNAMIC_CACHE = 'attendance-dynamic-v2.1.0';

// Files to cache immediately
const STATIC_FILES = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
];

// API endpoints to cache
const API_CACHE_PATTERNS = [
  '/api/sessions/config',
  '/api/students',
  '/api/sessions'
];

// Install event - cache static files
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('[SW] Caching static files');
        return cache.addAll(STATIC_FILES);
      })
      .then(() => {
        console.log('[SW] Static files cached successfully');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[SW] Failed to cache static files:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('[SW] Service worker activated');
        return self.clients.claim();
      })
  );
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Handle API requests (only for same origin, not external backend)
  if (url.pathname.startsWith('/api/') && url.origin === self.location.origin) {
    // Skip auth-protected endpoints to avoid interfering with credentials/headers
    if (url.pathname.startsWith('/api/admin/') || url.pathname.startsWith('/api/auth/')) {
      // Let the request go to network directly (no SW handling)
      return;
    }
    event.respondWith(handleApiRequest(request));
    return;
  }
  
  // Handle static files
  if (STATIC_FILES.some(file => url.pathname === file || url.pathname.endsWith(file))) {
    event.respondWith(handleStaticRequest(request));
    return;
  }
  
  // Handle navigation requests
  if (request.mode === 'navigate') {
    event.respondWith(handleNavigationRequest(request));
    return;
  }
  
  // Default: network first, cache fallback
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok) {
          const responseClone = response.clone();
          caches.open(DYNAMIC_CACHE)
            .then((cache) => cache.put(request, responseClone));
        }
        return response;
      })
      .catch(() => {
        return caches.match(request);
      })
  );
});

// Handle API requests - Network first, cache fallback
async function handleApiRequest(request) {
  const url = new URL(request.url);
  
  try {
    // Try network first
    const networkResponse = await fetch(request);
    
    // Cache successful responses for specific endpoints
    if (networkResponse.ok && API_CACHE_PATTERNS.some(pattern => url.pathname.includes(pattern))) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    // Always return the network response (even if not ok) so the page can handle status codes
    return networkResponse;
  } catch (error) {
    console.log('[SW] Network failed, trying cache for:', url.pathname);
    
    // Try cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline response for specific endpoints
    if (url.pathname.includes('/api/sessions/config')) {
      return new Response(JSON.stringify({
        qrBWindowSeconds: 30,
        qrRotateSeconds: 30,
        qrStepTolerance: 1,
        sessionTokenValidityHours: 24,
        maxImageSizeMB: 5,
        frontendUrlTemplate: "offline-mode"
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    throw error;
  }
}

// Handle static files - Cache first
async function handleStaticRequest(request) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.error('[SW] Failed to fetch static file:', request.url);
    throw error;
  }
}

// Handle navigation requests - Network first, fallback to index.html
async function handleNavigationRequest(request) {
  try {
    const networkResponse = await fetch(request);
    return networkResponse;
  } catch (error) {
    console.log('[SW] Navigation request failed, serving cached index.html');
    const cachedResponse = await caches.match('/index.html');
    return cachedResponse || new Response('Offline - Please check your connection', {
      status: 503,
      headers: { 'Content-Type': 'text/html' }
    });
  }
}

// Handle background sync for offline attendance submissions
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync triggered:', event.tag);
  
  if (event.tag === 'attendance-sync') {
    event.waitUntil(syncOfflineAttendances());
  }
});

// Sync offline attendance data when connection is restored
async function syncOfflineAttendances() {
  try {
    const cache = await caches.open(DYNAMIC_CACHE);
    const requests = await cache.keys();
    
    const offlineAttendances = requests.filter(req => 
      req.url.includes('/api/offline/queue-attendance')
    );
    
    for (const request of offlineAttendances) {
      try {
        const response = await cache.match(request);
        const data = await response.json();
        
        // Retry submission
        await fetch('/api/attendances', {
          method: 'POST',
          body: data.formData
        });
        
        // Remove from cache after successful sync
        await cache.delete(request);
        console.log('[SW] Synced offline attendance:', data.id);
      } catch (error) {
        console.error('[SW] Failed to sync attendance:', error);
      }
    }
  } catch (error) {
    console.error('[SW] Background sync failed:', error);
  }
}

// Handle push notifications (for future use)
self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received');
  
  const options = {
    body: event.data ? event.data.text() : 'Có thông báo mới từ hệ thống điểm danh',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'Xem chi tiết',
        icon: '/icons/checkmark.png'
      },
      {
        action: 'close',
        title: 'Đóng',
        icon: '/icons/xmark.png'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification('Hệ thống Điểm danh', options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event.action);
  
  event.notification.close();
  
  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

console.log('[SW] Service worker script loaded');
