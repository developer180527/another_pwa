const CACHE = "pwa-v3";

const ASSETS = [            
  "/index.html",
  "/app.js",
  "/manifest.json",
  "/icons/icon_512x512@2x.png",
];


self.addEventListener("install", (e) => {

  e.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE);


      const results = await Promise.allSettled(
        ASSETS.map((url) => cache.add(new Request(url, { cache: "reload" })))
      );

      results.forEach((r, i) => {
        if (r.status === "rejected")
          console.warn(`[SW] Failed to pre-cache ${ASSETS[i]}:`, r.reason);
      });

      await self.skipWaiting(); 
    })()
  );
});

// ─── Activate ─────────────────────────────────────────────────────────────────
self.addEventListener("activate", (e) => {
  // ✅ FIX 1: clients.claim() is INSIDE waitUntil
  e.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)));
      await self.clients.claim(); // ✅ runs only after old caches are cleared
    })()
  );
});

// ─── Fetch ────────────────────────────────────────────────────────────────────
self.addEventListener("fetch", (e) => {
  const req = e.request;

  if (req.method !== "GET") return;
  if (!req.url.startsWith(self.location.origin)) return;
  if (!req.url.startsWith("http")) return;

  // Navigation requests — network-first so updates always reach the user,
  // ✅ FIX 4: was pure cache-first meaning iOS users never received updates
  if (req.mode === "navigate") {
    e.respondWith(
      (async () => {
        try {
          const res = await fetch("/index.html", { cache: "no-cache" });
          if (res && res.status === 200) {
            const cache = await caches.open(CACHE);
            await cache.put("/index.html", res.clone());
            return res;
          }
        } catch { /* offline — fall through to cache */ }

        const cached = await caches.match("/index.html");
        if (cached) return cached;

        // Bare minimum offline shell
        return new Response("<h1>You're offline</h1>", {
          headers: { "Content-Type": "text/html" },
        });
      })()
    );
    return;
  }

  // Static assets — cache-first, network fallback, silent miss on failure
  e.respondWith(
    (async () => {
      const cached = await caches.match(req);
      if (cached) return cached;

      try {
        const res = await fetch(req);
        if (!res || res.redirected || res.status !== 200 || res.type !== "basic")
          return res;

        const cache = await caches.open(CACHE);
        await cache.put(req, res.clone());
        return res;
      } catch {

        return new Response("Offline", { status: 503 });
      }
    })()
  );
});