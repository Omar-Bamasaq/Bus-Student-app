const CACHE = 'bus-students-v2'
const STATIC = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.svg',
  '/logo.svg',
  '/icons.svg',
  '/sounds/emergency-alarm.wav',
  '/sounds/info.wav',
  '/sounds/warning.wav',
]

self.addEventListener('install', (e) => {
  self.skipWaiting()
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(STATIC))
  )
})

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))
    ))
  )
})

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url)

  if (url.pathname.startsWith('/api/') && e.request.method === 'GET') {
    e.respondWith(networkFirst(e.request))
  } else if (url.pathname.startsWith('/api/')) {
    return
  } else if (url.pathname.match(/\.(js|css|png|jpg|svg|wav|ico)$/)) {
    e.respondWith(cacheFirst(e.request))
  } else if (url.pathname === '/' || url.pathname === '/index.html') {
    e.respondWith(networkFirst(e.request))
  } else {
    e.respondWith(cacheFirst(e.request))
  }
})

async function networkFirst(req) {
  try {
    const res = await fetch(req)
    const cache = await caches.open(CACHE)
    cache.put(req, res.clone())
    return res
  } catch {
    const cached = await caches.match(req)
    return cached || new Response(JSON.stringify({ error: 'غير متصل' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}

async function cacheFirst(req) {
  const cached = await caches.match(req)
  if (cached) return cached
  try {
    const res = await fetch(req)
    const cache = await caches.open(CACHE)
    cache.put(req, res.clone())
    return res
  } catch {
    return new Response('غير متصل', { status: 503 })
  }
}
