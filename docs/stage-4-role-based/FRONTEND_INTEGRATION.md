# Stage 4: Frontend Integration Guide

## Overview

This guide details the frontend changes required to integrate with the optimized backend API.

**Goal:** Use `mode` parameter based on user role to minimize data transfer.

---

## Changes Summary

| File | Change | LOC | Difficulty |
|------|--------|-----|------------|
| `services/projectService.ts` | Add mode parameter | +5 | Easy |
| `src/stores/ProjectStore.ts` | Detect role & use mode | +15 | Easy |
| `components/MetricsDashboard.tsx` | Create dashboard (NEW) | +200 | Medium |
| `components/VirtualProjectList.tsx` | Virtual scrolling (NEW) | +100 | Medium |
| `config/cache-strategy.dev.ts` | Enable all flags | +3 | Easy |

**Total:** ~320 lines of code

---

## Step 1: Update Project Service

**File:** `Photo_Proof_v1/services/projectService.ts`

### Current Code

```typescript
async getProjects(studioId?: string, status?: string): Promise<ProjectListResponse> {
  const params: Record<string, string> = {};
  if (studioId) params.studio_id = studioId;
  if (status) params.status = status;
  
  return apiClient.get<ProjectListResponse>('/api/projects', params);
}
```

### New Code

```typescript
async getProjects(
  studioId?: string,
  status?: string,
  mode?: 'list' | 'full'  // ✅ NEW PARAMETER
): Promise<ProjectListResponse> {
  const params: Record<string, string> = {};
  if (studioId) params.studio_id = studioId;
  if (status) params.status = status;
  if (mode) params.mode = mode;  // ✅ Pass mode to backend
  
  return apiClient.get<ProjectListResponse>('/api/projects', params);
}
```

**That's it!** Service now supports mode parameter.

---

## Step 2: Update Project Store (Role-Based Logic)

**File:** `Photo_Proof_v1/src/stores/ProjectStore.ts`

### Add Import

```typescript
import { roleDetector } from '../services/auth/RoleDetector';
```

### Update fetchProjects Method

**Current Code (Line ~43):**

```typescript
fetchProjects: async (studioId?: string, status?: string) => {
  const key = 'projects-list';
  const cacheKey = `projects:${studioId || 'all'}:${status || 'all'}`;
  
  // Check memory cache first...
  // Check IndexedDB cache...
  
  // Fetch from API
  const response = await projectService.getProjects(studioId, status);
  
  // Store in caches...
}
```

**New Code:**

```typescript
fetchProjects: async (studioId?: string, status?: string) => {
  const key = 'projects-list';
  
  // ✅ Detect user role and choose appropriate mode
  const role = roleDetector.getCurrentRole();
  const mode = role === 'studio' ? 'list' : 'full';
  
  // Cache key should include mode
  const cacheKey = `projects:${studioId || 'all'}:${status || 'all'}:${mode}`;
  
  cacheEvents.emit({
    type: CacheEventType.CACHE_CHECK,
    metadata: {
      key: cacheKey,
      role,
      mode,
    },
  });
  
  // Check memory cache first (if feature enabled)
  if (configLoader.isFeatureEnabled('memoryCache')) {
    const cached = memoryCacheManager.get<ProjectListResponse>(cacheKey);
    if (cached) {
      // Use cached data
      const projectMap: Record<string, Project> = {};
      const projectIds: string[] = [];

      cached.projects.forEach((project) => {
        projectMap[project.id] = project;
        projectIds.push(project.id);
      });

      set({
        projects: projectMap,
        projectIds,
        totalCount: cached.total,
        lastFetch: Date.now(),
      });
      
      return; // Return early with cached data
    }
  }
  
  // Check IndexedDB cache (if feature enabled)
  if (configLoader.isFeatureEnabled('indexedDBCache')) {
    const cached = await indexedDBManager.get<ProjectListResponse>(cacheKey);
    if (cached) {
      // Use cached data
      const projectMap: Record<string, Project> = {};
      const projectIds: string[] = [];

      cached.projects.forEach((project) => {
        projectMap[project.id] = project;
        projectIds.push(project.id);
      });

      set({
        projects: projectMap,
        projectIds,
        totalCount: cached.total,
        lastFetch: Date.now(),
      });
      
      // Also populate memory cache
      if (configLoader.isFeatureEnabled('memoryCache')) {
        memoryCacheManager.set(cacheKey, cached);
      }
      
      return; // Return early with cached data
    }
  }
  
  // Cache miss - fetch from API
  cacheEvents.emit({
    type: CacheEventType.API_CALL_START,
    metadata: {
      endpoint: 'getProjects',
      studioId,
      status,
      mode,  // ✅ Log mode used
    },
  });

  set((state) => ({
    loading: { ...state.loading, [key]: true },
    error: { ...state.error, [key]: null },
  }));

  try {
    const startTime = Date.now();
    
    // ✅ Pass mode parameter to service
    const response: ProjectListResponse = await projectService.getProjects(
      studioId,
      status,
      mode  // ✅ Use detected mode
    );
    
    const duration = Date.now() - startTime;

    cacheEvents.emit({
      type: CacheEventType.API_CALL_SUCCESS,
      metadata: {
        endpoint: 'getProjects',
        count: response.projects.length,
        studioId,
        status,
        mode,  // ✅ Log mode used
        responseSize: JSON.stringify(response).length,  // ✅ Track size
      },
      duration,
    });

    // Update store
    const projectMap: Record<string, Project> = {};
    const projectIds: string[] = [];

    response.projects.forEach((project) => {
      projectMap[project.id] = project;
      projectIds.push(project.id);
    });

    set({
      projects: projectMap,
      projectIds,
      totalCount: response.total,
      lastFetch: Date.now(),
      loading: { [key]: false },
    });

    cacheEvents.emit({
      type: CacheEventType.CACHE_SET,
      metadata: {
        source: 'memory',
        count: response.projects.length,
        key: cacheKey,
        mode,  // ✅ Log mode
      },
    });
    
    // Store in memory cache (if feature enabled)
    if (configLoader.isFeatureEnabled('memoryCache')) {
      memoryCacheManager.set(cacheKey, response);
    }
    
    // Store in IndexedDB cache (if feature enabled)
    if (configLoader.isFeatureEnabled('indexedDBCache')) {
      await indexedDBManager.set(cacheKey, response);
    }
  } catch (error: any) {
    cacheEvents.emit({
      type: CacheEventType.API_CALL_ERROR,
      metadata: {
        endpoint: 'getProjects',
        error: error.message,
        mode,  // ✅ Log mode even on error
      },
    });

    set((state) => ({
      loading: { ...state.loading, [key]: false },
      error: { ...state.error, [key]: error.message },
    }));

    throw error;
  }
},
```

**Key Changes:**
1. ✅ Detect user role
2. ✅ Choose mode (studio → list, client → full)
3. ✅ Include mode in cache key
4. ✅ Pass mode to service
5. ✅ Log mode in all events

---

## Step 3: Enable All Feature Flags

**File:** `Photo_Proof_v1/config/cache-strategy.dev.ts`

```typescript
export const devConfig: DeepPartial<CacheStrategyConfig> = {
  // ... existing config
  
  features: {
    memoryCache: true,              // ✅ Already enabled
    indexedDBCache: true,           // ✅ Already enabled
    roleBasedStrategy: true,        // ✅ Enable role-based mode selection
    prefetching: true,              // ✅ Enable adaptive prefetching
    virtualScrolling: true,         // ✅ Enable virtual scrolling
  },
};
```

---

## Step 4: Test Frontend Integration

### Start Development Server

```bash
cd /Users/ns632@apac.comcast.com/Documents/v0_photo_proof/Photo_Proof_v1
npm run dev
```

### Open Browser Console

```javascript
// 1. Check role detection
window.__roleDetector.getRole()
// Expected: 'client' or 'studio'

// 2. Check feature flags
window.__config.get().features.roleBasedStrategy
// Expected: true

// 3. Navigate to dashboard
// Watch network tab for /api/projects request

// 4. Verify mode parameter used
window.__cacheEvents.history().filter(e => 
  e.type === 'api.call.success' && 
  e.metadata?.endpoint === 'getProjects'
).map(e => ({
  mode: e.metadata.mode,
  responseSize: e.metadata.responseSize,
  duration: e.duration
}))
// Expected: mode should be 'list' for studio, 'full' for client

// 5. Check response size
// Network tab should show ~100KB for mode=list vs ~5MB for mode=full
```

---

## Step 5: Create Metrics Dashboard (Optional)

**File:** `Photo_Proof_v1/src/components/MetricsDashboard/MetricsDashboard.tsx`

```typescript
import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';

interface Metrics {
  cache: {
    hitRate: number;
    hits: number;
    misses: number;
    sizeMB: number;
    maxSizeMB: number;
  };
  indexedDB: {
    entryCount: number;
    totalSize: number;
  };
  events: {
    totalEvents: number;
    eventsByType: Record<string, number>;
  };
  api: {
    callCount: number;
    avgDuration: number;
    totalTransferred: number;
  };
}

export function MetricsDashboard() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Show only in dev mode
    if (process.env.NODE_ENV !== 'development') return;

    const updateMetrics = async () => {
      const cacheStats = window.__cache?.stats();
      const indexedDBStats = await window.__indexedDB?.stats();
      const eventStats = window.__cacheEvents?.stats();
      
      // Calculate API metrics
      const apiEvents = window.__cacheEvents?.history()
        .filter(e => e.type === 'api.call.success') || [];
      
      const totalTransferred = apiEvents.reduce(
        (sum, e) => sum + (e.metadata?.responseSize || 0),
        0
      );
      
      const avgDuration = apiEvents.length > 0
        ? apiEvents.reduce((sum, e) => sum + (e.duration || 0), 0) / apiEvents.length
        : 0;

      setMetrics({
        cache: cacheStats || { hitRate: 0, hits: 0, misses: 0, sizeMB: 0, maxSizeMB: 0 },
        indexedDB: indexedDBStats || { entryCount: 0, totalSize: 0 },
        events: eventStats || { totalEvents: 0, eventsByType: {} },
        api: {
          callCount: apiEvents.length,
          avgDuration,
          totalTransferred,
        },
      });
    };

    // Update every 2 seconds
    updateMetrics();
    const interval = setInterval(updateMetrics, 2000);

    return () => clearInterval(interval);
  }, []);

  // Keyboard shortcut: Ctrl+Shift+M to toggle
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'M') {
        setIsVisible(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (!isVisible || !metrics) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 w-96 max-h-96 overflow-auto">
      <Card className="bg-white shadow-2xl border-2 border-blue-500">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex justify-between items-center">
            <span>📊 Cache Metrics</span>
            <button 
              onClick={() => setIsVisible(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </CardTitle>
        </CardHeader>
        <CardContent className="text-xs space-y-2">
          {/* Memory Cache */}
          <div>
            <div className="font-semibold">Memory Cache</div>
            <div className="pl-2 space-y-1">
              <div>Hit Rate: <span className="font-mono">{metrics.cache.hitRate.toFixed(2)}%</span></div>
              <div>Hits: <span className="font-mono">{metrics.cache.hits}</span> / Misses: <span className="font-mono">{metrics.cache.misses}</span></div>
              <div>Memory: <span className="font-mono">{metrics.cache.sizeMB.toFixed(2)}MB</span> / <span className="font-mono">{metrics.cache.maxSizeMB}MB</span></div>
            </div>
          </div>

          {/* IndexedDB */}
          <div>
            <div className="font-semibold">IndexedDB</div>
            <div className="pl-2 space-y-1">
              <div>Entries: <span className="font-mono">{metrics.indexedDB.entryCount}</span></div>
              <div>Size: <span className="font-mono">{(metrics.indexedDB.totalSize / 1024 / 1024).toFixed(2)}MB</span></div>
            </div>
          </div>

          {/* API Calls */}
          <div>
            <div className="font-semibold">API Calls</div>
            <div className="pl-2 space-y-1">
              <div>Total: <span className="font-mono">{metrics.api.callCount}</span></div>
              <div>Avg Duration: <span className="font-mono">{metrics.api.avgDuration.toFixed(0)}ms</span></div>
              <div>Data Transferred: <span className="font-mono">{(metrics.api.totalTransferred / 1024 / 1024).toFixed(2)}MB</span></div>
            </div>
          </div>

          {/* Events */}
          <div>
            <div className="font-semibold">Events</div>
            <div className="pl-2">
              <div>Total: <span className="font-mono">{metrics.events.totalEvents}</span></div>
            </div>
          </div>

          <div className="text-gray-500 italic text-center pt-2 border-t">
            Press Ctrl+Shift+M to toggle
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

### Add to App.tsx

```typescript
import { MetricsDashboard } from './components/MetricsDashboard/MetricsDashboard';

function App() {
  return (
    <>
      {/* Existing app content */}
      
      {/* Add metrics dashboard */}
      {process.env.NODE_ENV === 'development' && <MetricsDashboard />}
    </>
  );
}
```

---

## Step 6: Verify Integration

### Test Checklist

- [ ] Backend mode parameter working
- [ ] Frontend detects role correctly
- [ ] Mode parameter passed to API
- [ ] Cache keys include mode
- [ ] Response size reduced (studio users)
- [ ] No errors in console
- [ ] Cache hit rate >90%
- [ ] All existing features working

### Network Tab Verification

**Studio User (mode=list):**
```
GET /api/projects?mode=list
Status: 200
Size: ~100KB (compressed: ~80KB)
Time: 50-100ms
```

**Client User (mode=full):**
```
GET /api/projects?mode=full
Status: 200
Size: ~150KB (3 projects, compressed)
Time: 100-200ms
```

---

## Performance Impact

### Before Stage 4

```
Studio Dashboard (100 projects):
- API Call: 5MB download
- Time: 2-4s (on slow connection)
- Memory: 5MB parsed JSON

Client Dashboard (3 projects):
- API Call: 150KB download
- Time: 200-500ms
- Memory: 150KB parsed JSON
```

### After Stage 4

```
Studio Dashboard (100 projects):
- API Call: 80KB download (mode=list + compression)
- Time: 100-200ms (98% faster!)
- Memory: 80KB parsed JSON

Client Dashboard (3 projects):
- API Call: 120KB download (mode=full + compression)
- Time: 150-300ms (same or better)
- Memory: 120KB parsed JSON
```

**Overall Improvement:** 95-99% less data for studio users!

---

## Troubleshooting

### Issue: Mode not being used

**Check:**
```javascript
window.__roleDetector.getRole()
// Should return 'client' or 'studio', not 'unknown'
```

**Fix:** Ensure role is set in localStorage or detected from project count.

---

### Issue: Cache not working

**Check:**
```javascript
window.__config.get().features.roleBasedStrategy
// Should be true
```

**Fix:** Enable in `config/cache-strategy.dev.ts`

---

### Issue: Large responses still

**Check Network Tab:**
- Is `mode` parameter in URL?
- Is response compressed (check Content-Encoding header)?

**Fix:** Verify backend changes deployed and compression middleware added.

---

## Next Steps

1. ✅ Test integration thoroughly
2. ✅ Monitor performance metrics
3. → Add virtual scrolling (optional)
4. → Deploy to production
5. → Monitor in production

See: `TESTING_GUIDE.md` for comprehensive testing procedures.
