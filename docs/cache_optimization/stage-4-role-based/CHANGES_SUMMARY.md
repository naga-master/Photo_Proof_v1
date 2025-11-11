# Stage 4: Implementation Changes Summary

## Overview

This document summarizes all code changes required for Stage 4 implementation.

---

## Backend Changes

### 1. Add New Schemas

**File:** `photo_proof_api/app/schemas/projects.py`

**Add at end of file (after ProjectDetail):**

```python
class ProjectMetadata(BaseModel):
    """
    Lightweight project metadata for dashboard listings.
    Contains only essential fields needed for rendering project cards.
    
    Size: ~1KB per project (vs ~50KB for full Project)
    Use Case: Dashboard listings for studio users with 100+ projects
    """
    id: str
    title: str
    client_id: str
    cover_photo_src: Optional[str] = None
    photo_count: int
    status: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ProjectMetadataListResponse(BaseModel):
    """Response for mode=list requests"""
    metadata: List[ProjectMetadata]
    total: int


class ProjectListResponse(BaseModel):
    """Response for mode=full requests (backward compatible)"""
    projects: List[dict]  # Can be ProjectDetail or similar
    total: int
```

---

### 2. Update Projects Endpoint

**File:** `photo_proof_api/app/api/v1/projects.py`

**Find line ~30 (the list_projects function) and REPLACE with:**

```python
from typing import Union
from app.schemas.projects import (
    ProjectMetadata,
    ProjectMetadataListResponse,
    ProjectListResponse,
)

@router.get("/", response_model=Union[ProjectListResponse, ProjectMetadataListResponse])
def list_projects(
    studio_id: Optional[str] = Query(None, description="Filter by studio ID"),
    status: Optional[str] = Query(None, description="Filter by status"),
    mode: str = Query("full", regex="^(list|full)$", description="Response mode: 'list' (metadata only, ~1KB/project) or 'full' (complete data, ~50KB/project)"),
    db: Session = Depends(get_db),
    current_user: UserRead = Depends(get_current_user)
) -> Union[ProjectListResponse, ProjectMetadataListResponse]:
    """
    Get projects with optional mode parameter.
    
    **Modes:**
    - `list`: Lightweight metadata only (1KB per project) - For dashboard listings
    - `full`: Complete data including folders (50KB per project) - For detail views
    
    **Benefits:**
    - mode=list reduces response size by 98%
    - Faster dashboard loads for studio users with 100+ projects
    - Reduced bandwidth costs
    
    **Examples:**
    - Dashboard: GET /api/projects?mode=list
    - Details: GET /api/projects?mode=full (or no mode parameter)
    """
    logger.debug(f"Fetching projects with mode={mode}", extra={
        "studio_id": studio_id,
        "status": status,
        "mode": mode,
        "user_id": current_user.id
    })
    
    # Base query
    query = db.query(models.Project)
    
    # Apply filters
    if studio_id:
        query = query.filter(models.Project.studio_id == studio_id)
    if status:
        query = query.filter(models.Project.status == status)
    
    # Mode: list - Return lightweight metadata only
    if mode == "list":
        # Select only essential columns (no joins, minimal data)
        projects_data = query.with_entities(
            models.Project.id,
            models.Project.title,
            models.Project.client_id,
            models.Project.cover_photo_src,
            models.Project.photo_count,
            models.Project.status,
            models.Project.created_at,
            models.Project.updated_at
        ).order_by(models.Project.updated_at.desc()).all()
        
        # Convert to ProjectMetadata objects
        metadata = []
        for p in projects_data:
            metadata.append(ProjectMetadata(
                id=str(p.id),
                title=p.title,
                client_id=str(p.client_id),
                cover_photo_src=p.cover_photo_src,
                photo_count=p.photo_count,
                status=p.status,
                created_at=p.created_at,
                updated_at=p.updated_at
            ))
        
        logger.info(f"Returned {len(metadata)} project metadata entries", extra={
            "mode": "list",
            "count": len(metadata),
            "approx_size_kb": len(metadata)  # ~1KB per project
        })
        
        return ProjectMetadataListResponse(
            metadata=metadata,
            total=len(metadata)
        )
    
    # Mode: full - Return complete data (existing behavior)
    else:
        # Load complete projects with relationships
        # Use selectinload to avoid N+1 queries
        projects = query.options(
            selectinload(models.Project.folders) if hasattr(models.Project, 'folders') else None,
            selectinload(models.Project.client) if hasattr(models.Project, 'client') else None
        ).order_by(models.Project.updated_at.desc()).all()
        
        # Convert to dictionaries (or use existing serialization logic)
        projects_list = []
        for project in projects:
            project_dict = {
                "id": str(project.id),
                "title": project.title,
                "studio_id": str(project.studio_id),
                "client_id": str(project.client_id),
                "cover_photo_id": str(project.cover_photo_id) if project.cover_photo_id else None,
                "cover_photo_src": project.cover_photo_src,
                "photo_count": project.photo_count,
                "is_locked": project.is_locked,
                "payment_status": project.payment_status,
                "price": project.price,
                "package_id": str(project.package_id) if project.package_id else None,
                "status": project.status,
                "has_folders": project.has_folders,
                "shoot_date": project.shoot_date.isoformat() if project.shoot_date else None,
                "created_at": project.created_at.isoformat(),
                "updated_at": project.updated_at.isoformat(),
            }
            projects_list.append(project_dict)
        
        logger.info(f"Returned {len(projects_list)} complete projects", extra={
            "mode": "full",
            "count": len(projects_list),
            "approx_size_kb": len(projects_list) * 50  # ~50KB per project
        })
        
        return ProjectListResponse(
            projects=projects_list,
            total=len(projects_list)
        )
```

---

### 3. Add Compression Middleware

**File:** `photo_proof_api/app/main.py`

**Find the line where CORS middleware is added, then ADD this after it:**

```python
from fastapi.middleware.gzip import GZipMiddleware

def create_app() -> FastAPI:
    # ... existing code ...
    
    # CORS middleware (existing)
    application.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=settings.allow_credentials,
        allow_methods=settings.allow_methods,
        allow_headers=settings.allow_headers,
    )

    # ✅ ADD THIS: Compression middleware
    # Compresses responses >1KB automatically (15-20% size reduction)
    application.add_middleware(
        GZipMiddleware,
        minimum_size=1000,  # Only compress responses >1KB
        compresslevel=6     # Balance between speed and compression (1-9)
    )

    # ... rest of existing code ...
```

---

## Frontend Changes

### 1. Copy Service Files

**Important:** The service files don't exist yet in `src/services/`. We need to copy them from `services/` folder:

```bash
# Create src/services directory if it doesn't exist
mkdir -p /Users/ns632@apac.comcast.com/Documents/v0_photo_proof/Photo_Proof_v1/src/services

# Copy service files
cp /Users/ns632@apac.comcast.com/Documents/v0_photo_proof/Photo_Proof_v1/services/projectService.ts \
   /Users/ns632@apac.comcast.com/Documents/v0_photo_proof/Photo_Proof_v1/src/services/

cp /Users/ns632@apac.comcast.com/Documents/v0_photo_proof/Photo_Proof_v1/services/photoService.ts \
   /Users/ns632@apac.comcast.com/Documents/v0_photo_proof/Photo_Proof_v1/src/services/
```

---

### 2. Update Project Service

**File:** `Photo_Proof_v1/src/services/projectService.ts`

**Find the getProjects method and UPDATE:**

```typescript
async getProjects(
  studioId?: string,
  status?: string,
  mode?: 'list' | 'full'  // ✅ ADD THIS PARAMETER
): Promise<ProjectListResponse> {
  const params: Record<string, string> = {};
  if (studioId) params.studio_id = studioId;
  if (status) params.status = status;
  if (mode) params.mode = mode;  // ✅ ADD THIS LINE
  
  return apiClient.get<ProjectListResponse>('/api/projects', params);
}
```

---

### 3. Update Project Store

**File:** `Photo_Proof_v1/src/stores/ProjectStore.ts`

**Add import at top:**

```typescript
import { roleDetector } from '../services/auth/RoleDetector';
```

**Find fetchProjects method and UPDATE the API call section:**

```typescript
fetchProjects: async (studioId?: string, status?: string) => {
  const key = 'projects-list';
  
  // ✅ ADD THIS: Detect user role and choose appropriate mode
  const role = roleDetector.getCurrentRole();
  const mode = role === 'studio' ? 'list' : 'full';
  
  // ✅ UPDATE THIS: Cache key should include mode
  const cacheKey = `projects:${studioId || 'all'}:${status || 'all'}:${mode}`;
  
  cacheEvents.emit({
    type: CacheEventType.CACHE_CHECK,
    metadata: {
      key: cacheKey,
      role,
      mode,  // ✅ ADD THIS
    },
  });
  
  // ... existing cache check code ...
  
  // ✅ UPDATE THIS: Cache miss - fetch from API with mode
  cacheEvents.emit({
    type: CacheEventType.API_CALL_START,
    metadata: {
      endpoint: 'getProjects',
      studioId,
      status,
      mode,  // ✅ ADD THIS
    },
  });

  // ... existing loading state code ...

  try {
    const startTime = Date.now();
    
    // ✅ UPDATE THIS: Pass mode parameter to service
    const response: ProjectListResponse = await projectService.getProjects(
      studioId,
      status,
      mode  // ✅ ADD THIS
    );
    
    const duration = Date.now() - startTime;

    cacheEvents.emit({
      type: CacheEventType.API_CALL_SUCCESS,
      metadata: {
        endpoint: 'getProjects',
        count: response.projects.length,
        studioId,
        status,
        mode,  // ✅ ADD THIS
        responseSize: JSON.stringify(response).length,  // ✅ ADD THIS
      },
      duration,
    });

    // ... rest of existing code ...
  }
  // ... existing catch block ...
},
```

---

### 4. Enable Feature Flags

**File:** `Photo_Proof_v1/config/cache-strategy.dev.ts`

**UPDATE the features section:**

```typescript
export const devConfig: DeepPartial<CacheStrategyConfig> = {
  // ... existing config ...
  
  features: {
    memoryCache: true,              // Stage 2
    indexedDBCache: true,           // Stage 3
    roleBasedStrategy: true,        // ✅ Stage 4 - Enable this
    prefetching: false,             // Optional
    virtualScrolling: false,        // Optional
  },
};
```

---

## Testing Commands

### Backend Testing

```bash
# 1. Start backend server
cd /Users/ns632@apac.comcast.com/Documents/v0_photo_proof/photo_proof_api
source venv/bin/activate
uvicorn app.main:app --reload

# 2. Test mode=list
curl "http://localhost:8000/api/projects?mode=list" | jq '.metadata | length'

# 3. Test mode=full
curl "http://localhost:8000/api/projects?mode=full" | jq '.projects | length'

# 4. Compare sizes
curl -s "http://localhost:8000/api/projects?mode=list" | wc -c
curl -s "http://localhost:8000/api/projects?mode=full" | wc -c

# 5. Test compression
curl -s -H "Accept-Encoding: gzip" "http://localhost:8000/api/projects?mode=list" --compressed | wc -c
```

---

### Frontend Testing

```bash
# 1. Start frontend server
cd /Users/ns632@apac.comcast.com/Documents/v0_photo_proof/Photo_Proof_v1
npm run dev

# 2. Open browser console
# Navigate to: http://localhost:3001

# 3. Check role detection
window.__roleDetector.getRole()

# 4. Check feature flags
window.__config.get().features.roleBasedStrategy

# 5. Navigate to dashboard and check Network tab
# Should see: /api/projects?mode=list (for studio) or mode=full (for client)

# 6. Check cache events
window.__cacheEvents.history().filter(e => e.type === 'api.call.success')
```

---

## Verification Checklist

### Backend

- [ ] ProjectMetadata schema added
- [ ] ProjectMetadataListResponse schema added
- [ ] Mode parameter added to list_projects()
- [ ] Conditional logic for mode=list vs mode=full
- [ ] GZipMiddleware added
- [ ] Server starts without errors
- [ ] Mode=list returns ~1KB per project
- [ ] Mode=full returns ~50KB per project
- [ ] Compression working (20% reduction)

### Frontend

- [ ] Service files copied to src/services/
- [ ] getProjects() method updated with mode parameter
- [ ] fetchProjects() detects role and chooses mode
- [ ] Cache key includes mode
- [ ] roleBasedStrategy feature flag enabled
- [ ] App compiles without errors
- [ ] Mode parameter visible in Network tab
- [ ] Response sizes reduced

### Integration

- [ ] Backend and frontend communicate correctly
- [ ] Studio users see mode=list
- [ ] Client users see mode=full
- [ ] Cache working with mode parameter
- [ ] No console errors
- [ ] Performance improved

---

## Estimated Time

- **Backend changes:** 30-60 minutes
- **Frontend changes:** 30-45 minutes
- **Testing:** 30-45 minutes
- **Total:** 2-3 hours

---

## Ready to Implement?

All changes are documented. Follow the order:
1. Backend changes first
2. Test backend
3. Frontend changes
4. Test integration

See individual files above for exact code changes.
