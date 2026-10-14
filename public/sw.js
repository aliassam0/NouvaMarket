// Nouva Market - Service Worker for PWA & Instant Push Notifications
const CACHE_NAME = 'nouvamarket-pwa-v1';

// Install Event
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

// Activate Event
self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Push Notification Event
self.addEventListener('push', (event) => {
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = { title: '💰 مبيعة جديدة!', body: event.data.text() };
    }
  }

  const title = data.title || '💰 مبيعة جديدة! ربحك: 2,500 دج';
  const options = {
    body: data.body || 'تم تسجيل مبيعة جديدة عبر متجرك في نوفا ماركت',
    icon: data.icon || '/pwa-192x192.png',
    badge: data.badge || '/favicon-32x32.png',
    vibrate: data.vibrate || [200, 100, 200, 100, 350],
    tag: data.tag || 'sale-push-notification',
    renotify: true,
    data: data.data || { url: '/' },
    actions: [
      { action: 'view_order', title: '📦 عرض الطلبية' },
      { action: 'view_wallet', title: '💼 الأرباح والمحفظة' }
    ]
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Notification Click Event
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const targetUrl = (event.notification.data && event.notification.data.url) || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If a window is already open, focus it and navigate
      for (const client of clientList) {
        if ('focus' in client) {
          client.focus();
          client.postMessage({
            type: 'PWA_NOTIFICATION_CLICK',
            action: event.action,
            data: event.notification.data
          });
          return;
        }
      }
      // Otherwise open a new window
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});
