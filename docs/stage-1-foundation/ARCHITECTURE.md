# Stage 1: Foundation - Architecture

## Overview

Stage 1 establishes the foundational architecture for the caching system:
- **Configuration System**: Central config for all cache behavior
- **Event System**: Observable events for all cache operations
- **Global Stores**: Zustand-based state management replacing scattered useState

**Goal**: Replace direct API calls with store-based architecture, preparing for caching layers.

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                       Components                             │
│  (Gallery, Dashboard, PhotoGrid, etc.)                      │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      │ Subscribe to stores
                      │
┌─────────────────────▼───────────────────────────────────────┐
│                   Global Stores                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ PhotoStore   │  │ ProjectStore │  │MetadataStore │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      │ Call services
                      │
┌─────────────────────▼───────────────────────────────────────┐
│                    Services Layer                            │
│  ┌──────────────┐  ┌──────────────┐                        │
│  │ photoService │  │projectService│                        │
│  └──────────────┘  └──────────────┘                        │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      │ HTTP requests
                      │
┌─────────────────────▼───────────────────────────────────────┐
│                    Backend API                               │
│  /api/projects, /v2/photos/*                                │
└──────────────────────────────────────────────────────────────┘

           Event System (Observable)
┌──────────────────────────────────────────────────────────────┐
│  CacheEventEmitter  →  DevModeLogger  →  Console             │
│                     →  AnalyticsHook  →  Production Analytics│
└──────────────────────────────────────────────────────────────┘

           Configuration System
┌──────────────────────────────────────────────────────────────┐
│  ConfigLoader  →  defaultConfig  →  devConfig/prodConfig     │
│  Hot-reload in dev mode, environment-specific overrides      │
└──────────────────────────────────────────────────────────────┘
```

---

## Components

### 1. Configuration System

**Files:**
- `config/cache-strategy.config.ts` - Default configuration
- `config/cache-strategy.dev.ts` - Development overrides
- `config/cache-strategy.prod.ts` - Production overrides
- `src/services/ConfigLoader.ts` - Config loader with hot-reload

**Features:**
- ✅ TypeScript interfaces for type safety
- ✅ Environment-specific overrides
- ✅ Hot-reload in development (Vite HMR)
- ✅ Validation on load
- ✅ Subscribe to config changes
- ✅ Exposed to window for debugging (`window.__config`)

**Key Configuration Sections:**
- `profiles` - Client vs Studio cache profiles
- `ttl` - Time-to-live for different cache layers
- `quotas` - Storage thresholds (green/yellow/red)
- `eviction` - LRU and scoring algorithm settings
- `features` - Feature flags for staged rollout
- `monitoring` - Logging and metrics settings

---

### 2. Event System

**Files:**
- `src/services/cache-events/CacheEventEmitter.ts` - Event emitter
- `src/services/cache-events/DevModeLogger.ts` - Console logging for dev
- `src/services/cache-events/AnalyticsHook.ts` - Production analytics

**Event Types:**
- `cache.hit` / `cache.miss` - Cache operation results
- `cache.set` / `cache.evict` / `cache.clear` - Cache modifications
- `storage.quota` / `storage.cleanup` - Storage management
- `api.call.start` / `api.call.success` / `api.call.error` - API calls
- `prefetch.start` / `prefetch.complete` / `prefetch.cancel` - Prefetching
- `role.detected` / `profile.loaded` - User role detection
- `performance.measure` - Performance tracking

**Features:**
- ✅ Type-safe event emitter
- ✅ Event history (last 1000 events)
- ✅ Subscribe to specific events or all events
- ✅ Event statistics and aggregation
- ✅ Export events as JSON
- ✅ Color-coded console logging in dev
- ✅ Production analytics batching
- ✅ Exposed to window for debugging (`window.__cacheEvents`)

---

### 3. Global Stores (Zustand)

**Files:**
- `src/stores/PhotoStore.ts` - Photo data management
- `src/stores/ProjectStore.ts` - Project data management
- `src/stores/MetadataStore.ts` - Folders and selections

**PhotoStore:**
```typescript
interface PhotoState {
  photos: Record<string, Photo>;            // Keyed by photo ID
  photosByProject: Record<string, string[]>; // Project ID -> Photo IDs
  loading: Record<string, boolean>;
  error: Record<string, string | null>;
  
  // Actions
  fetchProjectPhotos(projectId, categoryId?)
  getPhoto(photoId)
  updatePhoto(photoId, updates)
  deletePhoto(photoId)
  toggleFavorite(photoId)
  toggleSelection(photoId)
  
  // Getters
  getPhotoById(photoId)
  getProjectPhotos(projectId)
}
```

**ProjectStore:**
```typescript
interface ProjectState {
  projects: Record<string, Project>;
  projectIds: string[];
  totalCount: number;
  lastFetch: number | null;
  
  // Actions
  fetchProjects(studioId?, status?)
  fetchProject(projectId)
  createProject(data)
  updateProject(projectId, updates)
  deleteProject(projectId)
  setCoverPhoto(projectId, photoId)
  
  // Getters
  getProjectById(projectId)
  getAllProjects()
  getProjectCount()
}
```

**MetadataStore:**
```typescript
interface MetadataState {
  folders: Record<string, Folder>;
  foldersByProject: Record<string, string[]>;
  selections: Record<string, Set<string>>;
  
  // Actions
  fetchProjectFolders(projectId)
  createFolder(projectId, folderName)
  togglePhotoSelection(projectId, photoId)
  clearProjectSelections(projectId)
  
  // Getters
  getProjectFolders(projectId)
  getSelectedPhotos(projectId)
}
```

---

## Data Flow

### Before (Direct API Calls)
```
Component → useState → useEffect → API Service → Backend
     ↓
  Re-render on every navigation (refetch)
```

### After Stage 1 (Store-Based)
```
Component → Subscribe to Store → Zustand Store → API Service → Backend
     ↓                               ↓
  Auto re-render when store updates  Emits events to CacheEventEmitter
                                     ↓
                                DevModeLogger (console logs)
```

---

## Benefits

1. **Single Source of Truth**
   - No scattered useState across components
   - Consistent data across entire app

2. **Observable Architecture**
   - Every operation logged
   - Easy debugging with event history
   - Real-time visibility in dev mode

3. **Preparation for Caching**
   - Stores are cache-aware (check before fetch)
   - Foundation for memory cache (Stage 2)
   - Foundation for IndexedDB (Stage 3)

4. **Configuration-First**
   - Change behavior without code changes
   - Hot-reload in development
   - Environment-specific settings

5. **Performance Visibility**
   - Track API call durations
   - Identify slow operations
   - Event history for debugging

---

## Stage 1 Completion Checklist

- [x] Configuration system with hot-reload
- [x] Event emitter with history tracking
- [x] Dev mode logger with color coding
- [x] Analytics hook for production
- [x] PhotoStore with CRUD operations
- [x] ProjectStore with CRUD operations
- [x] MetadataStore for folders/selections
- [x] All stores emit events
- [x] Window debugging APIs exposed

**Next:** Stage 2 will add memory caching layer to stores.
