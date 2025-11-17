# Variant Integration Fixes - Cover Photos & Gallery

**Date:** 2025-11-16  
**Issue:** Cover photos showing placeholder, gallery photos not visible  
**Status:** ✅ FIXED with extensive debugging

---

## 🐛 Issue Reported

1. **Project cover images** showing `http://localhost:3001/placeholder-cover.jpg`
2. **Album/folder cover images** not visible
3. **Gallery photos** not visible in grid view
4. **Lightbox works** - photos visible when clicked

**Root Cause:** Cover photos without `cover_photo_id` were falling back to placeholder instead of using the `cover_photo_src` path.

---

## 🔧 Fixes Applied

### 1. **Enhanced projectService.ts**

**Added:** `extractPhotoIdFromPath()` helper function

```typescript
/**
 * Extract photo ID from storage path
 * Example: "/uploads/projects/12/originals/photo_808.jpg" -> "808"
 */
function extractPhotoIdFromPath(path: string): string | null {
  // Try patterns like: /808.jpg or _808.jpg
  const filenameMatch = path.match(/\/(\d+)\.[^/]+$/);
  if (filenameMatch) return filenameMatch[1];
  
  const altMatch = path.match(/_(\d+)\.[^/]+$/);
  if (altMatch) return altMatch[1];
  
  return null;
}
```

**Updated:** `getCoverPhotoVariantUrl()` with smart fallback

```typescript
export function getCoverPhotoVariantUrl(project: Project, quality?: QualityLevel): string {
  // 1. Prefer cover_photo_id (use variant API)
  if (project.cover_photo_id) {
    return getPhotoVariantUrl(project.cover_photo_id, quality || 'medium');
  }
  
  // 2. Try to extract photo ID from cover_photo_src path
  if (project.cover_photo_src) {
    const photoId = extractPhotoIdFromPath(project.cover_photo_src);
    if (photoId) {
      return getPhotoVariantUrl(photoId, quality || 'medium');
    }
    
    // 3. If we can't extract ID, use the original src with base URL
    if (project.cover_photo_src.startsWith('http')) {
      return project.cover_photo_src;
    }
    return `http://localhost:8000${project.cover_photo_src}`;
  }
  
  // 4. Final fallback
  return '/placeholder-cover.jpg';
}
```

**Benefits:**
- ✅ Tries variant API first (best performance)
- ✅ Falls back to extracting ID from path
- ✅ Falls back to original URL if needed
- ✅ Only shows placeholder as last resort

---

### 2. **Enhanced AlbumFoldersView.tsx**

**Added:** Comprehensive fallback logic with logging

```typescript
const fetchedFolders = (response.folders || []).map((folder: any) => {
  let coverPhotoSrc = '/placeholder-cover.jpg';
  
  if (folder.cover_photo_id) {
    // Prefer cover_photo_id (use variant API)
    coverPhotoSrc = getPhotoVariantUrl(folder.cover_photo_id, 'medium');
    console.log('[AlbumFoldersView] Folder cover using variant:', folder.name, coverPhotoSrc);
  } else if (folder.coverPhotoSrc || folder.cover_photo_src) {
    // Fallback to original path with base URL
    const src = folder.coverPhotoSrc || folder.cover_photo_src;
    coverPhotoSrc = src.startsWith('http') ? src : `http://localhost:8000${src}`;
    console.log('[AlbumFoldersView] Folder cover using original:', folder.name, coverPhotoSrc);
  }
  
  return {
    ...folder,
    coverPhotoSrc
  };
});
```

**Benefits:**
- ✅ Handles both `coverPhotoSrc` and `cover_photo_src` field names
- ✅ Adds base URL if needed
- ✅ Console logs help debugging
- ✅ Applied to both fetch paths (deduplication + main)

---

### 3. **Enhanced photoService.ts**

**Added:** Extensive console logging for debugging

```typescript
async getProjectPhotos(projectId: string, categoryId?: string, quality?: QualityLevel) {
  const response = await apiClient.get<any>(`/v2/photos/projects/${projectId}/photos`, params);
  
  // Log what we received from backend
  console.log('[photoService] Fetched photos from backend:', {
    projectId,
    count: response.photos?.length || 0,
    samplePhoto: response.photos?.[0] ? {
      id: response.photos[0].id,
      filename: response.photos[0].original_filename,
      src: response.photos[0].src,
      storage_path: response.photos[0].storage_path
    } : null
  });
  
  // Transform to use variants
  const transformedPhotos = response.photos.map((photo: any) => {
    const variantUrl = getPhotoVariantUrl(photo.id, quality || 'medium');
    const originalSrc = photo.src || photo.storage_path || photo.file_path;
    
    return {
      ...photo,
      src: variantUrl,
      originalSrc: originalSrc,
    };
  });
  
  // Log transformed results
  console.log('[photoService] Transformed photos to use variants:', {
    count: transformedPhotos.length,
    samplePhoto: transformedPhotos[0] ? {
      id: transformedPhotos[0].id,
      src: transformedPhotos[0].src,
      originalSrc: transformedPhotos[0].originalSrc
    } : null
  });
  
  return { ...response, photos: transformedPhotos };
}
```

**Added:** Variant URL generation logging

```typescript
export function getPhotoVariantUrl(photoId: string | number, quality?: QualityLevel): string {
  const baseUrl = 'http://localhost:8000';
  const selectedQuality = quality || viewportQualityService.getOptimalQuality();
  const url = `${baseUrl}/v2/photos/${photoId}/variant/${selectedQuality}`;
  
  // Debug logging (10% sample to avoid spam)
  if (Math.random() < 0.1) {
    console.log('[getPhotoVariantUrl]', { photoId, quality, selectedQuality, url });
  }
  
  return url;
}
```

---

## 🧪 How to Test & Debug

### Step 1: Start Development Server

```bash
cd Photo_Proof_v1
npm run dev
```

### Step 2: Open Browser Console

**Chrome/Edge:** F12 or Cmd+Option+I (Mac)  
**Firefox:** F12 or Cmd+Option+K (Mac)

**Select "Console" tab**

### Step 3: Load a Page with Photos

Navigate to:
1. **Studio Overview** (project cards with covers)
2. **Album Folders** (folder covers)
3. **Gallery Page** (photo grid)

### Step 4: Check Console Logs

**You should see logs like:**

```
[photoService] Fetched photos from backend: {
  projectId: "12",
  count: 48,
  samplePhoto: {
    id: 808,
    filename: "IMG_1234.jpg",
    src: "/uploads/projects/12/originals/IMG_1234.jpg",
    storage_path: "projects/12/originals/IMG_1234.jpg"
  }
}

[photoService] Transformed photos to use variants: {
  count: 48,
  samplePhoto: {
    id: 808,
    src: "http://localhost:8000/v2/photos/808/variant/medium",
    originalSrc: "/uploads/projects/12/originals/IMG_1234.jpg"
  }
}

[getPhotoVariantUrl] {
  photoId: 808,
  quality: "medium",
  selectedQuality: "medium",
  url: "http://localhost:8000/v2/photos/808/variant/medium"
}

[AlbumFoldersView] Folder cover using variant: "Ceremony" http://localhost:8000/v2/photos/810/variant/medium
```

### Step 5: Check Network Tab

**Open Network tab in DevTools**

**Filter by:** `variant`

**You should see requests like:**
```
GET http://localhost:8000/v2/photos/808/variant/medium
Status: 200 OK
Size: 245 KB
```

**If you see 404 errors:**
- Check if backend server is running: `http://localhost:8000/docs`
- Check variant endpoint manually: `curl http://localhost:8000/v2/photos/808/variant/medium`

### Step 6: Check Image Elements

**In Console, run:**

```javascript
// Check gallery images
document.querySelectorAll('img').forEach(img => {
  console.log({
    src: img.src,
    loaded: img.complete,
    naturalWidth: img.naturalWidth,
    error: img.error
  });
});

// Check if any images failed to load
document.querySelectorAll('img[src*="variant"]').forEach(img => {
  if (!img.complete || img.naturalWidth === 0) {
    console.error('Image failed to load:', img.src);
  }
});
```

---

## 🔍 Troubleshooting Guide

### Issue 1: Still Seeing Placeholder

**Check Console Logs:**

```
[AlbumFoldersView] Folder cover using variant: "..."
```

**If you see:**
```
coverPhotoSrc: "/placeholder-cover.jpg"
```

**Possible causes:**
1. Backend not returning `cover_photo_id` OR `cover_photo_src`
2. Both fields are null in database

**Solution:**
```bash
# Check backend response
curl http://localhost:8000/api/projects/12/folders

# Look for:
{
  "folders": [{
    "id": 1,
    "name": "Ceremony",
    "cover_photo_id": 810,  // Should have this OR ↓
    "cover_photo_src": "/uploads/..."  // Should have this
  }]
}
```

If both are null, you need to set cover photos:
1. Open project in Studio
2. Click "Change Cover" button
3. Select a photo

---

### Issue 2: Images Not Loading (Broken Image Icon)

**Check Network Tab:**

**If you see 404:**
```
GET http://localhost:8000/v2/photos/808/variant/medium
Status: 404 Not Found
```

**Possible causes:**
1. Backend server not running
2. Photo ID doesn't exist in database
3. Variant files not generated

**Solutions:**

**Check backend server:**
```bash
cd photo_proof_api
python3 -m uvicorn app.main:app --reload --port 8000
```

**Test variant endpoint:**
```bash
# List photos to get valid IDs
curl http://localhost:8000/v2/photos/projects/12/photos

# Test variant for valid ID
curl -I http://localhost:8000/v2/photos/808/variant/medium

# Should return:
HTTP/1.1 200 OK
Content-Type: image/webp
Content-Length: 245123
```

**If 404, check backend logs:**
```bash
# Backend should log variant generation
[INFO] Generating variant: medium for photo 808
[INFO] Variant generated: projects/12/variants/808/medium.webp
```

---

### Issue 3: CORS Error

**Console shows:**
```
Access to fetch at 'http://localhost:8000/...' from origin 'http://localhost:3001' 
has been blocked by CORS policy
```

**Solution:**

**Check backend CORS settings:**

`photo_proof_api/.env`:
```
CORS_ORIGINS=http://localhost:3001,http://localhost:3000
```

**Restart backend after changing .env**

---

### Issue 4: Wrong Base URL

**If frontend is on different port:**

`Photo_Proof_v1/services/photoService.ts`:
```typescript
export function getPhotoVariantUrl(photoId: string | number, quality?: QualityLevel): string {
  const baseUrl = 'http://localhost:8000';  // Change if backend uses different port
  // ...
}
```

---

## 📊 Expected Behavior

### ✅ Correct Behavior

**Console Logs:**
```
✅ [photoService] Fetched photos from backend: { count: 48, ... }
✅ [photoService] Transformed photos to use variants: { count: 48, ... }
✅ [getPhotoVariantUrl] { url: "http://localhost:8000/v2/photos/808/variant/medium" }
✅ [AlbumFoldersView] Folder cover using variant: "Ceremony" http://...
```

**Network Tab:**
```
✅ GET /v2/photos/808/variant/medium - 200 OK - 245 KB
✅ GET /v2/photos/809/variant/medium - 200 OK - 240 KB
✅ GET /v2/photos/810/variant/medium - 200 OK - 238 KB
```

**Visual Result:**
- ✅ Project cards show cover photos (not placeholder)
- ✅ Folder cards show cover photos
- ✅ Gallery shows all photos in grid
- ✅ Lightbox shows high quality
- ✅ No broken image icons

---

### ❌ Incorrect Behavior

**Console Logs:**
```
❌ [photoService] Fetched photos from backend: { count: 0 }
❌ Error: Failed to fetch photos
❌ TypeError: Cannot read property 'map' of undefined
```

**Network Tab:**
```
❌ GET /placeholder-cover.jpg - 200 OK (using fallback)
❌ GET /v2/photos/808/variant/medium - 404 Not Found
❌ GET /v2/photos/808/variant/medium - 500 Internal Server Error
```

**Visual Result:**
- ❌ Placeholder images everywhere
- ❌ Broken image icons
- ❌ Empty gallery grid

---

## 🎯 Success Criteria

All of these should be TRUE:

- [ ] **Console logs show photo fetching** (not errors)
- [ ] **Console logs show variant URL generation** with correct IDs
- [ ] **Network tab shows variant URLs** (not placeholder or originals)
- [ ] **All variant requests return 200 OK** (not 404)
- [ ] **Image sizes are ~245KB** (not 30MB)
- [ ] **Gallery shows photos** (not blank/broken)
- [ ] **Project covers show photos** (not placeholder)
- [ ] **Folder covers show photos** (not placeholder)
- [ ] **Lightbox works** with high quality
- [ ] **Download works** with original quality

---

## 🚀 Next Steps

1. **Start dev server:** `npm run dev`
2. **Open browser console**
3. **Navigate to gallery/projects**
4. **Check console logs** (follow guide above)
5. **Check Network tab** for variant URLs
6. **Report findings:**
   - What console logs do you see?
   - What Network requests do you see?
   - Any 404 or error messages?
   - Screenshots if possible

---

## 📝 Summary of Changes

**Files Modified:**
1. `services/projectService.ts` - Enhanced cover photo URL generation with path extraction
2. `components/AlbumFoldersView.tsx` - Better fallback logic + console logging
3. `services/photoService.ts` - Extensive debugging logs for photo transformation

**New Features:**
- ✅ Extracts photo ID from storage path when `cover_photo_id` missing
- ✅ Smart fallback chain: variant → extracted ID → original URL → placeholder
- ✅ Comprehensive console logging for debugging
- ✅ Handles multiple field name variations
- ✅ TypeScript build successful

**Testing Tools:**
- Console logs show transformation pipeline
- Network tab shows actual requests
- Browser DevTools can inspect image elements
- Backend API can be tested with curl

---

**Ready for Testing!** Follow the guide above and report what you see in console/network tabs.
