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

**Performance:** 
- 100MB file uploads in <15 min on 2G
- Retry overhead <10%

**Reliability:**
- 95%+ success rate including retries

---

## Next Steps

After Phase 1 validation:
1. Document any issues found
2. Fix bugs if needed
3. Proceed to Phase 2: Client-side compression
