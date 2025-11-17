import React from 'react';
import type { Album, Folder } from '../types';
import { ArrowLeftIcon } from './icons';
import { AuthenticatedImage } from './common/AuthenticatedImage';
import { ImagePlaceholder } from './common/ImagePlaceholder';

interface GalleryFoldersPageProps {
  album: Album;
  onSelectFolder: (folder: Folder) => void;
  onBackToAlbums: () => void;
}

const GalleryFoldersPage: React.FC<GalleryFoldersPageProps> = ({ album, onSelectFolder, onBackToAlbums }) => {
  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <header className="text-center mb-12">
          <h1 className="text-4xl font-serif tracking-wider text-gray-800">{album.title}</h1>
          <p className="mt-2 text-lg text-gray-500">Select a folder to view photos.</p>
        </header>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {album.folders?.map((folder) => (
            <div
              key={folder.id}
              onClick={() => onSelectFolder(folder)}
              className="group relative cursor-pointer overflow-hidden rounded-lg shadow-lg transform hover:scale-105 transition-transform duration-300"
            >
              {folder.coverPhotoId ? (
                <AuthenticatedImage
                  photoId={folder.coverPhotoId}
                  quality="medium"
                  alt={`Cover for ${folder.name}`}
                  className="w-full aspect-[16/9] object-cover transition-transform duration-300 group-hover:scale-110"
                  aspectRatio="16/9"
                  colorVariant="auto"
                />
              ) : (
                <ImagePlaceholder
                  title={folder.name}
                  subtitle={`${folder.photoCount} photos`}
                  aspectRatio="16/9"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
              <div className="absolute bottom-0 left-0 p-6 text-white w-full">
                <h2 className="text-2xl font-semibold tracking-wide">{folder.name}</h2>
                <p className="text-sm opacity-90 mt-1">{folder.photoCount} photos</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default GalleryFoldersPage;