/**
 * Notification Service
 * 
 * Handles browser notifications for upload events.
 * Features:
 * - Upload completion notifications
 * - Upload failure notifications
 * - Progress notifications (optional)
 * - Permission management
 */

export type NotificationType = 'success' | 'error' | 'progress' | 'warning';

export interface NotificationOptions {
  title: string;
  body: string;
  type?: NotificationType;
  icon?: string;
  badge?: string;
  tag?: string;
  requireInteraction?: boolean;
  silent?: boolean;
  data?: any;
}

class NotificationService {
  private permission: NotificationPermission = 'default';
  private enabled = false;

  constructor() {
    if ('Notification' in window) {
      this.permission = Notification.permission;
      this.enabled = this.permission === 'granted';
      console.log('[NotificationService] Initialized. Permission:', this.permission);
    } else {
      console.warn('[NotificationService] Browser does not support notifications');
    }
  }

  /**
   * Request notification permission from user
   */
  async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.warn('[NotificationService] Notifications not supported');
      return false;
    }

    if (this.permission === 'granted') {
      this.enabled = true;
      return true;
    }

    try {
      const permission = await Notification.requestPermission();
      this.permission = permission;
      this.enabled = permission === 'granted';
      
      console.log('[NotificationService] Permission requested:', permission);
      return this.enabled;
    } catch (error) {
      console.error('[NotificationService] Failed to request permission:', error);
      return false;
    }
  }

  /**
   * Check if notifications are enabled
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Get current permission status
   */
  getPermission(): NotificationPermission {
    return this.permission;
  }

  /**
   * Show a notification
   */
  async show(options: NotificationOptions): Promise<Notification | null> {
    if (!this.enabled) {
      console.log('[NotificationService] Notifications not enabled, skipping:', options.title);
      return null;
    }

    try {
      // If Service Worker is available, use it for persistent notifications
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        return await this.showViaServiceWorker(options);
      }

      // Fallback to direct notification
      return this.showDirect(options);
    } catch (error) {
      console.error('[NotificationService] Failed to show notification:', error);
      return null;
    }
  }

  /**
   * Show notification via Service Worker (persistent)
   */
  private async showViaServiceWorker(options: NotificationOptions): Promise<Notification | null> {
    try {
      const registration = await navigator.serviceWorker.ready;
      
      const notificationOptions: NotificationOptions = {
        body: options.body,
        icon: options.icon || '/icon-192.png',
        badge: options.badge || '/badge-72.png',
        tag: options.tag || 'photo-proof-upload',
        requireInteraction: options.requireInteraction ?? false,
        silent: options.silent ?? false,
        data: options.data,
      };

      await registration.showNotification(options.title, notificationOptions);
      console.log('[NotificationService] Notification shown via Service Worker:', options.title);
      
      return null; // Service Worker notifications don't return Notification objects
    } catch (error) {
      console.error('[NotificationService] Failed to show via Service Worker:', error);
      // Fallback to direct notification
      return this.showDirect(options);
    }
  }

  /**
   * Show notification directly (non-persistent)
   */
  private showDirect(options: NotificationOptions): Notification | null {
    try {
      const notification = new Notification(options.title, {
        body: options.body,
        icon: options.icon || '/icon-192.png',
        badge: options.badge || '/badge-72.png',
        tag: options.tag || 'photo-proof-upload',
        requireInteraction: options.requireInteraction ?? false,
        silent: options.silent ?? false,
        data: options.data,
      });

      console.log('[NotificationService] Notification shown directly:', options.title);
      return notification;
    } catch (error) {
      console.error('[NotificationService] Failed to show direct notification:', error);
      return null;
    }
  }

  /**
   * Show upload completion notification
   */
  async notifyUploadComplete(totalFiles: number, failedFiles: number = 0): Promise<void> {
    const hasFailures = failedFiles > 0;
    const successCount = totalFiles - failedFiles;

    const title = hasFailures
      ? `Upload Partially Complete`
      : `Upload Complete! 🎉`;

    const body = hasFailures
      ? `${successCount} of ${totalFiles} files uploaded successfully. ${failedFiles} failed.`
      : `All ${totalFiles} files uploaded successfully!`;

    await this.show({
      title,
      body,
      type: hasFailures ? 'warning' : 'success',
      tag: 'upload-complete',
      requireInteraction: false,
      data: {
        type: 'upload-complete',
        totalFiles,
        failedFiles,
      },
    });
  }

  /**
   * Show upload failure notification
   */
  async notifyUploadFailed(fileName: string, error: string): Promise<void> {
    await this.show({
      title: 'Upload Failed',
      body: `Failed to upload ${fileName}: ${error}`,
      type: 'error',
      tag: 'upload-error',
      requireInteraction: false,
      data: {
        type: 'upload-failed',
        fileName,
        error,
      },
    });
  }

  /**
   * Show network restored notification
   */
  async notifyNetworkRestored(resumingCount: number): Promise<void> {
    if (resumingCount === 0) return;

    await this.show({
      title: 'Network Restored',
      body: `Resuming upload of ${resumingCount} files...`,
      type: 'progress',
      tag: 'network-restored',
      silent: true,
      requireInteraction: false,
      data: {
        type: 'network-restored',
        resumingCount,
      },
    });
  }

  /**
   * Show network lost notification
   */
  async notifyNetworkLost(pausedCount: number): Promise<void> {
    if (pausedCount === 0) return;

    await this.show({
      title: 'Network Connection Lost',
      body: `${pausedCount} uploads paused. They will resume when connection is restored.`,
      type: 'warning',
      tag: 'network-lost',
      silent: true,
      requireInteraction: false,
      data: {
        type: 'network-lost',
        pausedCount,
      },
    });
  }

  /**
   * Show storage quota warning
   */
  async notifyStorageQuotaWarning(): Promise<void> {
    await this.show({
      title: 'Storage Space Low',
      body: 'Running low on browser storage. Upload state may not be saved.',
      type: 'warning',
      tag: 'storage-warning',
      requireInteraction: false,
      data: {
        type: 'storage-warning',
      },
    });
  }

  /**
   * Clear all notifications with a specific tag
   */
  async clearNotifications(tag: string): Promise<void> {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.ready;
        const notifications = await registration.getNotifications({ tag });
        
        for (const notification of notifications) {
          notification.close();
        }
        
        console.log(`[NotificationService] Cleared ${notifications.length} notifications with tag: ${tag}`);
      } catch (error) {
        console.error('[NotificationService] Failed to clear notifications:', error);
      }
    }
  }
}

// Singleton instance
export const notificationService = new NotificationService();
