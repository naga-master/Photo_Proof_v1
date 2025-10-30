import React from 'react';
import { LayoutComponentProps } from '../LayoutRenderer';
import PhotoGrid from '../../PhotoGrid';
import GalleryControls from './GalleryControls';

const Layout1: React.FC<LayoutComponentProps> = (props) => {
    const { album, photos, openLightbox, ...rest } = props;
    
    return (
        <div className="bg-white text-gray-800">
            {/* Cover Header */}
            <div className="h-[60vh] flex items-center justify-center text-white bg-cover bg-center" style={{ backgroundImage: `url(${album.coverPhotoSrc})`}}>
                <div className="text-center bg-black/30 p-8 rounded">
                    <h1 className="text-5xl font-serif">{album.title}</h1>
                    <p className="text-lg mt-2">{album.photoCount} photos</p>
                </div>
            </div>

            {/* Controls */}
            <header className="sticky top-16 z-30 bg-white/80 backdrop-blur-sm border-b">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div/>
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
                <PhotoGrid photos={photos} onImageClick={openLightbox} {...rest} />
            </main>
        </div>
    );
};

export default Layout1;