/**
 * Monity Service Worker v2
 * Provides offline support and caching for the PWA
 * 
 * Strategy:
 * - App Shell: Cache first (instant load)
 * - API requests: Network only (no caching to preserve auth)
 * - Static assets: Stale-while-revalidate
 * - Navigation: Network first, cache fallback
 */

const CACHE_VERSION = 'v4'
const CACHE_NAME = `monity-${CACHE_VERSION}`
const STATIC_CACHE = `monity-static-${CACHE_VERSION}`

// Core app shell - cached on install for instant loading
const APP_SHELL = [
  '/',
  '/dashboard',
  '/quick-add',
  '/install',
  '/MonityLogo.svg',
]

// Static assets patterns to cache
const STATIC_ASSETS = [
  /\/_next\/static\/.*/,
  /\/icons\/.*/,
  /\.(?:js|css|woff2?|png|jpg|jpeg|svg|gif|ico)$/,
]

// URLs to never cache
const NEVER_CACHE = [
  /\/api\/.*/,
  /clerk/,
  /\.clerk\./,
  /accounts\.google\.com/,
  /__nextjs/,
]

/**
 * Check if a request should be cached
 */
function shouldCache(request) {
  const url = new URL(request.url)
  
  // Never cache non-GET requests
  if (request.method !== 'GET') return false
  
  // Skip non-http(s) URLs (chrome-extension://, etc.)
  if (!url.protocol.startsWith('http')) return false
  
  // Never cache auth-related URLs
  for (const pattern of NEVER_CACHE) {
    if (pattern.test(url.href) || pattern.test(url.pathname)) {
      return false
    }
  }
  
  return true
}

/**
 * Check if URL is a static asset
 */
function isStaticAsset(url) {
  for (const pattern of STATIC_ASSETS) {
    if (pattern.test(url.pathname) || pattern.test(url.href)) {
      return true
    }
  }
  return false
}

// ============================================
// INSTALL EVENT
// ============================================
self.addEventListener('install', (event) => {
  console.log('[SW] Installing version:', CACHE_VERSION)
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching app shell')
        // Cache app shell, but don't fail install if some fail
        return Promise.allSettled(
          APP_SHELL.map(url => 
            cache.add(url).catch(err => {
              console.warn(`[SW] Failed to cache: ${url}`, err)
            })
          )
        )
      })
      .then(() => {
        console.log('[SW] Install complete')
        // Activate immediately without waiting
        return self.skipWaiting()
      })
  )
})

// ============================================
// ACTIVATE EVENT
// ============================================
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating version:', CACHE_VERSION)
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => {
              // Delete old version caches
              return name.startsWith('monity-') && name !== CACHE_NAME && name !== STATIC_CACHE
            })
            .map((name) => {
              console.log('[SW] Deleting old cache:', name)
              return caches.delete(name)
            })
        )
      })
      .then(() => {
        console.log('[SW] Claiming clients')
        // Take control of all clients immediately
        return self.clients.claim()
      })
  )
})

// ============================================
// FETCH EVENT
// ============================================
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)
  
  // Skip requests we shouldn't cache
  if (!shouldCache(request)) {
    return
  }
  
  // Strategy: Navigation requests - Network first, cache fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Only cache successful responses
          if (response.ok) {
            const clone = response.clone()
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, clone)
            })
          }
          return response
        })
        .catch(async () => {
          // Network failed, try cache
          const cachedResponse = await caches.match(request)
          if (cachedResponse) {
            return cachedResponse
          }
          
          // Try to return the dashboard as fallback
          const dashboardResponse = await caches.match('/dashboard')
          if (dashboardResponse) {
            return dashboardResponse
          }
          
          // Return homepage as last resort
          return caches.match('/')
        })
    )
    return
  }
  
  // Strategy: Static assets - Stale-while-revalidate
  if (isStaticAsset(url)) {
    event.respondWith(
      caches.open(STATIC_CACHE).then(async (cache) => {
        const cachedResponse = await cache.match(request)
        
        // Fetch fresh version in background
        const fetchPromise = fetch(request)
          .then((networkResponse) => {
            if (networkResponse.ok) {
              cache.put(request, networkResponse.clone())
            }
            return networkResponse
          })
          .catch(() => null)
        
        // Return cached version immediately, or wait for network
        return cachedResponse || fetchPromise
      })
    )
    return
  }
  
  // Strategy: Other requests - Cache first, network fallback
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse
      }
      
      return fetch(request).then((response) => {
        // Cache successful responses
        if (response.ok) {
          const clone = response.clone()
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, clone)
          })
        }
        return response
      })
    })
  )
})

// ============================================
// MESSAGE HANDLER
// ============================================
self.addEventListener('message', (event) => {
  const { type, payload } = event.data || {}
  
  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting()
      break
      
    case 'CLEAR_CACHE':
      caches.keys().then((names) => {
        names.forEach((name) => {
          if (name.startsWith('monity-')) {
            caches.delete(name)
          }
        })
      })
      break
      
    case 'CACHE_URLS':
      if (payload && Array.isArray(payload)) {
        caches.open(CACHE_NAME).then((cache) => {
          cache.addAll(payload)
        })
      }
      break
  }
})

// ============================================
// PUSH NOTIFICATIONS (Future)
// ============================================
self.addEventListener('push', (event) => {
  if (!event.data) return
  
  try {
    const data = event.data.json()
    
    event.waitUntil(
      self.registration.showNotification(data.title || 'Monity', {
        body: data.body || '',
        icon: '/icons/icon-192.png',
        badge: '/icons/badge-72.png',
        tag: data.tag || 'monity-notification',
        data: data.data || {},
      })
    )
  } catch (error) {
    console.error('[SW] Push notification error:', error)
  }
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  
  const urlToOpen = event.notification.data?.url || '/dashboard'
  
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((clients) => {
      // Try to focus an existing window
      for (const client of clients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(urlToOpen)
          return client.focus()
        }
      }
      // Open new window
      return self.clients.openWindow(urlToOpen)
    })
  )
})

console.log('[SW] Service Worker loaded:', CACHE_VERSION)
