// Service worker for SpendWise
const CACHE_NAME = 'spendwise-v1';

self.addEventListener('install', (event) => {
  console.info('SW: Installing...');
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  console.info('SW: Activating...');
  event.waitUntil(self.clients.claim());
});

// Implementation for auth state sync if needed in background
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'AUTH_STATE_CHANGED') {
    console.info('SW: Auth state changed reported', event.data.user ? 'Logged In' : 'Logged Out');
    // Store in indexedDB or just acknowledge
  }
});
