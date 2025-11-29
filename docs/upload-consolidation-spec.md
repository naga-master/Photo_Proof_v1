# Upload System Consolidation Spec

## Current Architecture (7 files, ~2,500 lines)

### Files:
1. **uploadService.ts** (250 lines) - Low-level XHR upload with presigned URLs
2. **uploadQueueManager.ts** (650 lines) - Queue with batch URLs, concurrency, retry
3. **globalUploadManager.ts** (900 lines) - Multi-session orchestrator with IndexedDB
4. **chunkedUploadService.ts** (350 lines) - Large file chunked uploads
5. **uploadStateStore.ts** (350 lines) - IndexedDB persistence
6. **uploadQueueService.ts** (250 lines) - Duplicate offline queue (REMOVE)
7. **uploadHistoryStore.ts** (90 lines) - LocalStorage history

### Issues:
- `uploadQueueService` duplicates `uploadQueueManager` functionality
- `globalUploadManager` has 900 lines wrapping `uploadQueueManager`
- Complex state synchronization between services
- Hard to test due to tight coupling

## Proposed Architecture (4 files, ~1,200 lines)

### Keep As-Is:
1. **uploadService.ts** - Low-level transport (works well)
2. **chunkedUploadService.ts** - Large file handling (specialized)
3. **uploadHistoryStore.ts** - Notification history (simple)

### Consolidate:
4. **UnifiedUploadManager.ts** - Combines uploadQueueManager + globalUploadManager

### Remove:
- uploadQueueService.ts (duplicate)
- uploadQueueManager.ts (merged into UnifiedUploadManager)
- globalUploadManager.ts (merged into UnifiedUploadManager)
- uploadStateStore.ts (simplified into UnifiedUploadManager)

## UnifiedUploadManager Design

```typescript
interface UnifiedUploadManager {
  // Configuration
  readonly BATCH_SIZE: 50;
  readonly MAX_CONCURRENT: 3;
  readonly MAX_RETRIES: 3;

  // Core API
  startUpload(options: StartUploadOptions): Promise<string>; // Returns sessionId
  pauseSession(sessionId: string): void;
  resumeSession(sessionId: string): void;
  cancelSession(sessionId: string): void;
  retryFailed(sessionId: string): Promise<void>;
  
  // State
  getSession(sessionId: string): UploadSession | null;
  getAllSessions(): UploadSession[];
  
  // Subscriptions
  subscribe(callback: (state) => void): () => void;
  
  // Lifecycle
  init(): Promise<void>;
  destroy(): void;
}

interface UploadSession {
  id: string;
  projectId: string;
  projectName: string;
  folderId?: string;
  status: 'active' | 'paused' | 'completed' | 'failed';
  
  // Progress
  totalFiles: number;
  completedFiles: number;
  failedFiles: number;
  overallProgress: number;
  
  // Files
  uploads: Map<string, Upload>;
}

interface Upload {
  id: string;
  fileName: string;
  fileSize: number;
  status: 'pending' | 'uploading' | 'completed' | 'failed';
  progress: number;
  error?: string;
}
```

## Migration Plan

1. **Create UnifiedUploadManager** with all functionality
2. **Update UploadContext** to use new manager
3. **Update UploadStatusWidget** to use new manager
4. **Run tests** to verify behavior
5. **Remove old files** after verification

## Benefits

- **50% code reduction**: ~2,500 → ~1,200 lines
- **Single source of truth**: One manager for all upload state
- **Simpler testing**: Clear boundaries, mockable
- **Easier debugging**: One place to look for upload issues
