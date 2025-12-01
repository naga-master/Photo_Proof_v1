# Watermarking Architecture

## System Overview

The watermarking system integrates with the existing image processing pipeline to apply watermarks during variant generation. This ensures all preview images are protected while maintaining clean originals for final delivery.

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         PHOTO UPLOAD FLOW                               │
└─────────────────────────────────────────────────────────────────────────┘

    ┌──────────┐      ┌──────────────────┐      ┌───────────────────┐
    │  Upload  │ ───▶ │ Image Processing │ ───▶ │ Variant Storage   │
    │  Service │      │     Service      │      │                   │
    └──────────┘      └──────────────────┘      └───────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │   Watermark      │
                    │    Service       │
                    └──────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │  Studio Settings │
                    │  (watermark cfg) │
                    └──────────────────┘


┌─────────────────────────────────────────────────────────────────────────┐
│                      VARIANT GENERATION DETAIL                          │
└─────────────────────────────────────────────────────────────────────────┘

    Original Image
          │
          ▼
    ┌─────────────────────────────────────────────────────────────────┐
    │                    For each variant:                            │
    │  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐  │
    │  │thumbnail │    │   low    │    │  medium  │    │   high   │  │
    │  │  200px   │    │  800px   │    │  1920px  │    │  3840px  │  │
    │  └────┬─────┘    └────┬─────┘    └────┬─────┘    └────┬─────┘  │
    │       │               │               │               │        │
    │       ▼               ▼               ▼               ▼        │
    │  ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐     │
    │  │WATERMARK│    │WATERMARK│    │WATERMARK│    │  CLEAN  │     │
    │  │  ✅ Yes │    │  ✅ Yes │    │  ✅ Yes │    │  ❌ No  │     │
    │  └─────────┘    └─────────┘    └─────────┘    └─────────┘     │
    └─────────────────────────────────────────────────────────────────┘
```

---

## Component Design

### 1. WatermarkService

**Location**: `photo_proof_api/app/services/watermark_service.py`

**Responsibilities**:
- Load and cache watermark images
- Apply watermarks to images
- Support multiple watermark positions
- Handle text fallback when no logo

```python
class WatermarkService:
    """Service for applying watermarks to images"""
    
    def __init__(self):
        self.watermark_cache = {}  # Cache loaded watermarks
    
    def apply_watermark(
        self,
        image: Image.Image,
        watermark_settings: WatermarkSettings
    ) -> Image.Image:
        """Apply watermark to an image based on settings"""
        pass
    
    def apply_logo_watermark(
        self,
        image: Image.Image,
        logo_path: str,
        opacity: float,
        position: str
    ) -> Image.Image:
        """Apply logo watermark"""
        pass
    
    def apply_text_watermark(
        self,
        image: Image.Image,
        text: str,
        opacity: float,
        position: str
    ) -> Image.Image:
        """Apply text watermark (fallback)"""
        pass
    
    def create_tiled_watermark(
        self,
        image: Image.Image,
        watermark: Image.Image,
        spacing: int = 100,
        angle: int = -30
    ) -> Image.Image:
        """Create tiled diagonal watermark pattern"""
        pass
```

### 2. ImageProcessingService (Modified)

**Location**: `photo_proof_api/app/services/image_processing_service.py`

**Modifications**:
- Inject WatermarkService
- Apply watermark during variant creation for protected variants

```python
# In create_variant method:
async def create_variant(self, img, photo, variant_name, ...):
    # Resize image...
    
    # Apply watermark to preview variants only
    if variant_name in ('thumbnail', 'low', 'medium'):
        studio = await self.get_studio_settings(photo.project.studio_id)
        if studio.watermark_enabled:
            img = self.watermark_service.apply_watermark(img, studio.watermark_settings)
    
    # Save variant...
```

### 3. StudioSettings (Extended)

**Location**: `photo_proof_api/app/db/models/studio.py`

**New Fields**:
```python
# Watermark settings
watermark_enabled = Column(Boolean, default=True)
watermark_type = Column(String(20), default='logo')  # 'logo' or 'text'
watermark_text = Column(String(255), nullable=True)  # Fallback text
watermark_logo_path = Column(String(500), nullable=True)
watermark_opacity = Column(Float, default=0.5)
watermark_position = Column(String(20), default='tiled')
```

---

## Database Schema

### Studio Table Extension

```sql
-- Migration: Add watermark settings to studios table

ALTER TABLE studios ADD COLUMN watermark_enabled BOOLEAN DEFAULT TRUE;
ALTER TABLE studios ADD COLUMN watermark_type VARCHAR(20) DEFAULT 'logo';
ALTER TABLE studios ADD COLUMN watermark_text VARCHAR(255);
ALTER TABLE studios ADD COLUMN watermark_logo_path VARCHAR(500);
ALTER TABLE studios ADD COLUMN watermark_opacity FLOAT DEFAULT 0.5;
ALTER TABLE studios ADD COLUMN watermark_position VARCHAR(20) DEFAULT 'tiled';

-- Valid positions: 'tiled', 'center', 'top-left', 'top-center', 'top-right',
--                  'mid-left', 'mid-right', 'bottom-left', 'bottom-center', 'bottom-right'
```

### Project Table Extension (Phase 2)

```sql
-- Optional per-project override

ALTER TABLE projects ADD COLUMN watermark_override BOOLEAN;
-- NULL = inherit from studio
-- TRUE = force watermark
-- FALSE = disable watermark
```

---

## Data Flow

### 1. Photo Upload with Watermarking

```
1. Client uploads photo
2. UploadService saves original to storage
3. ImageProcessingService.generate_quality_variants() called
4. For each variant (thumbnail, low, medium, high, print):
   a. Resize image to target dimensions
   b. IF variant in (thumbnail, low, medium):
      - Fetch studio watermark settings
      - IF watermark_enabled:
        - WatermarkService.apply_watermark()
   c. Save variant to storage
5. Update photo record with variant paths
```

### 2. Photo Retrieval

```
1. Client requests photo
2. PhotoService determines appropriate variant
3. Returns watermarked variant (for previews)
   OR clean variant (for approved/purchased images)
```

### 3. Watermark Settings Update

```
1. Studio admin updates watermark settings via UI
2. PUT /v2/studios/watermark-settings
3. Settings saved to database
4. OPTIONAL: Trigger re-generation of existing variants
```

---

## File Storage Structure

```
uploads/
├── studios/
│   └── {studio_id}/
│       └── watermarks/
│           ├── logo.png              # Uploaded logo
│           └── logo_processed.png    # Processed/cached version
│
└── projects/
    └── {project_id}/
        ├── originals/
        │   └── photo_001.jpg         # Clean original
        │
        └── variants/
            └── {photo_id}/
                ├── thumbnail.webp     # Watermarked
                ├── low.webp           # Watermarked
                ├── medium.webp        # Watermarked
                ├── high.webp          # CLEAN (no watermark)
                └── print.webp         # CLEAN (no watermark)
```

---

## Watermark Position Algorithms

### Tiled Diagonal (Default)

```python
def create_tiled_watermark(image, watermark, spacing=100, angle=-30):
    """
    Create tiled diagonal watermark covering entire image
    
    1. Rotate watermark by angle (-30° default)
    2. Calculate grid to cover image + overflow
    3. Paste watermark at each grid position
    4. Apply opacity
    """
    # Create larger canvas for rotation overflow
    diagonal = int(math.sqrt(image.width**2 + image.height**2))
    canvas = Image.new('RGBA', (diagonal, diagonal), (0, 0, 0, 0))
    
    # Tile watermarks
    for y in range(0, diagonal, watermark.height + spacing):
        for x in range(0, diagonal, watermark.width + spacing):
            canvas.paste(watermark, (x, y), watermark)
    
    # Rotate
    rotated = canvas.rotate(angle, expand=False)
    
    # Crop to original size and center
    # Apply to image with opacity
```

### Single Position

```python
def apply_positioned_watermark(image, watermark, position, margin=20):
    """
    Apply single watermark at specified position
    
    Positions: center, top-left, top-center, top-right,
               mid-left, mid-right, bottom-left, bottom-center, bottom-right
    """
    positions = {
        'center': ((image.width - watermark.width) // 2,
                   (image.height - watermark.height) // 2),
        'top-left': (margin, margin),
        'top-right': (image.width - watermark.width - margin, margin),
        'bottom-left': (margin, image.height - watermark.height - margin),
        'bottom-right': (image.width - watermark.width - margin,
                         image.height - watermark.height - margin),
        # ... other positions
    }
    x, y = positions[position]
    image.paste(watermark, (x, y), watermark)
```

---

## Caching Strategy

### Watermark Image Cache

```python
class WatermarkCache:
    """Cache processed watermark images for performance"""
    
    def __init__(self, max_size=100):
        self.cache = {}
        self.max_size = max_size
    
    def get_key(self, studio_id, target_width):
        return f"{studio_id}_{target_width}"
    
    def get(self, studio_id, target_width):
        """Get cached watermark scaled for target image width"""
        key = self.get_key(studio_id, target_width)
        return self.cache.get(key)
    
    def set(self, studio_id, target_width, watermark):
        """Cache scaled watermark"""
        if len(self.cache) >= self.max_size:
            self.cache.pop(next(iter(self.cache)))  # Remove oldest
        key = self.get_key(studio_id, target_width)
        self.cache[key] = watermark
```

---

## Security Considerations

### 1. Original Protection
- Originals stored separately from variants
- Never served directly to clients
- Access controlled by authentication

### 2. Watermark Bypass Prevention
- Watermarks burned into pixel data (not overlay)
- No API endpoint to request unwatermarked previews
- High-res variants require approval status check

### 3. Watermark File Security
- Studio watermark logos stored in protected directory
- Only accessible via authenticated admin endpoints
- Validated file types (PNG only)

---

## Performance Considerations

### 1. Variant Generation
- Watermarking adds ~50-100ms per variant
- Parallelizable across variants
- Cached watermark images reduce I/O

### 2. Storage Impact
- Watermarked variants same size as clean variants
- No additional storage for watermark metadata

### 3. Memory Usage
- Watermark images cached in memory
- Single watermark per studio (not per image)
- Memory: ~5MB per cached watermark at max resolution
