Complete Storage Architecture

Storage Layers (What Data Goes Where)

│ Layer 1: Memory Cache (RAM) │
│ - Lives: In JavaScript heap memory │
│ - Data: Projects, Photos (full objects) │
│ - Size: 150-500MB │
│ - TTL: 5 minutes │
│ - Access: <1ms │
│ - Survives: Same session only │
│ - Check: window.\_\_cache.stats() │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ Layer 2: IndexedDB (Disk Storage) │
│ - Lives: Browser's IndexedDB (F12 → Application → IndexedDB)│
│ - Database: "PhotoProofCache" │
│ - Data: Projects, Photos, Metadata │
│ - Size: Up to browser limit (GBs) │
│ - TTL: 24 hours │
│ - Access: 50-100ms │
│ - Survives: Page refresh, browser restart │
│ - Check: await window.\_\_indexedDB.stats() │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ Layer 3: LocalStorage (Small Config) │
│ - Lives: F12 → Application → Local Storage │
│ - Data: auth_token, user_role, client_id │
│ - Size: ~10MB limit │
│ - TTL: Forever (until cleared) │
│ - Access: <1ms │
│ - Survives: Everything │
│ - Check: localStorage.getItem('auth_token') │
└─────────────────────────────────────────────────────────────┘

──────────────────────────────────────────

🎯 Expected Storage Contents

LocalStorage (F12 → Application → Local Storage)

javascript
{/ Should contain:
"auth_token": "eyJhbGc...", // JWT token
"user_role": "studio", // or "client"
"client_id": "uuid-here", // if client user
"user_data": "{...}" // serialized user object
}

Verification Command:

javascript
Object.keys(localStorage).forEach(key => {
console.log(key, localStorage.getItem(key)?.substring(0, 50));
});

──────────────────────────────────────────

IndexedDB → PhotoProofCache (Currently MISSING!)

Expected Database Structure:

├── cache (Table) - Main cache entries
│ ├── key: "projects:all:all:list"
│ ├── key: "projects:all:all:full"
│ ├── key: "photos:project-123"
│ └── key: "project:project-123"
│
├── projectMetadata (Table) - Lightweight project data
│ ├── id: "project-123"
│ ├── id: "project-456"
│ └── id: "project-789"
│
├── photoMetadata (Table) - Lightweight photo data
│ ├── id: "photo-001"
│ ├── id: "photo-002"
│ └── id: "photo-003"
│
└── syncStatus (Table) - Sync tracking
├── key: "projects:lastSync"
└── key: "photos:lastSync"

Sample Data in "cache" Table:

javascript
{/ Entry 1: Projects list (mode=list)
key: "projects:all:all:list",
data: {
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
},
// ... more projects
],
total: 100
},
timestamp: 1699564800000,
expiresAt: 1699651200000, // 24 hours later
size: 102400, // ~100KB
accessCount: 5,
lastAccessTime: 1699565000000,
version: 1
}

// Entry 2: Single project (mode=full)
{
key: "project:proj-123",
data: {
id: "proj-123",
title: "Wedding - Smith",
// ... all project fields
folders: [...],
photos: [...]
},
timestamp: 1699564800000,
expiresAt: 1699651200000,
size: 51200, // ~50KB
accessCount: 3,
lastAccessTime: 1699565000000,
version: 1
}

──────────────────────────────────────────

🔧 Verification Commands

Step 1: Check if IndexedDB is Available

javascript
console.log("IndexedDB available:", 'indexedDB' in window);
// Should return: true

console.log("window.**indexedDB exists:", !!window.**indexedDB);
// Should return: true (if initialized)
// Currently returns: false (NOT INITIALIZED!)

──────────────────────────────────────────

Step 2: Check Feature Flags

javascript
window.\_\_config.get().features.indexedDBCache
// Should return: true

// Check all features
window.\_\_config.get().features
// Should return:
{
memoryCache: true,
indexedDBCache: true, // ← Should be true
roleBasedStrategy: true,
prefetching: false,
virtualScrolling: false
}

──────────────────────────────────────────

Step 3: Check Memory Cache

javascript
window.\_\_cache.stats() work even without IndexedDB
// Should return:
{
hits: 0, // Increases after navigation
misses: 0, // Increases on first load
sets: 0,
evictions: 0,
hitRate: 0,
sizeMB: 0,
maxSizeMB: 150, // or 250 for studio
utilizationPercent: 0,
entryCount: 0
}

──────────────────────────────────────────

Step 4: Check IndexedDB (After Fix)

javascript
await window.\_\_indexedDB.stats()reload:
// Should return:
{
entryCount: 5, // Number of cached items
totalSize: 524288, // ~512KB
oldestEntry: Date,
newestEntry: Date,
quotaUsage: 0.001 // 0.1% of quota used
}

// List all cached keys
await window.\_\_indexedDB.keys()
// Should return:
["projects:all:all:list", "project:proj-123", "photos:proj-123"]

// Get specific entry
await window.\_\_indexedDB.get("projects:all:all:list")
// Should return: Full cached data object

──────────────────────────────────────────

Step 5: Check Storage Quota

javascript
navigator.storage.estimate().then(estimate => {
console.log("Storage Used:", (estimate.usage / 1024 / 1024).toFixed(2),
"MB");
console.log("Storage Quota:", (estimate.quota / 1024 / 1024).toFixed(2),
"MB");
console.log("Usage:", ((estimate.usage / estimate.quota) \* 100).toFixed(2),
"%");
});
