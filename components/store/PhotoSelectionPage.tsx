
import React, { useState } from 'react';
import type { Album, Photo } from '../../types';
import PhotoGrid from '../PhotoGrid';
import { ArrowLeftIcon } from '../icons';

interface PhotoSelectionPageProps {
  albums: Album[];
  onPhotosSelect: (photos: Photo[]) => void;
  onBack: () => void;
  productName: string;
}

const PhotoSelectionPage: React.FC<PhotoSelectionPageProps> = ({ albums, onPhotosSelect, onBack, productName }) => {
  const allPhotos = albums.flatMap(album => album.photos);
  const [selectedPhotos, setSelectedPhotos] = useState<Photo[]>([]);

  const togglePhotoSelection = (photo: Photo) => {
    setSelectedPhotos(prev => 
      prev.find(p => p.id === photo.id) 
        ? prev.filter(p => p.id !== photo.id) 
        : [...prev, photo]
    );
  };

  return (
    <div className="bg-white min-h-screen pb-24">
      <header className="sticky top-16 z-30 bg-white/90 backdrop-blur-md border-b">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center gap-4">
           <button onClick={onBack} className="p-2 rounded-full hover:bg-gray-100">
              <ArrowLeftIcon className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl font-semibold text-gray-800">Select Photos</h1>
              <p className="text-sm text-gray-500">Choose one or more images for your {productName}</p>
            </div>
        </div>
      </header>
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <PhotoGrid 
          photos={allPhotos} 
          onImageClick={(index) => togglePhotoSelection(allPhotos[index])} 
          selections={selectedPhotos.map(p => p.id)}
          isSelectable={true}
        />
      </main>
      {selectedPhotos.length > 0 && (
        <footer className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t p-4 z-30 animate-slide-up">
            <div className="container mx-auto flex justify-between items-center">
                <p className="font-semibold">{selectedPhotos.length} photo{selectedPhotos.length > 1 ? 's' : ''} selected</p>
                <button onClick={() => onPhotosSelect(selectedPhotos)} className="px-6 py-2 bg-gray-800 text-white font-semibold rounded-md hover:bg-gray-700">
                    Continue
                </button>
            </div>
        </footer>
      )}
    </div>
  );
};

export default PhotoSelectionPage;
