import React, { createContext, useReducer, useContext, useCallback } from 'react';
import type { UploadFile } from '../../../types';

export interface MatchedPair {
  editedFile: File;
  photoId: number;
  originalFilename: string;
  confidence: number;
  matchReason: string;
}

export interface EditedUploadState {
  step: 0 | 1 | 2 | 3 | 4 | 5;
  projectId: string;
  projectTitle: string;
  
  // Step 1: File selection
  editedFiles: File[];
  
  // Step 2: Auto-matching
  matchedPairs: MatchedPair[];
  unmatchedFiles: File[];
  
  // Step 3: Manual mapping
  manualMappings: Map<string, number>;  // filename -> photo_id
  skippedFiles: Set<string>;  // filenames that user chose to skip
  
  // Version labels (optional)
  versionLabels: Map<string, string>;  // filename -> label
  
  // Step 4: Upload queue
  uploadQueue: UploadFile[];
  isUploading: boolean;
  
  // Stats
  totalFiles: number;
  uploadedCount: number;
  failedCount: number;
}

type EditedUploadAction =
  | { type: 'SET_PROJECT'; payload: { id: string; title: string } }
  | { type: 'SET_STEP'; payload: number }
  | { type: 'NEXT_STEP' }
  | { type: 'PREV_STEP' }
  | { type: 'SET_EDITED_FILES'; payload: File[] }
  | { type: 'REMOVE_EDITED_FILE'; payload: string }
  | { type: 'ADD_EDITED_FILES'; payload: File[] }
  | { type: 'SET_MATCHED_PAIRS'; payload: MatchedPair[] }
  | { type: 'SET_UNMATCHED_FILES'; payload: File[] }
  | { type: 'ADD_MANUAL_MAPPING'; payload: { filename: string; photoId: number } }
  | { type: 'REMOVE_MANUAL_MAPPING'; payload: string }
  | { type: 'SKIP_FILE'; payload: string }
  | { type: 'UNSKIP_FILE'; payload: string }
  | { type: 'SET_VERSION_LABEL'; payload: { filename: string; label: string } }
  | { type: 'REMOVE_VERSION_LABEL'; payload: string }
  | { type: 'PREPARE_UPLOAD_QUEUE' }
  | { type: 'START_UPLOAD' }
  | { type: 'PAUSE_UPLOAD' }
  | { type: 'UPDATE_FILE_PROGRESS'; payload: { id: string; progress: number } }
  | { type: 'FILE_UPLOAD_SUCCESS'; payload: string }
  | { type: 'FILE_UPLOAD_FAIL'; payload: { id: string; error: string } }
  | { type: 'RESET' };

const getInitialState = (projectId: string, projectTitle: string): EditedUploadState => ({
  step: 0,
  projectId,
  projectTitle,
  editedFiles: [],
  matchedPairs: [],
  unmatchedFiles: [],
  manualMappings: new Map(),
  skippedFiles: new Set(),
  versionLabels: new Map(),
  uploadQueue: [],
  isUploading: false,
  totalFiles: 0,
  uploadedCount: 0,
  failedCount: 0,
});

const EditedUploadContext = createContext<{
  state: EditedUploadState;
  dispatch: React.Dispatch<EditedUploadAction>;
} | undefined>(undefined);

const editedUploadReducer = (state: EditedUploadState, action: EditedUploadAction): EditedUploadState => {
  switch (action.type) {
    case 'SET_PROJECT':
      return { ...state, projectId: action.payload.id, projectTitle: action.payload.title };
    
    case 'SET_STEP':
      return { ...state, step: Math.max(0, Math.min(action.payload, 5)) as EditedUploadState['step'] };
    
    case 'NEXT_STEP':
      return { ...state, step: Math.min(state.step + 1, 5) as EditedUploadState['step'] };
    
    case 'PREV_STEP':
      return { ...state, step: Math.max(state.step - 1, 0) as EditedUploadState['step'] };
    
    case 'SET_EDITED_FILES':
      return { ...state, editedFiles: action.payload };
    
    case 'REMOVE_EDITED_FILE': {
      const filename = action.payload;
      const newFiles = state.editedFiles.filter(f => f.name !== filename);
      const newManualMappings = new Map(state.manualMappings);
      newManualMappings.delete(filename);
      const newVersionLabels = new Map(state.versionLabels);
      newVersionLabels.delete(filename);
      const newSkippedFiles = new Set(state.skippedFiles);
      newSkippedFiles.delete(filename);
      
      return {
        ...state,
        editedFiles: newFiles,
        manualMappings: newManualMappings,
        versionLabels: newVersionLabels,
        skippedFiles: newSkippedFiles,
      };
    }
    
    case 'ADD_EDITED_FILES':
      return { ...state, editedFiles: [...state.editedFiles, ...action.payload] };
    
    case 'SET_MATCHED_PAIRS':
      return { ...state, matchedPairs: action.payload };
    
    case 'SET_UNMATCHED_FILES':
      return { ...state, unmatchedFiles: action.payload };
    
    case 'ADD_MANUAL_MAPPING': {
      const newMappings = new Map(state.manualMappings);
      newMappings.set(action.payload.filename, action.payload.photoId);
      // Remove from unmatched list
      const newUnmatched = state.unmatchedFiles.filter(f => f.name !== action.payload.filename);
      return { ...state, manualMappings: newMappings, unmatchedFiles: newUnmatched };
    }
    
    case 'REMOVE_MANUAL_MAPPING': {
      const newMappings = new Map(state.manualMappings);
      newMappings.delete(action.payload);
      // Add back to unmatched if the file still exists
      const file = state.editedFiles.find(f => f.name === action.payload);
      const newUnmatched = file && !state.unmatchedFiles.some(f => f.name === action.payload)
        ? [...state.unmatchedFiles, file]
        : state.unmatchedFiles;
      return { ...state, manualMappings: newMappings, unmatchedFiles: newUnmatched };
    }
    
    case 'SKIP_FILE': {
      const newSkippedFiles = new Set(state.skippedFiles);
      newSkippedFiles.add(action.payload);
      // Remove from unmatched list
      const newUnmatched = state.unmatchedFiles.filter(f => f.name !== action.payload);
      return { ...state, skippedFiles: newSkippedFiles, unmatchedFiles: newUnmatched };
    }
    
    case 'UNSKIP_FILE': {
      const newSkippedFiles = new Set(state.skippedFiles);
      newSkippedFiles.delete(action.payload);
      // Add back to unmatched if the file still exists
      const file = state.editedFiles.find(f => f.name === action.payload);
      const newUnmatched = file && !state.unmatchedFiles.some(f => f.name === action.payload)
        ? [...state.unmatchedFiles, file]
        : state.unmatchedFiles;
      return { ...state, skippedFiles: newSkippedFiles, unmatchedFiles: newUnmatched };
    }
    
    case 'SET_VERSION_LABEL': {
      const newLabels = new Map(state.versionLabels);
      newLabels.set(action.payload.filename, action.payload.label);
      return { ...state, versionLabels: newLabels };
    }
    
    case 'REMOVE_VERSION_LABEL': {
      const newLabels = new Map(state.versionLabels);
      newLabels.delete(action.payload);
      return { ...state, versionLabels: newLabels };
    }
    
    case 'PREPARE_UPLOAD_QUEUE': {
      // Combine matched pairs and manual mappings into upload queue
      const queue: UploadFile[] = [];
      
      // Add matched pairs
      state.matchedPairs.forEach(pair => {
        queue.push({
          id: `${pair.editedFile.name}-${Date.now()}`,
          file: pair.editedFile,
          status: 'queued',
          progress: 0,
          photoId: String(pair.photoId),
        });
      });
      
      // Add manual mappings
      state.manualMappings.forEach((photoId, filename) => {
        const file = state.editedFiles.find(f => f.name === filename);
        if (file) {
          queue.push({
            id: `${filename}-${Date.now()}`,
            file,
            status: 'queued',
            progress: 0,
            photoId: String(photoId),
          });
        }
      });
      
      return {
        ...state,
        uploadQueue: queue,
        totalFiles: queue.length,
        uploadedCount: 0,
        failedCount: 0,
      };
    }
    
    case 'START_UPLOAD':
      return { ...state, isUploading: true };
    
    case 'PAUSE_UPLOAD':
      return { ...state, isUploading: false };
    
    case 'UPDATE_FILE_PROGRESS':
      return {
        ...state,
        uploadQueue: state.uploadQueue.map(f =>
          f.id === action.payload.id
            ? { ...f, progress: action.payload.progress, status: 'uploading' as const }
            : f
        ),
      };
    
    case 'FILE_UPLOAD_SUCCESS':
      return {
        ...state,
        uploadQueue: state.uploadQueue.map(f =>
          f.id === action.payload ? { ...f, status: 'success' as const, progress: 100 } : f
        ),
        uploadedCount: state.uploadedCount + 1,
      };
    
    case 'FILE_UPLOAD_FAIL':
      return {
        ...state,
        uploadQueue: state.uploadQueue.map(f =>
          f.id === action.payload.id
            ? { ...f, status: 'failed' as const, error: action.payload.error }
            : f
        ),
        failedCount: state.failedCount + 1,
      };
    
    case 'RESET':
      return getInitialState(state.projectId, state.projectTitle);
    
    default:
      return state;
  }
};

export const EditedUploadProvider: React.FC<{
  children: React.ReactNode;
  projectId: string;
  projectTitle: string;
}> = ({ children, projectId, projectTitle }) => {
  const [state, dispatch] = useReducer(
    editedUploadReducer,
    getInitialState(projectId, projectTitle)
  );
  
  return (
    <EditedUploadContext.Provider value={{ state, dispatch }}>
      {children}
    </EditedUploadContext.Provider>
  );
};

export const useEditedUpload = () => {
  const context = useContext(EditedUploadContext);
  if (context === undefined) {
    throw new Error('useEditedUpload must be used within an EditedUploadProvider');
  }
  
  const { state, dispatch } = context;
  
  // Helper functions
  const setStep = useCallback((step: number) => {
    dispatch({ type: 'SET_STEP', payload: step });
  }, [dispatch]);
  
  const nextStep = useCallback(() => {
    dispatch({ type: 'NEXT_STEP' });
  }, [dispatch]);
  
  const prevStep = useCallback(() => {
    dispatch({ type: 'PREV_STEP' });
  }, [dispatch]);
  
  const setEditedFiles = useCallback((files: File[]) => {
    dispatch({ type: 'SET_EDITED_FILES', payload: files });
  }, [dispatch]);
  
  const addEditedFiles = useCallback((files: File[]) => {
    dispatch({ type: 'ADD_EDITED_FILES', payload: files });
  }, [dispatch]);
  
  const removeEditedFile = useCallback((filename: string) => {
    dispatch({ type: 'REMOVE_EDITED_FILE', payload: filename });
  }, [dispatch]);
  
  const setMatchedPairs = useCallback((pairs: MatchedPair[]) => {
    dispatch({ type: 'SET_MATCHED_PAIRS', payload: pairs });
  }, [dispatch]);
  
  const setUnmatchedFiles = useCallback((files: File[]) => {
    dispatch({ type: 'SET_UNMATCHED_FILES', payload: files });
  }, [dispatch]);
  
  const addManualMapping = useCallback((filename: string, photoId: number) => {
    dispatch({ type: 'ADD_MANUAL_MAPPING', payload: { filename, photoId } });
  }, [dispatch]);
  
  const removeManualMapping = useCallback((filename: string) => {
    dispatch({ type: 'REMOVE_MANUAL_MAPPING', payload: filename });
  }, [dispatch]);
  
  const skipFile = useCallback((filename: string) => {
    dispatch({ type: 'SKIP_FILE', payload: filename });
  }, [dispatch]);
  
  const unskipFile = useCallback((filename: string) => {
    dispatch({ type: 'UNSKIP_FILE', payload: filename });
  }, [dispatch]);
  
  const setVersionLabel = useCallback((filename: string, label: string) => {
    dispatch({ type: 'SET_VERSION_LABEL', payload: { filename, label } });
  }, [dispatch]);
  
  const removeVersionLabel = useCallback((filename: string) => {
    dispatch({ type: 'REMOVE_VERSION_LABEL', payload: filename });
  }, [dispatch]);
  
  const prepareUploadQueue = useCallback(() => {
    dispatch({ type: 'PREPARE_UPLOAD_QUEUE' });
  }, [dispatch]);
  
  const startUpload = useCallback(() => {
    dispatch({ type: 'START_UPLOAD' });
  }, [dispatch]);
  
  const pauseUpload = useCallback(() => {
    dispatch({ type: 'PAUSE_UPLOAD' });
  }, [dispatch]);
  
  const reset = useCallback(() => {
    dispatch({ type: 'RESET' });
  }, [dispatch]);
  
  return {
    state,
    dispatch,
    setStep,
    nextStep,
    prevStep,
    setEditedFiles,
    addEditedFiles,
    removeEditedFile,
    setMatchedPairs,
    setUnmatchedFiles,
    addManualMapping,
    removeManualMapping,
    skipFile,
    unskipFile,
    setVersionLabel,
    removeVersionLabel,
    prepareUploadQueue,
    startUpload,
    pauseUpload,
    reset,
  };
};
