/**
 * Development Mode Logger
 * 
 * Pretty console logging for cache events during development.
 * Color-coded output for easy debugging.
 */

import { cacheEvents, CacheEvent, CacheEventType } from './CacheEventEmitter';
import { configLoader } from '../ConfigLoader';

const EVENT_COLORS: Record<string, string> = {
  [CacheEventType.CACHE_HIT]: '#4CAF50',        // Green
  [CacheEventType.CACHE_MISS]: '#FF9800',       // Orange
  [CacheEventType.CACHE_SET]: '#2196F3',        // Blue
  [CacheEventType.CACHE_EVICT]: '#F44336',      // Red
  [CacheEventType.CACHE_CLEAR]: '#9C27B0',      // Purple
  [CacheEventType.STORAGE_QUOTA_CHECK]: '#00BCD4', // Cyan
  [CacheEventType.STORAGE_CLEANUP]: '#FF5722',  // Deep Orange
  [CacheEventType.API_CALL_START]: '#607D8B',   // Blue Grey
  [CacheEventType.API_CALL_SUCCESS]: '#8BC34A', // Light Green
  [CacheEventType.API_CALL_ERROR]: '#E91E63',   // Pink
  [CacheEventType.PREFETCH_START]: '#3F51B5',   // Indigo
  [CacheEventType.PREFETCH_COMPLETE]: '#009688',// Teal
  [CacheEventType.PREFETCH_CANCEL]: '#795548',  // Brown
  [CacheEventType.ROLE_DETECTED]: '#CDDC39',    // Lime
  [CacheEventType.PROFILE_LOADED]: '#FFC107',   // Amber
  [CacheEventType.PERFORMANCE_MEASURE]: '#9E9E9E', // Grey
};

const EVENT_ICONS: Record<string, string> = {
  [CacheEventType.CACHE_HIT]: '✓',
  [CacheEventType.CACHE_MISS]: '✗',
  [CacheEventType.CACHE_SET]: '📝',
  [CacheEventType.CACHE_EVICT]: '🗑️',
  [CacheEventType.CACHE_CLEAR]: '🧹',
  [CacheEventType.STORAGE_QUOTA_CHECK]: '📊',
  [CacheEventType.STORAGE_CLEANUP]: '🧽',
  [CacheEventType.API_CALL_START]: '🌐',
  [CacheEventType.API_CALL_SUCCESS]: '✅',
  [CacheEventType.API_CALL_ERROR]: '❌',
  [CacheEventType.PREFETCH_START]: '⚡',
  [CacheEventType.PREFETCH_COMPLETE]: '⚡✓',
  [CacheEventType.PREFETCH_CANCEL]: '⚡✗',
  [CacheEventType.ROLE_DETECTED]: '👤',
  [CacheEventType.PROFILE_LOADED]: '⚙️',
  [CacheEventType.PERFORMANCE_MEASURE]: '⏱️',
};

class DevModeLogger {
  private enabled: boolean;
  private logLevel: 'debug' | 'info' | 'warn' | 'error';
  private unsubscribe?: () => void;

  constructor() {
    const config = configLoader.getConfig();
    this.enabled = config.monitoring.enableLogging && configLoader.getEnvironment() === 'development';
    this.logLevel = config.monitoring.logLevel;

    if (this.enabled) {
      this.start();
    }

    // Listen for config changes
    configLoader.subscribe((newConfig) => {
      const shouldEnable = newConfig.monitoring.enableLogging && configLoader.getEnvironment() === 'development';
      
      if (shouldEnable && !this.enabled) {
        this.enabled = true;
        this.start();
      } else if (!shouldEnable && this.enabled) {
        this.enabled = false;
        this.stop();
      }
      
      this.logLevel = newConfig.monitoring.logLevel;
    });
  }

  private start(): void {
    this.unsubscribe = cacheEvents.subscribe('all', (event) => {
      this.logEvent(event);
    });
    
    console.log(
      '%c[DevModeLogger] Started',
      'color: #4CAF50; font-weight: bold;'
    );
  }

  private stop(): void {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = undefined;
    }
    
    console.log(
      '%c[DevModeLogger] Stopped',
      'color: #F44336; font-weight: bold;'
    );
  }

  private logEvent(event: CacheEvent): void {
    if (!this.shouldLog(event)) {
      return;
    }

    const color = EVENT_COLORS[event.type] || '#000000';
    const icon = EVENT_ICONS[event.type] || '•';
    const timestamp = new Date(event.timestamp).toLocaleTimeString();
    
    const style = `color: ${color}; font-weight: bold;`;
    const resetStyle = 'color: inherit; font-weight: normal;';

    // Format log message
    let message = `%c${icon} ${event.type}%c @ ${timestamp}`;
    const args: any[] = [style, resetStyle];

    // Add metadata
    if (Object.keys(event.metadata).length > 0) {
      message += '\n  Metadata:';
      args.push(event.metadata);
    }

    // Add duration if available
    if (event.duration !== undefined) {
      message += `\n  Duration: ${event.duration.toFixed(2)}ms`;
    }

    // Add context
    if (event.context) {
      message += '\n  Context:';
      args.push(event.context);
    }

    // Log based on event type
    if (this.isErrorEvent(event.type)) {
      console.error(message, ...args);
    } else if (this.isWarningEvent(event.type)) {
      console.warn(message, ...args);
    } else {
      console.log(message, ...args);
    }
  }

  private shouldLog(event: CacheEvent): boolean {
    const levelPriority = { debug: 0, info: 1, warn: 2, error: 3 };
    const eventLevel = this.getEventLevel(event.type);
    
    return levelPriority[eventLevel] >= levelPriority[this.logLevel];
  }

  private getEventLevel(type: CacheEventType): 'debug' | 'info' | 'warn' | 'error' {
    if (this.isErrorEvent(type)) return 'error';
    if (this.isWarningEvent(type)) return 'warn';
    if (this.isDebugEvent(type)) return 'debug';
    return 'info';
  }

  private isErrorEvent(type: CacheEventType): boolean {
    return type === CacheEventType.API_CALL_ERROR;
  }

  private isWarningEvent(type: CacheEventType): boolean {
    return type === CacheEventType.CACHE_EVICT || 
           type === CacheEventType.STORAGE_CLEANUP ||
           type === CacheEventType.PREFETCH_CANCEL;
  }

  private isDebugEvent(type: CacheEventType): boolean {
    return type === CacheEventType.CACHE_HIT ||
           type === CacheEventType.CACHE_SET ||
           type === CacheEventType.STORAGE_QUOTA_CHECK ||
           type === CacheEventType.PERFORMANCE_MEASURE;
  }
}

// Auto-start in development
let devLogger: DevModeLogger | null = null;

if (typeof window !== 'undefined') {
  devLogger = new DevModeLogger();
  
  // Expose to window for debugging
  (window as any).__devLogger = devLogger;
}

export default DevModeLogger;
