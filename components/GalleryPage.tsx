import React, { useState, useMemo } from 'react';
import type { Album, Photo } from '../types';
import Lightbox from './Lightbox';
import CompareModal from './store/CompareModal';
import LayoutRenderer from './layouts/LayoutRenderer';

interface GalleryPageProps {
  album: Album;
  onBack: () => void;
  favorites: number[];
  selections: number[];
  toggleFavorite: (photoId: number) => void;
  toggleSelection: (photoId: number) => void;
  onAddComment: (photoId: number, commentText: string, parentId?: number) => void;
  onNavigateToStore: () => void;
  isStudioPreview?: boolean;
}

const GalleryPage: React.FC<GalleryPageProps> = (props) => {
  const { album, favorites, selections } = props;
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [isSlideshowActive, setSlideshowActive] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'favorites' | 'selections'>('all');
  const [compareList, setCompareList] = useState<Photo[]>([]);
  const [isCompareMode, setCompareMode] = useState(false);
  const [isCompareModalOpen, setCompareModalOpen] = useState(false);

  const filteredPhotos = useMemo(() => {
    switch (activeFilter) {
      case 'favorites':
        return album.photos.filter(p => favorites.includes(p.id));
      case 'selections':
        return album.photos.filter(p => selections.includes(p.id));
      default:
        return album.photos;
    }
  }, [album.photos, activeFilter, favorites, selections]);

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

  return (
    <div className="bg-white min-h-screen">
      <LayoutRenderer
        {...props}
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