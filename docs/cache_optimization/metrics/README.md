# Metrics Documentation

## Overview

This folder contains documentation for performance metrics and monitoring.

---

## Available Metrics

### Cache Metrics

**Memory Cache:**
```javascript
window.__cache.stats()
// Returns:
{
  hits: 150,
  misses: 10,
  sets: 10,
  evictions: 2,
  hitRate: 93.75,
  sizeMB: 12.5,
  maxSizeMB: 500,
  utilizationPercent: 2.5,
  entryCount: 8,
}
```

**IndexedDB Cache:**
```javascript
await window.__indexedDB.stats()
// Returns:
{
  entryCount: 25,
  totalSize: 52428800,  // bytes
  oldestEntry: Date,
  newestEntry: Date,
  quotaUsage: 0.5,      // 50%
}
```

---

### API Metrics

```javascript
// Get all API call events
const apiCalls = window.__cacheEvents.history().filter(e => 
  e.type === 'api.call.success'
);

// Calculate metrics
const totalCalls = apiCalls.length;
const avgDuration = apiCalls.reduce((sum, e) => 
  sum + e.duration, 0
) / totalCalls;
const totalTransferred = apiCalls.reduce((sum, e) => 
  sum + (e.metadata?.responseSize || 0), 0
);

console.log({
  totalCalls,
  avgDuration: `${avgDuration.toFixed(0)}ms`,
  totalTransferred: `${(totalTransferred / 1024 / 1024).toFixed(2)}MB`,
});
```

---

### Event Statistics

```javascript
window.__cacheEvents.stats()
// Returns:
{
  totalEvents: 325,
  eventsByType: {
    'cache.hit': 150,
    'cache.miss': 10,
    'api.call.success': 10,
    'role.detected': 1,
    // ...
  },
  avgDuration: 125.5,
}
```

---

## Performance Benchmarks

### Target Metrics (Stage 4)

| Metric | Before | After | Target |
|--------|--------|-------|--------|
| API Calls/Session | 20+ | 2-5 | <5 |
| Dashboard Load (Studio) | 4s | 200ms | <500ms |
| Dashboard Load (Client) | 500ms | 200ms | <300ms |
| Cache Hit Rate | 0% | 95% | >90% |
| Bandwidth/Session | 50MB | 100KB | <500KB |

---

### Actual Results

Track actual performance in production:

```javascript
// Dashboard performance
const perfData = window.performance.timing;
const loadTime = perfData.loadEventEnd - perfData.navigationStart;

// Cache effectiveness
const stats = window.__cache.stats();
const effectiveness = {
  hitRate: stats.hitRate,
  apiCallsAvoided: stats.hits,
  bandwidthSaved: stats.hits * 50 * 1024,  // ~50KB per avoided call
};
```

---

## Monitoring Dashboard

### Development

Press `Ctrl+Shift+M` to open the metrics dashboard (dev mode only).

Shows:
- Real-time cache hit rate
- Memory usage
- API call count
- Response sizes
- Event timeline

### Production

Use browser console for metrics:

```javascript
// Quick health check
console.table({
  'Cache Hit Rate': window.__cache.stats().hitRate + '%',
  'Memory Usage': window.__cache.stats().sizeMB.toFixed(2) + 'MB',
  'API Calls': window.__cacheEvents.stats().eventsByType['api.call.success'],
});
```

---

## Exporting Metrics

### Export to CSV

```javascript
// Export cache events
const events = window.__cacheEvents.history();
const csv = events.map(e => 
  `${e.timestamp},${e.type},${e.duration || 0},${JSON.stringify(e.metadata)}`
).join('\n');

// Download
const blob = new Blob([csv], { type: 'text/csv' });
const url = URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = 'cache-events.csv';
a.click();
```

---

## Alerting Thresholds

### Warning Conditions

- Cache hit rate < 80%
- Memory usage > 90%
- IndexedDB quota > 90%
- Average API response > 1s

### Critical Conditions

- Cache hit rate < 50%
- Memory usage > 95%
- IndexedDB quota > 95%
- API errors > 5%

---

## See Also

- [Observability Documentation](/docs/observability/)
- [Stage 2: Memory Cache](/docs/stage-2-memory-cache/)
- [Stage 3: Persistence](/docs/stage-3-persistence/)
- [Metrics Dashboard Component](/src/components/MetricsDashboard/)
