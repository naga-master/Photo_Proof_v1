/**
 * Unified Cache Manager
 * 
 * Coordinates multi-tier caching strategy:
 * L1: Memory Cache (fastest, volatile)
 * L2: IndexedDB (fast, persistent)
 * L3: OPFS (large capacity, persistent)
 * L4: Service Worker (network cache)
 * L5: Network (fallback)
 */

import { memoryCacheManager } from '../src/services/cache/MemoryCacheManager';
import { indexedDBManager } from '../src/services/cache/IndexedDBManager';
import { opfsCacheService } from './opfsCacheService';
import { imageOptimizationConfig } from './imageOptimizationConfigLoader';
import type { QualityLevel } from '../config/image-optimization.config';

interface CacheStats {
  memoryHits: number;
  indexedDBHits: number;
  opfsHits: number;
  networkHits: number;
  totalRequests: number;
  hitRate: number;
}

class UnifiedCacheManager {
  private stats: CacheStats = {
    memoryHits: 0,
    indexedDBHits: 0,
    opfsHits: 0,
    networkHits: 0,
    totalRequests: 0,
    hitRate: 0,
  };
  
  /**
   * Get image from cache (waterfall through all tiers)
   */
  async get(photoId: string, quality: QualityLevel): Promise<string | null> {
    this.stats.totalRequests++;
    const cacheKey = `photo:${photoId}:${quality}`;
    
    // L1: Memory cache
    const memoryResult = memoryCacheManager.get<string>(cacheKey);
    if (memoryResult) {
      this.stats.memoryHits++;
      console.log('[UnifiedCache] Memory hit:', { photoId, quality });
      return memoryResult;
    }
    
    // L2: IndexedDB
    const idbResult = await indexedDBManager.get<string>(cacheKey);
    if (idbResult) {
      this.stats.indexedDBHits++;
      console.log('[UnifiedCache] IndexedDB hit:', { photoId, quality });
      
      // Promote to memory
      memoryCacheManager.set(cacheKey, idbResult);
      return idbResult;
    }
    
    // L3: OPFS
    if (opfsCacheService.isEnabled()) {
      const opfsBlob = await opfsCacheService.get(photoId, quality);
      if (opfsBlob) {
        this.stats.opfsHits++;
        const url = URL.createObjectURL(opfsBlob);
        console.log('[UnifiedCache] OPFS hit:', { photoId, quality });
        
        // Promote to IndexedDB and memory
        await indexedDBManager.set(cacheKey, url);
        memoryCacheManager.set(cacheKey, url);
        return url;
      }
    }
    
    // L4 & L5: Service Worker / Network
    // Fetch from network and populate cache
    return null; // Caller should fetch from network
  }
  
  /**
   * Set image in all cache tiers
   */
  async set(photoId: string, quality: QualityLevel, blob: Blob): Promise<void> {
    const cacheKey = `photo:${photoId}:${quality}`;
    const url = URL.createObjectURL(blob);
    
    console.log('[UnifiedCache] Storing:', { photoId, quality, size: blob.size });
    
    // Store in all tiers (fire and forget for non-critical)
    const promises: Promise<any>[] = [];
    
    // L1: Memory (always)
    memoryCacheManager.set(cacheKey, url);
    
    // L2: IndexedDB (always)
    promises.push(indexedDBManager.set(cacheKey, url));
    
    // L3: OPFS (if enabled)
    if (opfsCacheService.isEnabled()) {
      promises.push(opfsCacheService.set(photoId, quality, blob));
    }
    
    // Wait for IndexedDB, don't block on OPFS
    await Promise.allSettled(promises);
  }
  
  /**
   * Delete from all cache tiers
   */
  async delete(photoId: string, quality: QualityLevel): Promise<void> {
    const cacheKey = `photo:${photoId}:${quality}`;
    
    console.log('[UnifiedCache] Deleting:', { photoId, quality });
    
    // Delete from all tiers
    memoryCacheManager.delete(cacheKey);
    await indexedDBManager.delete(cacheKey);
    
    if (opfsCacheService.isEnabled()) {
      await opfsCacheService.delete(photoId, quality);
    }
  }
  
  /**
   * Delete all variants of a photo
   */
  async deletePhoto(photoId: string): Promise<void> {
    const qualities: QualityLevel[] = ['thumbnail', 'low', 'medium', 'high', 'print'];
    
    await Promise.all(
      qualities.map(quality => this.delete(photoId, quality))
    );
  }
  
  /**
   * Clear all caches
   */
  async clear(): Promise<void> {
    console.log('[UnifiedCache] Clearing all caches');
    
    memoryCacheManager.clear();
    await indexedDBManager.clear();
    
    if (opfsCacheService.isEnabled()) {
      await opfsCacheService.clear();
    }
  }
  
  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    this.stats.hitRate = this.stats.totalRequests > 0
      ? ((this.stats.memoryHits + this.stats.indexedDBHits + this.stats.opfsHits) / this.stats.totalRequests) * 100
      : 0;
    
    return { ...this.stats };
  }
  
  /**
   * Reset statistics
   */
  resetStats(): void {
    this.stats = {
      memoryHits: 0,
      indexedDBHits: 0,
      opfsHits: 0,
      networkHits: 0,
      totalRequests: 0,
      hitRate: 0,
    };
  }
  
  /**
   * Prefetch image and store in cache
   */
  async prefetch(photoId: string, quality: QualityLevel): Promise<void> {
    // Check if already cached
    const cached = await this.get(photoId, quality);
    if (cached) {
      console.log('[UnifiedCache] Already cached:', { photoId, quality });
      return;
    }
    
    // Fetch from network WITH AUTHENTICATION
    const url = `/v2/photos/${photoId}/variant/${quality}`;
    
    try {
      // Get auth token from localStorage
      const token = localStorage.getItem('auth_token');
      
      // Add Authorization header
      const headers: HeadersInit = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch(url, {
        headers,
        credentials: 'include', // Include cookies
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const blob = await response.blob();
      await this.set(photoId, quality, blob);
      
      console.log('[UnifiedCache] Prefetched:', { photoId, quality });
    } catch (error) {
      console.error('[UnifiedCache] Prefetch failed:', error);
    }
  }
  
  /**
   * Batch prefetch multiple images
   */
  async prefetchBatch(
    requests: Array<{ photoId: string; quality: QualityLevel }>
  ): Promise<void> {
    console.log(`[UnifiedCache] Prefetching ${requests.length} images`);
    
    await Promise.allSettled(
      requests.map(req => this.prefetch(req.photoId, req.quality))
    );
  }
}

// Singleton instance
export const unifiedCacheManager = new UnifiedCacheManager();

// Expose to window for debugging
if (typeof window !== 'undefined') {
  (window as any).__unifiedCache = {
    get: (photoId: string, quality: string) => unifiedCacheManager.get(photoId, quality as QualityLevel),
    set: (photoId: string, quality: string, blob: Blob) => unifiedCacheManager.set(photoId, quality as QualityLevel, blob),
    delete: (photoId: string, quality: string) => unifiedCacheManager.delete(photoId, quality as QualityLevel),
    clear: () => unifiedCacheManager.clear(),
    stats: () => unifiedCacheManager.getStats(),
    prefetch: (photoId: string, quality: string) => unifiedCacheManager.prefetch(photoId, quality as QualityLevel),
  };
}

export default unifiedCacheManager;
