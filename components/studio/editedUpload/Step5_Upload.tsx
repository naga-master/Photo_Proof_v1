import React, { useEffect, useState } from 'react';
import { useEditedUpload } from './EditedUploadContext';
import { versionService } from '../../../services/versionService';
import { CheckCircleIcon, XCircleIcon, CameraIcon } from '../../icons';

const Step5_Upload: React.FC = () => {
  const { state, dispatch, nextStep } = useEditedUpload();

  useEffect(() => {
    if (!state.isUploading && state.uploadQueue.length > 0) {
      startUpload();
    }
  }, []);

  const startUpload = async () => {
    dispatch({ type: 'START_UPLOAD' });

    // Prepare mappings for batch creation
    const mappings = state.uploadQueue.map(item => {
      const filename = item.file.name;
      const versionLabel = state.versionLabels.get(filename);
      
      return {
        photo_id: Number(item.photoId),
        file_metadata: {
          filename: item.file.name,
          content_type: item.file.type,
          file_size: item.file.size,
        },
        version_label: versionLabel || undefined,
        mapping_type: state.matchedPairs.some(p => p.editedFile.name === filename) ? 'auto' : 'manual',
      };
    });

    try {
      // Get presigned URLs for uploads
      const uploadTokens = await versionService.createVersionsBatch({ mappings });

      // Upload each file
      for (let i = 0; i < uploadTokens.length; i++) {
        const token = uploadTokens[i];
        const uploadFile = state.uploadQueue[i];

        try {
          // Upload with progress tracking
          await versionService.uploadToPresignedUrl(
            uploadFile.file,
            token.upload_url,
            (progress) => {
              dispatch({
                type: 'UPDATE_FILE_PROGRESS',
                payload: { id: uploadFile.id, progress },
              });
            }
          );

          // Mark as success
          dispatch({ type: 'FILE_UPLOAD_SUCCESS', payload: uploadFile.id });
        } catch (error: any) {
          console.error(`[Step5_Upload] Upload failed for ${uploadFile.file.name}:`, error);
          dispatch({
            type: 'FILE_UPLOAD_FAIL',
            payload: { id: uploadFile.id, error: error.message || 'Upload failed' },
          });
        }
      }

      // All uploads complete - move to next step
      setTimeout(() => {
        nextStep();
      }, 1000);
    } catch (error: any) {
      console.error('[Step5_Upload] Batch creation failed:', error);
      // Mark all as failed
      state.uploadQueue.forEach(item => {
        dispatch({
          type: 'FILE_UPLOAD_FAIL',
          payload: { id: item.id, error: error.message || 'Upload preparation failed' },
        });
      });
    }
  };

  const successCount = state.uploadQueue.filter(f => f.status === 'success').length;
  const failedCount = state.uploadQueue.filter(f => f.status === 'failed').length;
  const uploadingCount = state.uploadQueue.filter(f => f.status === 'uploading').length;
  const queuedCount = state.uploadQueue.filter(f => f.status === 'queued').length;
  const totalCount = state.uploadQueue.length;
  const progressPercent = totalCount > 0 ? Math.round((successCount / totalCount) * 100) : 0;

  return (
    <div className="w-full max-w-4xl">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Uploading Versions</h2>
        <p className="text-slate-600 mb-6">
          Please wait while we upload your edited photos
        </p>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-700">Overall Progress</span>
            <span className="text-sm font-bold text-slate-800">{progressPercent}%</span>
          </div>
          <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-600 transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className="flex items-center justify-between mt-2 text-xs text-slate-600">
            <span>{successCount} of {totalCount} completed</span>
            {failedCount > 0 && (
              <span className="text-red-600">{failedCount} failed</span>
            )}
          </div>
        </div>

        {/* Status Summary */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-center">
            <p className="text-2xl font-bold text-slate-800">{totalCount}</p>
            <p className="text-xs text-slate-600 mt-1">Total</p>
          </div>
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-center">
            <p className="text-2xl font-bold text-green-600">{successCount}</p>
            <p className="text-xs text-green-700 mt-1">Success</p>
          </div>
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-center">
            <p className="text-2xl font-bold text-blue-600">{uploadingCount + queuedCount}</p>
            <p className="text-xs text-blue-700 mt-1">Pending</p>
          </div>
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-center">
            <p className="text-2xl font-bold text-red-600">{failedCount}</p>
            <p className="text-xs text-red-700 mt-1">Failed</p>
          </div>
        </div>

        {/* File List */}
        <div className="space-y-2 max-h-[400px] overflow-y-auto">
          {state.uploadQueue.map(item => (
            <UploadFileRow key={item.id} file={item} />
          ))}
        </div>
      </div>
    </div>
  );
};

interface UploadFileRowProps {
  file: {
    id: string;
    file: File;
    status: 'queued' | 'uploading' | 'success' | 'failed';
    progress: number;
    error?: string;
  };
}

const UploadFileRow: React.FC<UploadFileRowProps> = ({ file }) => {
  const [thumbnail, setThumbnail] = useState<string | null>(null);

  useEffect(() => {
    const reader = new FileReader();
    reader.onload = (e) => {
      setThumbnail(e.target?.result as string);
    };
    reader.readAsDataURL(file.file);
  }, [file.file]);

  return (
    <div className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-lg">
      {/* Thumbnail */}
      <div className="flex-shrink-0 w-12 h-12 bg-slate-100 rounded overflow-hidden">
        {thumbnail ? (
          <img src={thumbnail} alt={file.file.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <CameraIcon className="w-6 h-6 text-slate-400" />
          </div>
        )}
      </div>

      {/* File Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-800 truncate">{file.file.name}</p>
        {file.status === 'uploading' && (
          <div className="mt-1">
            <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 transition-all duration-300"
                style={{ width: `${file.progress}%` }}
              />
            </div>
            <p className="text-xs text-slate-500 mt-0.5">{file.progress}%</p>
          </div>
        )}
        {file.status === 'queued' && (
          <p className="text-xs text-slate-500 mt-0.5">Waiting...</p>
        )}
        {file.status === 'failed' && file.error && (
          <p className="text-xs text-red-600 mt-0.5">{file.error}</p>
        )}
      </div>

      {/* Status Icon */}
      <div className="flex-shrink-0">
        {file.status === 'success' && (
          <CheckCircleIcon className="w-5 h-5 text-green-600" />
        )}
        {file.status === 'uploading' && (
          <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        )}
        {file.status === 'failed' && (
          <XCircleIcon className="w-5 h-5 text-red-600" />
        )}
      </div>
    </div>
  );
};

export default Step5_Upload;
