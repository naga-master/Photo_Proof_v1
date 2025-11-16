/**
 * Adaptive Quality Service
 * 
 * Automatically adjusts image quality based on network conditions.
 */

import { imageOptimizationConfig } from './imageOptimizationConfigLoader';
import { networkDetectionService } from './networkDetectionService';
import { viewportQualityService } from './viewportQualityService';
import type { QualityLevel, NetworkType } from '../config/image-optimization.config';

class AdaptiveQualityService {
  private currentQuality: QualityLevel = 'medium';
  private networkUnsubscribe: (() => void) | null = null;
  
  /**
   * Initialize service
   */
  init(): void {
    // Subscribe to network changes
    this.networkUnsubscribe = networkDetectionService.subscribe((network) => {
      this.handleNetworkChange(network);
    });
    
    // Set initial quality
    const network = networkDetectionService.getCurrentNetwork();
    if (network) {
      this.updateQuality(network);
    }
    
    console.log('[AdaptiveQuality] Service initialized');
  }
  
  /**
   * Handle network change
   */
  private handleNetworkChange(network: any): void {
    const oldQuality = this.currentQuality;
    this.updateQuality(network);
    
    if (oldQuality !== this.currentQuality) {
      console.log('[AdaptiveQuality] Quality adapted:', {
        from: oldQuality,
        to: this.currentQuality,
        networkType: network.effectiveType,
        downlink: network.downlink,
      });
      
      // Notify UI
      this.notifyQualityChange();
    }
  }
  
  /**
   * Update current quality based on network
   */
  private updateQuality(network: any): void {
    const config = imageOptimizationConfig.getNetworkAdaptationConfig();
    const networkType = network.effectiveType as NetworkType;
    
    // Get network-recommended quality
    this.currentQuality = config.qualityMapping[networkType] || 'medium';
    
    // Honor data saver mode
    if (config.dataSaver.respectBrowserSetting && network.saveData) {
      this.currentQuality = this.downgradeQuality(
        this.currentQuality,
        config.dataSaver.downgradeQualityLevels
      );
      
      console.log('[AdaptiveQuality] Quality downgraded for data saver:', this.currentQuality);
    }
  }
  
  /**
   * Notify UI of quality change
   */
  private notifyQualityChange(): void {
    window.dispatchEvent(new CustomEvent('qualitychange', {
      detail: { quality: this.currentQuality }
    }));
  }
  
  /**
   * Get optimal quality (combines network + viewport)
   */
  getOptimalQuality(): QualityLevel {
    if (!this.isEnabled()) {
      return viewportQualityService.getViewportQuality();
    }
    
    // Get network quality
    const networkQuality = this.currentQuality;
    
    // Get viewport quality
    const viewportQuality = viewportQualityService.getViewportQuality();
    
    // Use lower quality (conservative approach for rural networks)
    return this.getLowerQuality(networkQuality, viewportQuality);
  }
  
  /**
   * Get lower quality of two
   */
  private getLowerQuality(q1: QualityLevel, q2: QualityLevel): QualityLevel {
    const levels: QualityLevel[] = ['thumbnail', 'low', 'medium', 'high', 'print'];
    const i1 = levels.indexOf(q1);
    const i2 = levels.indexOf(q2);
    return i1 < i2 ? q1 : q2;
  }
  
  /**
   * Downgrade quality by N levels
   */
  private downgradeQuality(quality: QualityLevel, steps: number): QualityLevel {
    const levels: QualityLevel[] = ['thumbnail', 'low', 'medium', 'high', 'print'];
    const currentIndex = levels.indexOf(quality);
    const newIndex = Math.max(currentIndex - steps, 0);
    return levels[newIndex];
  }
  
  /**
   * Get current quality
   */
  getCurrentQuality(): QualityLevel {
    return this.currentQuality;
  }
  
  /**
   * Check if enabled
   */
  isEnabled(): boolean {
    return imageOptimizationConfig.isNetworkAdaptationEnabled();
  }
  
  /**
   * Cleanup
   */
  destroy(): void {
    if (this.networkUnsubscribe) {
      this.networkUnsubscribe();
    }
  }
}

// Singleton instance
export const adaptiveQualityService = new AdaptiveQualityService();

// Auto-initialize if enabled
if (imageOptimizationConfig.isNetworkAdaptationEnabled()) {
  adaptiveQualityService.init();
}

// Expose to window for debugging
if (typeof window !== 'undefined') {
  (window as any).__adaptiveQuality = {
    get: () => adaptiveQualityService.getCurrentQuality(),
    getOptimal: () => adaptiveQualityService.getOptimalQuality(),
  };
}

export default adaptiveQualityService;
