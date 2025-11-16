# Critical Fixes: Project Name & Cover Photo Overwrite Bug

## 🎯 Issues Fixed

### Issue 1: Project Name Shows "Untitled Project" ✅ FIXED

**Problem:** Backend returns `name` field, but frontend code expected `title` field.

**Console Evidence:**
```javascript
[Step5_Summary] ✅ Fetched project details: {
  id: '6',
  name: 'ddfdfgdsf',  // ← Backend uses "name"
  //...
}

// But code tried:
setProjectName(project.title);  // ← undefined!
```

**Solution Implemented:**
```typescript
// Handle both "name" (current backend) and "title" (future backend)
const projectTitle = project.title || project.name || 'Untitled Project';
console.log('[Step5_Summary] Project title resolved:', projectTitle);
setProjectName(projectTitle);
```

**Result:**
- ✅ Existing projects now show actual name ("ddfdfgdsf")
- ✅ Works with both field names (backward/forward compatible)
- ✅ Graceful fallback to "Untitled Project" if both missing

---

### Issue 2: Cover Photo Being Overwritten ✅ FIXED

**Problem:** When adding photos to existing project WITH cover, the cover photo was automatically replaced with a random newly-uploaded photo.

**Root Cause:**
```typescript
// OLD CODE (BROKEN):
const handlePublish = async () => {
  await setCoverPhotoOnBackend();  // ← ALWAYS called!
  getOrCreateAlbum();
  onExit();
};
```

**Impact:**
- ❌ User's carefully selected cover photo was lost
- ❌ Random photo from new upload became the cover
- ❌ No way to prevent this behavior
- ❌ Happened even when cover selector was hidden

**Solution Implemented:**

**1. Added Decision Logic:**
```typescript
const shouldUpdateCoverPhoto = () => {
  // User manually selected a cover photo - always update
  if (selectedCoverIndex !== null) {
    console.log('[Step5_Summary] Should update cover: User selected cover');
    return true;
  }
  
  // New project - always set a cover
  if (mode === 'new') {
    console.log('[Step5_Summary] Should update cover: New project');
    return true;
  }
  
  // Existing project without cover - set a cover
  if (mode === 'existing' && !existingCoverPhotoId) {
    console.log('[Step5_Summary] Should update cover: Existing project without cover');
    return true;
  }
  
  // Existing project with cover, no user selection - DON'T update
  console.log('[Step5_Summary] Should NOT update cover: Existing project has cover, preserving it');
  return false;
};
```

**2. Updated Event Handlers:**
```typescript
const handlePublish = async () => {
  // Only update cover photo if appropriate
  if (shouldUpdateCoverPhoto()) {
    await setCoverPhotoOnBackend();
  } else {
    console.log('[Step5_Summary] ⏭️ Skipping cover update - preserving existing cover photo');
  }
  
  getOrCreateAlbum();
  onExit();
};

const handleViewGallery = async () => {
  // Only update cover photo if appropriate
  if (shouldUpdateCoverPhoto()) {
    await setCoverPhotoOnBackend();
  } else {
    console.log('[Step5_Summary] ⏭️ Skipping cover update - preserving existing cover photo');
  }
  
  const album = getOrCreateAlbum();
  if (album) {
    onViewGallery(album);
  }
};
```

**Result:**
- ✅ Existing covers are preserved when adding photos
- ✅ New projects still get automatic cover
- ✅ User can manually change cover if desired
- ✅ Clear console logging for debugging

---

## 📊 Decision Matrix

| Scenario | selectedCoverIndex | mode | existingCoverPhotoId | Update Cover? | Console Log |
|----------|-------------------|------|---------------------|---------------|-------------|
| New project, no selection | null | 'new' | null | ✅ YES | "Should update cover: New project" |
| New project, user selected | 5 | 'new' | null | ✅ YES | "Should update cover: User selected cover" |
| Existing with cover, no selection | null | 'existing' | '123' | ❌ NO | "Should NOT update cover: Existing project has cover, preserving it" |
| Existing with cover, user selected | 5 | 'existing' | '123' | ✅ YES | "Should update cover: User selected cover" |
| Existing without cover, no selection | null | 'existing' | null | ✅ YES | "Should update cover: Existing project without cover" |
| Existing without cover, user selected | 5 | 'existing' | null | ✅ YES | "Should update cover: User selected cover" |

---

## 📁 Files Modified

### 1. `services/projectService.ts`
**Change:** Added `name` field to Project interface

```typescript
export interface Project {
  id: string;
  title: string;
  name?: string;  // Backend uses "name" field (alias for title)
  studio_id: string;
  // ... rest
}
```

**Why:** TypeScript was throwing error when accessing `project.name`

---

### 2. `components/studio/upload/Step5_Summary.tsx`

**Changes:**

**A. Fixed field name access (lines 47-52):**
```typescript
// Handle both "name" (current backend) and "title" (future backend)
const projectTitle = project.title || project.name || 'Untitled Project';
console.log('[Step5_Summary] Project title resolved:', projectTitle);
setProjectName(projectTitle);
```

**B. Added decision helper function (lines 97-120):**
```typescript
const shouldUpdateCoverPhoto = () => {
  if (selectedCoverIndex !== null) return true;
  if (mode === 'new') return true;
  if (mode === 'existing' && !existingCoverPhotoId) return true;
  return false;
};
```

**C. Updated handlePublish (lines 174-183):**
```typescript
if (shouldUpdateCoverPhoto()) {
  await setCoverPhotoOnBackend();
} else {
  console.log('[Step5_Summary] ⏭️ Skipping cover update - preserving existing cover photo');
}
```

**D. Updated handleViewGallery (lines 186-196):**
```typescript
if (shouldUpdateCoverPhoto()) {
  await setCoverPhotoOnBackend();
} else {
  console.log('[Step5_Summary] ⏭️ Skipping cover update - preserving existing cover photo');
}
```

**E. Enhanced informational message (lines 249-258):**
```typescript
{mode === 'existing' && existingCoverPhotoId && successCount > 0 && selectedCoverIndex === null && (
  <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
    <p className="text-sm text-blue-800">
      ℹ️ This project already has a cover photo. It will be preserved.
      {!shouldShowCoverSelector && (
        <span> You can change it later from the project details page.</span>
      )}
    </p>
  </div>
)}
```

---

## 🧪 Testing Guide

### Test 1: Existing Project WITH Cover (Critical Test)

**Steps:**
1. Go to existing project "ddfdfgdsf" (ID: 6)
2. Click "Add Photos"
3. Upload 2-3 photos
4. Go to Step 5 Summary
5. **DO NOT select a cover photo**
6. Click "Update Project"

**Expected Results:**
- ✅ Project name shows: "ddfdfgdsf" (not "Untitled Project")
- ✅ Cover selector is HIDDEN (because project has cover)
- ✅ Message shows: "This project already has a cover photo. It will be preserved."
- ✅ Console log shows: "⏭️ Skipping cover update - preserving existing cover photo"
- ✅ Existing cover photo remains UNCHANGED

**Console Output:**
```
[Step5_Summary] useEffect triggered: {mode: "existing", backendProjectId: "6"}
[Step5_Summary] Fetching project details for ID: 6
[Step5_Summary] ✅ Fetched project details: {id: "6", name: "ddfdfgdsf", cover_photo_id: "123"}
[Step5_Summary] Project title resolved: ddfdfgdsf
[Step5_Summary] Cover selector decision: {shouldShowCoverSelector: false}
// User clicks "Update Project"
[Step5_Summary] Should NOT update cover: Existing project has cover, preserving it
[Step5_Summary] ⏭️ Skipping cover update - preserving existing cover photo
```

---

### Test 2: New Project

**Steps:**
1. Create NEW project with name "Test Wedding"
2. Upload 3 photos
3. Don't select cover
4. Click "Publish Project"

**Expected Results:**
- ✅ Project name shows: "Test Wedding"
- ✅ Cover selector appears
- ✅ Random photo selected as cover
- ✅ Console log shows: "Should update cover: New project"
- ✅ Console log shows: "Auto-selected random cover photo at index X"

---

### Test 3: Existing Project WITHOUT Cover

**Steps:**
1. Find/create existing project WITHOUT cover
2. Add photos
3. Don't select cover
4. Click "Update Project"

**Expected Results:**
- ✅ Project name shows correctly
- ✅ Cover selector appears
- ✅ Random photo selected as cover
- ✅ Console log shows: "Should update cover: Existing project without cover"

---

### Test 4: User Manually Selects Cover

**Steps:**
1. Add photos to ANY project (new or existing)
2. Expand cover selector
3. Click on a specific photo to select it
4. Click "Update Project" or "Publish Project"

**Expected Results:**
- ✅ Selected photo becomes the cover
- ✅ Console log shows: "Should update cover: User selected cover"
- ✅ Works for both new and existing projects
- ✅ User choice always respected

---

## 📊 Expected Console Logs

### Scenario A: Existing Project WITH Cover, No Selection (Most Important)
```javascript
[Step5_Summary] useEffect triggered: {mode: "existing", backendProjectId: "6", title: undefined}
[Step5_Summary] Fetching project details for ID: 6
[Step5_Summary] ✅ Fetched project details: {id: "6", name: "ddfdfgdsf", cover_photo_id: "123", ...}
[Step5_Summary] Project title resolved: ddfdfgdsf
[Step5_Summary] Cover selector decision: {
  shouldShowCoverSelector: false,
  successCount: 2,
  mode: "existing",
  existingCoverPhotoId: "123"
}

// User clicks "Update Project"
[Step5_Summary] Should NOT update cover: Existing project has cover, preserving it
[Step5_Summary] ⏭️ Skipping cover update - preserving existing cover photo
// NO setCoverPhoto API call made!
```

### Scenario B: New Project, No Selection
```javascript
[Step5_Summary] useEffect triggered: {mode: "new", title: "My Wedding"}
[Step5_Summary] Using projectDetails.title: My Wedding
[Step5_Summary] Cover selector decision: {shouldShowCoverSelector: true}

// User clicks "Publish Project"
[Step5_Summary] Should update cover: New project
[Step5_Summary] Auto-selected random cover photo at index 2
[Step5_Summary] ✅ Cover photo set successfully
```

---

## ✅ Success Criteria

### Issue 1: Project Name Display ✅
- [x] Existing projects show actual name from backend
- [x] New projects show user-entered title
- [x] No more "Untitled Project" for existing projects
- [x] Backward compatible with both `name` and `title` fields

### Issue 2: Cover Photo Preservation ✅
- [x] Existing cover NOT overwritten when adding photos
- [x] Console logs confirm "Skipping cover update"
- [x] No unnecessary API calls to setCoverPhoto
- [x] User can still manually change cover if desired
- [x] New projects still get automatic cover
- [x] Projects without cover still get automatic cover

---

## 🚨 What Was Broken Before

### Before Fix 1:
```
User adds photos to project "ddfdfgdsf"
→ Step 5 shows: "Project 'Untitled Project' has been processed"
❌ WRONG! Confusing UX
```

### After Fix 1:
```
User adds photos to project "ddfdfgdsf"
→ Step 5 shows: "Project 'ddfdfgdsf' has been processed"
✅ CORRECT! Clear and accurate
```

---

### Before Fix 2:
```
Project "ddfdfgdsf" has beautiful cover photo of sunset
User adds 3 new photos (flowers)
User clicks "Update Project"
→ Cover changed to random flower photo!
❌ BROKEN! User's sunset cover photo is lost forever
```

### After Fix 2:
```
Project "ddfdfgdsf" has beautiful cover photo of sunset
User adds 3 new photos (flowers)
User clicks "Update Project"
→ Cover remains the sunset photo
✅ FIXED! User's cover photo is preserved
```

---

## 🔮 Future Improvements

1. **Add "Change Cover" Button** on Step 5 for existing projects with covers
   - Let users opt-in to changing cover
   - More explicit than hidden selector

2. **Show Current Cover** when adding to existing project
   - Display thumbnail of existing cover
   - Visual confirmation of what will be preserved

3. **Backend Alignment**
   - Standardize on either `name` or `title` field
   - Update API documentation

---

## 📝 Summary

**Lines Changed:** ~35 lines
**Files Modified:** 2 files
**Breaking Changes:** None
**Backward Compatible:** Yes

**Impact:**
- ✅ Fixes data loss bug (cover photo overwrite)
- ✅ Fixes UX confusion (wrong project name)
- ✅ Improves user confidence (explicit logging)
- ✅ Maintains all existing functionality

---

**Status:** ✅ **COMPLETE & READY FOR TESTING**

**Priority Testing:** Test 1 (Existing Project WITH Cover) is the most critical - this was the bug that was breaking user data.
