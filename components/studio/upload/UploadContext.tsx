import React, { createContext, useReducer, useContext, useEffect, useCallback, useRef } from 'react';
import type { DetectedFolder, FolderMap, UploadFile, UploadRules, UploadMode, ProjectDetails, LayoutId, UploadState } from '../../../types';
import { uploadService } from '../../../services/uploadService';
import { uploadQueueManager } from '../../../services/uploadQueueManager';

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
  | { type: 'RETRY_FAILED' };

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
      return { ...state, step: Math.max(state.step - 1, 0) as UploadState['step'] };
    case 'SET_STEP':
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
  // Track if we've already initialized uploads for this session
  const uploadInitialized = React.useRef(false);
  const uploadSessionId = React.useRef<string | null>(null);

  React.useEffect(() => {
    // Only initialize uploads once when isUploading becomes true
    if (!state.isUploading) {
      uploadInitialized.current = false;
      uploadSessionId.current = null;
      return;
    }
    
    // Check if already initialized BEFORE generating session ID
    if (uploadInitialized.current) {
      // Already initialized for this upload session
      console.log('[UploadContext] Upload already initialized, skipping (session:', uploadSessionId.current, ')');
      return;
    }
    
    // Mark as initialized IMMEDIATELY to prevent duplicate runs
    uploadInitialized.current = true;
    
    // Generate session ID for logging
    if (!uploadSessionId.current) {
      uploadSessionId.current = Date.now().toString();
    }
    
    // CRITICAL: Clear queue manager from previous upload sessions
    // The queue manager is a singleton and persists across component re-renders
    console.log('[UploadContext] Clearing queue manager for new upload session');
    uploadQueueManager.clearAll();

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

    console.log('[UploadContext] ✅ INITIALIZING UPLOADS (ONE TIME)', filesToUpload.length, 'files, session:', uploadSessionId.current);

    // Set up callbacks for the queue manager
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

    // Prepare queue items from files to upload
    const queueItems = filesToUpload.map(file => {
        const folderMapping = state.folderMap.find(
            map => map.sourcePath === file.folderPath
        );
        
        return {
            id: file.id,
            file: file.file,
            projectId: state.backendProjectId!,
            folderId: folderMapping?.targetId
        };
    });

    // Add files to the queue (queue manager handles concurrency and batch operations)
    if (queueItems.length > 0) {
        console.log(`[UploadContext] 🚀 Adding ${queueItems.length} files to upload queue (session: ${uploadSessionId.current})`);
        // Note: addToQueue is now async as it fetches presigned URLs in batch
        uploadQueueManager.addToQueue(queueItems).catch(error => {
            console.error('[UploadContext] Failed to add files to queue:', error);
        });
    }

  }, [state.isUploading, state.backendProjectId, dispatch]);
  
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

  return { state, dispatch, setMode, nextStep, prevStep, setStep, resetUpload, setFiles, updateFolderMap, updateUploadRules, startUpload, pauseUpload, resumeUpload, retryFile, retryFailedUploads };
};