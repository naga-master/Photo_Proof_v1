/**
 * Cache Event Emitter
 * 
 * Observable event system for all cache operations.
 * Every cache operation emits events before and after execution.
 * 
 * Usage:
 *   cacheEvents.emit({ type: CacheEventType.CACHE_HIT, ... })
 *   cacheEvents.subscribe(CacheEventType.CACHE_HIT, handler)
 */

import { v4 as uuidv4 } from 'uuid';

export enum CacheEventType {
  // Cache operations
  CACHE_HIT = 'cache.hit',
  CACHE_MISS = 'cache.miss',
  CACHE_SET = 'cache.set',
  CACHE_EVICT = 'cache.evict',
  CACHE_CLEAR = 'cache.clear',
  
  // Storage operations
  STORAGE_QUOTA_CHECK = 'storage.quota',
  STORAGE_CLEANUP = 'storage.cleanup',
  
  // API operations
  API_CALL_START = 'api.call.start',
  API_CALL_SUCCESS = 'api.call.success',
  API_CALL_ERROR = 'api.call.error',
  
  // Prefetch operations
  PREFETCH_START = 'prefetch.start',
  PREFETCH_COMPLETE = 'prefetch.complete',
  PREFETCH_CANCEL = 'prefetch.cancel',
  
  // Role detection
  ROLE_DETECTED = 'role.detected',
  PROFILE_LOADED = 'profile.loaded',
  
  // Performance
  PERFORMANCE_MEASURE = 'performance.measure',
}

export type CacheSource = 'memory' | 'indexeddb' | 'service-worker' | 'api';

export interface CacheEventContext {
  userId?: string;
  sessionId?: string;
  role?: 'client' | 'studio';
}

export interface CacheEvent {
  type: CacheEventType;
  timestamp: number;
  operationId: string;
  metadata: Record<string, any>;
  context?: CacheEventContext;
  duration?: number; // milliseconds
}

type EventHandler = (event: CacheEvent) => void;

class CacheEventEmitter {
  private handlers: Map<CacheEventType | 'all', Set<EventHandler>>;
  private history: CacheEvent[];
  private maxHistorySize: number = 1000;
  private sessionId: string;

  constructor() {
    this.handlers = new Map();
    this.history = [];
    this.sessionId = uuidv4();
  }

  /**
   * Emit an event
   */
  emit(event: Omit<CacheEvent, 'operationId' | 'timestamp'>): void {
    const fullEvent: CacheEvent = {
      ...event,
      operationId: uuidv4(),
      timestamp: Date.now(),
      context: {
        ...event.context,
        sessionId: this.sessionId,
      },
    };

    // Add to history
    this.addToHistory(fullEvent);

    // Notify specific handlers
    const specificHandlers = this.handlers.get(fullEvent.type);
    if (specificHandlers) {
      specificHandlers.forEach(handler => {
        try {
          handler(fullEvent);
        } catch (error) {
          console.error(`[CacheEventEmitter] Error in handler for ${fullEvent.type}:`, error);
        }
      });
    }

    // Notify 'all' handlers
    const allHandlers = this.handlers.get('all');
    if (allHandlers) {
      allHandlers.forEach(handler => {
        try {
          handler(fullEvent);
        } catch (error) {
          console.error('[CacheEventEmitter] Error in all-events handler:', error);
        }
      });
    }
  }

  /**
   * Subscribe to specific event type
   */
  subscribe(eventType: CacheEventType | 'all', handler: EventHandler): () => void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, new Set());
    }

    this.handlers.get(eventType)!.add(handler);

    // Return unsubscribe function
    return () => {
      const handlers = this.handlers.get(eventType);
      if (handlers) {
        handlers.delete(handler);
      }
    };
  }

  /**
   * Get event history with optional filters
   */
  getHistory(filters?: {
    type?: CacheEventType;
    since?: number; // timestamp
    limit?: number;
  }): CacheEvent[] {
    let filtered = this.history;

    if (filters?.type) {
      filtered = filtered.filter(e => e.type === filters.type);
    }

    if (filters?.since) {
      filtered = filtered.filter(e => e.timestamp >= filters.since);
    }

    if (filters?.limit) {
      filtered = filtered.slice(-filters.limit);
    }

    return filtered;
  }

  /**
   * Get event statistics
   */
  getStats(since?: number): {
    totalEvents: number;
    eventsByType: Record<string, number>;
    avgDuration: number;
  } {
    const events = since 
      ? this.history.filter(e => e.timestamp >= since)
      : this.history;

    const eventsByType: Record<string, number> = {};
    let totalDuration = 0;
    let eventsWithDuration = 0;

    events.forEach(event => {
      eventsByType[event.type] = (eventsByType[event.type] || 0) + 1;
      
      if (event.duration !== undefined) {
        totalDuration += event.duration;
        eventsWithDuration++;
      }
    });

    return {
      totalEvents: events.length,
      eventsByType,
      avgDuration: eventsWithDuration > 0 ? totalDuration / eventsWithDuration : 0,
    };
  }

  /**
   * Clear event history
   */
  clearHistory(): void {
    this.history = [];
  }

  /**
   * Export events as JSON
   */
  exportHistory(): string {
    return JSON.stringify(this.history, null, 2);
  }

  private addToHistory(event: CacheEvent): void {
    this.history.push(event);

    // Limit history size
    if (this.history.length > this.maxHistorySize) {
      this.history = this.history.slice(-this.maxHistorySize);
    }
  }
}

// Singleton instance
export const cacheEvents = new CacheEventEmitter();

// Expose to window for debugging
if (typeof window !== 'undefined') {
  (window as any).__cacheEvents = {
    history: () => cacheEvents.getHistory(),
    stats: () => cacheEvents.getStats(),
    export: () => cacheEvents.exportHistory(),
    clear: () => cacheEvents.clearHistory(),
  };
}

export default cacheEvents;
