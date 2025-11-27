/**
 * Upload Status Widget
 * 
 * Global draggable widget showing upload progress on all pages.
 * Features:
 * - Minimize/expand states
 * - Real-time progress updates
 * - Pause/resume/cancel controls
 * - Individual file progress view
 * - Draggable positioning
 * - Visible across all page navigations
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useDragControls, PanInfo } from 'framer-motion';
import { globalUploadManager, type GlobalUploadState } from '../services/globalUploadManager';

export const UploadStatusWidget: React.FC = () => {
  const [state, setState] = useState<GlobalUploadState | null>(null);
  const [isExpanded, setIsExpanded] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const dragControls = useDragControls();
  const constraintsRef = useRef(null);

  useEffect(() => {
    // Subscribe to upload state changes
    const unsubscribe = globalUploadManager.subscribe((newState) => {
      setState(newState);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Don't show widget if no active uploads
  if (!state || !state.isActive) {
    return null;
  }

  const handlePauseResume = () => {
    if (state.isPaused) {
      globalUploadManager.resumeUploads();
    } else {
      globalUploadManager.pauseUploads();
    }
  };

  const handleCancel = () => {
    if (confirm('Are you sure you want to cancel all uploads?')) {
      globalUploadManager.cancelUploads();
    }
  };

  const handleRetryFailed = () => {
    globalUploadManager.retryFailed();
  };

  const toggleMinimize = () => {
    setIsMinimized(!isMinimized);
    if (isMinimized) {
      setIsExpanded(true); // Restore to expanded when unminimizing
    }
  };

  const uploadsArray = Array.from(state.uploads.values());
  const uploadingFiles = uploadsArray.filter(u => u.status === 'uploading');
  const currentFile = uploadingFiles[0]?.fileName || state.currentFile;

  return (
    <motion.div
      ref={constraintsRef}
      style={{
        position: 'fixed',
        bottom: 20,
        right: 20,
        zIndex: 9999,
        pointerEvents: 'none',
      }}
    >
      <motion.div
        drag
        dragControls={dragControls}
        dragMomentum={false}
        dragElastic={0}
        onDragEnd={(event, info: PanInfo) => {
          setPosition({ x: info.offset.x, y: info.offset.y });
        }}
        style={{
          x: position.x,
          y: position.y,
          pointerEvents: 'auto',
        }}
        className="bg-white rounded-lg shadow-2xl border border-gray-200 overflow-hidden"
        initial={{ opacity: 0, scale: 0.8, y: 100 }}
        animate={{ 
          opacity: 1, 
          scale: 1, 
          y: 0,
          width: isMinimized ? 280 : (isExpanded ? 400 : 320),
          height: isMinimized ? 'auto' : (isExpanded ? 'auto' : 'auto')
        }}
        exit={{ opacity: 0, scale: 0.8, y: 100 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        {/* Header - Always visible */}
        <div 
          className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-3 cursor-move flex items-center justify-between"
          onPointerDown={(e) => dragControls.start(e)}
        >
          <div className="flex items-center gap-2 flex-1">
            <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-sm">
                Uploading {state.completedFiles}/{state.totalFiles} files
              </div>
              {!isMinimized && (
                <div className="text-xs opacity-90 truncate">
                  {Math.round(state.overallProgress)}% complete
                  {state.isPaused && ' (Paused)'}
                </div>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1 hover:bg-white/20 rounded transition-colors"
              title={isExpanded ? 'Collapse' : 'Expand'}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isExpanded ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                )}
              </svg>
            </button>
            <button
              onClick={toggleMinimize}
              className="p-1 hover:bg-white/20 rounded transition-colors"
              title={isMinimized ? 'Restore' : 'Minimize'}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
              </svg>
            </button>
          </div>
        </div>

        {/* Body - Collapsible */}
        <AnimatePresence>
          {!isMinimized && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {/* Progress Bar */}
              <div className="p-3 bg-gray-50">
                <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                  <motion.div
                    className="bg-blue-600 h-2 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${state.overallProgress}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
                
                {currentFile && (
                  <div className="text-xs text-gray-600 truncate">
                    Current: {currentFile}
                  </div>
                )}
                
                {state.failedFiles > 0 && (
                  <div className="text-xs text-red-600 mt-1">
                    {state.failedFiles} failed
                  </div>
                )}
              </div>

              {/* Expanded Details */}
              {isExpanded && (
                <div className="p-3 border-t border-gray-200 max-h-64 overflow-y-auto">
                  <div className="text-xs font-semibold text-gray-700 mb-2">Upload Details</div>
                  <div className="space-y-2">
                    {uploadsArray.slice(0, 10).map((upload) => (
                      <div key={upload.id} className="flex items-center gap-2 text-xs">
                        <div className="flex-shrink-0">
                          {upload.status === 'completed' ? (
                            <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                          ) : upload.status === 'failed' ? (
                            <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                          ) : upload.status === 'uploading' ? (
                            <svg className="w-4 h-4 text-blue-500 animate-spin" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                          ) : (
                            <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="truncate text-gray-700">{upload.fileName}</div>
                          {upload.status === 'uploading' && (
                            <div className="w-full bg-gray-200 rounded-full h-1 mt-1">
                              <div
                                className="bg-blue-500 h-1 rounded-full transition-all"
                                style={{ width: `${upload.progress}%` }}
                              />
                            </div>
                          )}
                          {upload.error && (
                            <div className="text-red-500 text-xs mt-0.5">{upload.error}</div>
                          )}
                        </div>
                        <div className="text-gray-500 text-xs">
                          {upload.progress}%
                        </div>
                      </div>
                    ))}
                    {uploadsArray.length > 10 && (
                      <div className="text-xs text-gray-500 text-center pt-2">
                        + {uploadsArray.length - 10} more files
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="p-3 border-t border-gray-200 flex items-center gap-2">
                <button
                  onClick={handlePauseResume}
                  className="flex-1 px-3 py-1.5 text-sm font-medium text-white bg-gray-700 hover:bg-gray-800 rounded transition-colors flex items-center justify-center gap-1"
                >
                  {state.isPaused ? (
                    <>
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                      </svg>
                      Resume
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      Pause
                    </>
                  )}
                </button>
                
                {state.failedFiles > 0 && (
                  <button
                    onClick={handleRetryFailed}
                    className="px-3 py-1.5 text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 rounded transition-colors"
                    title="Retry failed uploads"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </button>
                )}
                
                <button
                  onClick={handleCancel}
                  className="px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded transition-colors"
                  title="Cancel all uploads"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
};
