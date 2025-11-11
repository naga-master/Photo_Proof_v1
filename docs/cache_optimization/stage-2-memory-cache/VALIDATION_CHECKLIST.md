# Stage 2: Memory Cache - Validation Checklist

## Pre-Validation

- [ ] Stage 1 completed and validated
- [ ] `npm run build` succeeds
- [ ] `npm run dev` starts without errors
- [ ] No TypeScript errors
- [ ] No console errors on app load

---

## Code Implementation

### Files Created
- [ ] `src/services/auth/RoleDetector.ts` exists
- [ ] `src/services/cache/MemoryCacheManager.ts` exists

### Files Modified
- [ ] `src/stores/PhotoStore.ts` updated with memory cache
- [ ] `src/stores/ProjectStore.ts` updated with memory cache
- [ ] `config/cache-strategy.dev.ts` has `memoryCache: true`

### Code Quality
- [ ] No TypeScript errors in new files
- [ ] All imports resolve correctly
- [ ] No console errors when using cache

---

## Feature Verification

### Memory Cache Manager
- [ ] `window.__cache` exists in browser console
- [ ] `window.__cache.stats()` returns data
- [ ] `window.__cache.clear()` works
- [ ] `window.__cache.get(key)` returns null for non-existent keys
- [ ] `window.__cache.has(key)` returns boolean

### Role Detector
- [ ] `window.__roleDetector` exists in browser console
- [ ] `window.__roleDetector.getRole()` returns role
- [ ] `window.__roleDetector.getProfile()` returns profile object
- [ ] `window.__roleDetector.isClient()` returns boolean
- [ ] `window.__roleDetector.isStudio()` returns boolean

### Configuration
- [ ] `window.__config.get().features.memoryCache` is `true`
- [ ] TTL configured: `window.__config.get().ttl.memoryMs` > 0
- [ ] Profiles configured for client and studio
- [ ] Hot-reload works (edit config → changes apply)

---

## Functional Testing

### Cache Hit/Miss

**First Navigation (Cache Miss):**
- [ ] Navigate to dashboard
- [ ] Console shows `api.call.start` event
- [ ] Console shows `api.call.success` event
- [ ] Console shows `cache.set` event
- [ ] `window.__cache.stats().misses` increases
- [ ] `window.__cache.stats().sets` increases

**Second Navigation (Cache Hit):**
- [ ] Navigate away and back to dashboard
- [ ] Console shows `cache.hit` event
- [ ] Console does NOT show `api.call` events
- [ ] `window.__cache.stats().hits` increases
- [ ] Page loads instantly (<100ms)

### Cache Statistics

- [ ] `window.__cache.stats().hitRate` calculates correctly
- [ ] `window.__cache.stats().sizeMB` shows memory usage
- [ ] `window.__cache.stats().entryCount` shows cached entries
- [ ] Hit rate increases with navigation (should reach 80-95%)

### TTL Expiration

- [ ] Cache entries expire after configured TTL
- [ ] Expired entries cause cache miss
- [ ] New API call made for expired entries
- [ ] Expired entries automatically cleaned up

### Role Detection

- [ ] Role detected on app start
- [ ] Console shows `role.detected` event
- [ ] Console shows `profile.loaded` event
- [ ] Correct profile loaded (client vs studio)
- [ ] Profile settings match configuration

### Memory Management

- [ ] Memory usage tracked: `window.__cache.stats().sizeMB`
- [ ] Memory stays within limits (client: 300MB, studio: 500MB)
- [ ] Utilization percentage calculated correctly

---

## Role-Specific Testing

### Client Users (if applicable)

- [ ] Unlimited cache (maxProjects: -1)
- [ ] No LRU eviction occurs
- [ ] Can navigate to many pages without eviction
- [ ] Memory limit: 300MB (or as configured)

### Studio Users (if applicable)

- [ ] LRU cache with limit (maxActiveProjects: 10)
- [ ] Eviction occurs when limit exceeded
- [ ] Console shows `cache.evict` events
- [ ] Eviction reason logged (lru, project_limit, etc.)
- [ ] Memory limit: 500MB (or as configured)
- [ ] Can still access evicted data (refetches from API)

---

## Performance Testing

### Navigation Speed

**Baseline (first visit):**
- [ ] Dashboard loads in 200-500ms (API call time)

**Cached (return visit):**
- [ ] Dashboard loads in <10ms (from cache)
- [ ] 95%+ faster than baseline

### API Call Reduction

**Before Stage 2:**
- Typical session: 20+ API calls

**After Stage 2:**
- [ ] First load: 3-5 API calls
- [ ] Navigation: 0 API calls (from cache)
- [ ] Overall: 80-95% fewer API calls

### Cache Hit Rate

After typical usage (10+ page navigations):
- [ ] Hit rate > 80%
- [ ] Hit rate > 90% after extensive use
- [ ] Cache hits significantly outnumber misses

---

## Event Tracking

### Event Emission

- [ ] All cache operations emit events
- [ ] Events visible in `window.__cacheEvents.history()`
- [ ] Event statistics calculated: `window.__cacheEvents.stats()`

### Event Types Present

- [ ] `cache.hit` events logged
- [ ] `cache.miss` events logged
- [ ] `cache.set` events logged
- [ ] `cache.evict` events logged (if applicable)
- [ ] `role.detected` event logged
- [ ] `profile.loaded` event logged
- [ ] `api.call.start` events logged
- [ ] `api.call.success` events logged

### Console Logging

- [ ] Events appear in console with colors
- [ ] Event metadata visible
- [ ] Event duration shown (where applicable)
- [ ] Log level respected (debug/info/warn/error)

---

## Integration Testing

### Store Integration

**PhotoStore:**
- [ ] `fetchProjectPhotos()` checks cache before API
- [ ] `getPhoto()` checks cache before API
- [ ] Cache populated after API calls
- [ ] Cache hit returns data without API call

**ProjectStore:**
- [ ] `fetchProjects()` checks cache before API
- [ ] `fetchProject()` checks cache before API
- [ ] Cache populated after API calls
- [ ] Cache hit returns data without API call

### Configuration Integration

- [ ] Config changes apply to cache behavior
- [ ] TTL changes affect expiration
- [ ] Memory limits enforced
- [ ] Profile changes affect cache strategy

---

## Edge Cases

### Cache Clear

- [ ] `window.__cache.clear()` empties cache
- [ ] `entryCount` becomes 0 after clear
- [ ] Subsequent navigations rebuild cache
- [ ] No errors after cache clear

### Rapid Navigation

- [ ] Navigating quickly doesn't break cache
- [ ] No race conditions observed
- [ ] Cache consistency maintained

### Large Data Sets

- [ ] Can cache large responses (1MB+)
- [ ] Size estimation works correctly
- [ ] Memory limits still enforced

### Expired While Using

- [ ] TTL expiration during active use handled gracefully
- [ ] Expired entry refetched automatically
- [ ] No stale data served

---

## Browser Compatibility

Test in multiple browsers (if applicable):
- [ ] Chrome/Edge: Cache working
- [ ] Firefox: Cache working
- [ ] Safari: Cache working

---

## Documentation

- [ ] `ARCHITECTURE.md` created and accurate
- [ ] `TESTING_GUIDE.md` created and accurate
- [ ] `VALIDATION_CHECKLIST.md` created (this file)
- [ ] Code comments adequate
- [ ] Configuration options documented

---

## Rollback Capability

- [ ] Can disable via feature flag
- [ ] App works with `memoryCache: false`
- [ ] No errors when cache disabled
- [ ] Can revert code changes cleanly

---

## Build & Deploy

- [ ] `npm run build` succeeds
- [ ] Production build includes cache code
- [ ] Bundle size acceptable (<5MB)
- [ ] No build warnings related to cache

---

## Sign-Off

**All checklist items verified:** [ ]

**Stage 2 Memory Cache:** ✅ VALIDATED

**Tested by:** ________________

**Date:** ________________

**Notes:**
```
[Add any observations, issues, or recommendations]
```

---

## Next Steps

Once validated:
1. ✅ Mark Stage 2 complete
2. → Document any issues found
3. → Proceed to Stage 3: Persistence
4. → Keep Stage 2 tests passing as you progress
