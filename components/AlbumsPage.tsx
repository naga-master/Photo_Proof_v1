import React from 'react';
import type { Album } from '../types';
import { LockClosedIcon } from './icons';
import { AuthenticatedImage } from './common/AuthenticatedImage';
import { ImagePlaceholder } from './common/ImagePlaceholder';

interface AlbumsPageProps {
  albums: Album[];
  onSelectAlbum: (album: Album) => void;
}

const AlbumsPage: React.FC<AlbumsPageProps> = ({ albums, onSelectAlbum }) => {
  console.log('[AlbumsPage] Rendering with albums:', albums.map(a => ({
    id: a.id,
    title: a.title,
    coverPhotoSrc: a.coverPhotoSrc,
    isPlaceholder: a.coverPhotoSrc?.includes('placeholder')
  })));
  
  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <header className="text-center mb-12">
          <h1 className="text-4xl font-serif tracking-wider text-gray-800">Photo Galleries</h1>
          <p className="mt-2 text-lg text-gray-500">A collection of moments from our special day.</p>
        </header>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {albums.map((album) => {
            console.log(`[AlbumsPage] Rendering album ${album.id}:`, {
              title: album.title,
              coverPhotoSrc: album.coverPhotoSrc
            });
            return (
            <div
              key={album.id}
              onClick={() => onSelectAlbum(album)}
              className="group relative cursor-pointer overflow-hidden rounded-lg shadow-lg transform hover:scale-105 transition-transform duration-300"
            >
              {album.coverPhotoId ? (
                <AuthenticatedImage
                  photoId={album.coverPhotoId}
                  quality="medium"
                  alt={`Cover for ${album.title}`}
                  className="w-full aspect-[16/9] object-cover transition-transform duration-300 group-hover:scale-110"
                  aspectRatio="16/9"
                  colorVariant="auto"
                />
              ) : (
                <ImagePlaceholder
                  title={album.title}
                  subtitle={`${album.photoCount} photos`}
                  aspectRatio="16/9"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
              <div className="absolute bottom-0 left-0 p-6 text-white w-full">
                {album.isLocked && (
                  <div className="absolute top-4 right-4 bg-black/50 p-2 rounded-full">
                    <LockClosedIcon className="w-5 h-5" />
                  </div>
                )}
                <h2 className="text-2xl font-semibold tracking-wide">{album.title}</h2>
                <p className="text-sm opacity-90 mt-1">{album.photoCount} photos</p>
              </div>
            </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default AlbumsPage;
