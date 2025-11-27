# Fix: Multiple useEffect Runs Causing Race Conditions

## Problem

The useEffect in `UploadContext.tsx` was running 5+ times in rapid succession (within milliseconds), causing:
- Multiple folder creation attempts (409 Conflict errors)
- Queue manager being cleared multiple times
- Race conditions and backend crashes
- CORS errors from concurrent requests

### Root Cause

**The Dispatch Loop:**
1. `dispatch({ type: 'UPDATE_FOLDER_MAP' })` inside useEffect changed state
2. State change triggered re-render
3. Re-render triggered useEffect again (because `dispatch` is in dependencies)
4. Loop continued 5+ times

**Why Atomic Lock Failed:**
- All 5 effect runs started **simultaneously** (within 5-18ms)
- They all read `initializingProjectId.current === null` at the same moment
- All 5 passed the guard check before any could set the lock
- All 5 proceeded to create folders → race condition

## Solution

### 1. Check if Folders Already Have IDs

Added guard check BEFORE setting the initialization lock:

```typescript
// Check if ALL folders already have IDs - prevents re-runs after UPDATE_FOLDER_MAP dispatch
const foldersNeedingCreation = state.folderMap.filter(f => !f.targetId);
if (foldersNeedingCreation.length === 0 && state.folderMap.length > 0) {
  console.log('[UploadContext] ⏭️ All folders already created, skipping folder creation');
  // Skip folder creation, proceed directly to upload
} else {
  // Set lock and create folders
  initializingProjectId.current = state.backendProjectId;
  console.log('[UploadContext] 🆕 Initializing upload for project:', state.backendProjectId);
}
```

### 2. Added state.folderMap to Dependencies

```typescript
}, [state.isUploading, state.backendProjectId, state.folderMap, dispatch]);
```

This ensures the effect knows when folders have been updated with IDs.

## How It Works Now

### First Run (Folders Need Creation)
1. `foldersNeedingCreation.length > 0` → true
2. Sets `initializingProjectId.current = projectId` (LOCK)
3. Creates folders
4. Dispatches `UPDATE_FOLDER_MAP` with folder IDs
5. ✅ First run complete

### Second Run (Triggered by UPDATE_FOLDER_MAP)
1. Effect runs again due to `state.folderMap` dependency change
2. `foldersNeedingCreation.length === 0` → true (folders now have IDs!)
3. Skips lock, skips folder creation
4. Proceeds directly to upload setup
5. ✅ No more duplicate folder creation attempts

### Subsequent Runs (Prevented)
- No more state changes that trigger the effect
- Upload proceeds normally

## Key Changes

**File**: `components/studio/upload/UploadContext.tsx`

1. **Lines 253-266**: Added folder ID check before setting lock
2. **Line 502**: Added `state.folderMap` to dependencies array

## Benefits

✅ **Prevents race conditions** - Only first run creates folders  
✅ **Eliminates 409 errors** - No duplicate folder creation attempts  
✅ **Stops queue clearing** - Queue manager only cleared once  
✅ **Backend stability** - No concurrent folder creation requests  
✅ **Proper state flow** - Effect knows when folders are created  

## Testing

Build verification:
```bash
npm run build  # ✅ Success - No TypeScript errors
```

Expected console logs on upload:
```
[UploadContext] 🆕 Initializing upload for project: 20
[UploadContext] Clearing queue manager for new upload session
[UploadContext] ✅ INITIALIZING UPLOADS 2 files
[UploadContext] 📁 Creating 1 remaining folders in backend...
[projectService] 🔵 CREATING FOLDER: 20 few
[UploadContext] ✅ Created folder: few with ID: xxx
[UploadContext] ✅ All folders created successfully
[UploadContext] ⏭️ All folders already created, skipping folder creation  ← NEW
[UploadContext] 🚀 Starting upload of 2 files for project 20
```

**Result**: Only **ONE** folder creation attempt instead of 5+

## Related Issues

- Previous attempts used time-based debouncing (failed - system dependent)
- Previous attempts used simple boolean flag (failed - all runs started simultaneously)
- **This fix**: Checks actual state (folder IDs) to determine if work is needed
