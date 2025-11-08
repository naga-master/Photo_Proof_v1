/**
 * Configuration Loader Service
 * 
 * Loads environment-specific configuration.
 * Supports hot-reloading in development mode.
 */

import { CacheStrategyConfig } from '../../config/cache-strategy.config';
import defaultConfig from '../../config/cache-strategy.config';
import devConfig from '../../config/cache-strategy.dev';
import prodConfig from '../../config/cache-strategy.prod';

type Environment = 'development' | 'production' | 'test';

class ConfigLoader {
  private currentConfig: CacheStrategyConfig;
  private environment: Environment;
  private listeners: Set<(config: CacheStrategyConfig) => void>;

  constructor() {
    this.environment = this.detectEnvironment();
    this.currentConfig = this.loadConfig();
    this.listeners = new Set();
    
    // Hot reload in development
    if (this.environment === 'development' && import.meta.hot) {
      import.meta.hot.accept([
        '../../config/cache-strategy.config',
        '../../config/cache-strategy.dev',
      ], () => {
        console.log('[ConfigLoader] Configuration hot-reloaded');
        this.reload();
      });
    }
  }

  private detectEnvironment(): Environment {
    // Vite sets import.meta.env.MODE
    const mode = import.meta.env.MODE;
    
    if (mode === 'production') return 'production';
    if (mode === 'test') return 'test';
    return 'development';
  }

  private loadConfig(): CacheStrategyConfig {
    let config: CacheStrategyConfig;
    
    switch (this.environment) {
      case 'production':
        config = { ...defaultConfig, ...prodConfig };
        break;
      case 'development':
        config = { ...defaultConfig, ...devConfig };
        break;
      case 'test':
        config = { ...defaultConfig };
        break;
      default:
        config = defaultConfig;
    }
    
    // Validate configuration
    this.validateConfig(config);
    
    return config;
  }

  private validateConfig(config: CacheStrategyConfig): void {
    // Validate scoring weights sum to 100
    const weights = config.eviction.studio.scoringWeights;
    const sum = weights.lastAccess + weights.frequency + weights.size + weights.pinned;
    
    if (sum !== 100) {
      console.warn(
        `[ConfigLoader] Eviction scoring weights sum to ${sum}, expected 100. Will normalize.`
      );
    }
    
    // Validate thresholds
    const clientQuota = config.quotas.client;
    if (clientQuota.greenThresholdMB >= clientQuota.yellowThresholdMB) {
      console.warn('[ConfigLoader] Client green threshold should be less than yellow');
    }
    
    const studioQuota = config.quotas.studio;
    if (studioQuota.greenThresholdMB >= studioQuota.yellowThresholdMB) {
      console.warn('[ConfigLoader] Studio green threshold should be less than yellow');
    }
  }

  /**
   * Get current configuration
   */
  getConfig(): CacheStrategyConfig {
    return this.currentConfig;
  }

  /**
   * Get specific feature flag
   */
  isFeatureEnabled(feature: keyof CacheStrategyConfig['features']): boolean {
    return this.currentConfig.features[feature];
  }

  /**
   * Get current environment
   */
  getEnvironment(): Environment {
    return this.environment;
  }

  /**
   * Reload configuration (hot-reload support)
   */
  reload(): void {
    this.currentConfig = this.loadConfig();
    this.notifyListeners();
  }

  /**
   * Subscribe to configuration changes
   */
  subscribe(listener: (config: CacheStrategyConfig) => void): () => void {
    this.listeners.add(listener);
    
    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => {
      try {
        listener(this.currentConfig);
      } catch (error) {
        console.error('[ConfigLoader] Error in config listener:', error);
      }
    });
  }

  /**
   * Update configuration at runtime (for testing/debugging)
   * WARNING: Changes are not persisted
   */
  updateConfig(updates: Partial<CacheStrategyConfig>): void {
    if (this.environment === 'production') {
      console.warn('[ConfigLoader] Runtime config updates disabled in production');
      return;
    }
    
    this.currentConfig = {
      ...this.currentConfig,
      ...updates,
    };
    
    console.log('[ConfigLoader] Configuration updated at runtime', updates);
    this.notifyListeners();
  }
}

// Singleton instance
export const configLoader = new ConfigLoader();

// Export convenience methods
export const getConfig = () => configLoader.getConfig();
export const isFeatureEnabled = (feature: keyof CacheStrategyConfig['features']) => 
  configLoader.isFeatureEnabled(feature);
export const getEnvironment = () => configLoader.getEnvironment();

// Expose to window for debugging
if (typeof window !== 'undefined') {
  (window as any).__config = {
    get: () => configLoader.getConfig(),
    reload: () => configLoader.reload(),
    update: (updates: Partial<CacheStrategyConfig>) => configLoader.updateConfig(updates),
    env: () => configLoader.getEnvironment(),
  };
}

export default configLoader;
