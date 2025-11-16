/**
 * Development Environment Configuration
 * 
 * Overrides for local development.
 * More verbose logging, lower thresholds for testing.
 */

import { CacheStrategyConfig } from './cache-strategy.config';
import defaultConfig from './cache-strategy.config';

export const devConfig: Partial<CacheStrategyConfig> = {
  ...defaultConfig,
  
  // Enable Stages 2, 3 & 4: Memory Cache + IndexedDB + Role-Based Strategy
  features: {
    memoryCache: true,           // ✅ Stage 2 enabled!
    indexedDBCache: true,         // ✅ Stage 3 enabled!
    serviceWorkerCache: true,     // ✅ Stage 3.5 ENABLED! (image caching)
    roleBasedStrategy: true,      // ✅ Stage 4 ENABLED!
    prefetching: false,           // Stage 4+ (future enhancement)
    virtualScrolling: false,      // Stage 4+ (future enhancement)
    photoHoverPreview: true,      // Manual mapping enhancement
  },
  
  monitoring: {
    enableLogging: true,
    logLevel: 'debug',           // Verbose logging in dev
    enableMetrics: true,
    metricsInterval: 2000,       // Update metrics every 2s
    enableDevDashboard: true,    // Show metrics dashboard
  },
  
  profiles: {
    client: {
      ...defaultConfig.profiles.client,
      maxMemoryMB: 150,          // Lower threshold for testing
      hoverPrefetchDelayMs: 100, // Faster prefetch for testing
    },
    studio: {
      ...defaultConfig.profiles.studio,
      maxActiveProjects: 5,      // Lower for easier testing
      maxMemoryMB: 250,          // Lower threshold for testing
      idleTimeoutMinutes: 5,     // Shorter timeout for testing
    },
  },
  
  eviction: {
    studio: {
      idleTimeoutMinutes: 5,     // 5 minutes in dev (easier to test)
      lruSlots: 5,               // Lower for testing
      scoringWeights: {
        lastAccess: 40,
        frequency: 30,
        size: 20,
        pinned: 10,
      },
    },
  },
};

export default devConfig;
