# Stage 4: Complete Testing Guide

## Overview

Comprehensive testing procedures for Stage 4 backend and frontend changes.

---

## Prerequisites

### Backend Running
```bash
cd /Users/ns632@apac.comcast.com/Documents/v0_photo_proof/photo_proof_api
source venv/bin/activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend Running
```bash
cd /Users/ns632@apac.comcast.com/Documents/v0_photo_proof/Photo_Proof_v1
npm run dev
```

### Tools Required
- `curl` - API testing
- `jq` - JSON parsing
- Browser with DevTools
- Postman (optional)

---

## Part 1: Backend API Testing

### Test 1: Mode Parameter Validation

```bash
# ✅ Test mode=list
curl -s "http://localhost:8000/api/projects?mode=list" | jq '.metadata | length'
# Expected: Number of projects

# ✅ Test mode=full  
curl -s "http://localhost:8000/api/projects?mode=full" | jq '.projects | length'
# Expected: Number of projects

# ✅ Test no mode (default to full)
curl -s "http://localhost:8000/api/projects" | jq '.projects | length'
# Expected: Number of projects (same as mode=full)

# ❌ Test invalid mode (should fail)
curl -s "http://localhost:8000/api/projects?mode=invalid" | jq '.'
# Expected: 422 validation error
```

**Expected Output (invalid mode):**
```json
{
  "detail": [
    {
      "loc": ["query", "mode"],
      "msg": "string does not match regex \"^(list|full)$\"",
      "type": "value_error.str.regex"
    }
  ]
}
```

---

### Test 2: Response Size Comparison

```bash
# Get size of mode=list
SIZE_LIST=$(curl -s "http://localhost:8000/api/projects?mode=list" | wc -c)
echo "mode=list size: $SIZE_LIST bytes"

# Get size of mode=full
SIZE_FULL=$(curl -s "http://localhost:8000/api/projects?mode=full" | wc -c)
echo "mode=full size: $SIZE_FULL bytes"

# Calculate reduction
REDUCTION=$(echo "scale=2; (1 - $SIZE_LIST / $SIZE_FULL) * 100" | bc)
echo "Size reduction: $REDUCTION%"

# Expected: 95-99% reduction
```

**Expected Output:**
```
mode=list size: 10240 bytes (10KB for 10 projects)
mode=full size: 512000 bytes (500KB for 10 projects)
Size reduction: 98.00%
```

---

### Test 3: Compression Verification

```bash
# Without compression
SIZE_UNCOMPRESSED=$(curl -s "http://localhost:8000/api/projects?mode=list" | wc -c)
echo "Uncompressed: $SIZE_UNCOMPRESSED bytes"

# With gzip compression
SIZE_COMPRESSED=$(curl -s -H "Accept-Encoding: gzip" \
  "http://localhost:8000/api/projects?mode=list" \
  --compressed -w "%{size_download}\n" -o /dev/null)
echo "Compressed: $SIZE_COMPRESSED bytes"

# Calculate compression ratio
COMPRESSION=$(echo "scale=2; (1 - $SIZE_COMPRESSED / $SIZE_UNCOMPRESSED) * 100" | bc)
echo "Compression: $COMPRESSION%"

# Expected: 15-25% additional reduction
```

**Expected Output:**
```
Uncompressed: 102400 bytes
Compressed: 81920 bytes  
Compression: 20.00%
```

---

### Test 4: Response Structure Validation

```bash
# Check mode=list structure
curl -s "http://localhost:8000/api/projects?mode=list" | jq 'keys'
# Expected: ["metadata", "total"]

curl -s "http://localhost:8000/api/projects?mode=list" | jq '.metadata[0] | keys'
# Expected: ["id", "title", "client_id", "cover_photo_src", 
#            "photo_count", "status", "created_at", "updated_at"]

# Check mode=full structure
curl -s "http://localhost:8000/api/projects?mode=full" | jq 'keys'
# Expected: ["projects", "total"]

curl -s "http://localhost:8000/api/projects?mode=full" | jq '.projects[0] | keys'
# Expected: All project fields including folders, client, etc.
```

---

### Test 5: Data Accuracy

```bash
# Get first project ID from mode=list
PROJECT_ID=$(curl -s "http://localhost:8000/api/projects?mode=list" | jq -r '.metadata[0].id')

# Get same project from mode=full
curl -s "http://localhost:8000/api/projects?mode=full" | jq ".projects[] | select(.id == \"$PROJECT_ID\")"

# Compare essential fields - should match
```

---

### Test 6: Performance Benchmarking

```bash
# Benchmark mode=list
echo "Testing mode=list..."
time curl -s "http://localhost:8000/api/projects?mode=list" > /dev/null
# Expected: <100ms

# Benchmark mode=full
echo "Testing mode=full..."
time curl -s "http://localhost:8000/api/projects?mode=full" > /dev/null
# Expected: 100-300ms (slower due to joins)

# Run multiple times and average
for i in {1..10}; do
  time curl -s "http://localhost:8000/api/projects?mode=list" > /dev/null
done
```

---

### Test 7: Filtering with Mode

```bash
# Test mode with filters
curl -s "http://localhost:8000/api/projects?mode=list&status=active" | jq '.'
curl -s "http://localhost:8000/api/projects?mode=full&status=active" | jq '.'

# Both should respect filters
```

---

### Test 8: Error Handling

```bash
# Test with invalid project ID (should handle gracefully)
curl -s "http://localhost:8000/api/projects/invalid-id" | jq '.'

# Test with missing authentication (if required)
curl -s -H "Authorization: Bearer invalid-token" \
  "http://localhost:8000/api/projects?mode=list" | jq '.'
```

---

## Part 2: Frontend Integration Testing

### Test 1: Role Detection

Open browser console:

```javascript
// Check role detector exists
window.__roleDetector
// Expected: RoleDetector instance

// Get current role
window.__roleDetector.getRole()
// Expected: 'client' or 'studio' or 'unknown'

// Get profile
window.__roleDetector.getProfile()
// Expected: { role, cacheProfile, ... }

// Check if studio
window.__roleDetector.isStudio()
// Expected: true or false
```

---

### Test 2: Feature Flags

```javascript
// Check all feature flags
window.__config.get().features
// Expected: {
//   memoryCache: true,
//   indexedDBCache: true,
//   roleBasedStrategy: true,
//   prefetching: true,
//   virtualScrolling: true
// }

// Check specific flag
window.__config.get().features.roleBasedStrategy
// Expected: true
```

---

### Test 3: Mode Parameter Usage

```javascript
// Clear event history
window.__cacheEvents.clear()

// Navigate to dashboard (triggers API call)
// ... navigate ...

// Check API calls made
const apiCalls = window.__cacheEvents.history().filter(e => 
  e.type === 'api.call.success' &&
  e.metadata?.endpoint === 'getProjects'
)

console.log('API Calls:', apiCalls.map(e => ({
  mode: e.metadata.mode,
  responseSize: e.metadata.responseSize,
  duration: e.duration
})))

// Expected for studio:
// [{ mode: 'list', responseSize: ~102400, duration: ~50 }]

// Expected for client:
// [{ mode: 'full', responseSize: ~153600, duration: ~150 }]
```

---

### Test 4: Cache Hit Rates

```javascript
// Navigate around the app
// Dashboard → Project → Back → Dashboard

// Check cache statistics
window.__cache.stats()
// Expected: {
//   hits: >10,
//   misses: 1-2,
//   hitRate: >90%,
//   ...
// }

// Check event breakdown
window.__cacheEvents.stats().eventsByType
// Expected: More cache.hit than api.call.success
```

---

### Test 5: Network Tab Verification

1. Open DevTools → Network tab
2. Filter: "api/projects"
3. Navigate to dashboard
4. Check request:

**For Studio User:**
```
Request URL: http://localhost:8000/api/projects?mode=list
Status: 200
Size: ~100KB
Type: xhr
Initiator: projectService.ts
```

**For Client User:**
```
Request URL: http://localhost:8000/api/projects?mode=full
Status: 200
Size: ~150KB
Type: xhr
Initiator: projectService.ts
```

5. Check Response Headers:
```
Content-Encoding: gzip
Content-Type: application/json
```

---

### Test 6: Memory Usage

```javascript
// Check memory cache usage
const cacheStats = window.__cache.stats()
console.log(`Memory Usage: ${cacheStats.sizeMB.toFixed(2)}MB / ${cacheStats.maxSizeMB}MB`)
console.log(`Utilization: ${cacheStats.utilizationPercent.toFixed(2)}%`)

// Expected for studio (mode=list):
// Memory Usage: 5-10MB / 500MB
// Utilization: 1-2%

// Expected for client (mode=full):
// Memory Usage: 0.5-1MB / 300MB
// Utilization: <1%
```

---

### Test 7: IndexedDB Persistence

```javascript
// Check IndexedDB stats
const idbStats = await window.__indexedDB.stats()
console.log('IndexedDB:', idbStats)

// Expected:
// { entryCount: 5-10, totalSize: 5-10MB, ... }

// Hard refresh page (Cmd+Shift+R)
// Data should load from IndexedDB quickly

// Check event history for indexeddb hits
window.__cacheEvents.history().filter(e => 
  e.type === 'cache.hit' &&
  e.metadata.source === 'indexeddb'
)
```

---

### Test 8: Role Switching Simulation

```javascript
// Simulate switching roles

// 1. Clear all caches
window.__cache.clear()
await window.__indexedDB.clear()
window.localStorage.clear()

// 2. Set client role
window.localStorage.setItem('user_role', 'client')
window.location.reload()

// 3. Navigate and check mode used
// Should use mode=full

// 4. Clear and set studio role
window.localStorage.setItem('user_role', 'studio')
window.location.reload()

// 5. Navigate and check mode used
// Should use mode=list
```

---

### Test 9: Error Handling

```javascript
// Simulate API error
// (Temporarily stop backend)

// Navigate to dashboard
// Should show error in UI and log event

window.__cacheEvents.history().filter(e => 
  e.type === 'api.call.error'
)
// Should show error details

// Restart backend and try again
// Should recover gracefully
```

---

### Test 10: Metrics Dashboard

```javascript
// Open metrics dashboard
// Press: Ctrl+Shift+M

// Should see:
// - Memory Cache stats
// - IndexedDB stats
// - API call counts
// - Data transferred

// Navigate around and watch metrics update in real-time
```

---

## Part 3: Integration Testing

### Scenario 1: Studio User with 100 Projects

1. **Setup:**
   - Login as studio user
   - Have 100+ projects in database

2. **Test:**
   - Navigate to dashboard
   - Check network tab: Should use `mode=list`
   - Check response size: ~100-150KB
   - Check load time: <500ms

3. **Verify:**
   ```javascript
   window.__cacheEvents.history().filter(e => 
     e.type === 'api.call.success' &&
     e.metadata.endpoint === 'getProjects'
   ).map(e => e.metadata.responseSize)
   // Should be ~102400 bytes (100KB)
   ```

---

### Scenario 2: Client User with 3 Projects

1. **Setup:**
   - Login as client user
   - Have 3 projects in database

2. **Test:**
   - Navigate to dashboard
   - Check network tab: Should use `mode=full`
   - Check response size: ~150KB
   - Check load time: <300ms

3. **Verify:**
   ```javascript
   window.__roleDetector.isClient()
   // Should be true
   
   window.__cacheEvents.history().find(e => 
     e.type === 'api.call.success'
   ).metadata.mode
   // Should be 'full'
   ```

---

### Scenario 3: Cache Performance

1. **First Load (Cold Start):**
   - Clear all caches
   - Navigate to dashboard
   - Measure time: ~200-500ms

2. **Second Load (Memory Cache):**
   - Navigate away and back
   - Measure time: <10ms
   - Verify: No API call made

3. **Third Load (After Refresh):**
   - Hard refresh (Cmd+Shift+R)
   - Measure time: 50-100ms
   - Verify: Data from IndexedDB

---

### Scenario 4: Bandwidth Savings

1. **Before Stage 4:**
   - Studio dashboard: 5MB download
   - 10 navigations: 50MB total

2. **After Stage 4:**
   - Studio dashboard: 100KB first load
   - 9 navigations: 0KB (cached)
   - Total: 100KB (99.8% savings!)

3. **Verify:**
   ```javascript
   const totalTransferred = window.__cacheEvents.history()
     .filter(e => e.type === 'api.call.success')
     .reduce((sum, e) => sum + (e.metadata.responseSize || 0), 0)
   
   console.log(`Total transferred: ${(totalTransferred / 1024 / 1024).toFixed(2)}MB`)
   // Should be <1MB after extensive use
   ```

---

## Part 4: Regression Testing

### Existing Features Checklist

- [ ] Project CRUD operations working
- [ ] Photo upload working
- [ ] Photo gallery rendering
- [ ] Folder creation/navigation
- [ ] Cover photo selection
- [ ] Client access URLs
- [ ] Authentication/authorization
- [ ] Project stats
- [ ] All navigation working

### No Regressions Checklist

- [ ] No console errors
- [ ] No TypeScript errors
- [ ] No API errors (500s)
- [ ] All pages loading
- [ ] Cache not breaking features
- [ ] Role detection accurate

---

## Part 5: Performance Testing

### Load Time Benchmarks

| Scenario | Before | After | Improvement |
|----------|--------|-------|-------------|
| Studio dashboard (100 projects) | 4s | 0.2s | 95% |
| Client dashboard (3 projects) | 0.5s | 0.2s | 60% |
| Navigate back (cached) | 0.5s | <0.01s | 99% |
| Hard refresh (IndexedDB) | 4s | 0.1s | 97.5% |

### Memory Usage

| User Type | Before | After | Improvement |
|-----------|--------|-------|-------------|
| Studio | 5MB | 0.5MB | 90% |
| Client | 0.5MB | 0.3MB | 40% |

### Network Traffic

| Period | Before | After | Improvement |
|--------|--------|-------|-------------|
| First session | 10MB | 0.2MB | 98% |
| Week of use | 500MB | 0.5MB | 99.9% |

---

## Part 6: Success Criteria

### Backend

✅ **All tests passing:**
- [ ] Mode parameter validation
- [ ] Response size reduced 98%
- [ ] Compression working (20% additional)
- [ ] No breaking changes
- [ ] Performance improved

### Frontend

✅ **All tests passing:**
- [ ] Role detection working
- [ ] Mode parameter used correctly
- [ ] Cache hit rate >90%
- [ ] No regressions
- [ ] Network traffic reduced 95-99%

### Integration

✅ **End-to-end working:**
- [ ] Studio users see fast dashboards
- [ ] Client users get full data
- [ ] Caching working across all layers
- [ ] Metrics dashboard showing correct data
- [ ] No errors in production

---

## Troubleshooting

### Problem: Mode not being used

**Check:**
```bash
curl -v "http://localhost:8000/api/projects?mode=list" 2>&1 | grep "mode"
```

**Fix:** Verify backend changes deployed.

---

### Problem: Large responses still

**Check Network Tab:**
- Is mode parameter in URL?
- Is Content-Encoding header present?

**Fix:**
1. Check backend compression middleware added
2. Verify browser supports gzip

---

### Problem: Role always unknown

**Check:**
```javascript
window.localStorage.getItem('user_role')
```

**Fix:** Set role or ensure auth flow sets it.

---

## Next Steps

Once all tests pass:
1. ✅ Document results
2. ✅ Update changelog
3. ✅ Create deployment guide
4. → Deploy to production
5. → Monitor metrics

See: `ARCHITECTURE.md` for complete system overview.
