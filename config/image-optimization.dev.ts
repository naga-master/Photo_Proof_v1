/**
 * Image Optimization Configuration - Development Environment
 * 
 * All features enabled for testing and development.
 * Verbose logging and debug tools active.
 */

import { ImageOptimizationConfig } from './image-optimization.config';

export const devImageOptimizationConfig: Partial<ImageOptimizationConfig> = {
  // Enable all features for development testing
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
  
  // Chunked Upload - More logging in dev
  chunkedUpload: {
    enabled: true,
    enableDetailedLogging: true,
  },
  
  // Compression - Log compression ratios
  compression: {
    client: {
      enabled: true,
    },
    server: {
      enabled: true,
      generateAsync: false, // Sync in dev for immediate feedback
    },
    thumbhash: {
      enabled: true,
      generateOnClient: true,
    },
  },
  
  // Viewport Quality - Enabled
  viewportQuality: {
    enabled: true,
  },
  
  // OPFS - Enabled with smaller limits for dev
  opfs: {
    enabled: true,
    maxSizeMB: 500, // Smaller cache for dev
  },
  
  // Service Worker - Debug mode on
  serviceWorker: {
    enabled: true,
    debug: true,
  },
  
  // Network Adaptation - Enabled with shorter interval
  networkAdaptation: {
    enabled: true,
    detection: {
      method: 'hybrid',
      intervalMs: 10000, // Check more frequently in dev
    },
  },
  
  // Offline Queue - Enabled
  offlineQueue: {
    enabled: true,
    backgroundSync: {
      enabled: true,
    },
  },
  
  // Monitoring - Full logging and dashboard
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
      sendToAnalytics: false, // Don't pollute analytics in dev
    },
    
    dashboard: {
      enabled: true,
      refreshIntervalMs: 2000, // Faster refresh in dev
      showRealTimeCharts: true,
      exportCSV: true,
    },
  },
  
  // Debug - All debug tools enabled
  debug: {
    enableVerboseLogging: true,
    simulateSlowNetwork: false, // Can be toggled for testing
    simulatedNetworkType: null,
    simulatedLatencyMs: 0,
    simulatedPacketLoss: 0,
    bypassCache: false,
    forceReprocessing: false,
  },
};

export default devImageOptimizationConfig;
