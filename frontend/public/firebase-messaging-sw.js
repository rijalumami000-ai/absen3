/* eslint-disable no-undef */
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: 'AIzaSyBAz39ZnMb4_8RlNvC1q8V5GG91G72_vRQ',
  authDomain: 'absensi-pesantren-139ac.firebaseapp.com',
  projectId: 'absensi-pesantren-139ac',
  storageBucket: 'absensi-pesantren-139ac.firebasestorage.app',
  messagingSenderId: '785772867058',
  appId: '1:785772867058:web:a8b3a36ea82b9ae4f1e4db',
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message:', payload);

  const notificationTitle = payload.notification?.title || 'Absensi Sholat';
  const notificationOptions = {
    body: payload.notification?.body || 'Notifikasi baru dari Absensi Sholat',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    tag: 'absensi-notification',
    requireInteraction: true,
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener('notificationclick', (event) => {
  console.log('[firebase-messaging-sw.js] Notification click received.');
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes('/wali-app') && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow('/wali-app');
      }
    })
  );
});
