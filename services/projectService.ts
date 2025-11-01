/**
 * Projects Service
 * Handles project/album CRUD operations
 */

import { apiClient } from '../lib/api-client';

export interface Project {
  id: string;
  title: string;
  studio_id: string;
  client_id: string;
  shoot_date?: string;
  layout?: string;
  cover_photo_id?: string | null;
  cover_photo_src?: string | null;
  photo_count: number;
  is_locked: boolean;
  payment_status?: string | null;
  price?: number | null;
  package_id?: string | null;
  status: string;
  has_folders: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateProjectRequest {
  title: string;
  client_id: string;
  shoot_date?: string;
  layout?: string;
  package_id?: string;
  is_locked?: boolean;
}

export interface UpdateProjectRequest {
  title?: string;
  shoot_date?: string;
  layout?: string;
  package_id?: string;
  status?: string;
  is_locked?: boolean;
}

export interface ProjectListResponse {
  projects: Project[];
  total: number;
}

class ProjectService {
  /**
   * Get all projects for current studio
   */
  async getProjects(studioId?: string, status?: string): Promise<ProjectListResponse> {
    const params: Record<string, string> = {};
    if (studioId) params.studio_id = studioId;
    if (status) params.status = status;
    
    return apiClient.get<ProjectListResponse>('/api/projects', params);
  }

  /**
   * Get single project by ID
   */
  async getProject(projectId: string): Promise<Project> {
    return apiClient.get<Project>(`/api/projects/${projectId}`);
  }

  /**
   * Create new project
   */
  async createProject(data: CreateProjectRequest): Promise<Project> {
    return apiClient.post<Project>('/api/projects', data);
  }

  /**
   * Update project
   */
  async updateProject(projectId: string, data: UpdateProjectRequest): Promise<Project> {
    return apiClient.patch<Project>(`/api/projects/${projectId}`, data);
  }

  /**
   * Delete project
   */
  async deleteProject(projectId: string): Promise<void> {
    return apiClient.delete<void>(`/api/projects/${projectId}`);
  }

  /**
   * Generate shareable access URL for client
   */
  async generateAccessUrl(projectId: string): Promise<{ access_url: string }> {
    return apiClient.post<{ access_url: string }>(`/api/projects/${projectId}/access-url`);
  }

  /**
   * Get project statistics
   */
  async getProjectStats(projectId: string): Promise<any> {
    return apiClient.get<any>(`/api/projects/${projectId}/stats`);
  }
}

export const projectService = new ProjectService();
