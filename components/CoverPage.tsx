
import React from 'react';

interface CoverPageProps {
  onOpenGallery: () => void;
}

const CoverPage: React.FC<CoverPageProps> = ({ onOpenGallery }) => {
  return (
    <div className="relative h-screen w-full flex items-center justify-center text-white overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center z-0"
        style={{ backgroundImage: "url('https://picsum.photos/1920/1080?grayscale&blur=2')" }}
      ></div>
      <div className="absolute inset-0 bg-black bg-opacity-40 z-10"></div>
      
      <div className="relative z-20 text-center animate-fade-in-slow">
        <h1 className="font-serif text-5xl md:text-7xl lg:text-8xl tracking-widest uppercase">
          Mr. & Mrs. Scobey
        </h1>
        <p className="mt-4 text-lg md:text-xl tracking-[0.2em] uppercase">
          October 10, 2020
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
