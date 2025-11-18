import React from 'react';
import { LayoutComponentProps } from '../LayoutRenderer';
import PhotoGrid from '../../PhotoGrid';
import GalleryControls from './GalleryControls';

const Layout3: React.FC<LayoutComponentProps> = (props) => {
    const { photos, title, openLightbox, isStudioPreview, ...rest } = props;
    
    return (
        <div className="bg-gray-100 text-gray-800">
            {/* Controls */}
            <header className="sticky top-16 z-30 bg-white/80 backdrop-blur-sm border-b">
                 <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-semibold">{title}</h1>
                        <p className="text-sm text-gray-500">{photos.length} photos</p>
                    </div>
                    <GalleryControls 
                        favoritesCount={rest.favorites.length}
                        selectionsCount={rest.selections.length}
                        theme="light"
                        {...rest}
                    />
                </div>
            </header>

            {/* Photo Grid */}
            <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <PhotoGrid 
                    photos={photos} 
                    onImageClick={openLightbox}
                    favorites={rest.favorites}
                    selections={rest.selections}
                    toggleFavorite={rest.toggleFavorite}
                    toggleSelection={rest.toggleSelection}
                    onDownload={rest.onDownload}
                    compareList={rest.compareList}
                    isCompareMode={rest.isCompareMode}
                    toggleCompare={rest.toggleCompare}
                    isStudioPreview={isStudioPreview}
                />
            </main>
        </div>
    );
};

export default Layout3;