const CACHE = 'forest-pwa-v5-2d-latlon';
const FILES = ['./', './index.html', './manifest.json', './vol_table.js', './icons/icon-192.png', './icons/icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(FILES))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// HTML과 JS/CSS는 먼저 네트워크에서 새 파일을 가져오고, 실패하면 캐시를 사용합니다.
// GitHub Pages에서 이전 index.html이 계속 보이는 문제를 줄이기 위한 설정입니다.
self.addEventListener('fetch', e => {
  const req = e.request;
  const url = new URL(req.url);

  if (req.mode === 'navigate' || url.pathname.endsWith('/index.html') || url.pathname.endsWith('.js') || url.pathname.endsWith('.css')) {
    e.respondWith(
      fetch(req)
        .then(res => {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(req, copy));
          return res;
        })
        .catch(() => caches.match(req).then(cached => cached || caches.match('./index.html')))
    );
    return;
  }

  e.respondWith(
    caches.match(req).then(cached => cached || fetch(req).then(res => {
      const copy = res.clone();
      caches.open(CACHE).then(c => c.put(req, copy));
      return res;
    }))
  );
});
