

import React from 'react';
import { LayoutComponentProps } from '../LayoutRenderer';
import PhotoItem from '../../PhotoItem';
import GalleryControls from './GalleryControls';

const Layout8: React.FC<LayoutComponentProps> = (props) => {
    const { album, photos, openLightbox, ...rest } = props;
    const { toggleCompare = () => {} } = rest;
    
    return (
        <div className="bg-black text-white">
            {/* Cover Header */}
            <div className="h-[70vh] flex items-center justify-center text-white bg-cover bg-center" style={{ backgroundImage: `url(${album.coverPhotoSrc})`}}>
                <div className="text-center bg-black/30 p-8 rounded">
                    <h1 className="text-5xl font-serif">{album.title}</h1>
                    <p className="text-lg mt-2">{album.photoCount} photos</p>
                </div>
            </div>

            {/* Controls */}
            <header className="sticky top-16 z-30 bg-black/80 backdrop-blur-sm border-b border-gray-700">
                 <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div />
                    <GalleryControls 
                        favoritesCount={rest.favorites.length}
                        selectionsCount={rest.selections.length}
                        theme="dark"
                        {...rest}
                    />
                </div>
            </header>

            {/* Photo Grid */}
            <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-4xl">
                 <div className="flex flex-col gap-8">
                    {photos.map((photo, index) => (
                        <PhotoItem
                            key={photo.id}
                            photo={photo}
                            onClick={rest.isCompareMode ? () => toggleCompare(photo) : () => openLightbox(index)}
                            isFavorite={rest.favorites.includes(photo.id)}
                            isSelection={rest.selections.includes(photo.id)}
                            isInCompareList={rest.compareList.some(p => p.id === photo.id)}
                            toggleFavorite={rest.toggleFavorite}
                            toggleSelection={rest.toggleSelection}
                            onDownload={rest.onDownload}
                            isCompareMode={rest.isCompareMode}
                        />
                    ))}
                </div>
            </main>
        </div>
    );
};

export default Layout8;