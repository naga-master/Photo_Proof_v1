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
    id: string;
    name: string;
    phone: string;
  };
}

/**
 * Get variant URL for a photo based on quality level
 */
export function getPhotoVariantUrl(photoId: string | number, quality?: QualityLevel): string {
  const baseUrl = 'http://localhost:8000';
  
  // If no quality specified, use viewport-based quality
  const selectedQuality = quality || viewportQualityService.getOptimalQuality();
  
  const url = `${baseUrl}/v2/photos/${photoId}/variant/${selectedQuality}`;
  
  // Debug logging (can be removed after testing)
  if (Math.random() < 0.1) { // Log 10% of requests to avoid spam
    console.log('[getPhotoVariantUrl]', { photoId, quality, selectedQuality, url });
  }
  
  return url;
}

/**
 * Get progressive loading URLs (thumbnail -> final quality)
 */
export function getProgressiveUrls(photoId: string | number, finalQuality?: QualityLevel): string[] {
  const quality = finalQuality || viewportQualityService.getOptimalQuality();
  const sequence = viewportQualityService.getProgressiveSequence(quality);
  
  return sequence.map(q => getPhotoVariantUrl(photoId, q));
}

/**
 * Fetch authenticated photo variant as blob URL with retry logic
 * This allows us to send auth headers which <img> tags cannot do
 */
export async function fetchPhotoVariantBlob(photoId: string | number, quality?: QualityLevel, retryCount = 0): Promise<string> {
  const variantUrl = getPhotoVariantUrl(photoId, quality);
  
  // Extract path from full URL for apiClient
  const path = variantUrl.replace('http://localhost:8000', '');
  
  try {
    // Fetch with authentication
    const response = await apiClient.getRaw(path);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch photo ${photoId}: ${response.status} ${response.statusText}`);
    }
    
    // Convert to blob and create object URL
    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);
    
    console.log('[photoService] Created blob URL:', { photoId, quality, blobUrl: blobUrl.substring(0, 50) + '...' });
    
    return blobUrl;
  } catch (error) {
    // Retry up to 3 times with exponential backoff
    if (retryCount < 3) {
      const delay = Math.pow(2, retryCount) * 100; // 100ms, 200ms, 400ms
      console.log(`[photoService] Retrying photo ${photoId} after ${delay}ms (attempt ${retryCount + 1}/3)`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return fetchPhotoVariantBlob(photoId, quality, retryCount + 1);
    }
    throw error;
  }
}

/**
 * Cache for blob URLs to avoid refetching
 */
const blobUrlCache = new Map<string, string>();

/**
 * Request queue to limit concurrent photo fetches
 */
let activeRequests = 0;
const MAX_CONCURRENT_REQUESTS = 3;
const requestQueue: Array<() => void> = [];

async function waitForSlot(): Promise<void> {
  if (activeRequests < MAX_CONCURRENT_REQUESTS) {
    activeRequests++;
    return;
  }
  
  // Wait in queue
  return new Promise<void>((resolve) => {
    requestQueue.push(() => {
      activeRequests++;
      resolve();
    });
  });
}

function releaseSlot(): void {
  activeRequests--;
  const next = requestQueue.shift();
  if (next) {
    next();
  }
}

/**
 * Get cached photo variant as blob URL
 * Fetches and caches on first call, returns cached URL on subsequent calls
 */
export async function getCachedPhotoVariant(photoId: string | number, quality?: QualityLevel): Promise<string> {
  const selectedQuality = quality || viewportQualityService.getOptimalQuality();
  const cacheKey = `${photoId}-${selectedQuality}`;
  
  if (blobUrlCache.has(cacheKey)) {
    console.log('[photoService] Using cached blob URL:', cacheKey);
    return blobUrlCache.get(cacheKey)!;
  }
  
  // Wait for available slot
  await waitForSlot();
  
  try {
    console.log('[photoService] Fetching new blob URL:', cacheKey);
    const blobUrl = await fetchPhotoVariantBlob(photoId, selectedQuality);
    blobUrlCache.set(cacheKey, blobUrl);
    return blobUrl;
  } finally {
    releaseSlot();
  }
}

/**
 * Clear blob URL cache (call on logout or when needed)
 */
export function clearBlobCache() {
  console.log('[photoService] Clearing blob URL cache:', blobUrlCache.size, 'entries');
  
  // Revoke all blob URLs to free memory
  blobUrlCache.forEach((blobUrl) => {
    URL.revokeObjectURL(blobUrl);
  });
  
  blobUrlCache.clear();
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
    
    console.log('[photoService] Fetched photos from backend:', {
      projectId,
      count: response.photos?.length || 0,
      samplePhoto: response.photos?.[0] ? {
        id: response.photos[0].id,
        filename: response.photos[0].original_filename,
        src: response.photos[0].src,
        storage_path: response.photos[0].storage_path
      } : null
    });
    
    // Transform all photo.src to use variants instead of originals
    const transformedPhotos = response.photos.map((photo: any) => {
      const variantUrl = getPhotoVariantUrl(photo.id, quality || 'medium');
      const originalSrc = photo.src || photo.storage_path || photo.file_path;
      
      return {
        ...photo,
        src: variantUrl,
        originalSrc: originalSrc, // Keep original for downloads
      };
    });
    
    console.log('[photoService] Transformed photos to use variants:', {
      count: transformedPhotos.length,
      samplePhoto: transformedPhotos[0] ? {
        id: transformedPhotos[0].id,
        src: transformedPhotos[0].src,
        originalSrc: transformedPhotos[0].originalSrc
      } : null
    });
    
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

  /**
   * Get photos with processing issues for current user
   */
  async getProcessingIssues(): Promise<{
    total_failed: number;
    photos: Array<{
      id: number;
      project_id: number;
      filename: string;
      error: string;
      uploaded_at: string;
      last_attempt: string;
      attempts: number;
    }>;
  }> {
    return apiClient.get('/v2/photos/processing-issues');
  }

  /**
   * Retry processing for a failed photo (admin only)
   */
  async reprocessPhoto(photoId: string): Promise<{ message: string; status: string }> {
    return apiClient.post(`/v2/admin/photos/${photoId}/reprocess`, {});
  }

  /**
   * Get processing status overview (admin only)
   */
  async getProcessingStatus(): Promise<{
    total_photos: number;
    processing: number;
    completed_with_variants: number;
    failed: number;
    missing_variants: number;
    recent_failures: Array<any>;
  }> {
    return apiClient.get('/v2/admin/photos/processing-status');
  }
}

export const photoService = new PhotoService();
