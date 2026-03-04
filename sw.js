const CACHE = "pwa-v1";

const ASSETS = [
  "/",
  "/index.html",
  "/app.js",
  "/manifest.json",
  "/icons/icon_512x512@2x.png"
];

// Install: cache app shell
self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

// Activate: remove old caches
self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(k => (k !== CACHE ? caches.delete(k) : null)))
    )
  );
  self.clients.claim();
});

// Fetch strategy compatible with iOS + Android
self.addEventListener("fetch", e => {
  const req = e.request;

  if (req.method !== "GET") return;

  // Navigation requests (page loads) – critical for iOS PWAs
  if (req.mode === "navigate") {
    e.respondWith(
      fetch(req).catch(() => caches.match("/index.html"))
    );
    return;
  }

  // Ignore cross-origin
  if (!req.url.startsWith(self.location.origin)) return;

  // Cache-first for assets
  e.respondWith(
    caches.match(req).then(cached => {
      if (cached) return cached;

      return fetch(req).then(res => {
        if (!res || res.status !== 200 || res.type !== "basic") return res;

        const copy = res.clone();
        caches.open(CACHE).then(cache => cache.put(req, copy));

        return res;
      }).catch(() => caches.match("/index.html"));
    })
  );
});