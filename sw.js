/* =====================================================
   Our Love Album — Service Worker
   Caches the app shell so the site opens fast and works
   (mostly) offline once visited. Versioned for clean updates.
   ===================================================== */
const VERSION = "love-v1";
const CACHE = `${VERSION}-shell`;

const SHELL = [
  "./",
  "index.html",
  "css/styles.css",
  "js/config.js",
  "js/main.js",
  "manifest.webmanifest",
  "images/favicon.svg",
  "images/icon-192.png",
  "images/icon-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => !k.startsWith(VERSION)).map((k) => caches.delete(k)))
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Never intercept non-GET or cross-origin (e.g. Supabase, CDNs, fonts).
  if (request.method !== "GET" || url.origin !== location.origin) return;

  // Navigations → network first, fall back to cached shell so offline still loads.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put("./index.html", copy));
          return res;
        })
        .catch(() => caches.match("./index.html"))
    );
    return;
  }

  // Static assets → stale-while-revalidate.
  event.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request)
        .then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(request, copy));
          }
          return res;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});