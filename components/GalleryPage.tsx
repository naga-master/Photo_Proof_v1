import React, { useState, useMemo, useEffect } from 'react';
import { toast } from 'react-toastify';
import type { Album, Photo, UserRole } from '../types';
import Lightbox from './Lightbox';
import CompareModal from './store/CompareModal';
import LayoutRenderer from './layouts/LayoutRenderer';

interface GalleryPageProps {
  album: Album;
  photos: Photo[];
  title: string;
  onBack: () => void;
  favorites: string[];
  selections: string[];
  toggleFavorite: (photoId: string) => void;
  toggleSelection: (photoId: string) => void;
  onAddComment: (photoId: string, commentText: string, parentId?: number) => void | Promise<void>;
  onLoadComments: (photoId: string) => Promise<void>;
  onNavigateToStore: () => void;
  isStudioPreview?: boolean;
  userRole?: UserRole;
  onRefresh?: () => void; // Optional callback to refresh photos
}

const GalleryPage: React.FC<GalleryPageProps> = (props) => {
  const { photos, favorites, selections, title, userRole, onRefresh } = props;
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [isSlideshowActive, setSlideshowActive] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'favorites' | 'selections'>('all');
  const [compareList, setCompareList] = useState<Photo[]>([]);
  const [isCompareMode, setCompareMode] = useState(false);
  const [isCompareModalOpen, setCompareModalOpen] = useState(false);

  // Count photos with processing errors
  const processingIssuesCount = useMemo(() => {
    return photos.filter(p => p.processing_error).length;
  }, [photos]);

  // Count photos currently processing
  const processingCount = useMemo(() => {
    return photos.filter(p => p.status === 'processing').length;
  }, [photos]);

  // Auto-refresh when photos are processing
  useEffect(() => {
    if (processingCount > 0 && onRefresh) {
      const interval = setInterval(() => {
        console.log('[GalleryPage] Auto-refreshing for processing photos...');
        onRefresh();
      }, 5000); // Refresh every 5 seconds

      return () => clearInterval(interval);
    }
  }, [processingCount, onRefresh]);

  const filteredPhotos = useMemo(() => {
    switch (activeFilter) {
      case 'favorites':
        return photos.filter(p => favorites.includes(p.id));
      case 'selections':
        return photos.filter(p => selections.includes(p.id));
      default:
        return photos;
    }
  }, [photos, activeFilter, favorites, selections]);

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setSlideshowActive(false);
  };

  const closeLightbox = () => {
    setLightboxIndex(null);
    setSlideshowActive(false);
  };
  
  const handleNext = () => {
    if (lightboxIndex !== null) {
      setLightboxIndex((lightboxIndex + 1) % filteredPhotos.length);
    }
  };

  const handlePrev = () => {
    if (lightboxIndex !== null) {
      setLightboxIndex((lightboxIndex - 1 + filteredPhotos.length) % filteredPhotos.length);
    }
  };
  
  const handleDownload = async (photoSrc: string, photoAlt: string) => {
      const { handlePhotoDownload } = await import('../utils/downloadHelper');
      await handlePhotoDownload(photoSrc, photoAlt, (message, type) => {
          if (type === 'success') {
              toast.success(message);
          } else {
              toast.error(message);
          }
      });
  };

  const toggleCompare = (photo: Photo) => {
    setCompareList(prev => {
        if (prev.some(p => p.id === photo.id)) {
            return prev.filter(p => p.id !== photo.id);
        }
        if (prev.length < 4) {
            return [...prev, photo];
        }
        toast.warn("You can only compare up to 4 photos at a time.");
        return prev;
    });
  };

  return (
    <div className="bg-white min-h-screen">
      {/* Processing Issues Banner */}
      {processingIssuesCount > 0 && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mx-4 mt-4 rounded-lg shadow-sm">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm font-medium text-red-800">
                {processingIssuesCount} photo{processingIssuesCount > 1 ? 's' : ''} failed processing
              </p>
              <p className="mt-1 text-sm text-red-700">
                Photos are still visible but quality variants may be missing. Contact studio support or try re-uploading.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Processing Status Info */}
      {processingCount > 0 && (
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mx-4 mt-4 rounded-lg shadow-sm">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="animate-spin h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-blue-800">
                {processingCount} photo{processingCount > 1 ? 's are' : ' is'} being processed...
              </p>
              <p className="mt-1 text-sm text-blue-700">
                Quality variants are being generated. Photos will automatically update when ready.
              </p>
            </div>
          </div>
        </div>
      )}

      <LayoutRenderer
        {...props}
        title={title}
        photos={filteredPhotos}
        openLightbox={openLightbox}
        isCompareMode={isCompareMode}
        setCompareMode={setCompareMode}
        compareList={compareList}
        setCompareList={setCompareList}
        setCompareModalOpen={setCompareModalOpen}
        activeFilter={activeFilter}
        setActiveFilter={setActiveFilter}
        onDownload={handleDownload}
        toggleCompare={toggleCompare}
        isStudioPreview={false}
      />

      {lightboxIndex !== null && (
        <Lightbox
          photos={filteredPhotos}
          currentIndex={lightboxIndex}
          onClose={closeLightbox}
          onNext={handleNext}
          onPrev={handlePrev}
          onAddComment={props.onAddComment}
          onLoadComments={props.onLoadComments}
          isSlideshowActive={isSlideshowActive}
          setSlideshowActive={setSlideshowActive}
          favorites={favorites}
          selections={selections}
          toggleFavorite={props.toggleFavorite}
          toggleSelection={props.toggleSelection}
          onDownload={handleDownload}
          isStudioPreview={false}
        />
      )}
      
      <CompareModal 
        isOpen={isCompareModalOpen}
        onClose={() => setCompareModalOpen(false)}
        compareList={compareList}
        onRemoveFromCompare={(photoId) => setCompareList(prev => prev.filter(p => p.id !== photoId))}
        onNavigateToStore={props.onNavigateToStore}
      />
    </div>
  );
};

export default GalleryPage;