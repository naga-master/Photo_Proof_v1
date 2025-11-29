import React, { createContext, useReducer, useContext, useEffect, useCallback, useRef } from 'react';
import type { DetectedFolder, FolderMap, UploadFile, UploadRules, UploadMode, ProjectDetails, LayoutId, UploadState } from '../../../types';
import { uploadService } from '../../../services/uploadService';
import { unifiedUploadManager } from '../../../services/UnifiedUploadManager';
import { projectService } from '../../../services/projectService';

type UploadAction =
  | { type: 'SET_MODE'; payload: UploadMode }
  | { type: 'NEXT_STEP' }
  | { type: 'PREV_STEP' }
  | { type: 'SET_STEP'; payload: number }
  | { type: 'RESET' }
  | { type: 'SET_PROJECT_DETAILS'; payload: Partial<ProjectDetails> }
  | { type: 'SET_BACKEND_PROJECT_ID'; payload: string }
  | { type: 'SET_FILES'; payload: DetectedFolder[] }
  | { type: 'UPDATE_FOLDER_MAP'; payload: FolderMap[] }
  | { type: 'UPDATE_UPLOAD_RULES'; payload: Partial<UploadRules> }
  | { type: 'START_UPLOAD' }
  | { type: 'PAUSE_UPLOAD' }
  | { type: 'RESUME_UPLOAD' }
  | { type: 'UPDATE_FILE_PROGRESS'; payload: { id: string; progress: number } }
  | { type: 'FILE_UPLOAD_SUCCESS'; payload: { fileId: string; photoId: string } }
  | { type: 'FILE_UPLOAD_FAIL'; payload: { id: string; error: string } }
  | { type: 'RETRY_FILE'; payload: string }
  | { type: 'RETRY_FAILED' }
  | { type: 'SHOW_DUPLICATE_MODAL'; payload: { type: string; message: string; data: any } }
  | { type: 'HIDE_DUPLICATE_MODAL' }
  | { type: 'UPDATE_FILE_STATUS'; payload: { id: string; error: string } };

const getInitialState = (
  initialClientId?: number, 
  defaultLayoutId?: LayoutId, 
  existingProjectId?: string
): UploadState => {
  const baseState: UploadState = {
    step: 0,
    mode: null,
    projectDetails: {
      clientId: initialClientId ? String(initialClientId) : '',
      layout: defaultLayoutId || 'layout1',
      packageId: '',
    },
    detectedFolders: [],
    folderMap: [],
    uploadRules: {
      imageSize: 'high',
      compression: 90,
      aiTagging: true,
      aiCulling: false,
    },
    uploadQueue: [],
    isUploading: false,
  };

  // If adding to existing project, pre-populate mode and project ID
  if (existingProjectId) {
    console.log('[UploadContext] ✅ Initializing with existing project ID:', existingProjectId);
    return {
      ...baseState,
      mode: 'existing',  // Set mode to existing
      backendProjectId: existingProjectId,  // Set the backend project ID
    };
  }

  return baseState;
};

const UploadContext = createContext<{
  state: UploadState;
  dispatch: React.Dispatch<UploadAction>;
} | undefined>(undefined);

const uploadReducer = (state: UploadState, action: UploadAction): UploadState => {
  switch (action.type) {
    case 'SET_MODE':
      return { ...state, mode: action.payload, step: 1 };
    case 'NEXT_STEP':
      return { ...state, step: Math.min(state.step + 1, 5) as UploadState['step'] };
    case 'PREV_STEP':
      // When going back from upload step, pause the upload to reset error state
      if (state.step === 4 && state.isUploading) {
        return { ...state, step: Math.max(state.step - 1, 0) as UploadState['step'], isUploading: false };
      }
      return { ...state, step: Math.max(state.step - 1, 0) as UploadState['step'] };
    case 'SET_STEP':
      // When navigating away from upload step, pause the upload
      if (state.step === 4 && action.payload !== 4 && state.isUploading) {
        return { ...state, step: Math.max(0, Math.min(action.payload, 5)) as UploadState['step'], isUploading: false };
      }
      return { ...state, step: Math.max(0, Math.min(action.payload, 5)) as UploadState['step'] };
    case 'RESET':
      // Clear upload manager when resetting upload context
      unifiedUploadManager.clearAll();
      return getInitialState();
    case 'SET_PROJECT_DETAILS':
        const updatedDetails = { ...state.projectDetails, ...action.payload };
        // Initialize newClientDetails when switching to 'new' client
        if (updatedDetails.clientId === 'new' && !updatedDetails.newClientDetails) {
            updatedDetails.newClientDetails = {
                firstName: '',
                lastName: '',
                email: '',
                phone: '',
                profilePicture: ''
            };
        }
        // Clear newClientDetails when switching away from 'new' client
        if (updatedDetails.clientId !== 'new' && state.projectDetails.clientId === 'new') {
            updatedDetails.newClientDetails = undefined;
        }
        return { ...state, projectDetails: updatedDetails };
    case 'SET_BACKEND_PROJECT_ID':
        return { ...state, backendProjectId: action.payload };
    case 'SET_FILES':
        const newFolders = action.payload;
        const newQueue = newFolders.flatMap(folder => 
            folder.files.map(file => ({
                id: `${file.name}-${file.lastModified}`,
                file,
                status: 'queued',
                progress: 0,
                folderPath: folder.path,  // ✅ FIX: Add folderPath for folder mapping
            } as UploadFile))
        );
        const newMap = newFolders.map(folder => ({
            sourcePath: folder.path,
            targetAlbumName: folder.path.split('/').pop() || folder.path,
        }));
        return { ...state, detectedFolders: newFolders, uploadQueue: newQueue, folderMap: newMap };
    case 'UPDATE_FOLDER_MAP':
        return { ...state, folderMap: action.payload };
    case 'UPDATE_UPLOAD_RULES':
        return { ...state, uploadRules: { ...state.uploadRules, ...action.payload } };
    case 'START_UPLOAD':
        return { ...state, isUploading: true };
    case 'PAUSE_UPLOAD':
        return { ...state, isUploading: false };
    case 'RESUME_UPLOAD':
        return { ...state, isUploading: true };
    case 'UPDATE_FILE_PROGRESS':
        return {
            ...state,
            uploadQueue: state.uploadQueue.map(f => f.id === action.payload.id ? { ...f, progress: action.payload.progress, status: 'uploading' } : f),
        };
    case 'FILE_UPLOAD_SUCCESS':
        return {
            ...state,
            uploadQueue: state.uploadQueue.map(f => 
                f.id === action.payload.fileId 
                    ? { ...f, progress: 100, status: 'success', photoId: action.payload.photoId } 
                    : f
            ),
        };
    case 'FILE_UPLOAD_FAIL':
        return {
            ...state,
            uploadQueue: state.uploadQueue.map(f => f.id === action.payload.id ? { ...f, status: 'failed', error: action.payload.error } : f),
        };
    case 'RETRY_FILE':
        return {
            ...state,
            uploadQueue: state.uploadQueue.map(f => f.id === action.payload ? { ...f, status: 'queued', progress: 0, error: undefined } : f),
        };
    case 'RETRY_FAILED':
        return {
            ...state,
            isUploading: true,
            uploadQueue: state.uploadQueue.map(f => f.status === 'failed' ? { ...f, status: 'queued', progress: 0, error: undefined } : f),
        };
    case 'SHOW_DUPLICATE_MODAL':
        console.log('[UploadContext Reducer] SHOW_DUPLICATE_MODAL action received:', action.payload);
        const newState = {
            ...state,
            duplicateModal: {
                show: true,
                type: action.payload.type,
                message: action.payload.message,
                data: action.payload.data
            }
        };
        console.log('[UploadContext Reducer] New state with modal:', newState.duplicateModal);
        return newState;
    case 'HIDE_DUPLICATE_MODAL':
        return {
            ...state,
            duplicateModal: {
                ...state.duplicateModal,
                show: false,
                type: '',
                message: '',
                data: null
            }
        };
    case 'UPDATE_FILE_STATUS':
        return {
            ...state,
            uploadQueue: state.uploadQueue.map(f => 
                f.id === action.payload.id 
                    ? { ...f, status: 'failed', error: action.payload.error } 
                    : f
            ),
        };
    default:
      return state;
  }
};

export const UploadProvider: React.FC<{ 
  children: React.ReactNode; 
  initialClientId?: number; 
  defaultLayoutId?: LayoutId;
  existingProjectId?: string;
}> = ({ children, initialClientId, defaultLayoutId, existingProjectId }) => {
  const [state, dispatch] = useReducer(uploadReducer, getInitialState(initialClientId, defaultLayoutId, existingProjectId));
  
  // CRITICAL: All refs and the upload effect MUST be in the Provider
  // NOT in useUpload hook, which is called by multiple components
  const folderMapRef = useRef(state.folderMap);
  useEffect(() => {
    folderMapRef.current = state.folderMap;
  }, [state.folderMap]);

  const folderCreationPromiseRef = useRef<Promise<FolderMap[] | null> | null>(null);
  const folderCreationFailed = useRef(false);
  const queueManagerCleared = useRef(false);

  // THE MAIN UPLOAD EFFECT - runs only once in the Provider
  useEffect(() => {
    // Reset refs when upload is stopped (isUploading becomes false)
    if (!state.isUploading) {
      folderCreationPromiseRef.current = null;
      folderCreationFailed.current = false;
      queueManagerCleared.current = false;
      return;
    }
    
    // Check if folder creation has already failed - prevent infinite retry loop
    if (folderCreationFailed.current) {
      console.log('[UploadContext] ⚠️ Folder creation previously failed, not retrying automatically');
      return;
    }
    
    // Early validation checks
    if (!state.backendProjectId) {
      console.error('[UploadContext] Cannot upload: No project ID available');
      return;
    }

    const filesToUpload = state.uploadQueue.filter(f => f.status === 'queued' || f.status === 'uploading');
    if (filesToUpload.length === 0) {
        if (state.uploadQueue.length > 0 && state.step === 4) {
             dispatch({ type: 'NEXT_STEP' });
        }
        dispatch({ type: 'PAUSE_UPLOAD' });
        return;
    }
    
    console.log('[UploadContext] 🔒 Upload effect triggered - starting uploads');

    // Define folder creation function
    // Use folderMapRef.current to avoid stale closure and prevent re-triggers
    const createFoldersIfNeeded = async () => {
      const currentFolderMap = folderMapRef.current;
      const foldersNeedingCreation = currentFolderMap.filter(f => !f.targetId);
      
      if (foldersNeedingCreation.length === 0) {
        console.log('[UploadContext] ✅ All folders already created in Step 2, skipping folder creation');
        return currentFolderMap;
      }
      
      console.log(`[UploadContext] 📁 Creating ${foldersNeedingCreation.length} folders in backend...`);
        
        try {
          // Create all folders in parallel
          const folderCreationPromises = foldersNeedingCreation.map(async (folder) => {
            try {
              const result = await projectService.createFolder(
                state.backendProjectId!,
                folder.targetAlbumName
              );
              
              // Check if it's a duplicate - use existing folder instead of failing
              if ('error' in result && result.error === 'duplicate_detected') {
                console.warn(`[UploadContext] ⚠️ Folder '${folder.targetAlbumName}' already exists in this project - using existing folder`);
                
                if ('existing_folder' in result && result.existing_folder) {
                  const existingFolder = result.existing_folder as any;
                  console.log(`[UploadContext] ✅ Using existing folder ID: ${existingFolder.id} (from duplicate response)`);
                  
                  return {
                    ...folder,
                    targetId: existingFolder.id
                  };
                } else {
                  const errorMsg = result.message || `Folder '${folder.targetAlbumName}' already exists but backend didn't provide folder ID`;
                  throw new Error(errorMsg);
                }
              }
              
              const createdFolder = result;
              console.log(`[UploadContext] ✅ Created folder: ${folder.targetAlbumName} with ID: ${createdFolder.id}`);
              
              return {
                ...folder,
                targetId: createdFolder.id
              };
            } catch (error) {
              console.error(`[UploadContext] ❌ Failed to create folder: ${folder.targetAlbumName}`, error);
              throw error;
            }
          });

          const updatedFolders = await Promise.all(folderCreationPromises);
          
          // Update the folder map with the new IDs
          const newFolderMap = currentFolderMap.map(existingFolder => {
            const updatedFolder = updatedFolders.find(
              uf => uf.sourcePath === existingFolder.sourcePath
            );
            return updatedFolder || existingFolder;
          });

          // Dispatch update to folder map
          dispatch({ type: 'UPDATE_FOLDER_MAP', payload: newFolderMap });
          
          console.log('[UploadContext] ✅ All folders created successfully');
          
          return newFolderMap;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          console.error('[UploadContext] ❌ Folder creation failed:', errorMessage);
          console.error('[UploadContext] Full error:', error);
          
          folderCreationFailed.current = true;
          
          dispatch({ type: 'PAUSE_UPLOAD' });
          
          dispatch({
            type: 'SHOW_DUPLICATE_MODAL',
            payload: {
              type: 'folder_creation_error',
              message: errorMessage,
              data: {
                action: 'Go back to Step 2 and rename or remove duplicate folders',
                details: 'Some folders you\'re trying to create already exist in this project.',
              },
            },
          });
          
          filesToUpload.forEach(file => {
            if (file.status === 'queued' || file.status === 'uploading') {
              dispatch({
                type: 'FILE_UPLOAD_FAIL',
                payload: {
                  id: file.id,
                  error: 'Folder creation failed. Please go back and fix folder names.',
                },
              });
            }
          });
          
          return null;
        }
      
      return currentFolderMap;
    };

    console.log('[UploadContext] 🆕 Initializing upload for project:', state.backendProjectId);
    console.log('[UploadContext] ✅ INITIALIZING UPLOADS', filesToUpload.length, 'files');
    
    // Clear upload manager (only once)
    if (!queueManagerCleared.current) {
      console.log('[UploadContext] Clearing upload manager');
      unifiedUploadManager.clearAll();
      queueManagerCleared.current = true;
    }

    // Store promise in ref IMMEDIATELY
    folderCreationPromiseRef.current = createFoldersIfNeeded();

    // Now await the promise
    folderCreationPromiseRef.current
      .then(updatedFolderMap => {
        if (updatedFolderMap === null) {
          console.error('[UploadContext] ❌ Cannot start uploads - folder creation failed');
          dispatch({ type: 'PAUSE_UPLOAD' });
          return;
        }
        
      // Helper to extract original file ID from session-prefixed upload ID
      // UnifiedUploadManager uses format: ${sessionId}-${filename}-${timestamp}
      // UploadContext uses format: ${filename}-${timestamp}
      // UUID format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx (36 chars)
      const extractOriginalFileId = (uploadId: string): string => {
        const uuidPrefixRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}-/i;
        return uploadId.replace(uuidPrefixRegex, '');
      };
      
      // Subscribe to UnifiedUploadManager state changes
      const unsubscribe = unifiedUploadManager.subscribe((managerState) => {
          // Get the current session
          const sessions = Array.from(managerState.sessions.values());
          const currentSession = sessions.find(s => s.projectId === state.backendProjectId);
          
          if (!currentSession) return;
          
          // Update progress for each upload
          for (const upload of currentSession.uploads.values()) {
              const originalId = extractOriginalFileId(upload.id);
              
              if (upload.status === 'uploading') {
                  dispatch({ 
                      type: 'UPDATE_FILE_PROGRESS', 
                      payload: { id: originalId, progress: upload.progress } 
                  });
              } else if (upload.status === 'completed') {
                  dispatch({ 
                      type: 'FILE_UPLOAD_SUCCESS', 
                      payload: { 
                          fileId: originalId, 
                          photoId: upload.photoId || '' 
                      } 
                  });
              } else if (upload.status === 'failed') {
                  dispatch({ 
                      type: 'FILE_UPLOAD_FAIL', 
                      payload: { 
                          id: originalId, 
                          error: upload.error || 'Upload failed'
                      }
                  });
              }
          }
          
          // Log status
          console.log('[UploadContext] Upload status:', {
              total: currentSession.totalFiles,
              completed: currentSession.completedFiles,
              failed: currentSession.failedFiles,
              progress: currentSession.overallProgress.toFixed(1) + '%'
          });
      });

      // Prepare files for upload using the updated folder map
      const filesForUpload = filesToUpload.map(file => {
          const folderMapping = updatedFolderMap.find(
              map => map.sourcePath === file.folderPath
          );
          return file.file;
      });

      // Get folder ID (use first file's folder for now)
      const firstFolderMapping = updatedFolderMap.find(
          map => map.sourcePath === filesToUpload[0]?.folderPath
      );

      // Start uploads using Unified Upload Manager
      if (filesForUpload.length > 0) {
          console.log(`[UploadContext] 🚀 Starting upload of ${filesForUpload.length} files for project ${state.backendProjectId}`);
          
          const managerState = unifiedUploadManager.getState();
          console.log('[UploadContext] 🔍 UnifiedUploadManager state before startUploads:', {
              isActive: managerState.isActive,
              sessionsCount: managerState.sessions.size
          });
          
          console.log('[UploadContext] 📞 Calling unifiedUploadManager.startUpload()...');
          unifiedUploadManager.startUpload({
              files: filesForUpload,
              projectId: state.backendProjectId!,
              projectName: state.projectDetails.title || 'Untitled Project',
              folderId: firstFolderMapping?.targetId,
          }).then(() => {
              console.log('[UploadContext] ✅ unifiedUploadManager.startUpload() completed successfully');
          }).catch(error => {
              console.error('[UploadContext] ❌ Failed to start uploads:', error);
          });
      }
    })
    .catch(error => {
      console.error('[UploadContext] ❌ Unexpected error in upload flow:', error);
      dispatch({ type: 'PAUSE_UPLOAD' });
    });
    // NOTE: folderMap is intentionally NOT in dependencies to prevent re-runs
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.isUploading, state.backendProjectId]);
  
  return <UploadContext.Provider value={{ state, dispatch }}>{children}</UploadContext.Provider>;
};

export const useUpload = () => {
  const context = useContext(UploadContext);
  if (context === undefined) {
    throw new Error('useUpload must be used within an UploadProvider');
  }
  const { state, dispatch } = context;

  // NOTE: The upload effect is now in UploadProvider, not here
  // This prevents multiple instances of the effect running from different components
  
  const setMode = useCallback((mode: UploadMode) => dispatch({ type: 'SET_MODE', payload: mode }), [dispatch]);
  const nextStep = useCallback(() => dispatch({ type: 'NEXT_STEP' }), [dispatch]);
  const prevStep = useCallback(() => dispatch({ type: 'PREV_STEP' }), [dispatch]);
  const setStep = useCallback((step: number) => dispatch({ type: 'SET_STEP', payload: step }), [dispatch]);
  const resetUpload = useCallback(() => dispatch({ type: 'RESET' }), [dispatch]);
  const setFiles = useCallback((folders: DetectedFolder[]) => dispatch({ type: 'SET_FILES', payload: folders }), [dispatch]);
  const updateFolderMap = useCallback((map: FolderMap[]) => dispatch({ type: 'UPDATE_FOLDER_MAP', payload: map }), [dispatch]);
  const updateUploadRules = useCallback((rules: Partial<UploadRules>) => dispatch({ type: 'UPDATE_UPLOAD_RULES', payload: rules }), [dispatch]);
  const startUpload = useCallback(() => dispatch({ type: 'START_UPLOAD' }), [dispatch]);
  const pauseUpload = useCallback(() => {
    // Pause current session in unified manager
    const managerState = unifiedUploadManager.getState();
    if (managerState.currentSessionId) {
      unifiedUploadManager.pauseSession(managerState.currentSessionId);
    }
    dispatch({ type: 'PAUSE_UPLOAD' });
  }, [dispatch]);
  const resumeUpload = useCallback(() => {
    // Resume current session in unified manager
    const managerState = unifiedUploadManager.getState();
    if (managerState.currentSessionId) {
      unifiedUploadManager.resumeSession(managerState.currentSessionId);
    }
    dispatch({ type: 'RESUME_UPLOAD' });
  }, [dispatch]);
  const retryFile = useCallback((id: string) => {
    // Retry is handled at session level in unified manager
    dispatch({ type: 'RETRY_FILE', payload: id });
  }, [dispatch]);
  const retryFailedUploads = useCallback(() => {
    // Retry failed uploads in current session
    const managerState = unifiedUploadManager.getState();
    if (managerState.currentSessionId) {
      unifiedUploadManager.retryFailed(managerState.currentSessionId);
    }
    dispatch({ type: 'RETRY_FAILED' });
  }, [dispatch]);
  const cancelFile = useCallback((id: string) => {
    // Cancel is handled at session level in unified manager
    // Individual file cancellation not directly supported, handled via UI
  }, []);

  return { state, dispatch, setMode, nextStep, prevStep, setStep, resetUpload, setFiles, updateFolderMap, updateUploadRules, startUpload, pauseUpload, resumeUpload, retryFile, retryFailedUploads, cancelFile };
};