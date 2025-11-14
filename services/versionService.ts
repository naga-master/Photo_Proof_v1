/**
 * Version Service
 * Handles photo version management and edited photo uploads
 */

import { apiClient } from '../lib/api-client';

export interface OriginalPhoto {
  id: number;
  original_filename: string;
  src: string;
  thumbnail_path: string | null;
  folder_id: string | null;
  folder_name: string | null;
  current_version_filename: string;
  version_count: number;
}

export interface FolderInfo {
  id: string;
  name: string;
}

export interface GetOriginalPhotosResponse {
  photos: OriginalPhoto[];
  folders: FolderInfo[];
  total: number;
}

export interface MatchedPair {
  edited_filename: string;
  photo_id: number;
  original_filename: string;
  confidence: number;
  match_reason: string;
}

export interface PhotoSuggestion {
  photo_id: number;
  filename: string;
  confidence: number;
}

export interface UnmatchedFile {
  edited_filename: string;
  suggestions: PhotoSuggestion[];
}

export interface MatchFilenamesResponse {
  matched: MatchedPair[];
  unmatched: UnmatchedFile[];
}

export interface FileMetadata {
  filename: string;
  content_type: string;
  file_size: number;
}

export interface VersionMapping {
  photo_id: number;
  file_metadata: FileMetadata;
  version_label?: string;
  mapping_type: 'auto' | 'manual';
}

export interface UploadToken {
  upload_url: string;
  token: string;
  photo_id: number;
  expires_at: string;
}

export interface CreateVersionsBatchResponse {
  tokens: UploadToken[];
  total_files: number;
}

export interface PhotoVersionInfo {
  id: number;
  version_number: number;
  filename: string;
  src: string;
  thumbnail_path: string | null;
  version_label: string | null;
  is_original: boolean;
  is_current: boolean;
  uploaded_by: string;
  uploaded_at: string;
  file_size: number;
  width: number;
  height: number;
}

export interface VersionHistoryResponse {
  photo_id: number;
  current_version: PhotoVersionInfo | null;
  versions: PhotoVersionInfo[];
  total_versions: number;
}

export interface SetActiveVersionResponse {
  photo_id: number;
  current_version_id: number;
  message: string;
}

class VersionService {
  /**
   * Get all original photos in a project for filename matching
   */
  async getOriginalPhotos(
    projectId: string | number,
    folderId?: string,
    search?: string
  ): Promise<GetOriginalPhotosResponse> {
    const params: Record<string, string> = {};
    if (folderId) params.folder_id = folderId;
    if (search) params.search = search;
    
    return apiClient.get<GetOriginalPhotosResponse>(
      `/v2/photos/projects/${projectId}/photos/original`,
      params
    );
  }

  /**
   * Match edited filenames to original photos using smart matching algorithm
   */
  async matchFilenames(
    projectId: string | number,
    filenames: string[]
  ): Promise<MatchFilenamesResponse> {
    return apiClient.post<MatchFilenamesResponse>('/v2/photos/photos/versions/match', {
      project_id: projectId,
      filenames
    });
  }

  /**
   * Create photo versions in batch
   * Returns upload tokens for presigned URL uploads
   */
  async createVersionsBatch(
    mappings: { mappings: VersionMapping[] }
  ): Promise<CreateVersionsBatchResponse> {
    return apiClient.post<CreateVersionsBatchResponse>(
      '/v2/photos/photos/versions/batch',
      mappings
    );
  }

  /**
   * Get version history for a photo (studio users only)
   */
  async getVersionHistory(photoId: number): Promise<VersionHistoryResponse> {
    return apiClient.get<VersionHistoryResponse>(`/v2/photos/photos/${photoId}/versions`);
  }

  /**
   * Set a different version as the current active version (revert)
   */
  async setActiveVersion(
    photoId: number,
    versionId: number
  ): Promise<SetActiveVersionResponse> {
    return apiClient.patch<SetActiveVersionResponse>(
      `/v2/photos/photos/${photoId}/versions/${versionId}/activate`
    );
  }

  /**
   * Upload file to presigned URL
   * This is used after getting tokens from createVersionsBatch
   */
  async uploadToPresignedUrl(
    uploadUrl: string,
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      // Track upload progress
      if (onProgress) {
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            const progress = (e.loaded / e.total) * 100;
            onProgress(progress);
          }
        });
      }

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve();
        } else {
          reject(new Error(`Upload failed with status ${xhr.status}`));
        }
      });

      xhr.addEventListener('error', () => {
        reject(new Error('Upload failed'));
      });

      xhr.addEventListener('abort', () => {
        reject(new Error('Upload aborted'));
      });

      xhr.open('PUT', uploadUrl);
      xhr.setRequestHeader('Content-Type', file.type);
      xhr.send(file);
    });
  }
}

export const versionService = new VersionService();
