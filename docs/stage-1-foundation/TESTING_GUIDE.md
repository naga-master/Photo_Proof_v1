# Stage 1: Foundation - Testing Guide

## Local Testing Procedure

### Prerequisites
```bash
cd /Users/ns632@apac.comcast.com/Documents/v0_photo_proof/Photo_Proof_v1
npm install  # Ensure all dependencies installed
npm run dev  # Start development server
```

---

## Test 1: Configuration System

### Test Hot-Reload (Development)

1. **Open browser console**: `http://localhost:5173` (or your Vite port)

2. **Check config is loaded**:
   ```javascript
   window.__config.get()
   // Should show full configuration object
   
   window.__config.env()
   // Should return 'development'
   ```

3. **Test hot-reload**:
   - Open `config/cache-strategy.dev.ts`
   - Change `logLevel: 'debug'` to `logLevel: 'info'`
   - Save file
   - Check console: Should see "[ConfigLoader] Configuration hot-reloaded"
   - Verify: `window.__config.get().monitoring.logLevel` === 'info'

4. **Test runtime config update**:
   ```javascript
   window.__config.update({
     monitoring: { logLevel: 'debug' }
   })
   // Should see more verbose logs immediately
   ```

**Expected Results:**
- ✅ Config loads without errors
- ✅ Hot-reload works (logs show reload message)
- ✅ Runtime updates work in dev mode
- ✅ Environment detection correct

---

## Test 2: Event System

### Test Event Emission and Logging

1. **Open browser console**

2. **Check event emitter is active**:
   ```javascript
   window.__cacheEvents.history()
   // Should return array of events (initially empty or with init events)
   ```

3. **Trigger some events** (navigate app):
   - Go to dashboard
   - Click on a project
   - Navigate to gallery
   
4. **Check event history**:
   ```javascript
   window.__cacheEvents.history()
   // Should show events like:
   // - api.call.start
   // - api.call.success
   // - cache.set
   ```

5. **Check event statistics**:
   ```javascript
   window.__cacheEvents.stats()
   // Should return:
   // {
   //   totalEvents: 10,
   //   eventsByType: { 'api.call.success': 5, ... },
   //   avgDuration: 234.5
   // }
   ```

6. **Verify color-coded logging**:
   - Check console output has colored logs
   - Green ✓ for cache hits
   - Orange ✗ for cache misses
   - Blue 📝 for cache sets
   - Red 🗑️ for evictions

7. **Export events**:
   ```javascript
   const exported = window.__cacheEvents.export()
   console.log(exported)
   // Copy to clipboard for analysis
   ```

**Expected Results:**
- ✅ Events emitted on every operation
- ✅ Console shows color-coded logs
- ✅ Event history tracks all events
- ✅ Statistics calculated correctly
- ✅ Export works

---

## Test 3: Global Stores

### Test PhotoStore

1. **Open browser console**

2. **Test fetching photos**:
   ```javascript
   // Get store instance (note: need to import in a component or use React DevTools)
   // For quick testing, trigger via UI:
   // - Navigate to a project
   // - Open gallery
   ```

3. **Check store state** (via React DevTools):
   - Install React DevTools extension
   - Open Components tab
   - Find component using `usePhotoStore`
   - Inspect state: Should see `photos`, `photosByProject`, etc.

4. **Verify events emitted**:
   ```javascript
   window.__cacheEvents.history().filter(e => e.type.includes('api'))
   // Should show API calls for fetching photos
   ```

5. **Test cache hit** (second navigation):
   - Navigate away from gallery
   - Navigate back to same project gallery
   - Check events: Should NOT see new API calls in Stage 1
   - (Cache hits will be in Stage 2)

### Test ProjectStore

1. **Navigate to dashboard** (triggers fetchProjects)

2. **Check events**:
   ```javascript
   window.__cacheEvents.history().filter(e => 
     e.metadata.endpoint === 'getProjects'
   )
   // Should show at least one API call
   ```

3. **Check store populated** (via React DevTools):
   - Find component using `useProjectStore`
   - Verify `projects` object has data
   - Verify `projectIds` array populated

### Test MetadataStore

1. **Navigate to project with folders**

2. **Check events**:
   ```javascript
   window.__cacheEvents.history().filter(e => 
     e.metadata.endpoint === 'getProjectFolders'
   )
   ```

3. **Verify store state** (via React DevTools):
   - Check `folders` object
   - Check `foldersByProject` mapping

**Expected Results:**
- ✅ Stores fetch data successfully
- ✅ Data accessible via getters
- ✅ Events emitted for all operations
- ✅ No errors in console
- ✅ React DevTools shows store state

---

## Test 4: Integration Test (Full Flow)

### Complete User Journey

1. **Start fresh**:
   ```javascript
   // Clear all stores
   window.__cacheEvents.clear()
   localStorage.clear()
   // Refresh page
   location.reload()
   ```

2. **Login** (if required)

3. **Navigate: Dashboard → Project → Gallery → Folder → Photo**

4. **Check event history**:
   ```javascript
   const events = window.__cacheEvents.history()
   console.log(`Total events: ${events.length}`)
   
   const apiCalls = events.filter(e => e.type.includes('api.call'))
   console.log(`Total API calls: ${apiCalls.length}`)
   
   const stats = window.__cacheEvents.stats()
   console.log('Event stats:', stats)
   ```

5. **Verify all stores populated**:
   - ProjectStore has projects
   - PhotoStore has photos
   - MetadataStore has folders

6. **Export full event log**:
   ```javascript
   const log = window.__cacheEvents.export()
   // Copy to file for analysis
   console.save('stage1-events.json', log)
   ```

**Expected Results:**
- ✅ All navigation works without errors
- ✅ Event log shows complete journey
- ✅ API calls tracked with durations
- ✅ Stores contain correct data
- ✅ No console errors

---

## Test 5: Error Handling

### Test Network Errors

1. **Open DevTools → Network tab**

2. **Enable offline mode** (or throttle to "Offline")

3. **Try to fetch data** (navigate to new project)

4. **Check event log**:
   ```javascript
   window.__cacheEvents.history().filter(e => 
     e.type === 'api.call.error'
   )
   // Should see error events
   ```

5. **Check console**: Should see error logs (red)

6. **Re-enable network**

7. **Retry**: Should work now

**Expected Results:**
- ✅ Errors caught and logged
- ✅ Error events emitted
- ✅ App doesn't crash
- ✅ Recovery works when network restored

---

## Debugging Tips

### View All Events
```javascript
window.__cacheEvents.history().forEach(e => {
  console.log(`[${new Date(e.timestamp).toLocaleTimeString()}] ${e.type}`, e.metadata)
})
```

### Filter Events by Type
```javascript
window.__cacheEvents.history().filter(e => 
  e.type === 'api.call.success'
)
```

### Get Events Since Time
```javascript
const fiveMinutesAgo = Date.now() - (5 * 60 * 1000)
window.__cacheEvents.history({ since: fiveMinutesAgo })
```

### Check Config
```javascript
window.__config.get()
window.__config.get().features  // Check feature flags
window.__config.get().monitoring  // Check logging settings
```

### Modify Config (Dev Only)
```javascript
window.__config.update({
  monitoring: { logLevel: 'debug' }
})
```

---

## Performance Benchmarks

### Measure API Call Durations

```javascript
const apiCalls = window.__cacheEvents.history().filter(e => 
  e.type === 'api.call.success' && e.duration
)

const avgDuration = apiCalls.reduce((sum, e) => 
  sum + e.duration, 0
) / apiCalls.length

console.log(`Average API duration: ${avgDuration.toFixed(2)}ms`)
```

### Count API Calls Per Page
```javascript
window.__cacheEvents.clear()
// Navigate to page
// Wait for page load
const apiCount = window.__cacheEvents.history().filter(e => 
  e.type.includes('api.call')
).length

console.log(`API calls for this page: ${apiCount}`)
```

---

## Common Issues & Solutions

### Issue: Config not hot-reloading
- **Solution**: Check Vite HMR is working (save any file, should see HMR update)
- **Solution**: Check browser console for errors

### Issue: Events not showing in console
- **Solution**: Check `window.__config.get().monitoring.enableLogging` is true
- **Solution**: Check logLevel allows the event type

### Issue: Stores not updating UI
- **Solution**: Verify components use `usePhotoStore`, `useProjectStore` hooks correctly
- **Solution**: Check React DevTools shows store subscriptions

### Issue: TypeScript errors
- **Solution**: Run `npm install` to ensure all types installed
- **Solution**: Restart TypeScript server in VSCode

---

## Next Steps

Once all tests pass:
1. ✅ Stage 1 foundation is solid
2. → Proceed to Stage 2: Memory Cache implementation
3. → Keep Stage 1 tests passing as we add caching layers
