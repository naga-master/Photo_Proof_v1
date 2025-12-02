/**
 * Studio Service
 * Handles studio-related API calls
 */

import { apiClient } from '../lib/api-client';

export interface DashboardMetrics {
  total_projects: number;
  total_photos: number;
  total_comments: number;
  active_clients: number;
  // Delta fields (change from last month)
  projects_delta: number;
  photos_delta: number;
  comments_delta: number;
  clients_delta: number;
}

class StudioService {
  /**
   * Get dashboard metrics with accurate counts
   * Calculates metrics dynamically to avoid stale cached counts
   */
  async getDashboardMetrics(): Promise<DashboardMetrics> {
    return apiClient.get<DashboardMetrics>('/api/studio/dashboard-metrics');
  }
}

export const studioService = new StudioService();
