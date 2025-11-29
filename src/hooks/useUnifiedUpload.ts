/**
 * useUnifiedUpload Hook
 * 
 * React hook for the UnifiedUploadManager.
 * Use this hook in new components for cleaner upload integration.
 * 
 * Migration Path:
 * 1. New components should use this hook
 * 2. Existing UploadContext can be migrated incrementally
 */

import { useEffect, useState, useCallback } from 'react';
import { 
    unifiedUploadManager, 
    type UploadSession, 
    type UploadManagerState,
    type StartUploadOptions 
} from '../../services/UnifiedUploadManager';

export function useUnifiedUpload() {
    const [state, setState] = useState<UploadManagerState>(() => unifiedUploadManager.getState());

    useEffect(() => {
        // Initialize manager
        unifiedUploadManager.init();

        // Subscribe to state changes
        const unsubscribe = unifiedUploadManager.subscribe(setState);

        return () => {
            unsubscribe();
        };
    }, []);

    const startUpload = useCallback(async (options: StartUploadOptions) => {
        return unifiedUploadManager.startUpload(options);
    }, []);

    const pauseSession = useCallback((sessionId: string) => {
        unifiedUploadManager.pauseSession(sessionId);
    }, []);

    const resumeSession = useCallback((sessionId: string) => {
        unifiedUploadManager.resumeSession(sessionId);
    }, []);

    const cancelSession = useCallback((sessionId: string) => {
        unifiedUploadManager.cancelSession(sessionId);
    }, []);

    const retryFailed = useCallback(async (sessionId: string) => {
        await unifiedUploadManager.retryFailed(sessionId);
    }, []);

    const clearCompleted = useCallback(() => {
        unifiedUploadManager.clearCompleted();
    }, []);

    const clearAll = useCallback(() => {
        unifiedUploadManager.clearAll();
    }, []);

    const setOnComplete = useCallback((callback: (
        projectId: string,
        projectName: string,
        status: 'success' | 'partial' | 'failed'
    ) => void) => {
        unifiedUploadManager.setOnSessionComplete(callback);
    }, []);

    return {
        // State
        sessions: state.sessions,
        isActive: state.isActive,
        currentSessionId: state.currentSessionId,

        // Derived state helpers
        getSession: (sessionId: string) => state.sessions.get(sessionId) || null,
        getAllSessions: () => Array.from(state.sessions.values()),
        hasActiveUploads: state.isActive,

        // Actions
        startUpload,
        pauseSession,
        resumeSession,
        cancelSession,
        retryFailed,
        clearCompleted,
        clearAll,
        setOnComplete,
    };
}

export type { UploadSession, UploadManagerState, StartUploadOptions };
