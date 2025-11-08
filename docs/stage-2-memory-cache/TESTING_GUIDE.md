# Stage 2: Memory Cache - Testing Guide

## Prerequisites

```bash
cd /Users/ns632@apac.comcast.com/Documents/v0_photo_proof/Photo_Proof_v1
npm run dev
```

Open `http://localhost:3001/` and open browser console (F12).

---

## Test 1: Memory Cache Enabled

### Verify Feature Flag

```javascript
window.__config.get().features.memoryCache
// Expected: true
```

### Verify Cache Manager Initialized

```javascript
window.__cache.stats()
// Expected: { hits: 0, misses: 0, sets: 0, ... }
```

**✅ Pass:** Feature enabled and cache manager working

---

## Test 2: Cache Hit/Miss Tracking

### Step 1: Initial State

```javascript
// Clear cache and history
window.__cache.clear()
window.__cacheEvents.clear()

// Check initial state
window.__cache.stats()
// Expected: { hits: 0, misses: 0, sets: 0, evictions: 0 }
```

### Step 2: First Navigation (Cache Miss)

1. Navigate to Dashboard
2. Check console logs - should see:
   - `🌐 api.call.start` - API call starting
   - `✅ api.call.success` - API call completed
   - `📝 cache.set` - Data cached

3. Check cache stats:
```javascript
window.__cache.stats()
// Expected: { hits: 0, misses: 1+, sets: 1+, ... }
```

### Step 3: Second Navigation (Cache Hit)

1. Navigate to a project
2. Navigate back to Dashboard
3. Check console logs - should see:
   - `✓ cache.hit` - Data from cache!
   - No API calls

4. Check cache stats:
```javascript
window.__cache.stats()
// Expected: { hits: 1+, misses: 1+, hitRate: >50% }
```

**✅ Pass:** Cache hit/miss tracking working

---

## Test 3: Cache Hit Rate

### Navigate Multiple Pages

1. Dashboard → Project 1 → Gallery → Back → Project 2 → Back → Dashboard
2. Each page should trigger:
   - First visit: Cache miss + API call
   - Return visit: Cache hit (no API)

### Check Hit Rate

```javascript
const stats = window.__cache.stats()
console.log(`Hit Rate: ${stats.hitRate.toFixed(2)}%`)
console.log(`Hits: ${stats.hits}, Misses: ${stats.misses}`)

// Expected after navigation:
// Hit Rate: 80-95%
// More hits than misses
```

**✅ Pass:** Hit rate >80% after navigation

---

## Test 4: TTL Expiration

### Verify TTL Setting

```javascript
window.__config.get().ttl.memoryMs
// Expected: 300000 (5 minutes in dev)
```

### Test Expiration

1. Navigate to a page (cache it)
2. Wait 6 minutes (or adjust TTL to 10 seconds for testing)
3. Navigate to same page
4. Should see cache miss + API call

**Note:** To test quickly, update config:

```typescript
// config/cache-strategy.dev.ts
ttl: {
  memoryMs: 10 * 1000,  // 10 seconds for testing
}
```

Save → hot-reload → test expiration after 15 seconds

**✅ Pass:** Cache expires after TTL

---

## Test 5: Role Detection

### Check Current Role

```javascript
window.__roleDetector.getRole()
// Expected: 'client' or 'studio' or 'unknown'

window.__roleDetector.getProfile()
// Expected: { role, cacheProfile, ... }
```

### Verify Profile Loaded

Check console for event:
- `👤 role.detected` - Role detected
- `⚙️ profile.loaded` - Profile loaded

### Check Profile Settings

```javascript
const profile = window.__roleDetector.getProfile()
console.log('Max Memory:', profile.cacheProfile.maxMemoryMB, 'MB')
console.log('Prefetch:', profile.cacheProfile.prefetchStrategy)

// Client: maxMemoryMB: 300, prefetchStrategy: 'aggressive'
// Studio: maxMemoryMB: 500, prefetchStrategy: 'conservative'
```

**✅ Pass:** Role detected and profile loaded

---

## Test 6: Memory Usage Tracking

### Monitor Memory Usage

```javascript
// After navigating around
const stats = window.__cache.stats()
console.log(`Memory Used: ${stats.sizeMB.toFixed(2)}MB`)
console.log(`Memory Max: ${stats.maxSizeMB}MB`)
console.log(`Utilization: ${stats.utilizationPercent.toFixed(2)}%`)

// Expected:
// sizeMB: 5-50MB (depending on navigation)
// maxSizeMB: 300 (client) or 500 (studio)
// utilizationPercent: <20% typically
```

**✅ Pass:** Memory usage tracked correctly

---

## Test 7: LRU Eviction (Studio Users)

**Note:** This test requires studio user role and 10+ projects

### Setup

1. Ensure role is 'studio':
```javascript
window.__roleDetector.getRole()
// Should return: 'studio'
```

2. Check LRU limit:
```javascript
window.__config.get().profiles.studio.maxActiveProjects
// Expected: 10 (or 5 in dev config)
```

### Test Eviction

1. Open 12 projects sequentially (exceeds limit of 10)
2. Check console for eviction events:
   - `🗑️ cache.evict` - Entry evicted
   - Reason: 'lru' or 'project_limit'

3. Check eviction stats:
```javascript
window.__cache.stats().evictions
// Expected: >0 (at least 2 evictions)
```

4. Navigate back to first project opened
5. Should see cache miss + API call (was evicted)

**✅ Pass:** LRU eviction working for studio users

---

## Test 8: Client Unlimited Cache

**Note:** Requires client user role

### Setup

1. Ensure role is 'client':
```javascript
window.__roleDetector.getRole()
// Should return: 'client'
```

2. Check settings:
```javascript
window.__config.get().profiles.client.maxProjects
// Expected: -1 (unlimited)
```

### Test No Eviction

1. Navigate to many pages (10+)
2. Check console - NO eviction events
3. Navigate back to any page
4. Should hit cache (no eviction)

```javascript
window.__cache.stats().evictions
// Expected: 0 (no evictions for clients)
```

**✅ Pass:** Client users have unlimited cache

---

## Test 9: Cache Statistics

### Detailed Statistics

```javascript
const stats = window.__cache.stats()

console.log('=== Cache Statistics ===')
console.log('Hits:', stats.hits)
console.log('Misses:', stats.misses)
console.log('Sets:', stats.sets)
console.log('Evictions:', stats.evictions)
console.log('Hit Rate:', stats.hitRate.toFixed(2) + '%')
console.log('Memory:', stats.sizeMB.toFixed(2), 'MB /', stats.maxSizeMB, 'MB')
console.log('Utilization:', stats.utilizationPercent.toFixed(2) + '%')
console.log('Entry Count:', stats.entryCount)
```

### Event Statistics

```javascript
const eventStats = window.__cacheEvents.stats()

console.log('=== Event Statistics ===')
console.log('Total Events:', eventStats.totalEvents)
console.log('By Type:', eventStats.eventsByType)
console.log('Avg Duration:', eventStats.avgDuration.toFixed(2), 'ms')
```

**✅ Pass:** Statistics accurate and detailed

---

## Test 10: Cache Clear

### Test Manual Clear

```javascript
// Record current stats
const before = window.__cache.stats()
console.log('Before clear:', before.entryCount, 'entries')

// Clear cache
window.__cache.clear()

// Check after clear
const after = window.__cache.stats()
console.log('After clear:', after.entryCount, 'entries')

// Expected: 0 entries after clear
```

### Verify Cache Rebuild

1. Navigate to a page
2. Should see cache miss + API call
3. Cache rebuilds from scratch

**✅ Pass:** Cache clear working

---

## Test 11: Performance Measurement

### Measure Navigation Speed

```javascript
// Clear cache
window.__cache.clear()

// First navigation (cache miss)
console.time('First Load')
// Navigate to dashboard
// After page loads:
console.timeEnd('First Load')
// Expected: 200-500ms (API call)

// Second navigation (cache hit)
console.time('Second Load')
// Navigate away and back to dashboard
// After page loads:
console.timeEnd('Second Load')
// Expected: <10ms (from cache)
```

### Compare API Call Duration

```javascript
// Get API call events
const apiCalls = window.__cacheEvents.history().filter(e => 
  e.type === 'api.call.success' && e.duration
)

const avgDuration = apiCalls.reduce((sum, e) => 
  sum + e.duration, 0
) / apiCalls.length

console.log(`Average API duration: ${avgDuration.toFixed(2)}ms`)
// Expected: 200-500ms
```

**✅ Pass:** Cache dramatically faster than API calls

---

## Test 12: Configuration Hot-Reload

### Test Config Changes

1. Edit `config/cache-strategy.dev.ts`:
```typescript
profiles: {
  client: {
    maxMemoryMB: 150,  // Change from 300 to 150
  }
}
```

2. Save file
3. Check console for hot-reload message
4. Verify change applied:
```javascript
window.__config.get().profiles.client.maxMemoryMB
// Expected: 150
```

**✅ Pass:** Configuration hot-reloads

---

## Common Issues & Solutions

### Issue: Cache not working

**Check:**
```javascript
window.__config.get().features.memoryCache
// Should be: true
```

**Fix:** Enable in `config/cache-strategy.dev.ts`

---

### Issue: Low hit rate (<50%)

**Possible causes:**
- TTL too short (entries expiring quickly)
- Not enough navigation (need repeat visits)
- Cache clearing between navigations

**Check:**
```javascript
window.__config.get().ttl.memoryMs
// Should be: 300000 (5 minutes) or more
```

---

### Issue: High memory usage

**Check:**
```javascript
const stats = window.__cache.stats()
console.log(stats.sizeMB, 'MB /', stats.maxSizeMB, 'MB')
```

**Fix:** Adjust maxMemoryMB in config or wait for LRU eviction

---

### Issue: No eviction for studio users

**Check:**
1. Role is studio:
```javascript
window.__roleDetector.getRole() === 'studio'
```

2. Exceeded project limit:
```javascript
// Need more than 10 projects cached
window.__cache.stats().entryCount
```

---

## Success Criteria

✅ **All tests passing if:**
- Feature flag enabled
- Cache hits after second navigation
- Hit rate >80% after use
- TTL expiration working
- Role detection working
- Memory usage tracked
- LRU eviction working (studio)
- Statistics accurate
- Performance improvement visible

**Ready for Stage 3 if all criteria met!**
