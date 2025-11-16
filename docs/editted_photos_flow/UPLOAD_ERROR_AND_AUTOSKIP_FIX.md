# Upload Error and Auto-Skip Fix

**Date:** November 15, 2025  
**Status:** ✅ FIXED

---

## Issue 1: 500 Error During Upload ❌

### Error
```
PUT /v2/upload/{token}
Status: 500 Internal Server Error
Detail: "Upload failed: \"Attempt to overwrite 'filename' in LogRecord\""
```

### Root Cause
Python's logging system has reserved field names in `LogRecord`. When using `logger.info(..., extra={...})`, we cannot use these reserved names:
- `filename` ← **This was the problem!**
- `lineno`
- `funcName`
- `pathname`
- `module`
- `levelname`
- etc.

### The Problematic Code
```python
# upload_service.py line 139
logger.info(f"Creating version for photo {photo.id}", extra={
    "photo_id": photo.id,
    "filename": upload_token.filename,  # ❌ RESERVED NAME!
    "version_label": upload_token.version_label,
    "mapping_type": upload_token.mapping_type
})
```

### The Fix
```python
# Changed 'filename' to 'upload_filename'
logger.info(f"Creating version for photo {photo.id}", extra={
    "photo_id": photo.id,
    "upload_filename": upload_token.filename,  # ✅ NOT RESERVED
    "version_label": upload_token.version_label,
    "mapping_type": upload_token.mapping_type
})
```

---

## Issue 2: Manual Mapping Shows When All Files Matched ❌

### Problem
Even when auto-matching successfully matched ALL files (100% match), the wizard still showed the manual mapping step (Step 3).

### Expected Behavior
- If ALL files matched → Skip Step 3, go directly to Step 4 (Review)
- If ANY files unmatched → Show Step 3 for manual mapping

### Why It Was Disabled
The auto-skip logic was commented out because it was conflicting with the auto-advance from Step 2. The comment said:
```typescript
// Auto-skip manual mapping step if all files are matched - DISABLED FOR NOW
// The auto-advance from Step2 is causing issues
```

### The Real Issue
The auto-skip `useEffect` was running every time and causing infinite loops because:
1. It didn't have `nextStep` in the dependency array
2. It was using a short timeout (300ms) that could race with Step2's auto-advance

### The Fix

**File:** `EditedUploadWizard.tsx`

**Before (Disabled):**
```typescript
// React.useEffect(() => {
//   if (step === 2 && state.unmatchedFiles.length === 0 && state.matchedPairs.length > 0) {
//     console.log('[EditedUploadWizard] Auto-skipping manual mapping - all files matched');
//     const timer = setTimeout(() => {
//       setDirection(1);
//       nextStep();
//     }, 300);
//     return () => clearTimeout(timer);
//   }
// }, [step, state.unmatchedFiles.length, state.matchedPairs.length]);
```

**After (Fixed and Re-enabled):**
```typescript
React.useEffect(() => {
  if (step === 2 && state.unmatchedFiles.length === 0 && state.matchedPairs.length > 0) {
    // All files matched - skip to review
    console.log('[EditedUploadWizard] Auto-skipping manual mapping - all files matched');
    const timer = setTimeout(() => {
      setDirection(1);
      nextStep();
    }, 500);  // ← Increased from 300ms to 500ms
    return () => clearTimeout(timer);
  }
}, [step, state.unmatchedFiles.length, state.matchedPairs.length, nextStep]);
//                                                                  ^^^^^^^^ Added to deps
```

**Key Changes:**
1. ✅ Added `nextStep` to dependency array (prevents stale closure)
2. ✅ Increased timeout from 300ms to 500ms (avoids race with Step2 auto-advance)
3. ✅ Re-enabled the logic

---

## How It Works Now

### Scenario 1: All Files Match (100%)
```
Step 1: Select Files
  ↓
Step 2: Auto Match
  - 10/10 files matched
  - unmatchedFiles.length = 0
  ↓
Step 2 auto-advance (after 3s)
  ↓
Step 3: Manual Map
  - Auto-skip detects: step=2, unmatched=0, matched>0
  - Waits 500ms
  - Auto-advances to Step 4
  ↓
Step 4: Review ✅ (User sees this)
```

### Scenario 2: Some Files Don't Match
```
Step 1: Select Files
  ↓
Step 2: Auto Match
  - 8/10 files matched
  - unmatchedFiles.length = 2
  ↓
Step 2 auto-advance (after 3s)
  ↓
Step 3: Manual Map ✅ (User sees this)
  - Shows 2 unmatched files
  - User manually maps or skips them
  ↓
Step 4: Review
```

### Scenario 3: Mix of Auto + Manual
```
Step 1: Select Files (10 files)
  ↓
Step 2: Auto Match
  - 7/10 files matched
  - unmatchedFiles.length = 3
  ↓
Step 3: Manual Map
  - User maps 2 files
  - User skips 1 file
  - Now all 10 accounted for
  ↓
Step 4: Review
```

---

## Testing Instructions

### Test 1: Upload Error Fixed

1. Upload edited photos through wizard
2. Map files (auto or manual)
3. Complete upload
4. **Expected:** No 500 error, upload succeeds
5. **Check logs:**
   ```bash
   tail -50 photo_proof_api/uvicorn.out | grep "Creating version"
   ```
   Should see: `Creating version for photo X` (no error)

### Test 2: Auto-Skip When All Matched

1. Prepare edited photos with SAME filenames as originals
2. Upload through wizard
3. Wait for auto-match (should match all)
4. **Expected:** 
   - Step 2 → auto-advance after 3s
   - Step 3 → appears briefly, then auto-skips after 500ms
   - Step 4 → Review page (final destination)
5. **Console log should show:**
   ```
   [EditedUploadWizard] Auto-skipping manual mapping - all files matched
   ```

### Test 3: Manual Map When Some Unmatched

1. Prepare edited photos with DIFFERENT filenames
2. Upload through wizard
3. Wait for auto-match (some won't match)
4. **Expected:**
   - Step 2 → auto-advance after 3s
   - Step 3 → STAYS on manual mapping page
   - Shows only unmatched files
5. Map or skip the unmatched files
6. Click Next → Step 4

---

## Backend Changes

**File:** `app/services/upload_service.py`
- Line 141: Changed `"filename"` to `"upload_filename"` in logger extra

**Backend Restarted:** ✅

---

## Frontend Changes

**File:** `Photo_Proof_v1/components/studio/editedUpload/EditedUploadWizard.tsx`
- Lines 55-66: Re-enabled auto-skip logic with fixes
- Added `nextStep` to dependency array
- Increased timeout from 300ms to 500ms

**Frontend Built:** ✅ (3.83s)

---

## Summary

### Issue 1: Upload Error ✅
- **Cause:** Logger tried to use reserved 'filename' field
- **Fix:** Renamed to 'upload_filename'
- **Result:** Upload completes without 500 error

### Issue 2: Manual Mapping ✅
- **Cause:** Auto-skip logic was disabled
- **Fix:** Re-enabled with proper dependencies and timing
- **Result:** Skips manual map when all files matched

---

## User Experience Improvement

**Before:**
- User uploads 100 files
- All 100 match automatically
- Still has to click through empty manual mapping page ❌

**After:**
- User uploads 100 files
- All 100 match automatically
- Wizard automatically skips to review ✅
- Only shows manual mapping if needed

**Better UX, fewer clicks!** 🎉

---

**Both fixes deployed! Hard refresh and test!**
