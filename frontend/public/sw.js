const CACHE_NAME = 'orbit-cache-v1.1';

// Install Event: Auto-download and skip waiting
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

// Activate Event: Claim clients and clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    clients.claim().then(() => {
      return caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log('[SW] Clearing old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      });
    })
  );
});

// Fetch Event: Intelligent Caching Strategy
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // 1. NEVER cache Real-Time data, API calls, or WebSockets
  if (
    url.pathname.startsWith('/api') || 
    url.pathname.startsWith('/socket.io') ||
    url.hostname !== self.location.hostname ||
    event.request.method !== 'GET'
  ) {
    return; // Bypass Service Worker entirely
  }

  // 2. HTML -> Network First (Ensures new deployments are detected)
  if (event.request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          const resClone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, resClone));
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // 3. JS Bundles & CSS -> Stale While Revalidate (Fast load + background update)
  if (
    event.request.destination === 'script' ||
    event.request.destination === 'style' ||
    url.pathname.endsWith('.js') ||
    url.pathname.endsWith('.css')
  ) {
    event.respondWith(
      caches.match(event.request).then(cachedResponse => {
        const fetchPromise = fetch(event.request).then(networkResponse => {
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, networkResponse.clone()));
          return networkResponse;
        }).catch(() => { /* Silent network failure */ });
        return cachedResponse || fetchPromise;
      })
    );
    return;
  }

  // 4. Static Assets (Images, Audio, Icons) -> Cache First, Network Fallback
  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      if (cachedResponse) return cachedResponse;
      return fetch(event.request).then(networkResponse => {
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, networkResponse.clone()));
        return networkResponse;
      }).catch(() => { /* Silent failure */ });
    })
  );
});

// Push Notifications
self.addEventListener('push', async function(event) {
  if (event.data) {
    try {
      const data = event.data.json();
      
      const isCallEnded = data.type === 'call_ended';
      const isMissedCall = data.type === 'missed_call';
      
      // If the push is to cancel an existing ringing notification
      if (isCallEnded || isMissedCall) {
        const notifications = await self.registration.getNotifications();
        const callId = data.data?.callId;
        
        // Find and close any existing ringing notifications for this call
        for (const notification of notifications) {
          if (notification.data && notification.data.callId === callId && notification.data.type === 'incoming_call') {
            notification.close();
          }
        }
        
        // If it's just a silent cancel, don't show anything new
        if (isCallEnded) return;
        
        // Otherwise, show the missed call notification
      }

      const isCall = data.data && data.data.type === 'incoming_call';

      const options = {
        body: data.body || '',
        icon: data.icon || '/logo.png',
        badge: data.badge || '/logo.png',
        vibrate: isCall ? [500, 250, 500, 250, 500, 250, 500, 250] : [100, 50, 100],
        requireInteraction: isCall,
        data: data.data || {}
      };

      if (isCall) {
        options.actions = [
          { action: 'accept_call', title: '✅ Accept' },
          { action: 'decline_call', title: '❌ Decline' }
        ];
      }

      await self.registration.showNotification(data.title || 'Orbit', options);
    } catch (e) {
      const options = {
        body: event.data.text(),
        icon: '/logo.png',
        badge: '/logo.png',
        vibrate: [100, 50, 100]
      };
      await self.registration.showNotification('Orbit Announcement', options);
    }
  }
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  const targetUrl = event.notification.data?.url || '/';
  const action = event.action;
  const data = event.notification.data || {};

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(windowClients) {
      let client = null;
      for (let i = 0; i < windowClients.length; i++) {
        if (windowClients[i].url.includes(self.registration.scope)) {
          client = windowClients[i];
          break;
        }
      }

      const navigateTo = (action === 'accept_call' || action === 'view_call' || !action) ? '/calls' : targetUrl;
      const finalAction = action || 'view_call';

      if (client && 'focus' in client) {
        client.focus();
        client.postMessage({ type: 'CALL_ACTION', action: finalAction, callData: data });
        return client.navigate(navigateTo);
      } else if (clients.openWindow) {
        return clients.openWindow(navigateTo).then(newClient => {
          if (newClient) {
            setTimeout(() => {
              newClient.postMessage({ type: 'CALL_ACTION', action: finalAction, callData: data });
            }, 3000);
          }
        });
      }
    })
  );
});
