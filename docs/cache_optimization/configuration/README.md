# Configuration Documentation

## Overview

This folder contains documentation for the cache strategy configuration system.

---

## Configuration Files

### Location: `/config/`

1. **cache-strategy.config.ts** - Default configuration
2. **cache-strategy.dev.ts** - Development overrides
3. **cache-strategy.prod.ts** - Production overrides

---

## Configuration Structure

```typescript
{
  ttl: {
    memoryMs: 5 * 60 * 1000,          // Memory cache TTL
    indexedDBMs: 24 * 60 * 60 * 1000, // IndexedDB TTL
  },
  
  profiles: {
    client: {
      maxProjects: -1,                // Unlimited
      maxMemoryMB: 300,
      prefetchStrategy: 'aggressive',
    },
    studio: {
      maxActiveProjects: 10,          // LRU limit
      maxMemoryMB: 500,
      prefetchStrategy: 'conservative',
      idleTimeoutMinutes: 30,
    },
  },
  
  features: {
    memoryCache: true,                // Stage 2
    indexedDBCache: true,             // Stage 3
    roleBasedStrategy: true,          // Stage 4
    prefetching: false,
    virtualScrolling: false,
  },
}
```

---

## How Configuration Works

### Loading Order

1. Load default config from `cache-strategy.config.ts`
2. Detect environment (NODE_ENV)
3. Load environment-specific overrides
4. Merge configurations (deep merge)

### Hot Reload

- Configuration supports hot-reload in development
- Changes apply without restarting server
- Subscribe to config changes via `ConfigLoader`

---

## Feature Flags

### memoryCache (Stage 2)

Enables in-memory caching with TTL and LRU eviction.

**When enabled:**
- Cache hit < 1ms
- TTL: 5 minutes
- Studio users: LRU eviction
- Client users: Unlimited cache

### indexedDBCache (Stage 3)

Enables persistent storage via IndexedDB.

**When enabled:**
- Survives page refresh
- TTL: 24 hours
- Storage quota management
- Cold start optimization

### roleBasedStrategy (Stage 4)

Enables role-based API mode selection.

**When enabled:**
- Studio users: `mode=list` (1KB/project)
- Client users: `mode=full` (50KB/project)
- 98% size reduction for studios

---

## Environment-Specific Settings

### Development (dev)

```typescript
{
  features: {
    roleBasedStrategy: true,  // Testing Stage 4
  },
  monitoring: {
    logLevel: 'debug',        // Verbose logging
    enableDevDashboard: true,
  },
  profiles: {
    studio: {
      maxActiveProjects: 5,   // Lower for testing
      idleTimeoutMinutes: 5,  // Faster timeout
    },
  },
}
```

### Production (prod)

```typescript
{
  features: {
    roleBasedStrategy: true,  // Enabled in production
  },
  monitoring: {
    logLevel: 'warn',         // Less verbose
    enableDevDashboard: false,
  },
  profiles: {
    studio: {
      maxActiveProjects: 10,  // Production settings
      idleTimeoutMinutes: 30,
    },
  },
}
```

---

## Configuration API

### Loading Configuration

```typescript
import { configLoader } from './services/ConfigLoader';

// Get current config
const config = configLoader.getConfig();

// Check feature flag
const isEnabled = configLoader.isFeatureEnabled('roleBasedStrategy');

// Subscribe to changes
configLoader.subscribe((newConfig) => {
  console.log('Config updated:', newConfig);
});
```

### Debugging

```javascript
// In browser console
window.__config.get()  // View current config
window.__config.get().features  // View feature flags
```

---

## Best Practices

1. **Never hardcode values** - Always use configuration
2. **Test locally first** - Use dev config for testing
3. **Document changes** - Update this README when adding features
4. **Feature flags** - Use flags for gradual rollout
5. **Monitor metrics** - Track impact of config changes

---

## See Also

- [ConfigLoader.ts](/src/services/ConfigLoader.ts) - Implementation
- [Stage 1 Documentation](/docs/stage-1-foundation/ARCHITECTURE.md)
- [Testing Guide](/docs/stage-1-foundation/TESTING_GUIDE.md)
