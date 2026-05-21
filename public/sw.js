// Self-destructing Service Worker for development mode
// This instantly unregisters any existing PWA service worker and forces clients to reload to fetch fresh development assets.

self.addEventListener('install', (event) => {
  console.log('🔄 SW: Install event, skipping waiting...');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('🔄 SW: Activate event, unregistering self and reloading clients...');
  event.waitUntil(
    self.registration.unregister()
      .then(() => self.clients.matchAll())
      .then((clients) => {
        clients.forEach((client) => {
          if (client.url) {
            console.log(`🔄 SW: Force reloading client: ${client.url}`);
            client.navigate(client.url);
          }
        });
      })
  );
});
