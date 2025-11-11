# Comment System - Visual Flow Diagrams

## Complete Comment Lifecycle

```
┌─────────────────────────────────────────────────────────────────┐
│                    COMMENT SYSTEM ARCHITECTURE                   │
└─────────────────────────────────────────────────────────────────┘

┌──────────────┐
│     User     │
│  Interface   │
└──────┬───────┘
       │
       │ 1. Types comment & clicks Send
       │
       ↓
┌──────────────────────────────────────────────────────────────┐
│  Lightbox Component (components/Lightbox.tsx)                │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  <CommentsPanel>                                       │  │
│  │    ├─ Comment list display                            │  │
│  │    ├─ Nested replies with threading                   │  │
│  │    └─ <CommentForm onSubmit={onAddComment} />        │  │
│  └────────────────────────────────────────────────────────┘  │
└────────────────────────┬─────────────────────────────────────┘
                         │
                         │ 2. onAddComment(photoId, text, parentId)
                         │
                         ↓
┌──────────────────────────────────────────────────────────────┐
│  App.tsx - State Management                                  │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  const addComment = async (photoId, text, parentId)   │  │
│  │    ├─ Validate currentAlbum exists                    │  │
│  │    ├─ Call CommentService.createComment()             │  │
│  │    ├─ Reload comments tree                            │  │
│  │    ├─ Update React state (allAlbums, galleryContent)  │  │
│  │    └─ Show toast notification                         │  │
│  └────────────────────────────────────────────────────────┘  │
└────────────────────────┬─────────────────────────────────────┘
                         │
                         │ 3. CommentService.createComment()
                         │
                         ↓
┌──────────────────────────────────────────────────────────────┐
│  Comment Service (services/commentService.ts)                │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  createComment(photoId, text, parentId, replyToId)    │  │
│  │    ├─ Get auth token from localStorage                │  │
│  │    ├─ POST to /api/comments/                          │  │
│  │    ├─ Map backend response to frontend type           │  │
│  │    └─ Invalidate cache for photo                      │  │
│  │                                                        │  │
│  │  Cache Management:                                     │  │
│  │    ├─ invalidateCache(photoId)                        │  │
│  │    │   ├─ Clear Memory Cache                          │  │
│  │    │   └─ Clear IndexedDB                             │  │
│  │    └─ storeInCache(photoId, comments)                 │  │
│  └────────────────────────────────────────────────────────┘  │
└────────────────────────┬─────────────────────────────────────┘
                         │
                         │ 4. HTTP POST /api/comments/
                         │    Authorization: Bearer {token}
                         │
                         ↓
┌──────────────────────────────────────────────────────────────┐
│  Backend API (photo_proof_api/app/routers/comments.py)      │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  @router.post("/api/comments/")                        │  │
│  │    ├─ Authenticate user (JWT token)                   │  │
│  │    ├─ Validate request data                           │  │
│  │    ├─ Call CommentService.create_comment()            │  │
│  │    └─ Return comment with user info                   │  │
│  └────────────────────────────────────────────────────────┘  │
└────────────────────────┬─────────────────────────────────────┘
                         │
                         │ 5. CommentService.create_comment()
                         │
                         ↓
┌──────────────────────────────────────────────────────────────┐
│  Backend Service (app/services/comment_service.py)           │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  create_comment(db, photo_id, user_id, text, ...)     │  │
│  │    ├─ Create Comment model                            │  │
│  │    ├─ Set parent_comment_id (for hierarchy)           │  │
│  │    ├─ Set reply_to_id (for display context)           │  │
│  │    ├─ Save to database                                │  │
│  │    └─ Update photo.comment_count                      │  │
│  └────────────────────────────────────────────────────────┘  │
└────────────────────────┬─────────────────────────────────────┘
                         │
                         │ 6. INSERT INTO comments
                         │
                         ↓
┌──────────────────────────────────────────────────────────────┐
│  PostgreSQL Database (photo_proof.db)                        │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  TABLE comments                                        │  │
│  │  ├─ id (auto-increment)                               │  │
│  │  ├─ photo_id (foreign key → photos.id)                │  │
│  │  ├─ user_id (foreign key → users.id)                  │  │
│  │  ├─ text (comment content)                            │  │
│  │  ├─ parent_comment_id (for nesting)                   │  │
│  │  ├─ reply_to_id (for display context)                 │  │
│  │  ├─ is_edited (boolean)                               │  │
│  │  ├─ created_at, updated_at                            │  │
│  │  └─ is_deleted (soft delete)                          │  │
│  └────────────────────────────────────────────────────────┘  │
└────────────────────────┬─────────────────────────────────────┘
                         │
                         │ 7. Response flows back up
                         │
                         ↓
┌──────────────────────────────────────────────────────────────┐
│  Backend builds nested comment tree                          │
│  ├─ Get user info (name, avatar, role)                       │
│  ├─ Build reply context (quote text)                         │
│  ├─ Organize into tree structure                             │
│  └─ Return JSON with nested replies                          │
└────────────────────────┬─────────────────────────────────────┘
                         │
                         ↓
┌──────────────────────────────────────────────────────────────┐
│  Frontend receives response                                  │
│  ├─ Maps backend format to frontend Comment type             │
│  ├─ Reloads all comments for photo (fresh tree)              │
│  ├─ Updates React state                                      │
│  └─ UI re-renders with new comment                           │
└──────────────────────────────────────────────────────────────┘
```

---

## Comment Loading Flow (with Cache)

```
┌─────────────────────────────────────────────────────────────────┐
│               COMMENT LOADING WITH 3-TIER CACHE                  │
└─────────────────────────────────────────────────────────────────┘

User opens photo in lightbox
         ↓
┌────────────────────────────────────────────────────────────┐
│  CommentService.getPhotoComments(photoId)                  │
└────────────────────────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────────────────────────┐
│  LAYER 1: Memory Cache (window.__cache)                    │
│  ├─ Key: comments:photo-${photoId}                         │
│  ├─ TTL: 5 minutes                                         │
│  └─ Speed: 0ms (instant)                                   │
└────────────────────────────────────────────────────────────┘
         │
         ↓ (cache miss)
┌────────────────────────────────────────────────────────────┐
│  LAYER 2: IndexedDB (window.__indexedDB)                   │
│  ├─ Key: comments:photo-${photoId}                         │
│  ├─ TTL: 5 minutes                                         │
│  └─ Speed: ~10ms                                           │
└────────────────────────────────────────────────────────────┘
         │
         │ (cache hit) → Store in Memory Cache → Return
         │
         ↓ (cache miss)
┌────────────────────────────────────────────────────────────┐
│  LAYER 3: Backend API                                      │
│  ├─ GET /api/comments/photos/{photo_id}                    │
│  ├─ Authorization: Bearer {token}                          │
│  └─ Speed: ~100ms                                          │
└────────────────────────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────────────────────────┐
│  Backend Service                                           │
│  ├─ Query database for comments WHERE photo_id            │
│  ├─ Build nested tree structure                           │
│  ├─ Get user info for each comment                        │
│  ├─ Build reply context                                   │
│  └─ Return JSON tree                                      │
└────────────────────────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────────────────────────┐
│  Store in both caches                                      │
│  ├─ Memory Cache (for instant access)                     │
│  └─ IndexedDB (survives page refresh)                     │
└────────────────────────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────────────────────────┐
│  Return to UI → Lightbox renders comments                  │
└────────────────────────────────────────────────────────────┘


CACHE HIT SCENARIOS:

Scenario 1: First View
User opens photo A → Cache miss → API call (100ms) → Render

Scenario 2: Same Photo Again (within 5 min)
User closes and reopens photo A → Memory cache hit (0ms) → Render

Scenario 3: After Page Refresh (within 5 min)
User refreshes browser → Memory cache lost
User opens photo A → IndexedDB hit (10ms) → Memory cache restored → Render

Scenario 4: After 5+ Minutes
User waits 6 minutes → Cache expired → API call (100ms) → Render
```

---

## Nested Reply Structure

```
┌─────────────────────────────────────────────────────────────────┐
│              HOW NESTED COMMENTS ARE STORED                      │
└─────────────────────────────────────────────────────────────────┘

DATABASE STRUCTURE:

Comment 1 (Top-level)
├─ id: 1
├─ parent_comment_id: null
├─ reply_to_id: null
└─ text: "Great photo!"

Comment 2 (Reply to Comment 1)
├─ id: 2
├─ parent_comment_id: 1      ← Points to top-level parent
├─ reply_to_id: 1            ← Points to what we're replying to
└─ text: "Thank you!"

Comment 3 (Reply to Comment 2)
├─ id: 3
├─ parent_comment_id: 1      ← STILL points to top-level parent
├─ reply_to_id: 2            ← Points to Comment 2
└─ text: "You're welcome!"


UI RENDERING:

┌─────────────────────────────────────────────────────────┐
│ 👤 Client                                    2h ago     │
│ Great photo!                                            │
│                                                         │
│ ┌─────────────────────────────────────────────────┐   │
│ │ Replying to: Client                             │   │
│ │ > Great photo!                                  │   │
│ │                                                 │   │
│ │ 👤 Studio                          1h ago      │   │
│ │ Thank you!                                      │   │
│ │                                                 │   │
│ │ ┌───────────────────────────────────────────┐ │   │
│ │ │ Replying to: Studio                       │ │   │
│ │ │ > Thank you!                              │ │   │
│ │ │                                           │ │   │
│ │ │ 👤 Client                  30m ago       │ │   │
│ │ │ You're welcome!                           │ │   │
│ │ └───────────────────────────────────────────┘ │   │
│ └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘


WHY THIS STRUCTURE?

parent_comment_id:
- Always points to top-level comment
- Used for database queries (get all replies for a comment)
- Used for cascading deletes

reply_to_id:
- Points to specific comment being replied to
- Used for UI display (WhatsApp-style quote)
- Used for reply context ("Replying to: [author]")
```

---

## Cache Invalidation Flow

```
┌─────────────────────────────────────────────────────────────────┐
│              CACHE INVALIDATION ON MUTATIONS                     │
└─────────────────────────────────────────────────────────────────┘

User adds/edits/deletes comment
         ↓
┌────────────────────────────────────────────────────────────┐
│  CommentService mutation operation                         │
│  ├─ createComment()                                        │
│  ├─ updateComment()                                        │
│  └─ deleteComment()                                        │
└────────────────────────────────────────────────────────────┘
         ↓
Backend API call completes
         ↓
┌────────────────────────────────────────────────────────────┐
│  invalidateCache(photoId)                                  │
│                                                            │
│  Step 1: Clear Memory Cache                               │
│  ├─ window.__cache.delete(cacheKey)                       │
│  └─ Cache key: comments:photo-${photoId}                  │
│                                                            │
│  Step 2: Clear IndexedDB                                  │
│  ├─ window.__indexedDB.delete(cacheKey)                   │
│  └─ Same cache key                                        │
└────────────────────────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────────────────────────┐
│  Next access to comments                                   │
│  ├─ Cache miss (we just cleared it)                       │
│  ├─ Fetch fresh data from API                             │
│  └─ Store in both caches                                  │
└────────────────────────────────────────────────────────────┘


EXAMPLE TIMELINE:

10:00 AM - User A opens Photo 1
         → Cache miss → Fetch from API → Store in cache

10:02 AM - User A reopens Photo 1
         → Memory cache hit → Instant load (0ms)

10:05 AM - User B adds comment to Photo 1
         → Comment saved to database
         → Cache invalidated for Photo 1

10:06 AM - User A opens Photo 1 again
         → Cache miss (was invalidated)
         → Fetch from API (gets new comment)
         → Store in cache

10:07 AM - User A reopens Photo 1
         → Memory cache hit → Sees new comment instantly
```

---

## Error Handling Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    ERROR HANDLING STRATEGY                       │
└─────────────────────────────────────────────────────────────────┘

User submits comment
         ↓
┌────────────────────────────────────────────────────────────┐
│  App.tsx - addComment()                                    │
│                                                            │
│  try {                                                     │
│    const comment = await CommentService.createComment()   │
│    // Update state                                        │
│    toast.success('Comment added')                         │
│  } catch (error) {                                        │
│    console.error('Failed:', error)                        │
│    toast.error(error.message)                             │
│  }                                                         │
└────────────────────────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────────────────────────┐
│  CommentService.createComment()                            │
│                                                            │
│  if (!token) {                                            │
│    throw new Error('Authentication token not found')      │
│  }                                                         │
│                                                            │
│  const response = await fetch('/api/comments/', {...})    │
│                                                            │
│  if (!response.ok) {                                       │
│    if (response.status === 401) {                         │
│      throw new Error('Unauthorized - please login')       │
│    }                                                       │
│    throw new Error(`Failed: ${response.status}`)          │
│  }                                                         │
└────────────────────────────────────────────────────────────┘


ERROR SCENARIOS:

1. No Auth Token
   ├─ Check: localStorage.getItem('auth_token')
   ├─ Error: "Authentication token not found"
   └─ Action: Redirect to login

2. Token Expired
   ├─ Backend returns: 401 Unauthorized
   ├─ Error: "Unauthorized - please login again"
   └─ Action: Show login prompt

3. Network Error
   ├─ Fetch throws exception
   ├─ Error: "Network request failed"
   └─ Action: Show retry button

4. Backend Error (500)
   ├─ Backend returns: 500 Internal Server Error
   ├─ Error: "Failed to create comment: 500"
   └─ Action: Log to console, show generic error

5. Validation Error (400)
   ├─ Backend returns: 400 Bad Request
   ├─ Error: Backend's error.detail message
   └─ Action: Show specific error (e.g., "Comment too long")


USER FEEDBACK:

✅ Success Toast:
┌─────────────────────────────────┐
│ ✓ Comment added successfully    │
└─────────────────────────────────┘

❌ Error Toast:
┌─────────────────────────────────┐
│ ✗ Unauthorized - please login   │
└─────────────────────────────────┘
```

---

## Performance Comparison

```
┌─────────────────────────────────────────────────────────────────┐
│              BEFORE vs AFTER PERFORMANCE                         │
└─────────────────────────────────────────────────────────────────┘

SCENARIO: User views 10 photos in a gallery

BEFORE (No Backend Integration):
┌──────────────────────────────────────┐
│ Photo 1 → Comments: [] (not saved)   │
│ Photo 2 → Comments: [] (not saved)   │
│ Photo 3 → Comments: [] (not saved)   │
│ ...                                  │
│ Total time: 0ms (but not functional) │
│ Persistence: 0% (lost on refresh)    │
└──────────────────────────────────────┘


AFTER (With Backend + Cache):

First View Session:
┌──────────────────────────────────────────────────┐
│ Photo 1 → API call (100ms) → Cache store        │
│ Photo 2 → API call (100ms) → Cache store        │
│ Photo 3 → API call (100ms) → Cache store        │
│ ...                                              │
│ Total: 10 × 100ms = 1000ms (parallel: 100ms)    │
│ Persistence: 100%                                │
└──────────────────────────────────────────────────┘

Second View (Same Session):
┌──────────────────────────────────────────────────┐
│ Photo 1 → Memory hit (0ms)                       │
│ Photo 2 → Memory hit (0ms)                       │
│ Photo 3 → Memory hit (0ms)                       │
│ ...                                              │
│ Total: 0ms (instant)                             │
│ Improvement: ∞ (infinite speedup)                │
└──────────────────────────────────────────────────┘

After Page Refresh:
┌──────────────────────────────────────────────────┐
│ Photo 1 → IndexedDB hit (10ms)                   │
│ Photo 2 → IndexedDB hit (10ms)                   │
│ Photo 3 → IndexedDB hit (10ms)                   │
│ ...                                              │
│ Total: 10 × 10ms = 100ms (parallel: 10ms)       │
│ Improvement: 10x faster than API                 │
└──────────────────────────────────────────────────┘


CACHE HIT RATE (Estimated):
First session: 0% (all API calls)
Same session: 90% (memory cache)
After refresh: 80% (IndexedDB cache)
Overall: ~85% cache hit rate

NETWORK SAVINGS:
100 photo views per day
- Without cache: 100 API calls
- With cache: ~15 API calls (85% cached)
- Bandwidth saved: 85%
```

---

## System Integration Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                  COMPLETE SYSTEM ARCHITECTURE                    │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                     FRONTEND (React)                        │
│                                                             │
│  ┌───────────────────────────────────────────────────┐     │
│  │ Components Layer                                  │     │
│  │  ├─ Lightbox.tsx (UI)                            │     │
│  │  ├─ CommentsPanel.tsx (display)                  │     │
│  │  ├─ CommentThread.tsx (nesting)                  │     │
│  │  └─ CommentForm.tsx (input)                      │     │
│  └───────────────────────────────────────────────────┘     │
│                       ↕                                     │
│  ┌───────────────────────────────────────────────────┐     │
│  │ State Management (App.tsx)                        │     │
│  │  ├─ allAlbums (photos + comments)                │     │
│  │  ├─ currentAlbum                                  │     │
│  │  ├─ galleryContent                                │     │
│  │  └─ addComment() handler                          │     │
│  └───────────────────────────────────────────────────┘     │
│                       ↕                                     │
│  ┌───────────────────────────────────────────────────┐     │
│  │ Service Layer                                     │     │
│  │  ├─ commentService.ts (comment CRUD)             │     │
│  │  ├─ photoService.ts (photo data)                 │     │
│  │  └─ authService.ts (authentication)              │     │
│  └───────────────────────────────────────────────────┘     │
│                       ↕                                     │
│  ┌───────────────────────────────────────────────────┐     │
│  │ Caching Layer                                     │     │
│  │  ├─ MemoryCacheManager (instant)                 │     │
│  │  └─ IndexedDBManager (persistent)                │     │
│  └───────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────┘
                        ↕ HTTP/REST
┌─────────────────────────────────────────────────────────────┐
│                   BACKEND (FastAPI + Python)                │
│                                                             │
│  ┌───────────────────────────────────────────────────┐     │
│  │ API Routers                                       │     │
│  │  ├─ /api/comments/ (CRUD endpoints)              │     │
│  │  ├─ /api/photos/ (photo endpoints)               │     │
│  │  └─ /api/auth/ (authentication)                  │     │
│  └───────────────────────────────────────────────────┘     │
│                       ↕                                     │
│  ┌───────────────────────────────────────────────────┐     │
│  │ Service Layer                                     │     │
│  │  ├─ comment_service.py                           │     │
│  │  │   ├─ create_comment()                         │     │
│  │  │   ├─ get_photo_comments()                     │     │
│  │  │   ├─ build_comment_tree()                     │     │
│  │  │   └─ get_user_info()                          │     │
│  │  └─ auth_service.py                              │     │
│  └───────────────────────────────────────────────────┘     │
│                       ↕                                     │
│  ┌───────────────────────────────────────────────────┐     │
│  │ Database Models (SQLAlchemy ORM)                  │     │
│  │  ├─ Comment (with parent_comment_id)             │     │
│  │  ├─ Photo                                         │     │
│  │  ├─ User                                          │     │
│  │  └─ Client/Studio                                 │     │
│  └───────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────┘
                        ↕ SQL
┌─────────────────────────────────────────────────────────────┐
│                    DATABASE (PostgreSQL)                    │
│                                                             │
│  ┌───────────────────────────────────────────────────┐     │
│  │ Tables                                            │     │
│  │  ├─ comments (nested structure)                  │     │
│  │  ├─ photos (with comment_count)                  │     │
│  │  ├─ users                                         │     │
│  │  ├─ clients                                       │     │
│  │  └─ studios                                       │     │
│  └───────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

---

**This completes the visual documentation for the Comment System implementation.**

All flows, caching strategies, error handling, and performance optimizations are now fully documented with clear diagrams.
