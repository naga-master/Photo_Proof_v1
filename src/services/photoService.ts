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

export interface DuplicateInfo {
  error: string;
  type: 'photo_content' | 'photo_filename' | 'folder_name' | 'client_phone';
  message: string;
  existing_photo?: {
    id: number;
    filename: string;
    uploaded_at: string;
    folder_id?: string;
    thumbnail_url: string;
  };
  existing_folder?: {
    id: string;
    name: string;
    photo_count: number;
  };
  existing_client?: {
    id: number;
    name: string;
    email: string;
  };
  actions?: string[];
  suggestion?: string;
}

class PhotoService {
  /**
   * Get all photos for a project
   */
  async getProjectPhotos(projectId: string, categoryId?: string): Promise<PhotoListResponse> {
    const params: Record<string, string> = {};
    if (categoryId) params.folder_id = categoryId; // Backend uses folder_id, not category_id
    
    return apiClient.get<PhotoListResponse>(`/v2/photos/projects/${projectId}/photos`, params);
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
  async uploadPhoto(data: UploadPhotoRequest): Promise<Photo | DuplicateInfo> {
    try {
      const formData: Record<string, any> = {
        project_id: data.project_id,
      };
      
      if (data.category_id) {
        formData.category_id = data.category_id;
      }
      
      return await apiClient.uploadFile('/v2/photos/upload', data.file, formData);
    } catch (error: any) {
      // Check if it's a duplicate detection error (409 Conflict)
      if (error.response?.status === 409 && error.response?.data?.error === 'duplicate_detected') {
        return error.response.data as DuplicateInfo;
      }
      // Re-throw other errors
      throw error;
    }
  }

  /**
   * Replace existing photo with new one
   */
  async replacePhoto(photoId: number, file: File, projectId: string): Promise<Photo> {
    // Delete existing photo
    await this.deletePhoto(photoId.toString());
    
    // Upload new photo
    const result = await this.uploadPhoto({
      project_id: projectId,
      file: file
    });
    
    // If it's still a duplicate (shouldn't happen), throw error
    if ('error' in result && result.error === 'duplicate_detected') {
      throw new Error('Failed to replace photo - duplicate still exists');
    }
    
    return result;
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
