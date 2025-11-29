# Background Upload System Architecture

## Overview

The Photo Proof background upload system enables resilient, multi-project photo uploads that survive navigation, tab closes, and browser restarts. The system supports concurrent uploads to multiple projects with independent progress tracking.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           USER INTERFACE                                 │
├─────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐     │
│  │  UploadWizard   │    │ UploadStatus    │    │  Step4_Upload   │     │
│  │  (Step 1-5)     │    │ Widget          │    │  Manager        │     │
│  │                 │    │ (Global)        │    │  (Progress)     │     │
│  └────────┬────────┘    └────────┬────────┘    └────────┬────────┘     │
│           │                      │                      │               │
│           └──────────────────────┼──────────────────────┘               │
│                                  │                                      │
├──────────────────────────────────┼──────────────────────────────────────┤
│                          CONTEXT LAYER                                  │
│                                  │                                      │
│                    ┌─────────────▼─────────────┐                       │
│                    │      UploadContext        │                       │
│                    │  (Wizard State Manager)   │                       │
│                    │  - Step navigation        │                       │
│                    │  - File selection         │                       │
│                    │  - Folder mapping         │                       │
│                    └─────────────┬─────────────┘                       │
│                                  │                                      │
├──────────────────────────────────┼──────────────────────────────────────┤
│                         SERVICE LAYER                                   │
│                                  │                                      │
│     ┌────────────────────────────▼────────────────────────────┐        │
│     │              GlobalUploadManager (Singleton)             │        │
│     │  - Multi-session orchestration                          │        │
│     │  - Session state management                             │        │
│     │  - Progress aggregation                                 │        │
│     │  - Completion callbacks                                 │        │
│     └────────────────────────────┬────────────────────────────┘        │
│                                  │                                      │
│     ┌────────────────────────────▼────────────────────────────┐        │
│     │             UploadQueueManager (Singleton)               │        │
│     │  - Batch presigned URL fetching (50 files/batch)        │        │
│     │  - Concurrent upload control (3 parallel)               │        │
│     │  - Retry with exponential backoff                       │        │
│     │  - Named Subscriber Pattern                             │        │
│     └────────────────────────────┬────────────────────────────┘        │
│                                  │                                      │
│     ┌────────────────────────────▼────────────────────────────┐        │
│     │                   UploadService                          │        │
│     │  - Presigned URL requests                               │        │
│     │  - File upload via PUT                                  │        │
│     │  - Progress tracking per file                           │        │
│     └────────────────────────────┬────────────────────────────┘        │
│                                  │                                      │
├──────────────────────────────────┼──────────────────────────────────────┤
│                       PERSISTENCE LAYER                                 │
│                                  │                                      │
│     ┌────────────────────────────▼────────────────────────────┐        │
│     │              UploadStateStore (IndexedDB)                │        │
│     │  - upload_queue store (file data + metadata)            │        │
│     │  - upload_sessions store (session state)                │        │
│     │  - upload_history store (completion records)            │        │
│     │  - File restoration for retry                           │        │
│     └─────────────────────────────────────────────────────────┘        │
│                                                                         │
│     ┌─────────────────────────────────────────────────────────┐        │
│     │              UploadHistoryStore (LocalStorage)           │        │
│     │  - Quick access to recent upload history                │        │
│     │  - Notifications page data                              │        │
│     └─────────────────────────────────────────────────────────┘        │
│                                                                         │
├─────────────────────────────────────────────────────────────────────────┤
│                         SUPPORT SERVICES                                │
│                                                                         │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐      │
│  │ NetworkDetection │  │ Notification     │  │ Navigation       │      │
│  │ Service          │  │ Service          │  │ Events           │      │
│  │ - Online/offline │  │ - Browser notif  │  │ - Project nav    │      │
│  │ - Auto-pause     │  │ - Permission     │  │ - Event bus      │      │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘      │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                            BACKEND API                                  │
│  - POST /v2/upload/presigned (batch presigned URLs)                    │
│  - PUT  /v2/upload/{token} (file upload)                               │
│  - POST /projects/{id}/folders (folder creation)                       │
└─────────────────────────────────────────────────────────────────────────┘
```

## Key Components

### 1. GlobalUploadManager (`services/globalUploadManager.ts`)

The central orchestrator for all uploads. Manages multiple concurrent upload sessions.

**Key Features:**
- Multi-session support via `sessions` Map
- Session-aware callbacks for progress/success/error events
- Unique upload IDs: `${sessionId}-${fileName}-${lastModified}`
- Backward-compatible legacy state for single-session widgets

**Key Methods:**
```typescript
startUploads(options: StartUploadOptions): Promise<void>
pauseUploads(): void
resumeUploads(): void
cancelUploads(): Promise<void>
retryFailed(sessionId?: string): Promise<void>
subscribe(callback: StateSubscriber): () => void
```

### 2. UploadQueueManager (`services/uploadQueueManager.ts`)

Handles the actual upload queue processing with batching and concurrency control.

**Key Features:**
- Batch presigned URL fetching (50 files per request)
- Concurrent uploads (3 simultaneous)
- Named Subscriber Pattern (no callback stacking)
- Automatic retry with exponential backoff

**Named Subscriber Pattern:**
```typescript
// Register subscriber with unique ID (replaces, doesn't stack)
uploadQueueManager.registerSubscriber('upload-context', {
  onProgress: (uploadId, progress) => { ... },
  onSuccess: (uploadId, result) => { ... },
  onError: (uploadId, error) => { ... },
  onQueueUpdate: (queue) => { ... },
});
```

### 3. UploadStateStore (`services/uploadStateStore.ts`)

IndexedDB persistence layer for resilient uploads.

**Stores:**
- `upload_queue`: File metadata + ArrayBuffer data (files < 10MB)
- `upload_sessions`: Session state for recovery
- `upload_history`: Completion records

**File Restoration:**
```typescript
// Save file to IndexedDB
await uploadStateStore.saveUpload(storedUpload, file);

// Restore file for retry
const storedUpload = await uploadStateStore.getUpload(uploadId);
const file = await uploadStateStore.restoreFile(storedUpload);
```

### 4. UploadStatusWidget (`components/UploadStatusWidget.tsx`)

Global floating widget showing upload progress across all pages.

**Features:**
- Multi-session support (one widget per active session)
- Stacked widget rendering
- Draggable positioning
- Minimize/expand states
- Session-specific retry

## Data Flow

### Upload Start Flow

```
1. User selects files in UploadWizard
   │
2. UploadContext dispatches START_UPLOAD
   │
3. globalUploadManager.startUploads() called
   │  ├─ Create new session with UUID
   │  ├─ Add to sessions Map
   │  ├─ Generate unique upload IDs: ${sessionId}-${file.name}-${file.lastModified}
   │  ├─ Save to IndexedDB (async, non-blocking)
   │  └─ Add to uploadQueueManager queue
   │
4. uploadQueueManager.processQueue()
   │  ├─ Batch 50 files for presigned URL request
   │  ├─ Upload 3 files concurrently
   │  └─ Notify subscribers on progress/success/error
   │
5. Callbacks route to correct session
   │  ├─ globalUploadManager updates session state
   │  └─ UploadContext updates wizard state (via ID translation)
```

### Upload ID Translation

```
GlobalUploadManager ID:  ${sessionId}-${fileName}-${lastModified}
                         ↓
                    extractOriginalFileId()
                         ↓
UploadContext ID:        ${fileName}-${lastModified}
```

This translation is necessary because:
- GlobalUploadManager needs unique IDs across sessions (same file → different projects)
- UploadContext uses simple IDs for local state management

### Retry Flow

```
1. User clicks "Retry All" on widget
   │
2. handleRetryFailed(session.sessionId)
   │
3. globalUploadManager.retryFailed(sessionId)
   │  ├─ Find session in sessions Map
   │  ├─ Get failed uploads from session.uploads
   │  │
   │  ├─ If files in queue (hasFailedFiles):
   │  │    └─ uploadQueueManager.retryFailed()
   │  │
   │  └─ If files NOT in queue (completion state):
   │       ├─ Fetch from IndexedDB: uploadStateStore.getUpload(id)
   │       ├─ Restore File: uploadStateStore.restoreFile(storedUpload)
   │       └─ Add to queue: uploadQueueManager.retryUploadById(id, file)
   │
4. uploadQueueManager.processQueue(true)
```

## Session State Structure

```typescript
interface UploadSessionState {
  sessionId: string;           // UUID for this upload session
  projectId: string;           // Target project ID
  projectName: string;         // Display name
  folderId?: string;           // Target folder (optional)
  isActive: boolean;           // Currently uploading
  isPaused: boolean;           // User paused
  totalFiles: number;          // Total files in session
  completedFiles: number;      // Successfully uploaded
  failedFiles: number;         // Failed uploads
  currentFile: string | null;  // Currently uploading file
  overallProgress: number;     // 0-100 percentage
  uploads: Map<string, UploadProgress>;  // Individual file states
}
```

## Error Handling

### Non-Retryable Errors
- 409 Conflict (duplicate content)
- 400 Bad Request (invalid file)
- 403 Forbidden (permission denied)

### Retryable Errors
- 500+ Server errors
- Network failures
- Timeout errors

### Retry Strategy
```typescript
const RETRY_DELAY_BASE = 1000; // 1 second
const MAX_RETRIES = 3;

// Exponential backoff: 1s, 2s, 4s
const delay = RETRY_DELAY_BASE * Math.pow(2, retryCount);
```

## Multi-Project Upload Support

The system supports uploading to multiple projects simultaneously:

```
Session A (Project: Wedding)     Session B (Project: Birthday)
├─ 50 files                      ├─ 30 files
├─ Progress: 60%                 ├─ Progress: 100%
├─ Status: Uploading             ├─ Status: Complete
└─ Widget: Blue (active)         └─ Widget: Green (success)
```

Each session:
- Has its own sessionId and uploads Map
- Tracks progress independently
- Can be retried independently
- Renders as separate stacked widget

## Files Structure

```
services/
├── globalUploadManager.ts    # Multi-session orchestrator
├── uploadQueueManager.ts     # Queue processing with batching
├── uploadStateStore.ts       # IndexedDB persistence
├── uploadHistoryStore.ts     # LocalStorage for quick access
├── uploadService.ts          # HTTP upload logic
├── networkDetectionService.ts # Online/offline detection
└── notificationService.ts    # Browser notifications

components/
├── UploadStatusWidget.tsx    # Global progress widget
└── studio/upload/
    ├── UploadWizard.tsx      # Multi-step wizard
    ├── UploadContext.tsx     # Wizard state management
    ├── Step4_UploadManager.tsx # Progress display in wizard
    └── FileRow.tsx           # Individual file row

utils/
└── navigationEvents.ts       # Event bus for navigation
```
