# Phase 2: Smart Compression - Testing Guide

## Prerequisites

- Phase 1 (Chunked Upload) working
- thumbhash npm package installed
- Backend image processing service deployed
- Pillow library installed on backend

## Enable Phase 2

```typescript
// config/image-optimization.dev.ts
features: {
  clientSideCompression: true,
  serverSideVariants: true,
  viewportQualitySelection: true,
}
```

---

## Test Suite

### Test 1: Client-Side Compression

**Objective:** Verify image compression before upload

**Steps:**
1. Select a 30MB JPEG image
2. Compress using imageCompressionService
3. Verify compressed size

**Code:**
```javascript
const file = /* 30MB JPEG */;
const result = await imageCompressionService.compressImage(file);

console.log({
  original: result.originalSize,
  compressed: result.compressedSize,
  ratio: result.compressionRatio,
  savings: ((1 - result.compressedSize / result.originalSize) * 100).toFixed(1) + '%'
});
```

**Expected Results:**
- ✅ Compressed size <5MB
- ✅ Compression ratio 5-10x
- ✅ WebP format
- ✅ Compression time <5 seconds
- ✅ Dimensions ≤4096px

**Validation:**
```javascript
console.assert(result.compressedSize < 5 * 1024 * 1024, 'Size under 5MB');
console.assert(result.compressionRatio >= 5, 'Ratio at least 5x');
```

---

### Test 2: ThumbHash Generation

**Objective:** Verify instant placeholder generation

**Steps:**
1. Compress an image
2. Extract ThumbHash
3. Convert to data URL
4. Display as placeholder

**Code:**
```javascript
const result = await imageCompressionService.compressImage(file);
const thumbhash = result.thumbhash;

console.log('ThumbHash:', thumbhash);
console.log('Length:', thumbhash?.length);

// Convert to data URL for preview
const dataUrl = imageCompressionService.thumbHashToDataURL(thumbhash);
console.log('Data URL:', dataUrl.substring(0, 50) + '...');
```

**Expected Results:**
- ✅ ThumbHash generated
- ✅ Base64 string length ~30-50 chars
- ✅ Generation time <50ms
- ✅ Data URL conversion works

---

### Test 3: Server-Side Variant Generation

**Objective:** Verify backend generates 5 quality variants

**Steps:**
1. Upload an image
2. Check photo record for variants_json
3. Verify all 5 variants exist

**Backend Test:**
```python
# In backend
from app.services.image_processing_service import ImageProcessingService
from pathlib import Path

service = ImageProcessingService()
variants = await service.generate_quality_variants(db, photo, Path(photo.storage_path))

print(f"Generated variants: {variants}")
assert len(variants) == 5
assert all(k in variants for k in ['thumbnail', 'low', 'medium', 'high', 'print'])
```

**Frontend Verification:**
```javascript
// After upload
const photo = await fetch(`/api/photos/${photoId}`).then(r => r.json());
console.log('Variants:', JSON.parse(photo.variants_json));

// Verify each variant exists
const qualities = ['thumbnail', 'low', 'medium', 'high', 'print'];
for (const q of qualities) {
  const url = `/v2/photos/${photoId}/variant/${q}`;
  const response = await fetch(url);
  console.log(`${q}:`, response.ok ? '✅' : '❌');
}
```

**Expected Results:**
- ✅ All 5 variants generated
- ✅ Generation time <10 seconds
- ✅ All variant files exist
- ✅ Sizes decrease: print > high > medium > low > thumbnail

---

### Test 4: Viewport Quality Selection

**Objective:** Verify quality adapts to viewport size

**Test Cases:**

**A. Mobile Viewport (375px)**
```javascript
// Resize window to 375px wide
window.resizeTo(375, 667);

const quality = viewportQualityService.getViewportQuality();
console.assert(quality === 'low', 'Mobile uses low quality');
```

**B. Tablet Viewport (768px)**
```javascript
window.resizeTo(768, 1024);
const quality = viewportQualityService.getViewportQuality();
console.assert(quality === 'medium', 'Tablet uses medium quality');
```

**C. Desktop Viewport (1920px)**
```javascript
window.resizeTo(1920, 1080);
const quality = viewportQualityService.getViewportQuality();
console.assert(quality === 'high', 'Desktop uses high quality');
```

**D. Retina Display**
```javascript
// On device with devicePixelRatio >= 2
console.log('Pixel ratio:', window.devicePixelRatio);
const quality = viewportQualityService.getViewportQuality();
// Should be upgraded by one level
```

---

### Test 5: Progressive Loading

**Objective:** Verify images load progressively (blur → sharp)

**Steps:**
1. Clear cache
2. Load image
3. Observe progressive sequence

**Code:**
```javascript
const photoId = '123';
const finalQuality = 'high';

const sequence = viewportQualityService.getProgressiveSequence(finalQuality);
console.log('Loading sequence:', sequence);

// Simulate progressive load
for (const quality of sequence) {
  console.log(`Loading ${quality}...`);
  const url = `/v2/photos/${photoId}/variant/${quality}`;
  const response = await fetch(url);
  const blob = await response.blob();
  console.log(`  ${quality}: ${(blob.size / 1024).toFixed(1)} KB`);
  
  // Display in UI (would show blur effect)
  await new Promise(resolve => setTimeout(resolve, 300));
}
```

**Expected Results:**
- ✅ Sequence: ['thumbnail', 'high']
- ✅ Thumbnail loads first (<50ms)
- ✅ Final quality loads next
- ✅ Smooth transition effect

---

### Test 6: Compression Ratio Validation

**Objective:** Measure actual bandwidth savings

**Test Matrix:**

| Original Size | Format | Expected Compressed | Expected Ratio |
|---------------|--------|---------------------|----------------|
| 10 MB | JPEG | <2 MB | 5x |
| 30 MB | JPEG | <5 MB | 6x |
| 50 MB | PNG | <8 MB | 6x |
| 100 MB | RAW | <15 MB | 7x |

**Code:**
```javascript
const testFiles = [
  { size: 10 * 1024 * 1024, name: '10MB.jpg' },
  { size: 30 * 1024 * 1024, name: '30MB.jpg' },
  { size: 50 * 1024 * 1024, name: '50MB.png' },
];

for (const test of testFiles) {
  const file = await generateTestFile(test.size);
  const result = await imageCompressionService.compressImage(file);
  
  console.log(`${test.name}:`, {
    original: (result.originalSize / 1024 / 1024).toFixed(1) + ' MB',
    compressed: (result.compressedSize / 1024 / 1024).toFixed(1) + ' MB',
    ratio: result.compressionRatio.toFixed(1) + 'x',
    savings: ((1 - result.compressedSize / result.originalSize) * 100).toFixed(0) + '%'
  });
}
```

---

### Test 7: Variant Endpoint Performance

**Objective:** Verify fast variant serving

**Steps:**
1. Request each quality variant
2. Measure response time
3. Verify cache headers

**Code:**
```javascript
const photoId = '123';
const qualities = ['thumbnail', 'low', 'medium', 'high', 'print'];

for (const quality of qualities) {
  const startTime = performance.now();
  const response = await fetch(`/v2/photos/${photoId}/variant/${quality}`);
  const endTime = performance.now();
  
  console.log(`${quality}:`, {
    status: response.status,
    time: (endTime - startTime).toFixed(0) + 'ms',
    size: response.headers.get('content-length'),
    cache: response.headers.get('cache-control'),
    etag: response.headers.get('etag')
  });
}
```

**Expected Results:**
- ✅ All requests return 200 OK
- ✅ Response time <100ms for cached
- ✅ Cache-Control: immutable
- ✅ ETag present
- ✅ Sizes: thumbnail < low < medium < high < print

---

### Test 8: Integration with Upload Flow

**Objective:** Verify compression works end-to-end

**Steps:**
1. Select large file
2. Compress client-side
3. Upload compressed file
4. Verify variants generated server-side
5. Verify variants accessible

**Full Flow:**
```javascript
// Step 1: Select file
const file = /* 50MB JPEG */;
console.log('Original:', file.size);

// Step 2: Compress
const compressed = await imageCompressionService.compressImage(file);
console.log('Compressed:', compressed.compressedSize);

// Step 3: Upload
const compressedFile = new File(
  [compressed.compressedFile], 
  file.name, 
  { type: 'image/webp' }
);

const photo = await chunkedUploadService.uploadFile(
  compressedFile,
  projectId,
  folderId
);

console.log('Uploaded photo ID:', photo.id);

// Step 4: Wait for variant generation (async on server)
await new Promise(resolve => setTimeout(resolve, 5000));

// Step 5: Verify variants
const photoData = await fetch(`/api/photos/${photo.id}`).then(r => r.json());
const variants = JSON.parse(photoData.variants_json);
console.log('Variants generated:', Object.keys(variants));

// Step 6: Test each variant
for (const quality of ['thumbnail', 'low', 'medium', 'high', 'print']) {
  const response = await fetch(`/v2/photos/${photo.id}/variant/${quality}`);
  console.log(`${quality}:`, response.ok ? '✅' : '❌');
}
```

**Expected Results:**
- ✅ File compressed 80-90%
- ✅ Upload completes successfully
- ✅ 5 variants generated
- ✅ All variants accessible
- ✅ Total bandwidth saved 90%+

---

## Performance Benchmarks

Run these benchmarks and record results:

```javascript
// Benchmark 1: Compression Speed
const sizes = [5, 10, 20, 30, 50];
for (const sizeMB of sizes) {
  const file = await generateTestFile(sizeMB * 1024 * 1024);
  const start = performance.now();
  await imageCompressionService.compressImage(file);
  const duration = performance.now() - start;
  console.log(`${sizeMB}MB: ${duration.toFixed(0)}ms`);
}

// Target: <5s for 30MB

// Benchmark 2: ThumbHash Generation
const iterations = 100;
const start = performance.now();
for (let i = 0; i < iterations; i++) {
  await imageCompressionService.compressImage(smallFile);
}
const avg = (performance.now() - start) / iterations;
console.log(`Average ThumbHash time: ${avg.toFixed(1)}ms`);

// Target: <50ms average
```

---

## Troubleshooting

### Issue: "Compression not reducing file size"
**Cause:** Already compressed format (WebP, optimized JPEG)
**Solution:** Check if file already optimized, skip compression

### Issue: "ThumbHash not generating"
**Cause:** thumbhash package not installed
**Solution:** `npm install thumbhash`

### Issue: "Variants not generated"
**Cause:** Backend Pillow not installed
**Solution:** `pip install Pillow`

### Issue: "Variant endpoint returns 404"
**Cause:** Variant file doesn't exist
**Solution:** Check variants_json in database, regenerate if needed

---

## Success Criteria

Phase 2 is successful if:

- ✅ Client compression reduces files 80-90%
- ✅ ThumbHash generates in <50ms
- ✅ Server generates 5 variants in <10s
- ✅ Viewport quality selection works
- ✅ Progressive loading shows smooth transition
- ✅ Variant endpoint responds <100ms
- ✅ Integration with upload flow works
- ✅ Total bandwidth savings 90%+

---

## Next Steps

After validating Phase 2:
- Move to Phase 3: OPFS Cache
- Integrate compression with existing upload UI
- Monitor compression ratios in production
- Fine-tune quality settings based on feedback
