import React, { useState, useMemo } from 'react';
import type { Album, Photo } from '../types';
import PhotoGrid from './PhotoGrid';
import Lightbox from './Lightbox';
import { ArrowLeftIcon, HeartIcon, CheckIcon, CompareIcon } from './icons';
import CompareModal from './store/CompareModal';

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

type Filter = 'all' | 'favorites' | 'selections';

const GalleryPage: React.FC<GalleryPageProps> = ({ 
  album, 
  onBack, 
  favorites, 
  selections, 
  toggleFavorite, 
  toggleSelection,
  onAddComment,
  onNavigateToStore,
  isStudioPreview = false,
}) => {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [isSlideshowActive, setSlideshowActive] = useState(false);
  const [activeFilter, setActiveFilter] = useState<Filter>('all');
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

  const toggleCompare = (photo: Photo) => {
    if (compareList.some(p => p.id === photo.id)) {
      setCompareList(prev => prev.filter(p => p.id !== photo.id));
    } else {
      if (compareList.length < 4) { // Limit comparison to 4 images
        setCompareList(prev => [...prev, photo]);
      }
    }
  }

  const handleImageClick = (index: number) => {
    const photo = filteredPhotos[index];
    if (isCompareMode) {
      toggleCompare(photo);
    } else {
      openLightbox(index);
    }
  };


  return (
    <div className="bg-white min-h-screen">
      <header className={`sticky z-30 bg-white border-b ${isStudioPreview ? 'top-0' : 'top-16'}`}>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-4">
            {isStudioPreview && (
                <button onClick={onBack} className="p-2 rounded-full hover:bg-gray-100 flex-shrink-0">
                    <ArrowLeftIcon className="w-5 h-5 text-gray-700" />
                </button>
            )}
            <div>
              <h1 className="text-xl font-semibold text-gray-800">{album.title}</h1>
              <p className="text-sm text-gray-500">{album.photoCount} photos</p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="flex items-center rounded-md border p-0.5 bg-gray-100 text-sm text-gray-600">
              <button onClick={() => setActiveFilter('all')} className={`px-3 py-1.5 rounded transition-colors ${activeFilter === 'all' ? 'bg-white shadow-sm text-gray-900' : 'hover:bg-gray-200'}`}>All</button>
              <button onClick={() => setActiveFilter('favorites')} className={`px-3 py-1.5 rounded transition-colors ${activeFilter === 'favorites' ? 'bg-white shadow-sm text-gray-900' : 'hover:bg-gray-200'} flex items-center gap-1.5`}>
                <HeartIcon className="w-4 h-4" /> Favorites ({favorites.length})
              </button>
              <button onClick={() => setActiveFilter('selections')} className={`px-3 py-1.5 rounded transition-colors ${activeFilter === 'selections' ? 'bg-white shadow-sm text-gray-900' : 'hover:bg-gray-200'} flex items-center gap-1.5`}>
                 <CheckIcon className="w-4 h-4" /> Selections ({selections.length})
              </button>
            </div>
            <button 
              onClick={() => setCompareMode(!isCompareMode)} 
              className={`p-2.5 rounded-md flex items-center gap-2 border transition-colors ${isCompareMode ? 'bg-blue-50 border-blue-200 text-blue-700' : 'text-gray-800 hover:bg-gray-100 border-gray-300'}`}
            >
              <CompareIcon className="w-5 h-5"/>
            </button>
          </div>
        </div>
        {isCompareMode && (
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-2 text-sm text-center bg-blue-50 text-blue-800 border-t">
            {compareList.length > 0 ? 
              `Selected ${compareList.length} photos for comparison. ` : 
              'Select up to 4 photos to compare side-by-side. '}
            {compareList.length > 1 && (
              <button onClick={() => setCompareModalOpen(true)} className="font-semibold underline ml-2">Compare Now</button>
            )}
          </div>
        )}
      </header>
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {filteredPhotos.length > 0 ? (
          <PhotoGrid 
            photos={filteredPhotos} 
            onImageClick={handleImageClick}
            favorites={favorites}
            selections={selections}
            toggleFavorite={toggleFavorite}
            toggleSelection={toggleSelection}
            onDownload={handleDownload}
            compareList={compareList}
            isCompareMode={isCompareMode}
          />
        ) : (
          <div className="text-center py-20">
              <h2 className="text-xl font-medium text-gray-800">No photos found</h2>
              <p className="mt-2 text-gray-500">There are no photos in this filter.</p>
          </div>
        )}
      </main>

      {lightboxIndex !== null && (
        <Lightbox
          photos={filteredPhotos}
          currentIndex={lightboxIndex}
          onClose={closeLightbox}
          onNext={handleNext}
          onPrev={handlePrev}
          onAddComment={onAddComment}
          isSlideshowActive={isSlideshowActive}
          setSlideshowActive={setSlideshowActive}
          favorites={favorites}
          selections={selections}
          toggleFavorite={toggleFavorite}
          toggleSelection={toggleSelection}
          onDownload={handleDownload}
        />
      )}
      
      <CompareModal 
        isOpen={isCompareModalOpen}
        onClose={() => setCompareModalOpen(false)}
        compareList={compareList}
        onRemoveFromCompare={(photoId) => setCompareList(prev => prev.filter(p => p.id !== photoId))}
        onNavigateToStore={onNavigateToStore}
      />
    </div>
  );
};

export default GalleryPage;