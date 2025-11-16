# Phase 1: Chunked Upload with Retry Logic

## Overview

Phase 1 implements resilient file uploads by splitting large files into chunks. This enables:
- **Reliable uploads** on unstable networks (2G, 3G, rural areas)
- **Resume capability** after network interruptions
- **Adaptive chunk sizing** based on network speed
- **Parallel uploads** for faster transfer on good networks
- **Retry with exponential backoff** for failed chunks

---

## Implementation Status

✅ **Frontend:** `services/chunkedUploadService.ts`
✅ **Backend Service:** `app/services/chunked_upload_service.py`
✅ **Backend Router:** `app/routers/chunked_upload.py`
✅ **Configuration:** `config/image-optimization.config.ts`

---

## Architecture

### Upload Flow

```
[User selects file]
        ↓
[Calculate chunk size based on network]
        ↓
[Split file into chunks]
        ↓
[Initialize session on server] ← Creates temp directory
        ↓
[Upload chunks in parallel batches]
        ├─ Chunk 1 → [Retry with backoff if fails]
        ├─ Chunk 2 → [Retry with backoff if fails]
        └─ Chunk N → [Retry with backoff if fails]
        ↓
[Finalize: Assemble chunks on server]
        ↓
[Create Photo record]
        ↓
[Cleanup temp files]
```

### Network-Adaptive Chunk Sizing

| Network Type | Chunk Size | Parallel | Timeout |
|--------------|-----------|----------|---------|
| slow-2g      | 0.5 MB    | 1        | 120s    |
| 2g           | 1 MB      | 1        | 90s     |
| 3g           | 2 MB      | 2        | 60s     |
| 4g           | 5 MB      | 3        | 30s     |
| wifi         | 5 MB      | 5        | 30s     |

### Retry Strategy

- **Max retries:** 5 attempts per chunk
- **Backoff:** Exponential (1s → 2s → 4s → 8s → 16s)
- **Hash verification:** SHA-256 per chunk
- **Resume:** Continue from last uploaded chunk

---

## Hybrid Mode (Auto-Switching)

Phase 1 intelligently chooses between standard and chunked upload based on file size.

### Upload Method Selection

| File Size | Upload Method | Reason |
|-----------|---------------|--------|
| < 10MB | **Standard Upload** | Efficient batch presigned URLs, low API overhead |
| ≥ 10MB | **Chunked Upload** | Resilient, resumable, retry per chunk |

### How It Works

When uploading multiple files, the system automatically:
1. **Splits files by size** BEFORE fetching presigned URLs
2. **Standard files** → Get batch presigned URLs (1 API call for 50 files)
3. **Large files** → Use chunked upload (init → chunks → finalize)

### Benefits

✅ **No wasted API calls** - Only fetch presigned URLs for files that need them  
✅ **Best of both worlds** - Fast batch upload for small files + resilient chunked upload for large files  
✅ **Automatic** - No code changes in upload UI, works transparently  
✅ **Configurable** - Easy to adjust threshold based on your needs  

### Example: 101 File Upload

**Scenario:** User uploads 101 files
- 50 files @ 3-8 MB each (small)
- 51 files @ 15-50 MB each (large)

**Automatic Flow:**
```
[UploadQueueManager] 📊 Split 101 files:
  📤 Standard upload: 50 files (<10MB)
  🔀 Chunked upload: 51 files (≥10MB)

STANDARD FILES (50):
→ POST /v2/upload/batch/presigned (1 call for 50 files)
→ PUT /v2/upload/{token} × 50 files

CHUNKED FILES (51):
→ POST /v2/upload/chunked/init × 51
→ PUT /v2/upload/chunked/{sessionId}/{chunk} × (51 × N chunks)
→ POST /v2/upload/chunked/{sessionId}/finalize × 51
```

**Result:**
- ✅ No wasted presigned URLs for large files
- ✅ Efficient batch upload for small files
- ✅ Resilient chunked upload for large files
- ✅ Total bandwidth savings from using both methods optimally

---

## Configuration

### Enable/Disable

```typescript
// config/image-optimization.config.ts
features: {
  chunkedUpload: true  // Enable chunked upload
}

chunkedUpload: {
  enabled: true,
  
  // Hybrid mode - auto-switching
  useHybridMode: true,          // Enable auto-switching based on file size
  fileSizeThresholdMB: 10,      // Files ≥10MB use chunked upload
  
  defaultChunkSizeMB: 2,
  maxRetries: 5,
  exponentialBackoff: true,
  // ... more settings
}
```

### Key Settings

**Hybrid Mode:**
- `useHybridMode`: true (automatically choose upload method based on file size)
- `fileSizeThresholdMB`: 10 MB (files ≥10MB use chunked upload)

**Chunking:**
- `defaultChunkSizeMB`: 2 MB (default chunk size)
- `minChunkSizeMB`: 0.5 MB (minimum)
- `maxChunkSizeMB`: 5 MB (maximum)
- `adaptiveChunking`: true (adjust based on network)

**Reliability:**
- `maxRetries`: 5 (retry attempts per chunk)
- `retryDelayMs`: 1000 (base delay, 1 second)
- `exponentialBackoff`: true
- `parallelChunks`: 3 (concurrent uploads)

---

## API Endpoints

### 1. Initialize Upload

**POST** `/v2/upload/chunked/init`

**Request:**
```json
{
  "filename": "wedding_photo.jpg",
  "fileSize": 104857600,
  "mimeType": "image/jpeg",
  "projectId": 1,
  "folderId": "uuid-optional",
  "totalChunks": 50
}
```

**Response:**
```json
{
  "sessionId": "550e8400-e29b-41d4-a716-446655440000",
  "photoId": 0,
  "totalChunks": 50
}
```

### 2. Upload Chunk

**PUT** `/v2/upload/chunked/{sessionId}/{chunkIndex}`

**Form Data:**
- `chunk`: File (chunk blob)
- `index`: String (chunk index for verification)
- `hash`: String (SHA-256 hash, optional)

**Response:**
```json
{
  "sessionId": "550e8400-e29b-41d4-a716-446655440000",
  "chunkIndex": 0,
  "status": "received",
  "uploadedChunks": 1,
  "totalChunks": 50
}
```

### 3. Finalize Upload

**POST** `/v2/upload/chunked/{sessionId}/finalize`

**Response:** PhotoResponse (complete photo object)

### 4. Get Status

**GET** `/v2/upload/chunked/{sessionId}/status`

**Response:**
```json
{
  "sessionId": "550e8400-e29b-41d4-a716-446655440000",
  "filename": "wedding_photo.jpg",
  "fileSize": 104857600,
  "totalChunks": 50,
  "uploadedChunks": 25,
  "status": "uploading",
  "createdAt": "2025-11-16T10:00:00",
  "expiresAt": "2025-11-17T10:00:00"
}
```

---

## Usage Example

### Frontend

```typescript
import { chunkedUploadService } from './services/chunkedUploadService';

// Check if enabled
if (chunkedUploadService.isEnabled()) {
  // Upload file with progress tracking
  const photo = await chunkedUploadService.uploadFile(
    file,
    projectId,
    folderId,
    (progress) => {
      console.log(`Upload: ${progress.percentComplete.toFixed(1)}%`);
      console.log(`Uploaded: ${progress.uploadedChunks}/${progress.totalChunks} chunks`);
      console.log(`ETA: ${progress.estimatedTimeRemaining}ms`);
    }
  );
  
  console.log('Upload complete:', photo);
}
```

### Resume Failed Upload

```typescript
// Get session ID from failed upload
const sessionId = '550e8400-e29b-41d4-a716-446655440000';

// Resume
const photo = await chunkedUploadService.resumeUpload(sessionId);
```

### Cancel Upload

```typescript
chunkedUploadService.cancelUpload(sessionId);
```

---

## Testing Guide

See [TESTING.md](./TESTING.md) for comprehensive testing procedures.

---

## Performance Metrics

### Target Performance

| Network | File Size | Expected Time |
|---------|-----------|---------------|
| 2G      | 10 MB     | ~5 minutes    |
| 2G      | 100 MB    | ~15 minutes   |
| 3G      | 10 MB     | ~45 seconds   |
| 3G      | 100 MB    | ~7 minutes    |
| 4G      | 10 MB     | ~15 seconds   |
| 4G      | 100 MB    | ~2 minutes    |

### Retry Overhead

- **Target:** < 5% of total upload time
- **Measured:** Actual overhead depends on network stability

---

## Troubleshooting

### Common Issues

**1. "Session not found"**
- Session expired (24 hour TTL)
- Solution: Restart upload

**2. "Chunk hash mismatch"**
- Data corrupted during transmission
- Solution: Retry logic handles automatically

**3. "Max retries exceeded"**
- Network too unstable
- Solution: Check network connection, reduce chunk size

**4. "Assembled file size mismatch"**
- Missing or corrupted chunks
- Solution: Check all chunks uploaded successfully

### Debug Mode

```typescript
// Enable verbose logging
imageOptimizationConfig.debug.enableVerboseLogging = true;

// Check upload progress
__chunkedUploadService.getProgress(sessionId);

// Cancel problematic upload
__chunkedUploadService.cancelUpload(sessionId);
```

---

## Monitoring

### Key Metrics to Track

1. **Upload Success Rate:** % of uploads completing successfully
2. **Average Retry Count:** Per chunk
3. **Upload Duration:** Time to complete by file size/network
4. **Chunk Size Distribution:** Actual chunk sizes used
5. **Network Detection Accuracy:** Correct network type detection

### Access Metrics

```javascript
// Browser console
__chunkedUploadService.getProgress(sessionId);
```

---

## Next Steps

After validating Phase 1:
- **Phase 2:** Client-side compression (reduce chunk count)
- **Phase 3:** OPFS caching (cache uploaded chunks)
- **Phase 4:** Network adaptation (dynamic chunk sizing)
- **Phase 5:** Offline queue (upload when back online)

---

## References

- **Configuration:** `config/image-optimization.config.ts`
- **Frontend Service:** `services/chunkedUploadService.ts`
- **Backend Service:** `app/services/chunked_upload_service.py`
- **Backend Router:** `app/routers/chunked_upload.py`
- **Testing Documentation:** [TESTING.md](./TESTING.md)
- **Validation Checklist:** [VALIDATION.md](./VALIDATION.md)
