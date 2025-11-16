# Phase 1: Chunked Upload - Testing Guide

## Testing Overview

This guide provides comprehensive testing procedures for validating the chunked upload implementation.

---

## Prerequisites

### 1. Configuration
Enable chunked upload in config:
```typescript
// config/image-optimization.dev.ts
features: {
  chunkedUpload: true
}
```

### 2. Backend Running
```bash
cd photo_proof_api
python3 main.py
```

### 3. Frontend Running
```bash
cd Photo_Proof_v1
npm run dev
```

### 4. Test Files
Prepare test files of various sizes:
- Small: 5 MB
- Medium: 50 MB
- Large: 100 MB
- Extra Large: 500 MB (if needed)

---

## Test Suite

### Test 1: Basic Chunked Upload (Happy Path)

**Objective:** Verify successful upload of a 50MB file

**Steps:**
1. Open browser DevTools Console
2. Navigate to upload page
3. Select a 50MB image file
4. Click upload
5. Monitor console logs

**Expected Results:**
- ✅ File split into chunks (based on network)
- ✅ Session initialized on server
- ✅ All chunks uploaded successfully
- ✅ Progress updates show increasing percentage
- ✅ Upload finalized successfully
- ✅ Photo appears in gallery
- ✅ No errors in console

**Console Output Example:**
```
[ChunkedUpload] Starting chunked upload: { filename: "test.jpg", size: 52428800 }
[ChunkedUpload] File split into 25 chunks of 2097152 bytes
[ChunkedUpload] Uploading chunk 1/25 (attempt 1)
[ChunkedUpload] Chunk 1 uploaded successfully
...
[ChunkedUpload] Upload completed successfully
```

**Validation:**
```javascript
// Check final photo record
const photo = await fetch('/api/photos/123').then(r => r.json());
console.assert(photo.file_size === 52428800, 'File size matches');
console.assert(photo.status === 'completed', 'Status is completed');
```

---

### Test 2: Network Interruption and Resume

**Objective:** Verify upload resumes after network disconnection

**Steps:**
1. Start uploading a 100MB file
2. After 30% complete, open DevTools Network tab
3. Click "Offline" to simulate network loss
4. Wait 10 seconds
5. Uncheck "Offline" to restore network
6. Observe upload resuming

**Expected Results:**
- ✅ Upload pauses when network offline
- ✅ Failed chunks tracked correctly
- ✅ Upload resumes when network restored
- ✅ No duplicate chunk uploads
- ✅ Final file assembled correctly
- ✅ File integrity maintained

**Monitoring:**
```javascript
// Check progress during upload
setInterval(() => {
  const progress = __chunkedUploadService.getProgress(sessionId);
  console.log('Progress:', progress);
}, 1000);
```

---

### Test 3: Chunk Retry with Exponential Backoff

**Objective:** Verify retry logic for failed chunks

**Steps:**
1. Enable network throttling (DevTools → Network → Slow 3G)
2. Upload a 50MB file
3. Monitor retry attempts in console
4. Verify exponential backoff delays

**Expected Results:**
- ✅ Failed chunks retry automatically
- ✅ Backoff delays: 1s → 2s → 4s → 8s → 16s
- ✅ Max 5 retry attempts per chunk
- ✅ Upload completes despite retries
- ✅ Retry overhead < 10% of total time

**Console Monitoring:**
```
[ChunkedUpload] Chunk 15 upload failed (attempt 1): Network error
[ChunkedUpload] Retrying chunk 15 after 1000ms
[ChunkedUpload] Chunk 15 upload failed (attempt 2): Network error
[ChunkedUpload] Retrying chunk 15 after 2000ms
[ChunkedUpload] Chunk 15 uploaded successfully
```

---

### Test 4: Parallel Chunk Uploads

**Objective:** Verify parallel uploads on good network

**Steps:**
1. Ensure good network (4G or WiFi)
2. Upload a 100MB file
3. Monitor network tab for concurrent requests
4. Verify parallel uploads

**Expected Results:**
- ✅ Multiple chunks uploading simultaneously (3-5 on 4G)
- ✅ Upload faster than serial uploads
- ✅ No race conditions
- ✅ All chunks assembled in correct order

**Network Tab Verification:**
- Look for multiple `/v2/upload/chunked/{sessionId}/{index}` requests in flight
- Verify 3-5 concurrent requests (based on network profile)

---

### Test 5: Adaptive Chunk Sizing

**Objective:** Verify chunk size adapts to network speed

**Test Cases:**

**A. Slow Network (2G)**
```javascript
// Simulate 2G (DevTools → Network → Slow 2G)
// Upload 20MB file
// Expected: 1MB chunks, 1 parallel
```

**B. Fast Network (4G)**
```javascript
// Simulate 4G (DevTools → Network → Fast 4G)
// Upload 20MB file
// Expected: 5MB chunks, 3 parallel
```

**Validation:**
```javascript
// Check chunk size in logs
const chunkSize = /* from console logs */;
const expectedSize = imageOptimizationConfig
  .getChunkSizeForNetwork('2g');
console.assert(chunkSize === expectedSize, 'Chunk size matches network profile');
```

---

### Test 6: Hash Verification

**Objective:** Verify chunk integrity with SHA-256 hashes

**Steps:**
1. Upload a file with verbose logging enabled
2. Monitor console for hash calculations
3. Verify server validates hashes

**Expected Results:**
- ✅ Each chunk hash calculated before upload
- ✅ Server verifies hash on receive
- ✅ Mismatched hashes rejected
- ✅ Error logged if hash mismatch

**Enable Verbose Logging:**
```typescript
imageOptimizationConfig.debug.enableVerboseLogging = true;
```

---

### Test 7: Session Expiration

**Objective:** Verify sessions expire after 24 hours

**Steps:**
1. Initialize upload session
2. Retrieve sessionId
3. Wait 24+ hours (or modify expiration in code for testing)
4. Try to upload chunk

**Expected Results:**
- ✅ Upload rejected with "Session expired" error
- ✅ Session cleaned up automatically
- ✅ Temp files deleted

**Manual Testing (Fast):**
```python
# In backend: chunked_upload_service.py
# Temporarily change expiration:
session.expires_at = datetime.utcnow() + timedelta(minutes=1)
```

---

### Test 8: Large File Upload (100MB+)

**Objective:** Verify system handles large files

**Steps:**
1. Prepare a 100MB+ test file
2. Upload with monitoring
3. Verify completion

**Expected Results:**
- ✅ File uploads successfully
- ✅ Memory usage stable (no leaks)
- ✅ Progress tracking accurate
- ✅ Assembly completes without errors
- ✅ Final file size matches original

**Performance Targets:**
| Network | File Size | Max Time |
|---------|-----------|----------|
| 2G      | 100 MB    | 15 min   |
| 3G      | 100 MB    | 7 min    |
| 4G      | 100 MB    | 2 min    |

---

### Test 9: Multiple Concurrent Uploads

**Objective:** Verify system handles multiple users uploading simultaneously

**Steps:**
1. Open 3 browser tabs
2. Start uploads in all tabs simultaneously
3. Monitor server logs
4. Verify all complete successfully

**Expected Results:**
- ✅ All uploads complete successfully
- ✅ No session conflicts
- ✅ Temp directories isolated
- ✅ Server handles load gracefully

---

### Test 10: Edge Cases

**Test Cases:**

**A. Extremely Small File**
```
Upload 100KB file
Expected: Single chunk upload (no chunking needed)
```

**B. Network Changes Mid-Upload**
```
Start on WiFi
Switch to cellular (or use network throttling)
Expected: Chunk size adapts dynamically
```

**C. Browser Refresh During Upload**
```
Start upload
Refresh browser mid-upload
Expected: Upload paused, can resume with sessionId
```

**D. Duplicate Chunk Upload**
```
Upload chunk 5
Upload chunk 5 again
Expected: Server detects duplicate, responds "already_uploaded"
```

---

## Automated Test Script

### Frontend Test (Cypress/Playwright)

```typescript
// tests/chunked-upload.spec.ts
describe('Chunked Upload', () => {
  it('should upload 50MB file successfully', async () => {
    // Prepare test file
    const file = generateTestFile(50 * 1024 * 1024);
    
    // Start upload
    const result = await chunkedUploadService.uploadFile(
      file,
      'project-1',
      undefined,
      (progress) => {
        expect(progress.percentComplete).toBeGreaterThan(0);
        expect(progress.percentComplete).toBeLessThanOrEqual(100);
      }
    );
    
    // Verify result
    expect(result.file_size).toBe(50 * 1024 * 1024);
    expect(result.status).toBe('completed');
  });
  
  it('should resume after network interruption', async () => {
    const file = generateTestFile(100 * 1024 * 1024);
    
    // Mock network failure after 30%
    let uploadedChunks = 0;
    const mockUploadChunk = jest.spyOn(chunkedUploadService as any, 'uploadChunk');
    mockUploadChunk.mockImplementation(async (sessionId, chunk) => {
      uploadedChunks++;
      if (uploadedChunks === 15) {
        throw new Error('Network error');
      }
      return originalUploadChunk(sessionId, chunk);
    });
    
    // Should retry and complete
    const result = await chunkedUploadService.uploadFile(file, 'project-1');
    expect(result.status).toBe('completed');
  });
});
```

### Backend Test (pytest)

```python
# tests/test_chunked_upload.py
def test_chunk_upload_flow(client, test_user):
    """Test complete chunked upload flow"""
    
    # Initialize session
    response = client.post('/v2/upload/chunked/init', json={
        'filename': 'test.jpg',
        'fileSize': 10485760,  # 10 MB
        'mimeType': 'image/jpeg',
        'projectId': 1,
        'totalChunks': 5
    }, headers={'Authorization': f'Bearer {test_user.token}'})
    
    assert response.status_code == 200
    session_id = response.json()['sessionId']
    
    # Upload chunks
    for i in range(5):
        chunk_data = b'x' * 2097152  # 2 MB
        response = client.put(
            f'/v2/upload/chunked/{session_id}/{i}',
            files={'chunk': chunk_data},
            data={'index': str(i)},
            headers={'Authorization': f'Bearer {test_user.token}'}
        )
        assert response.status_code == 200
    
    # Finalize
    response = client.post(
        f'/v2/upload/chunked/{session_id}/finalize',
        headers={'Authorization': f'Bearer {test_user.token}'}
    )
    
    assert response.status_code == 200
    photo = response.json()
    assert photo['file_size'] == 10485760
    assert photo['status'] == 'completed'
```

---

## Hybrid Mode Tests

### Test 11: Mixed File Sizes (Hybrid Mode)

**Objective:** Verify automatic switching between standard and chunked upload

**Steps:**
1. Prepare test files:
   - 10 files @ 3-8 MB each (should use standard upload)
   - 10 files @ 15-50 MB each (should use chunked upload)
2. Upload all 20 files at once
3. Monitor console logs

**Expected Results:**
- ✅ Log shows split decision: "Standard upload: 10 files" + "Chunked upload: 10 files"
- ✅ Small files use batch presigned URL (1 API call for all 10 files)
- ✅ Large files use chunked upload (init → chunks → finalize per file)
- ✅ No presigned URLs fetched for large files (≥10MB)
- ✅ All 20 files complete successfully
- ✅ Upload queue shows both methods working in parallel

**Console Output Example:**
```
[UploadQueueManager] 🚀 Starting batch processing for 20 files
[UploadQueueManager] 📊 Split 20 files:
  📤 Standard upload: 10 files (<10MB)
  🔀 Chunked upload: 10 files (≥10MB)

[UploadQueueManager] 📤 Processing 10 standard uploads
  📤 file1.jpg → Standard (5.2MB)
  📤 file2.jpg → Standard (7.8MB)
  ...
[UploadQueueManager] 🔑 Fetching presigned URLs for 10 files (1 API call)
[UploadService] Upload progress: 100.00%
...

[UploadQueueManager] 🔀 Processing 10 chunked uploads
  🔀 file11.jpg → Chunked (15.3MB)
  🔀 file12.jpg → Chunked (28.7MB)
  ...
[ChunkedUpload] File split into 8 chunks
[ChunkedUpload] Uploading chunk 1/8
...
[UploadQueueManager] ✅ All batches processed
```

**Validation:**
```javascript
// Check network tab in DevTools
// Standard files:
// - 1 POST to /v2/upload/batch/presigned
// - 10 PUT to /v2/upload/{token}
//
// Chunked files:
// - 10 POST to /v2/upload/chunked/init
// - N PUT to /v2/upload/chunked/{sessionId}/{chunk}
// - 10 POST to /v2/upload/chunked/{sessionId}/finalize
//
// IMPORTANT: No presigned URLs requested for files ≥10MB
```

---

### Test 12: Threshold Configuration

**Objective:** Verify threshold can be adjusted dynamically

**Steps:**
1. Set threshold to 5MB in dev config:
   ```typescript
   // config/image-optimization.dev.ts
   chunkedUpload: {
     useHybridMode: true,
     fileSizeThresholdMB: 5,  // Lower threshold
   }
   ```
2. Upload an 8MB file
3. Verify uses chunked upload
4. Change threshold to 20MB:
   ```typescript
   fileSizeThresholdMB: 20,  // Higher threshold
   ```
5. Reload page
6. Upload same 8MB file
7. Verify uses standard upload

**Expected Results:**
- ✅ Threshold at 5MB → 8MB file uses chunked upload
- ✅ Threshold at 20MB → 8MB file uses standard upload
- ✅ Both uploads complete successfully
- ✅ Console logs show correct decision based on threshold
- ✅ Configuration change takes effect after reload

**Console Monitoring:**
```
// With threshold = 5MB
  🔀 file.jpg → Chunked (8.0MB)

// With threshold = 20MB
  📤 file.jpg → Standard (8.0MB)
```

---

### Test 13: Disable Hybrid Mode

**Objective:** Verify system works when hybrid mode is disabled

**Steps:**
1. Disable hybrid mode in config:
   ```typescript
   chunkedUpload: {
     enabled: true,
     useHybridMode: false,  // Disable auto-switching
   }
   ```
2. Upload a 50MB file
3. Verify uses standard upload (not chunked)

**Expected Results:**
- ✅ Large file (50MB) uses standard presigned URL upload
- ✅ No chunked upload flow triggered
- ✅ Upload completes successfully
- ✅ System falls back to traditional batch upload

**Note:** With hybrid mode disabled, only file size matters:
- Chunked upload only used if `chunkedUpload.enabled = true` AND file meets internal criteria
- Hybrid mode provides explicit control via threshold

---

### Test 14: Edge Case - Exactly Threshold Size

**Objective:** Verify behavior at exact threshold boundary

**Steps:**
1. Set threshold to 10MB
2. Upload files at exactly 10MB (10,485,760 bytes)
3. Monitor which upload method is used

**Expected Results:**
- ✅ File at exactly 10MB uses chunked upload (≥ threshold)
- ✅ File at 10MB - 1 byte uses standard upload (< threshold)
- ✅ Decision is consistent and deterministic
- ✅ No edge case errors

**Validation:**
```javascript
// 10MB exactly
const file1 = new File([new Uint8Array(10485760)], 'exactly10mb.jpg');
// Expected: Chunked upload (file.size >= threshold)

// Just under 10MB
const file2 = new File([new Uint8Array(10485759)], 'under10mb.jpg');
// Expected: Standard upload (file.size < threshold)
```

---

### Test 15: Hybrid Mode with 101 Files (Real-World Scenario)

**Objective:** Test the exact scenario from user bug report

**Steps:**
1. Prepare 101 mixed files:
   - 50 files @ 3-9 MB each
   - 51 files @ 12-40 MB each
2. Select all 101 files in upload dialog
3. Click upload
4. Monitor console logs and network tab

**Expected Results:**
- ✅ Clear split logged: "Standard: 50, Chunked: 51"
- ✅ 1 batch presigned URL call for 50 standard files
- ✅ 51 chunked upload flows (init → chunks → finalize)
- ✅ No presigned URLs wasted on large files
- ✅ Both methods complete successfully
- ✅ Progress tracking works for both types
- ✅ All 101 photos appear in gallery

**Performance Targets:**
- Total API calls: ~1 (batch presigned) + ~51×3 (chunked init/finalize) + chunk uploads
- Time savings: ~50% compared to old approach (no wasted presigned URLs)

**Network Tab Verification:**
```
POST /v2/upload/batch/presigned (1 call)
  → Response: 50 presigned URLs

PUT /v2/upload/{token} × 50
  → Standard uploads complete

POST /v2/upload/chunked/init × 51
PUT /v2/upload/chunked/{sessionId}/{chunk} × (51 × N)
POST /v2/upload/chunked/{sessionId}/finalize × 51
  → Chunked uploads complete
```

---

## Performance Benchmarks

### Metrics to Collect

1. **Upload Duration**
   - By file size
   - By network type
   - With/without retries

2. **Chunk Statistics**
   - Average chunk size
   - Total chunks per file
   - Retry count per chunk

3. **Network Efficiency**
   - Bytes transferred vs file size
   - Retry overhead percentage
   - Parallel upload utilization

### Benchmark Script

```javascript
// benchmarks/chunked-upload-benchmark.js
async function benchmarkUpload(fileSize, networkType) {
  const file = generateTestFile(fileSize);
  const startTime = performance.now();
  
  const result = await chunkedUploadService.uploadFile(file, 'project-1');
  
  const endTime = performance.now();
  const duration = (endTime - startTime) / 1000; // seconds
  
  return {
    fileSize,
    networkType,
    duration,
    throughput: fileSize / duration / 1024 / 1024, // MB/s
  };
}

// Run benchmarks
const results = await Promise.all([
  benchmarkUpload(10 * 1024 * 1024, '2g'),
  benchmarkUpload(50 * 1024 * 1024, '3g'),
  benchmarkUpload(100 * 1024 * 1024, '4g'),
]);

console.table(results);
```

---

## Troubleshooting Guide

### Issue: "Session not found"
**Cause:** Session expired or invalid ID
**Solution:** Restart upload, check session expiration

### Issue: "Chunk hash mismatch"
**Cause:** Data corruption during transmission
**Solution:** Automatic retry handles this

### Issue: "Max retries exceeded"
**Cause:** Network too unstable
**Solution:** 
- Check network connection
- Reduce chunk size in config
- Increase retry limit

### Issue: Upload stuck at 99%
**Cause:** Last chunk failing repeatedly
**Solution:**
- Check server logs
- Verify temp directory writable
- Check disk space

### Issue: Assembled file corrupted
**Cause:** Chunks uploaded out of order
**Solution:**
- Verify chunk ordering in assembly
- Check chunk index tracking

---

## Success Criteria

Phase 1 is successful if ALL tests pass:

**Core Chunked Upload Tests:**
- ✅ Test 1: Happy path upload
- ✅ Test 2: Network interruption resume
- ✅ Test 3: Retry with backoff
- ✅ Test 4: Parallel uploads
- ✅ Test 5: Adaptive chunk sizing
- ✅ Test 6: Hash verification
- ✅ Test 7: Session expiration
- ✅ Test 8: Large file upload
- ✅ Test 9: Concurrent uploads
- ✅ Test 10: Edge cases

**Hybrid Mode Tests:**
- ✅ Test 11: Mixed file sizes (automatic method selection)
- ✅ Test 12: Threshold configuration
- ✅ Test 13: Disable hybrid mode
- ✅ Test 14: Exact threshold boundary
- ✅ Test 15: Real-world 101 file scenario

**Performance:** 
- 100MB file uploads in <15 min on 2G
- Retry overhead <10%
- Hybrid mode reduces API calls by ~50% for mixed uploads

**Reliability:**
- 95%+ success rate including retries
- No wasted presigned URLs for large files

---

## Next Steps

After Phase 1 validation:
1. Document any issues found
2. Fix bugs if needed
3. Proceed to Phase 2: Client-side compression
