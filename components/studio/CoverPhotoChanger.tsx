import React, { useState, useEffect } from 'react';
import { CheckCircleIcon, CloseIcon } from '../icons';
import type { Album, Photo } from '../../types';
import { photoService, getPhotoVariantUrl } from '../../services/photoService';
import { projectService } from '../../services/projectService';
import { toast } from 'react-toastify';

interface CoverPhotoChangerProps {
  project: Album;
  onUpdateCover: (newCoverSrc: string) => void;
  onClose: () => void;
}

// Shimmer animation styles
const shimmerStyles = `
  @keyframes shimmer {
    0% {
      transform: translateX(-100%);
    }
    100% {
      transform: translateX(100%);
    }
  }
  .animate-shimmer {
    animation: shimmer 2s infinite;
  }
`;

const CoverPhotoChanger: React.FC<CoverPhotoChangerProps> = ({ project, onUpdateCover, onClose }) => {
  const [selectedPhotoSrc, setSelectedPhotoSrc] = useState<string>(project.coverPhotoSrc);
  const [selectedPhotoId, setSelectedPhotoId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());
  
  const ITEMS_PER_PAGE = 30; // 5x6 grid
  
  // Handle image load
  const handleImageLoad = (photoId: string) => {
    setLoadedImages(prev => new Set(prev).add(photoId));
  };

  // Fetch photos when component mounts
  useEffect(() => {
    const fetchPhotos = async () => {
      setIsLoading(true);
      try {
        console.log('[CoverPhotoChanger] Fetching photos for project:', project.id);
        const response = await photoService.getProjectPhotos(project.id);
        
        // Map backend photos to frontend Photo type with variant URLs
        const mappedPhotos = response.photos.map((photo: any) => ({
          id: String(photo.id),
          src: getPhotoVariantUrl(photo.id, 'medium'), // Use medium quality for gallery grid
          alt: photo.original_filename || photo.alt,
          width: photo.width || 800,
          height: photo.height || 1200,
          comments: []
        }));
        
        setPhotos(mappedPhotos);
        console.log('[CoverPhotoChanger] Loaded', mappedPhotos.length, 'photos');
        
        // Find the currently selected photo ID if coverPhotoSrc matches
        const currentCoverPhoto = mappedPhotos.find(p => p.src === project.coverPhotoSrc);
        if (currentCoverPhoto) {
          setSelectedPhotoId(currentCoverPhoto.id);
        }
      } catch (error) {
        console.error('[CoverPhotoChanger] Failed to fetch photos:', error);
        toast.error('Failed to load photos');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchPhotos();
  }, [project.id, project.coverPhotoSrc]);

  const handleSave = async () => {
    if (!selectedPhotoId) {
      toast.error('Please select a photo');
      return;
    }
    
    setIsSaving(true);
    try {
      // Save to backend
      console.log('[CoverPhotoChanger] Setting cover photo:', selectedPhotoId);
      await projectService.setCoverPhoto(project.id, selectedPhotoId);
      console.log('[CoverPhotoChanger] Cover photo updated successfully');
      
      // Update frontend
      onUpdateCover(selectedPhotoSrc);
      toast.success('Cover photo updated');
      onClose();
    } catch (error) {
      console.error('[CoverPhotoChanger] Failed to update cover photo:', error);
      toast.error('Failed to update cover photo');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePhotoSelect = (photo: Photo) => {
    setSelectedPhotoSrc(photo.src);
    setSelectedPhotoId(photo.id);
  };
  
  // Pagination calculations
  const totalPages = Math.ceil(photos.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentPagePhotos = photos.slice(startIndex, endIndex);

  // Generate page numbers to display (show 5 at a time)
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
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

  return (
    <>
      <style>{shimmerStyles}</style>
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
          {isLoading ? (
            <div className="text-center py-12 text-gray-500">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p>Loading photos...</p>
            </div>
          ) : photos.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p>No photos available in this project.</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4 mb-6">
                {currentPagePhotos.map((photo) => {
                  const isSelected = selectedPhotoSrc === photo.src;

                  return (
                    <button
                      key={photo.id}
                      onClick={() => handlePhotoSelect(photo)}
                      className={`relative aspect-square rounded-lg overflow-hidden group hover:ring-2 hover:ring-blue-400 transition-all ${
                        isSelected ? 'ring-2 ring-blue-500' : 'ring-1 ring-gray-200'
                      }`}
                      title={photo.alt}
                    >
                      {/* Skeleton background with shimmer */}
                      <div className={`absolute inset-0 bg-gray-200 transition-opacity duration-300 ${
                        loadedImages.has(photo.id) ? 'opacity-0' : 'opacity-100'
                      }`}>
                        <div className="absolute inset-0 overflow-hidden">
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer" />
                        </div>
                      </div>
                      
                      {/* Actual image */}
                      <img
                        src={photo.src}
                        alt={photo.alt}
                        className={`w-full h-full object-cover transition-opacity duration-300 ${
                          loadedImages.has(photo.id) ? 'opacity-100' : 'opacity-0'
                        }`}
                        onLoad={() => handleImageLoad(photo.id)}
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

              {/* Pagination Controls - Only show if more than 1 page */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-4 border-t border-gray-200">
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
                          className={`min-w-[40px] h-10 px-3 rounded-md font-medium transition-colors ${
                            isCurrentPage
                              ? 'bg-primary text-white'
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
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t bg-gray-50 flex items-center justify-between">
          <p className="text-sm text-gray-600">
            {photos.length > 0 ? (
              <>Showing {startIndex + 1}-{Math.min(endIndex, photos.length)} of {photos.length} {photos.length === 1 ? 'photo' : 'photos'}</>
            ) : (
              <>No photos</>
            )}
          </p>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-md font-medium transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!selectedPhotoSrc || isSaving || isLoading}
              className="px-4 py-2 bg-primary text-white rounded-md font-medium hover:bg-primary-hover disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {isSaving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Saving...
                </>
              ) : (
                'Save Cover Photo'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
    </>
  );
};

export default CoverPhotoChanger;
