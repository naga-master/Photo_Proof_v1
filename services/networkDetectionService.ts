/**
 * Network Detection Service
 * 
 * Detects network speed and type for adaptive quality selection.
 */

import { imageOptimizationConfig } from './imageOptimizationConfigLoader';
import type { NetworkType } from '../config/image-optimization.config';

interface NetworkInfo {
  effectiveType: NetworkType;
  downlink: number;
  rtt: number;
  saveData: boolean;
  timestamp: number;
}

class NetworkDetectionService {
  private currentNetwork: NetworkInfo | null = null;
  private listeners: Set<(info: NetworkInfo) => void> = new Set();
  private detectionInterval: number | null = null;
  
  /**
   * Initialize service
   */
  async init(): Promise<void> {
    // Initial detection
    this.currentNetwork = await this.detectNetwork();
    
    // Listen for network changes
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      connection.addEventListener('change', () => this.handleNetworkChange());
    }
    
    // Periodic detection
    const config = imageOptimizationConfig.getNetworkAdaptationConfig();
    if (config.detection.intervalMs > 0) {
      this.startPeriodicDetection(config.detection.intervalMs);
    }
    
    console.log('[NetworkDetection] Service initialized:', this.currentNetwork);
  }
  
  /**
   * Detect network type and speed
   */
  async detectNetwork(): Promise<NetworkInfo> {
    const config = imageOptimizationConfig.getNetworkAdaptationConfig();
    
    // Method 1: Network Information API
    if (config.detection.method === 'api' || config.detection.method === 'hybrid') {
      if ('connection' in navigator) {
        const conn = (navigator as any).connection;
        if (conn && conn.effectiveType) {
          return {
            effectiveType: this.normalizeNetworkType(conn.effectiveType),
            downlink: conn.downlink || 0,
            rtt: conn.rtt || 0,
            saveData: conn.saveData || false,
            timestamp: Date.now(),
          };
        }
      }
    }
    
    // Method 2: Performance-based detection (fallback)
    if (config.detection.method === 'performance' || config.detection.method === 'hybrid') {
      return await this.performanceBasedDetection();
    }
    
    // Default
    return {
      effectiveType: '4g',
      downlink: 10,
      rtt: 100,
      saveData: false,
      timestamp: Date.now(),
    };
  }
  
  /**
   * Performance-based network detection
   */
  private async performanceBasedDetection(): Promise<NetworkInfo> {
    const config = imageOptimizationConfig.getNetworkAdaptationConfig();
    const testUrl = config.detection.testFileUrl;
    const startTime = performance.now();
    
    try {
      const response = await fetch(testUrl, { cache: 'no-store' });
      const blob = await response.blob();
      const endTime = performance.now();
      
      const duration = (endTime - startTime) / 1000; // seconds
      const sizeKB = blob.size / 1024;
      const speedMbps = (sizeKB * 8) / (duration * 1024);
      
      // Classify based on speed
      let effectiveType: NetworkType;
      const thresholds = config.detection.performanceBasedThreshold;
      
      if (speedMbps >= thresholds['4g']) {
        effectiveType = '4g';
      } else if (speedMbps >= thresholds['3g']) {
        effectiveType = '3g';
      } else if (speedMbps >= thresholds['2g']) {
        effectiveType = '2g';
      } else {
        effectiveType = 'slow-2g';
      }
      
      return {
        effectiveType,
        downlink: speedMbps,
        rtt: duration * 1000,
        saveData: false,
        timestamp: Date.now(),
      };
    } catch (error) {
      console.error('[NetworkDetection] Performance test failed:', error);
      return {
        effectiveType: '4g',
        downlink: 10,
        rtt: 100,
        saveData: false,
        timestamp: Date.now(),
      };
    }
  }
  
  /**
   * Normalize network type
   */
  private normalizeNetworkType(type: string): NetworkType {
    const normalized = type.toLowerCase();
    if (normalized.includes('4g') || normalized === 'fast') return '4g';
    if (normalized.includes('3g')) return '3g';
    if (normalized.includes('2g')) return '2g';
    if (normalized.includes('slow')) return 'slow-2g';
    return '4g';
  }
  
  /**
   * Handle network change
   */
  private async handleNetworkChange(): Promise<void> {
    const oldNetwork = this.currentNetwork;
    this.currentNetwork = await this.detectNetwork();
    
    console.log('[NetworkDetection] Network changed:', {
      from: oldNetwork?.effectiveType,
      to: this.currentNetwork.effectiveType,
    });
    
    // Notify listeners
    this.listeners.forEach(listener => listener(this.currentNetwork!));
  }
  
  /**
   * Start periodic detection
   */
  private startPeriodicDetection(intervalMs: number): void {
    this.detectionInterval = window.setInterval(async () => {
      const newNetwork = await this.detectNetwork();
      
      // Only notify if changed significantly
      if (this.hasSignificantChange(this.currentNetwork, newNetwork)) {
        this.currentNetwork = newNetwork;
        this.listeners.forEach(listener => listener(newNetwork));
      }
    }, intervalMs);
  }
  
  /**
   * Check if network change is significant
   */
  private hasSignificantChange(old: NetworkInfo | null, current: NetworkInfo): boolean {
    if (!old) return true;
    if (old.effectiveType !== current.effectiveType) return true;
    
    // Speed changed by >50%
    if (old.downlink > 0 && Math.abs(old.downlink - current.downlink) / old.downlink > 0.5) {
      return true;
    }
    
    return false;
  }
  
  /**
   * Get current network info
   */
  getCurrentNetwork(): NetworkInfo | null {
    return this.currentNetwork;
  }
  
  /**
   * Subscribe to network changes
   */
  subscribe(listener: (info: NetworkInfo) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
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
    if (this.detectionInterval) {
      clearInterval(this.detectionInterval);
    }
    this.listeners.clear();
  }
}

// Singleton instance
export const networkDetectionService = new NetworkDetectionService();

// Auto-initialize if enabled
if (imageOptimizationConfig.isNetworkAdaptationEnabled()) {
  networkDetectionService.init();
}

// Expose to window for debugging
if (typeof window !== 'undefined') {
  (window as any).__networkDetection = {
    get: () => networkDetectionService.getCurrentNetwork(),
    detect: () => networkDetectionService.detectNetwork(),
  };
}

export default networkDetectionService;
