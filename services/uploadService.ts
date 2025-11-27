/**
 * Upload Service
 * Handles file uploads with real progress tracking using presigned URLs
 */

import { apiClient } from '../lib/api-client';

export interface PresignedUrlRequest {
  project_id: string;
  filename: string;
  content_type: string;
  file_size: number;
  folder_id?: string;
}

export interface PresignedUrlResponse {
  upload_url: string;
  photo_id: number;
  token: string;
  expires_at: string;
  method: string;
}

export interface BatchPresignedUrlRequest {
  project_id: number; // Backend expects integer, not UUID string
  folder_id?: string;
  files: Array<{
    filename: string;
    content_type: string;
    file_size: number;
  }>;
}

export interface BatchPresignedUrlResponse {
  tokens: PresignedUrlResponse[];
  session_id: string; // UUID string
  total_files: number;
}

export interface BatchUploadVerificationResponse {
  session_id: string; // UUID string
  total_files: number;
  completed: number;
  failed: number;
  pending: number;
  status: string;
}

export interface UploadProgressCallback {
  (progress: number): void;
}

export interface PhotoResponse {
  id: string;
  project_id: string;
  folder_id?: string;
  src: string;
  alt: string;
  original_filename: string;
  width: number;
  height: number;
  file_size: number;
  mime_type: string;
  thumbnail_path?: string;
  order_index: number;
  comment_count: number;
  status: string;
  uploaded_by: string;
  created_at: string;
  updated_at: string;
}

class UploadService {
  /**
   * Get presigned URL for file upload
   */
  async getPresignedUrl(request: PresignedUrlRequest): Promise<PresignedUrlResponse> {
    return apiClient.post<PresignedUrlResponse>('/v2/upload/presigned', request);
  }

  /**
   * Upload file using presigned URL with real progress tracking
   */
  async uploadFile(
    file: File,
    token: string,
    onProgress?: UploadProgressCallback
  ): Promise<PhotoResponse> {
    console.log('[UploadService] Uploading file:', file.name, 'Token:', token);

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      const formData = new FormData();
      formData.append('file', file);

      // Track upload progress
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable && onProgress) {
          const progress = (event.loaded / event.total) * 100;
          console.log(`[UploadService] Upload progress: ${progress.toFixed(2)}%`);
          onProgress(progress);
        }
      });

      // Handle completion
      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText);
            console.log('[UploadService] Upload complete:', response);
            resolve(response);
          } catch (error) {
            console.error('[UploadService] Failed to parse response:', error);
            reject(new Error('Invalid response from server'));
          }
        } else {
          console.error('[UploadService] Upload failed with status:', xhr.status);
          
          // Parse error response to get detailed message
          let errorMessage = `Upload failed: ${xhr.statusText}`;
          let errorDetail = null;
          
          try {
            const errorResponse = JSON.parse(xhr.responseText);
            console.log('[UploadService] Error response:', errorResponse);
            
            if (errorResponse.detail) {
              errorDetail = errorResponse.detail;
              
              // Extract meaningful error message
              if (errorDetail.message) {
                errorMessage = errorDetail.message;
              }
              
              // For duplicates, create clear message with both filenames
              if (errorDetail.error === 'duplicate_detected' && errorDetail.your_file && errorDetail.existing_photo) {
                errorMessage = `Duplicate: "${errorDetail.your_file}" has same content as "${errorDetail.existing_photo.filename}" (already uploaded)`;
              }
            }
          } catch (e) {
            // If parsing fails, keep generic message
            console.warn('[UploadService] Could not parse error response:', e);
          }
          
          // Create enhanced error object
          const error: any = new Error(errorMessage);
          error.status = xhr.status;
          error.detail = errorDetail;
          
          console.error('[UploadService] Rejecting with error:', errorMessage);
          reject(error);
        }
      });

      // Handle errors
      xhr.addEventListener('error', () => {
        console.error('[UploadService] Upload error');
        reject(new Error('Network error during upload'));
      });

      xhr.addEventListener('abort', () => {
        console.warn('[UploadService] Upload aborted');
        reject(new Error('Upload cancelled'));
      });

      // Get auth token from localStorage
      const authToken = localStorage.getItem('auth_token');
      
      // Send request
      xhr.open('PUT', `http://localhost:8000/v2/upload/${token}`);
      
      if (authToken) {
        xhr.setRequestHeader('Authorization', `Bearer ${authToken}`);
      }

      xhr.send(formData);
    });
  }

  /**
   * Complete upload flow: Get presigned URL → Upload file → Return photo data
   */
  async uploadWithProgress(
    file: File,
    projectId: string,
    folderId: string | undefined,
    onProgress?: UploadProgressCallback
  ): Promise<PhotoResponse> {
    try {
      console.log('[UploadService] Starting upload flow for:', file.name);

      // Step 1: Get presigned URL
      const presignedResponse = await this.getPresignedUrl({
        project_id: projectId,
        filename: file.name,
        content_type: file.type,
        file_size: file.size,
        folder_id: folderId,
      });

      console.log('[UploadService] Got presigned URL:', presignedResponse);

      // Step 2: Upload file with progress tracking
      const photoResponse = await this.uploadFile(
        file,
        presignedResponse.token,
        onProgress
      );

      console.log('[UploadService] Upload complete:', photoResponse);
      return photoResponse;
    } catch (error) {
      console.error('[UploadService] Upload failed:', error);
      throw error;
    }
  }

  /**
   * Create upload session for batch uploads
   */
  async createUploadSession(projectId: string, totalFiles: number) {
    console.log('[UploadService] Creating upload session:', { projectId, totalFiles });
    return apiClient.post('/v2/upload/session', {
      project_id: projectId,
      total_files: totalFiles,
    });
  }

  /**
   * Update upload session progress
   */
  async updateUploadSession(sessionId: string, uploadedCount: number) {
    return apiClient.patch(`/v2/upload/session/${sessionId}`, {
      uploaded_count: uploadedCount,
    });
  }

  /**
   * Get batch presigned URLs for multiple files
   * This reduces API calls by getting all presigned URLs in one request
   */
  async getBatchPresignedUrls(request: BatchPresignedUrlRequest): Promise<BatchPresignedUrlResponse> {
    console.log('[UploadService] Getting batch presigned URLs:', request);
    return apiClient.post<BatchPresignedUrlResponse>('/v2/upload/batch/presigned', request);
  }

  /**
   * Verify batch upload status
   */
  async verifyBatchUpload(sessionId: string): Promise<BatchUploadVerificationResponse> {
    console.log('[UploadService] Verifying batch upload:', sessionId);
    return apiClient.get<BatchUploadVerificationResponse>(`/v2/upload/batch/verify/${sessionId}`);
  }

  /**
   * Upload multiple files with batch presigned URLs
   * This is more efficient than calling getPresignedUrl for each file
   */
  async uploadBatch(
    files: Array<{
      file: File;
      token: string;
      onProgress?: UploadProgressCallback;
    }>
  ): Promise<PhotoResponse[]> {
    console.log('[UploadService] Starting batch upload for', files.length, 'files');

    const uploadPromises = files.map(({ file, token, onProgress }) => 
      this.uploadFile(file, token, onProgress)
    );

    try {
      const results = await Promise.all(uploadPromises);
      console.log('[UploadService] Batch upload complete:', results.length, 'files');
      return results;
    } catch (error) {
      console.error('[UploadService] Batch upload failed:', error);
      throw error;
    }
  }
}

export const uploadService = new UploadService();
