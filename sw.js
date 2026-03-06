

const CACHE_VERSION = "v1";
const STATIC_CACHE = `static-${CACHE_VERSION}`;
const RUNTIME_CACHE = `runtime-${CACHE_VERSION}`;


const APP_SHELL = [
  "/index.html",
  "/app.js",
  "/styles.css",
  "/manifest.json",
  "/icons/icon-192.png",
  "/icons/icon-512.png"
];


self.addEventListener("install", event => {
  self.skipWaiting();

  event.waitUntil(
    caches.open(STATIC_CACHE).then(cache => {
      return cache.addAll(APP_SHELL);
    })
  );
});



self.addEventListener("activate", event => {

  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => ![STATIC_CACHE, RUNTIME_CACHE].includes(key))
          .map(key => caches.delete(key))
      )
    )
  );

  self.clients.claim();
});



self.addEventListener("fetch", event => {

  const request = event.request;

  if (request.method !== "GET") return;

  const url = new URL(request.url);


  if (url.origin !== location.origin) return;


  if (request.mode === "navigate") {

    event.respondWith(
      (async () => {

        try {

          const networkResponse = await fetch(request);

          const cache = await caches.open(RUNTIME_CACHE);
          cache.put(request, networkResponse.clone());

          return networkResponse;

        } catch {

          const cached = await caches.match(request);
          if (cached) return cached;

          return caches.match("/index.html");
        }

      })()
    );

    return;
  }



  event.respondWith(
    caches.match(request).then(cached => {

      if (cached) return cached;

      return fetch(request).then(networkResponse => {

        if (
          !networkResponse ||
          networkResponse.status !== 200 ||
          networkResponse.type !== "basic"
        ) {
          return networkResponse;
        }

        const responseClone = networkResponse.clone();

        caches.open(RUNTIME_CACHE).then(cache => {
          cache.put(request, responseClone);
        });

        return networkResponse;

      });

    })
  );

});