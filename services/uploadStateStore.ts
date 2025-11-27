/**
 * Upload State Store
 * 
 * IndexedDB persistence layer for background uploads.
 * Stores upload state to survive:
 * - Page navigation
 * - Tab close (browser stays open)
 * - Browser restart
 * 
 * Features:
 * - 3 stores: upload_queue, upload_sessions, upload_history
 * - File storage as ArrayBuffer (for recovery)
 * - Auto-cleanup (24 hours)
 * - Quota management
 */

import { openDB, type IDBPDatabase } from 'idb';

const DB_NAME = 'PhotoProofUploads';
const DB_VERSION = 1;

// Store names
const UPLOAD_QUEUE_STORE = 'upload_queue';
const UPLOAD_SESSIONS_STORE = 'upload_sessions';
const UPLOAD_HISTORY_STORE = 'upload_history';

// Cleanup threshold
const CLEANUP_HOURS = 24;
const MAX_FILE_SIZE_FOR_STORAGE = 10 * 1024 * 1024; // 10MB - don't store larger files in IndexedDB

export interface StoredUpload {
  id: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  fileLastModified: number;
  fileData?: ArrayBuffer; // Store file data (only for files < 10MB)
  projectId: string;
  folderId?: string;
  token?: string;
  status: 'pending' | 'uploading' | 'completed' | 'failed' | 'paused';
  progress: number;
  error?: string;
  retryCount: number;
  uploadedChunks?: number[];
  batchId?: number;
  createdAt: number;
  updatedAt: number;
}

export interface UploadSession {
  sessionId: string;
  projectId: string;
  folderId?: string;
  totalFiles: number;
  completedFiles: number;
  failedFiles: number;
  startedAt: number;
  completedAt?: number;
  isActive: boolean;
}

export interface UploadHistoryEntry {
  id: string;
  fileName: string;
  photoId?: string;
  status: 'completed' | 'failed';
  completedAt: number;
  error?: string;
}

class UploadStateStore {
  private db: IDBPDatabase | null = null;
  private initPromise: Promise<void> | null = null;

  /**
   * Initialize IndexedDB
   */
  async init(): Promise<void> {
    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = (async () => {
      try {
        this.db = await openDB(DB_NAME, DB_VERSION, {
          upgrade(db, oldVersion, newVersion, transaction) {
            console.log('[UploadStateStore] Upgrading database from version', oldVersion, 'to', newVersion);

            // Create upload_queue store
            if (!db.objectStoreNames.contains(UPLOAD_QUEUE_STORE)) {
              const queueStore = db.createObjectStore(UPLOAD_QUEUE_STORE, { keyPath: 'id' });
              queueStore.createIndex('status', 'status', { unique: false });
              queueStore.createIndex('projectId', 'projectId', { unique: false });
              queueStore.createIndex('createdAt', 'createdAt', { unique: false });
              console.log('[UploadStateStore] Created upload_queue store');
            }

            // Create upload_sessions store
            if (!db.objectStoreNames.contains(UPLOAD_SESSIONS_STORE)) {
              const sessionStore = db.createObjectStore(UPLOAD_SESSIONS_STORE, { keyPath: 'sessionId' });
              sessionStore.createIndex('isActive', 'isActive', { unique: false });
              sessionStore.createIndex('startedAt', 'startedAt', { unique: false });
              console.log('[UploadStateStore] Created upload_sessions store');
            }

            // Create upload_history store
            if (!db.objectStoreNames.contains(UPLOAD_HISTORY_STORE)) {
              const historyStore = db.createObjectStore(UPLOAD_HISTORY_STORE, { keyPath: 'id' });
              historyStore.createIndex('completedAt', 'completedAt', { unique: false });
              historyStore.createIndex('status', 'status', { unique: false });
              console.log('[UploadStateStore] Created upload_history store');
            }
          },
        });

        console.log('[UploadStateStore] ✅ IndexedDB initialized successfully');
        
        // Run cleanup on init
        await this.cleanupOld();
      } catch (error) {
        console.error('[UploadStateStore] ❌ Failed to initialize IndexedDB:', error);
        throw error;
      }
    })();

    return this.initPromise;
  }

  /**
   * Check storage quota and available space
   */
  async checkQuota(): Promise<{ available: boolean; usage: number; quota: number }> {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      const usage = estimate.usage || 0;
      const quota = estimate.quota || 0;
      const available = usage < quota * 0.9; // Use up to 90% of quota

      console.log('[UploadStateStore] Storage quota:', {
        usage: `${(usage / 1024 / 1024).toFixed(2)} MB`,
        quota: `${(quota / 1024 / 1024).toFixed(2)} MB`,
        available,
      });

      return { available, usage, quota };
    }

    // If storage API not available, assume available
    return { available: true, usage: 0, quota: 0 };
  }

  /**
   * Save upload to IndexedDB
   */
  async saveUpload(upload: StoredUpload, file?: File): Promise<void> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');

    try {
      // Check if we should store file data
      let fileData: ArrayBuffer | undefined;
      
      if (file && file.size < MAX_FILE_SIZE_FOR_STORAGE) {
        const quotaCheck = await this.checkQuota();
        
        if (quotaCheck.available) {
          // Store file as ArrayBuffer for recovery
          fileData = await file.arrayBuffer();
          console.log('[UploadStateStore] Storing file data for:', upload.fileName);
        } else {
          console.warn('[UploadStateStore] Quota exceeded, storing metadata only for:', upload.fileName);
        }
      } else if (file && file.size >= MAX_FILE_SIZE_FOR_STORAGE) {
        console.log('[UploadStateStore] File too large, storing metadata only for:', upload.fileName);
      }

      const uploadToStore: StoredUpload = {
        ...upload,
        fileData,
        updatedAt: Date.now(),
      };

      await this.db.put(UPLOAD_QUEUE_STORE, uploadToStore);
      console.log('[UploadStateStore] Saved upload:', upload.id);
    } catch (error) {
      console.error('[UploadStateStore] Failed to save upload:', error);
      throw error;
    }
  }

  /**
   * Get upload by ID
   */
  async getUpload(id: string): Promise<StoredUpload | undefined> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');

    return await this.db.get(UPLOAD_QUEUE_STORE, id);
  }

  /**
   * Get all pending uploads
   */
  async getPendingUploads(): Promise<StoredUpload[]> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');

    const tx = this.db.transaction(UPLOAD_QUEUE_STORE, 'readonly');
    const index = tx.store.index('status');
    
    const pending = await index.getAll('pending');
    const uploading = await index.getAll('uploading');
    const paused = await index.getAll('paused');
    
    return [...pending, ...uploading, ...paused];
  }

  /**
   * Update upload progress
   */
  async updateProgress(id: string, progress: number, uploadedChunks?: number[]): Promise<void> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');

    const upload = await this.getUpload(id);
    if (!upload) {
      console.warn('[UploadStateStore] Upload not found for progress update:', id);
      return;
    }

    upload.progress = progress;
    upload.status = progress === 100 ? 'completed' : 'uploading';
    upload.updatedAt = Date.now();
    
    if (uploadedChunks) {
      upload.uploadedChunks = uploadedChunks;
    }

    await this.db.put(UPLOAD_QUEUE_STORE, upload);
  }

  /**
   * Update upload status
   */
  async updateStatus(id: string, status: StoredUpload['status'], error?: string): Promise<void> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');

    const upload = await this.getUpload(id);
    if (!upload) {
      console.warn('[UploadStateStore] Upload not found for status update:', id);
      return;
    }

    upload.status = status;
    upload.updatedAt = Date.now();
    
    if (error) {
      upload.error = error;
      upload.retryCount++;
    }

    await this.db.put(UPLOAD_QUEUE_STORE, upload);
  }

  /**
   * Mark upload as completed
   */
  async markCompleted(id: string, photoId?: string): Promise<void> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');

    const upload = await this.getUpload(id);
    if (!upload) {
      console.warn('[UploadStateStore] Upload not found for completion:', id);
      return;
    }

    // Update queue entry
    upload.status = 'completed';
    upload.progress = 100;
    upload.updatedAt = Date.now();
    await this.db.put(UPLOAD_QUEUE_STORE, upload);

    // Add to history
    const historyEntry: UploadHistoryEntry = {
      id,
      fileName: upload.fileName,
      photoId,
      status: 'completed',
      completedAt: Date.now(),
    };
    await this.db.put(UPLOAD_HISTORY_STORE, historyEntry);

    console.log('[UploadStateStore] Marked completed:', id);
  }

  /**
   * Mark upload as failed
   */
  async markFailed(id: string, error: string): Promise<void> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');

    const upload = await this.getUpload(id);
    if (!upload) {
      console.warn('[UploadStateStore] Upload not found for failure:', id);
      return;
    }

    // Update queue entry
    upload.status = 'failed';
    upload.error = error;
    upload.updatedAt = Date.now();
    await this.db.put(UPLOAD_QUEUE_STORE, upload);

    // Add to history
    const historyEntry: UploadHistoryEntry = {
      id,
      fileName: upload.fileName,
      status: 'failed',
      completedAt: Date.now(),
      error,
    };
    await this.db.put(UPLOAD_HISTORY_STORE, historyEntry);

    console.log('[UploadStateStore] Marked failed:', id);
  }

  /**
   * Remove upload from queue
   */
  async removeUpload(id: string): Promise<void> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');

    await this.db.delete(UPLOAD_QUEUE_STORE, id);
    console.log('[UploadStateStore] Removed upload:', id);
  }

  /**
   * Clear all uploads from queue
   */
  async clearQueue(): Promise<void> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');

    await this.db.clear(UPLOAD_QUEUE_STORE);
    console.log('[UploadStateStore] Cleared upload queue');
  }

  /**
   * Save upload session
   */
  async saveSession(session: UploadSession): Promise<void> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');

    await this.db.put(UPLOAD_SESSIONS_STORE, session);
    console.log('[UploadStateStore] Saved session:', session.sessionId);
  }

  /**
   * Get active sessions
   */
  async getActiveSessions(): Promise<UploadSession[]> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');

    const tx = this.db.transaction(UPLOAD_SESSIONS_STORE, 'readonly');
    const index = tx.store.index('isActive');
    
    return await index.getAll(true);
  }

  /**
   * Update session
   */
  async updateSession(sessionId: string, updates: Partial<UploadSession>): Promise<void> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');

    const session = await this.db.get(UPLOAD_SESSIONS_STORE, sessionId);
    if (!session) {
      console.warn('[UploadStateStore] Session not found:', sessionId);
      return;
    }

    const updatedSession = { ...session, ...updates };
    await this.db.put(UPLOAD_SESSIONS_STORE, updatedSession);
  }

  /**
   * Clean up old completed uploads (24 hours)
   */
  async cleanupOld(): Promise<void> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');

    const cutoffTime = Date.now() - (CLEANUP_HOURS * 60 * 60 * 1000);

    try {
      // Clean up completed uploads from queue
      const tx = this.db.transaction(UPLOAD_QUEUE_STORE, 'readwrite');
      const store = tx.store;
      const allUploads = await store.getAll();
      
      let deletedCount = 0;
      for (const upload of allUploads) {
        if (upload.status === 'completed' && upload.updatedAt < cutoffTime) {
          await store.delete(upload.id);
          deletedCount++;
        }
      }

      if (deletedCount > 0) {
        console.log(`[UploadStateStore] Cleaned up ${deletedCount} old uploads from queue`);
      }

      // Clean up old history entries
      const historyTx = this.db.transaction(UPLOAD_HISTORY_STORE, 'readwrite');
      const historyStore = historyTx.store;
      const allHistory = await historyStore.getAll();
      
      let historyDeletedCount = 0;
      for (const entry of allHistory) {
        if (entry.completedAt < cutoffTime) {
          await historyStore.delete(entry.id);
          historyDeletedCount++;
        }
      }

      if (historyDeletedCount > 0) {
        console.log(`[UploadStateStore] Cleaned up ${historyDeletedCount} old history entries`);
      }
    } catch (error) {
      console.error('[UploadStateStore] Failed to cleanup old uploads:', error);
    }
  }

  /**
   * Get upload statistics
   */
  async getStats(): Promise<{
    pending: number;
    uploading: number;
    completed: number;
    failed: number;
    total: number;
  }> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');

    const allUploads = await this.db.getAll(UPLOAD_QUEUE_STORE);
    
    const stats = {
      pending: 0,
      uploading: 0,
      completed: 0,
      failed: 0,
      total: allUploads.length,
    };

    for (const upload of allUploads) {
      stats[upload.status]++;
    }

    return stats;
  }

  /**
   * Restore File from stored ArrayBuffer
   */
  async restoreFile(upload: StoredUpload): Promise<File | null> {
    if (!upload.fileData) {
      console.warn('[UploadStateStore] No file data stored for:', upload.fileName);
      return null;
    }

    try {
      const file = new File(
        [upload.fileData],
        upload.fileName,
        {
          type: upload.fileType,
          lastModified: upload.fileLastModified,
        }
      );
      console.log('[UploadStateStore] Restored file:', upload.fileName);
      return file;
    } catch (error) {
      console.error('[UploadStateStore] Failed to restore file:', error);
      return null;
    }
  }
}

// Singleton instance
export const uploadStateStore = new UploadStateStore();
