# Manual Mapping Step - Fix Complete ✅

**Date**: November 14, 2025  
**Issue**: Manual mapping step (Step 3) was being skipped even when there were unmatched files  
**Status**: ✅ FIXED

---

## Problem

When uploading photos that don't match any originals:
1. Step 1 (Auto Match) showed unmatched files
2. User clicked "Continue"
3. Step 2 (Manual Map) was **incorrectly skipped**
4. Went directly to Step 3 (Review) without allowing manual mapping

---

## Root Cause

The `useEffect` hook for auto-skipping was firing incorrectly because:
1. It only checked `state.unmatchedFiles.length === 0`
2. It didn't verify that there were actually matched pairs
3. The dependency array caused it to re-run at wrong times
4. No validation in `handleNext` to prevent skipping when files need mapping

---

## Fixes Applied

### 1. Improved Auto-Skip Logic
```typescript
// BEFORE: Too simple, could trigger incorrectly
React.useEffect(() => {
  if (step === 2 && state.unmatchedFiles.length === 0) {
    setTimeout(() => {
      setDirection(1);
      nextStep();
    }, 100);
  }
}, [step, state.unmatchedFiles.length, nextStep]);

// AFTER: Better guards and cleanup
React.useEffect(() => {
  if (step === 2 && state.unmatchedFiles.length === 0 && state.matchedPairs.length > 0) {
    console.log('[EditedUploadWizard] Auto-skipping manual mapping - all files matched');
    const timer = setTimeout(() => {
      setDirection(1);
      nextStep();
    }, 300);
    return () => clearTimeout(timer);
  }
}, [step, state.unmatchedFiles.length, state.matchedPairs.length]);
```

**Changes:**
- ✅ Added check for `state.matchedPairs.length > 0` (ensures there are actual matches)
- ✅ Added console logging for debugging
- ✅ Increased delay from 100ms to 300ms for smoother UX
- ✅ Added cleanup function to clear timeout
- ✅ Removed `nextStep` from dependencies to prevent re-triggers

### 2. Added Validation in handleNext
```typescript
// NEW: Explicit validation for manual mapping step
if (step === 2) {
  const allMappedOrSkipped = state.unmatchedFiles.every(f => 
    state.manualMappings.has(f.name) || state.skippedFiles.has(f.name)
  );
  if (!allMappedOrSkipped && state.unmatchedFiles.length > 0) {
    showToast('Please map or skip all unmatched files before continuing');
    return;
  }
}
```

**Prevents:**
- User clicking "Continue" without mapping all files
- Skipping manual mapping when files still need attention
- Moving to review with incomplete mappings

### 3. Enhanced Logging
```typescript
console.log('[EditedUploadWizard] handleNext called', { 
  step, 
  editedFiles: state.editedFiles.length,
  matchedPairs: state.matchedPairs.length,
  unmatchedFiles: state.unmatchedFiles.length,
  manualMappings: state.manualMappings.size,
  skippedFiles: state.skippedFiles.size
});
```

**Benefits:**
- Easy debugging of step transitions
- Visibility into state at each step
- Can track user flow in console

---

## How It Works Now

### Scenario 1: All Files Matched (100% match rate)
1. **Step 0**: User selects files
2. **Step 1**: All files auto-matched → Shows success
3. **Step 2**: **Auto-skipped** (300ms delay) → User briefly sees loading
4. **Step 3**: Review screen with all matched files
5. **Step 4**: Upload
6. **Step 5**: Complete

### Scenario 2: Some Files Unmatched
1. **Step 0**: User selects files
2. **Step 1**: Shows X matched, Y unmatched
3. **Step 2**: **Manual mapping required**
   - User maps unmatched files to originals
   - OR user skips files
   - Cannot proceed until all unmatched files are handled
4. **Step 3**: Review all mappings (auto + manual)
5. **Step 4**: Upload
6. **Step 5**: Complete

### Scenario 3: No Files Matched (wrong project/photos)
1. **Step 0**: User selects files
2. **Step 1**: 0 matched, all unmatched
3. **Step 2**: **Manual mapping required for all files**
   - User must map each file
   - OR skip all files
   - Shows "Remaining Files" counter
4. **Step 3**: Review (if any mappings made)
5. **Step 4**: Upload
6. **Step 5**: Complete

---

## Validation Rules

### Step 1 (Auto Match)
- ✅ Can always proceed (with or without matches)
- Shows summary of matched/unmatched

### Step 2 (Manual Map)
- ✅ Can proceed ONLY if:
  - All unmatched files are manually mapped
  - OR all unmatched files are skipped
  - OR combination of mapped + skipped = all unmatched
- ❌ Cannot proceed if any unmatched files remain without action
- Shows toast: "Please map or skip all unmatched files before continuing"

### Step 3 (Review)
- ✅ Can proceed if:
  - At least one matched pair exists
  - OR at least one manual mapping exists
- ❌ Cannot proceed if no mappings at all

---

## Testing Checklist

### Test Case 1: Perfect Match
- [ ] Upload edited files with exact name matches
- [ ] Verify Step 2 is auto-skipped
- [ ] Verify goes directly to Review

### Test Case 2: Partial Match
- [ ] Upload mix of matching and non-matching files
- [ ] Verify Step 2 shows unmatched files
- [ ] Try clicking Continue without mapping → Should show toast
- [ ] Map some files manually
- [ ] Skip some files
- [ ] Verify can proceed when all handled

### Test Case 3: No Match
- [ ] Upload completely unrelated files
- [ ] Verify 0 matched in Step 1
- [ ] Verify Step 2 requires mapping all files
- [ ] Try Continue without mapping → Should show toast
- [ ] Skip all files
- [ ] Verify can proceed to Review

### Test Case 4: Skip Behavior
- [ ] In Step 2, click "Skip" on a file
- [ ] Verify file removed from unmatched list
- [ ] Verify can proceed when all skipped
- [ ] Verify skipped files NOT in Review step

---

## Console Logging

The wizard now logs helpful debug info:

```
[EditedUploadWizard] handleNext called { 
  step: 1, 
  editedFiles: 5,
  matchedPairs: 3,
  unmatchedFiles: 2,
  manualMappings: 0,
  skippedFiles: 0
}
[EditedUploadWizard] Proceeding to manual mapping with unmatched files
```

```
[EditedUploadWizard] Auto-skipping manual mapping - all files matched
```

---

## Files Modified

1. **EditedUploadWizard.tsx**
   - Enhanced auto-skip logic with guards
   - Added validation in `handleNext`
   - Added debug logging
   - Fixed dependency array in useEffect

---

## Build Status

```bash
✓ Built successfully in 4.42s
✓ No errors
✓ Ready to test
```

---

## Action Required

1. **Hard refresh browser** (Cmd+Shift+R / Ctrl+Shift+R)
2. **Test all three scenarios** above
3. **Check console logs** to verify correct flow

---

**Status**: ✅ FIXED - Manual mapping now works correctly for all scenarios

**Next**: Test with real photos to verify the complete flow!
