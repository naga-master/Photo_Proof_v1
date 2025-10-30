import React from 'react';
import type { Album } from '../types';
import { ArrowRightIcon } from './icons';

interface CoverPageProps {
  album: Album;
  onOpenGallery: () => void;
}

const CoverPage: React.FC<CoverPageProps> = ({ album, onOpenGallery }) => {
  if (!album) {
    return (
        <div className="relative h-screen w-full flex items-center justify-center text-white overflow-hidden">
            <div className="absolute inset-0 bg-gray-800 z-0"></div>
            <div className="relative z-20 text-center animate-fade-in p-4">
                <h1 className="font-serif text-5xl md:text-7xl tracking-wider">
                    No Album Found
                </h1>
                <p className="mt-4 text-lg md:text-xl text-gray-300 tracking-wide">
                    Please contact the studio.
                </p>
            </div>
        </div>
    );
  }

  return (
    <div className="relative h-screen w-full flex items-center justify-center text-white overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center z-0 transition-transform duration-500 transform scale-105"
        style={{ backgroundImage: `url(${album.coverPhotoSrc})` }}
      ></div>
      <div className="absolute inset-0 bg-black bg-opacity-40 z-10"></div>
      
      <div className="relative z-20 text-center animate-fade-in p-4">
        <h1 className="font-serif text-5xl md:text-7xl tracking-wider">
          {album.title}
        </h1>
        <p className="mt-4 text-lg md:text-xl text-gray-200 tracking-wide">
          {album.photoCount} Photos {album.shootDate && `| ${album.shootDate}`}
        </p>
        <button
          onClick={onOpenGallery}
          className="mt-8 inline-flex items-center gap-3 px-8 py-4 border-2 border-white text-lg font-semibold uppercase tracking-widest hover:bg-white hover:text-black transition-colors duration-300"
        >
          Open Gallery
          <ArrowRightIcon className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
};

export default CoverPage;
