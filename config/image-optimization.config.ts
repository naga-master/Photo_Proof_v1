/**
 * Image Optimization Configuration
 * 
 * Central configuration for all 5-layer rural network optimization features.
 * All optimization behavior is controlled through this configuration.
 * 
 * Layers:
 * 1. Upload Resilience (Chunked Upload)
 * 2. Smart Compression (Client + Server)
 * 3. Intelligent Caching (OPFS + Service Worker)
 * 4. Network Adaptation (Quality Selection)
 * 5. Offline Queue (Background Sync)
 */

// ========================================
// TYPE DEFINITIONS
// ========================================

export type QualityLevel = 'thumbnail' | 'low' | 'medium' | 'high' | 'print';
export type NetworkType = 'slow-2g' | '2g' | '3g' | '4g' | 'wifi';
export type CacheStrategy = 'cache-first' | 'network-first' | 'stale-while-revalidate' | 'network-only';
export type EvictionStrategy = 'lru' | 'fifo' | 'lfu';

// ========================================
// CONFIGURATION INTERFACE
// ========================================

export interface ImageOptimizationConfig {
  // ========================================
  // MASTER FEATURE FLAGS
  // ========================================
  features: {
    chunkedUpload: boolean;
    serverSideVariants: boolean;
    viewportQualitySelection: boolean;
    opfsCache: boolean;
    networkAdaptation: boolean;
    offlineQueue: boolean;
    backgroundSync: boolean;
  };
  
  // ========================================
  // PHASE 1: CHUNKED UPLOAD
  // ========================================
  chunkedUpload: {
    enabled: boolean;
    
    // Hybrid mode settings - automatically switch between standard and chunked upload
    useHybridMode: boolean;          // Enable auto-switching based on file size
    fileSizeThresholdMB: number;     // Switch to chunked for files larger than this (default: 10MB)
    
    defaultChunkSizeMB: number;
    minChunkSizeMB: number;
    maxChunkSizeMB: number;
    adaptiveChunking: boolean;
    maxRetries: number;
    retryDelayMs: number;
    exponentialBackoff: boolean;
    timeoutMs: number;
    parallelChunks: number;
    
    networkProfiles: {
      [K in NetworkType]: {
        chunkSizeMB: number;
        parallel: number;
        timeoutMs: number;
      };
    };
    
    progressUpdateIntervalMs: number;
    enableDetailedLogging: boolean;
  };
  
  // ========================================
  // PHASE 2: BACKEND IMAGE OPTIMIZATION
  // ========================================
  compression: {
    server: {
      enabled: boolean;
      variants: {
        [K in QualityLevel]: {
          width: number | null;
          quality: number;
        };
      };
      format: 'webp' | 'jpeg';
      generateAsync: boolean;
      maxProcessingTimeMs: number;
    };
    
    thumbhash: {
      enabled: boolean;
      dimensions: {
        width: number;
        height: number;
      };
      generateOnServer: boolean;
    };
  };
  
  // ========================================
  // PHASE 2.5: VIEWPORT-AWARE QUALITY
  // ========================================
  viewportQuality: {
    enabled: boolean;
    
    breakpoints: {
      mobile: {
        maxWidth: number;
        quality: QualityLevel;
      };
      tablet: {
        maxWidth: number;
        quality: QualityLevel;
      };
      desktop: {
        maxWidth: number;
        quality: QualityLevel;
      };
      retina: {
        minPixelRatio: number;
        upgradeQuality: boolean;
      };
      fourK: {
        minWidth: number;
        quality: QualityLevel;
      };
    };
    
    progressive: {
      enabled: boolean;
      placeholderQuality: QualityLevel;
      transitionDurationMs: number;
      blurIntensity: number;
    };
    
    combinedStrategy: {
      enabled: boolean;
      prioritizeViewport: boolean;
      rules: {
        viewportOverridesNetwork: boolean;
        networkOverridesViewport: boolean;
        maxDowngradeSteps: number;
        maxUpgradeSteps: number;
      };
    };
  };
  
  // ========================================
  // PHASE 3: OPFS CACHE
  // ========================================
  opfs: {
    enabled: boolean;
    maxSizeMB: number;
    autoEviction: boolean;
    evictionThresholdPercent: number;
    evictionStrategy: EvictionStrategy;
    
    directoryStructure: {
      root: string;
      images: string;
      qualities: QualityLevel[];
    };
    
    quotas: {
      greenZonePercent: number;
      yellowZonePercent: number;
      redZonePercent: number;
    };
    
    cleanup: {
      evictPercentOnYellow: number;
      evictPercentOnRed: number;
      minFileAgeDays: number;
    };
  };
  
  // ========================================
  // PHASE 3: SERVICE WORKER
  // ========================================
  serviceWorker: {
    enabled: boolean;
    version: string;
    
    cacheNames: {
      images: string;
      covers: string;
      api: string;
    };
    
    strategies: {
      galleryImages: CacheStrategy;
      coverPhotos: CacheStrategy;
      apiCalls: CacheStrategy;
    };
    
    cacheLimits: {
      maxImageCacheMB: number;
      maxCoverCacheMB: number;
      maxApiCacheMB: number;
      maxItemsPerCache: number;
    };
    
    expirationDays: {
      images: number;
      covers: number;
      api: number;
    };
    
    waterfall: {
      enabled: boolean;
      preferHigherQuality: boolean;
      fallbackToLowerOnSlow: boolean;
    };
    
    debug: boolean;
  };
  
  // ========================================
  // PHASE 4: NETWORK ADAPTATION
  // ========================================
  networkAdaptation: {
    enabled: boolean;
    
    detection: {
      method: 'api' | 'performance' | 'hybrid';
      intervalMs: number;
      testFileUrl: string;
      testFileSizeKB: number;
      performanceBasedThreshold: {
        [K in NetworkType]: number;
      };
    };
    
    qualityMapping: {
      [K in NetworkType]: QualityLevel;
    };
    
    dataSaver: {
      respectBrowserSetting: boolean;
      downgradeQualityLevels: number;
    };
    
    autoSwitch: {
      enabled: boolean;
      debounceMs: number;
      reloadImages: boolean;
      smoothTransition: boolean;
    };
  };
  
  // ========================================
  // PHASE 5: OFFLINE QUEUE
  // ========================================
  offlineQueue: {
    enabled: boolean;
    
    queue: {
      maxQueueSize: number;
      persistToIndexedDB: boolean;
      storeFilesInOPFS: boolean;
      autoProcessOnline: boolean;
    };
    
    processing: {
      maxConcurrentUploads: number;
      processingIntervalMs: number;
      priorityLevels: number[];
    };
    
    retry: {
      maxRetries: number;
      retryDelayMs: number;
      exponentialBackoff: boolean;
      resetRetriesOnNetworkRestore: boolean;
    };
    
    backgroundSync: {
      enabled: boolean;
      syncTag: string;
      maxSyncDurationMs: number;
      periodicSyncIntervalMs: number;
    };
    
    notifications: {
      enabled: boolean;
      showOnComplete: boolean;
      showOnError: boolean;
      playSound: boolean;
    };
    
    optimisticUI: {
      enabled: boolean;
      showAsProcessing: boolean;
      revertOnFailure: boolean;
    };
  };
  
  // ========================================
  // MONITORING & DEBUG
  // ========================================
  monitoring: {
    enabled: boolean;
    logLevel: 'debug' | 'info' | 'warn' | 'error';
    
    metrics: {
      trackUploadSpeed: boolean;
      trackCacheHitRate: boolean;
      trackNetworkChanges: boolean;
      trackCompressionRatio: boolean;
      trackQueueLength: boolean;
    };
    
    reporting: {
      sendToAnalytics: boolean;
      analyticsEndpoint: string;
      batchSize: number;
      flushIntervalMs: number;
    };
    
    dashboard: {
      enabled: boolean;
      refreshIntervalMs: number;
      showRealTimeCharts: boolean;
      exportCSV: boolean;
    };
  };
  
  debug: {
    enableVerboseLogging: boolean;
    simulateSlowNetwork: boolean;
    simulatedNetworkType: NetworkType | null;
    simulatedLatencyMs: number;
    simulatedPacketLoss: number;
    bypassCache: boolean;
    forceReprocessing: boolean;
  };
}

// ========================================
// DEFAULT CONFIGURATION
// ========================================

export const defaultImageOptimizationConfig: ImageOptimizationConfig = {
  // Master feature flags - All OFF by default for safe rollout
  features: {
    chunkedUpload: false,
    clientSideCompression: false,
    serverSideVariants: false,
    viewportQualitySelection: false,
    opfsCache: false,
    networkAdaptation: false,
    offlineQueue: false,
    backgroundSync: false,
  },
  
  // Phase 1: Chunked Upload
  chunkedUpload: {
    enabled: false,
    
    // Hybrid mode - automatically switch between standard and chunked upload
    useHybridMode: true,          // Enable auto-switching (default: true)
    fileSizeThresholdMB: 10,      // Files >10MB use chunked upload
    
    defaultChunkSizeMB: 2,
    minChunkSizeMB: 0.5,
    maxChunkSizeMB: 5,
    adaptiveChunking: true,
    maxRetries: 5,
    retryDelayMs: 1000,
    exponentialBackoff: true,
    timeoutMs: 60000,
    parallelChunks: 3,
    
    networkProfiles: {
      'slow-2g': { chunkSizeMB: 0.5, parallel: 1, timeoutMs: 120000 },
      '2g': { chunkSizeMB: 1, parallel: 1, timeoutMs: 90000 },
      '3g': { chunkSizeMB: 2, parallel: 2, timeoutMs: 60000 },
      '4g': { chunkSizeMB: 5, parallel: 3, timeoutMs: 30000 },
      'wifi': { chunkSizeMB: 5, parallel: 5, timeoutMs: 30000 },
    },
    
    progressUpdateIntervalMs: 500,
    enableDetailedLogging: false,
  },
  
  // Phase 2: Image Compression
  compression: {
    client: {
      enabled: false,
      targetSizeMB: 5,
      maxDimensionPx: 4096,
      format: 'webp',
      quality: {
        initial: 0.9,
        minimum: 0.5,
        step: 0.1,
      },
      maintainAspectRatio: true,
      enableExifPreservation: false,
    },
    
    server: {
      enabled: false,
      variants: {
        thumbnail: { width: 200, quality: 60 },
        low: { width: 800, quality: 70 },
        medium: { width: 1920, quality: 80 },
        high: { width: 3840, quality: 90 },
        print: { width: null, quality: 95 },
      },
      format: 'webp',
      generateAsync: true,
      maxProcessingTimeMs: 30000,
    },
    
    thumbhash: {
      enabled: false,
      dimensions: { width: 32, height: 32 },
      generateOnClient: true,
      generateOnServer: false,
    },
  },
  
  // Phase 2.5: Viewport-Aware Quality
  viewportQuality: {
    enabled: false,
    
    breakpoints: {
      mobile: {
        maxWidth: 480,
        quality: 'low',
      },
      tablet: {
        maxWidth: 1024,
        quality: 'medium',
      },
      desktop: {
        maxWidth: 1920,
        quality: 'high',
      },
      retina: {
        minPixelRatio: 2.0,
        upgradeQuality: true,
      },
      fourK: {
        minWidth: 2560,
        quality: 'print',
      },
    },
    
    progressive: {
      enabled: true,
      placeholderQuality: 'thumbnail',
      transitionDurationMs: 300,
      blurIntensity: 20,
    },
    
    combinedStrategy: {
      enabled: true,
      prioritizeViewport: false,
      rules: {
        viewportOverridesNetwork: false,
        networkOverridesViewport: true,
        maxDowngradeSteps: 2,
        maxUpgradeSteps: 1,
      },
    },
  },
  
  // Phase 3: OPFS Cache
  opfs: {
    enabled: false,
    maxSizeMB: 1000,
    autoEviction: true,
    evictionThresholdPercent: 90,
    evictionStrategy: 'lru',
    
    directoryStructure: {
      root: 'cache',
      images: 'cache/images',
      qualities: ['thumbnail', 'low', 'medium', 'high', 'print'],
    },
    
    quotas: {
      greenZonePercent: 70,
      yellowZonePercent: 80,
      redZonePercent: 90,
    },
    
    cleanup: {
      evictPercentOnYellow: 25,
      evictPercentOnRed: 50,
      minFileAgeDays: 7,
    },
  },
  
  // Phase 3: Service Worker
  serviceWorker: {
    enabled: false,
    version: 'v3-optimization',
    
    cacheNames: {
      images: 'photo-proof-images-v3',
      covers: 'photo-proof-covers-v3',
      api: 'photo-proof-api-v3',
    },
    
    strategies: {
      galleryImages: 'cache-first',
      coverPhotos: 'stale-while-revalidate',
      apiCalls: 'network-only',
    },
    
    cacheLimits: {
      maxImageCacheMB: 500,
      maxCoverCacheMB: 100,
      maxApiCacheMB: 50,
      maxItemsPerCache: 1000,
    },
    
    expirationDays: {
      images: 30,
      covers: 7,
      api: 1,
    },
    
    waterfall: {
      enabled: true,
      preferHigherQuality: true,
      fallbackToLowerOnSlow: true,
    },
    
    debug: false,
  },
  
  // Phase 4: Network Adaptation
  networkAdaptation: {
    enabled: false,
    
    detection: {
      method: 'hybrid',
      intervalMs: 30000,
      testFileUrl: '/api/network-test',
      testFileSizeKB: 100,
      performanceBasedThreshold: {
        'slow-2g': 0.5,
        '2g': 3,
        '3g': 10,
        '4g': 30,
        'wifi': 50,
      },
    },
    
    qualityMapping: {
      'slow-2g': 'thumbnail',
      '2g': 'low',
      '3g': 'medium',
      '4g': 'high',
      'wifi': 'high',
    },
    
    dataSaver: {
      respectBrowserSetting: true,
      downgradeQualityLevels: 1,
    },
    
    autoSwitch: {
      enabled: true,
      debounceMs: 5000,
      reloadImages: true,
      smoothTransition: true,
    },
  },
  
  // Phase 5: Offline Queue
  offlineQueue: {
    enabled: false,
    
    queue: {
      maxQueueSize: 100,
      persistToIndexedDB: true,
      storeFilesInOPFS: true,
      autoProcessOnline: true,
    },
    
    processing: {
      maxConcurrentUploads: 3,
      processingIntervalMs: 5000,
      priorityLevels: [1, 2, 3, 4, 5],
    },
    
    retry: {
      maxRetries: 5,
      retryDelayMs: 10000,
      exponentialBackoff: true,
      resetRetriesOnNetworkRestore: true,
    },
    
    backgroundSync: {
      enabled: false,
      syncTag: 'upload-sync',
      maxSyncDurationMs: 300000,
      periodicSyncIntervalMs: 3600000,
    },
    
    notifications: {
      enabled: true,
      showOnComplete: true,
      showOnError: true,
      playSound: false,
    },
    
    optimisticUI: {
      enabled: true,
      showAsProcessing: true,
      revertOnFailure: true,
    },
  },
  
  // Monitoring & Analytics
  monitoring: {
    enabled: true,
    logLevel: 'info',
    
    metrics: {
      trackUploadSpeed: true,
      trackCacheHitRate: true,
      trackNetworkChanges: true,
      trackCompressionRatio: true,
      trackQueueLength: true,
    },
    
    reporting: {
      sendToAnalytics: false,
      analyticsEndpoint: '/api/analytics',
      batchSize: 50,
      flushIntervalMs: 60000,
    },
    
    dashboard: {
      enabled: true,
      refreshIntervalMs: 5000,
      showRealTimeCharts: true,
      exportCSV: true,
    },
  },
  
  // Debug & Testing
  debug: {
    enableVerboseLogging: false,
    simulateSlowNetwork: false,
    simulatedNetworkType: null,
    simulatedLatencyMs: 0,
    simulatedPacketLoss: 0,
    bypassCache: false,
    forceReprocessing: false,
  },
};

export default defaultImageOptimizationConfig;
