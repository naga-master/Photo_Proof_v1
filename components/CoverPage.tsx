
import React from 'react';
import type { Album } from '../types';

interface CoverPageProps {
  onOpenGallery: () => void;
  album?: Album;
}

const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    // Add a day to counteract potential timezone issues with YYYY-MM-DD parsing
    date.setUTCDate(date.getUTCDate() + 1);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
}

const CoverPage: React.FC<CoverPageProps> = ({ onOpenGallery, album }) => {
  const bgImage = album?.coverPhotoSrc || "https://images.unsplash.com/photo-1444011283387-7b0221634c9f?q=80&w=1920&auto=format&fit=crop";
  const title = album?.title || "Mr. & Mrs. Scobey";
  const date = album?.shootDate ? formatDate(album.shootDate) : "October 10, 2020";

  return (
    <div className="relative h-screen w-full flex items-center justify-center text-white overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center z-0 transition-all duration-1000"
        style={{ backgroundImage: `url('${bgImage}')` }}
      ></div>
      <div className="absolute inset-0 bg-black bg-opacity-40 z-10"></div>
      
      <div className="relative z-20 text-center animate-fade-in-slow">
        <h1 className="font-serif text-5xl md:text-7xl lg:text-8xl tracking-widest uppercase">
          {title}
        </h1>
        <p className="mt-4 text-lg md:text-xl tracking-[0.2em] uppercase">
          {date}
        </p>
        <button
          onClick={onOpenGallery}
          className="mt-12 px-8 py-3 bg-transparent border border-white text-white uppercase tracking-widest text-sm hover:bg-white hover:text-black transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50"
        >
          Open Gallery
        </button>
      </div>
    </div>
  );
};

export default CoverPage;