/**
 * Notification Context
 * Provides centralized notification state and methods throughout the app
 * Prevents duplicate API calls from multiple components
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import ApiNotificationService from '../services/apiNotificationService';
import type { Notification, NotificationType } from '../types';

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  fetchByType: (type?: NotificationType) => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

const DEBOUNCE_MS = 5000; // Minimum 5 seconds between fetches
const AUTO_REFRESH_MS = 60000; // Auto-refresh every 60 seconds

function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}

function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const lastFetchRef = useRef<number>(0);
  const currentTypeRef = useRef<NotificationType | undefined>(undefined);

  const fetchNotifications = useCallback(async (type?: NotificationType, force: boolean = false) => {
    // Debounce: skip if fetched within last DEBOUNCE_MS (unless forced)
    const now = Date.now();
    if (!force && now - lastFetchRef.current < DEBOUNCE_MS) {
      console.log('[NotificationContext] Skipping fetch - debounced');
      return;
    }

    lastFetchRef.current = now;
    currentTypeRef.current = type;
    setIsLoading(true);
    setError(null);

    try {
      const { notifications: fetchedNotifications, unreadCount: fetchedUnreadCount } = 
        await ApiNotificationService.getNotifications(type);
      
      setNotifications(fetchedNotifications);
      setUnreadCount(fetchedUnreadCount);
      console.log(`[NotificationContext] Fetched ${fetchedNotifications.length} notifications, ${fetchedUnreadCount} unread`);
    } catch (err) {
      console.error('[NotificationContext] Failed to fetch notifications:', err);
      setError('Failed to fetch notifications');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    await fetchNotifications(currentTypeRef.current, true);
  }, [fetchNotifications]);

  const fetchByType = useCallback(async (type?: NotificationType) => {
    await fetchNotifications(type, true);
  }, [fetchNotifications]);

  const markAsRead = useCallback(async (id: string) => {
    // Optimistic update
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, isRead: true } : n)
    );
    setUnreadCount(prev => Math.max(0, prev - 1));

    try {
      await ApiNotificationService.markAsRead(id);
    } catch (err) {
      console.error('[NotificationContext] Failed to mark notification as read:', err);
      // Revert optimistic update on error
      await refresh();
    }
  }, [refresh]);

  const markAllAsRead = useCallback(async () => {
    // Optimistic update
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    setUnreadCount(0);

    try {
      await ApiNotificationService.markAllRead();
    } catch (err) {
      console.error('[NotificationContext] Failed to mark all as read:', err);
      // Revert optimistic update on error
      await refresh();
    }
  }, [refresh]);

  // Initial fetch and auto-refresh
  useEffect(() => {
    fetchNotifications();
    
    const interval = setInterval(() => {
      fetchNotifications(currentTypeRef.current);
    }, AUTO_REFRESH_MS);

    return () => clearInterval(interval);
  }, [fetchNotifications]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        isLoading,
        error,
        refresh,
        fetchByType,
        markAsRead,
        markAllAsRead,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export { NotificationProvider, useNotifications };
