const CACHE_NAME = 'yakuwaz-cache-v1';

const FILES_TO_CACHE = [ '/', '/index.html', '/biology.pdf', '/pdfInfo.js', '/pdfjs/pdf.js', '/pdfjs/pdf.worker.js', '/chatbot.js', // if your main bot script has a name '/style.css',   // if your chatbot/site has custom CSS ];

// Install event: cache all required files self.addEventListener('install', event => { event.waitUntil( caches.open(CACHE_NAME).then(cache => { console.log('[Service Worker] Caching files'); return cache.addAll(FILES_TO_CACHE); }) ); });

// Activate event: cleanup old caches self.addEventListener('activate', event => { event.waitUntil( caches.keys().then(keyList => { return Promise.all( keyList.map(key => { if (key !== CACHE_NAME) { console.log('[Service Worker] Removing old cache', key); return caches.delete(key); } }) ); }) ); return self.clients.claim(); });

// Fetch event: serve from cache if offline self.addEventListener('fetch', event => { event.respondWith( caches.match(event.request) .then(response => { return response || fetch(event.request); }) ); });

