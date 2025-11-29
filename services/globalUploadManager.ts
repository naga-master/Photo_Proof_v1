/**
 * Global Upload Manager
 * 
 * Singleton orchestrator for all uploads across the application.
 * Coordinates with UploadQueueManager and UploadStateStore to enable:
 * - Navigation resilience (upload widget follows to all pages)
 * - Tab close resilience (Service Worker continues uploads)
 * - Browser restart recovery (restore from IndexedDB)
 * - Network loss auto-resume (via networkDetectionService)
 * 
 * Flow:
 * 1. User starts upload → globalUploadManager.startUploads()
 * 2. Save to IndexedDB → delegate to uploadQueueManager
 * 3. Subscribe to progress → update widget on all pages
 * 4. On completion → update IndexedDB, notify subscribers
 */

import { uploadQueueManager, type QueuedUpload } from './uploadQueueManager';
import { uploadStateStore, type StoredUpload, type UploadSession } from './uploadStateStore';
import { networkDetectionService } from './networkDetectionService';
import { notificationService } from './notificationService';
import { uploadHistoryStore } from './uploadHistoryStore';
import { v4 as uuidv4 } from 'uuid';

export interface UploadProgress {
  id: string;
  fileName: string;
  fileSize: number;
  status: 'pending' | 'uploading' | 'completed' | 'failed' | 'paused';
  progress: number;
  error?: string;
  photoId?: string;
  sessionId: string; // Track which session this upload belongs to
}

// Individual upload session (one per project upload)
export interface UploadSessionState {
  sessionId: string;
  projectId: string;
  projectName: string;
  folderId?: string;
  isActive: boolean;
  isPaused: boolean;
  totalFiles: number;
  completedFiles: number;
  failedFiles: number;
  currentFile: string | null;
  overallProgress: number;
  uploads: Map<string, UploadProgress>;
}

// Global state contains all sessions
export interface GlobalUploadState {
  // Multi-session support
  sessions: Map<string, UploadSessionState>;
  
  // Legacy single-session interface (for backward compatibility with widget)
  // Points to the most recent/active session
  isActive: boolean;
  isPaused: boolean;
  sessionId: string | null;
  projectId: string | null;
  projectName: string | null;
  folderId?: string;
  totalFiles: number;
  completedFiles: number;
  failedFiles: number;
  currentFile: string | null;
  overallProgress: number;
  uploads: Map<string, UploadProgress>;
}

export interface StartUploadOptions {
  files: File[];
  projectId: string;
  projectName?: string;
  folderId?: string;
  folderPath?: string;
}

type StateSubscriber = (state: GlobalUploadState) => void;

class GlobalUploadManager {
  // Multi-session state
  private sessions: Map<string, UploadSessionState> = new Map();
  
  // Legacy single-session state (computed from sessions for backward compatibility)
  private state: GlobalUploadState = {
    sessions: new Map(),
    isActive: false,
    isPaused: false,
    sessionId: null,
    projectId: null,
    projectName: null,
    folderId: undefined,
    totalFiles: 0,
    completedFiles: 0,
    failedFiles: 0,
    currentFile: null,
    overallProgress: 0,
    uploads: new Map(),
  };

  // Callback for when upload completes (to refresh project list)
  private onUploadCompleteCallback?: (projectId: string, projectName: string, status: 'success' | 'partial' | 'failed') => void;

  private subscribers: Set<StateSubscriber> = new Set();
  private initialized = false;
  private networkOnlineHandler: (() => void) | null = null;
  private networkOfflineHandler: (() => void) | null = null;
  private beforeUnloadHandler: ((e: BeforeUnloadEvent) => void) | null = null;
  private storageQuotaCheckInterval: number | null = null;

  /**
   * Constructor - registers uploadQueueManager subscriber immediately
   * This ensures callbacks work even before init() is called
   */
  constructor() {
    console.log('[GlobalUploadManager] Constructor - registering uploadQueueManager subscriber');
    this.registerUploadQueueSubscriber();
  }

  /**
   * Register the uploadQueueManager subscriber with session-aware callbacks
   * Called from constructor to ensure it's ready before any uploads start
   */
  private registerUploadQueueSubscriber(): void {
    uploadQueueManager.registerSubscriber('global-upload-manager', {
      onProgress: (uploadId, progress) => {
        const session = this.findSessionForUpload(uploadId);
        if (session) {
          const upload = session.uploads.get(uploadId);
          if (upload) {
            upload.progress = progress;
            upload.status = 'uploading';
            this.updateSessionProgress(session);
            this.notifySubscribers();
          }
        }
        this.handleUploadProgress(uploadId, progress);
      },
      onSuccess: (uploadId, result) => {
        console.log('[GlobalUploadManager] 📥 onSuccess callback:', {
          uploadId,
          sessionsCount: this.sessions.size,
        });
        
        const session = this.findSessionForUpload(uploadId);
        console.log('[GlobalUploadManager] 🔍 Session lookup:', {
          found: !!session,
          sessionId: session?.sessionId,
          uploadInSession: session?.uploads.has(uploadId),
        });
        
        if (session) {
          const upload = session.uploads.get(uploadId);
          if (upload) {
            upload.progress = 100;
            upload.status = 'completed';
            session.completedFiles++;
            console.log('[GlobalUploadManager] ✅ Updated session:', {
              completedFiles: session.completedFiles,
              totalFiles: session.totalFiles,
            });
            this.updateSessionProgress(session);
            this.notifySubscribers();
            
            if (session.completedFiles + session.failedFiles >= session.totalFiles) {
              console.log(`[GlobalUploadManager] ✅ Session ${session.sessionId} complete!`);
              this.handleSessionComplete(session.sessionId);
            }
          } else {
            console.warn('[GlobalUploadManager] ⚠️ Upload NOT FOUND in session:', uploadId);
          }
        } else {
          console.warn('[GlobalUploadManager] ⚠️ Session NOT FOUND for upload:', uploadId);
        }
        this.handleUploadSuccess(uploadId, result);
      },
      onError: (uploadId, error) => {
        const session = this.findSessionForUpload(uploadId);
        if (session) {
          const upload = session.uploads.get(uploadId);
          if (upload) {
            upload.status = 'failed';
            upload.error = error;
            session.failedFiles++;
            this.updateSessionProgress(session);
            this.notifySubscribers();
            
            if (session.completedFiles + session.failedFiles >= session.totalFiles) {
              console.log(`[GlobalUploadManager] Session ${session.sessionId} finished (with failures)`);
              this.handleSessionComplete(session.sessionId);
            }
          }
        }
        this.handleUploadError(uploadId, error);
      },
      onQueueUpdate: (queue) => {
        this.handleQueueUpdate(queue);
      },
    });
  }

  /**
   * Initialize the Global Upload Manager
   */
  async init(): Promise<void> {
    if (this.initialized) return;

    console.log('[GlobalUploadManager] Initializing...');

    try {
      // Initialize upload state store
      await uploadStateStore.init();

      // NOTE: uploadQueueManager subscriber is registered in constructor
      // This ensures callbacks work even before init() is called

      // Set up network monitoring
      this.setupNetworkMonitoring();

      // Set up beforeunload handler for tab close warning
      this.setupBeforeUnloadHandler();

      // Set up storage quota monitoring
      this.setupStorageQuotaMonitoring();

      // Request notification permission
      await notificationService.requestPermission();

      // Check for pending uploads on init
      await this.checkPendingUploads();

      this.initialized = true;
      console.log('[GlobalUploadManager] ✅ Initialized successfully');
    } catch (error) {
      console.error('[GlobalUploadManager] ❌ Initialization failed:', error);
      throw error;
    }
  }

  /**
   * Setup network monitoring for auto-resume
   */
  private setupNetworkMonitoring(): void {
    this.networkOnlineHandler = () => {
      console.log('[GlobalUploadManager] Network online - auto-resuming uploads');
      if (this.state.isPaused && this.state.isActive) {
        const pendingCount = Array.from(this.state.uploads.values()).filter(
          u => u.status === 'paused' || u.status === 'pending'
        ).length;
        
        if (pendingCount > 0) {
          // Show notification that uploads are resuming
          notificationService.notifyNetworkRestored(pendingCount);
          
          // Register background sync for reliability
          this.registerBackgroundSync();
        }
        
        this.resumeUploads();
      }
    };

    this.networkOfflineHandler = () => {
      console.log('[GlobalUploadManager] Network offline - pausing uploads');
      if (this.state.isActive && !this.state.isPaused) {
        const uploadingCount = Array.from(this.state.uploads.values()).filter(
          u => u.status === 'uploading' || u.status === 'pending'
        ).length;
        
        if (uploadingCount > 0) {
          // Show notification that uploads are paused
          notificationService.notifyNetworkLost(uploadingCount);
        }
        
        this.pauseUploads(true); // true = auto-pause (not user-initiated)
      }
    };

    networkDetectionService.subscribe('online', this.networkOnlineHandler);
    networkDetectionService.subscribe('offline', this.networkOfflineHandler);
  }

  /**
   * Setup beforeunload handler to warn user about active uploads
   */
  private setupBeforeUnloadHandler(): void {
    this.beforeUnloadHandler = (e: BeforeUnloadEvent) => {
      // Only show warning if uploads are active
      if (this.state.isActive && !this.state.isPaused) {
        const pendingCount = this.state.totalFiles - this.state.completedFiles - this.state.failedFiles;
        
        if (pendingCount > 0) {
          const message = `You have ${pendingCount} files still uploading. If you close this tab, uploads will be paused and you can resume them later.`;
          e.preventDefault();
          e.returnValue = message;
          return message;
        }
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', this.beforeUnloadHandler);
      console.log('[GlobalUploadManager] beforeunload handler registered');
    }
  }

  /**
   * Setup storage quota monitoring
   */
  private setupStorageQuotaMonitoring(): void {
    // Check quota every 30 seconds during active uploads
    const checkQuota = async () => {
      if (!this.state.isActive) return;

      try {
        const quotaInfo = await uploadStateStore.checkQuota();
        
        // Warn if usage is above 90%
        if (!quotaInfo.available && quotaInfo.quota > 0) {
          const usagePercent = (quotaInfo.usage / quotaInfo.quota) * 100;
          console.warn(`[GlobalUploadManager] Storage quota at ${usagePercent.toFixed(1)}%`);
          
          // Show notification if quota is high
          if (usagePercent > 90) {
            notificationService.notifyStorageQuotaWarning();
          }
        }
      } catch (error) {
        console.error('[GlobalUploadManager] Failed to check storage quota:', error);
      }
    };

    // Check immediately and then every 30 seconds
    if (typeof window !== 'undefined') {
      this.storageQuotaCheckInterval = window.setInterval(checkQuota, 30000);
    }
  }

  /**
   * Register background sync for auto-retry
   */
  private async registerBackgroundSync(): Promise<void> {
    if ('serviceWorker' in navigator && 'sync' in ServiceWorkerRegistration.prototype) {
      try {
        const registration = await navigator.serviceWorker.ready;
        await registration.sync.register('upload-retry');
        console.log('[GlobalUploadManager] Background sync registered');
      } catch (error) {
        console.warn('[GlobalUploadManager] Background sync registration failed:', error);
      }
    } else {
      console.log('[GlobalUploadManager] Background sync not supported');
    }
  }

  /**
   * Check for pending uploads from previous session
   */
  async checkPendingUploads(): Promise<StoredUpload[]> {
    try {
      const pendingUploads = await uploadStateStore.getPendingUploads();
      
      if (pendingUploads.length > 0) {
        console.log(`[GlobalUploadManager] Found ${pendingUploads.length} pending uploads from previous session`);
      }
      
      return pendingUploads;
    } catch (error) {
      console.error('[GlobalUploadManager] Failed to check pending uploads:', error);
      return [];
    }
  }

  /**
   * Resume uploads from previous session
   */
  async resumeFromPrevious(uploads: StoredUpload[]): Promise<void> {
    if (uploads.length === 0) return;

    console.log(`[GlobalUploadManager] Resuming ${uploads.length} uploads from previous session`);

    try {
      // Create session
      const sessionId = uuidv4();
      const projectId = uploads[0].projectId;
      const folderId = uploads[0].folderId;

      this.state.sessionId = sessionId;
      this.state.projectId = projectId;
      this.state.folderId = folderId;
      this.state.isActive = true;
      this.state.isPaused = false;
      this.state.totalFiles = uploads.length;
      this.state.completedFiles = 0;
      this.state.failedFiles = 0;

      // Save session
      const session: UploadSession = {
        sessionId,
        projectId,
        folderId,
        totalFiles: uploads.length,
        completedFiles: 0,
        failedFiles: 0,
        startedAt: Date.now(),
        isActive: true,
      };
      await uploadStateStore.saveSession(session);

      // Convert stored uploads to queued uploads
      const queuedUploads: QueuedUpload[] = [];
      
      for (const upload of uploads) {
        // Try to restore file from IndexedDB
        const file = await uploadStateStore.restoreFile(upload);
        
        if (file) {
          queuedUploads.push({
            id: upload.id,
            file,
            projectId: upload.projectId,
            folderId: upload.folderId,
            token: upload.token,
            status: 'pending',
            progress: upload.progress,
            retryCount: upload.retryCount,
            maxRetries: 3,
            batchId: upload.batchId,
          });

          // Update state
          this.state.uploads.set(upload.id, {
            id: upload.id,
            fileName: upload.fileName,
            fileSize: upload.fileSize,
            status: 'pending',
            progress: upload.progress,
          });
        } else {
          console.warn('[GlobalUploadManager] Could not restore file:', upload.fileName);
          // Mark as failed - file data not available
          await uploadStateStore.markFailed(upload.id, 'File data not available for resume');
        }
      }

      if (queuedUploads.length > 0) {
        // Add to upload queue
        await uploadQueueManager.addToQueue(queuedUploads);
        
        // Start processing
        await uploadQueueManager.processQueue();
        
        this.notifySubscribers();
      }
    } catch (error) {
      console.error('[GlobalUploadManager] Failed to resume uploads:', error);
      throw error;
    }
  }

  /**
   * Clear all session data - call when widget is closed or new upload starts
   */
  clearSession(): void {
    console.log('[GlobalUploadManager] Clearing all session data...');
    
    // Clear all sessions
    this.sessions.clear();
    
    // Reset legacy state
    this.state.sessions = new Map();
    this.state.isActive = false;
    this.state.isPaused = false;
    this.state.sessionId = null;
    this.state.projectId = null;
    this.state.projectName = null;
    this.state.folderId = undefined;
    this.state.totalFiles = 0;
    this.state.completedFiles = 0;
    this.state.failedFiles = 0;
    this.state.currentFile = null;
    this.state.overallProgress = 0;
    this.state.uploads.clear();
    
    // Clear the upload queue (but keep subscribers registered for future uploads)
    uploadQueueManager.clearAll();
    
    console.log('[GlobalUploadManager] Session data cleared');
    
    // Notify subscribers (widget will hide)
    this.notifySubscribers();
  }

  /**
   * Start new upload session
   */
  async startUploads(options: StartUploadOptions): Promise<void> {
    const { files, projectId, projectName, folderId, folderPath } = options;

    if (files.length === 0) {
      console.warn('[GlobalUploadManager] No files to upload');
      return;
    }

    console.log(`[GlobalUploadManager] Starting upload of ${files.length} files`);
    
    // Clear only completed sessions (preserve sessions with failures for retry)
    console.log('[GlobalUploadManager] Cleaning up completed sessions...');
    for (const [id, session] of this.sessions) {
      if (!session.isActive && session.failedFiles === 0) {
        console.log(`[GlobalUploadManager] Removing completed session: ${id}`);
        this.sessions.delete(id);
      }
    }
    
    // Clear the upload queue for new uploads
    uploadQueueManager.clearAll();

    try {
      // Check for duplicates (skip if IndexedDB fails or takes too long)
      console.log('[GlobalUploadManager] Checking for duplicates...');
      let duplicates: StoredUpload[] = [];
      try {
        // Add 2 second timeout for duplicate check - don't let it block uploads
        const timeoutPromise = new Promise<StoredUpload[]>((_, reject) => 
          setTimeout(() => reject(new Error('Duplicate check timeout')), 2000)
        );
        duplicates = await Promise.race([this.checkDuplicates(files), timeoutPromise]);
        if (duplicates.length > 0) {
          console.warn(`[GlobalUploadManager] Found ${duplicates.length} duplicate uploads`);
        }
      } catch (dupError) {
        console.warn('[GlobalUploadManager] Duplicate check skipped (non-critical):', dupError);
      }
      console.log('[GlobalUploadManager] Duplicate check complete');

      // Create new session (supports multiple concurrent uploads)
      const sessionId = uuidv4();
      const sessionState: UploadSessionState = {
        sessionId,
        projectId,
        projectName: projectName || 'Untitled Project',
        folderId,
        isActive: true,
        isPaused: false,
        totalFiles: files.length,
        completedFiles: 0,
        failedFiles: 0,
        currentFile: null,
        overallProgress: 0,
        uploads: new Map(),
      };
      
      // Add to sessions Map
      this.sessions.set(sessionId, sessionState);
      
      // Update legacy state to point to this session (for backward compatibility)
      this.state.sessionId = sessionId;
      this.state.projectId = projectId;
      this.state.projectName = projectName || 'Untitled Project';
      this.state.folderId = folderId;
      this.state.isActive = true;
      this.state.isPaused = false;
      this.state.totalFiles = files.length;
      this.state.completedFiles = 0;
      this.state.failedFiles = 0;
      this.state.uploads = sessionState.uploads; // Share the same Map
      
      // Notify immediately to show widget
      console.log('[GlobalUploadManager] Session starting, notifying subscribers...', {
        isActive: this.state.isActive,
        totalFiles: this.state.totalFiles,
        projectName: this.state.projectName,
        subscriberCount: this.subscribers.size,
      });
      this.notifySubscribers();

      // Save session to IndexedDB (non-blocking, continue on error)
      console.log('[GlobalUploadManager] Creating session...');
      const session: UploadSession = {
        sessionId,
        projectId,
        folderId,
        totalFiles: files.length,
        completedFiles: 0,
        failedFiles: 0,
        startedAt: Date.now(),
        isActive: true,
      };
      // Don't block on IndexedDB - fire and forget with timeout
      uploadStateStore.saveSession(session)
        .then(() => console.log('[GlobalUploadManager] Session saved to IndexedDB'))
        .catch(err => console.warn('[GlobalUploadManager] Failed to save session (non-critical):', err));
      console.log('[GlobalUploadManager] Session created (IndexedDB save in background)');

      // Create queued uploads
      // IMPORTANT: Use same ID format as UploadContext to match callbacks
      console.log('[GlobalUploadManager] Creating queued uploads...');
      const queuedUploads: QueuedUpload[] = files.map((file) => {
        // Include sessionId in uploadId to make it unique per session
        // This prevents conflicts when uploading same files to different projects
        const uploadId = `${sessionId}-${file.name}-${file.lastModified}`;
        
        // Save to IndexedDB with file data
        const storedUpload: StoredUpload = {
          id: uploadId,
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
          fileLastModified: file.lastModified,
          projectId,
          folderId,
          status: 'pending',
          progress: 0,
          retryCount: 0,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        
        // Save asynchronously (don't block)
        uploadStateStore.saveUpload(storedUpload, file).catch((error) => {
          console.error('[GlobalUploadManager] Failed to save upload to IndexedDB:', error);
        });

        // Update state (both session and legacy state share the same Map)
        const uploadProgress: UploadProgress = {
          id: uploadId,
          fileName: file.name,
          fileSize: file.size,
          status: 'pending',
          progress: 0,
          sessionId, // Track which session this upload belongs to
        };
        sessionState.uploads.set(uploadId, uploadProgress);

        return {
          id: uploadId,
          file,
          projectId,
          folderId,
          status: 'pending' as const,
          progress: 0,
          retryCount: 0,
          maxRetries: 3,
        };
      });
      console.log('[GlobalUploadManager] Created', queuedUploads.length, 'queued uploads');
      
      // DEBUG: Verify uploads are in session
      console.log('[GlobalUploadManager] 📋 Session uploads verification:', {
        sessionId,
        sessionUploadsCount: sessionState.uploads.size,
        sampleUploadIds: Array.from(sessionState.uploads.keys()).slice(0, 5),
        sessionsMapSize: this.sessions.size,
        sessionInMap: this.sessions.has(sessionId),
      });

      // Add to upload queue
      console.log('[GlobalUploadManager] Adding', queuedUploads.length, 'files to queue...');
      await uploadQueueManager.addToQueue(queuedUploads);
      console.log('[GlobalUploadManager] Files added to queue');

      // NOTE: Callbacks are registered ONCE in init() using Named Subscriber Pattern
      // No need to set callbacks here - they are session-aware and route to correct session

      // Start processing
      console.log('[GlobalUploadManager] Starting queue processing...');
      await uploadQueueManager.processQueue();
      console.log('[GlobalUploadManager] Queue processing started');

      this.notifySubscribers();
      console.log('[GlobalUploadManager] ✅ Upload session started:', sessionId);
    } catch (error) {
      console.error('[GlobalUploadManager] ❌ Failed to start uploads:', error);
      throw error;
    }
  }

  /**
   * Pause all uploads
   */
  pauseUploads(autoPause = false): void {
    if (!this.state.isActive) {
      console.warn('[GlobalUploadManager] No active uploads to pause');
      return;
    }

    console.log(`[GlobalUploadManager] ${autoPause ? 'Auto-pausing' : 'Pausing'} uploads`);
    
    this.state.isPaused = true;
    uploadQueueManager.pauseAll();

    // Update all uploads to paused status
    this.state.uploads.forEach((upload) => {
      if (upload.status === 'uploading' || upload.status === 'pending') {
        upload.status = 'paused';
        uploadStateStore.updateStatus(upload.id, 'paused').catch(console.error);
      }
    });

    this.notifySubscribers();
  }

  /**
   * Resume all uploads
   */
  resumeUploads(): void {
    if (!this.state.isActive) {
      console.warn('[GlobalUploadManager] No active uploads to resume');
      return;
    }

    console.log('[GlobalUploadManager] Resuming uploads');
    
    this.state.isPaused = false;
    uploadQueueManager.resumeAll();

    // Update all paused uploads to pending status
    this.state.uploads.forEach((upload) => {
      if (upload.status === 'paused') {
        upload.status = 'pending';
        uploadStateStore.updateStatus(upload.id, 'pending').catch(console.error);
      }
    });

    this.notifySubscribers();
  }

  /**
   * Cancel all uploads
   */
  async cancelUploads(): Promise<void> {
    console.log('[GlobalUploadManager] Cancelling all uploads');

    uploadQueueManager.clearAll();
    
    // Clear state
    this.state.isActive = false;
    this.state.isPaused = false;
    this.state.sessionId = null;
    this.state.uploads.clear();

    // Clear IndexedDB queue
    await uploadStateStore.clearQueue();

    this.notifySubscribers();
  }

  /**
   * Retry failed uploads
   * Works in both active upload state AND completion state
   * @param sessionId - Optional session ID to retry failed uploads for a specific session
   */
  async retryFailed(sessionId?: string): Promise<void> {
    console.log('[GlobalUploadManager] Retrying failed uploads', sessionId ? `for session: ${sessionId}` : '(all sessions)');
    
    // Get the target session or use legacy state
    let targetSession: UploadSessionState | null = null;
    let allUploads: UploadProgress[] = [];
    
    if (sessionId) {
      targetSession = this.sessions.get(sessionId) || null;
      if (targetSession) {
        allUploads = Array.from(targetSession.uploads.values());
        console.log('[GlobalUploadManager] Found session:', {
          sessionId,
          projectName: targetSession.projectName,
          uploadsCount: allUploads.length,
        });
      } else {
        console.warn('[GlobalUploadManager] Session not found:', sessionId);
      }
    }
    
    // Fallback to legacy state if no session found
    if (allUploads.length === 0) {
      allUploads = Array.from(this.state.uploads.values());
    }
    
    console.log('[GlobalUploadManager] Total uploads to check:', allUploads.length);
    console.log('[GlobalUploadManager] Upload statuses:', allUploads.map(u => ({ id: u.id.substring(0, 20), status: u.status })));
    
    // Get failed uploads
    const failedUploads = allUploads.filter(u => u.status === 'failed');
    
    if (failedUploads.length === 0) {
      console.warn('[GlobalUploadManager] No failed uploads to retry');
      console.warn('[GlobalUploadManager] Looking for uploads in queue instead...');
      
      // Fallback: Check queue for failed files
      const queuedFiles = uploadQueueManager.getQueue();
      const queueFailedFiles = queuedFiles.filter(q => q.status === 'failed');
      console.log('[GlobalUploadManager] Queue has', queueFailedFiles.length, 'failed files');
      
      if (queueFailedFiles.length > 0) {
        // Files are in queue but not in state - use queue retry
        if (targetSession) {
          targetSession.isActive = true;
        }
        this.state.isActive = true;
        this.notifySubscribers();
        await uploadQueueManager.retryFailed();
        await uploadQueueManager.processQueue(true);
        console.log('[GlobalUploadManager] ✅ Retry started via queue');
      }
      return;
    }
    
    console.log(`[GlobalUploadManager] 🔄 Retrying ${failedUploads.length} failed uploads`);
    
    // Reset failed upload statuses
    for (const upload of failedUploads) {
      upload.status = 'uploading';
      upload.progress = 0;
      upload.error = undefined;
    }
    
    // Update session state
    if (targetSession) {
      targetSession.failedFiles = 0;
      targetSession.isActive = true;
      targetSession.isPaused = false;
    }
    
    // Update legacy state
    this.state.failedFiles = Math.max(0, this.state.failedFiles - failedUploads.length);
    this.state.isActive = true;
    this.notifySubscribers();
    
    // Check if files are still in queue (active upload state)
    const queuedFiles = uploadQueueManager.getQueue();
    const queueHasFailedFiles = queuedFiles.some(q => q.status === 'failed');
    console.log('[GlobalUploadManager] Queue status:', { 
      queueLength: queuedFiles.length, 
      hasFailedFiles: queueHasFailedFiles,
      statuses: queuedFiles.map(q => q.status).slice(0, 10)
    });
    
    if (queueHasFailedFiles) {
      // Files still in queue - just reset and process
      console.log('[GlobalUploadManager] Files found in queue, using queue retry');
      await uploadQueueManager.retryFailed();
    } else {
      // Completion state - fetch files from IndexedDB
      console.log('[GlobalUploadManager] Files not in queue, fetching from IndexedDB');
      console.log('[GlobalUploadManager] Processing', failedUploads.length, 'failed uploads from IndexedDB');
      
      let restoredCount = 0;
      let failedToRestoreCount = 0;
      
      for (const upload of failedUploads) {
        try {
          console.log('[GlobalUploadManager] Looking up upload in IndexedDB:', upload.id.substring(0, 60));
          const storedUpload = await uploadStateStore.getUpload(upload.id);
          console.log('[GlobalUploadManager] IndexedDB lookup result:', {
            found: !!storedUpload,
            hasFileData: !!storedUpload?.fileData,
            fileName: upload.fileName,
          });
          
          if (storedUpload?.fileData) {
            // Restore File object from stored ArrayBuffer
            const file = await uploadStateStore.restoreFile(storedUpload);
            if (file) {
              console.log('[GlobalUploadManager] ✅ Restored file from IndexedDB:', upload.fileName);
              await uploadQueueManager.retryUploadById(upload.id, file);
              restoredCount++;
            } else {
              console.error('[GlobalUploadManager] ❌ Failed to restore file from IndexedDB:', upload.id);
              upload.status = 'failed';
              upload.error = 'Failed to restore file from storage';
              if (targetSession) {
                targetSession.failedFiles++;
              }
              this.state.failedFiles++;
              failedToRestoreCount++;
            }
          } else {
            console.error('[GlobalUploadManager] ❌ File data not found in IndexedDB:', upload.id);
            upload.status = 'failed';
            upload.error = 'File data not found in storage';
            if (targetSession) {
              targetSession.failedFiles++;
            }
            this.state.failedFiles++;
            failedToRestoreCount++;
          }
        } catch (error) {
          console.error('[GlobalUploadManager] ❌ Error retrieving upload from IndexedDB:', upload.id, error);
          upload.status = 'failed';
          upload.error = 'Error accessing storage';
          if (targetSession) {
            targetSession.failedFiles++;
          }
          this.state.failedFiles++;
          failedToRestoreCount++;
        }
      }
      
      console.log('[GlobalUploadManager] IndexedDB restore summary:', {
        restored: restoredCount,
        failed: failedToRestoreCount,
        total: failedUploads.length,
      });
    }
    
    // Start processing
    await uploadQueueManager.processQueue(true);
    
    console.log(`[GlobalUploadManager] ✅ Retry started for ${failedUploads.length} uploads`);
  }

  /**
   * Get current state
   */
  getState(): GlobalUploadState {
    // Include sessions in state for multi-widget rendering
    return { 
      ...this.state,
      sessions: new Map(this.sessions), // Copy the sessions Map
    };
  }

  /**
   * Get all active sessions
   */
  getSessions(): Map<string, UploadSessionState> {
    return new Map(this.sessions);
  }

  /**
   * Find which session an upload belongs to
   */
  private findSessionForUpload(uploadId: string): UploadSessionState | null {
    // First check current session
    for (const session of this.sessions.values()) {
      if (session.uploads.has(uploadId)) {
        return session;
      }
    }
    return null;
  }

  /**
   * Update session progress
   */
  private updateSessionProgress(session: UploadSessionState): void {
    if (session.totalFiles === 0) {
      session.overallProgress = 0;
      return;
    }

    const totalProgress = Array.from(session.uploads.values()).reduce(
      (sum, upload) => sum + upload.progress,
      0
    );

    session.overallProgress = totalProgress / session.totalFiles;
    
    // Also update legacy state if this is the current session
    if (this.state.sessionId === session.sessionId) {
      this.state.overallProgress = session.overallProgress;
      this.state.completedFiles = session.completedFiles;
      this.state.failedFiles = session.failedFiles;
    }
  }

  /**
   * Subscribe to state changes
   */
  subscribe(callback: StateSubscriber): () => void {
    console.log('[GlobalUploadManager] 📢 New subscriber added. Total subscribers:', this.subscribers.size + 1);
    this.subscribers.add(callback);
    
    // Immediately call with current state
    callback(this.getState());
    
    // Return unsubscribe function
    return () => {
      console.log('[GlobalUploadManager] 📤 Subscriber removed. Total subscribers:', this.subscribers.size - 1);
      this.subscribers.delete(callback);
    };
  }

  /**
   * Handle upload progress update
   */
  private handleUploadProgress(uploadId: string, progress: number): void {
    const upload = this.state.uploads.get(uploadId);
    if (!upload) return;

    upload.progress = progress;
    upload.status = 'uploading';

    // Update IndexedDB
    uploadStateStore.updateProgress(uploadId, progress).catch(console.error);

    // Update overall progress
    this.updateOverallProgress();
    this.notifySubscribers();
  }

  /**
   * Handle upload success
   * NOTE: Counter increment and session completion are handled by session-aware callbacks in startUploads()
   */
  private handleUploadSuccess(uploadId: string, result: any): void {
    const upload = this.state.uploads.get(uploadId);
    if (!upload) return;

    upload.progress = 100;
    upload.status = 'completed';
    upload.photoId = result.id ? String(result.id) : undefined;

    // NOTE: Do NOT increment this.state.completedFiles here!
    // The session-aware callbacks in startUploads() handle counting to prevent double-counting.

    // Update IndexedDB
    uploadStateStore.markCompleted(uploadId, upload.photoId).catch(console.error);

    // NOTE: Do NOT call handleSessionComplete() here!
    // Session completion is handled by session-aware callbacks to prevent duplicate notifications.

    this.updateOverallProgress();
    this.notifySubscribers();
  }

  /**
   * Handle upload error
   * NOTE: Counter increment and session completion are handled by session-aware callbacks in startUploads()
   */
  private handleUploadError(uploadId: string, error: string): void {
    const upload = this.state.uploads.get(uploadId);
    if (!upload) return;

    upload.status = 'failed';
    upload.error = error;

    // NOTE: Do NOT increment this.state.failedFiles here!
    // The session-aware callbacks in startUploads() handle counting to prevent double-counting.

    // Update IndexedDB
    uploadStateStore.markFailed(uploadId, error).catch(console.error);

    // NOTE: Do NOT call handleSessionComplete() here!
    // Session completion is handled by session-aware callbacks to prevent duplicate notifications.

    this.updateOverallProgress();
    this.notifySubscribers();
  }

  /**
   * Handle queue update
   */
  private handleQueueUpdate(queue: QueuedUpload[]): void {
    // Sync with our state
    for (const queuedUpload of queue) {
      const upload = this.state.uploads.get(queuedUpload.id);
      if (upload) {
        // Map queue status to upload status
        const status = queuedUpload.status;
        upload.status = (status === 'pending' || status === 'uploading' || status === 'completed' || status === 'failed')
          ? status
          : 'pending';
        upload.progress = queuedUpload.progress;
      }
    }

    this.notifySubscribers();
  }

  /**
   * Handle session complete
   */
  private handleSessionComplete(sessionId?: string): void {
    // Find the session to complete
    const session = sessionId ? this.sessions.get(sessionId) : null;
    
    // Use session data if available, otherwise fall back to legacy state
    const totalFiles = session?.totalFiles ?? this.state.totalFiles;
    const completedFiles = session?.completedFiles ?? this.state.completedFiles;
    const failedFiles = session?.failedFiles ?? this.state.failedFiles;
    const projectId = session?.projectId ?? this.state.projectId;
    const projectName = session?.projectName ?? this.state.projectName;
    const targetSessionId = sessionId ?? this.state.sessionId;
    
    console.log('[GlobalUploadManager] 🏁 Session complete:', {
      sessionId: targetSessionId,
      total: totalFiles,
      completed: completedFiles,
      failed: failedFiles,
      projectId,
      projectName,
    });

    // Determine status
    const status: 'success' | 'partial' | 'failed' = 
      failedFiles === 0 ? 'success' :
      completedFiles > 0 ? 'partial' :
      'failed';

    // Update session state
    if (session) {
      session.isActive = false;
      session.isPaused = false;
    }
    
    // Update legacy state if this is the current session
    if (targetSessionId === this.state.sessionId) {
      this.state.isActive = false;
      this.state.isPaused = false;
    }

    // Save to upload history for NotificationsPage
    console.log('[GlobalUploadManager] Saving to upload history...');
    uploadHistoryStore.addEntry({
      projectId: projectId || '',
      projectName: projectName || 'Untitled Project',
      totalFiles,
      completedFiles,
      failedFiles,
      status,
    });
    console.log('[GlobalUploadManager] Upload history entry added');

    // Show browser notification
    notificationService.notifyUploadComplete(
      totalFiles,
      failedFiles
    );

    // Update session in IndexedDB
    if (targetSessionId) {
      uploadStateStore.updateSession(targetSessionId, {
        isActive: false,
        completedAt: Date.now(),
      }).catch(console.error);
    }

    // Call completion callback (for App.tsx to refresh project list)
    if (this.onUploadCompleteCallback && projectId) {
      console.log('[GlobalUploadManager] 📞 Calling completion callback...');
      console.log('[GlobalUploadManager] Callback registered:', !!this.onUploadCompleteCallback);
      console.log('[GlobalUploadManager] Project ID:', projectId);
      
      try {
        this.onUploadCompleteCallback(
          projectId,
          projectName || 'Untitled Project',
          status
        );
        console.log('[GlobalUploadManager] ✅ Completion callback executed successfully');
      } catch (error) {
        console.error('[GlobalUploadManager] ❌ Completion callback threw error:', error);
      }
    } else {
      console.error('[GlobalUploadManager] ❌ Completion callback NOT CALLED:', {
        hasCallback: !!this.onUploadCompleteCallback,
        projectId,
      });
    }

    this.notifySubscribers();
  }

  /**
   * Set callback for when upload completes
   */
  setOnUploadComplete(callback: (projectId: string, projectName: string, status: 'success' | 'partial' | 'failed') => void): void {
    this.onUploadCompleteCallback = callback;
  }

  /**
   * Update overall progress
   */
  private updateOverallProgress(): void {
    if (this.state.totalFiles === 0) {
      this.state.overallProgress = 0;
      return;
    }

    const totalProgress = Array.from(this.state.uploads.values()).reduce(
      (sum, upload) => sum + upload.progress,
      0
    );

    this.state.overallProgress = totalProgress / this.state.totalFiles;
  }

  /**
   * Notify all subscribers
   */
  private notifySubscribers(): void {
    const state = this.getState();
    // DEBUG: Log notification with key state values
    if (this.subscribers.size > 0 && state.completedFiles > 0) {
      console.log('[GlobalUploadManager] 📣 Notifying', this.subscribers.size, 'subscribers:', {
        completedFiles: state.completedFiles,
        totalFiles: state.totalFiles,
        overallProgress: Math.round(state.overallProgress),
      });
    }
    this.subscribers.forEach((callback) => {
      try {
        callback(state);
      } catch (error) {
        console.error('[GlobalUploadManager] Subscriber callback error:', error);
      }
    });
  }

  /**
   * Check for duplicate uploads
   */
  private async checkDuplicates(files: File[]): Promise<StoredUpload[]> {
    const pendingUploads = await uploadStateStore.getPendingUploads();
    const duplicates: StoredUpload[] = [];

    for (const file of files) {
      const duplicate = pendingUploads.find(
        (upload) =>
          upload.fileName === file.name &&
          upload.fileSize === file.size &&
          upload.fileLastModified === file.lastModified
      );

      if (duplicate) {
        duplicates.push(duplicate);
      }
    }

    return duplicates;
  }



  /**
   * Cleanup on destroy
   */
  destroy(): void {
    console.log('[GlobalUploadManager] Destroying...');

    // Unsubscribe from network events
    if (this.networkOnlineHandler) {
      networkDetectionService.unsubscribe('online', this.networkOnlineHandler);
    }
    if (this.networkOfflineHandler) {
      networkDetectionService.unsubscribe('offline', this.networkOfflineHandler);
    }

    // Remove beforeunload handler
    if (this.beforeUnloadHandler && typeof window !== 'undefined') {
      window.removeEventListener('beforeunload', this.beforeUnloadHandler);
    }

    // Clear storage quota check interval
    if (this.storageQuotaCheckInterval !== null && typeof window !== 'undefined') {
      window.clearInterval(this.storageQuotaCheckInterval);
    }

    this.subscribers.clear();
    this.initialized = false;
  }
}

// Singleton instance
export const globalUploadManager = new GlobalUploadManager();
