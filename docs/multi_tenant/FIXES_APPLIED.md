# ✅ Onboarding Fixes Applied

## Errors Encountered

### 1. Backend Error: Invalid User Field
```
500 Internal Server Error
{
    "detail": "Failed to create studio: 'hashed_password' is an invalid keyword argument for User"
}
```

### 2. Frontend Error: StudioThemeProvider
```
[StudioTheme] Failed to load studio theme: Error: Failed to load studio theme
```

---

## Fixes Applied

### Fix 1: User Model Field Names ✅

**File:** `/photo_proof_api/app/routers/onboarding.py`

**Problem:** Used incorrect field names when creating User:
- `hashed_password` → doesn't exist
- Missing `username` field (required)
- `is_owner=True` → doesn't exist
- `role="studio"` → invalid role value

**Solution:** Updated User creation with correct fields:

```python
# BEFORE (❌ Incorrect)
owner = User(
    email=data.email,
    name=data.owner_name,
    hashed_password=hashed_password,  # ❌ Wrong field name
    role="studio",                     # ❌ Invalid role
    studio_id=studio.id,
    is_owner=True,                     # ❌ Field doesn't exist
    is_active=True
)

# AFTER (✅ Correct)
owner = User(
    email=data.email,
    username=data.email,               # ✅ Added required field
    name=data.owner_name,
    password_hash=hashed_password,     # ✅ Correct field name
    role="studio_owner",               # ✅ Valid role
    studio_id=studio.id,
    is_active=True                     # ✅ Removed is_owner
)
```

**User Model Fields (Reference):**
- `id`: String(36) - UUID
- `studio_id`: String(36) - Foreign key
- `name`: String(255) - Full name
- `email`: String(255) - Email (unique)
- `username`: String(255) - Username (unique)
- `password_hash`: String(255) - Hashed password
- `role`: String(50) - One of: 'studio_owner', 'studio_admin', 'studio_photographer', 'client'
- `is_active`: Boolean
- `email_verified`: Boolean
- (No `is_owner` field - use role instead)

---

### Fix 2: StudioThemeProvider Error ✅

**File:** `/Photo_Proof_v1/src/pages/OnboardingPage.tsx`

**Problem:** OnboardingPage wrapped in StudioThemeProvider, which tries to load `/api/studio/current` - but no studio exists yet during onboarding!

**Solution:** Removed StudioThemeProvider wrapper:

```typescript
// BEFORE (❌ Tries to load studio theme)
export default function OnboardingPage() {
  return (
    <StudioThemeProvider>
      <OnboardingFlow />
    </StudioThemeProvider>
  );
}

// AFTER (✅ No theme provider needed)
export default function OnboardingPage() {
  return <OnboardingFlow />;
}
```

**Why this works:**
- Onboarding doesn't need studio theming (no studio exists yet)
- Uses default Tailwind styles instead
- StudioThemeProvider only used after studio is created

---

## Files Modified

### Backend Files:
1. ✅ `/photo_proof_api/app/routers/onboarding.py`
   - Fixed User model field names
   - Added `username` field
   - Changed `hashed_password` → `password_hash`
   - Changed `role="studio"` → `role="studio_owner"`
   - Removed `is_owner=True`

### Frontend Files:
2. ✅ `/Photo_Proof_v1/src/pages/OnboardingPage.tsx`
   - Removed StudioThemeProvider wrapper
   - Added documentation comment

---

## Testing Instructions

### Quick Backend Test

```bash
# Terminal 1 - Start backend
cd photo_proof_api
python main.py

# Terminal 2 - Test endpoint
curl -X POST http://localhost:8000/api/onboarding/start \
  -H "Content-Type: application/json" \
  -d '{
    "studio_name": "Test Studio",
    "subdomain": "teststudio",
    "email": "test@example.com",
    "owner_name": "Test Owner",
    "password": "password123"
  }'

# Should return 200 OK with studio_id, not 500 error
```

### Full Frontend Test

```bash
# Terminal 1 - Start backend
cd photo_proof_api
python main.py

# Terminal 2 - Start frontend
cd Photo_Proof_v1
npm run dev

# Browser - Access onboarding
http://photoapp.local:3001/onboarding/start
# OR
http://localhost:3001/onboarding/start

# Complete all 5 steps
```

**Expected Results:**
- ✅ No 500 errors
- ✅ No StudioThemeProvider errors
- ✅ Can complete all onboarding steps
- ✅ Studio and user created in database
- ✅ Can login to new studio

---

## Database Verification

After successful onboarding, verify data:

```bash
cd photo_proof_api

# Check studio created
sqlite3 photo_proof.db "SELECT id, name, subdomain FROM studios WHERE subdomain='teststudio'"

# Check user created with correct fields
sqlite3 photo_proof.db "SELECT email, username, role FROM users WHERE email='test@example.com'"

# Verify password_hash exists (not null)
sqlite3 photo_proof.db "SELECT LENGTH(password_hash) FROM users WHERE email='test@example.com'"
# Should return a number (length of hash), not NULL
```

---

## What Was Fixed vs What Already Existed

### ✅ Already Implemented (Before):
- Backend onboarding router with all endpoints
- Frontend onboarding components (Start, Plan, Branding, Domain)
- OnboardingComplete component
- OnboardingFlow orchestrator
- Routing setup in index.tsx
- API service methods

### ✅ Fixed Now:
- **Backend:** User model field names in onboarding.py
- **Frontend:** Removed StudioThemeProvider from onboarding

### ⏳ Still TODO (Optional):
- Email verification
- Domain DNS verification
- Payment integration
- Logo upload
- Analytics tracking

---

## Root Cause Analysis

### Error 1: User Model Mismatch
**Root Cause:** The User SQLAlchemy model uses different field names than expected:
- Model uses `password_hash` (not `hashed_password`)
- Model requires `username` field
- Model has no `is_owner` field (use role='studio_owner' instead)

**Prevention:** Always check actual model definition before using

### Error 2: Theme Provider Context
**Root Cause:** StudioThemeProvider assumes a studio exists and tries to load it from `/api/studio/current`. During onboarding, no studio exists yet.

**Prevention:** Only use StudioThemeProvider after studio creation

---

## Additional Notes

### User Roles
Valid values for `User.role`:
- `studio_owner` - Studio owner (full access)
- `studio_admin` - Studio admin
- `studio_photographer` - Studio photographer
- `client` - Client/customer

### Password Hashing
- Uses `AuthService.hash_password()` for hashing
- Stores in `password_hash` field (not `hashed_password`)
- Use `AuthService.verify_password()` for verification

### Username Field
- Required for all users
- Must be unique across all users
- Currently using email as username for simplicity
- Can be changed later to support custom usernames

---

## Summary

**Status:** ✅ FIXED - Ready for testing

**Changes Made:**
1. Fixed User model field names in backend
2. Removed StudioThemeProvider from onboarding frontend

**Next Step:** Test the complete onboarding flow

**Test Command:**
```bash
# Start backend
cd photo_proof_api && python main.py

# In new terminal, start frontend
cd Photo_Proof_v1 && npm run dev

# Open browser
http://photoapp.local:3001/onboarding/start
```

---

**Fixed:** November 21, 2025
**Files Modified:** 2 files
**Lines Changed:** ~10 lines total
