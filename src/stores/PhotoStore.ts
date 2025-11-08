/**
 * Photo Store
 * 
 * Global state management for photos.
 * Replaces scattered useState calls across components.
 * 
 * Usage:
 *   const photos = usePhotoStore(state => state.photos);
 *   const fetchPhotos = usePhotoStore(state => state.fetchPhotos);
 */

import { create } from 'zustand';
import { photoService, Photo, PhotoListResponse } from '../services/photoService';
import { cacheEvents, CacheEventType } from '../services/cache-events/CacheEventEmitter';
import { memoryCacheManager } from '../services/cache/MemoryCacheManager';
import { indexedDBManager } from '../services/cache/IndexedDBManager';
import { configLoader } from '../services/ConfigLoader';

interface PhotoState {
  // Data
  photos: Record<string, Photo>; // Keyed by photo ID
  photosByProject: Record<string, string[]>; // Project ID -> Photo IDs
  loading: Record<string, boolean>; // Loading states by key
  error: Record<string, string | null>; // Errors by key
  
  // Actions
  fetchProjectPhotos: (projectId: string, categoryId?: string) => Promise<void>;
  getPhoto: (photoId: string) => Promise<Photo>;
  updatePhoto: (photoId: string, updates: Partial<Photo>) => Promise<void>;
  deletePhoto: (photoId: string) => Promise<void>;
  toggleFavorite: (photoId: string) => Promise<void>;
  toggleSelection: (photoId: string) => Promise<void>;
  clearProjectPhotos: (projectId: string) => void;
  clearAll: () => void;
  
  // Getters
  getPhotoById: (photoId: string) => Photo | undefined;
  getProjectPhotos: (projectId: string) => Photo[];
}

export const usePhotoStore = create<PhotoState>((set, get) => ({
  // Initial state
  photos: {},
  photosByProject: {},
  loading: {},
  error: {},

  // Fetch photos for a project
  fetchProjectPhotos: async (projectId: string, categoryId?: string) => {
    const key = categoryId ? `${projectId}-${categoryId}` : projectId;
    const cacheKey = `photos:${key}`;
    
    // Check memory cache first (if feature enabled)
    if (configLoader.isFeatureEnabled('memoryCache')) {
      const cached = memoryCacheManager.get<PhotoListResponse>(cacheKey);
      if (cached) {
        // Use cached data
        const photoMap: Record<string, Photo> = {};
        const photoIds: string[] = [];

        cached.photos.forEach((photo) => {
          photoMap[photo.id] = photo;
          photoIds.push(photo.id);
        });

        set((state) => ({
          photos: { ...state.photos, ...photoMap },
          photosByProject: { ...state.photosByProject, [projectId]: photoIds },
        }));
        
        return; // Return early with cached data
      }
    }
    
    // Check IndexedDB cache (if feature enabled)
    if (configLoader.isFeatureEnabled('indexedDBCache')) {
      const cached = await indexedDBManager.get<PhotoListResponse>(cacheKey);
      if (cached) {
        // Use cached data
        const photoMap: Record<string, Photo> = {};
        const photoIds: string[] = [];

        cached.photos.forEach((photo) => {
          photoMap[photo.id] = photo;
          photoIds.push(photo.id);
        });

        set((state) => ({
          photos: { ...state.photos, ...photoMap },
          photosByProject: { ...state.photosByProject, [projectId]: photoIds },
        }));
        
        // Also populate memory cache
        if (configLoader.isFeatureEnabled('memoryCache')) {
          memoryCacheManager.set(cacheKey, cached);
        }
        
        return; // Return early with cached data
      }
    }
    
    // Cache miss - fetch from API
    cacheEvents.emit({
      type: CacheEventType.API_CALL_START,
      metadata: {
        endpoint: 'getProjectPhotos',
        projectId,
        categoryId,
      },
    });

    set((state) => ({
      loading: { ...state.loading, [key]: true },
      error: { ...state.error, [key]: null },
    }));

    try {
      const startTime = Date.now();
      const response: PhotoListResponse = await photoService.getProjectPhotos(projectId, categoryId);
      const duration = Date.now() - startTime;

      // Emit API success event
      cacheEvents.emit({
        type: CacheEventType.API_CALL_SUCCESS,
        metadata: {
          endpoint: 'getProjectPhotos',
          projectId,
          categoryId,
          count: response.photos.length,
        },
        duration,
      });

      // Update store
      const photoMap: Record<string, Photo> = {};
      const photoIds: string[] = [];

      response.photos.forEach((photo) => {
        photoMap[photo.id] = photo;
        photoIds.push(photo.id);
      });

      set((state) => ({
        photos: { ...state.photos, ...photoMap },
        photosByProject: { ...state.photosByProject, [projectId]: photoIds },
        loading: { ...state.loading, [key]: false },
      }));
      
      // Store in memory cache (if feature enabled)
      if (configLoader.isFeatureEnabled('memoryCache')) {
        memoryCacheManager.set(cacheKey, response);
      }
      
      // Store in IndexedDB cache (if feature enabled)
      if (configLoader.isFeatureEnabled('indexedDBCache')) {
        await indexedDBManager.set(cacheKey, response);
      }
    } catch (error: any) {
      // Emit API error event
      cacheEvents.emit({
        type: CacheEventType.API_CALL_ERROR,
        metadata: {
          endpoint: 'getProjectPhotos',
          projectId,
          categoryId,
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

  // Get single photo
  getPhoto: async (photoId: string) => {
    const cacheKey = `photo:${photoId}`;
    
    // Check memory cache first (if feature enabled)
    if (configLoader.isFeatureEnabled('memoryCache')) {
      const cached = memoryCacheManager.get<Photo>(cacheKey);
      if (cached) {
        set((state) => ({
          photos: { ...state.photos, [photoId]: cached },
        }));
        return cached;
      }
    }
    
    // Check IndexedDB cache (if feature enabled)
    if (configLoader.isFeatureEnabled('indexedDBCache')) {
      const cached = await indexedDBManager.get<Photo>(cacheKey);
      if (cached) {
        set((state) => ({
          photos: { ...state.photos, [photoId]: cached },
        }));
        
        // Also populate memory cache
        if (configLoader.isFeatureEnabled('memoryCache')) {
          memoryCacheManager.set(cacheKey, cached);
        }
        
        return cached;
      }
    }
    
    // Check store
    const existing = get().photos[photoId];
    if (existing) {
      cacheEvents.emit({
        type: CacheEventType.CACHE_HIT,
        metadata: { source: 'memory', photoId },
      });
      return existing;
    }

    cacheEvents.emit({
      type: CacheEventType.CACHE_MISS,
      metadata: { photoId },
    });

    const startTime = Date.now();
    const photo = await photoService.getPhoto(photoId);
    const duration = Date.now() - startTime;

    cacheEvents.emit({
      type: CacheEventType.API_CALL_SUCCESS,
      metadata: { endpoint: 'getPhoto', photoId },
      duration,
    });

    set((state) => ({
      photos: { ...state.photos, [photoId]: photo },
    }));
    
    // Store in memory cache (if feature enabled)
    if (configLoader.isFeatureEnabled('memoryCache')) {
      memoryCacheManager.set(cacheKey, photo);
    }
    
    // Store in IndexedDB cache (if feature enabled)
    if (configLoader.isFeatureEnabled('indexedDBCache')) {
      await indexedDBManager.set(cacheKey, photo);
    }

    return photo;
  },

  // Update photo
  updatePhoto: async (photoId: string, updates: Partial<Photo>) => {
    const startTime = Date.now();
    const updatedPhoto = await photoService.updatePhoto(photoId, updates);
    const duration = Date.now() - startTime;

    cacheEvents.emit({
      type: CacheEventType.API_CALL_SUCCESS,
      metadata: { endpoint: 'updatePhoto', photoId, updates },
      duration,
    });

    set((state) => ({
      photos: {
        ...state.photos,
        [photoId]: { ...state.photos[photoId], ...updatedPhoto },
      },
    }));
  },

  // Delete photo
  deletePhoto: async (photoId: string) => {
    await photoService.deletePhoto(photoId);

    set((state) => {
      const newPhotos = { ...state.photos };
      delete newPhotos[photoId];

      const newPhotosByProject: Record<string, string[]> = {};
      Object.entries(state.photosByProject).forEach(([projectId, photoIds]) => {
        newPhotosByProject[projectId] = photoIds.filter((id) => id !== photoId);
      });

      return {
        photos: newPhotos,
        photosByProject: newPhotosByProject,
      };
    });

    cacheEvents.emit({
      type: CacheEventType.CACHE_EVICT,
      metadata: { photoId, reason: 'deleted' },
    });
  },

  // Toggle favorite
  toggleFavorite: async (photoId: string) => {
    const startTime = Date.now();
    const updatedPhoto = await photoService.toggleFavorite(photoId);
    const duration = Date.now() - startTime;

    cacheEvents.emit({
      type: CacheEventType.API_CALL_SUCCESS,
      metadata: { endpoint: 'toggleFavorite', photoId },
      duration,
    });

    set((state) => ({
      photos: {
        ...state.photos,
        [photoId]: updatedPhoto,
      },
    }));
  },

  // Toggle selection
  toggleSelection: async (photoId: string) => {
    const startTime = Date.now();
    const updatedPhoto = await photoService.toggleSelection(photoId);
    const duration = Date.now() - startTime;

    cacheEvents.emit({
      type: CacheEventType.API_CALL_SUCCESS,
      metadata: { endpoint: 'toggleSelection', photoId },
      duration,
    });

    set((state) => ({
      photos: {
        ...state.photos,
        [photoId]: updatedPhoto,
      },
    }));
  },

  // Clear project photos
  clearProjectPhotos: (projectId: string) => {
    set((state) => {
      const photoIds = state.photosByProject[projectId] || [];
      const newPhotos = { ...state.photos };
      
      photoIds.forEach((photoId) => {
        delete newPhotos[photoId];
      });

      const newPhotosByProject = { ...state.photosByProject };
      delete newPhotosByProject[projectId];

      return {
        photos: newPhotos,
        photosByProject: newPhotosByProject,
      };
    });

    cacheEvents.emit({
      type: CacheEventType.CACHE_CLEAR,
      metadata: { projectId },
    });
  },

  // Clear all
  clearAll: () => {
    set({
      photos: {},
      photosByProject: {},
      loading: {},
      error: {},
    });

    cacheEvents.emit({
      type: CacheEventType.CACHE_CLEAR,
      metadata: { scope: 'all' },
    });
  },

  // Getters
  getPhotoById: (photoId: string) => {
    return get().photos[photoId];
  },

  getProjectPhotos: (projectId: string) => {
    const photoIds = get().photosByProject[projectId] || [];
    return photoIds.map((id) => get().photos[id]).filter(Boolean) as Photo[];
  },
}));

export default usePhotoStore;
