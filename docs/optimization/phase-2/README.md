# Phase 2: Smart Compression - Overview

## Purpose

Reduce bandwidth usage by 80-90% through intelligent compression and quality variants.

## Components

### Frontend
- **imageCompressionService.ts** - Client-side compression before upload
- **viewportQualityService.ts** - Viewport-aware quality selection

### Backend
- **image_processing_service.py** - Server-side quality variant generation
- **photos.py** - Photo variant serving endpoint

## Features

### Client-Side Compression
- WebP conversion for better compression
- Progressive quality reduction to target size (default 5MB)
- Maintain aspect ratio
- Max 4K resolution (4096px)
- Strip EXIF data for privacy
- ThumbHash generation for instant placeholders

### Server-Side Quality Variants
Generate 5 quality levels:
- **thumbnail:** 200px width, 60% quality
- **low:** 800px width, 70% quality
- **medium:** 1920px width, 80% quality
- **high:** 3840px width, 90% quality
- **print:** Original size, 95% quality

### Viewport-Aware Quality
- Mobile (≤480px) → low quality
- Tablet (≤1024px) → medium quality
- Desktop (≤1920px) → high quality
- 4K (≥2560px) → print quality
- Retina displays → upgrade by one level

## Configuration

```typescript
// Enable in config
features: {
  clientSideCompression: true,
  serverSideVariants: true,
  viewportQualitySelection: true,
}

// Tune settings
compression: {
  client: {
    targetSizeMB: 5,
    format: 'webp',
    quality: { initial: 0.9, minimum: 0.5 }
  },
  server: {
    variants: { /* 5 quality levels */ }
  }
}
```

## API Endpoints

**GET** `/v2/photos/{photo_id}/variant/{quality}`
- Serve specific quality variant
- Quality values: thumbnail, low, medium, high, print
- Returns: Image file with immutable cache headers

## Usage

### Frontend
```typescript
// Compress before upload
const result = await imageCompressionService.compressImage(file);
console.log('Compressed:', result.compressedSize);
console.log('Ratio:', result.compressionRatio);
console.log('ThumbHash:', result.thumbhash);

// Get optimal quality for viewport
const quality = viewportQualityService.getOptimalQuality();
console.log('Viewport quality:', quality);

// Get progressive sequence
const sequence = viewportQualityService.getProgressiveSequence('high');
// Returns: ['thumbnail', 'high']
```

### Backend
```python
# Generate variants after upload
from app.services.image_processing_service import ImageProcessingService

service = ImageProcessingService()
variants = await service.generate_quality_variants(db, photo, file_path)
# Returns: {'thumbnail': 'path', 'low': 'path', ...}
```

## Performance Targets

| Metric | Target | Actual |
|--------|--------|--------|
| Compression Ratio | 5-10x | Test |
| Client Compression Time | <5s for 30MB | Test |
| Server Variant Generation | <10s for 5 variants | Test |
| ThumbHash Generation | <50ms | Test |
| Bandwidth Savings | 80-90% | Test |

## See Also

- [TESTING.md](./TESTING.md) - Comprehensive testing guide
- [VALIDATION.md](./VALIDATION.md) - Validation checklist
