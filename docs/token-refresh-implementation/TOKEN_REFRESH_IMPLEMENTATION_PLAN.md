# Token Refresh with Automatic Retry - Implementation Plan

**Date**: November 11, 2024  
**Issue**: Token refresh succeeds but original request fails with tokenRefreshed=true  
**Status**: 📋 PLANNING COMPLETE → READY FOR IMPLEMENTATION

---

## Problem Analysis

### Current Behavior (Broken)
```
1. User makes API call (e.g., POST comment)
2. Backend returns 401 (token expired)
3. apiClient detects 401 → calls refreshAccessToken()
4. Token refresh succeeds → new token stored in localStorage
5. apiClient throws error with tokenRefreshed=true  ❌
6. Original request is LOST
7. User sees error, must retry manually
```

### Root Cause
The `handleResponse` method in `api-client.ts` refreshes the token but **does not retry** the original request:

```typescript
if (response.status === 401) {
    if (!this.isRefreshing) {
        const newToken = await this.refreshAccessToken();
        if (newToken) {
            this.onRefreshed(newToken);
            throw { ...error, tokenRefreshed: true };  // ❌ Throws instead of retrying
        }
    }
}
```

---

## Desired Behavior (Fixed)
```
1. User makes API call (e.g., POST comment)
2. Backend returns 401 (token expired)
3. apiClient detects 401 → calls refreshAccessToken()
4. Token refresh succeeds → new token stored
5. apiClient RETRIES original request with new token  ✅
6. Request succeeds
7. User sees success, no error
```

---

## Solution Design

### Strategy: Request Retry with Queue

Implement a **retry mechanism** that:
1. Stores original request parameters
2. Detects 401 + successful token refresh
3. Automatically retries request with new token
4. Returns result of retry (transparent to caller)

### Key Design Decisions

#### 1. **Single Retry Only**
- Only retry ONCE after token refresh
- Prevents infinite retry loops
- If retry fails → throw error to caller

#### 2. **Queue Concurrent Requests**
- If multiple requests hit 401 simultaneously
- Only ONE token refresh happens
- Other requests wait and retry with new token
- Uses existing `refreshSubscribers` array

#### 3. **Preserve Request Context**
- Store method, endpoint, params, data
- Retry with exact same parameters
- Maintain headers (new token automatically added)

#### 4. **Backwards Compatible**
- No changes to public API
- Existing code continues to work
- No breaking changes

---

## Implementation Approach

### Method 1: Wrap Each HTTP Method (Chosen)
**Pros**:
- Simple and clear
- Easy to debug
- Maintains existing structure
- No complex recursion

**Cons**:
- Slight code duplication (acceptable)

### Method 2: Recursive handleResponse (Rejected)
**Pros**:
- No code duplication
- Centralized logic

**Cons**:
- Complex state management
- Hard to debug
- Risk of infinite loops
- Breaks existing flow

---

## Detailed Implementation Plan

### Step 1: Add Retry-Aware Methods

Create internal retry methods for each HTTP verb:

```typescript
private async makeRequest<T>(
    method: string,
    endpoint: string,
    options: {
        params?: Record<string, string>;
        data?: any;
        retryCount?: number;
    } = {}
): Promise<T> {
    const { params, data, retryCount = 0 } = options;
    const maxRetries = 1; // Only retry once after token refresh
    
    try {
        // Build URL
        const url = params 
            ? new URL(`${this.baseUrl}${endpoint}`)
            : `${this.baseUrl}${endpoint}`;
        
        if (params && url instanceof URL) {
            Object.entries(params).forEach(([key, value]) => {
                url.searchParams.append(key, value);
            });
        }
        
        // Make fetch call
        const response = await fetch(
            url.toString(),
            {
                method,
                headers: this.getAuthHeaders(),
                credentials: 'include',
                body: data ? JSON.stringify(data) : undefined,
            }
        );
        
        return await this.handleResponse<T>(response);
        
    } catch (error: any) {
        // Check if token was refreshed and we can retry
        if (error.tokenRefreshed && retryCount < maxRetries) {
            console.log(`[API Client] Token refreshed, retrying ${method} ${endpoint}`);
            
            // Wait a tiny bit for token to be fully stored
            await new Promise(resolve => setTimeout(resolve, 100));
            
            // Retry with new token (increment retry count)
            return this.makeRequest<T>(method, endpoint, {
                params,
                data,
                retryCount: retryCount + 1,
            });
        }
        
        // Not retryable or max retries reached
        throw error;
    }
}
```

### Step 2: Update Public Methods to Use Retry Logic

```typescript
async get<T>(endpoint: string, params?: Record<string, string>): Promise<T> {
    return this.makeRequest<T>('GET', endpoint, { params });
}

async post<T>(endpoint: string, data?: any): Promise<T> {
    return this.makeRequest<T>('POST', endpoint, { data });
}

async put<T>(endpoint: string, data?: any): Promise<T> {
    return this.makeRequest<T>('PUT', endpoint, { data });
}

async patch<T>(endpoint: string, data?: any): Promise<T> {
    return this.makeRequest<T>('PATCH', endpoint, { data });
}

async delete<T>(endpoint: string): Promise<T> {
    return this.makeRequest<T>('DELETE', endpoint);
}
```

### Step 3: Keep handleResponse Unchanged
- No changes to token refresh logic
- Still throws `tokenRefreshed: true`
- Retry logic is in `makeRequest` wrapper

---

## Code Changes Summary

### File: `lib/api-client.ts`

**Add**:
1. New private method: `makeRequest<T>()` (40 lines)

**Modify**:
5. Public methods: `get`, `post`, `put`, `patch`, `delete` (1-2 lines each)

**Keep Unchanged**:
- `getAuthHeaders()`
- `refreshAccessToken()`
- `handleResponse()`
- `clearAuth()`
- `uploadFile()` (different flow, doesn't need retry for now)

**Total Changes**: ~50 lines added/modified

---

## Testing Strategy

### Test 1: Normal Request (No 401)
```typescript
// Should work exactly as before
const result = await apiClient.post('/api/comments/', data);
// ✅ No retry, direct success
```

### Test 2: Expired Token (401 + Refresh + Retry)
```typescript
// Token is expired
const result = await apiClient.post('/api/comments/', data);
// 1. First call → 401
// 2. Token refreshed
// 3. Retry → 200
// ✅ Returns result transparently
```

### Test 3: Refresh Failure
```typescript
// Token expired, refresh also fails
try {
    await apiClient.post('/api/comments/', data);
} catch (error) {
    // ✅ Throws error, clears auth
}
```

### Test 4: Concurrent Requests
```typescript
// Multiple requests hit 401 simultaneously
Promise.all([
    apiClient.post('/api/comments/', data1),
    apiClient.post('/api/photos/', data2),
    apiClient.get('/api/projects/'),
]);
// ✅ Only ONE token refresh
// ✅ All requests retry with new token
```

---

## Flow Diagrams

### Before (Broken):
```
┌─────────────────────────────────────────┐
│ User calls apiClient.post('/comments')  │
└──────────────┬──────────────────────────┘
               ↓
┌─────────────────────────────────────────┐
│ fetch() → Backend returns 401           │
└──────────────┬──────────────────────────┘
               ↓
┌─────────────────────────────────────────┐
│ handleResponse() detects 401            │
└──────────────┬──────────────────────────┘
               ↓
┌─────────────────────────────────────────┐
│ refreshAccessToken() → Success          │
│ New token stored in localStorage        │
└──────────────┬──────────────────────────┘
               ↓
┌─────────────────────────────────────────┐
│ throw { tokenRefreshed: true }   ❌     │
└──────────────┬──────────────────────────┘
               ↓
┌─────────────────────────────────────────┐
│ Error bubbles to user code              │
│ Original request LOST                   │
└─────────────────────────────────────────┘
```

### After (Fixed):
```
┌─────────────────────────────────────────┐
│ User calls apiClient.post('/comments')  │
└──────────────┬──────────────────────────┘
               ↓
┌─────────────────────────────────────────┐
│ makeRequest() wrapper called            │
└──────────────┬──────────────────────────┘
               ↓
┌─────────────────────────────────────────┐
│ try { fetch() → Backend returns 401 }   │
└──────────────┬──────────────────────────┘
               ↓
┌─────────────────────────────────────────┐
│ handleResponse() detects 401            │
└──────────────┬──────────────────────────┘
               ↓
┌─────────────────────────────────────────┐
│ refreshAccessToken() → Success          │
│ New token stored in localStorage        │
└──────────────┬──────────────────────────┘
               ↓
┌─────────────────────────────────────────┐
│ throw { tokenRefreshed: true }          │
└──────────────┬──────────────────────────┘
               ↓
┌─────────────────────────────────────────┐
│ catch (error.tokenRefreshed === true)   │
│ retryCount < maxRetries?                │
└──────────────┬──────────────────────────┘
               ↓ YES
┌─────────────────────────────────────────┐
│ makeRequest() RETRY with new token  ✅  │
└──────────────┬──────────────────────────┘
               ↓
┌─────────────────────────────────────────┐
│ fetch() → Backend returns 200           │
└──────────────┬──────────────────────────┘
               ↓
┌─────────────────────────────────────────┐
│ Return result to user code              │
│ User doesn't even know token refreshed  │
└─────────────────────────────────────────┘
```

---

## Risk Assessment

### Risks

1. **Infinite Loop Risk**: MITIGATED
   - Only retry once (maxRetries = 1)
   - Track retryCount parameter

2. **Race Condition**: MITIGATED
   - Existing `isRefreshing` flag prevents multiple refreshes
   - `refreshSubscribers` queue handles concurrent requests

3. **Breaking Changes**: NONE
   - Public API unchanged
   - Existing code works as-is
   - Only internal implementation changes

4. **Performance**: MINIMAL IMPACT
   - Retry only on 401 errors (rare)
   - 100ms delay is negligible
   - No impact on normal requests

---

## Backwards Compatibility

### ✅ No Breaking Changes

**Public API remains identical**:
```typescript
// Before and After - SAME API
await apiClient.get<T>(endpoint, params);
await apiClient.post<T>(endpoint, data);
await apiClient.put<T>(endpoint, data);
await apiClient.patch<T>(endpoint, data);
await apiClient.delete<T>(endpoint);
```

**Behavior improvements**:
- 401 errors → Automatic retry (NEW, transparent)
- Other errors → Same as before
- Success → Same as before

---

## Implementation Checklist

- [ ] Create `makeRequest<T>()` private method
- [ ] Update `get()` to use `makeRequest`
- [ ] Update `post()` to use `makeRequest`
- [ ] Update `put()` to use `makeRequest`
- [ ] Update `patch()` to use `makeRequest`
- [ ] Update `delete()` to use `makeRequest`
- [ ] Add retry count logging
- [ ] Test normal requests (no 401)
- [ ] Test expired token scenario
- [ ] Test refresh failure
- [ ] Test concurrent requests
- [ ] Update documentation

---

## Success Criteria

1. ✅ User adds comment with expired token → works automatically
2. ✅ No manual retry needed
3. ✅ Existing code continues to work
4. ✅ Console shows retry log
5. ✅ Only ONE token refresh for concurrent requests
6. ✅ Build succeeds with no TypeScript errors

---

## Documentation Structure

```
docs/token-refresh-implementation/
├── TOKEN_REFRESH_IMPLEMENTATION_PLAN.md (this file)
├── TOKEN_REFRESH_BEFORE_AFTER.md (user-facing guide)
└── TOKEN_REFRESH_TESTING_GUIDE.md (QA guide)
```

---

## Next Steps

1. ✅ Review this plan
2. → Implement `makeRequest()` method
3. → Update public HTTP methods
4. → Test all scenarios
5. → Create user documentation
6. → Deploy

---

**Status**: 📋 READY FOR IMPLEMENTATION

**Estimated Time**: 45-60 minutes
**Risk Level**: LOW (backwards compatible)
**Impact**: HIGH (fixes major UX issue)
