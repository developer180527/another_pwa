const CACHE = "offline-v1";
const OFFLINE_URL = "/index.html";

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE).then(cache =>
      cache.addAll([
        "/",
        "/index.html",
        "/app.js",
        "/manifest.json",
        "/icons/icon_512x512@2x.png"
      ])
    )
  );
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;

      return fetch(event.request).then(networkResponse => {
        const copy = networkResponse.clone();
        caches.open(CACHE).then(cache => {
          cache.put(event.request, copy);
        });
        return networkResponse;
      }).catch(() => caches.match(OFFLINE_URL));
    })
  );
});