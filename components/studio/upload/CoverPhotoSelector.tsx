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
  const [currentPage, setCurrentPage] = useState(1);
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());
  
  const ITEMS_PER_PAGE = 24; // 4x6 grid
  
  // Handle image load
  const handleImageLoad = (fileId: string) => {
    setLoadedImages(prev => new Set(prev).add(fileId));
  };

  // Get only successfully uploaded photos
  const successfulPhotos = useMemo(() => {
    return uploadQueue
      .map((file, index) => ({ file, originalIndex: index }))
      .filter(({ file }) => file.status === 'success');
  }, [uploadQueue]);

  // Pagination calculations
  const totalPages = Math.ceil(successfulPhotos.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentPagePhotos = successfulPhotos.slice(startIndex, endIndex);

  const selectedPhoto = selectedCoverIndex !== null 
    ? uploadQueue[selectedCoverIndex] 
    : null;

  // Generate page numbers to display (show 5 at a time)
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      // Show all pages if total is small
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Show current page with 2 pages on each side
      const startPage = Math.max(1, currentPage - 2);
      const endPage = Math.min(totalPages, currentPage + 2);
      
      if (startPage > 1) {
        pages.push(1);
        if (startPage > 2) pages.push('...');
      }
      
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
      
      if (endPage < totalPages) {
        if (endPage < totalPages - 1) pages.push('...');
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

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
          <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0 relative">
            {selectedPhoto && (
              <>
                {/* Skeleton background */}
                <div className={`absolute inset-0 bg-gray-200 transition-opacity duration-300 ${
                  loadedImages.has(selectedPhoto.id) ? 'opacity-0' : 'opacity-100'
                }`} />
                
                {/* Actual image */}
                <img
                  src={URL.createObjectURL(selectedPhoto.file)}
                  alt="Cover preview"
                  className={`w-full h-full object-cover transition-opacity duration-300 ${
                    loadedImages.has(selectedPhoto.id) ? 'opacity-100' : 'opacity-0'
                  }`}
                  onLoad={() => handleImageLoad(selectedPhoto.id)}
                />
              </>
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
          <div className="flex items-center justify-between mt-4 mb-3">
            <p className="text-sm text-gray-600">
              Select an image to use as the project cover. If you don't select one, the first image will be used automatically.
            </p>
            <span className="text-sm font-medium text-gray-500">
              {successfulPhotos.length} {successfulPhotos.length === 1 ? 'photo' : 'photos'}
            </span>
          </div>
          
          {/* Photo Grid */}
          <div className="grid grid-cols-4 sm:grid-cols-6 gap-3 max-h-64 overflow-y-auto mb-4">
            {currentPagePhotos.map(({ file, originalIndex }) => {
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
                  {/* Skeleton background with shimmer */}
                  <div className={`absolute inset-0 bg-gray-200 transition-opacity duration-300 ${
                    loadedImages.has(file.id) ? 'opacity-0' : 'opacity-100'
                  }`}>
                    <div className="absolute inset-0 overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer" />
                    </div>
                  </div>
                  
                  {/* Actual image */}
                  <img
                    src={imageUrl}
                    alt={file.file.name}
                    className={`w-full h-full object-cover transition-opacity duration-300 ${
                      loadedImages.has(file.id) ? 'opacity-100' : 'opacity-0'
                    }`}
                    onLoad={() => handleImageLoad(file.id)}
                    onError={() => console.error('[CoverPhotoSelector] Failed to load:', file.file.name)}
                  />
                  
                  {/* Selected overlay */}
                  {isSelected && (
                    <div className="absolute inset-0 bg-blue-500/20 flex items-center justify-center">
                      <CheckCircleIcon className="w-8 h-8 text-blue-600" />
                    </div>
                  )}
                  
                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                </button>
              );
            })}
          </div>

          {/* Pagination Controls - Only show if more than 1 page */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4 border-t border-gray-100">
              {/* Previous Button */}
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-2 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                aria-label="Previous page"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              {/* Page Numbers */}
              <div className="flex items-center gap-1">
                {getPageNumbers().map((page, index) => {
                  if (page === '...') {
                    return (
                      <span key={`ellipsis-${index}`} className="px-2 text-gray-400">
                        ...
                      </span>
                    );
                  }

                  const pageNum = page as number;
                  const isCurrentPage = pageNum === currentPage;

                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`min-w-[36px] h-9 px-3 rounded-md font-medium transition-colors ${
                        isCurrentPage
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              {/* Next Button */}
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="p-2 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                aria-label="Next page"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CoverPhotoSelector;
