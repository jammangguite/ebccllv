// ═══════════════════════════════════════════
// EBCC LLV — Service Worker v1.0
// ═══════════════════════════════════════════
const CACHE = 'ebcc-llv-v1';
const CORE  = ['./', './index.html', './manifest.json', './icon.svg'];

self.addEventListener('install', (e: any) => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(CORE))
      .then(() => (self as any).skipWaiting())
  );
});

self.addEventListener('activate', (e: any) => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => (self as any).clients.claim())
  );
});

self.addEventListener('fetch', (e: any) => {
  const url = new URL(e.request.url);
  // Always network for Google Sheets API
  if (url.hostname.includes('script.google.com')) {
    e.respondWith(
      fetch(e.request).catch(() =>
        new Response(JSON.stringify([]), { headers: { 'Content-Type': 'application/json' } })
      )
    );
    return;
  }
  // Cache-first for everything else
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(res => {
        if (res.ok && e.request.method === 'GET') {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return res;
      }).catch(() => caches.match('./index.html'));
    })
  );
});
export {};
