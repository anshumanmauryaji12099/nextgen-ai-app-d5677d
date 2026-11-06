/* global self, caches, fetch, URL, Response */
/* NEXTGEN AI service worker.
 * This file is a template: the build (vite.config.ts → nextgenServiceWorker)
 * injects the build version and the list of hashed assets, then emits /sw.js.
 * A new deploy always produces a byte-different worker, which is how the app
 * detects a new version. The worker never touches localStorage/IndexedDB, so
 * user conversations survive updates.
 */
const VERSION = '__NG_VERSION__'
const PRECACHE_ASSETS = [] /*__NG_PRECACHE__*/
const SHELL_ROUTES = [
  '/',
  '/chat',
  '/studio',
  '/study',
  '/code',
  '/tasks',
  '/settings',
]
const STATIC_EXTRAS = [
  '/offline.html',
  '/manifest.webmanifest',
  '/favicon.ico',
  '/icons/icon-192.png',
  '/icons/logo-96.png',
]

const STATIC_CACHE = `ng-static-${VERSION}`
const PAGES_CACHE = `ng-pages-${VERSION}`
const RUNTIME_CACHE = 'ng-runtime-v1'

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const staticCache = await caches.open(STATIC_CACHE)
      await Promise.allSettled(
        [...PRECACHE_ASSETS, ...STATIC_EXTRAS].map((url) =>
          staticCache.add(url),
        ),
      )
      const pages = await caches.open(PAGES_CACHE)
      await Promise.allSettled(
        SHELL_ROUTES.map(async (route) => {
          const res = await fetch(route, {
            credentials: 'same-origin',
            cache: 'no-store',
          })
          if (res.ok) await pages.put(route, res)
        }),
      )
      // First install activates immediately; updates wait for "Update now".
      if (!self.registration.active) await self.skipWaiting()
    })(),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys()
      await Promise.all(
        keys
          .filter(
            (k) =>
              (k.startsWith('ng-static-') || k.startsWith('ng-pages-')) &&
              k !== STATIC_CACHE &&
              k !== PAGES_CACHE,
          )
          .map((k) => caches.delete(k)),
      )
      await self.clients.claim()
    })(),
  )
})

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting()
  if (event.data?.type === 'GET_VERSION')
    event.source?.postMessage({ type: 'VERSION', version: VERSION })
})

function isFont(url) {
  return (
    url.hostname === 'fonts.googleapis.com' ||
    url.hostname === 'fonts.gstatic.com'
  )
}

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return
  const url = new URL(request.url)

  if (isFont(url)) {
    event.respondWith(staleWhileRevalidate(request, RUNTIME_CACHE))
    return
  }
  if (url.origin !== self.location.origin) return
  // Never cache API or function traffic — AI responses must be live.
  if (
    url.pathname.startsWith('/api/') ||
    url.pathname.startsWith('/.netlify/functions') ||
    url.pathname.startsWith('/_serverFn')
  )
    return

  if (request.mode === 'navigate') {
    event.respondWith(networkFirstPage(request, url))
    return
  }
  if (url.pathname.startsWith('/assets/')) {
    event.respondWith(cacheFirst(request, STATIC_CACHE))
    return
  }
  if (
    url.pathname.startsWith('/.netlify/images') ||
    url.pathname.startsWith('/img/') ||
    url.pathname.startsWith('/icons/')
  ) {
    event.respondWith(staleWhileRevalidate(request, RUNTIME_CACHE))
  }
})

async function networkFirstPage(request, url) {
  const pages = await caches.open(PAGES_CACHE)
  try {
    const res = await fetch(request)
    if (res.ok && SHELL_ROUTES.includes(url.pathname))
      pages.put(url.pathname, res.clone())
    return res
  } catch {
    const cached = await pages.match(url.pathname)
    if (cached) return cached
    return (
      (await caches.match('/offline.html')) ||
      new Response('Offline', { status: 503 })
    )
  }
}

async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request)
  if (cached) return cached
  const res = await fetch(request)
  if (res.ok) (await caches.open(cacheName)).put(request, res.clone())
  return res
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName)
  const cached = await cache.match(request)
  const network = fetch(request)
    .then((res) => {
      if (res.ok || res.type === 'opaque') cache.put(request, res.clone())
      return res
    })
    .catch(() => cached)
  return cached || network
}
