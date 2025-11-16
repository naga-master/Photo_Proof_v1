/**
 * Upload Queue Service
 * 
 * Manages offline upload queue with background sync capability.
 */

import { imageOptimizationConfig } from './imageOptimizationConfigLoader';
import { indexedDBManager } from '../src/services/cache/IndexedDBManager';
import { chunkedUploadService } from './chunkedUploadService';

interface QueuedUpload {
  id: string;
  file: File;
  projectId: string;
  folderId?: string;
  status: 'pending' | 'processing' | 'complete' | 'failed';
  priority: number;
  progress: number;
  retryCount: number;
  error?: string;
  createdAt: number;
  startedAt?: number;
  completedAt?: number;
}

class UploadQueueService {
  private queue: Map<string, QueuedUpload> = new Map();
  private processingInterval: number | null = null;
  private isProcessing: boolean = false;
  
  /**
   * Initialize service
   */
  async init(): Promise<void> {
    // Load queue from IndexedDB
    await this.loadQueueFromStorage();
    
    // Start processing
    this.startProcessing();
    
    // Listen for online/offline
    window.addEventListener('online', () => this.handleOnline());
    window.addEventListener('offline', () => this.handleOffline());
    
    // Register background sync
    await this.registerBackgroundSync();
    
    console.log('[UploadQueue] Service initialized, queue size:', this.queue.size);
  }
  
  /**
   * Add upload to queue
   */
  async addToQueue(
    file: File,
    projectId: string,
    folderId?: string,
    priority: number = 5
  ): Promise<string> {
    const uploadId = this.generateId();
    
    const queuedUpload: QueuedUpload = {
      id: uploadId,
      file,
      projectId,
      folderId,
      status: 'pending',
      priority,
      progress: 0,
      retryCount: 0,
      createdAt: Date.now(),
    };
    
    this.queue.set(uploadId, queuedUpload);
    await this.saveQueueToStorage();
    
    console.log('[UploadQueue] Added to queue:', uploadId);
    
    // Start processing if online
    if (navigator.onLine && !this.isProcessing) {
      this.processQueue();
    }
    
    return uploadId;
  }
  
  /**
   * Process queue
   */
  async processQueue(): Promise<void> {
    if (this.isProcessing || !navigator.onLine) return;
    
    const config = imageOptimizationConfig.getOfflineQueueConfig();
    this.isProcessing = true;
    
    console.log('[UploadQueue] Processing queue...');
    
    // Get pending uploads sorted by priority
    const pending = Array.from(this.queue.values())
      .filter(item => item.status === 'pending' || item.status === 'failed')
      .sort((a, b) => b.priority - a.priority);
    
    // Process up to max concurrent
    const batch = pending.slice(0, config.processing.maxConcurrentUploads);
    
    await Promise.allSettled(
      batch.map(item => this.processUpload(item))
    );
    
    this.isProcessing = false;
    
    // Continue if more items
    const remaining = Array.from(this.queue.values())
      .filter(item => item.status === 'pending');
    
    if (remaining.length > 0 && navigator.onLine) {
      setTimeout(() => this.processQueue(), 1000);
    }
  }
  
  /**
   * Process single upload
   */
  private async processUpload(item: QueuedUpload): Promise<void> {
    const config = imageOptimizationConfig.getOfflineQueueConfig();
    
    item.status = 'processing';
    item.startedAt = Date.now();
    await this.saveQueueToStorage();
    
    try {
      console.log('[UploadQueue] Processing upload:', item.id);
      
      // Upload using chunked upload service
      const result = await chunkedUploadService.uploadFile(
        item.file,
        item.projectId,
        item.folderId,
        (progress) => {
          item.progress = progress.percentComplete;
          this.saveQueueToStorage();
        }
      );
      
      // Success
      item.status = 'complete';
      item.completedAt = Date.now();
      item.progress = 100;
      
      console.log('[UploadQueue] Upload complete:', item.id);
      
      // Show notification
      if (config.notifications.enabled && config.notifications.showOnComplete) {
        this.showNotification('Upload Complete', `${item.file.name} uploaded successfully`);
      }
    } catch (error: any) {
      console.error('[UploadQueue] Upload failed:', error);
      
      // Check if should retry
      if (item.retryCount < config.retry.maxRetries) {
        item.status = 'pending';
        item.retryCount++;
        item.error = error.message;
        
        console.log(`[UploadQueue] Will retry (${item.retryCount}/${config.retry.maxRetries})`);
      } else {
        item.status = 'failed';
        item.error = error.message;
        
        console.error('[UploadQueue] Max retries exceeded:', item.id);
        
        // Show error notification
        if (config.notifications.enabled && config.notifications.showOnError) {
          this.showNotification('Upload Failed', `${item.file.name} failed to upload`);
        }
      }
    }
    
    await this.saveQueueToStorage();
  }
  
  /**
   * Handle online event
   */
  private handleOnline(): void {
    console.log('[UploadQueue] Network restored, resuming queue');
    
    const config = imageOptimizationConfig.getOfflineQueueConfig();
    
    if (config.retry.resetRetriesOnNetworkRestore) {
      // Reset retry counts
      this.queue.forEach(item => {
        if (item.status === 'failed') {
          item.status = 'pending';
          item.retryCount = 0;
        }
      });
    }
    
    this.processQueue();
  }
  
  /**
   * Handle offline event
   */
  private handleOffline(): void {
    console.log('[UploadQueue] Network lost, pausing queue');
    this.isProcessing = false;
  }
  
  /**
   * Start processing interval
   */
  private startProcessing(): void {
    const config = imageOptimizationConfig.getOfflineQueueConfig();
    
    this.processingInterval = window.setInterval(() => {
      if (config.queue.autoProcessOnline && navigator.onLine && !this.isProcessing) {
        this.processQueue();
      }
    }, config.processing.processingIntervalMs);
  }
  
  /**
   * Register background sync
   */
  private async registerBackgroundSync(): Promise<void> {
    const config = imageOptimizationConfig.getOfflineQueueConfig();
    
    if (!config.backgroundSync.enabled) return;
    
    if ('serviceWorker' in navigator && 'sync' in ServiceWorkerRegistration.prototype) {
      try {
        const registration = await navigator.serviceWorker.ready;
        await registration.sync.register(config.backgroundSync.syncTag);
        console.log('[UploadQueue] Background sync registered');
      } catch (error) {
        console.error('[UploadQueue] Background sync registration failed:', error);
      }
    }
  }
  
  /**
   * Show notification
   */
  private showNotification(title: string, body: string): void {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body });
    }
  }
  
  /**
   * Load queue from storage
   */
  private async loadQueueFromStorage(): Promise<void> {
    try {
      const stored = await indexedDBManager.get<QueuedUpload[]>('upload_queue');
      if (stored && Array.isArray(stored)) {
        stored.forEach(item => this.queue.set(item.id, item));
        console.log('[UploadQueue] Loaded from storage:', stored.length);
      }
    } catch (error) {
      console.error('[UploadQueue] Failed to load from storage:', error);
    }
  }
  
  /**
   * Save queue to storage
   */
  private async saveQueueToStorage(): Promise<void> {
    try {
      const items = Array.from(this.queue.values());
      await indexedDBManager.set('upload_queue', items);
    } catch (error) {
      console.error('[UploadQueue] Failed to save to storage:', error);
    }
  }
  
  /**
   * Get queue status
   */
  getQueueStatus() {
    const items = Array.from(this.queue.values());
    return {
      total: items.length,
      pending: items.filter(i => i.status === 'pending').length,
      processing: items.filter(i => i.status === 'processing').length,
      complete: items.filter(i => i.status === 'complete').length,
      failed: items.filter(i => i.status === 'failed').length,
    };
  }
  
  /**
   * Remove completed items
   */
  clearCompleted(): void {
    Array.from(this.queue.entries()).forEach(([id, item]) => {
      if (item.status === 'complete') {
        this.queue.delete(id);
      }
    });
    this.saveQueueToStorage();
  }
  
  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  /**
   * Check if enabled
   */
  isEnabled(): boolean {
    return imageOptimizationConfig.isOfflineQueueEnabled();
  }
  
  /**
   * Cleanup
   */
  destroy(): void {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
    }
  }
}

// Singleton instance
export const uploadQueueService = new UploadQueueService();

// Auto-initialize if enabled
if (imageOptimizationConfig.isOfflineQueueEnabled()) {
  uploadQueueService.init();
}

// Expose to window for debugging
if (typeof window !== 'undefined') {
  (window as any).__uploadQueue = {
    getStatus: () => uploadQueueService.getQueueStatus(),
    process: () => uploadQueueService.processQueue(),
    clearCompleted: () => uploadQueueService.clearCompleted(),
  };
}

export default uploadQueueService;
