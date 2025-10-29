import React, { createContext, useContext, useState, useReducer, ReactNode, useCallback, useRef, useEffect } from 'react';
import type { UploadContextType, UploadState, UploadFile, UploadFileStatus, UploadMode, ProjectDetails, UploadRules, FolderMap } from '../../../types';

const initialState: UploadState = {
  step: 0,
  mode: null,
  projectDetails: {
    title: '',
    client: '',
    shootDate: new Date().toISOString().split('T')[0],
    tags: '',
    layoutPreset: 'Modern Masonry',
    accessType: 'private',
    watermark: 'default',
  },
  detectedFolders: [],
  folderMap: [],
  uploadRules: {
    imageSize: 'high',
    compression: 80,
    applyWatermark: true,
    aiTagging: false,
    aiCulling: false,
  },
  uploadQueue: [],
  isUploading: false,
};

const UploadContext = createContext<UploadContextType | undefined>(undefined);

export const UploadProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [state, setState] = useState<UploadState>(initialState);
    // FIX: Replaced NodeJS.Timeout with a browser-compatible type for setInterval's return value.
    const uploadInterval = useRef<ReturnType<typeof setInterval> | null>(null);

    const nextStep = useCallback(() => setState(s => ({ ...s, step: s.step + 1 })), []);
    const prevStep = useCallback(() => setState(s => ({ ...s, step: Math.max(0, s.step - 1) })), []);
    const goToStep = useCallback((step: number) => setState(s => ({ ...s, step })), []);
    const setMode = useCallback((mode: UploadMode) => setState(s => ({ ...s, mode, step: 1 })), []);
    const updateProjectDetails = useCallback((details: Partial<ProjectDetails>) => setState(s => ({...s, projectDetails: {...s.projectDetails, ...details}})), []);
    const updateUploadRules = useCallback((rules: Partial<UploadRules>) => setState(s => ({...s, uploadRules: {...s.uploadRules, ...rules}})), []);
    const updateFolderMap = useCallback((map: FolderMap[]) => setState(s => ({...s, folderMap: map})), []);

    const setFiles = useCallback((folders: { path: string, files: File[] }[]) => {
        setState(s => ({
            ...s,
            detectedFolders: folders,
            folderMap: folders.map(f => ({ sourcePath: f.path, targetAlbumName: f.path.split('/').pop() || f.path }))
        }));
    }, []);

    const resetUpload = useCallback(() => setState(initialState), []);

    const updateFileStatus = (fileId: string, status: UploadFileStatus, progress?: number, error?: string) => {
        setState(prevState => ({
            ...prevState,
            uploadQueue: prevState.uploadQueue.map(f =>
                f.id === fileId ? { ...f, status, progress: progress ?? f.progress, error: error ?? f.error } : f
            ),
        }));
    };
    
    const processQueue = useCallback(() => {
       if (uploadInterval.current) clearInterval(uploadInterval.current);

       uploadInterval.current = setInterval(() => {
            setState(prevState => {
                if (!prevState.isUploading) {
                    if (uploadInterval.current) clearInterval(uploadInterval.current);
                    return prevState;
                }

                const newQueue = [...prevState.uploadQueue];
                let changed = false;
                
                // Find up to 3 files to "upload"
                const uploadingFiles = newQueue.filter(f => f.status === 'uploading');
                let slots = 3 - uploadingFiles.length;

                for (const file of newQueue) {
                    if (slots > 0 && file.status === 'queued') {
                        file.status = 'uploading';
                        slots--;
                        changed = true;
                    }
                }

                for (const file of newQueue) {
                    if (file.status === 'uploading') {
                        file.progress += Math.random() * 20;
                        if (file.progress >= 100) {
                            file.progress = 100;
                            // Randomly fail 10% of files
                            if (Math.random() < 0.1) {
                                file.status = 'failed';
                                file.error = 'Network Error';
                            } else {
                                file.status = 'success';
                            }
                        }
                        changed = true;
                    }
                }
                
                const isStillUploading = newQueue.some(f => f.status === 'uploading' || f.status === 'queued');
                if (!isStillUploading && prevState.isUploading) {
                    if (uploadInterval.current) clearInterval(uploadInterval.current);
                     setTimeout(() => nextStep(), 1000);
                    return { ...prevState, uploadQueue: newQueue, isUploading: false };
                }

                return changed ? { ...prevState, uploadQueue: newQueue } : prevState;
            });
        }, 500);
    }, [nextStep]);


    const startUpload = useCallback(() => {
        setState(prevState => {
            const queue: UploadFile[] = prevState.detectedFolders.flatMap(folder =>
                folder.files.map(file => {
                    const map = prevState.folderMap.find(m => m.sourcePath === folder.path);
                    return {
                        id: `${file.name}-${file.size}-${file.lastModified}`,
                        file,
                        status: 'queued',
                        progress: 0,
                        sourcePath: folder.path,
                        mappedAlbumName: map?.targetAlbumName,
                    };
                })
            );
            return { ...prevState, uploadQueue: queue, isUploading: true, step: 4 };
        });
    }, []);

    useEffect(() => {
        if(state.isUploading) {
            processQueue();
        } else {
            if(uploadInterval.current) clearInterval(uploadInterval.current);
        }
        return () => {
            if(uploadInterval.current) clearInterval(uploadInterval.current);
        }
    }, [state.isUploading, processQueue]);

    const pauseUpload = useCallback(() => setState(s => ({...s, isUploading: false })), []);
    const resumeUpload = useCallback(() => setState(s => ({...s, isUploading: true })), []);

    const retryFile = useCallback((fileId: string) => {
        setState(prevState => ({
            ...prevState,
            uploadQueue: prevState.uploadQueue.map(f =>
                f.id === fileId ? { ...f, status: 'queued', progress: 0, error: undefined } : f
            ),
        }));
    }, []);

    const cancelFile = useCallback((fileId: string) => {
         setState(prevState => ({
            ...prevState,
            uploadQueue: prevState.uploadQueue.filter(f => f.id !== fileId),
        }));
    }, []);

    const value: UploadContextType = {
        state,
        nextStep,
        prevStep,
        goToStep,
        setMode,
        updateProjectDetails,
        setFiles,
        updateFolderMap,
        updateUploadRules,
        startUpload,
        pauseUpload,
        resumeUpload,
        retryFile,
        cancelFile,
        resetUpload,
    };

    return <UploadContext.Provider value={value}>{children}</UploadContext.Provider>;
};

export const useUpload = (): UploadContextType => {
  const context = useContext(UploadContext);
  if (!context) {
    throw new Error('useUpload must be used within an UploadProvider');
  }
  return context;
};
