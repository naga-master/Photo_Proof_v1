# Watermarking Implementation Plan

## Overview

This document provides a step-by-step implementation guide for the watermarking feature, organized into phases with specific tasks, file changes, and estimated effort.

---

## Phase 1: Backend Foundation (MVP)

**Goal**: Basic watermarking with studio logo, tiled position, 50% opacity

**Estimated Effort**: 6-8 hours

### Task 1.1: Database Migration

**File**: `photo_proof_api/migrations/0XX_add_watermark_settings.sql`

```sql
-- Add watermark settings to studios table
ALTER TABLE studios ADD COLUMN IF NOT EXISTS watermark_enabled BOOLEAN DEFAULT TRUE;
ALTER TABLE studios ADD COLUMN IF NOT EXISTS watermark_type VARCHAR(20) DEFAULT 'logo';
ALTER TABLE studios ADD COLUMN IF NOT EXISTS watermark_text VARCHAR(255);
ALTER TABLE studios ADD COLUMN IF NOT EXISTS watermark_logo_path VARCHAR(500);
ALTER TABLE studios ADD COLUMN IF NOT EXISTS watermark_opacity FLOAT DEFAULT 0.5;
ALTER TABLE studios ADD COLUMN IF NOT EXISTS watermark_position VARCHAR(20) DEFAULT 'tiled';

-- Add index for quick lookups
CREATE INDEX IF NOT EXISTS idx_studios_watermark_enabled ON studios(watermark_enabled);

COMMENT ON COLUMN studios.watermark_position IS 
'Valid values: tiled, center, top-left, top-center, top-right, mid-left, mid-right, bottom-left, bottom-center, bottom-right';
```

**Effort**: 30 minutes

---

### Task 1.2: Schema Updates

**File**: `photo_proof_api/app/schemas/studio.py`

```python
# Add to existing StudioBase or create new schema

class WatermarkSettings(BaseModel):
    """Watermark configuration for a studio"""
    enabled: bool = True
    type: Literal['logo', 'text'] = 'logo'
    text: Optional[str] = None  # Fallback text
    logo_path: Optional[str] = None
    opacity: float = Field(default=0.5, ge=0.1, le=1.0)
    position: Literal[
        'tiled', 'center', 
        'top-left', 'top-center', 'top-right',
        'mid-left', 'mid-right',
        'bottom-left', 'bottom-center', 'bottom-right'
    ] = 'tiled'

class WatermarkSettingsUpdate(BaseModel):
    """Update watermark settings"""
    enabled: Optional[bool] = None
    type: Optional[Literal['logo', 'text']] = None
    text: Optional[str] = None
    opacity: Optional[float] = Field(default=None, ge=0.1, le=1.0)
    position: Optional[str] = None
```

**Effort**: 30 minutes

---

### Task 1.3: Watermark Service

**File**: `photo_proof_api/app/services/watermark_service.py` (NEW)

```python
"""
Watermark Service

Server-side watermark application for photo protection.
"""

import math
import logging
from pathlib import Path
from typing import Optional, Tuple
from PIL import Image, ImageDraw, ImageFont, ImageEnhance

logger = logging.getLogger(__name__)


class WatermarkService:
    """Service for applying watermarks to images"""
    
    # Default font for text watermarks
    DEFAULT_FONT_SIZE = 48
    DEFAULT_FONT = "Arial"
    
    def __init__(self):
        self.watermark_cache = {}
        self.uploads_base = Path("uploads")
    
    def apply_watermark(
        self,
        image: Image.Image,
        watermark_enabled: bool,
        watermark_type: str,
        watermark_text: Optional[str],
        watermark_logo_path: Optional[str],
        watermark_opacity: float,
        watermark_position: str,
        studio_name: str
    ) -> Image.Image:
        """
        Apply watermark to image based on studio settings.
        
        Args:
            image: PIL Image to watermark
            watermark_enabled: Whether watermarking is enabled
            watermark_type: 'logo' or 'text'
            watermark_text: Text to use (fallback or if type='text')
            watermark_logo_path: Path to logo file
            watermark_opacity: Opacity (0.0 to 1.0)
            watermark_position: Position string
            studio_name: Studio name for text fallback
        
        Returns:
            Watermarked PIL Image
        """
        if not watermark_enabled:
            return image
        
        # Convert to RGBA for transparency support
        if image.mode != 'RGBA':
            image = image.convert('RGBA')
        
        # Try logo watermark first
        if watermark_type == 'logo' and watermark_logo_path:
            logo_full_path = self.uploads_base / watermark_logo_path
            if logo_full_path.exists():
                return self._apply_logo_watermark(
                    image, logo_full_path, watermark_opacity, watermark_position
                )
        
        # Fallback to text watermark
        text = watermark_text or f"© {studio_name}"
        return self._apply_text_watermark(
            image, text, watermark_opacity, watermark_position
        )
    
    def _apply_logo_watermark(
        self,
        image: Image.Image,
        logo_path: Path,
        opacity: float,
        position: str
    ) -> Image.Image:
        """Apply logo watermark to image"""
        try:
            logo = Image.open(logo_path).convert('RGBA')
            
            # Scale logo to appropriate size (max 20% of image width)
            max_logo_width = int(image.width * 0.2)
            if logo.width > max_logo_width:
                ratio = max_logo_width / logo.width
                logo = logo.resize(
                    (max_logo_width, int(logo.height * ratio)),
                    Image.Resampling.LANCZOS
                )
            
            # Apply opacity
            logo = self._apply_opacity(logo, opacity)
            
            # Apply based on position
            if position == 'tiled':
                return self._create_tiled_watermark(image, logo)
            else:
                return self._apply_positioned_watermark(image, logo, position)
                
        except Exception as e:
            logger.error(f"Error applying logo watermark: {e}")
            return image
    
    def _apply_text_watermark(
        self,
        image: Image.Image,
        text: str,
        opacity: float,
        position: str
    ) -> Image.Image:
        """Apply text watermark to image"""
        try:
            # Create text watermark image
            font_size = max(24, image.width // 30)
            
            try:
                font = ImageFont.truetype("Arial.ttf", font_size)
            except:
                font = ImageFont.load_default()
            
            # Calculate text size
            dummy_draw = ImageDraw.Draw(Image.new('RGBA', (1, 1)))
            bbox = dummy_draw.textbbox((0, 0), text, font=font)
            text_width = bbox[2] - bbox[0]
            text_height = bbox[3] - bbox[1]
            
            # Create text image with padding
            padding = 20
            text_img = Image.new('RGBA', 
                (text_width + padding * 2, text_height + padding * 2), 
                (0, 0, 0, 0)
            )
            draw = ImageDraw.Draw(text_img)
            
            # Draw text with opacity
            alpha = int(255 * opacity)
            draw.text((padding, padding), text, font=font, fill=(255, 255, 255, alpha))
            
            # Apply based on position
            if position == 'tiled':
                return self._create_tiled_watermark(image, text_img, spacing=50)
            else:
                return self._apply_positioned_watermark(image, text_img, position)
                
        except Exception as e:
            logger.error(f"Error applying text watermark: {e}")
            return image
    
    def _apply_opacity(self, image: Image.Image, opacity: float) -> Image.Image:
        """Apply opacity to RGBA image"""
        if image.mode != 'RGBA':
            image = image.convert('RGBA')
        
        # Split channels and modify alpha
        r, g, b, a = image.split()
        a = a.point(lambda x: int(x * opacity))
        return Image.merge('RGBA', (r, g, b, a))
    
    def _create_tiled_watermark(
        self,
        image: Image.Image,
        watermark: Image.Image,
        spacing: int = 100,
        angle: int = -30
    ) -> Image.Image:
        """Create tiled diagonal watermark pattern"""
        # Calculate diagonal size for rotation
        diagonal = int(math.sqrt(image.width**2 + image.height**2)) * 2
        
        # Create transparent canvas
        canvas = Image.new('RGBA', (diagonal, diagonal), (0, 0, 0, 0))
        
        # Tile watermarks across canvas
        wm_width = watermark.width + spacing
        wm_height = watermark.height + spacing
        
        for y in range(-diagonal, diagonal, wm_height):
            for x in range(-diagonal, diagonal, wm_width):
                canvas.paste(watermark, (x, y), watermark)
        
        # Rotate canvas
        rotated = canvas.rotate(angle, expand=False, resample=Image.Resampling.BILINEAR)
        
        # Crop to center
        crop_x = (rotated.width - image.width) // 2
        crop_y = (rotated.height - image.height) // 2
        cropped = rotated.crop((crop_x, crop_y, crop_x + image.width, crop_y + image.height))
        
        # Composite onto original
        result = image.copy()
        result.paste(cropped, (0, 0), cropped)
        
        return result
    
    def _apply_positioned_watermark(
        self,
        image: Image.Image,
        watermark: Image.Image,
        position: str,
        margin: int = 20
    ) -> Image.Image:
        """Apply single watermark at specified position"""
        positions = {
            'center': (
                (image.width - watermark.width) // 2,
                (image.height - watermark.height) // 2
            ),
            'top-left': (margin, margin),
            'top-center': ((image.width - watermark.width) // 2, margin),
            'top-right': (image.width - watermark.width - margin, margin),
            'mid-left': (margin, (image.height - watermark.height) // 2),
            'mid-right': (
                image.width - watermark.width - margin,
                (image.height - watermark.height) // 2
            ),
            'bottom-left': (margin, image.height - watermark.height - margin),
            'bottom-center': (
                (image.width - watermark.width) // 2,
                image.height - watermark.height - margin
            ),
            'bottom-right': (
                image.width - watermark.width - margin,
                image.height - watermark.height - margin
            ),
        }
        
        x, y = positions.get(position, positions['center'])
        
        result = image.copy()
        result.paste(watermark, (x, y), watermark)
        
        return result


# Singleton instance
watermark_service = WatermarkService()
```

**Effort**: 2-3 hours

---

### Task 1.4: Integrate with Image Processing

**File**: `photo_proof_api/app/services/image_processing_service.py`

**Changes**:

```python
# Add import at top
from app.services.watermark_service import watermark_service
from app.db.models import Studio

# Modify create_variant method:

async def create_variant(
    self,
    img: Image.Image,
    photo: Photo,
    variant_name: str,
    target_width: Optional[int],
    quality: int,
    db: Session  # Add db session parameter
) -> str:
    """Create a single quality variant"""
    
    # Resize if needed
    if target_width and img.width > target_width:
        ratio = target_width / img.width
        new_height = int(img.height * ratio)
        resized = img.resize((target_width, new_height), Image.Resampling.LANCZOS)
    else:
        resized = img.copy()
    
    # Auto-orient based on EXIF
    resized = ImageOps.exif_transpose(resized)
    
    # Apply watermark to preview variants only
    if variant_name in ('thumbnail', 'low', 'medium'):
        resized = await self._apply_watermark_if_enabled(resized, photo, db)
    
    # Save variant...
    # (rest of existing code)


async def _apply_watermark_if_enabled(
    self,
    img: Image.Image,
    photo: Photo,
    db: Session
) -> Image.Image:
    """Apply watermark if studio has it enabled"""
    try:
        # Get studio settings
        from app.db.models import Project
        project = db.query(Project).filter(Project.id == photo.project_id).first()
        if not project:
            return img
        
        studio = db.query(Studio).filter(Studio.id == project.studio_id).first()
        if not studio or not studio.watermark_enabled:
            return img
        
        # Apply watermark
        return watermark_service.apply_watermark(
            image=img,
            watermark_enabled=studio.watermark_enabled,
            watermark_type=studio.watermark_type or 'text',
            watermark_text=studio.watermark_text,
            watermark_logo_path=studio.watermark_logo_path,
            watermark_opacity=studio.watermark_opacity or 0.5,
            watermark_position=studio.watermark_position or 'tiled',
            studio_name=studio.name
        )
    except Exception as e:
        logger.error(f"Error applying watermark: {e}")
        return img
```

**Effort**: 1-2 hours

---

### Task 1.5: Update Studio Model

**File**: `photo_proof_api/app/db/models/studio.py`

```python
# Add columns to Studio model

class Studio(Base, TimestampMixin):
    # ... existing fields ...
    
    # Watermark settings
    watermark_enabled = Column(Boolean, default=True)
    watermark_type = Column(String(20), default='logo')
    watermark_text = Column(String(255), nullable=True)
    watermark_logo_path = Column(String(500), nullable=True)
    watermark_opacity = Column(Float, default=0.5)
    watermark_position = Column(String(20), default='tiled')
```

**Effort**: 30 minutes

---

## Phase 2: API Endpoints

**Goal**: REST API for watermark settings management

**Estimated Effort**: 2-3 hours

### Task 2.1: Watermark Settings Endpoints

**File**: `photo_proof_api/app/routers/studios.py`

```python
@router.get("/{studio_id}/watermark-settings", response_model=WatermarkSettings)
async def get_watermark_settings(
    studio_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get watermark settings for a studio"""
    # Verify user has access to studio
    # Return watermark settings


@router.put("/{studio_id}/watermark-settings", response_model=WatermarkSettings)
async def update_watermark_settings(
    studio_id: str,
    settings: WatermarkSettingsUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update watermark settings for a studio"""
    # Verify user has admin access
    # Update settings
    # Return updated settings


@router.post("/{studio_id}/watermark-logo")
async def upload_watermark_logo(
    studio_id: str,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Upload custom watermark logo"""
    # Verify PNG file
    # Save to studios/{studio_id}/watermarks/logo.png
    # Update studio.watermark_logo_path
    # Return success


@router.delete("/{studio_id}/watermark-logo")
async def delete_watermark_logo(
    studio_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Remove custom watermark logo"""
    # Delete file
    # Clear studio.watermark_logo_path
```

**Effort**: 2 hours

---

## Phase 3: Frontend Settings UI

**Goal**: Settings page for watermark configuration

**Estimated Effort**: 3-4 hours

### Task 3.1: Watermark Settings Component

**File**: `Photo_Proof_v1/components/studio/settings/WatermarkSettings.tsx` (NEW)

```tsx
interface WatermarkSettingsProps {
  studioId: string;
}

const WatermarkSettings: React.FC<WatermarkSettingsProps> = ({ studioId }) => {
  const [settings, setSettings] = useState<WatermarkSettings | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Settings form:
  // - Enable/disable toggle
  // - Type selector (logo/text)
  // - Logo upload dropzone
  // - Text input (for fallback)
  // - Opacity slider (10-100%)
  // - Position selector (dropdown or visual grid)
  // - Preview section showing sample watermarked image
  
  return (
    <div className="space-y-6">
      {/* Enable Toggle */}
      {/* Type Selector */}
      {/* Logo Upload */}
      {/* Text Input */}
      {/* Opacity Slider */}
      {/* Position Selector */}
      {/* Preview */}
    </div>
  );
};
```

**Effort**: 3-4 hours

### Task 3.2: Service Methods

**File**: `Photo_Proof_v1/services/studioService.ts`

```typescript
// Add watermark API methods

export const studioService = {
  // ... existing methods ...
  
  async getWatermarkSettings(studioId: string): Promise<WatermarkSettings> {
    const response = await api.get(`/v2/studios/${studioId}/watermark-settings`);
    return response.data;
  },
  
  async updateWatermarkSettings(
    studioId: string, 
    settings: Partial<WatermarkSettings>
  ): Promise<WatermarkSettings> {
    const response = await api.put(
      `/v2/studios/${studioId}/watermark-settings`, 
      settings
    );
    return response.data;
  },
  
  async uploadWatermarkLogo(studioId: string, file: File): Promise<void> {
    const formData = new FormData();
    formData.append('file', file);
    await api.post(`/v2/studios/${studioId}/watermark-logo`, formData);
  },
  
  async deleteWatermarkLogo(studioId: string): Promise<void> {
    await api.delete(`/v2/studios/${studioId}/watermark-logo`);
  },
};
```

**Effort**: 1 hour

---

## Phase 4: Testing & Polish

**Estimated Effort**: 2-3 hours

### Task 4.1: Unit Tests

**File**: `photo_proof_api/tests/services/test_watermark_service.py`

- Test logo watermark application
- Test text watermark fallback
- Test tiled positioning
- Test single position options
- Test opacity application

### Task 4.2: Integration Tests

- Test variant generation with watermark
- Test watermark settings API
- Test logo upload/delete

### Task 4.3: Manual Testing

- Upload photo, verify watermarked variants
- Change settings, verify new uploads reflect changes
- Test with/without logo
- Test all position options

---

## Summary

| Phase | Tasks | Effort |
|-------|-------|--------|
| Phase 1: Backend Foundation | 5 tasks | 6-8 hours |
| Phase 2: API Endpoints | 1 task | 2-3 hours |
| Phase 3: Frontend Settings | 2 tasks | 4-5 hours |
| Phase 4: Testing | 3 tasks | 2-3 hours |
| **Total** | **11 tasks** | **14-19 hours** |

---

## File Changes Summary

### New Files
- `photo_proof_api/app/services/watermark_service.py`
- `photo_proof_api/migrations/0XX_add_watermark_settings.sql`
- `Photo_Proof_v1/components/studio/settings/WatermarkSettings.tsx`
- `photo_proof_api/tests/services/test_watermark_service.py`

### Modified Files
- `photo_proof_api/app/db/models/studio.py`
- `photo_proof_api/app/schemas/studio.py`
- `photo_proof_api/app/services/image_processing_service.py`
- `photo_proof_api/app/routers/studios.py`
- `Photo_Proof_v1/services/studioService.ts`
- `Photo_Proof_v1/components/studio/SettingsPage.tsx`

---

## Rollout Plan

1. **Development**: Implement all phases
2. **Staging**: Test with sample studios
3. **Migration**: Run database migration
4. **Feature Flag**: Deploy with flag disabled
5. **Beta**: Enable for select studios
6. **GA**: Enable for all studios
