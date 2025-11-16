/**
 * Image Optimization Configuration - Production Environment
 * 
 * Conservative rollout strategy.
 * Features enabled gradually via feature flags.
 * Minimal logging for performance.
 */

import { ImageOptimizationConfig } from './image-optimization.config';

export const prodImageOptimizationConfig: Partial<ImageOptimizationConfig> = {
  // Phase 1 & 2: Core upload and backend optimization enabled
  // Phase 3-5: Disabled until validated in staging
  features: {
    chunkedUpload: true,           // Phase 1: Enabled
    serverSideVariants: true,       // Phase 2: Enabled
    viewportQualitySelection: true, // Phase 2.5: Enabled
    opfsCache: false,               // Phase 3: DISABLED (enable after validation)
    networkAdaptation: false,       // Phase 4: DISABLED (enable after validation)
    offlineQueue: false,            // Phase 5: DISABLED (enable after validation)
    backgroundSync: false,          // Phase 5: DISABLED (enable after validation)
  },
  
  // Chunked Upload - Production settings
  chunkedUpload: {
    enabled: true,
    useHybridMode: true,          // Enable hybrid mode
    fileSizeThresholdMB: 10,      // 10MB threshold for production
    enableDetailedLogging: false,
    maxRetries: 5,
    exponentialBackoff: true,
  },
  
  // Backend Image Optimization - Server-side variant generation
  compression: {
    server: {
      enabled: true,
      generateAsync: true,
    },
    thumbhash: {
      enabled: true,
      generateOnServer: true,
    },
  },
  
  // Viewport Quality - Enabled
  viewportQuality: {
    enabled: true,
    progressive: {
      enabled: true,
      transitionDurationMs: 300,
    },
  },
  
  // OPFS - DISABLED for initial production rollout
  opfs: {
    enabled: false,
  },
  
  // Service Worker - Basic caching only (existing functionality)
  serviceWorker: {
    enabled: true,
    debug: false,
    waterfall: {
      enabled: false, // Disable waterfall until OPFS validated
    },
  },
  
  // Network Adaptation - DISABLED for initial rollout
  networkAdaptation: {
    enabled: false,
  },
  
  // Offline Queue - DISABLED for initial rollout
  offlineQueue: {
    enabled: false,
  },
  
  // Monitoring - Production logging
  monitoring: {
    enabled: true,
    logLevel: 'info', // Only info and above in production
    
    metrics: {
      trackUploadSpeed: true,
      trackCacheHitRate: true,
      trackNetworkChanges: true,
      trackCompressionRatio: true,
      trackQueueLength: true,
    },
    
    reporting: {
      sendToAnalytics: true, // Send to analytics in production
      batchSize: 100,        // Larger batches for efficiency
      flushIntervalMs: 120000, // Flush every 2 minutes
    },
    
    dashboard: {
      enabled: false, // Disable dashboard in production
      showRealTimeCharts: false,
      exportCSV: false,
    },
  },
  
  // Debug - All disabled in production
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

export default prodImageOptimizationConfig;
