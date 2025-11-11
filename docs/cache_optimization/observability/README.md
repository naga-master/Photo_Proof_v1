# Observability Documentation

## Overview

Complete observability for the caching system through events, logging, and debugging tools.

---

## Event System

### Event Types

```typescript
enum CacheEventType {
  // Cache operations
  CACHE_HIT = 'cache.hit',
  CACHE_MISS = 'cache.miss',
  CACHE_SET = 'cache.set',
  CACHE_EVICT = 'cache.evict',
  CACHE_CLEAR = 'cache.clear',
  CACHE_CHECK = 'cache.check',
  
  // API operations
  API_CALL_START = 'api.call.start',
  API_CALL_SUCCESS = 'api.call.success',
  API_CALL_ERROR = 'api.call.error',
  
  // Role detection
  ROLE_DETECTED = 'role.detected',
  PROFILE_LOADED = 'profile.loaded',
  
  // Storage
  STORAGE_QUOTA = 'storage.quota',
  STORAGE_CLEANUP = 'storage.cleanup',
}
```

---

### Event Structure

```typescript
{
  type: 'cache.hit',
  timestamp: 1699564800000,
  operationId: 'abc-123',
  duration: 1.5,  // ms (optional)
  metadata: {
    source: 'memory',
    key: 'projects:all:all:list',
    role: 'studio',
    mode: 'list',
  }
}
```

---

### Subscribing to Events

```typescript
import { cacheEvents, CacheEventType } from './services/cache-events/CacheEventEmitter';

// Subscribe to specific event
cacheEvents.on(CacheEventType.CACHE_HIT, (event) => {
  console.log('Cache hit:', event.metadata.key);
});

// Subscribe to all events
cacheEvents.on('*', (event) => {
  console.log('Event:', event.type, event.metadata);
});
```

---

## Logging

### Development Mode

**Console Logging** (color-coded):
- 🟢 `cache.hit` - Green
- 🔴 `cache.miss` - Red  
- 🔵 `api.call.start` - Blue
- 🟡 `api.call.success` - Yellow

**Log Levels:**
- `debug` - All events
- `info` - Important operations
- `warn` - Performance issues
- `error` - Failures

### Production Mode

**Analytics Batching:**
- Events batched every 30s
- Sent to analytics endpoint
- Includes performance metrics

---

## Debugging Tools

### Browser Console API

```javascript
// Cache Management
window.__cache.stats()        // Cache statistics
window.__cache.clear()        // Clear memory cache
window.__cache.get(key)       // Get cached value
window.__cache.has(key)       // Check if key exists

// IndexedDB Management
window.__indexedDB.stats()    // IndexedDB statistics
window.__indexedDB.keys()     // List all keys
window.__indexedDB.clear()    // Clear IndexedDB
window.__indexedDB.get(key)   // Get value from IndexedDB

// Event System
window.__cacheEvents.history()  // All events (last 1000)
window.__cacheEvents.stats()    // Event statistics
window.__cacheEvents.clear()    // Clear event history

// Configuration
window.__config.get()           // Current configuration
window.__config.reload()        // Reload configuration

// Role Detection
window.__roleDetector.getRole()    // Current role
window.__roleDetector.getProfile() // Current profile
```

---

### Event History

```javascript
// Get last 10 events
window.__cacheEvents.history().slice(-10)

// Filter by type
window.__cacheEvents.history().filter(e => 
  e.type === 'api.call.success'
)

// Find slow API calls
window.__cacheEvents.history()
  .filter(e => e.type === 'api.call.success' && e.duration > 1000)
  .map(e => ({
    endpoint: e.metadata.endpoint,
    duration: e.duration,
    size: e.metadata.responseSize,
  }))
```

---

### Performance Analysis

```javascript
// Cache effectiveness
const stats = window.__cache.stats();
console.log(`
  Hit Rate: ${stats.hitRate.toFixed(2)}%
  API Calls Avoided: ${stats.hits}
  Bandwidth Saved: ${((stats.hits * 50) / 1024).toFixed(2)}MB
`);

// Response time analysis
const apiCalls = window.__cacheEvents.history()
  .filter(e => e.type === 'api.call.success');

const avgResponseTime = apiCalls.reduce((sum, e) => 
  sum + e.duration, 0
) / apiCalls.length;

console.log(`Average API Response: ${avgResponseTime.toFixed(0)}ms`);
```

---

## Event Timeline

### Visualizing Events

```javascript
// Group events by type
const timeline = window.__cacheEvents.history().reduce((acc, event) => {
  const minute = Math.floor(event.timestamp / 60000);
  acc[minute] = acc[minute] || {};
  acc[minute][event.type] = (acc[minute][event.type] || 0) + 1;
  return acc;
}, {});

console.table(timeline);
```

---

## Monitoring

### Key Metrics to Track

1. **Cache Hit Rate** - Target: >90%
2. **Memory Usage** - Target: <50% of limit
3. **API Call Count** - Target: <5 per session
4. **Response Sizes** - Studio: <100KB, Client: <500KB
5. **Load Times** - Target: <500ms

### Alerts

```javascript
// Set up monitoring
setInterval(() => {
  const stats = window.__cache.stats();
  
  if (stats.hitRate < 80) {
    console.warn('⚠️ Cache hit rate below 80%:', stats.hitRate);
  }
  
  if (stats.utilizationPercent > 90) {
    console.warn('⚠️ Memory usage above 90%:', stats.utilizationPercent);
  }
}, 60000);  // Check every minute
```

---

## Troubleshooting Guide

### Low Cache Hit Rate

**Check:**
```javascript
const stats = window.__cache.stats();
console.log('Hit rate:', stats.hitRate);
console.log('Hits:', stats.hits, 'Misses:', stats.misses);
```

**Common Causes:**
- TTL too short
- Cache keys not matching
- Feature flags disabled

---

### High Memory Usage

**Check:**
```javascript
const stats = window.__cache.stats();
console.log('Memory:', stats.sizeMB, '/', stats.maxSizeMB);
console.log('Entries:', stats.entryCount);
```

**Solutions:**
- Lower maxMemoryMB in config
- Enable LRU eviction
- Reduce TTL

---

### API Calls Not Reduced

**Check:**
```javascript
const apiCalls = window.__cacheEvents.history()
  .filter(e => e.type === 'api.call.success');
console.log('API calls made:', apiCalls.length);
```

**Common Causes:**
- Role-based strategy disabled
- Cache miss on every request
- Mode parameter not used

---

## Export Observability Data

```javascript
// Export full diagnostic report
const report = {
  timestamp: Date.now(),
  cache: window.__cache.stats(),
  indexedDB: await window.__indexedDB.stats(),
  events: window.__cacheEvents.stats(),
  config: window.__config.get(),
  role: window.__roleDetector.getProfile(),
  recentEvents: window.__cacheEvents.history().slice(-100),
};

console.log(JSON.stringify(report, null, 2));
// Copy and save for analysis
```

---

## See Also

- [Metrics Documentation](/docs/metrics/)
- [Configuration Documentation](/docs/configuration/)
- [Testing Guide](/docs/testing/)
- [Stage 1: Foundation](/docs/stage-1-foundation/ARCHITECTURE.md)
