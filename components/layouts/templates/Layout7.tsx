

import React from 'react';
import { LayoutComponentProps } from '../LayoutRenderer';
import PhotoItem from '../../PhotoItem';
import GalleryControls from './GalleryControls';

const Layout7: React.FC<LayoutComponentProps> = (props) => {
    const { photos, title, openLightbox, ...rest } = props;
    const { toggleCompare = () => {} } = rest;
    
    return (
        <div className="bg-black text-white">
            {/* Controls */}
            <header className="sticky top-16 z-30 bg-black/80 backdrop-blur-sm border-b border-gray-700">
                 <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-semibold">{title}</h1>
                        <p className="text-sm text-gray-400">{photos.length} photos</p>
                    </div>
                    <GalleryControls 
                        favoritesCount={rest.favorites.length}
                        selectionsCount={rest.selections.length}
                        theme="dark"
                        {...rest}
                    />
                </div>
            </header>

            {/* Photo Grid */}
            <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
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

export default Layout7;