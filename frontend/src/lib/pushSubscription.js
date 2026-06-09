import { axiosInstance } from './axios';

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export async function registerServiceWorker() {
  if ('serviceWorker' in navigator && 'PushManager' in window) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      return registration;
    } catch (error) {
      console.error('[SW] Service Worker registration failed:', error);
    }
  }
  return null;
}

export async function subscribeUserToPush() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    return;
  }

  try {
    // Register SW first if not already registered
    await registerServiceWorker();
    const registration = await navigator.serviceWorker.ready;
    
    // 1. Get VAPID public key from backend
    const { data } = await axiosInstance.get('/users/push/vapid-key');
    if (!data || !data.publicKey) {
      console.warn('[PUSH] No VAPID public key returned from backend.');
      return;
    }

    // 2. Request permission from user
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      return;
    }

    // 3. Create Subscription
    const subscribeOptions = {
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(data.publicKey)
    };

    const subscription = await registration.pushManager.subscribe(subscribeOptions);

    // 4. Save subscription on backend
    await axiosInstance.post('/users/push/subscribe', { subscription: subscription.toJSON() });
  } catch (error) {
    if (error.name === 'AbortError') {
      console.warn('[PUSH] Push subscription aborted (likely missing/invalid VAPID keys locally).');
    } else {
      console.error('[PUSH] Failed to subscribe user:', error);
    }
  }
}

export async function unsubscribeUserFromPush() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    
    if (subscription) {
      // 1. Notify backend
      await axiosInstance.post('/users/push/unsubscribe', { endpoint: subscription.endpoint });
      // 2. Unsubscribe locally
      await subscription.unsubscribe();
    }
  } catch (error) {
    console.error('[PUSH] Failed to unsubscribe:', error);
  }
}
