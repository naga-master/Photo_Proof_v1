import React, { useState } from 'react';
import { CheckCircleIcon, CloseIcon } from '../icons';
import type { Album, Photo } from '../../types';

interface CoverPhotoChangerProps {
  project: Album;
  onUpdateCover: (newCoverSrc: string) => void;
  onClose: () => void;
}

const CoverPhotoChanger: React.FC<CoverPhotoChangerProps> = ({ project, onUpdateCover, onClose }) => {
  const [selectedPhotoSrc, setSelectedPhotoSrc] = useState<string>(project.coverPhotoSrc);

  const handleSave = () => {
    onUpdateCover(selectedPhotoSrc);
    onClose();
  };

  const photos = project.photos || [];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Change Cover Photo</h2>
            <p className="text-sm text-gray-500 mt-1">Select an image to use as the project cover</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <CloseIcon className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Photo Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          {photos.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p>No photos available in this project.</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4">
              {photos.map((photo) => {
                const isSelected = selectedPhotoSrc === photo.src;

                return (
                  <button
                    key={photo.id}
                    onClick={() => setSelectedPhotoSrc(photo.src)}
                    className={`relative aspect-square rounded-lg overflow-hidden group hover:ring-2 hover:ring-blue-400 transition-all ${
                      isSelected ? 'ring-2 ring-blue-500' : 'ring-1 ring-gray-200'
                    }`}
                    title={photo.alt}
                  >
                    <img
                      src={photo.src}
                      alt={photo.alt}
                      className="w-full h-full object-cover"
                    />
                    {isSelected && (
                      <div className="absolute inset-0 bg-blue-500/20 flex items-center justify-center">
                        <CheckCircleIcon className="w-10 h-10 text-blue-600 drop-shadow-lg" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t bg-gray-50 flex items-center justify-between">
          <p className="text-sm text-gray-600">
            {photos.length} {photos.length === 1 ? 'photo' : 'photos'} available
          </p>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-md font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!selectedPhotoSrc}
              className="px-4 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              Save Cover Photo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CoverPhotoChanger;
