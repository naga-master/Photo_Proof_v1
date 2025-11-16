# Phase 3: OPFS Cache + Unified Manager - Overview

## Purpose

Provide fast, persistent image caching with large storage capacity for offline availability.

## Components

### Frontend Services
- **opfsCacheService.ts** - Origin Private File System cache
- **unifiedCacheManager.ts** - Multi-tier cache coordinator

### Existing Integrations
- **MemoryCacheManager.ts** - L1: Memory cache (already exists)
- **IndexedDBManager.ts** - L2: IndexedDB cache (already exists)

## Architecture

```
┌─────────────────────────────────────┐
│  User Requests Image                 │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  L1: Memory Cache (fastest)          │
│  - 300-500MB capacity                │
│  - Volatile (lost on refresh)        │
│  - <1ms access time                  │
└──────────────┬──────────────────────┘
               │ MISS
               ▼
┌─────────────────────────────────────┐
│  L2: IndexedDB (fast + persistent)   │
│  - 50-100MB capacity                 │
│  - Survives refresh                  │
│  - <10ms access time                 │
└──────────────┬──────────────────────┘
               │ MISS
               ▼
┌─────────────────────────────────────┐
│  L3: OPFS (large + persistent)       │
│  - 1GB+ capacity                     │
│  - Survives refresh                  │
│  - <50ms access time                 │
└──────────────┬──────────────────────┘
               │ MISS
               ▼
┌─────────────────────────────────────┐
│  L4: Service Worker (network cache)  │
│  - 500MB capacity                    │
│  - HTTP caching                      │
└──────────────┬──────────────────────┘
               │ MISS
               ▼
┌─────────────────────────────────────┐
│  L5: Network (slowest)               │
│  - Fetch from server                 │
│  - Populate all cache tiers          │
└─────────────────────────────────────┘
```

## Features

### OPFS Cache
- Large storage capacity (1GB+)
- Persistent across browser sessions
- File system API for efficient storage
- Automatic quota management
- LRU eviction when full
- Organized directory structure

### Unified Cache Manager
- Coordinates all cache tiers
- Waterfall lookup (fastest → slowest)
- Automatic promotion (lower tier → higher tier)
- Unified API for all operations
- Cache statistics tracking
- Prefetching support

## Configuration

```typescript
// Enable in config
features: {
  opfsCache: true,
}

// Tune settings
opfs: {
  maxSizeMB: 1000,              // 1GB
  evictionStrategy: 'lru',       // Least Recently Used
  evictionThresholdPercent: 90,  // Cleanup at 90%
  
  cleanup: {
    evictPercentOnYellow: 25,    // Remove 25% at yellow zone
    evictPercentOnRed: 50,       // Remove 50% at red zone
  }
}
```

## Usage

### Unified Cache Manager

```typescript
import { unifiedCacheManager } from './services/unifiedCacheManager';

// Get image (waterfall through all tiers)
const url = await unifiedCacheManager.get(photoId, 'high');

if (!url) {
  // Not in cache, fetch from network
  const response = await fetch(`/v2/photos/${photoId}/variant/high`);
  const blob = await response.blob();
  
  // Store in all cache tiers
  await unifiedCacheManager.set(photoId, 'high', blob);
  
  url = URL.createObjectURL(blob);
}

// Display image
imgElement.src = url;
```

### OPFS Cache (Direct Access)

```typescript
import { opfsCacheService } from './services/opfsCacheService';

// Store
await opfsCacheService.set(photoId, 'high', blob);

// Retrieve
const blob = await opfsCacheService.get(photoId, 'high');

// Delete
await opfsCacheService.delete(photoId, 'high');

// Check storage
const { usage, quota, percent } = await opfsCacheService.getStorageEstimate();
console.log(`Using ${percent.toFixed(1)}% of ${quota / 1024 / 1024 / 1024}GB`);
```

### Prefetching

```typescript
// Prefetch single image
await unifiedCacheManager.prefetch('photo-123', 'high');

// Prefetch batch
await unifiedCacheManager.prefetchBatch([
  { photoId: 'photo-123', quality: 'high' },
  { photoId: 'photo-124', quality: 'high' },
  { photoId: 'photo-125', quality: 'high' },
]);
```

## Browser Compatibility

| Feature | Chrome | Edge | Safari | Firefox |
|---------|--------|------|--------|---------|
| OPFS | ✅ 102+ | ✅ 102+ | ❌ No | ❌ No |
| IndexedDB | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes |
| Memory Cache | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes |

**Graceful Degradation:** If OPFS not available, system falls back to IndexedDB + Memory cache.

## Performance Targets

| Metric | Target | Notes |
|--------|--------|-------|
| Cache Hit Rate | >90% | After first page load |
| Memory Access | <1ms | Instant |
| IndexedDB Access | <10ms | Fast |
| OPFS Access | <50ms | Still fast |
| Storage Capacity | 1GB+ | OPFS |
| Offline Availability | 100% | Cached images |

## Storage Quotas

```typescript
// Quota zones
opfs: {
  quotas: {
    greenZonePercent: 70,   // Normal operation
    yellowZonePercent: 80,  // Soft cleanup (remove 25%)
    redZonePercent: 90,     // Aggressive cleanup (remove 50%)
  }
}
```

## See Also

- [TESTING.md](./TESTING.md) - Comprehensive testing guide
- [VALIDATION.md](./VALIDATION.md) - Validation checklist
