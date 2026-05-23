const CACHE_NAME = "abhyas-clock-v1";
const urlsToCache = [
  "/",
  "/icon.svg",
  "/icon-light.svg",
  "/icon-dark.svg",
  "/apple-icon.svg",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Skip service worker for auth routes and API calls
  if (
    url.pathname.startsWith("/api/auth") ||
    url.pathname.startsWith("/home") ||
    url.pathname.includes("oauth") ||
    url.pathname.includes("callback")
  ) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((response) => {
      if (response) {
        return response;
      }
      return fetch(event.request, { redirect: "follow" })
        .then((response) => {
          // Don't cache redirects or non-successful responses
          if (
            !response ||
            response.status !== 200 ||
            response.type === "opaqueredirect"
          ) {
            return response;
          }

          // Only cache GET requests
          // if (event.request.method === "GET" && response.type === "basic") {
          //   const responseToCache = response.clone();
          //   caches.open(CACHE_NAME).then((cache) => {
          //     cache.put(event.request, responseToCache);
          //   });
          // }
          return response;
        })
        .catch((error) => {
          console.error("Fetch failed:", error);
          throw error;
        });
    })
  );
});

self.addEventListener("activate", (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
