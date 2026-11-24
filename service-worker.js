const CACHE_NAME = "soundboard-live-v1050";
// Cache longue durée pour les fichiers figés (lib/, fonts/, icons/) : sa clé ne
// change pas d'une version de l'app à l'autre, la police du skin actif et wavesurfer
// y restent donc après une mise à jour (un changement de bibliothèque change son ?v=).
const STATIC_CACHE = "soundboard-static-v1";
const APP_ASSETS = [
  "./",
  "./index.html",
  "./styles.css?v=1050",
  "./app.js?v=1050",
  "./manifest.webmanifest",
];
// Éditeur audio, chargé à la demande : précaché pour rester disponible hors ligne.
const STATIC_ASSETS = [
  "./icons/icon.svg",
  "./lib/regions.esm.js?v=1",
  "./lib/envelope.esm.js?v=1",
  "./lib/wavesurfer-1.txt?v=1",
  "./lib/wavesurfer-2.txt?v=1",
  "./lib/wavesurfer-3.txt?v=1",
];
// Au-delà de ce délai sans réponse du réseau, la page est servie depuis le cache
// (wifi de salle médiocre) ; le réseau continue en fond et met le cache à jour.
const NETWORK_TIMEOUT_MS = 3000;

self.addEventListener("install", (event) => {
  // Promise.allSettled plutot que cache.addAll : un seul asset en echec (404,
  // reseau) ne doit pas faire echouer tout le precache et laisser le SW sans
  // cache installe.
  const precache = (name, urls) => caches.open(name).then((cache) =>
    Promise.allSettled(urls.map(async (url) => {
      if (name === STATIC_CACHE && await cache.match(url)) return; // déjà là
      await cache.add(url);
    }))
  );
  event.waitUntil(Promise.all([precache(CACHE_NAME, APP_ASSETS), precache(STATIC_CACHE, STATIC_ASSETS)]));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME && key !== STATIC_CACHE).map((key) => caches.delete(key)))
    ).then(() => self.clients.claim())
  );
});

function cacheable(response) {
  return response && response.ok && response.type === "basic" && !response.redirected;
}

// Fichiers dont le contenu ne change jamais sous une même URL : versionnés (?v=…)
// ou bibliothèques/polices/icônes figées.
function isImmutable(url) {
  return url.searchParams.has("v") || /\/(lib|fonts|icons)\//.test(url.pathname);
}

function isStatic(url) {
  return /\/(lib|fonts|icons)\//.test(url.pathname);
}

// Cache d'abord : sûr pour les fichiers versionnés, aucune attente réseau.
async function cacheFirst(req, cacheName) {
  const cached = await caches.match(req);
  if (cached) return cached;
  const network = await fetch(req);
  if (cacheable(network)) {
    const copy = network.clone();
    caches.open(cacheName).then((cache) => cache.put(req, copy)).catch(() => {});
  }
  return network;
}

// Réseau d'abord, mais pas plus de NETWORK_TIMEOUT_MS si une copie en cache existe.
async function networkFirst(event) {
  const req = event.request;
  const networkPromise = (async () => {
    const network = await fetch(req);
    if (cacheable(network)) {
      const copy = network.clone();
      await caches.open(CACHE_NAME).then((cache) => cache.put(req, copy)).catch(() => {});
    }
    // La reponse renvoyee a respondWith() ne doit JAMAIS etre une reponse redirigee
    // pour une navigation, sinon le navigateur affiche « un service worker a
    // rencontre une erreur inattendue ».
    if (network && network.redirected && req.mode === "navigate") {
      const body = await network.blob();
      return new Response(body, { status: network.status, statusText: network.statusText, headers: network.headers });
    }
    return network;
  })();
  event.waitUntil(networkPromise.catch(() => {})); // le rafraîchissement du cache se termine en fond

  const fromCache = async () => {
    const cached = await caches.match(req);
    if (cached) return cached;
    if (req.mode === "navigate") return (await caches.match("./index.html")) || (await caches.match("./"));
    return undefined;
  };

  let timer;
  const timeout = new Promise((resolve) => { timer = setTimeout(resolve, NETWORK_TIMEOUT_MS, "timeout"); });
  try {
    const first = await Promise.race([networkPromise, timeout]);
    if (first !== "timeout") return first;
    const cached = await fromCache();
    if (cached) return cached;
    return await networkPromise; // rien en cache : on attend le réseau
  } catch (error) {
    const cached = await fromCache();
    if (cached) return cached;
    return new Response("Hors ligne — recharge la page une fois la connexion revenue.", {
      status: 503,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  } finally {
    clearTimeout(timer);
  }
}

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET" || req.headers.has("range")) return;

  let url;
  try {
    url = new URL(req.url);
  } catch {
    return;
  }
  // Hors origine, ou API dynamique (share.php…) : le navigateur gère, sans cache.
  if (url.origin !== self.location.origin || url.pathname.includes("/api/")) return;

  if (req.mode !== "navigate" && isImmutable(url)) {
    event.respondWith(cacheFirst(req, isStatic(url) ? STATIC_CACHE : CACHE_NAME).catch(() =>
      new Response("", { status: 503 })
    ));
    return;
  }
  event.respondWith(networkFirst(event));
});
