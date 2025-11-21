# 🎯 Onboarding UI Implementation Plan

## Current Status: ❌ NOT IMPLEMENTED

You're correct - the onboarding pages **DO NOT EXIST**. When you access `/onboarding/start`, you see the dashboard because:

1. ❌ **No React Router** - App uses internal state-based navigation
2. ❌ **No Onboarding Components** - None of the onboarding UI exists
3. ❌ **No URL Routing** - All URLs just load the main app
4. ❌ **No Onboarding Backend Endpoints** - Backend routes are planned but not built

## Why URLs Show Dashboard

The app currently uses **state-based navigation** (`const [page, setPage] = useState<Page>('login')`), not URL routing. When you access any URL, it just loads `App.tsx` which defaults to the login/dashboard page.

### Current Page Types (No Onboarding):
```typescript
type Page = 'login' | 'cover' | 'albums' | 'albumFolders' | 'galleryFolders' | 
            'gallery' | 'dashboard' | 'store' | 'about' | 'productDetail' | 
            'photoSelection' | 'cartConfig' | 'cart' | 'checkout' | 'orderConfirmation';
// ❌ No 'onboarding' pages!
```

## 📋 Complete Implementation Plan

### Phase 1: Setup React Router (2-3 hours)

#### Step 1.1: Install React Router
```bash
cd Photo_Proof_v1
npm install react-router-dom
npm install --save-dev @types/react-router-dom
```

#### Step 1.2: Create Router Configuration
**File:** `src/router/index.tsx` (NEW)
```tsx
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import App from '../App';
import OnboardingLayout from '../components/onboarding/OnboardingLayout';
import OnboardingStart from '../components/onboarding/OnboardingStart';
import OnboardingPlan from '../components/onboarding/OnboardingPlan';
import OnboardingBranding from '../components/onboarding/OnboardingBranding';
import OnboardingDomain from '../components/onboarding/OnboardingDomain';
import OnboardingPayment from '../components/onboarding/OnboardingPayment';
import OnboardingComplete from '../components/onboarding/OnboardingComplete';

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
  },
  {
    path: '/onboarding',
    element: <OnboardingLayout />,
    children: [
      { path: 'start', element: <OnboardingStart /> },
      { path: 'plan', element: <OnboardingPlan /> },
      { path: 'branding', element: <OnboardingBranding /> },
      { path: 'domain', element: <OnboardingDomain /> },
      { path: 'payment', element: <OnboardingPayment /> },
      { path: 'complete', element: <OnboardingComplete /> },
    ],
  },
]);

export default router;
```

#### Step 1.3: Update index.tsx
**File:** `index.tsx`
```tsx
import { RouterProvider } from 'react-router-dom';
import router from './router';

root.render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);
```

---

### Phase 2: Build Backend Endpoints (4-6 hours)

#### Step 2.1: Create Onboarding Router
**File:** `photo_proof_api/app/routers/onboarding.py` (NEW)

```python
"""Studio onboarding endpoints."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr, Field
import re

from app.db.session import get_db
from app.db.models import Studio, StudioDomain, User, SubscriptionPlan, StudioSubscription
from app.services.auth_service import AuthService
from datetime import datetime, timedelta

router = APIRouter(prefix="/onboarding", tags=["Onboarding"])


# ========== Request Models ==========

class CheckSubdomainRequest(BaseModel):
    subdomain: str = Field(min_length=3, max_length=50)


class OnboardingStartRequest(BaseModel):
    studio_name: str = Field(min_length=2, max_length=100)
    subdomain: str = Field(min_length=3, max_length=50)
    email: EmailStr
    owner_name: str = Field(min_length=2, max_length=100)
    password: str = Field(min_length=8)
    phone: str | None = None


class OnboardingBrandingRequest(BaseModel):
    studio_id: str
    brand_color: str = Field(default="#6366F1")
    typography: str = Field(default="System Default (Inter & Cormorant)")
    custom_css: str | None = None


class OnboardingDomainRequest(BaseModel):
    studio_id: str
    custom_domain: str | None = None


class OnboardingCompleteRequest(BaseModel):
    studio_id: str
    plan_id: str


# ========== Endpoints ==========

@router.get("/check-subdomain")
async def check_subdomain_availability(
    subdomain: str,
    db: Session = Depends(get_db)
):
    """Check if subdomain is available."""
    
    # Validate subdomain format
    if not re.match(r'^[a-z0-9][a-z0-9-]*[a-z0-9]$', subdomain):
        return {
            "available": False,
            "reason": "Subdomain must contain only lowercase letters, numbers, and hyphens"
        }
    
    # Check if subdomain exists
    existing = db.query(Studio).filter_by(subdomain=subdomain).first()
    
    if existing:
        return {
            "available": False,
            "reason": "This subdomain is already taken"
        }
    
    # Check reserved subdomains
    reserved = ['www', 'api', 'app', 'admin', 'dashboard', 'mail', 'ftp', 'localhost']
    if subdomain in reserved:
        return {
            "available": False,
            "reason": "This subdomain is reserved"
        }
    
    return {
        "available": True,
        "subdomain": subdomain,
        "full_domain": f"{subdomain}.photoapp.local"
    }


@router.post("/start")
async def start_onboarding(
    data: OnboardingStartRequest,
    db: Session = Depends(get_db)
):
    """Start onboarding - create studio and owner account."""
    
    # Check subdomain availability
    existing = db.query(Studio).filter_by(subdomain=data.subdomain).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Subdomain already taken"
        )
    
    # Check email availability
    existing_user = db.query(User).filter_by(email=data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    try:
        # Create studio
        studio = Studio(
            name=data.studio_name,
            email=data.email,
            phone=data.phone,
            subdomain=data.subdomain,
            brand_color="#6366F1",  # Default
            typography="System Default (Inter & Cormorant)",
            onboarding_completed=False,
            onboarding_step="plan",  # Next step
            is_active=True
        )
        db.add(studio)
        db.flush()
        
        # Create studio domain entry
        domain = StudioDomain(
            studio_id=studio.id,
            domain=f"{data.subdomain}.photoapp.local",
            subdomain=data.subdomain,
            is_primary=True,
            is_verified=True,  # Auto-verify local domains
            verified_at=datetime.utcnow()
        )
        db.add(domain)
        
        # Create owner user
        hashed_password = AuthService.hash_password(data.password)
        owner = User(
            email=data.email,
            name=data.owner_name,
            hashed_password=hashed_password,
            role="studio",
            studio_id=studio.id,
            is_owner=True,
            is_active=True
        )
        db.add(owner)
        
        db.commit()
        db.refresh(studio)
        db.refresh(owner)
        
        return {
            "studio_id": studio.id,
            "subdomain": studio.subdomain,
            "next_step": "plan",
            "message": "Studio created successfully"
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create studio: {str(e)}"
        )


@router.post("/branding")
async def update_branding(
    data: OnboardingBrandingRequest,
    db: Session = Depends(get_db)
):
    """Update studio branding."""
    
    studio = db.query(Studio).filter_by(id=data.studio_id).first()
    if not studio:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Studio not found"
        )
    
    studio.brand_color = data.brand_color
    studio.typography = data.typography
    studio.custom_css = data.custom_css
    studio.onboarding_step = "domain"
    
    db.commit()
    
    return {
        "studio_id": studio.id,
        "next_step": "domain",
        "message": "Branding updated successfully"
    }


@router.post("/domain")
async def configure_domain(
    data: OnboardingDomainRequest,
    db: Session = Depends(get_db)
):
    """Configure custom domain (optional)."""
    
    studio = db.query(Studio).filter_by(id=data.studio_id).first()
    if not studio:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Studio not found"
        )
    
    if data.custom_domain:
        # Add custom domain
        existing = db.query(StudioDomain).filter_by(domain=data.custom_domain).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Domain already registered"
            )
        
        domain = StudioDomain(
            studio_id=studio.id,
            domain=data.custom_domain,
            is_primary=False,
            is_verified=False  # Requires verification
        )
        db.add(domain)
    
    studio.onboarding_step = "payment"
    db.commit()
    
    return {
        "studio_id": studio.id,
        "next_step": "payment",
        "message": "Domain configuration saved"
    }


@router.post("/complete")
async def complete_onboarding(
    data: OnboardingCompleteRequest,
    db: Session = Depends(get_db)
):
    """Complete onboarding and activate subscription."""
    
    studio = db.query(Studio).filter_by(id=data.studio_id).first()
    if not studio:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Studio not found"
        )
    
    plan = db.query(SubscriptionPlan).filter_by(id=data.plan_id).first()
    if not plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Plan not found"
        )
    
    try:
        # Create subscription (with 14-day trial)
        subscription = StudioSubscription(
            studio_id=studio.id,
            plan_id=plan.id,
            status="trialing",
            trial_ends_at=datetime.utcnow() + timedelta(days=14),
            current_period_start=datetime.utcnow(),
            current_period_end=datetime.utcnow() + timedelta(days=30)
        )
        db.add(subscription)
        
        # Mark onboarding complete
        studio.onboarding_completed = True
        studio.onboarding_step = "completed"
        studio.subscription_tier = plan.name
        studio.max_projects = plan.max_projects
        studio.max_storage_gb = plan.max_storage_gb
        
        db.commit()
        db.refresh(studio)
        
        return {
            "studio_id": studio.id,
            "subdomain": studio.subdomain,
            "plan": plan.name,
            "trial_days": 14,
            "message": "Onboarding completed successfully!",
            "redirect_url": f"http://{studio.subdomain}.photoapp.local:3001/dashboard"
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to complete onboarding: {str(e)}"
        )


@router.get("/status/{studio_id}")
async def get_onboarding_status(
    studio_id: str,
    db: Session = Depends(get_db)
):
    """Get current onboarding status."""
    
    studio = db.query(Studio).filter_by(id=studio_id).first()
    if not studio:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Studio not found"
        )
    
    return {
        "studio_id": studio.id,
        "current_step": studio.onboarding_step,
        "completed": studio.onboarding_completed,
        "studio_name": studio.name,
        "subdomain": studio.subdomain
    }
```

#### Step 2.2: Register Onboarding Router
**File:** `photo_proof_api/app/api/__init__.py`

```python
from app.routers import onboarding

api_router.include_router(onboarding.router)
```

---

### Phase 3: Build Frontend Components (6-8 hours)

#### Step 3.1: Create Onboarding Services
**File:** `src/services/onboardingService.ts` (NEW)

```typescript
import { apiClient } from './api-client';

export interface OnboardingStartData {
  studio_name: string;
  subdomain: string;
  email: string;
  owner_name: string;
  password: string;
  phone?: string;
}

export interface OnboardingBrandingData {
  studio_id: string;
  brand_color: string;
  typography: string;
  custom_css?: string;
}

export const onboardingService = {
  checkSubdomain: async (subdomain: string) => {
    const response = await apiClient.get(`/api/onboarding/check-subdomain?subdomain=${subdomain}`);
    return response.data;
  },

  startOnboarding: async (data: OnboardingStartData) => {
    const response = await apiClient.post('/api/onboarding/start', data);
    return response.data;
  },

  updateBranding: async (data: OnboardingBrandingData) => {
    const response = await apiClient.post('/api/onboarding/branding', data);
    return response.data;
  },

  configureDomain: async (studio_id: string, custom_domain?: string) => {
    const response = await apiClient.post('/api/onboarding/domain', {
      studio_id,
      custom_domain,
    });
    return response.data;
  },

  completeOnboarding: async (studio_id: string, plan_id: string) => {
    const response = await apiClient.post('/api/onboarding/complete', {
      studio_id,
      plan_id,
    });
    return response.data;
  },

  getStatus: async (studio_id: string) => {
    const response = await apiClient.get(`/api/onboarding/status/${studio_id}`);
    return response.data;
  },
};
```

#### Step 3.2: Create Onboarding Layout
**File:** `src/components/onboarding/OnboardingLayout.tsx` (NEW)

```tsx
import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';

const steps = [
  { id: 'start', label: 'Get Started', path: '/onboarding/start' },
  { id: 'plan', label: 'Choose Plan', path: '/onboarding/plan' },
  { id: 'branding', label: 'Branding', path: '/onboarding/branding' },
  { id: 'domain', label: 'Domain', path: '/onboarding/domain' },
  { id: 'payment', label: 'Payment', path: '/onboarding/payment' },
];

export default function OnboardingLayout() {
  const location = useLocation();
  const currentStepIndex = steps.findIndex(s => location.pathname.includes(s.id));

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Progress Bar */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-8 py-6">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                  index <= currentStepIndex
                    ? 'border-indigo-600 bg-indigo-600 text-white'
                    : 'border-slate-300 bg-white text-slate-400'
                }`}>
                  {index < currentStepIndex ? '✓' : index + 1}
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-24 h-1 ${
                    index < currentStepIndex ? 'bg-indigo-600' : 'bg-slate-300'
                  }`} />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2">
            {steps.map((step) => (
              <div key={step.id} className="text-xs text-slate-600">
                {step.label}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-8 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Outlet />
        </motion.div>
      </div>

      {/* Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 py-4">
        <div className="max-w-4xl mx-auto px-8 text-center text-sm text-slate-500">
          Need help? Contact support@photoapp.com
        </div>
      </div>
    </div>
  );
}
```

#### Step 3.3: Create Start Page
**File:** `src/components/onboarding/OnboardingStart.tsx` (NEW)

```tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { onboardingService } from '../../services/onboardingService';

export default function OnboardingStart() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    studio_name: '',
    subdomain: '',
    email: '',
    owner_name: '',
    password: '',
    phone: '',
  });
  const [subdomainStatus, setSubdomainStatus] = useState<{
    checking: boolean;
    available: boolean;
    message: string;
  }>({ checking: false, available: false, message: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const checkSubdomain = async (subdomain: string) => {
    if (subdomain.length < 3) return;
    
    setSubdomainStatus({ checking: true, available: false, message: '' });
    try {
      const result = await onboardingService.checkSubdomain(subdomain);
      setSubdomainStatus({
        checking: false,
        available: result.available,
        message: result.available ? 'Available!' : result.reason,
      });
    } catch (err) {
      setSubdomainStatus({
        checking: false,
        available: false,
        message: 'Error checking subdomain',
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await onboardingService.startOnboarding(formData);
      // Store studio_id for next steps
      localStorage.setItem('onboarding_studio_id', result.studio_id);
      localStorage.setItem('onboarding_subdomain', result.subdomain);
      
      // Navigate to plan selection
      navigate('/onboarding/plan');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to create studio');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-8">
      <h1 className="text-3xl font-bold text-slate-900 mb-2">
        Create Your Photography Studio
      </h1>
      <p className="text-slate-600 mb-8">
        Start your 14-day free trial. No credit card required.
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Studio Name */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Studio Name *
          </label>
          <input
            type="text"
            required
            value={formData.studio_name}
            onChange={(e) => setFormData({ ...formData, studio_name: e.target.value })}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
            placeholder="e.g., Awesome Photography Studio"
          />
        </div>

        {/* Subdomain */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Choose Your Subdomain *
          </label>
          <div className="flex items-center">
            <input
              type="text"
              required
              value={formData.subdomain}
              onChange={(e) => {
                const value = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '');
                setFormData({ ...formData, subdomain: value });
                checkSubdomain(value);
              }}
              className="flex-1 px-4 py-2 border border-slate-300 rounded-l-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
              placeholder="mystudio"
            />
            <div className="px-4 py-2 bg-slate-100 border border-l-0 border-slate-300 rounded-r-lg text-slate-600">
              .photoapp.local
            </div>
          </div>
          {subdomainStatus.checking && (
            <p className="mt-2 text-sm text-slate-500">Checking...</p>
          )}
          {!subdomainStatus.checking && subdomainStatus.message && (
            <p className={`mt-2 text-sm ${
              subdomainStatus.available ? 'text-green-600' : 'text-red-600'
            }`}>
              {subdomainStatus.message}
            </p>
          )}
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Email Address *
          </label>
          <input
            type="email"
            required
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
            placeholder="you@yourstudio.com"
          />
        </div>

        {/* Owner Name */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Your Name *
          </label>
          <input
            type="text"
            required
            value={formData.owner_name}
            onChange={(e) => setFormData({ ...formData, owner_name: e.target.value })}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
            placeholder="John Doe"
          />
        </div>

        {/* Password */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Password *
          </label>
          <input
            type="password"
            required
            minLength={8}
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
            placeholder="At least 8 characters"
          />
        </div>

        {/* Phone (Optional) */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Phone Number (Optional)
          </label>
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
            placeholder="+1 (555) 123-4567"
          />
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !subdomainStatus.available}
          className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Creating Studio...' : 'Continue to Plan Selection'}
        </button>
      </form>
    </div>
  );
}
```

#### Step 3.4: Create Plan Selection Page
**File:** `src/components/onboarding/OnboardingPlan.tsx` (NEW)

```tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../../services/api-client';

interface Plan {
  id: string;
  name: string;
  display_name: string;
  description: string;
  price_monthly: number;
  price_yearly: number | null;
  max_projects: number;
  max_storage_gb: number;
  max_users: number;
  features: Record<string, any>;
}

export default function OnboardingPlan() {
  const navigate = useNavigate();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      const response = await apiClient.get('/api/studio/plans');
      setPlans(response.data);
      // Auto-select professional plan
      const professionalPlan = response.data.find((p: Plan) => p.name === 'professional');
      if (professionalPlan) {
        setSelectedPlan(professionalPlan.id);
      }
    } catch (err) {
      console.error('Failed to load plans:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleContinue = () => {
    if (selectedPlan) {
      localStorage.setItem('onboarding_plan_id', selectedPlan);
      navigate('/onboarding/branding');
    }
  };

  if (loading) {
    return <div className="text-center py-12">Loading plans...</div>;
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-8">
      <h1 className="text-3xl font-bold text-slate-900 mb-2">
        Choose Your Plan
      </h1>
      <p className="text-slate-600 mb-8">
        Start with a 14-day free trial. Switch plans anytime.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {plans.map((plan) => (
          <div
            key={plan.id}
            onClick={() => setSelectedPlan(plan.id)}
            className={`border-2 rounded-lg p-6 cursor-pointer transition-all ${
              selectedPlan === plan.id
                ? 'border-indigo-600 bg-indigo-50'
                : 'border-slate-200 hover:border-slate-300'
            }`}
          >
            <h3 className="text-xl font-bold text-slate-900 mb-2">
              {plan.display_name}
            </h3>
            <div className="text-3xl font-bold text-indigo-600 mb-4">
              ${plan.price_monthly}
              <span className="text-base text-slate-600 font-normal">/month</span>
            </div>
            <p className="text-slate-600 text-sm mb-4">{plan.description}</p>
            <ul className="space-y-2">
              <li className="text-sm text-slate-700">
                ✓ {plan.max_projects === 999999 ? 'Unlimited' : plan.max_projects} Projects
              </li>
              <li className="text-sm text-slate-700">
                ✓ {plan.max_storage_gb}GB Storage
              </li>
              <li className="text-sm text-slate-700">
                ✓ {plan.max_users === 999 ? 'Unlimited' : plan.max_users} Users
              </li>
            </ul>
          </div>
        ))}
      </div>

      <button
        onClick={handleContinue}
        disabled={!selectedPlan}
        className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed"
      >
        Continue to Branding
      </button>
    </div>
  );
}
```

#### Step 3.5-3.9: Create Remaining Pages
You'll need to create similar files for:
- `OnboardingBranding.tsx` - Color picker, font selector, logo upload
- `OnboardingDomain.tsx` - Custom domain configuration
- `OnboardingPayment.tsx` - Payment setup (Stripe integration)
- `OnboardingComplete.tsx` - Success screen with dashboard link

---

### Phase 4: Integration & Testing (2-3 hours)

#### Step 4.1: Update Main App
**File:** `App.tsx` - Add check for onboarding status

```typescript
useEffect(() => {
  // Check if user needs onboarding
  if (user && user.role === 'studio' && !user.studio?.onboarding_completed) {
    navigate('/onboarding/start');
  }
}, [user]);
```

#### Step 4.2: Testing Checklist
- [ ] Subdomain availability check works
- [ ] Studio creation works
- [ ] Plan selection saves correctly
- [ ] Branding updates apply
- [ ] Domain configuration saves
- [ ] Onboarding completion redirects to dashboard
- [ ] Login works after onboarding

---

## ⏱️ Time Estimates

| Phase | Time | Priority |
|-------|------|----------|
| React Router Setup | 2-3 hours | HIGH |
| Backend Endpoints | 4-6 hours | HIGH |
| Frontend Components | 6-8 hours | HIGH |
| Integration & Testing | 2-3 hours | HIGH |
| **TOTAL** | **14-20 hours** | **~2-3 days** |

---

## 🚀 Quick Start (Minimal Implementation)

If you want a working prototype quickly (4-6 hours):

1. **Install React Router** (30 min)
2. **Build Backend `start` endpoint only** (2 hours)
3. **Build `OnboardingStart` component only** (2 hours)
4. **Test end-to-end** (1 hour)

This gives you a functional "create studio" flow. Add other steps incrementally.

---

## 📝 Next Steps

### Immediate (Now):
1. Install React Router: `npm install react-router-dom`
2. Create backend onboarding router
3. Test backend endpoints with curl/Postman
4. Build frontend components

### After Basic Onboarding Works:
1. Add payment integration (Stripe)
2. Add email verification
3. Add domain verification
4. Add logo upload
5. Polish UI/UX

---

## ✅ Success Criteria

When complete, you should be able to:
- [ ] Access http://photoapp.local:3001/onboarding/start
- [ ] See a form (not dashboard!)
- [ ] Create a new studio
- [ ] Choose a plan
- [ ] Configure branding
- [ ] Complete onboarding
- [ ] Login to the new studio

---

**Status:** Ready to implement
**Estimated Time:** 2-3 days for full implementation
**Quick Prototype:** 4-6 hours for basic flow

Would you like me to start implementing the backend endpoints first, or would you prefer to start with the frontend router setup?
