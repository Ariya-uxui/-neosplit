const CACHE_NAME = "neosplit-v2";

// Only precache files whose paths never change. The React build's JS/CSS
// files get a random hash in their filename every deploy (e.g.
// main.a1b2c3d4.js), so hardcoding them here causes cache.addAll() to
// 404 and fail the entire install — which is what was breaking this
// before. Those files still get used fine via the fetch handler below,
// they just aren't force-cached ahead of time.
const urlsToCache = ["/", "/index.html"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
      .catch((err) => {
        // Never let a caching hiccup kill the whole install — that's what
        // was causing the registration to silently disappear.
        console.error("SW install cache error:", err);
      })
  );
  self.skipWaiting();
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) =>
        Promise.all(
          cacheNames
            .filter((name) => name !== CACHE_NAME)
            .map((name) => caches.delete(name))
        )
      )
      .then(() => self.clients.claim())
  );
});