# Quick Start: Testing the 5-Layer Optimization System

## ✅ What's Ready to Test Right Now

**Phase 0:** Configuration System ✅ COMPLETE
**Phase 1:** Chunked Upload ✅ COMPLETE

You can test chunked uploads immediately!

---

## 🚀 Step-by-Step Testing Guide

### Step 1: Start the Backend

```bash
cd /Users/ns632@apac.comcast.com/Documents/v0_photo_proof/photo_proof_api
python3 main.py
```

**Expected Output:**
```
INFO:     Started server process
INFO:     Waiting for application startup.
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:8000
```

### Step 2: Start the Frontend

```bash
cd /Users/ns632@apac.comcast.com/Documents/v0_photo_proof/Photo_Proof_v1
npm run dev
```

**Expected Output:**
```
  VITE v4.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: http://192.168.x.x:5173/
```

### Step 3: Open Browser DevTools

1. Open browser (Chrome/Edge recommended)
2. Go to `http://localhost:5173`
3. Press F12 to open DevTools
4. Go to Console tab

### Step 4: Check Configuration

In the Console, run:
```javascript
// Check if chunked upload is enabled
__imageOptimizationConfig.features.chunkedUpload
// Should return: true (in dev environment)

// View full configuration
__imageOptimizationConfig.get()

// Check chunk upload service
__chunkedUploadService
```

**Expected Results:**
```javascript
{
  chunkedUpload: true,
  clientSideCompression: true,
  serverSideVariants: true,
  // ... more features
}
```

### Step 5: Test Basic Upload (Happy Path)

1. Navigate to the upload page in your app
2. Select a file (try a 50MB image)
3. Click Upload
4. Watch the Console for logs

**Expected Console Output:**
```
[ChunkedUpload] Starting chunked upload: { filename: "test.jpg", size: 52428800, projectId: 1 }
[ChunkedUpload] File split into 25 chunks of 2097152 bytes
[ChunkedUpload] Uploading chunk 1/25 (attempt 1)
[ChunkedUpload] Chunk 1 uploaded successfully
...
[ChunkedUpload] Upload completed successfully: { id: 123, ... }
```

### Step 6: Test Network Resilience

**Test A: Network Throttling**
1. Open DevTools → Network tab
2. Select "Slow 3G" from throttling dropdown
3. Upload a file
4. Observe:
   - Smaller chunks used (1MB instead of 2MB)
   - Longer upload time
   - Retry attempts if connection drops
   - Upload completes successfully

**Test B: Network Interruption**
1. Start uploading a 100MB file
2. After 30% progress, click "Offline" in Network tab
3. Wait 10 seconds
4. Click "Offline" again to restore connection
5. Observe:
   - Upload pauses when offline
   - Upload resumes when online
   - No data loss
   - Upload completes

### Step 7: Monitor Upload Progress

In Console:
```javascript
// Get progress for a session
const progress = __chunkedUploadService.getProgress(sessionId);
console.log(progress);
```

**Expected Output:**
```javascript
{
  sessionId: "550e8400-e29b-41d4-a716-446655440000",
  totalChunks: 50,
  uploadedChunks: 25,
  failedChunks: 0,
  currentChunk: 25,
  bytesUploaded: 52428800,
  totalBytes: 104857600,
  percentComplete: 50,
  estimatedTimeRemaining: 60000
}
```

---

## 🧪 Test Cases

### Test 1: Small File (Happy Path)
- **File:** 5MB image
- **Expected:** Single or few chunks, fast upload
- **Pass:** Upload completes, photo appears in gallery

### Test 2: Large File
- **File:** 100MB image
- **Expected:** Multiple chunks (50+), progress tracking
- **Pass:** Upload completes in reasonable time

### Test 3: Network Interruption
- **Setup:** Start upload, go offline mid-upload, restore
- **Expected:** Upload pauses and resumes
- **Pass:** Upload completes without data loss

### Test 4: Retry Logic
- **Setup:** Use "Slow 3G" throttling
- **Expected:** Some chunks retry due to timeout/failure
- **Pass:** Console shows retry attempts, upload completes

### Test 5: Multiple Concurrent Uploads
- **Setup:** Upload 3 files simultaneously in different tabs
- **Expected:** All progress independently
- **Pass:** All 3 uploads complete successfully

---

## 📊 Performance Benchmarks

### Expected Upload Times

| Network | File Size | Expected Time | Test Result |
|---------|-----------|---------------|-------------|
| 2G (250 Kbps) | 10 MB | ~5 min | ____________ |
| 2G (250 Kbps) | 100 MB | ~15 min | ____________ |
| 3G (750 Kbps) | 10 MB | ~45 sec | ____________ |
| 3G (750 Kbps) | 100 MB | ~7 min | ____________ |
| 4G (10 Mbps) | 10 MB | ~15 sec | ____________ |
| 4G (10 Mbps) | 100 MB | ~2 min | ____________ |

**Fill in "Test Result" column with your actual measurements!**

### Benchmark Script

```javascript
// Run this in Console to measure upload time
const file = /* select your test file */;
const startTime = performance.now();

await chunkedUploadService.uploadFile(file, projectId, folderId, (progress) => {
  console.log(`Progress: ${progress.percentComplete.toFixed(1)}%`);
});

const endTime = performance.now();
const duration = (endTime - startTime) / 1000; // seconds
const throughput = file.size / duration / 1024 / 1024; // MB/s

console.log({
  fileSize: file.size,
  duration: duration.toFixed(1) + 's',
  throughput: throughput.toFixed(2) + ' MB/s'
});
```

---

## 🔍 Debugging

### Enable Verbose Logging

```javascript
// In Console
imageOptimizationConfig.debug.enableVerboseLogging = true;
```

### Check Backend Logs

Backend terminal will show:
```
[ChunkedUpload] Session initialized: 550e8400-...
[ChunkedUpload] Chunk 0 received (2097152 bytes)
[ChunkedUpload] Progress: 1/50
...
[ChunkedUpload] Finalizing upload: 550e8400-...
[ChunkedUpload] File assembled successfully
[ChunkedUpload] Upload finalized, photo ID: 123
```

### Common Issues

**Issue: "Chunked upload is not enabled"**
```javascript
// Check config
__imageOptimizationConfig.features.chunkedUpload
// If false, edit config/image-optimization.dev.ts
```

**Issue: "Session not found"**
- Backend might have restarted
- Session might have expired (24h TTL)
- Solution: Restart upload

**Issue: "Failed to fetch"**
- Check backend is running on port 8000
- Check CORS settings
- Verify authentication token

**Issue: Upload stuck at 99%**
- Check backend logs for errors
- Verify disk space available
- Check temp directory permissions

---

## ✅ Success Criteria

Phase 1 testing is successful if:

- ✅ Upload completes successfully (happy path)
- ✅ Progress tracking shows accurate percentage
- ✅ Network interruption doesn't lose data
- ✅ Retry logic handles transient failures
- ✅ Large files (100MB+) upload successfully
- ✅ Multiple concurrent uploads work
- ✅ Performance targets met (see table above)

---

## 📝 Report Results

### Testing Checklist

Copy this checklist and fill it out:

```
Phase 1: Chunked Upload Testing Results
Date: ___________
Tester: ___________

Environment:
- [ ] Backend running on port 8000
- [ ] Frontend running on port 5173
- [ ] Browser: ___________
- [ ] Network: ___________

Test 1: Small File Upload (5MB)
- [ ] PASS / FAIL
- Duration: ___________
- Notes: ___________

Test 2: Large File Upload (100MB)
- [ ] PASS / FAIL
- Duration: ___________
- Chunks: ___________
- Retries: ___________
- Notes: ___________

Test 3: Network Interruption
- [ ] PASS / FAIL
- Upload resumed: YES / NO
- Data loss: YES / NO
- Notes: ___________

Test 4: Retry Logic
- [ ] PASS / FAIL
- Retries observed: ___________
- Max retries reached: YES / NO
- Notes: ___________

Test 5: Concurrent Uploads
- [ ] PASS / FAIL
- Files tested: ___________
- All completed: YES / NO
- Notes: ___________

Performance:
- 100MB on current network: ___________
- Throughput: ___________ MB/s
- Meets target: YES / NO

Issues Found:
1. ___________
2. ___________
3. ___________

Overall Result: PASS / FAIL
```

---

## 🎯 Next Steps After Testing

### If All Tests Pass ✅
1. Document your results
2. Note any performance insights
3. Proceed to Phase 2 implementation
4. Follow `IMPLEMENTATION_ROADMAP_ALL_PHASES.md`

### If Tests Fail ❌
1. Note which tests failed
2. Check backend/frontend logs
3. Review error messages
4. Check configuration
5. Verify network conditions
6. Report issues with details

---

## 📚 Additional Resources

### Documentation
- **Testing Guide:** `docs/optimization/phase-1/TESTING.md`
- **Implementation Roadmap:** `IMPLEMENTATION_ROADMAP_ALL_PHASES.md`
- **Config Guide:** `config/README_IMAGE_OPTIMIZATION.md`
- **Summary:** `OPTIMIZATION_IMPLEMENTATION_SUMMARY.md`

### Configuration Files
- **Main Config:** `config/image-optimization.config.ts`
- **Dev Config:** `config/image-optimization.dev.ts`
- **Prod Config:** `config/image-optimization.prod.ts`

### Implementation Files
- **Frontend Service:** `services/chunkedUploadService.ts`
- **Backend Service:** `app/services/chunked_upload_service.py`
- **Backend Router:** `app/routers/chunked_upload.py`

---

## 💡 Pro Tips

1. **Use Network Tab:** Visualize chunk requests in real-time
2. **Monitor Console:** Watch for retry attempts and timing
3. **Test Edge Cases:** Try canceling, refreshing, going offline
4. **Benchmark Different Networks:** 2G, 3G, 4G comparisons
5. **Document Findings:** Notes help improve the system

---

## 🎉 You're Ready!

Everything is set up and ready to test. Start with Test 1 (Small File) and work your way through the test cases.

**Happy Testing! 🚀**

---

**Questions?** Check the documentation in `docs/optimization/` or review the implementation files.

**Issues?** Document them clearly with:
- What you were doing
- What you expected
- What actually happened
- Console logs
- Network conditions
