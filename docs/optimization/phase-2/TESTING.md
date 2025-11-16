# Phase 2: Backend Image Optimization - Testing Guide

## Prerequisites

- Phase 1 (Chunked Upload) working
- Backend: Pillow installed (`pip install Pillow`)
- Database: Migration 004 applied (variants_json, thumbhash columns)

## Test 1: Upload with Variant Generation

### Objective
Verify backend generates 5 quality variants automatically

### Steps
1. Upload a 30MB photo through edited photos wizard
2. Watch backend console logs
3. Check database for variants_json
4. Verify variant files exist

### Expected Backend Logs
```
[UploadService] Photo 123 created
[UploadService] Generating quality variants for photo 123
[ImageProcessing] Generating variants for photo 123
[ImageProcessing] Created thumbnail variant: uploads/variants/123_thumbnail.webp
[ImageProcessing] Created low variant: uploads/variants/123_low.webp
[ImageProcessing] Created medium variant: uploads/variants/123_medium.webp
[ImageProcessing] Created high variant: uploads/variants/123_high.webp
[ImageProcessing] Created print variant: uploads/variants/123_print.webp
[UploadService] Generated 5 variants for photo 123
[UploadService] Generating ThumbHash for photo 123
[UploadService] ThumbHash generated for photo 123
```

### Validation
```sql
-- Check database
SELECT id, storage_path, variants_json, thumbhash 
FROM photos 
WHERE id = 123;

-- Expected result:
-- storage_path: uploads/projects/6/20251116_abc123_photo.jpg (30MB original)
-- variants_json: {"thumbnail": "uploads/variants/123_thumbnail.webp", ...}
-- thumbhash: "abc123..." (base64 string)
```

### Check Files
```bash
cd photo_proof_api/uploads/variants/
ls -lh 123_*

# Expected:
# 123_thumbnail.webp  (15 KB)
# 123_low.webp        (85 KB)
# 123_medium.webp     (245 KB)
# 123_high.webp       (780 KB)
# 123_print.webp      (2.5 MB)
```

---

## Test 2: Variant Serving

### Objective
Verify variant endpoint serves correct quality

### Steps
```bash
# Test each quality level
curl http://localhost:8000/v2/photos/123/variant/thumbnail > thumb.webp
curl http://localhost:8000/v2/photos/123/variant/low > low.webp
curl http://localhost:8000/v2/photos/123/variant/medium > medium.webp
curl http://localhost:8000/v2/photos/123/variant/high > high.webp
curl http://localhost:8000/v2/photos/123/variant/print > print.webp

# Check file sizes
ls -lh *.webp
```

### Expected Results
- thumbnail: ~15 KB
- low: ~85 KB
- medium: ~245 KB
- high: ~780 KB
- print: ~2.5 MB

### Browser Test
Open in browser:
```
http://localhost:8000/v2/photos/123/variant/thumbnail
http://localhost:8000/v2/photos/123/variant/low
http://localhost:8000/v2/photos/123/variant/medium
http://localhost:8000/v2/photos/123/variant/high
http://localhost:8000/v2/photos/123/variant/print
```

All should display the image at different qualities.

---

## Test 3: Viewport Quality Selection

### Objective
Verify frontend selects correct quality for screen size

### Browser Console Test
```javascript
// Check viewport service exists
console.log(window.viewportQualityService);

// Check current screen quality
const quality = viewportQualityService.getOptimalQuality();
console.log('Current quality:', quality);

// Expected results:
// Mobile (375px): "low"
// Tablet (768px): "medium"
// Desktop (1920px): "high"
// 4K (2560px): "print"

// Test different screen sizes
window.resizeTo(375, 667);  // Mobile
console.log(viewportQualityService.getOptimalQuality());  // Should be "low"

window.resizeTo(768, 1024);  // Tablet
console.log(viewportQualityService.getOptimalQuality());  // Should be "medium"

window.resizeTo(1920, 1080);  // Desktop
console.log(viewportQualityService.getOptimalQuality());  // Should be "high"
```

---

## Test 4: ThumbHash Placeholders

### Objective
Verify ThumbHash is generated and displayed

### Check Database
```sql
SELECT id, thumbhash FROM photos WHERE id = 123;
```

Should return a base64 string (e.g., "MTQxMjM0NTY...").

### Frontend Display (Manual)
```javascript
// In browser console
const photo = await fetch('/api/photos/123').then(r => r.json());
console.log('ThumbHash:', photo.thumbhash);

// Verify it's a valid base64 string
console.log('Length:', photo.thumbhash.length);  // Should be ~30-50 chars
```

---

## Test 5: Original File Preservation

### Objective
Verify original 30MB file is preserved

### Check Storage
```bash
cd photo_proof_api/uploads/projects/6/
ls -lh 20251116_*

# Should see original file at full size
# Example: 20251116_123456_photo.jpg (30.5 MB)
```

### Database Check
```sql
SELECT storage_path, file_size FROM photos WHERE id = 123;

-- storage_path should point to original
-- file_size should be ~30MB (30927823 bytes)
```

### Download Original
```bash
curl http://localhost:8000/uploads/projects/6/20251116_abc123_photo.jpg > original.jpg
ls -lh original.jpg

# Should be 30MB
```

---

## Test 6: Performance Benchmarks

### Upload Performance
```
30MB photo upload:
- Upload time: < 30s (with chunked upload on decent network)
- Variant generation: < 10s
- ThumbHash generation: < 50ms
- Total: < 40s
```

### Delivery Performance
```
Gallery load (10 photos):
- Without variants: 10 × 30MB = 300MB transfer
- With variants (mobile): 10 × 85KB = 850KB transfer
- Savings: 99.7%
```

### Storage Cost
```
Per photo:
- Original: 30MB
- 5 variants: ~15MB
- Total: ~45MB

Cost: 50% overhead
Benefit: 99.7% delivery savings
```

---

## Test 7: Error Handling

### Test Variant Generation Failure
1. Corrupt an uploaded file
2. Check that upload still succeeds
3. Verify error logged but upload not blocked

### Test Missing Variant
1. Delete a variant file
2. Request that variant via endpoint
3. Should return 404 or fallback

---

## Success Criteria

Phase 2 is successful if:

- ✅ Original 30MB file stored in uploads/projects/
- ✅ 5 variants generated in uploads/variants/
- ✅ variants_json populated in database
- ✅ ThumbHash generated and stored
- ✅ Variant endpoint serves correct quality
- ✅ Viewport service selects appropriate quality
- ✅ Bandwidth savings: 90%+ on mobile
- ✅ Variant generation: < 10s
- ✅ Upload doesn't fail if variant generation fails

---

## Troubleshooting

### Issue: "No variants generated"
**Check:**
```bash
# Is Pillow installed?
cd photo_proof_api
python3 -c "import PIL; print('Pillow OK')"

# Check backend logs for errors
tail -f backend.log | grep "ImageProcessing"
```

### Issue: "Variant endpoint returns 404"
**Check:**
```bash
# Do variant files exist?
ls uploads/variants/123_*

# Check database
SELECT variants_json FROM photos WHERE id = 123;
```

### Issue: "ThumbHash not generated"
**Check backend logs:**
```
grep "ThumbHash" backend.log
```

---

## Next Steps

After Phase 2 validation:
- Move to Phase 3: OPFS Cache
- Monitor variant generation performance
- Consider async generation for production
- Add variant regeneration admin task
