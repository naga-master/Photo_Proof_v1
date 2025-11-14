# Testing Guide - Favorite & Selection Fixes

## Quick Test Checklist

### Prerequisites
1. Backend API running at the configured endpoint
2. User logged in (studio user or client)
3. Project with photos available

---

## Test 1: Favorite Button in Grid View

**Steps**:
1. Navigate to a gallery page with photos
2. Hover over a photo
3. Click the heart icon button
4. Verify:
   - ✅ Heart turns red/filled immediately (optimistic update)
   - ✅ No error toast appears
   - ✅ Console shows: `[App] ✅ Toggled favorite for photo {id}: true`

5. Refresh the page (F5 or Cmd+R)
6. Verify:
   - ✅ Photo still shows as favorited (red/filled heart)
   - ✅ Data persisted in database

7. Click the heart again to unfavorite
8. Verify:
   - ✅ Heart returns to outline (unfilled)
   - ✅ Console shows: `[App] ✅ Toggled favorite for photo {id}: false`

---

## Test 2: Selection Button in Grid View

**Steps**:
1. Navigate to a gallery page
2. Hover over a photo
3. Click the checkmark icon button
4. Verify:
   - ✅ Button turns blue (selected state)
   - ✅ Console shows: `[App] ✅ Toggled selection for photo {id}: true`

5. Refresh the page
6. Verify:
   - ✅ Photo still shows as selected
   - ✅ Selection persisted

---

## Test 3: Favorite Button in Lightbox

**Steps**:
1. Open a photo in lightbox (click on any photo)
2. Click the heart button in the top toolbar
3. Verify:
   - ✅ Heart fills/unfills immediately
   - ✅ No error toast
   - ✅ Backend call made (check Network tab)

4. Close lightbox and reopen the same photo
5. Verify:
   - ✅ Favorite state is correct

---

## Test 4: Selection Button in Lightbox

**Steps**:
1. Open photo in lightbox
2. Click the checkmark button in toolbar
3. Verify:
   - ✅ Button background changes to blue when selected
   - ✅ Backend call successful

4. Navigate to next photo (arrow key or button)
5. Navigate back
6. Verify:
   - ✅ Selection state persisted

---

## Test 5: Error Handling

**Steps**:
1. Stop the backend API server
2. Try to toggle favorite on a photo
3. Verify:
   - ✅ Toast notification appears: "Failed to update favorite status"
   - ✅ UI reverts to original state (optimistic update rolled back)
   - ✅ Console shows error

4. Restart backend
5. Verify:
   - ✅ Next toggle works correctly

---

## Test 6: Scrolling

**Steps**:
1. Navigate to a page with many photos (e.g., 50+ photos)
2. Scroll down to the bottom
3. Verify:
   - ✅ Page scrolls smoothly
   - ✅ All photos are accessible
   - ✅ No content is clipped or hidden

4. Test on different pages:
   - Gallery page
   - Albums page
   - Store page

---

## Test 7: Cache Invalidation

**Steps**:
1. Open browser DevTools (F12)
2. Go to Console tab
3. Run: `await window.__indexedDB.keys()`
4. Note the cache keys (should see entries like `photos_project_1`)

5. Toggle favorite on a photo
6. Run: `await window.__indexedDB.keys()` again
7. Verify:
   - ✅ Photo cache entries were deleted (or at least invalidated)
   
8. Navigate to another page and back
9. Verify:
   - ✅ Photos reload with correct favorite/selection states
   - ✅ New cache entries created

---

## Test 8: Multiple Quick Toggles

**Steps**:
1. Rapidly click favorite button 5 times in quick succession
2. Verify:
   - ✅ UI updates correctly (toggles on/off with each click)
   - ✅ No race conditions or stuck states
   - ✅ Final state matches last click

3. Refresh page
4. Verify:
   - ✅ Final state persisted correctly

---

## Test 9: Batch Operations

**Steps**:
1. Toggle favorites on 10 different photos quickly
2. Verify:
   - ✅ All favorites saved correctly
   - ✅ No API errors in console
   - ✅ Network tab shows 10 PATCH requests

3. Refresh page
4. Verify:
   - ✅ All 10 photos still show as favorited

---

## Test 10: Cross-Device Sync (If applicable)

**Steps**:
1. Login on Device 1
2. Favorite a photo
3. Login on Device 2 with same account
4. Verify:
   - ✅ Favorite appears on Device 2
   
*Note: This test verifies backend persistence works correctly*

---

## Browser Console Tests

### Check Cache Stats
```javascript
// Get cache statistics
await window.__indexedDB.stats()
// Should show: entryCount, totalSize, oldestEntry, newestEntry
```

### Check Cache Keys
```javascript
// List all cache keys
await window.__indexedDB.keys()
// Should show array of cache keys like: ["photos_project_1", "user_profile", etc.]
```

### Get Cached Photo Data
```javascript
// Get specific cache entry
await window.__indexedDB.get('photos_project_1')
// Should show cached photo data
```

### Clear Cache
```javascript
// Clear all cache (useful for testing)
await window.__indexedDB.clear()
```

---

## Network Tab Verification

### Expected API Calls for Favorite Toggle

**Request**:
```
PATCH /v2/photos/{photo_id}
Content-Type: application/json
Authorization: Bearer {token}

Body:
{
  "is_favorite": true
}
```

**Response** (200 OK):
```json
{
  "id": "123",
  "project_id": "456",
  "is_favorite": true,
  "is_selected": false,
  // ... other photo fields
}
```

### Expected API Calls for Selection Toggle

**Request**:
```
PATCH /v2/photos/{photo_id}
Content-Type: application/json

Body:
{
  "is_selected": true
}
```

---

## Common Issues & Troubleshooting

### Issue: Favorite doesn't persist after refresh
**Possible Causes**:
- Backend API not running
- API endpoint incorrect in config
- Authentication token expired
- Database write failed

**Debug Steps**:
1. Check Network tab for 401/403/500 errors
2. Check backend logs
3. Verify database connection
4. Check `photoService.updatePhoto()` is called

---

### Issue: Error toast appears on every toggle
**Possible Causes**:
- Backend API unreachable
- CORS issues
- Invalid photo ID

**Debug Steps**:
1. Open Network tab and try toggle
2. Look for failed API calls
3. Check console for error details
4. Verify photo ID is valid

---

### Issue: Page doesn't scroll
**Possible Causes**:
- `overflow-auto` class not applied
- CSS conflict
- Height constraints

**Debug Steps**:
1. Inspect main container element
2. Verify `overflow-auto` class is present
3. Check computed styles in DevTools
4. Try adding `overflow-y: auto !important` temporarily

---

### Issue: Optimistic update doesn't revert on error
**Possible Causes**:
- Error not caught properly
- Revert logic issue

**Debug Steps**:
1. Check console for error logs
2. Verify try-catch blocks are working
3. Add breakpoints in error handlers

---

## Performance Testing

### Test Cache Performance
```javascript
// Time cache read
console.time('cache-read');
await window.__indexedDB.get('photos_project_1');
console.timeEnd('cache-read');
// Should be < 10ms

// Time cache write
console.time('cache-write');
await window.__indexedDB.set('test_key', { data: 'test' });
console.timeEnd('cache-write');
// Should be < 50ms
```

### Test API Response Time
- Open Network tab
- Toggle favorite
- Check timing for PATCH request
- Should be < 500ms for good UX

---

## Regression Testing

Ensure these still work after changes:

1. ✅ Photo upload
2. ✅ Photo download
3. ✅ Comments system
4. ✅ Lightbox navigation (prev/next)
5. ✅ Slideshow mode
6. ✅ Photo grid rendering
7. ✅ Lazy loading
8. ✅ Image caching (Service Worker)

---

## Sign-Off Checklist

Before considering the feature complete:

- [ ] All 10 tests pass
- [ ] No console errors during normal usage
- [ ] Network requests successful (200 OK)
- [ ] Cache invalidation working
- [ ] Scrolling works on all pages
- [ ] Error handling working (tested with backend down)
- [ ] Optimistic updates working smoothly
- [ ] Build completes without errors
- [ ] No TypeScript errors
- [ ] Performance acceptable (< 500ms API response)

---

## Automated Testing (Future)

Consider adding:
1. Unit tests for `toggleFavorite` and `toggleSelection`
2. Integration tests for API calls
3. E2E tests with Playwright/Cypress
4. Cache behavior tests

Example test cases:
```typescript
describe('toggleFavorite', () => {
  it('should update local state optimistically', async () => {
    // Test optimistic update
  });
  
  it('should call backend API', async () => {
    // Mock API and verify call
  });
  
  it('should revert on error', async () => {
    // Mock API failure and verify revert
  });
  
  it('should invalidate cache', async () => {
    // Verify cache entries deleted
  });
});
```
