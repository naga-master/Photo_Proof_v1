/**
 * Projects Service
 * Handles project/album CRUD operations
 */

import { apiClient } from '../lib/api-client';
import { getPhotoVariantUrl } from './photoService';
import type { QualityLevel } from '../config/image-optimization.config';

export interface Project {
  id: string;
  title: string;
  name?: string;  // Backend uses "name" field (alias for title)
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

/**
 * Extract photo ID from storage path
 * Example: "/uploads/projects/12/originals/photo_808.jpg" -> "808"
 */
function extractPhotoIdFromPath(path: string): string | null {
  if (!path) return null;
  
  // Try to extract photo ID from filename (e.g., "photo_808.jpg" -> "808")
  const filenameMatch = path.match(/\/(\d+)\.[^/]+$/);
  if (filenameMatch) {
    return filenameMatch[1];
  }
  
  // Try alternative patterns (photo_808.jpg, 808.jpg, etc.)
  const altMatch = path.match(/_(\d+)\.[^/]+$/);
  if (altMatch) {
    return altMatch[1];
  }
  
  return null;
}

/**
 * Get cover photo variant URL for a project
 * Uses cover_photo_id to fetch optimized variant, falls back to cover_photo_src
 */
export function getCoverPhotoVariantUrl(project: Project, quality?: QualityLevel): string {
  const FALLBACK_IMAGE = '/placeholder-cover.jpg';
  
  // Prefer cover_photo_id (use variant API)
  if (project.cover_photo_id) {
    return getPhotoVariantUrl(project.cover_photo_id, quality || 'medium');
  }
  
  // Try to extract photo ID from cover_photo_src path
  if (project.cover_photo_src) {
    const photoId = extractPhotoIdFromPath(project.cover_photo_src);
    if (photoId) {
      return getPhotoVariantUrl(photoId, quality || 'medium');
    }
    
    // If we can't extract ID, use the original src with base URL
    if (project.cover_photo_src.startsWith('http')) {
      return project.cover_photo_src;
    }
    return `http://localhost:8000${project.cover_photo_src}`;
  }
  
  return FALLBACK_IMAGE;
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
  }> {
    return apiClient.post<any>(`/api/projects/${projectId}/folders?folder_name=${encodeURIComponent(folderName)}`);
  }
}

export const projectService = new ProjectService();
