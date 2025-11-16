# Phase 2: Backend Image Optimization

## Purpose

Optimize image delivery by 90% through server-side variant generation and viewport-aware quality selection.

## Architecture

### Backend Processing
- **Original Storage:** Preserve full-quality uploads (30MB+)
- **Variant Generation:** Create 5 optimized quality levels
- **ThumbHash:** Generate instant blur placeholders
- **Async Processing:** Non-blocking variant generation

### Frontend Delivery
- **Viewport Detection:** Auto-select quality based on screen size
- **Progressive Loading:** ThumbHash → Appropriate quality
- **Bandwidth Savings:** 90% reduction on delivery

## Components

### Backend
- **image_processing_service.py** - Variant generation using Pillow
- **upload_service.py** - Integrated variant generation on upload
- **photos.py** - Variant serving endpoint

### Frontend
- **viewportQualityService.ts** - Screen size detection
- **adaptiveQualityService.ts** - Network-aware quality selection

## Storage Strategy

### What Gets Stored:
```
Original: /uploads/projects/6/20251116_abc123_photo.jpg (30MB)
    ↓
Variants:
  - thumbnail: 200px, 60% quality (~15 KB)
  - low: 800px, 70% quality (~85 KB)
  - medium: 1920px, 80% quality (~245 KB)
  - high: 3840px, 90% quality (~780 KB)
  - print: Original size, 95% quality (~2.5 MB)
    ↓
Database:
  - storage_path: Original file path
  - variants_json: {"thumbnail": "path", "low": "path", ...}
  - thumbhash: Base64 encoded blur hash
```

### Total Storage:
- Original: ~30MB
- Variants: ~15MB
- Total: ~45MB per photo

### Delivery Strategy:
- Mobile (375px): Serves "low" variant (85 KB) = 99.7% savings
- Tablet (768px): Serves "medium" variant (245 KB) = 99.2% savings
- Desktop (1920px): Serves "high" variant (780 KB) = 97.4% savings
- Download: Serves original (30MB) when explicitly requested

## Features

### 5 Quality Variants
Generated automatically on upload:
- **thumbnail:** Quick previews, project covers
- **low:** Mobile devices, slow networks
- **medium:** Tablets, moderate networks
- **high:** Desktops, fast networks
- **print:** Downloads, professional use

### ThumbHash Placeholders
- Instant blur preview (< 50 bytes)
- Smooth transition to full image
- No layout shift
- Better perceived performance

### Viewport-Aware Quality
Automatic quality selection based on:
- Screen width (mobile/tablet/desktop/4K)
- Device pixel ratio (retina displays)
- Network type (2G/3G/4G/WiFi)
- Data saver mode

## Configuration

```typescript
// config/image-optimization.dev.ts
features: {
  serverSideVariants: true,
  viewportQualitySelection: true,
}

compression: {
  server: {
    enabled: true,
    variants: {
      thumbnail: { width: 200, quality: 60 },
      low: { width: 800, quality: 70 },
      medium: { width: 1920, quality: 80 },
      high: { width: 3840, quality: 90 },
      print: { width: null, quality: 95 }
    },
    generateAsync: false  // Sync in dev
  },
  thumbhash: {
    enabled: true,
    generateOnServer: true
  }
}
```

## API Endpoints

### Get Variant
```
GET /v2/photos/{photo_id}/variant/{quality}
```
Quality values: `thumbnail`, `low`, `medium`, `high`, `print`

Returns: Optimized WebP image with cache headers

### Get Original
```
GET /v2/photos/{photo_id}
```
Returns: Full photo record with variant paths

## Upload Flow

```
1. User uploads 30MB photo
2. Chunked upload (Phase 1) handles network reliability
3. Backend receives original file
4. Backend saves to: /uploads/projects/6/photo.jpg
5. Backend generates 5 variants (5-10 seconds)
6. Backend generates ThumbHash (< 50ms)
7. Backend stores paths in photo.variants_json
8. Upload complete with all variants ready
```

## Delivery Flow

```
1. User opens gallery on mobile
2. Frontend detects 375px screen
3. Frontend requests: /v2/photos/123/variant/low
4. Backend serves 85 KB optimized image
5. Frontend shows ThumbHash blur instantly
6. Image loads fast (< 1 second)
7. User zooms in → Frontend requests higher quality
8. Progressive quality upgrade
```

## Performance Targets

| Metric | Target | Notes |
|--------|--------|-------|
| Variant Generation | < 10s | 5 variants from 30MB |
| ThumbHash Generation | < 50ms | 32x32 thumbnail |
| Bandwidth Savings | 90%+ | Mobile delivery |
| Storage Overhead | 50% | Worth it for quality |
| Variant Serving | < 100ms | With caching |

## Benefits

### Original Preservation
- ✅ Full-quality original stored
- ✅ Can regenerate variants anytime
- ✅ Download original for prints
- ✅ Professional archiving

### Optimized Delivery
- ✅ 90% bandwidth reduction
- ✅ Faster page loads
- ✅ Better mobile experience
- ✅ Adaptive quality

### Reliability
- ✅ Variants regeneratable
- ✅ Consistent quality (Pillow)
- ✅ Server-side processing
- ✅ No browser inconsistencies

## See Also

- [TESTING.md](./TESTING.md) - Validation guide
- [Phase 1: Chunked Upload](../phase-1/README.md)
- [Phase 3: OPFS Cache](../phase-3/README.md)
