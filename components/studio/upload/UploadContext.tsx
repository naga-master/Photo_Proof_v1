import React, { createContext, useReducer, useContext, useEffect, useCallback, useRef } from 'react';
import type { DetectedFolder, FolderMap, UploadFile, UploadRules, UploadMode, ProjectDetails, LayoutId, UploadState } from '../../../types';
import { uploadService } from '../../../services/uploadService';

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

const getInitialState = (initialClientId?: number, defaultLayoutId?: LayoutId): UploadState => ({
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
});

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
      return getInitialState();
    case 'SET_PROJECT_DETAILS':
        return { ...state, projectDetails: { ...state.projectDetails, ...action.payload } };
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

export const UploadProvider: React.FC<{ children: React.ReactNode, initialClientId?: number, defaultLayoutId?: LayoutId }> = ({ children, initialClientId, defaultLayoutId }) => {
  const [state, dispatch] = useReducer(uploadReducer, getInitialState(initialClientId, defaultLayoutId));
  return <UploadContext.Provider value={{ state, dispatch }}>{children}</UploadContext.Provider>;
};

export const useUpload = () => {
  const context = useContext(UploadContext);
  if (context === undefined) {
    throw new Error('useUpload must be used within an UploadProvider');
  }
  const { state, dispatch } = context;

  // Real upload logic using backend API
  React.useEffect(() => {
    if (!state.isUploading) return;
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

    const activeUploads = state.uploadQueue.filter(f => f.status === 'uploading').length;
    const maxConcurrent = 3;
    const filesToStart = filesToUpload.slice(0, maxConcurrent - activeUploads);

    filesToStart.forEach(file => {
        if (file.status !== 'uploading') {
            const performRealUpload = async () => {
                try {
                    console.log(`[UploadContext] Starting upload for: ${file.file.name}`);
                    
                    // Get folder ID from folder mapping
                    const folderMapping = state.folderMap.find(
                        map => map.sourcePath === file.folderPath
                    );
                    const folderId = folderMapping?.targetId;

                    // Upload file with real progress tracking using backend project ID
                    const photoResponse = await uploadService.uploadWithProgress(
                        file.file,
                        state.backendProjectId!,
                        folderId,
                        (progress) => {
                            dispatch({ 
                                type: 'UPDATE_FILE_PROGRESS', 
                                payload: { id: file.id, progress } 
                            });
                        }
                    );

                    console.log(`[UploadContext] Upload complete for: ${file.file.name}`, photoResponse);
                    dispatch({ 
                        type: 'FILE_UPLOAD_SUCCESS', 
                        payload: { 
                            fileId: file.id, 
                            photoId: photoResponse.id 
                        } 
                    });
                    
                } catch (error: any) {
                    console.error(`[UploadContext] Upload failed for: ${file.file.name}`, error);
                    dispatch({ 
                        type: 'FILE_UPLOAD_FAIL', 
                        payload: { 
                            id: file.id, 
                            error: error.message || 'Upload failed' 
                        }
                    });
                }
            };
            
            performRealUpload();
        }
    });

  }, [state.isUploading, state.uploadQueue, state.step, state.backendProjectId, state.folderMap, dispatch, context.state.isUploading]);
  
  const setMode = useCallback((mode: UploadMode) => dispatch({ type: 'SET_MODE', payload: mode }), [dispatch]);
  const nextStep = useCallback(() => dispatch({ type: 'NEXT_STEP' }), [dispatch]);
  const prevStep = useCallback(() => dispatch({ type: 'PREV_STEP' }), [dispatch]);
  const setStep = useCallback((step: number) => dispatch({ type: 'SET_STEP', payload: step }), [dispatch]);
  const resetUpload = useCallback(() => dispatch({ type: 'RESET' }), [dispatch]);
  const setFiles = useCallback((folders: DetectedFolder[]) => dispatch({ type: 'SET_FILES', payload: folders }), [dispatch]);
  const updateFolderMap = useCallback((map: FolderMap[]) => dispatch({ type: 'UPDATE_FOLDER_MAP', payload: map }), [dispatch]);
  const updateUploadRules = useCallback((rules: Partial<UploadRules>) => dispatch({ type: 'UPDATE_UPLOAD_RULES', payload: rules }), [dispatch]);
  const startUpload = useCallback(() => dispatch({ type: 'START_UPLOAD' }), [dispatch]);
  const pauseUpload = useCallback(() => dispatch({ type: 'PAUSE_UPLOAD' }), [dispatch]);
  const resumeUpload = useCallback(() => dispatch({ type: 'RESUME_UPLOAD' }), [dispatch]);
  const retryFile = useCallback((id: string) => dispatch({ type: 'RETRY_FILE', payload: id }), [dispatch]);
  const retryFailedUploads = useCallback(() => dispatch({ type: 'RETRY_FAILED' }), [dispatch]);

  return { state, dispatch, setMode, nextStep, prevStep, setStep, resetUpload, setFiles, updateFolderMap, updateUploadRules, startUpload, pauseUpload, resumeUpload, retryFile, retryFailedUploads };
};