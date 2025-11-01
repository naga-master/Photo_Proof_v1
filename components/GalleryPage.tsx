import React, { useState, useMemo } from 'react';
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
  onAddComment: (photoId: string, commentText: string, parentId?: number) => void;
  onNavigateToStore: () => void;
  isStudioPreview?: boolean;
  userRole?: UserRole;
}

const GalleryPage: React.FC<GalleryPageProps> = (props) => {
  const { photos, favorites, selections, title, userRole } = props;
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [isSlideshowActive, setSlideshowActive] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'favorites' | 'selections'>('all');
  const [compareList, setCompareList] = useState<Photo[]>([]);
  const [isCompareMode, setCompareMode] = useState(false);
  const [isCompareModalOpen, setCompareModalOpen] = useState(false);

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
  
  const handleDownload = (photoSrc: string, photoAlt: string) => {
      const link = document.createElement('a');
      link.href = photoSrc;
      link.download = photoAlt.replace(/\s+/g, '-') + '.jpg';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
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
      />

      {lightboxIndex !== null && (
        <Lightbox
          photos={filteredPhotos}
          currentIndex={lightboxIndex}
          onClose={closeLightbox}
          onNext={handleNext}
          onPrev={handlePrev}
          onAddComment={props.onAddComment}
          isSlideshowActive={isSlideshowActive}
          setSlideshowActive={setSlideshowActive}
          favorites={favorites}
          selections={selections}
          toggleFavorite={props.toggleFavorite}
          toggleSelection={props.toggleSelection}
          onDownload={handleDownload}
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