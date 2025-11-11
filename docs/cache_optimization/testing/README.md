# Testing Documentation

## Overview

Comprehensive testing guides for all stages of the caching system.

---

## Testing by Stage

### Stage 1: Foundation

**Test Configuration System:**
```javascript
window.__config.get()
window.__config.get().features
window.__config.reload()
```

**Test Event System:**
```javascript
window.__cacheEvents.history()
window.__cacheEvents.stats()
window.__cacheEvents.clear()
```

**See:** [Stage 1 Testing Guide](/docs/stage-1-foundation/TESTING_GUIDE.md)

---

### Stage 2: Memory Cache

**Test Cache Operations:**
```javascript
// Clear cache
window.__cache.clear()

// Navigate around app
// Check cache stats
window.__cache.stats()
// Expected: hitRate > 80% after navigation
```

**See:** [Stage 2 Testing Guide](/docs/stage-2-memory-cache/TESTING_GUIDE.md)

---

### Stage 3: Persistence

**Test IndexedDB:**
```javascript
// Check IndexedDB working
await window.__indexedDB.stats()

// Hard refresh page (Cmd+Shift+R)
// Data should load from IndexedDB

// Check for IndexedDB hits
window.__cacheEvents.history().filter(e => 
  e.type === 'cache.hit' &&
  e.metadata.source === 'indexeddb'
)
```

**See:** [Stage 3 Testing Guide](/docs/stage-3-persistence/)

---

### Stage 4: Role-Based Optimization

**Test Mode Parameter:**
```javascript
// Check role detection
window.__roleDetector.getRole()
// Should return: 'client' or 'studio'

// Navigate to dashboard
// Check Network tab - should see mode parameter

// Studio users
// URL: /api/projects?mode=list
// Size: ~100KB

// Client users
// URL: /api/projects?mode=full
// Size: ~150KB
```

**See:** [Stage 4 Testing Guide](/docs/stage-4-role-based/TESTING_GUIDE.md)

---

## Backend Testing

### API Endpoints

```bash
# Test mode parameter
curl "http://localhost:8000/api/projects?mode=list" | jq '.'
curl "http://localhost:8000/api/projects?mode=full" | jq '.'

# Test response sizes
curl -s "http://localhost:8000/api/projects?mode=list" | wc -c
curl -s "http://localhost:8000/api/projects?mode=full" | wc -c

# Test compression
curl -s -H "Accept-Encoding: gzip" \
  "http://localhost:8000/api/projects?mode=list" \
  --compressed | wc -c
```

---

## Frontend Testing

### Manual Testing Checklist

- [ ] Dashboard loads without errors
- [ ] Projects display correctly
- [ ] Navigation works smoothly
- [ ] Cache hit rate increases with use
- [ ] Memory usage stays within limits
- [ ] IndexedDB persists across refresh
- [ ] Role detection working
- [ ] Mode parameter in API calls (Network tab)
- [ ] Response sizes reduced

---

### Automated Testing

**Unit Tests:**
```bash
npm test
```

**Integration Tests:**
```bash
npm run test:integration
```

**E2E Tests:**
```bash
npm run test:e2e
```

---

## Performance Testing

### Baseline Measurement

```javascript
// Before optimization
console.time('Dashboard Load');
// Load dashboard
console.timeEnd('Dashboard Load');
// Record: ~4000ms
```

### After Optimization

```javascript
// After Stage 4
console.time('Dashboard Load');
// Load dashboard
console.timeEnd('Dashboard Load');
// Expected: ~200ms (95% improvement)
```

---

### Load Testing

Test with multiple project counts:

- 3 projects (client user)
- 10 projects (small studio)
- 50 projects (medium studio)
- 100 projects (large studio)
- 500+ projects (enterprise)

**Metrics to track:**
- Initial load time
- Cached load time
- Memory usage
- API call count
- Bandwidth used

---

## Regression Testing

### Ensure No Breaking Changes

```javascript
// Test all existing features still work
const tests = [
  'Project list loads',
  'Project creation works',
  'Photo upload works',
  'Gallery navigation works',
  'Cover photo selection works',
  'Folder creation works',
  'Authentication works',
];

tests.forEach(test => {
  console.log(`✓ ${test}`);
});
```

---

## Browser Compatibility Testing

Test in:
- ✅ Chrome/Edge (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ⚠️ Mobile browsers (iOS Safari, Chrome Mobile)

**Check:**
- IndexedDB support
- Service Worker support (if using)
- LocalStorage support
- Fetch API support

---

## Test Scenarios

### Scenario 1: New User (Cold Start)

1. Clear all caches
2. Navigate to dashboard
3. **Expected:** API call made, data cached
4. **Time:** 200-500ms

### Scenario 2: Returning User (Warm Cache)

1. Navigate away and back
2. **Expected:** No API call, data from memory
3. **Time:** <10ms

### Scenario 3: Page Refresh

1. Hard refresh (Cmd+Shift+R)
2. **Expected:** Data from IndexedDB
3. **Time:** 50-100ms

### Scenario 4: Next Day

1. Return after 24 hours
2. **Expected:** Data still in IndexedDB
3. **Time:** 50-100ms

### Scenario 5: Role Switching

1. Test as studio user
2. **Expected:** mode=list used
3. Test as client user
4. **Expected:** mode=full used

---

## Common Issues & Solutions

### Cache Not Working

**Check:**
```javascript
window.__config.get().features.memoryCache
// Should be: true
```

**Fix:** Enable in config

---

### IndexedDB Not Persisting

**Check:**
```javascript
await window.__indexedDB.stats()
// Should show entries
```

**Fix:** Check browser private mode disabled

---

### Mode Parameter Not Used

**Check:**
```javascript
window.__roleDetector.getRole()
// Should not be: 'unknown'

window.__config.get().features.roleBasedStrategy
// Should be: true
```

**Fix:** Enable role-based strategy

---

## Test Data Setup

### Create Test Projects

```bash
# Use API or UI to create:
# - 3 projects (client test)
# - 10 projects (small studio test)
# - 100 projects (large studio test)
```

### Seed Database

```bash
cd photo_proof_api
python scripts/seed_test_data.py
```

---

## CI/CD Testing

### Pre-Commit

```bash
npm run lint
npm run typecheck
npm test
```

### Pre-Deploy

```bash
npm run build
npm run test:integration
npm run test:e2e
```

---

## See Also

- [Stage 1 Testing](/docs/stage-1-foundation/TESTING_GUIDE.md)
- [Stage 2 Testing](/docs/stage-2-memory-cache/TESTING_GUIDE.md)
- [Stage 4 Testing](/docs/stage-4-role-based/TESTING_GUIDE.md)
- [Observability](/docs/observability/)
- [Metrics](/docs/metrics/)
