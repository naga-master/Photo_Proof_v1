/**
 * Production Environment Configuration
 * 
 * Overrides for production deployment.
 * Less logging, higher thresholds.
 */

import { CacheStrategyConfig } from './cache-strategy.config';
import defaultConfig from './cache-strategy.config';

export const prodConfig: Partial<CacheStrategyConfig> = {
  ...defaultConfig,
  
  monitoring: {
    enableLogging: true,
    logLevel: 'warn',            // Only warnings and errors
    enableMetrics: true,
    metricsInterval: 10000,      // Update metrics every 10s
    enableDevDashboard: false,   // Hide dev dashboard in production
  },
  
  // Use default production values from defaultConfig
  profiles: defaultConfig.profiles,
  quotas: defaultConfig.quotas,
  eviction: defaultConfig.eviction,
};

export default prodConfig;
