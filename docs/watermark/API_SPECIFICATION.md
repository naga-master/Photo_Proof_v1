# Watermark API Specification

## Overview

This document defines the REST API endpoints for managing watermark settings.

**Base URL**: `/api/v2`

**Authentication**: All endpoints require valid JWT token in `Authorization` header.

---

## Endpoints

### 1. Get Watermark Settings

Retrieve current watermark settings for a studio.

**Endpoint**: `GET /studios/{studio_id}/watermark-settings`

**Authorization**: Studio owner or admin

**Path Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `studio_id` | string | Yes | UUID of the studio |

**Response**: `200 OK`

```json
{
  "enabled": true,
  "type": "logo",
  "text": "© My Studio",
  "logo_url": "/uploads/studios/abc123/watermarks/logo.png",
  "opacity": 0.5,
  "position": "tiled"
}
```

**Response Schema**:
| Field | Type | Description |
|-------|------|-------------|
| `enabled` | boolean | Whether watermarking is enabled |
| `type` | string | "logo" or "text" |
| `text` | string | Text watermark (used if type="text" or no logo) |
| `logo_url` | string | URL to uploaded logo (null if none) |
| `opacity` | number | Opacity value (0.1 to 1.0) |
| `position` | string | Position setting |

**Position Values**:
- `tiled` - Diagonal repeating pattern
- `center` - Single centered watermark
- `top-left`, `top-center`, `top-right`
- `mid-left`, `mid-right`
- `bottom-left`, `bottom-center`, `bottom-right`

**Error Responses**:
- `401 Unauthorized` - Invalid or missing token
- `403 Forbidden` - User not authorized for this studio
- `404 Not Found` - Studio not found

---

### 2. Update Watermark Settings

Update watermark settings for a studio.

**Endpoint**: `PUT /studios/{studio_id}/watermark-settings`

**Authorization**: Studio owner or admin

**Path Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `studio_id` | string | Yes | UUID of the studio |

**Request Body**:

```json
{
  "enabled": true,
  "type": "logo",
  "text": "© My Studio",
  "opacity": 0.5,
  "position": "tiled"
}
```

**Request Schema**:
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `enabled` | boolean | No | Enable/disable watermarking |
| `type` | string | No | "logo" or "text" |
| `text` | string | No | Text watermark content |
| `opacity` | number | No | Opacity (0.1 to 1.0) |
| `position` | string | No | Position setting |

**Note**: Only include fields you want to update.

**Response**: `200 OK`

```json
{
  "enabled": true,
  "type": "logo",
  "text": "© My Studio",
  "logo_url": "/uploads/studios/abc123/watermarks/logo.png",
  "opacity": 0.5,
  "position": "tiled",
  "updated_at": "2024-01-15T10:30:00Z"
}
```

**Error Responses**:
- `400 Bad Request` - Invalid request body
- `401 Unauthorized` - Invalid or missing token
- `403 Forbidden` - User not authorized
- `404 Not Found` - Studio not found
- `422 Unprocessable Entity` - Validation error

**Validation Errors**:
```json
{
  "detail": [
    {
      "loc": ["body", "opacity"],
      "msg": "ensure this value is greater than or equal to 0.1",
      "type": "value_error.number.not_ge"
    }
  ]
}
```

---

### 3. Upload Watermark Logo

Upload a custom watermark logo image.

**Endpoint**: `POST /studios/{studio_id}/watermark-logo`

**Authorization**: Studio owner or admin

**Content-Type**: `multipart/form-data`

**Path Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `studio_id` | string | Yes | UUID of the studio |

**Request Body**:
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `file` | file | Yes | PNG image file |

**File Requirements**:
- Format: PNG only (with transparency support)
- Max size: 5MB
- Recommended dimensions: 800x300px to 1200x400px
- Transparent background recommended

**cURL Example**:
```bash
curl -X POST "https://api.example.com/v2/studios/abc123/watermark-logo" \
  -H "Authorization: Bearer <token>" \
  -F "file=@/path/to/logo.png"
```

**Response**: `200 OK`

```json
{
  "message": "Watermark logo uploaded successfully",
  "logo_url": "/uploads/studios/abc123/watermarks/logo.png",
  "dimensions": {
    "width": 800,
    "height": 300
  }
}
```

**Error Responses**:
- `400 Bad Request` - Invalid file type or missing file
- `401 Unauthorized` - Invalid or missing token
- `403 Forbidden` - User not authorized
- `404 Not Found` - Studio not found
- `413 Request Entity Too Large` - File exceeds 5MB

**Error Example**:
```json
{
  "detail": "Invalid file type. Only PNG files are allowed."
}
```

---

### 4. Delete Watermark Logo

Remove the custom watermark logo.

**Endpoint**: `DELETE /studios/{studio_id}/watermark-logo`

**Authorization**: Studio owner or admin

**Path Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `studio_id` | string | Yes | UUID of the studio |

**Response**: `200 OK`

```json
{
  "message": "Watermark logo deleted successfully"
}
```

**Note**: After deletion, the studio will fall back to text watermark.

**Error Responses**:
- `401 Unauthorized` - Invalid or missing token
- `403 Forbidden` - User not authorized
- `404 Not Found` - Studio or logo not found

---

### 5. Preview Watermarked Image

Get a preview of how watermark will look on a sample image.

**Endpoint**: `GET /studios/{studio_id}/watermark-preview`

**Authorization**: Studio owner or admin

**Path Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `studio_id` | string | Yes | UUID of the studio |

**Query Parameters**:
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `position` | string | No | Current setting | Preview specific position |
| `opacity` | number | No | Current setting | Preview specific opacity |

**Response**: `200 OK`

Returns image file (JPEG/WebP) with watermark applied to sample image.

**Headers**:
```
Content-Type: image/webp
Content-Disposition: inline; filename="watermark-preview.webp"
```

**Example**:
```bash
curl "https://api.example.com/v2/studios/abc123/watermark-preview?position=center&opacity=0.4" \
  -H "Authorization: Bearer <token>" \
  -o preview.webp
```

---

## Data Types

### WatermarkSettings

```typescript
interface WatermarkSettings {
  enabled: boolean;
  type: 'logo' | 'text';
  text: string | null;
  logo_url: string | null;
  opacity: number;  // 0.1 to 1.0
  position: WatermarkPosition;
}

type WatermarkPosition = 
  | 'tiled'
  | 'center'
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'mid-left'
  | 'mid-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right';
```

### WatermarkSettingsUpdate

```typescript
interface WatermarkSettingsUpdate {
  enabled?: boolean;
  type?: 'logo' | 'text';
  text?: string;
  opacity?: number;
  position?: WatermarkPosition;
}
```

---

## Usage Examples

### JavaScript/TypeScript

```typescript
// Get settings
const settings = await fetch('/api/v2/studios/abc123/watermark-settings', {
  headers: { 'Authorization': `Bearer ${token}` }
}).then(r => r.json());

// Update settings
await fetch('/api/v2/studios/abc123/watermark-settings', {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    enabled: true,
    position: 'tiled',
    opacity: 0.5
  })
});

// Upload logo
const formData = new FormData();
formData.append('file', logoFile);

await fetch('/api/v2/studios/abc123/watermark-logo', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` },
  body: formData
});
```

### Python

```python
import requests

headers = {'Authorization': f'Bearer {token}'}

# Get settings
response = requests.get(
    f'{API_URL}/studios/{studio_id}/watermark-settings',
    headers=headers
)
settings = response.json()

# Update settings
response = requests.put(
    f'{API_URL}/studios/{studio_id}/watermark-settings',
    headers=headers,
    json={'enabled': True, 'position': 'tiled', 'opacity': 0.5}
)

# Upload logo
with open('logo.png', 'rb') as f:
    response = requests.post(
        f'{API_URL}/studios/{studio_id}/watermark-logo',
        headers=headers,
        files={'file': ('logo.png', f, 'image/png')}
    )
```

---

## Rate Limits

| Endpoint | Rate Limit |
|----------|------------|
| GET settings | 100/minute |
| PUT settings | 20/minute |
| POST logo | 10/minute |
| DELETE logo | 10/minute |
| GET preview | 30/minute |

---

## Webhooks (Future)

When watermark settings change, a webhook can be triggered:

```json
{
  "event": "watermark.settings.updated",
  "studio_id": "abc123",
  "timestamp": "2024-01-15T10:30:00Z",
  "changes": {
    "enabled": { "old": false, "new": true },
    "position": { "old": "center", "new": "tiled" }
  }
}
```

---

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | TBD | Initial release |
