/**
 * Photo Proof Service Worker
 * 
 * Handles image caching for optimal performance.
 * 
 * Strategies:
 * - Gallery/Photo images: Cache-first (immutable)
 * - Cover photos: Stale-while-revalidate (might change)
 * - API calls: Network-only (handled by IndexedDB)
 */

const CACHE_VERSION = 'v2'; // Incremented to force update (fixed URL pattern)
const IMAGE_CACHE = `photo-proof-images-${CACHE_VERSION}`;
const COVER_CACHE = `photo-proof-covers-${CACHE_VERSION}`;

// Debug flag - set to true to enable logging
const DEBUG = false; // Set to true when debugging Service Worker

// Cache expiration times
const IMAGE_CACHE_DAYS = 30;
const COVER_CACHE_DAYS = 7;

// Cache size limits (MB)
const MAX_IMAGE_CACHE_MB = 500;
const MAX_COVER_CACHE_MB = 100;

if (DEBUG) console.log('[SW] Service Worker script loaded');

/**
 * Install Event
 * Called when Service Worker is first installed
 */
self.addEventListener('install', (event) => {
  if (DEBUG) console.log('[SW] Installing Service Worker...');
  
  // Skip waiting to activate immediately
  self.skipWaiting();
  
  event.waitUntil(
    Promise.all([
      caches.open(IMAGE_CACHE),
      caches.open(COVER_CACHE)
    ]).then(() => {
      if (DEBUG) console.log('[SW] Caches initialized');
    })
  );
});

/**
 * Activate Event
 * Called when Service Worker is activated
 */
self.addEventListener('activate', (event) => {
  if (DEBUG) console.log('[SW] Activating Service Worker...');
  
  event.waitUntil(
    // Clean up old caches
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // Delete old versions
          if (cacheName.startsWith('photo-proof-') && 
              cacheName !== IMAGE_CACHE && 
              cacheName !== COVER_CACHE) {
            if (DEBUG) console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      // Take control of all clients immediately
      return self.clients.claim();
    }).then(() => {
      if (DEBUG) console.log('[SW] Service Worker activated and ready');
    })
  );
});

/**
 * Fetch Event
 * Intercepts all network requests
 */
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Only intercept GET requests
  if (event.request.method !== 'GET') {
    return;
  }
  
  // Only intercept same-origin requests
  if (url.origin !== self.location.origin) {
    return;
  }
  
  // Handle different URL patterns
  if (isGalleryImage(url)) {
    event.respondWith(cacheFirst(event.request, IMAGE_CACHE));
  } else if (isCoverImage(url)) {
    event.respondWith(staleWhileRevalidate(event.request, COVER_CACHE));
  }
  // API calls and other requests: let them pass through
});

/**
 * Check if URL is a gallery/photo image
 * Matches any image file in /uploads/ directory (including /uploads/projects/...)
 */
function isGalleryImage(url) {
  // Match ANY image in /uploads/ regardless of subdirectory
  return url.pathname.startsWith('/uploads/') && 
         /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(url.pathname);
}

/**
 * Check if URL is a cover photo
 */
function isCoverImage(url) {
  return url.pathname.includes('/uploads/covers/') ||
         url.pathname.includes('cover_photo');
}

/**
 * Cache-First Strategy
 * 
 * 1. Check cache first
 * 2. If found, return cached
 * 3. If not found, fetch from network and cache
 * 
 * Best for: Immutable content (gallery images)
 */
async function cacheFirst(request, cacheName) {
  try {
    const cache = await caches.open(cacheName);
    const cached = await cache.match(request);
    
    if (cached) {
      if (DEBUG) console.log('[SW] Cache HIT:', request.url);
      
      // Update access time in background
      updateCacheMetadata(request, cacheName);
      
      return cached;
    }
    
    if (DEBUG) console.log('[SW] Cache MISS, fetching:', request.url);
    
    // Fetch from network
    const response = await fetch(request);
    
    // Cache if successful
    if (response.ok) {
      cache.put(request, response.clone());
      if (DEBUG) console.log('[SW] Cached:', request.url);
      
      // Check cache quota after adding
      checkCacheQuota(cacheName);
    }
    
    return response;
    
  } catch (error) {
    console.error('[SW] Cache-first error:', error);
    
    // Try to return cached even if network fails
    const cache = await caches.open(cacheName);
    const cached = await cache.match(request);
    
    if (cached) {
      if (DEBUG) console.log('[SW] Returning stale cache (offline)');
      return cached;
    }
    
    throw error;
  }
}

/**
 * Stale-While-Revalidate Strategy
 * 
 * 1. Return cached immediately if available
 * 2. Fetch fresh copy in background
 * 3. Update cache with fresh copy
 * 
 * Best for: Content that might change but speed is priority
 */
async function staleWhileRevalidate(request, cacheName) {
  try {
    const cache = await caches.open(cacheName);
    const cached = await cache.match(request);
    
    // Fetch fresh copy in background
    const fetchPromise = fetch(request).then(response => {
      if (response.ok) {
        cache.put(request, response.clone());
        if (DEBUG) console.log('[SW] Updated cache:', request.url);
      }
      return response;
    }).catch(error => {
      console.warn('[SW] Background fetch failed:', error.message);
      return null;
    });
    
    // Return cached immediately if available
    if (cached) {
      if (DEBUG) console.log('[SW] Returning cached (revalidating):', request.url);
      return cached;
    }
    
    // No cache, wait for fetch
    if (DEBUG) console.log('[SW] No cache, waiting for fetch:', request.url);
    return await fetchPromise;
    
  } catch (error) {
    console.error('[SW] Stale-while-revalidate error:', error);
    throw error;
  }
}

/**
 * Update cache metadata (access time, count)
 */
function updateCacheMetadata(request, cacheName) {
  // This is a lightweight operation, doesn't need to block
  // In a real implementation, you could store metadata in IndexedDB
  // For now, we just log
  // Future: Track access count, last access time for LRU eviction
}

/**
 * Check cache quota and evict if needed
 */
async function checkCacheQuota(cacheName) {
  try {
    // Check storage quota
    if (!navigator.storage || !navigator.storage.estimate) {
      return;
    }
    
    const estimate = await navigator.storage.estimate();
    const usagePercent = (estimate.usage / estimate.quota) * 100;
    
    if (usagePercent > 80) {
      console.warn('[SW] Storage quota >80%, consider cleanup');
      // Future: Implement LRU eviction
    }
    
    // Check cache size
    const cache = await caches.open(cacheName);
    const requests = await cache.keys();
    
    const maxSize = cacheName === IMAGE_CACHE ? 
      MAX_IMAGE_CACHE_MB * 1024 * 1024 : 
      MAX_COVER_CACHE_MB * 1024 * 1024;
    
    // Simple count-based limit (Future: implement size-based)
    if (requests.length > 1000) {
      console.warn('[SW] Cache has', requests.length, 'items, consider cleanup');
      // Future: Evict oldest entries
    }
    
  } catch (error) {
    console.error('[SW] Error checking quota:', error);
  }
}

/**
 * Message Handler
 * Listen for messages from the app
 */
self.addEventListener('message', (event) => {
  if (DEBUG) console.log('[SW] Received message:', event.data);
  
  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      Promise.all([
        caches.delete(IMAGE_CACHE),
        caches.delete(COVER_CACHE)
      ]).then(() => {
        if (DEBUG) console.log('[SW] Caches cleared');
        event.ports[0].postMessage({ success: true });
      })
    );
  }
  
  if (event.data.type === 'CACHE_STATS') {
    event.waitUntil(
      getCacheStats().then(stats => {
        event.ports[0].postMessage(stats);
      })
    );
  }

  // ========== BACKGROUND UPLOAD HANDLERS ==========
  
  if (event.data.type === 'START_UPLOAD') {
    console.log('[SW] Received START_UPLOAD command');
    event.waitUntil(
      handleUploadStart(event.data.payload).then(() => {
        if (event.ports && event.ports[0]) {
          event.ports[0].postMessage({ success: true });
        }
      }).catch((error) => {
        console.error('[SW] Upload start failed:', error);
        if (event.ports && event.ports[0]) {
          event.ports[0].postMessage({ success: false, error: error.message });
        }
      })
    );
  }
  
  if (event.data.type === 'PAUSE_UPLOAD') {
    console.log('[SW] Received PAUSE_UPLOAD command');
    // Handle pause (would need state management)
  }
  
  if (event.data.type === 'CANCEL_UPLOAD') {
    console.log('[SW] Received CANCEL_UPLOAD command');
    // Handle cancel (would need state management)
  }
  
  if (event.data.type === 'UPLOAD_PROGRESS') {
    // Relay progress to all clients
    self.clients.matchAll().then(clients => {
      clients.forEach(client => {
        client.postMessage({
          type: 'UPLOAD_PROGRESS_UPDATE',
          data: event.data.payload
        });
      });
    });
  }
});

/**
 * Get cache statistics
 */
async function getCacheStats() {
  try {
    const [imageCache, coverCache] = await Promise.all([
      caches.open(IMAGE_CACHE),
      caches.open(COVER_CACHE)
    ]);
    
    const [imageKeys, coverKeys] = await Promise.all([
      imageCache.keys(),
      coverCache.keys()
    ]);
    
    return {
      imageCacheCount: imageKeys.length,
      coverCacheCount: coverKeys.length,
      totalCached: imageKeys.length + coverKeys.length
    };
  } catch (error) {
    console.error('[SW] Error getting stats:', error);
    return { error: error.message };
  }
}

// ========== BACKGROUND UPLOAD FUNCTIONS ==========

/**
 * Handle upload start in Service Worker
 * Called when tab is closed but uploads need to continue
 */
async function handleUploadStart(payload) {
  console.log('[SW] Starting background upload:', payload);
  
  // In a full implementation, this would:
  // 1. Open IndexedDB to get pending uploads
  // 2. Process uploads using fetch()
  // 3. Update progress in IndexedDB
  // 4. Send notifications to user
  // 5. Notify main app when tab reopens
  
  // For now, this is a placeholder that logs the intent
  // Full implementation would require idb library in SW context
  return Promise.resolve();
}

/**
 * Background Sync Event
 * Automatically retry failed uploads when network is restored
 */
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync event:', event.tag);
  
  if (event.tag === 'upload-retry') {
    event.waitUntil(
      retryFailedUploads().then(() => {
        console.log('[SW] Background sync: uploads retried successfully');
      }).catch((error) => {
        console.error('[SW] Background sync failed:', error);
      })
    );
  }
});

/**
 * Retry failed uploads from IndexedDB
 */
async function retryFailedUploads() {
  console.log('[SW] Retrying failed uploads...');
  
  // In a full implementation:
  // 1. Open IndexedDB PhotoProofUploads
  // 2. Get all uploads with status 'failed' or 'pending'
  // 3. Retry each upload
  // 4. Update status in IndexedDB
  // 5. Send notification on completion
  
  // This is a placeholder - full implementation requires idb in SW
  return Promise.resolve();
}

/**
 * Push Notification Event
 * Show notification when uploads complete
 */
self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received');
  
  const data = event.data ? event.data.json() : {};
  
  const title = data.title || 'Photo Proof Upload Complete';
  const options = {
    body: data.body || 'Your photos have been uploaded successfully',
    icon: '/icon-192.png',
    badge: '/badge-72.png',
    tag: 'upload-complete',
    requireInteraction: false,
    data: data
  };
  
  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

/**
 * Notification Click Event
 * Handle notification clicks
 */
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked');
  
  event.notification.close();
  
  // Open or focus the app
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If a window is already open, focus it
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      // Otherwise, open a new window
      if (self.clients.openWindow) {
        return self.clients.openWindow('/');
      }
    })
  );
});

if (DEBUG) console.log('[SW] Service Worker ready');
