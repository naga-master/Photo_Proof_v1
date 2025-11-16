# Testing Version Upload Fix - Quick Guide

## What Was Fixed

**Problem:** Edited photos were creating NEW photos (101 → 115) instead of versions  
**Solution:** Upload system now routes version uploads to `version_service.create_version()`  
**Status:** ✅ Implemented and Backend Restarted

---

## Quick Test Steps

### 1. Before Test - Check Current State
```bash
# Count photos in project (should be current count, e.g., 115)
sqlite3 photo_proof.db "SELECT COUNT(*) FROM photos WHERE project_id = <your_project_id>;"

# Example output: 115 (if bug already occurred)
```

### 2. Perform Test Upload

**Frontend Steps:**
1. Navigate to project "ddfdfgdsf" (or any project)
2. Click "Upload Edited Photos" button
3. Select 2-3 edited photos
4. Let auto-matching run (or manually map)
5. Add version labels (optional)
6. Click "Start Upload"
7. Wait for completion

### 3. Verify Results - Photo Count Should NOT Increase

```bash
# Count photos again - should be SAME number
sqlite3 photo_proof.db "SELECT COUNT(*) FROM photos WHERE project_id = <your_project_id>;"

# Example: Still 115 (NOT 118) ✅
```

### 4. Verify Versions Were Created

```bash
# Count new photo versions
sqlite3 photo_proof.db "SELECT COUNT(*) FROM photo_versions;"

# Check specific photo that received version
sqlite3 photo_proof.db "SELECT id, original_filename, version_count, current_version_id FROM photos WHERE id = <photo_id>;"

# Should show version_count = 2 or more ✅
```

### 5. Check Backend Logs

```bash
tail -50 photo_proof_api/uvicorn.out | grep -E "Creating version|Version.*created"
```

**Expected logs:**
```
INFO: Creating version for photo 1234
INFO: Version 2 created for photo 1234
```

---

## Detailed Verification

### Check Version Table Directly

```bash
sqlite3 photo_proof.db
```

```sql
-- See all versions for a specific photo
SELECT 
    pv.id,
    pv.version_number,
    pv.version_label,
    pv.is_original,
    pv.original_filename,
    pv.created_at
FROM photo_versions pv
WHERE pv.photo_id = <your_photo_id>
ORDER BY pv.version_number DESC;
```

**Expected output:**
```
5678|3|Final Edit|0|IMG_7057_edited.jpg|2025-11-15 11:25:00
5677|2|Color Corrected|0|IMG_7057_v2.jpg|2025-11-15 11:20:00
5676|1|NULL|1|IMG_7057.jpg|2025-11-14 10:00:00
```

### Check Photo Record

```sql
SELECT 
    id,
    original_filename,
    version_count,
    current_version_id,
    last_version_updated_at
FROM photos
WHERE id = <your_photo_id>;
```

**Expected:**
```
1234|IMG_7057.jpg|3|5678|2025-11-15 11:25:00
```

---

## API Testing

### Get Version History

```bash
curl -X GET "http://localhost:8000/v2/photos/photos/<photo_id>/versions" \
  -H "Authorization: Bearer <your_token>"
```

**Expected Response:**
```json
{
  "photo_id": 1234,
  "current_version": {
    "id": 5678,
    "version_number": 3,
    "filename": "IMG_7057_edited.jpg",
    "version_label": "Final Edit",
    "is_current": true
  },
  "versions": [
    {
      "id": 5678,
      "version_number": 3,
      "is_current": true
    },
    {
      "id": 5677,
      "version_number": 2,
      "is_current": false
    },
    {
      "id": 5676,
      "version_number": 1,
      "is_original": true,
      "is_current": false
    }
  ],
  "total_versions": 3
}
```

---

## Expected vs. Broken Behavior

### BROKEN (Before Fix) ❌
```
Before: 101 photos
Upload 14 edited photos
After: 115 photos (WRONG - created 14 NEW photos)

photo_versions table: 0 rows
photos.version_count: all 1
```

### FIXED (After Implementation) ✅
```
Before: 101 photos  
Upload 14 edited photos
After: 101 photos (CORRECT - created 14 versions)

photo_versions table: 14+ rows (new versions)
photos.version_count: 14 photos now have count >= 2
```

---

## Troubleshooting

### If Photo Count Still Increases

**Check backend logs:**
```bash
tail -200 photo_proof_api/uvicorn.out | grep -E "version|Version|upload"
```

**Look for:**
- "Creating version for photo X" - ✅ Good
- "Creating new photo" - ❌ Bad (shouldn't see this for versions)

**Verify token has version flag:**
```sql
SELECT 
    token,
    filename,
    is_version_upload,
    target_photo_id,
    version_label
FROM upload_tokens
ORDER BY created_at DESC
LIMIT 5;
```

Should show `is_version_upload = 1` for recent uploads.

### If Backend Errors

**Check for missing imports:**
```bash
grep "ModuleNotFoundError\|ImportError" photo_proof_api/uvicorn.out
```

**Check database schema:**
```bash
sqlite3 photo_proof.db "PRAGMA table_info(upload_tokens);" | grep version
```

Should show:
```
13|is_version_upload|BOOLEAN|1|0|0
14|target_photo_id|INTEGER|0||0
15|version_label|VARCHAR(255)|0||0
16|mapping_type|VARCHAR(50)|0||0
```

### If Versions Not Appearing in UI

**Check frontend console:**
- Open browser DevTools
- Look for API calls to `/versions` endpoint
- Check response data

**Verify API response:**
```bash
curl -s http://localhost:8000/v2/photos/photos/<photo_id>/versions \
  -H "Authorization: Bearer <token>" | jq
```

---

## Success Indicators

### ✅ Everything Working Correctly

1. **Photo count stable** - Doesn't increase with edited uploads
2. **Versions table populated** - New rows in `photo_versions`
3. **version_count incremented** - Photos show count > 1
4. **Backend logs** - "Creating version" messages
5. **API returns versions** - `/photos/<id>/versions` endpoint works
6. **UI shows versions** - Version picker appears in gallery

### ❌ Still Broken

1. **Photo count increases** - New photos being created
2. **Versions table empty** - No new rows
3. **Backend errors** - Check logs for exceptions
4. **is_version_upload = 0** - Token not being set correctly

---

## Clean Up Test Data (If Needed)

**If you want to remove duplicate photos created before fix:**

```sql
-- CAREFUL! Double-check project_id before running
-- This removes photos created after your "baseline" count

-- First, verify which photos would be deleted
SELECT id, original_filename, created_at 
FROM photos 
WHERE project_id = <project_id>
ORDER BY id DESC 
LIMIT 20;

-- If those are the duplicates, delete them
DELETE FROM photos 
WHERE project_id = <project_id> 
AND id > <last_original_photo_id>;

-- Update project photo count
UPDATE projects 
SET photo_count = (
    SELECT COUNT(*) 
    FROM photos 
    WHERE project_id = <project_id>
)
WHERE id = <project_id>;
```

---

## Summary

**Test Procedure:**
1. Note current photo count
2. Upload 2-3 edited photos
3. Verify photo count unchanged
4. Check version_count increased
5. Verify backend logs show "Creating version"

**Success Criteria:**
- Photo count: Stable ✅
- Versions created: Yes ✅
- Backend logs: No errors ✅
- API works: Returns versions ✅

**If Issues:**
- Check backend logs
- Verify migration applied
- Check token fields in database
- Review implementation in upload_service.py

---

**Ready to test! Upload some edited photos and watch the magic happen! ✨**
