# Upload Flow Quick Reference

## Upload Flow Sequence

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              UPLOAD START                                    │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 1. User Action: Select files in UploadWizard                                │
│    - Files stored in UploadContext.uploadQueue                              │
│    - IDs: ${fileName}-${lastModified}                                       │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 2. Step 4: startUpload() dispatched                                         │
│    - UploadContext effect triggers                                          │
│    - Calls globalUploadManager.startUploads()                               │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 3. GlobalUploadManager.startUploads()                                       │
│    - Generate sessionId (UUID)                                              │
│    - Create UploadSessionState                                              │
│    - Add to sessions Map                                                    │
│    - Generate unique IDs: ${sessionId}-${fileName}-${lastModified}          │
│    - Save to IndexedDB (async, non-blocking)                                │
│    - Add files to uploadQueueManager                                        │
│    - notifySubscribers() → Widget appears                                   │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 4. UploadQueueManager.processQueue()                                        │
│    - Batch 50 files for presigned URL request                               │
│    - POST /v2/upload/presigned                                              │
│    - Upload 3 files concurrently                                            │
│    - PUT /v2/upload/{token} for each file                                   │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 5. Progress Callbacks                                                       │
│    │                                                                        │
│    ├─► 'global-upload-manager' subscriber (registered in constructor)       │
│    │   - Updates session.uploads Map                                        │
│    │   - Increments session.completedFiles / session.failedFiles            │
│    │   - notifySubscribers() → Widget updates                               │
│    │                                                                        │
│    └─► 'upload-context' subscriber                                          │
│        - extractOriginalFileId() strips sessionId prefix                    │
│        - Dispatches UPDATE_FILE_PROGRESS / FILE_UPLOAD_SUCCESS              │
│        - Step 4 progress bar updates                                        │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 6. Session Complete                                                         │
│    - handleSessionComplete(sessionId)                                       │
│    - Save to uploadHistoryStore                                             │
│    - Browser notification                                                   │
│    - onUploadCompleteCallback → App.tsx refreshes project list              │
│    - notifySubscribers() → Widget shows completion state                    │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                               RETRY FLOW                                    │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 1. User clicks "Retry All" on widget                                        │
│    - handleRetryFailed() called with session.sessionId                      │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 2. globalUploadManager.retryFailed(sessionId)                               │
│    - Find session in sessions Map                                           │
│    - Get failed uploads from session.uploads                                │
│    - Reset upload statuses to 'uploading'                                   │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                           ┌───────┴───────┐
                           │               │
                           ▼               ▼
┌──────────────────────────────┐ ┌──────────────────────────────┐
│ FILES IN QUEUE               │ │ FILES NOT IN QUEUE           │
│ (Active upload state)        │ │ (Completion state)           │
├──────────────────────────────┤ ├──────────────────────────────┤
│ uploadQueueManager.          │ │ For each failed upload:      │
│   retryFailed()              │ │ 1. getUpload(id) from IDB    │
│                              │ │ 2. restoreFile(storedUpload) │
│                              │ │ 3. retryUploadById(id, file) │
└──────────────────────────────┘ └──────────────────────────────┘
                           │               │
                           └───────┬───────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 3. uploadQueueManager.processQueue(true)                                    │
│    - Processes all pending/retrying uploads                                 │
│    - Same flow as initial upload                                            │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Key Code Locations

| Function | File | Line (approx) |
|----------|------|---------------|
| `startUploads()` | `globalUploadManager.ts` | 530 |
| `retryFailed()` | `globalUploadManager.ts` | 757 |
| `processQueue()` | `uploadQueueManager.ts` | 743 |
| `extractOriginalFileId()` | `UploadContext.tsx` | 398 |
| `SessionWidget` | `UploadStatusWidget.tsx` | 28 |
| `restoreFile()` | `uploadStateStore.ts` | 260 |

## Subscriber Registration

```typescript
// GlobalUploadManager constructor - registered once
uploadQueueManager.registerSubscriber('global-upload-manager', {
  onProgress: (uploadId, progress) => { ... },
  onSuccess: (uploadId, result) => { ... },
  onError: (uploadId, error) => { ... },
  onQueueUpdate: (queue) => { ... },
});

// UploadContext - registered when upload starts
uploadQueueManager.registerSubscriber('upload-context', {
  onProgress: (uploadId, progress) => { ... },
  onSuccess: (uploadId, result) => { ... },
  onError: (uploadId, error) => { ... },
  onQueueUpdate: (queue) => { ... },
});

// Widget subscribes to GlobalUploadManager state
globalUploadManager.subscribe((newState) => {
  setState(newState);
});
```

## Upload ID Formats

```
UploadContext Local ID:
  photo.jpg-1704067200000
  │         │
  │         └─ file.lastModified
  └─ file.name

GlobalUploadManager Session ID:
  abc123de-f456-7890-abcd-ef1234567890-photo.jpg-1704067200000
  │                                    │         │
  │                                    │         └─ file.lastModified
  │                                    └─ file.name
  └─ sessionId (UUID v4)

Translation:
  const uuidPrefixRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}-/i;
  const originalId = sessionId.replace(uuidPrefixRegex, '');
```

## Error Handling Quick Reference

| HTTP Status | Meaning | Retryable | Action |
|-------------|---------|-----------|--------|
| 200 | Success | N/A | Mark completed |
| 409 | Duplicate content | No | Show duplicate error |
| 400 | Bad request | No | Mark failed permanently |
| 403 | Forbidden | No | Mark failed permanently |
| 500+ | Server error | Yes | Retry with backoff |
| Network | Connection lost | Yes | Retry when online |

## IndexedDB Storage

```
Database: PhotoProofUploads (version 1)

Stores:
├── upload_queue
│   ├── id (primary key): ${sessionId}-${fileName}-${lastModified}
│   ├── fileName, fileSize, fileType, fileLastModified
│   ├── fileData: ArrayBuffer (only for files < 10MB)
│   ├── projectId, folderId
│   ├── status: pending | uploading | completed | failed | paused
│   ├── progress: 0-100
│   └── createdAt, updatedAt
│
├── upload_sessions
│   ├── sessionId (primary key)
│   ├── projectId, folderId
│   ├── totalFiles, completedFiles, failedFiles
│   ├── startedAt, completedAt
│   └── isActive: boolean
│
└── upload_history
    ├── id (primary key)
    ├── fileName, photoId
    ├── status: completed | failed
    ├── completedAt
    └── error (optional)
```
