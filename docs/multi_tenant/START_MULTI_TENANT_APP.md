# 🚀 Start Multi-Tenant App - Step by Step

## What You Just Did ✅
- ✅ Domains added to /etc/hosts (demo.photoapp.local, alpha.photoapp.local, etc.)
- ✅ Database initialized with demo studio
- ✅ Backend middleware updated
- ✅ Frontend vite.config.ts updated to allow studio domains

## Why You're Seeing the "Old App"

The Vite dev server needs to be **restarted** to load:
1. The new vite.config.ts (with allowedHosts)
2. The new React components (StudioThemeProvider, etc.)

## 🎯 How to Start Everything

### Step 1: Stop Frontend (if running)
In the terminal running `npm run dev`:
```bash
# Press Ctrl+C to stop
```

### Step 2: Restart Frontend
```bash
cd /Users/ns632@apac.comcast.com/Documents/v0_photo_proof/Photo_Proof_v1
npm run dev
```

**Expected output:**
```
VITE v... ready in ... ms
➜  Local:   http://localhost:3001
➜  Network: http://...
```

### Step 3: Restart Backend (if not already restarted)
```bash
# In another terminal:
cd /Users/ns632@apac.comcast.com/Documents/v0_photo_proof/photo_proof_api
source venv/bin/activate
python main.py
```

**Expected output:**
```
✅ Tenant detection middleware enabled
🚀 Photo Proof API Server
📍 Local:   http://localhost:8000
```

## 🌐 Where to Access the App

### Option 1: Via Studio Domain (Recommended) ✅
```
http://demo.photoapp.local:3001
```

**What you'll see:**
- ✅ Demo Photography Studio branding
- ✅ Purple theme color (#6366F1)
- ✅ Debug panel (bottom-right) showing studio info
- ✅ Multi-tenant features active

### Option 2: Via Localhost (Development Fallback)
```
http://localhost:3001
```

**What you'll see:**
- ✅ Automatically uses "Demo" studio (localhost fallback)
- ✅ Same branding as demo.photoapp.local
- ℹ️ Simpler for quick development

## 🎨 What the NEW App Looks Like

### Key Visual Changes:

1. **Loading Screen** (for ~1 second):
   - Animated skeleton while theme loads
   - Says "Loading studio theme..."

2. **Navigation Bar**:
   - Shows "Demo Photography Studio" (or logo if uploaded)
   - Purple color theme

3. **Cover Page**:
   - Purple "View Gallery" button (instead of white)
   - Studio branding at bottom

4. **Debug Panel** (Development Only):
   - Bottom-right corner
   - Shows studio info, color, logo status
   - Can close it by clicking X

### If You See the "Old App":
- White/gray buttons instead of purple
- No debug panel in corner
- Generic "NAPSTER's Photo Lab" name
- **→ Frontend not restarted yet!**

## 🧪 Test the Multi-Tenant Features

### Test 1: Access via different domains
```bash
# Each should show different studio info
http://demo.photoapp.local:3001
http://alpha.photoapp.local:3001
http://beta.photoapp.local:3001
```

### Test 2: Check backend logs
You should see:
```
📍 Request for studio: Demo Photography Studio
X-Studio-ID: 24cf1e21-d52c-4808-bb8a-bd382f52865b
```

### Test 3: Check debug panel
- Look at bottom-right corner
- Should show:
  - Studio: Demo Photography Studio
  - Color: ● #6366F1
  - Subdomain: demo

### Test 4: API directly
```bash
# Test via curl (should return studio theme)
curl -H 'Host: demo.photoapp.local' http://localhost:8000/api/studio/current
```

**Expected response:**
```json
{
  "id": "24cf1e21-...",
  "name": "Demo Photography Studio",
  "subdomain": "demo",
  "brand_color": "#6366F1"
}
```

## ❌ Troubleshooting

### "Blocked request" Error
**Cause:** Vite config not loaded
**Fix:** 
```bash
# Kill frontend (Ctrl+C) and restart:
cd Photo_Proof_v1
npm run dev
```

### Still Seeing "Old App"
**Cause:** Browser cache
**Fix:**
1. Hard refresh: `Cmd+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows)
2. Or open in Incognito/Private window
3. Or clear browser cache

### "Unable to Load Studio Theme" Error
**Cause:** Backend not restarted with new middleware
**Fix:**
```bash
# Restart backend:
cd photo_proof_api
source venv/bin/activate
python main.py
```

### "Cannot GET /" Error
**Cause:** Frontend not running
**Fix:**
```bash
cd Photo_Proof_v1
npm run dev
```

### Domain Not Resolving
**Cause:** /etc/hosts not updated or DNS cache
**Fix:**
```bash
# Check /etc/hosts:
cat /etc/hosts | grep photoapp.local

# Should show:
# 127.0.0.1 demo.photoapp.local

# Flush DNS cache (Mac):
sudo dscacheutil -flushcache; sudo killall -HUP mDNSResponder
```

## 🎉 Success Checklist

When everything is working, you should have:

- ✅ Backend running on port 8000
- ✅ Frontend running on port 3001
- ✅ Can access http://demo.photoapp.local:3001
- ✅ See purple theme and "Demo Photography Studio"
- ✅ Debug panel shows in bottom-right
- ✅ Backend logs show "Request for studio: Demo..."
- ✅ No errors in browser console

## 🔄 Quick Restart Commands

Save these for future use:

```bash
# Terminal 1 - Backend
cd photo_proof_api && source venv/bin/activate && python main.py

# Terminal 2 - Frontend
cd Photo_Proof_v1 && npm run dev

# Then access:
# http://demo.photoapp.local:3001
```

## 📸 Expected Screenshots

### Before (Old App):
- White/gray theme
- "NAPSTER's Photo Lab"
- No debug panel
- Generic styling

### After (New Multi-Tenant App):
- Purple theme (#6366F1)
- "Demo Photography Studio"
- Debug panel visible
- Dynamic branding

---

**Next:** Restart your frontend dev server and access `http://demo.photoapp.local:3001` 🚀
