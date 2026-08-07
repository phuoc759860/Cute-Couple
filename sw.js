/* =====================================================
   Our Love Album — Service Worker
   Caches the app shell so the site opens fast and works
   (mostly) offline once visited. Versioned for clean updates.
   ===================================================== */
const VERSION = "love-v2";
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

  // Nav + core app files → network first so fixes reach users right away,
  // falling back to cache offline.
  const CORE_FILES = ["index.html", "css/styles.css", "js/main.js", "js/config.js"];
  const isCore = CORE_FILES.some((f) => url.pathname.endsWith("/" + f) || (f === "index.html" && (url.pathname === "/" || url.pathname.endsWith("/"))));
  if (request.mode === "navigate" || isCore) {
    event.respondWith(
      fetch(request)
        .then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(request, copy));
          }
          return res;
        })
        .catch(() => caches.match(request))
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