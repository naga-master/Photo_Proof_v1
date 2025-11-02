/**
 * Upload Queue Manager
 * 
 * Implements best practices for uploading multiple files:
 * - BATCH presigned URL fetching (50 files per request)
 * - Concurrent upload limit (3 simultaneous uploads per batch)
 * - Automatic retry with exponential backoff
 * - Queue management to prevent resource exhaustion
 * - Individual file retry capability
 * 
 * Flow for 100 images:
 * - Request 1: Get 50 presigned URLs (batch 1)
 * - Requests 2-N: Upload those 50 files (3 concurrent)
 * - Request N+1: Get 50 presigned URLs (batch 2)
 * - Requests N+2-M: Upload those 50 files (3 concurrent)
 * Total: 2 batch URL requests + 100 upload requests
 * 
 * Reference: https://web.dev/fetch-upload-streaming/
 * Browser connection limits: Chrome allows 6 connections per host
 */

import { uploadService, type PhotoResponse, type UploadProgressCallback } from './uploadService';

export interface QueuedUpload {
  id: string;
  file: File;
  projectId: string;
  folderId?: string;
  token?: string; // Presigned token (fetched in batches of 50)
  status: 'pending' | 'uploading' | 'completed' | 'failed' | 'retrying' | 'fetching-token';
  progress: number;
  error?: string;
  retryCount: number;
  maxRetries: number;
  batchId?: number; // Track which batch this file belongs to
}

export interface UploadQueueCallbacks {
  onProgress?: (uploadId: string, progress: number) => void;
  onSuccess?: (uploadId: string, result: PhotoResponse) => void;
  onError?: (uploadId: string, error: string) => void;
  onQueueUpdate?: (queue: QueuedUpload[]) => void;
}

class UploadQueueManager {
  private queue: QueuedUpload[] = [];
  private activeUploads: Set<string> = new Set();
  private callbacks: UploadQueueCallbacks = {};
  private currentBatchId: number = 0;
  private isProcessingBatch: boolean = false;
  
  // Configuration
  private readonly MAX_CONCURRENT_UPLOADS = 3; // Upload 3 files at a time within a batch
  private readonly BATCH_SIZE = 50; // Fetch presigned URLs for 50 files at a time
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAY_BASE = 1000; // Base delay in ms (will use exponential backoff)
  
  constructor() {
    console.log('[UploadQueueManager] Initialized');
    console.log('[UploadQueueManager] - Batch size:', this.BATCH_SIZE, 'files per presigned URL request');
    console.log('[UploadQueueManager] - Max concurrent uploads:', this.MAX_CONCURRENT_UPLOADS, 'files at a time');
  }

  /**
   * Set callbacks for upload events
   */
  setCallbacks(callbacks: UploadQueueCallbacks) {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }

  /**
   * Add files to upload queue
   * This is called ONCE when upload starts - should not be called repeatedly
   */
  async addToQueue(uploads: Omit<QueuedUpload, 'status' | 'progress' | 'retryCount' | 'maxRetries' | 'token' | 'batchId'>[]): Promise<void> {
    // CRITICAL: Check if files are already in queue to prevent duplicates
    const existingIds = new Set(this.queue.map(q => q.id));
    const newItems = uploads.filter(u => !existingIds.has(u.id));
    
    if (newItems.length === 0) {
      console.log('[UploadQueueManager] ⚠️ All files already in queue, skipping to prevent duplicates');
      return;
    }

    const newUploads: QueuedUpload[] = newItems.map(upload => ({
      ...upload,
      status: 'pending' as const,
      progress: 0,
      retryCount: 0,
      maxRetries: this.MAX_RETRIES,
      batchId: undefined, // Will be assigned when batch is fetched
    }));

    this.queue.push(...newUploads);
    console.log(`[UploadQueueManager] ✅ Added ${newUploads.length} NEW files to queue (filtered ${uploads.length - newItems.length} duplicates). Total in queue: ${this.queue.length}`);
    
    this.notifyQueueUpdate();
    
    // Start processing batches
    this.processBatches();
  }

  /**
   * Process batches of uploads
   * CRITICAL: Only process one batch at a time to prevent recursive API calls
   */
  private async processBatches(): Promise<void> {
    // Prevent multiple batch processing running simultaneously
    if (this.isProcessingBatch) {
      console.log('[UploadQueueManager] ⏸️ Batch processing already in progress, skipping');
      return;
    }

    // Find pending files that don't have tokens yet
    const pendingFiles = this.queue.filter(u => 
      u.status === 'pending' && !u.token && u.batchId === undefined
    );

    if (pendingFiles.length === 0) {
      console.log('[UploadQueueManager] ✅ No pending files without tokens');
      return;
    }

    this.isProcessingBatch = true;
    console.log(`[UploadQueueManager] 🚀 Starting batch processing for ${pendingFiles.length} files`);

    try {
      // Process in batches of BATCH_SIZE (50)
      for (let i = 0; i < pendingFiles.length; i += this.BATCH_SIZE) {
        const batch = pendingFiles.slice(i, i + this.BATCH_SIZE);
        this.currentBatchId++;
        const batchId = this.currentBatchId;
        
        console.log(`[UploadQueueManager] 📦 Processing Batch ${batchId}: ${batch.length} files (${i + 1}-${i + batch.length} of ${pendingFiles.length})`);
        
        // Assign batch ID to prevent re-processing
        batch.forEach(upload => {
          upload.batchId = batchId;
        });

        // Step 1: Fetch presigned URLs for this batch (1 API call for 50 files)
        await this.fetchBatchPresignedUrls(batch, batchId);

        // Step 2: Upload files in this batch with concurrency control (50 files, 3 at a time)
        await this.uploadBatch(batch, batchId);
      }

      console.log('[UploadQueueManager] ✅ All batches processed');
    } finally {
      this.isProcessingBatch = false;
    }
  }

  /**
   * Fetch presigned URLs for a batch of files
   * Makes ONE API call for up to 50 files
   */
  private async fetchBatchPresignedUrls(batch: QueuedUpload[], batchId: number): Promise<void> {
    console.log(`[UploadQueueManager] 🔑 Batch ${batchId}: Fetching presigned URLs for ${batch.length} files (1 API call)`);

    // Mark as fetching
    batch.forEach(upload => {
      upload.status = 'fetching-token';
    });
    this.notifyQueueUpdate();

    try {
      const batchRequest = {
        project_id: batch[0].projectId,
        folder_id: batch[0].folderId,
        files: batch.map(upload => ({
          filename: upload.file.name,
          content_type: upload.file.type,
          file_size: upload.file.size,
        })),
      };

      const response = await uploadService.getBatchPresignedUrls(batchRequest);
      
      console.log(`[UploadQueueManager] ✅ Batch ${batchId}: Received ${response.tokens.length} presigned URLs`);

      // Assign tokens to uploads
      batch.forEach((upload, index) => {
        if (response.tokens[index]) {
          upload.token = response.tokens[index].token;
          upload.status = 'pending';
        } else {
          upload.status = 'failed';
          upload.error = 'No presigned URL received from server';
          console.error(`[UploadQueueManager] ❌ Batch ${batchId}: No token for ${upload.file.name}`);
          this.callbacks.onError?.(upload.id, upload.error);
        }
      });

      this.notifyQueueUpdate();

    } catch (error) {
      console.error(`[UploadQueueManager] ❌ Batch ${batchId}: Failed to fetch presigned URLs:`, error);
      
      // Mark all files in batch as failed
      batch.forEach(upload => {
        upload.status = 'failed';
        upload.error = error instanceof Error ? error.message : 'Failed to fetch presigned URLs';
        this.callbacks.onError?.(upload.id, upload.error);
      });
      
      this.notifyQueueUpdate();
    }
  }

  /**
   * Upload files in a batch with concurrency control
   * Uploads 3 files at a time until all files in batch are complete
   */
  private async uploadBatch(batch: QueuedUpload[], batchId: number): Promise<void> {
    // Filter to only files that have tokens and are ready to upload
    const filesToUpload = batch.filter(u => u.status === 'pending' && u.token);
    
    if (filesToUpload.length === 0) {
      console.log(`[UploadQueueManager] ⚠️ Batch ${batchId}: No files ready to upload`);
      return;
    }

    console.log(`[UploadQueueManager] 📤 Batch ${batchId}: Starting upload of ${filesToUpload.length} files (max ${this.MAX_CONCURRENT_UPLOADS} concurrent)`);

    let completed = 0;
    let failed = 0;
    let index = 0;

    // Simple pool pattern: maintain exactly MAX_CONCURRENT_UPLOADS active uploads
    const uploadNext = async (): Promise<void> => {
      if (index >= filesToUpload.length) {
        return; // No more files to upload
      }

      const upload = filesToUpload[index++];
      const success = await this.uploadSingleFile(upload, batchId);
      
      if (success) completed++;
      else failed++;

      // Upload next file recursively
      await uploadNext();
    };

    // Start MAX_CONCURRENT_UPLOADS uploads in parallel
    const workers = Array(this.MAX_CONCURRENT_UPLOADS)
      .fill(null)
      .map(() => uploadNext());

    // Wait for all workers to complete
    await Promise.all(workers);

    console.log(`[UploadQueueManager] ✅ Batch ${batchId}: Complete - ${completed} succeeded, ${failed} failed`);
  }

  /**
   * Upload a single file
   */
  private async uploadSingleFile(upload: QueuedUpload, batchId: number): Promise<boolean> {
    if (!upload.token) {
      console.error(`[UploadQueueManager] ❌ Batch ${batchId}: No token for ${upload.file.name}`);
      upload.status = 'failed';
      upload.error = 'Missing upload token';
      this.callbacks.onError?.(upload.id, upload.error);
      this.notifyQueueUpdate();
      return false;
    }

    upload.status = 'uploading';
    this.notifyQueueUpdate();

    try {
      const result = await uploadService.uploadFile(
        upload.file,
        upload.token,
        (progress) => {
          upload.progress = progress;
          this.callbacks.onProgress?.(upload.id, progress);
          this.notifyQueueUpdate();
        }
      );

      upload.status = 'completed';
      upload.progress = 100;
      this.callbacks.onSuccess?.(upload.id, result);
      this.notifyQueueUpdate();
      return true;

    } catch (error: any) {
      console.error(`[UploadQueueManager] ❌ Batch ${batchId}: Upload failed for ${upload.file.name}:`, error);
      
      upload.error = error.message || 'Upload failed';

      // Retry logic
      if (upload.retryCount < upload.maxRetries) {
        upload.retryCount++;
        upload.status = 'pending';
        upload.token = undefined; // Clear token to get new one
        upload.batchId = undefined; // Clear batch ID to reprocess
        
        const retryDelay = this.calculateRetryDelay(upload.retryCount);
        console.log(`[UploadQueueManager] 🔄 Will retry ${upload.file.name} in ${retryDelay}ms (attempt ${upload.retryCount}/${upload.maxRetries})`);
        
        setTimeout(() => {
          this.processBatches(); // Reprocess with new batch
        }, retryDelay);
        
        return false;
      } else {
        upload.status = 'failed';
        console.error(`[UploadQueueManager] ❌ Max retries reached for ${upload.file.name}`);
        this.callbacks.onError?.(upload.id, upload.error);
        this.notifyQueueUpdate();
        return false;
      }
    }
  }

  /**
   * Calculate retry delay with exponential backoff
   * Delay = base * (2 ^ retryCount)
   * Example: 1s, 2s, 4s, 8s...
   */
  private calculateRetryDelay(retryCount: number): number {
    return this.RETRY_DELAY_BASE * Math.pow(2, retryCount - 1);
  }

  /**
   * Manually retry a specific failed upload
   */
  retryUpload(uploadId: string): void {
    const upload = this.queue.find(u => u.id === uploadId);
    
    if (!upload) {
      console.warn(`[UploadQueueManager] Upload not found: ${uploadId}`);
      return;
    }

    if (upload.status !== 'failed') {
      console.warn(`[UploadQueueManager] Upload is not in failed state: ${uploadId}`);
      return;
    }

    console.log(`[UploadQueueManager] Manual retry requested for: ${upload.file.name}`);
    
    // Reset for retry
    upload.status = 'pending';
    upload.error = undefined;
    upload.progress = 0;
    upload.retryCount = 0; // Reset retry count for manual retry
    upload.token = undefined; // Clear token
    upload.batchId = undefined; // Clear batch ID
    
    this.notifyQueueUpdate();
    this.processBatches(); // Reprocess in new batch
  }

  /**
   * Retry all failed uploads
   */
  retryAllFailed(): void {
    const failedUploads = this.queue.filter(u => u.status === 'failed');
    
    if (failedUploads.length === 0) {
      console.log('[UploadQueueManager] No failed uploads to retry');
      return;
    }

    console.log(`[UploadQueueManager] Retrying ${failedUploads.length} failed uploads`);
    
    failedUploads.forEach(upload => {
      upload.status = 'pending';
      upload.error = undefined;
      upload.progress = 0;
      upload.retryCount = 0;
      upload.token = undefined; // Clear token
      upload.batchId = undefined; // Clear batch ID
    });
    
    this.notifyQueueUpdate();
    this.processBatches(); // Reprocess in new batch
  }

  /**
   * Pause all uploads
   */
  pauseAll(): void {
    console.log('[UploadQueueManager] Pausing all uploads');
    this.isProcessingBatch = false; // Stop batch processing
    this.notifyQueueUpdate();
  }

  /**
   * Resume uploads
   */
  resumeAll(): void {
    console.log('[UploadQueueManager] Resuming uploads');
    this.processBatches(); // Resume batch processing
  }

  /**
   * Get queue status
   */
  getStatus() {
    return {
      total: this.queue.length,
      pending: this.queue.filter(u => u.status === 'pending').length,
      uploading: this.queue.filter(u => u.status === 'uploading').length,
      completed: this.queue.filter(u => u.status === 'completed').length,
      failed: this.queue.filter(u => u.status === 'failed').length,
      retrying: this.queue.filter(u => u.status === 'retrying').length,
    };
  }

  /**
   * Get all uploads in queue
   */
  getQueue(): QueuedUpload[] {
    return [...this.queue];
  }

  /**
   * Clear completed uploads from queue
   */
  clearCompleted(): void {
    const before = this.queue.length;
    this.queue = this.queue.filter(u => u.status !== 'completed');
    const removed = before - this.queue.length;
    
    if (removed > 0) {
      console.log(`[UploadQueueManager] Cleared ${removed} completed uploads`);
      this.notifyQueueUpdate();
    }
  }

  /**
   * Clear all uploads and reset queue
   */
  clearAll(): void {
    console.log('[UploadQueueManager] Clearing all uploads');
    this.queue = [];
    this.activeUploads.clear();
    this.notifyQueueUpdate();
  }

  /**
   * Notify callbacks of queue update
   */
  private notifyQueueUpdate(): void {
    this.callbacks.onQueueUpdate?.(this.getQueue());
  }
}

// Export singleton instance
export const uploadQueueManager = new UploadQueueManager();
