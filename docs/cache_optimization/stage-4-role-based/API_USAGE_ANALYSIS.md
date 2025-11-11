# Stage 4: API Usage Analysis

## Current API Architecture

### Backend Structure

```
photo_proof_api/
├── app/api/v1/          # V1 APIs (Legacy)
│   ├── projects.py      # ✅ USED BY FRONTEND
│   ├── health.py        # ✅ USED BY FRONTEND
│   └── [other v1 APIs]  # ❌ NOT USED
│
└── app/routers/         # V2 APIs (Modern)
    ├── photos.py        # ✅ USED BY FRONTEND
    ├── upload.py        # ✅ USED BY FRONTEND
    ├── auth.py          # ✅ USED BY FRONTEND
    ├── clients.py       # ✅ USED BY FRONTEND
    └── [other v2 APIs]  # Various usage
```

---

## Frontend API Usage Mapping

### Critical APIs (High Traffic)

#### 1. **Projects API** (V1) - `/api/projects`
**Service:** `services/projectService.ts`

| Endpoint | Method | Purpose | Frequency | Current Size |
|----------|--------|---------|-----------|--------------|
| `/api/projects` | GET | List all projects | Every dashboard load | ~5MB for 100 projects |
| `/api/projects/{id}` | GET | Get single project | Per project view | ~50KB |
| `/api/projects` | POST | Create project | Occasional | N/A |
| `/api/projects/{id}` | PATCH | Update project | Occasional | N/A |
| `/api/projects/{id}` | DELETE | Delete project | Rare | N/A |
| `/api/projects/{id}/folders` | GET | Get folders | Per project view | Variable |
| `/api/projects/{id}/folders` | POST | Create folder | Occasional | N/A |
| `/api/projects/{id}/stats` | GET | Get stats | Per project view | Small |

**Problem:** `/api/projects` (GET) returns ALL data always:
- All project metadata
- All folder information
- Complete photo counts
- **50-100KB per project** × 100 projects = **5-10MB**

**Solution:** Add `?mode=list` parameter:
- `mode=list`: Lightweight metadata only (1KB per project)
- `mode=full`: Complete data with folders (50KB per project)

**Impact:**
- Studio dashboard: 5MB → 100KB (98% reduction)
- With compression: 100KB → 80KB (20% additional)

---

#### 2. **Photos API** (V2) - `/v2/photos`
**Service:** `services/photoService.ts`

| Endpoint | Method | Purpose | Frequency | Current Size |
|----------|--------|---------|-----------|--------------|
| `/v2/photos/projects/{id}/photos` | GET | List project photos | Per gallery view | ~2-5MB |
| `/v2/photos/{id}` | GET | Get single photo | Rare | ~10KB |
| `/v2/photos/{id}` | PATCH | Update photo | Occasional | N/A |
| `/v2/photos/{id}` | DELETE | Delete photo | Occasional | N/A |
| `/v2/photos/{id}/favorite` | POST | Toggle favorite | Frequent | Small |
| `/v2/photos/{id}/select` | POST | Toggle selection | Frequent | Small |
| `/v2/photos/upload` | POST | Upload photo | Frequent | N/A |

**Status:** Already optimized in V2. Uses folder filtering.

**Future Enhancement:** Add `?metadata_only=true` for lightweight listing.

---

#### 3. **Upload API** (V2) - `/v2/upload`
**Service:** `services/uploadService.ts`

| Endpoint | Method | Purpose | Frequency |
|----------|--------|---------|-----------|
| `/v2/upload/initiate` | POST | Start upload session | Per upload batch |
| `/v2/upload/stream/{...}` | PUT | Stream file chunks | Per file |
| `/v2/upload/complete` | PUT | Complete upload | Per upload batch |

**Status:** Already optimized for chunked uploads.

---

#### 4. **Auth API** (V2) - `/api/auth`
**Service:** `services/authService.ts`

| Endpoint | Method | Purpose | Frequency |
|----------|--------|---------|-----------|
| `/api/auth/login` | POST | User login | Per session |
| `/api/auth/refresh` | POST | Refresh token | Periodic |
| `/api/auth/onboard` | POST | New studio signup | Rare |

**Status:** Low traffic, already optimized with httpOnly cookies.

---

### Unused APIs (Can Remove)

The following V1 APIs are **NOT called by frontend** and can be removed:

❌ `/api/v1/analytics` - Not used  
❌ `/api/v1/invoices` - Using V2  
❌ `/api/v1/notifications` - Not implemented  
❌ `/api/v1/workflows` - Not implemented  
❌ `/api/v1/deliveries` - Not implemented  
❌ `/api/v1/ui-customization` - Not implemented  
❌ `/api/v1/layouts` - Using simpler layout  
❌ `/api/users` (V1) - Not needed  
❌ `/api/studios` (V1) - Auth handles this  
❌ `/api/clients` (V1) - Using V2  
❌ `/api/settings` (V1) - Not implemented  
❌ `/api/batch-actions` (V1) - Not implemented  

**Action:** Clean up during Stage 4 implementation.

---

## Data Flow Analysis

### Current Flow (Stages 1-3)

```
Component
    ↓
Store (Zustand)
    ↓
Memory Cache (Stage 2)
    ↓ (miss)
IndexedDB Cache (Stage 3)
    ↓ (miss)
Service (projectService)
    ↓
API Client (lib/api-client.ts)
    ↓
Backend (/api/projects)
    ↓
Database (SQLite)
```

**Problem:** Backend always returns full data (5MB for 100 projects)

---

### Target Flow (Stage 4)

```
Component
    ↓
Store (Zustand)
    ↓
[Detect User Role] → client vs studio
    ↓
Memory Cache (with role-based strategy)
    ↓ (miss)
IndexedDB Cache (with role-based strategy)
    ↓ (miss)
Service (projectService with mode parameter)
    ↓
API Client (lib/api-client.ts)
    ↓
Backend (/api/projects?mode=list)  ← NEW
    ↓
Database (SQLite - selective fields)
    ↓
Compression Middleware (gzip)  ← NEW
    ↓
Frontend (100KB instead of 5MB)
```

**Benefits:**
- 98% size reduction (mode=list)
- 20% additional from compression
- Faster page loads
- Lower bandwidth costs

---

## API Response Size Analysis

### Current Responses

**GET /api/projects (100 projects):**
```json
{
  "projects": [
    {
      "id": "uuid-1",
      "title": "Wedding - Smith",
      "studio_id": "studio-1",
      "client_id": "client-1",
      "cover_photo_src": "/uploads/...",
      "photo_count": 150,
      "status": "active",
      "has_folders": true,
      "is_locked": false,
      "payment_status": "paid",
      "price": 2500,
      "package_id": "pkg-1",
      "shoot_date": "2025-10-15",
      "created_at": "2025-10-01T10:00:00",
      "updated_at": "2025-10-20T15:30:00",
      // ... 20+ more fields
      "folders": [/* folder data */],  // ← NOT NEEDED FOR LIST
      "client": {/* client data */}    // ← NOT NEEDED FOR LIST
    },
    // ... × 100 projects
  ],
  "total": 100
}
```

**Size:** ~50KB per project × 100 = **5MB**

---

### Target Responses (Stage 4)

**GET /api/projects?mode=list (100 projects):**
```json
{
  "metadata": [
    {
      "id": "uuid-1",
      "title": "Wedding - Smith",
      "client_id": "client-1",
      "cover_photo_src": "/uploads/...",
      "photo_count": 150,
      "status": "active",
      "created_at": "2025-10-01T10:00:00",
      "updated_at": "2025-10-20T15:30:00"
      // Only 8 essential fields
    },
    // ... × 100 projects
  ],
  "total": 100
}
```

**Size:** ~1KB per project × 100 = **100KB**

**With gzip compression:** ~80KB

**Savings:** 98% reduction!

---

**GET /api/projects?mode=full (single project):**
```json
{
  "projects": [
    {
      "id": "uuid-1",
      // ... all fields including folders, client data, etc.
    }
  ],
  "total": 1
}
```

**Size:** ~50KB (no change, full data when needed)

---

## Optimization Priority

### Phase 1: Backend API Changes (Critical Path)
1. ✅ Add `mode` parameter to `/api/projects`
2. ✅ Create `ProjectMetadata` schema
3. ✅ Implement conditional response logic
4. ✅ Add gzip compression middleware
5. ✅ Test with curl/Postman

**Timeline:** 2-3 days  
**Impact:** Enables 98% size reduction

---

### Phase 2: Frontend Integration
1. ✅ Update `projectService.ts` to accept mode parameter
2. ✅ Update `ProjectStore.ts` to detect role and choose mode
3. ✅ Test cache hit rates with new API
4. ✅ Verify no regressions

**Timeline:** 1-2 days  
**Impact:** Full optimization achieved

---

### Phase 3: Enhancements
1. ✅ Virtual scrolling for 100+ projects
2. ✅ Metrics dashboard
3. ✅ Adaptive prefetching
4. ✅ Image caching (Service Worker)

**Timeline:** 2-3 days  
**Impact:** Better UX for studio users

---

## Testing Plan

### Backend Testing

```bash
# 1. Test mode=list (lightweight)
curl "http://localhost:8000/api/projects?mode=list" | jq '.'
curl "http://localhost:8000/api/projects?mode=list" | wc -c
# Expected: ~100KB for 100 projects

# 2. Test mode=full (complete)
curl "http://localhost:8000/api/projects?mode=full" | jq '.'
curl "http://localhost:8000/api/projects?mode=full" | wc -c
# Expected: ~5MB for 100 projects

# 3. Test compression
curl -H "Accept-Encoding: gzip" \
     "http://localhost:8000/api/projects?mode=list" \
     --compressed -w "%{size_download}\n" -o /dev/null
# Expected: ~80KB

# 4. Test backward compatibility (no mode param)
curl "http://localhost:8000/api/projects" | jq '.projects | length'
# Expected: Should work (defaults to mode=full)
```

---

### Frontend Testing

```javascript
// 1. Check role detection
window.__roleDetector.getRole()
// Should return: 'client' or 'studio'

// 2. Monitor API calls
window.__cacheEvents.history().filter(e => e.type === 'api.call.success')
// Should see mode parameter used

// 3. Verify cache hit rates
window.__cache.stats().hitRate
// Should be >90% after navigation

// 4. Check response sizes (in Network tab)
// Dashboard load should be ~100KB, not 5MB
```

---

## Success Criteria

✅ **Backend:**
- [ ] Mode parameter implemented and working
- [ ] ProjectMetadata schema created
- [ ] Response size reduced 98% for mode=list
- [ ] Compression working (20% additional savings)
- [ ] No breaking changes (backward compatible)
- [ ] All tests passing

✅ **Frontend:**
- [ ] Service updated to use mode parameter
- [ ] Store detects role and chooses appropriate mode
- [ ] Cache hit rate >90%
- [ ] No performance regression
- [ ] All existing features working

✅ **Integration:**
- [ ] End-to-end tests passing
- [ ] Network traffic reduced 95-99%
- [ ] Page load times improved
- [ ] No errors in console

---

## Risk Mitigation

### Backward Compatibility
- Mode parameter is optional (defaults to `full`)
- Existing clients continue to work unchanged
- Can disable via feature flag if issues arise

### Rollback Plan
1. Set mode parameter default to `full`
2. Disable feature flag in config
3. Redeploy previous version if critical

### Monitoring
- Track API response sizes (before/after)
- Monitor error rates
- Watch cache hit rates
- Check page load times

---

## Next Steps

See:
- `BACKEND_IMPLEMENTATION.md` - Backend changes guide
- `FRONTEND_INTEGRATION.md` - Frontend changes guide
- `TESTING_GUIDE.md` - Complete testing procedures
- `ARCHITECTURE.md` - System architecture with Stage 4
