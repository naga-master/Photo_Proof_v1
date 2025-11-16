/**
 * Image Optimization Config Loader
 * 
 * Loads and merges configuration based on environment.
 * Provides type-safe access to all optimization settings.
 * Supports hot-reload in development mode.
 */

import {
  ImageOptimizationConfig,
  defaultImageOptimizationConfig,
  QualityLevel,
  NetworkType,
} from '../config/image-optimization.config';

import devImageOptimizationConfig from '../config/image-optimization.dev';
import stagingImageOptimizationConfig from '../config/image-optimization.staging';
import prodImageOptimizationConfig from '../config/image-optimization.prod';

class ImageOptimizationConfigLoader {
  private config: ImageOptimizationConfig | null = null;
  private environment: string = 'production';
  private hotReloadInterval: number | null = null;
  
  /**
   * Initialize and load configuration
   */
  init(): void {
    this.environment = this.detectEnvironment();
    this.config = this.loadConfig();
    this.validateConfig(this.config);
    
    // Enable hot reload in development
    if (this.environment === 'development') {
      this.enableHotReload();
    }
    
    console.log(`[ImageOptimization] Config loaded for environment: ${this.environment}`);
    console.log(`[ImageOptimization] Features enabled:`, this.config.features);
  }
  
  /**
   * Detect current environment
   */
  private detectEnvironment(): string {
    // Check Vite mode
    if (import.meta.env) {
      return import.meta.env.MODE || 'production';
    }
    
    // Fallback to hostname detection
    const hostname = window.location.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'development';
    } else if (hostname.includes('staging')) {
      return 'staging';
    }
    
    return 'production';
  }
  
  /**
   * Load and merge configurations
   */
  private loadConfig(): ImageOptimizationConfig {
    // Start with default config
    const config = { ...defaultImageOptimizationConfig };
    
    // Get environment-specific config
    const envConfig = this.getEnvironmentConfig();
    
    // Deep merge environment config with default
    return this.deepMerge(config, envConfig) as ImageOptimizationConfig;
  }
  
  /**
   * Get environment-specific configuration
   */
  private getEnvironmentConfig(): Partial<ImageOptimizationConfig> {
    switch (this.environment) {
      case 'development':
        return devImageOptimizationConfig;
      case 'staging':
        return stagingImageOptimizationConfig;
      case 'production':
        return prodImageOptimizationConfig;
      default:
        return {};
    }
  }
  
  /**
   * Deep merge two objects
   */
  private deepMerge(target: any, source: any): any {
    const output = { ...target };
    
    if (this.isObject(target) && this.isObject(source)) {
      Object.keys(source).forEach((key) => {
        if (this.isObject(source[key])) {
          if (!(key in target)) {
            Object.assign(output, { [key]: source[key] });
          } else {
            output[key] = this.deepMerge(target[key], source[key]);
          }
        } else {
          Object.assign(output, { [key]: source[key] });
        }
      });
    }
    
    return output;
  }
  
  /**
   * Check if value is a plain object
   */
  private isObject(item: any): boolean {
    return item && typeof item === 'object' && !Array.isArray(item);
  }
  
  /**
   * Validate configuration
   */
  private validateConfig(config: ImageOptimizationConfig): void {
    const errors: string[] = [];
    
    // Validate chunk sizes
    if (config.chunkedUpload.defaultChunkSizeMB < config.chunkedUpload.minChunkSizeMB) {
      errors.push('defaultChunkSizeMB must be >= minChunkSizeMB');
    }
    
    if (config.chunkedUpload.defaultChunkSizeMB > config.chunkedUpload.maxChunkSizeMB) {
      errors.push('defaultChunkSizeMB must be <= maxChunkSizeMB');
    }
    
    // Validate quality values
    if (config.compression.client.quality.initial > 1 || config.compression.client.quality.initial < 0) {
      errors.push('compression.client.quality.initial must be between 0 and 1');
    }
    
    if (config.compression.client.quality.minimum > 1 || config.compression.client.quality.minimum < 0) {
      errors.push('compression.client.quality.minimum must be between 0 and 1');
    }
    
    // Validate OPFS quotas
    if (config.opfs.evictionThresholdPercent > 100 || config.opfs.evictionThresholdPercent < 0) {
      errors.push('opfs.evictionThresholdPercent must be between 0 and 100');
    }
    
    // Validate viewport breakpoints
    if (config.viewportQuality.breakpoints.mobile.maxWidth >= config.viewportQuality.breakpoints.tablet.maxWidth) {
      errors.push('mobile.maxWidth must be < tablet.maxWidth');
    }
    
    if (config.viewportQuality.breakpoints.tablet.maxWidth >= config.viewportQuality.breakpoints.desktop.maxWidth) {
      errors.push('tablet.maxWidth must be < desktop.maxWidth');
    }
    
    // Validate network profiles exist for all network types
    const networkTypes: NetworkType[] = ['slow-2g', '2g', '3g', '4g', 'wifi'];
    for (const networkType of networkTypes) {
      if (!config.chunkedUpload.networkProfiles[networkType]) {
        errors.push(`Missing chunkedUpload.networkProfiles for ${networkType}`);
      }
      if (!config.networkAdaptation.qualityMapping[networkType]) {
        errors.push(`Missing networkAdaptation.qualityMapping for ${networkType}`);
      }
    }
    
    if (errors.length > 0) {
      console.error('[ImageOptimization] Configuration validation errors:', errors);
      throw new Error(`Configuration validation failed:\n${errors.join('\n')}`);
    }
    
    console.log('[ImageOptimization] Configuration validated successfully');
  }
  
  /**
   * Enable hot reload in development
   */
  private enableHotReload(): void {
    if (import.meta.hot) {
      import.meta.hot.accept((newModule) => {
        console.log('[ImageOptimization] Config hot reloaded');
        this.config = this.loadConfig();
        this.validateConfig(this.config);
        
        // Emit event for components to react
        window.dispatchEvent(new CustomEvent('image-optimization-config-updated', {
          detail: { config: this.config }
        }));
      });
    }
  }
  
  /**
   * Get full configuration
   */
  getConfig(): ImageOptimizationConfig {
    if (!this.config) {
      this.init();
    }
    return this.config!;
  }
  
  // ========================================
  // FEATURE FLAG CHECKS
  // ========================================
  
  isChunkedUploadEnabled(): boolean {
    return this.getConfig().features.chunkedUpload;
  }
  
  isClientCompressionEnabled(): boolean {
    return this.getConfig().features.clientSideCompression;
  }
  
  isServerVariantsEnabled(): boolean {
    return this.getConfig().features.serverSideVariants;
  }
  
  isViewportQualityEnabled(): boolean {
    return this.getConfig().features.viewportQualitySelection;
  }
  
  isOPFSEnabled(): boolean {
    return this.getConfig().features.opfsCache;
  }
  
  isNetworkAdaptationEnabled(): boolean {
    return this.getConfig().features.networkAdaptation;
  }
  
  isOfflineQueueEnabled(): boolean {
    return this.getConfig().features.offlineQueue;
  }
  
  isBackgroundSyncEnabled(): boolean {
    return this.getConfig().features.backgroundSync;
  }
  
  // ========================================
  // SECTION-SPECIFIC GETTERS
  // ========================================
  
  getChunkedUploadConfig() {
    return this.getConfig().chunkedUpload;
  }
  
  getCompressionConfig() {
    return this.getConfig().compression;
  }
  
  getViewportQualityConfig() {
    return this.getConfig().viewportQuality;
  }
  
  getOPFSConfig() {
    return this.getConfig().opfs;
  }
  
  getServiceWorkerConfig() {
    return this.getConfig().serviceWorker;
  }
  
  getNetworkAdaptationConfig() {
    return this.getConfig().networkAdaptation;
  }
  
  getOfflineQueueConfig() {
    return this.getConfig().offlineQueue;
  }
  
  getMonitoringConfig() {
    return this.getConfig().monitoring;
  }
  
  getDebugConfig() {
    return this.getConfig().debug;
  }
  
  // ========================================
  // CONVENIENCE METHODS
  // ========================================
  
  /**
   * Get chunk size for current network type
   */
  getChunkSizeForNetwork(networkType: NetworkType): number {
    const config = this.getChunkedUploadConfig();
    const profile = config.networkProfiles[networkType];
    return profile.chunkSizeMB * 1024 * 1024; // Convert to bytes
  }
  
  /**
   * Get quality level for network type
   */
  getQualityForNetwork(networkType: NetworkType): QualityLevel {
    const config = this.getNetworkAdaptationConfig();
    return config.qualityMapping[networkType];
  }
  
  /**
   * Get quality level for viewport width
   */
  getQualityForViewport(viewportWidth: number): QualityLevel {
    const config = this.getViewportQualityConfig();
    const breakpoints = config.breakpoints;
    
    if (viewportWidth <= breakpoints.mobile.maxWidth) {
      return breakpoints.mobile.quality;
    } else if (viewportWidth <= breakpoints.tablet.maxWidth) {
      return breakpoints.tablet.quality;
    } else if (viewportWidth >= breakpoints.fourK.minWidth) {
      return breakpoints.fourK.quality;
    } else {
      return breakpoints.desktop.quality;
    }
  }
  
  /**
   * Check if quality should be upgraded for Retina displays
   */
  shouldUpgradeForRetina(): boolean {
    const config = this.getViewportQualityConfig();
    const pixelRatio = window.devicePixelRatio || 1;
    return pixelRatio >= config.breakpoints.retina.minPixelRatio && 
           config.breakpoints.retina.upgradeQuality;
  }
  
  /**
   * Get log level
   */
  getLogLevel(): 'debug' | 'info' | 'warn' | 'error' {
    return this.getConfig().monitoring.logLevel;
  }
  
  /**
   * Check if verbose logging is enabled
   */
  isVerboseLoggingEnabled(): boolean {
    return this.getConfig().debug.enableVerboseLogging;
  }
  
  /**
   * Reload configuration (useful for testing)
   */
  reload(): void {
    this.config = this.loadConfig();
    this.validateConfig(this.config);
    console.log('[ImageOptimization] Configuration reloaded');
  }
  
  /**
   * Destroy and cleanup
   */
  destroy(): void {
    if (this.hotReloadInterval) {
      clearInterval(this.hotReloadInterval);
    }
  }
}

// Singleton instance
export const imageOptimizationConfig = new ImageOptimizationConfigLoader();

// Auto-initialize on import
imageOptimizationConfig.init();

// Expose to window for debugging
if (typeof window !== 'undefined') {
  (window as any).__imageOptimizationConfig = {
    get: () => imageOptimizationConfig.getConfig(),
    reload: () => imageOptimizationConfig.reload(),
    features: imageOptimizationConfig.getConfig().features,
  };
}

export default imageOptimizationConfig;
