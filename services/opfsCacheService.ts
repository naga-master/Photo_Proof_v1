/**
 * OPFS Cache Service
 * 
 * Origin Private File System for persistent image caching.
 * Survives browser restarts and provides large storage capacity.
 */

import { imageOptimizationConfig } from './imageOptimizationConfigLoader';
import type { QualityLevel } from '../config/image-optimization.config';

class OPFSCacheService {
  private root: FileSystemDirectoryHandle | null = null;
  private initialized: boolean = false;
  
  /**
   * Initialize OPFS
   */
  async init(): Promise<void> {
    if (this.initialized) return;
    
    try {
      if (!('storage' in navigator) || !('getDirectory' in navigator.storage)) {
        console.warn('[OPFS] OPFS not supported in this browser');
        return;
      }
      
      this.root = await navigator.storage.getDirectory();
      await this.ensureDirectoryStructure();
      this.initialized = true;
      
      console.log('[OPFS] Cache initialized');
      
      // Check storage quota
      const { usage, quota } = await this.getStorageEstimate();
      console.log('[OPFS] Storage:', {
        used: this.formatBytes(usage),
        total: this.formatBytes(quota),
        percent: ((usage / quota) * 100).toFixed(1) + '%',
      });
    } catch (error) {
      console.error('[OPFS] Initialization failed:', error);
    }
  }
  
  /**
   * Ensure directory structure exists
   */
  private async ensureDirectoryStructure(): Promise<void> {
    if (!this.root) return;
    
    const config = imageOptimizationConfig.getOPFSConfig();
    
    // Create cache/images/ directory
    const cacheDir = await this.root.getDirectoryHandle(config.directoryStructure.root, {
      create: true
    });
    
    const imagesDir = await cacheDir.getDirectoryHandle('images', {
      create: true
    });
    
    // Create quality subdirectories
    for (const quality of config.directoryStructure.qualities) {
      await imagesDir.getDirectoryHandle(quality, { create: true });
    }
    
    console.log('[OPFS] Directory structure created');
  }
  
  /**
   * Store image in OPFS
   */
  async set(photoId: string, quality: QualityLevel, blob: Blob): Promise<void> {
    if (!this.initialized || !this.root) {
      await this.init();
      if (!this.root) return;
    }
    
    const config = imageOptimizationConfig.getOPFSConfig();
    const filename = `${photoId}.webp`;
    
    try {
      // Navigate to quality directory
      const cacheDir = await this.root.getDirectoryHandle(config.directoryStructure.root);
      const imagesDir = await cacheDir.getDirectoryHandle('images');
      const qualityDir = await imagesDir.getDirectoryHandle(quality);
      
      // Create/overwrite file
      const fileHandle = await qualityDir.getFileHandle(filename, { create: true });
      const writable = await fileHandle.createWritable();
      await writable.write(blob);
      await writable.close();
      
      console.log('[OPFS] Stored:', {
        photoId,
        quality,
        size: this.formatBytes(blob.size),
      });
      
      // Check if cleanup needed
      await this.checkQuota();
    } catch (error) {
      console.error('[OPFS] Store failed:', error);
    }
  }
  
  /**
   * Retrieve image from OPFS
   */
  async get(photoId: string, quality: QualityLevel): Promise<Blob | null> {
    if (!this.initialized || !this.root) {
      await this.init();
      if (!this.root) return null;
    }
    
    const config = imageOptimizationConfig.getOPFSConfig();
    const filename = `${photoId}.webp`;
    
    try {
      const cacheDir = await this.root.getDirectoryHandle(config.directoryStructure.root);
      const imagesDir = await cacheDir.getDirectoryHandle('images');
      const qualityDir = await imagesDir.getDirectoryHandle(quality);
      const fileHandle = await qualityDir.getFileHandle(filename);
      
      const file = await fileHandle.getFile();
      
      console.log('[OPFS] Retrieved:', {
        photoId,
        quality,
        size: this.formatBytes(file.size),
      });
      
      return file;
    } catch (error) {
      // File not found is expected, don't log as error
      if ((error as any).name !== 'NotFoundError') {
        console.error('[OPFS] Retrieve failed:', error);
      }
      return null;
    }
  }
  
  /**
   * Delete image from OPFS
   */
  async delete(photoId: string, quality: QualityLevel): Promise<void> {
    if (!this.initialized || !this.root) return;
    
    const config = imageOptimizationConfig.getOPFSConfig();
    const filename = `${photoId}.webp`;
    
    try {
      const cacheDir = await this.root.getDirectoryHandle(config.directoryStructure.root);
      const imagesDir = await cacheDir.getDirectoryHandle('images');
      const qualityDir = await imagesDir.getDirectoryHandle(quality);
      
      await qualityDir.removeEntry(filename);
      
      console.log('[OPFS] Deleted:', { photoId, quality });
    } catch (error) {
      console.error('[OPFS] Delete failed:', error);
    }
  }
  
  /**
   * Get storage estimate
   */
  async getStorageEstimate(): Promise<{ usage: number; quota: number; percent: number }> {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      const usage = estimate.usage || 0;
      const quota = estimate.quota || 0;
      const percent = quota > 0 ? (usage / quota) * 100 : 0;
      return { usage, quota, percent };
    }
    return { usage: 0, quota: 0, percent: 0 };
  }
  
  /**
   * Check quota and cleanup if needed
   */
  private async checkQuota(): Promise<void> {
    const config = imageOptimizationConfig.getOPFSConfig();
    
    if (!config.autoEviction) return;
    
    const { usage, quota, percent } = await this.getStorageEstimate();
    
    if (percent >= config.quotas.redZonePercent) {
      console.warn('[OPFS] Red zone reached, aggressive cleanup');
      await this.cleanup(config.cleanup.evictPercentOnRed);
    } else if (percent >= config.quotas.yellowZonePercent) {
      console.warn('[OPFS] Yellow zone reached, soft cleanup');
      await this.cleanup(config.cleanup.evictPercentOnYellow);
    }
  }
  
  /**
   * Cleanup old files
   */
  async cleanup(evictPercent: number): Promise<void> {
    if (!this.initialized || !this.root) return;
    
    console.log(`[OPFS] Starting cleanup (evict ${evictPercent}%)`);
    
    const config = imageOptimizationConfig.getOPFSConfig();
    
    try {
      const cacheDir = await this.root.getDirectoryHandle(config.directoryStructure.root);
      const imagesDir = await cacheDir.getDirectoryHandle('images');
      
      // Collect all files with timestamps
      const files: Array<{
        quality: string;
        filename: string;
        lastModified: number;
      }> = [];
      
      for (const quality of config.directoryStructure.qualities) {
        const qualityDir = await imagesDir.getDirectoryHandle(quality);
        
        // @ts-ignore - TypeScript doesn't know about FileSystemDirectoryHandle iteration
        for await (const entry of qualityDir.values()) {
          if (entry.kind === 'file') {
            const file = await entry.getFile();
            files.push({
              quality,
              filename: entry.name,
              lastModified: file.lastModified,
            });
          }
        }
      }
      
      // Sort by lastModified (oldest first)
      files.sort((a, b) => a.lastModified - b.lastModified);
      
      // Calculate how many to delete
      const deleteCount = Math.floor(files.length * (evictPercent / 100));
      const filesToDelete = files.slice(0, deleteCount);
      
      // Delete files
      for (const file of filesToDelete) {
        const qualityDir = await imagesDir.getDirectoryHandle(file.quality);
        await qualityDir.removeEntry(file.filename);
      }
      
      console.log(`[OPFS] Cleanup complete: deleted ${deleteCount} files`);
    } catch (error) {
      console.error('[OPFS] Cleanup failed:', error);
    }
  }
  
  /**
   * Clear all cache
   */
  async clear(): Promise<void> {
    if (!this.initialized || !this.root) return;
    
    const config = imageOptimizationConfig.getOPFSConfig();
    
    try {
      // Remove entire cache directory
      await this.root.removeEntry(config.directoryStructure.root, { recursive: true });
      
      // Recreate structure
      await this.ensureDirectoryStructure();
      
      console.log('[OPFS] Cache cleared');
    } catch (error) {
      console.error('[OPFS] Clear failed:', error);
    }
  }
  
  /**
   * Check if enabled
   */
  isEnabled(): boolean {
    return imageOptimizationConfig.isOPFSEnabled();
  }
  
  /**
   * Format bytes to human-readable
   */
  private formatBytes(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
  }
}

// Singleton instance
export const opfsCacheService = new OPFSCacheService();

// Auto-initialize if enabled
if (imageOptimizationConfig.isOPFSEnabled()) {
  opfsCacheService.init();
}

// Expose to window for debugging
if (typeof window !== 'undefined') {
  (window as any).__opfsCache = {
    get: (photoId: string, quality: string) => opfsCacheService.get(photoId, quality as QualityLevel),
    set: (photoId: string, quality: string, blob: Blob) => opfsCacheService.set(photoId, quality as QualityLevel, blob),
    delete: (photoId: string, quality: string) => opfsCacheService.delete(photoId, quality as QualityLevel),
    clear: () => opfsCacheService.clear(),
    estimate: () => opfsCacheService.getStorageEstimate(),
  };
}

export default opfsCacheService;
