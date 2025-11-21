# 🧪 Onboarding Testing Guide

## Issues Fixed

### ✅ Issue 1: User Model Field Name Error
**Error:** `'hashed_password' is an invalid keyword argument for User`
**Fix:** Changed `hashed_password` → `password_hash` and added `username` field

### ✅ Issue 2: StudioThemeProvider Error
**Error:** `Failed to load studio theme` during onboarding
**Fix:** Removed StudioThemeProvider from OnboardingPage (not needed during onboarding)

---

## Quick Test (Backend)

Test if the backend endpoint now works:

```bash
cd photo_proof_api

# 1. Make sure backend is running
python main.py

# 2. In another terminal, test subdomain check
curl "http://localhost:8000/api/onboarding/check-subdomain?subdomain=newstudio"

# Expected response:
# {"available": true, "subdomain": "newstudio", "full_domain": "newstudio.photoapp.local"}

# 3. Test studio creation
curl -X POST http://localhost:8000/api/onboarding/start \
  -H "Content-Type: application/json" \
  -d '{
    "studio_name": "My New Studio",
    "subdomain": "mynewstudio",
    "email": "owner@newstudio.com",
    "owner_name": "John Doe",
    "password": "password123"
  }'

# Expected response:
# {
#   "studio_id": "some-uuid",
#   "subdomain": "mynewstudio",
#   "next_step": "plan",
#   "message": "Studio created successfully"
# }
```

---

## Full End-to-End Test (Frontend)

### Step 1: Start Services

**Terminal 1 - Backend:**
```bash
cd photo_proof_api
source venv/bin/activate  # or .venv/bin/activate
python main.py
```

**Terminal 2 - Frontend:**
```bash
cd Photo_Proof_v1
npm run dev
```

### Step 2: Access Onboarding

Open browser and go to:
```
http://photoapp.local:3001/onboarding/start
```

OR

```
http://localhost:3001/onboarding/start
```

### Step 3: Complete Onboarding Flow

**Step 1 - Get Started:**
- Studio Name: "Test Studio"
- Subdomain: "teststudio" (check availability in real-time)
- Email: "test@example.com"
- Your Name: "Test Owner"
- Password: "password123"
- Click "Continue to Plan Selection"

**Expected:**
- ✅ Subdomain availability shows in real-time
- ✅ Form validates all fields
- ✅ No errors in console
- ✅ Proceeds to Step 2

**Step 2 - Choose Plan:**
- Review plans (Starter, Professional, Enterprise)
- Professional should be pre-selected
- Click "Continue to Branding"

**Expected:**
- ✅ All plans loaded from database
- ✅ Can select different plans
- ✅ Proceeds to Step 3

**Step 3 - Customize Branding:**
- Pick a brand color (try presets or custom)
- Select typography
- Review preview
- Click "Continue to Domain Setup"

**Expected:**
- ✅ Color picker works
- ✅ Preview updates
- ✅ Proceeds to Step 4

**Step 4 - Configure Domain:**
- See auto-created subdomain: `teststudio.photoapp.local`
- Optionally add custom domain
- Click "Complete Setup"

**Expected:**
- ✅ Shows correct subdomain
- ✅ Custom domain is optional
- ✅ Proceeds to Step 5

**Step 5 - Complete:**
- See success screen
- See studio URL
- See next steps
- Click "Go to Dashboard"

**Expected:**
- ✅ Shows success message
- ✅ Shows correct studio URL
- ✅ Redirects to: `http://teststudio.photoapp.local:3001`

---

## Verify in Database

After completing onboarding, verify data was created:

```bash
cd photo_proof_api

# Check studio was created
sqlite3 photo_proof.db "SELECT id, name, subdomain, brand_color FROM studios WHERE subdomain='teststudio'"

# Check user was created
sqlite3 photo_proof.db "SELECT id, email, username, role FROM users WHERE email='test@example.com'"

# Check domain was created
sqlite3 photo_proof.db "SELECT domain, is_primary, is_verified FROM studio_domains WHERE subdomain='teststudio'"

# Check subscription was created
sqlite3 photo_proof.db "SELECT studio_id, plan_id, status, trial_ends_at FROM studio_subscriptions ORDER BY created_at DESC LIMIT 1"
```

**Expected Results:**
- ✅ 1 studio record with correct subdomain and branding
- ✅ 1 user record with role='studio_owner'
- ✅ 1 domain record with subdomain.photoapp.local
- ✅ 1 subscription record with status='trialing'

---

## Login to New Studio

After onboarding completes, test login:

1. Go to: `http://teststudio.photoapp.local:3001`
2. Login with:
   - Email: `test@example.com`
   - Password: `password123`
3. Should see dashboard with correct branding

---

## Common Issues & Solutions

### Issue: "Subdomain already taken"
**Solution:** Use a different subdomain or clear test data:
```bash
sqlite3 photo_proof.db "DELETE FROM studios WHERE subdomain='teststudio'"
```

### Issue: "Email already registered"
**Solution:** Use a different email or clear test user:
```bash
sqlite3 photo_proof.db "DELETE FROM users WHERE email='test@example.com'"
```

### Issue: Page shows dashboard instead of onboarding
**Solution:** 
- Check URL is `/onboarding/start` (not `/`)
- Clear browser cache and localStorage
- Try incognito mode

### Issue: "Failed to load resource" (CORS)
**Solution:**
- Ensure backend is running on port 8000
- Check CORS settings in backend
- Try using exact domain from CORS config

### Issue: Can't login after onboarding
**Solution:**
- Verify user was created in database
- Check password was saved correctly
- Try resetting password via SQL:
```bash
# Create new password hash (password123)
python -c "from app.services.auth_service import AuthService; print(AuthService.hash_password('password123'))"

# Update user with new hash
sqlite3 photo_proof.db "UPDATE users SET password_hash='<hash_from_above>' WHERE email='test@example.com'"
```

---

## Network Tab Debugging

If errors occur, check Network tab in browser DevTools:

**Expected API Calls:**

1. `GET /api/onboarding/check-subdomain?subdomain=teststudio`
   - Status: 200
   - Response: `{"available": true, ...}`

2. `POST /api/onboarding/start`
   - Status: 200
   - Response: `{"studio_id": "...", "next_step": "plan", ...}`

3. `GET /api/studio/plans`
   - Status: 200
   - Response: Array of plans

4. `POST /api/onboarding/branding`
   - Status: 200
   - Response: `{"next_step": "domain", ...}`

5. `POST /api/onboarding/domain`
   - Status: 200
   - Response: `{"next_step": "complete", ...}`

6. `POST /api/onboarding/complete`
   - Status: 200
   - Response: `{"redirect_url": "...", ...}`

---

## Success Criteria

Onboarding is working when:

- ✅ No 500 errors in backend
- ✅ No console errors in frontend
- ✅ All 5 steps can be completed
- ✅ Data is saved in database
- ✅ Can login to new studio
- ✅ Branding is applied correctly
- ✅ Progress persists on refresh

---

## Next Steps After Testing

If all tests pass:
- [ ] Add email verification
- [ ] Add domain DNS verification
- [ ] Integrate payment (Stripe/Razorpay)
- [ ] Add logo upload to branding step
- [ ] Add loading states and better error messages
- [ ] Add analytics tracking
- [ ] Add onboarding tutorial

---

**Updated:** November 21, 2025
**Status:** Ready for testing with fixes applied
