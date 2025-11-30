# Security Implementation Checklist

**Document Version:** 1.0  
**Date:** November 30, 2024  
**Status:** Implementation Pending

---

## Overview

This checklist provides a step-by-step guide for implementing the security remediations. Follow the phases in order to ensure a smooth migration.

---

## Phase 1: Backend - Cookie Security & New Endpoints

**Estimated Time:** 1 day

### 1.1 Update Cookie Configuration

**File:** `photo_proof_api/app/routers/auth.py`

- [ ] **Line 54-65:** Update studio login access_token cookie
  ```python
  secure=True,        # Changed from False
  samesite="strict",  # Changed from "lax"
  ```

- [ ] **Line 67-75:** Update studio login refresh_token cookie
  ```python
  secure=True,
  samesite="strict",
  ```

- [ ] **Line 117-127:** Update client login access_token cookie
  ```python
  secure=True,
  samesite="strict",
  ```

- [ ] **Line 129-137:** Update client login refresh_token cookie
  ```python
  secure=True,
  samesite="strict",
  ```

- [ ] **Line 230-238:** Update token refresh access_token cookie
  ```python
  secure=True,
  samesite="strict",
  ```

### 1.2 Add Environment-Based Cookie Config

**File:** `photo_proof_api/app/core/config.py`

- [ ] Add cookie security settings:
  ```python
  COOKIE_SECURE: bool = os.getenv("COOKIE_SECURE", "true").lower() == "true"
  COOKIE_SAMESITE: str = os.getenv("COOKIE_SAMESITE", "strict")
  ```

**File:** `photo_proof_api/.env`

- [ ] Add development settings:
  ```bash
  COOKIE_SECURE=false
  COOKIE_SAMESITE=lax
  ```

### 1.3 Add Auth Verification Endpoint

**File:** `photo_proof_api/app/routers/auth.py`

- [ ] Add new endpoint:
  ```python
  @router.get("/verify")
  def verify_auth(current_user: UserRead = Depends(get_current_user)):
      return {"authenticated": True, "user_id": current_user.id}
  ```

### 1.4 Create Billing Config API

**File:** `photo_proof_api/app/db/models/studio.py` (NEW or UPDATE)

- [ ] Create `StudioBillingConfig` model with fields:
  - `studio_id` (FK)
  - Tax configuration fields
  - Payment methods (JSON)
  - Currency settings
  - Invoice settings

**File:** `photo_proof_api/app/schemas/studio.py` (NEW or UPDATE)

- [ ] Create `BillingConfigRead` schema
- [ ] Create `BillingConfigUpdate` schema
- [ ] Add response masking for sensitive fields

**File:** `photo_proof_api/app/routers/studio.py` (NEW or UPDATE)

- [ ] Add `GET /api/studio/billing-config` endpoint
- [ ] Add `PUT /api/studio/billing-config` endpoint

**Database Migration:**

- [ ] Create migration for `studio_billing_configs` table
- [ ] Run migration: `alembic upgrade head`

### 1.5 Backend Testing

- [ ] Test cookie settings with curl/Postman
- [ ] Test `/api/auth/verify` endpoint
- [ ] Test billing config GET/PUT endpoints
- [ ] Verify cookies are httpOnly in browser DevTools

---

## Phase 2: Frontend - Remove localStorage Secrets

**Estimated Time:** 2 days

### 2.1 Update API Client

**File:** `Photo_Proof_v1/lib/api-client.ts`

- [ ] **Line 23-37:** Remove localStorage token fetch in `getAuthHeaders()`:
  ```typescript
  private getAuthHeaders(): HeadersInit {
      return { 'Content-Type': 'application/json' };
  }
  ```

- [ ] **Line 68:** Remove localStorage.setItem for new token

- [ ] **Line 82-86:** Remove localStorage.removeItem in `clearAuth()`:
  ```typescript
  private clearAuth() {
      window.dispatchEvent(new Event('unauthorized'));
  }
  ```

- [ ] **Line 130:** Remove localStorage.getItem in `makeRequest()`

- [ ] **Line 232:** Remove localStorage.getItem in `uploadFile()`

- [ ] **Line 253:** Remove localStorage.getItem in `getRaw()`

### 2.2 Update Auth Service

**File:** `Photo_Proof_v1/services/authService.ts`

- [ ] **Line 89-96:** Remove localStorage.setItem calls in `storeAuthData()`:
  ```typescript
  private storeAuthData(response: AuthResponse): void {
      console.log('[AuthService] Auth data stored in httpOnly cookie');
  }
  ```

- [ ] **Line 79-85:** Remove localStorage.removeItem calls in `logout()`:
  ```typescript
  async logout(): Promise<void> {
      await apiClient.post('/api/auth/logout');
  }
  ```

- [ ] **Line 101-103:** Update `isAuthenticated()` to use API:
  ```typescript
  async isAuthenticated(): Promise<boolean> {
      try {
          await apiClient.get('/api/auth/verify');
          return true;
      } catch {
          return false;
      }
  }
  ```

- [ ] **Line 108-111:** Update `getStoredUser()` - may need API call

- [ ] **Line 116-118:** Update `getUserRole()` - may need API call

### 2.3 Update Other Services

**File:** `Photo_Proof_v1/services/contractService.ts`

- [ ] **Line 7:** Remove `getAuthToken()` method
- [ ] Update all methods to rely on cookie auth

**File:** `Photo_Proof_v1/services/uploadService.ts`

- [ ] **Line ~50:** Remove localStorage.getItem('auth_token')

**File:** `Photo_Proof_v1/services/chunkedUploadService.ts`

- [ ] Remove localStorage.getItem('auth_token')

**File:** `Photo_Proof_v1/services/invoiceService.ts`

- [ ] **Line ~10:** Remove localStorage.getItem('auth_token')

**File:** `Photo_Proof_v1/services/apiNotificationService.ts`

- [ ] **Line ~5:** Remove getAuthHeaders localStorage usage

**File:** `Photo_Proof_v1/services/unifiedCacheManager.ts`

- [ ] Remove localStorage.getItem('auth_token')

### 2.4 Update Context and Components

**File:** `Photo_Proof_v1/contexts/AuthContext.tsx`

- [ ] Update to use async `isAuthenticated()` check
- [ ] Remove localStorage token verification

**File:** `Photo_Proof_v1/components/ConsentScreen.tsx`

- [ ] **Line ~25:** Remove localStorage.getItem('auth_token')

**File:** `Photo_Proof_v1/src/pages/PrivacySettings.tsx`

- [ ] **Lines ~15, ~30, ~45, ~60:** Remove localStorage.getItem('auth_token')

**File:** `Photo_Proof_v1/App.tsx`

- [ ] **Line ~45:** Remove localStorage.getItem('auth_token')

**File:** `Photo_Proof_v1/components/CreateContractModal.tsx`

- [ ] Remove localStorage.getItem('auth_token')

### 2.5 Migrate Billing Config

**File:** `Photo_Proof_v1/components/studio/SettingsPage.tsx`

- [ ] **Line 47:** Remove localStorage.setItem('billingConfig')
- [ ] Add API call: `apiClient.put('/api/studio/billing-config', billingConfig)`
- [ ] Add useEffect to load config from API on mount

**File:** `Photo_Proof_v1/components/studio/StudioLayout.tsx`

- [ ] **Line ~180, ~220:** Remove localStorage.getItem('billingConfig')
- [ ] Fetch billing config from API before invoice creation

**File:** `Photo_Proof_v1/components/studio/InvoicesPage.tsx`

- [ ] **Line ~35:** Remove localStorage.getItem('billingConfig') fallback

### 2.6 Frontend Testing

- [ ] Test login flow - no token in localStorage
- [ ] Test logout flow - cookies cleared
- [ ] Test page refresh - session persists via cookie
- [ ] Test invoice creation with API billing config
- [ ] Test settings save/load via API
- [ ] Verify DevTools localStorage is clean

---

## Phase 3: HTTPS Configuration

**Estimated Time:** 0.5 day

### 3.1 SSL Certificate Setup (Production)

- [ ] Obtain SSL certificate (Let's Encrypt recommended)
- [ ] Configure web server (nginx/Apache) for HTTPS
- [ ] Enable HTTP to HTTPS redirect
- [ ] Configure HSTS header

### 3.2 Environment Configuration

**File:** `photo_proof_api/.env` (Production)

- [ ] Update settings:
  ```bash
  COOKIE_SECURE=true
  COOKIE_SAMESITE=strict
  CORS_ORIGINS=https://app.yourdomain.com
  ```

**File:** `Photo_Proof_v1/.env.production`

- [ ] Set API URL:
  ```bash
  VITE_API_URL=https://api.yourdomain.com
  ```

### 3.3 HTTPS Testing

- [ ] Test SSL Labs rating (aim for A+)
- [ ] Verify certificate chain
- [ ] Test HTTP redirect to HTTPS
- [ ] Verify cookies sent only over HTTPS
- [ ] Check for mixed content warnings

---

## Phase 4: Cleanup & Legacy Removal

**Estimated Time:** 0.5 day

### 4.1 Add localStorage Cleanup

**File:** `Photo_Proof_v1/services/authService.ts` (in logout or init)

- [ ] Add cleanup for legacy data:
  ```typescript
  // Remove legacy localStorage data
  localStorage.removeItem('auth_token');
  localStorage.removeItem('user_data');
  localStorage.removeItem('user_role');
  localStorage.removeItem('client_id');
  localStorage.removeItem('billingConfig');
  ```

### 4.2 Update Documentation

- [ ] Update API documentation for new endpoints
- [ ] Update deployment guides for HTTPS
- [ ] Document new auth flow

### 4.3 Update Tests

- [ ] Update auth tests for cookie-based auth
- [ ] Add tests for billing config API
- [ ] Add tests for `/api/auth/verify`

---

## Testing Checklist

### Authentication Tests

- [ ] Studio login creates httpOnly cookie
- [ ] Client login creates httpOnly cookie
- [ ] Token refresh works via cookie
- [ ] Logout clears cookies
- [ ] `/api/auth/verify` returns 200 when authenticated
- [ ] `/api/auth/verify` returns 401 when not authenticated
- [ ] localStorage contains no auth tokens after login

### Billing Config Tests

- [ ] Settings page saves to API
- [ ] Settings page loads from API
- [ ] Invoice creation fetches billing config from API
- [ ] localStorage contains no billing config
- [ ] API masks sensitive fields in response

### Security Tests

- [ ] XSS attempt cannot steal token (httpOnly)
- [ ] CSRF blocked (samesite=strict)
- [ ] Cookie not sent over HTTP (secure=true)
- [ ] No sensitive data in localStorage
- [ ] Browser DevTools shows no credentials

---

## Rollback Plan

### If Issues in Production

1. **Immediate:** Revert frontend to use localStorage (temporary)
2. **Backend:** Set `COOKIE_SECURE=false` to support HTTP
3. **Investigation:** Identify root cause
4. **Fix Forward:** Address issue and redeploy

### Rollback Commands

```bash
# Revert frontend changes
git revert <commit-hash>

# Update backend env
COOKIE_SECURE=false
COOKIE_SAMESITE=lax

# Restart backend
systemctl restart photo-proof-api
```

---

## Sign-off

| Phase | Completed By | Date | Verified By | Date |
|-------|--------------|------|-------------|------|
| Phase 1: Backend | | | | |
| Phase 2: Frontend | | | | |
| Phase 3: HTTPS | | | | |
| Phase 4: Cleanup | | | | |
| **Final Sign-off** | | | | |

---

## Related Documents

- [01_SECURITY_OVERVIEW.md](./01_SECURITY_OVERVIEW.md) - Security overview
- [02_AUTHENTICATION_SECURITY.md](./02_AUTHENTICATION_SECURITY.md) - Auth details
- [03_BILLING_DATA_SECURITY.md](./03_BILLING_DATA_SECURITY.md) - Billing security
- [04_HTTPS_TLS_CONFIGURATION.md](./04_HTTPS_TLS_CONFIGURATION.md) - HTTPS setup
- [06_SECURITY_AUDIT_REPORT.md](./06_SECURITY_AUDIT_REPORT.md) - Full audit
