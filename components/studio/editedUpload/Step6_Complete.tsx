import React from 'react';
import { useEditedUpload } from './EditedUploadContext';
import { CheckCircleIcon, XCircleIcon, ArrowPathIcon } from '../../icons';

interface Step6_CompleteProps {
  onClose: () => void;
  onViewGallery?: () => void;
}

const Step6_Complete: React.FC<Step6_CompleteProps> = ({ onClose, onViewGallery }) => {
  const { state, reset } = useEditedUpload();

  const successCount = state.uploadedCount;
  const failedCount = state.failedCount;
  const totalCount = state.totalFiles;
  const allSuccess = successCount === totalCount;
  const someSuccess = successCount > 0;

  const handleUploadMore = () => {
    reset();
  };

  return (
    <div className="w-full max-w-3xl">
      <div className="bg-white rounded-lg shadow-sm p-8 text-center">
        {/* Icon */}
        <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 ${
          allSuccess ? 'bg-green-100' : someSuccess ? 'bg-amber-100' : 'bg-red-100'
        }`}>
          {allSuccess ? (
            <CheckCircleIcon className="w-10 h-10 text-green-600" />
          ) : someSuccess ? (
            <XCircleIcon className="w-10 h-10 text-amber-600" />
          ) : (
            <XCircleIcon className="w-10 h-10 text-red-600" />
          )}
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold text-slate-800 mb-2">
          {allSuccess && 'Upload Complete!'}
          {someSuccess && !allSuccess && 'Upload Partially Complete'}
          {!someSuccess && 'Upload Failed'}
        </h2>

        {/* Description */}
        <p className="text-slate-600 mb-8">
          {allSuccess && `Successfully uploaded ${successCount} edited photo${successCount > 1 ? 's' : ''} as new versions.`}
          {someSuccess && !allSuccess && `Uploaded ${successCount} of ${totalCount} files. ${failedCount} upload${failedCount > 1 ? 's' : ''} failed.`}
          {!someSuccess && `Failed to upload any files. Please try again.`}
        </p>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8 max-w-md mx-auto">
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
            <p className="text-2xl font-bold text-slate-800">{totalCount}</p>
            <p className="text-xs text-slate-600 mt-1">Total</p>
          </div>
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-2xl font-bold text-green-600">{successCount}</p>
            <p className="text-xs text-green-700 mt-1">Success</p>
          </div>
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-2xl font-bold text-red-600">{failedCount}</p>
            <p className="text-xs text-red-700 mt-1">Failed</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-center gap-4">
          {onViewGallery && allSuccess && (
            <button
              onClick={onViewGallery}
              className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-md transition-colors"
            >
              View Gallery
            </button>
          )}
          {someSuccess && (
            <button
              onClick={handleUploadMore}
              className="px-6 py-3 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-medium rounded-md transition-colors flex items-center gap-2"
            >
              <ArrowPathIcon className="w-4 h-4" />
              Upload More
            </button>
          )}
          <button
            onClick={onClose}
            className={`px-6 py-3 font-medium rounded-md transition-colors ${
              allSuccess
                ? 'bg-white border border-slate-300 hover:bg-slate-50 text-slate-700'
                : 'bg-slate-800 hover:bg-slate-700 text-white'
            }`}
          >
            Close
          </button>
        </div>

        {/* Info Banner */}
        {allSuccess && (
          <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg text-left">
            <p className="text-sm text-blue-800">
              <span className="font-medium">Next steps:</span> The new versions are now available in the gallery.
              You can view version history by clicking on any photo and selecting "View Versions".
            </p>
          </div>
        )}

        {failedCount > 0 && (
          <div className="mt-8 p-4 bg-amber-50 border border-amber-200 rounded-lg text-left">
            <p className="text-sm text-amber-800">
              <span className="font-medium">Some uploads failed.</span> This could be due to network issues
              or file size limits. Please try uploading the failed files again.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Step6_Complete;
