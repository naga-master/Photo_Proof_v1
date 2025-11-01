import React, { useState, useMemo } from 'react';
import { CheckCircleIcon } from '../../icons';
import type { UploadFile } from '../../../types';

interface CoverPhotoSelectorProps {
  uploadQueue: UploadFile[];
  selectedCoverIndex: number | null;
  onSelectCover: (index: number) => void;
}

const CoverPhotoSelector: React.FC<CoverPhotoSelectorProps> = ({ 
  uploadQueue, 
  selectedCoverIndex, 
  onSelectCover 
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Get only successfully uploaded photos
  const successfulPhotos = useMemo(() => {
    return uploadQueue
      .map((file, index) => ({ file, originalIndex: index }))
      .filter(({ file }) => file.status === 'success');
  }, [uploadQueue]);

  const selectedPhoto = selectedCoverIndex !== null 
    ? uploadQueue[selectedCoverIndex] 
    : null;

  if (successfulPhotos.length === 0) {
    return null;
  }

  return (
    <div className="w-full max-w-2xl mt-6 bg-white border border-gray-200 rounded-lg">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
            {selectedPhoto && (
              <img
                src={URL.createObjectURL(selectedPhoto.file)}
                alt="Cover preview"
                className="w-full h-full object-cover"
              />
            )}
          </div>
          <div>
            <h3 className="font-semibold text-gray-800">
              Cover Photo {selectedPhoto ? 'Selected' : 'Not Selected'}
            </h3>
            <p className="text-sm text-gray-500">
              {selectedPhoto 
                ? selectedPhoto.file.name 
                : 'Click to select a cover photo (optional)'}
            </p>
          </div>
        </div>
        <svg
          className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isExpanded && (
        <div className="px-6 pb-6 border-t border-gray-100">
          <p className="text-sm text-gray-600 mt-4 mb-3">
            Select an image to use as the project cover. If you don't select one, the first image will be used automatically.
          </p>
          <div className="grid grid-cols-4 sm:grid-cols-6 gap-3 max-h-64 overflow-y-auto">
            {successfulPhotos.map(({ file, originalIndex }) => {
              const isSelected = selectedCoverIndex === originalIndex;
              const imageUrl = URL.createObjectURL(file.file);

              return (
                <button
                  key={file.id}
                  onClick={() => onSelectCover(originalIndex)}
                  className={`relative aspect-square rounded-lg overflow-hidden group hover:ring-2 hover:ring-blue-400 transition-all ${
                    isSelected ? 'ring-2 ring-blue-500' : 'ring-1 ring-gray-200'
                  }`}
                  title={file.file.name}
                >
                  <img
                    src={imageUrl}
                    alt={file.file.name}
                    className="w-full h-full object-cover"
                  />
                  {isSelected && (
                    <div className="absolute inset-0 bg-blue-500/20 flex items-center justify-center">
                      <CheckCircleIcon className="w-8 h-8 text-blue-600" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default CoverPhotoSelector;
