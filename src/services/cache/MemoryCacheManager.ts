/**
 * Memory Cache Manager
 * 
 * In-memory caching with TTL, LRU eviction, and role-based strategies.
 * 
 * Features:
 * - TTL-based expiration
 * - LRU eviction for studio users
 * - Unlimited cache for client users
 * - Memory usage tracking
 * - Event emission for all operations
 */

import { cacheEvents, CacheEventType, CacheSource } from '../cache-events/CacheEventEmitter';
import { configLoader } from '../ConfigLoader';
import { roleDetector } from '../auth/RoleDetector';

interface CacheEntry<T> {
  key: string;
  data: T;
  timestamp: number;
  expiresAt: number;
  size: number; // Estimated size in bytes
  accessCount: number;
  lastAccessTime: number;
  pinned?: boolean; // Prevent eviction
}

interface CacheStats {
  hits: number;
  misses: number;
  sets: number;
  evictions: number;
  totalSize: number;
  entryCount: number;
}

class MemoryCacheManager {
  private cache: Map<string, CacheEntry<any>>;
  private stats: CacheStats;
  private maxSizeMB: number;
  private evictionCheckInterval?: NodeJS.Timeout;

  constructor() {
    this.cache = new Map();
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      evictions: 0,
      totalSize: 0,
      entryCount: 0,
    };
    this.maxSizeMB = 500; // Default
    this.initialize();
  }

  private initialize(): void {
    // Set max size based on role
    const profile = roleDetector.getCurrentProfile();
    if (profile) {
      this.maxSizeMB = profile.cacheProfile.maxMemoryMB;
    }

    // Listen for role changes
    roleDetector.subscribe((profile) => {
      this.maxSizeMB = profile.cacheProfile.maxMemoryMB;
      this.checkEvictionNeeded();
    });

    // Periodic cleanup of expired entries
    this.evictionCheckInterval = setInterval(() => {
      this.cleanupExpired();
    }, 60000); // Every minute
  }

  /**
   * Get value from cache
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.stats.misses++;
      
      cacheEvents.emit({
        type: CacheEventType.CACHE_MISS,
        metadata: {
          source: 'memory' as CacheSource,
          key,
        },
      });
      
      return null;
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      this.stats.misses++;
      this.stats.evictions++;
      
      cacheEvents.emit({
        type: CacheEventType.CACHE_MISS,
        metadata: {
          source: 'memory' as CacheSource,
          key,
          reason: 'expired',
        },
      });
      
      cacheEvents.emit({
        type: CacheEventType.CACHE_EVICT,
        metadata: {
          key,
          reason: 'expired',
        },
      });
      
      return null;
    }

    // Update access statistics
    entry.accessCount++;
    entry.lastAccessTime = Date.now();
    
    this.stats.hits++;
    
    cacheEvents.emit({
      type: CacheEventType.CACHE_HIT,
      metadata: {
        source: 'memory' as CacheSource,
        key,
        accessCount: entry.accessCount,
      },
    });
    
    return entry.data;
  }

  /**
   * Set value in cache
   */
  set<T>(key: string, data: T, options?: {
    ttl?: number; // Override TTL in milliseconds
    pinned?: boolean; // Prevent eviction
  }): void {
    const config = configLoader.getConfig();
    const ttl = options?.ttl || config.ttl.memoryMs;
    const size = this.estimateSize(data);

    const entry: CacheEntry<T> = {
      key,
      data,
      timestamp: Date.now(),
      expiresAt: Date.now() + ttl,
      size,
      accessCount: 0,
      lastAccessTime: Date.now(),
      pinned: options?.pinned || false,
    };

    // Check if we need to evict before adding
    const wouldExceedLimit = this.stats.totalSize + size > this.maxSizeMB * 1024 * 1024;
    
    if (wouldExceedLimit && configLoader.isFeatureEnabled('memoryCache')) {
      this.evictToMakeSpace(size);
    }

    // Remove old entry if exists
    if (this.cache.has(key)) {
      const oldEntry = this.cache.get(key)!;
      this.stats.totalSize -= oldEntry.size;
    }

    this.cache.set(key, entry);
    this.stats.totalSize += size;
    this.stats.entryCount = this.cache.size;
    this.stats.sets++;

    cacheEvents.emit({
      type: CacheEventType.CACHE_SET,
      metadata: {
        source: 'memory' as CacheSource,
        key,
        size,
        ttl,
        pinned: entry.pinned,
      },
    });
  }

  /**
   * Check if key exists and is not expired
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;
    
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }

  /**
   * Delete specific key
   */
  delete(key: string): void {
    const entry = this.cache.get(key);
    if (entry) {
      this.stats.totalSize -= entry.size;
      this.cache.delete(key);
      this.stats.entryCount = this.cache.size;
      
      cacheEvents.emit({
        type: CacheEventType.CACHE_EVICT,
        metadata: {
          key,
          reason: 'manual',
        },
      });
    }
  }

  /**
   * Clear all cache
   */
  clear(): void {
    const count = this.cache.size;
    this.cache.clear();
    this.stats.totalSize = 0;
    this.stats.entryCount = 0;
    
    cacheEvents.emit({
      type: CacheEventType.CACHE_CLEAR,
      metadata: {
        source: 'memory',
        count,
      },
    });
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats & {
    hitRate: number;
    sizeMB: number;
    maxSizeMB: number;
    utilizationPercent: number;
  } {
    const total = this.stats.hits + this.stats.misses;
    const hitRate = total > 0 ? (this.stats.hits / total) * 100 : 0;
    const sizeMB = this.stats.totalSize / (1024 * 1024);
    const utilizationPercent = (sizeMB / this.maxSizeMB) * 100;
    
    return {
      ...this.stats,
      hitRate,
      sizeMB,
      maxSizeMB: this.maxSizeMB,
      utilizationPercent,
    };
  }

  /**
   * LRU Eviction - Remove least recently used entries
   */
  private evictToMakeSpace(requiredBytes: number): void {
    const profile = roleDetector.getCurrentProfile();
    
    // Client users: unlimited cache (only evict if absolutely necessary)
    if (profile?.role === 'client') {
      // Only evict expired entries
      this.cleanupExpired();
      return;
    }

    // Studio users: LRU eviction
    const entries = Array.from(this.cache.entries())
      .map(([key, entry]) => ({ key, entry }))
      .filter(({ entry }) => !entry.pinned); // Don't evict pinned entries

    if (entries.length === 0) return;

    // Sort by LRU score (lower score = evict first)
    const config = configLoader.getConfig();
    const weights = config.eviction.studio.scoringWeights;
    
    entries.sort((a, b) => {
      const scoreA = this.calculateEvictionScore(a.entry, weights);
      const scoreB = this.calculateEvictionScore(b.entry, weights);
      return scoreB - scoreA; // Higher score = keep (so reverse sort)
    });

    // Evict entries until we have enough space
    let freedSpace = 0;
    const targetSpace = requiredBytes * 1.2; // Evict 20% more than needed
    
    for (const { key, entry } of entries) {
      if (freedSpace >= targetSpace) break;
      
      this.stats.totalSize -= entry.size;
      this.cache.delete(key);
      freedSpace += entry.size;
      this.stats.evictions++;
      
      cacheEvents.emit({
        type: CacheEventType.CACHE_EVICT,
        metadata: {
          key,
          reason: 'lru',
          size: entry.size,
          score: this.calculateEvictionScore(entry, weights),
        },
      });
    }
    
    this.stats.entryCount = this.cache.size;
  }

  /**
   * Calculate eviction score (higher = keep longer)
   */
  private calculateEvictionScore(
    entry: CacheEntry<any>,
    weights: { lastAccess: number; frequency: number; size: number; pinned: number }
  ): number {
    const now = Date.now();
    const ageMinutes = (now - entry.lastAccessTime) / 60000;
    
    // Normalize factors (0-100 scale)
    const lastAccessScore = Math.max(0, 100 - ageMinutes); // Newer = higher
    const frequencyScore = Math.min(100, entry.accessCount * 10); // More accesses = higher
    const sizeScore = 100 - Math.min(100, (entry.size / (1024 * 1024)) * 10); // Smaller = higher
    const pinnedScore = entry.pinned ? 100 : 0;
    
    // Weighted sum
    const score = (
      (lastAccessScore * weights.lastAccess) +
      (frequencyScore * weights.frequency) +
      (sizeScore * weights.size) +
      (pinnedScore * weights.pinned)
    ) / 100;
    
    return score;
  }

  /**
   * Check if eviction is needed based on limits
   */
  private checkEvictionNeeded(): void {
    const profile = roleDetector.getCurrentProfile();
    
    if (profile?.role === 'studio') {
      const maxProjects = (profile.cacheProfile as any).maxActiveProjects || 10;
      
      // Count project entries
      const projectKeys = Array.from(this.cache.keys()).filter(k => k.startsWith('project:'));
      
      if (projectKeys.length > maxProjects) {
        // Evict oldest projects
        const entries = projectKeys.map(key => ({
          key,
          entry: this.cache.get(key)!,
        }));
        
        entries.sort((a, b) => a.entry.lastAccessTime - b.entry.lastAccessTime);
        
        const toEvict = entries.slice(0, entries.length - maxProjects);
        toEvict.forEach(({ key, entry }) => {
          this.stats.totalSize -= entry.size;
          this.cache.delete(key);
          this.stats.evictions++;
          
          cacheEvents.emit({
            type: CacheEventType.CACHE_EVICT,
            metadata: {
              key,
              reason: 'project_limit',
              maxProjects,
            },
          });
        });
        
        this.stats.entryCount = this.cache.size;
      }
    }
  }

  /**
   * Cleanup expired entries
   */
  private cleanupExpired(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];
    
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        keysToDelete.push(key);
      }
    }
    
    keysToDelete.forEach(key => {
      const entry = this.cache.get(key);
      if (entry) {
        this.stats.totalSize -= entry.size;
        this.cache.delete(key);
        this.stats.evictions++;
        
        cacheEvents.emit({
          type: CacheEventType.CACHE_EVICT,
          metadata: {
            key,
            reason: 'expired',
          },
        });
      }
    });
    
    if (keysToDelete.length > 0) {
      this.stats.entryCount = this.cache.size;
      
      cacheEvents.emit({
        type: CacheEventType.STORAGE_CLEANUP,
        metadata: {
          source: 'memory',
          count: keysToDelete.length,
        },
      });
    }
  }

  /**
   * Estimate size of data in bytes (rough estimate)
   */
  private estimateSize(data: any): number {
    try {
      const json = JSON.stringify(data);
      return new Blob([json]).size;
    } catch {
      // Fallback for circular references
      return 1024; // 1KB default
    }
  }

  /**
   * Cleanup on destroy
   */
  destroy(): void {
    if (this.evictionCheckInterval) {
      clearInterval(this.evictionCheckInterval);
    }
    this.clear();
  }
}

// Singleton instance
export const memoryCacheManager = new MemoryCacheManager();

// Expose to window for debugging
if (typeof window !== 'undefined') {
  (window as any).__cache = {
    stats: () => memoryCacheManager.getStats(),
    clear: () => memoryCacheManager.clear(),
    get: (key: string) => memoryCacheManager.get(key),
    set: (key: string, data: any, options?: { ttl?: number }) => memoryCacheManager.set(key, data, options),
    has: (key: string) => memoryCacheManager.has(key),
  };
}

export default memoryCacheManager;
