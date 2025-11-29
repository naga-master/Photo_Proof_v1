/**
 * API Notification Service
 * 
 * Fetches notifications from the backend API.
 * Used for comment notifications, order updates, etc.
 */

import axios from 'axios';
import type { Notification, NotificationType } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

function getAuthHeaders() {
  const token = localStorage.getItem('auth_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

interface NotificationApiResponse {
  id: string;
  type: string;
  text: string;
  context: string;
  timestamp: string;
  is_read: boolean;
  avatar_url?: string;
  project_id?: number;
  photo_id?: number;
  comment_id?: number;
  actor_name?: string;
  actor_type?: string;
  created_at: string;
}

interface NotificationListResponse {
  notifications: NotificationApiResponse[];
  total: number;
  unread_count: number;
}

interface NotificationCountResponse {
  unread_count: number;
}

function mapNotification(n: NotificationApiResponse): Notification {
  return {
    id: n.id,
    type: n.type as NotificationType,
    text: n.text,
    context: n.context,
    timestamp: n.timestamp,
    isRead: n.is_read,
    avatarUrl: n.avatar_url,
    // Extended fields for navigation
    projectId: n.project_id,
    photoId: n.photo_id,
    commentId: n.comment_id,
    actorName: n.actor_name,
    actorType: n.actor_type as 'studio' | 'client' | undefined,
  };
}

class ApiNotificationService {
  /**
   * Get notifications from the API
   */
  static async getNotifications(
    type?: NotificationType,
    unreadOnly?: boolean
  ): Promise<{ notifications: Notification[]; unreadCount: number }> {
    try {
      const params = new URLSearchParams();
      if (type) params.append('type', type);
      if (unreadOnly) params.append('unread', 'true');
      
      const queryString = params.toString();
      const url = `${API_BASE_URL}/api/notifications${queryString ? `?${queryString}` : ''}`;
      
      const response = await axios.get<NotificationListResponse>(url, {
        headers: getAuthHeaders(),
      });
      
      return {
        notifications: response.data.notifications.map(mapNotification),
        unreadCount: response.data.unread_count,
      };
    } catch (error) {
      console.error('[ApiNotificationService] Failed to fetch notifications:', error);
      return { notifications: [], unreadCount: 0 };
    }
  }

  /**
   * Get unread notification count (lightweight)
   */
  static async getUnreadCount(): Promise<number> {
    try {
      const response = await axios.get<NotificationCountResponse>(
        `${API_BASE_URL}/api/notifications/count`,
        { headers: getAuthHeaders() }
      );
      return response.data.unread_count;
    } catch (error) {
      console.error('[ApiNotificationService] Failed to fetch unread count:', error);
      return 0;
    }
  }

  /**
   * Mark a single notification as read
   */
  static async markAsRead(notificationId: string): Promise<boolean> {
    try {
      await axios.post(
        `${API_BASE_URL}/api/notifications/${notificationId}/read`,
        {},
        { headers: getAuthHeaders() }
      );
      return true;
    } catch (error) {
      console.error('[ApiNotificationService] Failed to mark notification as read:', error);
      return false;
    }
  }

  /**
   * Mark all notifications as read
   */
  static async markAllRead(): Promise<boolean> {
    try {
      await axios.post(
        `${API_BASE_URL}/api/notifications/read-all`,
        {},
        { headers: getAuthHeaders() }
      );
      return true;
    } catch (error) {
      console.error('[ApiNotificationService] Failed to mark all as read:', error);
      return false;
    }
  }
}

export default ApiNotificationService;
