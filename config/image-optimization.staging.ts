/**
 * Image Optimization Configuration - Staging Environment
 * 
 * All features enabled for pre-production testing.
 * Full logging for debugging issues before production.
 */

import { ImageOptimizationConfig } from './image-optimization.config';

export const stagingImageOptimizationConfig: Partial<ImageOptimizationConfig> = {
  // Enable all features in staging
  features: {
    chunkedUpload: true,
    clientSideCompression: true,
    serverSideVariants: true,
    viewportQualitySelection: true,
    opfsCache: true,
    networkAdaptation: true,
    offlineQueue: true,
    backgroundSync: true,
  },
  
  // Chunked Upload
  chunkedUpload: {
    enabled: true,
    enableDetailedLogging: true, // More logging in staging
  },
  
  // Compression
  compression: {
    client: {
      enabled: true,
    },
    server: {
      enabled: true,
      generateAsync: true,
    },
    thumbhash: {
      enabled: true,
    },
  },
  
  // Viewport Quality
  viewportQuality: {
    enabled: true,
  },
  
  // OPFS
  opfs: {
    enabled: true,
    maxSizeMB: 1000,
  },
  
  // Service Worker
  serviceWorker: {
    enabled: true,
    debug: true, // Debug mode in staging
    waterfall: {
      enabled: true,
    },
  },
  
  // Network Adaptation
  networkAdaptation: {
    enabled: true,
    detection: {
      method: 'hybrid',
      intervalMs: 30000,
    },
  },
  
  // Offline Queue
  offlineQueue: {
    enabled: true,
    backgroundSync: {
      enabled: true,
    },
  },
  
  // Monitoring - Full logging
  monitoring: {
    enabled: true,
    logLevel: 'debug',
    
    metrics: {
      trackUploadSpeed: true,
      trackCacheHitRate: true,
      trackNetworkChanges: true,
      trackCompressionRatio: true,
      trackQueueLength: true,
    },
    
    reporting: {
      sendToAnalytics: true, // Test analytics in staging
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
  
  // Debug - Limited debugging in staging
  debug: {
    enableVerboseLogging: true,
    simulateSlowNetwork: false,
    bypassCache: false,
    forceReprocessing: false,
  },
};

export default stagingImageOptimizationConfig;
