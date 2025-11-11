/**
 * IndexedDB Cache Manager
 * 
 * Persistent caching using IndexedDB.
 * Data survives page refresh and browser restart.
 * 
 * Features:
 * - Write-through caching (memory + IndexedDB)
 * - Background sync
 * - Storage quota management
 * - Automatic cleanup
 */

import { db, CacheEntry, initDB, isIndexedDBAvailable, getStorageQuota, clearAllData } from './IndexedDBSchema';
import { cacheEvents, CacheEventType, CacheSource } from '../cache-events/CacheEventEmitter';
import { configLoader } from '../ConfigLoader';

class IndexedDBManager {
  private initialized: boolean = false;
  private cleanupInterval?: NodeJS.Timeout;

  constructor() {
    this.initialize();
  }

  private async initialize(): Promise<void> {
    if (!isIndexedDBAvailable()) {
      console.warn('[IndexedDB] IndexedDB not available in this environment');
      return;
    }

    try {
      await initDB();
      this.initialized = true;
      
      // Start periodic cleanup
      this.startCleanupInterval();
      
      // Emit initialization event
      cacheEvents.emit({
        type: CacheEventType.CACHE_SET,
        metadata: {
          source: 'indexeddb' as CacheSource,
          action: 'initialized',
        },
      });
    } catch (error) {
      console.error('[IndexedDB] Initialization failed:', error);
    }
  }

  /**
   * Get value from IndexedDB
   */
  async get<T>(key: string): Promise<T | null> {
    if (!this.initialized) return null;

    try {
      const entry = await db.cache.get(key);
      
      if (!entry) {
        cacheEvents.emit({
          type: CacheEventType.CACHE_MISS,
          metadata: {
            source: 'indexeddb' as CacheSource,
            key,
          },
        });
        return null;
      }

      // Check if expired
      if (Date.now() > entry.expiresAt) {
        await this.delete(key);
        
        cacheEvents.emit({
          type: CacheEventType.CACHE_MISS,
          metadata: {
            source: 'indexeddb' as CacheSource,
            key,
            reason: 'expired',
          },
        });
        
        return null;
      }

      // Update access statistics
      await db.cache.update(key, {
        accessCount: entry.accessCount + 1,
        lastAccessTime: Date.now(),
      });

      cacheEvents.emit({
        type: CacheEventType.CACHE_HIT,
        metadata: {
          source: 'indexeddb' as CacheSource,
          key,
          accessCount: entry.accessCount + 1,
        },
      });

      return entry.data as T;
    } catch (error) {
      console.error('[IndexedDB] Error getting key:', key, error);
      return null;
    }
  }

  /**
   * Set value in IndexedDB
   */
  async set<T>(key: string, data: T, options?: {
    ttl?: number;
  }): Promise<void> {
    if (!this.initialized) return;

    try {
      const config = configLoader.getConfig();
      const ttl = options?.ttl || config.ttl.indexedDBMs;
      const size = this.estimateSize(data);

      const entry: CacheEntry = {
        key,
        data,
        timestamp: Date.now(),
        expiresAt: Date.now() + ttl,
        size,
        accessCount: 0,
        lastAccessTime: Date.now(),
        version: 1,
      };

      await db.cache.put(entry);

      cacheEvents.emit({
        type: CacheEventType.CACHE_SET,
        metadata: {
          source: 'indexeddb' as CacheSource,
          key,
          size,
          ttl,
        },
      });

      // Check storage quota
      await this.checkStorageQuota();
    } catch (error) {
      console.error('[IndexedDB] Error setting key:', key, error);
    }
  }

  /**
   * Check if key exists and is not expired
   */
  async has(key: string): Promise<boolean> {
    if (!this.initialized) return false;

    try {
      const entry = await db.cache.get(key);
      if (!entry) return false;
      
      if (Date.now() > entry.expiresAt) {
        await this.delete(key);
        return false;
      }
      
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Delete specific key
   */
  async delete(key: string): Promise<void> {
    if (!this.initialized) return;

    try {
      await db.cache.delete(key);
      
      cacheEvents.emit({
        type: CacheEventType.CACHE_EVICT,
        metadata: {
          source: 'indexeddb',
          key,
          reason: 'manual',
        },
      });
    } catch (error) {
      console.error('[IndexedDB] Error deleting key:', key, error);
    }
  }

  /**
   * Clear all cache
   */
  async clear(): Promise<void> {
    if (!this.initialized) return;

    try {
      const count = await db.cache.count();
      await clearAllData();
      
      cacheEvents.emit({
        type: CacheEventType.CACHE_CLEAR,
        metadata: {
          source: 'indexeddb',
          count,
        },
      });
    } catch (error) {
      console.error('[IndexedDB] Error clearing cache:', error);
    }
  }

  /**
   * Get all keys
   */
  async keys(): Promise<string[]> {
    if (!this.initialized) return [];

    try {
      return await db.cache.toCollection().primaryKeys();
    } catch {
      return [];
    }
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<{
    entryCount: number;
    totalSize: number;
    oldestEntry: number | null;
    newestEntry: number | null;
  }> {
    if (!this.initialized) {
      return {
        entryCount: 0,
        totalSize: 0,
        oldestEntry: null,
        newestEntry: null,
      };
    }

    try {
      const entries = await db.cache.toArray();
      
      const totalSize = entries.reduce((sum, entry) => sum + entry.size, 0);
      const timestamps = entries.map(e => e.timestamp);
      
      return {
        entryCount: entries.length,
        totalSize,
        oldestEntry: timestamps.length > 0 ? Math.min(...timestamps) : null,
        newestEntry: timestamps.length > 0 ? Math.max(...timestamps) : null,
      };
    } catch {
      return {
        entryCount: 0,
        totalSize: 0,
        oldestEntry: null,
        newestEntry: null,
      };
    }
  }

  /**
   * Check storage quota and trigger cleanup if needed
   */
  private async checkStorageQuota(): Promise<void> {
    try {
      const quota = await getStorageQuota();
      const percentUsed = quota.percent;

      cacheEvents.emit({
        type: CacheEventType.STORAGE_QUOTA_CHECK,
        metadata: {
          source: 'indexeddb',
          usageMB: quota.usage / (1024 * 1024),
          quotaMB: quota.quota / (1024 * 1024),
          percent: percentUsed,
        },
      });

      // Trigger cleanup at different thresholds
      if (percentUsed > 90) {
        // Red zone: aggressive cleanup
        await this.aggressiveCleanup();
      } else if (percentUsed > 70) {
        // Yellow zone: soft cleanup
        await this.softCleanup();
      }
    } catch (error) {
      console.error('[IndexedDB] Error checking storage quota:', error);
    }
  }

  /**
   * Cleanup expired entries
   */
  async cleanupExpired(): Promise<void> {
    if (!this.initialized) return;

    try {
      const now = Date.now();
      const expired = await db.cache
        .where('expiresAt')
        .below(now)
        .toArray();

      if (expired.length === 0) return;

      const keys = expired.map(e => e.key);
      await db.cache.bulkDelete(keys);

      cacheEvents.emit({
        type: CacheEventType.STORAGE_CLEANUP,
        metadata: {
          source: 'indexeddb',
          count: expired.length,
          reason: 'expired',
        },
      });
    } catch (error) {
      console.error('[IndexedDB] Error cleaning up expired entries:', error);
    }
  }

  /**
   * Soft cleanup: remove 25% oldest entries
   */
  private async softCleanup(): Promise<void> {
    try {
      const entries = await db.cache
        .orderBy('lastAccessTime')
        .toArray();

      const toDelete = Math.ceil(entries.length * 0.25);
      const keysToDelete = entries.slice(0, toDelete).map(e => e.key);

      await db.cache.bulkDelete(keysToDelete);

      cacheEvents.emit({
        type: CacheEventType.STORAGE_CLEANUP,
        metadata: {
          source: 'indexeddb',
          count: toDelete,
          reason: 'quota_yellow',
        },
      });
    } catch (error) {
      console.error('[IndexedDB] Error in soft cleanup:', error);
    }
  }

  /**
   * Aggressive cleanup: remove 50% oldest entries
   */
  private async aggressiveCleanup(): Promise<void> {
    try {
      const entries = await db.cache
        .orderBy('lastAccessTime')
        .toArray();

      const toDelete = Math.ceil(entries.length * 0.5);
      const keysToDelete = entries.slice(0, toDelete).map(e => e.key);

      await db.cache.bulkDelete(keysToDelete);

      cacheEvents.emit({
        type: CacheEventType.STORAGE_CLEANUP,
        metadata: {
          source: 'indexeddb',
          count: toDelete,
          reason: 'quota_red',
        },
      });
    } catch (error) {
      console.error('[IndexedDB] Error in aggressive cleanup:', error);
    }
  }

  /**
   * Start periodic cleanup
   */
  private startCleanupInterval(): void {
    // Cleanup expired entries every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpired();
    }, 5 * 60 * 1000);
  }

  /**
   * Estimate size of data in bytes
   */
  private estimateSize(data: any): number {
    try {
      const json = JSON.stringify(data);
      return new Blob([json]).size;
    } catch {
      return 1024; // 1KB default
    }
  }

  /**
   * Cleanup on destroy
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }
}

// Singleton instance
export const indexedDBManager = new IndexedDBManager();

// Expose to window for debugging
if (typeof window !== 'undefined') {
  (window as any).__indexedDB = {
    stats: () => indexedDBManager.getStats(),
    clear: () => indexedDBManager.clear(),
    keys: () => indexedDBManager.keys(),
    get: (key: string) => indexedDBManager.get(key),
    set: (key: string, data: any, options?: { ttl?: number }) => indexedDBManager.set(key, data, options),
    has: (key: string) => indexedDBManager.has(key),
    delete: (key: string) => indexedDBManager.delete(key),  // Added for cache invalidation
  };
}

export default indexedDBManager;
