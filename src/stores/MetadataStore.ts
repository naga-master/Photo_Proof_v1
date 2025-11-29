/**
 * Metadata Store
 * 
 * Global state for metadata: folders, selections, comments, etc.
 */

import { create } from 'zustand';
import { projectService } from '../services/projectService';
import { cacheEvents, CacheEventType } from '../services/cache-events/CacheEventEmitter';

interface Folder {
  id: string;
  name: string;
  project_id: string;
  photoCount: number;
  coverPhotoId?: string;
  coverPhotoSrc?: string;
  order_index: number;
  created_at?: string;
  updated_at?: string;
}

interface MetadataState {
  // Data
  folders: Record<string, Folder>; // Keyed by folder ID
  foldersByProject: Record<string, string[]>; // Project ID -> Folder IDs
  selections: Record<string, Set<string>>; // Project ID -> Selected Photo IDs
  loading: Record<string, boolean>;
  error: Record<string, string | null>;
  
  // Actions
  fetchProjectFolders: (projectId: string) => Promise<void>;
  createFolder: (projectId: string, folderName: string) => Promise<Folder>;
  togglePhotoSelection: (projectId: string, photoId: string) => void;
  clearProjectSelections: (projectId: string) => void;
  getSelectedPhotos: (projectId: string) => string[];
  clearAll: () => void;
  
  // Getters
  getProjectFolders: (projectId: string) => Folder[];
  getFolderById: (folderId: string) => Folder | undefined;
}

export const useMetadataStore = create<MetadataState>((set, get) => ({
  // Initial state
  folders: {},
  foldersByProject: {},
  selections: {},
  loading: {},
  error: {},

  // Fetch project folders
  fetchProjectFolders: async (projectId: string) => {
    const key = `folders-${projectId}`;
    
    cacheEvents.emit({
      type: CacheEventType.API_CALL_START,
      metadata: { endpoint: 'getProjectFolders', projectId },
    });

    set((state) => ({
      loading: { ...state.loading, [key]: true },
      error: { ...state.error, [key]: null },
    }));

    try {
      const startTime = Date.now();
      const response = await projectService.getProjectFolders(projectId);
      const duration = Date.now() - startTime;

      cacheEvents.emit({
        type: CacheEventType.API_CALL_SUCCESS,
        metadata: {
          endpoint: 'getProjectFolders',
          projectId,
          count: response.folders.length,
        },
        duration,
      });

      // Update store
      const folderMap: Record<string, Folder> = {};
      const folderIds: string[] = [];

      response.folders.forEach((folder: any) => {
        folderMap[folder.id] = folder;
        folderIds.push(folder.id);
      });

      set((state) => ({
        folders: { ...state.folders, ...folderMap },
        foldersByProject: { ...state.foldersByProject, [projectId]: folderIds },
        loading: { ...state.loading, [key]: false },
      }));
    } catch (error: any) {
      cacheEvents.emit({
        type: CacheEventType.API_CALL_ERROR,
        metadata: {
          endpoint: 'getProjectFolders',
          projectId,
          error: error.message,
        },
      });

      set((state) => ({
        loading: { ...state.loading, [key]: false },
        error: { ...state.error, [key]: error.message },
      }));

      throw error;
    }
  },

  // Create folder
  createFolder: async (projectId: string, folderName: string) => {
    const startTime = Date.now();
    const result = await projectService.createFolder(projectId, folderName);
    
    // Check if it's a duplicate - reject immediately (no auto-retry)
    if ('error' in result) {
      const errorMsg = result.message || `Folder '${folderName}' already exists`;
      throw new Error(errorMsg);
    }
    
    // TypeScript now knows result is the folder type (not DuplicateInfo)
    const folder: Folder = {
      id: result.id,
      name: result.name,
      project_id: result.project_id,
      photoCount: result.photoCount,
      coverPhotoId: result.coverPhotoId,
      coverPhotoSrc: result.coverPhotoSrc,
      order_index: result.order_index,
      created_at: result.created_at,
      updated_at: result.updated_at,
    };
    const duration = Date.now() - startTime;

    cacheEvents.emit({
      type: CacheEventType.API_CALL_SUCCESS,
      metadata: { endpoint: 'createFolder', projectId, folderName },
      duration,
    });

    set((state) => ({
      folders: { ...state.folders, [folder.id]: folder },
      foldersByProject: {
        ...state.foldersByProject,
        [projectId]: [...(state.foldersByProject[projectId] || []), folder.id],
      },
    }));

    return folder;
  },

  // Toggle photo selection
  togglePhotoSelection: (projectId: string, photoId: string) => {
    set((state) => {
      const selections = new Set(state.selections[projectId] || []);
      
      if (selections.has(photoId)) {
        selections.delete(photoId);
      } else {
        selections.add(photoId);
      }

      return {
        selections: {
          ...state.selections,
          [projectId]: selections,
        },
      };
    });
  },

  // Clear project selections
  clearProjectSelections: (projectId: string) => {
    set((state) => {
      const newSelections = { ...state.selections };
      delete newSelections[projectId];
      
      return { selections: newSelections };
    });
  },

  // Get selected photos
  getSelectedPhotos: (projectId: string) => {
    const selections = get().selections[projectId];
    return selections ? Array.from(selections) : [];
  },

  // Clear all
  clearAll: () => {
    set({
      folders: {},
      foldersByProject: {},
      selections: {},
      loading: {},
      error: {},
    });

    cacheEvents.emit({
      type: CacheEventType.CACHE_CLEAR,
      metadata: { scope: 'metadata' },
    });
  },

  // Getters
  getProjectFolders: (projectId: string) => {
    const folderIds = get().foldersByProject[projectId] || [];
    return folderIds.map((id) => get().folders[id]).filter(Boolean) as Folder[];
  },

  getFolderById: (folderId: string) => {
    return get().folders[folderId];
  },
}));

export default useMetadataStore;
