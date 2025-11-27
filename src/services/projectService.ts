/**
 * Projects Service
 * Handles project/album CRUD operations
 */

console.log('🔄 [projectService] MODULE LOADING - TOP OF FILE - v2.1');

import { apiClient } from '../../lib/api-client';

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
  name: string;  // Project name (was title)
  description?: string;
  client_id?: string;  // Optional - if provided, use existing client
  client_name: string;  // Required for new clients
  client_email: string;  // Required for new clients
  client_phone?: string;
  project_type?: string;
  shoot_date?: string;
  layout?: string;  // Not part of backend schema but kept for frontend use
  package_id?: string;  // Not part of backend schema but kept for frontend use
  is_locked?: boolean;  // Not part of backend schema but kept for frontend use
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
   * @param studioId - Optional studio ID filter
   * @param status - Optional status filter
   * @param mode - Response mode: 'list' (metadata only, 1KB/project) or 'full' (complete data, 50KB/project)
   */
  async getProjects(studioId?: string, status?: string, mode?: 'list' | 'full'): Promise<ProjectListResponse> {
    const params: Record<string, string> = {};
    if (studioId) params.studio_id = studioId;
    if (status) params.status = status;
    if (mode) params.mode = mode;  // Stage 4: Pass mode parameter to backend
    
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
   * Set project cover photo
   */
  async setCoverPhoto(projectId: string, photoId: string | null): Promise<Project> {
    return apiClient.patch<Project>(`/api/projects/${projectId}`, {
      cover_photo_id: photoId
    });
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

  /**
   * Get folders for a project
   */
  async getProjectFolders(projectId: string): Promise<{ folders: any[]; total: number }> {
    return apiClient.get<{ folders: any[]; total: number }>(`/api/projects/${projectId}/folders`);
  }

  /**
   * Create a folder in a project
   * Returns Folder on success, or DuplicateInfo on 409 conflict
   */
  async createFolder(projectId: string, folderName: string): Promise<{
    id: string;
    name: string;
    project_id: string;
    photoCount: number;
    coverPhotoId?: string;
    coverPhotoSrc?: string;
    order_index: number;
    created_at?: string;
    updated_at?: string;
  } | {
    error: string;
    type: string;
    message: string;
    existing_folder?: any;
  }> {
    try {
      console.log('[projectService] 🔵 CREATING FOLDER:', projectId, folderName);
      const result = await apiClient.post<any>(`/api/projects/${projectId}/folders?folder_name=${encodeURIComponent(folderName)}`);
      console.log('[projectService] ✅ FOLDER CREATED:', result);
      return result;
    } catch (error: any) {
      console.error('[projectService] 🔴 CREATE FOLDER ERROR:', error);
      console.error('[projectService] Error status:', error.status);
      console.error('[projectService] Error detail:', error.detail);
      
      // If it's a 409 duplicate error, return the error details
      // The error structure from api-client has status and detail directly
      if (error.status === 409 && error.detail) {
        console.warn('[projectService] ⚠️ RETURNING DUPLICATE INFO:', error.detail);
        return error.detail;
      }
      
      // Fallback: check for response.status (axios style)
      if (error.response?.status === 409 && error.response?.data?.detail) {
        console.warn('[projectService] ⚠️ RETURNING DUPLICATE INFO (axios):', error.response.data.detail);
        return error.response.data.detail;
      }
      
      // Re-throw other errors
      console.error('[projectService] ❌ RE-THROWING ERROR');
      throw error;
    }
  }
}

console.log('🔄 [projectService] Module loaded - VERSION 2.0 with duplicate handling');

export const projectService = new ProjectService();
