import React, { createContext, useContext, useReducer, useCallback } from 'react';
import type { UploadState, UploadMode, UploadFile, DetectedFolder, FolderMap, UploadRules, ProjectDetails } from '../../../types';

type UploadAction =
  | { type: 'SET_MODE'; payload: UploadMode }
  | { type: 'NEXT_STEP' }
  | { type: 'PREV_STEP' }
  | { type: 'RESET' }
  | { type: 'SET_PROJECT_DETAILS'; payload: Partial<ProjectDetails> }
  | { type: 'SET_FILES'; payload: DetectedFolder[] }
  | { type: 'UPDATE_FOLDER_MAP'; payload: FolderMap[] }
  | { type: 'UPDATE_UPLOAD_RULES'; payload: Partial<UploadRules> }
  | { type: 'START_UPLOAD' }
  | { type: 'PAUSE_UPLOAD' }
  | { type: 'RESUME_UPLOAD' }
  | { type: 'UPDATE_FILE_PROGRESS'; payload: { id: string; progress: number } }
  | { type: 'FILE_UPLOAD_SUCCESS'; payload: string }
  | { type: 'FILE_UPLOAD_FAIL'; payload: { id: string; error: string } }
  | { type: 'RETRY_FILE'; payload: string }
  | { type: 'RETRY_FAILED' };

const getInitialState = (initialClientId?: number): UploadState => ({
  step: 0,
  mode: null,
  projectDetails: {
    clientId: initialClientId ? String(initialClientId) : '',
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
    case 'RESET':
      return getInitialState();
    case 'SET_PROJECT_DETAILS':
        return { ...state, projectDetails: { ...state.projectDetails, ...action.payload } };
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
            uploadQueue: state.uploadQueue.map(f => f.id === action.payload ? { ...f, progress: 100, status: 'success' } : f),
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

export const UploadProvider: React.FC<{ children: React.ReactNode, initialClientId?: number }> = ({ children, initialClientId }) => {
  const [state, dispatch] = useReducer(uploadReducer, getInitialState(initialClientId));
  return <UploadContext.Provider value={{ state, dispatch }}>{children}</UploadContext.Provider>;
};

export const useUpload = () => {
  const context = useContext(UploadContext);
  if (context === undefined) {
    throw new Error('useUpload must be used within an UploadProvider');
  }
  const { state, dispatch } = context;

  // Mock upload logic
  React.useEffect(() => {
    if (!state.isUploading) return;

    const filesToUpload = state.uploadQueue.filter(f => f.status === 'queued' || f.status === 'uploading');
    if (filesToUpload.length === 0) {
        // All done
        if (state.uploadQueue.length > 0 && state.step === 4) {
             dispatch({ type: 'NEXT_STEP' });
        }
        dispatch({ type: 'PAUSE_UPLOAD' });
        return;
    }

    // Simulate uploading a few files at a time
    const activeUploads = state.uploadQueue.filter(f => f.status === 'uploading').length;
    const filesToStart = filesToUpload.slice(0, 3 - activeUploads);

    filesToStart.forEach(file => {
        if (file.status !== 'uploading') {
            const simulateUpload = () => {
                let progress = file.progress;
                dispatch({ type: 'UPDATE_FILE_PROGRESS', payload: { id: file.id, progress } });
                
                const interval = setInterval(() => {
                    if (!context.state.isUploading) { // check if paused
                        clearInterval(interval);
                        return;
                    }
                    progress += Math.random() * 20;
                    if (progress >= 100) {
                        progress = 100;
                        clearInterval(interval);
                        if (Math.random() > 0.1) { // 10% chance of failure
                           dispatch({ type: 'FILE_UPLOAD_SUCCESS', payload: file.id });
                        } else {
                           dispatch({ type: 'FILE_UPLOAD_FAIL', payload: { id: file.id, error: 'Network error' }});
                        }
                    }
                    dispatch({ type: 'UPDATE_FILE_PROGRESS', payload: { id: file.id, progress } });
                }, 200);
            };
            simulateUpload();
        }
    });

  }, [state.isUploading, state.uploadQueue, state.step, dispatch, context.state.isUploading]);
  
  const setMode = useCallback((mode: UploadMode) => dispatch({ type: 'SET_MODE', payload: mode }), [dispatch]);
  const nextStep = useCallback(() => dispatch({ type: 'NEXT_STEP' }), [dispatch]);
  const prevStep = useCallback(() => dispatch({ type: 'PREV_STEP' }), [dispatch]);
  const resetUpload = useCallback(() => dispatch({ type: 'RESET' }), [dispatch]);
  const setFiles = useCallback((folders: DetectedFolder[]) => dispatch({ type: 'SET_FILES', payload: folders }), [dispatch]);
  const updateFolderMap = useCallback((map: FolderMap[]) => dispatch({ type: 'UPDATE_FOLDER_MAP', payload: map }), [dispatch]);
  const updateUploadRules = useCallback((rules: Partial<UploadRules>) => dispatch({ type: 'UPDATE_UPLOAD_RULES', payload: rules }), [dispatch]);
  const startUpload = useCallback(() => dispatch({ type: 'START_UPLOAD' }), [dispatch]);
  const pauseUpload = useCallback(() => dispatch({ type: 'PAUSE_UPLOAD' }), [dispatch]);
  const resumeUpload = useCallback(() => dispatch({ type: 'RESUME_UPLOAD' }), [dispatch]);
  const retryFile = useCallback((id: string) => dispatch({ type: 'RETRY_FILE', payload: id }), [dispatch]);
  const retryFailedUploads = useCallback(() => dispatch({ type: 'RETRY_FAILED' }), [dispatch]);

  return { state, dispatch, setMode, nextStep, prevStep, resetUpload, setFiles, updateFolderMap, updateUploadRules, startUpload, pauseUpload, resumeUpload, retryFile, retryFailedUploads };
};
