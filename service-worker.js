const CACHE_NAME = "soundboard-live-v850";
const APP_ASSETS = [
  "./",
  "./index.html",
  "./styles.css?v=850",
  "./app.js?v=850",
  "./manifest.webmanifest",
  "./icons/icon.svg",
];

self.addEventListener("install", (event) => {
  // Promise.allSettled plutot que cache.addAll : un seul asset en echec (404,
  // reseau) ne doit pas faire echouer tout le precache et laisser le SW sans
  // cache installe.
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      Promise.allSettled(APP_ASSETS.map((url) => cache.add(url)))
    )
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  let url;
  try {
    url = new URL(req.url);
  } catch {
    return;
  }
  // Hors origine, ou API dynamique (share.php…) : le navigateur gère, sans cache.
  if (url.origin !== self.location.origin || url.pathname.includes("/api/")) return;

  // Reseau d'abord, cache en repli. La reponse renvoyee a respondWith() ne doit
  // JAMAIS etre undefined ni une reponse redirigee pour une navigation, sinon le
  // navigateur affiche « un service worker a rencontre une erreur inattendue ».
  event.respondWith((async () => {
    try {
      const network = await fetch(req);
      if (network && network.ok && network.type === "basic" && !network.redirected) {
        const copy = network.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(req, copy)).catch(() => {});
      }
      if (network && network.redirected && req.mode === "navigate") {
        const body = await network.blob();
        return new Response(body, {
          status: network.status,
          statusText: network.statusText,
          headers: network.headers,
        });
      }
      return network;
    } catch (error) {
      const cached = await caches.match(req);
      if (cached) return cached;
      if (req.mode === "navigate") {
        const fallback = (await caches.match("./index.html")) || (await caches.match("./"));
        if (fallback) return fallback;
      }
      return new Response("Hors ligne — recharge la page une fois la connexion revenue.", {
        status: 503,
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      });
    }
  })());
});
