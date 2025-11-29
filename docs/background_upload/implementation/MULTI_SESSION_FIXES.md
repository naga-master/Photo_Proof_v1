# Multi-Session Upload Fixes (November 2024)

## Issues Addressed

This document covers the fixes made to support multi-project concurrent uploads and resolve various bugs in the background upload system.

## Issue 1: Step 4 Progress Bar Not Updating

### Problem
The progress bar in Step 4 of the upload wizard wasn't updating despite uploads completing.

### Root Cause
Upload ID mismatch between `UploadContext` and `GlobalUploadManager`:

```
UploadContext creates IDs as:      ${file.name}-${file.lastModified}
GlobalUploadManager creates IDs as: ${sessionId}-${file.name}-${file.lastModified}
```

When `uploadQueueManager` sends callbacks with session-prefixed IDs, `UploadContext` couldn't find matching files in its `uploadQueue`.

### Solution
Added ID translation helper in `UploadContext.tsx`:

```typescript
// Helper to extract original file ID from session-prefixed upload ID
// UUID format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx (36 chars)
const extractOriginalFileId = (uploadId: string): string => {
  const uuidPrefixRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}-/i;
  return uploadId.replace(uuidPrefixRegex, '');
};

// Applied in subscriber callbacks:
uploadQueueManager.registerSubscriber('upload-context', {
  onProgress: (uploadId, progress) => {
    const originalId = extractOriginalFileId(uploadId);
    dispatch({ type: 'UPDATE_FILE_PROGRESS', payload: { id: originalId, progress } });
  },
  onSuccess: (uploadId, result) => {
    const originalId = extractOriginalFileId(uploadId);
    dispatch({ type: 'FILE_UPLOAD_SUCCESS', payload: { fileId: originalId, photoId: result.id } });
  },
  onError: (uploadId, error) => {
    const originalId = extractOriginalFileId(uploadId);
    dispatch({ type: 'FILE_UPLOAD_FAIL', payload: { id: originalId, error: error || 'Upload failed' } });
  },
});
```

### Files Modified
- `components/studio/upload/UploadContext.tsx`

---

## Issue 2: Second Project Upload Replaces Widget

### Problem
When uploading to a second project while the first upload's widget was visible, the second upload replaced the first widget instead of showing both.

### Root Cause
`UploadStatusWidget` only rendered from legacy single-session state fields (`state.projectName`, `state.uploads`), ignoring the `sessions` Map that holds multiple concurrent sessions.

### Solution
Refactored `UploadStatusWidget.tsx` to support multiple sessions:

1. Created `SessionWidget` component for individual session rendering
2. Main widget iterates over `state.sessions` Map
3. Widgets stack vertically in bottom-right corner

```typescript
// SessionWidget renders a single session
const SessionWidget: React.FC<SessionWidgetProps> = ({ 
  session, 
  stackIndex, 
  onClose,
  showCompletedMap,
  setShowCompleted 
}) => {
  // ... renders individual session widget
  // Uses session.uploads, session.projectName, etc.
};

// Main widget renders all sessions
export const UploadStatusWidget: React.FC = () => {
  // Get sessions to display
  const sessionsToShow = state?.sessions 
    ? Array.from(state.sessions.values()).filter(session => {
        if (closedSessions.has(session.sessionId)) return false;
        if (session.isActive) return true;
        return showCompletedMap.get(session.sessionId) || session.failedFiles > 0;
      })
    : [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column-reverse', gap: '8px' }}>
      {sessionsToShow.map((session, index) => (
        <SessionWidget
          key={session.sessionId}
          session={session}
          stackIndex={index}
          onClose={handleCloseSession}
          showCompletedMap={showCompletedMap}
          setShowCompleted={setShowCompleted}
        />
      ))}
    </div>
  );
};
```

### Files Modified
- `components/UploadStatusWidget.tsx` (complete rewrite)

---

## Issue 3: Retry All Not Finding Failed Uploads

### Problem
Clicking "Retry All" showed "No failed uploads to retry" despite failed files being visible.

### Root Cause
`retryFailed()` was looking for failed uploads in `this.state.uploads` (legacy state), but with multi-session architecture, completed sessions have their uploads in `session.uploads` Map, not the legacy state.

### Solution
Made `retryFailed()` session-aware:

```typescript
async retryFailed(sessionId?: string): Promise<void> {
  // Get the target session
  let targetSession: UploadSessionState | null = null;
  let allUploads: UploadProgress[] = [];
  
  if (sessionId) {
    targetSession = this.sessions.get(sessionId) || null;
    if (targetSession) {
      allUploads = Array.from(targetSession.uploads.values());
    }
  }
  
  // Fallback to legacy state if no session found
  if (allUploads.length === 0) {
    allUploads = Array.from(this.state.uploads.values());
  }
  
  // Get failed uploads from the correct source
  const failedUploads = allUploads.filter(u => u.status === 'failed');
  // ... rest of retry logic
}
```

Also updated widget to pass sessionId:

```typescript
const handleRetryFailed = async () => {
  await globalUploadManager.retryFailed(session.sessionId);
};
```

### Files Modified
- `services/globalUploadManager.ts`
- `components/UploadStatusWidget.tsx`

---

## Issue 4: IndexedDB File Restoration Bug

### Problem
When retrying from completion state (files not in queue), the IndexedDB retrieval wasn't working.

### Root Cause
Code was checking `storedUpload?.file` but `StoredUpload` interface has `fileData` (ArrayBuffer), not `file`:

```typescript
// WRONG
if (storedUpload?.file) { ... }

// CORRECT
if (storedUpload?.fileData) { ... }
```

Also, needed to use `restoreFile()` to convert ArrayBuffer back to File.

### Solution

```typescript
if (storedUpload?.fileData) {
  // Restore File object from stored ArrayBuffer
  const file = await uploadStateStore.restoreFile(storedUpload);
  if (file) {
    console.log('[GlobalUploadManager] ✅ Restored file from IndexedDB:', upload.fileName);
    await uploadQueueManager.retryUploadById(upload.id, file);
    restoredCount++;
  } else {
    // Handle restore failure
  }
} else {
  console.error('[GlobalUploadManager] ❌ File data not found in IndexedDB:', upload.id);
  // Handle missing file data
}
```

### Files Modified
- `services/globalUploadManager.ts`

---

## Issue 5: Same Files to Different Projects Had Same IDs

### Problem
Uploading the same file to two different projects caused the wrong session to be updated because upload IDs were identical.

### Root Cause
Original upload ID format: `${file.name}-${file.lastModified}`

This meant the same file uploaded to Project A and Project B had the same ID.

### Solution
Include sessionId in upload ID:

```typescript
// In startUploads()
const uploadId = `${sessionId}-${file.name}-${file.lastModified}`;
```

Now each session has unique IDs even for identical files.

### Files Modified
- `services/globalUploadManager.ts`

---

## Testing Checklist

### Single Project Upload
- [ ] Files upload correctly
- [ ] Step 4 progress bar updates
- [ ] Widget shows progress
- [ ] Completion state shows correctly
- [ ] Retry failed works

### Multi-Project Upload
- [ ] Can start second upload while first is in progress
- [ ] Both widgets visible and stacked
- [ ] Progress tracks independently
- [ ] Can close individual widgets
- [ ] Retry works for specific session

### Retry Scenarios
- [ ] Retry during active upload (queue has files)
- [ ] Retry after completion (restore from IndexedDB)
- [ ] Retry after page refresh (restore from IndexedDB)

### Edge Cases
- [ ] Files > 10MB (no IndexedDB storage, retry unavailable)
- [ ] Duplicate content rejection (409 error)
- [ ] Network failure during upload
- [ ] Tab close warning with active uploads
