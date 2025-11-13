# Favorites & Selections Backend Integration

## Problem Statement

Currently, `toggleFavorite` and `toggleSelection` **only update local React state** with no backend persistence. When users refresh the page or log out, all favorites and selections are lost.

### Current Implementation (Frontend Only)

```typescript
// App.tsx (BEFORE)
const [favorites, setFavorites] = useState<string[]>([]);
const [selections, setSelections] = useState<string[]>([]);

const toggleFavorite = (photoId: string) => {
  setFavorites(prev =>
    prev.includes(photoId) ? prev.filter(id => id !== photoId) : [...prev, photoId]
  );
  // ❌ No API call
  // ❌ No persistence
  // ❌ Lost on page refresh
};
```

### User Impact
- Lost favorites after refresh
- Can't access favorites from different devices
- No sharing of selections with studio
- Poor UX for client collaboration

## Database Schema (Already Exists!)

```python
# app/db/models/photo.py (EXISTING)

class UserPhotoFavorite(Base, TimestampMixin):
    """User's favorite photos."""
    __tablename__ = "user_photo_favorites"
    
    id = Column(Integer, primary_key=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"))
    photo_id = Column(Integer, ForeignKey("photos.id", ondelete="CASCADE"))
    
    # Relationships
    user = relationship("User")
    photo = relationship("Photo", back_populates="favorites")
    
    # Unique constraint: one favorite per user per photo
    __table_args__ = (UniqueConstraint('user_id', 'photo_id'),)


class UserPhotoSelection(Base, TimestampMixin):
    """User's selected photos for orders/sharing."""
    __tablename__ = "user_photo_selections"
    
    id = Column(Integer, primary_key=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"))
    photo_id = Column(Integer, ForeignKey("photos.id", ondelete="CASCADE"))
    
    # Relationships
    user = relationship("User")
    photo = relationship("Photo", back_populates="selections")
    
    # Unique constraint
    __table_args__ = (UniqueConstraint('user_id', 'photo_id'),)
```

**Good News**: Tables already exist! Just need to add API endpoints.

## Solution Architecture

### Three-Layer Strategy

```
Frontend (Optimistic UI)
    ↓
Cache Layer (IndexedDB + Memory)
    ↓
Backend API (Source of Truth)
    ↓
Database (PostgreSQL/SQLite)
```

### Data Flow

#### Toggling Favorite (Write)
```
User clicks favorite
    ↓
Update local state (optimistic) ← Instant UI feedback
    ↓
Call backend API (async)
    ↓
Update IndexedDB cache
    ↓
Sync with server response
```

#### Loading Favorites (Read)
```
User logs in
    ↓
Check IndexedDB cache (< 1 hour old?) → Use cached
    ↓ (cache miss)
Fetch from backend API
    ↓
Store in IndexedDB (1 hour TTL)
    ↓
Store in memory (session)
    ↓
Update UI
```

## Backend Implementation

### 1. API Endpoints (`photos.py`)

```python
from app.db.models import UserPhotoFavorite, UserPhotoSelection
from app.api.deps import get_current_user

@router.post("/{photo_id}/favorite")
def toggle_favorite(
    photo_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict:
    """
    Toggle favorite status for a photo.
    
    Returns: {"favorited": true/false, "photo_id": 123}
    """
    # Check if already favorited
    existing = db.query(UserPhotoFavorite).filter(
        UserPhotoFavorite.user_id == current_user.id,
        UserPhotoFavorite.photo_id == photo_id
    ).first()
    
    if existing:
        # Remove favorite
        db.delete(existing)
        db.commit()
        return {"favorited": False, "photo_id": photo_id}
    else:
        # Add favorite
        favorite = UserPhotoFavorite(
            user_id=current_user.id,
            photo_id=photo_id
        )
        db.add(favorite)
        db.commit()
        return {"favorited": True, "photo_id": photo_id}


@router.get("/favorites")
def get_user_favorites(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict:
    """
    Get all favorite photo IDs for current user.
    
    Returns: {"photo_ids": [1, 2, 3], "total": 3}
    """
    favorites = db.query(UserPhotoFavorite).filter(
        UserPhotoFavorite.user_id == current_user.id
    ).all()
    
    photo_ids = [f.photo_id for f in favorites]
    
    return {
        "photo_ids": photo_ids,
        "total": len(photo_ids)
    }


@router.post("/{photo_id}/select")
def toggle_selection(
    photo_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict:
    """
    Toggle selection status for a photo.
    
    Returns: {"selected": true/false, "photo_id": 123}
    """
    existing = db.query(UserPhotoSelection).filter(
        UserPhotoSelection.user_id == current_user.id,
        UserPhotoSelection.photo_id == photo_id
    ).first()
    
    if existing:
        db.delete(existing)
        db.commit()
        return {"selected": False, "photo_id": photo_id}
    else:
        selection = UserPhotoSelection(
            user_id=current_user.id,
            photo_id=photo_id
        )
        db.add(selection)
        db.commit()
        return {"selected": True, "photo_id": photo_id}


@router.get("/selections")
def get_user_selections(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict:
    """
    Get all selected photo IDs for current user.
    
    Returns: {"photo_ids": [1, 2, 3], "total": 3}
    """
    selections = db.query(UserPhotoSelection).filter(
        UserPhotoSelection.user_id == current_user.id
    ).all()
    
    photo_ids = [s.photo_id for s in selections]
    
    return {
        "photo_ids": photo_ids,
        "total": len(photo_ids)
    }


@router.delete("/favorites")
def clear_favorites(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict:
    """Clear all favorites for current user."""
    deleted_count = db.query(UserPhotoFavorite).filter(
        UserPhotoFavorite.user_id == current_user.id
    ).delete()
    
    db.commit()
    
    return {"cleared": deleted_count}


@router.delete("/selections")
def clear_selections(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict:
    """Clear all selections for current user."""
    deleted_count = db.query(UserPhotoSelection).filter(
        UserPhotoSelection.user_id == current_user.id
    ).delete()
    
    db.commit()
    
    return {"cleared": deleted_count}
```

### 2. Router Registration

```python
# app/routers/photos.py
# Add to existing router, no new file needed
```

## Frontend Implementation

### 1. Photo Service (`photoService.ts`)

```typescript
export interface FavoritesCache {
  photoIds: string[];
  timestamp: number;
}

class PhotoService {
  private readonly CACHE_TTL = 3600000; // 1 hour
  
  /**
   * Toggle favorite status
   */
  async toggleFavorite(photoId: string): Promise<boolean> {
    console.log(`[PhotoService] Toggling favorite for photo ${photoId}`);
    
    try {
      const response = await apiClient.post<{ favorited: boolean }>(
        `/v2/photos/${photoId}/favorite`,
        {}
      );
      
      // Update cache
      await this.updateFavoritesCache(photoId, response.favorited);
      
      return response.favorited;
    } catch (error) {
      console.error('[PhotoService] Failed to toggle favorite:', error);
      throw error;
    }
  }
  
  /**
   * Get all favorites for current user
   */
  async getFavorites(): Promise<string[]> {
    console.log('[PhotoService] Fetching favorites...');
    
    // Try IndexedDB cache first
    if ((window as any).__indexedDB) {
      const cached = await (window as any).__indexedDB.get('user:favorites');
      if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
        console.log('[PhotoService] ✅ Using cached favorites');
        return cached.photoIds.map(String);
      }
    }
    
    // Fetch from API
    try {
      const response = await apiClient.get<{ photo_ids: number[] }>(
        '/v2/photos/favorites'
      );
      
      const photoIds = response.photo_ids.map(String);
      
      // Cache for 1 hour
      if ((window as any).__indexedDB) {
        await (window as any).__indexedDB.set('user:favorites', {
          photoIds,
          timestamp: Date.now()
        });
      }
      
      // Store in memory cache too
      if ((window as any).__cache) {
        (window as any).__cache.set('user:favorites', photoIds);
      }
      
      console.log(`[PhotoService] ✅ Loaded ${photoIds.length} favorites`);
      return photoIds;
    } catch (error) {
      console.error('[PhotoService] Failed to fetch favorites:', error);
      throw error;
    }
  }
  
  /**
   * Update favorites cache after toggle
   */
  private async updateFavoritesCache(photoId: string, favorited: boolean) {
    // Update IndexedDB
    if ((window as any).__indexedDB) {
      const cached = await (window as any).__indexedDB.get('user:favorites');
      if (cached) {
        const photoIds = favorited
          ? [...cached.photoIds, photoId]
          : cached.photoIds.filter((id: string) => id !== photoId);
        
        await (window as any).__indexedDB.set('user:favorites', {
          photoIds,
          timestamp: Date.now()
        });
      }
    }
    
    // Update memory cache
    if ((window as any).__cache) {
      const cached = (window as any).__cache.get('user:favorites');
      if (cached) {
        const photoIds = favorited
          ? [...cached, photoId]
          : cached.filter((id: string) => id !== photoId);
        
        (window as any).__cache.set('user:favorites', photoIds);
      }
    }
  }
  
  /**
   * Toggle selection status
   */
  async toggleSelection(photoId: string): Promise<boolean> {
    console.log(`[PhotoService] Toggling selection for photo ${photoId}`);
    
    try {
      const response = await apiClient.post<{ selected: boolean }>(
        `/v2/photos/${photoId}/select`,
        {}
      );
      
      // Update cache
      await this.updateSelectionsCache(photoId, response.selected);
      
      return response.selected;
    } catch (error) {
      console.error('[PhotoService] Failed to toggle selection:', error);
      throw error;
    }
  }
  
  /**
   * Get all selections for current user
   */
  async getSelections(): Promise<string[]> {
    console.log('[PhotoService] Fetching selections...');
    
    // Try cache first
    if ((window as any).__indexedDB) {
      const cached = await (window as any).__indexedDB.get('user:selections');
      if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
        console.log('[PhotoService] ✅ Using cached selections');
        return cached.photoIds.map(String);
      }
    }
    
    // Fetch from API
    try {
      const response = await apiClient.get<{ photo_ids: number[] }>(
        '/v2/photos/selections'
      );
      
      const photoIds = response.photo_ids.map(String);
      
      // Cache
      if ((window as any).__indexedDB) {
        await (window as any).__indexedDB.set('user:selections', {
          photoIds,
          timestamp: Date.now()
        });
      }
      
      if ((window as any).__cache) {
        (window as any).__cache.set('user:selections', photoIds);
      }
      
      console.log(`[PhotoService] ✅ Loaded ${photoIds.length} selections`);
      return photoIds;
    } catch (error) {
      console.error('[PhotoService] Failed to fetch selections:', error);
      throw error;
    }
  }
  
  /**
   * Update selections cache
   */
  private async updateSelectionsCache(photoId: string, selected: boolean) {
    if ((window as any).__indexedDB) {
      const cached = await (window as any).__indexedDB.get('user:selections');
      if (cached) {
        const photoIds = selected
          ? [...cached.photoIds, photoId]
          : cached.photoIds.filter((id: string) => id !== photoId);
        
        await (window as any).__indexedDB.set('user:selections', {
          photoIds,
          timestamp: Date.now()
        });
      }
    }
    
    if ((window as any).__cache) {
      const cached = (window as any).__cache.get('user:selections');
      if (cached) {
        const photoIds = selected
          ? [...cached, photoId]
          : cached.filter((id: string) => id !== photoId);
        
        (window as any).__cache.set('user:selections', photoIds);
      }
    }
  }
  
  /**
   * Clear all favorites
   */
  async clearFavorites(): Promise<void> {
    await apiClient.delete('/v2/photos/favorites');
    
    // Clear caches
    if ((window as any).__indexedDB) {
      await (window as any).__indexedDB.delete('user:favorites');
    }
    if ((window as any).__cache) {
      (window as any).__cache.delete('user:favorites');
    }
  }
  
  /**
   * Clear all selections
   */
  async clearSelections(): Promise<void> {
    await apiClient.delete('/v2/photos/selections');
    
    // Clear caches
    if ((window as any).__indexedDB) {
      await (window as any).__indexedDB.delete('user:selections');
    }
    if ((window as any).__cache) {
      (window as any).__cache.delete('user:selections');
    }
  }
}

export const photoService = new PhotoService();
```

### 2. App Component Updates (`App.tsx`)

```typescript
// Load favorites/selections on login
const handleLogin = async (userDetails: { role: UserRole; userId: string; username: string; token: string }) => {
  setUserRole(userDetails.role);
  setUser({ id: userDetails.userId, username: userDetails.username });
  
  // Store token
  localStorage.setItem('token', userDetails.token);
  
  // Load user data
  try {
    const [favoritesData, selectionsData] = await Promise.all([
      photoService.getFavorites(),
      photoService.getSelections(),
    ]);
    
    setFavorites(favoritesData);
    setSelections(selectionsData);
    
    console.log(`[App] Loaded ${favoritesData.length} favorites, ${selectionsData.length} selections`);
  } catch (error) {
    console.error('[App] Failed to load user data:', error);
    // Don't block login on this error
  }
  
  // Continue with existing login flow...
};

// Optimistic toggle with backend sync
const toggleFavorite = async (photoId: string) => {
  // Optimistic update
  const wasFavorite = favorites.includes(photoId);
  const newFavorites = wasFavorite
    ? favorites.filter(id => id !== photoId)
    : [...favorites, photoId];
  
  setFavorites(newFavorites);
  
  try {
    // Sync with backend
    const favorited = await photoService.toggleFavorite(photoId);
    
    // Verify optimistic update matches server
    if (favorited !== newFavorites.includes(photoId)) {
      console.warn('[App] Favorite state mismatch, syncing...');
      setFavorites(favorited 
        ? [...favorites, photoId]
        : favorites.filter(id => id !== photoId)
      );
    }
  } catch (error) {
    console.error('[App] Failed to toggle favorite:', error);
    // Revert optimistic update
    setFavorites(wasFavorite
      ? [...favorites, photoId]
      : favorites.filter(id => id !== photoId)
    );
    toast.error('Failed to update favorite');
  }
};

// Same for toggleSelection
const toggleSelection = async (photoId: string) => {
  const wasSelected = selections.includes(photoId);
  const newSelections = wasSelected
    ? selections.filter(id => id !== photoId)
    : [...selections, photoId];
  
  setSelections(newSelections);
  
  try {
    const selected = await photoService.toggleSelection(photoId);
    
    if (selected !== newSelections.includes(photoId)) {
      console.warn('[App] Selection state mismatch, syncing...');
      setSelections(selected 
        ? [...selections, photoId]
        : selections.filter(id => id !== photoId)
      );
    }
  } catch (error) {
    console.error('[App] Failed to toggle selection:', error);
    setSelections(wasSelected
      ? [...selections, photoId]
      : selections.filter(id => id !== photoId)
    );
    toast.error('Failed to update selection');
  }
};
```

## Cache Strategy

### Why Three-Layer Cache?

1. **Memory Cache** (React State)
   - Fastest: 0ms access
   - Session-only
   - Lost on page refresh

2. **IndexedDB** (Browser Storage)
   - Fast: 1-5ms access
   - Persistent: Survives refresh
   - TTL: 1 hour

3. **Backend API** (Database)
   - Authoritative: Source of truth
   - Shared: Across devices
   - Persistent: Forever

### Cache Invalidation

```typescript
// On toggle
1. Update React state (immediate UI)
2. Call API
3. Update IndexedDB on success
4. Sync state with API response

// On load
1. Check IndexedDB (< 1 hour?)
2. Return cached if valid
3. Otherwise fetch from API
4. Update all caches
```

## Optimistic UI Pattern

### Benefits
- ✅ Instant UI feedback (no waiting)
- ✅ Feels responsive
- ✅ Handles offline gracefully

### Risks
- ⚠️ Optimistic update may fail
- ⚠️ Need revert mechanism
- ⚠️ State sync complexity

### Mitigation
```typescript
try {
  // Optimistic update
  const serverState = await api.toggle();
  // Verify matches
  if (serverState !== localState) sync();
} catch {
  // Revert on failure
  revertOptimisticUpdate();
}
```

## Error Handling

### Network Failure
```typescript
catch (error) {
  if (error.message.includes('network')) {
    toast.warn('Changes will sync when online');
    // Keep optimistic update, retry later
  } else {
    // Server error, revert
    revertUpdate();
    toast.error('Failed to update');
  }
}
```

### Authentication Failure
```typescript
if (error.status === 401) {
  // Token expired
  router.push('/login');
  toast.error('Session expired, please log in');
}
```

## Testing Checklist

### Backend Tests
- [ ] Toggle favorite (add)
- [ ] Toggle favorite (remove)
- [ ] Get favorites returns correct IDs
- [ ] Toggle selection (add)
- [ ] Toggle selection (remove)
- [ ] Get selections returns correct IDs
- [ ] Clear favorites
- [ ] Clear selections
- [ ] Duplicate favorite prevented (unique constraint)
- [ ] Non-existent photo returns 404

### Frontend Tests
- [ ] Favorites load on login
- [ ] Selections load on login
- [ ] Toggle favorite updates UI instantly
- [ ] Toggle selection updates UI instantly
- [ ] Refresh preserves favorites (IndexedDB)
- [ ] Refresh preserves selections (IndexedDB)
- [ ] Network error shows toast, reverts update
- [ ] Cache expires after 1 hour
- [ ] Multiple devices sync (login on second device)

### Integration Tests
- [ ] Add favorite → refresh → still favorited
- [ ] Add selection → logout → login → still selected
- [ ] Toggle 100 times rapidly (no race conditions)
- [ ] Work offline → sync when online
- [ ] Clear all favorites → empty state

## Performance Impact

| Operation | Latency | Impact |
|-----------|---------|--------|
| Toggle (optimistic) | 0ms | Instant |
| Toggle (API) | 50-200ms | Background |
| Load favorites (cache) | 1-5ms | Fast |
| Load favorites (API) | 50-200ms | On login only |
| Cache update | 1-2ms | Negligible |

**Overall**: Feels instant, minimal overhead.

## Migration Plan

### Phase 1: Backend Endpoints (1 hour)
1. Add endpoints to `photos.py`
2. Test with curl/Postman
3. Deploy to staging

### Phase 2: Frontend Service (1 hour)
1. Create `photoService.ts` methods
2. Add caching logic
3. Unit tests

### Phase 3: App Integration (1 hour)
1. Update `handleLogin`
2. Update `toggleFavorite/toggleSelection`
3. Add error handling

### Phase 4: Testing (1 hour)
1. Manual testing
2. Edge cases
3. Performance profiling

**Total**: 4 hours

## Rollback Plan

### Backend
```python
# Disable endpoints (no deletion needed)
@router.post("/{photo_id}/favorite")
def toggle_favorite(...):
    raise HTTPException(503, "Temporarily disabled")
```

### Frontend
```typescript
// Revert to local-only state
const toggleFavorite = (photoId: string) => {
  setFavorites(prev => ...);  // No API call
};
```

## Future Enhancements

1. **Conflict Resolution**: Handle concurrent edits
2. **Batch Operations**: Select/deselect multiple at once
3. **Favorites Collections**: Group favorites by project
4. **Share Selections**: Share link with studio
5. **Export**: Download favorites as ZIP

## Security Considerations

- ✅ Authentication required (JWT token)
- ✅ User can only access their own favorites
- ✅ Unique constraints prevent duplicates
- ✅ Cascade delete on user/photo deletion

## Related Issues

- Issue #1: Photo selection (could filter by favorites)
- Future: Batch print order from selections
- Future: Share favorites with friends

## References

- Photo Models: `app/db/models/photo.py:115-162`
- API Client: `lib/api-client.ts`
- Cache Managers: `src/services/cache/`
- App State: `App.tsx`
