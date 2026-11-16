// sw.js — hors ligne : tout est mis en cache à l'installation ; la VERSION est réécrite par outil/grimpe.py à chaque génération.
const VERSION = "20261116-232941";
const CACHE = "grimpe-" + VERSION;
const FICHIERS = ["./", "./index.html", "./style.css", "./data.js", "./manifest.webmanifest", "./icone.svg", "./icone-180.png", "./icone-192.png", "./icone-512.png", "./apple-touch-icon.png",
  "./js/app.js", "./js/store.js", "./js/dates.js", "./js/html.js", "./js/parseur.js", "./js/programme.js", "./js/analyse.js", "./js/export.js", "./js/minuteur.js", "./js/sync.js", "./js/salles.js", "./js/infos.js",
  "./js/ecrans/seance.js", "./js/ecrans/programme.js", "./js/ecrans/progres.js", "./js/ecrans/plus.js", "./js/ecrans/mur.js", "./js/ecrans/editeur.js", "./js/ecrans/fenetres.js"];

// cache: "reload" : contourne le cache HTTP de GitHub Pages (10 min), sinon une mise à jour peut mélanger anciens et nouveaux fichiers
self.addEventListener("install", e => e.waitUntil(caches.open(CACHE).then(c => c.addAll(FICHIERS.map(u => new Request(u, { cache: "reload" }))))));
self.addEventListener("activate", e => e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())));
self.addEventListener("message", e => { if (e.data === "mettre-a-jour") self.skipWaiting(); });
// Cache d'abord (l'app doit marcher en salle sans réseau) ; le réseau sert à détecter une nouvelle version via le script sw.js lui-même.
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET" || new URL(e.request.url).origin !== location.origin) return;
  const u = new URL(e.request.url);
  // Page d'accueil, manifeste et icônes : le réseau d'abord (3 s), pour que « Sur l'écran d'accueil » prenne toujours la bonne icône ; le cache si hors ligne
  if (e.request.mode === "navigate" || /\.(webmanifest|png|svg)$/.test(u.pathname)) {
    e.respondWith(Promise.race([fetch(e.request, { cache: "no-store" }), new Promise((_, ko) => setTimeout(ko, 3000))])
      .then(rep => { if (rep.ok) { const copie = rep.clone(); caches.open(CACHE).then(c => c.put(e.request, copie)); } return rep; })
      .catch(() => caches.match(e.request, { ignoreSearch: true }).then(r => r || caches.match("./index.html"))));
    return;
  }
  e.respondWith(caches.match(e.request, { ignoreSearch: true }).then(r => r || fetch(e.request).then(rep => { if (rep.ok) { const copie = rep.clone(); caches.open(CACHE).then(c => c.put(e.request, copie)); } return rep; })));
});
