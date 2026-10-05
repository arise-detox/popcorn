/* Chemins relatifs pour fonctionner sous /nom-du-depot/ sur GitHub Pages. */
const PREFIX = 'popcorn-' + new URL(self.registration.scope).pathname + '-';
const CACHE = PREFIX + 'v1.4.0';
const SHELL = ['./','./index.html','./styles.css','./sport.css','./motion.css','./fonts/anton-latin.woff2','./data.js','./tracks-data.js','./track-utils.js','./core.js','./gpx.js','./watch-adapters.js','./app.js','./challenges.js','./progress.js','./manifest.webmanifest','./icons/icon.svg','./icons/logo.svg','./icons/icon-192.png','./icons/icon-512.png','./icons/icon-maskable-512.png','./icons/apple-touch-icon.png','./examples/activity-demo.json'];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(SHELL)).then(()=>self.skipWaiting()));});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith(PREFIX)&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',event=>{
  const url=new URL(event.request.url);
  if(event.request.method!=='GET'||url.origin!==self.location.origin||!url.href.startsWith(self.registration.scope))return;
  // Le shell est cache-first ; incrémenter CACHE à chaque nouvelle version.
  event.respondWith(caches.match(event.request).then(cached=>cached||fetch(event.request).catch(()=>{
    if(event.request.mode==='navigate')return caches.match(new URL('./index.html',self.registration.scope));
    return Response.error();
  })));
});
