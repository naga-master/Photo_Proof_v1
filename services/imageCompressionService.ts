/**
 * Image Compression Service
 * 
 * Client-side image compression and optimization before upload.
 * Features:
 * - WebP conversion
 * - Progressive quality reduction to target size
 * - ThumbHash generation for instant placeholders
 * - Dimension resizing (max 4K)
 * - EXIF stripping for privacy
 */

import { imageOptimizationConfig } from './imageOptimizationConfigLoader';
import { rgbaToThumbHash, thumbHashToDataURL } from 'thumbhash';

interface CompressionResult {
  compressedFile: Blob;
  thumbhash: string | null;
  dimensions: {
    originalWidth: number;
    originalHeight: number;
    finalWidth: number;
    finalHeight: number;
  };
  compressionRatio: number;
  originalSize: number;
  compressedSize: number;
}

class ImageCompressionService {
  /**
   * Check if client-side compression is enabled
   */
  isEnabled(): boolean {
    return imageOptimizationConfig.isClientCompressionEnabled();
  }
  
  /**
   * Compress image to target size
   */
  async compressImage(file: File): Promise<CompressionResult> {
    if (!this.isEnabled()) {
      throw new Error('Image compression is not enabled');
    }
    
    const config = imageOptimizationConfig.getCompressionConfig();
    const clientConfig = config.client;
    
    console.log('[ImageCompression] Starting compression:', {
      filename: file.name,
      originalSize: file.size,
      targetSizeMB: clientConfig.targetSizeMB,
    });
    
    const startTime = performance.now();
    
    // Step 1: Load image
    const bitmap = await createImageBitmap(file);
    const originalDimensions = {
      width: bitmap.width,
      height: bitmap.height,
    };
    
    console.log('[ImageCompression] Original dimensions:', originalDimensions);
    
    // Step 2: Calculate target dimensions
    const targetDimensions = this.calculateTargetDimensions(
      bitmap.width,
      bitmap.height,
      clientConfig.maxDimensionPx
    );
    
    console.log('[ImageCompression] Target dimensions:', targetDimensions);
    
    // Step 3: Resize using OffscreenCanvas
    const canvas = new OffscreenCanvas(targetDimensions.width, targetDimensions.height);
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Failed to get canvas context');
    }
    
    ctx.drawImage(bitmap, 0, 0, targetDimensions.width, targetDimensions.height);
    
    // Step 4: Generate ThumbHash before compression
    let thumbhash: string | null = null;
    if (config.thumbhash.enabled && config.thumbhash.generateOnClient) {
      thumbhash = await this.generateThumbHash(canvas, targetDimensions.width, targetDimensions.height);
      console.log('[ImageCompression] ThumbHash generated:', thumbhash?.substring(0, 20) + '...');
    }
    
    // Step 5: Compress to WebP with progressive quality reduction
    const compressedBlob = await this.compressToTarget(
      canvas,
      clientConfig.targetSizeMB * 1024 * 1024,
      clientConfig.format,
      clientConfig.quality
    );
    
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    const result: CompressionResult = {
      compressedFile: compressedBlob,
      thumbhash,
      dimensions: {
        originalWidth: originalDimensions.width,
        originalHeight: originalDimensions.height,
        finalWidth: targetDimensions.width,
        finalHeight: targetDimensions.height,
      },
      compressionRatio: file.size / compressedBlob.size,
      originalSize: file.size,
      compressedSize: compressedBlob.size,
    };
    
    console.log('[ImageCompression] Compression complete:', {
      originalSize: this.formatBytes(file.size),
      compressedSize: this.formatBytes(compressedBlob.size),
      ratio: result.compressionRatio.toFixed(2) + 'x',
      savings: (((file.size - compressedBlob.size) / file.size) * 100).toFixed(1) + '%',
      duration: duration.toFixed(0) + 'ms',
    });
    
    return result;
  }
  
  /**
   * Calculate target dimensions maintaining aspect ratio
   */
  private calculateTargetDimensions(
    width: number,
    height: number,
    maxDimension: number
  ): { width: number; height: number } {
    const config = imageOptimizationConfig.getCompressionConfig();
    
    if (!config.client.maintainAspectRatio) {
      return { width: maxDimension, height: maxDimension };
    }
    
    // If already within limits, keep original size
    if (width <= maxDimension && height <= maxDimension) {
      return { width, height };
    }
    
    // Calculate scale factor
    const scale = Math.min(maxDimension / width, maxDimension / height);
    
    return {
      width: Math.round(width * scale),
      height: Math.round(height * scale),
    };
  }
  
  /**
   * Compress to target size with progressive quality reduction
   */
  private async compressToTarget(
    canvas: OffscreenCanvas,
    targetSize: number,
    format: 'webp' | 'jpeg',
    qualityConfig: { initial: number; minimum: number; step: number }
  ): Promise<Blob> {
    let quality = qualityConfig.initial;
    let blob: Blob;
    const mimeType = format === 'webp' ? 'image/webp' : 'image/jpeg';
    
    do {
      blob = await canvas.convertToBlob({
        type: mimeType,
        quality,
      });
      
      console.log(`[ImageCompression] Trying quality ${(quality * 100).toFixed(0)}% → ${this.formatBytes(blob.size)}`);
      
      if (blob.size <= targetSize || quality <= qualityConfig.minimum) {
        break;
      }
      
      quality -= qualityConfig.step;
    } while (quality >= qualityConfig.minimum);
    
    return blob;
  }
  
  /**
   * Generate ThumbHash for blur placeholder
   */
  private async generateThumbHash(
    canvas: OffscreenCanvas,
    originalWidth: number,
    originalHeight: number
  ): Promise<string> {
    const config = imageOptimizationConfig.getCompressionConfig();
    const { width: thumbWidth, height: thumbHeight } = config.thumbhash.dimensions;
    
    // Create small canvas for ThumbHash
    const thumbCanvas = new OffscreenCanvas(thumbWidth, thumbHeight);
    const thumbCtx = thumbCanvas.getContext('2d');
    if (!thumbCtx) {
      throw new Error('Failed to get thumbnail canvas context');
    }
    
    // Draw scaled down image
    thumbCtx.drawImage(canvas as any, 0, 0, thumbWidth, thumbHeight);
    
    // Get pixel data
    const imageData = thumbCtx.getImageData(0, 0, thumbWidth, thumbHeight);
    const pixels = imageData.data;
    
    // Generate ThumbHash
    const hash = rgbaToThumbHash(thumbWidth, thumbHeight, pixels);
    
    // Convert to base64
    return btoa(String.fromCharCode(...hash));
  }
  
  /**
   * Get ThumbHash data URL for preview
   */
  thumbHashToDataURL(thumbhash: string): string {
    try {
      const hashBytes = Uint8Array.from(atob(thumbhash), c => c.charCodeAt(0));
      return thumbHashToDataURL(hashBytes);
    } catch (error) {
      console.error('[ImageCompression] Failed to convert ThumbHash to data URL:', error);
      return '';
    }
  }
  
  /**
   * Format bytes to human-readable string
   */
  private formatBytes(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }
  
  /**
   * Batch compress multiple images
   */
  async compressImages(files: File[]): Promise<CompressionResult[]> {
    console.log(`[ImageCompression] Batch compressing ${files.length} images`);
    
    const results = await Promise.all(
      files.map(file => this.compressImage(file))
    );
    
    const totalOriginal = results.reduce((sum, r) => sum + r.originalSize, 0);
    const totalCompressed = results.reduce((sum, r) => sum + r.compressedSize, 0);
    const avgRatio = totalOriginal / totalCompressed;
    
    console.log(`[ImageCompression] Batch complete:`, {
      files: results.length,
      totalOriginal: this.formatBytes(totalOriginal),
      totalCompressed: this.formatBytes(totalCompressed),
      avgRatio: avgRatio.toFixed(2) + 'x',
      totalSavings: (((totalOriginal - totalCompressed) / totalOriginal) * 100).toFixed(1) + '%',
    });
    
    return results;
  }
}

// Singleton instance
export const imageCompressionService = new ImageCompressionService();

// Expose to window for debugging
if (typeof window !== 'undefined') {
  (window as any).__imageCompressionService = {
    compress: (file: File) => imageCompressionService.compressImage(file),
    thumbHashToDataURL: (hash: string) => imageCompressionService.thumbHashToDataURL(hash),
  };
}

export default imageCompressionService;
