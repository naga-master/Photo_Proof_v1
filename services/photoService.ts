/**
 * Photos Service
 * Handles photo uploads, management, and actions
 */

import { apiClient } from '../lib/api-client';
import { CommentService } from './commentService';
import { viewportQualityService } from './viewportQualityService';
import type { Comment } from '../types';
import type { QualityLevel } from '../config/image-optimization.config';

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

/**
 * Get variant URL for a photo based on quality level
 */
export function getPhotoVariantUrl(photoId: string | number, quality?: QualityLevel): string {
  const baseUrl = 'http://localhost:8000';
  
  // If no quality specified, use viewport-based quality
  const selectedQuality = quality || viewportQualityService.getOptimalQuality();
  
  return `${baseUrl}/v2/photos/${photoId}/variant/${selectedQuality}`;
}

/**
 * Get progressive loading URLs (thumbnail -> final quality)
 */
export function getProgressiveUrls(photoId: string | number, finalQuality?: QualityLevel): string[] {
  const quality = finalQuality || viewportQualityService.getOptimalQuality();
  const sequence = viewportQualityService.getProgressiveSequence(quality);
  
  return sequence.map(q => getPhotoVariantUrl(photoId, q));
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
   * @param quality - Quality level for variants (default: 'medium')
   */
  async getProjectPhotos(projectId: string, categoryId?: string, quality?: QualityLevel): Promise<PhotoListResponse> {
    const params: Record<string, string> = {};
    if (categoryId) params.folder_id = categoryId; // Backend uses folder_id, not category_id
    
    const response = await apiClient.get<any>(`/v2/photos/projects/${projectId}/photos`, params);
    
    // Transform all photo.src to use variants instead of originals
    const transformedPhotos = response.photos.map((photo: any) => ({
      ...photo,
      src: getPhotoVariantUrl(photo.id, quality || 'medium'),
      originalSrc: photo.src || photo.file_path, // Keep original for downloads
    }));
    
    return {
      ...response,
      photos: transformedPhotos
    };
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

  /**
   * Get photo with comments loaded
   * Helper method that combines photo data with comments
   */
  async getPhotoWithComments(photoId: string): Promise<Photo & { comments: Comment[] }> {
    const photo = await this.getPhoto(photoId);
    const comments = await CommentService.getPhotoComments(Number(photoId));
    return { ...photo, comments };
  }
}

export const photoService = new PhotoService();
