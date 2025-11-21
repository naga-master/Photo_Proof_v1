# 🚀 Onboarding & Multi-Tenant URLs Guide

## Current Status

The **onboarding system is prepared but not yet implemented**. The database fields and schemas exist, but the actual onboarding endpoints and UI need to be built.

## 📍 Current Working URLs

### Frontend URLs (Accessible Now)

#### Studio Domain Access
```
http://demo.photoapp.local:3001          # Demo studio
http://alpha.photoapp.local:3001         # Alpha studio  
http://beta.photoapp.local:3001          # Beta studio
http://gamma.photoapp.local:3001         # Gamma studio
http://localhost:3001                    # Development (uses demo studio)
```

#### Login Page
```
http://demo.photoapp.local:3001/         # Auto-redirects to login if not authenticated
```

**Test Credentials:**
- Username: `studio@admin.com`
- Password: `password123`

### Backend API URLs (Working Now)

#### Public Endpoints (No Auth Required)
```bash
# Health check
GET http://localhost:8000/api/health

# Get studio theme (requires studio domain)
GET http://localhost:8000/api/studio/current
Headers: Host: demo.photoapp.local

# List subscription plans
GET http://localhost:8000/api/studio/plans
```

#### Auth Endpoints
```bash
# Studio login
POST http://localhost:8000/api/auth/studio/login
Body: {"username": "studio@admin.com", "password": "password123"}

# Client login
POST http://localhost:8000/api/auth/client/login
Body: {"username": "client@email.com", "password": "client123"}

# Logout
POST http://localhost:8000/api/auth/logout
```

#### Studio Endpoints (Require Auth)
```bash
# Get complete studio details
GET http://localhost:8000/api/studio/details
Headers: Authorization: Bearer <token>

# Get storage stats
GET http://localhost:8000/api/studio/storage/stats

# Get subscription info
GET http://localhost:8000/api/studio/subscription

# Get enabled features
GET http://localhost:8000/api/studio/features

# List configured domains
GET http://localhost:8000/api/studio/domains

# Invalidate theme cache
POST http://localhost:8000/api/studio/theme/invalidate-cache
```

#### API Documentation
```
http://localhost:8000/docs          # Swagger UI
http://localhost:8000/redoc         # ReDoc UI
```

## 🔨 Planned Onboarding URLs (Not Yet Implemented)

These URLs are reserved in the middleware but need implementation:

### Frontend Onboarding Flow
```
http://photoapp.local:3001/onboarding/start          # Step 1: Choose subdomain
http://photoapp.local:3001/onboarding/plan           # Step 2: Select plan
http://photoapp.local:3001/onboarding/branding       # Step 3: Setup branding
http://photoapp.local:3001/onboarding/domain         # Step 4: Configure domain
http://photoapp.local:3001/onboarding/payment        # Step 5: Payment (if not trial)
http://photoapp.local:3001/onboarding/complete       # Step 6: Confirmation
```

### Backend Onboarding Endpoints (To Be Built)
```bash
# Start onboarding (create new studio)
POST http://localhost:8000/api/onboarding/start
Body: {
  "name": "My Photo Studio",
  "subdomain": "mystudio",
  "email": "owner@mystudio.com",
  "owner_name": "John Doe",
  "password": "securepassword"
}

# Check subdomain availability
GET http://localhost:8000/api/onboarding/check-subdomain?subdomain=mystudio

# Update onboarding step
POST http://localhost:8000/api/onboarding/step
Body: {
  "studio_id": "...",
  "step": "branding",
  "data": {...}
}

# Complete onboarding
POST http://localhost:8000/api/onboarding/complete
Body: {
  "studio_id": "...",
  "plan_id": "..."
}
```

## 📊 Studio Dashboard URLs (Future)

Once logged in, these would be accessible:

### Studio Admin Dashboard
```
http://demo.photoapp.local:3001/dashboard              # Main dashboard
http://demo.photoapp.local:3001/dashboard/settings     # Studio settings
http://demo.photoapp.local:3001/dashboard/branding     # Branding editor
http://demo.photoapp.local:3001/dashboard/domains      # Domain management
http://demo.photoapp.local:3001/dashboard/subscription # Subscription & billing
http://demo.photoapp.local:3001/dashboard/users        # User management
http://demo.photoapp.local:3001/dashboard/storage      # Storage usage
http://demo.photoapp.local:3001/dashboard/analytics    # Analytics
```

### Client Gallery URLs
```
http://demo.photoapp.local:3001/albums                 # Album list
http://demo.photoapp.local:3001/albums/:id             # Album details
http://demo.photoapp.local:3001/gallery/:id            # Photo gallery
http://demo.photoapp.local:3001/store                  # Product store
http://demo.photoapp.local:3001/cart                   # Shopping cart
```

## 🔧 Testing Current Multi-Tenant Features

### Test 1: Access Different Studios
```bash
# Test demo studio theme
curl -H 'Host: demo.photoapp.local' http://localhost:8000/api/studio/current

# Test alpha studio theme
curl -H 'Host: alpha.photoapp.local' http://localhost:8000/api/studio/current

# Test beta studio theme
curl -H 'Host: beta.photoapp.local' http://localhost:8000/api/studio/current
```

### Test 2: Login to Different Studios
```bash
# Login to demo studio
curl -X POST http://localhost:8000/api/auth/studio/login \
  -H 'Content-Type: application/json' \
  -H 'Origin: http://demo.photoapp.local:3001' \
  -d '{"username": "studio@admin.com", "password": "password123"}'
```

### Test 3: Check Studio Details
```bash
# Get details (requires auth token from login)
curl http://localhost:8000/api/studio/details \
  -H 'Authorization: Bearer <your_token_here>' \
  -H 'Host: demo.photoapp.local'
```

## 🎨 Current Studio Configuration

### Demo Studio (Ready to Use)
- **URL:** http://demo.photoapp.local:3001
- **Subdomain:** demo
- **Brand Color:** #6366F1 (Purple)
- **Plan:** Professional (Trial)
- **Login:** studio@admin.com / password123

### Test Studios (Created by Scripts)
- **Alpha:** http://alpha.photoapp.local:3001
- **Beta:** http://beta.photoapp.local:3001
- **Gamma:** http://gamma.photoapp.local:3001

## 🚧 What Needs to Be Built

### Backend (Priority Order)

1. **Onboarding Router** (`app/routers/onboarding.py`)
   - POST `/api/onboarding/start` - Create new studio
   - GET `/api/onboarding/check-subdomain` - Check availability
   - POST `/api/onboarding/step` - Update progress
   - POST `/api/onboarding/complete` - Finalize setup

2. **Studio Settings Router** (Enhance existing)
   - PUT `/api/studio/settings` - Update studio info
   - PUT `/api/studio/branding` - Update branding
   - POST `/api/studio/logo` - Upload logo
   - PUT `/api/studio/domain` - Add custom domain

3. **Payment Integration**
   - Stripe/Razorpay integration
   - Subscription management
   - Billing endpoints

### Frontend (Priority Order)

1. **Onboarding Wizard Components**
   - `OnboardingStart.tsx` - Initial form
   - `OnboardingPlan.tsx` - Plan selection
   - `OnboardingBranding.tsx` - Branding setup
   - `OnboardingDomain.tsx` - Domain config
   - `OnboardingPayment.tsx` - Payment
   - `OnboardingComplete.tsx` - Success screen

2. **Studio Dashboard Pages**
   - `DashboardSettings.tsx` - Settings page
   - `BrandingEditor.tsx` - Visual branding editor
   - `DomainManager.tsx` - Domain management
   - `SubscriptionManager.tsx` - Billing & plans

3. **Existing Components Integration**
   - Update existing dashboard to use multi-tenant data
   - Add studio switcher (for users with multiple studios)
   - Add branding preview

## 📝 Quick Start Guide

### For Development (Right Now)

1. **Start Backend:**
   ```bash
   cd photo_proof_api
   source venv/bin/activate
   python main.py
   ```

2. **Start Frontend:**
   ```bash
   cd Photo_Proof_v1
   npm run dev
   ```

3. **Access Application:**
   ```
   http://demo.photoapp.local:3001
   ```

4. **Login:**
   - Username: studio@admin.com
   - Password: password123

### For Testing Multi-Tenant

1. **Check available studios:**
   ```bash
   sqlite3 photo_proof_api/photo_proof.db "SELECT id, name, subdomain FROM studios"
   ```

2. **Test different domains:**
   - http://demo.photoapp.local:3001
   - http://alpha.photoapp.local:3001
   - http://beta.photoapp.local:3001

3. **Verify theme loading:**
   - Look for debug panel in bottom-right
   - Check studio name in navigation
   - Verify brand color is applied

## 🎯 Next Steps to Build Onboarding

### Phase 1: Backend Endpoints (2-3 days)
1. Create `app/routers/onboarding.py`
2. Implement studio creation logic
3. Add subdomain validation
4. Add email verification
5. Test with curl/Postman

### Phase 2: Frontend Wizard (3-5 days)
1. Create onboarding component structure
2. Build multi-step form with navigation
3. Add form validation
4. Connect to backend APIs
5. Add success/error handling

### Phase 3: Integration (1-2 days)
1. Test complete flow end-to-end
2. Add error recovery
3. Add progress persistence
4. Polish UI/UX

### Phase 4: Payment (3-5 days)
1. Integrate Stripe/Razorpay
2. Add payment form
3. Handle webhooks
4. Add subscription management

## 📚 Related Documentation

- `MULTI_TENANT_IMPLEMENTATION.md` - Complete technical docs
- `GETTING_STARTED_MULTI_TENANT.md` - Quick start guide
- `DEPLOYMENT_CHECKLIST.md` - Production deployment
- `API Documentation` - http://localhost:8000/docs

## 🔗 Useful Links

- **Backend Swagger:** http://localhost:8000/docs
- **Backend ReDoc:** http://localhost:8000/redoc
- **Health Check:** http://localhost:8000/api/health
- **Demo Studio:** http://demo.photoapp.local:3001

---

**Status:** Multi-tenant backend ✅ | Onboarding endpoints ⏳ | Onboarding UI ⏳
**Current:** Login works, multi-tenant themes work, studio isolation works
**Next:** Build onboarding endpoints and UI wizard
