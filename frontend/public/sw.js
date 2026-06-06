self.addEventListener('push', function(event) {
  if (event.data) {
    try {
      const data = event.data.json();
      
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

      event.waitUntil(
        self.registration.showNotification(data.title || 'Orbit', options)
      );
    } catch (e) {
      const options = {
        body: event.data.text(),
        icon: '/logo.png',
        badge: '/logo.png',
        vibrate: [100, 50, 100]
      };
      event.waitUntil(
        self.registration.showNotification('Orbit Announcement', options)
      );
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
