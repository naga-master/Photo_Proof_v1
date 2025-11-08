/**
 * Service Worker Type Definitions
 */

// Extend Window interface
interface Window {
  __serviceWorker?: ServiceWorkerContainer;
}

// Service Worker message types
interface ServiceWorkerMessage {
  type: 'SKIP_WAITING' | 'CLEAR_CACHE' | 'CACHE_STATS';
}

// Service Worker stats response
interface ServiceWorkerStats {
  imageCacheCount: number;
  coverCacheCount: number;
  totalCached: number;
  error?: string;
}

// Service Worker registration result
interface ServiceWorkerRegistrationResult {
  registration: ServiceWorkerRegistration;
  installing: boolean;
  waiting: boolean;
  active: boolean;
}
