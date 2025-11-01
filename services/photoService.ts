/**
 * Photos Service
 * Handles photo uploads, management, and actions
 */

import { apiClient } from '../lib/api-client';

export interface Photo {
  id: string;
  project_id: string;
  original_file_name: string;
  file_size: number;
  file_path: string;
  thumbnail_path?: string;
  medium_path?: string;
  width?: number;
  height?: number;
  is_favorite: boolean;
  is_selected: boolean;
  order_index: number;
  metadata?: any;
  created_at: string;
  updated_at: string;
}

export interface UploadPhotoRequest {
  project_id: string;
  file: File;
  category_id?: string;
}

export interface UpdatePhotoRequest {
  is_favorite?: boolean;
  is_selected?: boolean;
  order_index?: number;
  metadata?: any;
}

export interface PhotoListResponse {
  photos: Photo[];
  total: number;
}

class PhotoService {
  /**
   * Get all photos for a project
   */
  async getProjectPhotos(projectId: string, categoryId?: string): Promise<PhotoListResponse> {
    const params: Record<string, string> = {};
    if (categoryId) params.category_id = categoryId;
    
    return apiClient.get<PhotoListResponse>(`/v2/photos/project/${projectId}`, params);
  }

  /**
   * Get single photo by ID
   */
  async getPhoto(photoId: string): Promise<Photo> {
    return apiClient.get<Photo>(`/v2/photos/${photoId}`);
  }

  /**
   * Upload new photo
   */
  async uploadPhoto(data: UploadPhotoRequest): Promise<Photo> {
    const formData: Record<string, any> = {
      project_id: data.project_id,
    };
    
    if (data.category_id) {
      formData.category_id = data.category_id;
    }
    
    return apiClient.uploadFile('/v2/photos/upload', data.file, formData);
  }

  /**
   * Update photo metadata
   */
  async updatePhoto(photoId: string, data: UpdatePhotoRequest): Promise<Photo> {
    return apiClient.patch<Photo>(`/v2/photos/${photoId}`, data);
  }

  /**
   * Delete photo
   */
  async deletePhoto(photoId: string): Promise<void> {
    return apiClient.delete<void>(`/v2/photos/${photoId}`);
  }

  /**
   * Toggle favorite status
   */
  async toggleFavorite(photoId: string): Promise<Photo> {
    return apiClient.post<Photo>(`/v2/photos/${photoId}/favorite`);
  }

  /**
   * Toggle selection status
   */
  async toggleSelection(photoId: string): Promise<Photo> {
    return apiClient.post<Photo>(`/v2/photos/${photoId}/select`);
  }

  /**
   * Bulk update photos (favorite/select multiple)
   */
  async bulkUpdatePhotos(photoIds: string[], updates: UpdatePhotoRequest): Promise<void> {
    return apiClient.post<void>('/v2/photos/bulk-update', {
      photo_ids: photoIds,
      updates,
    });
  }

  /**
   * Reorder photos
   */
  async reorderPhotos(photoIds: string[]): Promise<void> {
    return apiClient.post<void>('/v2/photos/reorder', {
      photo_ids: photoIds,
    });
  }
}

export const photoService = new PhotoService();
