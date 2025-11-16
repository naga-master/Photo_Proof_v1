/**
 * Cache Strategy Configuration
 * 
 * Central configuration for all caching behavior.
 * All cache-related logic reads from this config.
 * 
 * HOT-RELOADABLE: Changes reflect immediately in dev mode.
 */

export interface ClientCacheProfile {
  maxProjects: number;          // -1 = unlimited
  maxMemoryMB: number;
  maxIndexedDBMB: number;
  maxServiceWorkerMB: number;
  prefetchStrategy: 'aggressive' | 'conservative' | 'off';
  prefetchCount: number;        // Number of recent projects to prefetch
  hoverPrefetchDelayMs: number; // Delay before prefetch on hover
}

export interface StudioCacheProfile {
  maxActiveProjects: number;    // Max projects in memory
  maxMemoryMB: number;
  maxIndexedDBMB: number;
  maxServiceWorkerMB: number;
  prefetchStrategy: 'aggressive' | 'conservative' | 'off';
  virtualScrolling: boolean;
  idleTimeoutMinutes: number;   // Auto-evict after idle
}

export interface StorageQuota {
  greenThresholdMB: number;   // Normal operation
  yellowThresholdMB: number;  // Soft cleanup
  redThresholdMB: number;     // Aggressive eviction
}

export interface EvictionConfig {
  idleTimeoutMinutes: number;
  lruSlots: number;
  scoringWeights: {
    lastAccess: number;        // 0-100
    frequency: number;         // 0-100
    size: number;              // 0-100
    pinned: number;            // 0-100
  };
}

export interface TTLConfig {
  memoryMs: number;
  indexedDBMs: number;
  serviceWorkerMs: number;
}

export interface APIConfig {
  endpoints: {
    projectsList: string;
    projectsFull: string;
    photosMetadata: string;
  };
  compression: 'brotli' | 'gzip' | 'none';
}

export interface MonitoringConfig {
  enableLogging: boolean;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  enableMetrics: boolean;
  metricsInterval: number; // ms
  enableDevDashboard: boolean;
}

export interface FeatureFlags {
  memoryCache: boolean;
  indexedDBCache: boolean;
  serviceWorkerCache: boolean;
  roleBasedStrategy: boolean;
  prefetching: boolean;
  virtualScrolling: boolean;
  photoHoverPreview: boolean;
}

export interface CacheStrategyConfig {
  profiles: {
    client: ClientCacheProfile;
    studio: StudioCacheProfile;
  };
  ttl: TTLConfig;
  quotas: {
    client: StorageQuota;
    studio: StorageQuota;
  };
  eviction: {
    studio: EvictionConfig;
  };
  api: APIConfig;
  monitoring: MonitoringConfig;
  features: FeatureFlags;
}

/**
 * Default Configuration
 * 
 * This is the base configuration used in all environments.
 * Override specific values in environment-specific configs.
 */
export const defaultConfig: CacheStrategyConfig = {
  profiles: {
    client: {
      maxProjects: -1,              // Unlimited
      maxMemoryMB: 300,
      maxIndexedDBMB: 100,
      maxServiceWorkerMB: 200,
      prefetchStrategy: 'aggressive',
      prefetchCount: 3,
      hoverPrefetchDelayMs: 300,
    },
    studio: {
      maxActiveProjects: 10,        // LRU limit
      maxMemoryMB: 500,
      maxIndexedDBMB: 100,
      maxServiceWorkerMB: 1000,
      prefetchStrategy: 'conservative',
      virtualScrolling: true,
      idleTimeoutMinutes: 30,
    },
  },
  
  ttl: {
    memoryMs: 5 * 60 * 1000,        // 5 minutes
    indexedDBMs: 24 * 60 * 60 * 1000, // 24 hours
    serviceWorkerMs: 7 * 24 * 60 * 60 * 1000, // 7 days
  },
  
  quotas: {
    client: {
      greenThresholdMB: 200,
      yellowThresholdMB: 250,
      redThresholdMB: 300,
    },
    studio: {
      greenThresholdMB: 500,
      yellowThresholdMB: 800,
      redThresholdMB: 1000,
    },
  },
  
  eviction: {
    studio: {
      idleTimeoutMinutes: 30,
      lruSlots: 10,
      scoringWeights: {
        lastAccess: 40,
        frequency: 30,
        size: 20,
        pinned: 10,
      },
    },
  },
  
  api: {
    endpoints: {
      projectsList: '/api/projects?mode=list',
      projectsFull: '/api/projects?mode=full',
      photosMetadata: '/v2/photos?metadata_only=true',
    },
    compression: 'gzip', // Will upgrade to brotli when backend supports
  },
  
  monitoring: {
    enableLogging: true,
    logLevel: 'info',
    enableMetrics: true,
    metricsInterval: 5000, // 5 seconds
    enableDevDashboard: true,
  },
  
  features: {
    memoryCache: false,           // Stage 2
    indexedDBCache: false,         // Stage 3
    serviceWorkerCache: false,     // Stage 3
    roleBasedStrategy: false,      // Stage 4
    prefetching: false,            // Stage 4
    virtualScrolling: false,       // Stage 4
    photoHoverPreview: true,       // Manual mapping enhancement
  },
};

export default defaultConfig;
