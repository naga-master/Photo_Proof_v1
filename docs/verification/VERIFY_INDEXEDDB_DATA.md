# IndexedDB Data Verification Guide

## Issue: Can't See Values in DevTools

You're seeing **keys** but not **values** in IndexedDB. This guide helps verify if data is actually stored.

---

## 🔍 Quick Verification (Copy & Paste to Console)

### Test 1: Check if Data Exists

```javascript
// ====================================
// INDEXEDDB DATA VERIFICATION
// ====================================
console.log("🔍 Verifying IndexedDB Data Storage...\n");

// Import Dexie database
import('./src/services/cache/IndexedDBSchema').then(async ({ db }) => {
  
  // Get all entries from cache table
  const entries = await db.cache.toArray();
  
  console.log("📊 Cache Table Statistics:");
  console.log("  Total entries:", entries.length);
  
  if (entries.length === 0) {
    console.warn("⚠️ No entries found! Navigate around the app first.");
    return;
  }
  
  // Check first entry
  const first = entries[0];
  console.log("\n📦 First Entry Structure:");
  console.log("  Key:", first.key);
  console.log("  Timestamp:", new Date(first.timestamp).toLocaleString());
  console.log("  Expires:", new Date(first.expiresAt).toLocaleString());
  console.log("  Size:", (first.size / 1024).toFixed(2), "KB");
  console.log("  Access Count:", first.accessCount);
  
  // CHECK IF DATA EXISTS
  console.log("\n✅ Data Field Analysis:");
  console.log("  Has 'data' field:", !!first.data);
  console.log("  Data type:", typeof first.data);
  console.log("  Data is null:", first.data === null);
  console.log("  Data is undefined:", first.data === undefined);
  
  if (first.data) {
    console.log("  Data keys:", Object.keys(first.data));
    console.log("\n📄 Data Preview (first 500 chars):");
    console.log(JSON.stringify(first.data, null, 2).substring(0, 500) + "...");
  } else {
    console.error("❌ DATA FIELD IS EMPTY! This is a bug!");
  }
  
  // List all keys
  console.log("\n🔑 All Cached Keys:");
  entries.forEach((entry, i) => {
    const hasData = !!entry.data;
    const dataSize = entry.data ? JSON.stringify(entry.data).length : 0;
    console.log(`  ${i + 1}. ${entry.key}`);
    console.log(`     - Has data: ${hasData ? '✅' : '❌'}`);
    console.log(`     - Data size: ${(dataSize / 1024).toFixed(2)} KB`);
  });
  
  console.log("\n✅ Verification Complete!");
});
```

---

## 🎯 Expected Results

### If Data IS Stored (Working):

```
📊 Cache Table Statistics:
  Total entries: 3

📦 First Entry Structure:
  Key: projects:all:all:list
  Timestamp: 11/8/2025, 9:30:00 PM
  Expires: 11/9/2025, 9:30:00 PM
  Size: 98.50 KB
  Access Count: 5

✅ Data Field Analysis:
  Has 'data' field: true
  Data type: object
  Data is null: false
  Data is undefined: false
  Data keys: ["metadata", "total"]

📄 Data Preview:
{
  "metadata": [
    {
      "id": "proj-123",
      "title": "Wedding - Smith",
      "client_id": "client-456",
      ...
    }
  ]
}
```

**✅ This means data IS stored correctly!**

---

### If Data is MISSING (Bug):

```
📊 Cache Table Statistics:
  Total entries: 3

✅ Data Field Analysis:
  Has 'data' field: false
  Data type: undefined
  Data is null: false
  Data is undefined: true

❌ DATA FIELD IS EMPTY! This is a bug!
```

**❌ This means there's a bug in the store integration!**

---

## 🔧 Alternative Verification Methods

### Method 2: Using window.__indexedDB

```javascript
// Get specific cached item
const data = await window.__indexedDB.get("projects:all:all:list");

if (data) {
  console.log("✅ Data exists:", data);
  console.log("Data type:", typeof data);
  console.log("Data keys:", Object.keys(data));
} else {
  console.log("❌ No data found for this key");
}
```

### Method 3: Using DevTools Console

```javascript
// Direct database access
db.cache.get("projects:all:all:list").then(entry => {
  console.log("Full entry:", entry);
  console.log("Data field:", entry?.data);
});
```

### Method 4: List All Keys with Data Status

```javascript
// Check which keys have data
await window.__indexedDB.keys().then(async keys => {
  console.log("Checking", keys.length, "keys...\n");
  
  for (const key of keys) {
    const data = await window.__indexedDB.get(key);
    const hasData = data !== null && data !== undefined;
    const size = hasData ? JSON.stringify(data).length : 0;
    
    console.log(`${key}:`);
    console.log(`  Has data: ${hasData ? '✅' : '❌'}`);
    console.log(`  Size: ${(size / 1024).toFixed(2)} KB`);
  }
});
```

---

## 🐛 Why DevTools Might Not Show Values

### Reason 1: Collapsed Objects (Most Common)

Chrome DevTools collapses nested objects by default. You need to:
1. Click on the key in IndexedDB viewer
2. Look for the **`data`** field
3. Click the **▶** arrow next to it to expand
4. You should see the full object

**Solution:** Look more carefully, or use console commands instead.

---

### Reason 2: Large Objects Truncated

If data is very large (>100KB), DevTools might show:
```
data: Object {…}  ← Click this to expand
```

**Solution:** Use console to view full data:
```javascript
db.cache.toArray().then(all => console.log(all));
```

---

### Reason 3: Data Not Yet Stored

If you just started the app and haven't navigated yet:
- IndexedDB might be empty
- Need to trigger caching first

**Solution:** Navigate around the app first, then check again.

---

### Reason 4: Private/Incognito Mode

Some browsers disable or limit IndexedDB in private mode.

**Solution:** Use regular browser window.

---

## ✅ Confirming Data is Correct

Once you can see data, verify it looks right:

```javascript
const data = await window.__indexedDB.get("projects:all:all:list");

// Should have structure like:
{
  metadata: [
    {
      id: "proj-123",
      title: "Wedding - Smith",
      client_id: "client-456",
      cover_photo_src: "/uploads/thumb.jpg",
      photo_count: 150,
      status: "active",
      created_at: "2025-10-01T10:00:00Z",
      updated_at: "2025-10-20T15:30:00Z"
    }
    // ... more projects
  ],
  total: 100
}
```

**Check:**
- ✅ Has `metadata` array
- ✅ Each project has expected fields
- ✅ `total` matches number of projects
- ✅ Data is recent (check updated_at timestamps)

---

## 🎯 Summary

**If you CAN see data with console commands:**
- ✅ System is working correctly
- ✅ DevTools just doesn't display nested objects well
- ✅ Use `window.__indexedDB.get(key)` instead of visual inspection

**If you CANNOT see data:**
- ❌ Bug in store integration
- ❌ Need to check ProjectStore/PhotoStore code
- ❌ Verify `indexedDBManager.set()` is being called

---

## 🔍 Next Steps

1. **Run Test 1** (copy/paste the big verification script)
2. **Check results** - does data exist?
3. **If YES:** IndexedDB is working, just use console
4. **If NO:** Report bug, we'll investigate store integration

---

**Now run the verification script and tell me what you see!** 🚀
