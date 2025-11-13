# Product Mockup Images - Self-Hosted Storage

## Problem Statement

Products currently fetch mockup images from **Unsplash API**, which is unreliable and fails frequently. This causes:
- Broken product images in store
- Poor user experience
- External dependency on third-party service

### Current Implementation

```python
# store.py model
class Product(Base, TimestampMixin):
    mockup_images = Column(JSON, nullable=False)
    # Stores: ["https://source.unsplash.com/random/800x800?print", ...]
```

**Problems**:
1. Unsplash rate limiting
2. Random images (inconsistent)
3. Network dependency
4. CORS issues
5. No control over image quality

## Solution Architecture

### Approach: Self-Hosted Static Files

Store product mockup images in backend `/static/products/` directory and serve them directly.

### Directory Structure

```
photo_proof_api/
├── static/
│   └── products/
│       ├── prints/
│       │   ├── print-mockup-1.jpg
│       │   ├── print-mockup-2.jpg
│       │   ├── print-mockup-3.jpg
│       │   └── print-lustre-sample.jpg
│       ├── canvases/
│       │   ├── canvas-mockup-1.jpg
│       │   ├── canvas-mockup-2.jpg
│       │   └── canvas-wrapped.jpg
│       ├── albums/
│       │   ├── album-leather-1.jpg
│       │   ├── album-linen-1.jpg
│       │   └── album-open-spread.jpg
│       └── frames/
│           ├── frame-black-1.jpg
│           ├── frame-white-1.jpg
│           └── frame-wood-1.jpg
```

## Implementation Plan

### Phase 1: Image Sourcing

#### Royalty-Free Sources

1. **Pexels** (https://pexels.com)
   - License: Free for commercial use
   - Quality: High-resolution
   - Search terms: "photo print mockup", "canvas print", "photo frame"

2. **Pixabay** (https://pixabay.com)
   - License: Free for commercial use
   - Quality: Good
   - Search terms: "print mockup", "picture frame", "photo album"

3. **Unsplash** (Download and host)
   - License: Free for commercial use
   - Download specific images (don't use API)
   - Select consistent, professional photos

#### Image Requirements

| Spec | Value | Reason |
|------|-------|--------|
| Format | JPEG | Best compression for photos |
| Dimensions | 800x800px | Square, consistent sizing |
| File Size | <200KB | Fast loading |
| Quality | 85% | Balance quality/size |
| Color Space | sRGB | Web standard |

### Phase 2: Backend Storage

#### Create Static Directory

```bash
mkdir -p photo_proof_api/static/products/{prints,canvases,albums,frames}
```

#### Database Migration

```python
# migration_update_product_images.py
from app.db.session import SessionLocal
from app.db.models import Product

def update_product_images():
    db = SessionLocal()
    
    # Prints
    prints = db.query(Product).filter(Product.id == 'prints').first()
    if prints:
        prints.mockup_images = [
            "/static/products/prints/print-mockup-1.jpg",
            "/static/products/prints/print-mockup-2.jpg",
            "/static/products/prints/print-mockup-3.jpg",
        ]
    
    # Canvases
    canvases = db.query(Product).filter(Product.id == 'canvases').first()
    if canvases:
        canvases.mockup_images = [
            "/static/products/canvases/canvas-mockup-1.jpg",
            "/static/products/canvases/canvas-mockup-2.jpg",
        ]
    
    # Repeat for albums, frames, etc.
    
    db.commit()
    db.close()

if __name__ == "__main__":
    update_product_images()
```

#### Static File Serving (Already Configured)

FastAPI already serves static files from `/static/`:

```python
# main.py (existing)
app.mount("/static", StaticFiles(directory="static"), name="static")
```

### Phase 3: Frontend Integration

#### Update Image URL Handling

```typescript
// StorePage.tsx
const displayProducts = useMemo(() => catalog.map(product => {
  // Handle both external and relative URLs
  const mockupImages = product.mockupImages.map(img => 
    img.startsWith('http') 
      ? img  // External URL (backward compat)
      : `http://localhost:8000${img}`  // Local static file
  );
  
  return { ...product, mockupImages };
}), [catalog]);
```

#### ProductCard Component

```typescript
const ProductCard: React.FC<{ product: Product }> = ({ product }) => {
  const coverImage = product.mockupImages[0] ?? FALLBACK_IMAGE;
  
  return (
    <img 
      src={coverImage}
      alt={product.name}
      onError={(e) => {
        e.currentTarget.src = FALLBACK_IMAGE;
      }}
    />
  );
};
```

## Image Sourcing Guide

### Prints Category

**Search Terms**: "photo print mockup", "printed photograph", "photo frame display"

**Desired Shots**:
1. Close-up of single print on wall
2. Multiple prints on desk/table
3. Print in hand showing quality
4. Print next to camera (photography context)

**Example Images**:
- Professional photo print on white wall
- Stack of lustre prints on wooden table
- Hand holding 8x10 print
- Prints displayed in studio setting

### Canvases Category

**Search Terms**: "canvas print mockup", "stretched canvas", "wall art canvas"

**Desired Shots**:
1. Large canvas on living room wall
2. Gallery wrap detail (side view)
3. Multiple canvas sizes comparison
4. Canvas in modern interior

**Example Images**:
- 24x36 canvas above sofa
- Canvas close-up showing texture
- Triptych canvas set
- Canvas in minimalist room

### Albums Category

**Search Terms**: "photo album", "wedding album", "professional photo book"

**Desired Shots**:
1. Closed album cover (leather/linen)
2. Open album showing spread
3. Album stack (multiple sizes)
4. Hand opening album

**Example Images**:
- Leather-bound wedding album
- Linen album on coffee table
- Open album showing photos
- Album collection display

### Frames Category

**Search Terms**: "picture frame", "photo frame mockup", "framed photograph"

**Desired Shots**:
1. Black frame on white wall
2. White frame on gray wall
3. Wood frame on shelf
4. Multiple frame styles

**Example Images**:
- Classic black frame portrait
- White matted frame
- Rustic wood frame
- Frame gallery wall

## Implementation Steps

### Step 1: Download Images (Manual)

```bash
# Create directory structure
cd photo_proof_api
mkdir -p static/products/{prints,canvases,albums,frames}

# Download images to each folder
# Name convention: {category}-{style}-{number}.jpg
# Example: print-lustre-1.jpg, canvas-wrapped-1.jpg
```

### Step 2: Optimize Images

```bash
# Install ImageMagick (if not installed)
# brew install imagemagick  # macOS
# apt-get install imagemagick  # Ubuntu

# Resize and compress all images
cd static/products
for img in **/*.jpg; do
  convert "$img" -resize 800x800^ -gravity center -extent 800x800 -quality 85 "$img"
done
```

### Step 3: Update Database

```bash
cd photo_proof_api
python migration_update_product_images.py
```

### Step 4: Update Frontend

Already handled in Phase 3 implementation above.

### Step 5: Test

```bash
# Test static file serving
curl http://localhost:8000/static/products/prints/print-mockup-1.jpg

# Should return image file
```

## Testing Checklist

### Backend Tests
- [ ] Static files accessible at `/static/products/`
- [ ] Correct MIME types returned
- [ ] No CORS errors
- [ ] Fast load times (<500ms)

### Frontend Tests
- [ ] All product images load
- [ ] No broken image icons
- [ ] Images display at correct size (800x800)
- [ ] Fallback image works if file missing
- [ ] Works across all product categories

### Performance Tests
- [ ] Image load time <500ms
- [ ] Page load time improvement vs Unsplash
- [ ] No network errors
- [ ] Cache headers set correctly

## Fallback Strategy

### Image Not Found
```typescript
<img 
  src={productImage}
  onError={(e) => {
    e.currentTarget.src = '/placeholder-image.jpg';
  }}
/>
```

### Gradual Migration
```python
# Support both external and local images during transition
if mockup_image.startswith('http'):
    # External URL (old)
else:
    # Local static file (new)
```

## Performance Comparison

| Metric | Unsplash API | Self-Hosted | Improvement |
|--------|--------------|-------------|-------------|
| Load Time | 800-2000ms | 50-200ms | 75-90% faster |
| Reliability | 95% (rate limits) | 99.9% | More reliable |
| CORS Issues | Yes | No | Eliminated |
| Image Consistency | Random | Curated | Controlled |
| Bandwidth Cost | External | Local | Predictable |

## Migration Timeline

| Phase | Duration | Tasks |
|-------|----------|-------|
| Image Sourcing | 2 hours | Find and download images |
| Image Processing | 30 min | Resize, optimize, organize |
| Backend Setup | 30 min | Create dirs, update DB |
| Frontend Update | 30 min | Handle relative URLs |
| Testing | 30 min | Verify all products |
| **Total** | **4 hours** | Complete migration |

## Rollback Plan

If issues arise:

```python
# Revert database to external URLs
prints.mockup_images = [
    "https://images.pexels.com/photos/123/pexels-photo-123.jpeg",
    # ... external URLs
]
```

No code changes needed, just database rollback.

## Future Enhancements

1. **CDN Integration**: Move to CloudFront/Cloudinary for global distribution
2. **Multiple Sizes**: Serve 400px, 800px, 1200px variants
3. **WebP Format**: Add WebP with JPEG fallback
4. **Lazy Loading**: Implement intersection observer
5. **Admin Upload**: Allow admins to upload custom product images

## Related Issues

- Issue #1: Photo selection (uses similar image handling)
- Future: User-uploaded product photos
- Future: Product image zoom/gallery

## References

- FastAPI Static Files: [FastAPI Docs](https://fastapi.tiangolo.com/tutorial/static-files/)
- Image Optimization: [Google Web.dev](https://web.dev/fast/#optimize-your-images)
- Pexels API: [Pexels Docs](https://www.pexels.com/api/)
