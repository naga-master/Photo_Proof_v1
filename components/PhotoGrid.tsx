
import React from 'react';
import type { Photo } from '../types';
import PhotoItem from './PhotoItem';

interface PhotoGridProps {
  photos: Photo[];
  onImageClick: (index: number) => void;
  favorites?: number[];
  selections?: number[];
  toggleFavorite?: (photoId: number) => void;
  toggleSelection?: (photoId: number) => void;
  onDownload?: (photoSrc: string, photoAlt: string) => void;
  compareList?: Photo[];
  isCompareMode?: boolean;
  isSelectable?: boolean;
}

const PhotoGrid: React.FC<PhotoGridProps> = ({ 
    photos, 
    onImageClick, 
    favorites = [], 
    selections = [], 
    toggleFavorite = () => {}, 
    toggleSelection = () => {},
    onDownload = () => {},
    compareList = [],
    isCompareMode = false,
    isSelectable = false,
}) => {
  return (
    <div className="columns-2 sm:columns-2 md:columns-3 lg:columns-4 xl:columns-5 gap-4 space-y-4">
      {photos.map((photo, index) => (
        <PhotoItem
          key={photo.id}
          photo={photo}
          onClick={() => onImageClick(index)}
          isFavorite={favorites.includes(photo.id)}
          isSelection={selections.includes(photo.id)}
          toggleFavorite={toggleFavorite}
          toggleSelection={toggleSelection}
          onDownload={onDownload}
          isInCompareList={compareList.some(p => p.id === photo.id)}
          isCompareMode={isCompareMode}
          isSelectable={isSelectable}
        />
      ))}
    </div>
  );
};

export default PhotoGrid;
