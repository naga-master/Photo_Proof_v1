# Stage 2: Memory Cache - Architecture

## Overview

Stage 2 adds in-memory caching with TTL expiration and LRU eviction on top of Stage 1's foundation.

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│                    Components                           │
│             (React Components)                          │
└────────────────────┬────────────────────────────────────┘
                     │
                     │ Subscribe & Call Actions
                     ↓
┌─────────────────────────────────────────────────────────┐
│                  Zustand Stores                         │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐  │
│  │ PhotoStore   │  │ ProjectStore │  │MetadataStore│  │
│  │              │  │              │  │             │  │
│  │ + Memory     │  │ + Memory     │  │ + Memory    │  │
│  │   Cache      │  │   Cache      │  │   Cache     │  │
│  └──────────────┘  └──────────────┘  └─────────────┘  │
└────────────────────┬────────────────────────────────────┘
                     │
                     │ Check Cache Before API
                     ↓
┌─────────────────────────────────────────────────────────┐
│            Memory Cache Manager                         │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Cache Storage: Map<string, CacheEntry>         │  │
│  │  - TTL: 5 minutes (configurable)                │  │
│  │  - LRU eviction for studio users                │  │
│  │  - Unlimited cache for client users             │  │
│  │  - Size tracking and limits                     │  │
│  └──────────────────────────────────────────────────┘  │
└────────────────────┬────────────────────────────────────┘
                     │
                     │ On Cache Miss
                     ↓
┌─────────────────────────────────────────────────────────┐
│                  API Services                           │
│            (photoService, projectService)               │
└────────────────────┬────────────────────────────────────┘
                     │
                     │ HTTP Requests
                     ↓
┌─────────────────────────────────────────────────────────┐
│                  Backend API                            │
│         FastAPI (Python) + SQLite                       │
└─────────────────────────────────────────────────────────┘

        Role Detection & Profile Loading
┌─────────────────────────────────────────────────────────┐
│              Role Detector                              │
│  - Detects: client vs studio                           │
│  - Loads: appropriate cache profile                    │
│  - Triggers: profile.loaded event                      │
└─────────────────────────────────────────────────────────┘
```

---

## Components

### 1. Memory Cache Manager

**File:** `src/services/cache/MemoryCacheManager.ts`

**Data Structure:**
```typescript
interface CacheEntry<T> {
  key: string;              // Cache key
  data: T;                  // Cached data
  timestamp: number;        // When cached
  expiresAt: number;        // Expiration time
  size: number;             // Estimated size
  accessCount: number;      // Access counter
  lastAccessTime: number;   // Last access
  pinned?: boolean;         // Prevent eviction
}
```

**Key Features:**
- TTL-based expiration (default: 5 minutes)
- LRU eviction (studio users only)
- Memory usage tracking
- Eviction scoring algorithm
- Event emission for all operations

**Eviction Algorithm (Studio Users):**
```
Score = (lastAccess × 40%) + (frequency × 30%) + (size × 20%) + (pinned × 10%)

Where:
- lastAccess: How recently accessed (newer = higher)
- frequency: Access count (more = higher)
- size: Entry size (smaller = higher)
- pinned: Protected flag (pinned = highest)

Lower score = Evicted first
Higher score = Kept longer
```

---

### 2. Role Detector

**File:** `src/services/auth/RoleDetector.ts`

**Purpose:** Determine user role and load appropriate cache profile

**Detection Logic:**
```typescript
// From auth data
if (user.role === 'client') → Client Profile
if (user.role === 'studio') → Studio Profile

// Auto-detect from project count
if (projectCount < 20) → Client Profile
if (projectCount >= 20) → Studio Profile
```

**Cache Profiles:**

**Client Profile:**
- `maxProjects`: -1 (unlimited)
- `maxMemoryMB`: 300
- `prefetchStrategy`: 'aggressive'
- No LRU eviction

**Studio Profile:**
- `maxActiveProjects`: 10 (LRU limit)
- `maxMemoryMB`: 500
- `prefetchStrategy`: 'conservative'
- LRU eviction enabled
- 30-minute idle timeout

---

### 3. Store Integration

**PhotoStore Changes:**
```typescript
// Before (Stage 1)
async fetchProjectPhotos(projectId) {
  const response = await photoService.getProjectPhotos(projectId);
  // Update store
}

// After (Stage 2)
async fetchProjectPhotos(projectId) {
  const cacheKey = `photos:${projectId}`;
  
  // Check memory cache first
  const cached = memoryCacheManager.get(cacheKey);
  if (cached) return cached; // Cache hit!
  
  // Cache miss - fetch from API
  const response = await photoService.getProjectPhotos(projectId);
  
  // Store in memory cache
  memoryCacheManager.set(cacheKey, response);
  
  // Update store
}
```

Same pattern applied to:
- PhotoStore.getPhoto()
- ProjectStore.fetchProjects()
- ProjectStore.fetchProject()

---

## Cache Flow

### Cache Hit Flow

```
1. Component calls fetchProjectPhotos(projectId)
   ↓
2. Store checks memory cache
   ↓
3. CACHE HIT → Data exists and not expired
   ↓
4. Update access statistics
   ↓
5. Emit CACHE_HIT event
   ↓
6. Return data immediately (<1ms)
   ↓
7. Component re-renders with data
```

### Cache Miss Flow

```
1. Component calls fetchProjectPhotos(projectId)
   ↓
2. Store checks memory cache
   ↓
3. CACHE MISS → Data doesn't exist or expired
   ↓
4. Emit CACHE_MISS event
   ↓
5. Emit API_CALL_START event
   ↓
6. Call photoService.getProjectPhotos()
   ↓
7. API returns data (200-500ms)
   ↓
8. Emit API_CALL_SUCCESS event
   ↓
9. Store in memory cache
   ↓
10. Emit CACHE_SET event
   ↓
11. Update store state
   ↓
12. Component re-renders with data
```

### Eviction Flow (Studio Users)

```
1. New cache entry would exceed memory limit
   ↓
2. Calculate eviction scores for all entries
   ↓
3. Sort by score (lowest first)
   ↓
4. Evict entries until space available
   ↓
5. Emit CACHE_EVICT event for each
   ↓
6. Add new entry
```

---

## Performance Characteristics

### Cache Hit Performance

- **Lookup time:** <1ms
- **Data retrieval:** 0ms (in-memory)
- **Component re-render:** ~1-5ms
- **Total:** <10ms

### Cache Miss Performance

- **Cache lookup:** <1ms
- **API call:** 200-500ms
- **Cache storage:** <1ms
- **Component re-render:** ~1-5ms
- **Total:** 200-500ms

### Memory Usage

**Client Users:**
- Typical: 100-200MB
- Maximum: 300MB (configurable)
- No eviction (until TTL expires)

**Studio Users:**
- Typical: 200-400MB
- Maximum: 500MB (configurable)
- LRU eviction when 10+ projects

---

## Configuration

All behavior controlled by `config/cache-strategy.config.ts`:

```typescript
{
  // TTL settings
  ttl: {
    memoryMs: 5 * 60 * 1000,  // 5 minutes
  },
  
  // Role profiles
  profiles: {
    client: {
      maxProjects: -1,
      maxMemoryMB: 300,
      prefetchStrategy: 'aggressive',
    },
    studio: {
      maxActiveProjects: 10,
      maxMemoryMB: 500,
      prefetchStrategy: 'conservative',
      idleTimeoutMinutes: 30,
    },
  },
  
  // Eviction scoring
  eviction: {
    studio: {
      idleTimeoutMinutes: 30,
      lruSlots: 10,
      scoringWeights: {
        lastAccess: 40,
        frequency: 30,
        size: 20,
        pinned: 10,
      },
    },
  },
  
  // Feature flag
  features: {
    memoryCache: true,  // Enable Stage 2
  },
}
```

---

## Event Tracking

All cache operations emit events:

**Cache Operations:**
- `cache.hit` - Cache hit from memory
- `cache.miss` - Cache miss
- `cache.set` - Data stored in cache
- `cache.evict` - Entry evicted

**Role Detection:**
- `role.detected` - User role detected
- `profile.loaded` - Cache profile loaded

**Example Event:**
```javascript
{
  type: 'cache.hit',
  timestamp: 1699564800000,
  operationId: 'abc-123',
  metadata: {
    source: 'memory',
    key: 'photos:project-123',
    accessCount: 5,
  }
}
```

---

## Benefits

### Performance

- ✅ 80-95% fewer API calls (after warmup)
- ✅ <1ms navigation (from memory)
- ✅ Instant page transitions
- ✅ No loading spinners after initial load

### User Experience

- ✅ Instant navigation
- ✅ No re-fetching on page changes
- ✅ Smooth, responsive interface
- ✅ Reduced bandwidth usage

### Developer Experience

- ✅ Observable cache operations (events)
- ✅ Configurable behavior
- ✅ Debugging tools (window.__cache)
- ✅ Hot-reload configuration

---

## Limitations

### Stage 2 Does NOT Provide

- ❌ Persistence (data lost on page refresh)
- ❌ Offline support
- ❌ Cross-session caching
- ❌ Image caching

These are addressed in Stage 3 (Persistence).

---

## Testing

See: `TESTING_GUIDE.md` for complete testing procedures.

**Quick Test:**
```javascript
// Check cache is working
window.__cache.stats()

// Navigate around app
// Check hit rate increases
window.__cache.stats().hitRate
// Should be 80-95% after navigation
```

---

## Next: Stage 3

Stage 3 adds IndexedDB for persistent storage, addressing Stage 2's limitations.
