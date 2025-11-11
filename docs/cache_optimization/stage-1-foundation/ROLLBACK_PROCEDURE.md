# Stage 1: Foundation - Rollback Procedure

## When to Rollback

Rollback Stage 1 if:
- Critical bugs in store implementation
- Performance degradation
- TypeScript build failures
- Unable to resolve issues quickly

---

## Rollback Methods

### Method 1: Git Revert (Recommended)

If changes are committed:

```bash
cd /Users/ns632@apac.comcast.com/Documents/v0_photo_proof/Photo_Proof_v1

# View recent commits
git log --oneline -5

# Find the commit BEFORE Stage 1
# Revert to that commit
git revert HEAD

# Or reset to specific commit (more destructive)
git reset --hard <commit-hash-before-stage-1>
```

### Method 2: Feature Flag Disable

Since Stage 1 doesn't have caching yet, there's no feature flag to disable. However, you can:

1. **Stop using stores in components**:
   - Revert component changes that use `usePhotoStore`, etc.
   - Go back to direct API calls with useState

2. **Remove store imports**:
   ```typescript
   // Remove:
   import { usePhotoStore } from '../stores/PhotoStore';
   
   // Replace with:
   import { useState, useEffect } from 'react';
   ```

### Method 3: Selective File Removal

If you want to keep the project but remove Stage 1 files:

```bash
cd /Users/ns632@apac.comcast.com/Documents/v0_photo_proof/Photo_Proof_v1

# Remove config files
rm -rf config/

# Remove event system
rm -rf src/services/cache-events/

# Remove stores
rm -rf src/stores/

# Remove ConfigLoader
rm src/services/ConfigLoader.ts

# Revert component changes manually
```

Then update components to use original direct API approach.

---

## Step-by-Step Rollback

### Step 1: Backup Current State

```bash
# Create backup branch
git checkout -b stage1-backup

# Switch back to main branch
git checkout main
```

### Step 2: Remove Dependencies

```bash
# Uninstall Zustand if not needed elsewhere
npm uninstall zustand uuid @types/uuid

# Or keep if needed for other purposes
```

### Step 3: Revert Component Changes

For each component using stores, revert to original:

**Example: GalleryPage.tsx**

```typescript
// OLD (before Stage 1):
const [photos, setPhotos] = useState<Photo[]>([]);

useEffect(() => {
  photoService.getProjectPhotos(projectId).then(res => {
    setPhotos(res.photos);
  });
}, [projectId]);

// NEW (Stage 1):
const photos = usePhotoStore(state => 
  state.getProjectPhotos(projectId)
);
const fetchPhotos = usePhotoStore(state => 
  state.fetchProjectPhotos
);

useEffect(() => {
  fetchPhotos(projectId);
}, [projectId, fetchPhotos]);

// ROLLBACK: Use OLD approach
```

### Step 4: Remove Store Initializations

Remove any store initialization code added to `App.tsx` or other root files.

### Step 5: Test

```bash
npm run dev

# Test all major flows:
# - Dashboard
# - Project navigation
# - Gallery
# - Folders
```

### Step 6: Verify

- [ ] App loads without errors
- [ ] All navigation works
- [ ] No console errors
- [ ] TypeScript builds successfully

---

## Verification Checklist

After rollback:

- [ ] App starts successfully
- [ ] No import errors for missing files
- [ ] Dashboard loads projects
- [ ] Gallery loads photos
- [ ] Navigation works
- [ ] No console errors
- [ ] `npm run build` succeeds
- [ ] Performance acceptable

---

## Prevention

To avoid needing rollback:

1. **Test thoroughly** before marking stage complete
2. **Use feature flags** for new features
3. **Keep changes small** and incremental
4. **Commit frequently** with clear messages
5. **Backup before major changes**

---

## Recovery After Rollback

If you need to retry Stage 1:

1. **Analyze what went wrong**
   - Check error logs
   - Review test results
   - Identify root cause

2. **Fix issues in backup branch**
   ```bash
   git checkout stage1-backup
   # Make fixes
   # Test thoroughly
   ```

3. **Merge when stable**
   ```bash
   git checkout main
   git merge stage1-backup
   ```

---

## Emergency Hotfix

If production is affected and you need immediate rollback:

```bash
# 1. Revert to last known good commit
git revert HEAD --no-edit

# 2. Force push (if needed)
git push origin main --force

# 3. Rebuild and deploy
npm run build
# Deploy to production
```

---

## Contact

If rollback issues occur:
- Check documentation in `docs/stage-1-foundation/`
- Review event logs: `window.__cacheEvents.export()`
- Export config: `window.__config.get()`
- Check console for errors

---

## Lessons Learned

Document any issues that led to rollback:

```
Issue: ___________________
Root Cause: ___________________
Fix Applied: ___________________
Prevention: ___________________
```

This helps avoid similar issues in future stages.
