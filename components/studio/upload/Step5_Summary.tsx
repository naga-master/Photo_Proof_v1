

import React, { useMemo, useRef } from 'react';
import { useUpload } from './UploadContext';
import { CheckCircleIcon, XCircleIcon } from '../../icons';
import type { ProjectDetails, UploadFile, Album } from '../../../types';

interface Step5_SummaryProps {
  onExit: () => void;
  onProjectCreated: (projectDetails: Partial<ProjectDetails>, queue: UploadFile[]) => Album;
  // Fix: Updated onViewGallery prop to accept an Album object.
  onViewGallery: (album: Album) => void;
  showToast: (message: string) => void;
}

const Step5_Summary: React.FC<Step5_SummaryProps> = ({ onExit, onProjectCreated, onViewGallery, showToast }) => {
  const { state, retryFailedUploads } = useUpload();
  const { uploadQueue, projectDetails } = state;
  const createdAlbumRef = useRef<Album | null>(null);

  const { successCount, failedCount } = useMemo(() => {
    return {
      successCount: uploadQueue.filter(f => f.status === 'success').length,
      failedCount: uploadQueue.filter(f => f.status === 'failed').length,
    };
  }, [uploadQueue]);

  const failedFiles = uploadQueue.filter(f => f.status === 'failed');

  const getOrCreateAlbum = () => {
    if (!createdAlbumRef.current) {
      createdAlbumRef.current = onProjectCreated(projectDetails, uploadQueue);
    }
    return createdAlbumRef.current;
  };

  const handlePublish = () => {
    getOrCreateAlbum();
    onExit();
  };

  const handleViewGallery = () => {
    const album = getOrCreateAlbum();
    if (album) {
        onViewGallery(album);
    }
  };

  const handleNotifyClient = () => {
    showToast('Client has been notified!');
  };

  return (
    <div className="w-full max-w-2xl text-center bg-white p-8 rounded-lg border border-gray-200 animate-slide-up">
      <CheckCircleIcon className="w-16 h-16 text-green-500 mx-auto" />
      <h2 className="mt-4 text-3xl font-bold text-gray-800">Upload Complete</h2>
      <p className="mt-2 text-gray-500">
        Project "<span className="font-semibold">{projectDetails.title || 'Untitled Project'}</span>" has been processed.
      </p>

      <div className="mt-6 grid grid-cols-2 gap-4 text-left">
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <p className="font-semibold text-green-800">Successfully Uploaded</p>
              <p className="text-2xl font-bold text-green-900">{successCount} files</p>
          </div>
          <div className={`p-4 rounded-lg border ${failedCount > 0 ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'}`}>
              <p className={`font-semibold ${failedCount > 0 ? 'text-red-800' : 'text-gray-800'}`}>Failed</p>
              <p className={`text-2xl font-bold ${failedCount > 0 ? 'text-red-900' : 'text-gray-900'}`}>{failedCount} files</p>
          </div>
      </div>
        
      {failedCount > 0 && (
          <div className="mt-6 text-left">
              <h4 className="font-semibold text-gray-800">Failed Files</h4>
              <ul className="mt-2 text-sm text-gray-600 space-y-1 max-h-32 overflow-y-auto bg-gray-50 p-3 rounded-md border">
                  {failedFiles.map(f => <li key={f.id} className="flex items-center gap-2"><XCircleIcon className="w-4 h-4 text-red-500" /> {f.file.name}</li>)}
              </ul>
              <button onClick={retryFailedUploads} className="mt-2 text-sm font-semibold text-blue-600 hover:underline">Retry Failed Uploads</button>
          </div>
      )}

      <div className="mt-8 border-t pt-6">
        <h3 className="font-semibold text-gray-800">What's next?</h3>
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button onClick={handlePublish} className="p-3 bg-gray-800 text-white rounded-md font-semibold hover:bg-gray-700">Publish Project</button>
            <button onClick={handleNotifyClient} className="p-3 bg-white border border-gray-300 rounded-md font-semibold hover:bg-gray-50">Notify Client</button>
            <button onClick={handleViewGallery} className="p-3 bg-white border border-gray-300 rounded-md font-semibold hover:bg-gray-50">View Gallery</button>
        </div>
      </div>
    </div>
  );
};

export default Step5_Summary;
