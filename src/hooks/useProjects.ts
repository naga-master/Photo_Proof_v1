/**
 * Project Query Hooks (TanStack Query)
 * 
 * Provides data fetching with automatic caching, deduplication,
 * and background refetching for projects/albums.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { projectService } from '../../services/projectService';
import { photoService } from '../../services/photoService';
import { mapProjectToAlbum } from '../../lib/mappers';
import type { Album, Photo } from '../../types';

// Query keys for cache management
export const projectKeys = {
    all: ['projects'] as const,
    lists: () => [...projectKeys.all, 'list'] as const,
    list: (filters: Record<string, unknown>) => [...projectKeys.lists(), filters] as const,
    details: () => [...projectKeys.all, 'detail'] as const,
    detail: (id: string) => [...projectKeys.details(), id] as const,
    photos: (id: string) => [...projectKeys.detail(id), 'photos'] as const,
};

/**
 * Fetch all projects for the authenticated user
 */
export function useProjects() {
    return useQuery({
        queryKey: projectKeys.lists(),
        queryFn: async (): Promise<Album[]> => {
            const response = await projectService.getProjects();
            const projects = response.projects || [];
            return projects.map(mapProjectToAlbum);
        },
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
}

/**
 * Fetch a single project by ID
 */
export function useProject(projectId: string | undefined) {
    return useQuery({
        queryKey: projectKeys.detail(projectId!),
        queryFn: async (): Promise<Album> => {
            const project = await projectService.getProject(projectId!);
            return mapProjectToAlbum(project);
        },
        enabled: !!projectId,
        staleTime: 5 * 60 * 1000,
    });
}

/**
 * Fetch photos for a project
 */
export function useProjectPhotos(projectId: string | undefined) {
    return useQuery({
        queryKey: projectKeys.photos(projectId!),
        queryFn: async (): Promise<Photo[]> => {
            const response = await photoService.getProjectPhotos(projectId!);
            return response.photos.map((p: any) => ({
                id: String(p.id),
                src: p.src && !p.src.startsWith('http')
                    ? `http://localhost:8000${p.src}`
                    : p.src || '',
                alt: p.original_filename || p.alt || 'Photo',
                width: p.width || 0,
                height: p.height || 0,
                comments: []
            }));
        },
        enabled: !!projectId,
        staleTime: 2 * 60 * 1000, // 2 minutes
    });
}

/**
 * Mutation for creating a new project
 */
export function useCreateProject() {
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: (data: { title: string; clientId?: string; shootDate?: string }) => 
            projectService.createProject(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
        },
    });
}

/**
 * Mutation for updating a project
 */
export function useUpdateProject() {
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) => 
            projectService.updateProject(id, data),
        onSuccess: (_, { id }) => {
            queryClient.invalidateQueries({ queryKey: projectKeys.detail(id) });
            queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
        },
    });
}

/**
 * Mutation for deleting a project
 */
export function useDeleteProject() {
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: (id: string) => projectService.deleteProject(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
        },
    });
}
