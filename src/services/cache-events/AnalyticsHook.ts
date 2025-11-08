/**
 * Analytics Hook
 * 
 * Sends cache events to analytics service (e.g., Sentry, DataDog, custom).
 * Production-ready event tracking.
 */

import { cacheEvents, CacheEvent, CacheEventType } from './CacheEventEmitter';
import { configLoader } from '../ConfigLoader';

interface AnalyticsService {
  trackEvent(event: string, properties: Record<string, any>): void;
  trackError(error: Error, context?: Record<string, any>): void;
}

class AnalyticsHook {
  private enabled: boolean;
  private service?: AnalyticsService;
  private unsubscribe?: () => void;
  private eventBuffer: CacheEvent[] = [];
  private flushInterval: number = 30000; // 30 seconds
  private maxBufferSize: number = 100;

  constructor(service?: AnalyticsService) {
    this.service = service;
    
    const config = configLoader.getConfig();
    this.enabled = config.monitoring.enableMetrics && configLoader.getEnvironment() === 'production';

    if (this.enabled && this.service) {
      this.start();
    }
  }

  /**
   * Set analytics service (e.g., Sentry, DataDog)
   */
  setService(service: AnalyticsService): void {
    this.service = service;
    
    if (this.enabled && !this.unsubscribe) {
      this.start();
    }
  }

  private start(): void {
    if (!this.service) {
      console.warn('[AnalyticsHook] No analytics service configured');
      return;
    }

    // Subscribe to cache events
    this.unsubscribe = cacheEvents.subscribe('all', (event) => {
      this.handleEvent(event);
    });

    // Start flush interval
    setInterval(() => {
      this.flush();
    }, this.flushInterval);

    console.log('[AnalyticsHook] Started');
  }

  private handleEvent(event: CacheEvent): void {
    // Only track specific events in production
    if (!this.shouldTrack(event.type)) {
      return;
    }

    // Add to buffer
    this.eventBuffer.push(event);

    // Flush if buffer is full
    if (this.eventBuffer.length >= this.maxBufferSize) {
      this.flush();
    }

    // Track errors immediately
    if (event.type === CacheEventType.API_CALL_ERROR) {
      this.trackError(event);
    }
  }

  private shouldTrack(type: CacheEventType): boolean {
    // Track important events only
    return [
      CacheEventType.API_CALL_ERROR,
      CacheEventType.CACHE_EVICT,
      CacheEventType.STORAGE_CLEANUP,
      CacheEventType.ROLE_DETECTED,
      CacheEventType.PROFILE_LOADED,
    ].includes(type);
  }

  private flush(): void {
    if (this.eventBuffer.length === 0 || !this.service) {
      return;
    }

    try {
      // Aggregate events by type
      const aggregated = this.aggregateEvents(this.eventBuffer);
      
      // Send to analytics service
      this.service.trackEvent('cache_events_batch', {
        count: this.eventBuffer.length,
        aggregated,
        timestamp: Date.now(),
      });

      // Clear buffer
      this.eventBuffer = [];
    } catch (error) {
      console.error('[AnalyticsHook] Error flushing events:', error);
    }
  }

  private aggregateEvents(events: CacheEvent[]): Record<string, number> {
    const counts: Record<string, number> = {};
    
    events.forEach(event => {
      counts[event.type] = (counts[event.type] || 0) + 1;
    });
    
    return counts;
  }

  private trackError(event: CacheEvent): void {
    if (!this.service) return;

    try {
      const error = new Error(`Cache Error: ${event.type}`);
      this.service.trackError(error, {
        eventType: event.type,
        metadata: event.metadata,
        context: event.context,
      });
    } catch (error) {
      console.error('[AnalyticsHook] Error tracking error:', error);
    }
  }

  /**
   * Manually flush events
   */
  forceFlush(): void {
    this.flush();
  }
}

// Singleton instance
export const analyticsHook = new AnalyticsHook();

// Example: Configure with Sentry (commented out)
/*
if (typeof window !== 'undefined' && window.Sentry) {
  analyticsHook.setService({
    trackEvent: (event, properties) => {
      window.Sentry.captureMessage(event, {
        level: 'info',
        extra: properties,
      });
    },
    trackError: (error, context) => {
      window.Sentry.captureException(error, {
        extra: context,
      });
    },
  });
}
*/

export default analyticsHook;
