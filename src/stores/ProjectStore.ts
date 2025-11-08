/**
 * Project Store
 * 
 * Global state management for projects.
 * Handles project CRUD operations and caching.
 */

import { create } from 'zustand';
import { projectService, Project, ProjectListResponse } from '../services/projectService';
import { cacheEvents, CacheEventType } from '../services/cache-events/CacheEventEmitter';
import { memoryCacheManager } from '../services/cache/MemoryCacheManager';
import { indexedDBManager } from '../services/cache/IndexedDBManager';
import { configLoader } from '../services/ConfigLoader';
import { roleDetector } from '../services/auth/RoleDetector';

interface ProjectState {
  // Data
  projects: Record<string, Project>; // Keyed by project ID
  projectIds: string[]; // Order matters for lists
  loading: Record<string, boolean>;
  error: Record<string, string | null>;
  
  // Metadata
  lastFetch: number | null;
  totalCount: number;
  
  // Actions
  fetchProjects: (studioId?: string, status?: string) => Promise<void>;
  fetchProject: (projectId: string) => Promise<Project>;
  createProject: (data: any) => Promise<Project>;
  updateProject: (projectId: string, updates: any) => Promise<void>;
  deleteProject: (projectId: string) => Promise<void>;
  setCoverPhoto: (projectId: string, photoId: string | null) => Promise<void>;
  clearAll: () => void;
  
  // Getters
  getProjectById: (projectId: string) => Project | undefined;
  getAllProjects: () => Project[];
  getProjectCount: () => number;
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  // Initial state
  projects: {},
  projectIds: [],
  loading: {},
  error: {},
  lastFetch: null,
  totalCount: 0,

  // Fetch all projects
  fetchProjects: async (studioId?: string, status?: string) => {
    const key = 'projects-list';
    
    // Stage 4: Detect user role and choose appropriate mode
    const role = roleDetector.getCurrentRole();
    const mode = role === 'studio' ? 'list' : 'full';
    
    // Cache key should include mode to avoid stale data
    const cacheKey = `projects:${studioId || 'all'}:${status || 'all'}:${mode}`;
    
    // Stage 4: Role-based mode selection logged
    // Check memory cache first (if feature enabled)
    if (configLoader.isFeatureEnabled('memoryCache')) {
      const cached = memoryCacheManager.get<ProjectListResponse>(cacheKey);
      if (cached) {
        // Use cached data
        const projectMap: Record<string, Project> = {};
        const projectIds: string[] = [];

        cached.projects.forEach((project) => {
          projectMap[project.id] = project;
          projectIds.push(project.id);
        });

        set({
          projects: projectMap,
          projectIds,
          totalCount: cached.total,
          lastFetch: Date.now(),
        });
        
        return; // Return early with cached data
      }
    }
    
    // Check IndexedDB cache (if feature enabled)
    if (configLoader.isFeatureEnabled('indexedDBCache')) {
      const cached = await indexedDBManager.get<ProjectListResponse>(cacheKey);
      if (cached) {
        // Use cached data
        const projectMap: Record<string, Project> = {};
        const projectIds: string[] = [];

        cached.projects.forEach((project) => {
          projectMap[project.id] = project;
          projectIds.push(project.id);
        });

        set({
          projects: projectMap,
          projectIds,
          totalCount: cached.total,
          lastFetch: Date.now(),
        });
        
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
        endpoint: 'getProjects',
        studioId,
        status,
        mode,  // Stage 4: Log mode parameter
      },
    });

    set((state) => ({
      loading: { ...state.loading, [key]: true },
      error: { ...state.error, [key]: null },
    }));

    try {
      const startTime = Date.now();
      // Stage 4: Pass mode parameter to service
      const response: ProjectListResponse = await projectService.getProjects(studioId, status, mode);
      const duration = Date.now() - startTime;

      cacheEvents.emit({
        type: CacheEventType.API_CALL_SUCCESS,
        metadata: {
          endpoint: 'getProjects',
          count: response.projects.length,
          studioId,
          status,
          mode,  // Stage 4: Log mode used
          responseSize: JSON.stringify(response).length,  // Stage 4: Track response size
        },
        duration,
      });

      // Update store
      const projectMap: Record<string, Project> = {};
      const projectIds: string[] = [];

      response.projects.forEach((project) => {
        projectMap[project.id] = project;
        projectIds.push(project.id);
      });

      set({
        projects: projectMap,
        projectIds,
        totalCount: response.total,
        lastFetch: Date.now(),
        loading: { [key]: false },
      });

      cacheEvents.emit({
        type: CacheEventType.CACHE_SET,
        metadata: {
          source: 'memory',
          count: response.projects.length,
          key: 'projects',
        },
      });
      
      // Store in memory cache (if feature enabled)
      if (configLoader.isFeatureEnabled('memoryCache')) {
        memoryCacheManager.set(cacheKey, response);
      }
      
      // Store in IndexedDB cache (if feature enabled)
      if (configLoader.isFeatureEnabled('indexedDBCache')) {
        await indexedDBManager.set(cacheKey, response);
      }
    } catch (error: any) {
      cacheEvents.emit({
        type: CacheEventType.API_CALL_ERROR,
        metadata: {
          endpoint: 'getProjects',
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

  // Fetch single project
  fetchProject: async (projectId: string) => {
    const cacheKey = `project:${projectId}`;
    
    // Check memory cache first (if feature enabled)
    if (configLoader.isFeatureEnabled('memoryCache')) {
      const cached = memoryCacheManager.get<Project>(cacheKey);
      if (cached) {
        set((state) => ({
          projects: { ...state.projects, [projectId]: cached },
        }));
        return cached;
      }
    }
    
    // Check IndexedDB cache (if feature enabled)
    if (configLoader.isFeatureEnabled('indexedDBCache')) {
      const cached = await indexedDBManager.get<Project>(cacheKey);
      if (cached) {
        set((state) => ({
          projects: { ...state.projects, [projectId]: cached },
        }));
        
        // Also populate memory cache
        if (configLoader.isFeatureEnabled('memoryCache')) {
          memoryCacheManager.set(cacheKey, cached);
        }
        
        return cached;
      }
    }
    
    // Check store
    const existing = get().projects[projectId];
    if (existing) {
      cacheEvents.emit({
        type: CacheEventType.CACHE_HIT,
        metadata: { source: 'memory', projectId },
      });
      return existing;
    }

    cacheEvents.emit({
      type: CacheEventType.CACHE_MISS,
      metadata: { projectId },
    });

    const startTime = Date.now();
    const project = await projectService.getProject(projectId);
    const duration = Date.now() - startTime;

    cacheEvents.emit({
      type: CacheEventType.API_CALL_SUCCESS,
      metadata: { endpoint: 'getProject', projectId },
      duration,
    });

    set((state) => ({
      projects: { ...state.projects, [projectId]: project },
    }));
    
    // Store in memory cache (if feature enabled)
    if (configLoader.isFeatureEnabled('memoryCache')) {
      memoryCacheManager.set(cacheKey, project);
    }
    
    // Store in IndexedDB cache (if feature enabled)
    if (configLoader.isFeatureEnabled('indexedDBCache')) {
      await indexedDBManager.set(cacheKey, project);
    }

    return project;
  },

  // Create project
  createProject: async (data: any) => {
    const startTime = Date.now();
    const project = await projectService.createProject(data);
    const duration = Date.now() - startTime;

    cacheEvents.emit({
      type: CacheEventType.API_CALL_SUCCESS,
      metadata: { endpoint: 'createProject', projectId: project.id },
      duration,
    });

    set((state) => ({
      projects: { ...state.projects, [project.id]: project },
      projectIds: [project.id, ...state.projectIds],
      totalCount: state.totalCount + 1,
    }));

    return project;
  },

  // Update project
  updateProject: async (projectId: string, updates: any) => {
    const startTime = Date.now();
    const updatedProject = await projectService.updateProject(projectId, updates);
    const duration = Date.now() - startTime;

    cacheEvents.emit({
      type: CacheEventType.API_CALL_SUCCESS,
      metadata: { endpoint: 'updateProject', projectId, updates },
      duration,
    });

    set((state) => ({
      projects: {
        ...state.projects,
        [projectId]: { ...state.projects[projectId], ...updatedProject },
      },
    }));
  },

  // Delete project
  deleteProject: async (projectId: string) => {
    await projectService.deleteProject(projectId);

    set((state) => {
      const newProjects = { ...state.projects };
      delete newProjects[projectId];

      return {
        projects: newProjects,
        projectIds: state.projectIds.filter((id) => id !== projectId),
        totalCount: state.totalCount - 1,
      };
    });

    cacheEvents.emit({
      type: CacheEventType.CACHE_EVICT,
      metadata: { projectId, reason: 'deleted' },
    });
  },

  // Set cover photo
  setCoverPhoto: async (projectId: string, photoId: string | null) => {
    const startTime = Date.now();
    const updatedProject = await projectService.setCoverPhoto(projectId, photoId);
    const duration = Date.now() - startTime;

    cacheEvents.emit({
      type: CacheEventType.API_CALL_SUCCESS,
      metadata: { endpoint: 'setCoverPhoto', projectId, photoId },
      duration,
    });

    set((state) => ({
      projects: {
        ...state.projects,
        [projectId]: updatedProject,
      },
    }));
  },

  // Clear all
  clearAll: () => {
    set({
      projects: {},
      projectIds: [],
      loading: {},
      error: {},
      lastFetch: null,
      totalCount: 0,
    });

    cacheEvents.emit({
      type: CacheEventType.CACHE_CLEAR,
      metadata: { scope: 'projects' },
    });
  },

  // Getters
  getProjectById: (projectId: string) => {
    return get().projects[projectId];
  },

  getAllProjects: () => {
    const state = get();
    return state.projectIds.map((id) => state.projects[id]).filter(Boolean) as Project[];
  },

  getProjectCount: () => {
    return get().totalCount;
  },
}));

export default useProjectStore;
