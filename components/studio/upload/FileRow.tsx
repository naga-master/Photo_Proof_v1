import React from 'react';
import type { UploadFile } from '../../../types';
import { useUpload } from './UploadContext';
import { CheckCircleIcon, FolderIcon, UploadCloudIcon, ArrowPathIcon } from '../../icons';

interface FileRowProps {
  file: UploadFile;
}

const FileRow: React.FC<FileRowProps> = ({ file }) => {
  const { retryFile, resumeUpload, state } = useUpload();
  const { status, progress, file: fileData, error } = file;
  const { isUploading } = state;

  const handleRetry = () => {
    if (!isUploading) {
      resumeUpload();
    }
    retryFile(file.id);
  }

  const renderStatus = () => {
    switch (status) {
      case 'success':
        return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
      case 'failed':
        return (
          <button onClick={handleRetry} className="text-gray-500 hover:text-gray-800 transition-colors" aria-label="Retry upload">
            <ArrowPathIcon className="w-5 h-5" />
          </button>
        );
      case 'uploading':
        return <UploadCloudIcon className="w-5 h-5 text-blue-500 animate-pulse" />;
      default: // queued
        return <FolderIcon className="w-5 h-5 text-gray-400" />;
    }
  };

  return (
    <div className="p-3 bg-gray-50 rounded-md border border-gray-200">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 bg-gray-200 rounded-md flex items-center justify-center flex-shrink-0">
          <FolderIcon className="w-6 h-6 text-gray-500" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-800 truncate">{fileData.name}</p>
          <p className="text-xs text-gray-500">{(fileData.size / 1024 / 1024).toFixed(2)} MB</p>
        </div>
        <div className="w-24 text-center">
          <p className={`text-sm font-medium ${status === 'failed' ? 'text-red-500' : 'text-gray-600'}`}>{Math.round(progress)}%</p>
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
                      'bg-blue-600'
                    }`} 
                    style={{ width: `${progress}%` }}
                ></div>
            </div>
        </div>
      )}
      {error && <p className="text-xs text-red-500 mt-1 pl-14">{error}</p>}
    </div>
  );
};

export default React.memo(FileRow);