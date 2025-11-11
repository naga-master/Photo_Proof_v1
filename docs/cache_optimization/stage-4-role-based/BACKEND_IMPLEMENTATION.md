# Stage 4: Backend Implementation Guide

## Overview

This guide details the backend API changes required for Stage 4 optimization.

**Goal:** Add mode parameter to `/api/projects` endpoint to enable lightweight metadata responses.

---

## Changes Summary

| File | Change | LOC | Difficulty |
|------|--------|-----|------------|
| `app/api/v1/projects.py` | Add mode parameter | +80 | Medium |
| `app/schemas/projects.py` | Add ProjectMetadata schema | +20 | Easy |
| `app/main.py` | Add compression middleware | +5 | Easy |
| `requirements.txt` | Add brotli (optional) | +1 | Easy |

**Total:** ~100 lines of code

---

## Step 1: Add ProjectMetadata Schema

**File:** `photo_proof_api/app/schemas/projects.py`

### Add New Schema

```python
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class ProjectMetadata(BaseModel):
    """
    Lightweight project metadata for list views.
    Contains only essential fields needed for dashboard rendering.
    Size: ~1KB per project (vs ~50KB for full Project)
    """
    id: str
    title: str
    client_id: str
    cover_photo_src: Optional[str] = None
    photo_count: int
    status: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True  # For SQLAlchemy models


class ProjectMetadataListResponse(BaseModel):
    """Response for mode=list requests"""
    metadata: list[ProjectMetadata]
    total: int
```

---

## Step 2: Update Projects Endpoint

**File:** `photo_proof_api/app/api/v1/projects.py`

### Current Code (Line ~30)

```python
@router.get("/")
def list_projects(
    studio_id: Optional[str] = Query(None, description="Filter by studio ID"),
    status: Optional[str] = Query(None, description="Filter by status"),
    db: Session = Depends(get_db)
) -> ProjectListResponse:
    """Get all projects"""
    # ... existing code
```

### New Code (Replace)

```python
from typing import Union
from app.schemas import ProjectMetadata, ProjectMetadataListResponse

@router.get("/", response_model=Union[ProjectListResponse, ProjectMetadataListResponse])
def list_projects(
    studio_id: Optional[str] = Query(None, description="Filter by studio ID"),
    status: Optional[str] = Query(None, description="Filter by status"),
    mode: str = Query("full", regex="^(list|full)$", description="Response mode: 'list' (metadata only) or 'full' (complete data)"),
    db: Session = Depends(get_db),
    current_user: UserRead = Depends(get_current_user)
) -> Union[ProjectListResponse, ProjectMetadataListResponse]:
    """
    Get projects with optional mode parameter.
    
    Modes:
    - list: Lightweight metadata only (1KB per project) - For dashboard listings
    - full: Complete data including folders (50KB per project) - For detail views
    
    Benefits:
    - mode=list reduces response size by 98%
    - Faster dashboard loads for studio users with 100+ projects
    - Reduced bandwidth costs
    """
    logger.debug(f"Fetching projects with mode={mode}", extra={
        "studio_id": studio_id,
        "status": status,
        "mode": mode
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
        # Select only essential columns (no joins)
        projects = query.with_entities(
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
        for p in projects:
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
            "count": len(metadata)
        })
        
        return ProjectMetadataListResponse(
            metadata=metadata,
            total=len(metadata)
        )
    
    # Mode: full - Return complete data (existing behavior)
    else:
        # Load complete projects with relationships
        # Use selectinload or joinedload to avoid N+1 queries
        projects = query.options(
            selectinload(models.Project.folders),
            selectinload(models.Project.client)
        ).order_by(models.Project.updated_at.desc()).all()
        
        logger.info(f"Returned {len(projects)} complete projects", extra={
            "mode": "full",
            "count": len(projects)
        })
        
        return ProjectListResponse(
            projects=projects,
            total=len(projects)
        )
```

---

## Step 3: Add Compression Middleware

**File:** `photo_proof_api/app/main.py`

### Add Import

```python
from fastapi.middleware.gzip import GZipMiddleware
```

### Add Middleware (After CORS middleware)

```python
def create_app() -> FastAPI:
    settings = get_settings()
    configure_logging(settings)

    application = FastAPI(
        title=settings.app_name,
        description=settings.description,
        version=settings.version,
    )

    # CORS middleware
    application.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=settings.allow_credentials,
        allow_methods=settings.allow_methods,
        allow_headers=settings.allow_headers,
    )

    # ✅ ADD THIS: Compression middleware
    # Compresses responses >1KB automatically
    # Typically achieves 15-20% additional size reduction
    application.add_middleware(
        GZipMiddleware,
        minimum_size=1000,  # Only compress responses >1KB
        compresslevel=6     # Balance between speed and compression (1-9)
    )

    # ... rest of existing code
```

---

## Step 4: Update Requirements (Optional)

**File:** `photo_proof_api/requirements.txt`

### Add Brotli Support (Better Compression)

```txt
# Existing dependencies
fastapi==0.104.1
sqlalchemy==2.0.23
# ... other dependencies

# ✅ ADD THIS (Optional - for Brotli compression)
# Brotli provides 15-20% better compression than gzip
# Can be added later if needed
brotli==1.1.0
```

**Note:** GZipMiddleware is sufficient for now. Brotli can be added later for 5-10% additional savings.

---

## Step 5: Test Backend Changes

### Install Dependencies

```bash
cd /Users/ns632@apac.comcast.com/Documents/v0_photo_proof/photo_proof_api

# Activate virtual environment
source venv/bin/activate

# Install if needed
pip install fastapi sqlalchemy pydantic
```

### Start Server

```bash
# Make sure database is initialized
python -m app.db.init_db

# Start server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Test Endpoints

#### Test 1: Mode Parameter Validation

```bash
# Test mode=list (should work)
curl "http://localhost:8000/api/projects?mode=list"

# Test mode=full (should work)
curl "http://localhost:8000/api/projects?mode=full"

# Test invalid mode (should return 422 validation error)
curl "http://localhost:8000/api/projects?mode=invalid"

# Test no mode (should default to full)
curl "http://localhost:8000/api/projects"
```

#### Test 2: Response Size Comparison

```bash
# Get size of mode=list response
curl -s "http://localhost:8000/api/projects?mode=list" | wc -c

# Get size of mode=full response
curl -s "http://localhost:8000/api/projects?mode=full" | wc -c

# Calculate reduction percentage
# Expected: mode=list should be 98% smaller
```

#### Test 3: Compression Working

```bash
# Without compression
curl -s "http://localhost:8000/api/projects?mode=list" | wc -c

# With compression
curl -s -H "Accept-Encoding: gzip" \
     "http://localhost:8000/api/projects?mode=list" \
     --compressed | wc -c

# Should see 15-20% reduction with gzip
```

#### Test 4: Response Structure

```bash
# Check mode=list response structure
curl -s "http://localhost:8000/api/projects?mode=list" | jq '.'
# Should have: { "metadata": [...], "total": N }

# Check mode=full response structure
curl -s "http://localhost:8000/api/projects?mode=full" | jq '.'
# Should have: { "projects": [...], "total": N }
```

#### Test 5: Data Accuracy

```bash
# Verify metadata has all required fields
curl -s "http://localhost:8000/api/projects?mode=list" | \
  jq '.metadata[0] | keys'
# Expected: ["id", "title", "client_id", "cover_photo_src", 
#            "photo_count", "status", "created_at", "updated_at"]

# Verify full data has all fields
curl -s "http://localhost:8000/api/projects?mode=full" | \
  jq '.projects[0] | keys'
# Expected: All project fields including folders, client, etc.
```

---

## Performance Benchmarks

### Expected Results

| Scenario | Before | After (mode=list) | After (compressed) | Improvement |
|----------|--------|-------------------|--------------------|-------------|
| 10 projects | 500KB | 10KB | 8KB | 98.4% |
| 50 projects | 2.5MB | 50KB | 40KB | 98.4% |
| 100 projects | 5MB | 100KB | 80KB | 98.4% |
| 500 projects | 25MB | 500KB | 400KB | 98.4% |

### Response Time Impact

| Scenario | Before | After | Improvement |
|----------|--------|-------|-------------|
| Network transfer (100 projects) | 5MB @ 10Mbps = 4s | 80KB @ 10Mbps = 0.064s | 98% faster |
| JSON parsing | ~200ms | ~10ms | 95% faster |
| Memory allocation | ~5MB | ~80KB | 98% less |

---

## Database Query Optimization

### Current Query (mode=full)

```python
# N+1 query problem
projects = query.all()  # 1 query
for project in projects:
    folders = project.folders  # N queries (one per project)
    client = project.client    # N queries (one per project)
```

**Result:** 1 + 2N queries (201 queries for 100 projects!)

### Optimized Query (mode=full)

```python
# Single query with joins
projects = query.options(
    selectinload(models.Project.folders),  # 1 additional query
    selectinload(models.Project.client)    # 1 additional query
).all()
```

**Result:** 3 queries total (regardless of project count!)

### Ultra-Fast Query (mode=list)

```python
# No joins, only essential columns
projects = query.with_entities(
    models.Project.id,
    models.Project.title,
    # ... only 8 fields
).all()
```

**Result:** 1 query, minimal data transfer!

---

## Error Handling

### Invalid Mode Parameter

```python
# FastAPI automatically validates via regex
mode: str = Query("full", regex="^(list|full)$")

# Invalid mode returns 422 Unprocessable Entity
{
  "detail": [
    {
      "loc": ["query", "mode"],
      "msg": "string does not match regex \"^(list|full)$\"",
      "type": "value_error.str.regex"
    }
  ]
}
```

### Empty Results

```python
# Both modes handle empty results gracefully
if mode == "list":
    return ProjectMetadataListResponse(metadata=[], total=0)
else:
    return ProjectListResponse(projects=[], total=0)
```

---

## Logging & Monitoring

### Add Logging

```python
logger.info("Projects API called", extra={
    "mode": mode,
    "studio_id": studio_id,
    "status": status,
    "count": len(results),
    "response_size_kb": len(json.dumps(results)) / 1024
})
```

### Metrics to Track

- Response size by mode (bytes)
- Response time by mode (ms)
- Cache hit rate (from frontend logs)
- Error rate by mode
- Mode usage distribution (list vs full)

---

## Rollback Plan

### If Issues Arise

1. **Quick Fix:** Change default mode
   ```python
   mode: str = Query("full", regex="^(list|full)$")
   # Change to always use full mode temporarily
   ```

2. **Disable Feature:** Comment out mode logic
   ```python
   # if mode == "list":
   #     # ... metadata logic
   # else:
       # Always use full mode
       projects = query.options(...).all()
       return ProjectListResponse(projects=projects, total=len(projects))
   ```

3. **Complete Rollback:** Revert to previous version
   ```bash
   git revert <commit-hash>
   git push origin main
   # Redeploy
   ```

---

## Security Considerations

### Authorization

```python
# Ensure user can only see their own projects
@router.get("/")
def list_projects(
    ...,
    current_user: UserRead = Depends(get_current_user)  # ✅ Required
):
    # Filter by user's studio
    if not studio_id and current_user.studio_id:
        studio_id = current_user.studio_id
```

### Rate Limiting

```python
# Consider adding rate limiting for mode=full
# (more expensive query)
from slowapi import Limiter

limiter = Limiter(key_func=get_remote_address)

@router.get("/")
@limiter.limit("100/minute")  # More restrictive for full mode
def list_projects(...):
    ...
```

---

## Next Steps

After backend implementation:

1. ✅ Test all endpoints thoroughly
2. ✅ Verify backward compatibility
3. ✅ Monitor performance in production
4. → Proceed to frontend integration
5. → Update documentation

See: `FRONTEND_INTEGRATION.md` for next steps.
