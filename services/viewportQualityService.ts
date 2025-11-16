/**
 * Viewport Quality Service
 * 
 * Determines optimal image quality based on viewport size and device characteristics.
 * Combines with network quality for intelligent quality selection.
 */

import { imageOptimizationConfig } from './imageOptimizationConfigLoader';
import type { QualityLevel } from '../config/image-optimization.config';

type ViewportType = 'mobile' | 'tablet' | 'desktop' | 'fourK';

class ViewportQualityService {
  private currentViewport: ViewportType = 'desktop';
  private pixelRatio: number = 1;
  private listeners: Set<(viewport: ViewportType, quality: QualityLevel) => void> = new Set();
  
  /**
   * Initialize service
   */
  init(): void {
    this.detectViewport();
    this.detectPixelRatio();
    
    // Listen for viewport changes
    window.addEventListener('resize', () => this.handleResize());
    
    console.log('[ViewportQuality] Service initialized:', {
      viewport: this.currentViewport,
      pixelRatio: this.pixelRatio,
      quality: this.getViewportQuality(),
    });
  }
  
  /**
   * Detect current viewport type
   */
  private detectViewport(): void {
    const config = imageOptimizationConfig.getViewportQualityConfig();
    const width = window.innerWidth;
    
    if (width <= config.breakpoints.mobile.maxWidth) {
      this.currentViewport = 'mobile';
    } else if (width <= config.breakpoints.tablet.maxWidth) {
      this.currentViewport = 'tablet';
    } else if (width >= config.breakpoints.fourK.minWidth) {
      this.currentViewport = 'fourK';
    } else {
      this.currentViewport = 'desktop';
    }
  }
  
  /**
   * Detect device pixel ratio
   */
  private detectPixelRatio(): void {
    this.pixelRatio = window.devicePixelRatio || 1;
  }
  
  /**
   * Handle viewport resize
   */
  private handleResize(): void {
    const oldViewport = this.currentViewport;
    this.detectViewport();
    
    if (oldViewport !== this.currentViewport) {
      const newQuality = this.getViewportQuality();
      console.log('[ViewportQuality] Viewport changed:', {
        from: oldViewport,
        to: this.currentViewport,
        quality: newQuality,
      });
      
      // Notify listeners
      this.listeners.forEach(listener => listener(this.currentViewport, newQuality));
    }
  }
  
  /**
   * Get optimal quality based on viewport and network
   */
  getOptimalQuality(photoId?: string): QualityLevel {
    const config = imageOptimizationConfig.getViewportQualityConfig();
    
    if (!config.enabled) {
      return 'medium'; // Default fallback
    }
    
    // Step 1: Get viewport-recommended quality
    const viewportQuality = this.getViewportQuality();
    
    // Step 2: Check if network adaptation is enabled
    if (imageOptimizationConfig.isNetworkAdaptationEnabled()) {
      // Get network-recommended quality (will be implemented in Phase 4)
      // For now, just return viewport quality
      return viewportQuality;
    }
    
    return viewportQuality;
  }
  
  /**
   * Get quality based on viewport size
   */
  getViewportQuality(): QualityLevel {
    const config = imageOptimizationConfig.getViewportQualityConfig();
    let quality = config.breakpoints[this.currentViewport].quality;
    
    // Upgrade for Retina displays
    if (this.shouldUpgradeForRetina()) {
      quality = this.upgradeQuality(quality, 1);
    }
    
    return quality;
  }
  
  /**
   * Check if quality should be upgraded for Retina displays
   */
  private shouldUpgradeForRetina(): boolean {
    const config = imageOptimizationConfig.getViewportQualityConfig();
    return this.pixelRatio >= config.breakpoints.retina.minPixelRatio &&
           config.breakpoints.retina.upgradeQuality;
  }
  
  /**
   * Upgrade quality by N steps
   */
  private upgradeQuality(quality: QualityLevel, steps: number): QualityLevel {
    const levels: QualityLevel[] = ['thumbnail', 'low', 'medium', 'high', 'print'];
    const currentIndex = levels.indexOf(quality);
    const newIndex = Math.min(currentIndex + steps, levels.length - 1);
    return levels[newIndex];
  }
  
  /**
   * Downgrade quality by N steps
   */
  private downgradeQuality(quality: QualityLevel, steps: number): QualityLevel {
    const levels: QualityLevel[] = ['thumbnail', 'low', 'medium', 'high', 'print'];
    const currentIndex = levels.indexOf(quality);
    const newIndex = Math.max(currentIndex - steps, 0);
    return levels[newIndex];
  }
  
  /**
   * Get quality level as number (0-4)
   */
  private getQualityLevel(quality: QualityLevel): number {
    const levels: QualityLevel[] = ['thumbnail', 'low', 'medium', 'high', 'print'];
    return levels.indexOf(quality);
  }
  
  /**
   * Compare two qualities
   */
  private compareQualities(quality1: QualityLevel, quality2: QualityLevel): number {
    return this.getQualityLevel(quality1) - this.getQualityLevel(quality2);
  }
  
  /**
   * Get lower quality of two
   */
  getLowerQuality(quality1: QualityLevel, quality2: QualityLevel): QualityLevel {
    return this.compareQualities(quality1, quality2) < 0 ? quality1 : quality2;
  }
  
  /**
   * Get higher quality of two
   */
  getHigherQuality(quality1: QualityLevel, quality2: QualityLevel): QualityLevel {
    return this.compareQualities(quality1, quality2) > 0 ? quality1 : quality2;
  }
  
  /**
   * Get progressive loading sequence
   */
  getProgressiveSequence(finalQuality: QualityLevel): QualityLevel[] {
    const config = imageOptimizationConfig.getViewportQualityConfig();
    
    if (!config.progressive.enabled) {
      return [finalQuality];
    }
    
    // Start with thumbnail, progress to final
    const sequence: QualityLevel[] = [config.progressive.placeholderQuality];
    
    // Add intermediate quality if gap is large
    const finalLevel = this.getQualityLevel(finalQuality);
    const placeholderLevel = this.getQualityLevel(config.progressive.placeholderQuality);
    
    if (finalLevel - placeholderLevel > 2) {
      // Add middle quality
      const levels: QualityLevel[] = ['thumbnail', 'low', 'medium', 'high', 'print'];
      const middleIndex = Math.floor((placeholderLevel + finalLevel) / 2);
      sequence.push(levels[middleIndex]);
    }
    
    // Add final quality if not already in sequence
    if (sequence[sequence.length - 1] !== finalQuality) {
      sequence.push(finalQuality);
    }
    
    return sequence;
  }
  
  /**
   * Get current viewport type
   */
  getCurrentViewport(): ViewportType {
    return this.currentViewport;
  }
  
  /**
   * Get current pixel ratio
   */
  getPixelRatio(): number {
    return this.pixelRatio;
  }
  
  /**
   * Subscribe to viewport changes
   */
  subscribe(listener: (viewport: ViewportType, quality: QualityLevel) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
  
  /**
   * Get image URL for quality
   */
  getImageUrl(photoId: string, quality: QualityLevel): string {
    return `/v2/photos/${photoId}/variant/${quality}`;
  }
  
  /**
   * Check if enabled
   */
  isEnabled(): boolean {
    return imageOptimizationConfig.isViewportQualityEnabled();
  }
}

// Singleton instance
export const viewportQualityService = new ViewportQualityService();

// Auto-initialize
if (typeof window !== 'undefined') {
  viewportQualityService.init();
}

// Expose to window for debugging
if (typeof window !== 'undefined') {
  (window as any).__viewportQualityService = {
    getViewport: () => viewportQualityService.getCurrentViewport(),
    getQuality: () => viewportQualityService.getViewportQuality(),
    getOptimalQuality: (photoId?: string) => viewportQualityService.getOptimalQuality(photoId),
    getSequence: (quality: QualityLevel) => viewportQualityService.getProgressiveSequence(quality),
  };
}

export default viewportQualityService;
