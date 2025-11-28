/**
 * Upload History Store
 * 
 * Stores upload session history in localStorage for persistence.
 * Used to show upload notifications in NotificationsPage.
 */

import { v4 as uuidv4 } from 'uuid';

export interface UploadHistoryEntry {
  id: string;
  timestamp: number;
  projectId: string;
  projectName: string;
  totalFiles: number;
  completedFiles: number;
  failedFiles: number;
  status: 'success' | 'partial' | 'failed';
  isRead: boolean;
}

class UploadHistoryStore {
  private readonly STORAGE_KEY = 'upload_history';
  private readonly MAX_ENTRIES = 50;

  /**
   * Add a new upload history entry
   */
  addEntry(entry: Omit<UploadHistoryEntry, 'id' | 'timestamp' | 'isRead'>): void {
    const history = this.getHistory();
    const newEntry: UploadHistoryEntry = {
      ...entry,
      id: uuidv4(),
      timestamp: Date.now(),
      isRead: false,
    };

    history.unshift(newEntry);

    // Keep only last MAX_ENTRIES entries
    const trimmed = history.slice(0, this.MAX_ENTRIES);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(trimmed));

    // Dispatch custom event for components to listen
    window.dispatchEvent(new CustomEvent('uploadHistoryUpdate', { detail: trimmed }));
    
    console.log('[UploadHistoryStore] Added entry:', newEntry);
  }

  /**
   * Get all upload history entries
   */
  getHistory(): UploadHistoryEntry[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('[UploadHistoryStore] Failed to read history:', error);
      return [];
    }
  }

  /**
   * Get unread count
   */
  getUnreadCount(): number {
    return this.getHistory().filter(entry => !entry.isRead).length;
  }

  /**
   * Mark an entry as read
   */
  markAsRead(id: string): void {
    const history = this.getHistory();
    const updated = history.map(entry =>
      entry.id === id ? { ...entry, isRead: true } : entry
    );
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('uploadHistoryUpdate', { detail: updated }));
  }

  /**
   * Mark all entries as read
   */
  markAllAsRead(): void {
    const history = this.getHistory();
    const updated = history.map(entry => ({ ...entry, isRead: true }));
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('uploadHistoryUpdate', { detail: updated }));
  }

  /**
   * Delete an entry
   */
  deleteEntry(id: string): void {
    const history = this.getHistory();
    const updated = history.filter(entry => entry.id !== id);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('uploadHistoryUpdate', { detail: updated }));
  }

  /**
   * Clear all history
   */
  clearHistory(): void {
    localStorage.removeItem(this.STORAGE_KEY);
    window.dispatchEvent(new CustomEvent('uploadHistoryUpdate', { detail: [] }));
  }
}

// Singleton instance
export const uploadHistoryStore = new UploadHistoryStore();
