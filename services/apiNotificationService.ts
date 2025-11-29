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
  text?: string;
  context?: string;
  timestamp: string;
  is_read: boolean;
  avatar_url?: string;
  // New unified fields
  category?: string;
  event_type?: string;
  title?: string;
  message?: string;
  priority?: string;
  extra_data?: Record<string, any>;
  // Related entities
  project_id?: number;
  photo_id?: number;
  comment_id?: number;
  entity_type?: string;
  entity_id?: string;
  // Actor info
  actor_name?: string;
  actor_type?: string;
  created_at: string;
  expires_at?: string;
}

interface UploadNotificationRequest {
  project_id: number;
  project_name: string;
  status: 'success' | 'partial' | 'failed';
  total_files: number;
  completed_files: number;
  failed_files: number;
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
    text: n.text || n.title || '',
    context: n.context || n.message || '',
    timestamp: n.timestamp,
    isRead: n.is_read,
    avatarUrl: n.avatar_url,
    // New unified fields
    category: n.category,
    eventType: n.event_type,
    title: n.title,
    message: n.message,
    priority: n.priority,
    extraData: n.extra_data,
    // Extended fields for navigation
    projectId: n.project_id,
    photoId: n.photo_id,
    commentId: n.comment_id,
    entityType: n.entity_type,
    entityId: n.entity_id,
    actorName: n.actor_name,
    actorType: n.actor_type as 'studio' | 'client' | 'system' | undefined,
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

  /**
   * Create an upload notification (called once per upload batch)
   */
  static async createUploadNotification(params: {
    projectId: number;
    projectName: string;
    status: 'success' | 'partial' | 'failed';
    totalFiles: number;
    completedFiles: number;
    failedFiles: number;
  }): Promise<boolean> {
    try {
      const request: UploadNotificationRequest = {
        project_id: params.projectId,
        project_name: params.projectName,
        status: params.status,
        total_files: params.totalFiles,
        completed_files: params.completedFiles,
        failed_files: params.failedFiles,
      };
      
      await axios.post(
        `${API_BASE_URL}/api/notifications/upload`,
        request,
        { headers: getAuthHeaders() }
      );
      
      console.log('[ApiNotificationService] Upload notification created:', params.status);
      return true;
    } catch (error) {
      console.error('[ApiNotificationService] Failed to create upload notification:', error);
      return false;
    }
  }
}

export default ApiNotificationService;
