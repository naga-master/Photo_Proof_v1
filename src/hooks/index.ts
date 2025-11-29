/**
 * Custom Hooks
 * Centralized exports for all custom hooks
 */

export { useAppData } from './useAppData';

// TanStack Query hooks
export { 
    useProjects, 
    useProject, 
    useProjectPhotos,
    useCreateProject,
    useUpdateProject,
    useDeleteProject,
    projectKeys 
} from './useProjects';

export { 
    useClients, 
    useClient,
    useCreateClient,
    useUpdateClient,
    useDeleteClient,
    clientKeys 
} from './useClients';

// Upload hooks
export { useUnifiedUpload } from './useUnifiedUpload';
export type { UploadSession, UploadManagerState, StartUploadOptions } from './useUnifiedUpload';
