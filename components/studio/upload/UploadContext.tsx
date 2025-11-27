import React, { createContext, useReducer, useContext, useEffect, useCallback, useRef } from 'react';
import type { DetectedFolder, FolderMap, UploadFile, UploadRules, UploadMode, ProjectDetails, LayoutId, UploadState } from '../../../types';
import { uploadService } from '../../../services/uploadService';
import { uploadQueueManager } from '../../../services/uploadQueueManager';
import { globalUploadManager } from '../../../services/globalUploadManager';
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
      // Clear queue manager when resetting upload context
      uploadQueueManager.clearAll();
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
  return <UploadContext.Provider value={{ state, dispatch }}>{children}</UploadContext.Provider>;
};

export const useUpload = () => {
  const context = useContext(UploadContext);
  if (context === undefined) {
    throw new Error('useUpload must be used within an UploadProvider');
  }
  const { state, dispatch } = context;

  // Real upload logic using backend API
  // SESSION-LEVEL GUARD: Track whether uploads have started for THIS upload session
  // This prevents re-runs even after promise completes
  const uploadsStartedRef = React.useRef(false);
  const folderCreationPromiseRef = React.useRef<Promise<FolderMap[] | null> | null>(null);
  const folderCreationFailed = React.useRef(false);
  const queueManagerCleared = React.useRef(false);

  React.useEffect(() => {
    // Reset all refs when upload is stopped (isUploading becomes false)
    if (!state.isUploading) {
      uploadsStartedRef.current = false;
      folderCreationPromiseRef.current = null;
      folderCreationFailed.current = false;
      queueManagerCleared.current = false;
      return;
    }
    
    // CRITICAL: Session-level guard - if uploads already started, DO NOT run again
    // This is different from promise check - it persists even after promise completes
    if (uploadsStartedRef.current) {
      console.log('[UploadContext] ⏭️ Uploads already started for this session, skipping');
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
    
    // MARK UPLOADS AS STARTED IMMEDIATELY - This is the critical guard
    // Must be SYNCHRONOUS and happen BEFORE any async work
    uploadsStartedRef.current = true;
    console.log('[UploadContext] 🔒 Upload session started - blocking further effect runs');

    // Define folder creation function
    const createFoldersIfNeeded = async () => {
      const foldersNeedingCreation = state.folderMap.filter(f => !f.targetId);
      
      if (foldersNeedingCreation.length === 0) {
        console.log('[UploadContext] ✅ All folders already created in Step 2, skipping folder creation');
        return state.folderMap;
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
              // Backend ensures duplicates are scoped to THIS project only
              if ('error' in result && result.error === 'duplicate_detected') {
                console.warn(`[UploadContext] ⚠️ Folder '${folder.targetAlbumName}' already exists in this project - using existing folder`);
                
                // Extract existing folder info from error response
                if ('existing_folder' in result && result.existing_folder) {
                  const existingFolder = result.existing_folder as any;
                  console.log(`[UploadContext] ✅ Using existing folder ID: ${existingFolder.id} (from duplicate response)`);
                  
                  // Return folder map with existing folder's ID
                  return {
                    ...folder,
                    targetId: existingFolder.id
                  };
                } else {
                  // Backend should always include existing_folder in 409 response
                  // If not, throw error as we can't proceed safely
                  const errorMsg = result.message || `Folder '${folder.targetAlbumName}' already exists but backend didn't provide folder ID`;
                  throw new Error(errorMsg);
                }
              }
              
              const createdFolder = result;
              console.log(`[UploadContext] ✅ Created folder: ${folder.targetAlbumName} with ID: ${createdFolder.id}`);
              
              // Update folder map with the new ID
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
          const newFolderMap = state.folderMap.map(existingFolder => {
            const updatedFolder = updatedFolders.find(
              uf => uf.sourcePath === existingFolder.sourcePath
            );
            return updatedFolder || existingFolder;
          });

          // Dispatch update to folder map
          dispatch({ type: 'UPDATE_FOLDER_MAP', payload: newFolderMap });
          
          console.log('[UploadContext] ✅ All folders created successfully');
          
          // Return the updated folder map for immediate use
          return newFolderMap;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          console.error('[UploadContext] ❌ Folder creation failed:', errorMessage);
          console.error('[UploadContext] Full error:', error);
          
          // Mark folder creation as failed to prevent infinite retry loop
          folderCreationFailed.current = true;
          
          dispatch({ type: 'PAUSE_UPLOAD' });
          
          // Show user-friendly error modal
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
          
          // Mark all files as failed with a helpful error message
          state.uploadQueue.forEach(file => {
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
          
          // Return null to signal failure
          return null;
        }
      
      return state.folderMap;
    };

    // ATOMIC OPERATION: Create and store promise immediately
    // This MUST happen synchronously with no gap for race conditions
    console.log('[UploadContext] 🆕 Initializing upload for project:', state.backendProjectId);
    console.log('[UploadContext] ✅ INITIALIZING UPLOADS', filesToUpload.length, 'files');
    
    // Clear queue manager (only once)
    if (!queueManagerCleared.current) {
      console.log('[UploadContext] Clearing queue manager');
      uploadQueueManager.clearAll();
      queueManagerCleared.current = true;
    }

    // Store promise in ref IMMEDIATELY
    folderCreationPromiseRef.current = createFoldersIfNeeded();

    // Now await the promise
    folderCreationPromiseRef.current
      .then(updatedFolderMap => {
        // Check if folder creation failed
        if (updatedFolderMap === null) {
          console.error('[UploadContext] ❌ Cannot start uploads - folder creation failed');
          console.error('[UploadContext] User should go back and fix folder names');
          
          // Keep initialization flag set to prevent retry loop
          // User must manually reset by going back to previous step
          
          // Stop the upload
          dispatch({ type: 'PAUSE_UPLOAD' });
          return;
        }
      // Step 1: Set up callbacks for the queue manager
      uploadQueueManager.setCallbacks({
          onProgress: (uploadId, progress) => {
              dispatch({ 
                  type: 'UPDATE_FILE_PROGRESS', 
                  payload: { id: uploadId, progress } 
              });
          },
          onSuccess: (uploadId, result) => {
              console.log(`[UploadContext] Upload complete for file ID: ${uploadId}`, result);
              dispatch({ 
                  type: 'FILE_UPLOAD_SUCCESS', 
                  payload: { 
                      fileId: uploadId, 
                      photoId: result.id 
                  } 
              });
          },
          onError: (uploadId, error) => {
              console.error(`[UploadContext] Upload failed for file ID: ${uploadId}`, error);
              dispatch({ 
                  type: 'FILE_UPLOAD_FAIL', 
                  payload: { 
                      id: uploadId, 
                      error: error || 'Upload failed'
                  }
              });
          },
          onQueueUpdate: (queue) => {
              const status = uploadQueueManager.getStatus();
              console.log('[UploadContext] Queue status:', status);
          }
      });

      // Step 2: Prepare queue items from files to upload using the updated folder map
      const queueItems = filesToUpload.map(file => {
          const folderMapping = updatedFolderMap.find(
              map => map.sourcePath === file.folderPath
          );
          
          return {
              id: file.id,
              file: file.file,
              projectId: state.backendProjectId!,
              folderId: folderMapping?.targetId
          };
      });

      // Step 3: Start uploads using Global Upload Manager
      if (queueItems.length > 0) {
          console.log(`[UploadContext] 🚀 Starting upload of ${queueItems.length} files for project ${state.backendProjectId}`);
          
          // Extract files and metadata for globalUploadManager
          const filesWithFolders = queueItems.map(item => ({
              file: item.file,
              folderId: item.folderId,
          }));
          
          // CRITICAL: Check if GlobalUploadManager is initialized
          const managerState = globalUploadManager.getState();
          console.log('[UploadContext] 🔍 GlobalUploadManager state before startUploads:', {
              isActive: managerState.isActive,
              isPaused: managerState.isPaused,
              totalFiles: managerState.totalFiles
          });
          
          // Use Global Upload Manager instead of uploadQueueManager directly
          // This enables navigation resilience and background upload capability
          console.log('[UploadContext] 📞 Calling globalUploadManager.startUploads()...');
          globalUploadManager.startUploads({
              files: filesWithFolders.map(f => f.file),
              projectId: state.backendProjectId!,
              folderId: filesWithFolders[0]?.folderId, // Use first folder ID if available
          }).then(() => {
              console.log('[UploadContext] ✅ globalUploadManager.startUploads() completed successfully');
              const newState = globalUploadManager.getState();
              console.log('[UploadContext] 🔍 GlobalUploadManager state after startUploads:', {
                  isActive: newState.isActive,
                  isPaused: newState.isPaused,
                  totalFiles: newState.totalFiles,
                  uploads: newState.uploads.size
              });
          }).catch(error => {
              console.error('[UploadContext] ❌ Failed to start uploads with Global Upload Manager:', error);
              console.error('[UploadContext] Error details:', {
                  message: error?.message,
                  stack: error?.stack,
                  error: error
              });
          });
      }
    })
    .catch(error => {
      console.error('[UploadContext] ❌ Unexpected error in upload flow:', error);
      
      // Stop the upload
      dispatch({ type: 'PAUSE_UPLOAD' });
    })
    // NOTE: We intentionally do NOT reset uploadsStartedRef here
    // It will be reset when isUploading becomes false (user starts new upload session)

  }, [state.isUploading, state.backendProjectId, state.folderMap, dispatch]);
  
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
    uploadQueueManager.pauseAll();
    dispatch({ type: 'PAUSE_UPLOAD' });
  }, [dispatch]);
  const resumeUpload = useCallback(() => {
    uploadQueueManager.resumeAll();
    dispatch({ type: 'RESUME_UPLOAD' });
  }, [dispatch]);
  const retryFile = useCallback((id: string) => {
    uploadQueueManager.retryUpload(id);
    dispatch({ type: 'RETRY_FILE', payload: id });
  }, [dispatch]);
  const retryFailedUploads = useCallback(() => {
    uploadQueueManager.retryAllFailed();
    dispatch({ type: 'RETRY_FAILED' });
  }, [dispatch]);
  const cancelFile = useCallback((id: string) => {
    uploadQueueManager.cancelUpload(id);
    // File will be removed from queue, no need to dispatch
  }, []);

  return { state, dispatch, setMode, nextStep, prevStep, setStep, resetUpload, setFiles, updateFolderMap, updateUploadRules, startUpload, pauseUpload, resumeUpload, retryFile, retryFailedUploads, cancelFile };
};