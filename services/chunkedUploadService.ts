/**
 * Chunked Upload Service
 * 
 * Handles large file uploads by splitting them into chunks.
 * Features:
 * - Adaptive chunk sizing based on network
 * - Retry with exponential backoff
 * - Parallel chunk uploads
 * - Progress tracking
 * - Resume capability
 */

import { imageOptimizationConfig } from './imageOptimizationConfigLoader';
import { apiClient } from '../lib/api-client';
import type { NetworkType } from '../config/image-optimization.config';

interface ChunkMetadata {
  index: number;
  start: number;
  end: number;
  size: number;
  hash?: string;
}

interface ChunkUploadSession {
  sessionId: string;
  photoId: number;
  totalChunks: number;
  uploadedChunks: Set<number>;
  failedChunks: Map<number, { attempts: number; lastError: string }>;
  file: File;
  projectId: string;
  folderId?: string;
}

interface ChunkUploadProgress {
  sessionId: string;
  totalChunks: number;
  uploadedChunks: number;
  failedChunks: number;
  currentChunk: number;
  bytesUploaded: number;
  totalBytes: number;
  percentComplete: number;
  estimatedTimeRemaining?: number;
}

class ChunkedUploadService {
  private sessions: Map<string, ChunkUploadSession> = new Map();
  private progressCallbacks: Map<string, (progress: ChunkUploadProgress) => void> = new Map();
  
  /**
   * Check if chunked upload is enabled
   */
  isEnabled(): boolean {
    return imageOptimizationConfig.isChunkedUploadEnabled();
  }
  
  /**
   * Upload file using chunked strategy
   */
  async uploadFile(
    file: File,
    projectId: string,
    folderId: string | undefined,
    onProgress?: (progress: ChunkUploadProgress) => void
  ): Promise<any> {
    if (!this.isEnabled()) {
      throw new Error('Chunked upload is not enabled');
    }
    
    const config = imageOptimizationConfig.getChunkedUploadConfig();
    
    console.log('[ChunkedUpload] Starting chunked upload:', {
      filename: file.name,
      size: file.size,
      projectId,
      folderId,
    });
    
    // Step 1: Calculate chunk size based on network
    const chunkSize = this.calculateChunkSize(file.size);
    
    // Step 2: Split file into chunks
    const chunks = this.splitFileIntoChunks(file, chunkSize);
    
    console.log('[ChunkedUpload] File split into', chunks.length, 'chunks of', chunkSize, 'bytes');
    
    // Step 3: Initialize upload session on server
    const session = await this.initializeSession(file, projectId, folderId, chunks.length);
    
    // Store session locally
    this.sessions.set(session.sessionId, {
      ...session,
      uploadedChunks: new Set(),
      failedChunks: new Map(),
      file,
      projectId,
      folderId,
    });
    
    if (onProgress) {
      this.progressCallbacks.set(session.sessionId, onProgress);
    }
    
    // Step 4: Upload chunks
    try {
      await this.uploadChunks(session.sessionId, chunks);
      
      // Step 5: Finalize upload
      const result = await this.finalizeUpload(session.sessionId);
      
      // Cleanup
      this.sessions.delete(session.sessionId);
      this.progressCallbacks.delete(session.sessionId);
      
      console.log('[ChunkedUpload] Upload completed successfully:', result);
      
      return result;
    } catch (error) {
      console.error('[ChunkedUpload] Upload failed:', error);
      
      // Keep session for potential retry
      throw error;
    }
  }
  
  /**
   * Calculate optimal chunk size based on network and file size
   */
  private calculateChunkSize(fileSize: number): number {
    const config = imageOptimizationConfig.getChunkedUploadConfig();
    
    if (!config.adaptiveChunking) {
      return config.defaultChunkSizeMB * 1024 * 1024;
    }
    
    // Get network type (will be from NetworkDetectionService in Phase 4)
    // For now, use default or detect from connection API
    const networkType = this.detectNetworkType();
    const profile = config.networkProfiles[networkType];
    
    let chunkSize = profile.chunkSizeMB * 1024 * 1024;
    
    // Adjust based on file size
    if (fileSize < 5 * 1024 * 1024) {
      // Small files: use smaller chunks
      chunkSize = Math.min(chunkSize, 1 * 1024 * 1024);
    } else if (fileSize > 100 * 1024 * 1024) {
      // Large files: can use larger chunks if network allows
      chunkSize = Math.max(chunkSize, 2 * 1024 * 1024);
    }
    
    // Enforce min/max limits
    chunkSize = Math.max(chunkSize, config.minChunkSizeMB * 1024 * 1024);
    chunkSize = Math.min(chunkSize, config.maxChunkSizeMB * 1024 * 1024);
    
    return chunkSize;
  }
  
  /**
   * Detect network type (simplified until Phase 4)
   */
  private detectNetworkType(): NetworkType {
    if ('connection' in navigator) {
      const conn = (navigator as any).connection;
      if (conn && conn.effectiveType) {
        return conn.effectiveType as NetworkType;
      }
    }
    return '4g'; // Default to 4G
  }
  
  /**
   * Split file into chunks
   */
  private splitFileIntoChunks(file: File, chunkSize: number): ChunkMetadata[] {
    const chunks: ChunkMetadata[] = [];
    let start = 0;
    let index = 0;
    
    while (start < file.size) {
      const end = Math.min(start + chunkSize, file.size);
      chunks.push({
        index,
        start,
        end,
        size: end - start,
      });
      start = end;
      index++;
    }
    
    return chunks;
  }
  
  /**
   * Initialize upload session on server
   */
  private async initializeSession(
    file: File,
    projectId: string,
    folderId: string | undefined,
    totalChunks: number
  ): Promise<{ sessionId: string; photoId: number; totalChunks: number }> {
    // Convert project_id to number - backend expects integer, not UUID string
    const projectIdNum = typeof projectId === 'string' 
      ? parseInt(projectId, 10) 
      : projectId;
    
    const response = await apiClient.post('/v2/upload/chunked/init', {
      filename: file.name,
      fileSize: file.size,
      mimeType: file.type,
      projectId: projectIdNum,
      folderId,
      totalChunks,
    });
    
    return response;
  }
  
  /**
   * Upload all chunks with retry logic
   */
  private async uploadChunks(sessionId: string, chunks: ChunkMetadata[]): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }
    
    const config = imageOptimizationConfig.getChunkedUploadConfig();
    const networkType = this.detectNetworkType();
    const profile = config.networkProfiles[networkType];
    const parallelUploads = profile.parallel;
    
    // Upload chunks in parallel batches
    const batchSize = parallelUploads;
    const startTime = Date.now();
    
    for (let i = 0; i < chunks.length; i += batchSize) {
      const batch = chunks.slice(i, i + batchSize);
      
      // Upload batch in parallel
      await Promise.all(
        batch.map(chunk => this.uploadChunkWithRetry(sessionId, chunk))
      );
      
      // Update progress
      this.updateProgress(sessionId, startTime);
    }
  }
  
  /**
   * Upload single chunk with retry logic
   */
  private async uploadChunkWithRetry(
    sessionId: string,
    chunk: ChunkMetadata,
    attempt: number = 1
  ): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }
    
    const config = imageOptimizationConfig.getChunkedUploadConfig();
    
    try {
      console.log(`[ChunkedUpload] Uploading chunk ${chunk.index + 1}/${session.totalChunks} (attempt ${attempt})`);
      
      // Extract chunk from file
      const chunkBlob = session.file.slice(chunk.start, chunk.end);
      
      // Calculate hash for verification
      const hash = await this.calculateChunkHash(chunkBlob);
      chunk.hash = hash;
      
      // Upload chunk
      await this.uploadChunk(sessionId, chunk, chunkBlob);
      
      // Mark as uploaded
      session.uploadedChunks.add(chunk.index);
      
      console.log(`[ChunkedUpload] Chunk ${chunk.index + 1} uploaded successfully`);
    } catch (error: any) {
      console.error(`[ChunkedUpload] Chunk ${chunk.index + 1} upload failed (attempt ${attempt}):`, error.message);
      
      // Check if we should retry
      if (attempt < config.maxRetries) {
        // Calculate backoff delay
        const delay = config.exponentialBackoff
          ? config.retryDelayMs * Math.pow(2, attempt - 1)
          : config.retryDelayMs;
        
        console.log(`[ChunkedUpload] Retrying chunk ${chunk.index + 1} after ${delay}ms`);
        
        // Wait before retry
        await this.delay(delay);
        
        // Retry
        return this.uploadChunkWithRetry(sessionId, chunk, attempt + 1);
      } else {
        // Max retries exceeded
        session.failedChunks.set(chunk.index, {
          attempts: attempt,
          lastError: error.message,
        });
        
        throw new Error(`Chunk ${chunk.index + 1} failed after ${attempt} attempts: ${error.message}`);
      }
    }
  }
  
  /**
   * Upload single chunk to server
   */
  private async uploadChunk(
    sessionId: string,
    chunk: ChunkMetadata,
    chunkBlob: Blob
  ): Promise<void> {
    const config = imageOptimizationConfig.getChunkedUploadConfig();
    
    const formData = new FormData();
    formData.append('chunk', chunkBlob);
    formData.append('index', chunk.index.toString());
    formData.append('hash', chunk.hash || '');
    
    const response = await fetch(`http://localhost:8000/v2/upload/chunked/${sessionId}/${chunk.index}`, {
      method: 'PUT',
      body: formData,
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
      },
      signal: AbortSignal.timeout(config.timeoutMs),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
  }
  
  /**
   * Calculate hash of chunk for verification
   */
  private async calculateChunkHash(blob: Blob): Promise<string> {
    const buffer = await blob.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
  }
  
  /**
   * Finalize upload on server
   */
  private async finalizeUpload(sessionId: string): Promise<any> {
    const response = await apiClient.post(`/v2/upload/chunked/${sessionId}/finalize`);
    return response;
  }
  
  /**
   * Update progress callback
   */
  private updateProgress(sessionId: string, startTime: number): void {
    const session = this.sessions.get(sessionId);
    const callback = this.progressCallbacks.get(sessionId);
    
    if (!session || !callback) return;
    
    const uploadedChunks = session.uploadedChunks.size;
    const totalChunks = session.totalChunks;
    const bytesUploaded = uploadedChunks * (session.file.size / totalChunks);
    const totalBytes = session.file.size;
    const percentComplete = (uploadedChunks / totalChunks) * 100;
    
    // Calculate ETA
    const elapsed = Date.now() - startTime;
    const bytesPerMs = bytesUploaded / elapsed;
    const bytesRemaining = totalBytes - bytesUploaded;
    const estimatedTimeRemaining = bytesPerMs > 0 ? bytesRemaining / bytesPerMs : undefined;
    
    const progress: ChunkUploadProgress = {
      sessionId,
      totalChunks,
      uploadedChunks,
      failedChunks: session.failedChunks.size,
      currentChunk: uploadedChunks,
      bytesUploaded,
      totalBytes,
      percentComplete,
      estimatedTimeRemaining,
    };
    
    callback(progress);
  }
  
  /**
   * Resume failed upload
   */
  async resumeUpload(sessionId: string): Promise<any> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }
    
    console.log('[ChunkedUpload] Resuming upload:', sessionId);
    
    // Get chunks that haven't been uploaded
    const config = imageOptimizationConfig.getChunkedUploadConfig();
    const chunkSize = this.calculateChunkSize(session.file.size);
    const allChunks = this.splitFileIntoChunks(session.file, chunkSize);
    
    const pendingChunks = allChunks.filter(chunk => !session.uploadedChunks.has(chunk.index));
    
    console.log('[ChunkedUpload] Resuming', pendingChunks.length, 'pending chunks');
    
    // Reset failed chunks
    session.failedChunks.clear();
    
    // Upload pending chunks
    await this.uploadChunks(sessionId, pendingChunks);
    
    // Finalize
    return this.finalizeUpload(sessionId);
  }
  
  /**
   * Cancel upload
   */
  cancelUpload(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      this.sessions.delete(sessionId);
      this.progressCallbacks.delete(sessionId);
      console.log('[ChunkedUpload] Upload cancelled:', sessionId);
    }
  }
  
  /**
   * Get upload progress
   */
  getProgress(sessionId: string): ChunkUploadProgress | null {
    const session = this.sessions.get(sessionId);
    if (!session) return null;
    
    const uploadedChunks = session.uploadedChunks.size;
    const totalChunks = session.totalChunks;
    const bytesUploaded = uploadedChunks * (session.file.size / totalChunks);
    const totalBytes = session.file.size;
    const percentComplete = (uploadedChunks / totalChunks) * 100;
    
    return {
      sessionId,
      totalChunks,
      uploadedChunks,
      failedChunks: session.failedChunks.size,
      currentChunk: uploadedChunks,
      bytesUploaded,
      totalBytes,
      percentComplete,
    };
  }
  
  /**
   * Utility: Delay
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Singleton instance
export const chunkedUploadService = new ChunkedUploadService();

// Expose to window for debugging
if (typeof window !== 'undefined') {
  (window as any).__chunkedUploadService = {
    getProgress: (sessionId: string) => chunkedUploadService.getProgress(sessionId),
    cancelUpload: (sessionId: string) => chunkedUploadService.cancelUpload(sessionId),
  };
}

export default chunkedUploadService;
