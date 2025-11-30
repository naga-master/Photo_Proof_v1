# HTTPS/TLS Configuration - Data in Transit Encryption

**Document Version:** 1.0  
**Date:** November 30, 2024  
**Status:** Implementation Pending

---

## 1. Why HTTPS is Required

### Current State (Insecure)

```
┌──────────────────────────────────────────────────────────────────┐
│  CURRENT CONFIGURATION                                            │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Frontend: http://localhost:5173                                  │
│  Backend:  http://localhost:8000                                  │
│                                                                   │
│  Cookie Settings (app/routers/auth.py):                          │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │ secure=False  ← Cookie sent over HTTP (interceptable)       │  │
│  │ samesite="lax" ← Weaker CSRF protection                     │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                   │
│  API URL (lib/api-client.ts):                                    │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │ const API_BASE_URL = 'http://localhost:8000'                │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
```

### The Problem: Man-in-the-Middle Attack

```
Without HTTPS:

┌──────────┐         ┌──────────┐         ┌──────────┐
│  Client  │ ──────> │ Attacker │ ──────> │  Server  │
│          │  HTTP   │ (MITM)   │  HTTP   │          │
└──────────┘         └──────────┘         └──────────┘
     │                    │
     │  Sends:            │  Can see:
     │  Cookie: token=xxx │  - Auth tokens
     │  Body: {...}       │  - User data
     │                    │  - Billing info
     │                    │  - All API requests
     │                    │
     ▼                    ▼
 User thinks         Attacker steals
 it's secure         everything


With HTTPS:

┌──────────┐         ┌──────────┐         ┌──────────┐
│  Client  │ ──────> │ Attacker │ ──────> │  Server  │
│          │  HTTPS  │ (MITM)   │  HTTPS  │          │
└──────────┘  (TLS)  └──────────┘  (TLS)  └──────────┘
     │                    │
     │  Sends:            │  Sees:
     │  *encrypted*       │  x#$@!&*^%
     │                    │  (garbage)
     │                    │
     ▼                    ▼
 User is             Attacker gets
 secure              nothing useful
```

---

## 2. TLS/HTTPS Explained

### How TLS Encryption Works

```
┌─────────────────────────────────────────────────────────────────┐
│  TLS 1.3 HANDSHAKE (Simplified)                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────┐                              ┌──────────┐         │
│  │  Client  │                              │  Server  │         │
│  └────┬─────┘                              └────┬─────┘         │
│       │                                         │               │
│       │  1. ClientHello                         │               │
│       │  "I support TLS 1.3, these ciphers"     │               │
│       │────────────────────────────────────────>│               │
│       │                                         │               │
│       │  2. ServerHello + Certificate           │               │
│       │  "Here's my certificate, let's use      │               │
│       │   AES-256-GCM cipher"                   │               │
│       │<────────────────────────────────────────│               │
│       │                                         │               │
│       │  3. Client verifies certificate         │               │
│       │  (Checks with Certificate Authority)    │               │
│       │                                         │               │
│       │  4. Key Exchange                        │               │
│       │  (Diffie-Hellman generates shared key)  │               │
│       │<───────────────────────────────────────>│               │
│       │                                         │               │
│       │  5. Encrypted Communication             │               │
│       │  All data encrypted with shared key     │               │
│       │<═══════════════════════════════════════>│               │
│       │                                         │               │
│  ┌────┴─────┐                              ┌────┴─────┐         │
│  │  Client  │                              │  Server  │         │
│  └──────────┘                              └──────────┘         │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### What TLS Protects

| Protection | Description |
|------------|-------------|
| **Confidentiality** | Data encrypted, unreadable by attackers |
| **Integrity** | Data cannot be modified in transit |
| **Authentication** | Server identity verified via certificate |

---

## 3. Cookie `secure` Flag

### Why `secure=True` is Required

```python
# WITHOUT secure flag (CURRENT - INSECURE):
response.set_cookie(
    key="access_token",
    value=token,
    httponly=True,
    secure=False,      # ❌ Cookie sent over HTTP too!
)

# Result:
# - HTTP request: Cookie sent (attackers can intercept)
# - HTTPS request: Cookie sent
```

```python
# WITH secure flag (REQUIRED - SECURE):
response.set_cookie(
    key="access_token",
    value=token,
    httponly=True,
    secure=True,       # ✅ Cookie ONLY sent over HTTPS
)

# Result:
# - HTTP request: Cookie NOT sent (browser blocks it)
# - HTTPS request: Cookie sent (encrypted)
```

### Browser Behavior

```
┌─────────────────────────────────────────────────────────────────┐
│  Cookie with secure=True                                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  HTTP Request to http://example.com/api                          │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ GET /api HTTP/1.1                                        │    │
│  │ Host: example.com                                        │    │
│  │ (NO Cookie header - browser blocks it)                   │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  HTTPS Request to https://example.com/api                        │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ GET /api HTTP/1.1                                        │    │
│  │ Host: example.com                                        │    │
│  │ Cookie: access_token=eyJhbGc... (sent!)                  │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 4. Implementation Steps

### 4.1 Backend Cookie Configuration

**File:** `app/routers/auth.py`

Update ALL `set_cookie` calls (currently 5 locations):

```python
# Lines 54-65 (studio login - access_token)
response.set_cookie(
    key="access_token",
    value=access_token,
    httponly=True,
    secure=True,           # ✅ Changed from False
    samesite="strict",     # ✅ Changed from "lax"
    path="/",
    max_age=30 * 60
)

# Lines 67-75 (studio login - refresh_token)
response.set_cookie(
    key="refresh_token",
    value=refresh_token,
    httponly=True,
    secure=True,           # ✅ Changed from False
    samesite="strict",     # ✅ Changed from "lax"
    path="/",
    max_age=7 * 24 * 60 * 60
)

# Lines 117-127 (client login - access_token)
# Same changes as above

# Lines 129-137 (client login - refresh_token)
# Same changes as above

# Lines 230-238 (token refresh - new access_token)
# Same changes as above
```

### 4.2 Environment-Based Configuration

For development vs production flexibility:

```python
# app/core/config.py

import os

class Settings:
    # ... existing settings ...
    
    # Security settings
    COOKIE_SECURE: bool = os.getenv("COOKIE_SECURE", "true").lower() == "true"
    COOKIE_SAMESITE: str = os.getenv("COOKIE_SAMESITE", "strict")
    
settings = Settings()
```

```python
# app/routers/auth.py - Use settings

from app.core.config import settings

response.set_cookie(
    key="access_token",
    value=access_token,
    httponly=True,
    secure=settings.COOKIE_SECURE,
    samesite=settings.COOKIE_SAMESITE,
    path="/",
    max_age=30 * 60
)
```

```bash
# .env - Development (local without HTTPS)
COOKIE_SECURE=false
COOKIE_SAMESITE=lax

# .env - Production
COOKIE_SECURE=true
COOKIE_SAMESITE=strict
```

### 4.3 CORS Configuration Update

**File:** `.env`

```bash
# Current (HTTP)
CORS_ORIGINS=http://localhost:3001,http://localhost:5173,http://localhost:3000

# Production (HTTPS)
CORS_ORIGINS=https://app.yourdomain.com,https://yourdomain.com
```

### 4.4 Frontend API URL Update

**File:** `lib/api-client.ts`

```typescript
// Current
const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:8000';

// Production (set via environment variable)
// VITE_API_URL=https://api.yourdomain.com
```

**File:** `.env.production`

```bash
VITE_API_URL=https://api.yourdomain.com
```

---

## 5. SSL Certificate Setup

### Option A: Let's Encrypt (Free - Recommended for Production)

```bash
# Using certbot with nginx
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d api.yourdomain.com -d app.yourdomain.com

# Certificates stored at:
# /etc/letsencrypt/live/yourdomain.com/fullchain.pem
# /etc/letsencrypt/live/yourdomain.com/privkey.pem

# Auto-renewal (already configured by certbot)
sudo certbot renew --dry-run
```

### Option B: Self-Signed (Development Only)

```bash
# Generate self-signed certificate for local development
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout localhost.key \
  -out localhost.crt \
  -subj "/CN=localhost"

# Run uvicorn with SSL
uvicorn app.main:app --ssl-keyfile=localhost.key --ssl-certfile=localhost.crt --port 8000
```

### Option C: Cloud Provider (AWS/Azure/GCP)

Most cloud providers handle SSL termination at the load balancer:

```
┌──────────┐         ┌─────────────────┐         ┌──────────┐
│  Client  │ ──────> │  Load Balancer  │ ──────> │  Server  │
│          │  HTTPS  │  (SSL Termination)│  HTTP   │          │
└──────────┘         └─────────────────┘         └──────────┘
                            │
                      Certificate managed
                      by cloud provider
```

---

## 6. Nginx Configuration (Production)

```nginx
# /etc/nginx/sites-available/photo-proof

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name api.yourdomain.com app.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

# HTTPS server
server {
    listen 443 ssl http2;
    server_name api.yourdomain.com;
    
    # SSL Certificate
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    
    # SSL Configuration (Modern)
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256;
    ssl_prefer_server_ciphers off;
    
    # HSTS (force HTTPS for 1 year)
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    
    # Proxy to FastAPI backend
    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# Frontend
server {
    listen 443 ssl http2;
    server_name app.yourdomain.com;
    
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    
    root /var/www/photo-proof/dist;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

---

## 7. Testing HTTPS Configuration

### Test 1: Certificate Validation

```bash
# Check certificate details
openssl s_client -connect api.yourdomain.com:443 -servername api.yourdomain.com

# Verify certificate chain
curl -vI https://api.yourdomain.com/health
```

### Test 2: SSL Labs Rating

Visit: https://www.ssllabs.com/ssltest/

Enter your domain and verify:
- Grade: A or A+
- Protocol Support: TLS 1.2/1.3
- No known vulnerabilities

### Test 3: Cookie Secure Flag

```javascript
// In browser console after login
document.cookie  // Should return empty string for httpOnly cookies

// Check Network tab:
// Response Headers should show:
// Set-Cookie: access_token=...; HttpOnly; Secure; SameSite=Strict
```

### Test 4: HTTP Redirect

```bash
# HTTP should redirect to HTTPS
curl -I http://api.yourdomain.com
# Should return: 301 Moved Permanently
# Location: https://api.yourdomain.com/
```

---

## 8. HSTS (HTTP Strict Transport Security)

### What is HSTS?

HSTS tells browsers to **always** use HTTPS for your domain:

```
┌─────────────────────────────────────────────────────────────────┐
│  Without HSTS:                                                   │
│  ──────────────                                                  │
│  User types: example.com                                         │
│  Browser sends: HTTP request to http://example.com               │
│  Server responds: 301 Redirect to https://example.com            │
│                                                                  │
│  ⚠️ First request is HTTP - can be intercepted!                  │
│                                                                  │
├─────────────────────────────────────────────────────────────────┤
│  With HSTS:                                                      │
│  ───────────                                                     │
│  User types: example.com                                         │
│  Browser remembers: "This site uses HSTS"                        │
│  Browser sends: HTTPS request directly to https://example.com    │
│                                                                  │
│  ✅ No HTTP request ever made - always secure!                   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Enable HSTS in FastAPI

```python
# app/main.py

from fastapi.middleware.httpsredirect import HTTPSRedirectMiddleware
from starlette.middleware.base import BaseHTTPMiddleware

class HSTSMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        response = await call_next(request)
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        return response

# Add middleware (production only)
if settings.ENVIRONMENT == "production":
    app.add_middleware(HTTPSRedirectMiddleware)
    app.add_middleware(HSTSMiddleware)
```

---

## 9. Development vs Production Configuration

| Setting | Development | Production |
|---------|-------------|------------|
| HTTPS | Optional (self-signed) | Required |
| `secure` cookie | `false` | `true` |
| `samesite` cookie | `lax` | `strict` |
| HSTS | Disabled | Enabled |
| API URL | `http://localhost:8000` | `https://api.domain.com` |
| CORS Origins | `http://localhost:*` | `https://app.domain.com` |

---

## 10. Checklist

- [ ] Generate/obtain SSL certificates
- [ ] Configure nginx/load balancer for HTTPS
- [ ] Update backend cookie settings (`secure=True`)
- [ ] Update CORS origins to HTTPS
- [ ] Update frontend API URL to HTTPS
- [ ] Enable HSTS header
- [ ] Test SSL Labs rating (aim for A+)
- [ ] Test cookie transmission over HTTPS only
- [ ] Test HTTP to HTTPS redirect
- [ ] Verify no mixed content warnings

---

## Related Documents

- [01_SECURITY_OVERVIEW.md](./01_SECURITY_OVERVIEW.md) - Security overview
- [02_AUTHENTICATION_SECURITY.md](./02_AUTHENTICATION_SECURITY.md) - Cookie security details
- [05_IMPLEMENTATION_CHECKLIST.md](./05_IMPLEMENTATION_CHECKLIST.md) - Step-by-step guide
