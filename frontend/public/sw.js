// Service worker: makes the shop installable and keeps the catalog usable on a weak connection.
// Orders, the cart checkout and the whole admin API always go straight to the network.
// Bump VERSION after changing this file to drop the old caches.
const VERSION = 'v1'
const SHELL_CACHE = `shell-${VERSION}`
const RUNTIME_CACHE = `runtime-${VERSION}`
const SHELL_KEY = '/'

const PUBLIC_API = /^\/api\/(settings|categories|products|pickup-points)(\/|$)/
const IMAGES = /^\/(demo|uploads|icons)\//

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      .then((cache) => cache.addAll([SHELL_KEY, '/manifest.webmanifest']))
      .then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (event) => {
  const keep = [SHELL_CACHE, RUNTIME_CACHE]
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => !keep.includes(key)).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return

  const url = new URL(request.url)
  // Cross-origin requests (Google Fonts) are left to the browser's own HTTP cache.
  if (url.origin !== self.location.origin) return

  if (request.mode === 'navigate') {
    // Every route of the SPA is the same index.html, so one cached copy serves them all offline.
    event.respondWith(networkFirst(request, SHELL_CACHE, SHELL_KEY))
  } else if (url.pathname.startsWith('/assets/')) {
    event.respondWith(cacheFirst(request))
  } else if (IMAGES.test(url.pathname)) {
    event.respondWith(staleWhileRevalidate(request))
  } else if (PUBLIC_API.test(url.pathname)) {
    event.respondWith(networkFirst(request, RUNTIME_CACHE, request))
  }
})

async function networkFirst(request, cacheName, cacheKey) {
  const cache = await caches.open(cacheName)
  try {
    const response = await fetch(request)
    if (response.ok) await cache.put(cacheKey, response.clone())
    return response
  } catch (error) {
    const cached = await cache.match(cacheKey)
    if (cached) return cached
    throw error
  }
}

// Files in /assets/ have a content hash in their name, so a cached copy never goes stale.
async function cacheFirst(request) {
  const cache = await caches.open(RUNTIME_CACHE)
  const cached = await cache.match(request)
  if (cached) return cached
  const response = await fetch(request)
  if (response.ok) await cache.put(request, response.clone())
  return response
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(RUNTIME_CACHE)
  const cached = await cache.match(request)
  const fresh = fetch(request)
    .then(async (response) => {
      if (response.ok) await cache.put(request, response.clone())
      return response
    })
    .catch(() => cached ?? Response.error())
  return cached ?? fresh
}
