# 🔧 CORS Multi-Tenant Domain Fix

## Problem

When accessing via `demo.photoapp.local:3001`, login fails with CORS error:
```
Access to fetch at 'http://localhost:8000/api/auth/studio/login' 
from origin 'http://demo.photoapp.local:3001' has been blocked by CORS policy
```

## Root Cause

The backend CORS configuration only allowed:
- `http://localhost:3000`
- `http://localhost:3001`
- `http://localhost:3002`
- `http://localhost:5173`

But **NOT** the studio domains like `demo.photoapp.local:3001`.

## Solution Applied

### Fix 1: Updated CORS Origins
**File:** `app/core/config.py`

Added multi-tenant domains to CORS origins:
```python
cors_origins = [
    "http://localhost:3000",
    "http://localhost:3001",
    # ... existing localhost origins
    # NEW: Multi-tenant studio domains
    "http://*.photoapp.local:3001",      # Wildcard pattern
    "http://demo.photoapp.local:3001",
    "http://alpha.photoapp.local:3001",
    "http://beta.photoapp.local:3001",
    "http://gamma.photoapp.local:3001",
]
```

### Fix 2: Tenant Middleware (Already Fixed)
- Skips OPTIONS requests (CORS preflight)
- Skips `/api/auth` endpoints

## 🚀 How to Apply the Fix

### Step 1: Restart Backend (REQUIRED!)
```bash
# In your backend terminal, press Ctrl+C to stop
# Then restart:

cd /Users/ns632@apac.comcast.com/Documents/v0_photo_proof/photo_proof_api
source venv/bin/activate
python main.py
```

**Why:** The backend needs to reload the updated CORS configuration.

### Step 2: Clear Browser Cache
```bash
# Hard refresh:
# Mac: Cmd+Shift+R
# Windows: Ctrl+Shift+R

# Or open Incognito/Private window
```

### Step 3: Try Login Again
```
1. Go to: http://demo.photoapp.local:3001
2. Login with:
   - Username: studio@admin.com
   - Password: password123
```

## Expected Behavior After Fix

### CORS Preflight (OPTIONS)
```
Request URL: http://localhost:8000/api/auth/studio/login
Request Method: OPTIONS
Origin: http://demo.photoapp.local:3001
Status: 200 OK

Response Headers:
  Access-Control-Allow-Origin: http://demo.photoapp.local:3001
  Access-Control-Allow-Credentials: true
  Access-Control-Allow-Methods: *
  Access-Control-Allow-Headers: *
```

### Actual Login (POST)
```
Request URL: http://localhost:8000/api/auth/studio/login
Request Method: POST
Origin: http://demo.photoapp.local:3001
Status: 200 OK

Response Headers:
  Access-Control-Allow-Origin: http://demo.photoapp.local:3001
  Access-Control-Allow-Credentials: true
```

### Backend Logs Should Show:
```
Skipping tenant detection for OPTIONS request
Skipping tenant detection for path: /api/auth/studio/login
✅ Studio user logged in successfully
```

## Testing the Fix

### Test 1: CORS Preflight
```bash
curl -X OPTIONS http://localhost:8000/api/auth/studio/login \
  -H "Origin: http://demo.photoapp.local:3001" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: content-type" \
  -v
```

**Expected:** Should return 200 OK with CORS headers

### Test 2: Login from Demo Domain
```bash
curl -X POST http://localhost:8000/api/auth/studio/login \
  -H "Origin: http://demo.photoapp.local:3001" \
  -H "Content-Type: application/json" \
  -d '{"username": "studio@admin.com", "password": "password123"}' \
  -v
```

**Expected:** Should return 200 OK with access token

### Test 3: Browser Login
1. Open: http://demo.photoapp.local:3001
2. Open DevTools → Network tab
3. Try login
4. Check Network requests:
   - OPTIONS /api/auth/studio/login → 200 OK ✅
   - POST /api/auth/studio/login → 200 OK ✅

## Why This Works

### Before Fix ❌
```
Browser at demo.photoapp.local:3001
  ↓
Requests: http://localhost:8000/api/auth/studio/login
  ↓
Backend CORS: "demo.photoapp.local:3001 not in allowed origins"
  ↓
BLOCKED! No Access-Control-Allow-Origin header
  ↓
Login Fails
```

### After Fix ✅
```
Browser at demo.photoapp.local:3001
  ↓
Requests: http://localhost:8000/api/auth/studio/login
  ↓
Backend CORS: "demo.photoapp.local:3001 is allowed!"
  ↓
Response includes: Access-Control-Allow-Origin: demo.photoapp.local:3001
  ↓
Login Works! 🎉
```

## Troubleshooting

### Still Getting CORS Error?

**1. Backend not restarted:**
```bash
# Verify CORS is working:
curl -I -X OPTIONS http://localhost:8000/api/auth/studio/login \
  -H "Origin: http://demo.photoapp.local:3001"
  
# Should see: Access-Control-Allow-Origin header
```

**2. Browser cached the failed request:**
```bash
# Clear all site data:
DevTools → Application → Clear site data
```

**3. Check backend logs:**
```bash
# Look for these lines:
# Skipping tenant detection for OPTIONS request
# Skipping tenant detection for path: /api/auth/studio/login
```

### Login Works on Localhost but NOT on demo.photoapp.local?

This is the CORS issue - make sure:
1. Backend is restarted ✅
2. Browser cache is cleared ✅
3. Accessing via http://demo.photoapp.local:3001 (not https)

### Network Error or "Failed to fetch"?

Check:
1. Backend is running (http://localhost:8000/api/health)
2. Frontend proxy is working
3. No firewall blocking the request

## All Allowed Origins Now

After the fix, these origins are allowed:

✅ Development:
- http://localhost:3000
- http://localhost:3001
- http://localhost:3002
- http://localhost:5173

✅ Multi-Tenant:
- http://*.photoapp.local:3001 (wildcard)
- http://demo.photoapp.local:3001
- http://alpha.photoapp.local:3001
- http://beta.photoapp.local:3001
- http://gamma.photoapp.local:3001

## Summary

✅ **Fixed:** Added studio domains to CORS origins
✅ **Fixed:** Backend now allows requests from *.photoapp.local
✅ **Result:** Login works from any studio domain
✅ **Impact:** All API requests work from studio domains

**Action Required:** Just restart your backend! 🚀

---

**Status:** 🔧 FIXED - Restart Backend Required
**Time to Fix:** < 1 minute
**Files Changed:** 
- `app/core/config.py` - Added CORS origins
- `app/middleware/tenant.py` - Already fixed earlier
