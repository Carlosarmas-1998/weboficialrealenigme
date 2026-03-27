/* ============================================================
   ENIGME SERVICE WORKER - sw.js
   PWA + Offline Support + Cache Strategy
   ============================================================ */

var CACHE_NAME = "enigme-v2-cache";
var STATIC_ASSETS = [
  "/",
  "/index.html",
  "/catalogo.html",
  "/joyeria.html",
  "/boutique.html",
  "/plata.html",
  "/liquidacion.html",
  "/enigme-shared.js",
  "/enigme-core.js",
  "/monograma.png",
  "/logo.png",
  "/portada.png",
  "/sello.png"
];

// Install - cache static assets
self.addEventListener("install", function (event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate - clean old caches
self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(
        keys.filter(function (key) {
          return key !== CACHE_NAME;
        }).map(function (key) {
          return caches.delete(key);
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch - network first, fallback to cache
self.addEventListener("fetch", function (event) {
  // Skip non-GET requests
  if (event.request.method !== "GET") return;

  // Skip external API calls
  if (event.request.url.includes("ipapi.co") ||
      event.request.url.includes("airtable.com") ||
      event.request.url.includes("formsubmit.co")) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then(function (response) {
        // Cache successful responses
        if (response.status === 200) {
          var responseClone = response.clone();
          caches.open(CACHE_NAME).then(function (cache) {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(function () {
        // Fallback to cache
        return caches.match(event.request).then(function (cached) {
          if (cached) return cached;
          // If HTML page not cached, return offline page
          if (event.request.headers.get("accept").includes("text/html")) {
            return caches.match("/index.html");
          }
        });
      })
  );
});

// Push notification handler
self.addEventListener("push", function (event) {
  var data = { title: "ENIGME", body: "Novedades exclusivas disponibles." };
  if (event.data) {
    try { data = event.data.json(); } catch (e) { data.body = event.data.text(); }
  }
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: "/monograma.png",
      badge: "/monograma.png",
      vibrate: [100, 50, 100]
    })
  );
});

self.addEventListener("notificationclick", function (event) {
  event.notification.close();
  event.waitUntil(
    clients.openWindow("/catalogo.html")
  );
});
