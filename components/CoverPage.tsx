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
        <div className="relative h-screen w-full flex items-center justify-center text-white overflow-hidden bg-slate-900">
            <div className="relative z-20 text-center animate-fade-in p-4">
                <h1 className="font-serif text-5xl md:text-7xl tracking-wider">
                    No Album Found
                </h1>
                <p className="mt-4 text-lg md:text-xl text-slate-300 tracking-wide">
                    Please contact the studio.
                </p>
            </div>
        </div>
    );
  }

  return (
    <div className="relative h-screen w-full flex items-center justify-center text-white overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center z-0 animate-ken-burns"
        style={{ backgroundImage: `url(${album.coverPhotoSrc})` }}
      ></div>
      <div className="absolute inset-0 bg-black/50 z-10"></div>
      
      <div className="relative z-20 text-center animate-fade-in p-4">
        <h1 className="font-serif text-5xl md:text-7xl font-semibold tracking-wider text-shadow-lg">
          {album.title}
        </h1>
        <p className="mt-4 text-lg md:text-xl text-slate-200 tracking-wide">
          {album.photoCount} Photos {album.shootDate && `| ${album.shootDate}`}
        </p>
        <button
          onClick={onOpenGallery}
          className="mt-8 inline-flex items-center gap-3 px-8 py-3 bg-white text-slate-900 text-base font-semibold uppercase tracking-widest hover:bg-slate-200 transition-all duration-300 rounded shadow-lg transform hover:scale-105"
        >
          View Gallery
          <ArrowRightIcon className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default CoverPage;