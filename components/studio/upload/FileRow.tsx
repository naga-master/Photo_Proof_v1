import React from 'react';
import type { UploadFile } from '../../../types';
import { useUpload } from './UploadContext';
import { CheckCircleIcon, FolderIcon, UploadCloudIcon, ArrowPathIcon } from '../../icons';

interface FileRowProps {
  file: UploadFile;
}

const FileRow: React.FC<FileRowProps> = ({ file }) => {
  const { retryFile, resumeUpload, cancelFile, state } = useUpload();
  const { status, progress, file: fileData, error } = file;
  const { isUploading } = state;

  const handleRetry = () => {
    if (!isUploading) {
      resumeUpload();
    }
    retryFile(file.id);
  }

  const handleCancel = () => {
    if (window.confirm(`Cancel upload of "${fileData.name}"?`)) {
      cancelFile(file.id);
    }
  }

  // Check if this is a duplicate error (non-retryable)
  const isDuplicate = error && (
    error.includes('Duplicate') || 
    error.includes('duplicate') ||
    error.includes('already exists')
  );
  
  // Show retry button for failed uploads or uploads that appear stuck
  // But not for duplicates (those should be skipped/removed)
  const showRetryButton = !isDuplicate && (status === 'failed' || (status === 'uploading' && progress === 0 && error));
  const showSkipButton = isDuplicate && status === 'failed';

  const renderStatus = () => {
    switch (status) {
      case 'success':
        return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
      case 'failed':
        if (showSkipButton) {
          // Duplicate - show skip/remove button
          return (
            <button 
              onClick={handleCancel} 
              className="p-1 rounded-md bg-yellow-50 hover:bg-yellow-100 text-yellow-600 hover:text-yellow-700 transition-colors" 
              aria-label="Skip duplicate"
              title="Skip this duplicate file"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          );
        }
        // Regular failure - show retry button
        return (
          <button 
            onClick={handleRetry} 
            className="p-1 rounded-md bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700 transition-colors" 
            aria-label="Retry upload"
            title="Retry upload"
          >
            <ArrowPathIcon className="w-5 h-5" />
          </button>
        );
      case 'uploading':
        // Show retry button if upload is stuck (0% with error)
        if (showRetryButton) {
          return (
            <button 
              onClick={handleRetry} 
              className="p-1 rounded-md bg-yellow-50 hover:bg-yellow-100 text-yellow-600 hover:text-yellow-700 transition-colors" 
              aria-label="Retry stuck upload"
              title="Retry upload"
            >
              <ArrowPathIcon className="w-5 h-5" />
            </button>
          );
        }
        return <UploadCloudIcon className="w-5 h-5 text-blue-500 animate-pulse" />;
      default: // queued
        return <FolderIcon className="w-5 h-5 text-gray-400" />;
    }
  };

  return (
    <div className={`p-3 rounded-md border transition-colors ${
      status === 'failed' 
        ? 'bg-red-50 border-red-200' 
        : 'bg-gray-50 border-gray-200'
    }`}>
      <div className="flex items-center gap-4">
        <div className={`w-10 h-10 rounded-md flex items-center justify-center flex-shrink-0 ${
          status === 'failed' ? 'bg-red-100' : 'bg-gray-200'
        }`}>
          <FolderIcon className={`w-6 h-6 ${status === 'failed' ? 'text-red-500' : 'text-gray-500'}`} />
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium truncate ${status === 'failed' ? 'text-red-800' : 'text-gray-800'}`}>
            {fileData.name}
          </p>
          <p className="text-xs text-gray-500">{(fileData.size / 1024 / 1024).toFixed(2)} MB</p>
        </div>
        <div className="w-24 text-center">
          <p className={`text-sm font-medium ${status === 'failed' ? 'text-red-600' : 'text-gray-600'}`}>
            {Math.round(progress)}%
          </p>
        </div>
        <div className="w-6 flex items-center justify-center">{renderStatus()}</div>
      </div>
      {status !== 'queued' && (
        <div className="mt-2 pl-14">
            <div className="w-full bg-gray-200 rounded-full h-1.5">
                <div 
                    className={`h-1.5 rounded-full transition-all duration-200 ${
                      status === 'failed' ? 'bg-red-500' : 
                      status === 'success' ? 'bg-green-500' : 
                      'bg-primary'
                    }`} 
                    style={{ width: `${progress}%` }}
                ></div>
            </div>
        </div>
      )}
      {error && (
        <div className="mt-2 pl-14 flex items-center gap-2">
          <p className={`text-xs flex-1 ${isDuplicate ? 'text-yellow-600' : 'text-red-600'}`}>{error}</p>
          {!isDuplicate && (
            <button
              onClick={handleRetry}
              className="text-xs font-medium text-red-600 hover:text-red-700 underline whitespace-nowrap"
            >
              Retry
            </button>
          )}
          <button
            onClick={handleCancel}
            className={`text-xs font-medium underline whitespace-nowrap ${
              isDuplicate 
                ? 'text-yellow-600 hover:text-yellow-700' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {isDuplicate ? 'Skip' : 'Remove'}
          </button>
        </div>
      )}
      {/* Show cancel button for failed uploads without error message */}
      {status === 'failed' && !error && (
        <div className="mt-2 pl-14 flex items-center gap-2">
          <p className="text-xs text-red-600 flex-1">Upload failed</p>
          <button
            onClick={handleRetry}
            className="text-xs font-medium text-red-600 hover:text-red-700 underline whitespace-nowrap"
          >
            Retry
          </button>
          <button
            onClick={handleCancel}
            className="text-xs font-medium text-gray-500 hover:text-gray-700 underline whitespace-nowrap"
          >
            Remove
          </button>
        </div>
      )}
    </div>
  );
};

export default React.memo(FileRow);