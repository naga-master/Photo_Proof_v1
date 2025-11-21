# 🌐 Domain Setup Guide for Local Development

## The Problem

When you create a new studio via onboarding (e.g., `test.photoapp.local`), the app:
- ✅ Creates the studio in the database
- ✅ Assigns the subdomain
- ❌ **Does NOT automatically add it to `/etc/hosts`**

This means the browser can't resolve the new domain, causing canceled requests.

---

## Why Domains Aren't Auto-Added

**The app CANNOT and SHOULD NOT automatically modify `/etc/hosts` because:**

1. **Security Risk:** Modifying system files requires root/sudo access. A web app should never have that level of privilege.

2. **Production Reality:** In production, you use real DNS (not `/etc/hosts`). The `/etc/hosts` file is only a local development workaround.

3. **Cross-Platform Issues:** Different operating systems store hosts files in different locations and formats.

---

## Solutions

### ✅ Solution 1: Localhost Redirect (AUTOMATIC - Already Implemented)

**What it does:** When completing onboarding in development, the app now automatically redirects to:
```
http://localhost:3001?studio=test
```

Instead of:
```
http://test.photoapp.local:3001
```

**Benefits:**
- ✅ No manual `/etc/hosts` editing required
- ✅ Works immediately after onboarding
- ✅ Studio detected from query parameter
- ✅ Automatic for development environments

**Try it now:** Complete onboarding and click "Go to Dashboard" - it should work!

---

### Solution 2: Manual Domain Addition (For Subdomain Access)

If you prefer using actual subdomains (e.g., `http://test.photoapp.local:3001`), manually add each studio:

**Single Domain:**
```bash
sudo sh -c 'echo "127.0.0.1 test.photoapp.local" >> /etc/hosts'
```

**Multiple Domains:**
```bash
sudo tee -a /etc/hosts << 'EOF'
127.0.0.1 test.photoapp.local
127.0.0.1 mystudio.photoapp.local
127.0.0.1 client1.photoapp.local
EOF
```

**Verify it was added:**
```bash
grep "test.photoapp.local" /etc/hosts
```

---

### Solution 3: Wildcard DNS (Advanced - Optional)

Use a wildcard DNS service that automatically resolves all subdomains to localhost:

**Option A: nip.io**
- Change base domain from `photoapp.local` to `photoapp.127.0.0.1.nip.io`
- ALL subdomains automatically resolve to 127.0.0.1
- No `/etc/hosts` editing needed
- Example: `test.photoapp.127.0.0.1.nip.io:3001` → works immediately

**Option B: localtest.me**
- Similar to nip.io
- `test.photoapp.localtest.me` → 127.0.0.1

**Implementation:** Would require updating backend CORS and frontend URLs.

---

## Current Implementation Details

### What Was Changed

**File:** `/Photo_Proof_v1/src/components/onboarding/OnboardingComplete.tsx`

```typescript
// Detects if running in development
const isDevelopment = window.location.hostname === 'localhost' || 
                       window.location.hostname === 'photoapp.local' ||
                       window.location.hostname === '127.0.0.1';

// Uses localhost redirect in development, subdomain in production
const redirectUrl = isDevelopment 
  ? `http://localhost:3001?studio=${subdomain}`   // Development
  : studioUrl;                                     // Production
```

### How It Works

1. **User completes onboarding** → Creates studio with subdomain `test`
2. **Onboarding complete screen** → Shows success message
3. **User clicks "Go to Dashboard"** → Detects environment
4. **Development:** Redirects to `http://localhost:3001?studio=test`
5. **Production:** Redirects to `http://test.yourdomain.com`

---

## Testing Your Studio

### Quick Test (After Onboarding)

Your studio was created successfully! Test it:

```bash
cd /Users/ns632@apac.comcast.com/Documents/v0_photo_proof/photo_proof_api

# 1. Verify studio exists
sqlite3 photo_proof.db "SELECT id, name, subdomain FROM studios WHERE id='255ce81f-a9aa-48eb-a8ee-13cbc6bc0656'"

# 2. Verify owner account
sqlite3 photo_proof.db "SELECT email, username, role FROM users WHERE studio_id='255ce81f-a9aa-48eb-a8ee-13cbc6bc0656'"

# 3. Check domain record
sqlite3 photo_proof.db "SELECT domain, is_verified FROM studio_domains WHERE subdomain='test'"
```

### Access Your Studio

**Option 1: Localhost (Recommended for Dev)**
```
http://localhost:3001?studio=test
```
Login with the email/password you set during onboarding.

**Option 2: Subdomain (After Adding to /etc/hosts)**
```bash
# First add domain
sudo sh -c 'echo "127.0.0.1 test.photoapp.local" >> /etc/hosts'

# Then access
http://test.photoapp.local:3001
```

---

## For Future Studios

### Every Time You Create a New Studio:

**Automatic (Recommended):**
- Complete onboarding
- Click "Go to Dashboard" 
- ✅ Works immediately via localhost redirect

**Manual (If You Want Subdomains):**
```bash
# After creating "mystudio" via onboarding:
sudo sh -c 'echo "127.0.0.1 mystudio.photoapp.local" >> /etc/hosts'
```

---

## Production Deployment

In production, you'll use **real DNS** instead of `/etc/hosts`:

### DNS Setup (Production)

1. **Add Wildcard DNS Record:**
   ```
   Type: A
   Name: *.photoapp
   Value: <your-server-ip>
   ```

2. **All subdomains automatically work:**
   - `client1.photoapp.com` → your server
   - `client2.photoapp.com` → your server
   - etc.

3. **No manual domain addition needed!**

### SSL Certificates (Production)

Use Let's Encrypt wildcard certificate:
```bash
certbot certonly --manual --preferred-challenges dns \
  -d "*.photoapp.com" -d "photoapp.com"
```

---

## Troubleshooting

### Issue: "This site can't be reached" after onboarding

**Cause:** Domain not in `/etc/hosts`

**Solution 1 (Easy):** Onboarding now redirects to localhost automatically. Just complete onboarding again or manually go to:
```
http://localhost:3001?studio=test
```

**Solution 2 (Manual):** Add domain to `/etc/hosts`:
```bash
sudo sh -c 'echo "127.0.0.1 test.photoapp.local" >> /etc/hosts'
```

### Issue: Redirect still goes to subdomain URL

**Cause:** You accessed onboarding via subdomain (e.g., `demo.photoapp.local`)

**Fix:** Access onboarding via:
- `http://localhost:3001/onboarding/start` or
- `http://photoapp.local:3001/onboarding/start`

Then it will redirect to localhost after completion.

### Issue: Need to remove a domain from /etc/hosts

```bash
# Edit the file
sudo nano /etc/hosts

# Remove the line with the domain, save and exit
```

---

## Summary

✅ **Problem Solved:** Onboarding now auto-redirects to localhost in development

✅ **No Manual Work:** Just complete onboarding and click "Go to Dashboard"

✅ **Works Immediately:** No need to edit `/etc/hosts` for each new studio

✅ **Production Ready:** Real DNS will be used in production deployment

---

**Updated:** November 21, 2025  
**Status:** ✅ Fixed - Localhost redirect implemented
