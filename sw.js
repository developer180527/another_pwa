const CACHE = "offline-v1";
const OFFLINE_URL = "/index.html";

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE).then(cache =>
      cache.addAll([
        "/",
        "/index.html",
        "/app.js",
        "/manifest.json"
      ])
    )
  );
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", event => {
  // 👇 THIS IS THE MAGIC
  if (event.request.mode === "navigate") {
    event.respondWith(
      caches.match(OFFLINE_URL).then(response => {
        return response || fetch(event.request);
      })
    );
    return;
  }

  // Normal asset requests
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});