var CACHE = 'akc-finance-v7';
var ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon.svg',
  './icon-192.png',
  './icon-512.png',
  './logo.jpg'
];
var CDN = 'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js';

self.addEventListener('install', function(e){
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE).then(function(c){
      return Promise.all(ASSETS.map(function(url){
        return c.add(new Request(url, { cache:'reload' })).catch(function(){ /* tolerate */ });
      }));
    })
  );
});

self.addEventListener('activate', function(e){
  e.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(keys.filter(function(k){ return k !== CACHE; }).map(function(k){ return caches.delete(k); }));
    }).then(function(){ return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function(e){
  var req = e.request;
  if(req.method !== 'GET') return;
  // Jangan pernah cache service worker agar update tidak terkunci.
  if(req.url.indexOf('sw.js') >= 0){
    e.respondWith(fetch(req));
    return;
  }

  e.respondWith(
    caches.match(req).then(function(cached){
      if(cached) return cached;
      return fetch(req).then(function(res){
        var url = req.url;
        var cacheable = url.indexOf(self.location.origin) === 0 || url === CDN;
        if(cacheable && res && (res.ok || res.type === 'opaque')){
          var copy = res.clone();
          caches.open(CACHE).then(function(c){ c.put(req, copy); });
        }
        return res;
      }).catch(function(){
        if(req.mode === 'navigate'){
          return caches.match('./index.html');
        }
        return new Response('Offline', { status: 503, statusText: 'Offline' });
      });
    })
  );
});
