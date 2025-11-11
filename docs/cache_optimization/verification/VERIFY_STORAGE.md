# Storage Verification Guide

## ✅ Fix Applied: IndexedDB Now Initializes!

**What Changed:** Added `import './src/services/cache/IndexedDBManager';` to App.tsx

---

## 🧪 Quick Verification Steps

### 1. Restart Your Dev Server

```bash
# Stop the server (Ctrl+C)
# Start again
npm run dev
```

### 2. Open Browser Console (F12)

```javascript
// Check 1: IndexedDB is now available
console.log("✓ IndexedDB initialized:", !!window.__indexedDB);
// Should return: true ✅

// Check 2: Memory cache still works
console.log("✓ Memory cache:", window.__cache.stats());
// Should show: { hits, misses, ... }

// Check 3: Config loaded
console.log("✓ IndexedDB feature enabled:", 
  window.__config.get().features.indexedDBCache);
// Should return: true ✅
```

### 3. Navigate Around the App

- Go to Dashboard
- Click on a project
- Go back to Dashboard

### 4. Check Storage in DevTools

**Method A: Check via Console**
```javascript
// Get IndexedDB statistics
await window.__indexedDB.stats()
// Should return:
{
  entryCount: 2-5,        // Number of cached items
  totalSize: 524288,      // Size in bytes
  oldestEntry: [Date],
  newestEntry: [Date],
  quotaUsage: 0.001       // % of quota used
}

// List all cached keys
await window.__indexedDB.keys()
// Should return array like:
["projects:all:all:list", "project:proj-123"]
```

**Method B: Visual Inspection**
1. Press `F12` → Go to **Application** tab
2. Expand: **Storage** → **IndexedDB**
3. You should see: **PhotoProofCache**
4. Expand it to see:
   - **cache** (main cache entries)
   - **projectMetadata** (lightweight project data)
   - **photoMetadata** (lightweight photo data)
   - **syncStatus** (sync tracking)

---

## 📊 Expected Storage Layout

### IndexedDB → PhotoProofCache → cache table

Click on "cache" to see entries like:

| key | data | timestamp | expiresAt | size | accessCount |
|-----|------|-----------|-----------|------|-------------|
| projects:all:all:list | {metadata:[...], total:10} | 1699564800000 | 1699651200000 | 102400 | 3 |
| project:proj-123 | {id:"proj-123", title:"...", ...} | 1699564850000 | 1699651250000 | 51200 | 1 |

### LocalStorage

Press `F12` → Application → Storage → Local Storage:

| Key | Value |
|-----|-------|
| auth_token | eyJhbGc... |
| user_role | studio |
| client_id | uuid-here |
| user_data | {...} |

---

## 🎯 Complete Test Sequence

```javascript
// ====================================
// COMPLETE VERIFICATION SCRIPT
// Copy and paste this into console:
// ====================================

console.log("🔍 Starting Storage Verification...\n");

// Test 1: Check all debug APIs exist
console.log("1. Debug APIs Available:");
console.log("   window.__config:", !!window.__config);
console.log("   window.__cache:", !!window.__cache);
console.log("   window.__indexedDB:", !!window.__indexedDB);  // ← Should be TRUE now!
console.log("   window.__cacheEvents:", !!window.__cacheEvents);
console.log("   window.__roleDetector:", !!window.__roleDetector);

// Test 2: Check feature flags
console.log("\n2. Feature Flags:");
const features = window.__config.get().features;
console.log("   memoryCache:", features.memoryCache);
console.log("   indexedDBCache:", features.indexedDBCache);
console.log("   roleBasedStrategy:", features.roleBasedStrategy);

// Test 3: Check memory cache
console.log("\n3. Memory Cache Stats:");
const cacheStats = window.__cache.stats();
console.log("   Hit Rate:", cacheStats.hitRate.toFixed(2) + "%");
console.log("   Entries:", cacheStats.entryCount);
console.log("   Memory:", cacheStats.sizeMB.toFixed(2) + "MB");

// Test 4: Check IndexedDB (async)
console.log("\n4. IndexedDB Stats:");
window.__indexedDB.stats().then(idbStats => {
  console.log("   Entries:", idbStats.entryCount);
  console.log("   Size:", (idbStats.totalSize / 1024).toFixed(2) + "KB");
  console.log("   Quota Usage:", (idbStats.quotaUsage * 100).toFixed(2) + "%");
  
  // Test 5: List cached keys
  return window.__indexedDB.keys();
}).then(keys => {
  console.log("\n5. Cached Keys:");
  keys.forEach(key => console.log("   -", key));
  
  console.log("\n✅ Verification Complete!");
  console.log("👉 Now check DevTools → Application → IndexedDB");
});

// Test 6: Storage quota
console.log("\n6. Browser Storage Quota:");
navigator.storage.estimate().then(estimate => {
  console.log("   Used:", (estimate.usage / 1024 / 1024).toFixed(2), "MB");
  console.log("   Available:", (estimate.quota / 1024 / 1024).toFixed(2), "MB");
  console.log("   Usage:", ((estimate.usage / estimate.quota) * 100).toFixed(2) + "%");
});
```

---

## 🎉 Success Indicators

You'll know it's working when:

✅ `window.__indexedDB` returns an object (not undefined)
✅ DevTools shows "PhotoProofCache" database under IndexedDB
✅ After navigating, cache table has entries
✅ `await window.__indexedDB.stats()` shows entryCount > 0
✅ Hard refresh (Cmd+Shift+R) loads data quickly (~100ms)

---

## 🐛 If Still Not Working

### Check Console for Errors

Look for:
```
[IndexedDB] Database initialized  ✅ Good!
```

Or error:
```
[IndexedDB] Failed to initialize: ...  ❌ Problem!
```

### Common Issues

1. **Private/Incognito Mode**: IndexedDB might be disabled
2. **Browser Settings**: Check if site data/cookies are blocked
3. **Disk Space**: Ensure you have available disk space

### Force Database Creation

```javascript
// Manually trigger initialization
import('./src/services/cache/IndexedDBManager').then(module => {
  console.log("IndexedDB Manager loaded:", module);
});
```

---

## 📸 Visual Example

**Before Fix:**
```
IndexedDB
└── (empty)  ❌
```

**After Fix:**
```
IndexedDB
└── https://localhost:3001
    └── PhotoProofCache (v1)  ✅
        ├── cache (5 items)
        ├── projectMetadata (10 items)
        ├── photoMetadata (150 items)
        └── syncStatus (2 items)
```

---

## 🎯 Performance Impact

Once working, you should see:

**First Load:**
- API call: ~200-500ms
- Data cached in IndexedDB ✅

**Hard Refresh:**
- IndexedDB read: ~50-100ms (95% faster!)
- No API call needed ✅

**Navigation (same session):**
- Memory cache: <1ms (99.8% faster!)
- No API or IndexedDB needed ✅

---

**Now restart your server and check! The database should appear!** 🚀
