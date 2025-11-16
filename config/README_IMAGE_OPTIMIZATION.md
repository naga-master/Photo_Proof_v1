# Image Optimization Configuration Guide

## Overview

This directory contains all configuration for the 5-Layer Rural Network Optimization System.

## Configuration Files

### Main Configuration
- **`image-optimization.config.ts`** - Complete interface definition and default configuration
  - Defines all types and interfaces
  - Contains default values for all settings
  - All features OFF by default for safe rollout

### Environment-Specific Configurations
- **`image-optimization.dev.ts`** - Development environment
  - All features ENABLED for testing
  - Verbose logging
  - Debug tools active
  - Faster refresh intervals

- **`image-optimization.staging.ts`** - Staging environment
  - All features ENABLED for pre-production validation
  - Full logging
  - Analytics testing
  - Real-world scenario testing

- **`image-optimization.prod.ts`** - Production environment
  - Phase 1 & 2 ENABLED (Upload + Compression)
  - Phase 3-5 DISABLED initially (gradual rollout)
  - Minimal logging for performance
  - Analytics enabled

## Configuration Loader

**Service:** `../services/imageOptimizationConfigLoader.ts`

The config loader:
- Auto-detects environment (dev/staging/prod)
- Merges environment config with defaults
- Validates all settings
- Provides type-safe access to configuration
- Supports hot-reload in development

### Usage

```typescript
import { imageOptimizationConfig } from '../services/imageOptimizationConfigLoader';

// Check if feature is enabled
if (imageOptimizationConfig.isChunkedUploadEnabled()) {
  // Use chunked upload
}

// Get specific configuration section
const compressionConfig = imageOptimizationConfig.getCompressionConfig();

// Get quality for network type
const quality = imageOptimizationConfig.getQualityForNetwork('2g');

// Get quality for viewport width
const quality = imageOptimizationConfig.getQualityForViewport(800);
```

## Feature Flags

All optimization features are controlled via feature flags:

```typescript
features: {
  chunkedUpload: boolean;           // Phase 1: Chunked upload with retry
  clientSideCompression: boolean;    // Phase 2: Client-side image compression
  serverSideVariants: boolean;       // Phase 2: Server-side quality variants
  viewportQualitySelection: boolean; // Phase 2.5: Viewport-aware quality
  opfsCache: boolean;                // Phase 3: OPFS persistent cache
  networkAdaptation: boolean;        // Phase 4: Network-aware quality
  offlineQueue: boolean;             // Phase 5: Offline upload queue
  backgroundSync: boolean;           // Phase 5: Background sync
}
```

## Configuration Sections

### 1. Chunked Upload
```typescript
chunkedUpload: {
  defaultChunkSizeMB: 2,           // Default chunk size
  maxRetries: 5,                   // Retry attempts per chunk
  exponentialBackoff: true,        // Use exponential backoff
  networkProfiles: {               // Network-specific settings
    '2g': { chunkSizeMB: 1, parallel: 1 },
    '4g': { chunkSizeMB: 5, parallel: 3 }
  }
}
```

### 2. Image Compression
```typescript
compression: {
  client: {
    targetSizeMB: 5,               // Target size after compression
    format: 'webp',                // Output format
    quality: { initial: 0.9, minimum: 0.5 }
  },
  server: {
    variants: {
      thumbnail: { width: 200, quality: 60 },
      low: { width: 800, quality: 70 },
      medium: { width: 1920, quality: 80 },
      high: { width: 3840, quality: 90 },
      print: { width: null, quality: 95 }
    }
  }
}
```

### 3. Viewport Quality
```typescript
viewportQuality: {
  breakpoints: {
    mobile: { maxWidth: 480, quality: 'low' },
    tablet: { maxWidth: 1024, quality: 'medium' },
    desktop: { maxWidth: 1920, quality: 'high' }
  },
  progressive: {
    enabled: true,                 // Progressive loading
    placeholderQuality: 'thumbnail'
  }
}
```

### 4. OPFS Cache
```typescript
opfs: {
  maxSizeMB: 1000,                 // 1GB cache limit
  evictionStrategy: 'lru',         // LRU eviction
  evictionThresholdPercent: 90     // Start cleanup at 90%
}
```

### 5. Network Adaptation
```typescript
networkAdaptation: {
  detection: {
    method: 'hybrid',              // API + performance-based
    intervalMs: 30000              // Check every 30 seconds
  },
  qualityMapping: {
    '2g': 'low',
    '4g': 'high'
  }
}
```

### 6. Offline Queue
```typescript
offlineQueue: {
  queue: {
    maxQueueSize: 100,
    persistToIndexedDB: true
  },
  backgroundSync: {
    enabled: true,
    syncTag: 'upload-sync'
  }
}
```

## Debugging

### Console Access
```javascript
// In browser console
__imageOptimizationConfig.get()      // View full config
__imageOptimizationConfig.features   // View feature flags
__imageOptimizationConfig.reload()   // Reload configuration
```

### Debug Mode
```typescript
debug: {
  enableVerboseLogging: true,       // Detailed logs
  simulateSlowNetwork: true,        // Test slow network
  simulatedNetworkType: '2g',       // Simulate 2G
  bypassCache: true                 // Disable caching
}
```

## Validation

All configurations are validated at load time:
- Chunk sizes within bounds
- Quality values between 0 and 1
- Percentages between 0 and 100
- Breakpoints in ascending order
- All network profiles defined

Invalid configurations will throw errors with descriptive messages.

## Hot Reload (Development Only)

In development mode, configuration changes are automatically detected and reloaded:
- Update any config file
- Changes apply immediately
- `image-optimization-config-updated` event fired
- Components can react to config changes

## Migration

### Database Changes
The following columns have been added to the `photos` table:
- `variants_json` (TEXT) - Stores JSON mapping of quality variants
- `thumbhash` (TEXT) - Stores ThumbHash for placeholders

Migration script: `photo_proof_api/migrations/004_add_image_optimization_fields.sql`

## Gradual Rollout Strategy

### Week 1: Phase 1 & 2 (10% of users)
```typescript
features: {
  chunkedUpload: userId % 10 === 0,
  clientSideCompression: userId % 10 === 0,
  serverSideVariants: userId % 10 === 0
}
```

### Week 2: Phase 1 & 2 (50% of users)
```typescript
features: {
  chunkedUpload: userId % 2 === 0,
  clientSideCompression: userId % 2 === 0,
  serverSideVariants: userId % 2 === 0
}
```

### Week 3: Phase 1 & 2 (100% of users)
```typescript
features: {
  chunkedUpload: true,
  clientSideCompression: true,
  serverSideVariants: true
}
```

### Week 4: Phase 3-5 (Gradual rollout)
Enable remaining features progressively after validation.

## Monitoring

All optimization events are tracked:
```typescript
monitoring: {
  metrics: {
    trackUploadSpeed: true,
    trackCacheHitRate: true,
    trackNetworkChanges: true,
    trackCompressionRatio: true,
    trackQueueLength: true
  }
}
```

Access metrics via:
- Development: Dashboard at `/admin/optimization-metrics`
- Production: Analytics endpoint (`/api/analytics`)

## Emergency Rollback

To disable any feature instantly:
1. Update config file (e.g., `image-optimization.prod.ts`)
2. Set feature flag to `false`
3. Deploy config change (no code deployment needed)
4. System reverts to original behavior

Example:
```typescript
features: {
  chunkedUpload: false  // Instant disable
}
```

## Support

For issues or questions:
- Check validation errors in console
- Review logs (monitoring.logLevel)
- Use debug mode for troubleshooting
- Check browser console for `__imageOptimizationConfig`
